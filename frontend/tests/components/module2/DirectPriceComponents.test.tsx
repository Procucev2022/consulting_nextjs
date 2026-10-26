import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DirectPriceCards } from '../../../src/components/module2/DirectPriceCards';
import { DirectPriceTable } from '../../../src/components/module2/DirectPriceTable';
import { DirectPriceItemDrillDownModal } from '../../../src/components/module2/DirectPriceItemDrillDownModal';
import { DirectPriceImprovementView } from '../../../src/components/module2/DirectPriceImprovementView';
import type {
  DirectPriceImprovementResult,
  DirectPriceItemOpportunity
} from '../../../src/types/module2DirectPriceImprovement';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

const mockItemOpportunity: DirectPriceItemOpportunity = {
  itemKey: 'FY2023-24::MAT-100::KG::INR',
  materialCode: 'MAT-100',
  materialDesc: 'ORGANIC COTTON FIBRE 30MM',
  spendCategory: 'Natural Fibres',
  uom: 'KG',
  currency: 'INR',
  financialYear: 'FY2023-24',
  transactionCount: 15,
  totalEligibleQuantity: 50000,
  lowestUnitPrice: 180.0,
  weightedAveragePrice: 210.0,
  highestUnitPrice: 250.0,
  actualPurchaseCostInr: 10500000,
  actualPurchaseCostCr: 1.05,
  benchmarkCostInr: 9000000,
  benchmarkCostCr: 0.9,
  historicalLostOpportunityInr: 1500000,
  historicalLostOpportunityCr: 0.15,
  priceDispersionPct: 38.9,
  benchmarkSupplierName: 'ABC COTTON MILLS LTD',
  benchmarkSupplierCode: 'SUP-001',
  benchmarkPoNumber: 'PO-2023-8891',
  benchmarkPoDate: '2023-06-15',
  benchmarkPlantCode: 'PLANT-01',
  supplierCount: 3,
  plantCount: 2,
  qualificationStatus: 'QUALIFIED',
  warnings: [],
  suppliers: [
    {
      supplierCode: 'SUP-001',
      supplierName: 'ABC COTTON MILLS LTD',
      transactionCount: 8,
      totalQuantity: 25000,
      totalSpendInr: 4500000,
      weightedAveragePrice: 180.0,
      lowestUnitPrice: 180.0,
      highestUnitPrice: 185.0,
      historicalLostOpportunityInr: 0,
      isLowestPriceSupplier: true
    },
    {
      supplierCode: 'SUP-002',
      supplierName: 'PREMIER AGRO FIBRES',
      transactionCount: 7,
      totalQuantity: 25000,
      totalSpendInr: 6000000,
      weightedAveragePrice: 240.0,
      lowestUnitPrice: 220.0,
      highestUnitPrice: 250.0,
      historicalLostOpportunityInr: 1500000,
      isLowestPriceSupplier: false
    }
  ],
  plants: [
    {
      plantCode: 'PLANT-01',
      transactionCount: 10,
      totalQuantity: 30000,
      totalSpendInr: 6000000,
      weightedAveragePrice: 200.0,
      lowestUnitPrice: 180.0,
      historicalLostOpportunityInr: 600000
    },
    {
      plantCode: 'PLANT-02',
      transactionCount: 5,
      totalQuantity: 20000,
      totalSpendInr: 4500000,
      weightedAveragePrice: 225.0,
      lowestUnitPrice: 210.0,
      historicalLostOpportunityInr: 900000
    }
  ],
  transactions: [
    {
      id: 'TX-001',
      poNumber: 'PO-2023-8891',
      poDate: '2023-06-15',
      financialYear: 'FY2023-24',
      supplierName: 'ABC COTTON MILLS LTD',
      supplierCode: 'SUP-001',
      plantCode: 'PLANT-01',
      quantity: 10000,
      unitPrice: 180.0,
      totalSpendInr: 1800000,
      benchmarkUnitPrice: 180.0,
      benchmarkCostInr: 1800000,
      historicalLostOpportunityInr: 0,
      isBenchmarkTransaction: true,
      qualificationStatus: 'QUALIFIED'
    },
    {
      id: 'TX-002',
      poNumber: 'PO-2023-9102',
      poDate: '2023-09-20',
      financialYear: 'FY2023-24',
      supplierName: 'PREMIER AGRO FIBRES',
      supplierCode: 'SUP-002',
      plantCode: 'PLANT-02',
      quantity: 15000,
      unitPrice: 240.0,
      totalSpendInr: 3600000,
      benchmarkUnitPrice: 180.0,
      benchmarkCostInr: 2700000,
      historicalLostOpportunityInr: 900000,
      isBenchmarkTransaction: false,
      qualificationStatus: 'QUALIFIED'
    }
  ]
};

