import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import logger from '../../src/utils/logger';
import { ORCHESTRATION_MESSAGES } from '../../src/constants/orchestrationMessages';
import {
  OrchestrationError,
  conflictError,
  createOrchestrationRuntime,
  errorToResponse,
  forbiddenError,
  jsonOk,
  logRequestSummary,
  methodNotAllowedError,
  notFoundError,
  notImplementedError,
  parsePathParams,
  parseWithSchema,
  readJsonBody,
  resolveRequestId,
  serviceUnavailableError,
  unauthorizedError,
  validationError
} from '../../src/workerD1OrchestrationHttp';
import type { OrchestrationRuntime } from '../../src/types/orchestrationD1';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const fixedRuntime: OrchestrationRuntime = {
  now: () => '2026-01-05T00:00:00.000Z',
  createId: (prefix: string) => `${prefix}-fixed`
};

const jsonRequest = (body: string): Request => new Request('https://edge.example/x', { method: 'POST', body });

const errorBody = async (response: Response): Promise<Record<string, unknown>> =>
  (await response.json()) as Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('error constructors', () => {
  it('assigns the HTTP status and error category for each failure type', () => {
    expect(unauthorizedError('a')).toMatchObject({ statusCode: 401, category: 'AUTH_ERROR' });
    expect(forbiddenError('b')).toMatchObject({ statusCode: 403, category: 'AUTH_ERROR' });
    expect(notFoundError('c')).toMatchObject({ statusCode: 404, category: 'NOT_FOUND_ERROR' });
    expect(methodNotAllowedError()).toMatchObject({
      statusCode: 405,
      category: 'NOT_FOUND_ERROR',
      message: ORCHESTRATION_MESSAGES.methodNotAllowed
    });
    expect(conflictError('d')).toMatchObject({ statusCode: 409, category: 'CONFLICT_ERROR', details: {} });
    expect(serviceUnavailableError('e')).toMatchObject({ statusCode: 503, category: 'SERVER_ERROR' });
    expect(notImplementedError('f')).toMatchObject({ statusCode: 501, category: 'SERVER_ERROR' });
  });

  it('keeps structured details on validation, conflict and unavailable errors', () => {
    const issues = [{ path: ['x'], message: 'bad' }];
    expect(validationError(issues)).toMatchObject({
      statusCode: 400,
      category: 'VALIDATION_ERROR',
      message: ORCHESTRATION_MESSAGES.validationFailed,
      details: { errors: issues }
    });
    expect(conflictError('d', { blockingReasons: ['r'] }).details).toEqual({ blockingReasons: ['r'] });
    expect(serviceUnavailableError('e', { notification: { id: 1 } }).details).toEqual({ notification: { id: 1 } });
    expect(new OrchestrationError(418, 'SERVER_ERROR', 'teapot').details).toEqual({});
  });
});

describe('parseWithSchema', () => {
  const schema = z.object({ name: z.string().min(2, 'Name is too short') });

  it('returns parsed data on success', () => {
    expect(parseWithSchema(schema, { name: 'Asha' })).toEqual({ name: 'Asha' });
  });

  it('throws a 400 validation error carrying the zod issues on failure', () => {
    try {
      parseWithSchema(schema, { name: 'A' });
      throw new Error('expected validation to fail');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(OrchestrationError);
      const failure = error as OrchestrationError;
      expect(failure.statusCode).toBe(400);
      expect(failure.details.errors).toEqual([expect.objectContaining({ message: 'Name is too short' })]);
    }
  });
});

describe('readJsonBody', () => {
  it('treats an empty or blank body as an empty object', async () => {
    expect(await readJsonBody(jsonRequest(''))).toEqual({});
    expect(await readJsonBody(jsonRequest('   \n'))).toEqual({});
  });

  it('returns parsed JSON values', async () => {
    expect(await readJsonBody(jsonRequest('{"reportVersionId":"RPT-1"}'))).toEqual({ reportVersionId: 'RPT-1' });
    expect(await readJsonBody(jsonRequest('null'))).toBeNull();
  });

  it('rejects malformed JSON with a 400 validation error', async () => {
    await expect(readJsonBody(jsonRequest('{oops'))).rejects.toMatchObject({
      statusCode: 400,
      details: { errors: [expect.objectContaining({ message: ORCHESTRATION_MESSAGES.invalidJson })] }
    });
  });
});

