import { apiFetch } from './apiFetch';
import { API_REQUEST_ID_HEADER } from '../constants/app';
import frontendLogger from './logger';
/**
 * Helper utilities for Assessment API client
 */

export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const getSafePath = (url: string): string => {
  const withoutQuery = url.split(/[?#]/u, 1)[0] || '/';
  try {
    return new URL(withoutQuery).pathname;
  } catch {
    return withoutQuery;
  }
};

const getResponseContext = (
  url: string,
  method: string,
  response: Response,
  operation: string
): Record<string, unknown> => ({
  action: 'assessment.api.response',
  operation,
  method,
  path: getSafePath(url),
  statusCode: response.status,
  requestId: response.headers?.get?.(API_REQUEST_ID_HEADER) || undefined
});

const readResponseJson = async (response: Response, context: Record<string, unknown>): Promise<unknown> => {
  try {
    return await response.json();
  } catch (error: unknown) {
    frontendLogger.error('Assessment API response could not be parsed as JSON', context, error);
    throw error;
  }
};

export async function getJson<T>(url: string, errorPrefix: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const error = new Error(`${errorPrefix}: HTTP ${res.status}`);
    frontendLogger.error('Assessment API request failed', getResponseContext(url, 'GET', res, errorPrefix), error);
    throw error;
  }
  const json = await readResponseJson(res, getResponseContext(url, 'GET', res, errorPrefix)) as Record<string, unknown>;
  return (json.data !== undefined ? json.data : json) as T;
}

export async function postJson<T>(
  url: string,
  body: unknown,
  errorPrefix: string,
  method: 'POST' | 'PATCH' | 'PUT' = 'POST',
  headers: Record<string, string> = {}
): Promise<T> {
  const res = await apiFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  const context = getResponseContext(url, method, res, errorPrefix);
  const json = await readResponseJson(res, context) as Record<string, unknown>;
  if (!res.ok || !json.success) {
    const error = new Error(typeof json.message === 'string' ? json.message : `${errorPrefix}: HTTP ${res.status}`);
    frontendLogger.error('Assessment API request failed', context, error);
    throw error;
  }
  return (json.data !== undefined ? json.data : json) as T;
}
