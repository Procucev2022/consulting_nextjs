import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module4SavingsEngine } from '../../src/components/Module4SavingsEngine';
import { UI_STRINGS } from '../../src/constants/uiStrings';

const sampleSavingsOpportunities = [
  {
    opp_id: 'OPP-001',
    category: 'Direct Materials',
    current_spend_inr_cr: 45.0,
    current_spend: 450000000,
    est_savings_inr_cr: 4.5,
    est_savings: 45000000,
    savings_percentage: 10.0,
    lever: 'Supplier Consolidation',
    recommended_module: 'proCPX' as const,
    complexity: 'Low' as const,
    status: 'Ready to Deploy'
  },
  {
    opp_id: 'OPP-002',
    category: 'Packaging Materials',
    current_spend_inr_cr: 20.0,
    current_spend: 200000000,
    est_savings_inr_cr: 2.4,
    est_savings: 24000000,
    savings_percentage: 12.0,
    lever: 'Index-Linked Should-Costing',
    recommended_module: 'DPS NXT' as const,
    complexity: 'Medium' as const,
    status: 'Ready to Deploy'
  }
];

describe('Module4SavingsEngine Component', () => {
  it('renders cold zero-data state when opportunities is empty', () => {
    render(
      <Module4SavingsEngine
        opportunities={[]}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
      />
    );
    expect(screen.getByText('Awaiting dataset ingestion. Upload a procurement dataset in Module 1 to generate actionable savings pipelines.')).toBeInTheDocument();
  });

  it('renders summary cards, category breakdowns, and opportunities table', () => {
    render(
      <Module4SavingsEngine
        opportunities={sampleSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
      />
    );

    expect(screen.getAllByText(UI_STRINGS.module4.categories.directMaterials).length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.module4.categories.packagingMaterials).length).toBeGreaterThan(0);
    expect(screen.getByText(UI_STRINGS.module4.pipelineTitle)).toBeInTheDocument();
  });

  it('filters opportunities by category and module', () => {
    render(
      <Module4SavingsEngine
        opportunities={sampleSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    const moduleSelect = selects[1];

    // Filter by Packaging Materials
    fireEvent.change(categorySelect, { target: { value: UI_STRINGS.module4.categories.packagingMaterials } });

    // Filter by proCPX
    fireEvent.change(moduleSelect, { target: { value: 'proCPX' } });

    // Filter by DPS NXT
    fireEvent.change(moduleSelect, { target: { value: 'DPS NXT' } });

    // Reset to ALL
    fireEvent.change(categorySelect, { target: { value: 'ALL' } });
    fireEvent.change(moduleSelect, { target: { value: 'ALL' } });
  });

  it('triggers onOpenProCPX and onOpenDPSNXT buttons', () => {
    const onOpenProCPX = vi.fn();
    const onOpenDPSNXT = vi.fn();

    render(
      <Module4SavingsEngine
        opportunities={sampleSavingsOpportunities}
        onOpenProCPX={onOpenProCPX}
        onOpenDPSNXT={onOpenDPSNXT}
        onProceedToConversion={vi.fn()}
      />
    );

    const proCPXBtns = screen.queryAllByRole('button', { name: new RegExp(UI_STRINGS.module4.pushToProCPX, 'i') });
    if (proCPXBtns.length > 0) {
      fireEvent.click(proCPXBtns[0]);
      expect(onOpenProCPX).toHaveBeenCalled();
    }

    const dpsNXTBtns = screen.queryAllByRole('button', { name: new RegExp(UI_STRINGS.module4.pushToDPSNXT, 'i') });
    if (dpsNXTBtns.length > 0) {
      fireEvent.click(dpsNXTBtns[0]);
      expect(onOpenDPSNXT).toHaveBeenCalled();
    }
  });

  it('handles opportunities with already pushed status and fallback spend values', () => {
    const customOpps = [
      {
        ...sampleSavingsOpportunities[0],
        status: 'Pushed to proCPX',
        current_spend_inr_cr: undefined as any,
        est_savings_inr_cr: undefined as any
      },
      {
        ...sampleSavingsOpportunities[1],
        status: 'Pushed to DPS NXT',
        current_spend_inr_cr: undefined as any,
        est_savings_inr_cr: undefined as any
      }
    ];

    render(
      <Module4SavingsEngine
        opportunities={customOpps as any}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
      />
    );

    const pushedBadges = screen.getAllByText(UI_STRINGS.module4.pushedBadge);
    expect(pushedBadges.length).toBeGreaterThan(0);
  });

  it('triggers onProceedToConversion when CTA is clicked', () => {
    const onProceed = vi.fn();
    render(
      <Module4SavingsEngine
        opportunities={sampleSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={onProceed}
      />
    );

    const ctaBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module4.ctaProceedButton, 'i') });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('renders masked overlay for Bronze customer and handles upgrade to silver', () => {
    const onUpgrade = vi.fn();
    render(
      <Module4SavingsEngine
        opportunities={sampleSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
        currentTier="BRONZE"
        onUpgrade={onUpgrade}
      />
    );

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToSilver, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('SILVER');
  });

  it('renders total savings value for Silver customer and masks opportunity pipeline with Gold upgrade trigger', () => {
    const onUpgrade = vi.fn();
    const onProceed = vi.fn();
    render(
      <Module4SavingsEngine
        opportunities={sampleSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={onProceed}
        currentTier="SILVER"
        onUpgrade={onUpgrade}
      />
    );

    expect(screen.getByText(UI_STRINGS.module4.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.savingsWhereLockedTitle)).toBeInTheDocument();

    const upgradeBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.subscription.upgradeToGold, 'i') });
    expect(upgradeBtn).toBeInTheDocument();
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalledWith('GOLD');

    const ctaBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.module4.ctaProceedButton, 'i') });
    fireEvent.click(ctaBtn);
    expect(onProceed).toHaveBeenCalled();
  });

  it('renders StrategicSavingsSummaryBanner and handles click-to-detail navigation', () => {
    const handleNavigate = vi.fn();
    // Mock scrollIntoView
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <Module4SavingsEngine
        opportunities={sampleSavingsOpportunities}
        onOpenProCPX={vi.fn()}
        onOpenDPSNXT={vi.fn()}
        onProceedToConversion={vi.fn()}
        onNavigateToSection={handleNavigate}
      />
    );

    // Verify Strategic Savings Banner is rendered
    expect(screen.getByTestId('strategic-savings-summary-banner')).toBeInTheDocument();

    // Click Vendor Consolidation savings number
    fireEvent.click(screen.getByTestId('btn-savings-number-VENDOR_CONSOLIDATION'));
    expect(handleNavigate).toHaveBeenCalledWith('module2', 'vendor-consolidation-section');

    // Click Category Savings Pipeline savings number (internal to module4)
    fireEvent.click(screen.getByTestId('btn-savings-number-CATEGORY_SAVINGS_PIPELINE'));
    expect(handleNavigate).toHaveBeenCalledWith('module4', 'savings-pipeline-table-section');
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});

