/**
 * Test helper: builds evidence snapshots in memory. Overrides let each test set one field.
 */

import type {
  EvidenceJobAccessRecord,
  EvidenceLedgerDetail,
  EvidenceRunRecord,
  EvidenceSnapshot,
  EvidenceVersionRecord
} from '../../src/types/evidenceWorkbook';

export const SNAPSHOT_JOB_ID = 'AIC-TEST';
export const SNAPSHOT_GENERATED_AT = '2026-10-01T10:00:00.000Z';

export const makeAssessment = (overrides: Partial<EvidenceJobAccessRecord> = {}): EvidenceJobAccessRecord => ({
  assessmentId: SNAPSHOT_JOB_ID,
  customerName: 'Alpha Textile',
  status: 'APPROVED',
  totalSpendCr: 7.5,
  validatedSpendCr: 7.5,
  grossOpportunityCr: 3,
  overlapDeductionsCr: 1,
  netDefensibleOpportunityCr: 2,
  potentialSavingsCr: 2,
  savingsPct: 26.6667,
  customerContactEmail: 'buyer@example.com',
  ...overrides
});

export const makeRun = (overrides: Partial<EvidenceRunRecord> = {}): EvidenceRunRecord => ({
  analysisRunId: 'RUN-1',
  dataVersionId: 'DV-2',
  status: 'COMPLETED',
  totalSpendCr: 7.5,
  validatedSpendCr: 7.5,
  grossOpportunityCr: 3,
  overlapDeductionsCr: 1,
  netDefensibleOpportunityCr: 2,
  potentialSavingsCr: 2,
  savingsPct: 26.6667,
  allGatesPassed: true,
  isApproved: true,
  isSuperseded: false,
  createdAt: '2026-02-01T00:00:00Z',
  ...overrides
});

export const makeVersion = (overrides: Partial<EvidenceVersionRecord> = {}): EvidenceVersionRecord => ({
  dataVersionId: 'DV-2',
  versionNumber: 2,
  fileName: 'alpha-v2.xlsx',
  fileSize: 2000,
  checksum: 'sum-2',
  uploadedBy: 'analyst@procucev.com',
  uploadedAt: '2026-02-01T00:00:00Z',
  recordCount: 5,
  isSuperseded: false,
  ...overrides
});

export const makeDetail = (): EvidenceLedgerDetail => ({
  suppliers: [{ groupKey: 'Alpha Chem', rowCount: 2, totalCr: 4 }],
  plants: [{ groupKey: 'P1', rowCount: 2, totalCr: 4.5 }],
  materialGroups: [{ groupKey: 'G1', rowCount: 2, totalCr: 4.5 }],
  sample: [
    {
      transactionId: 'TX-1',
      sourceRowNumber: 1,
      poNumber: 'PO-1',
      poLine: '1',
      documentDateRaw: '2023-01-01',
      supplierName: 'Alpha Chem',
      materialCode: 'MAT-1',
      shortText: 'Item',
      materialGroup: 'G1',
      plant: 'P1',
      orderQuantity: 10,
      orderUnit: 'EA',
      netPrice: 100,
      currency: 'INR',
      totalInrRaw: 15000000,
      totalInCrRaw: 1.5
    },
    {
      transactionId: 'TX-2',
      sourceRowNumber: null,
      poNumber: null,
      poLine: null,
      documentDateRaw: null,
      supplierName: null,
      materialCode: null,
      shortText: null,
      materialGroup: null,
      plant: null,
      orderQuantity: null,
      orderUnit: null,
      netPrice: null,
      currency: null,
      totalInrRaw: null,
      totalInCrRaw: null
    }
  ],
  sampleLimit: 5000
});

export const makeSnapshot = (overrides: Partial<EvidenceSnapshot> = {}): EvidenceSnapshot => ({
  jobId: SNAPSHOT_JOB_ID,
  tenantId: 'TNT-TEST',
  generatedAt: SNAPSHOT_GENERATED_AT,
  assessment: makeAssessment(),
  runs: [makeRun()],
  versions: [makeVersion(), makeVersion({ dataVersionId: 'DV-1', versionNumber: 1, fileName: 'alpha-v1.xlsx', recordCount: 4, checksum: 'sum-1', isSuperseded: true })],
  activeRun: makeRun(),
  activeVersion: makeVersion(),
  ledger: { rowCount: 4, totalCr: 7.5 },
  detail: makeDetail(),
  ...overrides
});
