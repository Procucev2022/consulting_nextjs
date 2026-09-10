import React from 'react';
import { TrendingUp, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { VendorSupplyMetricsCardsProps } from '../../types/vendorSupply';
import { UI_STRINGS } from '../../constants/uiStrings';

export const VendorSupplyMetricsCards: React.FC<VendorSupplyMetricsCardsProps> = ({ overview }) => {
  const strings = UI_STRINGS.module2.vendorSupply;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Top 50 Spend */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">{strings.kpiTotalSpend}</span>
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
          ₹{overview.total_spend_cr.toFixed(2)} Cr
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {strings.kpiTotalSpendSubtitle}
        </p>
      </div>

      {/* Card 2: Multi-Category Vendors */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/80 shadow-xs">
        <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">{strings.kpiMultiVendors}</span>
          <Layers className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
            {overview.multi_category_vendors_count}
          </span>
          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
            ({overview.multi_category_spend_pct.toFixed(1)}% of Spend)
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {strings.kpiMultiVendorsSubtitle}
        </p>
      </div>

      {/* Card 3: Single-Category Specialists */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">{strings.kpiSingleVendors}</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
            {overview.single_category_vendors_count}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            ({overview.single_category_spend_pct.toFixed(1)}% of Spend)
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {strings.kpiSingleVendorsSubtitle}
        </p>
      </div>

      {/* Card 4: Alarm Status */}
      <div
        className={`p-4 rounded-2xl border shadow-xs ${
          overview.high_spend_multi_category_alarm
            ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
            : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">{strings.kpiAlarmStatus}</span>
          <AlertTriangle
            className={`w-4 h-4 ${
              overview.high_spend_multi_category_alarm ? 'text-rose-600 animate-pulse' : 'text-slate-400'
            }`}
          />
        </div>
        <div
          className={`text-xl font-bold ${
            overview.high_spend_multi_category_alarm
              ? 'text-rose-700 dark:text-rose-300'
              : 'text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {overview.high_spend_multi_category_alarm ? strings.kpiAlarmStatusActive : strings.kpiAlarmStatusNormal}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {strings.kpiAlarmStatusDesc}
        </p>
      </div>
    </div>
  );
};
