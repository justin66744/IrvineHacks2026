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

export type ListingItem = {
  id: string;
  address: string;
  price?: number;
  population?: number;
  owner_occupied_units?: number;
  renter_occupied_units?: number;
  source?: string;
  risk?: { score: number; label: string; explanation?: string };
};

export async function getListings(params?: { zip_code?: string; limit?: number }): Promise<{ listings: ListingItem[]; source?: string }> {
  const search = new URLSearchParams();
  if (params?.zip_code) search.set('zip_code', params.zip_code);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  const res = await fetch(`${API_BASE}/listings${qs ? `?${qs}` : ''}`);
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
