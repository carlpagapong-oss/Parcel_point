import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LayoutGrid, PackagePlus, Boxes, ScanLine, Warehouse, Users, ClipboardCheck, Bell, BarChart3, Settings, Search, ChevronDown, PanelLeftClose, PanelLeftOpen, Menu, Lock, Package, Smartphone, User } from 'lucide-react';
import { useApp, type PageKey } from '../lib/store';
import { recipients } from '../data/mock';
import { fmt } from '../lib/format';
import { Avatar, Modal, Empty } from './ui';
import type { Role } from '../types';

export const NAV: { key: PageKey; label: string; icon: typeof Boxes; roles: Role[] }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['Administrator', 'Claiming Staff', 'Receiving Staff'] },
  { key: 'receive', label: 'Receive Package', icon: PackagePlus, roles: ['Administrator', 'Receiving Staff'] },
  { key: 'packages', label: 'All Packages', icon: Boxes, roles: ['Administrator', 'Claiming Staff', 'Receiving Staff'] },
  { key: 'tracking', label: 'Parcel Tracking', icon: ScanLine, roles: ['Administrator', 'Claiming Staff', 'Receiving Staff'] },
  { key: 'storage', label: 'Storage Locations', icon: Warehouse, roles: ['Administrator', 'Receiving Staff'] },
  { key: 'recipients', label: 'Recipients', icon: Users, roles: ['Administrator', 'Claiming Staff', 'Receiving Staff'] },
  { key: 'claims', label: 'Package Claims', icon: ClipboardCheck, roles: ['Administrator', 'Claiming Staff'] },
  { key: 'notifications', label: 'Notifications', icon: Bell, roles: ['Administrator', 'Claiming Staff', 'Receiving Staff'] },
  { key: 'reports', label: 'Reports', icon: BarChart3, roles: ['Administrator'] },
  { key: 'settings', label: 'Settings', icon: Settings, roles: ['Administrator'] },
];
const USER: Record<Role, string> = { Administrator: 'Alex Morgan', 'Claiming Staff': 'Daniel Cho', 'Receiving Staff': 'Elena Ruiz' };
export const staffName = (r: Role) => USER[r];

