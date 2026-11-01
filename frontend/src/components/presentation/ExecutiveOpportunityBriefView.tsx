'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Shield } from 'lucide-react';
import type { ExecutiveOpportunityBriefLoadState, ExecutiveOpportunityBriefViewProps } from '@/types';
import { UI_STRINGS } from '@/constants/uiStrings';
import { fetchExecutiveOpportunityBriefReport } from '@/utils/executiveOpportunityBriefApi';
import { logger as frontendLogger } from '@/utils/logger';
import { ExecutiveOpportunityBriefSlideContent } from './ExecutiveOpportunityBriefSlideContent';

export const ExecutiveOpportunityBriefView: React.FC<ExecutiveOpportunityBriefViewProps> = ({
  clientName,
  onDownloadPdf,
  onDownloadPptx,
  onBackToWorkspace,
  isFullScreen = false,
  onToggleFullScreen,
  currentTier = 'GOLD',
  onExploreSilver
}): React.ReactElement => {
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [attempt, setAttempt] = useState<number>(0);
  const [loadState, setLoadState] = useState<ExecutiveOpportunityBriefLoadState>({ status: 'loading' });
  const strings = UI_STRINGS.opportunityBrief;
  const totalSlides = strings.slideTitles.length;

  useEffect(() => {
    let isCurrent = true;
    setLoadState({ status: 'loading' });
    void fetchExecutiveOpportunityBriefReport().then((result) => {
      if (!isCurrent) return;
      if (result.ok === true) {
        setLoadState({ status: 'ready', report: result.data });
        return;
      }
      frontendLogger.error('Opportunity Brief report data could not be loaded', {
        statusCode: result.statusCode,
        requestId: result.requestId,
        action: 'opportunityBrief.report'
      });
      setLoadState({ status: 'failed', statusCode: result.statusCode, requestId: result.requestId });
    }).catch((error: unknown) => {
      if (!isCurrent) return;
      frontendLogger.error('Opportunity Brief report request failed unexpectedly', {
        action: 'opportunityBrief.report'
      }, error);
      setLoadState({ status: 'failed', statusCode: 0, requestId: null });
    });
    return () => {
      isCurrent = false;
    };
  }, [attempt]);

  if (loadState.status === 'loading') {
    return (
      <div className="mx-auto my-8 max-w-4xl rounded-2xl border border-[#DCE7F5] bg-white p-8 text-center shadow-sm" data-testid="opportunity-brief-loading">
        <p className="text-sm text-slate-600">{strings.reportLoading}</p>
        {onBackToWorkspace && (
          <button type="button" onClick={onBackToWorkspace} className="mt-4 rounded-lg border border-[#DCE7F5] bg-white px-4 py-2 text-sm font-semibold text-[#0B1B33]" data-testid="back-to-workspace-btn">
            {strings.backToWorkspace}
          </button>
        )}
      </div>
    );
  }

  if (loadState.status === 'failed') {
    const message = loadState.statusCode === 0
      ? strings.reportUnavailableNetwork
      : strings.reportUnavailable(loadState.statusCode, loadState.requestId ?? strings.requestIdNotReturned);
    return (
      <div className="mx-auto my-8 max-w-4xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm" data-testid="opportunity-brief-load-error">
        <p role="alert" className="text-sm text-rose-800">{message}</p>
        <button
          type="button"
          onClick={() => setAttempt((current) => current + 1)}
          className="mt-4 rounded-lg bg-[#0284C7] px-4 py-2 text-sm font-bold text-white"
          data-testid="retry-opportunity-brief-btn"
        >
          {strings.reportRetry}
        </button>
        {onBackToWorkspace && (
          <button type="button" onClick={onBackToWorkspace} className="ml-3 mt-4 rounded-lg border border-[#DCE7F5] bg-white px-4 py-2 text-sm font-semibold text-[#0B1B33]" data-testid="back-to-workspace-btn">
            {strings.backToWorkspace}
          </button>
        )}
      </div>
    );
  }

  const report = loadState.report;
  const resolvedClientName = report.tenant.enterpriseName || clientName || strings.metricLabels.enterprise;

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
              <span>{strings.bronzeTitle}</span>
            </div>
            <h2 className="text-2xl font-black text-[#0B1B33]">{strings.title}</h2>
            <p className="text-xs text-[#475569] mt-1">{strings.bronzeAvailable}</p>
          </div>
          {onBackToWorkspace && (
            <button type="button" onClick={onBackToWorkspace} className="px-4 py-2 bg-white text-[#0B1B33] border border-[#DCE7F5] rounded-xl text-xs font-bold">
              {strings.backToWorkspace}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          {[
            [strings.bronzeSpendLabel, strings.currencyCr(report.metrics.totalSpendCr), strings.bronzeSpendDescription],
            [strings.bronzeSupplierLabel, strings.countValue(report.metrics.supplierCount), strings.bronzeSupplierDescription],
            [strings.bronzeMaterialLabel, strings.countValue(report.metrics.materialCount), strings.bronzeMaterialDescription]
          ].map(([label, value, description]) => (
            <div key={label} className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-5 text-center">
              <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider mb-1">{label}</div>
              <div className="text-2xl font-black text-[#0B1B33]">{value}</div>
              <div className="text-[11px] text-[#64748B] mt-1">{description}</div>
            </div>
          ))}
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 mb-2 text-center space-y-3">
          <h3 className="text-base font-bold text-[#0B1B33]">{strings.preliminaryOpportunityTitle}</h3>
          <p className="text-xs text-[#475569] max-w-xl mx-auto leading-relaxed">{strings.preliminaryOpportunityDescription}</p>
          <button
            type="button"
            data-testid="bronze-explore-silver-btn"
            onClick={onExploreSilver}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0284C7] text-white text-xs font-bold rounded-xl"
          >
            <span>{strings.openSilver}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
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
          <h2 className="text-2xl font-bold text-[#0B1B33] mt-1">{strings.title} — {resolvedClientName}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onToggleFullScreen && (
            <button type="button" onClick={onToggleFullScreen} className="px-3 py-1.5 bg-white text-[#0B1B33] text-xs font-semibold rounded-lg border border-[#DCE7F5]" data-testid="brief-fullscreen-btn">
              {isFullScreen ? strings.exitFullScreen : strings.openFullScreen}
            </button>
          )}
          <button type="button" onClick={onDownloadPdf} className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg" data-testid="download-brief-pdf-btn">
            {strings.downloadPdf}
          </button>
          <button type="button" onClick={onDownloadPptx} className="px-3.5 py-1.5 bg-[#0284C7] text-white text-xs font-bold rounded-lg" data-testid="download-brief-pptx-btn">
            {strings.downloadPptx}
          </button>
          {onBackToWorkspace && (
            <button type="button" onClick={onBackToWorkspace} className="px-3 py-1.5 bg-white text-[#0B1B33] text-xs font-semibold rounded-lg border border-[#DCE7F5]" data-testid="back-to-workspace-btn">
              {strings.backToWorkspace}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between py-3 border-b border-[#DCE7F5] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#64748B]">{strings.slideCounter(currentSlide, totalSlides)}</span>
          <span className="text-[#0B1B33] font-bold">{strings.slideTitles[currentSlide - 1] ?? strings.unknownSlide(currentSlide)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrentSlide((current) => Math.max(current - 1, 1))} disabled={currentSlide === 1} className="px-3 py-1 bg-white border border-[#DCE7F5] text-[#0B1B33] disabled:opacity-40 rounded" data-testid="brief-prev-slide-btn">{strings.previous}</button>
          <button type="button" onClick={() => setCurrentSlide((current) => Math.min(current + 1, totalSlides))} disabled={currentSlide === totalSlides} className="px-3 py-1 bg-white border border-[#DCE7F5] text-[#0B1B33] disabled:opacity-40 rounded" data-testid="brief-next-slide-btn">{strings.next}</button>
        </div>
      </div>
      <div className="my-5 p-5 rounded-xl bg-white border border-[#DCE7F5] shadow-xs min-h-[340px] flex flex-col justify-between">
        <ExecutiveOpportunityBriefSlideContent currentSlide={currentSlide} report={report} />
        <div className="pt-4 border-t border-[#DCE7F5] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>{strings.confidentialFooter}</span>
          <span>{strings.slidePage(currentSlide, totalSlides)}</span>
        </div>
      </div>
    </div>
  );
};
