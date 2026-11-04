import type { Claim, Notice, Pkg } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export interface Bootstrap {
  packages: Pkg[];
  claims: Claim[];
  notices: Notice[];
}

export const api = {
  bootstrap: () => request<Bootstrap>('/bootstrap'),
  seed: (data: Bootstrap) => request<{ ok: boolean }>('/bootstrap', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createPackage: (pkg: Pkg, notice?: Notice) => request<Pkg>('/packages', {
    method: 'POST',
    body: JSON.stringify({ ...pkg, notice }),
  }),
  updateStorage: (id: string, packageData: Partial<Pkg>) => request<{ ok: boolean }>(`/packages/${encodeURIComponent(id)}/storage`, {
    method: 'PATCH',
    body: JSON.stringify(packageData),
  }),
  createClaim: (claim: Claim, events: Pkg['events']) => request<Claim>('/claims', {
    method: 'POST',
    body: JSON.stringify({ ...claim, events }),
  }),
  createNotice: (notice: Notice) => request<Notice>('/notices', {
    method: 'POST',
    body: JSON.stringify(notice),
  }),
  markRead: (id?: string) => request<{ ok: boolean }>('/notices/read', {
    method: 'PATCH',
    body: JSON.stringify(id ? { id } : {}),
  }),
};
