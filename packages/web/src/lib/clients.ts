import type { Client } from '@clique-boost/shared';

const API_BASE = process.env.API_URL || 'http://localhost:3001';

export async function readClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/api/clients`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.clients ?? data ?? [];
}
