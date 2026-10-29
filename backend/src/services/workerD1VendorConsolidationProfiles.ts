import { MODULE2_D1_VENDOR_CONSOLIDATION, MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES } from '../constants/module2VendorConsolidationD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  CategoryConsolidationProfile
} from '../types/module2VendorConsolidation';
import type { MaterialMappingEntry } from '../types/module2MaterialMapping';
import type { VendorConsolidationMaterialGroup } from '../types/module2VendorConsolidationD1';
import {
  categoryKeyFor, classificationLabel, distinct, materialIdentity, mappingStatus,
  materialSpend, normalized, sourceCategory, spendOf, suppliersIn, supplierProfiles, crores
} from './workerD1VendorConsolidationShared';

const classificationFor = (
  entries: MaterialMappingEntry[]
): Pick<CategoryConsolidationProfile, 'classificationType' | 'unspscCode' | 'unspscCategory'> => {
  const entry = entries.find((item) => item.assignedUnspscCode !==
    MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE) || entries[0];
  const classificationType = entry ? mappingStatus(entry) : 'UNMAPPED';
  return {
    classificationType,
    unspscCode: entry?.assignedUnspscCode || MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE,
    unspscCategory: entry?.assignedUnspscTitle || MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_TITLE
  };
};

const categoryOpportunity = (
  multiSourceSpend: number, multiSupplier: boolean
): Pick<CategoryConsolidationProfile, 'categoryOpportunityStatus' | 'categoryOpportunityReason' |
  'categoryConsolidationCandidateStatus' | 'categoryConsolidationCandidateReason'> => {
  if (multiSourceSpend > 0) return {
    categoryOpportunityStatus: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.IDENTIFIED,
    categoryOpportunityReason: MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.IDENTIFIED_REASON,
    categoryConsolidationCandidateStatus: 'IDENTIFIED',
    categoryConsolidationCandidateReason: MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.IDENTIFIED_REASON
  };
  if (multiSupplier) return {
    categoryOpportunityStatus: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.POTENTIAL,
    categoryOpportunityReason: MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.CATEGORY_REASON,
    categoryConsolidationCandidateStatus: 'IDENTIFIED',
    categoryConsolidationCandidateReason: MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.CATEGORY_REASON
  };
  return {
    categoryOpportunityStatus: MODULE2_D1_VENDOR_CONSOLIDATION.STATUS.NO_OPPORTUNITY,
    categoryOpportunityReason: MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.NO_CANDIDATE_REASON,
    categoryConsolidationCandidateStatus: 'NOT_APPLICABLE',
    categoryConsolidationCandidateReason: MODULE2_D1_VENDOR_CONSOLIDATION_MESSAGES.NO_CANDIDATE_REASON
  };
};

const fragmentationLevel = (
  supplierCount: number
): CategoryConsolidationProfile['fragmentationLevel'] => {
  if (supplierCount >= MODULE2_D1_VENDOR_CONSOLIDATION.HIGH_FRAGMENTATION_SUPPLIER_COUNT) return 'HIGH';
  if (supplierCount >= MODULE2_D1_VENDOR_CONSOLIDATION.MEDIUM_FRAGMENTATION_SUPPLIER_COUNT) return 'MEDIUM';
  return 'LOW';
};

