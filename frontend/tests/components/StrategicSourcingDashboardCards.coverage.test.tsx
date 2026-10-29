import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrategicSourcingDashboardCards } from '../../src/components/module2/StrategicSourcingDashboardCards';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { Module2StrategicSourcingDashboardSummary } from '../../src/types/module2StrategicSourcing';

const strings = UI_STRINGS.module2Sourcing;
const HOW_CALCULATED_NAME = /how calculated/i;

const formatCrore = (value: number): string => `₹${value.toFixed(2)} Cr`;
const formatCroreRange = (min: number, max: number): string => `₹${min.toFixed(2)} – ₹${max.toFixed(2)} Cr`;

const buildSummary = (
  overrides: Partial<Module2StrategicSourcingDashboardSummary> = {}
): Module2StrategicSourcingDashboardSummary => ({
  totalAddressableSpendInr: 15000000,
  totalAddressableSpendInrCr: 1.5,
  totalPotentialEAuctionOpportunityInr: 500000,
  totalPotentialEAuctionOpportunityInrCr: 0.05,
  totalPotentialConsolidationOpportunityInr: 200000,
  totalPotentialConsolidationOpportunityInrCr: 0.02,
  totalOverlappingOpportunityInr: 200000,
  totalOverlappingOpportunityInrCr: 0.02,
  netQuantifiableOpportunityInr: 500000,
  netQuantifiableOpportunityInrCr: 0.05,
  categoriesReadyForSourcingCount: 3,
  eauctionCandidatesCount: 2,
  consolidationCandidatesCount: 2,
  opportunitiesNotYetQuantifiableCount: 1,
  overallDataConfidence: 'HIGH',
  categoriesAnalyzedCount: 4,
  totalSpendAnalyzedInr: 18000000,
  totalSpendAnalyzedInrCr: 1.8,
  calculationTimestamp: '2026-09-29T12:00:00.000Z',
  ...overrides
});

const cardFor = (title: string): HTMLElement => {
  const card = screen.getByText(title).closest('button');
  if (!card) {
    throw new Error(`No KPI card is titled "${title}"`);
  }
  return card;
};

