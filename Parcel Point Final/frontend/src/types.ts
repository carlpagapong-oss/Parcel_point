export type Status = 'ready' | 'claimed' | 'unassigned';
export type Role = 'Administrator' | 'Claiming Staff' | 'Receiving Staff';
export interface Recipient { id: string; name: string; email: string; phone: string; unit: string; notify: boolean }
export interface Slot { id: string; building: string; floor: string; room: string; shelf: string; slot: string }
export interface FacilityEvent { title: string; at: string; by: string; note: string; tone?: 'blue' | 'teal' }
export interface TransitEvent { title: string; at: string; source: string; tone?: 'blue' | 'teal' }
export interface Pkg {
  id: string; tracking: string; recipientId: string; courier: string; description: string; size: string;
  receivedAt: string; status: Status; slotId: string | null; assignedAt?: string; assignedBy?: string;
  events: FacilityEvent[]; transit: TransitEvent[]; noticeId?: string;
}
export interface Claim { id: string; receipt: string; packageId: string; recipientId: string; at: string; verifier: string; method: string; ref: string; proof: string }
export interface Notice { id: string; kind: 'Arrival' | 'Reminder' | 'Overdue' | 'Claim'; title: string; body: string; at: string; recipientId: string; packageId: string; read: boolean }
