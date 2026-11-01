/**
 * Module 3 PCBI Mapping Mutation Helper
 * Extracted pure mutation routines to maintain strict <= 300 lines rule in Module3PcbiMappingService.
 */

import { BOROSIL_MISSING_INDEX_GAP_REPORT } from '../constants/module3PcbiGapList';
import type { MaterialBenchmarkMappingRecord } from '../types/module3PcbiMapping';

export interface ProposeOrUpdateParams {
  assessmentId: string;
  materialCode: string;
  materialDescription?: string;
  commodityClassification?: string;
  spendCategory?: string;
  unspscCode?: string;
  historicalSpendCr?: number;
  transactionCount?: number;
  benchmarkSeriesId?: string;
  benchmarkSeriesName?: string;
  benchmarkPublisher?: string;
  specificationComparability?: 'IDENTICAL_GRADE' | 'PROXY_GRADE' | 'NOT_COMPARABLE' | 'UNVERIFIED';
  actionType: 'PROPOSE_CANDIDATE' | 'NO_SUITABLE_BENCHMARK' | 'NEW_SERIES_REQUIRED';
  actor: string;
  rationale: string;
}

export class Module3PcbiMappingMutationHelper {
  public static syncGapItemOnApproval(
    mapping: MaterialBenchmarkMappingRecord,
    approvalStatus: 'APPROVED' | 'REJECTED'
  ): void {
    const gapItem = BOROSIL_MISSING_INDEX_GAP_REPORT.items.find(
      (it) => it.materialCode.trim().toUpperCase() === mapping.materialCode.trim().toUpperCase()
    );
    if (!gapItem) return;

    if (approvalStatus === 'APPROVED' && mapping.benchmarkSeriesId && mapping.benchmarkSeriesId !== 'NONE') {
      gapItem.pcbiSeriesId = mapping.benchmarkSeriesId;
      gapItem.benchmarkSeriesName = mapping.benchmarkSeriesName ?? null;
      gapItem.benchmarkPublisherSource = mapping.benchmarkPublisher || 'PCBI Benchmark';
      gapItem.gapStatus = 'BENCHMARK DEFINED — OBSERVATIONS MISSING';
      gapItem.gapReason = 'Approved benchmark series mapped. Ready for observation acquisition and upload.';
      gapItem.nextActionRequired = 'Acquire and upload benchmark observations for approved series.';
    } else if (approvalStatus === 'REJECTED') {
      gapItem.gapStatus = 'NO SUITABLE BENCHMARK IDENTIFIED';
      gapItem.gapReason = mapping.evidenceRationale || 'Rejected candidate mapping.';
      gapItem.nextActionRequired = 'Re-evaluate requirement with PCBI category manager.';
    }
  }

  public static applyNoSuitableBenchmark(
    mapping: MaterialBenchmarkMappingRecord,
    actor: string,
    timestamp: string,
    rationale: string,
    materialCode: string
  ): void {
    mapping.benchmarkSeriesId = 'NONE';
    mapping.benchmarkSeriesName = 'No suitable benchmark identified';
    mapping.benchmarkPublisher = 'N/A (Excluded)';
    mapping.specificationComparability = 'NOT_COMPARABLE';
    mapping.mappingStatus = 'NO_SUITABLE_BENCHMARK_IDENTIFIED';
    mapping.approvalStatus = 'APPROVED';
    mapping.approvedBy = actor;
    mapping.approvalTimestamp = timestamp;
    mapping.evidenceRationale = rationale || 'Custom-engineered / proprietary specification with no public spot commodity.';
    mapping.auditHistory.unshift({
      action: 'CLASSIFIED_NOT_BENCHMARKABLE',
      actor,
      timestamp,
      comment: rationale || 'Excluded from PCBI calculations (Zero Synthetic Variance Rule).'
    });
    const gapItem = BOROSIL_MISSING_INDEX_GAP_REPORT.items.find(
      (it) => it.materialCode.trim().toUpperCase() === materialCode.trim().toUpperCase()
    );
    if (gapItem) {
      gapItem.gapStatus = 'NO SUITABLE BENCHMARK IDENTIFIED';
      gapItem.gapReason = mapping.evidenceRationale;
      gapItem.nextActionRequired = 'Excluded from PCBI calculations (Zero Synthetic Variance Rule).';
    }
  }

