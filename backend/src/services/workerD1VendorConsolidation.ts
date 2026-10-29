import {
  MODULE2_D1_VENDOR_CONSOLIDATION, MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES
} from '../constants/module2VendorConsolidationD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  CrossPlantOpportunity, SameMaterialOpportunity, SupplierMaterialParticipation, VendorConsolidationResult
} from '../types/module2VendorConsolidation';
import type {
  ClassificationCoverageSummary, MaterialMappingEntry
} from '../types/module2MaterialMapping';
import type { VendorConsolidationQueryInput } from '../types/validation';
import type { VendorConsolidationMaterialGroup } from '../types/module2VendorConsolidationD1';
import { buildCategoryProfiles } from './workerD1VendorConsolidationProfiles';
import {
  crores, distinct, groupTransactions, mappingEntry, materialIdentity, materialPrice, materialQuantity, materialSpend,
  poCount, quantityOf, sourceMaterials, spendOf, supplierIdentity, suppliersIn
} from './workerD1VendorConsolidationShared';

const supplierMaterialParticipation = (
  rows: StrategicInputTransaction[]
): SupplierMaterialParticipation[] => suppliersIn(rows).map((supplier) => {
  const quantity = supplier.transactions.reduce((total, row) => total + quantityOf(row), 0);
  const plants = distinct(supplier.transactions.map((row) => row.plant || ''));
  return {
    vendorCode: supplier.vendorCode || supplier.vendorName,
    vendorName: supplier.vendorName,
    quantity,
    spendInr: supplier.spendInr,
    spendCr: crores(supplier.spendInr),
    weightedAvgPrice: quantity > 0 ? supplier.spendInr / quantity : 0,
    poCount: poCount(supplier.transactions),
    plants
  };
});

const sameMaterialOpportunity = (group: VendorConsolidationMaterialGroup): SameMaterialOpportunity => {
  const prices = group.transactions.map(materialPrice).filter((price) => price > 0);
  const suppliers = suppliersIn(group.transactions);
  const totalSpendInr = materialSpend(group);
  const totalQuantity = materialQuantity(group);
  const lowestUnitPrice = prices.length ? Math.min(...prices) : 0;
  const highestUnitPrice = prices.length ? Math.max(...prices) : 0;
  const suppliersWithPrice = distinct(group.transactions.filter((row) => materialPrice(row) > 0)
    .map(supplierIdentity));
  const comparable = Boolean(group.materialCode && group.uom && totalQuantity > 0 && suppliersWithPrice.length >= 2);
  return {
    materialCode: group.materialCode,
    materialDesc: group.materialDesc || MODULE2_D1_VENDOR_CONSOLIDATION.UNKNOWN_VALUE,
    spendCategory: group.spendCategory,
    unspscCode: group.unspscCode,
    unspscCategory: group.unspscCategory,
    uom: group.uom || MODULE2_D1_VENDOR_CONSOLIDATION.UNKNOWN_VALUE,
    currency: 'INR',
    totalSpendInr,
    totalSpendCr: crores(totalSpendInr),
    totalQuantity,
    supplierCount: suppliers.length,
    plantCount: distinct(group.transactions.map((row) => row.plant || '')).length,
    suppliers: supplierMaterialParticipation(group.transactions),
    lowestUnitPrice,
    highestUnitPrice,
    weightedAvgPrice: totalQuantity > 0 ? totalSpendInr / totalQuantity : 0,
    priceDispersionPct: lowestUnitPrice > 0
      ? (highestUnitPrice - lowestUnitPrice) / lowestUnitPrice * 100 : 0,
    isComparableUomAndCurrency: comparable,
    status: comparable ? MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL
      : MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.INSUFFICIENT,
    opportunityReason: MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.IDENTIFIED_REASON,
    actionableStatus: MODULE2_D1_VENDOR_CONSOLIDATION.ACTIONABLE_STATUS,
    qualificationCriteria: 'Exact material code, UOM, normalized INR spend, and multiple observed suppliers.',
    nextRecommendedAction: 'Validate specification, supplier eligibility, capacity, and commercial terms.',
    classificationReviewStatus: 'AWAITING_REVIEW',
    addressableSpendInr: totalSpendInr,
    addressableSpendCr: crores(totalSpendInr),
    transactions: group.transactions
  };
};

