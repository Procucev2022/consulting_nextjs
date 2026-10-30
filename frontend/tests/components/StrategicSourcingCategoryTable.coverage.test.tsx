import type { ComponentProps } from 'react';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrategicSourcingCategoryTable } from '../../src/components/module2/StrategicSourcingCategoryTable';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { CategoryStrategicSourcingProfile } from '../../src/types/module2StrategicSourcing';
import { buildSteelPlateCategoryProfile } from '../fixtures/module2CoverageFixtures';

const LABEL_STEEL = 'E-Auction Recommended';
const LABEL_WELDING = 'Competitive RFQ';
const LABEL_FASTENERS = 'Catalogue Review';
const LABEL_PIPE = 'Pipe Fittings Review';
const ALL_LABELS = [LABEL_STEEL, LABEL_WELDING, LABEL_FASTENERS, LABEL_PIPE];

const formatCrore = (value: number): string => `₹${value.toFixed(2)} Cr`;
const formatLakh = (value: number): string => `₹${(value / 100000).toFixed(2)} L`;

const steelPlates = buildSteelPlateCategoryProfile({
  categoryId: 'CAT-STL-PLATE-IS2062',
  categoryName: 'Structural Steel Plates',
  categoryMateriality: 'HIGH',
  module2Classification: 'Direct Materials',
  unspscCode: '30101704',
  totalSpendInr: 412360000,
  totalSpendInrCr: 41.24,
  addressableSpendInr: 385000000,
  addressableSpendInrCr: 38.5,
  transactionCount: 3,
  activeSuppliersCount: 3,
  hhiScore: 3400,
  fragmentationLevel: 'EXTREME_FRAGMENTATION',
  eauctionSuitability: 'HIGH',
  potentialEAuctionOpportunityInr: 6185400,
  consolidationSuitability: 'HIGH',
  potentialVendorConsolidationOpportunityInr: 2000000,
  overlappingOpportunityInr: 1000000,
  netQuantifiableOpportunityInr: 8400000,
  isQuantifiable: true,
  dataConfidence: 'HIGH',
  scorecard: {
    overallScore: 85,
    recommendation: 'E_AUCTION_RECOMMENDED',
    recommendationLabel: LABEL_STEEL,
    dimensions: [],
    justificationNotes: []
  }
});

const weldingConsumables = buildSteelPlateCategoryProfile({
  categoryId: 'CAT-WLD-ELEC',
  categoryName: 'Welding Consumables',
  categoryMateriality: 'MEDIUM',
  module2Classification: 'Indirect Materials',
  unspscCode: '',
  totalSpendInr: 160000000,
  totalSpendInrCr: 16,
  addressableSpendInr: 140000000,
  addressableSpendInrCr: 14,
  transactionCount: 920,
  activeSuppliersCount: 6,
  hhiScore: 2000,
  fragmentationLevel: 'HIGH_FRAGMENTATION',
  eauctionSuitability: 'MEDIUM',
  potentialEAuctionOpportunityInr: null,
  consolidationSuitability: 'MEDIUM',
  potentialVendorConsolidationOpportunityInr: 300000,
  overlappingOpportunityInr: 0,
  netQuantifiableOpportunityInr: null,
  isQuantifiable: false,
  dataConfidence: 'MEDIUM',
  scorecard: {
    overallScore: 62,
    recommendation: 'COMPETITIVE_RFQ_RECOMMENDED',
    recommendationLabel: LABEL_WELDING,
    dimensions: [],
    justificationNotes: []
  }
});

