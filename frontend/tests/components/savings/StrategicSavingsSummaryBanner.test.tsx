import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategicSavingsSummaryBanner } from '../../../src/components/savings/StrategicSavingsSummaryBanner';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { StrategicSavingsSummaryMetrics } from '../../../src/types/savingsInitiatives';

const mockMetrics: StrategicSavingsSummaryMetrics = {
  grandTotalSpendInrCr: 613.88,
  grandTotalSavingsInrCr: 85.64,
  netModelledOpportunityInrCr: 85.64,
  grossOpportunityInrCr: 110.76,
  overlapDeductionsInrCr: 25.12,
  provenOpportunityInrCr: 82.38,
  discoveryOpportunityInrCr: 3.261,
  realizedSavingsInrCr: 0,
  addressableSpendInrCr: 315.02,
  overallSavingsPct: 13.9,
  module2SpendInrCr: 315.02,
  module2SavingsInrCr: 85.64,
  module4SpendInrCr: 0,
  module4SavingsInrCr: 0,
  initiativesCount: 5,
  initiatives: [
    {
      key: 'VENDOR_CONSOLIDATION',
      title: 'Strategic Vendor Consolidation',
      subtitle: 'Consolidate fragmented vendor base',
      badge: 'LEVER 1',
      sourceLabel: 'Module 2 AI',
      lever: 'Vendor Rationalization',
      executionPlatform: 'ProCPX',
      iconName: 'gavel',
      accentColor: 'cyan',
      targetModule: 'module2',
      targetSectionId: 'vendor-consolidation-section',
      spendInrCr: 315.02,
      savingsInrCr: 35.0,
      savingsPct: 11.1,
      source: 'MODULE2_AI_CATEGORIZATION'
    },
    {
      key: 'PO_CONSOLIDATION',
      title: 'PO Volume Bundling',
      subtitle: 'Consolidate fragmented purchase orders',
      badge: 'LEVER 2',
      sourceLabel: 'Module 2 AI',
      lever: 'Volume Bundling',
      executionPlatform: 'ProCPX',
      iconName: 'fileSpreadsheet',
      accentColor: 'blue',
      targetModule: 'module2',
      targetSectionId: 'po-consolidation-section',
      spendInrCr: 315.02,
      savingsInrCr: 20.0,
      savingsPct: 6.3,
      source: 'MODULE2_AI_CATEGORIZATION'
    },
    {
      key: 'STRATEGIC_SINGLE_VENDOR',
      title: 'E-Auction and Strategic Sourcing',
      subtitle: 'Competitive bidding for addressable categories',
      badge: 'LEVER 3',
      sourceLabel: 'Module 2 E-Auction',
      lever: 'Competitive E-Auction',
      executionPlatform: 'ProCPX',
      iconName: 'shieldAlert',
      accentColor: 'rose',
      targetModule: 'module2',
      targetSectionId: 'e-auction-section',
      spendInrCr: 218.24,
      savingsInrCr: 18.18,
      savingsPct: 8.3,
      source: 'MODULE2_AI_CATEGORIZATION'
    },
    {
      key: 'VENDOR_SUPPLY_RATIONALIZATION',
      title: 'Vendor Supply Rationalization',
      subtitle: 'Rationalize low-value indirect vendors',
      badge: 'LEVER 4',
      sourceLabel: 'Module 4 Engine',
      lever: 'Supply Rationalization',
      executionPlatform: 'DPS NXT',
      iconName: 'layers',
      accentColor: 'purple',
      targetModule: 'module4',
      targetSectionId: 'savings-pipeline-table-section',
      spendInrCr: 0,
      savingsInrCr: 8.12,
      savingsPct: 0,
      source: 'MODULE4_SAVINGS_ENGINE'
    },
    {
      key: 'CATEGORY_SAVINGS_PIPELINE',
      title: 'Category Specialist Pipeline',
      subtitle: 'Specialist category-led opportunity pipeline',
      badge: 'LEVER 5',
      sourceLabel: 'Module 4 Engine',
      lever: 'Category Management',
      executionPlatform: 'DPS NXT',
      iconName: 'zap',
      accentColor: 'emerald',
      targetModule: 'module4',
      targetSectionId: 'savings-pipeline-table-section',
      spendInrCr: 5.0,
      savingsInrCr: 4.34,
      savingsPct: 86.8,
      source: 'MODULE4_SAVINGS_ENGINE'
    }
  ]
};

