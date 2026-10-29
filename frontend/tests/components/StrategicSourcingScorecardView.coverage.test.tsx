import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { StrategicSourcingScorecardView } from '../../src/components/module2/StrategicSourcingScorecardView';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { StrategicSourcingScorecard } from '../../src/types/module2StrategicSourcing';

const strings = UI_STRINGS.module2Sourcing;
const JUSTIFICATION_NOTE = 'Run the e-auction and consolidate the tail vendor in parallel.';

const buildScorecard = (overrides: Partial<StrategicSourcingScorecard> = {}): StrategicSourcingScorecard => ({
  overallScore: 85,
  recommendation: 'E_AUCTION_PLUS_CONSOLIDATION',
  recommendationLabel: 'E-Auction + Vendor Consolidation',
  dimensions: [
    {
      dimension: 'Spend Materiality',
      score: 9,
      weightPct: 20,
      assessment: 'FAVORABLE',
      rationale: 'Plate spend is 41.24 Cr across three plants.'
    },
    {
      dimension: 'Supplier Competition',
      score: 6,
      weightPct: 15,
      assessment: 'NEUTRAL',
      rationale: 'Three qualified mills with moderate overlap.'
    },
    {
      dimension: 'Data Quality',
      score: 3,
      weightPct: 10,
      assessment: 'DATA_DEFICIENT',
      rationale: 'Grade fields are incomplete for two plants.'
    }
  ],
  justificationNotes: [JUSTIFICATION_NOTE],
  ...overrides
});

describe('StrategicSourcingScorecardView coverage paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the overall score, recommendation, and each dimension with its weight', () => {
    render(<StrategicSourcingScorecardView scorecard={buildScorecard()} />);

    expect(screen.getByText(strings.scorecardTitle)).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('E-Auction + Vendor Consolidation')).toBeInTheDocument();
    expect(screen.getByText('Spend Materiality')).toBeInTheDocument();
    expect(screen.getByText('(20% wt)')).toBeInTheDocument();
    expect(screen.getByText('Grade fields are incomplete for two plants.')).toBeInTheDocument();
  });

  it('colours each dimension score by its band', () => {
    render(<StrategicSourcingScorecardView scorecard={buildScorecard()} />);

    expect(screen.getByText('9/10')).toHaveClass('bg-emerald-100');
    expect(screen.getByText('6/10')).toHaveClass('bg-blue-100');
    expect(screen.getByText('3/10')).toHaveClass('bg-amber-100');
  });

  it('shows the justification notes when they are present', () => {
    render(<StrategicSourcingScorecardView scorecard={buildScorecard()} />);

    expect(screen.getByText(JUSTIFICATION_NOTE)).toBeInTheDocument();
  });

  it('omits the justification notes when none are recorded', () => {
    render(<StrategicSourcingScorecardView scorecard={buildScorecard({ justificationNotes: [] })} />);

    expect(screen.queryByText(JUSTIFICATION_NOTE)).not.toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });
});
