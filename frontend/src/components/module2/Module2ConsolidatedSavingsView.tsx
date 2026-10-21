'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Layers,
  Info,
  DollarSign,
  Briefcase,
  RefreshCw,
  Scale
} from 'lucide-react';
import type { Module2ConsolidatedSavingsSummary } from '../../types';
import { UI_STRINGS } from '../../constants';
import { Module2ConsolidatedOpportunityTable } from './Module2ConsolidatedOpportunityTable';
import logger from '../../utils/logger';

interface Module2ConsolidatedSavingsViewProps {
  assessmentId?: string;
  initialData?: Module2ConsolidatedSavingsSummary | null;
}

export const Module2ConsolidatedSavingsView: React.FC<Module2ConsolidatedSavingsViewProps> = ({
  assessmentId = 'AIC-2026-0002',
  initialData = null
}) => {
  const strings = UI_STRINGS.module2SavingsDeduplication;
  const [data, setData] = useState<Module2ConsolidatedSavingsSummary | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/module2/sourcing/consolidated-savings?assessmentId=${encodeURIComponent(assessmentId)}`);
      if (!res.ok) {
        throw new Error(`Failed to load consolidated savings: HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Unknown response format');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Error fetching consolidated savings', { assessmentId }, err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [fetchData, initialData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Loading cross-lever savings deduplication analysis...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span>Error loading cross-lever deduplication data</span>
        </div>
        <p className="text-xs">{error || 'Data is unavailable'}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-3 px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full py-2">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              MODULE 2 CROSS-LEVER CONTROL
            </span>
            <span className="text-xs font-mono text-slate-500">{data.assessmentId}</span>
            <span className="text-xs text-slate-400">• {data.customerName}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {strings.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-4xl">
            {strings.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {data.isArithmeticallyBalanced && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{strings.arithmeticBalancedBadge}</span>
            </div>
          )}
          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Gross Estimated Savings */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{strings.grossEstimatedSavingsLabel}</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">GROSS</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            ₹{data.grossEstimatedSavingsCr.toFixed(2)} Cr
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-tight">
            {strings.grossEstimatedSavingsDesc}
          </p>
        </div>

        {/* Card 2: Net Estimated Savings (Hero) */}
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-500/40 dark:border-blue-700/60 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-semibold">
            <span>{strings.netEstimatedSavingsLabel}</span>
            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">NET DEFENDED</span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-950 dark:text-blue-100">
            ₹{data.netEstimatedSavingsCr.toFixed(2)} Cr
          </div>
          <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-1 leading-tight">
            Eliminated ₹{data.totalOverlappingDeductionsCr.toFixed(2)} Cr in cross-lever double-counting
          </p>
        </div>

        {/* Card 3: Commercially Validated Savings */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{strings.commerciallyValidatedSavingsLabel}</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold">VALIDATED</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{data.commerciallyValidatedSavingsCr.toFixed(2)} Cr
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-tight">
            {strings.commerciallyValidatedSavingsDesc}
          </p>
        </div>

        {/* Card 4: Unquantified Opportunities */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{strings.unquantifiedOpportunitiesLabel}</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">DISCOVERY</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.unquantifiedOpportunitiesCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-tight">
            Discovery / Phase 1 candidate categories awaiting technical or bid evidence
          </p>
        </div>

        {/* Card 5: Unresolved Overlaps Excluded */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{strings.unresolvedOverlapsExcludedLabel}</span>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono">EXCLUDED</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₹{data.unresolvedOverlapsExcludedCr.toFixed(2)} Cr
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-tight">
            Excluded from net savings due to unverified scope overlap
          </p>
        </div>
      </div>

      {/* Lever 5 Financial Metrics Segregation Callout */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Lever 5 Payment Terms & Working Capital Segregation (Rule 5 Safeguard)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {strings.workingCapitalNote}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
            <div className="text-right">
              <span className="block text-[10px] text-slate-400">ANNUAL FINANCING BENEFIT</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                ₹{data.lever5AnnualFinancingBenefitCr.toFixed(2)} Cr
              </span>
            </div>
            <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
              <span className="block text-[10px] text-slate-400">WORKING CAPITAL RELEASED</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                ₹{data.lever5WorkingCapitalReleasedCr.toFixed(2)} Cr
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Consolidated Lever Breakdown Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {strings.leverBreakdownTitle}
        </h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5">Lever</th>
                <th className="px-3.5 py-2.5">Methodology Basis</th>
                <th className="px-3.5 py-2.5 text-right">Gross Estimated</th>
                <th className="px-3.5 py-2.5 text-right">Overlap Deductions</th>
                <th className="px-3.5 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                  Net Estimated
                </th>
                <th className="px-3.5 py-2.5 text-right">Validated Savings</th>
                <th className="px-3.5 py-2.5">Safeguard Governance Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {data.leverSummaries.map((lever) => (
                <tr key={lever.leverId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 mr-1.5">{lever.code}</span>
                    <span className="text-slate-700 dark:text-slate-300">{lever.leverName}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400">
                    {lever.methodologyBasis}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    {lever.isPurchasePriceSavings ? `₹${lever.grossSavingsCr.toFixed(4)} Cr` : 'Segregated (L5)'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap text-amber-600 dark:text-amber-400">
                    {lever.overlapDeductionsCr > 0 ? `-₹${lever.overlapDeductionsCr.toFixed(4)} Cr` : '—'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {lever.isPurchasePriceSavings ? `₹${lever.netSavingsCr.toFixed(4)} Cr` : 'Segregated (L5)'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-medium">
                    {lever.commerciallyValidatedSavingsCr > 0 ? `₹${lever.commerciallyValidatedSavingsCr.toFixed(4)} Cr` : '₹0.00 Cr'}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={lever.safeguardRule}>
                    {lever.safeguardRule}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Canonical Opportunity Register */}
      <div className="pt-2">
        <Module2ConsolidatedOpportunityTable opportunities={data.opportunities} />
      </div>

      {/* Governance Certification Notice */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{strings.certNoticeTitle}</span>
        </div>
        <p>{data.certificationNotice}</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
          {data.disclosures.map((disc, idx) => (
            <li key={idx}>{disc}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
