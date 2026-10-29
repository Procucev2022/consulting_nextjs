import type { z } from 'zod';
import type { updateMaterialMappingSchema } from '../constants/module2Persistence';

export interface AlternateVendorIndexRow {
  category_key: string;
  payload_json: string;
}

export interface AlternateVendorCompanyRow {
  category_key: string;
  vendor_norm: string;
}

export interface MaterialMappingRow {
  source_material_id: string;
  payload_json: string;
}

export interface MaterialAggData {
  sourceMaterialId: string;
  sourceDescription: string;
  sourceCategory: string;
  totalSpendInr: number;
  transactionCount: number;
  suppliers: Set<string>;
  rawUnspscCode?: string;
  rawCommodity?: string;
}

export type ValidatedUpdateMaterialMapping = z.infer<typeof updateMaterialMappingSchema>;
