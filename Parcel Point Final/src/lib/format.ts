export const NOW = Date.UTC(2026, 9, 27, 11, 0);
const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const p = (n: number) => String(n).padStart(2, '0');
export const fmt = (iso: string) => { const d = new Date(iso); return `${d.getUTCDate()} ${M[d.getUTCMonth()]} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`; };
export const fmtFull = (iso: string) => `${fmt(iso).replace(' · ', ' 2026 · ')} UTC`;
export const dayKey = (iso: string) => `${Number(iso.slice(8, 10))} ${M[Number(iso.slice(5, 7)) - 1]}`;
export const isOverdue = (iso: string) => NOW - new Date(iso).getTime() > 7 * 86400000;
export const nowIso = () => new Date(NOW).toISOString();
