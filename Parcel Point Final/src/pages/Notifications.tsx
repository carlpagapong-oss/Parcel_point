import { useState } from 'react';
import { Bell, Send, CheckCheck } from 'lucide-react';
import { useApp } from '../lib/store';
import { Badge, Card, Empty, Field, Modal, PageHeader, Select, Skeleton, Tabs, useLoading } from '../components/ui';
import { fmt, isOverdue, nowIso } from '../lib/format';

const tone = { Arrival: 'blue', Reminder: 'amber', Overdue: 'red', Claim: 'teal' } as const;
export default function Notifications() {
  const { state, dispatch, go, who, toast } = useApp();
  const loading = useLoading('nt'); const [tab, setTab] = useState<'all' | 'unread' | 'history'>('all'); const [send, setSend] = useState(false); const [pid, setPid] = useState('');
  if (loading) return <Skeleton rows={3} />;
  const N = state.notices; const unread = N.filter(n => !n.read); const list = tab === 'unread' ? unread : N;
  const due = state.packages.filter(p => p.status === 'ready' && isOverdue(p.receivedAt));
  const sendReminder = () => { const p = state.packages.find(x => x.id === pid); if (!p) return;
    dispatch({ t: 'remind', notice: { id: `N-0${N.length + 22}`, kind: isOverdue(p.receivedAt) ? 'Overdue' : 'Reminder', title: 'Collection reminder', body: `${p.id} is waiting for you. Bring an identity document.`, at: nowIso(), recipientId: p.recipientId, packageId: p.id, read: false } });
    toast('success', `Reminder sent to ${who(p.recipientId)}.`); setSend(false); setPid(''); };
  return <div className="stack"><PageHeader title="Notifications" sub="Package alerts, claim reminders and notification history." action={<div className="row"><button className="btn" disabled={!unread.length} onClick={() => { dispatch({ t: 'read' }); toast('success', 'All notifications marked as read.'); }}><CheckCheck size={16} />Mark all read</button><button className="btn primary" onClick={() => setSend(true)}><Send size={16} />Send reminder</button></div>} />
    <div className="grid g3"><Card><span className="muted">Unread alerts</span><div style={{ fontSize: 32 }}>{unread.length}</div></Card><Card><span className="muted">Overdue reminders due</span><div style={{ fontSize: 32 }}>{due.length}</div><span className="muted small">{due.map(p => p.id).join(', ') || 'None'}</span></Card><Card><span className="muted">Total sent</span><div style={{ fontSize: 32 }}>{N.length}</div></Card></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ key: 'all', label: 'Alerts' }, { key: 'unread', label: `Unread · ${unread.length}` }, { key: 'history', label: 'History' }]} />
    {tab === 'history' ? <Card flush><div className="tw"><table><thead><tr><th>ID</th><th>Type</th><th>Recipient</th><th>Package</th><th>Sent · UTC</th></tr></thead><tbody>{N.map(n => <tr key={n.id}><td className="mono">{n.id}</td><td><Badge tone={tone[n.kind]}>{n.kind}</Badge></td><td>{who(n.recipientId)}</td><td className="mono">{n.packageId}</td><td>{fmt(n.at)}</td></tr>)}</tbody></table></div></Card>
      : <Card flush>{list.length === 0 ? <Empty title="You're all caught up">New package alerts and reminders will appear here.</Empty> : list.map(n => <div key={n.id} className="row between" style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', background: n.read ? '#fff' : '#F8FAFF' }}>
        <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}><Bell size={18} color={n.read ? '#9FB2D0' : 'var(--blue)'} /><div><div className="row"><b>{n.title}</b><Badge tone={tone[n.kind]}>{n.kind}</Badge>{!n.read && <Badge tone="blue">Unread</Badge>}</div><p className="muted small">{n.body}</p><span className="muted small">{n.id} · {who(n.recipientId)} · {fmt(n.at)} UTC</span></div></div>
        <div className="row"><button className="btn sm" onClick={() => go('tracking', n.packageId)}>Track</button>{!n.read && <button className="btn sm" onClick={() => dispatch({ t: 'read', id: n.id })}>Mark read</button>}</div></div>)}</Card>}
    {send && <Modal title="Send claim reminder" onClose={() => setSend(false)}><div className="stack"><Field label="Package *"><Select value={pid} onChange={e => setPid(e.target.value)} options={[{ v: '', l: 'Select a package…' }, ...state.packages.filter(p => p.status === 'ready').map(p => ({ v: p.id, l: `${p.id} · ${who(p.recipientId)}` }))]} /></Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => setSend(false)}>Cancel</button><button className="btn primary" disabled={!pid} onClick={sendReminder}>Send reminder</button></div></div></Modal>}</div>;
}