const mockItemCommodity: DirectPriceItemOpportunity = {
  ...mockItemOpportunity,
  itemKey: 'FY2023-24::COAL-4010::EA::INR',
  materialCode: 'COAL-4010',
  materialDesc: 'COAL E-AUCTION GRADE B',
  spendCategory: 'Fuel',
  uom: 'EA',
  qualificationStatus: 'VOLATILE_COMMODITY',
  warnings: ['Discrete piece UOM detected on bulk energy commodity.'],
  historicalLostOpportunityCr: 0.65,
  historicalLostOpportunityInr: 6500000
};

const mockItemSpecMismatch: DirectPriceItemOpportunity = {
  ...mockItemOpportunity,
  itemKey: 'FY2023-24::SCR-99::PCS::INR',
  materialCode: 'SCR-99',
  materialDesc: 'HEAVY SCRAPPER BLADE HIGH TENSILE',
  spendCategory: 'Spare Parts',
  uom: 'PCS',
  qualificationStatus: 'SPEC_MISMATCH',
  warnings: ['Unit price spread exceeds 3.0x threshold on engineered part.'],
  historicalLostOpportunityCr: 0.08,
  historicalLostOpportunityInr: 800000
};

const mockResult: DirectPriceImprovementResult = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'ABC Textile Ltd',
  availableFinancialYears: ['ALL', 'FY2022-23', 'FY2023-24'],
  selectedFinancialYear: 'ALL',
  totalEligibleTransactions: 17386,
  totalIneligibleTransactions: 6184,
  totalEligibleSpendInr: 2989793445.89,
  totalEligibleSpendCr: 298.9793,
  totalIneligibleSpendInr: 3149011739.62,
  totalIneligibleSpendCr: 314.9012,
  actualSpendInr: 2723881575.52,
  actualSpendCr: 272.3882,
  benchmarkCostInr: 2552726526.93,
  benchmarkCostCr: 255.2727,
  historicalLostOpportunityInr: 171155048.6,
  historicalLostOpportunityCr: 17.1155,
  commerciallyValidatedSavingsInr: 0,
  commerciallyValidatedSavingsCr: 0,
  itemsEvaluatedCount: 11383,
  itemsWithOpportunityCount: 1007,
  disqualifiedItemsCount: 10835,
  certificationNotice: 'NOT YET CERTIFIED — Indicative opportunity potential based on historical internal PO rates.',
  categoriesAnalysedCount: 239,
  categoriesRequiringReviewCount: 14,
  categorySummaries: [
    {
      unspscCode: '11151600',
      unspscCategory: 'Natural fibers',
      spendCategory: 'Yarn & Raw Cotton',
      distinctMaterialCount: 120,
      eligibleTransactionCount: 4500,
      eligibleQuantity: 145000,
      uom: 'KGS',
      eligibleSpendInr: 1502500000,
      eligibleSpendCr: 150.25,
      actualPurchaseCostInr: 1502500000,
      actualPurchaseCostCr: 150.25,
      benchmarkCostInr: 1401000000,
      benchmarkCostCr: 140.1,
      historicalLostOpportunityInr: 101500000,
      historicalLostOpportunityCr: 10.15,
      opportunityPct: 6.76,
      dataQualityStatus: 'RELIABLE',
      materials: [mockItemOpportunity, mockItemCommodity, mockItemSpecMismatch]
    }
  ],
  fySummaries: [
    {
      financialYear: 'FY2022-23',
      transactionCount: 5443,
      totalQuantity: 14373450.75,
      actualSpendInr: 966191350.46,
      actualSpendCr: 96.6191,
      benchmarkCostInr: 926171821.29,
      benchmarkCostCr: 92.6172,
      historicalLostOpportunityInr: 40019529.17,
      historicalLostOpportunityCr: 4.002,
      itemsEvaluatedCount: 3788,
      itemsWithOpportunityCount: 228
    },
    {
      financialYear: 'FY2023-24',
      transactionCount: 11943,
      totalQuantity: 34317728.95,
      actualSpendInr: 1757690225.06,
      actualSpendCr: 175.769,
      benchmarkCostInr: 1626554705.64,
      benchmarkCostCr: 162.6555,
      historicalLostOpportunityInr: 131135519.43,
      historicalLostOpportunityCr: 13.1136,
      itemsEvaluatedCount: 7595,
      itemsWithOpportunityCount: 779
    }
  ],
  items: [mockItemOpportunity, mockItemCommodity, mockItemSpecMismatch]
};

