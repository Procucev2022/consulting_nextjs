import type { FrontendLogEntry } from '../../src/types';
import type { ClassificationCoverageSummary, MaterialMappingEntry } from '../../src/types/module2MaterialMapping';
import type {
  CategoryConsolidationProfile,
  ComparableMaterialOpportunity,
  CrossPlantOpportunity,
  SameMaterialOpportunity,
  VendorConsolidationResult
} from '../../src/types/module2VendorConsolidation';

export const buildLogEntry = (): FrontendLogEntry => ({
  timestamp: '2026-10-18T12:00:00.000Z',
  level: 'error',
  service: 'consulting-frontend',
  message: 'mocked log entry'
});

export const buildCoverageSummary = (): ClassificationCoverageSummary => ({
  totalMaterialsCount: 200,
  totalSpendInr: 168000000,
  totalSpendCr: 16.8,
  taxonomyVerifiedCount: 150,
  taxonomyVerifiedSpendInr: 125000000,
  taxonomyVerifiedSpendCr: 12.5,
  taxonomyVerifiedMaterialPct: 75,
  taxonomyVerifiedSpendPct: 75,
  clientApprovedCount: 10,
  clientApprovedSpendInr: 10000000,
  clientApprovedSpendCr: 1,
  clientApprovedMaterialPct: 5,
  clientApprovedSpendPct: 5,
  approvedCount: 160,
  approvedSpendInr: 135000000,
  approvedSpendCr: 13.5,
  approvedMaterialPct: 80,
  approvedSpendPct: 80,
  provisionalCount: 30,
  provisionalSpendInr: 35000000,
  provisionalSpendCr: 3.5,
  provisionalMaterialPct: 15,
  provisionalSpendPct: 20,
  awaitingReviewCount: 10,
  awaitingReviewSpendInr: 8000000,
  awaitingReviewSpendCr: 0.8,
  awaitingReviewMaterialPct: 5,
  awaitingReviewSpendPct: 5,
  workflowCoveragePct: 100
});

export const buildCategoryProfile = (
  overrides: Partial<CategoryConsolidationProfile> = {}
): CategoryConsolidationProfile => ({
  spendCategory: 'Packaging',
  unspscCode: '24111507',
  unspscCategory: 'Corrugated Boxes',
  classificationType: 'VERIFIED_UNSPSC',
  classificationLabel: 'Verified UNSPSC (v260801.1)',
  totalSpendInr: 95000,
  totalSpendCr: 0.0095,
  sameMaterialMultiSourcingSpendInr: 70000,
  sameMaterialMultiSourcingSpendCr: 0.007,
  addressableSpendInr: 70000,
  addressableSpendCr: 0.007,
  categoryConsolidationCandidateSpendInr: null,
  categoryConsolidationCandidateSpendCr: null,
  categoryConsolidationCandidateStatus: 'IDENTIFIED',
  categoryConsolidationCandidateReason: 'Multiple suppliers serving distinct items in category.',
  distinctSuppliersCount: 3,
  distinctMaterialsCount: 2,
  distinctPlantsCount: 2,
  plantsServed: ['PLANT-A', 'PLANT-B'],
  suppliers: [
    {
      vendorCode: 'V002',
      vendorName: 'Beta Packaging',
      spendInr: 45000,
      spendCr: 0.0045,
      spendSharePct: 47.4,
      distinctMaterialsCount: 1,
      materialsSupplied: ['MAT-BOX-01'],
      distinctPlantsCount: 1,
      plantsServed: ['PLANT-B'],
      poCount: 1,
      isTailSupplier: false
    },
    {
      vendorCode: 'V003',
      vendorName: 'Gamma Containers',
      spendInr: 25000,
      spendCr: 0.0025,
      spendSharePct: 26.3,
      distinctMaterialsCount: 1,
      materialsSupplied: ['MAT-BOX-02'],
      distinctPlantsCount: 1,
      plantsServed: ['PLANT-A'],
      poCount: 1,
      isTailSupplier: true
    }
  ],
  top1SharePct: 47.4,
  top3SharePct: 100,
  hhiIndex: 3632,
  fragmentationLevel: 'MEDIUM',
  multiSourcedMaterialsCount: 1,
  sameMaterialOpportunitiesCount: 1,
  comparableMaterialOpportunitiesCount: 1,
  crossPlantOpportunitiesCount: 1,
  categoryOpportunityStatus: 'Opportunity Identified',
  categoryOpportunityReason: 'Multi-sourced category with high supplier fragmentation.',
  estimatedSavingsInr: null,
  estimatedSavingsCr: null,
  actualSavingsCr: 0,
  validatedSavingsCr: 0,
  savingsStatus: 'NOT_YET_QUANTIFIABLE',
  dataQualityWarnings: [],
  ...overrides
});

