import { expectApiFetchCall } from './apiFetchAssertions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UI_STRINGS } from '../../src/constants';
import { authApiClient } from '../../src/utils/authApi';
import { loadModule2LogisticsCandidates } from '../../src/utils/module2LogisticsApi';

describe('loadModule2LogisticsCandidates', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads D1 logistics and packaging records for one validated assessment', async () => {
    const payload = { success: true, data: { success: true, count: 0, candidates: [] }, timestamp: '2026-11-01' };
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('session-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => payload } as Response);
    await expect(loadModule2LogisticsCandidates(' AIC-2026-0001 ')).resolves.toEqual(payload.data);
    expectApiFetchCall(globalThis.fetch,
      expect.stringContaining('assessmentId=AIC-2026-0001'),
      { headers: { Authorization: 'Bearer ' + 'session-token' } }
    );
  });

  it('rejects missing assessment scope before making a request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(loadModule2LogisticsCandidates(' ')).rejects.toThrow(UI_STRINGS.module2Logistics.assessmentMissing);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects null response envelopes and null nested data', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => null } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: null }) } as Response);
    await expect(loadModule2LogisticsCandidates('A1'))
      .rejects.toThrow(UI_STRINGS.module2Logistics.requestFailed);
    await expect(loadModule2LogisticsCandidates('A1'))
      .rejects.toThrow(UI_STRINGS.module2Logistics.requestFailed);
  });

  it('reports HTTP, malformed payload, and network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response);
    await expect(loadModule2LogisticsCandidates('A1')).rejects.toThrow(UI_STRINGS.module2Logistics.loadFailed(503));
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { success: true } })
    } as Response);
    await expect(loadModule2LogisticsCandidates('A1')).rejects.toThrow(UI_STRINGS.module2Logistics.requestFailed);
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connection lost'));
    await expect(loadModule2LogisticsCandidates('A1')).rejects.toThrow('connection lost');
  });
});
