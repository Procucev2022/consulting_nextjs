import { MODULE2_D1_ALTERNATE_SOURCING, MODULE2_D1_ALTERNATE_SENTINELS } from '../constants/module2AlternateSourcingD1';
import type { AlternateSourcingQueryInput } from '../types/validation';
import type {
  AlternateSourcingResult, AlternateVendorDiscoveryOpportunity,
  ContactCompletenessMetrics, GeographicVendorBreakdown, GeographicPreference
} from '../types/module2AlternateSourcing';
import type { ParsedAlternateVendorCategory } from '../types/module2AlternateSourcingD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import { resolveHumanReadableCategory, UNMAPPED_CATEGORY_LABEL } from '../utils/procurementCategoryResolver';

const normalize = (value: string | null | undefined): string =>
  (value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');

const valueOr = (value: string | null | undefined, fallback: string): string => value?.trim() || fallback;

const categoryOf = (row: StrategicInputTransaction): string => {
  const resolved = resolveHumanReadableCategory(row.unspsc_category, row.spend_category);
  if (resolved !== UNMAPPED_CATEGORY_LABEL) return resolved;
  return valueOr(row.unspsc_category, valueOr(row.spend_category, MODULE2_D1_ALTERNATE_SOURCING.UNKNOWN_CATEGORY));
};

const materialOf = (row: StrategicInputTransaction): string =>
  row.material_code?.trim() || row.material_desc.trim();

const isValidSpend = (row: StrategicInputTransaction): boolean =>
  Number.isFinite(row.total_spend_inr) && row.total_spend_inr >= 0;

export const selectAlternateVendorCategoryKeys = (
  transactions: StrategicInputTransaction[], categories: ParsedAlternateVendorCategory[]
): string[] => {
  const requested = new Set(transactions.filter(isValidSpend).map((row) => normalize(categoryOf(row))));
  const candidates = categories.filter((category) => requested.has(normalize(category.categoryName)));
  const nameCounts = candidates.reduce((counts, category) => {
    const key = normalize(category.categoryName);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map<string, number>());
  return [...new Set(candidates.filter((category) => nameCounts.get(normalize(category.categoryName)) === 1)
    .map((category) => category.categoryKey))];
};

const groupTransactions = (transactions: StrategicInputTransaction[]): Map<string, StrategicInputTransaction[]> => {
  const groups = new Map<string, StrategicInputTransaction[]>();
  transactions.filter(isValidSpend).forEach((row) => {
    const material = materialOf(row);
    if (!material) return;
    const category = categoryOf(row);
    const plant = row.plant?.trim() || MODULE2_D1_ALTERNATE_SOURCING.UNKNOWN_PLANT;
    const unit = row.uom?.trim() || MODULE2_D1_ALTERNATE_SOURCING.UNKNOWN_UNIT;
    const key = [normalize(category), normalize(material), normalize(unit), normalize(plant)].join('|');
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  return groups;
};

const categoryIndex = (
  categories: ParsedAlternateVendorCategory[]
): Map<string, ParsedAlternateVendorCategory | null> => {
  const result = new Map<string, ParsedAlternateVendorCategory | null>();
  categories.forEach((category) => {
    const key = normalize(category.categoryName);
    result.set(key, result.has(key) ? null : category);
  });
  return result;
};

const distinctSuppliers = (rows: StrategicInputTransaction[]): string[] => {
  const suppliers = new Map<string, string>();
  rows.forEach((row) => {
    const name = row.vendor_name.trim();
    const identity = normalize(row.vendor_code || name);
    if (identity && name && !suppliers.has(identity)) suppliers.set(identity, name);
  });
  return [...suppliers.values()].sort((left, right) => left.localeCompare(right, 'en'));
};

const countFor = (record: Record<string, number>, key: string): number => {
  const matched = Object.entries(record).find(([candidate]) => normalize(candidate) === normalize(key));
  return matched?.[1] || 0;
};

const preferredCount = (
  category: ParsedAlternateVendorCategory | null, preference: GeographicPreference,
  state: string, city: string
): number => {
  if (!category) return 0;
  if (preference === 'SAME_STATE') return countFor(category.stateCounts, state);
  if (preference === 'OTHER_STATES') {
    const allStatesCount = Object.values(category.stateCounts).reduce((total, count) => total + count, 0);
    return Math.max(0, allStatesCount - countFor(category.stateCounts, state));
  }
  if (preference === 'SAME_CITY') {
    return category.topCities.find((entry) => normalize(entry.city) === normalize(city))?.count || 0;
  }
  return category.distinctVendorCount;
};

const geographicBreakdown = (
  category: ParsedAlternateVendorCategory | null, preference: GeographicPreference, state: string, city: string
): GeographicVendorBreakdown => {
  const stateCounts = category?.stateCounts || {};
  const sameStateCount = state ? countFor(stateCounts, state) : 0;
  const otherStatesCount = Math.max(0,
    Object.values(stateCounts).reduce((total, count) => total + count, 0) - sameStateCount);
  const allLocationsCount = category?.distinctVendorCount || 0;
  return {
    preferredCity: city || undefined,
    sameCityCount: city
      ? category?.topCities.find((entry) => normalize(entry.city) === normalize(city))?.count || 0 : 0,
    sameStateCount,
    otherStatesCount,
    allLocationsCount,
    preferredRegionCount: preferredCount(category, preference, state, city),
    topStates: Object.entries(stateCounts).map(([name, count]) => ({ state: name, count }))
      .sort((left, right) => right.count - left.count),
    topCities: category?.topCities || []
  };
};

const contactMetrics = (category: ParsedAlternateVendorCategory | null): ContactCompletenessMetrics => {
  const counts = category?.contactMetrics || {
    hasWebsiteCount: 0, hasEmailCount: 0, hasPhoneCount: 0, missingContactCount: 0
  };
  const total = category?.distinctVendorCount || 0;
  const percentage = (count: number): number => total ? Number((count / total * 100).toFixed(1)) : 0;
  return {
    ...counts,
    hasWebsiteRatioPct: percentage(counts.hasWebsiteCount),
    hasEmailRatioPct: percentage(counts.hasEmailCount)
  };
};

const categoryVendorCount = (category: ParsedAlternateVendorCategory | null): number =>
  category?.distinctVendorCount ?? 0;

const opportunityCity = (options: AlternateSourcingQueryInput): string => {
  if (options.preferredCity === MODULE2_D1_ALTERNATE_SENTINELS.ALL_CITIES) return '';
  return valueOr(options.preferredCity, '');
};

const opportunityRationale = (category: ParsedAlternateVendorCategory | null): string =>
  category ? MODULE2_D1_ALTERNATE_SOURCING.DIRECTORY_MATCH_NOTICE : MODULE2_D1_ALTERNATE_SOURCING.UNKNOWN_CATEGORY;

const buildOpportunity = (
  assessmentId: string, index: number, rows: StrategicInputTransaction[],
  category: ParsedAlternateVendorCategory | null,
  options: AlternateSourcingQueryInput, disclosures: string[]
): AlternateVendorDiscoveryOpportunity => {
  const first = rows[0];
  const suppliers = distinctSuppliers(rows);
  const categoryName = valueOr(category?.categoryName, categoryOf(first));
  const materialCode = valueOr(first.material_code,
    valueOr(materialOf(first), MODULE2_D1_ALTERNATE_SOURCING.UNKNOWN_MATERIAL));
  const spend = rows.reduce((total, row) => total + row.total_spend_inr, 0);
  const state = valueOr(options.preferredState, '');
  const city = opportunityCity(options);
  const geographic = geographicBreakdown(category, options.geographicPreference, state, city);
  const matchType = category ? 'EXACT' : 'UNMATCHED';
  const vendorCount = categoryVendorCount(category);
  return {
    opportunityId: `${MODULE2_D1_ALTERNATE_SOURCING.OPPORTUNITY_ID_PREFIX}-${assessmentId}-${String(index + 1).padStart(4, '0')}`,
    materialCode,
    materialDescription: valueOr(first.material_desc, MODULE2_D1_ALTERNATE_SOURCING.UNKNOWN_MATERIAL),
    spendCategory: valueOr(first.spend_category, categoryOf(first)),
    subCategory: categoryName,
    specification: null,
    customerPlant: valueOr(first.plant, MODULE2_D1_ALTERNATE_SOURCING.UNKNOWN_PLANT),
    customerPreferredState: state,
    customerPreferredCity: city,
    relevantSpendInr: spend,
    relevantSpendCr: Number((spend / MODULE2_D1_ALTERNATE_SOURCING.INR_PER_CRORE)
      .toFixed(MODULE2_D1_ALTERNATE_SOURCING.AMOUNT_DECIMAL_PLACES)),
    currentSupplierCount: suppliers.length,
    currentSuppliers: suppliers,
    exclusionLimitationNotice: MODULE2_D1_ALTERNATE_SOURCING.IDENTITY_NOTICE,
    matchedVendorCategory: categoryName,
    matchType,
    matchTypeRationale: opportunityRationale(category),
    potentialVendorsAllLocations: vendorCount,
    potentialVendorsPreferredRegion: geographic.preferredRegionCount,
    exactMatchesCount: vendorCount,
    hierarchyMatchesCount: 0,
    synonymMatchesCount: 0,
    relatedMatchesCount: 0,
    qualifiedAlternativesCount: 'DATA_UNAVAILABLE',
    qualificationStatus: 'DATA_UNAVAILABLE',
    excludedCurrentSuppliersCount: null,
    excludedSupplierNames: [],
    geographicBreakdown: geographic,
    contactCompleteness: contactMetrics(category),
    disclosures
  };
};

const availableLocations = (
  categories: ParsedAlternateVendorCategory[]
): Pick<AlternateSourcingResult, 'availableStates' | 'availableCities'> => {
  const states = new Set<string>();
  const cities = new Set<string>();
  categories.forEach((category) => {
    Object.entries(category.stateCounts).forEach(([state, count]) => { if (count > 0) states.add(state); });
    category.topCities.forEach(({ city, count }) => { if (count > 0) cities.add(city); });
  });
  return { availableStates: [...states].sort(), availableCities: [...cities].sort() };
};

const matchesOpportunityFilters = (
  opportunity: AlternateVendorDiscoveryOpportunity, options: AlternateSourcingQueryInput
): boolean => {
  const materialMatches = !options.materialCode ||
    normalize(opportunity.materialCode) === normalize(options.materialCode);
  const categoryMatches = !options.spendCategory ||
    normalize(opportunity.spendCategory) === normalize(options.spendCategory) ||
    normalize(opportunity.subCategory) === normalize(options.spendCategory);
  const matchMatches = !options.matchType || opportunity.matchType === options.matchType;
  return materialMatches && categoryMatches && matchMatches;
};

export const buildAlternateSourcingResult = (
  assessmentId: string, transactions: StrategicInputTransaction[], categories: ParsedAlternateVendorCategory[],
  distinctVendorPoolCount: number | null, options: AlternateSourcingQueryInput
): AlternateSourcingResult => {
  const categoryMap = categoryIndex(categories);
  const groups = [...groupTransactions(transactions).values()].sort((left, right) => {
    const a = `${categoryOf(left[0])}|${materialOf(left[0])}|${left[0].plant || ''}`;
    const b = `${categoryOf(right[0])}|${materialOf(right[0])}|${right[0].plant || ''}`;
    return a.localeCompare(b, 'en');
  });
  const allOpportunities = groups.map((rows, index) => {
    const category = categoryMap.get(normalize(categoryOf(rows[0]))) || null;
    return buildOpportunity(assessmentId, index, rows, category, options,
      [...MODULE2_D1_ALTERNATE_SOURCING.DISCLOSURES]);
  });
  const opportunities = allOpportunities.filter((opportunity) => matchesOpportunityFilters(opportunity, options));
  const exactOpportunities = opportunities.filter((opportunity) => opportunity.matchType === 'EXACT');
  const matchedCategoryNames = new Set(exactOpportunities.map((opportunity) => normalize(opportunity.subCategory)));
  const locations = availableLocations(categories.filter((category) =>
    matchedCategoryNames.has(normalize(category.categoryName))));
  const cumulativeMatches = opportunities.reduce((total, item) => total + item.potentialVendorsAllLocations, 0);
  const cumulativePreferred = opportunities.reduce((total, item) => total + item.potentialVendorsPreferredRegion, 0);
  const currentSuppliers = opportunities.reduce((total, item) => total + item.currentSupplierCount, 0);
  const invalidSpendRows = transactions.filter((row) => !isValidSpend(row)).length;
  const disclosures: string[] = [...MODULE2_D1_ALTERNATE_SOURCING.DISCLOSURES];
  if (invalidSpendRows) disclosures.push(`Excluded ${invalidSpendRows} transaction rows with invalid or negative spend.`);
  return {
    assessmentId,
    summary: {
      totalEligibleMaterials: exactOpportunities.length,
      singleSourceMaterialsCount: exactOpportunities.filter((item) => item.currentSupplierCount === 1).length,
      totalPotentialVendorsAllLocations: cumulativeMatches,
      totalPotentialVendorsPreferredRegion: cumulativePreferred,
      deduplicatedDistinctVendorsAllLocations: distinctVendorPoolCount,
      deduplicatedDistinctVendorsPreferredRegion: null,
      cumulativeOpportunityVendorMatches: cumulativeMatches,
      totalCurrentSuppliersIdentified: currentSuppliers,
      totalCurrentSuppliersMatchedInMaster: null,
      totalCurrentSuppliersExcluded: null,
      overallDistinctVendorPoolEstimate: distinctVendorPoolCount,
      potentialFinancialSavingsInr: 0,
      potentialFinancialSavingsCr: 0,
      isDiscoveryOnly: true
    },
    opportunities,
    ...locations,
    disclosures
  };
};
