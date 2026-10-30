import { MODULE2_D1_VENDOR_CONSOLIDATION, MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES } from '../constants/module2VendorConsolidationD1';
import type {
  VendorConsolidationMaterialGroup, VendorConsolidationSupplierMetrics
} from '../types/module2VendorConsolidationD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { CategoryClassificationType, SupplierSpendProfile } from '../types/module2VendorConsolidation';
import type { MaterialMappingEntry } from '../types/module2MaterialMapping';

const clean = (value?: string): string => value?.trim() || '';
export const normalized = (value?: string): string => clean(value).toLocaleUpperCase('en-US');
export const amount = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
export const spendOf = (row: StrategicInputTransaction): number => amount(row.total_spend_inr);
export const quantityOf = (row: StrategicInputTransaction): number => amount(row.quantity);
export const crores = (value: number): number => value / MODULE2_D1_VENDOR_CONSOLIDATION.INR_PER_CRORE;
export const distinct = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
export const supplierIdentity = (row: StrategicInputTransaction): string =>
  normalized(row.vendor_code) || normalized(row.vendor_name);
export const materialIdentity = (row: StrategicInputTransaction): string =>
  normalized(row.material_code) || `DESCRIPTION:${normalized(row.material_desc)}`;
export const sourceCategory = (row: StrategicInputTransaction): string =>
  clean(row.spend_category) || MODULE2_D1_VENDOR_CONSOLIDATION.UNKNOWN_VALUE;
export const taxonomyCode = (row: StrategicInputTransaction): string =>
  clean(row.unspsc_code) || MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE;
export const taxonomyTitle = (row: StrategicInputTransaction): string =>
  clean(row.unspsc_category) || MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_TITLE;

export const categoryKeyFor = (row: StrategicInputTransaction, useUnspsc: boolean): string => {
  const code = taxonomyCode(row);
  if (useUnspsc && code !== MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE) return `UNSPSC:${code}`;
  return `SOURCE:${sourceCategory(row).toLocaleLowerCase('en-US')}`;
};

export const groupTransactions = (
  transactions: StrategicInputTransaction[], useUnspsc = true
): VendorConsolidationMaterialGroup[] => {
  const groups = new Map<string, VendorConsolidationMaterialGroup>();
  transactions.forEach((row, index) => {
    const code = normalized(row.material_code);
    const description = clean(row.material_desc);
    const uom = normalized(row.uom);
    const categoryKey = categoryKeyFor(row, useUnspsc);
    const identity = code || `UNMAPPED:${normalized(description) || index}`;
    const key = `${categoryKey}|${identity}|${uom || 'UOM-MISSING'}`;
    const group = groups.get(key) || {
      key,
      materialCode: code,
      materialDesc: description,
      spendCategory: sourceCategory(row),
      categoryKey,
      unspscCode: taxonomyCode(row),
      unspscCategory: taxonomyTitle(row),
      uom,
      transactions: []
    };
    group.transactions.push(row);
    groups.set(key, group);
  });
  return [...groups.values()];
};

export const suppliersIn = (rows: StrategicInputTransaction[]): VendorConsolidationSupplierMetrics[] => {
  const suppliers = new Map<string, VendorConsolidationSupplierMetrics>();
  rows.forEach((row) => {
    const key = supplierIdentity(row);
    if (!key) return;
    const supplier = suppliers.get(key) || {
      vendorCode: clean(row.vendor_code),
      vendorName: clean(row.vendor_name) || MODULE2_D1_VENDOR_CONSOLIDATION.UNKNOWN_VALUE,
      spendInr: 0,
      transactions: []
    };
    supplier.spendInr += spendOf(row);
    supplier.transactions.push(row);
    suppliers.set(key, supplier);
  });
  return [...suppliers.values()].sort((left, right) => right.spendInr - left.spendInr);
};

export const poCount = (rows: StrategicInputTransaction[]): number => distinct(rows.map((row) => row.po_number || '')).length;

export const materialSpend = (group: VendorConsolidationMaterialGroup): number =>
  group.transactions.reduce((total, row) => total + spendOf(row), 0);

export const materialQuantity = (group: VendorConsolidationMaterialGroup): number =>
  group.transactions.reduce((total, row) => total + quantityOf(row), 0);

export const materialPrice = (row: StrategicInputTransaction): number =>
  quantityOf(row) > 0 ? spendOf(row) / quantityOf(row) : 0;

