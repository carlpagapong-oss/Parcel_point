import { useEffect, useState, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes } from 'react';
import { X, Inbox, Info, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Status } from '../types';
import { useApp } from '../lib/store';

export const Card = ({ title, sub, action, children, className = '', flush }: { title?: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) => (
  <section className={`card ${flush ? 'flush' : ''} ${className}`}>
    {title && <div className="card-h" style={flush ? { padding: '20px 20px 0' } : undefined}><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{action}</div>}
    {children}
  </section>
);
export const PageHeader = ({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) => (
  <div className="ph"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{action}</div>
);
export const Badge = ({ tone = 'gray', children }: { tone?: 'blue' | 'teal' | 'gray' | 'amber' | 'red'; children: ReactNode }) => <span className={`badge b-${tone}`}>{children}</span>;
export const StatusBadge = ({ status }: { status: Status }) =>
  status === 'ready' ? <Badge tone="blue">Ready to claim</Badge> : status === 'claimed' ? <Badge tone="teal">Claimed</Badge> : <Badge>Awaiting assignment</Badge>;

export const Alert = ({ tone, title, children }: { tone: 'info' | 'warn' | 'err' | 'ok'; title: string; children?: ReactNode }) => {
  const I = tone === 'info' ? Info : tone === 'warn' ? AlertTriangle : tone === 'err' ? ShieldAlert : CheckCircle2;
  return <div className={`alert ${tone}`} role={tone === 'err' ? 'alert' : 'status'}><I size={18} style={{ flex: 'none', marginTop: 2 }} /><div><b>{title}</b>{children}</div></div>;
};
export const Stat = ({ label, value, note, icon, tone = 'var(--blue)' }: { label: string; value: ReactNode; note: string; icon: ReactNode; tone?: string }) => (
  <div className="card stat"><div className="h"><span>{label}</span><span style={{ color: tone }}>{icon}</span></div><div className="v">{value}</div><div className="muted small">{note}</div></div>
);
export const Tabs = <T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) => (
  <div className="tabs" role="tablist">{tabs.map(t => <button key={t.key} role="tab" aria-selected={value === t.key} className={value === t.key ? 'on' : ''} onClick={() => onChange(t.key)}>{t.label}</button>)}</div>
);
export const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) => (
  <div className="field"><label>{label}</label>{children}{error ? <span className="err">{error}</span> : hint && <span className="hint">{hint}</span>}</div>
);
export const Select = ({ options, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { v: string; l: string })[] }) => (
  <select className="input" {...p}>{options.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}</select>
);
export const Input = (p: InputHTMLAttributes<HTMLInputElement> & { bad?: boolean }) => { const { bad, ...r } = p; return <input className={`input ${bad ? 'bad' : ''}`} {...r} />; };
export const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) => <button className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;

export const Empty = ({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) => (
  <div className="empty"><Inbox size={30} /><b>{title}</b><div>{children}</div>{action && <div style={{ marginTop: 12 }}>{action}</div>}</div>
);
export const Modal = ({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) => {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return <div className="scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
    <div className="card-h"><h2>{title}</h2><button className="iconbtn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</div></div>;
};
export const Skeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="stack" aria-busy="true" aria-label="Loading">
    <div className="skel" style={{ height: 34, width: 260 }} />
    <div className="grid g4">{[0, 1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 110 }} />)}</div>
    {Array.from({ length: rows }, (_, i) => <div key={i} className="skel" style={{ height: 52 }} />)}
  </div>
);
export const Toasts = () => { const { toasts, dismiss } = useApp(); return <div className="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className={`toast ${t.tone}`}><CheckCircle2 size={18} />{t.text}<button className="iconbtn" style={{ color: '#fff' }} onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={14} /></button></div>)}</div>; };

/** Simulated async load so every page shows a skeleton first. */
export const useLoading = (key: string, ms = 450) => {
  const [l, setL] = useState(true);
  useEffect(() => { setL(true); const t = setTimeout(() => setL(false), ms); return () => clearTimeout(t); }, [key, ms]);
  return l;
};
export const Avatar = ({ name }: { name: string }) => <span className="avatar">{name.split(' ').map(s => s[0]).join('').slice(0, 2)}</span>;

export const BarChart = ({ data }: { data: { label: string; a: number; b: number }[] }) => {
  const max = Math.max(1, ...data.flatMap(d => [d.a, d.b]));
  return <div className="chart" role="img" aria-label="Received and claimed packages per day">{data.map(d => (
    <div className="col" key={d.label}><div className="pair"><i title={`Received ${d.a}`} style={{ height: `${(d.a / max) * 100}%`, background: 'var(--blue)' }} /><i title={`Claimed ${d.b}`} style={{ height: `${(d.b / max) * 100}%`, background: 'var(--teal)' }} /></div><span className="muted small">{d.label}</span></div>))}</div>;
};
export const Donut = ({ parts, total }: { parts: { v: number; c: string }[]; total: number }) => {
  const R = 52, C = 2 * Math.PI * R; let off = 0;
  return <svg width="150" height="150" viewBox="0 0 140 140" role="img" aria-label="Package status"><circle cx="70" cy="70" r={R} fill="none" stroke="#E7ECF4" strokeWidth="16" />
    {parts.map((p, i) => { const len = total ? (p.v / total) * C : 0; const el = <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={p.c} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />; off += len; return el; })}
    <text x="70" y="72" textAnchor="middle" fontSize="28" fill="#17365D">{total}</text><text x="70" y="90" textAnchor="middle" fontSize="11" fill="#68789A">packages</text></svg>;
};
