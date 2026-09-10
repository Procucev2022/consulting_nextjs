'use client';
import React, { useMemo } from 'react';
import type { MonthTimelineBarChartProps } from '../types';
import { UI_STRINGS } from '../constants/uiStrings';
import { Package, Users, Layers, Building2 } from 'lucide-react';

export const MonthTimelineBarChart: React.FC<MonthTimelineBarChartProps> = ({
  months,
  spendCurrency,
  selectedFy,
  onSelectFy,
  hoveredMonth,
  onHoverMonth,
  searchQuery = ''
}) => {
  // Filter months according to active FY selection and optional search
  const filteredMonths = useMemo(() => {
    return months.filter((m) => {
      if (selectedFy !== 'ALL' && m.fiscal_year !== selectedFy) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.month_label.toLowerCase().includes(q) ||
        m.top_material_group.toLowerCase().includes(q) ||
        m.top_plant.toLowerCase().includes(q)
      );
    });
  }, [months, selectedFy, searchQuery]);

  const maxSpend = useMemo(() => {
    if (!filteredMonths.length) return 1;
    let maxVal = 0;
    filteredMonths.forEach((m) => {
      const spend = spendCurrency === 'INR' ? m.spend_inr_cr : m.spend_usd_m;
      if (spend > maxVal) maxVal = spend;
    });
    return maxVal > 0 ? maxVal : 1;
  }, [filteredMonths, spendCurrency]);

  const activeMonth = hoveredMonth || filteredMonths[0] || null;

  return (
    <div className="space-y-4">
      {/* Chart Header & Color Legends */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="text-slate-600 dark:text-slate-400 font-bold">
            {UI_STRINGS.documentSummary.month.graph.fiscalYearsLabel}
          </span>
          <button
            onClick={() => onSelectFy('ALL')}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded cursor-pointer ${
              selectedFy === 'ALL' ? 'bg-slate-100 dark:bg-slate-800 font-bold' : ''
            }`}
          >
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              {UI_STRINGS.documentSummary.month.graph.all36Months}
            </span>
          </button>
          <button
            onClick={() => onSelectFy('FY24')}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded cursor-pointer ${
              selectedFy === 'FY24' ? 'bg-cyan-50 dark:bg-cyan-950/60 font-bold' : ''
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              {UI_STRINGS.documentSummary.month.graph.legends.fy24}
            </span>
          </button>
          <button
            onClick={() => onSelectFy('FY25')}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded cursor-pointer ${
              selectedFy === 'FY25' ? 'bg-emerald-50 dark:bg-emerald-950/60 font-bold' : ''
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              {UI_STRINGS.documentSummary.month.graph.legends.fy25}
            </span>
          </button>
          <button
            onClick={() => onSelectFy('FY26')}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded cursor-pointer ${
              selectedFy === 'FY26' ? 'bg-indigo-50 dark:bg-indigo-950/60 font-bold' : ''
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              {UI_STRINGS.documentSummary.month.graph.legends.fy26}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-sans italic">
          {UI_STRINGS.documentSummary.month.graph.hoverPrompt}
        </span>
      </div>

      {/* 3-Year Time-Series Bar Graph Visualization */}
      {filteredMonths.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-sans text-xs">
          {UI_STRINGS.documentSummary.month.graph.noData}
        </div>
      ) : (
        <div className="relative pt-6 pb-2">
          {/* Bars Canvas Grid */}
          <div className="h-64 flex items-end justify-between gap-1 sm:gap-1.5 overflow-x-auto pb-6 border-b border-slate-200 dark:border-slate-800">
            {filteredMonths.map((m) => {
              const spend = spendCurrency === 'INR' ? m.spend_inr_cr : m.spend_usd_m;
              const heightPct = Math.max(8, Math.min(100, Math.round((spend / maxSpend) * 100)));
              const isHovered = activeMonth?.month_key === m.month_key;

              // Color themes by fiscal year
              const barColor =
                m.fiscal_year === 'FY24'
                  ? 'bg-gradient-to-t from-cyan-600 to-sky-400 hover:from-cyan-500 hover:to-sky-300'
                  : m.fiscal_year === 'FY25'
                  ? 'bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300'
                  : 'bg-gradient-to-t from-indigo-600 to-violet-400 hover:from-indigo-500 hover:to-violet-300';

              return (
                <div
                  key={m.month_key}
                  onMouseEnter={() => onHoverMonth(m)}
                  onClick={() => onHoverMonth(m)}
                  className="flex-1 flex flex-col items-center justify-end h-full min-w-[22px] sm:min-w-[28px] group cursor-pointer"
                >
                  {/* Floating MoM Change Indicator */}
                  <div
                    className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded-sm transition-all transform mb-1 whitespace-nowrap ${
                      isHovered ? 'opacity-100 scale-110 shadow-xs' : 'opacity-0 sm:opacity-75 group-hover:opacity-100'
                    } ${
                      m.mom_change_pct > 0
                        ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80'
                        : m.mom_change_pct < 0
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {m.mom_change_pct > 0
                      ? `+${m.mom_change_pct.toFixed(0)}%`
                      : `${m.mom_change_pct.toFixed(0)}%`}
                  </div>

                  {/* Spend Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-md transition-all duration-200 ${barColor} ${
                      isHovered ? 'ring-2 ring-slate-900 dark:ring-white scale-105 z-10' : 'opacity-90'
                    }`}
                  />

                  {/* Month Label below bar */}
                  <div className="mt-2 text-center">
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 dark:text-slate-400 block whitespace-nowrap">
                      {m.month_label.split(' ')[0]}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 block">
                      {m.month_label.split(' ')[1]?.slice(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Inspection Card for Currently Selected / Hovered Month */}
      {activeMonth && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 transition-all shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left Column: Month Title, FY Badge, Spend */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white dark:bg-emerald-600">
                  {activeMonth.fiscal_year}
                </span>
                <h5 className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  {UI_STRINGS.documentSummary.month.graph.performanceTitle(activeMonth.month_label)}
                </h5>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    activeMonth.mom_change_pct > 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400'
                      : activeMonth.mom_change_pct < 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {UI_STRINGS.documentSummary.month.graph.momSuffix(activeMonth.mom_change_pct)}
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{activeMonth.spend_inr_cr.toFixed(2)} Cr
                </span>
                <span className="text-xs font-mono text-slate-400">
                  (${activeMonth.spend_usd_m.toFixed(2)} M USD)
                </span>
              </div>
            </div>

            {/* Right Column: Unique Items, Unique Vendors, Top Group, Top Plant */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <Package className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {UI_STRINGS.documentSummary.month.graph.itemsCardLabel}
                  </span>
                  <span className="font-bold text-cyan-700 dark:text-cyan-400">
                    {(activeMonth.unique_items_count || activeMonth.records_count).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {UI_STRINGS.documentSummary.month.graph.vendorsCardLabel}
                  </span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    {(activeMonth.unique_vendors_count || Math.max(1, Math.round(activeMonth.records_count * 0.15))).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">
                    {UI_STRINGS.documentSummary.month.graph.topGroupCardLabel}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block" title={activeMonth.top_material_group}>
                    {activeMonth.top_material_group}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">
                    {UI_STRINGS.documentSummary.month.graph.topPlantCardLabel}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block" title={activeMonth.top_plant}>
                    {activeMonth.top_plant}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
