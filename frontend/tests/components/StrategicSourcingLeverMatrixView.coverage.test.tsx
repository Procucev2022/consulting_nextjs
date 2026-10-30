import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { StrategicSourcingLeverMatrixView } from '../../src/components/module2/StrategicSourcingLeverMatrixView';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { SourcingLeverRecommendation } from '../../src/types/module2StrategicSourcing';

const strings = UI_STRINGS.module2Sourcing;

const applicableLever: SourcingLeverRecommendation = {
  lever: 'E_AUCTION',
  leverLabel: 'e-Auction / Competitive Reverse Bidding',
  rationale: 'Four qualified mills supply 10 mm plate with an 11.4% price spread.',
  evidence: '3 suppliers, 11.4% price dispersion',
  addressableSpendInr: 412360000,
  addressableSpendInrCr: 41.24,
  potentialBenefitLabel: '₹61.85L potential opportunity',
  potentialBenefitInr: 6185400,
  dataConfidence: 'HIGH',
  risks: ['Supplier collusion risk'],
  nextAction: 'Initiate a dynamic e-auction event for IS 2062 plates.',
  isApplicable: true
};

const deferredLever: SourcingLeverRecommendation = {
  lever: 'PAYMENT_TERM_REVIEW',
  leverLabel: 'Payment Term Review',
  rationale: 'Payment terms are uniform at net 45 across plate suppliers.',
  potentialBenefitLabel: '₹0.00L potential opportunity',
  potentialBenefitInr: 0,
  dataConfidence: 'LOW',
  nextAction: 'Hold until payment term data is available for all plants.',
  isApplicable: false
};

describe('StrategicSourcingLeverMatrixView coverage paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the matrix title and each lever with its rank, rationale, and next action', () => {
    render(<StrategicSourcingLeverMatrixView levers={[applicableLever, deferredLever]} />);

    expect(screen.getByText(strings.leversTitle)).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText(applicableLever.leverLabel)).toBeInTheDocument();
    expect(screen.getByText(applicableLever.nextAction)).toBeInTheDocument();
    expect(screen.getByText(deferredLever.rationale)).toBeInTheDocument();
  });

  it('marks applicable levers and deferred levers with distinct status badges', () => {
    render(<StrategicSourcingLeverMatrixView levers={[applicableLever, deferredLever]} />);

    expect(screen.getByText('Applicable')).toHaveClass('bg-emerald-100');
    expect(screen.getByText('Deferred')).toHaveClass('bg-slate-200');
  });

  it('shows the potential benefit and data confidence for each lever', () => {
    render(<StrategicSourcingLeverMatrixView levers={[applicableLever, deferredLever]} />);

    expect(screen.getByText(applicableLever.potentialBenefitLabel)).toBeInTheDocument();
    expect(screen.getByText(deferredLever.potentialBenefitLabel)).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('renders the title with no lever cards when no levers are supplied', () => {
    render(<StrategicSourcingLeverMatrixView levers={[]} />);

    expect(screen.getByText(strings.leversTitle)).toBeInTheDocument();
    expect(screen.queryByText('#1')).not.toBeInTheDocument();
  });
});
