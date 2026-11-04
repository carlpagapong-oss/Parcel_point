import { useState } from 'react';
import { useApp } from '../lib/store';
import { Avatar, Badge, Card, Field, Input, PageHeader, Select, Tabs, Toggle } from '../components/ui';
import type { Role } from '../types';

const PERMS = ['View dashboard', 'Receive packages', 'Manage storage', 'Process claims', 'View reports', 'Manage settings'];
const MATRIX: Record<Role, boolean[]> = { Administrator: [true, true, true, true, true, true], 'Claiming Staff': [true, false, false, true, false, false], 'Receiving Staff': [true, true, true, false, false, false] };
const USERS = [['Alex Morgan', 'Administrator'], ['Daniel Cho', 'Claiming Staff'], ['Elena Ruiz', 'Receiving Staff']] as const;

export default function Settings() {
  const { toast, collapsed, setCollapsed } = useApp(); const [tab, setTab] = useState<'profile' | 'roles' | 'ui'>('profile');
  const [name, setName] = useState('Alex Morgan'); const [email, setEmail] = useState('alex.morgan@sdf01.example'); const [m, setM] = useState(MATRIX); const [dense, setDense] = useState(false); const [alerts, setAlerts] = useState(true); const [digest, setDigest] = useState(false);
  return <div className="stack"><PageHeader title="Settings" sub="User profiles, role permissions and interface preferences." />
    <Tabs value={tab} onChange={setTab} tabs={[{ key: 'profile', label: 'User profiles' }, { key: 'roles', label: 'Role permissions' }, { key: 'ui', label: 'Interface' }]} />
    {tab === 'profile' && <div className="grid g-main2"><Card title="My profile"><div className="grid g2"><Field label="Full name"><Input value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Email"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field></div><div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}><button className="btn primary" onClick={() => toast('success', 'Profile saved.')}>Save changes</button></div></Card>
      <Card title="Team">{USERS.map(([n, r]) => <div key={n} className="row between" style={{ padding: '8px 0' }}><span className="row"><Avatar name={n} /><span><b>{n}</b><br /><span className="muted small">{r}</span></span></span><Badge tone="teal">Active</Badge></div>)}</Card></div>}
    {tab === 'roles' && <Card flush title="Role permissions" sub="Locked modules show a lock in the sidebar"><div className="tw"><table><thead><tr><th>Permission</th>{(Object.keys(m) as Role[]).map(r => <th key={r}>{r}</th>)}</tr></thead><tbody>{PERMS.map((p, i) => <tr key={p}><td>{p}</td>{(Object.keys(m) as Role[]).map(r => <td key={r}><Toggle label={`${r}: ${p}`} on={m[r][i]} onChange={v => { setM({ ...m, [r]: m[r].map((x, j) => j === i ? v : x) }); toast('success', `${r}: ${p} ${v ? 'granted' : 'removed'}.`); }} /></td>)}</tr>)}</tbody></table></div></Card>}
    {tab === 'ui' && <Card title="Interface preferences"><div className="stack">{([['Collapse sidebar by default', collapsed, setCollapsed], ['Compact table density', dense, setDense], ['Show in-app package alerts', alerts, setAlerts], ['Daily email digest', digest, setDigest]] as const).map(([l, v, f]) => <div key={l} className="row between"><span>{l}</span><Toggle label={l} on={v} onChange={f} /></div>)}
      <Field label="Time display"><Select options={['UTC', 'Philippine Standard Time (UTC+8)']} /></Field></div></Card>}</div>;
}
