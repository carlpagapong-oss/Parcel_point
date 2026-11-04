import type { Claim, Notice, Pkg, Recipient, Slot, TransitEvent, FacilityEvent } from '../types';

export const recipients: Recipient[] = [
  { id: 'R-001', name: 'Maya Chen', email: 'maya.chen@campus.example', phone: '+63 917 000 0101', unit: 'Dorm 2 · Rm 214', notify: true },
  { id: 'R-002', name: 'Ava Patel', email: 'ava.patel@campus.example', phone: '+63 917 000 0102', unit: 'Dorm 1 · Rm 108', notify: true },
  { id: 'R-003', name: 'Noah Kim', email: 'noah.kim@campus.example', phone: '+63 917 000 0103', unit: 'Dorm 3 · Rm 320', notify: false },
  { id: 'R-004', name: 'Leo Santos', email: 'leo.santos@campus.example', phone: '+63 917 000 0104', unit: 'Dorm 2 · Rm 305', notify: true },
  { id: 'R-005', name: 'Isla Reed', email: 'isla.reed@campus.example', phone: '+63 917 000 0105', unit: 'Dorm 1 · Rm 112', notify: true },
  { id: 'R-006', name: 'Omar Ali', email: 'omar.ali@campus.example', phone: '+63 917 000 0106', unit: 'Dorm 3 · Rm 101', notify: true },
  { id: 'R-007', name: 'Zoe Park', email: 'zoe.park@campus.example', phone: '+63 917 000 0107', unit: 'Dorm 2 · Rm 210', notify: true },
  { id: 'R-008', name: 'Ethan Cole', email: 'ethan.cole@campus.example', phone: '+63 917 000 0108', unit: 'Dorm 1 · Rm 220', notify: false },
];

export const couriers = ['Northline', 'SwiftPost', 'ParcelGo'];
export const sizes = ['Small', 'Medium', 'Large', 'Oversized'];

const LAYOUT = [
  { building: 'Hub A', floor: '1', room: 'Receiving', shelves: ['A', 'B'] },
  { building: 'Hub A', floor: '2', room: 'Staging', shelves: ['C'] },
  { building: 'Hub B', floor: '1', room: 'Overflow', shelves: ['D'] },
];
export const slots: Slot[] = LAYOUT.flatMap(l => l.shelves.flatMap(shelf =>
  Array.from({ length: 6 }, (_, i) => {
    const slot = String(i + 1).padStart(2, '0');
    return { id: `${l.building}/${l.floor}/${l.room}/${shelf}/${slot}`, building: l.building, floor: l.floor, room: l.room, shelf, slot };
  })));
export const rooms = LAYOUT.map(l => ({ key: `${l.building}/${l.floor}/${l.room}`, ...l }));
export const slotLabel = (s?: Slot | null) => s ? `${s.building} / ${s.floor} / ${s.room} / ${s.shelf} / ${s.slot}` : 'Not assigned';

const T = (d: number, h: number, m: number) => new Date(Date.UTC(2026, 9, d, h, m)).toISOString();
const transit = (c: string, d: number, h: number, m: number): TransitEvent[] => [
  { title: 'Accepted by courier', at: T(d - 1, 8, 0), source: `Sample ${c} event · Origin sorting hub (courier label)` },
  { title: 'Out for delivery', at: T(d, h - 1, 30), source: `Sample ${c} event · Delivery route (courier label)` },
  { title: 'Delivered to facility', at: T(d, h, Math.max(m - 2, 0)), source: `Sample ${c} event · Facility handoff. Staff receipt recorded separately`, tone: 'teal' },
];
const ev = (title: string, at: string, by: string, note: string, tone?: 'blue' | 'teal'): FacilityEvent => ({ title, at, by, note, tone });
const pre = (c: string) => (c === 'Northline' ? 'NL' : c === 'SwiftPost' ? 'SP' : 'PG');

const mk = (n: number, rid: string, courier: string, desc: string, size: string, d: number, h: number, m: number, status: Pkg['status'], slot: string | null, extra: FacilityEvent[]): Pkg => {
  const id = `PP-10${n}`;
  return {
    id, tracking: `${pre(courier)}-26000010${n}`, recipientId: rid, courier, description: desc, size, receivedAt: T(d, h, m), status, slotId: slot,
    assignedBy: slot ? 'Elena Ruiz' : undefined, assignedAt: slot ? T(d, h, Math.min(m + 6, 59)) : undefined,
    events: [ev('Received at facility', T(d, h, m), 'Elena Ruiz', `${id} registered by receiving staff.`), ...extra],
    transit: transit(courier, d, h, m), noticeId: status === 'unassigned' ? undefined : `N-0${n}`,
  };
};