const categoryProfile = (
  key: string, rows: StrategicInputTransaction[], groups: VendorConsolidationMaterialGroup[],
  materialEntries: MaterialMappingEntry[]
): CategoryConsolidationProfile => {
  const totalSpendInr = rows.reduce((total, row) => total + spendOf(row), 0);
  const suppliers = supplierProfiles(rows, totalSpendInr);
  const materials = distinct(rows.map((row) => materialIdentity(row)));
  const plantsServed = distinct(rows.map((row) => row.plant || ''));
  const multiSourcedGroups = groups.filter((group) =>
    group.categoryKey === key && suppliersIn(group.transactions).length >= 2
  );
  const multiSourceSpend = multiSourcedGroups.reduce((total, group) => total + materialSpend(group), 0);
  const topShares = suppliers.map((supplier) => supplier.spendSharePct);
  const top1SharePct = topShares[0] || 0;
  const top3SharePct = topShares.slice(0, 3).reduce((total, share) => total + share, 0);
  const hhiIndex = topShares.reduce((total, share) => total + share * share, 0);
  const multiSupplier = suppliers.length > 1;
  const classification = classificationFor(materialEntries);
  const opportunity = categoryOpportunity(multiSourceSpend, multiSupplier);
  return {
    unspscCode: classification.unspscCode,
    unspscCategory: classification.unspscCategory,
    spendCategory: rows[0]?.spend_category || classification.unspscCategory,
    sourceCategories: distinct(rows.map((row) => sourceCategory(row))),
    classificationType: classification.classificationType,
    classificationLabel: classificationLabel(classification.classificationType),
    totalSpendInr,
    totalSpendCr: crores(totalSpendInr),
    sameMaterialMultiSourcingSpendInr: multiSourceSpend,
    sameMaterialMultiSourcingSpendCr: crores(multiSourceSpend),
    addressableSpendInr: multiSourceSpend,
    addressableSpendCr: crores(multiSourceSpend),
    categoryConsolidationCandidateSpendInr: null,
    categoryConsolidationCandidateSpendCr: null,
    ...opportunity,
    distinctSuppliersCount: suppliers.length,
    distinctMaterialsCount: materials.length,
    distinctPlantsCount: plantsServed.length,
    plantsServed,
    suppliers,
    top1SharePct,
    top3SharePct,
    hhiIndex,
    fragmentationLevel: fragmentationLevel(suppliers.length),
    multiSourcedMaterialsCount: multiSourcedGroups.length,
    sameMaterialOpportunitiesCount: multiSourcedGroups.length,
    comparableMaterialOpportunitiesCount: 0,
    crossPlantOpportunitiesCount: groups.filter((group) => group.categoryKey === key &&
      distinct(group.transactions.map((row) => row.plant || '')).length >= 2).length,
    estimatedSavingsInr: null,
    estimatedSavingsCr: null,
    actualSavingsCr: 0,
    validatedSavingsCr: 0,
    savingsStatus: 'NOT_YET_QUANTIFIABLE',
    dataQualityWarnings: [MODULE2_D1_VENDOR_CONSOLIDATION.SAVINGS_DISCLOSURE]
  };
};

export const buildCategoryProfiles = (
  transactions: StrategicInputTransaction[], groups: VendorConsolidationMaterialGroup[],
  mappings: MaterialMappingEntry[], useUnspsc: boolean
): CategoryConsolidationProfile[] => {
  const rowsByKey = new Map<string, StrategicInputTransaction[]>();
  transactions.forEach((row) => {
    const key = categoryKeyFor(row, useUnspsc);
    rowsByKey.set(key, [...(rowsByKey.get(key) || []), row]);
  });
  return [...rowsByKey.entries()].map(([key, rows]) => {
    const categoryGroups = groups.filter((group) => group.categoryKey === key);
    const materialEntries = mappings.filter((entry) => categoryGroups.some((group) =>
      group.materialCode === normalized(entry.sourceMaterialId) ||
      (!group.materialCode && entry.sourceMaterialId.startsWith('UNMAPPED-'))
    ));
    const profile = categoryProfile(key, rows, groups, materialEntries);
    const comparableCount = distinct(categoryGroups.filter((group) => group.unspscCode !==
      MODULE2_D1_VENDOR_CONSOLIDATION.UNMAPPED_UNSPSC_CODE).map((group) => group.materialCode)).length;
    return { ...profile, comparableMaterialOpportunitiesCount: comparableCount > 1 ? 1 : 0 };
  }).sort((left, right) => right.totalSpendInr - left.totalSpendInr);
};

