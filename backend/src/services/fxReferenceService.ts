/**
 * Authoritative FX Reference Service (Command 4)
 * Loads, verifies, and indexes the frozen aiCEV FX Master v2.0
 * Provides high-performance, strictly deterministic currency normalization for Module 1.
 */

import type {
  FxCoverageStatus,
  FxRateResolutionResult,
  FxTransactionInput,
  FxNormalizedTransaction,
  FxSpendSummary,
  FxReferenceRecord,
  FxCurrencyMasterMetadata,
  FxRateRuleMetadata,
  FxMasterVersionMetadata
} from '../types/fxReference';
import {
  FX_MASTER_VERSION,
  FX_MASTER_AS_OF_DATE,
  CURRENCY_COVERAGE_STATUS_REGISTRY
} from '../constants/fxReference';
import { loadAndVerifyFxMaster } from './fxLoaderHelper';
import { normalizeTransactionList } from './fxNormalizationHelper';
import logger from '../utils/logger';

export class FxReferenceService {
  private static instance: FxReferenceService | null = null;

  private isLoaded: boolean = false;
  private verifiedChecksum: string = '';
  private filePathUsed: string = '';
  private dailyRatesMap: Map<string, FxReferenceRecord> = new Map();
  private datesByCurrency: Map<string, string[]> = new Map();
  private currenciesMetadata: Map<string, FxCurrencyMasterMetadata> = new Map();
  private rateRules: FxRateRuleMetadata[] = [];
  private versionMetadata: FxMasterVersionMetadata | null = null;

  public constructor(autoInit: boolean = true) {
    if (autoInit) {
      this.initialize();
    }
  }

  public static getInstance(): FxReferenceService {
    if (!FxReferenceService.instance) {
      FxReferenceService.instance = new FxReferenceService();
    }
    return FxReferenceService.instance;
  }

  public initialize(customPath?: string): void {
    if (this.isLoaded && !customPath) return;
    try {
      const data = loadAndVerifyFxMaster(customPath);
      this.verifiedChecksum = data.verifiedChecksum;
      this.filePathUsed = data.filePathUsed;
      this.dailyRatesMap = data.dailyRatesMap;
      this.datesByCurrency = data.datesByCurrency;
      this.currenciesMetadata = data.currenciesMetadata;
      this.rateRules = data.rateRules;
      this.versionMetadata = data.versionMetadata;
      this.isLoaded = true;

      logger.info('Authoritative FX Master initialized successfully', {
        version: FX_MASTER_VERSION,
        checksum: this.verifiedChecksum,
        totalObservations: this.dailyRatesMap.size,
        currenciesIndexed: this.datesByCurrency.size
      });
    } catch (error) {
      logger.error('Failed to initialize Authoritative FX Master', {}, error);
      throw error;
    }
  }