const crossPlantOpportunities = (groups: VendorConsolidationMaterialGroup[]): CrossPlantOpportunity[] =>
  groups.flatMap((group) => {
    const plants = distinct(group.transactions.map((row) => row.plant || ''));
    if (plants.length < 2 || !group.materialCode) return [];
    const suppliers = suppliersIn(group.transactions);
    const totalSpendInr = materialSpend(group);
    return [{
      code: group.materialCode,
      description: group.materialDesc,
      level: 'MATERIAL' as const,
      spendCategory: group.spendCategory,
      distinctPlantsCount: plants.length,
      plants,
      distinctSuppliersCount: suppliers.length,
      suppliers: suppliers.map((supplier) => supplier.vendorName),
      totalSpendInr,
      totalSpendCr: crores(totalSpendInr),
      status: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL,
      coordinationPotential: MODULE2_D1_VENDOR_CONSOLIDATION.CROSS_PLANT_SIGNAL,
      governanceDisclosure: MODULE2_D1_VENDOR_CONSOLIDATION.CROSS_PLANT_SIGNAL
    }];
  });

const comparableMaterialOpportunities = (
  groups: VendorConsolidationMaterialGroup[]
): VendorConsolidationResult['comparableMaterialOpportunities'] => {
  const byCategory = new Map<string, VendorConsolidationMaterialGroup[]>();
  groups.filter((group) => group.unspscCode !== MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE)
    .forEach((group) => byCategory.set(group.categoryKey, [
      ...(byCategory.get(group.categoryKey) || []), group
    ]));
  return [...byCategory.entries()].flatMap(([categoryCode, materials]) => {
    if (distinct(materials.map((group) => group.materialCode)).length < 2) return [];
    const totalSpendInr = materials.reduce((total, group) => total + materialSpend(group), 0);
    return [{
      groupId: categoryCode,
      categoryCode,
      categoryName: materials[0]?.unspscCategory || MODULE2_D1_VENDOR_CONSOLIDATION.UNKNOWN_VALUE,
      materials: materials.map((group) => ({
        materialCode: group.materialCode,
        materialDesc: group.materialDesc,
        spendInr: materialSpend(group),
        spendCr: crores(materialSpend(group)),
        vendorCount: suppliersIn(group.transactions).length,
        vendors: suppliersIn(group.transactions).map((supplier) => supplier.vendorName)
      })),
      relationshipLabel: 'Potential Comparable — Validation Required' as const,
      similarityBasis: MODULE2_D1_VENDOR_CONSOLIDATION.COMPARABLE_SIGNAL,
      status: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL,
      opportunityReason: MODULE2_D1_VENDOR_CONSOLIDATION.COMPARABLE_SIGNAL,
      addressableSpendInr: totalSpendInr,
      addressableSpendCr: crores(totalSpendInr)
    }];
  });
};