describe('StrategicSavingsSummaryBanner', () => {
  it('renders the banner wrapper', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByTestId('strategic-savings-summary-banner')).toBeInTheDocument();
  });

  it('renders heading, subheading, and badge from UI_STRINGS', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.badge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.heading)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.subheading)).toBeInTheDocument();
  });

  it('renders the grand total savings as main headline', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByTestId('grand-total-savings-number')).toHaveTextContent('85.64');
  });

  it('renders the grand total title', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.grandTotalTitle)).toBeInTheDocument();
  });

  it('renders overlap deductions amount with negative prefix', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText('-₹25.12 Cr')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.overlapDeductionsLabel)).toBeInTheDocument();
  });

  it('renders gross opportunity, proven, discovery, realized labels', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.grossOpportunityLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.provenOpportunityLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.discoveryOpportunityLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.realizedSavingsLabel)).toBeInTheDocument();
  });

  it('renders spend eligibility architecture callout text', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText('Spend Eligibility Architecture:')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.spendEligibilityExplanation)).toBeInTheDocument();
  });

  it('renders governance notice', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.governanceNotice)).toBeInTheDocument();
  });

  it('renders all 5 initiative card test-ids', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    ['VENDOR_CONSOLIDATION','PO_CONSOLIDATION','STRATEGIC_SINGLE_VENDOR',
     'VENDOR_SUPPLY_RATIONALIZATION','CATEGORY_SAVINGS_PIPELINE'].forEach((key) => {
      expect(screen.getByTestId(`initiative-card-${key}`)).toBeInTheDocument();
    });
  });

  it('shows card spend notice for initiatives with spend > 0', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    const notices = screen.getAllByText(UI_STRINGS.savingsInitiativesSummary.cardSpendNotice);
    expect(notices.length).toBeGreaterThan(0);
  });

  it('module2 subtotal btn calls onNavigateToSection', () => {
    const onNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} onNavigateToSection={onNavigate} />);
    fireEvent.click(screen.getByTestId('btn-subtotal-module2'));
    expect(onNavigate).toHaveBeenCalledWith('module2', 'vendor-consolidation-section');
  });

  it('module4 subtotal btn calls onNavigateToSection', () => {
    const onNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} onNavigateToSection={onNavigate} />);
    fireEvent.click(screen.getByTestId('btn-subtotal-module4'));
    expect(onNavigate).toHaveBeenCalledWith('module4', 'savings-pipeline-table-section');
  });

  it('card savings button calls onNavigateToSection with initiative target', () => {
    const onNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} onNavigateToSection={onNavigate} />);
    fireEvent.click(screen.getByTestId('btn-savings-number-VENDOR_CONSOLIDATION'));
    expect(onNavigate).toHaveBeenCalledWith('module2', 'vendor-consolidation-section');
  });

  it('table savings button calls onNavigateToSection', () => {
    const onNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} onNavigateToSection={onNavigate} />);
    fireEvent.click(screen.getByTestId('btn-table-savings-PO_CONSOLIDATION'));
    expect(onNavigate).toHaveBeenCalledWith('module2', 'po-consolidation-section');
  });

  it('table action button calls onNavigateToSection', () => {
    const onNavigate = vi.fn();
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} onNavigateToSection={onNavigate} />);
    fireEvent.click(screen.getByTestId('btn-table-action-STRATEGIC_SINGLE_VENDOR'));
    expect(onNavigate).toHaveBeenCalledWith('module2', 'e-auction-section');
  });

  it('does not throw when onNavigateToSection is omitted', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(() => fireEvent.click(screen.getByTestId('btn-savings-number-CATEGORY_SAVINGS_PIPELINE'))).not.toThrow();
    expect(() => fireEvent.click(screen.getByTestId('btn-subtotal-module2'))).not.toThrow();
  });

  it('falls back to default metrics when summaryMetrics is omitted', () => {
    render(<StrategicSavingsSummaryBanner />);
    expect(screen.getByTestId('strategic-savings-summary-banner')).toBeInTheDocument();
    expect(screen.getByTestId('grand-total-savings-number')).toBeInTheDocument();
  });

  it('renders all 5 initiative titles (covers all icon branches)', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getAllByText('Strategic Vendor Consolidation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PO Volume Bundling').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('E-Auction and Strategic Sourcing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Vendor Supply Rationalization').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Category Specialist Pipeline').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the initiatives comparison table headers', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableHeaders.initiative)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableHeaders.evaluatedSpend)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableHeaders.targetPct)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableHeaders.savingsPotential)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableHeaders.executionLever)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableHeaders.action)).toBeInTheDocument();
  });

  it('renders execution platforms in table rows', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getAllByText('ProCPX').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('DPS NXT').length).toBeGreaterThanOrEqual(2);
  });

  it('renders overall savings pct badge in header and hero', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    const pct = UI_STRINGS.savingsInitiativesSummary.overallSavingsPctLabel(13.9);
    expect(screen.getAllByText(pct).length).toBeGreaterThanOrEqual(2);
  });

  it('renders initiativesCount badge', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.initiativesTrackedBadge(5))).toBeInTheDocument();
  });

  it('renders grand total spend note', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.grandTotalSpendNote(613.88))).toBeInTheDocument();
  });

  it('renders review detail action label on card savings buttons', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getAllByText(UI_STRINGS.savingsInitiativesSummary.reviewDetailAction).length).toBeGreaterThanOrEqual(5);
  });

  it('renders table subtitle', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByText(UI_STRINGS.savingsInitiativesSummary.tableSubtitle)).toBeInTheDocument();
  });

  it('renders VENDOR_SUPPLY_RATIONALIZATION card with zero spend without crash', () => {
    render(<StrategicSavingsSummaryBanner summaryMetrics={mockMetrics} />);
    expect(screen.getByTestId('initiative-card-VENDOR_SUPPLY_RATIONALIZATION')).toBeInTheDocument();
  });
});
