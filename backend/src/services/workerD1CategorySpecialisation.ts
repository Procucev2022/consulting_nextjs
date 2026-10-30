import { MODULE2_D1_CATEGORY_SPECIALISATION as CONFIG } from '../constants/module2CategorySpecialisationD1';
import type {
  CategoryManagementApproach,
  CategoryPriority,
  CategorySpecialisationProfile,
  CategorySpecialisationResult
} from '../types/module2CategorySpecialisation';
import type { CategorySpecialisationD1BuildInput } from '../types/module2CategorySpecialisationD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import { Module2StrategicSourcingEngine } from './module2StrategicSourcingEngine';
import type { ScopedCategoryProfile } from '../types/module2D1Scoped';

const clean = (value: unknown): string => String(value ?? '').trim();
const finitePositive = (value: number): number => Number.isFinite(value) && value > 0 ? value : 0;
const toCrores = (value: number): number => Number((value / CONFIG.INR_PER_CRORE).toFixed(4));

const uniqueValues = (
  transactions: StrategicInputTransaction[],
  select: (row: StrategicInputTransaction) => unknown
): Set<string> => new Set(transactions.map(select).map(clean).filter(Boolean));

const supplierMetrics = (transactions: StrategicInputTransaction[], categorySpendInr: number): {
  topSupplierConcentrationPct: number;
  herfindahlIndex: number;
} => {
  const supplierSpend = new Map<string, number>();
  for (const row of transactions) {
    const supplier = clean(row.vendor_code) || clean(row.vendor_name);
    const spend = finitePositive(row.total_spend_inr);
    if (supplier && spend) supplierSpend.set(supplier, (supplierSpend.get(supplier) || 0) + spend);
  }
  if (categorySpendInr <= 0 || supplierSpend.size === 0) {
    return { topSupplierConcentrationPct: 0, herfindahlIndex: 0 };
  }
  const shares = [...supplierSpend.values()].map((spend) => spend / categorySpendInr * 100);
  return {
    topSupplierConcentrationPct: Number(Math.max(...shares).toFixed(2)),
    herfindahlIndex: Number(shares.reduce((total, share) => total + share ** 2, 0).toFixed(2))
  };
};

const resolvePriority = (sharePct: number): CategoryPriority => {
  if (sharePct >= CONFIG.PRIORITY_A_SPEND_SHARE_PCT) return 'PRIORITY_A';
  if (sharePct >= CONFIG.PRIORITY_B_SPEND_SHARE_PCT) return 'PRIORITY_B';
  return 'PRIORITY_C';
};

const resolveApproach = (priority: CategoryPriority): CategoryManagementApproach => {
  if (priority === 'PRIORITY_A') return 'DEDICATED_CATEGORY_MANAGER';
  if (priority === 'PRIORITY_B') return 'SHARED_CATEGORY_MANAGER';
  return 'STANDARD_AUTOMATED';
};

const buildCategory = (
  profile: ScopedCategoryProfile,
  transactions: StrategicInputTransaction[],
  totalSpendInr: number
): CategorySpecialisationProfile => {
  const categorySpendInr = finitePositive(profile.totalSpendInr);
  const spendSharePct = totalSpendInr > 0 ? Number((categorySpendInr / totalSpendInr * 100).toFixed(2)) : 0;
  const priority = resolvePriority(spendSharePct);
  const approach = resolveApproach(priority);
  const priorityRationale = priority === 'PRIORITY_A'
    ? CONFIG.PRIORITY_RATIONALE.A
    : priority === 'PRIORITY_B' ? CONFIG.PRIORITY_RATIONALE.B : CONFIG.PRIORITY_RATIONALE.C;
  const approachRationale = approach === 'DEDICATED_CATEGORY_MANAGER'
    ? CONFIG.APPROACH_RATIONALE.DEDICATED
    : approach === 'SHARED_CATEGORY_MANAGER'
      ? CONFIG.APPROACH_RATIONALE.SHARED
      : CONFIG.APPROACH_RATIONALE.STANDARD;
  const suppliers = uniqueValues(transactions, (row) => clean(row.vendor_code) || row.vendor_name);
  const materials = uniqueValues(transactions, (row) => row.material_code);
  const plants = uniqueValues(transactions, (row) => row.plant);
  const supplier = supplierMetrics(transactions, categorySpendInr);
  const priceVariationCoefficient = profile.priceDispersion
    ? Number((profile.priceDispersion.priceDispersionPct / 100).toFixed(4))
    : 0;

  return {
    categoryName: profile.categoryName,
    priority,
    priorityRationale,
    recommendedApproach: approach,
    approachRationale,
    annualSpendInr: categorySpendInr,
    annualSpendCr: toCrores(categorySpendInr),
    spendSharePct,
    transactionCount: transactions.length,
    distinctSuppliersCount: suppliers.size,
    distinctMaterialsCount: materials.size,
    distinctPlantsCount: plants.size,
    topSupplierConcentrationPct: supplier.topSupplierConcentrationPct,
    herfindahlIndex: supplier.herfindahlIndex,
    priceVariationCoefficient,
    contractCoveragePct: 0,
    dataLimitations: [
      ...CONFIG.CATEGORY_DATA_LIMITATIONS,
      ...(!profile.priceDispersion ? [CONFIG.PRICE_VARIATION_UNAVAILABLE] : []),
      CONFIG.CONTRACT_COVERAGE_UNAVAILABLE
    ].join(' '),
    validationStatus: CONFIG.VALIDATION_STATUS,
    requiresSpecialisedManagement: priority !== 'PRIORITY_C',
    opportunities: []
  };
};

