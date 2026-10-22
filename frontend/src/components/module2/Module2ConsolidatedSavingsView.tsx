'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Scale
} from 'lucide-react';
import type {
  Module2ConsolidatedSavingsSummary,
  Module2ConsolidatedSavingsViewProps
} from '../../types';
import { UI_STRINGS } from '../../constants';
import { Module2ConsolidatedOpportunityTable } from './Module2ConsolidatedOpportunityTable';
import { Module2Lever5Callout } from './Module2Lever5Callout';
import logger from '../../utils/logger';

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
        <span>{strings.loadingMessage}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span>{strings.errorMessage}</span>
        </div>
        <p className="text-xs">{error || 'Data is unavailable'}</p>
        <button
          type="button"
          onClick={fetchData}
          className="mt-3 px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
        >
          {strings.btnRetry}
        </button>
      </div>
    );
  }

  const kpiCards = [
    {
      title: strings.grossEstimatedSavingsLabel,
      badge: strings.kpiGrossBadge,
      val: `₹${data.grossEstimatedSavingsCr.toFixed(2)} Cr`,
      desc: strings.grossEstimatedSavingsDesc,
      hero: false,
      color: 'text-slate-900 dark:text-slate-100'
    },
    {
      title: strings.netEstimatedSavingsLabel,
      badge: strings.kpiNetBadge,
      val: `₹${data.netEstimatedSavingsCr.toFixed(2)} Cr`,
      desc: `Eliminated ₹${data.totalOverlappingDeductionsCr.toFixed(2)} Cr in cross-lever double-counting`,
      hero: true,
      color: 'text-blue-950 dark:text-blue-100'
    },
    {
      title: strings.commerciallyValidatedSavingsLabel,
      badge: strings.kpiValidatedBadge,
      val: `₹${data.commerciallyValidatedSavingsCr.toFixed(2)} Cr`,
      desc: strings.commerciallyValidatedSavingsDesc,
      hero: false,
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: strings.unquantifiedOpportunitiesLabel,
      badge: strings.kpiDiscoveryBadge,
      val: String(data.unquantifiedOpportunitiesCount),
      desc: 'Discovery / Phase 1 candidate categories awaiting technical or bid evidence',
      hero: false,
      color: 'text-slate-900 dark:text-slate-100'
    },
    {
      title: strings.unresolvedOverlapsExcludedLabel,
      badge: strings.kpiExcludedBadge,
      val: `₹${data.unresolvedOverlapsExcludedCr.toFixed(2)} Cr`,
      desc: 'Excluded from net savings due to unverified scope overlap',
      hero: false,
      color: 'text-amber-600 dark:text-amber-400'
    }
  ];

  return (
    <div className="space-y-6 w-full py-2">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              {strings.moduleBadge}
            </span>
            <span className="text-xs font-mono text-slate-500">{data.assessmentId}</span>
            <span className="text-xs text-slate-400">• {data.customerName}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{strings.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-4xl">{strings.subtitle}</p>
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
            <span>{strings.btnRefresh}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl shadow-sm ${
              card.hero
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-500/40 dark:border-blue-700/60'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className={card.hero ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}>{card.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${card.hero ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}>{card.badge}</span>
            </div>
            <div className={`mt-2 text-2xl ${card.hero ? 'font-black' : 'font-bold'} ${card.color}`}>
              {card.val}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Lever 5 Financial Metrics Segregation Callout & Payment Terms Unavailable Disclosure */}
      <Module2Lever5Callout data={data} />

      {/* Consolidated Lever Breakdown Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {strings.leverBreakdownTitle}
        </h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5">{strings.thLever}</th>
                <th className="px-3.5 py-2.5">{strings.thMethodologyBasis}</th>
                <th className="px-3.5 py-2.5 text-right">{strings.thGrossEstimated}</th>
                <th className="px-3.5 py-2.5 text-right">{strings.thOverlapDeductions}</th>
                <th className="px-3.5 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                  {strings.thNetEstimated}
                </th>
                <th className="px-3.5 py-2.5 text-right">{strings.thValidatedSavings}</th>
                <th className="px-3.5 py-2.5">{strings.thSafeguardRule}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {data.leverSummaries.map((lever) => (
                <tr key={lever.leverId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 mr-1.5">{lever.leverCode}</span>
                    <span className="text-slate-700 dark:text-slate-300">{lever.leverName}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400">{lever.methodologyBasis}</td>
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
