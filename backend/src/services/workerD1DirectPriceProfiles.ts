import { MODULE2_D1_DIRECT_PRICE } from '../constants/module2D1Scoped';
import type {
  DirectPriceCategorySummary, DirectPriceFySummary, DirectPriceItemOpportunity,
  DirectPriceTransactionRecord, ItemQualificationStatus, PlantPriceComparison, SupplierPriceComparison
} from '../types/module2DirectPriceImprovement';
import type {
  DirectPriceD1Group, DirectPriceItemMetrics
} from '../types/module2DirectPriceImprovementD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import { getEAuctionFinancialYear } from './workerD1EAuction';

const clean = (value?: string): string => value?.trim() || '';
const normalized = (value?: string): string => clean(value).toLocaleUpperCase('en-US');
const finite = (value: number): number => Number.isFinite(value) ? value : 0;
const quantity = (row: StrategicInputTransaction): number => Math.max(0, finite(row.quantity));
const spend = (row: StrategicInputTransaction): number => Math.max(0, finite(row.total_spend_inr));
const crore = (value: number): number => Number(
  (value / MODULE2_D1_DIRECT_PRICE.INR_PER_CRORE).toFixed(MODULE2_D1_DIRECT_PRICE.AMOUNT_DECIMAL_PLACES)
);
const sum = (rows: StrategicInputTransaction[], selector: (row: StrategicInputTransaction) => number): number =>
  rows.reduce((total, row) => total + finite(selector(row)), 0);
const distinct = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const unitPrice = (row: StrategicInputTransaction): number | null => {
  const rowQuantity = quantity(row);
  return rowQuantity > 0 ? spend(row) / rowQuantity : null;
};

export const groupDirectPriceTransactions = (
  transactions: StrategicInputTransaction[]
): DirectPriceD1Group[] => {
  const groups = new Map<string, DirectPriceD1Group>();
  transactions.forEach((transaction, index) => {
    const category = clean(transaction.spend_category) || MODULE2_D1_DIRECT_PRICE.UNMAPPED_UNSPSC_TITLE;
    const code = normalized(transaction.material_code);
    const description = clean(transaction.material_desc);
    const uom = normalized(transaction.uom);
    const year = getEAuctionFinancialYear(transaction.po_date);
    const identity = code || `UNMAPPED:${normalized(description) || clean(transaction.id) || index}`;
    const key = `${normalized(category)}|${identity}|${uom || 'UOM-MISSING'}|${year}`;
    const group = groups.get(key) || {
      key, materialCode: code, materialDesc: description, spendCategory: category,
      uom, financialYear: year, transactions: []
    };
    group.transactions.push(transaction);
    groups.set(key, group);
  });
  return [...groups.values()];
};

const allSuppliers = (rows: StrategicInputTransaction[]): string[] => distinct(
  rows.map((row) => clean(row.vendor_code) || clean(row.vendor_name))
);

const uniquePrices = (rows: StrategicInputTransaction[]): number[] => [...new Set(
  rows.map(unitPrice).filter((price): price is number => price !== null)
)];

export const qualifyDirectPriceGroup = (group: DirectPriceD1Group): ItemQualificationStatus => {
  const descriptions = distinct(group.transactions.map((row) => normalized(row.material_desc)));
  const hasComparableIdentity = Boolean(group.materialCode && group.uom && descriptions.length === 1 &&
    group.transactions.every((row) => quantity(row) > 0));
  if (!hasComparableIdentity) return 'SPEC_MISMATCH';
  if (allSuppliers(group.transactions).length < 2) return 'SINGLE_SUPPLIER';
  if (uniquePrices(group.transactions).length < 2) return 'UNIFORM_PRICING';
  return 'QUALIFIED';
};

const transactionLostOpportunity = (
  row: StrategicInputTransaction, benchmarkPrice: number, qualificationStatus: ItemQualificationStatus
): number => qualificationStatus === 'QUALIFIED'
  ? Math.max(0, spend(row) - quantity(row) * benchmarkPrice)
  : 0;