  public static applyNewSeriesRequired(
    mapping: MaterialBenchmarkMappingRecord,
    actor: string,
    timestamp: string,
    rationale: string
  ): void {
    mapping.benchmarkSeriesId = 'NEW_SERIES_REQUESTED';
    mapping.benchmarkSeriesName = 'New Benchmark Series Required';
    mapping.benchmarkPublisher = 'Research Queue';
    mapping.mappingStatus = 'NEW_BENCHMARK_SERIES_REQUIRED';
    mapping.approvalStatus = 'PENDING';
    mapping.evidenceRationale = rationale || 'New benchmark series requested for commodity catalog expansion.';
    mapping.auditHistory.unshift({
      action: 'REQUESTED_NEW_BENCHMARK_SERIES',
      actor,
      timestamp,
      comment: rationale || 'Submitted new series request to PCBI Research Queue.'
    });
  }

  public static applyProposedCandidate(
    mapping: MaterialBenchmarkMappingRecord,
    params: ProposeOrUpdateParams,
    timestamp: string
  ): void {
    mapping.benchmarkSeriesId = params.benchmarkSeriesId;
    mapping.benchmarkSeriesName = params.benchmarkSeriesName;
    mapping.benchmarkPublisher = params.benchmarkPublisher;
    mapping.specificationComparability = params.specificationComparability || 'IDENTICAL_GRADE';
    mapping.mappingStatus = 'MAPPED_PENDING_APPROVAL';
    mapping.approvalStatus = 'PENDING';
    mapping.evidenceRationale = params.rationale;
    mapping.unitConversion = {
      sourceUom: mapping.sourceUom || 'MT',
      targetBenchmarkUom: mapping.sourceUom || 'MT',
      conversionFactor: 1.0,
      isTraceable: true
    };
    mapping.currencyConversion = {
      sourceCurrency: 'INR',
      targetBenchmarkCurrency: 'INR',
      fxSource: 'RBI_OFFICIAL',
      isTraceable: true
    };
    mapping.auditHistory.unshift({
      action: 'PROPOSED_BENCHMARK_MAPPING',
      actor: params.actor,
      timestamp,
      comment: params.rationale || `Proposed benchmark series ${params.benchmarkSeriesId}. Awaiting review approval.`
    });
  }

  public static buildDefaultMapping(params: ProposeOrUpdateParams, mappingId: string): MaterialBenchmarkMappingRecord {
    return {
      id: mappingId,
      assessmentId: params.assessmentId,
      customerName: 'Borosil Ltd',
      materialCode: params.materialCode,
      materialDescription: params.materialDescription || 'Material Requirement',
      spendCategory: params.spendCategory || '11100',
      unspscCode: params.unspscCode || 'N/A',
      unspscCommodity: params.commodityClassification || 'Direct Raw Materials',
      historicalSpendInr: (params.historicalSpendCr || 0) * 10000000,
      historicalSpendCr: params.historicalSpendCr || 0,
      transactionCount: params.transactionCount || 0,
      sourceUom: 'MT',
      sourceCurrency: 'INR',
      sourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
      specificationComparability: 'IDENTICAL_GRADE',
      geographyCompatibility: 'DOMESTIC_EX_WORKS',
      deliveryTermCompatibility: 'EX_WORKS_MATCHED',
      unitConversion: {
        sourceUom: 'MT',
        targetBenchmarkUom: 'MT',
        conversionFactor: 1.0,
        isTraceable: true
      },
      currencyConversion: {
        sourceCurrency: 'INR',
        targetBenchmarkCurrency: 'INR',
        fxSource: 'RBI_OFFICIAL',
        isTraceable: true
      },
      mappingStatus: 'MAPPED_PENDING_APPROVAL',
      confidenceRating: 'MEDIUM',
      evidenceRationale: params.rationale,
      approvalStatus: 'PENDING',
      auditHistory: []
    };
  }
}