describe('DirectPriceCards Component', () => {
  it('renders all summary KPI cards and certification banner', () => {
    render(<DirectPriceCards result={mockResult} />);

    expect(screen.getByText(UI_STRINGS.module2DirectPrice.certificationNotice)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.cardTotalEligibleSpend)).toBeInTheDocument();
    expect(screen.getByText('₹272.39 Cr')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.cardLostOpportunity)).toBeInTheDocument();
    expect(screen.getByText('₹17.12 Cr')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.cardCategoriesAnalysed)).toBeInTheDocument();
    expect(screen.getByText('239')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.cardCategoriesRequiringReview)).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.cardValidatedSavings)).toBeInTheDocument();
    expect(screen.getByText('₹0.00 Cr')).toBeInTheDocument();
    expect(screen.getByText(/17,386 eligible transactions/)).toBeInTheDocument();
  });
});

describe('DirectPriceTable Component', () => {
  it('renders table headers, rows and handles search filter', () => {
    const handleSelectFy = vi.fn();
    const handleViewEvidence = vi.fn();

    render(
      <DirectPriceTable
        items={[mockItemOpportunity, mockItemCommodity, mockItemSpecMismatch]}
        availableFinancialYears={mockResult.availableFinancialYears}
        selectedFinancialYear="ALL"
        onSelectFinancialYear={handleSelectFy}
        onViewEvidence={handleViewEvidence}
      />
    );

    expect(screen.getByText('ORGANIC COTTON FIBRE 30MM')).toBeInTheDocument();
    expect(screen.getByText('COAL E-AUCTION GRADE B')).toBeInTheDocument();
    expect(screen.getByText('HEAVY SCRAPPER BLADE HIGH TENSILE')).toBeInTheDocument();

    // Search filter
    const searchInput = screen.getByPlaceholderText(UI_STRINGS.module2DirectPrice.filterSearch);
    fireEvent.change(searchInput, { target: { value: 'COTTON' } });
    expect(screen.getByText('ORGANIC COTTON FIBRE 30MM')).toBeInTheDocument();
    expect(screen.queryByText('COAL E-AUCTION GRADE B')).not.toBeInTheDocument();

    // Empty search result
    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_MATERIAL_XYZ' } });
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.noItemsFound)).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Financial year filter change
    const fySelect = screen.getByLabelText('Financial Year Filter');
    fireEvent.change(fySelect, { target: { value: 'FY2023-24' } });
    expect(handleSelectFy).toHaveBeenCalledWith('FY2023-24');

    // Status filter change
    const statusSelect = screen.getByLabelText('Qualification Status Filter');
    fireEvent.change(statusSelect, { target: { value: 'QUALIFIED' } });
    expect(screen.getByText('ORGANIC COTTON FIBRE 30MM')).toBeInTheDocument();
    expect(screen.queryByText('COAL E-AUCTION GRADE B')).not.toBeInTheDocument();

    // Click evidence action
    const evidenceButtons = screen.getAllByText(UI_STRINGS.module2DirectPrice.btnViewEvidence);
    fireEvent.click(evidenceButtons[0]);
    expect(handleViewEvidence).toHaveBeenCalledWith(mockItemOpportunity);
  });
});

