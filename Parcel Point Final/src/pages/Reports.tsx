import { useState } from 'react';
import { Download, FileText, Table2, Check, AlertTriangle } from 'lucide-react';
import { useApp } from '../lib/store';
import { Alert, BarChart, Card, Field, Modal, PageHeader, Select, Skeleton, Stat, useLoading } from '../components/ui';
import { dayKey } from '../lib/format';
import { couriers } from '../data/mock';

export default function Reports() {
  const { state, toast } = useApp(); const loading = useLoading('rp');
  const [range, setRange] = useState('20–27 Oct 2026'); const [ex, setEx] = useState(false); const [fmtSel, setFmt] = useState('CSV'); const [state2, setS] = useState<'idle' | 'busy' | 'done' | 'fail'>('idle'); const [fail, setFail] = useState(false);
  if (loading) return <Skeleton rows={2} />;
  const P = state.packages.filter(p => range === 'Last 3 days' ? Number(p.receivedAt.slice(8, 10)) >= 25 : range === 'Single day · 27 Oct' ? p.receivedAt.startsWith('2026-10-27') : true);
  const days = (range === 'Single day · 27 Oct' ? [27] : range === 'Last 3 days' ? [25, 26, 27] : [20, 21, 22, 23, 24, 25, 26, 27]).map(d => `${d} Oct`);
  const chart = days.map(d => ({ label: d.replace(' Oct', ''), a: P.filter(p => dayKey(p.receivedAt) === d).length, b: state.claims.filter(c => dayKey(c.at) === d).length }));
  const claimed = P.filter(p => p.status === 'claimed').length; const rate = P.length ? Math.round((claimed / P.length) * 100) : 0;
  const run = () => { setS('busy'); setTimeout(() => { if (fail) { setS('fail'); } else { setS('done'); toast('success', `${fmtSel} report exported (demo).`); } }, 900); };
  return <div className="stack"><PageHeader title="Reports" sub="Receiving, collection and storage performance." action={<button className="btn primary" onClick={() => { setEx(true); setS('idle'); }}><Download size={16} />Export report</button>} />
    <div className="row"><div style={{ width: 220 }}><Select aria-label="Date range" value={range} onChange={e => setRange(e.target.value)} options={['20–27 Oct 2026', 'Last 3 days', 'Single day · 27 Oct']} /></div><span className="muted small">All times UTC · Sample data</span></div>
    <div className="grid g4"><Stat label="Packages received" value={P.length} note={range} icon={<FileText size={18} />} /><Stat label="Collection rate" value={`${rate}%`} note={`${claimed} of ${P.length} claimed`} icon={<Check size={18} />} tone="var(--teal)" /><Stat label="Avg. time to claim" value="1.4 days" note="Claimed packages only" icon={<Table2 size={18} />} /><Stat label="Overdue" value={P.filter(p => p.status !== 'claimed' && Date.UTC(2026, 9, 27) - new Date(p.receivedAt).getTime() > 6 * 864e5).length} note="Unclaimed over 7 days" icon={<AlertTriangle size={18} />} tone="#D98E04" /></div>
    <div className="grid g-main2"><Card title="Daily activity" sub="Received vs claimed">{P.length === 0 ? <p className="muted">No data in this range.</p> : <BarChart data={chart} />}</Card>
      <Card title="By courier">{couriers.map(c => { const n = P.filter(p => p.courier === c).length; return <div key={c} style={{ marginBottom: 12 }}><div className="row between"><span>{c}</span><b>{n}</b></div><div className="bar"><i style={{ width: `${P.length ? (n / P.length) * 100 : 0}%`, background: 'var(--blue)' }} /></div></div>; })}</Card></div>
    {ex && <Modal title="Export report" onClose={() => setEx(false)}>{state2 === 'done' ? <div className="stack"><Alert tone="ok" title="Export ready">{fmtSel} file for {range} was generated (demo, no file is downloaded).</Alert><button className="btn primary" onClick={() => setEx(false)}>Done</button></div> :
      <div className="stack"><Field label="Format"><Select value={fmtSel} onChange={e => setFmt(e.target.value)} options={['CSV', 'PDF summary', 'Excel workbook']} /></Field><Field label="Range"><Select value={range} onChange={e => setRange(e.target.value)} options={['20–27 Oct 2026', 'Last 3 days', 'Single day · 27 Oct']} /></Field>
        <label className="row small"><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)} />Simulate an export failure (for demo)</label>
        {state2 === 'fail' && <Alert tone="err" title="Export failed">The report could not be generated. Check the range and try again.</Alert>}
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => setEx(false)}>Cancel</button><button className="btn primary" disabled={state2 === 'busy'} onClick={run}>{state2 === 'busy' ? 'Generating…' : state2 === 'fail' ? 'Retry export' : 'Export'}</button></div></div>}</Modal>}</div>;
}
