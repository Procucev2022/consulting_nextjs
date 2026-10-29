import type { StrategicInputTransaction } from './strategicSourcing';
import type { AuctionSuitabilityClassification } from './module2EAuction';

export interface EAuctionMaterialGroup {
  key: string;
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  uom: string;
  transactions: StrategicInputTransaction[];
}

export interface EAuctionBuildOptions {
  financialYear?: string;
  category?: string;
  suitability?: AuctionSuitabilityClassification | 'ALL';
  materialCode?: string;
}

export interface EAuctionMaterialMetrics {
  spend: number;
  quantity: number;
  supplierCount: number;
  poCount: number;
  plantCount: number;
  prices: number[];
  lowestPrice: number;
  highestPrice: number;
  suitability: 'Candidate for Review' | 'Further Data Required' | 'Not Currently Suitable';
  candidate: boolean;
  missingIdentity: boolean;
  unspscCode: string;
  unspscCategory: string;
}
