'use client';
import React from 'react';
import type { MultiYearComparisonCardProps } from '../types';
import { UI_STRINGS } from '../constants/uiStrings';
import { Package, Users, TrendingUp, TrendingDown } from 'lucide-react';

export const MultiYearComparisonCard: React.FC<MultiYearComparisonCardProps> = ({
  selectedMonthDef,
  selectedFy24,
  selectedFy25,
  selectedFy26,
  fy25YoY,
  fy26YoY,
  spendCurrency
}) => {
  const currSymbol = spendCurrency === 'INR' ? '₹' : '$';
  const currUnit = spendCurrency === 'INR' ? 'Cr' : 'M';

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h5 className="text-sm font-black font-mono text-slate-900 dark:text-white">
            {UI_STRINGS.documentSummary.month.graph.yoyComparisonTitle(selectedMonthDef.fullName)}
          </h5>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {UI_STRINGS.documentSummary.month.graph.xAxisLabel}
        </span>
      </div>

      {/* 3 Year Comparison Columns: FY24, FY25, FY26 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* FY24 Card */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-sky-200 dark:border-sky-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              FY24
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedFy24 ? selectedFy24.month_label : `${selectedMonthDef.label} 2023`}
            </span>
          </div>
          <p className="text-lg font-black font-mono text-sky-600 dark:text-sky-400">
            {selectedFy24
              ? `${currSymbol}${(spendCurrency === 'INR' ? selectedFy24.spend_inr_cr : selectedFy24.spend_usd_m).toFixed(2)} ${currUnit}`
              : 'N/A'}
          </p>
          {selectedFy24 && (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-900">
              <div className="flex items-center space-x-1">
                <Package className="w-3 h-3 text-cyan-600 shrink-0" />
                <span>{((selectedFy24.unique_items_count ?? selectedFy24.records_count ?? selectedFy24.line_items_count ?? 0)).toLocaleString()} items</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>{((selectedFy24.unique_vendors_count ?? selectedFy24.vendors_count ?? (selectedFy24 as any).vendor_count ?? (selectedFy24 as any).active_vendors_count ?? 100)).toLocaleString()} vendors</span>
              </div>
            </div>
          )}
        </div>

        {/* FY25 Card */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              FY25
            </span>
            {fy25YoY !== null && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center space-x-0.5 ${
                  fy25YoY >= 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                }`}
              >
                {fy25YoY >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                <span>{UI_STRINGS.documentSummary.month.graph.yoyGrowth(fy25YoY)}</span>
              </span>
            )}
          </div>
          <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
            {selectedFy25
              ? `${currSymbol}${(spendCurrency === 'INR' ? selectedFy25.spend_inr_cr : selectedFy25.spend_usd_m).toFixed(2)} ${currUnit}`
              : 'N/A'}
          </p>
          {selectedFy25 && (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-900">
              <div className="flex items-center space-x-1">
                <Package className="w-3 h-3 text-cyan-600 shrink-0" />
                <span>{((selectedFy25.unique_items_count ?? selectedFy25.records_count ?? selectedFy25.line_items_count ?? 0)).toLocaleString()} items</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>{((selectedFy25.unique_vendors_count ?? selectedFy25.vendors_count ?? (selectedFy25 as any).vendor_count ?? (selectedFy25 as any).active_vendors_count ?? 100)).toLocaleString()} vendors</span>
              </div>
            </div>
          )}
        </div>

        {/* FY26 Card */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              FY26
            </span>
            {fy26YoY !== null && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center space-x-0.5 ${
                  fy26YoY >= 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                }`}
              >
                {fy26YoY >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                <span>{UI_STRINGS.documentSummary.month.graph.yoyGrowth(fy26YoY)}</span>
              </span>
            )}
          </div>
          <p className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">
            {selectedFy26
              ? `${currSymbol}${(spendCurrency === 'INR' ? selectedFy26.spend_inr_cr : selectedFy26.spend_usd_m).toFixed(2)} ${currUnit}`
              : 'N/A'}
          </p>
          {selectedFy26 && (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-900">
              <div className="flex items-center space-x-1">
                <Package className="w-3 h-3 text-cyan-600 shrink-0" />
                <span>{((selectedFy26.unique_items_count ?? selectedFy26.records_count ?? selectedFy26.line_items_count ?? 0)).toLocaleString()} items</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>{((selectedFy26.unique_vendors_count ?? selectedFy26.vendors_count ?? (selectedFy26 as any).vendor_count ?? (selectedFy26 as any).active_vendors_count ?? 100)).toLocaleString()} vendors</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
