import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VendorConsolidationKpiCards } from '../../../src/components/module2/VendorConsolidationKpiCards';
import { VendorConsolidationCategoryTable } from '../../../src/components/module2/VendorConsolidationCategoryTable';
import { VendorConsolidationSupplierTable } from '../../../src/components/module2/VendorConsolidationSupplierTable';
import { VendorConsolidationMaterialTable } from '../../../src/components/module2/VendorConsolidationMaterialTable';
import { VendorConsolidationTransactionTable } from '../../../src/components/module2/VendorConsolidationTransactionTable';
import { VendorConsolidationMappingQueueTable } from '../../../src/components/module2/VendorConsolidationMappingQueueTable';
import { VendorConsolidationView } from '../../../src/components/module2/VendorConsolidationView';
import type {
  VendorConsolidationResult,
  CategoryConsolidationProfile,
  SameMaterialOpportunity,
  ComparableMaterialOpportunity,
  CrossPlantOpportunity
} from '../../../src/types/module2VendorConsolidation';
import type { MaterialMappingEntry } from '../../../src/types/module2MaterialMapping';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { Module2StrategicSourcingApi } from '../../../src/utils/module2StrategicSourcingApi';

const mockCategory: CategoryConsolidationProfile = {
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
      vendorCode: 'V001',
      vendorName: 'Alpha Supplies',
      spendInr: 25000,
      spendCr: 0.0025,
      spendSharePct: 26.3,
      distinctMaterialsCount: 1,
      materialsSupplied: ['MAT-BOX-01'],
      distinctPlantsCount: 1,
      plantsServed: ['PLANT-A'],
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
  actualSavingsCr: 0.0,
  validatedSavingsCr: 0.0,
  savingsStatus: 'NOT_YET_QUANTIFIABLE',
  dataQualityWarnings: []
};

const mockSameMatOpp: SameMaterialOpportunity = {
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
  suppliers: [
    {
      vendorCode: 'V002',
      vendorName: 'Beta Packaging',
      quantity: 1500,
      spendInr: 45000,
      spendCr: 0.0045,
      weightedAvgPrice: 30.0,
      poCount: 1,
      plants: ['PLANT-B']
    },
    {
      vendorCode: 'V001',
      vendorName: 'Alpha Supplies',
      quantity: 1000,
      spendInr: 25000,
      spendCr: 0.0025,
      weightedAvgPrice: 25.0,
      poCount: 1,
      plants: ['PLANT-A']
    }
  ],
  lowestUnitPrice: 25.0,
  highestUnitPrice: 30.0,
  weightedAvgPrice: 28.0,
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
      unit_price: 25.0,
      currency: 'INR',
      total_spend_inr: 25000.0
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
      unit_price: 30.0,
      currency: 'INR',
      total_spend_inr: 45000.0
    },
    {
      id: 'TX-3',
      vendor_name: '',
      material_desc: '',
      quantity: 10,
      unit_price: 10.0,
      total_spend_inr: 100.0
    }
  ]
};


const mockCompMatOpp: ComparableMaterialOpportunity = {
  groupId: 'GRP-Packaging-BOX',
  categoryCode: 'Packaging',
  categoryName: 'Packaging',
  materials: [
    {
      materialCode: 'MAT-BOX-01',
      materialDesc: 'Corrugated Box 10x10',
      spendInr: 70000,
      spendCr: 0.007,
      vendorCount: 2,
      vendors: ['Alpha Supplies', 'Beta Packaging']
    },
    {
      materialCode: 'MAT-BOX-02',
      materialDesc: 'Heavy Box 20x20',
      spendInr: 25000,
      spendCr: 0.0025,
      vendorCount: 1,
      vendors: ['Gamma Containers']
    }
  ],
  relationshipLabel: 'Potential Comparable — Validation Required',
  similarityBasis: "Shared keyword 'BOX' within procurement category 'Packaging'",
  status: 'Potential Opportunity — Further Validation Required',
  opportunityReason: 'Potential specification review across 2 items. Validation required.',
  addressableSpendInr: 95000,
  addressableSpendCr: 0.0095
};

const mockCrossPlantOpp: CrossPlantOpportunity = {
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
  governanceDisclosure: 'Do not assume plant requirements are identical.'
};

