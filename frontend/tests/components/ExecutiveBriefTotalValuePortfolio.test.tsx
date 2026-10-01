import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutiveBriefTotalValuePortfolio } from '../../src/components/executiveBrief/ExecutiveBriefTotalValuePortfolio';
import {
  EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS,
  EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES
} from '../../src/constants';

describe('ExecutiveBriefTotalValuePortfolio', () => {
  it('renders headline title, subtitle, and all 6 headline summary metrics', () => {
    const p = EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS;
    render(<ExecutiveBriefTotalValuePortfolio />);

    expect(screen.getByText(p.headlineTitle)).toBeInTheDocument();
    expect(screen.getByText(p.headlineSubtitle)).toBeInTheDocument();
    expect(screen.getByText('CFO-Grade Multi-Lever Taxonomy')).toBeInTheDocument();
    expect(screen.getByText(p.eauctionShareNote)).toBeInTheDocument();

    // 6 summary metrics
    expect(screen.getAllByText('Addressable Spend').length).toBeGreaterThan(0);
    expect(screen.getAllByText(p.totalAddressableSpend).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Net Opportunity').length).toBeGreaterThan(0);
    expect(screen.getAllByText(p.netIndicativeOpportunity).length).toBeGreaterThan(0);
    expect(screen.getAllByText('20% Reduction').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4 Sole-Sources').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹68.00 Cr Cash').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Deductions').length).toBeGreaterThan(0);
    expect(screen.getAllByText(p.overlapDeductionCr).length).toBeGreaterThan(0);

    // Badges
    expect(screen.getAllByText('FACTUAL BASELINE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ESTIMATED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ANALYTICAL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('VALIDATED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OVERLAP ZERO').length).toBeGreaterThan(0);
  });

  it('renders all 10 expander section headers and toggles cleanly', () => {
    const p = EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS;
    const onSelect = vi.fn();
    render(<ExecutiveBriefTotalValuePortfolio onSelectOpportunity={onSelect} />);

    // Check all 10 headers
    expect(screen.getByText(p.expanders.sec1Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec2Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec3Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec4Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec5Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec6Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec7Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec8Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec9Title)).toBeInTheDocument();
    expect(screen.getByText(p.expanders.sec10Title)).toBeInTheDocument();

    // Section 1 is initially open: check spend base
    expect(screen.getByText(/Verified Spend Base/i)).toBeInTheDocument();

    // Toggle Section 1 closed
    const sec1Btn = screen.getByText(p.expanders.sec1Title).closest('button');
    fireEvent.click(sec1Btn!);

    // Open Section 2: check vendor consolidation and click item
    const sec2Btn = screen.getByText(p.expanders.sec2Title).closest('button');
    fireEvent.click(sec2Btn!);
    const firstOpp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES[0];
    expect(screen.getAllByText(firstOpp.opportunityId).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText(firstOpp.opportunityId)[0]);
    expect(onSelect).toHaveBeenCalledWith(firstOpp.opportunityId);

    // Open Section 3: check PO consolidation
    const sec3Btn = screen.getByText(p.expanders.sec3Title).closest('button');
    fireEvent.click(sec3Btn!);
    expect(screen.getAllByText(/20% PO Volume Reduction/i).length).toBeGreaterThan(0);

    // Open Section 4: category consolidation
    const sec4Btn = screen.getByText(p.expanders.sec4Title).closest('button');
    fireEvent.click(sec4Btn!);
    expect(screen.getByText(/Category Consolidation & Rationalization/i)).toBeInTheDocument();

    // Open Section 5: strategic sourcing
    const sec5Btn = screen.getByText(p.expanders.sec5Title).closest('button');
    fireEvent.click(sec5Btn!);
    expect(screen.getAllByText(/Strategic Sourcing & Competitive Tendering/i).length).toBeGreaterThan(0);

    // Open Section 6: supplier risk
    const sec6Btn = screen.getByText(p.expanders.sec6Title).closest('button');
    fireEvent.click(sec6Btn!);
    expect(screen.getAllByText(/Supplier Risk Mitigation/i).length).toBeGreaterThan(0);

    // Open Section 7: benchmark opportunities
    const sec7Btn = screen.getByText(p.expanders.sec7Title).closest('button');
    fireEvent.click(sec7Btn!);
    expect(screen.getAllByText(/Benchmark Price Gap/i).length).toBeGreaterThan(0);

    // Section 8 is initially open: toggle close and re-open
    const sec8Btn = screen.getByText(p.expanders.sec8Title).closest('button');
    fireEvent.click(sec8Btn!);
    fireEvent.click(sec8Btn!);
    expect(screen.getByText('Traceability Proof')).toBeInTheDocument();

    // Open Section 9: double count reconciliation
    const sec9Btn = screen.getByText(p.expanders.sec9Title).closest('button');
    fireEvent.click(sec9Btn!);
    expect(screen.getByText(/Zero-Overlap Double Counting Protection Bridge/i)).toBeInTheDocument();

    // Open Section 10: execution roadmap
    const sec10Btn = screen.getByText(p.expanders.sec10Title).closest('button');
    fireEvent.click(sec10Btn!);
    expect(screen.getByText(/Procurement Value Realization Roadmap/i)).toBeInTheDocument();
  });

  it('renders gracefully without onSelectOpportunity callback', () => {
    render(<ExecutiveBriefTotalValuePortfolio />);
    const p = EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS;
    const sec2Btn = screen.getByText(p.expanders.sec2Title).closest('button');
    fireEvent.click(sec2Btn!);
    const firstOpp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES[0];
    fireEvent.click(screen.getAllByText(firstOpp.opportunityId)[0]);
    expect(screen.getAllByText(firstOpp.opportunityId)[0]).toBeInTheDocument();
  });
});
