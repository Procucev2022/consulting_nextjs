/**
 * Module 3 PCBI Phase 2 — Borosil Ltd Initial Auditable Material Mappings
 * Conforms to strict rule 8 and file length limit <= 300 lines.
 */

import type { MaterialBenchmarkMappingRecord } from '../types/module3PcbiMapping';

export const BOROSIL_INITIAL_MAPPING_RECORDS: MaterialBenchmarkMappingRecord[] = [
  {
    id: 'MAP-BOR-100SA02G',
    assessmentId: 'AIC-2026-0002',
    customerName: 'Borosil Ltd',
    materialCode: '100SA02G',
    materialDescription: 'Soda Ash Dense- GHCL',
    spendCategory: '11100',
    unspscCode: '12142104',
    unspscCommodity: 'Sodium carbonate',
    historicalSpendInr: 581170000,
    historicalSpendCr: 58.1170,
    transactionCount: 6,
    sourceUom: 'MT',
    sourceCurrency: 'INR',
    benchmarkSeriesId: 'PCBI-IND-CHM-SDA-001',
    benchmarkSeriesName: 'AMAI Domestic Dense Soda Ash Index (Ex-Gujarat)',
    benchmarkPublisher: 'Alkali Manufacturers Association of India',
    benchmarkGeography: 'Gujarat, India',
    benchmarkDeliveryTerm: 'Ex-Works',
    benchmarkUom: 'MT',
    benchmarkCurrency: 'INR',
    sourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
    specificationComparability: 'IDENTICAL_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'EX_WORKS_MATCHED',
    unitConversion: {
      sourceUom: 'MT',
      targetBenchmarkUom: 'MT',
      conversionFactor: 1.0,
      isTraceable: true,
      notes: 'Direct metric tonne correspondence'
    },
    currencyConversion: {
      sourceCurrency: 'INR',
      targetBenchmarkCurrency: 'INR',
      fxSource: 'RBI_OFFICIAL',
      isTraceable: true
    },
    mappingStatus: 'MAPPED_PENDING_APPROVAL',
    confidenceRating: 'HIGH',
    evidenceRationale: 'Dense soda ash procured from GHCL for glass melting. Identical specification to AMAI dense grade.',
    approvalStatus: 'PENDING',
    auditHistory: [
      {
        action: 'CREATED_PROVISIONAL_MAPPING',
        actor: 'Procucev Analyst System',
        timestamp: '2026-10-28T00:00:00Z',
        comment: 'Proposed AMAI benchmark series linkage. Pending commercial data acquisition & committee approval.'
      }
    ]
  },
  {
    id: 'MAP-BOR-100SA01T',
    assessmentId: 'AIC-2026-0002',
    customerName: 'Borosil Ltd',
    materialCode: '100SA01T',
    materialDescription: 'SODA ASH  LOCAL',
    spendCategory: '11100',
    unspscCode: '12142104',
    unspscCommodity: 'Sodium carbonate',
    historicalSpendInr: 159000000,
    historicalSpendCr: 15.9000,
    transactionCount: 5,
    sourceUom: 'MT',
    sourceCurrency: 'INR',
    benchmarkSeriesId: 'PCBI-IND-CHM-SDA-002',
    benchmarkSeriesName: 'Chemical Weekly Domestic Soda Ash Spot Price',
    benchmarkPublisher: 'Chemical Weekly / Sevak Publications',
    benchmarkGeography: 'Western India',
    benchmarkDeliveryTerm: 'Delivered',
    benchmarkUom: 'MT',
    benchmarkCurrency: 'INR',
    sourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
    specificationComparability: 'PROXY_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'FREIGHT_ADJUSTMENT_REQUIRED',
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
    evidenceRationale: 'Local spot purchase of soda ash. Requires freight adjustment from wholesale depot.',
    approvalStatus: 'PENDING',
    auditHistory: [
      {
        action: 'CREATED_PROVISIONAL_MAPPING',
        actor: 'Procucev Analyst System',
        timestamp: '2026-10-28T00:00:00Z',
        comment: 'Proposed Chemical Weekly spot index. Awaiting freight basis confirmation.'
      }
    ]
  },
  {
    id: 'MAP-BOR-100SSW13FG-L',
    assessmentId: 'AIC-2026-0002',
    customerName: 'Borosil Ltd',
    materialCode: '100SSW13FG-L',
    materialDescription: 'SILICA SAND (L)',
    spendCategory: '11100',
    unspscCode: '11111601',
    unspscCommodity: 'Silica or quartz sand',
    historicalSpendInr: 366840000,
    historicalSpendCr: 36.6840,
    transactionCount: 20,
    sourceUom: 'MT',
    sourceCurrency: 'INR',
    benchmarkSeriesId: 'PCBI-IND-MIN-SLS-001',
    benchmarkSeriesName: 'IBM Monthly Mineral Sale Price — Quartz & Silica Sand',
    benchmarkPublisher: 'Indian Bureau of Mines',
    benchmarkGeography: 'Gujarat/Rajasthan, India',
    benchmarkDeliveryTerm: 'Ex-Quarry Gate',
    benchmarkUom: 'MT',
    benchmarkCurrency: 'INR',
    sourceAvailability: 'MANUAL_VALIDATION_REQUIRED',
    specificationComparability: 'PROXY_GRADE',
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
    evidenceRationale: 'High purity washed silica sand for glass furnace. IBM raw mineral price requires beneficiation spread.',
    approvalStatus: 'PENDING',
    auditHistory: [
      {
        action: 'CREATED_PROVISIONAL_MAPPING',
        actor: 'Procucev Analyst System',
        timestamp: '2026-10-28T00:00:00Z',
        comment: 'IBM mineral reference requires manual technical validation of washing premium.'
      }
    ]
  },
  {
    id: 'MAP-BOR-300PP112',
    assessmentId: 'AIC-2026-0002',
    customerName: 'Borosil Ltd',
    materialCode: '300PP112',
    materialDescription: 'KRAFT PAPER 112.5CM (45GSM)',
    spendCategory: '11300',
    unspscCode: '14111507',
    unspscCommodity: 'Kraft paper',
    historicalSpendInr: 69585000,
    historicalSpendCr: 6.9585,
    transactionCount: 6,
    sourceUom: 'KG',
    sourceCurrency: 'INR',
    benchmarkSeriesId: 'PCBI-IND-PPR-KFT-001',
    benchmarkSeriesName: 'WPI Paper & Paper Products Benchmark Index',
    benchmarkPublisher: 'Reserve Bank of India / DPIIT',
    benchmarkGeography: 'All India',
    benchmarkDeliveryTerm: 'Ex-Mill',
    benchmarkUom: 'INR/MT',
    benchmarkCurrency: 'INR',
    sourceAvailability: 'SOURCE_IDENTIFIED_DATA_NOT_ACQUIRED',
    specificationComparability: 'PROXY_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'EX_WORKS_MATCHED',
    unitConversion: {
      sourceUom: 'KG',
      targetBenchmarkUom: 'INR/MT',
      conversionFactor: 1000.0,
      isTraceable: true,
      notes: '1 MT = 1000 KG conversion'
    },
    currencyConversion: {
      sourceCurrency: 'INR',
      targetBenchmarkCurrency: 'INR',
      fxSource: 'RBI_OFFICIAL',
      isTraceable: true
    },
    mappingStatus: 'MAPPED_PENDING_APPROVAL',
    confidenceRating: 'MEDIUM',
    evidenceRationale: 'Kraft paper reels used for glass interleafing and packaging. WPI paper series available in catalog but lacks 2026 observations.',
    approvalStatus: 'PENDING',
    auditHistory: [
      {
        action: 'CREATED_PROVISIONAL_MAPPING',
        actor: 'Procucev Analyst System',
        timestamp: '2026-10-28T00:00:00Z',
        comment: 'Catalog series exists; 2026 observation series pending data acquisition.'
      }
    ]
  },
  {
    id: 'MAP-BOR-400LSH01I',
    assessmentId: 'AIC-2026-0002',
    customerName: 'Borosil Ltd',
    materialCode: '400LSH01I',
    materialDescription: 'Premium LSHS Oil',
    spendCategory: '11400',
    unspscCode: '15101612',
    unspscCommodity: 'Furnace fuel oil or residual oil',
    historicalSpendInr: 153722000,
    historicalSpendCr: 15.3722,
    transactionCount: 4,
    sourceUom: 'MT',
    sourceCurrency: 'INR',
    benchmarkSeriesId: 'PCBI-IND-PET-LSHS-001',
    benchmarkSeriesName: 'IOCL Refinery Price Notification — Low Sulphur Heavy Stock (LSHS)',
    benchmarkPublisher: 'Indian Oil Corporation Ltd (IOCL)',
    benchmarkGeography: 'Koyali Refinery, Gujarat',
    benchmarkDeliveryTerm: 'Ex-Installation',
    benchmarkUom: 'MT',
    benchmarkCurrency: 'INR',
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
    confidenceRating: 'HIGH',
    evidenceRationale: 'Standard industrial heating oil for glass melter. IOCL published fortnightly industrial rates.',
    approvalStatus: 'PENDING',
    auditHistory: [
      {
        action: 'CREATED_PROVISIONAL_MAPPING',
        actor: 'Procucev Analyst System',
        timestamp: '2026-10-28T00:00:00Z',
        comment: 'Fortnightly IOCL pricing identified. Observation series pending acquisition.'
      }
    ]
  },
  {
    id: 'MAP-BOR-STTV2062',
    assessmentId: 'AIC-2026-0002',
    customerName: 'Borosil Ltd',
    materialCode: 'STTV2062',
    materialDescription: 'Cumirex Super Refractory tiles',
    spendCategory: 'ST-ENG-B',
    unspscCode: '30111603',
    unspscCommodity: 'Refractory bricks or blocks',
    historicalSpendInr: 153000,
    historicalSpendCr: 0.0153,
    transactionCount: 2,
    sourceUom: 'EA',
    sourceCurrency: 'INR',
    sourceAvailability: 'NO_SUITABLE_SOURCE_IDENTIFIED',
    specificationComparability: 'NOT_COMPARABLE',
    geographyCompatibility: 'INCOMPATIBLE',
    deliveryTermCompatibility: 'INCOMPATIBLE',
    unitConversion: {
      sourceUom: 'EA',
      targetBenchmarkUom: 'EA',
      conversionFactor: 1.0,
      isTraceable: false,
      notes: 'No conversion possible for proprietary molded furnace tile'
    },
    currencyConversion: {
      sourceCurrency: 'INR',
      targetBenchmarkCurrency: 'INR',
      fxSource: 'RBI_OFFICIAL',
      isTraceable: true
    },
    mappingStatus: 'INCOMPATIBLE_SPECIFICATION',
    confidenceRating: 'LOW',
    evidenceRationale: 'Engineered proprietary furnace shape. Not benchmarkable against generic spot commodities.',
    approvalStatus: 'REJECTED',
    auditHistory: [
      {
        action: 'CLASSIFIED_NOT_BENCHMARKABLE',
        actor: 'Procucev Governance Engine',
        timestamp: '2026-10-28T00:00:00Z',
        comment: 'Excluded from benchmark pricing. Custom engineered refractory.'
      }
    ]
  }
];
