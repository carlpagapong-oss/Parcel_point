import { useState } from 'react';
import { Check, Printer, ShieldAlert, ClipboardCheck } from 'lucide-react';
import { useApp } from '../lib/store';
import { Alert, Badge, Card, Empty, Field, Input, PageHeader, Select, Skeleton, StatusBadge, Tabs, useLoading } from '../components/ui';
import { fmt, fmtFull, nowIso } from '../lib/format';
import { recipients, slotLabel } from '../data/officialData';
import { staffName } from '../components/Shell';
import type { Claim } from '../types';

const METHODS = ['Institution-issued ID · Visual check', 'Passport · Visual check', 'Recipient portal code · Staff confirmed'];
const PROOF = ['Recipient-signed collection acknowledgement', 'Staff-witnessed verbal acknowledgement'];

export function Receipt({ claim }: { claim: Claim }) {
  const { pkgOf, who } = useApp(); const p = pkgOf(claim.packageId);
  return <div className="receipt"><div className="row between"><h2>Collection receipt</h2><Badge tone="teal">Completed</Badge></div><p className="muted small">ParcelPoint · SDF01 · ParcelPoint operational records</p>
    <div style={{ margin: '14px 0' }}>{[['Receipt', claim.receipt], ['Claim', claim.id], ['Package', `${claim.packageId} · ${p?.courier}`], ['Tracking', p?.tracking ?? ''], ['Collected by', who(claim.recipientId)], ['Completed', fmtFull(claim.at)], ['Verified by', claim.verifier], ['Verification', `${claim.method} · •••• ${claim.ref}`], ['Proof reference', claim.proof]].map(([k, v]) => <div className="kv" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
    <p className="muted small">No identity document image is retained. Keep this receipt for your records.</p></div>;
}

export default function Claims() {
  const { state, param, who, slotOf, dispatch, toast, role, go } = useApp();
  const loading = useLoading('cl');
  const [tab, setTab] = useState<'queue' | 'done'>('queue'); const [active, setActive] = useState<string | null>(param && state.packages.find(p => p.id === param && p.status === 'ready') ? param : null);
  const [step, setStep] = useState(1); const [m, setM] = useState(METHODS[0]); const [ref, setRef] = useState(''); const [proof, setProof] = useState(PROOF[0]); const [ack, setAck] = useState(false); const [match, setMatch] = useState(true);
  const [busy, setBusy] = useState(false); const [receipt, setReceipt] = useState<Claim | null>(null); const [err, setErr] = useState('');
  if (loading) return <Skeleton rows={3} />;
  const queue = state.packages.filter(p => p.status === 'ready'); const pk = state.packages.find(p => p.id === active);
  const reset = () => { setActive(null); setStep(1); setRef(''); setAck(false); setMatch(true); setErr(''); setReceipt(null); };
  const confirm = () => {
    if (!pk) return; setBusy(true);
    setTimeout(() => { const n = state.claims.length + 1, id = String(n).padStart(3, '0');
      const claim: Claim = { id: `CL-${id}`, receipt: `RC-2026-${id}`, packageId: pk.id, recipientId: pk.recipientId, at: nowIso(), verifier: role === 'Administrator' ? 'Daniel Cho' : staffName(role), method: m, ref, proof: `SIG-${id}` };
      dispatch({ t: 'claim', claim }); setReceipt(claim); setBusy(false); toast('success', `${pk.id} claimed. Receipt ${claim.receipt} issued.`); }, 700);
  };
  if (receipt) return <div className="stack"><PageHeader title="Claim complete" sub={`${receipt.packageId} was released to ${who(receipt.recipientId)}.`} action={<div className="row noprint"><button className="btn" onClick={() => window.print()}><Printer size={16} />Print receipt</button><button className="btn primary" onClick={reset}>Back to claim queue</button></div>} />
    <Alert tone="ok" title="Handoff confirmed">Package set to Claimed, slot released, tracking event and notice recorded.</Alert><Receipt claim={receipt} /></div>;

  if (pk) {
    const s = slotOf(pk.slotId);
    return <div className="stack"><PageHeader title="Verify & process claim" sub={`${pk.id} / ${who(pk.recipientId)} · Review the identity check before releasing the package.`} />
      <div className="steps">{['Match package', 'Verify recipient', 'Review & confirm'].map((l, i) => <div key={l} className={`step ${step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''}`}>{i + 1} {l} {step > i + 1 && <Check size={14} style={{ verticalAlign: -2 }} />}</div>)}</div>
      <div className="grid g-main"><div className="stack">
        {step === 1 && <Card title="Match package" sub="Confirm the package the recipient is asking for"><div className="kv"><span>Package</span><b>{pk.id} · {pk.courier}</b></div><div className="kv"><span>Tracking</span><b>{pk.tracking}</b></div><div className="kv"><span>Description</span><b>{pk.description}</b></div><div className="kv"><span>Recipient</span><b>{who(pk.recipientId)} · {pk.recipientId}</b></div><div className="kv"><span>Retrieve from</span><b>{slotLabel(s)}</b></div></Card>}
        {step === 2 && <><Card title="Recipient identity check" sub={`Confirm the person collecting is ${who(pk.recipientId)} · ${pk.recipientId}`}><div className="grid g2">
          <Field label="Verification method *"><Select value={m} onChange={e => setM(e.target.value)} options={METHODS} /></Field>
          <Field label="Masked reference *" error={err} hint="Last four characters only. No full identity numbers."><Input bad={!!err} inputMode="numeric" maxLength={4} placeholder="•••• 4821" value={ref} onChange={e => { setRef(e.target.value); setErr(''); }} /></Field></div>
          <label className="row" style={{ marginTop: 14 }}><input type="checkbox" checked={match} onChange={e => setMatch(e.target.checked)} />Name and photo match the recipient on record</label></Card>
          {!match && <Alert tone="err" title="Validation state · Identity does not match">Stop the handoff and record an issue for authorized review. Do not mark claimed, release storage or create a receipt.</Alert>}
          <Card title="Proof of collection" sub="Required before the handoff can be completed"><Field label="Acknowledgement method *"><Select value={proof} onChange={e => setProof(e.target.value)} options={PROOF} /></Field>
            <label className="row" style={{ marginTop: 14 }}><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />Recipient reviewed package ID, condition and collection notice.</label></Card></>}
        {step === 3 && <Card title="Review & confirm" sub="Check everything before completing the handoff"><div className="kv"><span>Package</span><b>{pk.id}</b></div><div className="kv"><span>Recipient</span><b>{who(pk.recipientId)}</b></div><div className="kv"><span>Verification</span><b>{m} · •••• {ref}</b></div><div className="kv"><span>Proof</span><b>{proof}</b></div><div className="kv"><span>Verified by</span><b>{role === 'Administrator' ? 'Daniel Cho' : staffName(role)}</b></div></Card>}
      </div>
      <div className="stack"><Card title="Package to release"><Badge tone="blue">Ready to claim</Badge><div className="kv" style={{ marginTop: 8 }}><span>Package / courier</span><b>{pk.id} / {pk.courier}</b></div><div className="kv"><span>Tracking number</span><b>{pk.tracking}</b></div><div className="kv"><span>Received</span><b>{fmtFull(pk.receivedAt)}</b></div><div className="kv"><span>Assignment before claim</span><b>{slotLabel(s)}</b></div></Card>
        <Card title="Confirm handoff" sub="One atomic completion · Proposed workflow">{['Create claim and receipt', 'Set package to Claimed', `Release slot ${s ? `${s.shelf} / ${s.slot}` : ''}`, 'Record tracking event and notice'].map(t => <div key={t} className="row small" style={{ padding: '3px 0' }}><Check size={15} color="var(--teal)" />{t}</div>)}
          <div className="stack" style={{ marginTop: 14, gap: 8 }}>
            {step < 3 ? <button className="btn primary" disabled={step === 2 && (!match || !ack)} onClick={() => { if (step === 2 && !/^\w{4}$/.test(ref)) { setErr('Enter exactly the last four characters.'); return; } setStep(step + 1); }}>Continue</button>
              : <button className="btn primary" disabled={busy} onClick={confirm}><ClipboardCheck size={16} />{busy ? 'Completing…' : 'Confirm verified handoff'}</button>}
            {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}<button className="btn" onClick={reset}>Cancel without changes</button></div></Card></div></div></div>;
  }
  return <div className="stack"><PageHeader title="Package claims" sub="Verify identity and hand packages to their recipients." />
    <Tabs value={tab} onChange={setTab} tabs={[{ key: 'queue', label: `Claim queue · ${queue.length}` }, { key: 'done', label: `Completed · ${state.claims.length}` }]} />
    {tab === 'queue' ? <Card flush>{queue.length === 0 ? <Empty title="The queue is clear">Packages that are ready to claim will appear here.</Empty> : <div className="tw"><table><thead><tr><th>Package</th><th>Recipient</th><th>Location</th><th>Waiting since</th><th>Status</th><th /></tr></thead><tbody>
      {queue.map(p => { const s = slotOf(p.slotId); return <tr key={p.id}><td className="mono">{p.id}</td><td>{who(p.recipientId)}</td><td>{s ? `${s.shelf} / ${s.slot}` : '—'}</td><td>{fmt(p.receivedAt)}</td><td><StatusBadge status={p.status} /></td><td className="right"><button className="btn sm primary" onClick={() => { setActive(p.id); setStep(1); }}>Process claim</button></td></tr>; })}</tbody></table></div>}</Card>
      : <Card flush><div className="tw"><table><thead><tr><th>Receipt</th><th>Package</th><th>Recipient</th><th>Completed</th><th>Verifier</th><th /></tr></thead><tbody>{state.claims.map(c => <tr key={c.id}><td className="mono">{c.receipt}</td><td className="mono">{c.packageId}</td><td>{who(c.recipientId)}</td><td>{fmt(c.at)}</td><td>{c.verifier}</td><td className="right"><button className="btn sm" onClick={() => setReceipt(c)}>View receipt</button></td></tr>)}</tbody></table></div></Card>}
    {role === 'Receiving Staff' && <Alert tone="warn" title="Claim processing is restricted"><span className="small">Switch to Claiming Staff to complete handoffs.</span></Alert>}
    <p className="muted small"><ShieldAlert size={0} />Recipients on record: {recipients.length}. <button className="btn link small" onClick={() => go('recipients')}>Open directory</button></p></div>;
}
