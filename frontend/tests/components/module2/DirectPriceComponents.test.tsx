import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DirectPriceCards } from '../../../src/components/module2/DirectPriceCards';
import { DirectPriceTable } from '../../../src/components/module2/DirectPriceTable';
import { DirectPriceItemDrillDownModal } from '../../../src/components/module2/DirectPriceItemDrillDownModal';
import { DirectPriceImprovementView } from '../../../src/components/module2/DirectPriceImprovementView';
import type {
  DirectPriceImprovementResult,
  DirectPriceItemOpportunity
} from '../../../src/types/module2DirectPriceImprovement';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { Module2StrategicSourcingApi } from '../../../src/utils/module2StrategicSourcingApi';
import { resolveHumanReadableCategory } from '../../../src/utils/procurementCategoryResolver';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { AssessmentRecord } from '../../../src/types/assessment';

const assessmentChoices: AssessmentRecord[] = [
  {
    assessmentId: 'AIC-2026-0002', customerName: 'ABC Textile Ltd', industry: 'Textiles',
    assessmentPeriodStart: '2023-04-01', assessmentPeriodEnd: '2024-03-31', ndaStatus: 'SIGNED',
    dataStatus: 'VALIDATED', assignedAnalyst: 'Analyst', status: 'IN_PROGRESS',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    assessmentId: 'AIC-2026-0003', customerName: 'PQR Cement Ltd', industry: 'Cement',
    assessmentPeriodStart: '2023-04-01', assessmentPeriodEnd: '2024-03-31', ndaStatus: 'SIGNED',
    dataStatus: 'VALIDATED', assignedAnalyst: 'Analyst', status: 'IN_PROGRESS',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

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

    rerender(<DirectPriceItemDrillDownModal isOpen onClose={vi.fn()} item={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders suppliers, plants, transactions tabs and closes on button click', () => {
    const handleClose = vi.fn();
    render(<DirectPriceItemDrillDownModal isOpen onClose={handleClose} item={mockItemOpportunity} />);

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
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue(assessmentChoices);
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
    const customerSelect = screen.getByLabelText(UI_STRINGS.module2DirectPrice.filterCustomer);
    expect(customerSelect).toBeInTheDocument();
    fireEvent.change(customerSelect, { target: { value: 'AIC-2026-0003' } });

    await waitFor(() => {
      expect(mockFetch.mock.calls.some(([url]) => String(url).includes('assessmentId=AIC-2026-0003'))).toBe(true);
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

const ENGINE_ERROR_MESSAGE = 'Sourcing engine unavailable';

const createDeferred = (): {
  promise: Promise<DirectPriceImprovementResult | null>;
  resolve: (value: DirectPriceImprovementResult | null) => void;
  reject: (reason: unknown) => void;
} => {
  let resolve: (value: DirectPriceImprovementResult | null) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<DirectPriceImprovementResult | null>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const buildResultForCategory = (categoryName: string): DirectPriceImprovementResult => ({
  ...mockResult,
  categorySummaries: [
    {
      ...mockResult.categorySummaries[0],
      unspscCategory: categoryName,
      spendCategory: categoryName,
      materials: [mockItemOpportunity]
    }
  ]
});

describe('DirectPriceImprovementView data flow and error handling', () => {
  beforeEach(() => {
    vi.spyOn(assessmentApiClient, 'getAssessments').mockResolvedValue(assessmentChoices);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the loading state until the dataset resolves and disables refresh while loading', async () => {
    const pending = createDeferred();
    vi.spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement').mockReturnValue(pending.promise);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    const refreshButton = screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnRefresh });
    expect(refreshButton).toBeDisabled();
    expect(screen.queryByText(UI_STRINGS.module2DirectPrice.certificationNotice)).not.toBeInTheDocument();

    await act(async () => {
      pending.resolve(mockResult);
    });

    expect(await screen.findByText(UI_STRINGS.module2DirectPrice.certificationNotice)).toBeInTheDocument();
    expect(refreshButton).toBeEnabled();
  });

  it('requests the chosen financial year and clears it when ALL is selected', async () => {
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    fireEvent.change(await screen.findByDisplayValue(UI_STRINGS.module2DirectPrice.allFys), {
      target: { value: 'FY2023-24' }
    });
    await waitFor(() => {
      expect(getSpy).toHaveBeenLastCalledWith('AIC-2026-0002', { financialYear: 'FY2023-24' });
    });

    fireEvent.change(screen.getByDisplayValue('FY2023-24'), { target: { value: 'ALL' } });
    await waitFor(() => {
      expect(getSpy).toHaveBeenLastCalledWith('AIC-2026-0002', { financialYear: undefined });
    });
  });

  it('reports customer dataset changes to the parent and loads the new assessment', async () => {
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);
    const onCustomerChange = vi.fn();

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" onCustomerChange={onCustomerChange} />);

    fireEvent.change(await screen.findByDisplayValue(UI_STRINGS.module2DirectPrice.assessmentOptionLabel('ABC Textile Ltd', 'AIC-2026-0002')), {
      target: { value: 'AIC-2026-0003' }
    });

    expect(onCustomerChange).toHaveBeenCalledWith('AIC-2026-0003');
    await waitFor(() => {
      expect(getSpy).toHaveBeenLastCalledWith('AIC-2026-0003', { financialYear: undefined });
    });
    expect(screen.getByDisplayValue(UI_STRINGS.module2DirectPrice.assessmentOptionLabel('PQR Cement Ltd', 'AIC-2026-0003'))).toBeInTheDocument();
  });

  it('switches customer datasets when no change callback is provided', async () => {
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    fireEvent.change(await screen.findByDisplayValue(UI_STRINGS.module2DirectPrice.assessmentOptionLabel('ABC Textile Ltd', 'AIC-2026-0002')), {
      target: { value: 'AIC-2026-0003' }
    });

    expect(screen.getByDisplayValue(UI_STRINGS.module2DirectPrice.assessmentOptionLabel('PQR Cement Ltd', 'AIC-2026-0003'))).toBeInTheDocument();
    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('resets the drill-down when the assessment prop changes and ignores an unchanged id', async () => {
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);
    const { rerender } = render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    fireEvent.click(await screen.findByRole('button', { name: UI_STRINGS.module2DirectPrice.btnViewMaterials }));
    expect(
      screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnBackToCategories })
    ).toBeInTheDocument();

    rerender(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);
    expect(getSpy).toHaveBeenCalledTimes(1);

    rerender(<DirectPriceImprovementView assessmentId="AIC-2026-0003" />);
    await waitFor(() => {
      expect(getSpy).toHaveBeenLastCalledWith('AIC-2026-0003', { financialYear: undefined });
    });
    expect(
      await screen.findByRole('button', { name: UI_STRINGS.module2DirectPrice.btnViewMaterials })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: UI_STRINGS.module2DirectPrice.btnBackToCategories })
    ).not.toBeInTheDocument();
  });

  it('drills into a category, opens item evidence, closes it and returns to the category summary', async () => {
    vi.spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement').mockResolvedValue(mockResult);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    fireEvent.click(await screen.findByRole('button', { name: UI_STRINGS.module2DirectPrice.btnViewMaterials }));
    expect(
      screen.getByText(UI_STRINGS.module2DirectPrice.drilldownCategoryTitle('Natural fibers'))
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: UI_STRINGS.module2DirectPrice.btnViewEvidence })[0]);
    expect(
      screen.getByRole('heading', { level: 2, name: mockItemOpportunity.materialDesc })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnClose }));
    expect(
      screen.queryByRole('heading', { level: 2, name: mockItemOpportunity.materialDesc })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnBackToCategories }));
    expect(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnViewMaterials })).toBeInTheDocument();
  });

  it('returns to the category summary when the financial year changes inside the material view', async () => {
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);
    fireEvent.click(await screen.findByRole('button', { name: UI_STRINGS.module2DirectPrice.btnViewMaterials }));

    const [headerFinancialYearSelect] = screen.getAllByDisplayValue(UI_STRINGS.module2DirectPrice.allFys);
    fireEvent.change(headerFinancialYearSelect, { target: { value: 'FY2022-23' } });

    await waitFor(() => {
      expect(getSpy).toHaveBeenLastCalledWith('AIC-2026-0002', { financialYear: 'FY2022-23' });
    });
    expect(await screen.findByRole('button', { name: UI_STRINGS.module2DirectPrice.btnViewMaterials })).toBeInTheDocument();
  });

  it('opens the Excel export for all years and then for the selected financial year', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);
    await screen.findByText(UI_STRINGS.module2DirectPrice.certificationNotice);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnDownloadExcel }));
    expect(openSpy).toHaveBeenLastCalledWith(expect.stringContaining('/direct-price-improvement/export-excel'), '_blank');
    expect(openSpy.mock.lastCall?.[0]).toContain('assessmentId=AIC-2026-0002');
    expect(openSpy.mock.lastCall?.[0]).not.toContain('financialYear=');

    fireEvent.change(screen.getByDisplayValue(UI_STRINGS.module2DirectPrice.allFys), {
      target: { value: 'FY2023-24' }
    });
    await waitFor(() => {
      expect(getSpy).toHaveBeenLastCalledWith('AIC-2026-0002', { financialYear: 'FY2023-24' });
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnDownloadExcel }));
    expect(openSpy.mock.lastCall?.[0]).toContain('financialYear=FY2023-24');
  });

  it('refetches the current selection when refresh is pressed and keeps the data visible', async () => {
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);
    await screen.findByText(UI_STRINGS.module2DirectPrice.certificationNotice);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnRefresh }));
    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(getSpy).toHaveBeenLastCalledWith('AIC-2026-0002', { financialYear: undefined });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnRefresh })).toBeEnabled();
    });
    expect(screen.getByText(UI_STRINGS.module2DirectPrice.certificationNotice)).toBeInTheDocument();
  });

  it('shows the engine error message when the request rejects', async () => {
    vi.spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement').mockRejectedValue(
      new Error(ENGINE_ERROR_MESSAGE)
    );

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    expect(await screen.findByText(ENGINE_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('shows the load failure message when the engine returns no dataset', async () => {
    vi.spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement').mockResolvedValue(null);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    expect(await screen.findByText(UI_STRINGS.module2DirectPrice.loadFailedError)).toBeInTheDocument();
  });

  it('shows the unknown error message when a non-Error value is thrown', async () => {
    vi.spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement').mockRejectedValue('connection reset');

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);

    expect(await screen.findByText(UI_STRINGS.module2DirectPrice.unknownError)).toBeInTheDocument();
  });

  it('ignores an older response that finishes after a newer financial year request', async () => {
    const initialRequest = createDeferred();
    const olderRequest = createDeferred();
    const newerRequest = createDeferred();
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(olderRequest.promise)
      .mockReturnValueOnce(newerRequest.promise);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);
    await act(async () => {
      initialRequest.resolve(mockResult);
    });
    const financialYearSelect = await screen.findByDisplayValue(UI_STRINGS.module2DirectPrice.allFys);

    fireEvent.change(financialYearSelect, { target: { value: 'FY2023-24' } });
    fireEvent.change(financialYearSelect, { target: { value: 'FY2022-23' } });

    await act(async () => {
      newerRequest.resolve(buildResultForCategory('Packaging Films'));
    });
    expect(await screen.findByText(resolveHumanReadableCategory('Packaging Films'))).toBeInTheDocument();

    await act(async () => {
      olderRequest.resolve(buildResultForCategory('Industrial Gases'));
    });
    expect(screen.queryByText(resolveHumanReadableCategory('Industrial Gases'))).not.toBeInTheDocument();
    expect(screen.getByText(resolveHumanReadableCategory('Packaging Films'))).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledTimes(3);
  });

  it('ignores an older failure once a newer request has succeeded', async () => {
    const initialRequest = createDeferred();
    const olderRequest = createDeferred();
    const newerRequest = createDeferred();
    vi.spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(olderRequest.promise)
      .mockReturnValueOnce(newerRequest.promise);

    render(<DirectPriceImprovementView assessmentId="AIC-2026-0002" />);
    await act(async () => {
      initialRequest.resolve(mockResult);
    });
    const financialYearSelect = await screen.findByDisplayValue(UI_STRINGS.module2DirectPrice.allFys);

    fireEvent.change(financialYearSelect, { target: { value: 'FY2023-24' } });
    fireEvent.change(financialYearSelect, { target: { value: 'FY2022-23' } });

    await act(async () => {
      newerRequest.resolve(buildResultForCategory('Packaging Films'));
    });
    expect(await screen.findByText(resolveHumanReadableCategory('Packaging Films'))).toBeInTheDocument();

    await act(async () => {
      olderRequest.reject(new Error(ENGINE_ERROR_MESSAGE));
    });
    expect(screen.queryByText(ENGINE_ERROR_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByText(resolveHumanReadableCategory('Packaging Films'))).toBeInTheDocument();
  });

  it('skips the request and shows no dataset when no assessment is selected', async () => {
    const getSpy = vi
      .spyOn(Module2StrategicSourcingApi, 'getDirectPriceImprovement')
      .mockResolvedValue(mockResult);

    render(<DirectPriceImprovementView assessmentId={undefined} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(UI_STRINGS.module2DirectPrice.certificationNotice)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnRefresh })).toBeEnabled();
  });
});