const mockResult: VendorConsolidationResult = {
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
  actualSavingsCr: 0.0,
  validatedSavingsCr: 0.0,
  savingsStatus: 'NOT_YET_QUANTIFIABLE',
  savingsDisclosure: 'Estimated Savings: Not Yet Quantifiable.',
  transactionAuditTrailNotice: 'Forensic Audit Sample Notice: Displaying sample.',
  categoriesAnalysedCount: 1,
  distinctSuppliersCount: 3,
  distinctMaterialsCount: 2,
  distinctPlantsCount: 2,
  multiSourcedMaterialsCount: 1,
  categories: [mockCategory],
  sameMaterialOpportunities: [mockSameMatOpp],
  comparableMaterialOpportunities: [mockCompMatOpp],
  crossPlantOpportunities: [mockCrossPlantOpp],
  transactionsSample: mockSameMatOpp.transactions,
  methodologyDisclosures: ['Zero Arbitrary Savings applied.'],
  dataQualityExclusions: [
    {
      rule: 'Supplier Identification Validation',
      affectedCount: 0,
      affectedSpendInr: 0,
      actionTaken: '100% Validated'
    }
  ]
};

describe('VendorConsolidationKpiCards Component', () => {
  it('renders all KPI cards with proper headers and values', () => {
    render(<VendorConsolidationKpiCards result={mockResult} />);
    const strings = UI_STRINGS.module2VendorConsolidation;

    expect(screen.getByText(strings.cardTotalSpend)).toBeDefined();
    expect(screen.getByText(strings.cardAddressableSpend)).toBeDefined();
    expect(screen.getByText(strings.cardCategoryConsolidation)).toBeDefined();
    expect(screen.getByText(strings.cardEstimatedSavings)).toBeDefined();
    expect(screen.getAllByText(strings.statusNotYetQuantifiable).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(strings.cardValidatedSavings)).toBeDefined();

    expect(screen.getByText(strings.cardSuppliersIdentified)).toBeDefined();
    expect(screen.getByText(strings.cardMaterialsAnalysed)).toBeDefined();
    expect(screen.getByText(strings.cardOperatingPlants)).toBeDefined();
  });
});

