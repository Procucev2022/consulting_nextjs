import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { VolumeAggregationMaterialTab } from '../../../src/components/module2/VolumeAggregationMaterialTab';
import type { MaterialVolumeProfile } from '../../../src/types/module2VolumeAggregation';

const UOM_WARNING = /Ambiguous UOM/;
const DEMAND_EVIDENCE = 'Orders cluster in the first quarter of each year.';

const buildMaterial = (overrides: Partial<MaterialVolumeProfile> = {}): MaterialVolumeProfile => ({
  materialId: 'MAT-BRG-6204',
  materialCode: 'MAT-BRG-6204',
  materialDesc: 'Bearing 6204 2RS',
  category: 'Mechanical Spares',
  unspscCode: '31171504',
  baseUom: 'EA',
  totalQuantity: 500,
  totalSpendInr: 100000,
  totalSpendCr: 0.01,
  wavgPriceInr: 200,
  demandClassification: 'RECURRING',
  orderCount: 5,
  plantCount: 2,
  supplierCount: 2,
  plantVolumeDispersionIndex: 0.4,
  hasIncompatibleUom: false,
  excludedQuantity: 0,
  ...overrides
});

const plateMaterial = buildMaterial({
  materialId: 'MAT-PLT-10MM',
  materialCode: 'MAT-PLT-10MM',
  materialDesc: 'IS 2062 E250 BR Plate 10mm',
  category: 'Structural Steel',
  unspscCode: '30101704',
  baseUom: 'MT',
  totalQuantity: 6500,
  totalSpendInr: 412360000,
  totalSpendCr: 41.236,
  wavgPriceInr: 63440,
  demandClassification: 'PERIODIC_SEASONAL',
  demandClassificationEvidence: DEMAND_EVIDENCE,
  hasIncompatibleUom: true,
  plantVolumeDispersionIndex: 0.18
});

const bearingMaterial = buildMaterial({});

const rowFor = (materialCode: string): HTMLElement => {
  const row = screen.getByText(materialCode).closest('tr');
  if (!row) {
    throw new Error(`No material row contains "${materialCode}"`);
  }
  return row;
};

describe('VolumeAggregationMaterialTab coverage paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders each material with its code, unit, spend, demand class, and dispersion index', () => {
    render(<VolumeAggregationMaterialTab materialProfiles={[bearingMaterial, plateMaterial]} />);

    const plateRow = rowFor('MAT-PLT-10MM');
    expect(within(plateRow).getByText('IS 2062 E250 BR Plate 10mm')).toBeInTheDocument();
    expect(within(plateRow).getByText('₹41.2360')).toBeInTheDocument();
    expect(within(plateRow).getByText('PERIODIC SEASONAL')).toBeInTheDocument();
    expect(within(plateRow).getByText('0.18')).toBeInTheDocument();
    expect(within(plateRow).getByText((6500).toLocaleString())).toBeInTheDocument();

    const bearingRow = rowFor('MAT-BRG-6204');
    expect(within(bearingRow).getByText('RECURRING')).toBeInTheDocument();
    expect(within(bearingRow).getByText('0.40')).toBeInTheDocument();
  });

  it('shows the evidence for a demand classification as a tooltip on the badge', () => {
    render(<VolumeAggregationMaterialTab materialProfiles={[plateMaterial]} />);

    expect(screen.getByTitle(DEMAND_EVIDENCE)).toHaveTextContent('PERIODIC SEASONAL');
  });

  it('flags materials whose units of measure are incompatible and leaves the others unflagged', () => {
    render(<VolumeAggregationMaterialTab materialProfiles={[bearingMaterial, plateMaterial]} />);

    expect(within(rowFor('MAT-PLT-10MM')).getByText(UOM_WARNING)).toBeInTheDocument();
    expect(within(rowFor('MAT-BRG-6204')).queryByText(UOM_WARNING)).not.toBeInTheDocument();
  });

  it('filters by material code, description, category, and UNSPSC code, and shows no rows for unmatched text', () => {
    render(<VolumeAggregationMaterialTab materialProfiles={[bearingMaterial, plateMaterial]} />);
    const filterBox = screen.getByRole('textbox');

    fireEvent.change(filterBox, { target: { value: 'mat-plt' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('MAT-PLT-10MM')).toBeInTheDocument();

    fireEvent.change(filterBox, { target: { value: 'mechanical' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('MAT-BRG-6204')).toBeInTheDocument();

    fireEvent.change(filterBox, { target: { value: '30101704' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('MAT-PLT-10MM')).toBeInTheDocument();

    fireEvent.change(filterBox, { target: { value: 'bearing' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('MAT-BRG-6204')).toBeInTheDocument();

    fireEvent.change(filterBox, { target: { value: 'no such material' } });
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('limits the table to the first 100 materials', () => {
    const bulkMaterials = Array.from({ length: 105 }, (_, index) =>
      buildMaterial({
        materialId: `MAT-BULK-${index}`,
        materialCode: `MAT-BULK-${index}`,
        materialDesc: `Bulk item ${index}`
      })
    );

    render(<VolumeAggregationMaterialTab materialProfiles={bulkMaterials} />);

    expect(screen.getAllByRole('row')).toHaveLength(101);
    expect(screen.queryByText('MAT-BULK-100')).not.toBeInTheDocument();
  });
});
