'use client';
import React from 'react';
import { Layers, Users, Repeat, TrendingUp, AlertTriangle } from 'lucide-react';
import type { VendorConsolidationSummaryBannerProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const VendorConsolidationSummaryBanner: React.FC<VendorConsolidationSummaryBannerProps> = ({
  summary
}) => {
  const strings = UI_STRINGS.vendorConsolidation;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Fragmented Spend */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {strings.kpiTotalSpendLabel}
          </span>
          <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            ₹{summary.totalFragmentedSpendCr.toFixed(2)} Cr
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <Repeat className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>{strings.kpiTotalSpendSub}</span>
          </span>
        </div>
      </div>

      {/* Card 2: Fragmented Categories */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {strings.kpiCategoriesCountLabel}
          </span>
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {summary.categoriesCount}
          </div>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5 block">
            {strings.kpiCategoriesCountSub}
          </span>
        </div>
      </div>

      {/* Card 3: Total Fragmented Suppliers */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {strings.kpiActiveVendorsLabel}
          </span>
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {summary.totalActiveVendors} Suppliers
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 block">
            {strings.kpiActiveVendorsSub(summary.avgVendorsPerCategory)}
          </span>
        </div>
      </div>

      {/* Card 4: Potential e-Auction Volume Savings */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-950 border border-emerald-200 dark:border-emerald-800/40 shadow-xs relative overflow-hidden group hover:border-emerald-500 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
            {strings.kpiVolumeSavingsLabel}
          </span>
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ₹{summary.potentialVolumeSavingsCr.toFixed(2)} Cr
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
            {strings.kpiVolumeSavingsSub(summary.avgSavingsPct)}
          </span>
        </div>
      </div>
    </div>
  );
};
