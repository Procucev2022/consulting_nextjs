/**
 * Module 3 PCBI — Authoritative Missing-Index Gap List & Status Reconciliation
 * Conforms to Rule 8 (constants isolation), Rule 9 (strongly typed), and file length <= 300 lines.
 */

import type {
  PCBIMissingIndexGapItem,
  PCBIGapStatusSummaryItem,
  PCBIMissingIndexGapReport
} from '../types/module3PcbiGapList';
import { BOROSIL_MISSING_INDEX_GAP_ITEMS_PART1 } from './module3PcbiGapListItems';
import { BOROSIL_MISSING_INDEX_GAP_ITEMS_PART2 } from './module3PcbiGapListItemsPart2';

export const BOROSIL_MISSING_INDEX_GAP_ITEMS: PCBIMissingIndexGapItem[] = [
  ...BOROSIL_MISSING_INDEX_GAP_ITEMS_PART1,
  ...BOROSIL_MISSING_INDEX_GAP_ITEMS_PART2
];

export const BOROSIL_GAP_STATUS_SUMMARIES: PCBIGapStatusSummaryItem[] = [
  {
    status: 'VERIFIED OBSERVATIONS AVAILABLE',
    statusLabel: 'Verified Observations Available',
    itemCount: 0,
    transactionCount: 0,
    totalSpendCr: 0.0,
    totalSpendInr: 0.0,
    spendPercentage: 0.0,
    actionGuidance: 'Ready for calculation. Currently 0 items because all Borosil series lack approved, verified market observations.'
  },
  {
    status: 'BENCHMARK DEFINED — OBSERVATIONS MISSING',
    statusLabel: 'Benchmark Defined — Observations Missing',
    itemCount: 2,
    transactionCount: 10,
    totalSpendCr: 22.3307,
    totalSpendInr: 223307000.0,
    spendPercentage: 4.01,
    actionGuidance: 'Benchmark series ID exists in PCBI Master catalog, but required 2026 observations are unacquired or quarantined (LSHS oil 14 quarantined obs, Kraft paper 2026 missing).'
  },
  {
    status: 'SOURCE IDENTIFIED — DATA NOT ACQUIRED',
    statusLabel: 'Source Identified — Data Not Acquired',
    itemCount: 7,
    transactionCount: 68,
    totalSpendCr: 79.1813,
    totalSpendInr: 791813349.05,
    spendPercentage: 14.23,
    actionGuidance: 'Publisher source identified (AMAI, Chemical Weekly, IOCL, PPAC), but external observation data needs to be acquired and ingested.'
  },
  {
    status: 'LICENSE REQUIRED',
    statusLabel: 'License Required',
    itemCount: 4,
    transactionCount: 16,
    totalSpendCr: 4.2376,
    totalSpendInr: 42376000.0,
    spendPercentage: 0.76,
    actionGuidance: 'Requires commercial third-party licensing (S&P Global Platts PolymerScan, Argus Base Oils) for published domestic indices.'
  },
  {
    status: 'MAPPING / SPECIFICATION REVIEW REQUIRED',
    statusLabel: 'Mapping / Specification Review Required',
    itemCount: 3,
    transactionCount: 28,
    totalSpendCr: 39.0219,
    totalSpendInr: 390219500.0,
    spendPercentage: 7.01,
    actionGuidance: 'Run-of-mine or generic proxy series exists (IBM quartz & silica sand); technical beneficiation washing spread must be reviewed with engineering.'
  },
  {
    status: 'STALE DATA',
    statusLabel: 'Stale Data',
    itemCount: 0,
    transactionCount: 0,
    totalSpendCr: 0.0,
    totalSpendInr: 0.0,
    spendPercentage: 0.0,
    actionGuidance: 'Observation series exceeding the 365-day freshness window. Zero items in Borosil baseline.'
  },
  {
    status: 'NO SUITABLE BENCHMARK IDENTIFIED',
    statusLabel: 'No Suitable Benchmark Identified',
    itemCount: 5,
    transactionCount: 6,
    totalSpendCr: 7.5419,
    totalSpendInr: 75419000.0,
    spendPercentage: 1.36,
    actionGuidance: 'Custom-engineered plant geometry refractories and one-off turnkey LNG fuel equipment lacking public spot commodities; permanently excluded from PCBI calculations.'
  },
  {
    status: 'UNMAPPED — RESEARCH REQUIRED',
    statusLabel: 'Unmapped — Research Required',
    itemCount: 8955,
    transactionCount: 27649,
    totalSpendCr: 404.2212,
    totalSpendInr: 4042211577.14,
    spendPercentage: 72.63,
    actionGuidance: 'High-variety operating consumables and general tail MRO requiring long-term taxonomy mapping for Phase 4 PCBI catalog expansion.'
  }
];

export const BOROSIL_MISSING_INDEX_GAP_REPORT: PCBIMissingIndexGapReport = {
  assessmentId: 'AIC-2026-0002',
  customerId: 'CUST-2026-0002',
  customerName: 'Borosil Ltd',
  reportDate: '2026-10-28',
  baselineSpendCr: 556.5346,
  baselineSpendInr: 5565346426.19,
  baselineTransactions: 27777,
  totalRequirementsCount: 8976,
  verifiedObservationsCount: 0,
  verifiedSpendCr: 0.0,
  missingIndexGapSpendCr: 556.5346,
  missingIndexGapSpendPct: 100.0,
  quarantinedObservationsCount: 14,
  certifiedSavingsCr: 0.0,
  realizedSavingsCr: 0.0,
  pcbiIndexCalculated: false,
  statusSummaries: BOROSIL_GAP_STATUS_SUMMARIES,
  items: BOROSIL_MISSING_INDEX_GAP_ITEMS
};
