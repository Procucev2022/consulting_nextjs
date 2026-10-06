/**
 * Helper to load and parse the authoritative frozen FX Master workbook.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import type {
  FxReferenceRecord,
  FxCurrencyMasterMetadata,
  FxRateRuleMetadata,
  FxMasterVersionMetadata
} from '../types/fxReference';
import {
  AUTHORITATIVE_FX_MASTER_FILENAME,
  EXPECTED_FX_MASTER_CHECKSUM,
  FX_MASTER_VERSION,
  CURRENCY_COVERAGE_STATUS_REGISTRY
} from '../constants/fxReference';
import logger from '../utils/logger';

export interface LoadedFxMasterData {
  verifiedChecksum: string;
  filePathUsed: string;
  dailyRatesMap: Map<string, FxReferenceRecord>;
  datesByCurrency: Map<string, string[]>;
  currenciesMetadata: Map<string, FxCurrencyMasterMetadata>;
  rateRules: FxRateRuleMetadata[];
  versionMetadata: FxMasterVersionMetadata | null;
}

export function resolveFxMasterPath(customMasterPath?: string): string {
  if (customMasterPath) {
    return customMasterPath;
  }
  return path.resolve(process.cwd(), AUTHORITATIVE_FX_MASTER_FILENAME);
}

function buildRecordFromRow(
  r: Record<string, unknown>,
  currency: string,
  rateDate: string,
  inrPerUnit: number
): FxReferenceRecord {
  return {
    currency,
    rateDate,
    rawRate: r['Raw Rate'] != null ? Number(r['Raw Rate']) : null,
    rawUnit: r['Raw Unit'] != null ? Number(r['Raw Unit']) : null,
    rawQuoteConvention: r['Raw Quote Convention'] ? String(r['Raw Quote Convention']) : null,
    inrPerUnit,
    sourceId: String(r['Source ID']),
    sourceName: String(r['Source Name']),
    rateType: String(r['Rate Type']),
    conversionMethod: String(r['Conversion Method']),
    rateStatus: String(r['Rate Status']),
    fxMasterVersion: FX_MASTER_VERSION
  };
}

function parseDailySheet(
  sheet: XLSX.WorkSheet | undefined,
  dailyRatesMap: Map<string, FxReferenceRecord>,
  datesByCurrency: Map<string, string[]>
): void {
  if (!sheet) return;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const datesSetByCurr: Map<string, Set<string>> = new Map();

  for (const r of rows) {
    const currency = String(r['Currency']).trim().toUpperCase();
    const rateDate = String(r['Rate Date']).trim();
    const inrPerUnit = Number(r['INR per Unit']);

    if (!currency || !rateDate || isNaN(inrPerUnit)) continue;

    const record = buildRecordFromRow(r, currency, rateDate, inrPerUnit);
    dailyRatesMap.set(`${currency}_${rateDate}`, record);

    let set = datesSetByCurr.get(currency);
    if (!set) {
      set = new Set<string>();
      datesSetByCurr.set(currency, set);
    }
    set.add(rateDate);
  }

  for (const [curr, set] of datesSetByCurr.entries()) {
    datesByCurrency.set(curr, Array.from(set).sort());
  }
}

function parseCurrencyMasterSheet(
  sheet: XLSX.WorkSheet | undefined,
  currenciesMetadata: Map<string, FxCurrencyMasterMetadata>
): void {
  if (!sheet) return;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  for (const r of rows) {
    const code = String(r['Currency']).trim().toUpperCase();
    if (code) {
      currenciesMetadata.set(code, {
        currency: code,
        currencyName: String(r['Currency Name']),
        approvedSource: String(r['Population Method']),
        coverageStatus: CURRENCY_COVERAGE_STATUS_REGISTRY[code] || 'PENDING_SOURCE'
      });
    }
  }
}

function parseRateRulesSheet(sheet: XLSX.WorkSheet | undefined): FxRateRuleMetadata[] {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows.map((r) => ({
    ruleId: String(r['Rule ID']),
    rule: String(r['Rule']),
    implementationRequirement: String(r['Implementation Requirement']),
    controlType: String(r['Control Type'])
  }));
}

function parseVersionSheet(
  sheet: XLSX.WorkSheet | undefined,
  verifiedChecksum: string,
  _totalRecords: number
): FxMasterVersionMetadata | null {
  if (!sheet) return null;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const vr = rows[0];
  if (!vr) return null;

  return {
    versionId: String(vr['Version ID']),
    workbookName: String(vr['Workbook Name']),
    createdDate: String(vr['Created Date']),
    coverageStart: String(vr['Coverage Start']),
    coverageEnd: String(vr['Coverage End']),
    currencies: Number(vr['Currencies']),
    totalRecords: Number(vr['Total Records']),
    sourceMix: String(vr['Source Mix']),
    createdBy: String(vr['Created By']),
    sha256Checksum: verifiedChecksum,
    validationStatus: String(vr['Validation Status'])
  };
}

const GLOBAL_CACHE_KEY = '__AICEV_FX_MASTER_CACHE__';

export function clearFxMasterCache(): void {
  delete (globalThis as Record<string, unknown>)[GLOBAL_CACHE_KEY];
}

function getGlobalCache(): LoadedFxMasterData | null {
  return ((globalThis as Record<string, unknown>)[GLOBAL_CACHE_KEY] as LoadedFxMasterData) || null;
}

function setGlobalCache(data: LoadedFxMasterData): void {
  (globalThis as Record<string, unknown>)[GLOBAL_CACHE_KEY] = data;
}

export function loadAndVerifyFxMaster(customPath?: string): LoadedFxMasterData {
  const masterPath = customPath || resolveFxMasterPath();
  if (!fs.existsSync(masterPath)) {
    logger.error('Frozen FX master file not found', { masterPath });
    throw new Error(`Frozen FX master file not found: ${masterPath}`);
  }

  const cached = getGlobalCache();
  if (
    cached &&
    cached.filePathUsed === masterPath
  ) {
    return cached;
  }

  const fileBuffer = fs.readFileSync(masterPath);
  const computedChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  if (computedChecksum !== EXPECTED_FX_MASTER_CHECKSUM) {
    logger.error('CRITICAL: FX master checksum mismatch! Frozen integrity violated', {
      expected: EXPECTED_FX_MASTER_CHECKSUM,
      actual: computedChecksum,
      filePath: masterPath
    });
    throw new Error(`FX Master checksum mismatch: expected ${EXPECTED_FX_MASTER_CHECKSUM}, got ${computedChecksum}`);
  }

  const dailyRatesMap = new Map<string, FxReferenceRecord>();
  const datesByCurrency = new Map<string, string[]>();
  const currenciesMetadata = new Map<string, FxCurrencyMasterMetadata>();

  const wb = XLSX.read(fileBuffer, { type: 'buffer' });
  parseDailySheet(wb.Sheets['FX_MASTER_DAILY'], dailyRatesMap, datesByCurrency);
  parseCurrencyMasterSheet(wb.Sheets['FX_CURRENCY_MASTER'], currenciesMetadata);
  const rateRules = parseRateRulesSheet(wb.Sheets['FX_RATE_RULES']);
  const versionMetadata = parseVersionSheet(wb.Sheets['FX_MASTER_VERSION'], computedChecksum, dailyRatesMap.size);

  const result: LoadedFxMasterData = {
    verifiedChecksum: computedChecksum,
    filePathUsed: masterPath,
    dailyRatesMap,
    datesByCurrency,
    currenciesMetadata,
    rateRules,
    versionMetadata
  };
  setGlobalCache(result);
  return result;
}

export {
  buildRecordFromRow,
  parseDailySheet,
  parseCurrencyMasterSheet,
  parseRateRulesSheet,
  parseVersionSheet
};
