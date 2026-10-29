/**
 * HTTP helpers for the Analysis Orchestration API: error model and responses, JSON body and
 * parameter parsing, request correlation IDs and request logging.
 */
import type { z } from 'zod';
import logger from './utils/logger';
import { jsonResponse } from './workerHttp';
import {
  ORCHESTRATION_ERROR_CATEGORY,
  ORCHESTRATION_HTTP_STATUS,
  ORCHESTRATION_ID_PREFIX,
  ORCHESTRATION_REQUEST_ID_HEADER,
  ORCHESTRATION_REQUEST_ID_PATTERN
} from './constants/orchestration';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { orchestrationIdSchema } from './constants/orchestrationValidation';
import type {
  OrchestrationErrorCategory,
  OrchestrationRequestSummary,
  OrchestrationRuntime
} from './types/orchestrationD1';

export class OrchestrationError extends Error {
  readonly statusCode: number;
  readonly category: OrchestrationErrorCategory;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    statusCode: number,
    category: OrchestrationErrorCategory,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'OrchestrationError';
    this.statusCode = statusCode;
    this.category = category;
    this.details = details;
  }
}

export const unauthorizedError = (message: string): OrchestrationError =>
  new OrchestrationError(ORCHESTRATION_HTTP_STATUS.UNAUTHORIZED, ORCHESTRATION_ERROR_CATEGORY.AUTH, message);

export const forbiddenError = (message: string): OrchestrationError =>
  new OrchestrationError(ORCHESTRATION_HTTP_STATUS.FORBIDDEN, ORCHESTRATION_ERROR_CATEGORY.AUTH, message);

export const notFoundError = (message: string): OrchestrationError =>
  new OrchestrationError(ORCHESTRATION_HTTP_STATUS.NOT_FOUND, ORCHESTRATION_ERROR_CATEGORY.NOT_FOUND, message);

export const methodNotAllowedError = (): OrchestrationError =>
  new OrchestrationError(
    ORCHESTRATION_HTTP_STATUS.METHOD_NOT_ALLOWED,
    ORCHESTRATION_ERROR_CATEGORY.NOT_FOUND,
    ORCHESTRATION_MESSAGES.methodNotAllowed
  );

export const conflictError = (message: string, details: Record<string, unknown> = {}): OrchestrationError =>
  new OrchestrationError(ORCHESTRATION_HTTP_STATUS.CONFLICT, ORCHESTRATION_ERROR_CATEGORY.CONFLICT, message, details);

export const serviceUnavailableError = (message: string, details: Record<string, unknown> = {}): OrchestrationError =>
  new OrchestrationError(
    ORCHESTRATION_HTTP_STATUS.SERVICE_UNAVAILABLE,
    ORCHESTRATION_ERROR_CATEGORY.SERVER,
    message,
    details
  );

export const notImplementedError = (message: string): OrchestrationError =>
  new OrchestrationError(ORCHESTRATION_HTTP_STATUS.NOT_IMPLEMENTED, ORCHESTRATION_ERROR_CATEGORY.SERVER, message);

export const validationError = (errors: unknown): OrchestrationError =>
  new OrchestrationError(
    ORCHESTRATION_HTTP_STATUS.BAD_REQUEST,
    ORCHESTRATION_ERROR_CATEGORY.VALIDATION,
    ORCHESTRATION_MESSAGES.validationFailed,
    { errors }
  );

/** Validates a value against a zod schema. Failures become HTTP 400 with the zod issues. */
export const parseWithSchema = <TSchema extends z.ZodType>(schema: TSchema, value: unknown): z.output<TSchema> => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw validationError(parsed.error.issues);
  return parsed.data;
};

/** Reads the request body as JSON. An empty body is treated as an empty object. */
export const readJsonBody = async (request: Request): Promise<unknown> => {
  const text = await request.text();
  if (text.trim().length === 0) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw validationError([{ path: [], message: ORCHESTRATION_MESSAGES.invalidJson }]);
  }
};

const decodeParameter = (name: string, value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    throw validationError([{ path: [name], message: ORCHESTRATION_MESSAGES.invalidPathEncoding }]);
  }
};

/** Percent-decodes route parameters and validates them as orchestration identifiers. */
export const parsePathParams = (raw: Readonly<Record<string, string>>): Record<string, string> => {
  const parsed: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    parsed[name] = parseWithSchema(orchestrationIdSchema, decodeParameter(name, value));
  }
  return parsed;
};

export const jsonOk = (body: Record<string, unknown>, request: Request): Response =>
  jsonResponse(body, ORCHESTRATION_HTTP_STATUS.OK, request);

/** Production runtime: current UTC time and random identifiers. Tests inject a fixed runtime. */
export const createOrchestrationRuntime = (): OrchestrationRuntime => ({
  now: () => new Date().toISOString(),
  createId: (prefix: string) => `${prefix}-${crypto.randomUUID()}`
});

/** Uses the caller's X-Request-Id when it is well formed, otherwise generates one. */
export const resolveRequestId = (request: Request, runtime: OrchestrationRuntime): string => {
  const supplied = request.headers.get(ORCHESTRATION_REQUEST_ID_HEADER);
  if (supplied !== null && ORCHESTRATION_REQUEST_ID_PATTERN.test(supplied)) return supplied;
  return runtime.createId(ORCHESTRATION_ID_PREFIX.REQUEST);
};

const isUniqueConstraintViolation = (error: unknown): boolean =>
  error instanceof Error && error.message.includes('UNIQUE constraint failed');

const normalizeError = (error: unknown, requestId: string): OrchestrationError => {
  if (error instanceof OrchestrationError) return error;
  if (isUniqueConstraintViolation(error)) return conflictError(ORCHESTRATION_MESSAGES.concurrentWrite(requestId));
  return new OrchestrationError(
    ORCHESTRATION_HTTP_STATUS.INTERNAL_ERROR,
    ORCHESTRATION_ERROR_CATEGORY.SERVER,
    ORCHESTRATION_MESSAGES.unexpectedError(requestId)
  );
};

const logFailure = (error: unknown, failure: OrchestrationError, requestId: string): void => {
  const context = { requestId, statusCode: failure.statusCode, category: failure.category };
  if (failure.statusCode >= ORCHESTRATION_HTTP_STATUS.INTERNAL_ERROR) {
    logger.error('Analysis orchestration request failed', context, error);
  } else {
    logger.warn('Analysis orchestration request rejected', context);
  }
};

/** Converts any thrown value into the standard JSON error body and logs it at a level matching the status. */
export const errorToResponse = (error: unknown, requestId: string, request: Request): Response => {
  const failure = normalizeError(error, requestId);
  logFailure(error, failure, requestId);
  const body: Record<string, unknown> = {
    success: false,
    message: failure.message,
    errorCategory: failure.category,
    ...failure.details
  };
  if (failure.statusCode >= ORCHESTRATION_HTTP_STATUS.INTERNAL_ERROR) body.requestId = requestId;
  return jsonResponse(body, failure.statusCode, request);
};

/** Logs a successful request. Writes are INFO (state changes); reads are DEBUG. */
export const logRequestSummary = (summary: OrchestrationRequestSummary): void => {
  const context = {
    requestId: summary.requestId,
    action: summary.action,
    method: summary.method,
    path: summary.path,
    statusCode: summary.statusCode,
    durationMs: summary.durationMs
  };
  if (summary.method === 'GET') {
    logger.debug('Analysis orchestration read completed', context);
  } else {
    logger.info('Analysis orchestration write completed', context);
  }
};
