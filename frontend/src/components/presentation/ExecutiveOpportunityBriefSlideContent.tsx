'use client';

import React from 'react';
import { UI_STRINGS } from '@/constants/uiStrings';
import type { ExecutiveOpportunityBriefSlideContentProps } from '@/types';

export const ExecutiveOpportunityBriefSlideContent: React.FC<ExecutiveOpportunityBriefSlideContentProps> = ({
  currentSlide,
  report
}): React.ReactElement => {
  const strings = UI_STRINGS.opportunityBrief;
  const labels = strings.metricLabels;
  const metricItems = [
    [labels.baselineSpend, strings.currencyCr(report.metrics.totalSpendCr)],
    [labels.estimatedSavings, strings.currencyCr(report.metrics.estimatedSavingsCr)],
    [labels.opportunityCount, strings.countValue(report.metrics.opportunityCount)],
    [labels.transactionCount, strings.countValue(report.metrics.transactionCount)],
    [labels.supplierCount, strings.countValue(report.metrics.supplierCount)],
    [labels.materialCount, strings.countValue(report.metrics.materialCount)],
    [labels.plantCount, strings.countValue(report.metrics.plantCount)],
    [labels.purchaseOrderCount, strings.countValue(report.metrics.purchaseOrderCount)]
  ];

  switch (currentSlide) {
    case 1:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="brief-slide-summary">
          {metricItems.slice(0, 4).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#DCE7F5] bg-[#F8FBFE] p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{label}</div>
              <div className="mt-2 text-2xl font-extrabold text-[#0B1B33]">{value}</div>
            </div>
          ))}
        </div>
      );
    case 2:
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="brief-slide-baseline">
          {metricItems.slice(0, 1).concat(metricItems.slice(3)).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#DCE7F5] bg-[#F8FBFE] p-4 text-center">
              <div className="text-xs text-[#64748B]">{label}</div>
              <div className="mt-1 text-lg font-bold text-[#0B1B33]">{value}</div>
            </div>
          ))}
        </div>
      );
    case 3:
    case 7:
      return (
        <div className="space-y-3" data-testid={currentSlide === 3 ? 'brief-slide-opportunities' : 'brief-slide-actions'}>
          {report.opportunities.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{strings.noRecords}</p>
          ) : report.opportunities.map((opportunity) => (
            <article key={opportunity.id} className="rounded-xl border border-[#DCE7F5] bg-white p-4">
              <h3 className="font-bold text-[#0B1B33]">
                {strings.opportunityTitle(opportunity.category, opportunity.title)}
              </h3>
              <p className="mt-1 text-xs text-[#475569]">
                {strings.opportunityDetails(opportunity.estimatedSavingsCr, opportunity.status, opportunity.riskLevel)}
              </p>
              {currentSlide === 7 && (
                <p className="mt-3 text-sm text-[#334155]">
                  <strong>{strings.recommendedAction}: </strong>{opportunity.recommendedAction}
                </p>
              )}
            </article>
          ))}
        </div>
      );
    case 4:
      return (
        <div className="space-y-3" data-testid="brief-slide-levers">
          {report.levers.length === 0 ? <p>{strings.noRecords}</p> : report.levers.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#DCE7F5] p-3">
              <span className="font-semibold text-[#0B1B33]">{item.label}</span>
              <span className="text-sm text-[#475569]">{strings.leverSummary(item.count, item.estimatedSavingsCr)}</span>
            </div>
          ))}
        </div>
      );
    case 5:
      return (
        <div className="space-y-3" data-testid="brief-slide-status">
          {report.statuses.length === 0 ? <p>{strings.noRecords}</p> : report.statuses.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#DCE7F5] p-3">
              <span className="font-semibold text-[#0B1B33]">{item.label}</span>
              <span className="text-sm text-[#475569]">{strings.leverSummary(item.count, item.estimatedSavingsCr)}</span>
            </div>
          ))}
        </div>
      );
    case 6:
      return (
        <div className="space-y-4" data-testid="brief-slide-risk">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="text-xs font-bold uppercase text-sky-800">{labels.averageConfidence}</div>
            <div className="mt-1 text-2xl font-extrabold text-[#0B1B33]">
              {strings.confidenceValue(report.metrics.averageConfidence)}
            </div>
          </div>
          {report.risks.length === 0 ? <p>{strings.noRecords}</p> : report.risks.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#DCE7F5] p-3">
              <span className="font-semibold text-[#0B1B33]">{item.label}</span>
              <span className="text-sm text-[#475569]">{strings.riskSummary(item.count, item.estimatedSavingsCr)}</span>
            </div>
          ))}
        </div>
      );
    case 8:
      return (
        <div className="grid grid-cols-2 gap-3" data-testid="brief-slide-footprint">
          {metricItems.slice(4).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#DCE7F5] bg-[#F8FBFE] p-4 text-center">
              <div className="text-xs text-[#64748B]">{label}</div>
              <div className="mt-1 text-xl font-bold text-[#0B1B33]">{value}</div>
            </div>
          ))}
        </div>
      );
    case 9:
      return (
        <div className="space-y-4" data-testid="brief-slide-scope">
          <div className="rounded-xl border border-[#DCE7F5] bg-[#F8FBFE] p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{strings.scopeLabel}</div>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">{report.scopeDescription}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#334155]">
            <p><strong>{labels.transactionPeriod}: </strong>{report.metrics.firstTransactionDate ?? strings.periodMissing} – {report.metrics.lastTransactionDate ?? strings.periodMissing}</p>
            <p><strong>{labels.reportGenerated}: </strong>{report.generatedAt}</p>
          </div>
        </div>
      );
    case 10:
      return (
        <div className="space-y-3" data-testid="brief-slide-next-actions">
          {report.opportunities.length === 0 ? <p>{strings.noRecords}</p> : report.opportunities.map((item) => (
            <div key={item.id} className="rounded-lg border border-[#DCE7F5] bg-[#F8FBFE] p-4">
              <div className="font-bold text-[#0B1B33]">{strings.opportunityTitle(item.category, item.title)}</div>
              <div className="mt-2 text-sm text-[#475569]">{item.recommendedAction}</div>
            </div>
          ))}
        </div>
      );
    default:
      return <div>{strings.unknownSlide(currentSlide)}</div>;
  }
};
