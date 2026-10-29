import { MODULE2_D1_DIRECT_PRICE } from '../constants/module2D1Scoped';
import type {
  DirectPriceCategorySummary, DirectPriceFySummary, DirectPriceImprovementResult,
  DirectPriceItemOpportunity
} from '../types/module2DirectPriceImprovement';
import type { DirectPriceD1BuildOptions } from '../types/module2DirectPriceImprovementD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import {
  buildDirectPriceCategory, buildDirectPriceFySummary, buildDirectPriceItem, groupDirectPriceTransactions
} from './workerD1DirectPriceProfiles';
import { getEAuctionFinancialYear } from './workerD1EAuction';

const clean = (value?: string): string => value?.trim() || '';
const roundCrores = (amount: number): number => Number(
  (amount / MODULE2_D1_DIRECT_PRICE.INR_PER_CRORE).toFixed(MODULE2_D1_DIRECT_PRICE.AMOUNT_DECIMAL_PLACES)
);
const sumSpend = (rows: StrategicInputTransaction[]): number => rows.reduce(
  (total, row) => total + (Number.isFinite(row.total_spend_inr) ? Math.max(0, row.total_spend_inr) : 0), 0
);

const filterTransactions = (
  rows: StrategicInputTransaction[], options: DirectPriceD1BuildOptions, financialYear?: string
): StrategicInputTransaction[] => rows.filter((row) => {
  const categoryMatches = !options.category ||
    clean(row.spend_category).toLowerCase() === options.category.toLowerCase();
  const materialMatches = !options.materialCode ||
    clean(row.material_code).toUpperCase() === options.materialCode.toUpperCase();
  const yearMatches = !financialYear || getEAuctionFinancialYear(row.po_date) === financialYear;
  return categoryMatches && materialMatches && yearMatches;
});

const buildItems = (rows: StrategicInputTransaction[]): DirectPriceItemOpportunity[] =>
  groupDirectPriceTransactions(rows).map(buildDirectPriceItem)
    .sort((left, right) => right.actualPurchaseCostInr - left.actualPurchaseCostInr);

const buildCategories = (items: DirectPriceItemOpportunity[]): DirectPriceCategorySummary[] => {
  const grouped = new Map<string, DirectPriceItemOpportunity[]>();
  items.forEach((item) => grouped.set(item.spendCategory, [
    ...(grouped.get(item.spendCategory) || []), item
  ]));
  return [...grouped.entries()].map(([category, materials]) => buildDirectPriceCategory(category, materials))
    .sort((left, right) => right.actualPurchaseCostInr - left.actualPurchaseCostInr);
};

const yearList = (transactions: StrategicInputTransaction[]): string[] => {
  const years = [...new Set(transactions.map((row) => getEAuctionFinancialYear(row.po_date)))];
  return [MODULE2_D1_DIRECT_PRICE.ALL_FINANCIAL_YEARS, ...years.sort((left, right) => right.localeCompare(left))];
};

const buildYearSummaries = (
  transactions: StrategicInputTransaction[], options: DirectPriceD1BuildOptions
): DirectPriceFySummary[] => yearList(transactions).slice(1).map((year) =>
  buildDirectPriceFySummary(year, buildItems(filterTransactions(transactions, options, year)))
);

export const buildDirectPriceResult = (
  assessmentId: string,
  transactions: StrategicInputTransaction[],
  options: DirectPriceD1BuildOptions = {},
  customerName = assessmentId
): DirectPriceImprovementResult => {
  const selectedFinancialYear = options.financialYear || MODULE2_D1_DIRECT_PRICE.ALL_FINANCIAL_YEARS;
  const selectedTransactions = filterTransactions(
    transactions, options,
    selectedFinancialYear === MODULE2_D1_DIRECT_PRICE.ALL_FINANCIAL_YEARS ? undefined : selectedFinancialYear
  );
  const items = buildItems(selectedTransactions);
  const categorySummaries = buildCategories(items);
  const qualified = items.filter((item) => item.qualificationStatus === 'QUALIFIED');
  const actualSpend = sumSpend(selectedTransactions);
  const eligibleSpend = qualified.reduce((total, item) => total + item.actualPurchaseCostInr, 0);
  const benchmarkCost = qualified.reduce((total, item) => total + item.benchmarkCostInr, 0);
  const historicalDifference = qualified.reduce((total, item) => total + item.historicalLostOpportunityInr, 0);
  const eligibleTransactions = qualified.reduce((total, item) => total + item.transactionCount, 0);
  return {
    assessmentId,
    customerName,
    availableFinancialYears: yearList(transactions),
    selectedFinancialYear,
    totalEligibleTransactions: eligibleTransactions,
    totalIneligibleTransactions: Math.max(0, selectedTransactions.length - eligibleTransactions),
    totalEligibleSpendInr: eligibleSpend,
    totalEligibleSpendCr: roundCrores(eligibleSpend),
    totalIneligibleSpendInr: Math.max(0, actualSpend - eligibleSpend),
    totalIneligibleSpendCr: roundCrores(Math.max(0, actualSpend - eligibleSpend)),
    actualSpendInr: actualSpend,
    actualSpendCr: roundCrores(actualSpend),
    benchmarkCostInr: benchmarkCost,
    benchmarkCostCr: roundCrores(benchmarkCost),
    historicalLostOpportunityInr: historicalDifference,
    historicalLostOpportunityCr: roundCrores(historicalDifference),
    commerciallyValidatedSavingsInr: 0,
    commerciallyValidatedSavingsCr: 0,
    itemsEvaluatedCount: items.length,
    itemsWithOpportunityCount: qualified.filter((item) => item.historicalLostOpportunityInr > 0).length,
    disqualifiedItemsCount: items.length - qualified.length,
    categoriesAnalysedCount: categorySummaries.length,
    categoriesRequiringReviewCount: categorySummaries.filter((category) =>
      category.dataQualityStatus === MODULE2_D1_DIRECT_PRICE.DATA_QUALITY_REVIEW
    ).length,
    certificationNotice: MODULE2_D1_DIRECT_PRICE.CERTIFICATION_NOTICE,
    fySummaries: buildYearSummaries(transactions, options),
    categorySummaries,
    items
  };
};
