import type { D1CurrencyConversionResponse, D1CurrencyRate } from '../types';
import { d1CurrencyConversionResponseSchema, d1CurrencyRatesResponseSchema } from '../constants/validation';
import { UI_STRINGS } from '../constants/uiStrings';
import frontendLogger from './logger';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const responseMessage = (payload: unknown, status: number): string =>
  typeof payload === 'object' && payload !== null &&
  'message' in payload && typeof payload.message === 'string'
    ? payload.message
    : UI_STRINGS.module1.fxReferenceRequestFailed(status);

const readCurrencyPayload = async (response: Response): Promise<unknown> =>
  Promise.resolve(response.json()).catch(() => null);

const ensureOkResponse = (response: Response, payload: unknown): void => {
  if (response.ok) return;
  throw new Error(responseMessage(payload, response.status));
};

export const currencyApiClient = {
  async getCurrencyRates(): Promise<Record<string, D1CurrencyRate>> {
    frontendLogger.debug('Fetching D1 currency reference catalog');
    const response = await fetch(`${API_BASE}/api/currency`);
    const payload = await readCurrencyPayload(response);
    ensureOkResponse(response, payload);
    const parsed = d1CurrencyRatesResponseSchema.safeParse(payload);
    if (!parsed.success || Object.keys(parsed.data.data).length === 0) {
      throw new Error(UI_STRINGS.module1.fxReferenceResponseInvalid);
    }
    return parsed.data.data;
  },

  async getCurrencyConversion(
    from: string,
    amount: number,
    dateOrYear?: string | number
  ): Promise<D1CurrencyConversionResponse['data']> {
    frontendLogger.debug('Calling currency conversion API', { from, amount, dateOrYear });
    const query = new URLSearchParams({
      from,
      amount: String(amount),
      ...(dateOrYear ? { date: String(dateOrYear) } : {})
    });
    const response = await fetch(`${API_BASE}/api/currency?${query.toString()}`);
    const payload = await readCurrencyPayload(response);
    ensureOkResponse(response, payload);
    const parsed = d1CurrencyConversionResponseSchema.safeParse(payload);
    if (!parsed.success) throw new Error(UI_STRINGS.module1.fxReferenceResponseInvalid);
    return parsed.data.data;
  }
};
