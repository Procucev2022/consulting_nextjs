import { afterEach, describe, expect, it, vi } from 'vitest';
import { UI_STRINGS } from '../../src/constants';
import { loadIndustryCatalog } from '../../src/utils/industryApi';

describe('loadIndustryCatalog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns only catalog rows received from the D1 API', async () => {
    const payload = { success: true, profiles: [], presets: [] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => payload } as Response);
    await expect(loadIndustryCatalog()).resolves.toEqual(payload);
  });

  it('rejects unsuccessful HTTP responses with the catalog message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    await expect(loadIndustryCatalog()).rejects.toThrow(UI_STRINGS.module2.industryContext.profileLoadFailed);
  });

  it('rejects malformed payloads and propagates network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => null } as Response);
    await expect(loadIndustryCatalog()).rejects.toThrow(UI_STRINGS.module2.industryContext.profileLoadFailed);
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    await expect(loadIndustryCatalog()).rejects.toThrow('network down');
  });

  it('rejects a successful response when either D1 catalog collection is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, profiles: [], presets: null })
    } as Response);

    await expect(loadIndustryCatalog()).rejects.toThrow(UI_STRINGS.module2.industryContext.profileLoadFailed);
  });
});