  private findPriorDate(sortedDates: string[], targetDate: string): string | null {
    if (!sortedDates || sortedDates.length === 0) return null;
    if (targetDate < sortedDates[0]) return null;
    if (targetDate >= sortedDates[sortedDates.length - 1]) return sortedDates[sortedDates.length - 1];

    let low = 0;
    let high = sortedDates.length - 1;
    let best: string | null = null;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midVal = sortedDates[mid];

      if (midVal <= targetDate) {
        best = midVal;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return best;
  }

  private resolveInrParity(cleanDate: string): FxRateResolutionResult {
    return {
      currency: 'INR',
      rate: 1.0,
      rateDateUsed: cleanDate || FX_MASTER_AS_OF_DATE,
      sourceId: 'SRC-003',
      sourceName: 'Official Base Currency Parity',
      rateType: 'BASE_PARITY',
      conversionMethod: 'BASE_CURRENCY',
      coverageStatus: 'FULL_DIRECT',
      fxMasterVersion: FX_MASTER_VERSION,
      status: 'CONVERTED',
      notes: 'Official base currency parity (1 INR = 1 INR)'
    };
  }

  private resolvePendingSource(curr: string): FxRateResolutionResult {
    return {
      currency: curr,
      rate: null,
      rateDateUsed: null,
      sourceId: null,
      sourceName: null,
      rateType: null,
      conversionMethod: 'UNRESOLVED',
      coverageStatus: 'PENDING_SOURCE',
      fxMasterVersion: FX_MASTER_VERSION,
      status: 'PENDING',
      notes: `Currency ${curr} has status PENDING_SOURCE in frozen master. No synthetic or external conversion allowed.`
    };
  }

  private resolveAedRate(cleanDate: string): FxRateResolutionResult {
    const exactRecord = this.dailyRatesMap.get(`AED_${cleanDate}`);
    if (exactRecord) {
      return {
        currency: 'AED',
        rate: exactRecord.inrPerUnit,
        rateDateUsed: cleanDate,
        sourceId: exactRecord.sourceId,
        sourceName: exactRecord.sourceName,
        rateType: exactRecord.rateType,
        conversionMethod: 'DIRECT_REFERENCE',
        coverageStatus: 'PARTIAL',
        fxMasterVersion: FX_MASTER_VERSION,
        status: 'CONVERTED',
        notes: 'Official RBI Reference Rate for AED'
      };
    }

    const sortedDates = this.datesByCurrency.get('AED') || [];
    const priorDate = this.findPriorDate(sortedDates, cleanDate);

    if (priorDate && priorDate >= '2026-01-05') {
      const priorRecord = this.dailyRatesMap.get(`AED_${priorDate}`);
      if (priorRecord) {
        return {
          currency: 'AED',
          rate: priorRecord.inrPerUnit,
          rateDateUsed: priorDate,
          sourceId: priorRecord.sourceId,
          sourceName: priorRecord.sourceName,
          rateType: priorRecord.rateType,
          conversionMethod: 'PRIOR_BUSINESS_DAY',
          coverageStatus: 'PARTIAL',
          fxMasterVersion: FX_MASTER_VERSION,
          status: 'CONVERTED',
          notes: `Weekend/Holiday fallback to prior published business day (${priorDate})`
        };
      }
    }

    return {
      currency: 'AED',
      rate: null,
      rateDateUsed: null,
      sourceId: null,
      sourceName: null,
      rateType: null,
      conversionMethod: 'UNRESOLVED',
      coverageStatus: 'PARTIAL',
      fxMasterVersion: FX_MASTER_VERSION,
      status: 'PENDING',
      notes: `Date ${cleanDate} precedes official RBI AED reference publication. No synthetic conversion permitted.`
    };
  }

  private resolveDirectOrPrior(
    curr: string,
    cleanDate: string,
    coverageStatus: FxCoverageStatus
  ): FxRateResolutionResult {
    const exactRecord = this.dailyRatesMap.get(`${curr}_${cleanDate}`);
    if (exactRecord) {
      const convMethod =
        exactRecord.conversionMethod === 'DERIVED_CROSS_RATE' || coverageStatus === 'HIGH_COVERAGE_DERIVED'
          ? 'DERIVED_CROSS_RATE'
          : 'DIRECT_REFERENCE';

      return {
        currency: curr,
        rate: exactRecord.inrPerUnit,
        rateDateUsed: cleanDate,
        sourceId: exactRecord.sourceId,
        sourceName: exactRecord.sourceName,
        rateType: exactRecord.rateType,
        conversionMethod: convMethod,
        coverageStatus,
        fxMasterVersion: FX_MASTER_VERSION,
        status: 'CONVERTED',
        notes: exactRecord.sourceName
      };
    }

    const sortedDates = this.datesByCurrency.get(curr) || [];
    const priorDate = this.findPriorDate(sortedDates, cleanDate);
    if (priorDate) {
      const priorRecord = this.dailyRatesMap.get(`${curr}_${priorDate}`);
      if (priorRecord) {
        return {
          currency: curr,
          rate: priorRecord.inrPerUnit,
          rateDateUsed: priorDate,
          sourceId: priorRecord.sourceId,
          sourceName: priorRecord.sourceName,
          rateType: priorRecord.rateType,
          conversionMethod: 'PRIOR_BUSINESS_DAY',
          coverageStatus,
          fxMasterVersion: FX_MASTER_VERSION,
          status: 'CONVERTED',
          notes: `Prior business day rate as of ${priorDate} (transaction date ${cleanDate} was weekend/holiday)`
        };
      }
    }

    return {
      currency: curr,
      rate: null,
      rateDateUsed: null,
      sourceId: null,
      sourceName: null,
      rateType: null,
      conversionMethod: 'UNRESOLVED',
      coverageStatus,
      fxMasterVersion: FX_MASTER_VERSION,
      status: 'PENDING',
      notes: `No approved rate found for ${curr} on or before ${cleanDate}`
    };
  }

  public resolveFxRate(currency: string, transactionDate: string): FxRateResolutionResult {
    if (!this.isLoaded) {
      this.initialize();
    }

    const curr = (currency || 'INR').toUpperCase().trim();
    const cleanDate = (transactionDate || '').slice(0, 10);
    const coverageStatus = CURRENCY_COVERAGE_STATUS_REGISTRY[curr] || 'PENDING_SOURCE';

    if (curr === 'INR') {
      return this.resolveInrParity(cleanDate);
    }
    if (['SAR', 'QAR', 'OMR', 'KWD', 'BHD'].includes(curr)) {
      return this.resolvePendingSource(curr);
    }
    if (curr === 'AED') {
      return this.resolveAedRate(cleanDate);
    }
    return this.resolveDirectOrPrior(curr, cleanDate, coverageStatus);
  }

  public normalizeTransactions(transactions: FxTransactionInput[]): {
    normalizedTransactions: FxNormalizedTransaction[];
    summary: FxSpendSummary;
  } {
    return normalizeTransactionList(transactions, (c, d) => this.resolveFxRate(c, d));
  }

  public getDailyRatesMap(): Map<string, FxReferenceRecord> { return this.dailyRatesMap; }
  public getDatesByCurrency(): Map<string, string[]> { return this.datesByCurrency; }
  public getCurrenciesMetadata(): FxCurrencyMasterMetadata[] { return Array.from(this.currenciesMetadata.values()); }
  public getRateRules(): FxRateRuleMetadata[] { return this.rateRules; }
  public getVersionMetadata(): FxMasterVersionMetadata | null { return this.versionMetadata; }
  public getVerifiedChecksum(): string { return this.verifiedChecksum; }
  public getFilePathUsed(): string { return this.filePathUsed; }
  public isMasterLoaded(): boolean { return this.isLoaded; }
  public getMasterVersion(): string { return FX_MASTER_VERSION; }
  public getMasterChecksum(): string { return this.verifiedChecksum || this.versionMetadata?.sha256Checksum || ''; }
  public getMasterFileName(): string { return this.versionMetadata?.workbookName || ''; }
  public getMasterAsOfDate(): string { return FX_MASTER_AS_OF_DATE; }
  public getObservationCount(): number { return this.dailyRatesMap.size; }
}

export const fxReferenceService = FxReferenceService.getInstance();
