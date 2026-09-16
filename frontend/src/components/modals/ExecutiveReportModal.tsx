'use client';
import React, { useState } from 'react';
import type { ExecutiveReportModalProps } from '../../types';
import {
  DEFAULT_SPEND_BASELINE_INR_CR,
  DEFAULT_SAVINGS_TARGET_INR_CR,
  PRESENTATION_TOTAL_SLIDES
} from '../../constants';
import {
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
} from '../presentation';

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  tenant,
  opportunities,
  isOpen,
  onClose
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [isAllSlidesView, setIsAllSlidesView] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalSpendInrCr = tenant.total_spend_evaluated_inr || (tenant.total_spend_evaluated ? Number((tenant.total_spend_evaluated * 83.8 / 10000000).toFixed(2)) : DEFAULT_SPEND_BASELINE_INR_CR);
  const totalSavingsInrCr = opportunities && opportunities.length > 0
    ? Number(opportunities.reduce((sum, o) => sum + (o.est_savings_inr_cr || 0), 0).toFixed(2))
    : DEFAULT_SAVINGS_TARGET_INR_CR;
  const totalSlides = PRESENTATION_TOTAL_SLIDES;

  const handlePrint = () => {
    window.print();
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => Math.max(1, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => Math.min(totalSlides, prev + 1));
  };

  const handleSelectSlide = (slideNum: number) => {
    setCurrentSlide(slideNum);
    setIsAllSlidesView(false);
  };

  const handleToggleViewMode = () => {
    setIsAllSlidesView((prev) => !prev);
  };

  const slideProps = {
    tenantEnterpriseName: tenant.enterprise_name,
    totalSpendInrCr,
    totalSavingsInrCr,
    totalSlides,
    opportunities
  };

  const renderSlideContent = (num: number) => {
    switch (num) {
      case 1:
        return <Slide1Cover {...slideProps} slideNumber={1} />;
      case 2:
        return <Slide2Confidentiality {...slideProps} slideNumber={2} />;
      case 3:
        return <Slide3AboutProcucev {...slideProps} slideNumber={3} />;
      case 4:
        return <Slide4ExecutiveScorecard {...slideProps} slideNumber={4} />;
      case 5:
        return <Slide5SpendIngestionAudit {...slideProps} slideNumber={5} />;
      case 6:
        return <Slide6CategoryTaxonomyBreakdown {...slideProps} slideNumber={6} />;
      case 7:
        return <Slide7StrategicConcentrationRisk {...slideProps} slideNumber={7} />;
      case 8:
        return <Slide8PriceCreepContractLeakage {...slideProps} slideNumber={8} />;
      case 9:
        return <Slide9SavingsLeversRoadmap {...slideProps} slideNumber={9} />;
      case 10:
        return <Slide10ExecutionGovernance {...slideProps} slideNumber={10} />;
      default:
        return <Slide1Cover {...slideProps} slideNumber={1} />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-6xl max-h-[96vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col glass-panel-glow my-auto">
        {/* Top Presentation Navigation Toolbar */}
        <PresentationControls
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          isAllSlidesView={isAllSlidesView}
          onPrevSlide={handlePrevSlide}
          onNextSlide={handleNextSlide}
          onSelectSlide={handleSelectSlide}
          onToggleViewMode={handleToggleViewMode}
          onPrint={handlePrint}
          onClose={onClose}
        />

        {/* Presentation Slide Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/70 dark:bg-[#070b14] flex-1">
          {isAllSlidesView ? (
            /* All Slides (Handout Deck) View */
            <div className="space-y-8 max-w-5xl mx-auto">
              {Array.from({ length: totalSlides }, (_, idx) => (
                <div key={idx + 1} className="w-full">
                  {renderSlideContent(idx + 1)}
                </div>
              ))}
            </div>
          ) : (
            /* Single Slide View */
            <div className="w-full max-w-5xl mx-auto">
              {renderSlideContent(currentSlide)}
            </div>
          )}

          {/* Hidden Container for Print: Always renders all 10 slides sequentially in print mode */}
          <div className="hidden print:block space-y-0">
            {Array.from({ length: totalSlides }, (_, idx) => (
              <div key={`print-slide-${idx + 1}`} className="w-full">
                {renderSlideContent(idx + 1)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
