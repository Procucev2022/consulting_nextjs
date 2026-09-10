import { describe, it, expect } from 'vitest';
import { getAllFXRates, getFXRate, getFXRateAsOfDate, convertAmount } from '../../src/services/currencyService';

describe('currencyService', () => {
  it('should return all FX rates', () => {
    const rates = getAllFXRates();
    expect(rates).toBeDefined();
    expect(rates.USD).toBeDefined();
    expect(rates.EUR).toBeDefined();
  });

  it('should return FX rate for currency and year', () => {
    const rate = getFXRate('USD', 2024);
    expect(rate).toBe(83.50);
  });

  it('should return FX rate details as of date', () => {
    const info = getFXRateAsOfDate('EUR', '2024-05-18');
    expect(info.rate).toBe(90.80);
    expect(info.ticker).toBe('EURINR=X');
    expect(info.isHistorical).toBe(true);
  });

  it('should convert amount accurately', () => {
    const conversion = convertAmount(100, 'USD', 2024);
    expect(conversion.amountINR).toBe(8350);
    expect(conversion.inrCrores).toBe(0.000835);
  });
});
