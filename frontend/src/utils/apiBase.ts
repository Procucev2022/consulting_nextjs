/**
 * API Base URL strictly loaded from environment variables (.env / .env.local).
 */
export const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  return API_BASE;
}
