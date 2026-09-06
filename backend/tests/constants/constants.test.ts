import { describe, it, expect } from 'vitest';
import * as ConstantsIndex from '../../src/constants/index';
import * as AppConstants from '../../src/constants/app';
import * as CurrencyConstants from '../../src/constants/currency';
import * as LoggerConstants from '../../src/constants/logger';

describe('Backend Constants Modules', () => {
  describe('App Constants', () => {
    it('should define correct default application constants', () => {
      expect(AppConstants.DEFAULT_PORT).toBe(3001);
      expect(AppConstants.DEFAULT_PAGE_LIMIT).toBe(50);
      expect(AppConstants.DEFAULT_SPEND_BASELINE_INR_CR).toBe(732.41);
      expect(AppConstants.DEFAULT_SAVINGS_TARGET_INR_CR).toBe(119.67);
      expect(AppConstants.DEFAULT_SAVINGS_TARGET_PCT).toBe(16.4);
    });
  });

  describe('Currency Constants', () => {
    it('should define correct currency constants and FX rate mappings', () => {
      expect(CurrencyConstants.DEFAULT_BASE_CURRENCY).toBe('INR');
      expect(CurrencyConstants.INR_CRORES_DIVISOR).toBe(10000000);
      expect(CurrencyConstants.yahooFinanceFXRates).toBeDefined();
      expect(CurrencyConstants.yahooFinanceFXRates.USD.ticker).toBe('USDINR=X');
      expect(CurrencyConstants.yahooFinanceFXRates.EUR.currencyCode).toBe('EUR');
      expect(CurrencyConstants.yahooFinanceFXRates.GBP.currencyCode).toBe('GBP');
      expect(CurrencyConstants.yahooFinanceFXRates.AED.currencyCode).toBe('AED');
      expect(CurrencyConstants.yahooFinanceFXRates.JPY.currencyCode).toBe('JPY');
      expect(CurrencyConstants.yahooFinanceFXRates.SGD.currencyCode).toBe('SGD');
      expect(CurrencyConstants.yahooFinanceFXRates.INR.currencyCode).toBe('INR');
      expect(CurrencyConstants.yahooFinanceFXRates.INR.rate2023).toBe(1.0);
    });
  });

  describe('Logger Constants', () => {
    it('should define correct logger constants and level priorities', () => {
      expect(LoggerConstants.LEVEL_PRIORITY.debug).toBe(0);
      expect(LoggerConstants.LEVEL_PRIORITY.info).toBe(1);
      expect(LoggerConstants.LEVEL_PRIORITY.warn).toBe(2);
      expect(LoggerConstants.LEVEL_PRIORITY.error).toBe(3);
      expect(LoggerConstants.DEFAULT_SERVICE_NAME).toBe('consulting-backend');
      expect(LoggerConstants.DEFAULT_LOG_DIR_NAME).toBe('logs');
      expect(LoggerConstants.DEFAULT_MIN_LEVEL).toBe('debug');
      expect(LoggerConstants.DEFAULT_RETENTION_DAYS).toBe(14);
      expect(LoggerConstants.DEFAULT_MAX_MEMORY_LOGS).toBe(200);
      expect(LoggerConstants.DEFAULT_PURGE_INTERVAL_MS).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('Unified Constants Barrel', () => {
    it('should re-export all constants across modules', () => {
      expect(ConstantsIndex.DEFAULT_PORT).toBe(AppConstants.DEFAULT_PORT);
      expect(ConstantsIndex.DEFAULT_SERVICE_NAME).toBe(LoggerConstants.DEFAULT_SERVICE_NAME);
      expect(ConstantsIndex.DEFAULT_BASE_CURRENCY).toBe(CurrencyConstants.DEFAULT_BASE_CURRENCY);
      expect(ConstantsIndex.INR_CRORES_DIVISOR).toBe(CurrencyConstants.INR_CRORES_DIVISOR);
      expect(ConstantsIndex.LEVEL_PRIORITY).toBe(LoggerConstants.LEVEL_PRIORITY);
      expect(ConstantsIndex.yahooFinanceFXRates).toBe(CurrencyConstants.yahooFinanceFXRates);
    });
  });
});
