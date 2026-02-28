const API_BASE = '/api';

export type RiskResponse = {
  score: number;
  label: string;
  signals: string[];
  explanation: string;
  properties_owned?: number;
  all_cash?: boolean;
  related_entities?: number;
};

export async function getRiskScore(address?: string): Promise<RiskResponse> {
  const res = await fetch(`${API_BASE}/risk/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address ?? '123 Oak St' }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getListings(): Promise<{ listings: Array<{ id: string; address: string; price?: number }> }> {
  const res = await fetch(`${API_BASE}/listings`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function subscribeAlerts(email?: string, phone?: string, zip_code?: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/alerts/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, zip_code }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('API unavailable');
  return res.json();
}