const industrialFasteners = buildSteelPlateCategoryProfile({
  categoryId: 'CAT-FST-001',
  categoryName: 'Industrial Fasteners',
  categoryMateriality: 'LOW',
  module2Classification: 'Indirect Materials',
  unspscCode: '31161501',
  totalSpendInr: 25000000,
  totalSpendInrCr: 2.5,
  addressableSpendInr: 21000000,
  addressableSpendInrCr: 2.1,
  transactionCount: 310,
  activeSuppliersCount: 4,
  hhiScore: 900,
  fragmentationLevel: 'MODERATE_FRAGMENTATION',
  eauctionSuitability: 'LOW',
  potentialEAuctionOpportunityInr: 0,
  consolidationSuitability: 'NOT_SUITABLE',
  potentialVendorConsolidationOpportunityInr: 0,
  overlappingOpportunityInr: 50000,
  netQuantifiableOpportunityInr: 120000,
  isQuantifiable: false,
  dataConfidence: 'LOW',
  scorecard: {
    overallScore: 41,
    recommendation: 'NO_IMMEDIATE_SOURCING_ACTION',
    recommendationLabel: LABEL_FASTENERS,
    dimensions: [],
    justificationNotes: []
  }
});

const pipeFittings = buildSteelPlateCategoryProfile({
  categoryId: 'CAT-PIPE-001',
  categoryName: 'Pipe Fittings',
  categoryMateriality: 'LOW',
  module2Classification: 'Direct Materials',
  unspscCode: '40141700',
  totalSpendInr: 60000000,
  totalSpendInrCr: 6,
  addressableSpendInr: 55000000,
  addressableSpendInrCr: 5.5,
  transactionCount: 120,
  activeSuppliersCount: 1,
  hhiScore: 1800,
  fragmentationLevel: 'LOW_FRAGMENTATION',
  eauctionSuitability: 'NOT_SUITABLE',
  potentialEAuctionOpportunityInr: 0,
  consolidationSuitability: 'NOT_SUITABLE',
  potentialVendorConsolidationOpportunityInr: 0,
  overlappingOpportunityInr: 0,
  netQuantifiableOpportunityInr: 300000,
  isQuantifiable: true,
  dataConfidence: 'HIGH',
  scorecard: {
    overallScore: 70,
    recommendation: 'DATA_DEEP_DIVE_REQUIRED',
    recommendationLabel: LABEL_PIPE,
    dimensions: [],
    justificationNotes: []
  }
});

const sourcingProfiles: CategoryStrategicSourcingProfile[] = [
  steelPlates,
  weldingConsumables,
  industrialFasteners,
  pipeFittings
];

const renderTable = (
  overrides: Partial<ComponentProps<typeof StrategicSourcingCategoryTable>> = {}
): ComponentProps<typeof StrategicSourcingCategoryTable> => {
  const props: ComponentProps<typeof StrategicSourcingCategoryTable> = {
    profiles: sourcingProfiles,
    onSelectCategory: vi.fn(),
    onExportAudit: vi.fn(),
    ...overrides
  };
  render(<StrategicSourcingCategoryTable {...props} />);
  return props;
};

const rowFor = (label: string): HTMLElement => {
  const row = screen.getByText(label).closest('tr');
  if (!row) {
    throw new Error(`No table row contains "${label}"`);
  }
  return row;
};

const renderedRowLabels = (): string[] =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => ALL_LABELS.find((label) => (row.textContent ?? '').includes(label)) ?? 'UNMATCHED');

const clickHeader = (headerLabel: string): void => {
  fireEvent.click(screen.getByText(headerLabel));
};

