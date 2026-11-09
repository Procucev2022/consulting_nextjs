import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  API_REQUEST_ID_HEADER,
  apiRequestIdSchema,
  assessmentIdQuerySchema,
  ERROR_CATEGORIES,
  UI_STRINGS,
  VOLUME_AGGREGATION_ENDPOINT
} from '../../src/constants';
import { frontendLogger } from '../../src/utils/logger';
import { loadVolumeAggregation } from '../../src/utils/volumeAggregationApi';

const createResponse = (status: number, payload: unknown, requestId?: string): Response => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers(requestId ? { [API_REQUEST_ID_HEADER]: requestId } : {}),
  json: vi.fn().mockResolvedValue(payload)
} as unknown as Response);

describe('loadVolumeAggregation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('validates and URL-encodes the assessment, sends a request ID, and returns the dataset', async () => {
    const dataset = { assessmentId: 'AIC/2026?North', coverageSummary: {}, transactions: [] };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse(200, { success: true, data: dataset }, 'req-volume-success')
    );

    await expect(loadVolumeAggregation(' AIC/2026?North ')).resolves.toEqual(dataset);

    expect(assessmentIdQuerySchema.parse({ assessmentId: ' AIC/2026?North ' })).toEqual({
      assessmentId: 'AIC/2026?North'
    });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(
      `${VOLUME_AGGREGATION_ENDPOINT}?assessmentId=AIC%2F2026%3FNorth`
    );
    const sentRequestId = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers).get(API_REQUEST_ID_HEADER);
    expect(apiRequestIdSchema.safeParse(sentRequestId).success).toBe(true);
  });

  it('rejects a missing assessment before fetch and logs the validation issue', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const warnLog = vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);

    await expect(loadVolumeAggregation(' ')).rejects.toThrow(UI_STRINGS.module2.volumeAggregation.missingAssessment);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnLog).toHaveBeenCalledWith(
      'Volume aggregation request rejected before fetch',
      expect.objectContaining({
        action: 'module2.volume-aggregation.load',
        field: 'assessmentId',
        errorCategory: ERROR_CATEGORIES.VALIDATION_ERROR
      }),
      expect.any(Error)
    );
  });

  it.each([
    [400, ERROR_CATEGORIES.VALIDATION_ERROR],
    [401, ERROR_CATEGORIES.AUTH_ERROR],
    [403, ERROR_CATEGORIES.AUTH_ERROR],
    [404, ERROR_CATEGORIES.NOT_FOUND_ERROR],
    [429, ERROR_CATEGORIES.RATE_LIMIT_ERROR],
    [500, ERROR_CATEGORIES.SERVER_ERROR]
  ] as const)('classifies HTTP %s, logs request context, and gives a correlated retry message', async (statusCode, errorCategory) => {
    const requestId = `req-volume-${statusCode}`;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(statusCode, {}, requestId));
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    await expect(loadVolumeAggregation('AIC-2026-0001'))
      .rejects.toThrow(UI_STRINGS.module2.volumeAggregation.httpFailure(statusCode, requestId));

    expect(errorLog).toHaveBeenLastCalledWith(
      'Volume aggregation API request failed',
      expect.objectContaining({
        action: 'module2.volume-aggregation.load',
        method: 'GET',
        path: `${VOLUME_AGGREGATION_ENDPOINT}?assessmentId=AIC-2026-0001`,
        assessmentId: 'AIC-2026-0001',
        statusCode,
        requestId,
        errorCategory
      }),
      expect.any(Error)
    );
  });

  it('logs network rejections and replaces raw transport details with actionable guidance', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue('offline');
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    const failure = loadVolumeAggregation('AIC-2026-0001');
    const sentRequestId = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers).get(API_REQUEST_ID_HEADER);
    await expect(failure).rejects.toThrow(UI_STRINGS.module2.volumeAggregation.networkFailure(sentRequestId || ''));

    expect(errorLog).toHaveBeenLastCalledWith(
      'Volume aggregation API request failed',
      expect.objectContaining({ statusCode: 0, requestId: sentRequestId, errorCategory: ERROR_CATEGORIES.NETWORK_ERROR }),
      'offline'
    );
  });

  it('reports the server detail when the response envelope is invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse(200, { success: false, message: 'Assessment results are not available' }, 'req-volume-payload')
    );
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    await expect(loadVolumeAggregation('AIC-2026-0001')).rejects.toThrow(
      UI_STRINGS.module2.volumeAggregation.responseFailure('Assessment results are not available', 'req-volume-payload')
    );
    expect(errorLog).toHaveBeenLastCalledWith(
      'Volume aggregation API request failed',
      expect.objectContaining({ statusCode: 200, requestId: 'req-volume-payload', errorCategory: ERROR_CATEGORIES.SERVER_ERROR }),
      expect.any(Error)
    );
  });

  it.each([
    null,
    [],
    { success: true, data: null },
    { success: true, data: [] },
    { success: false },
    { success: false, message: '   ' }
  ])('rejects malformed response shape %j with the localized detail', async (payload) => {
    const requestId = 'req-volume-invalid-shape';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(200, payload, requestId));

    await expect(loadVolumeAggregation('AIC-2026-0001')).rejects.toThrow(
      UI_STRINGS.module2.volumeAggregation.responseFailure(
        UI_STRINGS.module2.volumeAggregation.invalidResponseDetail,
        requestId
      )
    );
  });

  it('uses the sent request ID if the response omits its correlation header', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(500, {}));
    const errorLog = vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);

    const failure = loadVolumeAggregation('AIC-2026-0001');
    const sentRequestId = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers).get(API_REQUEST_ID_HEADER) || '';
    await expect(failure).rejects.toThrow(UI_STRINGS.module2.volumeAggregation.httpFailure(500, sentRequestId));
    expect(errorLog).toHaveBeenLastCalledWith(
      'Volume aggregation API request failed',
      expect.objectContaining({ requestId: sentRequestId, statusCode: 500 }),
      expect.any(Error)
    );
  });
});
