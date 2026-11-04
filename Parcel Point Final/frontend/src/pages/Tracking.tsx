import { useEffect, useState } from 'react';
import { ScanLine, Search, Warehouse, Info, MapPinOff } from 'lucide-react';
import { useApp } from '../lib/store';
import { Alert, Badge, Card, PageHeader, Skeleton, StatusBadge, useLoading } from '../components/ui';
import { fmt, fmtFull } from '../lib/format';
import type { Pkg } from '../types';
import { recipients } from '../data/mock';

export const Timeline = ({ items }: { items: { title: string; at: string; note: string; tone?: 'blue' | 'teal' }[] }) => (
  <ol className="tl">{items.map((e, i) => <li key={i}><span className={`pt ${e.tone === 'teal' ? 'teal' : ''}`} /><div className="t">{e.title}</div><div className="w">{fmt(e.at)} UTC</div><div className="n">{e.note}</div></li>)}</ol>);

export function LocationCard({ pkg, dark = true }: { pkg: Pkg; dark?: boolean }) {
  const { slotOf } = useApp(); const s = slotOf(pkg.slotId);
  const rows: [string, string | undefined][] = [['Building', s?.building], ['Floor', s?.floor], ['Room', s?.room], ['Shelf', s?.shelf], ['Slot', s?.slot]];
  const claimed = pkg.status === 'claimed';
  return <section className={`card ${dark && s ? 'navy' : ''}`}>
    <div className="row" style={{ marginBottom: 10 }}>{s ? <Warehouse size={18} /> : <MapPinOff size={18} />}<h2>Physical storage location</h2></div>
    {s ? <Badge tone="teal">Staff-recorded assignment</Badge> : <Badge tone="amber">{claimed ? 'Released after claim' : 'Awaiting staff assignment'}</Badge>}
    <div style={{ marginTop: 10 }}>{rows.map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b style={{ fontSize: k === 'Shelf' || k === 'Slot' ? 20 : 14 }}>{v ?? 'Not assigned'}</b></div>)}</div>
    {s ? <p className="small muted" style={{ marginTop: 8 }}>Assigned {pkg.assignedAt && fmtFull(pkg.assignedAt)}<br />Recorded by {pkg.assignedBy}<br />Demonstration only. Not verified inventory or GPS.</p>
      : <p className="small muted" style={{ marginTop: 8 }}>{claimed ? 'The package was handed over; its slot is free again.' : 'No location is inferred from courier events. Staff assignment is required.'}</p>}
  </section>;
}

export default function Tracking() {
  const { state, param, who, go, role } = useApp();
  const [q, setQ] = useState(param ?? 'NL-2600001027'); const [found, setFound] = useState<Pkg | null | undefined>(undefined); const [busy, setBusy] = useState(false);
  const loading = useLoading('trk');
  const lookup = (term: string) => { setBusy(true); setTimeout(() => { const t = term.trim().toLowerCase();
    setFound(t ? state.packages.find(p => p.id.toLowerCase() === t || p.tracking.toLowerCase() === t) ?? null : null); setBusy(false); }, 350); };
  useEffect(() => { if (!loading) { if (param) setQ(param); lookup(param ?? 'NL-2600001027'); } /* eslint-disable-next-line */ }, [loading, param]);
  // keep the found package in sync with store updates
  const live = found ? state.packages.find(p => p.id === found.id) ?? found : found;
  if (loading) return <Skeleton rows={2} />;
  const r = live && recipients.find(x => x.id === live.recipientId);
  const unassigned = state.packages.find(p => p.status === 'unassigned');
  return <div className="stack">
    <PageHeader title="Parcel tracking" sub="Follow courier milestones and facility handoffs without mixing their locations." />
    <Card><form onSubmit={e => { e.preventDefault(); lookup(q); }}><div className="field"><label htmlFor="trk">Package ID or tracking number</label>
      <div className="row"><div className="iw" style={{ flex: 1 }}><ScanLine size={16} /><input id="trk" className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="PP-1027 or NL-2600001027" /></div><button className="btn primary" type="submit" disabled={busy}><Search size={16} />{busy ? 'Searching…' : 'Find package'}</button></div></div></form>
      <div className="row small muted" style={{ marginTop: 10 }}>Try: {['PP-1027', 'PG-2600001022', 'PP-1024', 'PP-9999'].map(s => <button key={s} className="btn sm" onClick={() => { setQ(s); lookup(s); }}>{s}</button>)}</div></Card>
    {busy && <div className="skel" style={{ height: 220 }} />}
    {!busy && found === null && <Alert tone="warn" title="Lookup error · No matching package">If a lookup returns no record, confirm the identifier or contact receiving staff. No location or tracking event is created to fill missing data.</Alert>}
    {!busy && live && <>
      <Card><div className="row between" style={{ gap: 24 }}><div><h1 style={{ fontSize: 24 }}>{live.id}</h1><p className="muted small">{who(live.recipientId)} · {live.courier} · {live.tracking}</p></div><StatusBadge status={live.status} />
        <div><span className="muted small">Received at facility</span><br /><b>{fmtFull(live.receivedAt)}</b></div><div><span className="muted small">Latest event</span><br /><b>{fmtFull(live.events[live.events.length - 1].at)}</b></div></div></Card>
      <div className="grid g-main">
        <div className="stack">
          <Card title="Internal facility history" sub="Staff-recorded receiving, storage and readiness · Oldest first"><Timeline items={live.events} /></Card>
          <Card title="Courier transit history" sub="Sample courier events · Not a live feed · No GPS data"><Timeline items={live.transit.map(t => ({ title: t.title, at: t.at, note: `Source: ${t.source}`, tone: t.tone }))} /></Card>
          <Alert tone="info" title="Courier locations are not storage assignments">Transit labels describe sample courier milestones only. Building, Floor, Room, Shelf and Slot come exclusively from internal staff assignment records.</Alert>
        </div>
        <div className="stack">
          <LocationCard pkg={live} />
          <Card title="Package details"><div className="kv"><span>Recipient</span><b>{r?.name} · {r?.id}</b></div><div className="kv"><span>Description / size</span><b>{live.description} / {live.size}</b></div><div className="kv"><span>Arrival notification</span><b>{live.noticeId ?? 'Not sent yet'}</b></div>
            <div className="row" style={{ marginTop: 10 }}><button className="btn" onClick={() => go('recipients', live.recipientId)}>View recipient</button>{live.slotId && role !== 'Receiving Staff' && <button className="btn" onClick={() => go('claims', live.id)}>Start claim</button>}{live.slotId && role !== 'Claiming Staff' && <button className="btn" onClick={() => go('storage', live.id)}>Show on map</button>}</div></Card>
          {unassigned && unassigned.id !== live.id && <Card title={`Unassigned example · ${unassigned.id}`} sub={`${who(unassigned.recipientId)} · Received ${fmtFull(unassigned.receivedAt)}`}><LocationCard pkg={unassigned} dark={false} /><button className="btn" style={{ marginTop: 8 }} onClick={() => { setQ(unassigned.id); lookup(unassigned.id); }}>Track {unassigned.id}</button></Card>}
        </div></div></>}
    {!busy && found === undefined && <div className="row muted"><Info size={16} />Enter a package ID or tracking number to begin.</div>}
  </div>;
}
