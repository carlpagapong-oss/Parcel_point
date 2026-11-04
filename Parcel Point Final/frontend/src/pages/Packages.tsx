import { useMemo, useState } from 'react';
import { Search, Download, Plus, ArrowUpRight } from 'lucide-react';
import { useApp } from '../lib/store';
import { Alert, Card, Empty, Field, Modal, PageHeader, Select, Skeleton, StatusBadge, Tabs, useLoading } from '../components/ui';
import { couriers, slotLabel, slots } from '../data/officialData';
import { fmt, isOverdue } from '../lib/format';

type Tab = 'all' | 'unclaimed' | 'claimed' | 'overdue';
export default function Packages() {
  const { state, go, who, slotOf, role, dispatch, toast } = useApp();
  const loading = useLoading('pk');
  const [tab, setTab] = useState<Tab>('all'); const [q, setQ] = useState(''); const [st, setSt] = useState('All statuses'); const [co, setCo] = useState('All couriers');
  const [sel, setSel] = useState<string | null>('PP-1027'); const [upd, setUpd] = useState(false); const [reason, setReason] = useState(''); const [page, setPage] = useState(1);
  const P = state.packages;
  const cnt = { all: P.length, unclaimed: P.filter(p => p.status !== 'claimed').length, claimed: P.filter(p => p.status === 'claimed').length, overdue: P.filter(p => p.status !== 'claimed' && isOverdue(p.receivedAt)).length };
  const rows = useMemo(() => P.filter(p => (tab === 'all' || (tab === 'unclaimed' && p.status !== 'claimed') || (tab === 'claimed' && p.status === 'claimed') || (tab === 'overdue' && p.status !== 'claimed' && isOverdue(p.receivedAt)))
    && (st === 'All statuses' || (st === 'Ready to claim' && p.status === 'ready') || (st === 'Claimed' && p.status === 'claimed') || (st === 'Awaiting assignment' && p.status === 'unassigned'))
    && (co === 'All couriers' || p.courier === co) && `${p.id} ${p.tracking} ${who(p.recipientId)}`.toLowerCase().includes(q.toLowerCase())), [P, tab, st, co, q, who]);
  if (loading) return <Skeleton />;
  const per = 6, pages = Math.max(1, Math.ceil(rows.length / per)), cur = Math.min(page, pages), view = rows.slice((cur - 1) * per, cur * per);
  const pk = P.find(p => p.id === sel); const od = P.filter(p => p.status !== 'claimed' && isOverdue(p.receivedAt));
  const exportCsv = () => { toast('success', `Exported ${rows.length} packages to CSV (completed).`); };
  const apply = (kind: 'unassign' | 'assign') => {
    if (!pk || reason.trim().length < 3) return;
    if (kind === 'unassign') dispatch({ t: 'unassign', id: pk.id, by: role, note: reason });
    else { const taken = new Set(P.map(p => p.slotId)); const s = slots.find(x => !taken.has(x.id)); if (!s) { toast('error', 'No free slot available.'); return; } dispatch({ t: 'assign', id: pk.id, slotId: s.id, by: 'Elena Ruiz', note: `${reason} · ${slotLabel(s)}` }); }
    toast('success', `${pk.id} status updated.`); setUpd(false); setReason('');
  };
  return <div className="stack">
    <PageHeader title="All packages" sub="One directory for every arrival, storage handoff and collection." action={role !== 'Claiming Staff' && <button className="btn primary" onClick={() => go('receive')}><Plus size={17} />Receive package</button>} />
    <Tabs value={tab} onChange={t => { setTab(t); setPage(1); }} tabs={[{ key: 'all', label: `All packages · ${cnt.all}` }, { key: 'unclaimed', label: `Unclaimed · ${cnt.unclaimed}` }, { key: 'claimed', label: `Claimed · ${cnt.claimed}` }, { key: 'overdue', label: `Overdue subset · ${cnt.overdue}` }]} />
    <div className="row"><div className="iw"><Search size={16} /><input className="input" placeholder="Search packages, recipient or tracking number" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} aria-label="Search packages" /></div>
      <div style={{ width: 190 }}><Select value={st} onChange={e => setSt(e.target.value)} options={['All statuses', 'Ready to claim', 'Claimed', 'Awaiting assignment']} /></div>
      <div style={{ width: 170 }}><Select value={co} onChange={e => setCo(e.target.value)} options={['All couriers', ...couriers]} /></div>
      {(q || st !== 'All statuses' || co !== 'All couriers') && <button className="btn" onClick={() => { setQ(''); setSt('All statuses'); setCo('All couriers'); }}>Clear filters</button>}</div>
    {od.length > 0 && <Alert tone="warn" title={`${od.length} unclaimed packages are overdue`}>{od.map(p => p.id).join(' and ')} were received more than 7 days ago. Overdue is a collection condition, not a courier status.</Alert>}
    <Card flush title="Package directory" sub="20–27 Oct 2026 · Received timestamps in UTC" action={<button className="btn link" onClick={exportCsv}>Export CSV <Download size={14} /></button>}>
      {view.length === 0 ? <Empty title="No packages match" action={<button className="btn" onClick={() => { setQ(''); setSt('All statuses'); setCo('All couriers'); setTab('all'); }}>Clear filters</button>}>Try another tracking number or clear your filters. Existing records are unchanged.</Empty> :
        <div className="tw"><table><thead><tr><th>Package ID</th><th>Recipient</th><th>Courier</th><th>Received · UTC</th><th>Facility status</th><th>Shelf / slot</th></tr></thead><tbody>
          {view.map(p => { const s = slotOf(p.slotId); return <tr key={p.id} className={sel === p.id ? 'sel' : ''} tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => setSel(p.id)} onKeyDown={e => e.key === 'Enter' && setSel(p.id)}><td className="mono">{p.id}</td><td>{who(p.recipientId)}</td><td>{p.courier}</td><td>{fmt(p.receivedAt)}</td><td><StatusBadge status={p.status} /></td><td>{s ? `${s.shelf} / ${s.slot}` : p.status === 'claimed' ? 'Released' : 'Not assigned'}</td></tr>; })}</tbody></table></div>}
      <div className="row between" style={{ padding: 16, borderTop: '1px solid var(--line)' }}><span className="muted small">Showing {rows.length ? (cur - 1) * per + 1 : 0}–{Math.min(cur * per, rows.length)} of {rows.length} packages</span>
        <div className="row"><button className="btn sm" disabled={cur === 1} onClick={() => setPage(cur - 1)}>Previous</button>{Array.from({ length: pages }, (_, i) => <button key={i} className={`btn sm ${cur === i + 1 ? 'primary' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button className="btn sm" disabled={cur === pages} onClick={() => setPage(cur + 1)}>Next</button></div></div></Card>
    {pk && <Card><div className="row between"><div><h2>{pk.id} · {who(pk.recipientId)}</h2><p className="muted small">{pk.tracking} · {pk.courier} · {pk.description}</p></div><StatusBadge status={pk.status} /></div>
      <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={() => go('tracking', pk.id)}><ArrowUpRight size={15} />View tracking</button>
        {pk.status === 'ready' && role !== 'Claiming Staff' && <button className="btn" onClick={() => setUpd(true)}>Review status update</button>}{pk.status === 'unassigned' && <button className="btn" onClick={() => setUpd(true)}>Assign next free slot</button>}
        {pk.status === 'ready' && <button className="btn" onClick={() => go('claims', pk.id)}>Start claim</button>}</div>
      <p className="muted small" style={{ marginTop: 10 }}>Updates require a reason and review. Claim status can only change through verified claim processing.</p></Card>}
    {upd && pk && <Modal title="Review status update" onClose={() => setUpd(false)}><div className="stack">
      <p className="muted">{pk.id} is currently <b>{pk.status === 'ready' ? 'Ready to claim' : 'Awaiting assignment'}</b>. {pk.status === 'ready' ? 'Flagging it releases its slot.' : 'It will be stored in the next free slot.'}</p>
      <Field label="Reason *" hint="Recorded in the facility history"><textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} /></Field>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => setUpd(false)}>Cancel</button><button className="btn primary" disabled={reason.trim().length < 3} onClick={() => apply(pk.status === 'ready' ? 'unassign' : 'assign')}>Confirm update</button></div></div></Modal>}
  </div>;
}
