import { afterEach, describe, expect, it, vi } from 'vitest';
import { UI_STRINGS, VENDOR_CONSOLIDATION_UI_CONFIG } from '../../src/constants';
import type { MaterialMappingEntry } from '../../src/types/module2MaterialMapping';
import { authApiClient } from '../../src/utils/authApi';
import { saveModule2MaterialMappings } from '../../src/utils/module2MappingApi';

const validMapping = { sourceMaterialId: 'MAT-1', unspscCode: '12345678', reviewStatus: 'PROVISIONAL' as const };
const persistedMapping = (sourceMaterialId = validMapping.sourceMaterialId): MaterialMappingEntry => ({
  sourceMaterialId,
  sourceDescription: sourceMaterialId,
  sourceCategory: 'Category',
  assignedUnspscCode: validMapping.unspscCode,
  assignedUnspscTitle: 'Test commodity',
  unspscSegment: '12',
  unspscFamily: '1234',
  unspscClass: '123456',
  unspscCommodity: validMapping.unspscCode,
  taxonomyVersion: 'v1',
  mappingMethod: 'MANUAL_REVIEW_REQUIRED',
  confidenceScore: 1,
  evidence: 'D1 taxonomy',
  reviewStatus: 'PROVISIONAL',
  mappingDate: '2026-10-31T00:00:00.000Z',
  totalSpendInr: 0,
  totalSpendCr: 0,
  transactionCount: 0,
  qualifyingSuppliersCount: 0
});
const successfulResponse = (count = 1): Response => new Response(JSON.stringify({
  success: true,
  data: { success: true, mappings: Array.from({ length: count }, (_, index) => persistedMapping(`MAT-${index}`)) }
}), { status: 200 });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Module 2 D1 mapping API', () => {
  it('returns without a request for an empty suggestion set', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(saveModule2MaterialMappings('ASM-1', [])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid mapping payloads before sending a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(saveModule2MaterialMappings('ASM-1', [{ ...validMapping, unspscCode: 'bad' }]))
      .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.invalidMappingPayload));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires an authenticated D1 session', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(saveModule2MaterialMappings('ASM-1', [validMapping]))
      .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.errors.auth.sessionExpired));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts authenticated mapping decisions and returns the D1 saved count', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal('fetch', fetchMock);
    await expect(saveModule2MaterialMappings('ASM-1', [validMapping])).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BULK_UPDATE_ENDPOINT),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
        body: JSON.stringify({ assessmentId: 'ASM-1', mappings: [validMapping] })
      })
    );
  });

  it('splits large mapping batches to match the D1 request limit', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(successfulResponse(VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BATCH_LIMIT))
      .mockResolvedValueOnce(successfulResponse(1));
    vi.stubGlobal('fetch', fetchMock);
    const mappings = Array.from({ length: VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BATCH_LIMIT + 1 }, (_, index) => ({
      ...validMapping,
      sourceMaterialId: `MAT-${index}`
    }));
    await expect(saveModule2MaterialMappings('ASM-1', mappings)).resolves.toHaveLength(mappings.length);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports D1 HTTP failures and rejects malformed success envelopes', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { success: true, mappings: [] } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(saveModule2MaterialMappings('ASM-1', [validMapping]))
      .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.mappingServerRejected(403)));
    await expect(saveModule2MaterialMappings('ASM-1', [validMapping]))
      .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.databaseData.invalidData));
  });

  it('surfaces network failures with the D1 mapping recovery guidance', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(saveModule2MaterialMappings('ASM-1', [validMapping]))
      .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed('offline'));
  });

  it('rejects malformed D1 responses and non-Error transport failures', async () => {
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('null', { status: 200 }))
      .mockRejectedValueOnce('connection lost');
    vi.stubGlobal('fetch', fetchMock);
    await expect(saveModule2MaterialMappings('ASM-1', [validMapping]))
      .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.databaseData.invalidData));
    await expect(saveModule2MaterialMappings('ASM-1', [validMapping]))
      .rejects.toThrow(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.errors.server.databaseUnavailable));
  });
});
