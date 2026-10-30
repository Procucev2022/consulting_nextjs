import { describe, expect, it } from 'vitest';
import {
  executiveBriefErrorResponse,
  executiveBriefFileResponse,
  executiveBriefJsonResponse,
  executiveBriefValidationResponse,
  methodNotAllowedResponse,
  resolveExecutiveBriefRequestId,
  toValidationIssues
} from '../src/workerD1ExecutiveBriefResponses';
import { EXECUTIVE_BRIEF_HTTP_STATUS, EXECUTIVE_BRIEF_MESSAGES } from '../src/constants/executiveBriefRouteConstants';
import { EXECUTIVE_BRIEF_CONTENT_TYPES } from '../src/constants/executiveBriefExportConstants';
import { briefRequest } from './executiveBriefTestHelpers';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

describe('resolveExecutiveBriefRequestId', () => {
  it('keeps a well-formed supplied request ID and generates one otherwise', () => {
    expect(resolveExecutiveBriefRequestId(briefRequest('GET', '/report', { headers: { 'X-Request-Id': 'abc-123' } }))).toBe(
      'abc-123'
    );
    expect(UUID_PATTERN.test(resolveExecutiveBriefRequestId(briefRequest('GET', '/report')))).toBe(true);
    expect(
      UUID_PATTERN.test(
        resolveExecutiveBriefRequestId(briefRequest('GET', '/report', { headers: { 'X-Request-Id': 'has spaces' } }))
      )
    ).toBe(true);
  });
});

describe('executive brief response helpers', () => {
  const request = briefRequest('GET', '/report', { headers: { Origin: 'https://app.example.test' } });

  it('builds JSON responses with the request ID, no-store caching, and CORS headers', async () => {
    const response = executiveBriefJsonResponse(request, 'req-1', EXECUTIVE_BRIEF_HTTP_STATUS.OK, { success: true });
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    expect(response.headers.get('Content-Type')).toBe(EXECUTIVE_BRIEF_CONTENT_TYPES.JSON);
    expect(response.headers.get('X-Request-Id')).toBe('req-1');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.test');
    expect(await response.json()).toEqual({ success: true });
  });

  it('adds the failure flag, message, and request ID to error responses and merges details', async () => {
    const plain = executiveBriefErrorResponse(request, 'req-2', EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT, 'Blocked');
    expect(await plain.json()).toEqual({ success: false, message: 'Blocked', requestId: 'req-2' });
    const detailed = executiveBriefErrorResponse(request, 'req-3', EXECUTIVE_BRIEF_HTTP_STATUS.NOT_IMPLEMENTED, 'Gap', {
      format: 'pdf'
    });
    expect(await detailed.json()).toEqual({ success: false, message: 'Gap', requestId: 'req-3', format: 'pdf' });
  });

  it('maps schema issues to dotted paths and keeps symbol path segments printable', () => {
    expect(
      toValidationIssues([
        { path: ['client'], message: 'Too long' },
        { path: ['items', 0, Symbol('segment')], message: 'Nested' },
        { path: [], message: 'Root' }
      ])
    ).toEqual([
      { path: 'client', message: 'Too long' },
      { path: 'items.0.Symbol(segment)', message: 'Nested' },
      { path: '', message: 'Root' }
    ]);
  });

  it('answers validation failures with 400 and the structured error list', async () => {
    const response = executiveBriefValidationResponse(request, 'req-4', [{ path: 'client', message: 'Required' }]);
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.BAD_REQUEST);
    expect(await response.json()).toEqual({
      success: false,
      message: EXECUTIVE_BRIEF_MESSAGES.validationFailed,
      requestId: 'req-4',
      errors: [{ path: 'client', message: 'Required' }]
    });
  });

  it('streams file bodies as attachments with the content length and the exposed disposition header', async () => {
    const body = new TextEncoder().encode('file-body');
    const response = executiveBriefFileResponse(request, 'req-5', body, 'text/plain', 'EXAMPLE.txt');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="EXAMPLE.txt"');
    expect(response.headers.get('Content-Length')).toBe(String(body.byteLength));
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Content-Disposition');
    expect(await response.text()).toBe('file-body');
  });

  it('answers 405 and names the single allowed method', () => {
    const response = methodNotAllowedResponse(request, 'req-6', 'POST');
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.METHOD_NOT_ALLOWED);
    expect(response.headers.get('Allow')).toBe('POST');
  });
});