export const sourceMaterials = (transactions: StrategicInputTransaction[]): Array<{
  id: string;
  code: string;
  description: string;
  category: string;
  unspscCode: string;
  unspscTitle: string;
  spend: number;
  transactionCount: number;
  supplierCount: number;
}> => {
  const materials = new Map<string, {
    id: string;
    code: string;
    description: string;
    category: string;
    unspscCode: string;
    unspscTitle: string;
    spend: number;
    transactionCount: number;
    suppliers: Set<string>;
  }>();
  transactions.forEach((row, index) => {
    const code = normalized(row.material_code);
    const description = clean(row.material_desc);
    const id = code || `UNMAPPED-${normalized(description) || index}`;
    const material = materials.get(id) || {
      id, code, description, category: sourceCategory(row), unspscCode: taxonomyCode(row),
      unspscTitle: taxonomyTitle(row), spend: 0, transactionCount: 0, suppliers: new Set<string>()
    };
    material.spend += spendOf(row);
    material.transactionCount += 1;
    const supplier = supplierIdentity(row);
    if (supplier) material.suppliers.add(supplier);
    materials.set(id, material);
  });
  return [...materials.values()].map((material) => ({
    id: material.id,
    code: material.code,
    description: material.description,
    category: material.category,
    unspscCode: material.unspscCode,
    unspscTitle: material.unspscTitle,
    spend: material.spend,
    transactionCount: material.transactionCount,
    supplierCount: material.suppliers.size
  }));
};

export const mappingEntry = (material: ReturnType<typeof sourceMaterials>[number]): MaterialMappingEntry => {
  const isMapped = material.unspscCode !== MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE;
  const reviewStatus = isMapped ? 'PROVISIONAL' : 'AWAITING_REVIEW';
  const code = material.unspscCode;
  return {
    sourceMaterialId: material.id,
    sourceDescription: material.description || MODULE2_D1_VENDOR_CONSOLIDATION.UNKNOWN_VALUE,
    sourceCategory: material.category,
    assignedUnspscCode: code,
    assignedUnspscTitle: material.unspscTitle,
    unspscSegment: code.slice(0, 2),
    unspscFamily: code.slice(0, 4),
    unspscClass: code.slice(0, 6),
    unspscCommodity: code,
    taxonomyVersion: '',
    mappingMethod: 'MANUAL_REVIEW_REQUIRED',
    confidenceScore: 0,
    evidence: isMapped ? 'UNSPSC fields were present in assessment transaction evidence.'
      : MODULE2_D1_VENDOR_CONSOLIDATION.MAPPING_GAP,
    reviewStatus,
    mappingDate: '',
    totalSpendInr: material.spend,
    totalSpendCr: crores(material.spend),
    transactionCount: material.transactionCount,
    qualifyingSuppliersCount: material.supplierCount,
    reviewReason: isMapped ? MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.MAPPING_REVIEW_REASON
      : MODULE2_D1_VENDOR_CONSOLIDATION.MAPPING_GAP
  };
};

export const mappingStatus = (entry: MaterialMappingEntry): CategoryClassificationType =>
  entry.reviewStatus === 'APPROVED' || entry.reviewStatus === 'TAXONOMY_VERIFIED' ||
  entry.reviewStatus === 'CLIENT_APPROVED' ? 'VERIFIED_UNSPSC'
    : entry.reviewStatus === 'PROVISIONAL' ? 'PROVISIONAL_UNSPSC'
      : entry.sourceCategory ? 'SOURCE_SPEND_CATEGORY' : 'UNMAPPED';

export const classificationLabel = (status: CategoryClassificationType): string =>
  MODULE2_D1_VENDOR_CONSOLIDATION.CATEGORY_CLASSIFICATION_LABELS[status];

export const supplierProfiles = (
  categoryTransactions: StrategicInputTransaction[], categorySpend: number
): SupplierSpendProfile[] => suppliersIn(categoryTransactions).map((supplier) => {
  const rows = supplier.transactions;
  const materialsSupplied = distinct(rows.map((row) => materialIdentity(row)));
  const plantsServed = distinct(rows.map((row) => row.plant || ''));
  return {
    vendorCode: supplier.vendorCode || supplier.vendorName,
    vendorName: supplier.vendorName,
    spendInr: supplier.spendInr,
    spendCr: crores(supplier.spendInr),
    spendSharePct: categorySpend > 0 ? supplier.spendInr / categorySpend * 100 : 0,
    distinctMaterialsCount: materialsSupplied.length,
    materialsSupplied,
    distinctPlantsCount: plantsServed.length,
    plantsServed,
    poCount: poCount(rows),
    isTailSupplier: categorySpend > 0 && supplier.spendInr / categorySpend * 100 <
      MODULE2_D1_VENDOR_CONSOLIDATION.TAIL_SUPPLIER_SHARE_THRESHOLD_PCT
  };
});