export const buildSameMaterialOpportunity = (
  overrides: Partial<SameMaterialOpportunity> = {}
): SameMaterialOpportunity => ({
  materialCode: 'MAT-BOX-01',
  materialDesc: 'Corrugated Box 10x10',
  spendCategory: 'Packaging',
  unspscCode: '24111507',
  unspscCategory: 'Corrugated Boxes',
  uom: 'EA',
  currency: 'INR',
  totalSpendInr: 70000,
  totalSpendCr: 0.007,
  totalQuantity: 2500,
  supplierCount: 2,
  plantCount: 2,
  suppliers: [],
  lowestUnitPrice: 25,
  highestUnitPrice: 30,
  weightedAvgPrice: 28,
  priceDispersionPct: 17.9,
  isComparableUomAndCurrency: true,
  status: 'Opportunity Identified',
  opportunityReason: 'Multi-sourced material with 17.9% price dispersion across 2 vendors.',
  addressableSpendInr: 70000,
  addressableSpendCr: 0.007,
  transactions: [
    {
      id: 'TX-1',
      po_number: 'PO-001',
      po_line: '1',
      po_date: '2023-05-10',
      vendor_code: 'V001',
      vendor_name: 'Alpha Supplies',
      material_code: 'MAT-BOX-01',
      material_desc: 'Corrugated Box 10x10',
      plant: 'PLANT-A',
      quantity: 1000,
      uom: 'EA',
      unit_price: 25,
      currency: 'INR',
      total_spend_inr: 25000
    },
    {
      id: 'TX-2',
      po_number: 'PO-002',
      po_line: '1',
      po_date: '2023-06-15',
      vendor_code: 'V002',
      vendor_name: 'Beta Packaging',
      material_code: 'MAT-BOX-01',
      material_desc: 'Corrugated Box 10x10',
      plant: 'PLANT-B',
      quantity: 1500,
      uom: 'EA',
      unit_price: 30,
      currency: 'INR',
      total_spend_inr: 45000
    }
  ],
  ...overrides
});

export const buildComparableOpportunity = (
  overrides: Partial<ComparableMaterialOpportunity> = {}
): ComparableMaterialOpportunity => ({
  groupId: 'GRP-Packaging-BOX',
  categoryCode: 'Packaging',
  categoryName: 'Packaging',
  materials: [],
  relationshipLabel: 'Potential Comparable — Validation Required',
  similarityBasis: "Shared keyword 'BOX' within procurement category 'Packaging'",
  status: 'Potential Opportunity — Further Validation Required',
  opportunityReason: 'Potential specification review across 2 items. Validation required.',
  addressableSpendInr: 95000,
  addressableSpendCr: 0.0095,
  ...overrides
});

export const buildCrossPlantOpportunity = (
  overrides: Partial<CrossPlantOpportunity> = {}
): CrossPlantOpportunity => ({
  code: 'MAT-BOX-01',
  description: 'Corrugated Box 10x10',
  level: 'MATERIAL',
  spendCategory: 'Packaging',
  distinctPlantsCount: 2,
  plants: ['PLANT-A', 'PLANT-B'],
  distinctSuppliersCount: 2,
  suppliers: ['Alpha Supplies', 'Beta Packaging'],
  totalSpendInr: 70000,
  totalSpendCr: 0.007,
  status: 'Potential Opportunity — Further Validation Required',
  coordinationPotential: 'Procured across 2 plants from 2 vendors.',
  governanceDisclosure: 'Do not assume plant requirements are identical.',
  ...overrides
});

export const buildVendorConsolidationResult = (
  overrides: Partial<VendorConsolidationResult> = {}
): VendorConsolidationResult => ({
  assessmentId: 'TEST-ASSESSMENT-001',
  customerName: 'Test Corp',
  reportDate: '2026-10-18T12:00:00Z',
  leverId: 3,
  leverCode: 'LEV-03',
  leverName: 'Vendor Base Consolidation',
  totalAssessmentSpendInr: 95000,
  totalAssessmentSpendCr: 0.0095,
  sameMaterialMultiSourcingSpendInr: 70000,
  sameMaterialMultiSourcingSpendCr: 0.007,
  addressableSpendInr: 70000,
  addressableSpendCr: 0.007,
  categoryConsolidationOpportunitiesCount: 1,
  categoryConsolidationCandidateSpendCr: null,
  categoryConsolidationCandidateSpendStatus: 'NOT_YET_QUANTIFIABLE',
  categoryConsolidationDisclosure: 'Category candidate spend requires further qualification.',
  estimatedSavingsInr: null,
  estimatedSavingsCr: null,
  actualSavingsCr: 0,
  validatedSavingsCr: 0,
  savingsStatus: 'NOT_YET_QUANTIFIABLE',
  savingsDisclosure: 'Estimated Savings: Not Yet Quantifiable.',
  transactionAuditTrailNotice: 'Forensic Audit Sample Notice: Displaying sample.',
  categoriesAnalysedCount: 1,
  distinctSuppliersCount: 3,
  distinctMaterialsCount: 2,
  distinctPlantsCount: 2,
  multiSourcedMaterialsCount: 1,
  categories: [buildCategoryProfile()],
  sameMaterialOpportunities: [buildSameMaterialOpportunity()],
  comparableMaterialOpportunities: [buildComparableOpportunity()],
  crossPlantOpportunities: [buildCrossPlantOpportunity()],
  methodologyDisclosures: ['Zero Arbitrary Savings applied.'],
  ...overrides
});

export const buildMappingEntry = (overrides: Partial<MaterialMappingEntry> = {}): MaterialMappingEntry => ({
  sourceMaterialId: 'MAT-001',
  sourceDescription: 'Hydraulic Valve A1',
  sourceCategory: 'Fluid Power',
  assignedUnspscCode: '40141600',
  assignedUnspscTitle: 'Valves',
  unspscSegment: 'Industrial Manufacturing',
  unspscFamily: 'Fluid & Gas Flow',
  unspscClass: 'Valves',
  unspscCommodity: 'Hydraulic Valves',
  taxonomyVersion: 'UNv260801',
  mappingMethod: 'MANUAL_REVIEW_REQUIRED',
  confidenceScore: 65,
  evidence: 'Description ambiguous',
  reviewStatus: 'AWAITING_REVIEW',
  mappingDate: '2026-03-01',
  totalSpendInr: 500000,
  totalSpendCr: 0.05,
  transactionCount: 12,
  qualifyingSuppliersCount: 2,
  reviewReason: 'Ambiguous manufacturer specs',
  ...overrides
});
