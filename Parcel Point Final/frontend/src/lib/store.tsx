import { createContext, useContext, useReducer, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { Claim, Notice, Pkg, Role, Slot } from '../types';
import { initialClaims, initialNotices, initialPackages, recipients, slots } from '../data/officialData';
import { nowIso } from './format';
import { api } from './api';

export type PageKey = 'dashboard' | 'receive' | 'packages' | 'tracking' | 'storage' | 'recipients' | 'claims' | 'notifications' | 'reports' | 'settings' | 'portal';
export interface Toast { id: number; tone: 'success' | 'error' | 'info'; text: string }
interface State { packages: Pkg[]; claims: Claim[]; notices: Notice[] }
type Action =
  | { t: 'hydrate'; packages: Pkg[]; claims: Claim[]; notices: Notice[] }
  | { t: 'receive'; pkg: Pkg; notice?: Notice }
  | { t: 'assign'; id: string; slotId: string; by: string; note: string }
  | { t: 'unassign'; id: string; by: string; note: string }
  | { t: 'claim'; claim: Claim }
  | { t: 'read'; id?: string }
  | { t: 'remind'; notice: Notice };

function reducer(s: State, a: Action): State {
  const at = nowIso();
  switch (a.t) {
    case 'hydrate': return { packages: a.packages, claims: a.claims, notices: a.notices };
    case 'receive': return { ...s, packages: [a.pkg, ...s.packages], notices: a.notice ? [a.notice, ...s.notices] : s.notices };
    case 'assign': return { ...s, packages: s.packages.map(p => p.id !== a.id ? p : { ...p, slotId: a.slotId, status: 'ready', assignedAt: at, assignedBy: a.by,
      events: [...p.events, { title: p.slotId ? 'Transferred to new slot' : 'Storage assigned', at, by: a.by, note: a.note }] }) };
    case 'unassign': return { ...s, packages: s.packages.map(p => p.id !== a.id ? p : { ...p, slotId: null, status: 'unassigned',
      events: [...p.events, { title: 'Flagged awaiting assignment', at, by: 'Elena Ruiz', note: a.note }] }) };
    case 'claim': return { ...s, claims: [a.claim, ...s.claims], packages: s.packages.map(p => p.id !== a.claim.packageId ? p : { ...p, status: 'claimed', slotId: null,
      events: [...p.events, { title: 'Claimed', at, by: a.claim.verifier, note: `Verified handoff. Receipt ${a.claim.receipt} issued; slot released.`, tone: 'teal' as const }] }) };
    case 'read': return { ...s, notices: s.notices.map(n => !a.id || n.id === a.id ? { ...n, read: true } : n) };
    case 'remind': return { ...s, notices: [a.notice, ...s.notices] };
  }
}

interface Ctx {
  state: State; dispatch: (a: Action) => void;
  page: PageKey; param?: string; go: (p: PageKey, param?: string) => void;
  role: Role; setRole: (r: Role) => void; toasts: Toast[]; toast: (tone: Toast['tone'], text: string) => void; dismiss: (id: number) => void;
  pkgOf: (id: string) => Pkg | undefined; who: (id: string) => string; slotOf: (id: string | null) => Slot | undefined;
  collapsed: boolean; setCollapsed: (b: boolean) => void; search: boolean; setSearch: (b: boolean) => void;
}
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

const fromHash = (): { page: PageKey; param?: string } => {
  const [p, param] = location.hash.replace('#/', '').split('/');
  return { page: (p || 'dashboard') as PageKey, param };
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, reduce] = useReducer(reducer, { packages: initialPackages, claims: initialClaims, notices: initialNotices });
  const [nav, setNav] = useState(fromHash);
  const [role, setRole] = useState<Role>('Administrator');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState(false);
  const go = useCallback((page: PageKey, param?: string) => { location.hash = `#/${page}${param ? '/' + param : ''}`; setNav({ page, param }); window.scrollTo(0, 0); }, []);
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  const toast = useCallback((tone: Toast['tone'], text: string) => { const id = Date.now() + Math.random(); setToasts(t => [...t, { id, tone, text }]); setTimeout(() => dismiss(id), 4000); }, [dismiss]);
  const dispatch = useCallback((action: Action) => {
    reduce(action);
    const persist = async () => {
      try {
        if (action.t === 'hydrate') return;
        if (action.t === 'receive') await api.createPackage(action.pkg, action.notice);
        if (action.t === 'assign' || action.t === 'unassign') {
          const current = state.packages.find(pkg => pkg.id === action.id);
          if (!current) throw new Error(`Package ${action.id} was not found`);
          const at = nowIso();
          const updated = action.t === 'assign'
            ? { ...current, slotId: action.slotId, status: 'ready' as const, assignedAt: at, assignedBy: action.by, events: [...current.events, { title: current.slotId ? 'Transferred to new slot' : 'Storage assigned', at, by: action.by, note: action.note }] }
            : { ...current, slotId: null, status: 'unassigned' as const, events: [...current.events, { title: 'Flagged awaiting assignment', at, by: action.by, note: action.note }] };
          await api.updateStorage(action.id, updated);
        }
        if (action.t === 'claim') {
          const current = state.packages.find(pkg => pkg.id === action.claim.packageId);
          if (!current) throw new Error(`Package ${action.claim.packageId} was not found`);
          await api.createClaim(action.claim, [...current.events, { title: 'Claimed', at: action.claim.at, by: action.claim.verifier, note: `Verified handoff. Receipt ${action.claim.receipt} issued; slot released.`, tone: 'teal' }]);
        }
        if (action.t === 'remind') await api.createNotice(action.notice);
        if (action.t === 'read') await api.markRead(action.id);
      } catch (error) {
        toast('error', error instanceof Error ? error.message : 'Could not save this change.');
      }
    };
    void persist();
  }, [state.packages, toast]);
  useEffect(() => {
    void api.bootstrap().then(async data => {
      if (data.packages.length === 0) {
        await api.seed({ packages: initialPackages, claims: initialClaims, notices: initialNotices });
        reduce({ t: 'hydrate', packages: initialPackages, claims: initialClaims, notices: initialNotices });
      } else {
        reduce({ t: 'hydrate', ...data });
      }
    }).catch(error => toast('error', error instanceof Error ? error.message : 'Could not connect to the ParcelPoint API.'));
  }, [toast]);
  const value = useMemo<Ctx>(() => ({
    state, dispatch, ...nav, go, role, setRole, toasts, toast, dismiss, collapsed, setCollapsed, search, setSearch,
    pkgOf: id => state.packages.find(p => p.id === id), who: id => recipients.find(r => r.id === id)?.name ?? 'Unknown',
    slotOf: id => slots.find(s => s.id === id),
  }), [state, nav, go, role, toasts, toast, dismiss, collapsed, search, dispatch]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
