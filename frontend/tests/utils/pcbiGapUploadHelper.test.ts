import { describe, it, expect } from 'vitest';
import { convertGapItemToResearchQueueRow } from '../../src/utils/pcbiGapUploadHelper';
import type { PCBIMissingIndexGapItem } from '../../src/types/module3GapList';

describe('convertGapItemToResearchQueueRow', () => {
  const sampleGapItem: PCBIMissingIndexGapItem = {
    id: 'GAP-BOR-001',
    materialCode: 'CHEM-BORAX-DECA',
    materialDescription: 'Borax Decahydrate Granular (99.5% Tech Grade)',
    commodityClassification: 'INORGANIC_CHEMICALS',
    unspscCode: '12142100',
    existingGradeSpecification: 'Borax Decahydrate 99.5% Tech Grade',
    customerSpendInr: 28410214.5,
    customerSpendCr: 2.841,
    transactionCount: 22,
    spendSharePct: 0.51,
    pcbiSeriesId: 'SER-IND-BORAX-TECH-M',
    benchmarkSeriesName: 'Borax Decahydrate Wholesale Index',
    benchmarkPublisherSource: 'Department for Promotion of Industry and Internal Trade (DPIIT) / WPI',
    sourceStatus: 'SOURCE VERIFIED — LICENSE ACTIVE',
    observationCoverage: '36/36 Monthly Observations (Complete)',
    latestObservationDate: '2025-12-31',
    gapStatus: 'VERIFIED OBSERVATIONS AVAILABLE',
    gapReason: 'Complete 36-month monthly observation history verified.',
    nextActionRequired: 'Activate for primary baseline indexation.'
  };

  it('converts gap item to research queue row with correct fields', () => {
    const queueRow = convertGapItemToResearchQueueRow(sampleGapItem);

    expect(queueRow.commodity).toBe(sampleGapItem.materialDescription);
    expect(queueRow.commodityId).toBe(sampleGapItem.materialCode);
    expect(queueRow.module2Classification).toBe(sampleGapItem.commodityClassification);
    expect(queueRow.unspsc).toBe('12142100');
    expect(queueRow.customerSpend).toBe(28410214.5);
    expect(queueRow.customerSpendCr).toBe('₹2.8410 Cr');
    expect(queueRow.transactionCount).toBe(22);
    expect(queueRow.pcbiId).toBe('SER-IND-BORAX-TECH-M');
    expect(queueRow.seriesId).toBe('SER-IND-BORAX-TECH-M');
    expect(queueRow.currentStatus).toBe('VERIFIED OBSERVATIONS AVAILABLE');
    expect(queueRow.requiredFrequency).toBe('MONTHLY');
    expect(queueRow.availableFrequency).toBe('NONE');
    expect(queueRow.sourceStatus).toBe(sampleGapItem.sourceStatus);
    expect(queueRow.methodologyStatus).toBe('PENDING_VALIDATION');
    expect(queueRow.priority).toBe('P2 — Priority Coverage Gap');
    expect(queueRow.action).toBe('UPLOAD_BENCHMARK');
  });

  it('handles unmapped series without inventing fallback series and flags mapping required', () => {
    const unmappedItem: PCBIMissingIndexGapItem = {
      ...sampleGapItem,
      materialCode: 'UNMAPPED-TAIL-MRO',
      pcbiSeriesId: null,
      customerSpendCr: 404.2212,
      unspscCode: 'N/A'
    };

    const queueRow = convertGapItemToResearchQueueRow(unmappedItem, {
      assessmentId: 'AIC-2026-0002',
      customerId: 'CUST-2026-0002',
      customerName: 'Borosil Ltd'
    });

    expect(queueRow.pcbiId).toBe('');
    expect(queueRow.seriesId).toBe('');
    expect(queueRow.isMappingRequired).toBe(true);
    expect(queueRow.methodologyStatus).toBe('MAPPING_REQUIRED');
    expect(queueRow.action).toBe('REVIEW_MAPPING');
    expect(queueRow.priority).toBe('P1 — Critical Coverage Gap');
    expect(queueRow.unspsc).toBe('N/A');
    expect(queueRow.customerName).toBe('Borosil Ltd');
  });
});