const coverageSummary = (
  mappings: MaterialMappingEntry[], totalSpendInr: number
): ClassificationCoverageSummary => {
  const provisional = mappings.filter((entry) => entry.reviewStatus === 'PROVISIONAL');
  const awaiting = mappings.filter((entry) => entry.reviewStatus === 'AWAITING_REVIEW');
  const provisionalSpendInr = provisional.reduce((total, entry) => total + entry.totalSpendInr, 0);
  const awaitingSpendInr = awaiting.reduce((total, entry) => total + entry.totalSpendInr, 0);
  const total = mappings.length;
  const percentage = (count: number): number => total ? count / total * 100 : 0;
  const spendPercentage = (spend: number): number => totalSpendInr ? spend / totalSpendInr * 100 : 0;
  return {
    totalMaterialsCount: total,
    totalSpendInr,
    totalSpendCr: crores(totalSpendInr),
    taxonomyVerifiedCount: 0,
    taxonomyVerifiedSpendInr: 0,
    taxonomyVerifiedSpendCr: 0,
    taxonomyVerifiedMaterialPct: 0,
    taxonomyVerifiedSpendPct: 0,
    clientApprovedCount: 0,
    clientApprovedSpendInr: 0,
    clientApprovedSpendCr: 0,
    clientApprovedMaterialPct: 0,
    clientApprovedSpendPct: 0,
    approvedCount: 0,
    approvedSpendInr: 0,
    approvedSpendCr: 0,
    approvedMaterialPct: 0,
    approvedSpendPct: 0,
    provisionalCount: provisional.length,
    provisionalSpendInr,
    provisionalSpendCr: crores(provisionalSpendInr),
    provisionalMaterialPct: percentage(provisional.length),
    provisionalSpendPct: spendPercentage(provisionalSpendInr),
    awaitingReviewCount: awaiting.length,
    awaitingReviewSpendInr: awaitingSpendInr,
    awaitingReviewSpendCr: crores(awaitingSpendInr),
    awaitingReviewMaterialPct: percentage(awaiting.length),
    awaitingReviewSpendPct: spendPercentage(awaitingSpendInr),
    workflowCoveragePct: 0
  };
};

