/**
 * Module 3 PCBI Phase 2 — Auditable Material Mapping & Benchmark Safety Service
 * Enforces customer isolation, approval gates, unit/currency traceability, and zero-variance safety.
 */

import {
  BOROSIL_BENCHMARK_REQUIREMENTS_CATALOG,
  BOROSIL_INITIAL_MAPPING_RECORDS,
  BOROSIL_BENCHMARK_COVERAGE_SUMMARY
} from '../constants/module3PcbiBorosilCatalog';
import type {
  MaterialBenchmarkMappingRecord,
  BorosilBenchmarkRequirementsItem,
  BorosilBenchmarkCoverageSummary
} from '../types/module3PcbiMapping';
import logger from '../utils/logger';

export class Module3PcbiMappingService {
  private static mappingsStore = new Map<string, MaterialBenchmarkMappingRecord>();

  static {
    for (const record of BOROSIL_INITIAL_MAPPING_RECORDS) {
      this.mappingsStore.set(record.id, { ...record });
    }
  }

  public static getRequirementsCatalog(assessmentId: string): BorosilBenchmarkRequirementsItem[] {
    logger.info('Fetching Borosil benchmark requirements catalog', { assessmentId });
    if (assessmentId !== 'AIC-2026-0002') {
      return [];
    }
    return [...BOROSIL_BENCHMARK_REQUIREMENTS_CATALOG];
  }

  public static getMappings(assessmentId: string): MaterialBenchmarkMappingRecord[] {
    logger.info('Fetching auditable material benchmark mappings', { assessmentId });
    return Array.from(this.mappingsStore.values())
      .filter((m) => m.assessmentId === assessmentId)
      .map((m) => JSON.parse(JSON.stringify(m)));
  }

  public static getMappingByMaterialCode(
    materialCode: string,
    assessmentId: string
  ): MaterialBenchmarkMappingRecord | undefined {
    const key = (materialCode || '').trim().toUpperCase();
    const found = Array.from(this.mappingsStore.values()).find(
      (m) => m.assessmentId === assessmentId && m.materialCode.trim().toUpperCase() === key
    );
    return found ? JSON.parse(JSON.stringify(found)) : undefined;
  }

  public static updateMappingApproval(
    mappingId: string,
    approvalStatus: 'APPROVED' | 'REJECTED',
    actor: string,
    comment: string
  ): MaterialBenchmarkMappingRecord {
    const mapping = this.mappingsStore.get(mappingId);
    if (!mapping) {
      logger.error('Material benchmark mapping not found for approval update', { mappingId });
      throw new Error(`Mapping record '${mappingId}' was not found.`);
    }

    const timestamp = new Date().toISOString();
    mapping.approvalStatus = approvalStatus;
    mapping.approvedBy = approvalStatus === 'APPROVED' ? actor : undefined;
    mapping.approvalTimestamp = approvalStatus === 'APPROVED' ? timestamp : undefined;
    mapping.mappingStatus = approvalStatus === 'APPROVED' ? 'MAPPED_APPROVED' : 'REJECTED';

    mapping.auditHistory.unshift({
      action: approvalStatus === 'APPROVED' ? 'MAPPING_APPROVED' : 'MAPPING_REJECTED',
      actor,
      timestamp,
      comment
    });

    logger.info('Updated material benchmark mapping approval status', {
      mappingId,
      approvalStatus,
      actor,
      timestamp
    });

    return { ...mapping };
  }

  public static validateCalculationSafety(params: {
    mapping?: MaterialBenchmarkMappingRecord;
    transactionDate: string;
    latestObservationDate?: string;
  }): {
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
  } {
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

    return { isSafe: true, status: 'VALID' };
  }

  public static getCoverageSummary(assessmentId: string): BorosilBenchmarkCoverageSummary {
    logger.info('Calculating Borosil benchmark coverage summary', { assessmentId });
    if (assessmentId !== 'AIC-2026-0002') {
      throw new Error(`Assessment '${assessmentId}' was not found in persistence store.`);
    }

    const mappings = this.getMappings(assessmentId);
    const approvedSpendCr = mappings
      .filter((m) => m.approvalStatus === 'APPROVED')
      .reduce((sum, m) => sum + m.historicalSpendCr, 0);

    const pendingSpendCr = mappings
      .filter((m) => m.approvalStatus === 'PENDING')
      .reduce((sum, m) => sum + m.historicalSpendCr, 0);

    const baselineSpendCr = BOROSIL_BENCHMARK_COVERAGE_SUMMARY.baselineSpendCr;

    return {
      ...BOROSIL_BENCHMARK_COVERAGE_SUMMARY,
      mappedApprovedSpendCr: Number(approvedSpendCr.toFixed(4)),
      mappedApprovedSpendPct: Number(((approvedSpendCr / baselineSpendCr) * 100).toFixed(2)),
      mappedPendingApprovalSpendCr: Number(pendingSpendCr.toFixed(4)),
      marketVarianceValueCr: 0.0,
      certifiedSavingsCr: 0.0,
      realizedSavingsCr: 0.0,
      module4Executed: false
    };
  }

  public static resetStore(): void {
    this.mappingsStore.clear();
    for (const record of BOROSIL_INITIAL_MAPPING_RECORDS) {
      this.mappingsStore.set(record.id, { ...record });
    }
  }
}
