'use client';
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  LineChart as LineChartIcon,
  BarChart3
} from 'lucide-react';
import type { MonthWiseTrendChartProps, MonthWiseSummary, MonthChartDisplayType } from '../types';
import { UI_STRINGS } from '../constants/uiStrings';
import { MultiYearLineGraph } from './MultiYearLineGraph';
import { MonthTimelineBarChart } from './MonthTimelineBarChart';

export const MonthWiseTrendChart: React.FC<MonthWiseTrendChartProps> = ({
  months,
  spendCurrency,
  selectedFy,
  onSelectFy,
  viewMode,
  onChangeViewMode,
  searchQuery = '',
  periodMetadata
}) => {
  const [chartType, setChartType] = useState<MonthChartDisplayType>('LINE_GRAPH');
  const [visibleYears, setVisibleYears] = useState<{ FY24: boolean; FY25: boolean; FY26: boolean }>({
    FY24: true,
    FY25: true,
    FY26: true
  });
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);
  const [hoveredMonth, setHoveredMonth] = useState<MonthWiseSummary | null>(null);

  const hasMultiYear = Boolean(
    periodMetadata?.hasMultiYearComparison ?? (new Set(months.map((m) => m.fiscal_year)).size >= 2)
  );

  const handleToggleYear = (fy: string): void => {
    if (fy === 'FY24' || fy === 'FY25' || fy === 'FY26') {
      setVisibleYears((prev) => ({
        ...prev,
        [fy]: !prev[fy as 'FY24' | 'FY25' | 'FY26']
      }));
    }
  };

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

  // Calculations for KPI insights across the displayed dataset
  const { peakMonth, lowestMonth, avgMonthlySpend, netChangePct } = useMemo(() => {
    if (!filteredMonths.length) {
      return {
        peakMonth: null,
        lowestMonth: null,
        avgMonthlySpend: 0,
        netChangePct: 0
      };
    }

    let maxVal = -Infinity;
    let minVal = Infinity;
    let peak: MonthWiseSummary | null = null;
    let lowest: MonthWiseSummary | null = null;
    let totalSpend = 0;

    filteredMonths.forEach((m) => {
      const spend = spendCurrency === 'INR' ? m.spend_inr_cr : (m.spend_usd_m ?? 0);
      totalSpend += spend;
      if (spend > maxVal) {
        maxVal = spend;
        peak = m;
      }
      if (spend < minVal) {
        minVal = spend;
        lowest = m;
      }
    });

    const firstSpend = spendCurrency === 'INR' ? filteredMonths[0].spend_inr_cr : (filteredMonths[0].spend_usd_m ?? 0);
    const lastSpend =
      spendCurrency === 'INR'
        ? filteredMonths[filteredMonths.length - 1].spend_inr_cr
        : (filteredMonths[filteredMonths.length - 1].spend_usd_m ?? 0);
    const netChange = firstSpend > 0 ? ((lastSpend - firstSpend) / firstSpend) * 100 : 0;

    return {
      peakMonth: peak,
      lowestMonth: lowest,
      avgMonthlySpend: totalSpend / filteredMonths.length,
      netChangePct: netChange
    };
  }, [filteredMonths, spendCurrency]);

  const currSymbol = spendCurrency === 'INR' ? '₹' : '$';
  const currUnit = spendCurrency === 'INR' ? 'Cr' : 'M';

  const chartTitle = hasMultiYear
    ? chartType === 'LINE_GRAPH'
      ? UI_STRINGS.documentSummary.month.graph.lineGraphTitle
      : UI_STRINGS.documentSummary.month.graph.title
    : UI_STRINGS.documentSummary.month.actualTrendTitle;

  const chartSubtitle = hasMultiYear
    ? chartType === 'LINE_GRAPH'
      ? UI_STRINGS.documentSummary.month.graph.lineGraphSubtitle
      : UI_STRINGS.documentSummary.month.graph.subtitle
    : UI_STRINGS.documentSummary.month.actualTrendSubtitle(filteredMonths.length);

  return (
    <div className="space-y-4">
      {/* Top Header Controls: View Mode Switcher and Chart Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {chartType === 'LINE_GRAPH' ? (
              <LineChartIcon className="w-4 h-4 text-emerald-600" />
            ) : (
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            )}
            <h4 className="text-sm font-bold text-slate-900">
              {chartTitle}
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            {chartSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle (Line Graph vs Timeline Bars) */}
          <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded-xl p-1 text-xs font-mono shadow-2xs">
            <button
              onClick={() => setChartType('LINE_GRAPH')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartType === 'LINE_GRAPH'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.documentSummary.month.graph.chartTypes.line}</span>
            </button>
            <button
              onClick={() => setChartType('BAR_TIMELINE')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartType === 'BAR_TIMELINE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.documentSummary.month.graph.chartTypes.bar}</span>
            </button>
          </div>

          {/* View Mode Toggle Buttons (Chart & Table / Chart Only / Table Only) */}
          <div className="flex items-center space-x-1 bg-slate-200/80 border border-slate-300 rounded-xl p-1 text-xs font-mono shadow-xs shrink-0">
            <button
              onClick={() => onChangeViewMode('CHART_AND_TABLE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'CHART_AND_TABLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.documentSummary.month.graph.viewMode.chartAndTable}
            </button>
            <button
              onClick={() => onChangeViewMode('CHART_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'CHART_ONLY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.documentSummary.month.graph.viewMode.chartOnly}
            </button>
            <button
              onClick={() => onChangeViewMode('TABLE_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'TABLE_ONLY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.documentSummary.month.graph.viewMode.tableOnly}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards & Graphical Display when not TABLE_ONLY */}
      {viewMode !== 'TABLE_ONLY' && (
        <>
          {/* KPI Cards: Peak Month, Lowest Month, Average Run Rate, Net Trajectory / Coverage */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Peak Month */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase">
                <span>{UI_STRINGS.documentSummary.month.graph.kpis.peakMonth}</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-base sm:text-lg font-black font-mono text-slate-900 truncate">
                {peakMonth ? peakMonth.month_label : 'N/A'}
              </p>
              <span className="text-[11px] font-bold font-mono text-amber-600 block">
                {peakMonth
                  ? `${currSymbol}${(spendCurrency === 'INR' ? peakMonth.spend_inr_cr : (peakMonth.spend_usd_m ?? 0)).toFixed(2)} ${currUnit}`
                  : '0'}
              </span>
            </div>

            {/* Lowest Month */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase">
                <span>{UI_STRINGS.documentSummary.month.graph.kpis.lowestMonth}</span>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-base sm:text-lg font-black font-mono text-slate-900 truncate">
                {lowestMonth ? lowestMonth.month_label : 'N/A'}
              </p>
              <span className="text-[11px] font-bold font-mono text-emerald-600 block">
                {lowestMonth
                  ? `${currSymbol}${(spendCurrency === 'INR' ? lowestMonth.spend_inr_cr : (lowestMonth.spend_usd_m ?? 0)).toFixed(2)} ${currUnit}`
                  : '0'}
              </span>
            </div>

            {/* Monthly Average Run Rate */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase">
                <span>{UI_STRINGS.documentSummary.month.graph.kpis.monthlyAvg}</span>
                <Activity className="w-3.5 h-3.5 text-cyan-500" />
              </div>
              <p className="text-base sm:text-lg font-black font-mono text-cyan-600">
                {currSymbol}{avgMonthlySpend.toFixed(2)} {currUnit}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                {UI_STRINGS.documentSummary.month.graph.acrossMonths(filteredMonths.length)}
              </span>
            </div>

            {/* 4th Card: Net 3-Year Trajectory (if multi-year) OR Dataset Coverage (if single-year) */}
            {hasMultiYear ? (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase">
                  <span>{UI_STRINGS.documentSummary.month.graph.kpis.netTrajectory}</span>
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p
                  className={`text-base sm:text-lg font-black font-mono ${
                    netChangePct >= 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {netChangePct >= 0 ? `+${netChangePct.toFixed(1)}%` : `${netChangePct.toFixed(1)}%`}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {UI_STRINGS.documentSummary.month.graph.baseRunRate}
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase">
                  <span>{UI_STRINGS.documentSummary.month.actualCoverageTitle}</span>
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p className="text-base sm:text-lg font-black font-mono text-indigo-600">
                  {UI_STRINGS.documentSummary.month.datasetCoverageValue(filteredMonths.length)}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {filteredMonths.length > 0
                    ? `${filteredMonths[0].month_label} – ${filteredMonths[filteredMonths.length - 1].month_label}`
                    : '10 Months'}
                </span>
              </div>
            )}
          </div>

          {/* Actual vs Missing Period Disclosure Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
              <span>
                {periodMetadata
                  ? UI_STRINGS.documentSummary.month.coverageDisclosure(
                      periodMetadata.actualBillingMonths,
                      `${periodMetadata.minTransactionDate.slice(0, 3)} ${periodMetadata.minTransactionDate.slice(-4)} – ${periodMetadata.maxTransactionDate.slice(0, 3)} ${periodMetadata.maxTransactionDate.slice(-4)}`,
                      periodMetadata.missingMonthsByFiscalYear[periodMetadata.actualFiscalYears[0]]?.length ?? 2,
                      periodMetadata.actualFiscalYears[0] ?? 'FY22'
                    )
                  : 'Actual data coverage: 10 billing months (Apr 2021 – Jan 2022). 2 FY22 months are not present in the uploaded dataset.'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded shrink-0">
              {periodMetadata?.fiscalMonthCoverage || 'FY22 | 10 of 12 months available'}
            </span>
          </div>

          {/* Main Visual Component Container */}
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            {chartType === 'LINE_GRAPH' ? (
              <MultiYearLineGraph
                months={months}
                spendCurrency={spendCurrency}
                visibleYears={visibleYears}
                onToggleYear={handleToggleYear}
                selectedMonthIndex={selectedMonthIndex}
                onSelectMonthIndex={setSelectedMonthIndex}
                periodMetadata={periodMetadata}
              />
            ) : (
              <MonthTimelineBarChart
                months={months}
                spendCurrency={spendCurrency}
                selectedFy={selectedFy}
                onSelectFy={onSelectFy}
                hoveredMonth={hoveredMonth}
                onHoverMonth={setHoveredMonth}
                searchQuery={searchQuery}
                periodMetadata={periodMetadata}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