export const buildVendorConsolidationResult = (
  assessmentId: string, customerName: string, transactions: StrategicInputTransaction[],
  options: VendorConsolidationQueryInput = {}
): VendorConsolidationResult => {
  const requestedTransactions = transactions.filter((row) => {
    const category = options.category?.toLocaleLowerCase('en-US');
    const categoryMatch = !category || [row.spend_category, row.unspsc_code, row.unspsc_category]
      .some((value) => value?.trim().toLocaleLowerCase('en-US') === category);
    const materialMatch = !options.materialCode ||
      row.material_code?.trim().toLocaleUpperCase('en-US') === options.materialCode.toLocaleUpperCase('en-US');
    const supplierMatch = !options.supplierCode ||
      row.vendor_code?.trim().toLocaleUpperCase('en-US') === options.supplierCode.toLocaleUpperCase('en-US');
    return categoryMatch && materialMatch && supplierMatch;
  });
  const excludedSpendRows = requestedTransactions.filter((row) =>
    !Number.isFinite(row.total_spend_inr) || row.total_spend_inr < 0);
  const scopedTransactions = requestedTransactions.filter((row) =>
    Number.isFinite(row.total_spend_inr) && row.total_spend_inr >= 0);
  const totalSpendInr = scopedTransactions.reduce((total, row) => total + spendOf(row), 0);
  const groups = groupTransactions(scopedTransactions);
  const sourceGroups = groupTransactions(scopedTransactions, false);
  const mappingRegister = sourceMaterials(scopedTransactions).map(mappingEntry);
  const mappingExceptions = mappingRegister.filter((entry) => entry.reviewStatus === 'AWAITING_REVIEW');
  let categories = buildCategoryProfiles(scopedTransactions, groups, mappingRegister, true);
  let sourceGroupCategories = buildCategoryProfiles(scopedTransactions, sourceGroups, mappingRegister, false);
  const sameMaterialOpportunities = groups.filter((group) =>
    Boolean(group.materialCode) && suppliersIn(group.transactions).length >= 2
  ).map(sameMaterialOpportunity).sort((left, right) => right.totalSpendInr - left.totalSpendInr);
  let filteredSameMaterial = sameMaterialOpportunities;
  let crossPlant = crossPlantOpportunities(groups);
  let comparable = comparableMaterialOpportunities(groups);
  const suppliers = distinct(scopedTransactions.map((row) => supplierIdentity(row)));
  const materials = distinct(scopedTransactions.map((row) => materialIdentity(row)));
  const plants = distinct(scopedTransactions.map((row) => row.plant || ''));
  if (options.status) {
    categories = categories.filter((category) => category.categoryOpportunityStatus === options.status);
    sourceGroupCategories = sourceGroupCategories.filter((category) =>
      category.categoryOpportunityStatus === options.status);
    filteredSameMaterial = filteredSameMaterial.filter((item) => item.status === options.status);
    crossPlant = crossPlant.filter((item) => item.status === options.status);
    comparable = comparable.filter((item) => item.status === options.status);
  }
  const sameMaterialSpendInr = filteredSameMaterial.reduce((total, item) => total + item.totalSpendInr, 0);
  const multiSupplierCategoryCount = categories.filter((category) => category.distinctSuppliersCount > 1).length;
  const summaryCoverage = coverageSummary(mappingRegister, totalSpendInr);
  return {
    assessmentId,
    customerName,
    reportDate: new Date().toISOString(),
    leverId: MODULE2_D1_VENDOR_CONSOLIDATION.LEVER_ID,
    leverCode: MODULE2_D1_VENDOR_CONSOLIDATION.LEVER_CODE,
    leverName: MODULE2_D1_VENDOR_CONSOLIDATION.LEVER_NAME,
    totalAssessmentSpendInr: totalSpendInr,
    totalAssessmentSpendCr: crores(totalSpendInr),
    sameMaterialMultiSourcingSpendInr: sameMaterialSpendInr,
    sameMaterialMultiSourcingSpendCr: crores(sameMaterialSpendInr),
    addressableSpendInr: sameMaterialSpendInr,
    addressableSpendCr: crores(sameMaterialSpendInr),
    categoryConsolidationOpportunitiesCount: multiSupplierCategoryCount,
    categoryConsolidationCandidateSpendCr: null,
    categoryConsolidationCandidateSpendStatus: 'NOT_YET_QUANTIFIABLE',
    categoryConsolidationDisclosure: MODULE2_D1_VENDOR_CONSOLIDATION.CATEGORY_DISCLOSURE,
    estimatedSavingsInr: null,
    estimatedSavingsCr: null,
    actualSavingsCr: 0,
    validatedSavingsCr: 0,
    savingsStatus: 'NOT_YET_QUANTIFIABLE',
    savingsDisclosure: MODULE2_D1_VENDOR_CONSOLIDATION.SAVINGS_DISCLOSURE,
    transactionAuditTrailNotice: MODULE2_D1_VENDOR_CONSOLIDATION.AUDIT_NOTICE,
    categoriesAnalysedCount: categories.length,
    distinctSuppliersCount: suppliers.length,
    distinctMaterialsCount: materials.length,
    distinctPlantsCount: plants.length,
    multiSourcedMaterialsCount: filteredSameMaterial.length,
    categories,
    sourceGroupCategories,
    sameMaterialOpportunities: filteredSameMaterial,
    comparableMaterialOpportunities: comparable,
    crossPlantOpportunities: crossPlant,
    coverageSummary: summaryCoverage,
    mappingRegister,
    mappingExceptions,
    allTransactionsCount: scopedTransactions.length,
    allTransactionsSpendInr: totalSpendInr,
    transactionsSample: scopedTransactions.slice(0, MODULE2_D1_VENDOR_CONSOLIDATION.TRANSACTION_SAMPLE_LIMIT),
    methodologyDisclosures: [
      MODULE2_D1_VENDOR_CONSOLIDATION.CATEGORY_DISCLOSURE,
      MODULE2_D1_VENDOR_CONSOLIDATION.SAVINGS_DISCLOSURE,
      MODULE2_D1_VENDOR_CONSOLIDATION.PRICE_SIGNAL,
      MODULE2_D1_VENDOR_CONSOLIDATION.COMPARABLE_SIGNAL,
      MODULE2_D1_VENDOR_CONSOLIDATION.CROSS_PLANT_SIGNAL
    ],
    dataQualityExclusions: excludedSpendRows.length ? [{
      rule: MODULE2_D1_VENDOR_CONSOLIDATION.DATA_QUALITY_RULE,
      affectedCount: excludedSpendRows.length,
      affectedSpendInr: excludedSpendRows.reduce((total, row) =>
        total + (Number.isFinite(row.total_spend_inr) ? Math.abs(row.total_spend_inr) : 0), 0),
      actionTaken: MODULE2_D1_VENDOR_CONSOLIDATION.DATA_QUALITY_ACTION
    }] : []
  };
};
