/**
 * PCBI Customer Data Loader & Gap Matrix Service (Phases 1 & 2)
 */

import type {
  PCBIGapMatrixRow,
  PCBIE2EAlert,
  PCBIDefinitionStatus,
  PCBIDataStatus,
  PCBIReadinessStatus
} from '../types';
import logger from '../utils/logger';

export interface CustomerCommoditySummary {
  commodity: string;
  module2Commodity: string;
  unspsc: string;
  spendInr: number;
  spendCr: string;
  transactionCount: number;
  requiredStart: string;
  requiredEnd: string;
  requiredFreq: string;
  requiredUnit: string;
  requiredCurrency: string;
  definitionStatus: PCBIDefinitionStatus;
  dataStatus: PCBIDataStatus;
  readinessStatus: PCBIReadinessStatus;
}

export class PCBICustomerDataLoader {
  private static readonly CERTIFIED_CUSTOMER_COMMODITIES: CustomerCommoditySummary[] = [
    {
      commodity: 'High Density Polyethylene Granules',
      module2Commodity: 'COMMON - PE / Polymers',
      unspsc: '13102005',
      spendInr: 3026875,
      spendCr: '0.3027',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'KG',
      requiredCurrency: 'USD',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Compressor and Motor Maintenance Services',
      module2Commodity: 'EXCLUDED_SERVICE',
      unspsc: '72101500',
      spendInr: 28743800,
      spendCr: '2.8744',
      transactionCount: 4,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'MONTHLY',
      requiredUnit: 'CONTRACT',
      requiredCurrency: 'EUR',
      definitionStatus: 'NOT_BENCHMARKABLE',
      dataStatus: 'NO_HISTORY',
      readinessStatus: 'NOT_BENCHMARKABLE'
    },
    {
      commodity: '5-Ply Corrugated Shipping Boxes',
      module2Commodity: 'Corrugated Boxes',
      unspsc: '14121503',
      spendInr: 7264500,
      spendCr: '0.7265',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'PCS',
      requiredCurrency: 'USD',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Caustic Soda Lye 48%',
      module2Commodity: 'COMMON - Caustic Soda',
      unspsc: '12352101',
      spendInr: 3992580,
      spendCr: '0.3993',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'LTR',
      requiredCurrency: 'GBP',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Industrial Slurry Pumps & Impellers',
      module2Commodity: 'Compressors & Pumps',
      unspsc: '40151500',
      spendInr: 10309200,
      spendCr: '1.0309',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'MONTHLY',
      requiredUnit: 'SET',
      requiredCurrency: 'EUR',
      definitionStatus: 'DEFINED',
      dataStatus: 'NO_HISTORY',
      readinessStatus: 'DATA_GAP_NO_HISTORY'
    },
    {
      commodity: 'Variable Frequency Drives 75kW',
      module2Commodity: 'Electrical / Panels / Switchgear',
      unspsc: '39122001',
      spendInr: 1425000,
      spendCr: '0.1425',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'MONTHLY',
      requiredUnit: 'UNIT',
      requiredCurrency: 'INR',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Specialty Industrial Solvents',
      module2Commodity: 'Specialty Chemicals / Solvents',
      unspsc: '12352100',
      spendInr: 9015725,
      spendCr: '0.9016',
      transactionCount: 2,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'KG',
      requiredCurrency: 'EUR',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Specialized Protective Packaging',
      module2Commodity: 'Industrial Packaging Materials',
      unspsc: '24121500',
      spendInr: 3072800,
      spendCr: '0.3073',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'MONTHLY',
      requiredUnit: 'MTR',
      requiredCurrency: 'USD',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Carbide Cutting Inserts',
      module2Commodity: 'Machine Tooling & Cutting Inserts',
      unspsc: '27112803',
      spendInr: 7723750,
      spendCr: '0.7724',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'BOX',
      requiredCurrency: 'USD',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Stainless Steel Seamless Pipes SS316L',
      module2Commodity: 'COMMON - Steel',
      unspsc: '40141718',
      spendInr: 5075000,
      spendCr: '0.5075',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'MTR',
      requiredCurrency: 'INR',
      definitionStatus: 'DEFINED',
      dataStatus: 'PARTIAL_HISTORY',
      readinessStatus: 'DATA_GAP_PARTIAL_HISTORY'
    },
    {
      commodity: 'Hot Rolled Steel Coils IS 2062',
      module2Commodity: 'COMMON - Steel',
      unspsc: '30101804',
      spendInr: 6667825,
      spendCr: '0.6668',
      transactionCount: 1,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'ROLL',
      requiredCurrency: 'GBP',
      definitionStatus: 'DEFINED',
      dataStatus: 'COMPLETE',
      readinessStatus: 'PRODUCTION_READY'
    },
    {
      commodity: 'Ferro Molybdenum 65%',
      module2Commodity: 'Ferro Alloys',
      unspsc: '30102400',
      spendInr: 12500000,
      spendCr: '1.2500',
      transactionCount: 6,
      requiredStart: '2020-04-01',
      requiredEnd: '2026-06-30',
      requiredFreq: 'WEEKLY',
      requiredUnit: 'INR/MT',
      requiredCurrency: 'INR',
      definitionStatus: 'MISSING',
      dataStatus: 'NO_HISTORY',
      readinessStatus: 'DATA_GAP_NO_HISTORY'
    }
  ];