describe('StrategicSourcingCategoryTable coverage paths', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders only the header when no profiles or export handler are supplied', () => {
    render(<StrategicSourcingCategoryTable profiles={[]} onSelectCategory={vi.fn()} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: UI_STRINGS.module2Sourcing.btnExportAudit })).not.toBeInTheDocument();
  });

  it('sorts by net quantifiable opportunity by default with the largest opportunity first', () => {
    renderTable();

    expect(renderedRowLabels()).toEqual([LABEL_STEEL, LABEL_PIPE, LABEL_FASTENERS, LABEL_WELDING]);
  });

  it('filters rows by search text across category names and classifications', () => {
    renderTable();
    const searchInput = screen.getByRole('textbox');

    fireEvent.change(searchInput, { target: { value: 'welding' } });
    expect(renderedRowLabels()).toEqual([LABEL_WELDING]);

    fireEvent.change(searchInput, { target: { value: 'INDIRECT' } });
    expect(renderedRowLabels()).toEqual([LABEL_FASTENERS, LABEL_WELDING]);

    fireEvent.change(searchInput, { target: { value: 'no such commodity' } });
    expect(renderedRowLabels()).toEqual([]);
  });

  it('filters rows by materiality and by sourcing opportunity', () => {
    renderTable();
    const [materialityFilter, opportunityFilter] = screen.getAllByRole('combobox');

    fireEvent.change(materialityFilter, { target: { value: 'HIGH' } });
    expect(renderedRowLabels()).toEqual([LABEL_STEEL]);

    fireEvent.change(materialityFilter, { target: { value: 'LOW' } });
    expect(renderedRowLabels()).toEqual([LABEL_PIPE, LABEL_FASTENERS]);

    fireEvent.change(materialityFilter, { target: { value: 'ALL' } });
    fireEvent.change(opportunityFilter, { target: { value: 'E_AUCTION' } });
    expect(renderedRowLabels()).toEqual([LABEL_STEEL]);

    fireEvent.change(opportunityFilter, { target: { value: 'CONSOLIDATION' } });
    expect(renderedRowLabels()).toEqual([LABEL_STEEL, LABEL_WELDING]);

    fireEvent.change(opportunityFilter, { target: { value: 'QUANTIFIABLE' } });
    expect(renderedRowLabels()).toEqual([LABEL_STEEL, LABEL_PIPE]);

    fireEvent.change(opportunityFilter, { target: { value: 'ALL' } });
    expect(renderedRowLabels()).toHaveLength(4);
  });

  it('sorts by each sortable column and reverses the direction on a repeated click', () => {
    renderTable();

    clickHeader(UI_STRINGS.module2Sourcing.colSpend);
    expect(renderedRowLabels()).toEqual([LABEL_STEEL, LABEL_WELDING, LABEL_PIPE, LABEL_FASTENERS]);

    clickHeader(UI_STRINGS.module2Sourcing.colSpend);
    expect(renderedRowLabels()).toEqual([LABEL_FASTENERS, LABEL_PIPE, LABEL_WELDING, LABEL_STEEL]);

    clickHeader(UI_STRINGS.module2Sourcing.colSuppliers);
    expect(renderedRowLabels()).toEqual([LABEL_WELDING, LABEL_FASTENERS, LABEL_STEEL, LABEL_PIPE]);

    clickHeader(UI_STRINGS.module2Sourcing.colAddressableSpend);
    expect(renderedRowLabels()).toEqual([LABEL_STEEL, LABEL_WELDING, LABEL_PIPE, LABEL_FASTENERS]);

    clickHeader(UI_STRINGS.module2Sourcing.colNetOpp);
    expect(renderedRowLabels()).toEqual([LABEL_STEEL, LABEL_PIPE, LABEL_FASTENERS, LABEL_WELDING]);
  });

  it('highlights the row for the currently selected category', () => {
    renderTable({ selectedCategoryName: 'Welding Consumables' });

    expect(rowFor(LABEL_WELDING)).toHaveClass('bg-cyan-50/70');
    expect(rowFor(LABEL_STEEL)).not.toHaveClass('bg-cyan-50/70');
  });

  it('shows spend, opportunity, dispersion, and status values with their colour bands', () => {
    renderTable();
    const steelRow = rowFor(LABEL_STEEL);

    expect(within(steelRow).getByText(formatCrore(41.24))).toBeInTheDocument();
    expect(within(steelRow).getByText(formatCrore(38.5))).toBeInTheDocument();
    expect(within(steelRow).getByText(formatLakh(6185400))).toBeInTheDocument();
    expect(within(steelRow).getByText(formatLakh(2000000))).toBeInTheDocument();
    expect(within(steelRow).getByText(`-${formatLakh(1000000)}`)).toBeInTheDocument();
    expect(within(steelRow).getByText(formatLakh(8400000))).toBeInTheDocument();
    expect(within(steelRow).getByText('EXTREME')).toHaveClass('bg-red-100');
    expect(within(steelRow).getByText('3400')).toHaveClass('bg-blue-100');
    expect(within(steelRow).getByText('HIGH', { selector: 'span.bg-emerald-100' })).toBeInTheDocument();
  });

  it('colours the fragmentation, concentration, and suitability badges for each band', () => {
    renderTable();

    expect(within(rowFor(LABEL_WELDING)).getByText('HIGH')).toHaveClass('bg-amber-100');
    expect(within(rowFor(LABEL_WELDING)).getByText('2000')).toHaveClass('bg-amber-100');
    expect(within(rowFor(LABEL_FASTENERS)).getByText('MODERATE')).toHaveClass('bg-blue-100');
    expect(within(rowFor(LABEL_FASTENERS)).getByText('900')).toHaveClass('bg-purple-100');
    expect(within(rowFor(LABEL_FASTENERS)).getByText('LOW', { selector: 'span.bg-amber-100' })).toBeInTheDocument();
    expect(within(rowFor(LABEL_FASTENERS)).getByText('LOW', { selector: 'span.bg-slate-100' })).toBeInTheDocument();
    expect(within(rowFor(LABEL_PIPE)).getByText('LOW')).toHaveClass('bg-slate-100');
    expect(within(rowFor(LABEL_WELDING)).getByText('MEDIUM', { selector: 'span.bg-cyan-100' })).toBeInTheDocument();
  });

  it('shows the not-quantifiable and empty-value placeholders for categories without opportunity figures', () => {
    renderTable();
    const weldingRow = rowFor(LABEL_WELDING);

    expect(within(weldingRow).getAllByText('—')).toHaveLength(2);
    expect(within(rowFor(LABEL_FASTENERS)).getByText(`-${formatLakh(50000)}`)).toBeInTheDocument();
  });

  it('opens the calculation trace from a row without selecting the category', () => {
    const props = renderTable({ onOpenHowCalculated: vi.fn() });

    const [howCalculatedButton] = within(rowFor(LABEL_STEEL)).getAllByRole('button');
    fireEvent.click(howCalculatedButton);

    expect(props.onOpenHowCalculated).toHaveBeenCalledWith(steelPlates);
    expect(props.onSelectCategory).not.toHaveBeenCalled();
  });

  it('shows a dash for a missing consolidation value and zero for a zero net opportunity', () => {
    const gasketProfile = buildSteelPlateCategoryProfile({
      categoryId: 'CAT-GSK-001',
      categoryName: 'Gaskets',
      categoryMateriality: 'LOW',
      unspscCode: '40161500',
      potentialVendorConsolidationOpportunityInr: null,
      netQuantifiableOpportunityInr: 0,
      isQuantifiable: false,
      scorecard: {
        overallScore: 30,
        recommendation: 'NO_IMMEDIATE_SOURCING_ACTION',
        recommendationLabel: 'Gasket Hold',
        dimensions: [],
        justificationNotes: []
      }
    });
    renderTable({ profiles: [gasketProfile] });

    const gasketRow = rowFor('Gasket Hold');
    expect(within(gasketRow).getByText('—', { selector: 'td.text-purple-700' })).toBeInTheDocument();
    expect(within(gasketRow).getByText(formatLakh(0))).toBeInTheDocument();
  });

  it('selects a category from its deep-dive action only once', () => {
    const props = renderTable({ onOpenHowCalculated: vi.fn() });

    fireEvent.click(within(rowFor(LABEL_FASTENERS)).getByRole('button', { name: UI_STRINGS.module2Sourcing.btnViewDeepDive }));

    expect(props.onSelectCategory).toHaveBeenCalledTimes(1);
    expect(props.onSelectCategory).toHaveBeenCalledWith(industrialFasteners);
    expect(props.onOpenHowCalculated).not.toHaveBeenCalled();
  });

  it('selects a category when its row is clicked', () => {
    const props = renderTable();

    fireEvent.click(rowFor(LABEL_PIPE));

    expect(props.onSelectCategory).toHaveBeenCalledWith(pipeFittings);
  });

  it('runs the audit export from the controls bar', () => {
    const props = renderTable();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.module2Sourcing.btnExportAudit }));

    expect(props.onExportAudit).toHaveBeenCalledTimes(1);
  });
});
