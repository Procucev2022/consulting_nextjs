import { afterEach, describe, expect, it, vi } from 'vitest';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { currencyApiClient } from '../../src/utils/currencyApi';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn() }
}));

const ratesPayload = {
  success: true,
  data: {
    USD: { currencyCode: 'USD', name: 'US Dollar', currentRate: 84, lastUpdated: '2026-10-30' }
  }
};

const conversionPayload = {
  success: true,
  data: { amount: 2, fromCurrency: 'USD', amountINR: 168, exchangeRate: 84, rateDate: '2026-10-30' }
};

const response = (payload: unknown, ok = true, status = 200): Response => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(payload)
} as unknown as Response);

const stubFetch = (fetchMock: ReturnType<typeof vi.fn>): void => {
  vi.stubGlobal('fetch', fetchMock);
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('currencyApiClient', () => {
  it('loads a validated D1 currency rate catalog', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(ratesPayload));
    stubFetch(fetchMock);

    await expect(currencyApiClient.getCurrencyRates()).resolves.toEqual(ratesPayload.data);
    expect(fetchMock).toHaveBeenCalledWith('/api/currency');
  });

  it('reports a server-provided error when the currency catalog request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ message: 'D1 unavailable' }, false, 503));
    stubFetch(fetchMock);

    await expect(currencyApiClient.getCurrencyRates()).rejects.toThrow('D1 unavailable');
  });

  it('uses the status-based message when an error response has no message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(null, false, 503));
    stubFetch(fetchMock);

    await expect(currencyApiClient.getCurrencyRates()).rejects.toThrow(UI_STRINGS.module1.fxReferenceRequestFailed(503));
  });

  it('rejects unreadable, invalid, and empty currency catalog payloads', async () => {
    const unreadable = response(null);
    (unreadable.json as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('invalid JSON'));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(unreadable)
      .mockResolvedValueOnce(response({ success: false, data: {} }))
      .mockResolvedValueOnce(response({ success: true, data: {} }));
    stubFetch(fetchMock);

    await expect(currencyApiClient.getCurrencyRates()).rejects.toThrow(UI_STRINGS.module1.fxReferenceResponseInvalid);
    await expect(currencyApiClient.getCurrencyRates()).rejects.toThrow(UI_STRINGS.module1.fxReferenceResponseInvalid);
    await expect(currencyApiClient.getCurrencyRates()).rejects.toThrow(UI_STRINGS.module1.fxReferenceResponseInvalid);
  });

  it('loads a validated D1 historical currency conversion', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(conversionPayload));
    stubFetch(fetchMock);

    await expect(currencyApiClient.getCurrencyConversion('USD', 2, 2026)).resolves.toEqual(conversionPayload.data);
    expect(fetchMock).toHaveBeenCalledWith('/api/currency?from=USD&amount=2&date=2026');
  });

  it('rejects invalid conversion responses and reports API errors', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ success: true, data: { ...conversionPayload.data, exchangeRate: 0 } }))
      .mockResolvedValueOnce(response({ message: 'Historical rate unavailable' }, false, 400));
    stubFetch(fetchMock);

    await expect(currencyApiClient.getCurrencyConversion('USD', 2, '2026-01-01'))
      .rejects.toThrow(UI_STRINGS.module1.fxReferenceResponseInvalid);
    await expect(currencyApiClient.getCurrencyConversion('USD', 2, '2026-01-01'))
      .rejects.toThrow('Historical rate unavailable');
  });
});