  public getCustomerCommodities(): CustomerCommoditySummary[] {
    return [...PCBICustomerDataLoader.CERTIFIED_CUSTOMER_COMMODITIES];
  }

  public generateCustomerGapMatrix(): PCBIGapMatrixRow[] {
    logger.info('Generating customer dataset PCBI gap matrix', {
      totalCommodities: PCBICustomerDataLoader.CERTIFIED_CUSTOMER_COMMODITIES.length
    });

    return PCBICustomerDataLoader.CERTIFIED_CUSTOMER_COMMODITIES.map((c, idx) => ({
      material: c.commodity,
      module2Commodity: c.module2Commodity,
      unspsc: c.unspsc,
      spend: c.spendInr,
      transactions: c.transactionCount,
      pcbiId: c.definitionStatus === 'DEFINED' ? `PCBI-E2E-${String(idx + 1).padStart(3, '0')}` : null,
      definitionStatus: c.definitionStatus,
      dataStatus: c.dataStatus,
      sourceStatus: c.dataStatus === 'COMPLETE' ? 'VALIDATED' : 'CANDIDATE',
      methodologyStatus: 'NONE_REQUIRED',
      historicalStartRequired: c.requiredStart,
      historicalEndRequired: c.requiredEnd,
      historicalStartAvailable: c.dataStatus === 'COMPLETE' ? c.requiredStart : null,
      historicalEndAvailable: c.dataStatus === 'COMPLETE' ? c.requiredEnd : null,
      frequencyRequired: c.requiredFreq,
      frequencyAvailable: c.dataStatus === 'COMPLETE' ? c.requiredFreq : null,
      specificationMatch: 'MATCH',
      geographyMatch: 'MATCH',
      unitMatch: 'MATCH',
      actionRequired: this.resolveActionRequired(c),
      readinessStatus: c.readinessStatus
    }));
  }

  public generateGapAlerts(): PCBIE2EAlert[] {
    const commoditiesWithGaps = PCBICustomerDataLoader.CERTIFIED_CUSTOMER_COMMODITIES.filter(
      (c) => c.readinessStatus !== 'PRODUCTION_READY' && c.readinessStatus !== 'NOT_BENCHMARKABLE'
    );

    logger.info('Generating customer PCBI gap alerts', { gapCount: commoditiesWithGaps.length });

    return commoditiesWithGaps.map((c, idx) => ({
      id: `ALERT-GAP-${String(idx + 1).padStart(3, '0')}`,
      commodity: c.commodity,
      module2Material: `${c.commodity} [${c.module2Commodity}]`,
      unspscMapping: `${c.unspsc} (${c.commodity})`,
      customerSpendInr: c.spendInr,
      customerSpendCr: `₹${c.spendCr} Cr`,
      transactionCount: c.transactionCount,
      pcbiStatus: c.readinessStatus,
      dataGap: c.definitionStatus === 'MISSING' ? 'PCBI Definition Missing' : `Data Gap: ${c.dataStatus}`,
      requiredData: `${c.commodity} Reference Benchmark Index`,
      requiredFrequency: c.requiredFreq,
      requiredUnit: c.requiredUnit,
      requiredCurrency: c.requiredCurrency,
      requiredHistoricalPeriod: `${c.requiredStart} to ${c.requiredEnd}`,
      requiredAction: c.definitionStatus === 'MISSING'
        ? 'Upload PCBI source data and establish definition'
        : 'Upload missing historical observation periods'
    }));
  }

  private resolveActionRequired(c: CustomerCommoditySummary): string {
    if (c.readinessStatus === 'PRODUCTION_READY') {
      return 'All governance criteria satisfied. Ready for benchmark observation ingestion.';
    }
    if (c.readinessStatus === 'NOT_BENCHMARKABLE') {
      return 'Service category excluded from direct material benchmark governance.';
    }
    if (c.spendInr > 10000000 && c.dataStatus === 'NO_HISTORY') {
      return 'CRITICAL HIGH-IMPACT GAP: Spend > ₹1.0 Cr with no history. Blocked from production benchmarking.';
    }
    return 'Data gap detected. Administrator upload of historical source series required.';
  }
}

export const pcbiCustomerDataLoader = new PCBICustomerDataLoader();