describe('DirectPriceItemDrillDownModal evidence tabs', () => {
  it('lists supplier, plant and transaction evidence with counts and benchmark rows', () => {
    render(<DirectPriceItemDrillDownModal isOpen onClose={vi.fn()} item={mockItemOpportunity} />);

    expect(screen.getByRole('heading', { level: 2, name: mockItemOpportunity.materialDesc })).toBeInTheDocument();
    expect(screen.getByText('₹0.150 Cr')).toBeInTheDocument();

    const supplierRow = within(screen.getByRole('table')).getByRole('row', { name: /PREMIER AGRO FIBRES/ });
    expect(within(supplierRow).getByText('₹220.00')).toBeInTheDocument();
    expect(within(supplierRow).getByText('₹240.00')).toBeInTheDocument();
    expect(within(supplierRow).getByText('₹250.00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${UI_STRINGS.module2DirectPrice.tabPlants} (2)` }));
    const plantRow = within(screen.getByRole('table')).getByRole('row', { name: /PLANT-02/ });
    expect(within(plantRow).getByText('₹225.00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${UI_STRINGS.module2DirectPrice.tabTransactions} (2)` }));
    const transactionTable = screen.getByRole('table');
    const benchmarkRow = within(transactionTable).getByRole('row', { name: /PO-2023-8891/ });
    expect(within(benchmarkRow).getByText(UI_STRINGS.module2DirectPrice.noOpportunityPlaceholder)).toBeInTheDocument();
    const lossRow = within(transactionTable).getByRole('row', { name: /PO-2023-9102/ });
    expect(within(lossRow).getByText('₹240.00')).toBeInTheDocument();
    expect(within(lossRow).getByText('₹180.00')).toBeInTheDocument();
    const lossInr = mockItemOpportunity.transactions[1].historicalLostOpportunityInr;
    expect(
      within(lossRow).getByText(`₹${lossInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${UI_STRINGS.module2DirectPrice.tabSuppliers} (2)` }));
    expect(
      within(screen.getByRole('table')).getByRole('row', { name: /ABC COTTON MILLS LTD/ })
    ).toBeInTheDocument();
  });

  it('shows not available for supplier and plant weighted prices that are missing or infinite', () => {
    const item: DirectPriceItemOpportunity = {
      ...mockItemOpportunity,
      suppliers: [
        { ...mockItemOpportunity.suppliers[0], weightedAveragePrice: null },
        mockItemOpportunity.suppliers[1]
      ],
      plants: [
        { ...mockItemOpportunity.plants[0], weightedAveragePrice: Number.POSITIVE_INFINITY },
        mockItemOpportunity.plants[1]
      ]
    };
    render(<DirectPriceItemDrillDownModal isOpen onClose={vi.fn()} item={item} />);

    const supplierRow = within(screen.getByRole('table')).getByRole('row', { name: /ABC COTTON MILLS LTD/ });
    expect(within(supplierRow).getByText(UI_STRINGS.common.notAvailable)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${UI_STRINGS.module2DirectPrice.tabPlants} (2)` }));
    const plantRow = within(screen.getByRole('table')).getByRole('row', { name: /PLANT-01/ });
    expect(within(plantRow).getByText(UI_STRINGS.common.notAvailable)).toBeInTheDocument();
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
  });

  it('closes from the footer button', () => {
    const handleClose = vi.fn();
    render(<DirectPriceItemDrillDownModal isOpen onClose={handleClose} item={mockItemOpportunity} />);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2DirectPrice.btnClose }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