const statusWarning = (status: ItemQualificationStatus): string => {
  if (status === 'SINGLE_SUPPLIER') return MODULE2_D1_DIRECT_PRICE.SINGLE_SUPPLIER_WARNING;
  if (status === 'UNIFORM_PRICING') return MODULE2_D1_DIRECT_PRICE.UNIFORM_PRICE_WARNING;
  if (status === 'SPEC_MISMATCH') return MODULE2_D1_DIRECT_PRICE.MISSING_COMPARABILITY_WARNING;
  return MODULE2_D1_DIRECT_PRICE.REVIEW_WARNING;
};

const buildTransactionEvidence = (
  group: DirectPriceD1Group, benchmarkPrice: number, status: ItemQualificationStatus
): DirectPriceTransactionRecord[] => group.transactions.map((row) => {
  const rowPrice = unitPrice(row) || 0;
  const benchmark = quantity(row) * benchmarkPrice;
  const historicalDifference = transactionLostOpportunity(row, benchmarkPrice, status);
  return {
    id: clean(row.id) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    poNumber: clean(row.po_number) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    poDate: clean(row.po_date) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    financialYear: group.financialYear,
    supplierName: clean(row.vendor_name) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    supplierCode: clean(row.vendor_code) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    plantCode: clean(row.plant) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    quantity: quantity(row),
    unitPrice: rowPrice,
    totalSpendInr: spend(row),
    benchmarkUnitPrice: status === 'QUALIFIED' ? benchmarkPrice : 0,
    benchmarkCostInr: status === 'QUALIFIED' ? benchmark : 0,
    historicalLostOpportunityInr: historicalDifference,
    isBenchmarkTransaction: status === 'QUALIFIED' && rowPrice === benchmarkPrice,
    qualificationStatus: status,
    warning: statusWarning(status)
  };
});

