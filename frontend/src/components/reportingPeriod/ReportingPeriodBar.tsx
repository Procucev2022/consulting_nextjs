'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Filter
} from 'lucide-react';
import type {
  ReportingPeriodBarProps,
  ReportingPeriodMode
} from '../../types/reportingPeriod';
import { UI_STRINGS } from '../../constants';
import { formatDateRange, formatDisplayDate } from '../../utils/reportingPeriodHelper';

export const ReportingPeriodBar: React.FC<ReportingPeriodBarProps> = ({
  coverage,
  onSelectionChange,
  isLoading = false,
  className = '',
  compact = false
}) => {
  const [customStart, setCustomStart] = useState<string>(
    coverage.selection.customStartDate || (coverage.earliestValidDate !== 'N/A' ? coverage.earliestValidDate : '')
  );
  const [customEnd, setCustomEnd] = useState<string>(
    coverage.selection.customEndDate || (coverage.latestValidDate !== 'N/A' ? coverage.latestValidDate : '')
  );

  const handleModeChange = (mode: ReportingPeriodMode) => {
    if (mode === 'FINANCIAL_YEAR') {
      const defaultFy = coverage.availableFiscalYears[0] || 'FY24';
      onSelectionChange({
        mode,
        selectedFiscalYear: coverage.selection.selectedFiscalYear || defaultFy
      });
      return;
    }

    if (mode === 'CUSTOM') {
      onSelectionChange({
        mode,
        customStartDate: customStart || coverage.earliestValidDate,
        customEndDate: customEnd || coverage.latestValidDate
      });
      return;
    }

    onSelectionChange({ mode });
  };

  const handleFySelect = (fy: string) => {
    onSelectionChange({
      mode: 'FINANCIAL_YEAR',
      selectedFiscalYear: fy
    });
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd && customStart <= customEnd) {
      onSelectionChange({
        mode: 'CUSTOM',
        customStartDate: customStart,
        customEndDate: customEnd
      });
    }
  };

  const activeMode = coverage.selection.mode;
  const isCustomMode = activeMode === 'CUSTOM';
  const isFyMode = activeMode === 'FINANCIAL_YEAR';

  return (
    <div
      data-testid="standardised-reporting-period-bar"
      className={`rounded-2xl border border-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-all ${
        compact ? 'p-3' : 'p-4'
      } ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Prominent Reporting Period & Actual Coverage Display */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {UI_STRINGS.reportingPeriod.label}
              </span>
              <p
                data-testid="reporting-period-display"
                className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-slate-100"
              >
                {coverage.effectiveStartDate !== 'N/A' && coverage.effectiveEndDate !== 'N/A'
                  ? formatDateRange(
                      coverage.effectiveStartDate,
                      coverage.effectiveEndDate,
                      isFyMode ? coverage.selection.selectedFiscalYear : undefined
                    )
                  : coverage.selectedPeriodLabel}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Actual Data Coverage pill */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                {UI_STRINGS.reportingPeriod.dataCoverageLabel}
              </span>
              <span
                data-testid="data-coverage-display"
                className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300"
              >
                {coverage.actualCoverageLabel} ({formatDisplayDate(coverage.earliestValidDate)} – {formatDisplayDate(coverage.latestValidDate)})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Period Mode Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-mono">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleModeChange('ALL_AVAILABLE')}
            data-testid="period-btn-all"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'ALL_AVAILABLE'
                ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {UI_STRINGS.reportingPeriod.modes.allAvailable}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleModeChange('LAST_12_MONTHS')}
            data-testid="period-btn-12m"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'LAST_12_MONTHS'
                ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {UI_STRINGS.reportingPeriod.modes.last12Months}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleModeChange('LAST_24_MONTHS')}
            data-testid="period-btn-24m"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'LAST_24_MONTHS'
                ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {UI_STRINGS.reportingPeriod.modes.last24Months}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleModeChange('LAST_36_MONTHS')}
            data-testid="period-btn-36m"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'LAST_36_MONTHS'
                ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {UI_STRINGS.reportingPeriod.modes.last36Months}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleModeChange('FINANCIAL_YEAR')}
            data-testid="period-btn-fy"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'FINANCIAL_YEAR'
                ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {UI_STRINGS.reportingPeriod.modes.financialYear}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleModeChange('CUSTOM')}
            data-testid="period-btn-custom"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeMode === 'CUSTOM'
                ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {UI_STRINGS.reportingPeriod.modes.customRange}
          </button>
        </div>
      </div>

      {/* Sub-bar: Financial Year Selection Pills */}
      {isFyMode && coverage.availableFiscalYears.length > 0 && (
        <div
          data-testid="financial-year-selector-row"
          className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2"
        >
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            {UI_STRINGS.reportingPeriod.fy.selectFyPrompt}
          </span>
          {coverage.availableFiscalYears.map((fy) => {
            const isSelected = coverage.selection.selectedFiscalYear === fy;
            return (
              <button
                key={fy}
                type="button"
                onClick={() => handleFySelect(fy)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {fy}
              </button>
            );
          })}
        </div>
      )}

      {/* Sub-bar: Custom Date Range Form */}
      {isCustomMode && (
        <form
          onSubmit={handleCustomApply}
          data-testid="custom-date-form"
          className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400" htmlFor="custom-start-date">
              {UI_STRINGS.reportingPeriod.custom.startDateLabel}
            </label>
            <input
              id="custom-start-date"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400" htmlFor="custom-end-date">
              {UI_STRINGS.reportingPeriod.custom.endDateLabel}
            </label>
            <input
              id="custom-end-date"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
          >
            {UI_STRINGS.reportingPeriod.custom.applyButton}
          </button>
        </form>
      )}

      {/* Insufficient History / Coverage Limitation Disclosure Banner */}
      {coverage.coverageDisclosure && (
        <div
          data-testid="reporting-period-disclosure-banner"
          className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-2 text-xs"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              {UI_STRINGS.reportingPeriod.disclosure.insufficientHistoryTitle}
            </p>
            <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              {coverage.coverageDisclosure} {UI_STRINGS.reportingPeriod.disclosure.zeroExtrapolationNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
