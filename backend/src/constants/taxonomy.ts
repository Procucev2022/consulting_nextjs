/**
 * UNSPSC Taxonomy Constants Module (Backend)
 */

import type { UNSPSCCommodityRecord } from '../types/taxonomy';
import { z } from 'zod';

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

export const TAXONOMY_D1_SQL = `SELECT commodity_code, commodity_title, class_code, class_title,
  family_code, family_title, segment_code, segment_title, core_bucket, classification_status
  FROM UNSPSCCommodity ORDER BY commodity_code`;
export const TAXONOMY_CACHE_TTL_MS = 300000;
export const TAXONOMY_SEARCH_LIMIT = 50;
export const TAXONOMY_LOOKUP_DEFAULTS = {
  commodityCode: '10000000',
  commodityTitle: 'Industrial Material Commodity',
  coreBucket: 'Direct Materials',
  classTitle: 'General Sourcing Class'
} as const;

export const taxonomyD1RowsSchema = z.array(z.object({
  commodity_code: z.string().regex(/^\d{8}$/u),
  commodity_title: z.string().min(1),
  class_code: z.string(),
  class_title: z.string(),
  family_code: z.string(),
  family_title: z.string(),
  segment_code: z.string(),
  segment_title: z.string(),
  core_bucket: z.enum(['Direct Materials', 'Packaging Materials', 'Indirect & MRO', 'Logistics & Freight']).nullable(),
  classification_status: z.enum(['CLASSIFIED', 'UNCLASSIFIED']).nullable()
})).min(1);
