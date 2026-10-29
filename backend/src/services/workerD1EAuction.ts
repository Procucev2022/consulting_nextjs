import { MODULE2_D1_EAUCTION } from '../constants/module2D1Scoped';
import type {
  EAuctionCategoryCandidate, EAuctionFySummary, EAuctionMaterialCandidate, EAuctionResult,
  EAuctionSavingsRange
} from '../types/module2EAuction';
import type {
  EAuctionBuildOptions, EAuctionMaterialGroup, EAuctionMaterialMetrics
} from '../types/module2EAuctionD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

const clean = (value?: string): string => value?.trim() || '';
const normalized = (value?: string): string => clean(value).toLocaleUpperCase('en-US');
const validNumber = (value: number): number => Number.isFinite(value) ? value : 0;
const roundCrores = (amount: number): number => Number(
  (amount / MODULE2_D1_EAUCTION.INR_PER_CRORE).toFixed(MODULE2_D1_EAUCTION.AMOUNT_DECIMAL_PLACES)
);
const sum = (rows: StrategicInputTransaction[], getValue: (row: StrategicInputTransaction) => number): number =>
  rows.reduce((total, row) => total + validNumber(getValue(row)), 0);
const uniqueValues = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

export const getEAuctionFinancialYear = (dateValue?: string): string => {
  const date = clean(dateValue).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR;
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  if (month < 1 || month > 12) return MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR;
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR;
  }
  const startYear = month >= MODULE2_D1_EAUCTION.INDIAN_FINANCIAL_YEAR_START_MONTH ? year : year - 1;
  return `FY${startYear}-${String(startYear + 1).slice(-2)}`;
};

const groupTransactions = (transactions: StrategicInputTransaction[]): EAuctionMaterialGroup[] => {
  const groups = new Map<string, EAuctionMaterialGroup>();
  transactions.forEach((transaction, index) => {
    const materialCode = normalized(transaction.material_code);
    const description = clean(transaction.material_desc);
    const category = clean(transaction.spend_category) || MODULE2_D1_EAUCTION.UNCLASSIFIED_CATEGORY;
    const uom = normalized(transaction.uom);
    const identity = materialCode || `UNMAPPED:${normalized(description) || index}`;
    const key = `${normalized(category)}|${identity}|${uom || 'UOM-MISSING'}`;
    const group = groups.get(key) || {
      key, materialCode, materialDesc: description, spendCategory: category, uom, transactions: []
    };
    group.transactions.push(transaction);
    groups.set(key, group);
  });
  return [...groups.values()];
};

const suppliersFor = (rows: StrategicInputTransaction[]): string[] => uniqueValues(
  rows.map((row) => clean(row.vendor_code) || clean(row.vendor_name))
);

const purchaseOrdersFor = (rows: StrategicInputTransaction[]): string[] => uniqueValues(
  rows.map((row) => clean(row.po_number))
);

const suitabilityFor = (group: EAuctionMaterialGroup): EAuctionMaterialMetrics['suitability'] => {
  if (!group.materialCode || !group.uom) return MODULE2_D1_EAUCTION.SUITABILITY.MORE_DATA;
  const spend = sum(group.transactions, (row) => row.total_spend_inr);
  const hasMinimumEvidence = suppliersFor(group.transactions).length >= MODULE2_D1_EAUCTION.MINIMUM_SUPPLIERS &&
    purchaseOrdersFor(group.transactions).length >= MODULE2_D1_EAUCTION.MINIMUM_PURCHASE_ORDERS &&
    spend >= MODULE2_D1_EAUCTION.MINIMUM_ADDRESSABLE_SPEND_INR;
  return hasMinimumEvidence
    ? MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
    : MODULE2_D1_EAUCTION.SUITABILITY.NOT_SUITABLE;
};

const buildSavingsRange = (addressableSpendInr: number): EAuctionSavingsRange => ({
  savingsRangeStatus: 'NOT_YET_QUANTIFIABLE',
  addressableSpendInr,
  addressableSpendCr: roundCrores(addressableSpendInr)
});

const priceEvidence = (rows: StrategicInputTransaction[]): number[] => {
  const currencies = uniqueValues(rows.map((row) => row.currency || ''));
  return currencies.length === 1 && currencies[0].toUpperCase() === 'INR'
    ? rows.map((row) => validNumber(row.unit_price)).filter((price) => price > 0)
    : [];
};

