'use client';
import React from 'react';
import { AlertTriangle, ShieldAlert, DollarSign, PieChart } from 'lucide-react';
import type { StrategicRiskSummaryBannerProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const StrategicRiskSummaryBanner: React.FC<StrategicRiskSummaryBannerProps> = ({ summary }) => {
  const kpis = UI_STRINGS.module2.strategicVendorRisk.kpis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* KPI 1: Total Strategic At-Risk Spend */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-50/40 dark:from-rose-950/40 dark:to-slate-900 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between transition-all hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
            {kpis.totalAtRiskSpend}
          </p>
          <h4 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            ₹{summary.totalAtRiskSpendCr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
          </h4>
          <span className="inline-block text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            {summary.totalStrategicItems} high-spend materials flagged
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 2: 100% Sole-Source Items */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between transition-all hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            {kpis.soleSourceCount}
          </p>
          <h4 className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
            {summary.soleSourceCount} Items
          </h4>
          <span className="inline-block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            100% single point of failure
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 3: Dominant Suppliers (Secondary < 10%) */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50/30 dark:from-orange-950/40 dark:to-slate-900 border border-orange-200/80 dark:border-orange-900/60 flex items-center justify-between transition-all hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
            {kpis.singleDigitSecondaryCount}
          </p>
          <h4 className="text-xl font-bold font-mono text-orange-700 dark:text-orange-300">
            {summary.singleDigitSecondaryCount} Items
          </h4>
          <span className="inline-block text-[10px] text-orange-600 dark:text-orange-400 font-medium">
            Secondary supplier &lt; 10% share
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 4: Avg Primary Concentration */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center justify-between transition-all hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
            {kpis.avgPrimaryShare}
          </p>
          <h4 className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
            {summary.avgPrimaryConcentrationPct.toFixed(1)}%
          </h4>
          <span className="inline-block text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
            Extreme primary supplier lock-in
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800">
          <PieChart className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
