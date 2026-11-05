/**
 * Coverage tests for Module2LeverOverview: banner action, pending controls without a handler,
 * independent diagnostics toggles, and the direct-price fallback.
 *
 * The shipped lever config only contains implemented and coming-soon levers, so the planned-status and
 * missing-label fallbacks are reached by swapping the config for the duration of one test.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Module2LeverOverview } from '../../../src/components/module2/Module2LeverOverview';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { TEN_LEVERS_OVERVIEW_CONFIG } from '../../../src/constants';
import type { LeverOverviewItem } from '../../../src/types/module2Components';

// The component reads the lever list through the constants barrel, so the barrel is the module to replace.
// One hoisted array backs the replaced export, letting each test swap the list in place.
const leverState = vi.hoisted(() => {
  const levers: LeverOverviewItem[] = [];
  return { levers };
});

vi.mock('../../../src/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/constants')>();
  if (leverState.levers.length === 0) {
    leverState.levers.push(...actual.TEN_LEVERS_OVERVIEW_CONFIG);
  }
  return { ...actual, TEN_LEVERS_OVERVIEW_CONFIG: leverState.levers };
});

const SHIPPED_LEVERS: LeverOverviewItem[] = [...TEN_LEVERS_OVERVIEW_CONFIG];
const strings = UI_STRINGS.module2LeversOverview;

function setLeverConfig(levers: LeverOverviewItem[]): void {
  TEN_LEVERS_OVERVIEW_CONFIG.splice(0, TEN_LEVERS_OVERVIEW_CONFIG.length, ...levers);
}

describe('Module2LeverOverview coverage', () => {
  afterEach(() => {
    setLeverConfig(SHIPPED_LEVERS);
  });

  it('opens the consolidated savings view from the banner action', () => {
    const onSelectLever = vi.fn();
    render(<Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={onSelectLever} />);

    // The banner action is the first button on the page, ahead of every lever card control.
    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onSelectLever).toHaveBeenCalledWith('consolidatedSavings');
  });

  it('omits the banner action and disables pending levers when no lever handler is given', () => {
    render(<Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={undefined} />);

    const pendingLabels = screen.getAllByText(strings.btnPending);
    expect(pendingLabels).toHaveLength(TEN_LEVERS_OVERVIEW_CONFIG.length);
    // No banner action precedes the lever cards, so the first button is lever 1's disabled pending control.
    expect(screen.getAllByRole('button')[0]).toBeDisabled();
  });

  it('toggles the diagnostics of each lever independently', () => {
    render(<Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={vi.fn()} />);
    const [first, second] = strings.levers;

    fireEvent.click(screen.getByTestId('lever-accordion-btn-1'));
    fireEvent.click(screen.getByTestId('lever-accordion-btn-2'));
    expect(screen.getByText(first.methodologySummary)).toBeInTheDocument();
    expect(screen.getByText(second.methodologySummary)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('lever-accordion-btn-1'));
    expect(screen.queryByText(first.methodologySummary)).not.toBeInTheDocument();
    expect(screen.getByText(second.methodologySummary)).toBeInTheDocument();
  });

  it('shows the supplied direct price and falls back to zero for other assessments', () => {
    const { rerender } = render(
      <Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={vi.fn()} directPriceOppCr={5.5} />
    );
    expect(screen.getByText(strings.formatOpportunity(5.5))).toBeInTheDocument();

    rerender(<Module2LeverOverview assessmentId="AIC-2026-0009" onSelectLever={vi.fn()} />);

    expect(screen.queryByText(strings.formatOpportunity(5.5))).not.toBeInTheDocument();
    expect(screen.queryByText(strings.formatOpportunity(17.1155))).not.toBeInTheDocument();
    expect(screen.getAllByText(strings.zeroValidatedSavings).length).toBeGreaterThan(0);
  });

  it('uses the implemented status text when an implemented lever has no status label', () => {
    setLeverConfig([{ ...SHIPPED_LEVERS[0], statusLabel: '' }]);

    render(<Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={vi.fn()} />);

    expect(screen.getByText(strings.statusImplemented)).toBeInTheDocument();
  });

  it('shows a planned lever with planned status text and a pending control', () => {
    setLeverConfig([
      {
        ...SHIPPED_LEVERS[0],
        id: 11,
        code: 'LEV-11',
        name: strings.levers[9].name,
        implementationStatus: 'NOT_IMPLEMENTED',
        statusLabel: ''
      }
    ]);

    render(<Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={vi.fn()} />);

    // Once in the status badge and once in the footer note.
    expect(screen.getAllByText(strings.statusPlanned)).toHaveLength(2);
    expect(screen.getByText(strings.btnPending)).toBeInTheDocument();
  });

  it('opens the direct price tab for an implemented lever that has no tab mapping', () => {
    const onSelectLever = vi.fn();
    setLeverConfig([{ ...SHIPPED_LEVERS[0], id: 12, code: 'LEV-12', name: 'Unmapped Lever' }]);
    render(<Module2LeverOverview assessmentId="AIC-2026-0002" onSelectLever={onSelectLever} />);

    fireEvent.click(screen.getByTestId('lever-open-btn-12'));

    expect(onSelectLever).toHaveBeenCalledWith('directPrice');
  });
});
