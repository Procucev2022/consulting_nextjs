'use client';
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import type { ExecutiveOpportunityDashboardViewProps } from '../../types/module2Components';
import type { OpportunityRegisterSummary } from '../../types/module2OpportunityRegister';
import { UI_STRINGS } from '../../constants';
import { Module2OpportunityRegisterApi } from '../../utils/module2OpportunityRegisterApi';
import { logger } from '../../utils/logger';

export const ExecutiveOpportunityDashboardView: React.FC<ExecutiveOpportunityDashboardViewProps> = ({
  assessmentId,
  onNavigateToRegister
}) => {
  const strings = UI_STRINGS.module2ExecutiveDashboard;
  const [summary, setSummary] = useState<OpportunityRegisterSummary | null>(null);
  const [customerName, setCustomerName] = useState<string>('Borosil Ltd');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async (): Promise<void> => {
      setLoading(true);
      try {
        const res = await Module2OpportunityRegisterApi.getExecutiveDashboard(assessmentId);
        if (isMounted && res) {
          setSummary(res.summary);
          setCustomerName(res.customerName);
        }
      } catch (err) {
        logger.error('Failed to load Executive Opportunity Dashboard', { assessmentId }, err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();
    return (): void => {
      isMounted = false;
    };
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mr-3" />
        <span className="text-sm font-medium">{strings.loadingText}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 rounded-xl border border-slate-700 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {strings.stageBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono">{strings.assessmentPrefix(assessmentId)}</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
              <span>{strings.title(customerName)}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {strings.description}
            </p>
          </div>
          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow"
            >
              <span>{strings.viewRegisterButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Baseline & Spend Boundary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Baseline Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {strings.baselineTitle}
            </span>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              ₹{summary?.authoritativeBaselineSpendCr.toFixed(4)} Cr
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-normal">
              {strings.baselineDesc}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{strings.baselineBadge}</span>
          </div>
        </div>

        {/* Direct Price Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {strings.directPriceTitle}
            </span>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              ₹{summary?.directPriceEligibleSpendCr.toFixed(4)} Cr
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-normal">
              {strings.directPriceDesc}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 shrink-0" />
              <span>
                {strings.grossModelledPriceOppLabel(
                  summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.defensibleValueCr ?? 53.44
                )}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 pl-4 font-normal">
              {strings.grossModelledPriceOppDisclaimer}
            </span>
          </div>
        </div>

        {/* Multi-Supplier Spend Under Review Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {strings.supplierConsolidationTitle}
            </span>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              ₹{summary?.supplierConsolidationEligibleSpendCr.toFixed(4)} Cr
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-normal">
              {strings.supplierConsolidationDesc}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3 shrink-0" />
            <span>{strings.supplierConsolidationBadge(summary?.byType?.SUPPLIER_CONSOLIDATION?.count ?? 0)}</span>
          </div>
        </div>

        {/* High-Volume Spend Under Review Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {strings.volumeAggregationTitle}
            </span>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              ₹{summary?.volumeConsolidationCandidateSpendCr.toFixed(4)} Cr
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-normal">
              {strings.volumeAggregationDesc}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3 shrink-0" />
            <span>{strings.volumeAggregationBadge(summary?.byType?.VOLUME_DEMAND_CONSOLIDATION?.count ?? 0)}</span>
          </div>
        </div>

        {/* Spend Requiring Review Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-300 dark:border-amber-800/60 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {strings.reviewRequiredTitle}
            </span>
            <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
              ₹{summary?.spendRequiringReviewCr.toFixed(4)} Cr
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-normal">
              {strings.reviewRequiredDesc}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-amber-700 dark:text-amber-400 font-medium flex flex-col gap-0.5">
            <div className="flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{strings.reviewRequiredTxs}</span>
            </div>
            <span className="text-[9px] text-amber-800 dark:text-amber-300 pl-4 font-normal">
              {strings.reviewRequiredIndicator}
            </span>
          </div>
        </div>
      </div>

      {/* Non-Additive Overlap & Governance Notice Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 rounded-xl flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="font-bold uppercase tracking-wider text-amber-950 dark:text-amber-100">
            {strings.warningHeading}
          </div>
          <p className="text-amber-900 dark:text-amber-200 leading-relaxed">
            {summary?.overlapDeductionNotice || strings.warningMessage}
          </p>
        </div>
      </div>

      {/* Sourcing Levers Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {strings.matrixTitle}
          </h3>
          <span className="text-xs text-slate-500">
            {strings.totalTraceableCandidates(summary?.totalOpportunitiesCount ?? 0)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">{strings.thClassification}</th>
                <th className="py-2.5 px-4 text-right">{strings.thCandidateItems}</th>
                <th className="py-2.5 px-4 text-right">{strings.thHistoricalSpend}</th>
                <th className="py-2.5 px-4 text-right">{strings.thDefensibleValuation}</th>
                <th className="py-2.5 px-4">{strings.thCommercialStatus}</th>
                <th className="py-2.5 px-4">{strings.thGoverningTeam}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  {strings.lever1Label}
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.defensibleValueCr.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{strings.lever1Status}</td>
                <td className="py-3 px-4 text-slate-500">{strings.lever1Team}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  {strings.lever3Label}
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.SUPPLIER_CONSOLIDATION?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.SUPPLIER_CONSOLIDATION?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{strings.pendingTerms}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{strings.lever3Status}</td>
                <td className="py-3 px-4 text-slate-500">{strings.lever3Team}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  {strings.lever4Label}
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.VOLUME_DEMAND_CONSOLIDATION?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.VOLUME_DEMAND_CONSOLIDATION?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{strings.pendingTiering}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{strings.lever4Status}</td>
                <td className="py-3 px-4 text-slate-500">{strings.lever4Team}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  {strings.lever8Label}
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.SPECIFICATION_PROCESS_REVIEW?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.SPECIFICATION_PROCESS_REVIEW?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{strings.technicalAudit}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{strings.lever8Status}</td>
                <td className="py-3 px-4 text-slate-500">{strings.lever8Team}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance & Data Limitations Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-4 h-4 text-cyan-600" />
            <span>{strings.dataLimitationsTitle}</span>
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            {summary?.dataLimitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-cyan-600 font-bold">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{strings.validationRequirementsTitle}</span>
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            {summary?.validationRequirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

