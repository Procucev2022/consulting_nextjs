/**
 * Modal Constants Module (Frontend)
 */

export interface MasterSupplierDefinition {
  id: string;
  name: string;
  subsidiaries: string[];
}

export interface MasterItemDefinition {
  code: string;
  name: string;
  category: string;
  column_l_code: string;
  aliases: string[];
}

export const DEFAULT_INVITED_SUPPLIERS: readonly string[] = [];

export const DEFAULT_PROCPX_BASELINE = 0;

export const DEFAULT_MASTER_SUPPLIERS: readonly MasterSupplierDefinition[] = [];

export const DEFAULT_MAX_PRICE_CREEP_CAP = 3.0;
export const DEFAULT_INDEX_PEGGING = 'Official Market Benchmark Index';

export const DEFAULT_MASTER_ITEMS: readonly MasterItemDefinition[] = [];
