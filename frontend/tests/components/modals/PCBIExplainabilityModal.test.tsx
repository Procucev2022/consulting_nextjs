import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBIExplainabilityModal } from '../../../src/components/modals/PCBIExplainabilityModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { PCBIExplainabilityAudit } from '../../../src/types/pcbi';

const mockAudit: PCBIExplainabilityAudit = {
  transaction_id: 'TX-001',
  po_number: 'PO-2024-001',
  material_code: 'MAT-BRG-6205',
  material_description: 'Deep Groove Ball Bearing 6205',
  vendor: 'SKF India Ltd',
  sector: 'Manufacturing',
  category: '31171504 - Ball Bearings',
  pcbi_id: 'PCBI-BRG-01',
  benchmark_name: 'Bearing Multi-Constituent Benchmark (Steel + Rubber + Conversion)',
  quality_rating: 'B',
  base_purchase: {
    po_number: 'PO-2023-001',
    date: '2023-07-15',
    price: 150.0,
    pcbi_index: 105.0,
    quantity: 10000
  },
  current_purchase: {
    po_number: 'PO-2024-001',
    date: '2023-09-30',
    price: 180.0,
    pcbi_index: 110.0,
    quantity: 10000
  },
  benchmarkability_percent: 70.0,
  residual_percent: 30.0,
  formula_display: 'P_exp = 150.00 * (110.0 / 105.0) = 157.14',
  residual_component_value: 45.0,
  benchmark_adjusted_component_value: 112.14,
  expected_price: 157.14,
  actual_price: 180.0,
  price_gap_per_unit: 22.86,
  quantity: 10000,
  opportunity_value: 160020,
  opportunity_value_lakhs: 1.6,
  opportunity_value_crores: 0.016,
  favourable_variance: 0,
  favourable_variance_lakhs: 0,
  favourable_variance_crores: 0,
  is_composite: false
};

describe('PCBIExplainabilityModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(
      <PCBIExplainabilityModal
        isOpen={false}
        onClose={vi.fn()}
        audit={mockAudit}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders explainability details when isOpen is true with custom audit', () => {
    const handleClose = vi.fn();
    render(
      <PCBIExplainabilityModal
        isOpen={true}
        onClose={handleClose}
        audit={mockAudit}
      />
    );

    expect(screen.getByText(UI_STRINGS.module3.explainability.modalTitle)).toBeInTheDocument();
    expect(screen.getAllByText(/31171504 - Ball Bearings/)[0]).toBeInTheDocument();
    expect(screen.getByText('Quality B')).toBeInTheDocument();
    expect(screen.getByText('70% Benchmarkable')).toBeInTheDocument();
    expect(screen.getByText(/Special Alloy Steel/)).toBeInTheDocument();
    expect(screen.getByText(/Nitrile Synthetic Rubber/)).toBeInTheDocument();
    expect(screen.getByText(/Conversion Cost & Heat Treatment/)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: UI_STRINGS.common.close });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders default fallback audit values when audit prop is null', () => {
    const handleClose = vi.fn();
    render(
      <PCBIExplainabilityModal
        isOpen={true}
        onClose={handleClose}
        audit={null}
      />
    );

    expect(screen.getByText(UI_STRINGS.module3.explainability.modalTitle)).toBeInTheDocument();
    expect(screen.getByText(/Bearing Multi-Constituent Benchmark/)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: UI_STRINGS.common.close });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
