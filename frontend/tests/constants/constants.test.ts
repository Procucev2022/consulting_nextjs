import { describe, it, expect } from 'vitest';
import * as ConstantsIndex from '../../src/constants/index';
import * as AppConstants from '../../src/constants/app';
import * as CurrencyConstants from '../../src/constants/currency';
import * as LoggerConstants from '../../src/constants/logger';
import * as PipelineConstants from '../../src/constants/pipeline';
import * as ModalsConstants from '../../src/constants/modals';

describe('Frontend Constants Modules', () => {
  describe('App Constants', () => {
    it('should define correct default application metrics and tenant name', () => {
      expect(AppConstants.DEFAULT_SPEND_BASELINE_INR_CR).toBe(732.41);
      expect(AppConstants.DEFAULT_SAVINGS_TARGET_INR_CR).toBe(119.67);
      expect(AppConstants.DEFAULT_SAVINGS_TARGET_PCT).toBe(16.4);
      expect(AppConstants.DEFAULT_SAAS_FEE_RATE).toBe(0.85);
      expect(AppConstants.DEFAULT_TENANT_ENTERPRISE_NAME).toBe('Apex Industrial Dynamics (Fortune 500)');
    });
  });

  describe('Currency Constants', () => {
    it('should define correct currency constants and FX rate mappings', () => {
      expect(CurrencyConstants.DEFAULT_BASE_CURRENCY).toBe('INR');
      expect(CurrencyConstants.INR_CRORES_DIVISOR).toBe(10000000);
      expect(CurrencyConstants.SUPPORTED_HEADER_CURRENCIES).toEqual(['INR', 'USD', 'EUR', 'GBP']);
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
    it('should define correct logger constants and priorities', () => {
      expect(LoggerConstants.LEVEL_PRIORITY.debug).toBe(0);
      expect(LoggerConstants.LEVEL_PRIORITY.info).toBe(1);
      expect(LoggerConstants.LEVEL_PRIORITY.warn).toBe(2);
      expect(LoggerConstants.LEVEL_PRIORITY.error).toBe(3);
      expect(LoggerConstants.DEFAULT_SERVICE_NAME).toBe('consulting-frontend');
      expect(LoggerConstants.DEFAULT_MIN_LEVEL).toBe('debug');
      expect(LoggerConstants.DEFAULT_MAX_HISTORY).toBe(100);
    });
  });

  describe('Pipeline & Analytics Constants', () => {
    it('should define correct timeline labels and trend datasets', () => {
      expect(PipelineConstants.TIMELINE_MONTHS.length).toBe(10);
      expect(PipelineConstants.TIMELINE_MONTHS[0]).toBe('M1 (Q1-23)');
      expect(PipelineConstants.TIMELINE_MONTHS[9]).toBe('M36 (Q2-26)');
      expect(PipelineConstants.MARKET_INDEX_DATA.length).toBe(10);
      expect(PipelineConstants.MARKET_INDEX_DATA[0]).toBe(100);
      expect(PipelineConstants.VENDOR_INVOICED_DATA.length).toBe(10);
      expect(PipelineConstants.VENDOR_INVOICED_DATA[0]).toBe(100);
    });
  });

  describe('Modal Constants', () => {
    it('should define correct modal defaults and supplier lists', () => {
      expect(ModalsConstants.DEFAULT_INVITED_SUPPLIERS.length).toBe(5);
      expect(ModalsConstants.DEFAULT_INVITED_SUPPLIERS[0]).toBe('Amcor Packaging Group');
      expect(ModalsConstants.DEFAULT_PROCPX_BASELINE).toBe(1850000);
      expect(ModalsConstants.DEFAULT_MASTER_SUPPLIERS.length).toBe(3);
      expect(ModalsConstants.DEFAULT_MASTER_SUPPLIERS[0].id).toBe('SUP-DHL-001');
      expect(ModalsConstants.DEFAULT_MAX_PRICE_CREEP_CAP).toBe(3.0);
      expect(ModalsConstants.DEFAULT_INDEX_PEGGING).toBe('LME & ICIS Official Benchmark');
    });
  });

  describe('Vendor Supply Constants', () => {
    it('should define correct thresholds and badge styles', () => {
      expect(ConstantsIndex.VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR).toBe(15.0);
      expect(ConstantsIndex.VENDOR_SUPPLY_THRESHOLDS.MID_SPEND_THRESHOLD_CR).toBe(5.0);
      expect(ConstantsIndex.VENDOR_SUPPLY_THRESHOLDS.MULTI_CATEGORY_ALARM_SPEND_SHARE_THRESHOLD).toBe(0.50);
      expect(ConstantsIndex.VENDOR_SUPPLY_TIERS.TIER_1_HIGH.id).toBe('TIER_1_HIGH');
      expect(ConstantsIndex.VENDOR_SUPPLY_BADGE_STYLES.SINGLE_CATEGORY.badgeClass).toContain('bg-emerald');
      expect(ConstantsIndex.VENDOR_SUPPLY_BADGE_STYLES.MULTI_CATEGORY.badgeClass).toContain('bg-amber');
      expect(ConstantsIndex.VENDOR_SUPPLY_BADGE_STYLES.HIGH_RISK.badgeClass).toContain('bg-rose');
      expect(ConstantsIndex.VENDOR_SUPPLY_BADGE_STYLES.MEDIUM_RISK.badgeClass).toContain('bg-amber');
      expect(ConstantsIndex.VENDOR_SUPPLY_BADGE_STYLES.OPTIMAL.badgeClass).toContain('bg-emerald');
    });
  });

  describe('Presentation Constants', () => {
    it('should define correct presentation slide totals and metadata list', () => {
      expect(ConstantsIndex.PRESENTATION_TOTAL_SLIDES).toBe(10);
      expect(ConstantsIndex.PROCUCEV_LOGO_SRC).toBe('/images/procucev-logo.jpg');
      expect(ConstantsIndex.PRESENTATION_SLIDES_LIST.length).toBe(10);
      expect(ConstantsIndex.PRESENTATION_SLIDES_LIST[0].id).toBe('cover');
      expect(ConstantsIndex.PRESENTATION_SLIDES_LIST[1].id).toBe('confidentiality');
      expect(ConstantsIndex.PRESENTATION_SLIDES_LIST[2].id).toBe('about');
    });
  });

  describe('Vendor Consolidation Constants', () => {
    it('should define correct thresholds and category tabs', () => {
      expect(ConstantsIndex.VENDOR_CONSOLIDATION_THRESHOLDS.MIN_VENDOR_COUNT_THRESHOLD).toBe(5);
      expect(ConstantsIndex.VENDOR_CONSOLIDATION_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR).toBe(10.0);
      expect(ConstantsIndex.VENDOR_CONSOLIDATION_THRESHOLDS.DEFAULT_EST_SAVINGS_PCT).toBe(14.5);
      expect(ConstantsIndex.CONSOLIDATION_CATEGORY_TABS.length).toBe(5);
      expect(ConstantsIndex.CONSOLIDATION_SORT_OPTIONS.length).toBe(3);
      expect(ConstantsIndex.DEFAULT_AUCTION_PLATFORM).toBe('DPS NXT');
    });
  });

  describe('Unified Constants Barrel Export', () => {
    it('should re-export all constants across modules including UI_STRINGS and presentation', () => {
      expect(ConstantsIndex.DEFAULT_SPEND_BASELINE_INR_CR).toBe(AppConstants.DEFAULT_SPEND_BASELINE_INR_CR);
      expect(ConstantsIndex.DEFAULT_BASE_CURRENCY).toBe(CurrencyConstants.DEFAULT_BASE_CURRENCY);
      expect(ConstantsIndex.INR_CRORES_DIVISOR).toBe(CurrencyConstants.INR_CRORES_DIVISOR);
      expect(ConstantsIndex.SUPPORTED_HEADER_CURRENCIES).toBe(CurrencyConstants.SUPPORTED_HEADER_CURRENCIES);
      expect(ConstantsIndex.LEVEL_PRIORITY).toBe(LoggerConstants.LEVEL_PRIORITY);
      expect(ConstantsIndex.DEFAULT_SERVICE_NAME).toBe(LoggerConstants.DEFAULT_SERVICE_NAME);
      expect(ConstantsIndex.TIMELINE_MONTHS).toBe(PipelineConstants.TIMELINE_MONTHS);
      expect(ConstantsIndex.DEFAULT_INVITED_SUPPLIERS).toBe(ModalsConstants.DEFAULT_INVITED_SUPPLIERS);
      expect(ConstantsIndex.VENDOR_SUPPLY_THRESHOLDS).toBeDefined();
      expect(ConstantsIndex.PRESENTATION_TOTAL_SLIDES).toBe(10);
      expect(ConstantsIndex.VENDOR_CONSOLIDATION_THRESHOLDS).toBeDefined();
      expect(ConstantsIndex.UI_STRINGS).toBeDefined();
    });
  });
});
