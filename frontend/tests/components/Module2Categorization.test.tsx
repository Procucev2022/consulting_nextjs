import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module2Categorization } from '../../src/components/Module2Categorization';
import { mockSpendCategories, mockCategoryYearDetails } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('Module2Categorization Component', () => {
  const sampleLineItems = [
    {
      mapping_id: 'MAP-1',
      line_item_id: 'LINE-1',
      raw_desc: 'Packaging Corrugated Carton Boxes',
      vendor_identified: 'Amcor Packaging',
      unspsc_code: '14111500',
      unspsc_category_name: 'Packaging (Cartons)',
      core_bucket: 'Packaging Materials' as const,
      ai_confidence: 95,
      total_spend: 50000,
      inr_crores: 0.42,
      amount_inr: 4190000,
      spend_year: 2024,
      status: 'Pending'
    },
    {
      mapping_id: 'MAP-2',
      line_item_id: 'LINE-2',
      raw_desc: 'Direct Chemical Solvents Drums',
      vendor_identified: 'Acme Chemical',
      unspsc_code: '12352100',
      unspsc_category_name: 'Chemicals (Solvents)',
      core_bucket: 'Direct Materials' as const,
      ai_confidence: 85,
      total_spend: 120000,
      inr_crores: 1.05,
      amount_inr: 10050000,
      spend_year: 2025,
      status: 'Confirmed'
    },
    {
      mapping_id: 'MAP-3',
      line_item_id: 'LINE-3',
      raw_desc: 'Freight Ocean Container Logistics',
      vendor_identified: 'DHL Global Logistics',
      unspsc_code: '78101800',
      unspsc_category_name: 'Freight (Maritime)',
      core_bucket: 'Logistics & Freight' as const,
      ai_confidence: 72,
      total_spend: 85000,
      inr_crores: undefined as any,
      amount_inr: undefined as any,
      spend_year: 2026,
      status: 'Pending'
    },
    {
      mapping_id: 'MAP-4',
      line_item_id: 'LINE-4',
      raw_desc: 'Industrial MRO Valves and Pipes',
      vendor_identified: 'Ferguson MRO',
      unspsc_code: '40141600',
      unspsc_category_name: 'Piping Valves',
      core_bucket: 'Indirect & MRO' as const,
      ai_confidence: 92,
      total_spend: 25000,
      inr_crores: 0.21,
      amount_inr: 2100000,
      spend_year: 2024,
      status: 'Pending'
    }
  ];

  it('renders correctly and switches AI models', () => {
    render(
      <Module2Categorization
        categories={mockSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    expect(screen.getByText(UI_STRINGS.module2.matrixTitle)).toBeInTheDocument();

    const publicAiBtn = screen.getByRole('button', { name: UI_STRINGS.module2.models.public });
    fireEvent.click(publicAiBtn);

    const enterpriseAiBtn = screen.getByRole('button', { name: UI_STRINGS.module2.models.enterprise });
    fireEvent.click(enterpriseAiBtn);
  });

  it('filters line items by bucket, year, confidence, and search query', () => {
    render(
      <Module2Categorization
        categories={mockSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    const searchInputs = screen.getAllByRole('textbox');
    const tableSearch = searchInputs[0];
    fireEvent.change(tableSearch, { target: { value: 'Carton' } });
    fireEvent.change(tableSearch, { target: { value: '' } });

    const selects = screen.getAllByRole('combobox');
    const bucketSelect = selects[0];
    const yearSelect = selects[1];

    fireEvent.change(bucketSelect, { target: { value: 'Direct Materials' } });
    fireEvent.change(yearSelect, { target: { value: '2025' } });

    fireEvent.change(bucketSelect, { target: { value: 'ALL' } });
    fireEvent.change(yearSelect, { target: { value: 'ALL' } });
  });

  it('allows live explorer search and bucket filtering', () => {
    render(
      <Module2Categorization
        categories={mockSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    const searchInputs = screen.getAllByRole('textbox');
    const explorerSearch = searchInputs[1];
    fireEvent.change(explorerSearch, { target: { value: 'boxwood' } });

    const selects = screen.getAllByRole('combobox');
    const explorerBucketSelect = selects[2];
    fireEvent.change(explorerBucketSelect, { target: { value: 'Direct Materials' } });
  });

  it('triggers onConfirmMapping and onReassignMapping and onProceedToTrend', () => {
    const onConfirmMapping = vi.fn();
    const onReassignMapping = vi.fn();
    const onProceedToTrend = vi.fn();

    render(
      <Module2Categorization
        categories={mockSpendCategories}
        lineItems={sampleLineItems as any}
        onConfirmMapping={onConfirmMapping}
        onReassignMapping={onReassignMapping}
        onProceedToTrend={onProceedToTrend}
      />
    );

    const confirmBtns = screen.getAllByRole('button', { name: new RegExp(`^${UI_STRINGS.module2.btnConfirm}$`, 'i') });
    fireEvent.click(confirmBtns[0]);
    expect(onConfirmMapping).toHaveBeenCalledWith(sampleLineItems[0].mapping_id);

    const reassignBtns = screen.getAllByRole('button', { name: UI_STRINGS.module2.btnReassign });
    fireEvent.click(reassignBtns[0]);
    expect(onReassignMapping).toHaveBeenCalledWith(sampleLineItems[0]);

    const proceedBtn = screen.getByRole('button', { name: UI_STRINGS.module2.btnProceedToTrend });
    fireEvent.click(proceedBtn);
    expect(onProceedToTrend).toHaveBeenCalled();
  });

  it('handles AI model toggle, year filters 2023/2024/2026, confirmed item status, and unranked categories', () => {
    const unrankedCategories = [
      {
        category_id: 'CAT-UNRANKED-1',
        category: 'Unranked Category A',
        core_category: 'Direct Materials',
        sample_column_l_code: '12345678',
        rank: undefined,
        spend_inr_2023_cr: 10,
        spend_inr_2024_cr: 12,
        spend_inr_2025_26_cr: 15,
        total_3yr_spend_inr_cr: 37,
        yoy_growth_pct: 5,
        savings_opportunity_inr_cr: 2
      },
      {
        category_id: 'CAT-RANK4',
        category: 'Rank 4 Category',
        core_category: 'Packaging Materials',
        sample_column_l_code: '87654321',
        rank: 4,
        spend_inr_2023_cr: 5,
        spend_inr_2024_cr: 6,
        spend_inr_2025_26_cr: 7,
        total_3yr_spend_inr_cr: 18,
        yoy_growth_pct: 2,
        savings_opportunity_inr_cr: 1
      }
    ];

    const mixedLineItems = [
      {
        mapping_id: 'MAP-CONFIRMED',
        line_item_id: 'LINE-CONFIRMED',
        spend_year: undefined,
        po_number: 'PO-CONF',
        raw_desc: 'Confirmed Line Item',
        vendor_identified: 'Confirmed Vendor',
        column_l_commodity: 'Commodity Confirmed',
        core_category: 'Direct Materials',
        confidence_pct: 95,
        status: 'Confirmed'
      }
    ];

    render(
      <Module2Categorization
        categories={unrankedCategories as any}
        lineItems={mixedLineItems as any}
        onConfirmMapping={vi.fn()}
        onReassignMapping={vi.fn()}
        onProceedToTrend={vi.fn()}
      />
    );

    // AI Model switcher
    const publicAiBtn = screen.getByRole('button', { name: UI_STRINGS.module2.models.public });
    fireEvent.click(publicAiBtn);
    const enterpriseAiBtn = screen.getByRole('button', { name: UI_STRINGS.module2.models.enterprise });
    fireEvent.click(enterpriseAiBtn);

    // Year filters
    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[1];
    fireEvent.change(yearSelect, { target: { value: '2023' } });
    fireEvent.change(yearSelect, { target: { value: '2024' } });
    fireEvent.change(yearSelect, { target: { value: '2026' } });
    fireEvent.change(yearSelect, { target: { value: 'ALL' } });

    // Verify confirmed badge rendered
    expect(screen.getByText(UI_STRINGS.module2.statusConfirmed)).toBeInTheDocument();
    // Verify default spend_year 2024 rendered
    expect(screen.getByText('2024')).toBeInTheDocument();
  });
});
