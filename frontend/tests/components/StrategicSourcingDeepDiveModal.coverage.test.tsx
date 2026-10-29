import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrategicSourcingDeepDiveModal } from '../../src/components/module2/StrategicSourcingDeepDiveModal';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { CategoryStrategicSourcingProfile } from '../../src/types/module2StrategicSourcing';
import type { ProcurementMaturityScorecardResult } from '../../src/types/module2OpportunityIntelligence';
import { buildSteelPlateCategoryProfile } from '../fixtures/module2CoverageFixtures';

const strings = UI_STRINGS.module2Sourcing;
const HOW_CALCULATED_NAME = /how calculated/i;
const EVIDENCE_LABEL = 'Quantifiable Opportunity Range';

const formatLakhCompact = (value: number): string => `₹${(value / 100000).toFixed(2)}L`;

const maturityResult: ProcurementMaturityScorecardResult = {
  overallScore: 61,
  overallMaturityLevel: 'MANAGED',
  dimensions: [
    {
      dimensionKey: 'PRICE_MANAGEMENT',
      dimensionLabel: 'Price Management',
      score: 5,
      maturityLevel: 'DEVELOPING',
      observedCondition: 'Plate prices are tracked against a single index for all three mills.',
      evidence: 'Index tracking covers 92% of plate purchases.',
      potentialImplication: 'Price variance is visible but not yet contractually controlled.',
      recommendedAction: 'Add index-linked clauses to the plate supply agreements.',
      quantifiability: 'QUANTIFIABLE'
    }
  ],
  topWeaknesses: [],
  topStrengths: [],
  diagnosticSummary: 'Plate sourcing is managed but price terms are not yet contracted.'
};

const buildProfile = (overrides: Partial<CategoryStrategicSourcingProfile> = {}): CategoryStrategicSourcingProfile =>
  buildSteelPlateCategoryProfile({
    evidenceStateLabel: EVIDENCE_LABEL,
    procurementMaturity: maturityResult,
    ...overrides
  });

const tabButton = (label: RegExp): HTMLElement => screen.getByRole('button', { name: label });

const iconOnlyButtons = (): HTMLElement[] =>
  screen.getAllByRole('button').filter((button) => (button.textContent ?? '').trim() === '');

