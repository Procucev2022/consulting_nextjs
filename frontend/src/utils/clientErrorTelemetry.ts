import { apiFetch } from './apiFetch';
import {
  BACKEND_API_BASE_URL,
  CLIENT_ERROR_REPORT_DEDUPE_MS,
  CLIENT_ERROR_REPORT_ENDPOINT,
  CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH,
  CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH,
  CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH,
  CLIENT_ERROR_REPORT_MAX_STACK_LENGTH,
  CLIENT_ERROR_REPORT_MAX_TRACKED_KEYS,
  CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH,
  CLIENT_ERROR_REPORT_PATH_PATTERNS,
  CLIENT_ERROR_REPORT_SENSITIVE_TEXT_PATTERNS,
  CLIENT_ERROR_REPORT_URL_PATTERN,
  CLIENT_ERROR_REPORT_LINEBREAK_PATTERN
} from '../constants';
import { clientErrorReportSchema } from '../constants/validation';
import { UI_STRINGS } from '../constants/uiStrings';
import type { ClientErrorReport, FrontendLogEntry } from '../types';
import { frontendLogger } from './logger';
import { createClientRequestId } from './requestId';

export { createClientRequestId } from './requestId';

const recentReports = new Map<string, number>();

const safeRoutePath = (pathname: string): string => pathname
  .split(/[?#]/, 1)[0]
  .replace(CLIENT_ERROR_REPORT_PATH_PATTERNS.uuid, '/[id]')
  .replace(CLIENT_ERROR_REPORT_PATH_PATTERNS.numericId, '/[id]')
  .replace(CLIENT_ERROR_REPORT_PATH_PATTERNS.emailSegment, '/[redacted]')
  .slice(0, CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH) || '/';

export const sanitizeClientErrorText = (value: string, maxLength: number): string => {
  let result = value;
  for (const { pattern, replacement } of CLIENT_ERROR_REPORT_SENSITIVE_TEXT_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(CLIENT_ERROR_REPORT_LINEBREAK_PATTERN, ' ');
  result = result.replace(CLIENT_ERROR_REPORT_URL_PATTERN, (rawUrl) => {
    try {
      const url = new URL(rawUrl);
      return `${url.origin}${safeRoutePath(url.pathname)}`;
    } catch {
      return '[REDACTED_URL]';
    }
  });
  return result.slice(0, maxLength);
};

const readClientRequestId = (entry: FrontendLogEntry): string => {
  const value = entry.context?.requestId;
  return typeof value === 'string' && value.trim().length > 0
    ? sanitizeClientErrorText(value, CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH)
    : createClientRequestId();
};

const isReportableEntry = (entry: FrontendLogEntry): boolean =>
  entry.level === 'error' || (entry.level === 'warn' && Boolean(entry.error));

const normalizeReportSource = (source: string): ClientErrorReport['source'] =>
  ['logger', 'window', 'unhandledrejection', 'react-boundary'].includes(source)
    ? source as ClientErrorReport['source']
    : 'logger';

const readReportRoute = (): string => {
  const pathname = window.location?.pathname;
  return typeof pathname === 'string' ? pathname : '/';
};

const readReportErrorName = (entry: FrontendLogEntry): string =>
  sanitizeClientErrorText(entry.error?.name || 'Error', CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH) || 'Error';

const readReportMessage = (entry: FrontendLogEntry): string =>
  sanitizeClientErrorText(entry.error?.message || entry.message, CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH)
    || UI_STRINGS.errors.titles.generic;

const readReportStack = (entry: FrontendLogEntry): string | undefined => entry.error?.stack
  ? sanitizeClientErrorText(entry.error.stack, CLIENT_ERROR_REPORT_MAX_STACK_LENGTH)
  : undefined;

export const buildClientErrorReport = (
  entry: FrontendLogEntry,
  source = typeof entry.context?.source === 'string' ? entry.context.source : 'logger'
): ClientErrorReport | null => {
  if (!isReportableEntry(entry) || typeof window === 'undefined') return null;
  const candidate = {
    level: entry.level,
    source: normalizeReportSource(source),
    errorName: readReportErrorName(entry),
    message: readReportMessage(entry),
    stack: readReportStack(entry),
    route: safeRoutePath(readReportRoute()),
    occurredAt: entry.timestamp,
    clientRequestId: readClientRequestId(entry)
  };
  const parsed = clientErrorReportSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

const shouldReport = (report: ClientErrorReport): boolean => {
  const now = Date.now();
  for (const [key, time] of recentReports) {
    if (now - time > CLIENT_ERROR_REPORT_DEDUPE_MS) recentReports.delete(key);
  }
  const key = `${report.errorName}|${report.message}|${report.stack || ''}`;
  const previous = recentReports.get(key);
  if (previous !== undefined && now - previous <= CLIENT_ERROR_REPORT_DEDUPE_MS) return false;
  if (recentReports.size >= CLIENT_ERROR_REPORT_MAX_TRACKED_KEYS) {
    recentReports.delete(recentReports.keys().next().value as string);
  }
  recentReports.set(key, now);
  return true;
};

export const sendClientErrorReport = async (entry: FrontendLogEntry, source?: string): Promise<void> => {
  const report = buildClientErrorReport(entry, source);
  if (!report || !shouldReport(report)) return;
  try {
    await apiFetch(`${BACKEND_API_BASE_URL}${CLIENT_ERROR_REPORT_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      credentials: 'omit',
      keepalive: true
    });
  } catch {
    // Reporting must never create another application error or interrupt the user's action.
  }
};

const errorForUnknownReason = (reason: unknown): Error => {
  if (reason instanceof Error) return reason;
  if (typeof reason === 'string') return new Error(reason);
  return new Error(UI_STRINGS.errors.boundary.message);
};

export const installClientErrorMonitoring = (): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  const onLogEntry = (entry: FrontendLogEntry): void => {
    if (entry.level === 'error' || (entry.level === 'warn' && entry.error)) void sendClientErrorReport(entry);
  };
  const onWindowError = (event: ErrorEvent): void => {
    const error = event.error instanceof Error
      ? event.error
      : new Error(event.message || UI_STRINGS.errors.boundary.message);
    frontendLogger.error(UI_STRINGS.errors.boundary.logMessage, {
      source: 'window', requestId: createClientRequestId()
    }, error);
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
    frontendLogger.error(UI_STRINGS.errors.boundary.logMessage, {
      source: 'unhandledrejection', requestId: createClientRequestId()
    }, errorForUnknownReason(event.reason));
  };
  const unsubscribe = frontendLogger.addListener(onLogEntry);
  window.addEventListener('error', onWindowError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  return () => {
    unsubscribe();
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
};