describe('VendorConsolidationCategoryTable Component', () => {
  it('renders category rows and triggers onSelectCategory when clicked', () => {
    const onSelect = vi.fn();
    render(
      <VendorConsolidationCategoryTable
        categories={[mockCategory]}
        onSelectCategory={onSelect}
      />
    );

    expect(screen.getByText(mockCategory.spendCategory)).toBeDefined();
    expect(screen.getByText(new RegExp(mockCategory.unspscCode))).toBeDefined();

    expect(screen.getByText('Analyse')).toBeDefined();

    fireEvent.click(screen.getByText('Analyse'));
    expect(onSelect).toHaveBeenCalledWith(mockCategory);
  });

  it('filters rows based on status dropdown', () => {

    render(
      <VendorConsolidationCategoryTable
        categories={[mockCategory]}
        onSelectCategory={vi.fn()}
      />
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Opportunity Identified' } });
    expect(screen.getByText(mockCategory.spendCategory)).toBeDefined();

    fireEvent.change(select, { target: { value: 'No Clear Opportunity Identified' } });
    expect(screen.queryByText(mockCategory.spendCategory)).toBeNull();
  });

  it('renders various opportunity status and fragmentation badges', () => {
    const variedCategories: CategoryConsolidationProfile[] = [
      {
        ...mockCategory,
        spendCategory: 'Chemicals',
        categoryOpportunityStatus: 'Potential Opportunity — Further Validation Required',
        fragmentationLevel: 'HIGH'
      },
      {
        ...mockCategory,
        spendCategory: 'Hardware',
        categoryOpportunityStatus: 'Insufficient Data',
        fragmentationLevel: 'LOW'
      },
      {
        ...mockCategory,
        spendCategory: 'Services',
        categoryOpportunityStatus: 'No Clear Opportunity Identified',
        fragmentationLevel: 'LOW'
      }
    ];

    render(
      <VendorConsolidationCategoryTable
        categories={variedCategories}
        onSelectCategory={vi.fn()}
      />
    );

    expect(screen.getByText('Chemicals')).toBeDefined();
    expect(screen.getByText('Hardware')).toBeDefined();
    expect(screen.getByText('Services')).toBeDefined();
  });
});

describe('VendorConsolidationSupplierTable Component', () => {

  it('renders supplier details and triggers onBackToCategories', () => {
    const onBack = vi.fn();
    const onSelectMaterials = vi.fn();
    render(
      <VendorConsolidationSupplierTable
        category={mockCategory}
        onBackToCategories={onBack}
        onSelectSupplierMaterials={onSelectMaterials}
      />
    );

    expect(screen.getByText('Beta Packaging')).toBeDefined();
    expect(screen.getByText('Alpha Supplies')).toBeDefined();
    expect(screen.getByText('Gamma Containers')).toBeDefined();
    expect(screen.getByText('View Category Materials')).toBeDefined();

    fireEvent.click(screen.getByText('View Category Materials'));
    expect(onSelectMaterials).toHaveBeenCalled();

    // Click back to categories
    fireEvent.click(screen.getByRole('button', { name: 'Back to Categories' }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('VendorConsolidationMaterialTable Component', () => {
  it('renders same material opportunities and triggers onSelectMaterialTransactions', () => {
    const onSelectTx = vi.fn();
    const onBack = vi.fn();
    render(
      <VendorConsolidationMaterialTable
        categoryName={mockCategory.spendCategory}
        sameMaterialOpportunities={[mockSameMatOpp]}
        comparableOpportunities={[mockCompMatOpp]}
        crossPlantOpportunities={[mockCrossPlantOpp]}
        onBackToSuppliers={onBack}
        onSelectMaterialTransactions={onSelectTx}
      />
    );

    expect(screen.getByText(mockSameMatOpp.materialCode)).toBeDefined();
    expect(screen.getByText(mockSameMatOpp.materialDesc)).toBeDefined();
    expect(screen.getByText('Transactions')).toBeDefined();

    fireEvent.click(screen.getByText('Transactions'));
    expect(onSelectTx).toHaveBeenCalledWith(mockSameMatOpp);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Suppliers' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('switches between sub-tabs cleanly', () => {
    render(
      <VendorConsolidationMaterialTable
        categoryName={mockCategory.spendCategory}
        sameMaterialOpportunities={[mockSameMatOpp]}
        comparableOpportunities={[mockCompMatOpp]}
        crossPlantOpportunities={[mockCrossPlantOpp]}
        onBackToSuppliers={vi.fn()}
        onSelectMaterialTransactions={vi.fn()}
      />
    );

    // Click Comparable Subtab
    fireEvent.click(screen.getByText('Comparable (1)'));
    expect(screen.getAllByText(/Potential Comparable/i).length).toBeGreaterThan(0);

    // Click Cross-Plant Subtab
    fireEvent.click(screen.getByText('Cross-Plant (1)'));
    expect(screen.getByText(/PLANT-A, PLANT-B/i)).toBeDefined();
  });

  it('renders empty state when no multi-sourced materials in category', () => {
    render(
      <VendorConsolidationMaterialTable
        categoryName={mockCategory.spendCategory}
        sameMaterialOpportunities={[]}
        comparableOpportunities={[]}
        crossPlantOpportunities={[]}
        onBackToSuppliers={vi.fn()}
        onSelectMaterialTransactions={vi.fn()}
      />
    );
    expect(screen.getByText('No multi-sourced materials identified in this category.')).toBeDefined();
  });
});

describe('VendorConsolidationTransactionTable Component', () => {
  it('renders transactions and triggers onBackToMaterials', () => {
    const onBack = vi.fn();
    render(
      <VendorConsolidationTransactionTable
        opportunity={mockSameMatOpp}
        onBackToMaterials={onBack}
      />
    );

    expect(screen.getByText('PO-001')).toBeDefined();
    expect(screen.getByText('PO-002')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Materials' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders empty state when no transactions exist', () => {
    render(
      <VendorConsolidationTransactionTable
        opportunity={{ ...mockSameMatOpp, transactions: [] }}
        onBackToMaterials={vi.fn()}
      />
    );
    expect(screen.getByText('No transaction records available for this material.')).toBeDefined();
  });
});


describe('VendorConsolidationView Orchestration Component', () => {
  beforeEach(() => {
    vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockResolvedValue(mockResult);
  });

  it('loads and renders the full Lever 3 view through all 4 drilldown levels and back', async () => {
    const onBackOverview = vi.fn();
    render(<VendorConsolidationView assessmentId="TEST-ASSESSMENT-001" onBackToOverview={onBackOverview} />);
    const strings = UI_STRINGS.module2VendorConsolidation;

    await waitFor(() => {
      expect(screen.getByText(strings.pageTitle)).toBeDefined();
    });

    // 1. Level 1: Categories
    expect(screen.getByText(mockCategory.spendCategory)).toBeDefined();
    expect(screen.getByText(strings.btnBackToOverview)).toBeDefined();
    fireEvent.click(screen.getByText(strings.btnBackToOverview));
    expect(onBackOverview).toHaveBeenCalled();

    // 2. Drill down to Level 2: Suppliers
    fireEvent.click(screen.getByText('Analyse'));
    expect(screen.getByText('Beta Packaging')).toBeDefined();

    // 3. Drill down to Level 3: Materials
    fireEvent.click(screen.getByText('View Category Materials'));
    expect(screen.getByText(mockSameMatOpp.materialCode)).toBeDefined();

    // 4. Drill down to Level 4: Transactions
    fireEvent.click(screen.getByText('Transactions'));
    expect(screen.getByText('PO-001')).toBeDefined();
    expect(screen.getByText('PO-002')).toBeDefined();

    // Navigate back up: Transactions -> Materials
    fireEvent.click(screen.getByRole('button', { name: 'Back to Materials' }));
    expect(screen.getByText(mockSameMatOpp.materialCode)).toBeDefined();

    // Navigate back up: Materials -> Suppliers
    fireEvent.click(screen.getByRole('button', { name: 'Back to Suppliers' }));
    expect(screen.getByText('Beta Packaging')).toBeDefined();

    // Navigate back up: Suppliers -> Categories
    fireEvent.click(screen.getByRole('button', { name: 'Back to Categories' }));
    expect(screen.getByText(mockCategory.spendCategory)).toBeDefined();
  });


  it('renders error banner when loading fails', async () => {
    vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockRejectedValueOnce(
      new Error('API Connection Timeout')
    );

    render(<VendorConsolidationView assessmentId="FAIL-001" />);
    await waitFor(() => {
      expect(screen.getByText('API Connection Timeout')).toBeDefined();
    });
  });

  it('renders VendorConsolidationKpiCards with coverage waterfall banner', () => {
    const resultWithCov: VendorConsolidationResult = {
      ...mockResult,
      coverageSummary: {
        totalMaterialsCount: 200,
        totalSpendInr: 168000000,
        totalSpendCr: 16.8,
        taxonomyVerifiedCount: 150,
        taxonomyVerifiedSpendInr: 125000000,
        taxonomyVerifiedSpendCr: 12.5,
        taxonomyVerifiedMaterialPct: 75.0,
        taxonomyVerifiedSpendPct: 75.0,
        clientApprovedCount: 10,
        clientApprovedSpendInr: 10000000,
        clientApprovedSpendCr: 1.0,
        clientApprovedMaterialPct: 5.0,
        clientApprovedSpendPct: 5.0,
        approvedCount: 160,
        approvedSpendInr: 135000000,
        approvedSpendCr: 13.5,
        approvedMaterialPct: 80.0,
        approvedSpendPct: 80.0,
        provisionalCount: 30,
        provisionalSpendInr: 35000000,
        provisionalSpendCr: 3.5,
        provisionalMaterialPct: 15.0,
        provisionalSpendPct: 20.0,
        awaitingReviewCount: 10,
        awaitingReviewSpendInr: 8000000,
        awaitingReviewSpendCr: 0.8,
        awaitingReviewMaterialPct: 5.0,
        awaitingReviewSpendPct: 5.0,
        workflowCoveragePct: 100.0
      }
    };
    render(<VendorConsolidationKpiCards result={resultWithCov} />);
    expect(screen.getByText('Material UNSPSC Classification Coverage Waterfall')).toBeDefined();
    expect(screen.getByText('Taxonomy-Verified')).toBeDefined();
    expect(screen.getByText('Provisional')).toBeDefined();
    expect(screen.getByText('Awaiting Review')).toBeDefined();
  });

  describe('VendorConsolidationMappingQueueTable', () => {
    const mockExceptions: MaterialMappingEntry[] = [
      {
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
        reviewReason: 'Ambiguous manufacturer specs'
      },
      {
        sourceMaterialId: 'MAT-002',
        sourceDescription: 'Centrifugal Pump Impeller',
        sourceCategory: 'Pumps',
        assignedUnspscCode: '00000000',
        assignedUnspscTitle: 'Unclassified',
        unspscSegment: 'Industrial Manufacturing',
        unspscFamily: 'Pumps',
        unspscClass: 'Centrifugal Pumps',
        unspscCommodity: 'Pump Parts',
        taxonomyVersion: 'UNv260801',
        mappingMethod: 'CONTEXTUAL_HEURISTIC',
        confidenceScore: 40,
        evidence: 'No catalog match',
        reviewStatus: 'PROVISIONAL',
        mappingDate: '2026-03-01',
        totalSpendInr: 300000,
        totalSpendCr: 0.03,
        transactionCount: 5,
        qualifyingSuppliersCount: 1
      }
    ];

    it('renders exceptions and allows searching and approving mappings', async () => {
      const onUpdated = vi.fn();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <VendorConsolidationMappingQueueTable
          exceptions={mockExceptions}
          onMappingUpdated={onUpdated}
        />
      );

      expect(screen.getByText('Hydraulic Valve A1')).toBeDefined();
      expect(screen.getByText('Centrifugal Pump Impeller')).toBeDefined();

      // Search filter
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Hydraulic' } });
      expect(screen.getByText('Hydraulic Valve A1')).toBeDefined();
      expect(screen.queryByText('Centrifugal Pump Impeller')).toBeNull();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Centrifugal Pump Impeller')).toBeDefined();

      // Approve mapping for first item
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      fireEvent.click(approveButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/module2/sourcing/vendor-consolidation/mappings/update',
          expect.objectContaining({
            method: 'POST'
          })
        );
        expect(onUpdated).toHaveBeenCalled();
      });
    });
  });
});

