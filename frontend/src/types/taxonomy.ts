/**
 * Taxonomy Types and Interfaces Module (Frontend)
 */

export type CoreBucket = 'Direct Materials' | 'Packaging Materials' | 'Indirect & MRO' | 'Logistics & Freight';

export interface UNSPSCCommodityRecord {
  commodityCode: string;
  commodityTitle: string;
  classCode: string;
  classTitle: string;
  familyCode: string;
  familyTitle: string;
  segmentCode: string;
  segmentTitle: string;
  coreBucket?: CoreBucket;
}
