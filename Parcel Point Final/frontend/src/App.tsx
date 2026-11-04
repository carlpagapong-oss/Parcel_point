import { AppProvider, useApp, type PageKey } from './lib/store';
import type { ReactElement } from 'react';
import { Shell, NAV } from './components/Shell';
import { Toasts, Empty } from './components/ui';
import { Lock } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Receive from './pages/Receive';
import Packages from './pages/Packages';
import Tracking from './pages/Tracking';
import Storage from './pages/Storage';
import Recipients from './pages/Recipients';
import Claims from './pages/Claims';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Portal from './pages/Portal';

const PAGES: Record<Exclude<PageKey, 'portal'>, () => ReactElement> = { dashboard: Dashboard, receive: Receive, packages: Packages, tracking: Tracking, storage: Storage, recipients: Recipients, claims: Claims, notifications: Notifications, reports: Reports, settings: Settings };

function Router() {
  const { page, role, go } = useApp();
  if (page === 'portal') return <Portal />;
  const Page = PAGES[page] ?? Dashboard;
  const allowed = NAV.find(n => n.key === page)?.roles.includes(role) ?? true;
  return <Shell>{allowed ? <Page /> : <div className="card"><Empty title="Access restricted" action={<button className="btn primary" onClick={() => go('dashboard')}>Back to dashboard</button>}><Lock size={0} />Your role ({role}) does not include this module. Switch role from the profile menu or ask an administrator.</Empty></div>}</Shell>;
}
export default function App() { return <AppProvider><Router /><Toasts /></AppProvider>; }