const unspscEvidence = (rows: StrategicInputTransaction[]): Pick<EAuctionMaterialMetrics, 'unspscCode' | 'unspscCategory'> => {
  const mapped = rows.find((row) => clean(row.unspsc_code));
  return {
    unspscCode: clean(mapped?.unspsc_code) || MODULE2_D1_EAUCTION.UNMAPPED_UNSPSC_CODE,
    unspscCategory: clean(mapped?.unspsc_category) || MODULE2_D1_EAUCTION.UNMAPPED_UNSPSC_TITLE
  };
};

const buildMaterialMetrics = (group: EAuctionMaterialGroup): EAuctionMaterialMetrics => {
  const rows = group.transactions;
  const spend = sum(rows, (row) => row.total_spend_inr);
  const quantity = sum(rows, (row) => row.quantity);
  const supplierCount = suppliersFor(rows).length;
  const poCount = purchaseOrdersFor(rows).length;
  const plantCount = uniqueValues(rows.map((row) => row.plant || '')).length;
  const prices = priceEvidence(rows);
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const highestPrice = prices.length ? Math.max(...prices) : 0;
  const suitability = suitabilityFor(group);
  return {
    spend, quantity, supplierCount, poCount, plantCount, prices, lowestPrice, highestPrice, suitability,
    candidate: suitability === MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE,
    missingIdentity: suitability === MODULE2_D1_EAUCTION.SUITABILITY.MORE_DATA,
    ...unspscEvidence(rows)
  };
};

const materialRationale = (metrics: EAuctionMaterialMetrics): string => {
  if (metrics.missingIdentity) return MODULE2_D1_EAUCTION.MISSING_IDENTITY_REASON;
  if (metrics.candidate) return MODULE2_D1_EAUCTION.CANDIDATE_REASON;
  return MODULE2_D1_EAUCTION.THRESHOLD_REASON;
};

const addressableSpendFor = (metrics: EAuctionMaterialMetrics): number =>
  metrics.candidate ? metrics.spend : 0;

const priceRangeFor = (metrics: EAuctionMaterialMetrics): string => metrics.prices.length
  ? `${metrics.lowestPrice} - ${metrics.highestPrice}`
  : MODULE2_D1_EAUCTION.PRICE_NOT_AVAILABLE;

const weightedAveragePriceFor = (metrics: EAuctionMaterialMetrics): number =>
  metrics.quantity > 0 ? metrics.spend / metrics.quantity : 0;

const priceDispersionFor = (metrics: EAuctionMaterialMetrics): number => metrics.lowestPrice > 0
  ? Number(((metrics.highestPrice - metrics.lowestPrice) / metrics.lowestPrice * 100).toFixed(2))
  : 0;

const buildMaterial = (group: EAuctionMaterialGroup, financialYear: string): EAuctionMaterialCandidate => {
  const metrics = buildMaterialMetrics(group);
  const addressableSpendInr = addressableSpendFor(metrics);
  return {
    materialCode: group.materialCode || MODULE2_D1_EAUCTION.UNKNOWN_VALUE,
    materialDesc: group.materialDesc || MODULE2_D1_EAUCTION.UNKNOWN_VALUE,
    spendCategory: group.spendCategory,
    unspscCode: metrics.unspscCode,
    unspscCategory: metrics.unspscCategory,
    financialYear,
    totalSpendInr: metrics.spend,
    totalSpendCr: roundCrores(metrics.spend),
    addressableSpendInr,
    addressableSpendCr: roundCrores(addressableSpendInr),
    totalQuantity: metrics.quantity,
    uom: group.uom || MODULE2_D1_EAUCTION.UNKNOWN_VALUE,
    poCount: metrics.poCount,
    supplierCount: metrics.supplierCount,
    plantCount: metrics.plantCount,
    lowestUnitPrice: metrics.lowestPrice,
    highestUnitPrice: metrics.highestPrice,
    priceRangeStr: priceRangeFor(metrics),
    weightedAveragePrice: weightedAveragePriceFor(metrics),
    priceDispersionPct: priceDispersionFor(metrics),
    suitability: metrics.suitability,
    evidenceRationale: materialRationale(metrics),
    missingInfoLimitations: metrics.missingIdentity
      ? MODULE2_D1_EAUCTION.MISSING_DATA_LIMITATION
      : MODULE2_D1_EAUCTION.HISTORICAL_ONLY_LIMITATION,
    procurementReviewRequirements: [...MODULE2_D1_EAUCTION.PROCUREMENT_REVIEW_REQUIREMENTS],
    savingsRange: buildSavingsRange(addressableSpendInr)
  };
};

