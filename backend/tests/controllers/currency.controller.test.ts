import { describe, it, expect, vi } from 'vitest';
import { getCurrencyData } from '../../src/controllers/currency.controller';
import * as currencyService from '../../src/services/currencyService';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('currency.controller', () => {
  it('should return all FX rates when no query params are passed', async () => {
    const req: any = { query: {} };
    const res = mockResponse();

    await getCurrencyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.USD).toBeDefined();
  });

  it('should convert amount when from and amount are provided with year', async () => {
    const req: any = { query: { from: 'USD', amount: '100', year: '2024' } };
    const res = mockResponse();

    await getCurrencyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.amountINR).toBe(8350);
  });

  it('should convert amount when from and amount are provided with transaction date', async () => {
    const req: any = { query: { from: 'EUR', amount: '100', date: '2024-05-18' } };
    const res = mockResponse();

    await getCurrencyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.amountINR).toBe(9080);
    expect(body.data.fxRateUsed).toBe(90.80);
  });

  it('should fallback to 0 when amountStr is invalid', async () => {
    const req: any = { query: { from: 'USD', amount: 'not_a_number' } };
    const res = mockResponse();

    await getCurrencyData(req, res);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.amountINR).toBe(0);
  });

  it('should handle currency controller error with message', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    const spy = vi.spyOn(currencyService, 'getAllFXRates').mockImplementationOnce(() => {
      throw new Error('Rates error');
    });

    await getCurrencyData(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('should handle currency controller error without message fallback', async () => {
    const req: any = { query: {} };
    const res = mockResponse();
    const spy = vi.spyOn(currencyService, 'getAllFXRates').mockImplementationOnce(() => {
      throw {};
    });

    await getCurrencyData(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch currency rates' }));
    spy.mockRestore();
  });
});
