/**
 * PCBI Reference Dataset Row Validation Helpers
 * Provides ValidationContext and delegates row-level checks to specialized modular validators
 */

import type { PCBIValidationIssue } from '../types/pcbiAdmin';
import type { MasterDefinitionRecord } from './pcbiMasterRowValidator';

export type { MasterDefinitionRecord };
export {
  handleMasterDisambiguation,
  checkMasterQuality,
  checkMasterBenchmarkability,
  validateMasterRow
} from './pcbiMasterRowValidator';

export {
  checkWeeklyDate,
  checkWeeklyValue,
  validateWeeklyRow
} from './pcbiWeeklyRowValidator';

export {
  validateConstituentsRow,
  checkConstituentTotals,
  validateSourcesRow,
  validateUnspscRow
} from './pcbiDatasetValidators';

export interface ValidationContext {
  issues: PCBIValidationIssue[];
  pcbiMasterDefinitions: Map<string, MasterDefinitionRecord[]>;
  technicalIdsGenerated: Set<string>;
  weeklyKeySeen: Set<string>;
  qualityCounts: { A: number; B: number; C: number };
  missingQualityCount: number;
  missingBenchmarkabilityCount: number;
  totalBenchmarkabilitySum: number;
  benchmarkabilityCount: number;
  dateMin: string | null;
  dateMax: string | null;
  sourcePendingCount: number;
  invalidIndexCount: number;
  constituentWeightsByPcbi: Map<string, { total: number; name?: string }>;
  uniquePcbiIds: Set<string>;
  pcbiIdsSeen: Set<string>;
  constituentWeightIssuesCount: number;
  duplicateTechnicalIdsCount: number;
  duplicateWeeklyRecordsCount: number;
  missingSourceCount: number;
  missingUnspscCount: number;
}

export function createValidationContext(): ValidationContext {
  const unique = new Set<string>();
  return {
    issues: [],
    pcbiMasterDefinitions: new Map(),
    technicalIdsGenerated: new Set(),
    weeklyKeySeen: new Set(),
    qualityCounts: { A: 0, B: 0, C: 0 },
    missingQualityCount: 0,
    missingBenchmarkabilityCount: 0,
    totalBenchmarkabilitySum: 0,
    benchmarkabilityCount: 0,
    dateMin: null,
    dateMax: null,
    sourcePendingCount: 0,
    invalidIndexCount: 0,
    constituentWeightsByPcbi: new Map(),
    uniquePcbiIds: unique,
    pcbiIdsSeen: unique,
    constituentWeightIssuesCount: 0,
    duplicateTechnicalIdsCount: 0,
    duplicateWeeklyRecordsCount: 0,
    missingSourceCount: 0,
    missingUnspscCount: 0
  };
}

export function extractFieldValue(
  row: Record<string, unknown>,
  mappingMap: Map<string, string>,
  field: string
): unknown {
  for (const [col, f] of mappingMap.entries()) {
    if (f === field) return row[col];
  }
  return row[field];
}