const buildCategory = (
  category: string, groups: EAuctionMaterialGroup[], financialYear: string
): EAuctionCategoryCandidate => {
  const rows = groups.flatMap((group) => group.transactions);
  const materials = groups.map((group) => buildMaterial(group, financialYear));
  const candidates = materials.filter((material) =>
    material.suitability === MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
  );
  const needsReview = materials.some((material) =>
    material.suitability === MODULE2_D1_EAUCTION.SUITABILITY.MORE_DATA
  );
  const spend = sum(rows, (row) => row.total_spend_inr);
  const addressable = candidates.reduce((total, item) => total + item.addressableSpendInr, 0);
  const uoms = uniqueValues(groups.map((group) => group.uom));
  const suitability = candidates.length
    ? MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
    : needsReview ? MODULE2_D1_EAUCTION.SUITABILITY.MORE_DATA : MODULE2_D1_EAUCTION.SUITABILITY.NOT_SUITABLE;
  const unspscRow = rows.find((row) => clean(row.unspsc_code));
  return {
    unspscCode: clean(unspscRow?.unspsc_code) || MODULE2_D1_EAUCTION.UNMAPPED_UNSPSC_CODE,
    unspscCategory: clean(unspscRow?.unspsc_category) || MODULE2_D1_EAUCTION.UNMAPPED_UNSPSC_TITLE,
    spendCategory: category,
    totalSpendInr: spend,
    totalSpendCr: roundCrores(spend),
    addressableSpendInr: addressable,
    addressableSpendCr: roundCrores(addressable),
    purchaseQuantity: sum(rows, (row) => row.quantity),
    uom: uoms.length === 1 ? uoms[0] : uoms.length
      ? MODULE2_D1_EAUCTION.MULTIPLE_UOMS : MODULE2_D1_EAUCTION.UNKNOWN_VALUE,
    distinctMaterialCount: materials.length,
    poCount: purchaseOrdersFor(rows).length,
    supplierCount: suppliersFor(rows).length,
    plantCount: uniqueValues(rows.map((row) => row.plant || '')).length,
    priceVariationIndicator: MODULE2_D1_EAUCTION.PRICE_RANGE_LABEL,
    auctionSuitability: suitability,
    evidenceBasedRationale: suitability === MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
      ? MODULE2_D1_EAUCTION.CATEGORY_CANDIDATE
      : suitability === MODULE2_D1_EAUCTION.SUITABILITY.MORE_DATA
        ? MODULE2_D1_EAUCTION.CATEGORY_MISSING_DATA
        : MODULE2_D1_EAUCTION.CATEGORY_NO_CANDIDATES,
    dataLimitations: MODULE2_D1_EAUCTION.HISTORICAL_ONLY_LIMITATION,
    savingsRange: buildSavingsRange(addressable),
    materials: materials.sort((left, right) => right.totalSpendInr - left.totalSpendInr)
  };
};

const buildFinancialYearSummary = (
  financialYear: string, transactions: StrategicInputTransaction[]
): EAuctionFySummary => {
  const groups = groupTransactions(transactions);
  const materials = groups.map((group) => buildMaterial(group, financialYear));
  const candidates = materials.filter((material) =>
    material.suitability === MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
  );
  const candidateCategories = new Set(candidates.map((material) => material.spendCategory));
  const totalSpendInr = sum(transactions, (row) => row.total_spend_inr);
  const addressableSpendInr = candidates.reduce((total, material) => total + material.addressableSpendInr, 0);
  return {
    financialYear,
    totalSpendInr,
    totalSpendCr: roundCrores(totalSpendInr),
    addressableSpendInr,
    addressableSpendCr: roundCrores(addressableSpendInr),
    totalQuantity: sum(transactions, (row) => row.quantity),
    poCount: purchaseOrdersFor(transactions).length,
    candidateMaterialsCount: candidates.length,
    candidateCategoriesCount: candidateCategories.size,
    minEstimatedSavingsCr: 0,
    expectedEstimatedSavingsCr: 0,
    maxEstimatedSavingsCr: 0
  };
};

