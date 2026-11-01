/**
 * Module 3 PCBI — Benchmark Safety Validator
 * Enforces zero synthetic variance safety, approval gate, and observation recency.
 * Conforms to Rule 8 (constants isolation), Rule 9 (types isolation), max lines <= 300.
 */

import type { MaterialBenchmarkMappingRecord } from '../types/module3PcbiMapping';

export interface CalculationSafetyResult {
  isSafe: boolean;
  reason?: string;
  status:
    | 'VALID'
    | 'UNAPPROVED_MAPPING'
    | 'INCOMPATIBLE_SPECIFICATION'
    | 'INCOMPATIBLE_UOM'
    | 'STALE_OBSERVATION'
    | 'UNAVAILABLE'
    | 'UNMAPPED_MATERIAL';
}

export class Module3PcbiSafetyValidator {
  public static validate(params: {
    mapping?: MaterialBenchmarkMappingRecord;
    transactionDate: string;
    latestObservationDate?: string;
  }): CalculationSafetyResult {
    const { mapping, transactionDate, latestObservationDate } = params;

    if (!mapping) {
      return {
        isSafe: false,
        reason: 'Material has no registered benchmark mapping (unmapped spend).',
        status: 'UNMAPPED_MATERIAL'
      };
    }

    if (mapping.approvalStatus !== 'APPROVED') {
      return {
        isSafe: false,
        reason: `Mapping approval is ${mapping.approvalStatus}; unapproved mappings cannot produce price variances.`,
        status: 'UNAPPROVED_MAPPING'
      };
    }

    if (
      mapping.specificationComparability === 'NOT_COMPARABLE' ||
      mapping.specificationComparability === 'UNVERIFIED'
    ) {
      return {
        isSafe: false,
        reason: `Specification comparability is '${mapping.specificationComparability}'. Variance calculation blocked.`,
        status: 'INCOMPATIBLE_SPECIFICATION'
      };
    }

    if (
      !mapping.unitConversion ||
      !mapping.unitConversion.isTraceable ||
      mapping.unitConversion.conversionFactor <= 0
    ) {
      return {
        isSafe: false,
        reason: 'Invalid or untraceable unit of measure conversion rule.',
        status: 'INCOMPATIBLE_UOM'
      };
    }

    if (!latestObservationDate) {
      return {
        isSafe: false,
        reason: 'Missing benchmark observation for transaction date; explicit unavailable state enforced.',
        status: 'UNAVAILABLE'
      };
    }

    const txTime = new Date(transactionDate).getTime();
    const obsTime = new Date(latestObservationDate).getTime();
    const diffDays = Math.abs(txTime - obsTime) / (1000 * 60 * 60 * 24);

    if (diffDays > 90) {
      return {
        isSafe: false,
        reason: `Benchmark observation date (${latestObservationDate}) is stale compared to PO date (${transactionDate}). Lag: ${Math.round(diffDays)} days.`,
        status: 'STALE_OBSERVATION'
      };
    }

    return {
      isSafe: true,
      status: 'VALID'
    };
  }
}