export const initialPackages: Pkg[] = [
  mk(27, 'R-001', 'Northline', 'Sealed cardboard box · books', 'Medium', 27, 9, 12, 'ready', 'Hub A/1/Receiving/B/03', [
    ev('Initial storage assigned', T(27, 9, 18), 'Elena Ruiz', 'Sample assignment: Hub A / 1 / Receiving / A / 01.'),
    ev('Transferred to shelf B, slot 03', T(27, 10, 5), 'Elena Ruiz', 'Assignment updated; A / 01 released.'),
    ev('Ready to claim', T(27, 10, 8), 'Elena Ruiz', 'Arrival notification N-027 recorded for Maya Chen.', 'teal')]),
  mk(26, 'R-002', 'SwiftPost', 'Padded mailer · electronics', 'Small', 27, 8, 45, 'ready', 'Hub A/1/Receiving/A/02', [
    ev('Storage assigned', T(27, 8, 52), 'Elena Ruiz', 'Hub A / 1 / Receiving / A / 02.'), ev('Ready to claim', T(27, 8, 55), 'Elena Ruiz', 'Arrival notification N-026 recorded.', 'teal')]),
  mk(25, 'R-003', 'Northline', 'Flat parcel · documents', 'Small', 25, 11, 30, 'ready', 'Hub A/1/Receiving/A/05', [
    ev('Storage assigned', T(25, 11, 36), 'Elena Ruiz', 'Hub A / 1 / Receiving / A / 05.'), ev('Ready to claim', T(25, 11, 40), 'Elena Ruiz', 'Arrival notification N-025 recorded.', 'teal')]),
  mk(24, 'R-004', 'ParcelGo', 'Tube package · posters', 'Large', 26, 14, 20, 'claimed', null, [
    ev('Storage assigned', T(26, 14, 26), 'Elena Ruiz', 'Hub A / 1 / Receiving / A / 06.'), ev('Ready to claim', T(26, 14, 30), 'Elena Ruiz', 'Arrival notification N-024 recorded.'),
    ev('Claimed', T(27, 10, 42), 'Daniel Cho', 'Verified handoff. Receipt RC-2026-003 issued; A / 06 released.', 'teal')]),
  mk(23, 'R-005', 'SwiftPost', 'Cardboard box · kitchenware', 'Medium', 20, 9, 10, 'ready', 'Hub A/1/Receiving/B/01', [
    ev('Storage assigned', T(20, 9, 16), 'Elena Ruiz', 'Hub A / 1 / Receiving / B / 01.'), ev('Ready to claim', T(20, 9, 20), 'Elena Ruiz', 'Arrival notification N-023 recorded.', 'teal')]),
  mk(22, 'R-006', 'ParcelGo', 'Soft bag · clothing', 'Small', 20, 8, 30, 'unassigned', null, []),
  mk(21, 'R-007', 'Northline', 'Boxed item · stationery', 'Small', 24, 16, 0, 'claimed', null, [
    ev('Claimed', T(26, 15, 30), 'Daniel Cho', 'Verified handoff. Receipt RC-2026-002 issued.', 'teal')]),
  mk(20, 'R-008', 'SwiftPost', 'Cardboard box · sports gear', 'Large', 23, 10, 0, 'claimed', null, [
    ev('Claimed', T(25, 12, 0), 'Daniel Cho', 'Verified handoff. Receipt RC-2026-001 issued.', 'teal')]),
];

const M1 = 'Institution-issued ID · Visual check';
export const initialClaims: Claim[] = [
  { id: 'CL-003', receipt: 'RC-2026-003', packageId: 'PP-1024', recipientId: 'R-004', at: T(27, 10, 42), verifier: 'Daniel Cho', method: M1, ref: '4821', proof: 'SIG-003' },
  { id: 'CL-002', receipt: 'RC-2026-002', packageId: 'PP-1021', recipientId: 'R-007', at: T(26, 15, 30), verifier: 'Daniel Cho', method: M1, ref: '7710', proof: 'SIG-002' },
  { id: 'CL-001', receipt: 'RC-2026-001', packageId: 'PP-1020', recipientId: 'R-008', at: T(25, 12, 0), verifier: 'Daniel Cho', method: M1, ref: '3095', proof: 'SIG-001' },
];

export const initialNotices: Notice[] = [
  { id: 'N-027', kind: 'Arrival', title: 'Your package is ready', body: 'PP-1027 is ready for collection after a staff-recorded storage assignment.', at: T(27, 10, 8), recipientId: 'R-001', packageId: 'PP-1027', read: false },
  { id: 'N-026', kind: 'Arrival', title: 'Your package is ready', body: 'PP-1026 is ready for collection at Hub A / Receiving.', at: T(27, 8, 55), recipientId: 'R-002', packageId: 'PP-1026', read: false },
  { id: 'N-025', kind: 'Arrival', title: 'Your package is ready', body: 'PP-1025 is ready for collection at Hub A / Receiving.', at: T(25, 11, 40), recipientId: 'R-003', packageId: 'PP-1025', read: true },
  { id: 'N-024', kind: 'Claim', title: 'Collection confirmed', body: 'PP-1024 was collected. Receipt RC-2026-003 is available.', at: T(27, 10, 42), recipientId: 'R-004', packageId: 'PP-1024', read: true },
  { id: 'N-023', kind: 'Overdue', title: 'Package overdue for collection', body: 'PP-1023 has waited more than 7 days. Please collect it soon.', at: T(27, 9, 0), recipientId: 'R-005', packageId: 'PP-1023', read: false },
  { id: 'N-022', kind: 'Reminder', title: 'Staff action: assign storage', body: 'PP-1022 (Omar Ali) has no storage assignment yet.', at: T(27, 9, 0), recipientId: 'R-006', packageId: 'PP-1022', read: false },
];
