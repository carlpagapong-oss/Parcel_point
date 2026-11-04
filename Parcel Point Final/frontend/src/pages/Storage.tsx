import { useMemo, useState } from 'react';
import { Plus, Warehouse, Grid3x3, PackageSearch, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { useApp } from '../lib/store';
import { Alert, Badge, Card, Field, Modal, PageHeader, Select, Skeleton, Stat, useLoading, Input } from '../components/ui';
import { rooms, slotLabel, slots } from '../data/officialData';
import { fmt } from '../lib/format';
import { staffName } from '../components/Shell';

export default function Storage() {
  const { state, param, go, who, dispatch, toast, role } = useApp();
  const loading = useLoading('st');
  const startRoom = slots.find(s => s.id === state.packages.find(p => p.id === param)?.slotId);
  const [room, setRoom] = useState(startRoom ? `${startRoom.building}/${startRoom.floor}/${startRoom.room}` : rooms[0].key);
  const [sel, setSel] = useState<string | null>(startRoom?.id ?? 'Hub A/1/Receiving/B/03');
  const [dest, setDest] = useState(''); const [reason, setReason] = useState(''); const [blocked, setBlocked] = useState(false); const [add, setAdd] = useState(false);
  const occ = useMemo(() => new Map(state.packages.filter(p => p.slotId).map(p => [p.slotId!, p])), [state.packages]);
  if (loading) return <Skeleton rows={2} />;
  const [b, f, rm] = room.split('/'); const here = slots.filter(s => `${s.building}/${s.floor}/${s.room}` === room);
  const shelves = [...new Set(here.map(s => s.shelf))]; const total = occ.size; const needs = state.packages.filter(p => p.status === 'unassigned');
  const cur = sel ? slots.find(s => s.id === sel) : undefined; const pk = sel ? occ.get(sel) : undefined;
  const freeSlots = slots.filter(s => !occ.has(s.id));
  const confirm = () => {
    if (!pk || !dest) return; const d = occ.get(dest);
    if (d) { setBlocked(true); return; } if (reason.trim().length < 3) { toast('error', 'A reason is required to transfer a package.'); return; }
    dispatch({ t: 'assign', id: pk.id, slotId: dest, by: staffName(role), note: `${reason} · ${slotLabel(cur)} → ${slotLabel(slots.find(s => s.id === dest))}` });
    toast('success', `${pk.id} moved to ${slotLabel(slots.find(s => s.id === dest))}.`); setSel(dest); setDest(''); setReason(''); setBlocked(false);
  };
  return <div className="stack">
    <PageHeader title="Storage locations" sub="A spatial view of capacity, assignments and movement." action={<button className="btn primary" onClick={() => setAdd(true)}><Plus size={17} />Review new location</button>} />
    <div className="grid g3"><Stat label="Occupied slots" value={`${total} / ${slots.length}`} note={`${((total / slots.length) * 100).toFixed(1)}% occupancy · Recorded inventory`} icon={<Warehouse size={18} />} />
      <Stat label="Available slots" value={slots.length - total} note="One package per slot in this facility" icon={<Grid3x3 size={18} />} tone="var(--teal)" />
      <Stat label="Needs assignment" value={needs.length} note={needs.map(p => `${p.id} · ${who(p.recipientId)}`).join(', ') || 'All packages assigned'} icon={<PackageSearch size={18} />} tone="#D98E04" /></div>
    <div className="grid g-main">
      <Card title={`${b} / Floor ${f} / ${rm}`} sub="Recorded storage layout · Schematic, not a geographic map">
        <div className="row" style={{ marginBottom: 14 }}><div style={{ width: 280 }}><Select aria-label="Building, floor and room" value={room} onChange={e => { setRoom(e.target.value); setSel(null); }} options={rooms.map(r => ({ v: r.key, l: `${r.building} › Floor ${r.floor} › ${r.room}` }))} /></div></div>
        {shelves.map((sh, i) => { const ss = here.filter(s => s.shelf === sh); return <div key={sh}>
          {i > 0 && <div className="muted small" style={{ background: 'var(--bg)', textAlign: 'center', padding: 8, borderRadius: 8, margin: '14px 0' }}>RECEIVING AISLE · STAFF ACCESS</div>}
          <div className="row between" style={{ margin: '4px 0 10px' }}><h3>Shelf {sh}</h3><span className="muted small">{ss.filter(s => occ.has(s.id)).length} of {ss.length} slots occupied</span></div>
          <div className="slots">{ss.map(s => { const p = occ.get(s.id); return <button key={s.id} className={`slot ${p ? 'occ' : ''} ${sel === s.id ? 'sel' : ''} ${dest === s.id ? 'pick' : ''}`} aria-pressed={sel === s.id} onClick={() => { if (dest !== '' || (cur && pk && !p)) { setDest(s.id); setBlocked(!!p); } else setSel(s.id); }} onDoubleClick={() => setSel(s.id)}><span className="small">{s.shelf} / {s.slot}</span>{p ? <><Warehouse size={16} /><span className="small">{p.id}</span></> : <span className="small">Available</span>}</button>; })}</div></div>; })}
        <div className="row" style={{ marginTop: 16 }}><Badge tone="blue">Occupied</Badge><Badge>Available</Badge><span className="muted small">Selected: {cur ? `${cur.shelf} / ${cur.slot}` : 'none'} · Click an empty slot after selecting a package to set it as transfer destination</span></div>
      </Card>
      <div className="stack">
        <Card title={cur ? `${cur.shelf} / ${cur.slot}` : 'No slot selected'} sub="Selected slot · Capacity 1 package">
          {!cur ? <p className="muted">Select a slot to see its assignment.</p> : pk ? <><Badge tone="teal">Staff-recorded assignment</Badge><div className="kv" style={{ marginTop: 8 }}><span>Assigned package</span><b>{pk.id} · {who(pk.recipientId)}</b></div><div className="kv"><span>Recorded by</span><b>{pk.assignedBy} · {pk.assignedAt && fmt(pk.assignedAt)}</b></div><div className="kv"><span>Hierarchy</span><b>{slotLabel(cur)}</b></div>
            <button className="btn" style={{ marginTop: 8 }} onClick={() => go('tracking', pk.id)}><ArrowUpRight size={15} />Open tracking</button></> : <><Badge>Available</Badge><p className="muted small" style={{ marginTop: 8 }}>{slotLabel(cur)} is empty.</p></>}</Card>
        {pk && <Card title="Review transfer" sub="Existing assignment stays unchanged until confirmed">
          <div className="stack" style={{ gap: 12 }}><Field label="Destination"><Select value={dest} onChange={e => { setDest(e.target.value); setBlocked(false); }} options={[{ v: '', l: 'Choose destination slot…' }, ...slots.filter(s => s.id !== sel).map(s => ({ v: s.id, l: `${slotLabel(s)}${occ.has(s.id) ? ' (occupied)' : ''}` }))]} /></Field>
            <Field label="Reason *"><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Improve shelf accessibility" /></Field>
            <p className="muted small">Confirming assigns the destination, releases {cur?.shelf} / {cur?.slot} and adds a timestamped staff event.</p>
            <div className="row"><button className="btn" onClick={() => { setDest(''); setReason(''); setBlocked(false); }}>Cancel</button><button className="btn primary" disabled={!dest} onClick={confirm}>Confirm transfer</button></div></div></Card>}
        {(blocked || (dest && occ.get(dest))) && <Alert tone="err" title="Blocked destination"><span className="small">{dest && slots.find(s => s.id === dest)?.shelf} / {dest.split('/')[4]} already holds {occ.get(dest)?.id}. Capacity validation blocks an assignment until another available slot is selected.</span></Alert>}
      </div></div>
    <Card flush title="Assignment & transfer history" sub="All packages with a storage movement · All times UTC"><div className="tw"><table><thead><tr><th>Recorded</th><th>Package</th><th>Movement</th><th>Staff</th></tr></thead><tbody>
      {state.packages.flatMap(p => p.events.filter(e => /storage|slot|Transferred|shelf/i.test(e.title)).map(e => ({ p, e }))).sort((a, c) => c.e.at.localeCompare(a.e.at)).slice(0, 6).map(({ p, e }, i) => <tr key={i}><td className="mono">{fmt(e.at)}</td><td className="mono">{p.id}</td><td>{e.title} · <span className="muted small">{e.note}</span></td><td>{e.by}</td></tr>)}</tbody></table></div></Card>
    {add && <Modal title="Review new location" onClose={() => setAdd(false)}><div className="stack"><Alert tone="info" title="Preview only"><span className="small">New buildings and rooms are configured by an administrator. This prototype does not change the layout.</span></Alert>
      <div className="grid g2"><Field label="Building"><Input placeholder="Hub C" /></Field><Field label="Floor"><Input placeholder="1" /></Field><Field label="Room"><Input placeholder="Cold storage" /></Field><Field label="Shelves × slots"><Input placeholder="3 × 6" /></Field></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => setAdd(false)}>Cancel</button><button className="btn primary" onClick={() => { setAdd(false); toast('success', 'Location request submitted for review (completed).'); }}>Submit for review</button></div></div></Modal>}
    <p className="muted small"><ShieldAlert size={0} />{freeSlots.length} slots free across the facility.</p>
  </div>;
}
