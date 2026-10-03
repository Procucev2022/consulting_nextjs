import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveOpportunityBriefView } from '@/components/presentation/ExecutiveOpportunityBriefView';
import { ExecutiveOpportunityBriefSlideContent } from '@/components/presentation/ExecutiveOpportunityBriefSlideContent';
import { EXECUTIVE_BRIEF_PRESENTATION_CONTRACT } from '@/constants/executiveBriefPresentationConstants';
import { UI_STRINGS } from '@/constants/uiStrings';

describe('ExecutiveOpportunityBriefView Component', () => {
  it('renders the Executive Opportunity Brief header and slide 1 content', () => {
    render(<ExecutiveOpportunityBriefView clientName="UltraTech Cement Limited" />);

    expect(screen.getByTestId('executive-opportunity-brief-view')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(UI_STRINGS.opportunityBrief.title, 'i'))).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(UI_STRINGS.opportunityBrief.cfoDiscussionBadge, 'i')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(new RegExp(UI_STRINGS.opportunityBrief.primaryValueThesis, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr.toFixed(2)} Cr`))).toBeInTheDocument();
  });

  it('navigates between slides using Next and Previous buttons', () => {
    render(<ExecutiveOpportunityBriefView clientName="UltraTech Cement Limited" />);

    expect(screen.getByText(/Slide 1 of 10/i)).toBeInTheDocument();

    const nextBtn = screen.getByTestId('brief-next-slide-btn');
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Slide 2 of 10/i)).toBeInTheDocument();
    expect(screen.getByText(/81.4%/i)).toBeInTheDocument();

    const prevBtn = screen.getByTestId('brief-prev-slide-btn');
    fireEvent.click(prevBtn);
    expect(screen.getByText(/Slide 1 of 10/i)).toBeInTheDocument();
  });

  it('triggers onDownloadPdf, onDownloadPptx, onBackToWorkspace, and onToggleFullScreen callbacks', () => {
    const handlePdf = vi.fn();
    const handlePptx = vi.fn();
    const handleBack = vi.fn();
    const handleFullscreen = vi.fn();

    render(
      <ExecutiveOpportunityBriefView
        clientName="UltraTech Cement Limited"
        onDownloadPdf={handlePdf}
        onDownloadPptx={handlePptx}
        onBackToWorkspace={handleBack}
        isFullScreen={false}
        onToggleFullScreen={handleFullscreen}
      />
    );

    const pdfBtn = screen.getByTestId('download-brief-pdf-btn');
    fireEvent.click(pdfBtn);
    expect(handlePdf).toHaveBeenCalledTimes(1);

    const pptxBtn = screen.getByTestId('download-brief-pptx-btn');
    fireEvent.click(pptxBtn);
    expect(handlePptx).toHaveBeenCalledTimes(1);

    const backBtn = screen.getByTestId('back-to-workspace-btn');
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    const fsBtn = screen.getByTestId('brief-fullscreen-btn');
    fireEvent.click(fsBtn);
    expect(handleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('can navigate through all slides 1 to 10 and display each slide content', () => {
    render(<ExecutiveOpportunityBriefView clientName="UltraTech Cement Limited" isFullScreen={true} />);

    const nextBtn = screen.getByTestId('brief-next-slide-btn');
    // Slide 2
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Concentration/i)).toBeInTheDocument();
    // Slide 3
    fireEvent.click(nextBtn);
    expect(screen.getAllByText(new RegExp(UI_STRINGS.opportunityBrief.whereConcentrated, 'i')).length).toBeGreaterThanOrEqual(1);
    // Slide 4
    fireEvent.click(nextBtn);
    expect(screen.getAllByText(new RegExp(UI_STRINGS.opportunityBrief.valueBridgeTitle, 'i')).length).toBeGreaterThanOrEqual(1);
    // Slide 5
    fireEvent.click(nextBtn);
    expect(screen.getByText(/80% Defensibility Floor/i)).toBeInTheDocument();
    // Slide 6
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Module 1 — AI Diagnostics/i)).toBeInTheDocument();
    // Slide 7
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Packaging Bags: Rs. 14.50 Cr/i)).toBeInTheDocument();
    // Slide 8
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Days 1–30: Mobilize & Quick Wins/i)).toBeInTheDocument();
    // Slide 9
    fireEvent.click(nextBtn);
    expect(screen.getByText(/From transaction data to procurement decision to measurable execution./i)).toBeInTheDocument();
    // Slide 10
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Slide 10 of 10/i)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(UI_STRINGS.opportunityBrief.proposedNextSteps, 'i')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(new RegExp(UI_STRINGS.opportunityBrief.alignStep, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(UI_STRINGS.opportunityBrief.mobilizeStep, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(UI_STRINGS.opportunityBrief.executeStep, 'i'))).toBeInTheDocument();
  });

  it('renders default case for slide content when out of range', () => {
    render(<ExecutiveOpportunityBriefSlideContent currentSlide={99} />);
    expect(screen.getByText('Slide 99')).toBeInTheDocument();
  });

  it('renders Bronze snapshot teaser view when currentTier is BRONZE', () => {
    const handleExploreSilver = vi.fn();
    const handleBack = vi.fn();

    render(
      <ExecutiveOpportunityBriefView
        clientName="UltraTech Cement Limited"
        currentTier="BRONZE"
        onExploreSilver={handleExploreSilver}
        onBackToWorkspace={handleBack}
      />
    );

    expect(screen.getByTestId('executive-opportunity-brief-bronze-teaser')).toBeInTheDocument();
    expect(screen.getByText('Bronze Discover Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Management Quick Summary is available with Silver.')).toBeInTheDocument();
    expect(screen.getByText('₹420.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('974')).toBeInTheDocument();
    expect(screen.getByText('256')).toBeInTheDocument();

    const exploreBtn = screen.getByTestId('bronze-explore-silver-btn');
    expect(exploreBtn).toHaveTextContent(UI_STRINGS.subscription.exploreSilver);
    fireEvent.click(exploreBtn);
    expect(handleExploreSilver).toHaveBeenCalledTimes(1);

    const backBtn = screen.getByText('Back to Workspace');
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