describe('parsePathParams', () => {
  it('decodes and validates identifiers', () => {
    expect(parsePathParams({ jobId: 'AIC%2D2026', versionId: 'DV-001' })).toEqual({
      jobId: 'AIC-2026',
      versionId: 'DV-001'
    });
  });

  it('rejects malformed percent-encoding and identifiers outside the pattern', () => {
    expect(() => parsePathParams({ jobId: '%E0%A4%A' })).toThrow(OrchestrationError);
    expect(() => parsePathParams({ jobId: '%20' })).toThrow(OrchestrationError);
  });
});

describe('request identifiers and runtime', () => {
  it('uses a well-formed X-Request-Id and otherwise asks the runtime for one', () => {
    const withHeader = new Request('https://edge.example/', { headers: { 'X-Request-Id': 'abc-123' } });
    expect(resolveRequestId(withHeader, fixedRuntime)).toBe('abc-123');
    const malformed = new Request('https://edge.example/', { headers: { 'X-Request-Id': 'has spaces' } });
    expect(resolveRequestId(malformed, fixedRuntime)).toBe('req-fixed');
    expect(resolveRequestId(new Request('https://edge.example/'), fixedRuntime)).toBe('req-fixed');
  });

  it('creates a production runtime with ISO timestamps and prefixed identifiers', () => {
    const runtime = createOrchestrationRuntime();
    expect(runtime.now()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(runtime.createId('aud')).toMatch(/^aud-[0-9a-f-]{36}$/);
  });
});

describe('error responses', () => {
  it('returns validation failures as 400 without a request id and logs a warning', async () => {
    const response = errorToResponse(validationError([{ message: 'bad' }]), 'req-1', new Request('https://edge.example/'));
    expect(response.status).toBe(400);
    const body = await errorBody(response);
    expect(body).toMatchObject({ success: false, message: 'Validation failed', errorCategory: 'VALIDATION_ERROR' });
    expect(body).not.toHaveProperty('requestId');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('includes the request id and logs an error for server-side failures', async () => {
    const response = errorToResponse(
      serviceUnavailableError('Email is off'),
      'req-2',
      new Request('https://edge.example/')
    );
    expect(response.status).toBe(503);
    expect(await errorBody(response)).toMatchObject({ message: 'Email is off', requestId: 'req-2' });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('maps a unique-constraint violation to a 409 concurrency conflict', async () => {
    const response = errorToResponse(
      new Error('UNIQUE constraint failed: OrchestrationReportVersion.assessment_id'),
      'req-3',
      new Request('https://edge.example/')
    );
    expect(response.status).toBe(409);
    expect(await errorBody(response)).toMatchObject({
      message: ORCHESTRATION_MESSAGES.concurrentWrite('req-3'),
      errorCategory: 'CONFLICT_ERROR'
    });
  });

  it('hides unexpected errors behind a 500 that quotes the request id', async () => {
    const response = errorToResponse(new Error('internal detail'), 'req-4', new Request('https://edge.example/'));
    expect(response.status).toBe(500);
    const body = await errorBody(response);
    expect(body.message).toBe(ORCHESTRATION_MESSAGES.unexpectedError('req-4'));
    expect(body).not.toHaveProperty('errors');
    expect(JSON.stringify(body)).not.toContain('internal detail');
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('handles thrown values that are not Error instances', async () => {
    const response = errorToResponse('plain text', 'req-5', new Request('https://edge.example/'));
    expect(response.status).toBe(500);
    expect(await errorBody(response)).toMatchObject({ requestId: 'req-5' });
  });

  it('merges structured details into the error body', async () => {
    const response = errorToResponse(
      conflictError('Not ready', { blockingReasons: ['No run'] }),
      'req-6',
      new Request('https://edge.example/')
    );
    expect(await errorBody(response)).toMatchObject({ blockingReasons: ['No run'] });
  });
});

describe('success helpers and logging', () => {
  it('returns JSON with status 200', async () => {
    const response = jsonOk({ success: true, message: 'Done' }, new Request('https://edge.example/'));
    expect(response.status).toBe(200);
    expect(await errorBody(response)).toEqual({ success: true, message: 'Done' });
  });

  it('logs reads at debug level and writes at info level', () => {
    const summary = { requestId: 'req-7', action: 'LIST_JOBS', method: 'GET', path: '/x', statusCode: 200, durationMs: 4 };
    logRequestSummary(summary);
    expect(logger.debug).toHaveBeenCalledTimes(1);
    logRequestSummary({ ...summary, method: 'POST', action: 'QUALITY_GATE' });
    expect(logger.info).toHaveBeenCalledTimes(1);
  });
});