const supplierComparisons = (
  rows: StrategicInputTransaction[], benchmarkPrice: number, status: ItemQualificationStatus
): SupplierPriceComparison[] => {
  const groups = new Map<string, StrategicInputTransaction[]>();
  rows.forEach((row, index) => {
    const key = clean(row.vendor_code) || clean(row.vendor_name) || `UNKNOWN-${index}`;
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  return [...groups.entries()].map(([code, supplierRows]) => {
    const totalQuantity = sum(supplierRows, quantity);
    const prices = supplierRows.map(unitPrice).filter((price): price is number => price !== null);
    return {
      supplierCode: code,
      supplierName: clean(supplierRows[0]?.vendor_name) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
      transactionCount: supplierRows.length,
      totalQuantity,
      totalSpendInr: sum(supplierRows, spend),
      weightedAveragePrice: totalQuantity > 0 ? sum(supplierRows, spend) / totalQuantity : 0,
      lowestUnitPrice: prices.length ? Math.min(...prices) : 0,
      highestUnitPrice: prices.length ? Math.max(...prices) : 0,
      historicalLostOpportunityInr: sum(supplierRows,
        (row) => transactionLostOpportunity(row, benchmarkPrice, status)),
      isLowestPriceSupplier: prices.length > 0 && Math.min(...prices) === benchmarkPrice
    };
  }).sort((left, right) => left.weightedAveragePrice - right.weightedAveragePrice);
};

const plantComparisons = (
  rows: StrategicInputTransaction[], benchmarkPrice: number, status: ItemQualificationStatus
): PlantPriceComparison[] => {
  const groups = new Map<string, StrategicInputTransaction[]>();
  rows.forEach((row, index) => {
    const key = clean(row.plant) || `UNASSIGNED-${index + 1}`;
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  return [...groups.entries()].map(([plantCode, plantRows]) => {
    const totalQuantity = sum(plantRows, quantity);
    const prices = plantRows.map(unitPrice).filter((price): price is number => price !== null);
    return {
      plantCode,
      transactionCount: plantRows.length,
      totalQuantity,
      totalSpendInr: sum(plantRows, spend),
      weightedAveragePrice: totalQuantity > 0 ? sum(plantRows, spend) / totalQuantity : 0,
      lowestUnitPrice: prices.length ? Math.min(...prices) : 0,
      historicalLostOpportunityInr: sum(plantRows,
        (row) => transactionLostOpportunity(row, benchmarkPrice, status))
    };
  }).sort((left, right) => left.weightedAveragePrice - right.weightedAveragePrice);
};

const buildItemMetrics = (group: DirectPriceD1Group): DirectPriceItemMetrics => {
  const rows = group.transactions;
  const status = qualifyDirectPriceGroup(group);
  const prices = rows.map(unitPrice).filter((price): price is number => price !== null);
  const benchmarkPrice = status === 'QUALIFIED' ? Math.min(...prices) : 0;
  const totalQuantity = sum(rows, quantity);
  const totalSpend = sum(rows, spend);
  const isQualified = status === 'QUALIFIED';
  const benchmarkCost = isQualified ? totalQuantity * benchmarkPrice : 0;
  const historicalDifference = isQualified
    ? rows.reduce((total, row) => total + transactionLostOpportunity(row, benchmarkPrice, status), 0)
    : 0;
  const unspscCode = clean(rows.find((row) => clean(row.unspsc_code))?.unspsc_code) ||
    MODULE2_D1_DIRECT_PRICE.UNMAPPED_UNSPSC_CODE;
  const unspscCategory = clean(rows.find((row) => clean(row.unspsc_category))?.unspsc_category) ||
    MODULE2_D1_DIRECT_PRICE.UNMAPPED_UNSPSC_TITLE;
  return {
    status,
    prices,
    benchmarkPrice,
    totalQuantity,
    totalSpend,
    benchmarkCost,
    historicalDifference,
    benchmarkRow: isQualified ? rows.find((row) => unitPrice(row) === benchmarkPrice) : undefined,
    lowestPrice: prices.length ? Math.min(...prices) : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    weightedAveragePrice: totalQuantity > 0 ? totalSpend / totalQuantity : 0,
    priceDispersionPct: benchmarkPrice > 0
      ? Number(((Math.max(...prices) - benchmarkPrice) / benchmarkPrice * 100).toFixed(2)) : 0,
    unspscCode,
    unspscCategory
  };
};

export const buildDirectPriceItem = (group: DirectPriceD1Group): DirectPriceItemOpportunity => {
  const rows = group.transactions;
  const metrics = buildItemMetrics(group);
  const warnings = [statusWarning(metrics.status), MODULE2_D1_DIRECT_PRICE.REVIEW_WARNING];
  return {
    itemKey: group.key,
    materialCode: group.materialCode || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    materialDesc: group.materialDesc || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    spendCategory: group.spendCategory,
    uom: group.uom || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    currency: 'INR',
    unspscCode: metrics.unspscCode,
    unspscCategory: metrics.unspscCategory,
    financialYear: group.financialYear,
    transactionCount: rows.length,
    totalEligibleQuantity: metrics.status === 'QUALIFIED' ? metrics.totalQuantity : 0,
    lowestUnitPrice: metrics.lowestPrice,
    weightedAveragePrice: metrics.weightedAveragePrice,
    highestUnitPrice: metrics.highestPrice,
    actualPurchaseCostInr: metrics.totalSpend,
    actualPurchaseCostCr: crore(metrics.totalSpend),
    benchmarkCostInr: metrics.benchmarkCost,
    benchmarkCostCr: crore(metrics.benchmarkCost),
    historicalLostOpportunityInr: metrics.historicalDifference,
    historicalLostOpportunityCr: crore(metrics.historicalDifference),
    priceDispersionPct: metrics.priceDispersionPct,
    benchmarkSupplierName: clean(metrics.benchmarkRow?.vendor_name) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    benchmarkSupplierCode: clean(metrics.benchmarkRow?.vendor_code) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    benchmarkPoNumber: clean(metrics.benchmarkRow?.po_number) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    benchmarkPoDate: clean(metrics.benchmarkRow?.po_date) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    benchmarkPlantCode: clean(metrics.benchmarkRow?.plant) || MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    supplierCount: allSuppliers(rows).length,
    plantCount: distinct(rows.map((row) => row.plant || '')).length,
    qualificationStatus: metrics.status,
    warnings,
    suppliers: supplierComparisons(rows, metrics.benchmarkPrice, metrics.status),
    plants: plantComparisons(rows, metrics.benchmarkPrice, metrics.status),
    transactions: buildTransactionEvidence(group, metrics.benchmarkPrice, metrics.status)
  };
};

export const buildDirectPriceCategory = (
  category: string, materials: DirectPriceItemOpportunity[]
): DirectPriceCategorySummary => {
  const qualified = materials.filter((item) => item.qualificationStatus === 'QUALIFIED');
  const spend = materials.reduce((total, item) => total + item.actualPurchaseCostInr, 0);
  const eligibleSpend = qualified.reduce((total, item) => total + item.actualPurchaseCostInr, 0);
  const benchmarkCost = qualified.reduce((total, item) => total + item.benchmarkCostInr, 0);
  const historicalDifference = qualified.reduce((total, item) => total + item.historicalLostOpportunityInr, 0);
  const unspscCode = clean(materials.find((item) => clean(item.unspscCode))?.unspscCode) ||
    MODULE2_D1_DIRECT_PRICE.UNMAPPED_UNSPSC_CODE;
  const unspscCategory = clean(materials.find((item) => clean(item.unspscCategory))?.unspscCategory) ||
    MODULE2_D1_DIRECT_PRICE.UNMAPPED_UNSPSC_TITLE;
  const uoms = distinct(materials.map((item) => item.uom).filter(
    (uom) => uom !== MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE
  ));
  const hasReviewItems = qualified.length !== materials.length;
  return {
    unspscCode,
    unspscCategory,
    spendCategory: category,
    distinctMaterialCount: materials.length,
    eligibleTransactionCount: qualified.reduce((total, item) => total + item.transactionCount, 0),
    eligibleQuantity: qualified.reduce((total, item) => total + item.totalEligibleQuantity, 0),
    uom: uoms.length === 1 ? uoms[0] : uoms.length ? 'Multiple units' : MODULE2_D1_DIRECT_PRICE.UNKNOWN_VALUE,
    eligibleSpendInr: eligibleSpend,
    eligibleSpendCr: crore(eligibleSpend),
    actualPurchaseCostInr: spend,
    actualPurchaseCostCr: crore(spend),
    benchmarkCostInr: benchmarkCost,
    benchmarkCostCr: crore(benchmarkCost),
    historicalLostOpportunityInr: historicalDifference,
    historicalLostOpportunityCr: crore(historicalDifference),
    opportunityPct: eligibleSpend > 0 ? Number((historicalDifference / eligibleSpend * 100).toFixed(2)) : 0,
    dataQualityStatus: hasReviewItems
      ? MODULE2_D1_DIRECT_PRICE.DATA_QUALITY_REVIEW : MODULE2_D1_DIRECT_PRICE.DATA_QUALITY_COMPARABLE,
    materials
  };
};

export const buildDirectPriceFySummary = (
  financialYear: string, materials: DirectPriceItemOpportunity[]
): DirectPriceFySummary => {
  const eligible = materials.filter((item) => item.qualificationStatus === 'QUALIFIED');
  const transactions = materials.flatMap((item) => item.transactions);
  const actualSpend = materials.reduce((total, item) => total + item.actualPurchaseCostInr, 0);
  const benchmarkCost = eligible.reduce((total, item) => total + item.benchmarkCostInr, 0);
  const historicalDifference = eligible.reduce((total, item) => total + item.historicalLostOpportunityInr, 0);
  return {
    financialYear,
    transactionCount: transactions.length,
    totalQuantity: transactions.reduce((total, row) => total + row.quantity, 0),
    actualSpendInr: actualSpend,
    actualSpendCr: crore(actualSpend),
    benchmarkCostInr: benchmarkCost,
    benchmarkCostCr: crore(benchmarkCost),
    historicalLostOpportunityInr: historicalDifference,
    historicalLostOpportunityCr: crore(historicalDifference),
    itemsEvaluatedCount: materials.length,
    itemsWithOpportunityCount: eligible.filter((item) => item.historicalLostOpportunityInr > 0).length
  };
};
