import { API_REQUEST_ID_HEADER } from '../constants/app';
import { AUTH_STORAGE_KEYS } from '../constants/auth';
import frontendLogger from './logger';
import { getApiBaseUrl } from './apiBase';
import { createClientRequestId } from './requestId';

const getRequestUrl = (input: RequestInfo | URL): string =>
  input instanceof Request ? input.url : String(input);

const fetchWithOptionalInit = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
  init === undefined ? fetch(input) : fetch(input, init);

const getBrowserOrigin = (): string | undefined =>
  typeof window === 'undefined' ? undefined : window.location.origin;

const getResolvedRequestUrl = (rawUrl: string, backendBaseUrl: string, browserOrigin?: string): URL | null => {
  if (backendBaseUrl) return new URL(rawUrl, backendBaseUrl);
  if (browserOrigin) return new URL(rawUrl, browserOrigin);
  return null;
};

const isRelativeApiUrl = (rawUrl: string): boolean => {
  const pathname = rawUrl.split(/[?#]/u, 1)[0] ?? '';
  return !/^[a-z][a-z\d+.-]*:/iu.test(rawUrl) && pathname.startsWith('/api/');
};

const getRequestPath = (rawUrl: string): string => {
  const backendBaseUrl = getApiBaseUrl();
  const baseUrl = backendBaseUrl || getBrowserOrigin();
  if (!baseUrl) return rawUrl.split(/[?#]/u, 1)[0] || '[unresolved]';
  try {
    return new URL(rawUrl, baseUrl).pathname;
  } catch {
    return rawUrl.split(/[?#]/u, 1)[0] || '[unresolved]';
  }
};

const isBackendApiRequest = (input: RequestInfo | URL): boolean => {
  try {
    const rawUrl = getRequestUrl(input);
    const backendBaseUrl = getApiBaseUrl();
    const browserOrigin = getBrowserOrigin();
    const requestUrl = getResolvedRequestUrl(rawUrl, backendBaseUrl, browserOrigin);
    if (!requestUrl) return isRelativeApiUrl(rawUrl);
    const backendOrigin = backendBaseUrl ? new URL(backendBaseUrl).origin : browserOrigin;
    return requestUrl.pathname.startsWith('/api/') && (!backendOrigin || requestUrl.origin === backendOrigin);
  } catch {
    return false;
  }
};

const getBackendRequestContext = (input: RequestInfo | URL, init?: RequestInit): Record<string, unknown> => {
  let path = '[unresolved]';
  let method = 'GET';
  let requestId: string | undefined;
  try {
    const request = input instanceof Request ? input : undefined;
    path = getRequestPath(getRequestUrl(input));
    method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const headers = new Headers(request?.headers);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    requestId = headers.get(API_REQUEST_ID_HEADER) ?? undefined;
  } catch {
    // Keep a useful redacted fallback context even when request metadata is malformed.
  }
  return { action: 'api.request.fetch', method, path, statusCode: 0, requestId };
};

const readStoredAuthToken = (requestId: string, path: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
  } catch (error: unknown) {
    frontendLogger.warn('Browser auth token could not be read; continuing without stored credentials', {
      action: 'api.request.auth-token.read',
      path,
      statusCode: 0,
      requestId
    }, error);
    return null;
  }
};

const fetchBackendApiRequest = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let context = getBackendRequestContext(input, init);
  try {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    const requestId = headers.get(API_REQUEST_ID_HEADER) || createClientRequestId();
    headers.set(API_REQUEST_ID_HEADER, requestId);
    context = { ...context, requestId };

    if (!headers.has('Authorization')) {
      const token = readStoredAuthToken(requestId, String(context.path));
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
    return await fetch(input, { ...init, headers });
  } catch (error: unknown) {
    frontendLogger.error('Backend API request failed before a response was received', context, error);
    throw error;
  }
};

export const apiFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (!isBackendApiRequest(input)) return fetchWithOptionalInit(input, init);
  return fetchBackendApiRequest(input, init);
};
