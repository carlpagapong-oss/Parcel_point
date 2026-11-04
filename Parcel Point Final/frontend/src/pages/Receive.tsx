import { useMemo, useState } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import { useApp } from '../lib/store';
import { Alert, Card, Field, Input, PageHeader, Select, Badge } from '../components/ui';
import { couriers, recipients, rooms, sizes, slotLabel, slots } from '../data/mock';
import { nowIso } from '../lib/format';
import type { Pkg } from '../types';
import { staffName } from '../components/Shell';

const blank = { recipient: '', courier: couriers[0], tracking: '', description: '', size: 'Medium', room: '', shelf: '', slot: '', defer: false };
export default function Receive() {
  const { state, dispatch, toast, go, role } = useApp();
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Pkg | null>(null);
  const set = (k: keyof typeof blank, v: string | boolean) => setF(p => ({ ...p, [k]: v }));
  const taken = useMemo(() => new Set(state.packages.map(p => p.slotId).filter(Boolean)), [state.packages]);
  const free = slots.filter(s => `${s.building}/${s.floor}/${s.room}` === f.room && !taken.has(s.id));
  const shelves = [...new Set(free.map(s => s.shelf))], slotOpts = free.filter(s => s.shelf === f.shelf);
  const next = `PP-${1028 + state.packages.length - 8}`;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.recipient) e.recipient = 'Choose the recipient this package is for.';
    if (!/^[A-Z]{2}-\d{10}$/.test(f.tracking.trim())) e.tracking = 'Use the courier format, e.g. NL-2600001028.';
    else if (state.packages.some(p => p.tracking === f.tracking.trim())) e.tracking = 'This tracking number is already registered.';
    if (!f.description.trim()) e.description = 'Add a short description of the package.';
    if (!f.defer && (!f.room || !f.shelf || !f.slot)) e.slot = 'Select a room, shelf and slot, or assign storage later.';
    setErr(e); if (Object.keys(e).length) { toast('error', 'Fix the highlighted fields to register the package.'); return; }
    const sid = f.defer ? null : `${f.room}/${f.shelf}/${f.slot}`, at = nowIso(), by = staffName(role);
    const pkg: Pkg = { id: next, tracking: f.tracking.trim(), recipientId: f.recipient, courier: f.courier, description: f.description.trim(), size: f.size, receivedAt: at, status: sid ? 'ready' : 'unassigned', slotId: sid, assignedAt: sid ? at : undefined, assignedBy: sid ? by : undefined,
      noticeId: sid ? `N-0${state.notices.length + 22}` : undefined,
      events: [{ title: 'Received at facility', at, by, note: `${next} registered by receiving staff.` }, ...(sid ? [{ title: 'Ready to claim', at, by, note: `Stored at ${slotLabel(slots.find(s => s.id === sid))}.`, tone: 'teal' as const }] : [])],
      transit: [{ title: 'Delivered to facility', at, source: `Sample ${f.courier} event · Facility handoff. Staff receipt recorded separately`, tone: 'teal' }] };
    dispatch({ t: 'receive', pkg, notice: sid ? { id: pkg.noticeId!, kind: 'Arrival', title: 'Your package is ready', body: `${next} is ready for collection.`, at, recipientId: f.recipient, packageId: next, read: false } : undefined });
    toast('success', `${next} registered${sid ? ' and stored' : ' · awaiting assignment'}.`); setDone(pkg); setF(blank);
  };

  if (done) return <div className="stack"><PageHeader title="Receive package" sub="Register an arrival and assign its physical storage slot." />
    <Card><div className="empty"><CheckCircle2 size={36} color="var(--teal)" /><b style={{ fontSize: 18 }}>{done.id} registered</b>
      <p>{done.slotId ? <>Stored at <b>{slotLabel(slots.find(s => s.id === done.slotId))}</b>. The recipient was notified.</> : 'No storage slot yet. Assign one from Storage Locations.'}</p>
      <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}><button className="btn primary" onClick={() => go('tracking', done.id)}>Open tracking</button><button className="btn" onClick={() => setDone(null)}>Register another</button></div></div></Card></div>;

  return <div className="stack"><PageHeader title="Receive package" sub="Register an arrival and assign its physical storage slot." action={<Badge tone="blue">Next ID · {next}</Badge>} />
    <div className="grid g-main">
      <Card title="Package details" sub="Fields marked * are required">
        <div className="grid g2">
          <Field label="Recipient *" error={err.recipient}><Select value={f.recipient} onChange={e => set('recipient', e.target.value)} options={[{ v: '', l: 'Select recipient…' }, ...recipients.map(r => ({ v: r.id, l: `${r.name} · ${r.id}` }))]} /></Field>
          <Field label="Courier *"><Select value={f.courier} onChange={e => set('courier', e.target.value)} options={couriers} /></Field>
          <Field label="Tracking number *" error={err.tracking} hint="Printed on the courier label"><Input bad={!!err.tracking} placeholder="NL-2600001028" value={f.tracking} onChange={e => set('tracking', e.target.value.toUpperCase())} /></Field>
          <Field label="Size"><Select value={f.size} onChange={e => set('size', e.target.value)} options={sizes} /></Field>
        </div>
        <div style={{ marginTop: 16 }}><Field label="Description *" error={err.description}><textarea className={`input ${err.description ? 'bad' : ''}`} rows={3} placeholder="e.g. Sealed cardboard box · books" value={f.description} onChange={e => set('description', e.target.value)} /></Field></div>
      </Card>
      <Card title="Storage assignment" sub="Building → Floor → Room → Shelf → Slot">
        <div className="stack" style={{ gap: 12 }}>
          <label className="row small"><input type="checkbox" checked={f.defer} onChange={e => set('defer', e.target.checked)} />Assign storage later</label>
          <Field label="Room *"><Select disabled={f.defer} value={f.room} onChange={e => setF(p => ({ ...p, room: e.target.value, shelf: '', slot: '' }))} options={[{ v: '', l: 'Select room…' }, ...rooms.map(r => ({ v: r.key, l: `${r.building} / Floor ${r.floor} / ${r.room}` }))]} /></Field>
          <div className="grid g2"><Field label="Shelf *"><Select disabled={f.defer || !f.room} value={f.shelf} onChange={e => setF(p => ({ ...p, shelf: e.target.value, slot: '' }))} options={[{ v: '', l: 'Shelf' }, ...shelves.map(s => ({ v: s, l: `Shelf ${s}` }))]} /></Field>
            <Field label="Slot *"><Select disabled={f.defer || !f.shelf} value={f.slot} onChange={e => set('slot', e.target.value)} options={[{ v: '', l: 'Slot' }, ...slotOpts.map(s => ({ v: s.slot, l: s.slot }))]} /></Field></div>
          {err.slot && <span className="err small" style={{ color: 'var(--red)' }}>{err.slot}</span>}
          <div className="alert info"><MapPin size={18} style={{ flex: 'none' }} /><div><b>{f.slot ? `${f.room.replaceAll('/', ' / ')} / ${f.shelf} / ${f.slot}` : 'No slot selected'}</b><span className="muted small">{f.room && `${free.length} free slots in this room`}</span></div></div>
          {f.room && free.length === 0 && <Alert tone="err" title="Room is full">Pick another room or assign storage later.</Alert>}
        </div>
      </Card></div>
    <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => { setF(blank); setErr({}); }}>Clear form</button><button className="btn primary" onClick={submit}>Register package</button></div></div>;
}
