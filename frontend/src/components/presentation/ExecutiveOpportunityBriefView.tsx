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
        className="bg-slate-900 border border-slate-700/80 rounded-2xl p-8 shadow-2xl text-slate-100 max-w-4xl mx-auto my-8"
        data-testid="executive-opportunity-brief-bronze-teaser"
      >
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Bronze Discover Snapshot</span>
            </div>
            <h2 className="text-2xl font-black text-white">Management Quick Summary</h2>
            <p className="text-xs text-slate-400 mt-1">
              Management Quick Summary is available with Silver.
            </p>
          </div>
          {onBackToWorkspace && (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Back to Workspace
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Spend Analyzed</div>
            <div className="text-2xl font-black text-white">₹420.00 Cr</div>
            <div className="text-[11px] text-slate-500 mt-1">Evaluated across all accounts</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Suppliers Analyzed</div>
            <div className="text-2xl font-black text-cyan-400">974</div>
            <div className="text-[11px] text-slate-500 mt-1">Active vendor network</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Material Categories</div>
            <div className="text-2xl font-black text-emerald-400">256</div>
            <div className="text-[11px] text-slate-500 mt-1">Material groups categorized</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-950 border border-cyan-800/40 rounded-xl p-6 mb-8 text-center space-y-3">
          <h3 className="text-base font-bold text-white">Preliminary Opportunity Detected</h3>
          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            Potential procurement improvement opportunities identified across multiple categories.
            Upgrade to Silver to unlock the full 10-slide executive opportunity presentation, quantified savings levers, and category analysis.
          </p>
          <div className="pt-2">
            <button
              type="button"
              data-testid="bronze-explore-silver-btn"
              onClick={onExploreSilver}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
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
      className={`bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 ${
        isFullScreen ? 'fixed inset-0 z-50 overflow-y-auto rounded-none p-8' : ''
      }`}
      data-testid="executive-opportunity-brief-view"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded">
              {strings.cfoDiscussionBadge}
            </span>
            <span className="text-xs text-slate-400">{strings.tenSlideEdition}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            {strings.title} — {clientName}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
              data-testid="brief-fullscreen-btn"
            >
              {isFullScreen ? strings.exitFullScreen : strings.openFullScreen}
            </button>
          )}
          <button
            type="button"
            onClick={onDownloadPdf}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow"
            data-testid="download-brief-pdf-btn"
          >
            {strings.downloadPdf}
          </button>
          <button
            type="button"
            onClick={onDownloadPptx}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow"
            data-testid="download-brief-pptx-btn"
          >
            {strings.downloadPptx}
          </button>
          {onBackToWorkspace && (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg"
              data-testid="back-to-workspace-btn"
            >
              {strings.backToWorkspace}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">{strings.slideCounter(currentSlide, 10)}</span>
          <span className="text-white font-bold">{SLIDE_TITLES[currentSlide - 1]}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentSlide((p) => Math.max(p - 1, 1))}
            disabled={currentSlide === 1}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded font-medium"
            data-testid="brief-prev-slide-btn"
          >
            {strings.previous}
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((p) => Math.min(p + 1, 10))}
            disabled={currentSlide === 10}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded font-medium"
            data-testid="brief-next-slide-btn"
          >
            {strings.next}
          </button>
        </div>
      </div>

      <div className="my-5 p-5 rounded-xl bg-slate-950 border border-slate-800 min-h-[340px] flex flex-col justify-between">
        <ExecutiveOpportunityBriefSlideContent currentSlide={currentSlide} />

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>{strings.confidentialFooter}</span>
          <span>PAGE {currentSlide} OF 10</span>
        </div>
      </div>
    </div>
  );
};