export const buildCategorySpecialisationFromD1 = (
  input: CategorySpecialisationD1BuildInput
): CategorySpecialisationResult => {
  const transactionGroups = Module2StrategicSourcingEngine.groupTransactionsByCategory(
    input.scopedAnalysis.transactions
  );
  const categories = input.scopedAnalysis.analysis.profiles.map((profile) => buildCategory(
    profile as ScopedCategoryProfile,
    transactionGroups.get((profile as ScopedCategoryProfile).sourceCategoryKey) || [],
    finitePositive(input.scopedAnalysis.analysis.summary.totalSpendAnalyzedInr)
  ));
  const totalSpendInr = finitePositive(input.scopedAnalysis.analysis.summary.totalSpendAnalyzedInr);
  const count = (priority: CategoryPriority): number =>
    categories.filter((category) => category.priority === priority).length;
  const approachCount = (approach: CategoryManagementApproach): number =>
    categories.filter((category) => category.recommendedApproach === approach).length;

  return {
    assessmentId: input.assessmentId,
    customerName: clean(input.customerName) || CONFIG.UNKNOWN_CUSTOMER,
    calculatedAt: input.calculatedAt || new Date().toISOString(),
    summary: {
      tenantId: input.tenantId,
      totalProcurementSpendInr: totalSpendInr,
      totalProcurementSpendCr: toCrores(totalSpendInr),
      categoriesAssessedCount: categories.length,
      priorityACount: count('PRIORITY_A'),
      priorityBCount: count('PRIORITY_B'),
      priorityCCount: count('PRIORITY_C'),
      grossTentativeOpportunityLowInr: 0,
      grossTentativeOpportunityLowCr: 0,
      grossTentativeOpportunityBaseInr: 0,
      grossTentativeOpportunityBaseCr: 0,
      grossTentativeOpportunityHighInr: 0,
      grossTentativeOpportunityHighCr: 0,
      netIndicativeOpportunityLowInr: 0,
      netIndicativeOpportunityLowCr: 0,
      netIndicativeOpportunityBaseInr: 0,
      netIndicativeOpportunityBaseCr: 0,
      netIndicativeOpportunityHighInr: 0,
      netIndicativeOpportunityHighCr: 0,
      opportunitiesRequiringOverlapReviewCount: 0,
      overlapReviewAmountInr: 0,
      overlapReviewAmountCr: 0,
      unquantifiedOpportunitiesCount: 0,
      categoriesRequiringSpecialisedInterventionCount: categories.filter((category) =>
        category.requiresSpecialisedManagement).length,
      dedicatedManagerCount: approachCount('DEDICATED_CATEGORY_MANAGER'),
      sharedManagerCount: approachCount('SHARED_CATEGORY_MANAGER'),
      centralisedManagementCount: approachCount('CENTRALISED_CATEGORY_MGMT'),
      automatedProcurementCount: approachCount('STANDARD_AUTOMATED')
    },
    categories,
    overlapItems: [],
    opportunityHeadAssumptions: [],
    methodologyDisclosures: [...CONFIG.CATEGORY_DATA_LIMITATIONS],
    generalDisclaimer: CONFIG.DISCLAIMER
  };
};
