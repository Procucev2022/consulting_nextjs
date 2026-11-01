'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  ExecutiveBriefOpportunityTableProps,
  ExecutiveOpportunityBriefFetchResult,
  ExecutiveOpportunityBriefLoadState,
  ExecutiveOpportunityBriefReportData
} from '../../types';
import { UI_STRINGS } from '../../constants/uiStrings';
import { fetchExecutiveOpportunityBriefReport } from '../../utils/executiveOpportunityBriefApi';
import { logger as frontendLogger } from '../../utils/logger';

const renderGroupSection = (
  title: string,
  groups: readonly ExecutiveOpportunityBriefReportData['levers'][number][],
  testId: string
): React.ReactElement => (
  <section className="rounded-xl border border-[#DCE7F5] bg-white p-4" data-testid={testId}>
    <h3 className="text-xs font-bold uppercase tracking-wide text-[#0B1B33]">{title}</h3>
    {groups.length === 0 ? (
      <p className="mt-3 text-xs text-[#64748B]">{UI_STRINGS.opportunityBrief.noGroups}</p>
    ) : (
      <ul className="mt-3 space-y-2">
        {groups.map((group) => (
          <li key={group.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-medium text-[#334155]">{group.label}</span>
            <span className="shrink-0 text-right text-[#64748B]">
              {UI_STRINGS.opportunityBrief.countValue(group.count)} {UI_STRINGS.opportunityBrief.countLabel}
              {' · '}{UI_STRINGS.opportunityBrief.currencyCr(group.estimatedSavingsCr)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export const ExecutiveBriefOpportunityTable: React.FC<ExecutiveBriefOpportunityTableProps> = ({
  onDrillOpportunity
}) => {
  const [loadState, setLoadState] = useState<ExecutiveOpportunityBriefLoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState<number>(0);
  const strings = UI_STRINGS.opportunityBrief;

  const loadReport = useCallback(async (): Promise<ExecutiveOpportunityBriefFetchResult> => {
    try {
      return await fetchExecutiveOpportunityBriefReport();
    } catch (error: unknown) {
      frontendLogger.error('Executive brief opportunity panel request failed', {
        action: 'executiveBrief.opportunityPanel'
      }, error);
      return { ok: false, statusCode: 0, requestId: null };
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setLoadState({ status: 'loading' });
    void loadReport().then((result) => {
      if (!isCurrent) return;
      if (result.ok === true) {
        setLoadState({ status: 'ready', report: result.data });
        return;
      }
      frontendLogger.error('Executive brief opportunity panel could not load D1 data', {
        action: 'executiveBrief.opportunityPanel',
        statusCode: result.statusCode,
        requestId: result.requestId
      });
      setLoadState({ status: 'failed', statusCode: result.statusCode, requestId: result.requestId });
    });
    return () => {
      isCurrent = false;
    };
  }, [attempt, loadReport]);

  if (loadState.status === 'loading') {
    return (
      <section className="rounded-2xl border border-[#DCE7F5] bg-white p-6 text-sm text-[#475569]" role="status" data-testid="executive-brief-opportunities-loading">
        {strings.reportLoading}
      </section>
    );
  }

  if (loadState.status === 'failed') {
    const message = loadState.statusCode === 0
      ? strings.reportUnavailableNetwork
      : strings.reportUnavailable(loadState.statusCode, loadState.requestId ?? strings.requestIdNotReturned);
    return (
      <section className="rounded-2xl border border-rose-200 bg-white p-6" data-testid="executive-brief-opportunities-error">
        <p className="text-sm text-rose-800" role="alert">{message}</p>
        <button type="button" className="mt-4 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-bold text-white" onClick={() => setAttempt((current) => current + 1)}>
          {strings.retryPanel}
        </button>
      </section>
    );
  }

  const report = loadState.report;
  return (
    <section className="space-y-4" aria-labelledby="executive-brief-opportunity-panel-title" data-testid="executive-brief-opportunity-panel">
      <header className="rounded-2xl border border-[#DCE7F5] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="executive-brief-opportunity-panel-title" className="text-sm font-black uppercase tracking-wider text-[#0B1B33]">
              {strings.reportPanelTitle}
            </h2>
            <p className="mt-1 text-xs text-[#475569]">{report.tenant.enterpriseName}</p>
            <p className="mt-2 text-xs text-[#64748B]">{strings.reportPanelDescription}</p>
          </div>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-800" data-testid="executive-brief-data-classification">
            {strings.classificationLabel}: {strings.classificationValues[report.dataClassification]}
          </span>
        </div>
        <p className="mt-3 rounded-lg bg-[#F8FBFE] p-3 text-xs leading-relaxed text-[#475569]">{report.scopeDescription}</p>
        <p className="mt-2 text-[10px] text-[#64748B]">{strings.reportAsOf(report.generatedAt)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          <article className="rounded-lg border border-[#DCE7F5] bg-[#F8FBFE] p-3">
            <h3 className="text-[10px] font-semibold uppercase text-[#64748B]">{strings.metricLabels.baselineSpend}</h3>
            <p className="mt-1 text-sm font-bold text-[#0B1B33]">{strings.currencyCr(report.metrics.totalSpendCr)}</p>
          </article>
          <article className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <h3 className="text-[10px] font-semibold uppercase text-emerald-800">{strings.metricLabels.estimatedSavings}</h3>
            <p className="mt-1 text-sm font-bold text-emerald-800">{strings.currencyCr(report.metrics.estimatedSavingsCr)}</p>
          </article>
          <article className="rounded-lg border border-[#DCE7F5] bg-[#F8FBFE] p-3">
            <h3 className="text-[10px] font-semibold uppercase text-[#64748B]">{strings.metricLabels.opportunityCount}</h3>
            <p className="mt-1 text-sm font-bold text-[#0B1B33]">{strings.countValue(report.metrics.opportunityCount)}</p>
          </article>
          <article className="rounded-lg border border-[#DCE7F5] bg-[#F8FBFE] p-3">
            <h3 className="text-[10px] font-semibold uppercase text-[#64748B]">{strings.metricLabels.transactionCount}</h3>
            <p className="mt-1 text-sm font-bold text-[#0B1B33]">{strings.countValue(report.metrics.transactionCount)}</p>
          </article>
          <article className="rounded-lg border border-[#DCE7F5] bg-[#F8FBFE] p-3">
            <h3 className="text-[10px] font-semibold uppercase text-[#64748B]">{strings.metricLabels.supplierCount}</h3>
            <p className="mt-1 text-sm font-bold text-[#0B1B33]">{strings.countValue(report.metrics.supplierCount)}</p>
          </article>
          <article className="rounded-lg border border-[#DCE7F5] bg-[#F8FBFE] p-3">
            <h3 className="text-[10px] font-semibold uppercase text-[#64748B]">{strings.confidenceLabel}</h3>
            <p className="mt-1 text-sm font-bold text-[#0B1B33]">{strings.confidenceValue(report.metrics.averageConfidence)}</p>
          </article>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {renderGroupSection(strings.leverBreakdownTitle, report.levers, 'executive-brief-lever-breakdown')}
        {renderGroupSection(strings.statusBreakdownTitle, report.statuses, 'executive-brief-status-breakdown')}
        {renderGroupSection(strings.riskBreakdownTitle, report.risks, 'executive-brief-risk-breakdown')}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#DCE7F5] bg-white shadow-sm" aria-labelledby="executive-brief-d1-register-title">
        <div className="border-b border-[#DCE7F5] p-4">
          <h3 id="executive-brief-d1-register-title" className="text-sm font-bold text-[#0B1B33]">{strings.registerTitle}</h3>
        </div>
        {report.opportunities.length === 0 ? (
          <p className="p-5 text-xs text-[#64748B]">{strings.noOpportunities}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="bg-[#F8FBFE] text-[10px] uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="p-3">{strings.opportunityIdLabel}</th>
                  <th className="p-3">{strings.categoryLabel}</th>
                  <th className="p-3">{strings.currentSpendLabel}</th>
                  <th className="p-3">{strings.estimatedSavingsLabel}</th>
                  <th className="p-3">{strings.leverLabel}</th>
                  <th className="p-3">{strings.statusLabel}</th>
                  <th className="p-3">{strings.riskLabel}</th>
                  <th className="p-3">{strings.confidenceLabel}</th>
                  <th className="p-3">{strings.actionLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE7F5]">
                {report.opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="align-top text-[#334155]">
                    <td className="p-3 font-mono font-bold text-[#0284C7]">
                      {onDrillOpportunity ? (
                        <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => onDrillOpportunity(opportunity.id)}>
                          {opportunity.id}
                        </button>
                      ) : <span>{opportunity.id}</span>}
                    </td>
                    <td className="p-3"><span className="font-semibold text-[#0B1B33]">{opportunity.category}</span><span className="mt-1 block">{opportunity.title}</span></td>
                    <td className="whitespace-nowrap p-3 tabular-nums">{strings.currencyCr(opportunity.currentSpendCr)}</td>
                    <td className="whitespace-nowrap p-3 font-semibold tabular-nums text-emerald-800">{strings.currencyCr(opportunity.estimatedSavingsCr)}</td>
                    <td className="p-3">{opportunity.lever}</td>
                    <td className="p-3">{opportunity.status}</td>
                    <td className="p-3">{opportunity.riskLevel}</td>
                    <td className="p-3 tabular-nums">{strings.confidenceValue(opportunity.confidence)}</td>
                    <td className="min-w-56 p-3">{opportunity.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
};