describe('StrategicSourcingDeepDiveModal coverage paths', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when the modal is closed or no profile is selected', () => {
    const { unmount } = render(<StrategicSourcingDeepDiveModal isOpen={false} onClose={vi.fn()} profile={buildProfile()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    render(<StrategicSourcingDeepDiveModal isOpen onClose={vi.fn()} profile={null} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the category identity, evidence state, and status in the header', () => {
    render(<StrategicSourcingDeepDiveModal isOpen onClose={vi.fn()} profile={buildProfile()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Structural Steel Plates' })).toBeInTheDocument();
    expect(screen.getByText(EVIDENCE_LABEL)).toBeInTheDocument();
    expect(screen.getByText('Confidence: HIGH')).toBeInTheDocument();
    expect(screen.getByText('Opportunity Quantified')).toBeInTheDocument();
  });

  it('hides the evidence badge when the profile has no evidence state label', () => {
    render(
      <StrategicSourcingDeepDiveModal
        isOpen
        onClose={vi.fn()}
        profile={buildProfile({ evidenceStateLabel: undefined })}
      />
    );

    expect(screen.queryByText(EVIDENCE_LABEL)).not.toBeInTheDocument();
  });

  it('opens the calculation trace with the profile from the header control', () => {
    const profile = buildProfile();
    const onOpenHowCalculated = vi.fn();
    render(
      <StrategicSourcingDeepDiveModal
        isOpen
        onClose={vi.fn()}
        profile={profile}
        onOpenHowCalculated={onOpenHowCalculated}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: HOW_CALCULATED_NAME }));

    expect(onOpenHowCalculated).toHaveBeenCalledWith(profile);
  });

  it('omits the calculation trace control when no handler is supplied', () => {
    render(<StrategicSourcingDeepDiveModal isOpen onClose={vi.fn()} profile={buildProfile()} />);

    expect(screen.queryByRole('button', { name: HOW_CALCULATED_NAME })).not.toBeInTheDocument();
  });

  it('offers the Module 4 handoff only for quantifiable profiles with a positive net opportunity', () => {
    const onHandoffToModule4 = vi.fn();
    const { unmount } = render(
      <StrategicSourcingDeepDiveModal
        isOpen
        onClose={vi.fn()}
        profile={buildProfile()}
        onHandoffToModule4={onHandoffToModule4}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: strings.btnHandoffToModule4 }));
    expect(onHandoffToModule4).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'CAT-STL-PLATE-IS2062' }));
    unmount();

    const { unmount: unmountNotQuantifiable } = render(
      <StrategicSourcingDeepDiveModal isOpen onClose={vi.fn()} profile={buildProfile({ isQuantifiable: false })} />
    );
    expect(screen.queryByRole('button', { name: strings.btnHandoffToModule4 })).not.toBeInTheDocument();
    unmountNotQuantifiable();

    render(
      <StrategicSourcingDeepDiveModal
        isOpen
        onClose={vi.fn()}
        profile={buildProfile({ netQuantifiableOpportunityInr: 0 })}
      />
    );
    expect(screen.queryByRole('button', { name: strings.btnHandoffToModule4 })).not.toBeInTheDocument();
  });

  it('switches between the workspace tabs and shows the section for each', () => {
    render(<StrategicSourcingDeepDiveModal isOpen onClose={vi.fn()} profile={buildProfile()} />);

    fireEvent.click(tabButton(/Opportunity & Waterfall/));
    expect(screen.getByText(strings.sectionScenarioAnalysis)).toBeInTheDocument();

    fireEvent.click(tabButton(/Price & Dispersion/));
    expect(screen.queryByText(strings.sectionScenarioAnalysis)).not.toBeInTheDocument();

    fireEvent.click(tabButton(/Market Discovery & Maturity/));
    expect(screen.getByText(maturityResult.dimensions[0].observedCondition)).toBeInTheDocument();

    fireEvent.click(tabButton(/Strategy & Roadmap/));
    expect(screen.getByText(strings.scorecardTitle)).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();

    fireEvent.click(tabButton(/Evidence & Audit/));
    expect(screen.getByText('CALC-STL-PLATE-0101')).toBeInTheDocument();

    fireEvent.click(tabButton(/Category & Supplier Profile/));
    expect(screen.queryByText('CALC-STL-PLATE-0101')).not.toBeInTheDocument();
  });

  it('shows scenario amounts in lakhs and zero for scenario values that are missing', () => {
    const profile = buildProfile({
      scenarios: {
        isAvailable: true,
        conservativeOpportunityInr: null,
        conservativeOpportunityInrCr: null,
        conservativeReferencePrice: null,
        conservativeMethodology: 'P25 baseline',
        baseOpportunityInr: null,
        baseOpportunityInrCr: null,
        baseReferencePrice: null,
        baseMethodology: 'Lowest credible price',
        stretchOpportunityInr: 250000,
        stretchOpportunityInrCr: 0.025,
        stretchReferencePrice: 59800,
        stretchMethodology: 'Stretch target',
        explanation: 'Quartile-based scenario range'
      }
    });
    render(<StrategicSourcingDeepDiveModal isOpen onClose={vi.fn()} profile={profile} />);

    fireEvent.click(tabButton(/Opportunity & Waterfall/));

    expect(screen.getByText(formatLakhCompact(250000))).toBeInTheDocument();
    expect(screen.getAllByText(formatLakhCompact(0))).toHaveLength(2);
  });

  it('shows zero for a missing stretch scenario amount while keeping the conservative amount', () => {
    const baseScenarios = buildProfile().scenarios;
    const profile = buildProfile({
      scenarios: { ...baseScenarios, conservativeOpportunityInr: 100000, stretchOpportunityInr: null }
    });
    render(<StrategicSourcingDeepDiveModal isOpen onClose={vi.fn()} profile={profile} />);

    fireEvent.click(tabButton(/Opportunity & Waterfall/));

    expect(screen.getByText(formatLakhCompact(100000))).toBeInTheDocument();
    expect(screen.getByText(formatLakhCompact(0))).toBeInTheDocument();
  });

  it('hides the scenario analysis when scenarios are not available for the profile', () => {
    const profile = buildProfile();
    render(
      <StrategicSourcingDeepDiveModal
        isOpen
        onClose={vi.fn()}
        profile={{ ...profile, scenarios: { ...profile.scenarios, isAvailable: false } }}
      />
    );

    fireEvent.click(tabButton(/Opportunity & Waterfall/));

    expect(screen.queryByText(strings.sectionScenarioAnalysis)).not.toBeInTheDocument();
  });

  it('closes from the icon-only header control', () => {
    const onClose = vi.fn();
    render(<StrategicSourcingDeepDiveModal isOpen onClose={onClose} profile={buildProfile()} />);

    const [closeButton] = iconOnlyButtons();
    fireEvent.click(closeButton);

    expect(iconOnlyButtons()).toHaveLength(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
