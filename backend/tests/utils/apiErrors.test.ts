import { describe, it, expect } from 'vitest';
import { API_ERROR_CATEGORY, API_ERROR_CODE, API_HTTP_STATUS } from '../../src/constants/errors';
import { buildApiErrorBody, ClientFacingError, resolveApiErrorCategory } from '../../src/utils/apiErrors';

describe('API error envelope', () => {
  it.each([
    [API_HTTP_STATUS.BAD_REQUEST, API_ERROR_CATEGORY.VALIDATION],
    [API_HTTP_STATUS.PAYLOAD_TOO_LARGE, API_ERROR_CATEGORY.VALIDATION],
    [API_HTTP_STATUS.UNAUTHORIZED, API_ERROR_CATEGORY.AUTH],
    [API_HTTP_STATUS.FORBIDDEN, API_ERROR_CATEGORY.AUTH],
    [API_HTTP_STATUS.NOT_FOUND, API_ERROR_CATEGORY.NOT_FOUND],
    [API_HTTP_STATUS.CONFLICT, API_ERROR_CATEGORY.CONFLICT],
    [API_HTTP_STATUS.TOO_MANY_REQUESTS, API_ERROR_CATEGORY.RATE_LIMIT],
    [API_HTTP_STATUS.INTERNAL_SERVER_ERROR, API_ERROR_CATEGORY.SERVER],
    [API_HTTP_STATUS.SERVICE_UNAVAILABLE, API_ERROR_CATEGORY.SERVER]
  ])('classifies HTTP status %i as %s', (status, category) => {
    expect(resolveApiErrorCategory(status)).toBe(category);
  });

  it('builds the envelope with a stable code, a category and the request ID', () => {
    expect(buildApiErrorBody(API_HTTP_STATUS.NOT_FOUND, API_ERROR_CODE.ROUTE_NOT_FOUND, 'No route', {
      requestId: 'req-1'
    })).toEqual({
      success: false,
      message: 'No route',
      errorCode: API_ERROR_CODE.ROUTE_NOT_FOUND,
      errorCategory: API_ERROR_CATEGORY.NOT_FOUND,
      requestId: 'req-1'
    });
  });

  it('omits the request ID when the request carried none', () => {
    const body = buildApiErrorBody(API_HTTP_STATUS.BAD_REQUEST, API_ERROR_CODE.INVALID_JSON_BODY, 'Bad body');

    expect(body).not.toHaveProperty('requestId');
  });

  it('carries the status, code and client-written message of a client-facing error', () => {
    const error = new ClientFacingError(API_HTTP_STATUS.NOT_FOUND, API_ERROR_CODE.DATASET_NOT_FOUND, 'Run the analysis first.');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ClientFacingError');
    expect(error.status).toBe(API_HTTP_STATUS.NOT_FOUND);
    expect(error.errorCode).toBe(API_ERROR_CODE.DATASET_NOT_FOUND);
    expect(error.message).toBe('Run the analysis first.');
  });

  it('keeps extra fields without letting them override the core classification', () => {
    const body = buildApiErrorBody(API_HTTP_STATUS.BAD_REQUEST, API_ERROR_CODE.INVALID_JSON_BODY, 'Bad body', {
      extra: { success: true, message: 'overridden', errorCategory: API_ERROR_CATEGORY.AUTH, errors: [{ path: 'body' }] }
    });

    expect(body).toMatchObject({
      success: false,
      message: 'Bad body',
      errorCategory: API_ERROR_CATEGORY.VALIDATION,
      errors: [{ path: 'body' }]
    });
  });
});
