import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefOpportunityTable } from '../../src/components/executiveBrief/ExecutiveBriefOpportunityTable';
import {
  EXECUTIVE_BRIEF_EXPORT_STRINGS,
  EXECUTIVE_BRIEF_OPPORTUNITY_ROWS,
  EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN
} from '../../src/constants';

describe('ExecutiveBriefOpportunityTable', () => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;
  const oppStrings = strings.opportunityTable;
  const dblStrings = strings.doubleCountingControl;

  it('renders Section 13 double-counting prevention metrics correctly', () => {
    render(<ExecutiveBriefOpportunityTable />);

    expect(screen.getByText(dblStrings.sectionTitle)).toBeInTheDocument();
    expect(screen.getByText(dblStrings.subtitle)).toBeInTheDocument();
    expect(screen.getByText(dblStrings.grossTitle)).toBeInTheDocument();
    expect(screen.getAllByText(EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.grossIdentifiedCr).length).toBeGreaterThan(0);
    expect(screen.getByText(dblStrings.overlapTitle)).toBeInTheDocument();
    expect(screen.getAllByText(EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.overlapAdjustmentCr).length).toBeGreaterThan(0);
    expect(screen.getByText(dblStrings.exclusionTitle)).toBeInTheDocument();
    expect(screen.getAllByText(EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.exclusionsCr).length).toBeGreaterThan(0);
    expect(screen.getByText(dblStrings.netTitle)).toBeInTheDocument();
    expect(screen.getAllByText(EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.netDefensibleCr).length).toBeGreaterThan(0);
    expect(screen.getAllByText(dblStrings.productivityTitle).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(dblStrings.strategicRiskTitle).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Section 14 analysis-wise table headers and all analytical rows', () => {
    render(<ExecutiveBriefOpportunityTable />);

    expect(screen.getByText(oppStrings.sectionTitle)).toBeInTheDocument();
    expect(screen.getByText(oppStrings.subtitle)).toBeInTheDocument();
    expect(screen.getByText(oppStrings.colAnalysis)).toBeInTheDocument();
    expect(screen.getAllByText(oppStrings.colAddressableSpend).length).toBeGreaterThan(0);
    expect(screen.getByText(oppStrings.colAssumptionMethod)).toBeInTheDocument();
    expect(screen.getByText(oppStrings.colIndicativeOpportunity)).toBeInTheDocument();
    expect(screen.getByText(oppStrings.colBenefitType)).toBeInTheDocument();
    expect(screen.getByText(oppStrings.colConfidence)).toBeInTheDocument();
    expect(screen.getByText(oppStrings.colPrimaryAction)).toBeInTheDocument();

    for (const row of EXECUTIVE_BRIEF_OPPORTUNITY_ROWS) {
      expect(screen.getAllByText(row.analysis).length).toBeGreaterThan(0);
      expect(screen.getAllByText(row.indicativeOpportunity).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders Section 16 CFO governance note disclaimer', () => {
    render(<ExecutiveBriefOpportunityTable />);
    expect(screen.getByText(oppStrings.cfoNote)).toBeInTheDocument();
  });

  it('invokes onDrillOpportunity when a row is clicked', () => {
    const onDrill = vi.fn();
    render(<ExecutiveBriefOpportunityTable onDrillOpportunity={onDrill} />);

    const firstRowText = screen.getAllByText(EXECUTIVE_BRIEF_OPPORTUNITY_ROWS[0].analysis)[0];
    fireEvent.click(firstRowText);

    expect(onDrill).toHaveBeenCalled();
  });

  it('handles row click safely when onDrillOpportunity is undefined', () => {
    render(<ExecutiveBriefOpportunityTable />);
    const rowText = screen.getAllByText(EXECUTIVE_BRIEF_OPPORTUNITY_ROWS[1].analysis)[0];
    expect(() => fireEvent.click(rowText)).not.toThrow();
  });
});
