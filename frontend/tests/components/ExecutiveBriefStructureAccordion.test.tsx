import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefStructureAccordion } from '../../src/components/executiveBrief/ExecutiveBriefStructureAccordion';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';
import type { ExecutiveBriefSlideGroup } from '../../src/types';

describe('ExecutiveBriefStructureAccordion', () => {
  const mockSections: ExecutiveBriefSlideGroup[] = [
    {
      groupId: '01',
      groupNumber: '01',
      title: 'Executive Overview',
      slideRange: 'Slides 01–02',
      summary: 'Strategic summary of procurement diagnostic',
      background: 'Decentralized plant purchasing history across 6 regions',
      objective: 'Establish definitive C-suite alignment on spend baseline',
      finding: 'Total addressable spend of ₹4,931 Cr yields ₹412 Cr gross potential',
      evidence: '31,671 verified transaction records across 1,482 suppliers',
      outcome: 'Defensible 4-wave implementation roadmap',
      recommendedAction: 'Form Joint Executive Steering Committee',
      nextStep: 'Mobilize dedicated Procucev Category Specialists',
      detailCards: [
        {
          findingId: 'FIND-01',
          title: 'Inter-Plant Unit Price Dispersion',
          background: 'Decentralized plant orders',
          objective: 'Determine price spread',
          evidence: '340 items with 18.5% spread',
          analysis: 'Econometric variance',
          outcome: 'Identified rate harmonization',
          potentialValueInr: 246000000,
          potentialValueDisplay: '₹24.60 Cr',
          confidence: 'HIGH',
          confidenceRationale: '1,840 comparable transactions',
          riskConstraint: 'Freight unbundling',
          nextStep: 'Issue centralized contract amendments',
          owner: 'Joint',
          timeline: '30–60 Days',
          detailedAnalysisRef: 'Appendix A-01'
        }
      ]
    }
  ];

  it('renders section group and handles expand toggle', () => {
    const onToggleGroup = vi.fn();
    render(
      <ExecutiveBriefStructureAccordion
        sections={mockSections}
        expandedGroupIds={[]}
        onToggleGroup={onToggleGroup}
        expandedDeepDives={[]}
        onToggleDeepDive={vi.fn()}
        onDrillEvidence={vi.fn()}
      />
    );

    expect(screen.getByText('Executive Overview')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('accordion-group-btn-01'));
    expect(onToggleGroup).toHaveBeenCalledWith('01');
  });

  it('renders 7 attributes and deep dive card when expanded', () => {
    const onToggleDeepDive = vi.fn();
    const onDrillEvidence = vi.fn();

    render(
      <ExecutiveBriefStructureAccordion
        sections={mockSections}
        expandedGroupIds={['01']}
        onToggleGroup={vi.fn()}
        expandedDeepDives={['FIND-01']}
        onToggleDeepDive={onToggleDeepDive}
        onDrillEvidence={onDrillEvidence}
      />
    );

    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.structure.backgroundLabel)).toBeInTheDocument();
    expect(screen.getByText(EXECUTIVE_BRIEF_EXPORT_STRINGS.structure.findingLabel)).toBeInTheDocument();
    expect(screen.getByText('FIND-01')).toBeInTheDocument();
    expect(screen.getByText('₹24.60 Cr')).toBeInTheDocument();

    const drillBtn = screen.getByTestId('drill-evidence-btn-FIND-01');
    fireEvent.click(drillBtn);
    expect(onDrillEvidence).toHaveBeenCalledWith('FIND-01');
  });
});
