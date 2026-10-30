import type { StrategicInputTransaction } from './strategicSourcing';
import type { ItemQualificationStatus } from './module2DirectPriceImprovement';

export interface DirectPriceD1Group {
  key: string;
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  uom: string;
  financialYear: string;
  transactions: StrategicInputTransaction[];
}

export interface DirectPriceD1BuildOptions {
  financialYear?: string;
  materialCode?: string;
  category?: string;
}

export interface DirectPriceItemMetrics {
  status: ItemQualificationStatus;
  prices: number[];
  benchmarkPrice: number;
  totalQuantity: number;
  totalSpend: number;
  benchmarkCost: number;
  historicalDifference: number;
  benchmarkRow?: StrategicInputTransaction;
  lowestPrice: number;
  highestPrice: number;
  weightedAveragePrice: number;
  priceDispersionPct: number;
  unspscCode: string;
  unspscCategory: string;
}