describe('DirectPriceItemDrillDownModal Component', () => {
  it('renders null when closed or item null', () => {
    const { container, rerender } = render(
      <DirectPriceItemDrillDownModal isOpen={false} onClose={vi.fn()} item={mockItemOpportunity} />
    );
    expect(container.firstChild).toBeNull();

    rerender(<DirectPriceItemDrillDownModal isOpen={true} onClose={vi.fn()} item={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders suppliers, plants, transactions tabs and closes on button click', () => {
    const handleClose = vi.fn();
    render(<DirectPriceItemDrillDownModal isOpen={true} onClose={handleClose} item={mockItemOpportunity} />);

    expect(screen.getByText('ORGANIC COTTON FIBRE 30MM')).toBeInTheDocument();
    expect(screen.getByText(/PO-2023-8891/)).toBeInTheDocument();
    expect(screen.getAllByText(/ABC COTTON MILLS LTD/).length).toBeGreaterThan(0);

    // Check suppliers tab is active by default
    expect(screen.getByText('PREMIER AGRO FIBRES')).toBeInTheDocument();
    expect(screen.getByText('BENCHMARK')).toBeInTheDocument();

    // Switch to plants tab
    const plantsTabBtn = screen.getByText(/Plant Price Comparison/);
    fireEvent.click(plantsTabBtn);
    expect(screen.getByText(/PLANT-01/)).toBeInTheDocument();
    expect(screen.getByText(/PLANT-02/)).toBeInTheDocument();

    // Switch to transactions tab
    const txTabBtn = screen.getByText(/Underlying Transactions/);
    fireEvent.click(txTabBtn);
    expect(screen.getAllByText('PO-2023-8891').length).toBeGreaterThan(0);
    expect(screen.getByText('PO-2023-9102')).toBeInTheDocument();
    expect(screen.getByText('BENCHMARK PO')).toBeInTheDocument();

    // Close modal
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);
    expect(handleClose).toHaveBeenCalled();
  });
});

describe('DirectPriceImprovementView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches data, displays loading skeleton, renders cards, table and customer filter', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResult })
    });
    global.fetch = mockFetch;

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    // Header title
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.pageTitle)).toBeInTheDocument();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('₹272.39 Cr')).toBeInTheDocument();
    });

    // Check Customer Dataset filter exists and can switch
    const customerSelect = screen.getByLabelText('Customer Dataset Filter');
    expect(customerSelect).toBeInTheDocument();
    fireEvent.change(customerSelect, { target: { value: 'AIC-2026-0003' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('assessmentId=AIC-2026-0003')
      );
    });

    // Test 2-level drilldown: Category -> Material items -> Transaction Modal
    expect(screen.getByText('Natural fibers')).toBeInTheDocument();
    const drillDownCategoryBtns = screen.getAllByText(UI_STRINGS.module2DirectPrice.btnViewMaterials);
    fireEvent.click(drillDownCategoryBtns[0]);

    // Now in material table
    const evidenceBtns = await screen.findAllByText(UI_STRINGS.module2DirectPrice.btnViewEvidence);
    fireEvent.click(evidenceBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('BENCHMARK')).toBeInTheDocument();
    });

    const closeBtn = screen.getByText(UI_STRINGS.module2DirectPrice.btnClose);
    fireEvent.click(closeBtn);
  });

  it('handles fetch error gracefully and shows error banner', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });
    global.fetch = mockFetch;

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load direct price improvement data/)).toBeInTheDocument();
    });

    // Refresh button should be clickable
    const refreshBtn = screen.getByText('Refresh');
    await waitFor(() => {
      fireEvent.click(refreshBtn);
    });
  });
});
