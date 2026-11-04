import { PackagePlus, ScanLine, ClipboardCheck, Package, CheckCircle2, Archive, Clock, CalendarDays, ArrowUpRight } from 'lucide-react';
import { useApp } from '../lib/store';
import { Card, PageHeader, Stat, StatusBadge, BarChart, Donut, Skeleton, useLoading, Badge } from '../components/ui';
import { dayKey, fmt, isOverdue } from '../lib/format';
import { slots } from '../data/mock';

export default function Dashboard() {
  const { state, go, who, role } = useApp();
  const loading = useLoading('dash');
  if (loading) return <Skeleton rows={3} />;
  const { packages: P, claims: C } = state;
  const ready = P.filter(p => p.status === 'ready'), claimed = P.filter(p => p.status === 'claimed'), un = P.filter(p => p.status === 'unassigned');
  const unclaimed = P.filter(p => p.status !== 'claimed'), overdue = unclaimed.filter(p => isOverdue(p.receivedAt));
  const occ = P.filter(p => p.slotId).length;
  const days = Array.from({ length: 8 }, (_, i) => `${20 + i} Oct`);
  const chart = days.map(d => ({ label: d.replace(' Oct', ''), a: P.filter(p => dayKey(p.receivedAt) === d).length, b: C.filter(c => dayKey(c.at) === d).length })).filter(d => d.a || d.b);
  const todayRecv = P.filter(p => dayKey(p.receivedAt) === '27 Oct').length;
  return <div className="stack">
    <PageHeader title="Operations overview" sub="Tuesday, 27 October 2026 · A clear view of every handoff." action={role !== 'Claiming Staff' ? <button className="btn primary" onClick={() => go('receive')}><PackagePlus size={17} />Receive package</button> : undefined} />
    <div className="row"><span className="btn"><CalendarDays size={16} />20–27 Oct 2026</span><span className="muted small">{P.length} demonstration packages</span></div>
    <div className="grid g4">
      <Stat label="Received" value={P.length} note={`20–27 Oct · ${todayRecv} received today`} icon={<Package size={18} />} />
      <Stat label="Claimed" value={claimed.length} note={`${C.filter(c => dayKey(c.at) === '27 Oct').length} completed today`} icon={<CheckCircle2 size={18} />} tone="var(--teal)" />
      <Stat label="Total unclaimed" value={unclaimed.length} note={`${ready.length} ready · ${un.length} awaiting assignment`} icon={<Archive size={18} />} />
      <Stat label="Overdue subset" value={overdue.length} note={`Included in ${unclaimed.length} unclaimed · > 7 days`} icon={<Clock size={18} />} tone="#D98E04" />
    </div>
    <div className="grid g-main2">
      <Card title="Receiving & collection" sub="20–27 Oct 2026 · Package count" action={<button className="btn link" onClick={() => go('reports')}>View reports →</button>}>
        <div className="legend" style={{ marginBottom: 10 }}><Badge tone="blue">Received · {P.length}</Badge><Badge tone="teal">Claimed · {C.length}</Badge></div><BarChart data={chart} />
        <p className="muted small" style={{ marginTop: 10 }}>Days without activity omitted · All times UTC</p></Card>
      <Card title="Current package status" sub={`${P.length} total packages · Not courier transit status`}>
        <div className="row" style={{ justifyContent: 'center', gap: 20 }}><Donut total={P.length} parts={[{ v: ready.length, c: '#3478F6' }, { v: claimed.length, c: '#18A999' }, { v: un.length, c: '#A9B6CC' }]} />
          <div className="stack" style={{ gap: 8 }}>{[['Ready to claim', ready.length, '#3478F6'], ['Claimed', claimed.length, '#18A999'], ['Unassigned', un.length, '#A9B6CC']].map(([l, v, c]) => <div key={l as string} className="row between" style={{ gap: 20 }}><span className="row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: c as string }} />{l}</span><b>{v}</b></div>)}</div></div>
        <div className="row between" style={{ marginTop: 16 }}><span className="muted small">Storage occupancy</span><b>{occ} / {slots.length} slots · {((occ / slots.length) * 100).toFixed(1)}%</b></div><div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${(occ / slots.length) * 100}%` }} /></div></Card>
    </div>
    <div className="grid g-main2">
      <Card flush title="Recent receiving activity" sub="Latest arrivals and their current state" action={<button className="btn link" onClick={() => go('packages')}>All packages →</button>}>
        <div className="tw"><table><thead><tr><th>Package</th><th>Recipient</th><th>Received · UTC</th><th>Status</th></tr></thead><tbody>
          {[...P].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0, 5).map(p => <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => go('tracking', p.id)}><td className="mono">{p.id}</td><td>{who(p.recipientId)}</td><td>{fmt(p.receivedAt)}</td><td><StatusBadge status={p.status} /></td></tr>)}</tbody></table></div></Card>
      <Card title="Quick actions"><button className="qa" onClick={() => go('receive')}><span><PackagePlus size={17} />Register an arrival</span><ArrowUpRight size={15} /></button>
        <button className="qa" onClick={() => go('tracking')}><span><ScanLine size={17} />Find a package</span><ArrowUpRight size={15} /></button>
        <button className="qa" onClick={() => go('claims')}><span><ClipboardCheck size={17} />Review claims</span><ArrowUpRight size={15} /></button>
        <p className="muted small">{un.length} package needs a storage assignment.<br />{overdue.length} unclaimed packages are overdue.</p></Card>
    </div>
    <Card flush title="Recent claims" action={<button className="btn link" onClick={() => go('claims')}>Claim history →</button>}>
      <div className="tw"><table><thead><tr><th>Receipt</th><th>Package</th><th>Recipient</th><th>Completed · UTC</th><th>Verifier</th></tr></thead><tbody>
        {C.slice(0, 4).map(c => <tr key={c.id}><td className="mono">{c.receipt}</td><td className="mono">{c.packageId}</td><td>{who(c.recipientId)}</td><td>{fmt(c.at)}</td><td>{c.verifier}</td></tr>)}</tbody></table></div></Card>
  </div>;
}
