import { MODULE2_D1_SPECIFICATION_RATIONALISATION as CONFIG } from '../constants/module2SpecificationRationalisationD1';
import type {
  SpecificationCandidateItem, SpecificationMaterialItem, SpecificationRationalisationResult
} from '../types/module2SpecificationRationalisation';
import type {
  SpecificationRationalisationD1BuildInput, SpecificationRationalisationMaterialAggregate
} from '../types/module2SpecificationRationalisationD1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

const clean = (value: unknown): string => String(value ?? '').trim();
const normalize = (value: unknown): string => clean(value).normalize('NFKC').replace(/\s+/g, ' ').toLowerCase();
const finiteNonNegative = (value: number): number => Number.isFinite(value) && value > 0 ? value : 0;
const toCrores = (value: number): number => Number((value / CONFIG.INR_PER_CRORE).toFixed(4));

const createAggregate = (
  row: StrategicInputTransaction,
  code: string,
  normalizedDescription: string,
  spendCategory: string,
  normalizedUnit: string,
  groupKey: string
): SpecificationRationalisationMaterialAggregate => ({
  code,
  description: clean(row.material_desc),
  normalizedDescription,
  spendCategory,
  uom: clean(row.uom),
  totalSpendInr: 0,
  totalQuantity: 0,
  transactionCount: 0,
  suppliersCount: 0,
  supplierKeys: new Set<string>(),
  plantKeys: new Set<string>(),
  groupKey
});

const aggregateTransactions = (
  transactions: StrategicInputTransaction[]
): Map<string, SpecificationRationalisationMaterialAggregate[]> => {
  const groups = new Map<string, Map<string, SpecificationRationalisationMaterialAggregate>>();
  for (const row of transactions) {
    const code = clean(row.material_code);
    const description = normalize(row.material_desc);
    const category = normalize(row.spend_category);
    const unit = normalize(row.uom);
    if (!code || !description || !category || !unit) continue;
    const signature = JSON.stringify([category, unit, description]);
    const groupKey = JSON.stringify([signature, code]);
    const materialGroups = groups.get(signature) || new Map<string, SpecificationRationalisationMaterialAggregate>();
    const aggregate = materialGroups.get(code) || createAggregate(
      row, code, description, clean(row.spend_category), unit, groupKey
    );
    aggregate.totalSpendInr += finiteNonNegative(row.total_spend_inr);
    aggregate.totalQuantity += finiteNonNegative(row.quantity);
    aggregate.transactionCount += 1;
    const supplier = clean(row.vendor_code) || clean(row.vendor_name);
    if (supplier) aggregate.supplierKeys.add(supplier);
    const plant = clean(row.plant);
    if (plant) aggregate.plantKeys.add(plant);
    materialGroups.set(code, aggregate);
    groups.set(signature, materialGroups);
  }
  return new Map([...groups].map(([signature, materials]) => [signature, [...materials.values()]]));
};

const asMaterialItem = (aggregate: SpecificationRationalisationMaterialAggregate): SpecificationMaterialItem => ({
  code: aggregate.code,
  description: aggregate.description,
  normalizedDescription: aggregate.normalizedDescription,
  plant: aggregate.plantKeys.size === 1 ? [...aggregate.plantKeys][0] : undefined,
  totalSpendInr: aggregate.totalSpendInr,
  totalQuantity: aggregate.totalQuantity,
  uom: aggregate.uom,
  transactionCount: aggregate.transactionCount,
  suppliersCount: aggregate.supplierKeys.size
});

const createCandidate = (
  primary: SpecificationRationalisationMaterialAggregate,
  comparison: SpecificationRationalisationMaterialAggregate,
  index: number
): SpecificationCandidateItem => {
  const expenditure = primary.totalSpendInr + comparison.totalSpendInr;
  return {
    candidateId: `${CONFIG.CANDIDATE_ID_PREFIX}-${index}`,
    identificationType: 'STANDARDIZATION_CANDIDATE',
    identificationRationale: CONFIG.IDENTIFICATION_RATIONALE,
    spendCategory: primary.spendCategory,
    primaryItem: asMaterialItem(primary),
    comparisonItem: asMaterialItem(comparison),
    similarityScore: 100,
    technicalAttributes: [],
    differencesIdentified: [],
    missingAttributesDisclosed: [CONFIG.MISSING_TECHNICAL_DATA],
    hasMissingTechnicalData: true,
    expenditureUnderReviewInr: expenditure,
    expenditureUnderReviewCr: toCrores(expenditure),
    quantityUnderReview: primary.totalQuantity + comparison.totalQuantity,
    reviewStatus: 'POTENTIAL_MATCH',
    reviewHistory: [],
    financialBenefitStatus: CONFIG.FINANCIAL_BENEFIT_STATUS,
    potentialRelatedLevers: [],
    nextRequiredAction: CONFIG.NEXT_ACTION
  };
};

export const buildSpecificationRationalisationFromD1 = (
  input: SpecificationRationalisationD1BuildInput
): SpecificationRationalisationResult => {
  const groupedMaterials = aggregateTransactions(input.transactions);
  const candidates: SpecificationCandidateItem[] = [];
  const matchedGroups = new Map<string, SpecificationRationalisationMaterialAggregate>();
  let sequence = 0;

  for (const materials of groupedMaterials.values()) {
    const orderedMaterials = materials.sort((left, right) => left.code.localeCompare(right.code));
    if (orderedMaterials.length < 2) continue;
    const primary = orderedMaterials[0];
    matchedGroups.set(primary.groupKey, primary);
    for (const comparison of orderedMaterials.slice(1)) {
      matchedGroups.set(comparison.groupKey, comparison);
      sequence += 1;
      candidates.push(createCandidate(primary, comparison, sequence));
    }
  }

  const expenditureUnderReview = [...matchedGroups.values()].reduce((total, group) =>
    total + group.totalSpendInr, 0);
  const totalMaterialsAssessedCount = new Set(input.transactions
    .map((row) => clean(row.material_code)).filter(Boolean)).size;

  return {
    assessmentId: input.assessmentId,
    customerName: clean(input.customerName) || CONFIG.CUSTOMER_UNAVAILABLE,
    calculatedAt: input.calculatedAt || new Date().toISOString(),
    reviewWorkflowAvailable: false,
    summary: {
      tenantId: input.tenantId,
      customerName: clean(input.customerName) || CONFIG.CUSTOMER_UNAVAILABLE,
      totalMaterialsAssessedCount,
      totalCandidatesIdentifiedCount: candidates.length,
      awaitingTechnicalReviewCount: 0,
      technicallyVerifiedCount: 0,
      rejectedCount: 0,
      potentialMatchCount: candidates.length,
      candidatesWithMissingTechnicalDataCount: candidates.length,
      totalExpenditureUnderReviewInr: expenditureUnderReview,
      totalExpenditureUnderReviewCr: toCrores(expenditureUnderReview),
      financialBenefitStatus: CONFIG.FINANCIAL_BENEFIT_STATUS,
      commercialSavingsQuantifiedInr: 0,
      commercialSavingsQuantifiedCr: 0
    },
    candidates,
    methodologyDisclosures: [...CONFIG.METHODOLOGY_DISCLOSURES],
    financialDisclaimer: CONFIG.FINANCIAL_DISCLAIMER
  };
};
