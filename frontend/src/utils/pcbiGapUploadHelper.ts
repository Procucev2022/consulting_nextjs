import type { PCBIMissingIndexGapItem } from '../types/module3GapList';
import type { CommodityResearchQueueRow } from '../types/pcbiCommodityDataLab';

export interface ConvertGapItemContext {
  assessmentId?: string;
  customerId?: string;
  customerName?: string;
}

const UNMAPPED_STATUSES = new Set([
  'MAPPING / SPECIFICATION REVIEW REQUIRED',
  'UNMAPPED — RESEARCH REQUIRED',
  'NO SUITABLE BENCHMARK IDENTIFIED'
]);

function checkIsUnmapped(seriesId?: string | null, gapStatus?: string): boolean {
  if (!seriesId) {
    return true;
  }
  return gapStatus ? UNMAPPED_STATUSES.has(gapStatus) : false;
}

function resolveUnspsc(code?: string): string {
  if (!code || code === 'N/A') {
    return 'N/A';
  }
  return code;
}

function resolveRequiredFrequency(item: PCBIMissingIndexGapItem): 'WEEKLY' | 'MONTHLY' {
  if (item.pcbiSeriesId === 'PCBI-IND-CHM-SDA-001' || item.materialCode === '100SA02G') {
    return 'WEEKLY';
  }
  if (item.benchmarkSeriesName?.toLowerCase().includes('weekly')) {
    return 'WEEKLY';
  }
  return 'MONTHLY';
}

/**
 * Maps a Module 3 missing-index gap requirement item into a CommodityResearchQueueRow
 * for the 10-step governed upload workflow modal, preserving assessment context and
 * mapping requirements.
 */
export function convertGapItemToResearchQueueRow(
  item: PCBIMissingIndexGapItem,
  context?: ConvertGapItemContext
): CommodityResearchQueueRow {
  const isUnmapped = checkIsUnmapped(item.pcbiSeriesId, item.gapStatus);
  const series = item.pcbiSeriesId ?? '';

  return {
    commodity: item.materialDescription,
    commodityId: item.materialCode,
    module2Classification: item.commodityClassification,
    unspsc: resolveUnspsc(item.unspscCode),
    customerSpend: item.customerSpendInr,
    customerSpendCr: `₹${item.customerSpendCr.toFixed(4)} Cr`,
    transactionCount: item.transactionCount,
    pcbiId: series,
    seriesId: series,
    currentStatus: item.gapStatus,
    requiredHistory: '36 months (2023-01 to 2025-12)',
    availableHistory: item.observationCoverage,
    requiredFrequency: resolveRequiredFrequency(item),
    availableFrequency: 'NONE',
    sourceStatus: item.sourceStatus,
    methodologyStatus: isUnmapped ? 'MAPPING_REQUIRED' : 'PENDING_VALIDATION',
    priority: item.customerSpendCr > 10 ? 'P1 — Critical Coverage Gap' : 'P2 — Priority Coverage Gap',
    researchStatus: isUnmapped ? 'MAPPING_REVIEW' : 'ACTION_REQUIRED',
    lastUpdated: new Date().toISOString(),
    action: isUnmapped ? 'REVIEW_MAPPING' : 'UPLOAD_BENCHMARK',
    // Assessment-driven fields
    assessmentId: context?.assessmentId ?? 'AIC-2026-0002',
    customerId: context?.customerId ?? 'CUST-2026-0002',
    customerName: context?.customerName ?? 'Borosil Ltd',
    materialCode: item.materialCode,
    materialDescription: item.materialDescription,
    existingGradeSpecification: item.existingGradeSpecification,
    benchmarkSeriesName: item.benchmarkSeriesName,
    benchmarkPublisherSource: item.benchmarkPublisherSource,
    gapStatus: item.gapStatus,
    gapReason: item.gapReason,
    isMappingRequired: isUnmapped
  };
}
