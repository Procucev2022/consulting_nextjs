import type { StrategicInputTransaction } from './strategicSourcing';

export interface VendorConsolidationMaterialGroup {
  key: string;
  materialCode: string;
  materialDesc: string;
  spendCategory: string;
  categoryKey: string;
  unspscCode: string;
  unspscCategory: string;
  uom: string;
  transactions: StrategicInputTransaction[];
}

export interface VendorConsolidationSupplierMetrics {
  vendorCode: string;
  vendorName: string;
  spendInr: number;
  transactions: StrategicInputTransaction[];
}

export interface VendorConsolidationBuildOptions {
  category?: string;
  status?: string;
  materialCode?: string;
  supplierCode?: string;
}