const applyFilters = (
  categories: EAuctionCategoryCandidate[], options: EAuctionBuildOptions
): EAuctionCategoryCandidate[] =>
  categories.map((category) => ({
    ...category,
    materials: category.materials.filter((material) =>
      (!options.materialCode || material.materialCode.toLocaleUpperCase('en-US') ===
        options.materialCode.toLocaleUpperCase('en-US')) &&
      (!options.suitability || options.suitability === MODULE2_D1_EAUCTION.FILTER_ALL ||
        material.suitability === options.suitability)
    )
  })).filter((category) =>
    (!options.category || category.spendCategory.toLocaleLowerCase('en-US') === options.category.toLocaleLowerCase('en-US')) &&
    (!options.suitability || options.suitability === MODULE2_D1_EAUCTION.FILTER_ALL ||
      category.auctionSuitability === options.suitability) &&
    (!options.materialCode || category.materials.length > 0)
  ).map((category) => ({
    ...category,
    distinctMaterialCount: category.materials.length,
    addressableSpendInr: category.materials.reduce((total, item) => total + item.addressableSpendInr, 0),
    addressableSpendCr: roundCrores(category.materials.reduce((total, item) => total + item.addressableSpendInr, 0)),
    savingsRange: buildSavingsRange(category.materials.reduce((total, item) => total + item.addressableSpendInr, 0))
  }));

export const buildEAuctionResult = (
  assessmentId: string, transactions: StrategicInputTransaction[], options: EAuctionBuildOptions = {},
  customerName = assessmentId
): EAuctionResult => {
  const allFinancialYears = uniqueValues(transactions.map((row) => getEAuctionFinancialYear(row.po_date)))
    .sort((left, right) => right.localeCompare(left));
  const selectedFinancialYear = options.financialYear || MODULE2_D1_EAUCTION.ALL_FINANCIAL_YEARS;
  const selectedTransactions = transactions.filter((row) =>
    selectedFinancialYear === MODULE2_D1_EAUCTION.ALL_FINANCIAL_YEARS ||
    getEAuctionFinancialYear(row.po_date) === selectedFinancialYear);
  const groups = groupTransactions(selectedTransactions);
  const categoryGroups = new Map<string, EAuctionMaterialGroup[]>();
  groups.forEach((group) => categoryGroups.set(group.spendCategory, [
    ...(categoryGroups.get(group.spendCategory) || []), group
  ]));
  const categories = [...categoryGroups.entries()].map(([category, categoryMaterials]) =>
    buildCategory(category, categoryMaterials, selectedFinancialYear)
  );
  const filteredCategories = applyFilters(categories, options)
    .sort((left, right) => right.totalSpendInr - left.totalSpendInr);
  const candidates = filteredCategories.filter((category) =>
    category.auctionSuitability === MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
  );
  const totalSpendInr = sum(selectedTransactions, (row) => row.total_spend_inr);
  const addressableSpendInr = candidates.reduce((total, category) => total + category.addressableSpendInr, 0);
  const yearNames = allFinancialYears.filter((year) => year !== MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR);
  if (allFinancialYears.includes(MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR)) {
    yearNames.push(MODULE2_D1_EAUCTION.UNKNOWN_FINANCIAL_YEAR);
  }
  const fySummaries = yearNames.map((year) => buildFinancialYearSummary(year,
    transactions.filter((row) => getEAuctionFinancialYear(row.po_date) === year)));
  return {
    assessmentId,
    customerName,
    totalSpendReviewedInr: totalSpendInr,
    totalSpendReviewedCr: roundCrores(totalSpendInr),
    totalAddressableSpendInr: addressableSpendInr,
    totalAddressableSpendCr: roundCrores(addressableSpendInr),
    categoriesReviewedCount: filteredCategories.length,
    candidateCategoriesCount: candidates.length,
    candidateMaterialsCount: candidates.reduce((count, category) => count + category.materials.filter((material) =>
      material.suitability === MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE
    ).length, 0),
    recordsRequiringDataReviewCount: selectedTransactions.filter((row) =>
      !clean(row.material_code) || !clean(row.uom)
    ).length,
    commerciallyValidatedSavingsInr: 0,
    commerciallyValidatedSavingsCr: 0,
    availableFinancialYears: [MODULE2_D1_EAUCTION.ALL_FINANCIAL_YEARS, ...yearNames],
    selectedFinancialYear,
    certificationNotice: MODULE2_D1_EAUCTION.CERTIFICATION_NOTICE,
    importantLimitations: [...MODULE2_D1_EAUCTION.IMPORTANT_LIMITATIONS],
    fySummaries,
    summarySavingsRange: buildSavingsRange(addressableSpendInr),
    planningAssumptions: [],
    categories: filteredCategories
  };
};
