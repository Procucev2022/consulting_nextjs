/**
 * UNSPSC Taxonomy Constants Module (Backend)
 */

import type { UNSPSCCommodityRecord } from '../types/taxonomy';

export const UNCLASSIFIED_COMMODITY_CODE = '00000000';
export const UNCLASSIFIED_COMMODITY_TITLE = 'Unclassified Commodity';
export const UNCLASSIFIED_CLASS_CODE = '00000000';
export const UNCLASSIFIED_CLASS_TITLE = 'Unclassified Class';
export const UNCLASSIFIED_FAMILY_CODE = '00000000';
export const UNCLASSIFIED_FAMILY_TITLE = 'Unclassified Family';
export const UNCLASSIFIED_SEGMENT_CODE = '00000000';
export const UNCLASSIFIED_SEGMENT_TITLE = 'Unclassified Segment';

export const UNCLASSIFIED_COMMODITY_RECORD: Readonly<UNSPSCCommodityRecord> = Object.freeze({
  commodityCode: UNCLASSIFIED_COMMODITY_CODE,
  commodityTitle: UNCLASSIFIED_COMMODITY_TITLE,
  classCode: UNCLASSIFIED_CLASS_CODE,
  classTitle: UNCLASSIFIED_CLASS_TITLE,
  familyCode: UNCLASSIFIED_FAMILY_CODE,
  familyTitle: UNCLASSIFIED_FAMILY_TITLE,
  segmentCode: UNCLASSIFIED_SEGMENT_CODE,
  segmentTitle: UNCLASSIFIED_SEGMENT_TITLE,
  coreBucket: undefined,
  classificationStatus: 'UNCLASSIFIED'
});
