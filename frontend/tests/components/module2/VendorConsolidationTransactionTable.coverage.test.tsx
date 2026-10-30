import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { VendorConsolidationTransactionTable } from '../../../src/components/module2/VendorConsolidationTransactionTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { VENDOR_CONSOLIDATION_UI_CONFIG } from '../../../src/constants/module2VendorConsolidation';
import { buildSameMaterialOpportunity } from '../../fixtures/vendorConsolidation';

const strings = UI_STRINGS.module2VendorConsolidation;
const common = UI_STRINGS.common;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VendorConsolidationTransactionTable coverage', () => {
  it('renders the empty state and a zero count when the opportunity has no transactions array', () => {
    const opportunity = buildSameMaterialOpportunity({ transactions: undefined });
    render(<VendorConsolidationTransactionTable opportunity={opportunity} onBackToMaterials={vi.fn()} />);

    expect(screen.getByText(strings.noTransactionRecords)).toBeDefined();
    expect(screen.getByText(strings.transactionSubtitle(opportunity.materialDesc, 0))).toBeDefined();
  });

  it('renders placeholder values for every missing transaction field', () => {
    // Required fields are present but falsy, so every `||` fallback in the table is taken.
    const sparseTransaction = {
      id: 'TX-SPARSE',
      vendor_name: '',
      material_desc: '',
      quantity: 0,
      unit_price: 0,
      total_spend_inr: 0
    };
    const opportunity = buildSameMaterialOpportunity({ transactions: [sparseTransaction] });
    render(<VendorConsolidationTransactionTable opportunity={opportunity} onBackToMaterials={vi.fn()} />);

    expect(screen.getAllByText(common.notAvailable)).toHaveLength(2);
    expect(screen.getByText(VENDOR_CONSOLIDATION_UI_CONFIG.DEFAULT_PO_LINE)).toBeDefined();
    expect(screen.getByText(strings.unknownVendor)).toBeDefined();
    expect(screen.getByText(strings.defaultPlantLabel)).toBeDefined();
    expect(screen.getByText(`0 ${VENDOR_CONSOLIDATION_UI_CONFIG.DEFAULT_UOM}`)).toBeDefined();
    expect(screen.getByText(strings.formatRupees('0.00'))).toBeDefined();
    expect(screen.getByText(strings.formatRupees('0'))).toBeDefined();
  });

  it('falls back to the vendor code when the vendor name is blank', () => {
    const opportunity = buildSameMaterialOpportunity({
      transactions: [
        {
          id: 'TX-CODE',
          po_number: 'PO-777',
          vendor_name: '',
          vendor_code: 'V009',
          material_desc: '',
          quantity: 0,
          unit_price: 0,
          total_spend_inr: 0
        }
      ]
    });
    render(<VendorConsolidationTransactionTable opportunity={opportunity} onBackToMaterials={vi.fn()} />);

    expect(screen.getByText('V009')).toBeDefined();
    expect(screen.getByText('PO-777')).toBeDefined();
  });

  it('formats populated quantities and amounts with locale-aware separators', () => {
    const opportunity = buildSameMaterialOpportunity({
      transactions: [
        {
          id: 'TX-FULL',
          po_number: 'PO-900',
          po_line: '4',
          po_date: '2024-01-05',
          vendor_name: 'Delta Traders',
          material_desc: 'Corrugated Box 10x10',
          plant: 'PLANT-C',
          quantity: 1000,
          uom: 'KG',
          unit_price: 12.5,
          total_spend_inr: 12500
        }
      ]
    });
    render(<VendorConsolidationTransactionTable opportunity={opportunity} onBackToMaterials={vi.fn()} />);

    expect(screen.getByText('PO-900')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('2024-01-05')).toBeDefined();
    expect(screen.getByText('Delta Traders')).toBeDefined();
    expect(screen.getByText('PLANT-C')).toBeDefined();
    expect(screen.getByText(`${(1000).toLocaleString()} KG`)).toBeDefined();
    expect(screen.getByText(strings.formatRupees((12.5).toFixed(2)))).toBeDefined();
    expect(screen.getByText(strings.formatRupees((12500).toLocaleString()))).toBeDefined();
  });

  it('shows the drill-down subtitle with the transaction count and calls onBackToMaterials', () => {
    const onBack = vi.fn();
    const opportunity = buildSameMaterialOpportunity();
    render(<VendorConsolidationTransactionTable opportunity={opportunity} onBackToMaterials={onBack} />);

    expect(screen.getByText(strings.transactionSubtitle(opportunity.materialDesc, 2))).toBeDefined();
    expect(
      screen.getByText(strings.breadcrumbTrail(strings.breadcrumbMaterial(opportunity.materialCode), strings.breadcrumbTxs))
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToMaterials }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
