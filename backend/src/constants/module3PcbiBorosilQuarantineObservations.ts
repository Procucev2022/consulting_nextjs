/**
 * Module 3 PCBI Phase 3 — Quarantined Benchmark Observations for Borosil Ltd
 * Assessment ID: AIC-2026-0002
 * Conforms to Rule 8 (constants isolation), Rule 9 (strongly typed), and file length <= 300 lines.
 */

import type { ObservationProvenanceRecord } from '../types/module3PcbiObservationProvenance';

export const BOROSIL_QUARANTINED_OBSERVATIONS: ObservationProvenanceRecord[] = [
  {
    id: 'OBS-QUAR-IBM-SAND-2026-05',
    benchmarkSeriesId: 'PCBI-IND-MIN-SLS-001',
    benchmarkSeriesName: 'IBM Raw Mineral Silica Sand Average Sale Price',
    observationDate: '2026-05-01',
    effectivePeriodStart: '2026-05-01',
    effectivePeriodEnd: '2026-05-31',
    originalValue: 850.0,
    originalUnit: 'INR/MT',
    originalCurrency: 'INR',
    geographyMarketBasis: 'Rajasthan Quarry Gate',
    publisherSource: 'Indian Bureau of Mines',
    sourceDocumentRef: 'IBM/MINERALS/MONTHLY-BULL/MAY-2026',
    acquisitionTimestamp: '2026-10-27T18:00:00Z',
    convertedValue: 850.0,
    convertedUnit: 'INR/MT',
    convertedCurrency: 'INR',
    conversionFormula: 'Nominal quarry gate price (unbeneficiated)',
    validationStatus: 'QUARANTINED_GRADE_INCOMPATIBLE',
    quarantineReason:
      'Optical grade mismatch: Generic IBM quarry sand (~₹850/MT) cannot be equated with low-iron washed solar glass sand (~₹18,000/MT) without approved technical beneficiation spread.',
    licenseAccessRestrictions: 'PUBLIC_GOVERNMENT_REPORT',
    isFresh: true,
    traceabilityHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
  },
  {
    id: 'OBS-QUAR-WPI-KRAFT-2021-04',
    benchmarkSeriesId: 'PCBI-IND-PKG-KFT-001',
    benchmarkSeriesName: 'WPI Paper & Paper Products Benchmark Index',
    observationDate: '2021-04-01',
    effectivePeriodStart: '2021-04-01',
    effectivePeriodEnd: '2021-04-30',
    originalValue: 34200.0,
    originalUnit: 'INR/MT',
    originalCurrency: 'INR',
    geographyMarketBasis: 'All India',
    publisherSource: 'Office of Economic Adviser',
    sourceDocumentRef: 'RBI-WPI-PAPER-SERIES-2021',
    acquisitionTimestamp: '2026-10-27T18:00:00Z',
    convertedValue: 34200.0,
    convertedUnit: 'INR/MT',
    convertedCurrency: 'INR',
    conversionFormula: 'Direct nominal value',
    validationStatus: 'QUARANTINED_STALE',
    quarantineReason:
      'Staleness violation: Observation date (2021-04-01) exceeds maximum freshness threshold (>90 days) against Borosil FY 2026-27 purchase transactions (lag > 1800 days).',
    licenseAccessRestrictions: 'PUBLIC_OFFICIAL_CIRCULAR',
    isFresh: false,
    traceabilityHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3'
  },
  {
    id: 'OBS-QUAR-UNPROVENANCED-SODA-ASH',
    benchmarkSeriesId: 'PCBI-IND-CHM-SDA-001',
    benchmarkSeriesName: 'Unprovenanced Spot Broker Quote — Soda Ash',
    observationDate: '2026-06-15',
    effectivePeriodStart: '2026-06-15',
    effectivePeriodEnd: '2026-06-15',
    originalValue: 32000.0,
    originalUnit: 'INR/MT',
    originalCurrency: 'INR',
    geographyMarketBasis: 'Unofficial Dealer Chat',
    publisherSource: 'Unknown Spot Broker',
    sourceDocumentRef: '',
    acquisitionTimestamp: '2026-10-27T18:00:00Z',
    convertedValue: 32000.0,
    convertedUnit: 'INR/MT',
    convertedCurrency: 'INR',
    conversionFormula: 'None',
    validationStatus: 'QUARANTINED_UNPROVENANCED',
    quarantineReason:
      'Source provenance failure: Missing official publication, document reference, or verifiable audit trail.',
    licenseAccessRestrictions: 'UNVERIFIED',
    isFresh: true,
    traceabilityHash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4'
  }
];
