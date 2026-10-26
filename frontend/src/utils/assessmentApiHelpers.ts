/**
 * Helper utilities for Assessment API client
 */

export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export async function getJson<T>(url: string, errorPrefix: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${errorPrefix}: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export async function postJson<T>(
  url: string,
  body: unknown,
  errorPrefix: string,
  method: 'POST' | 'PATCH' = 'POST'
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `${errorPrefix}: HTTP ${res.status}`);
  }
  return json.data !== undefined ? json.data : json;
}
