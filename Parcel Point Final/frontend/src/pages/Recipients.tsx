import { useState } from 'react';
import { Search, Mail, Phone, Home } from 'lucide-react';
import { useApp } from '../lib/store';
import { Avatar, Badge, Card, Empty, PageHeader, Skeleton, StatusBadge, Tabs, Toggle, useLoading } from '../components/ui';
import { recipients } from '../data/officialData';
import { fmt } from '../lib/format';

export default function Recipients() {
  const { state, param, go, toast } = useApp();
  const loading = useLoading('rc');
  const [q, setQ] = useState(''); const [sel, setSel] = useState(param ?? 'R-001'); const [tab, setTab] = useState<'pk' | 'cl' | 'nt'>('pk');
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => Object.fromEntries(recipients.map(r => [r.id, r.notify])));
  if (loading) return <Skeleton rows={3} />;
  const list = recipients.filter(r => `${r.name} ${r.id} ${r.unit}`.toLowerCase().includes(q.toLowerCase())); const r = recipients.find(x => x.id === sel);
  const pk = state.packages.filter(p => p.recipientId === sel), cl = state.claims.filter(c => c.recipientId === sel), nt = state.notices.filter(n => n.recipientId === sel);
  return <div className="stack"><PageHeader title="Recipients" sub="Directory, package records and claim history for every recipient." />
    <div className="grid" style={{ gridTemplateColumns: 'minmax(280px,360px) minmax(0,1fr)' }}>
      <Card flush><div style={{ padding: 16 }}><div className="iw"><Search size={16} /><input className="input" placeholder="Search recipients" value={q} onChange={e => setQ(e.target.value)} aria-label="Search recipients" /></div></div>
        {list.length === 0 ? <Empty title="No recipients found">Try a different name or ID.</Empty> : list.map(x => { const open = state.packages.filter(p => p.recipientId === x.id && p.status !== 'claimed').length;
          return <button key={x.id} className="it" onClick={() => setSel(x.id)} style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', textAlign: 'left', border: 0, borderTop: '1px solid var(--line)', padding: '12px 16px', background: sel === x.id ? 'var(--blue-soft)' : '#fff' }}>
            <Avatar name={x.name} /><span style={{ flex: 1 }}><b>{x.name}</b><br /><span className="muted small">{x.id} · {x.unit}</span></span>{open > 0 && <Badge tone="blue">{open} open</Badge>}</button>; })}</Card>
      {r && <div className="stack"><Card><div className="row" style={{ gap: 16 }}><span className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>{r.name.split(' ').map(s => s[0]).join('')}</span><div><h2 style={{ fontSize: 20 }}>{r.name}</h2><span className="muted small">{r.id}</span></div></div>
        <div className="grid g3" style={{ marginTop: 16 }}><span className="row small"><Mail size={15} />{r.email}</span><span className="row small"><Phone size={15} />{r.phone}</span><span className="row small"><Home size={15} />{r.unit}</span></div>
        <div className="row between" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}><span>Arrival notifications</span><Toggle label="Arrival notifications" on={prefs[r.id]} onChange={v => { setPrefs({ ...prefs, [r.id]: v }); toast('success', `Notifications ${v ? 'enabled' : 'disabled'} for ${r.name}.`); }} /></div></Card>
        <Card flush><div style={{ padding: '16px 20px 0' }}><Tabs value={tab} onChange={setTab} tabs={[{ key: 'pk', label: `Packages · ${pk.length}` }, { key: 'cl', label: `Claim history · ${cl.length}` }, { key: 'nt', label: `Notifications · ${nt.length}` }]} /></div>
          {tab === 'pk' && (pk.length ? <div className="tw"><table><thead><tr><th>Package</th><th>Courier</th><th>Received</th><th>Status</th><th /></tr></thead><tbody>{pk.map(p => <tr key={p.id}><td className="mono">{p.id}</td><td>{p.courier}</td><td>{fmt(p.receivedAt)}</td><td><StatusBadge status={p.status} /></td><td><button className="btn sm" onClick={() => go('tracking', p.id)}>Track</button></td></tr>)}</tbody></table></div> : <Empty title="No packages yet">Packages registered for this recipient appear here.</Empty>)}
          {tab === 'cl' && (cl.length ? <div className="tw"><table><thead><tr><th>Receipt</th><th>Package</th><th>Completed</th><th>Verifier</th></tr></thead><tbody>{cl.map(c => <tr key={c.id}><td className="mono">{c.receipt}</td><td className="mono">{c.packageId}</td><td>{fmt(c.at)}</td><td>{c.verifier}</td></tr>)}</tbody></table></div> : <Empty title="No claims yet">Verified handoffs and receipts will be listed here.</Empty>)}
          {tab === 'nt' && (nt.length ? nt.map(n => <div key={n.id} style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}><b>{n.title}</b> <Badge tone={n.read ? 'gray' : 'blue'}>{n.read ? 'Read' : 'Unread'}</Badge><br /><span className="muted small">{n.id} · {fmt(n.at)} · {n.body}</span></div>) : <Empty title="No notifications">Nothing has been sent to this recipient.</Empty>)}</Card></div>}
    </div></div>;
}