describe('StrategicSourcingDashboardCards coverage paths', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the summary value of each KPI card', () => {
    render(<StrategicSourcingDashboardCards summary={buildSummary()} />);

    expect(screen.getByText(strings.title)).toBeInTheDocument();
    expect(within(cardFor(strings.cardAddressableSpend)).getByText(formatCrore(1.5))).toBeInTheDocument();
    expect(within(cardFor(strings.cardProvenOpp)).getByText(formatCrore(0.05))).toBeInTheDocument();
    expect(within(cardFor(strings.cardEAuctionOpp)).getByText(formatCrore(0.05))).toBeInTheDocument();
    expect(within(cardFor(strings.cardConsolidationOpp)).getByText(formatCrore(0.02))).toBeInTheDocument();
    expect(within(cardFor(strings.cardOverlapOpp)).getByText(`-${formatCrore(0.02)}`)).toBeInTheDocument();
    expect(within(cardFor(strings.cardNetDefensibleRange)).getByText(formatCrore(0.05))).toBeInTheDocument();
    expect(within(cardFor(strings.cardMarketDiscovery)).getByText('2')).toBeInTheDocument();
    expect(within(cardFor(strings.cardNotQuantifiable)).getByText('1')).toBeInTheDocument();
    expect(within(cardFor(strings.cardDataConfidence)).getByText('HIGH')).toBeInTheDocument();
  });

  it('shows the quantifiable and net defensible ranges when range bounds are provided', () => {
    render(
      <StrategicSourcingDashboardCards
        summary={buildSummary({
          quantifiableRangeMinInrCr: 0.02,
          quantifiableRangeMaxInrCr: 0.09,
          overallNetDefensibleOpportunityMinInrCr: 0.03,
          overallNetDefensibleOpportunityMaxInrCr: 0.07
        })}
      />
    );

    expect(within(cardFor(strings.cardQuantifiableRange)).getByText(formatCroreRange(0.02, 0.09))).toBeInTheDocument();
    expect(within(cardFor(strings.cardNetDefensibleRange)).getByText(formatCroreRange(0.03, 0.07))).toBeInTheDocument();
  });

  it('uses the net opportunity as the lower bound when only the net range maximum is provided', () => {
    render(<StrategicSourcingDashboardCards summary={buildSummary({ overallNetDefensibleOpportunityMaxInrCr: 0.07 })} />);

    expect(within(cardFor(strings.cardNetDefensibleRange)).getByText(formatCroreRange(0.05, 0.07))).toBeInTheDocument();
  });

  it('uses zero as the lower quantifiable bound when only the maximum is provided', () => {
    render(<StrategicSourcingDashboardCards summary={buildSummary({ quantifiableRangeMaxInrCr: 0.09 })} />);

    expect(within(cardFor(strings.cardQuantifiableRange)).getByText(formatCroreRange(0, 0.09))).toBeInTheDocument();
  });

  it('omits the quantifiable range text when no range bounds are provided', () => {
    render(<StrategicSourcingDashboardCards summary={buildSummary()} />);

    expect(within(cardFor(strings.cardQuantifiableRange)).queryByText(/–/)).not.toBeInTheDocument();
  });

  it('uses the proven opportunity and market discovery counts when they are supplied', () => {
    render(
      <StrategicSourcingDashboardCards summary={buildSummary({ provenOpportunityInrCr: 0.04, marketDiscoveryCandidatesCount: 7 })} />
    );

    expect(within(cardFor(strings.cardProvenOpp)).getByText(formatCrore(0.04))).toBeInTheDocument();
    expect(within(cardFor(strings.cardMarketDiscovery)).getByText('7')).toBeInTheDocument();
  });

  it('highlights the active filter card and colours a low data confidence rating as a warning', () => {
    render(
      <StrategicSourcingDashboardCards
        summary={buildSummary({ overallDataConfidence: 'LOW' })}
        activeFilter="E_AUCTION"
      />
    );

    expect(cardFor(strings.cardEAuctionOpp)).toHaveClass('ring-2');
    expect(cardFor(strings.cardConsolidationOpp)).not.toHaveClass('ring-2');
    expect(cardFor(strings.cardDataConfidence)).toHaveClass('text-amber-600');
  });

  it('colours a high data confidence rating as positive', () => {
    render(<StrategicSourcingDashboardCards summary={buildSummary({ overallDataConfidence: 'HIGH' })} />);

    expect(cardFor(strings.cardDataConfidence)).toHaveClass('text-emerald-600');
  });

  it('reports the key of each card that is clicked', () => {
    const onFilterCardClick = vi.fn();
    render(<StrategicSourcingDashboardCards summary={buildSummary()} onFilterCardClick={onFilterCardClick} />);

    fireEvent.click(cardFor(strings.cardEAuctionOpp));

    expect(onFilterCardClick).toHaveBeenCalledWith('E_AUCTION');
  });

  it('accepts a card click when no filter handler is supplied', () => {
    render(<StrategicSourcingDashboardCards summary={buildSummary()} />);

    fireEvent.click(cardFor(strings.cardConsolidationOpp));

    expect(cardFor(strings.cardConsolidationOpp)).toBeInTheDocument();
  });

  it('opens the calculation trace from the net card by mouse and keyboard without applying a filter', () => {
    const onOpenHowCalculated = vi.fn();
    const onFilterCardClick = vi.fn();
    render(
      <StrategicSourcingDashboardCards
        summary={buildSummary()}
        onFilterCardClick={onFilterCardClick}
        onOpenHowCalculated={onOpenHowCalculated}
      />
    );
    const howCalculatedControl = within(cardFor(strings.cardNetDefensibleRange)).getByRole('button', {
      name: HOW_CALCULATED_NAME
    });

    fireEvent.click(howCalculatedControl);
    expect(onOpenHowCalculated).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(howCalculatedControl, { key: 'Enter' });
    fireEvent.keyDown(howCalculatedControl, { key: ' ' });
    fireEvent.keyDown(howCalculatedControl, { key: 'Tab' });

    expect(onOpenHowCalculated).toHaveBeenCalledTimes(3);
    expect(onFilterCardClick).not.toHaveBeenCalled();
  });

  it('omits the calculation trace control when no handler is supplied', () => {
    render(<StrategicSourcingDashboardCards summary={buildSummary()} />);

    expect(
      within(cardFor(strings.cardNetDefensibleRange)).queryByRole('button', { name: HOW_CALCULATED_NAME })
    ).not.toBeInTheDocument();
  });
});
