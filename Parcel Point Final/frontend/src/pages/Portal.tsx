import { useState } from 'react';
import { Bell, ArrowUpRight, Package, Receipt as ReceiptIcon, Warehouse, Info, ArrowLeft } from 'lucide-react';
import { useApp } from '../lib/store';
import { Badge, Card, Empty, StatusBadge, useLoading, Skeleton } from '../components/ui';
import { Timeline } from './Tracking';
import { Receipt } from './Claims';
import { fmt, fmtFull } from '../lib/format';
import { slotLabel } from '../data/mock';

export default function Portal() {
  const { state, go, slotOf, dispatch } = useApp(); const loading = useLoading('portal');
  const [tab, setTab] = useState<'pk' | 'trk' | 'nt'>('pk'); const [q, setQ] = useState(''); const [sel, setSel] = useState('PP-1027'); const ME = 'R-001';
  if (loading) return <div className="content"><Skeleton rows={2} /></div>;
  const mine = state.packages.filter(p => p.recipientId === ME && `${p.id} ${p.tracking}`.toLowerCase().includes(q.toLowerCase())); const ready = state.packages.filter(p => p.recipientId === ME && p.status === 'ready');
  const nts = state.notices.filter(n => n.recipientId === ME); const claims = state.claims.filter(c => c.recipientId === ME); const cur = state.packages.find(p => p.id === sel && p.recipientId === ME) ?? mine[0];
  return <div className="page-fade"><header className="portal-top"><b style={{ fontSize: 20 }} className="row"><Package size={22} color="var(--blue)" />ParcelPoint</b>
    <nav>{([['pk', 'My packages'], ['trk', 'Tracking'], ['nt', 'My notifications']] as const).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav><span style={{ flex: 1 }} />
    <button className="btn sm" onClick={() => go('dashboard')}><ArrowLeft size={14} />Staff view</button><button className="iconbtn" aria-label="Notifications" onClick={() => setTab('nt')}><Bell size={19} /></button><span className="avatar">MC</span></header>
    <div className="content" style={{ maxWidth: 1100 }}><div className="stack">
      <div><h1>Good morning, Maya.</h1><p className="muted">Your deliveries, from arrival to collection. Only your packages are shown.</p></div>
      {tab === 'pk' && <>
        <div className="card navy hero"><div><Badge tone="teal">{ready.length ? 'Ready to claim' : 'All clear'}</Badge><h1 style={{ margin: '10px 0 6px', fontSize: 30 }}>{ready.length ? 'A package is waiting for you.' : 'Nothing to collect right now.'}</h1><p className="muted">{ready.length ? `${ready[0].id} arrived today. Bring your identity document for a staff-verified handoff.` : 'We will notify you when a package arrives.'}</p>
          {ready.length > 0 && <button className="btn primary" style={{ marginTop: 16 }} onClick={() => { setSel(ready[0].id); setTab('trk'); }}><ArrowUpRight size={16} />View package tracking</button>}</div>
          <div className="big"><div>{String(ready.length).padStart(2, '0')}</div><p>Ready package</p><p className="muted small">{claims.length ? `${claims.length} completed` : 'No completed claims yet'}</p></div></div>
        <div className="iw"><input className="input" style={{ paddingLeft: 14 }} placeholder="Search my packages by tracking number" value={q} onChange={e => setQ(e.target.value)} aria-label="Search my packages" /></div>
        <div className="grid g-main2"><div className="stack">{mine.length === 0 ? <Card><Empty title="No packages found">Check the tracking number. Only your own records are searchable.</Empty></Card> : mine.map(p => { const s = slotOf(p.slotId); return <Card key={p.id}><div className="row between"><div><h2>{p.id} · {p.courier}</h2><p className="muted small">{p.tracking} · {p.size} {p.description}</p></div><button className="btn link" onClick={() => { setSel(p.id); setTab('trk'); }}>View tracking →</button></div>
            <div className="grid g2" style={{ margin: '12px 0' }}><div><span className="muted small">Received</span><br /><b>{fmtFull(p.receivedAt)}</b></div><div className="row between"><div><span className="muted small">Status</span><br /><StatusBadge status={p.status} /></div></div></div>
            {s && <div className="alert info"><Warehouse size={18} style={{ flex: 'none' }} /><div><b>Staff retrieval location</b><span className="small">Building {s.building} / Floor {s.floor} / Room {s.room} / Shelf {s.shelf} / Slot {s.slot}</span><br /><span className="muted small">Recorded by {p.assignedBy} · Not verified inventory</span></div></div>}
            {p.status === 'ready' && <div className="alert info" style={{ marginTop: 10 }}><Info size={18} style={{ flex: 'none' }} /><div><b>Identity check required at collection</b><span className="small">Staff verify your identity before release. You cannot mark a package claimed from this portal.</span></div></div>}</Card>; })}
          <Card title="My receipts">{claims.length ? claims.map(c => <Receipt key={c.id} claim={c} />) : <div className="row" style={{ gap: 14 }}><ReceiptIcon size={28} color="var(--muted)" /><div><b>No collection receipts yet</b><p className="muted small">Your printable receipt appears after a verified handoff.</p></div></div>}</Card></div>
          <div className="stack"><Card title="My latest notification">{nts[0] ? <><Badge tone={nts[0].read ? 'gray' : 'blue'}>{nts[0].read ? 'Read' : 'Unread'} · {nts[0].kind}</Badge><h3 style={{ margin: '10px 0 4px' }}>{nts[0].title}</h3><p className="muted small">{nts[0].body}</p><p className="muted small" style={{ margin: '8px 0' }}>{nts[0].id} · {fmt(nts[0].at)} UTC</p><button className="btn link small" onClick={() => setTab('nt')}>View my notifications →</button></> : <Empty title="No notifications" />}</Card>
            <Card title="Before you collect">{['Bring an identity document', `Give staff package ID ${ready[0]?.id ?? ''}`, 'Review and acknowledge the handoff'].map((t, i) => <div key={t} className="row" style={{ padding: '5px 0' }}><Badge tone="blue">{i + 1}</Badge>{t}</div>)}<p className="muted small" style={{ marginTop: 8 }}>No ID images are stored.</p></Card></div></div></>}
      {tab === 'trk' && (cur ? <div className="stack"><div className="row">{mine.map(p => <button key={p.id} className={`btn sm ${cur.id === p.id ? 'primary' : ''}`} onClick={() => setSel(p.id)}>{p.id}</button>)}</div>
        <Card title="Where is my package?" sub={`${cur.id} · ${cur.tracking}`}><div className="alert info" style={{ marginBottom: 16 }}><Warehouse size={18} style={{ flex: 'none' }} /><div><b>Physical storage location</b><span className="small">{cur.slotId ? slotLabel(slotOf(cur.slotId)) : cur.status === 'claimed' ? 'Collected. No longer in storage.' : 'Awaiting staff assignment'}</span></div></div>
          <h3 style={{ marginBottom: 10 }}>Facility history</h3><Timeline items={cur.events} /><h3 style={{ margin: '6px 0 10px' }}>Courier transit (sample)</h3><Timeline items={cur.transit.map(t => ({ title: t.title, at: t.at, note: t.source, tone: t.tone }))} /></Card></div> : <Card><Empty title="No package selected" /></Card>)}
      {tab === 'nt' && <Card flush title="My notifications">{nts.length === 0 ? <Empty title="No notifications" /> : nts.map(n => <div key={n.id} className="row between" style={{ padding: '14px 20px', borderTop: '1px solid var(--line)' }}><div><b>{n.title}</b><p className="muted small">{n.body} · {fmt(n.at)} UTC</p></div>{!n.read && <button className="btn sm" onClick={() => dispatch({ t: 'read', id: n.id })}>Mark read</button>}</div>)}</Card>}
      <p className="muted small">Recipient access · Own packages, tracking, receipts and notifications only. No administrative directories or storage controls.</p></div></div></div>;
}
