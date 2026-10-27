/**
 * Module 3 PCBI Phase 3 — Observation Provenance & Reconciled Coverage Constants
 * Conforms to Rule 8 (isolated constants), Rule 9 (strongly typed), and file length <= 300 lines.
 */

import type { ReconciledCoverageRegister } from '../types/module3PcbiObservationProvenance';

export {
  BOROSIL_ACQUIRED_BENCHMARK_OBSERVATIONS,
  BOROSIL_QUARANTINED_OBSERVATIONS
} from './module3PcbiBorosilObservations';

export const BOROSIL_RECONCILED_COVERAGE_REGISTER: ReconciledCoverageRegister = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'Borosil Ltd',
  authoritativeBaselineSpendCr: 556.5346,
  authoritativeBaselineSpendInr: 5565346426.19,
  authoritativeBaselineTransactions: 27777,
  reconciledSpendCr: 556.5346,
  reconciledSpendInr: 5565346426.19,
  reconciledTransactions: 27777,
  reconciliationVarianceCr: 0.0000,
  reconciliationVarianceInr: 0.00,
  isFullyReconciled: true,
  certifiedSavingsCr: 0.0000,
  realizedSavingsCr: 0.0000,
  marketVarianceValueCr: 0.0000,
  module4Executed: false,
  buckets: [
    {
      bucketKey: 'APPROVED_MAPPINGS',
      bucketName: 'Approved Benchmark Mappings',
      spendInr: 0.0,
      spendCr: 0.0000,
      spendPct: 0.00,
      transactionCount: 0,
      uniqueMaterialsCount: 0,
      explanation: 'Zero spend currently approved. Candidate mappings remain strictly in PENDING status pending formal committee sign-off.',
      materialExamples: []
    },
    {
      bucketKey: 'PENDING_APPROVAL_MAPPINGS',
      bucketName: 'Pending-Approval Mappings (Phase 2 Registered)',
      spendInr: 1330470000.0,
      spendCr: 133.0470,
      spendPct: 23.91,
      transactionCount: 43,
      uniqueMaterialsCount: 6,
      explanation: 'Primary direct manufacturing inputs mapped to candidate series awaiting customer commercial committee approval.',
      materialExamples: ['100SA02G (Dense Soda Ash GHCL)', '100SSW13FG-L (Silica Sand)', '400LSH01I (LSHS Oil)', '300PP112 (Kraft Paper)']
    },
    {
      bucketKey: 'SOURCE_IDENTIFIED_NOT_ACQUIRED',
      bucketName: 'Source Identified, Observation Data Not Acquired',
      spendInr: 51643000.0,
      spendCr: 5.1643,
      spendPct: 0.93,
      transactionCount: 56,
      uniqueMaterialsCount: 5,
      explanation: 'Commercial energy and auxiliary chemicals where publisher (IOCL, PPAC, AMAI) is identified but 2026 series is not yet ingested.',
      materialExamples: ['KPRMLPG (Bulk LPG Gas)', 'KPRMDIESEL (Diesel Fuel)', '400HD001 (High Speed Diesel)', '400LP01A (LPG)']
    },
    {
      bucketKey: 'LICENSE_REQUIRED',
      bucketName: 'Commercial License Required (Platts / ICIS / Argus)',
      spendInr: 42376000.0,
      spendCr: 4.2376,
      spendPct: 0.76,
      transactionCount: 16,
      uniqueMaterialsCount: 4,
      explanation: 'Polymer packaging and industrial lubricants requiring commercial subscriptions to Platts PolymerScan or Argus Base Oils Asia.',
      materialExamples: ['KPPMSCBSP110911400 (Plastic Caps)', '300PS511 (Plastic Strip)', '300PS050 (Lay-Flat Tubing)', '300PS512 (Cover Sheet)']
    },
    {
      bucketKey: 'MANUAL_VALIDATION_REQUIRED',
      bucketName: 'Manual Technical/Commercial Validation Required',
      spendInr: 2337900.0,
      spendCr: 0.2338,
      spendPct: 0.04,
      transactionCount: 8,
      uniqueMaterialsCount: 2,
      explanation: 'Run-of-mine quartz and secondary silica sand where beneficiation spread from generic quarry gate requires engineering review.',
      materialExamples: ['100SSW12FG (Silica Sand 100 ppm)', '100QS01PR (Quartz Sand)']
    },
    {
      bucketKey: 'NO_SUITABLE_SOURCE',
      bucketName: 'No Suitable Benchmark Source (Non-Benchmarkable Capital/Spares)',
      spendInr: 75419000.0,
      spendCr: 7.5419,
      spendPct: 1.36,
      transactionCount: 4,
      uniqueMaterialsCount: 4,
      explanation: 'Custom engineered capital systems and molded furnace contact refractories lacking public commodity price benchmarks.',
      materialExamples: ['600LNG01 (LNG Fuel System)', 'STTV2062 (Refractory Tiles)', 'STE00598 (Oven Refractory)', 'STMV0334 (Refractory Insert)']
    },
    {
      bucketKey: 'UNMAPPED_SPEND',
      bucketName: 'Unmapped Spend (General Tail, Electricals & Unclassified MRO)',
      spendInr: 4063100426.19,
      spendCr: 406.3100,
      spendPct: 73.00,
      transactionCount: 27650,
      uniqueMaterialsCount: 8955,
      explanation: 'General manufacturing consumables, electricals, bearings, instrumentation, and factory operating supplies.',
      materialExamples: ['720MR033RGP (Main Roller)', '524ME560 (Conduit Pipe JB)', '500CO010 (Cutting Oil)', 'General Plant MRO']
    }
  ]
};
