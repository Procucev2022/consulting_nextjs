'use client';

/**
 * 10-Slide CFO/CEO Executive Opportunity Brief Web Presentation Component (Prompt 286/287)
 * Shared Data Contract: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT
 */

import React, { useState } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import type { ExecutiveOpportunityBriefViewProps } from '@/types';
import { UI_STRINGS } from '@/constants/uiStrings';
import { ExecutiveOpportunityBriefSlideContent } from './ExecutiveOpportunityBriefSlideContent';

const SLIDE_TITLES = [
  '01 — The Opportunity',
  '02 — What We Found',
  '03 — Where the Opportunity Is Concentrated',
  '04 — The Value Bridge',
  '05 — Why Value Is Defensible',
  '06 — How Value Will Be Captured',
  '07 — Wave 1',
  '08 — 90-Day Execution',
  '09 — Why Procucev + aiCEV',
  '10 — Proposed Next Steps'
];

export const ExecutiveOpportunityBriefView: React.FC<ExecutiveOpportunityBriefViewProps> = ({
  clientName = 'UltraTech Cement Limited',
  onDownloadPdf,
  onDownloadPptx,
  onBackToWorkspace,
  isFullScreen = false,
  onToggleFullScreen,
  currentTier = 'GOLD',
  onExploreSilver
}): React.ReactElement => {
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const strings = UI_STRINGS.opportunityBrief;

  if (currentTier === 'BRONZE') {
    return (
      <div
        className="bg-white border border-[#DCE7F5] rounded-2xl p-8 shadow-sm text-[#0B1B33] max-w-4xl mx-auto my-8"
        data-testid="executive-opportunity-brief-bronze-teaser"
      >
        <div className="flex items-center justify-between pb-6 border-b border-[#DCE7F5]">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Bronze Discover Snapshot</span>
            </div>
            <h2 className="text-2xl font-black text-[#0B1B33]">Management Quick Summary</h2>
            <p className="text-xs text-[#475569] mt-1">
              Management Quick Summary is available with Silver.
            </p>
          </div>
          {onBackToWorkspace && (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="px-4 py-2 bg-white hover:bg-[#F8FBFE] text-[#0B1B33] border border-[#DCE7F5] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Back to Workspace
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-5 text-center">
            <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-1">Spend Analyzed</div>
            <div className="text-2xl font-black text-[#0B1B33]">₹420.00 Cr</div>
            <div className="text-[11px] text-[#64748B] mt-1">Evaluated across all accounts</div>
          </div>
          <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-5 text-center">
            <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-1">Suppliers Analyzed</div>
            <div className="text-2xl font-black text-[#0284C7]">974</div>
            <div className="text-[11px] text-[#64748B] mt-1">Active vendor network</div>
          </div>
          <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-5 text-center">
            <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-1">Material Categories</div>
            <div className="text-2xl font-black text-emerald-700">256</div>
            <div className="text-[11px] text-[#64748B] mt-1">Material groups categorized</div>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 mb-8 text-center space-y-3">
          <h3 className="text-base font-bold text-[#0B1B33]">Preliminary Opportunity Detected</h3>
          <p className="text-xs text-[#475569] max-w-xl mx-auto leading-relaxed">
            Potential procurement improvement opportunities identified across multiple categories.
            Upgrade to Silver to unlock the full 10-slide executive opportunity presentation, quantified savings levers, and category analysis.
          </p>
          <div className="pt-2">
            <button
              type="button"
              data-testid="bronze-explore-silver-btn"
              onClick={onExploreSilver}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>{UI_STRINGS.subscription.exploreSilver}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[#DCE7F5] rounded-2xl p-6 shadow-sm text-[#0B1B33] ${
        isFullScreen ? 'fixed inset-0 z-50 overflow-y-auto rounded-none p-8' : ''
      }`}
      data-testid="executive-opportunity-brief-view"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#DCE7F5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {strings.cfoDiscussionBadge}
            </span>
            <span className="text-xs text-[#64748B]">{strings.tenSlideEdition}</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0B1B33] mt-1">
            {strings.title} — {clientName}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FBFE] text-[#0B1B33] text-xs font-semibold rounded-lg border border-[#DCE7F5] transition-colors cursor-pointer"
              data-testid="brief-fullscreen-btn"
            >
              {isFullScreen ? strings.exitFullScreen : strings.openFullScreen}
            </button>
          )}
          <button
            type="button"
            onClick={onDownloadPdf}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            data-testid="download-brief-pdf-btn"
          >
            {strings.downloadPdf}
          </button>
          <button
            type="button"
            onClick={onDownloadPptx}
            className="px-3.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            data-testid="download-brief-pptx-btn"
          >
            {strings.downloadPptx}
          </button>
          {onBackToWorkspace && (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FBFE] text-[#0B1B33] text-xs font-semibold rounded-lg border border-[#DCE7F5] transition-colors cursor-pointer"
              data-testid="back-to-workspace-btn"
            >
              {strings.backToWorkspace}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-[#DCE7F5] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#64748B]">{strings.slideCounter(currentSlide, 10)}</span>
          <span className="text-[#0B1B33] font-bold">{SLIDE_TITLES[currentSlide - 1]}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentSlide((p) => Math.max(p - 1, 1))}
            disabled={currentSlide === 1}
            className="px-3 py-1 bg-white hover:bg-[#F8FBFE] border border-[#DCE7F5] text-[#0B1B33] disabled:opacity-40 rounded font-medium transition-colors cursor-pointer"
            data-testid="brief-prev-slide-btn"
          >
            {strings.previous}
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((p) => Math.min(p + 1, 10))}
            disabled={currentSlide === 10}
            className="px-3 py-1 bg-white hover:bg-[#F8FBFE] border border-[#DCE7F5] text-[#0B1B33] disabled:opacity-40 rounded font-medium transition-colors cursor-pointer"
            data-testid="brief-next-slide-btn"
          >
            {strings.next}
          </button>
        </div>
      </div>

      <div className="my-5 p-5 rounded-xl bg-white border border-[#DCE7F5] shadow-xs min-h-[340px] flex flex-col justify-between">
        <ExecutiveOpportunityBriefSlideContent currentSlide={currentSlide} />

        <div className="pt-4 border-t border-[#DCE7F5] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>{strings.confidentialFooter}</span>
          <span>PAGE {currentSlide} OF 10</span>
        </div>
      </div>
    </div>
  );
};
