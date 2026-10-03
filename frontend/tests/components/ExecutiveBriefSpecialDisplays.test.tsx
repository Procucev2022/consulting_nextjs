import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefSpecialDisplays } from '../../src/components/executiveBrief/ExecutiveBriefSpecialDisplays';
import {
  PO_CONSOLIDATION_DISPLAY_DATA,
  VENDOR_CONSOLIDATION_DISPLAY_DATA,
  BENCHMARK_SPECIAL_DISPLAY_DATA,
  REALIZATION_ROADMAP_STAGES
} from '../../src/constants';

describe('ExecutiveBriefSpecialDisplays', () => {
  const po = PO_CONSOLIDATION_DISPLAY_DATA;
  const vc = VENDOR_CONSOLIDATION_DISPLAY_DATA;
  const bm = BENCHMARK_SPECIAL_DISPLAY_DATA;

  it('renders Section 12 PO Consolidation visual model with non-monetary effort metrics', () => {
    render(<ExecutiveBriefSpecialDisplays />);

    expect(screen.getByText('PO Consolidation — Operational Productivity Model')).toBeInTheDocument();
    expect(screen.getByText(po.currentStatePOs)).toBeInTheDocument();
    expect(screen.getByText(po.optimizedStatePOs)).toBeInTheDocument();
    expect(screen.getByText(po.transactionReductionPercent)).toBeInTheDocument();
    expect(screen.getByText(po.processEffortReductionLabel)).toBeInTheDocument();
    expect(screen.getByText(po.monetarySavingsLabel)).toBeInTheDocument();
  });

  it('renders Section 13 Vendor Consolidation volume leverage model and 7-step plan', () => {
    render(<ExecutiveBriefSpecialDisplays />);

    expect(screen.getByText('Vendor Consolidation — Volume Discount Model')).toBeInTheDocument();
    expect(screen.getByText(vc.currentSuppliers)).toBeInTheDocument();
    expect(screen.getByText(vc.targetSuppliers)).toBeInTheDocument();
    expect(screen.getByText(vc.indicativeOpportunityCr)).toBeInTheDocument();
    expect(screen.getByText('7-Step Sourcing Realization Plan:')).toBeInTheDocument();
    expect(screen.getByText(vc.realizationSteps[0])).toBeInTheDocument();
  });

  it('renders Section 14 Benchmark price gap and Section 15 Realization Roadmap', () => {
    render(<ExecutiveBriefSpecialDisplays />);

    expect(screen.getByText('PCBI Market Benchmark — Independent Price Gap')).toBeInTheDocument();
    expect(screen.getByText(bm.currentPrice)).toBeInTheDocument();
    expect(screen.getByText(bm.benchmarkPrice)).toBeInTheDocument();
    expect(screen.getByText(bm.priceGap)).toBeInTheDocument();

    expect(screen.getByText('5-Phase Procurement Realization Roadmap')).toBeInTheDocument();
    for (const stage of REALIZATION_ROADMAP_STAGES) {
      expect(screen.getByText(stage.period)).toBeInTheDocument();
      expect(screen.getByText(stage.title)).toBeInTheDocument();
    }
  });

  it('triggers onSelectLever callback when cards are clicked', () => {
    const onSelect = vi.fn();
    render(<ExecutiveBriefSpecialDisplays onSelectLever={onSelect} />);

    fireEvent.click(screen.getByText('PO Consolidation — Operational Productivity Model'));
    expect(onSelect).toHaveBeenCalledWith('po_consolidation');

    fireEvent.click(screen.getByText('Vendor Consolidation — Volume Discount Model'));
    expect(onSelect).toHaveBeenCalledWith('vendor_consolidation');

    fireEvent.click(screen.getByText('PCBI Market Benchmark — Independent Price Gap'));
    expect(onSelect).toHaveBeenCalledWith('benchmark_gap');
  });

  it('handles clicks safely when onSelectLever is undefined', () => {
    render(<ExecutiveBriefSpecialDisplays />);
    expect(() => {
      fireEvent.click(screen.getByText('PO Consolidation — Operational Productivity Model'));
    }).not.toThrow();
  });
});
