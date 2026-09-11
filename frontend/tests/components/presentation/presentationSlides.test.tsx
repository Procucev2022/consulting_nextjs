import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ProcucevLogo,
  PresentationControls,
  Slide1Cover,
  Slide2Confidentiality,
  Slide3AboutProcucev,
  Slide4ExecutiveScorecard,
  Slide5SpendIngestionAudit,
  Slide6CategoryTaxonomyBreakdown,
  Slide7StrategicConcentrationRisk,
  Slide8PriceCreepContractLeakage,
  Slide9SavingsLeversRoadmap,
  Slide10ExecutionGovernance
} from '../../../src/components/presentation';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { mockTenant, mockSavingsOpportunities } from '../../../src/data/mockData';

describe('Management Presentation Slide Components', () => {
  const defaultSlideProps = {
    tenantEnterpriseName: mockTenant.enterprise_name,
    totalSpendInrCr: 732.41,
    totalSavingsInrCr: 119.67,
    slideNumber: 1,
    totalSlides: 10
  };

  describe('ProcucevLogo', () => {
    it('renders image logo by default', () => {
      render(<ProcucevLogo size="lg" />);
      const img = screen.getByAltText('PROCUCEV - Redefining Procurement');
      expect(img).toBeInTheDocument();
    });

    it('falls back to vector logo when image triggers onError', () => {
      render(<ProcucevLogo size="md" showTagline={true} />);
      const img = screen.getByAltText('PROCUCEV - Redefining Procurement');
      fireEvent.error(img);
      expect(screen.getByText('PROCU')).toBeInTheDocument();
      expect(screen.getByText('CEV')).toBeInTheDocument();
      expect(screen.getByText('Redefining Procurement')).toBeInTheDocument();
    });

    it('renders vector logo without tagline when showTagline is false', () => {
      render(<ProcucevLogo size="sm" showTagline={false} />);
      const img = screen.getByAltText('PROCUCEV - Redefining Procurement');
      fireEvent.error(img);
      expect(screen.getByText('PROCU')).toBeInTheDocument();
      expect(screen.queryByText('Redefining Procurement')).toBeNull();
    });
  });

  describe('Slide1Cover', () => {
    it('renders Slide 1 cover with Procucev logo, enterprise client name and metadata', () => {
      render(<Slide1Cover {...defaultSlideProps} slideNumber={1} />);
      expect(screen.getByText(UI_STRINGS.presentation.cover.deckTitle)).toBeInTheDocument();
      expect(screen.getByText(mockTenant.enterprise_name)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.cover.classification)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.cover.badge)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.cover.dateValue)).toBeInTheDocument();
    });
  });

  describe('Slide2Confidentiality', () => {
    it('renders Slide 2 with confidentiality, NDA sections and compliance stamp', () => {
      render(<Slide2Confidentiality {...defaultSlideProps} slideNumber={2} />);
      expect(screen.getByText(UI_STRINGS.presentation.confidentiality.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.confidentiality.section1Title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.confidentiality.section2Title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.confidentiality.section3Title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.confidentiality.section4Title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.confidentiality.complianceStamp)).toBeInTheDocument();
    });
  });

  describe('Slide3AboutProcucev', () => {
    it('renders Slide 3 matching attached slide with tagline, body text and 4 pillars', () => {
      render(<Slide3AboutProcucev {...defaultSlideProps} slideNumber={3} />);
      expect(screen.getByText(UI_STRINGS.presentation.about.pillBadge)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.about.headlineEmpower)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.about.bodyText)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.about.quaTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.about.proCpxTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.about.dpsNxtTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.about.networkCount)).toBeInTheDocument();
    });
  });

  describe('Slide4ExecutiveScorecard', () => {
    it('renders Slide 4 with hero metrics and strategic takeaways', () => {
      render(<Slide4ExecutiveScorecard {...defaultSlideProps} slideNumber={4} />);
      expect(screen.getByText(UI_STRINGS.presentation.scorecard.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.scorecard.kpiPriceCreepVal)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.scorecard.kpiVelocityVal)).toBeInTheDocument();
      expect(screen.getByText('₹732.41 Cr')).toBeInTheDocument();
      expect(screen.getByText('₹119.67 Cr')).toBeInTheDocument();
    });
  });

  describe('Slide5SpendIngestionAudit', () => {
    it('renders Slide 5 with multi-year data reconciliation metrics', () => {
      render(<Slide5SpendIngestionAudit {...defaultSlideProps} slideNumber={5} />);
      expect(screen.getByText(UI_STRINGS.presentation.ingestion.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.ingestion.recordsAudited)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.ingestion.vendorsHarmonized)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.ingestion.cleanRecordRate)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.ingestion.currenciesNormalized)).toBeInTheDocument();
    });
  });

  describe('Slide6CategoryTaxonomyBreakdown', () => {
    it('renders Slide 6 with category spend table', () => {
      render(<Slide6CategoryTaxonomyBreakdown {...defaultSlideProps} slideNumber={6} />);
      expect(screen.getByText(UI_STRINGS.presentation.taxonomy.title)).toBeInTheDocument();
      expect(screen.getByText('Direct Materials')).toBeInTheDocument();
      expect(screen.getByText('Packaging Materials')).toBeInTheDocument();
      expect(screen.getByText('Indirect & MRO')).toBeInTheDocument();
      expect(screen.getByText('Logistics & Freight')).toBeInTheDocument();
    });
  });

  describe('Slide7StrategicConcentrationRisk', () => {
    it('renders Slide 7 with single-vendor and dominant supplier risk analysis', () => {
      render(<Slide7StrategicConcentrationRisk {...defaultSlideProps} slideNumber={7} />);
      expect(screen.getByText(UI_STRINGS.presentation.strategicRisk.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.strategicRisk.totalAtRisk)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.strategicRisk.soleSourceItems)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.strategicRisk.dominantSecondary)).toBeInTheDocument();
    });
  });

  describe('Slide8PriceCreepContractLeakage', () => {
    it('renders Slide 8 with contract leakage analysis and total leakage figure', () => {
      render(<Slide8PriceCreepContractLeakage {...defaultSlideProps} slideNumber={8} />);
      expect(screen.getByText(UI_STRINGS.presentation.priceCreep.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.priceCreep.indexDriftTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.priceCreep.bracketLeakageTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.priceCreep.maverickTitle)).toBeInTheDocument();
    });
  });

  describe('Slide9SavingsLeversRoadmap', () => {
    it('renders Slide 9 with default initiatives when opportunities prop is empty', () => {
      render(<Slide9SavingsLeversRoadmap {...defaultSlideProps} slideNumber={9} opportunities={[]} />);
      expect(screen.getByText(UI_STRINGS.presentation.savingsLevers.title)).toBeInTheDocument();
      expect(screen.getByText('OPP-01')).toBeInTheDocument();
      expect(screen.getByText('OPP-02')).toBeInTheDocument();
    });

    it('renders Slide 9 with provided opportunities including fallback calculation', () => {
      render(
        <Slide9SavingsLeversRoadmap
          {...defaultSlideProps}
          slideNumber={9}
          opportunities={mockSavingsOpportunities}
        />
      );
      expect(screen.getByText(UI_STRINGS.presentation.savingsLevers.title)).toBeInTheDocument();
      expect(screen.getByText(mockSavingsOpportunities[0].title)).toBeInTheDocument();
    });

    it('exercises all branch conditions in Slide 9 with custom opportunity fallbacks', () => {
      const variedOpportunities = [
        {
          opp_id: '',
          title: 'Opportunity Without ID',
          category: 'Packaging',
          recommended_action: 'Renegotiate',
          est_savings_inr_cr: 12.34,
          est_savings: 100000,
          push_to_module: 'proCPX' as const,
          status: 'Identified' as const
        },
        {
          opp_id: 'OPP-99',
          title: 'Opportunity Without INR Cr',
          category: 'Direct',
          recommended_action: 'Index Pegging',
          est_savings_inr_cr: 0,
          est_savings: 200000,
          push_to_module: 'DPS NXT' as const,
          status: 'Identified' as const
        },
        {
          opp_id: 'OPP-100',
          title: 'Opportunity Without Any Savings Values',
          category: 'MRO',
          recommended_action: 'Auction',
          est_savings_inr_cr: 0,
          est_savings: 0,
          push_to_module: 'DPS NXT' as const,
          status: 'Identified' as const
        }
      ];

      render(
        <Slide9SavingsLeversRoadmap
          {...defaultSlideProps}
          slideNumber={9}
          opportunities={variedOpportunities as any}
        />
      );

      expect(screen.getByText('OPP-01')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Without ID')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Without INR Cr')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Without Any Savings Values')).toBeInTheDocument();
    });
  });

  describe('Slide10ExecutionGovernance', () => {
    it('renders Slide 10 with 3-wave roadmap and leadership sign-off', () => {
      render(<Slide10ExecutionGovernance {...defaultSlideProps} slideNumber={10} />);
      expect(screen.getByText(UI_STRINGS.presentation.governance.title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.governance.wave1Title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.governance.wave2Title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.governance.wave3Title)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.governance.ceoName)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.presentation.governance.validatedBadge)).toBeInTheDocument();
    });
  });

  describe('PresentationControls', () => {
    it('renders controls and triggers callbacks for prev, next, select, toggle, print, and close', () => {
      const onPrev = vi.fn();
      const onNext = vi.fn();
      const onSelect = vi.fn();
      const onToggle = vi.fn();
      const onPrint = vi.fn();
      const onClose = vi.fn();

      render(
        <PresentationControls
          currentSlide={2}
          totalSlides={10}
          isAllSlidesView={false}
          onPrevSlide={onPrev}
          onNextSlide={onNext}
          onSelectSlide={onSelect}
          onToggleViewMode={onToggle}
          onPrint={onPrint}
          onClose={onClose}
        />
      );

      // Prev
      const prevBtn = screen.getByLabelText(UI_STRINGS.presentation.navPrev);
      fireEvent.click(prevBtn);
      expect(onPrev).toHaveBeenCalledTimes(1);

      // Next
      const nextBtn = screen.getByLabelText(UI_STRINGS.presentation.navNext);
      fireEvent.click(nextBtn);
      expect(onNext).toHaveBeenCalledTimes(1);

      // Select Jump
      const select = screen.getByLabelText(UI_STRINGS.presentation.jumpToSlide);
      fireEvent.change(select, { target: { value: '5' } });
      expect(onSelect).toHaveBeenCalledWith(5);

      // Toggle View
      const toggleBtn = screen.getByText(UI_STRINGS.presentation.viewAll);
      fireEvent.click(toggleBtn);
      expect(onToggle).toHaveBeenCalledTimes(1);

      // Print PDF
      const printBtn = screen.getByText(UI_STRINGS.presentation.exportPdf);
      fireEvent.click(printBtn);
      expect(onPrint).toHaveBeenCalledTimes(1);

      // Close
      const closeBtn = screen.getByLabelText(UI_STRINGS.presentation.closeModal);
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('disables prev button on slide 1 and next button on slide 10', () => {
      const { rerender } = render(
        <PresentationControls
          currentSlide={1}
          totalSlides={10}
          isAllSlidesView={false}
          onPrevSlide={vi.fn()}
          onNextSlide={vi.fn()}
          onSelectSlide={vi.fn()}
          onToggleViewMode={vi.fn()}
          onPrint={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const prevBtn = screen.getByLabelText(UI_STRINGS.presentation.navPrev);
      expect(prevBtn).toBeDisabled();

      rerender(
        <PresentationControls
          currentSlide={10}
          totalSlides={10}
          isAllSlidesView={false}
          onPrevSlide={vi.fn()}
          onNextSlide={vi.fn()}
          onSelectSlide={vi.fn()}
          onToggleViewMode={vi.fn()}
          onPrint={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const nextBtn = screen.getByLabelText(UI_STRINGS.presentation.navNext);
      expect(nextBtn).toBeDisabled();
    });
  });
});
