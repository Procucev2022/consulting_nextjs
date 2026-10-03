/**
 * PCBI Commodity Data Lab — Service Helper Functions
 * Modular helpers for building evidence objects and observation previews.
 */

import type {
  CommodityResearchQueueRow,
  CommoditySourceEvidenceObject,
  CommodityWorkspaceOverview,
  ExtractedObservationDetail,
  PCBIResearchDashboardMetrics
} from '../types/pcbiCommodityDataLab';
import type { UploadCommoditySourceInput } from '../types/validation';

export function calculateDashboardMetrics(
  queue: CommodityResearchQueueRow[]
): PCBIResearchDashboardMetrics {
  const total = queue.length;
  const productionReady = queue.filter((q) => q.currentStatus === 'PRODUCTION_READY').length;
  const partialHistory = queue.filter((q) => q.currentStatus === 'PARTIAL_HISTORY').length;
  const noHistory = queue.filter((q) => q.currentStatus === 'NO_HISTORY').length;
  const missing = queue.filter((q) => q.currentStatus === 'MISSING').length;
  const sourceUnverified = queue.filter((q) => q.sourceStatus === 'SOURCE_UNVERIFIED').length;
  const methodologyPending = queue.filter((q) => q.methodologyStatus === 'METHODOLOGY_PENDING').length;
  const specificationMismatch = queue.filter((q) => q.currentStatus === 'SPECIFICATION_MISMATCH').length;
  const frequencyMismatch = queue.filter((q) => q.currentStatus === 'FREQUENCY_MISMATCH').length;
  const highImpactGaps = queue.filter(
    (q) => q.priority.startsWith('P1') && q.currentStatus !== 'PRODUCTION_READY'
  ).length;

  const p1 = queue.filter((q) => q.priority.startsWith('P1')).length;
  const p2 = queue.filter((q) => q.priority.startsWith('P2')).length;
  const p3 = queue.filter((q) => q.priority.startsWith('P3')).length;
  const p4 = queue.filter((q) => q.priority.startsWith('P4')).length;

  return {
    totalCommodities: total,
    productionReadyCount: productionReady,
    partialHistoryCount: partialHistory,
    noHistoryCount: noHistory,
    missingCount: missing,
    sourceUnverifiedCount: sourceUnverified,
    methodologyPendingCount: methodologyPending,
    specificationMismatchCount: specificationMismatch,
    frequencyMismatchCount: frequencyMismatch,
    highImpactGapsCount: highImpactGaps,
    queueByPriority: {
      p1Critical: p1,
      p2High: p2,
      p3Medium: p3,
      p4Low: p4
    }
  };
}

export function buildCommodityOverview(item: CommodityResearchQueueRow): CommodityWorkspaceOverview {
  return {
    commodityId: item.commodityId,
    commodityName: item.commodity,
    pcbiId: item.pcbiId,
    seriesId: item.seriesId,
    module2Classification: item.module2Classification,
    unspsc: item.unspsc,
    currentStatus: item.currentStatus,
    customerSpendInr: item.customerSpend,
    customerSpendCr: item.customerSpendCr,
    transactionCount: item.transactionCount,
    requiredStartDate: '2020-04-01',
    requiredEndDate: '2026-06-30',
    requiredFrequency: item.requiredFrequency,
    requiredUnit: 'INR/MT',
    requiredCurrency: 'INR',
    requiredGeography: 'INDIA_DOMESTIC',
    availableHistory: item.availableHistory,
    priority: item.priority,
    researchStatus: item.researchStatus,
    lastUpdated: item.lastUpdated
  };
}

export function buildSourceEvidenceObject(
  sourceId: string,
  input: UploadCommoditySourceInput
): CommoditySourceEvidenceObject {
  return {
    sourceId,
    sourceName: input.sourceName,
    publisher: input.publisher,
    url: input.url ?? '',
    documentName: input.documentName,
    publicationDate: input.publicationDate ?? new Date().toISOString().split('T')[0],
    uploadDate: new Date().toISOString(),
    fileType: input.fileType,
    checksum: input.checksum ?? `sha256-${Math.random().toString(36).substring(2, 18)}`,
    geography: input.geography ?? 'India Domestic',
    gradeSpecification: input.gradeSpecification ?? 'Commercial Specification',
    unit: input.unit ?? 'INR/MT',
    currency: input.currency ?? 'INR',
    frequency: input.frequency ?? 'MONTHLY',
    deliveryBasis: input.deliveryBasis ?? 'Ex-Works',
    historicalCoverage: input.historicalCoverage ?? 'Research Batch Evidence',
    extractionStatus: 'EXTRACTED',
    validationStatus: 'PENDING',
    methodologyStatus: 'PENDING',
    approvalStatus: 'UNDER_REVIEW',
    extractedObservationsCount: 12
  };
}

export function buildSampleObservations(
  sources: CommoditySourceEvidenceObject[]
): ExtractedObservationDetail[] {
  const firstSourceId = sources[0]?.sourceId ?? 'SRC-INITIAL';
  const secondSourceId = sources[1]?.sourceId ?? 'SRC-INITIAL-2';

  return [
    {
      observationId: 'OBS-001',
      sourceId: firstSourceId,
      sourceDate: '2024-04-01',
      rawValue: 3250.0,
      rawUnit: 'INR/KG',
      rawCurrency: 'INR',
      normalizedValue: 3250000.0,
      normalizedUnit: 'INR/MT',
      normalizedCurrency: 'INR',
      frequency: 'MONTHLY',
      status: 'VERIFIED'
    },
    {
      observationId: 'OBS-002',
      sourceId: firstSourceId,
      sourceDate: '2024-05-01',
      rawValue: 3300.0,
      rawUnit: 'INR/KG',
      rawCurrency: 'INR',
      normalizedValue: 3300000.0,
      normalizedUnit: 'INR/MT',
      normalizedCurrency: 'INR',
      frequency: 'MONTHLY',
      status: 'VERIFIED'
    },
    {
      observationId: 'OBS-003',
      sourceId: secondSourceId,
      sourceDate: '2024-06-01',
      rawValue: 3380.0,
      rawUnit: 'INR/KG',
      rawCurrency: 'INR',
      normalizedValue: 3380000.0,
      normalizedUnit: 'INR/MT',
      normalizedCurrency: 'INR',
      frequency: 'MONTHLY',
      status: 'NEEDS_REVIEW'
    }
  ];
}
