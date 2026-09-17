'use client';

import React from 'react';
import { Layers, TrendingDown, ArrowRight, Zap, Calculator } from 'lucide-react';
import type { PoConsolidationSummaryBannerProps, PoConsolidationCadence } from '../../types/poConsolidation';
import { UI_STRINGS } from '../../constants/uiStrings';

const CADENCE_OPTIONS: { id: PoConsolidationCadence; label: string }[] = [
  { id: 'MONTHLY', label: UI_STRINGS.poConsolidation.cadenceShortLabels.monthly },
  { id: 'QUARTERLY', label: UI_STRINGS.poConsolidation.cadenceShortLabels.quarterly },
  { id: 'HALF_YEARLY', label: UI_STRINGS.poConsolidation.cadenceShortLabels.halfYearly },
  { id: 'ANNUAL', label: UI_STRINGS.poConsolidation.cadenceShortLabels.annual }
];

export const PoConsolidationSummaryBanner: React.FC<PoConsolidationSummaryBannerProps> = ({
  summary,
  selectedGlobalCadence,
  onSelectGlobalCadence
}) => {
  return (
    <div className="space-y-4">
      {/* Simulation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{UI_STRINGS.poConsolidation.cadenceSelectorLabel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CADENCE_OPTIONS.map((opt) => {
            const isActive = selectedGlobalCadence === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectGlobalCadence(opt.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fragmented Spend */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {UI_STRINGS.poConsolidation.kpiTotalSpendLabel}
            </span>
            <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ₹{(summary.totalFragmentedSpendCr || 0).toFixed(2)} Cr
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {UI_STRINGS.poConsolidation.kpiTotalSpendSub}
            </p>
          </div>
        </div>

        {/* KPI 2: Current Fragmented POs */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {UI_STRINGS.poConsolidation.kpiTotalCurrentPosLabel}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              {summary.qualifiedSuppliersCount || 0} Accounts
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {summary.totalCurrentPos || 0} POs/Yr
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {UI_STRINGS.poConsolidation.kpiTotalCurrentPosSub(summary.qualifiedSuppliersCount || 0)}
            </p>
          </div>
        </div>

        {/* KPI 3: Target POs */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {UI_STRINGS.poConsolidation.kpiTargetPosLabel}
            </span>
            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
              <span>{summary.totalTargetPos || 0} POs/Yr</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                -{(summary.avgPoReductionPct || 0).toFixed(0)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {UI_STRINGS.poConsolidation.kpiTargetPosSub(summary.avgPoReductionPct || 0)}
            </p>
          </div>
        </div>

        {/* KPI 4: Economies of Scale Benefit */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              {UI_STRINGS.poConsolidation.kpiEconomiesOfScaleLabel}
            </span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              ₹{(summary.totalScaleSavingsCr || 0).toFixed(2)} Cr
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              {UI_STRINGS.poConsolidation.kpiEconomiesOfScaleSub(summary.totalAdminCostSavingsLakhs || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