export function Shell({ children }: { children: ReactNode }) {
  const { page, go, role, setRole, collapsed, setCollapsed, setSearch, state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<'bell' | 'me' | null>(null);
  const unread = state.notices.filter(n => !n.read).length;
  useEffect(() => { setOpen(false); setMenu(null); }, [page]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [setSearch]);
  const user = USER[role];
  return (
    <div className={`shell ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
      <aside className="side" aria-label="Primary">
        <div className="brand"><span className="logo"><Package size={20} /></span><span className="lbl">ParcelPoint</span></div>
        <div className="ws lbl"><b>SDF01 · Operations</b>Package receiving & claims</div>
        <nav className="nav">{NAV.map(n => { const ok = n.roles.includes(role); return (
          <button key={n.key} className={`${page === n.key ? 'on' : ''} ${ok ? '' : 'locked'}`} title={ok ? n.label : `${n.label} (requires permission)`} onClick={() => go(n.key)}>
            <n.icon size={19} /><span className="lbl" style={{ flex: 1 }}>{n.label}</span>{!ok && <Lock size={13} className="lbl" />}</button>); })}</nav>
        <div className="side-foot"><div className="lbl">DEMO WORKSPACE<br />Fictional records. No live feeds.</div>
          <button onClick={() => go('portal')}><Smartphone size={17} /><span className="lbl">Recipient portal</span></button>
          <button onClick={() => setCollapsed(!collapsed)} className="hide-m">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}<span className="lbl">Collapse sidebar</span></button></div>
      </aside>
      <div className="main">
        <header className="top">
          <button className="iconbtn menu-btn" aria-label="Open menu" onClick={() => setOpen(!open)}><Menu size={20} /></button>
          <button className="search" onClick={() => setSearch(true)}><Search size={18} /><span>Search packages, recipients, tracking…</span><span className="kbd">⌘ K</span></button>
          <span className="spacer" /><span className="badge b-amber demo">Demo data</span>
          <div className="rel"><button className="iconbtn" aria-label={`Notifications, ${unread} unread`} onClick={() => setMenu(menu === 'bell' ? null : 'bell')}><Bell size={19} />{unread > 0 && <span className="dot">{unread}</span>}</button>
            {menu === 'bell' && <div className="pop"><div className="row between" style={{ padding: '8px 10px' }}><h3>Notifications</h3><button className="btn link small" onClick={() => dispatch({ t: 'read' })}>Mark all read</button></div>
              {state.notices.slice(0, 4).map(n => <button key={n.id} className="it" onClick={() => go('notifications')}><span className="badge b-blue" style={{ opacity: n.read ? .35 : 1, padding: 0, background: 'none' }} /><span><b className="small">{n.title}</b><br /><span className="muted small">{n.packageId} · {fmt(n.at)}</span></span></button>)}
              <button className="it" style={{ color: 'var(--blue)', fontWeight: 600 }} onClick={() => go('notifications')}>View all notifications</button></div>}</div>
          <div className="rel"><button className="me" onClick={() => setMenu(menu === 'me' ? null : 'me')} aria-haspopup="menu"><Avatar name={user} /><span className="meta"><b className="small">{user}</b><br /><span className="muted small">{role}</span></span><ChevronDown size={15} className="muted" /></button>
            {menu === 'me' && <div className="pop" style={{ width: 250 }} role="menu"><div className="muted small" style={{ padding: '8px 10px' }}>Switch demo role</div>
              {(Object.keys(USER) as Role[]).map(r => <button key={r} className="it" role="menuitem" onClick={() => { setRole(r); setMenu(null); }}><User size={16} /><span style={{ flex: 1 }}>{r}</span>{role === r && <span className="badge b-teal">Active</span>}</button>)}
              <button className="it" onClick={() => go('portal')}><Smartphone size={16} />Open recipient portal</button><button className="it" onClick={() => go('settings')}><Settings size={16} />Settings</button></div>}</div>
        </header>
        <main className="content page-fade" key={page}>{children}<div className="foot"><span>ParcelPoint / SDF01 · Fictional demonstration data</span><span>27 Oct 2026 · 11:00 UTC</span></div></main>
      </div>
      <GlobalSearch />
    </div>
  );
}

function GlobalSearch() {
  const { search, setSearch, state, go } = useApp();
  const [q, setQ] = useState('');
  const res = useMemo(() => { const s = q.trim().toLowerCase(); if (!s) return { p: [], r: [] };
    return { p: state.packages.filter(p => `${p.id} ${p.tracking}`.toLowerCase().includes(s)).slice(0, 5), r: recipients.filter(r => `${r.name} ${r.id}`.toLowerCase().includes(s)).slice(0, 4) }; }, [q, state.packages]);
  if (!search) return null;
  const close = () => { setSearch(false); setQ(''); };
  return <Modal title="Search" onClose={close}>
    <div className="iw"><Search size={16} /><input autoFocus className="input" placeholder="Package ID, tracking number or recipient" value={q} onChange={e => setQ(e.target.value)} /></div>
    <div style={{ marginTop: 12 }}>{!q ? <p className="muted small">Try “PP-1027”, “NL-2600001027” or “Maya”.</p> : !res.p.length && !res.r.length ? <Empty title="No matches">Check the identifier or try a recipient name.</Empty> : <>
      {res.p.map(p => <button key={p.id} className="qa" onClick={() => { go('tracking', p.id); close(); }}><span><ScanLine size={16} /><span className="mono">{p.id}</span>{state.packages.length && recipients.find(r => r.id === p.recipientId)?.name}</span><span className="muted small">{p.tracking}</span></button>)}
      {res.r.map(r => <button key={r.id} className="qa" onClick={() => { go('recipients', r.id); close(); }}><span><Users size={16} />{r.name}</span><span className="muted small">{r.id}</span></button>)}</>}</div></Modal>;
}
