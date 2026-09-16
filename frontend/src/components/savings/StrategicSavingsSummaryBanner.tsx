'use client';
import React, { useMemo } from 'react';
import {
  Gavel,
  FileSpreadsheet,
  ShieldAlert,
  Layers,
  Zap,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type {
  StrategicSavingsSummaryBannerProps,
  StrategicSavingsInitiative
} from '../../types/savingsInitiatives';
import { UI_STRINGS } from '../../constants';
import {
  buildStrategicSavingsSummary,
  formatSavingsAmountCr
} from '../../utils/strategicSavingsCalculator';

export const StrategicSavingsSummaryBanner: React.FC<StrategicSavingsSummaryBannerProps> = ({
  summaryMetrics,
  onNavigateToSection
}) => {
  const strings = UI_STRINGS.savingsInitiativesSummary;

  const metrics = useMemo(() => {
    return summaryMetrics || buildStrategicSavingsSummary();
  }, [summaryMetrics]);

  const renderIcon = (iconName: StrategicSavingsInitiative['iconName']) => {
    switch (iconName) {
      case 'gavel':
        return <Gavel className="w-4 h-4" />;
      case 'fileSpreadsheet':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'shieldAlert':
        return <ShieldAlert className="w-4 h-4" />;
      case 'layers':
        return <Layers className="w-4 h-4" />;
      case 'zap':
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getAccentClasses = (color: string) => {
    switch (color) {
      case 'cyan':
        return {
          badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
          text: 'text-cyan-700 dark:text-cyan-400',
          bgHover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
          glow: 'from-cyan-500/10 to-blue-500/5',
          btn: 'bg-cyan-600 hover:bg-cyan-500 text-white'
        };
      case 'blue':
        return {
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-400',
          bgHover: 'hover:border-blue-400 dark:hover:border-blue-500',
          glow: 'from-blue-500/10 to-indigo-500/5',
          btn: 'bg-blue-600 hover:bg-blue-500 text-white'
        };
      case 'rose':
        return {
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          text: 'text-rose-700 dark:text-rose-400',
          bgHover: 'hover:border-rose-400 dark:hover:border-rose-500',
          glow: 'from-rose-500/10 to-amber-500/5',
          btn: 'bg-rose-600 hover:bg-rose-500 text-white'
        };
      case 'purple':
        return {
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          text: 'text-purple-700 dark:text-purple-400',
          bgHover: 'hover:border-purple-400 dark:hover:border-purple-500',
          glow: 'from-purple-500/10 to-violet-500/5',
          btn: 'bg-purple-600 hover:bg-purple-500 text-white'
        };
      case 'emerald':
      default:
        return {
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          text: 'text-emerald-700 dark:text-emerald-400',
          bgHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
          glow: 'from-emerald-500/10 to-teal-500/5',
          btn: 'bg-emerald-600 hover:bg-emerald-500 text-white'
        };
    }
  };

  const handleInitiativeClick = (initiative: StrategicSavingsInitiative) => {
    onNavigateToSection?.(initiative.targetModule, initiative.targetSectionId);
  };

  return (
    <div
      data-testid="strategic-savings-summary-banner"
      className="space-y-6 animate-in fade-in duration-300"
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/40 border border-emerald-200/70 dark:border-emerald-500/30 shadow-sm glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              {strings.badge}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>{strings.initiativesTrackedBadge(metrics.initiativesCount)}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
            {strings.heading}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {strings.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {strings.overallSavingsPctLabel(metrics.overallSavingsPct)}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Highlight Card: Grand Total Consolidated Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          {/* Background overlay accent */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded backdrop-blur-xs">
                  {strings.grandTotalBadge}
                </span>
                <span className="text-xs text-emerald-200 font-mono">
                  {strings.grandTotalSpendNote(metrics.grandTotalSpendInrCr)}
                </span>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-100">
                {strings.grandTotalTitle}
              </h3>
              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  data-testid="grand-total-savings-number"
                  className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white drop-shadow-sm"
                >
                  {formatSavingsAmountCr(metrics.grandTotalSavingsInrCr)}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs sm:text-sm font-mono font-bold">
                  {strings.overallSavingsPctLabel(metrics.overallSavingsPct)}
                </span>
              </div>
            </div>

            {/* Subtotals: Module 2 vs Module 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 lg:w-96">
              {/* Module 2 Subtotal */}
              <button
                type="button"
                data-testid="btn-subtotal-module2"
                onClick={() => onNavigateToSection?.('module2', 'vendor-consolidation-section')}
                className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-emerald-200">
                  <span className="font-semibold">{strings.strategicSourcingSubtotalLabel}</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {formatSavingsAmountCr(metrics.module2SavingsInrCr)}
                </div>
                <div className="text-[10px] text-emerald-200/80 font-mono mt-0.5">
                  Across 4 Strategic Levers
                </div>
              </button>

              {/* Module 4 Subtotal */}
              <button
                type="button"
                data-testid="btn-subtotal-module4"
                onClick={() => onNavigateToSection?.('module4', 'savings-pipeline-table-section')}
                className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-emerald-200">
                  <span className="font-semibold">{strings.savingsEngineSubtotalLabel}</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {formatSavingsAmountCr(metrics.module4SavingsInrCr)}
                </div>
                <div className="text-[10px] text-emerald-200/80 font-mono mt-0.5">
                  Direct Category Pipeline
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Initiatives Cards Grid: 5 Strategic Levers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.initiatives.map((init) => {
          const accent = getAccentClasses(init.accentColor);
          return (
            <div
              key={init.key}
              data-testid={`initiative-card-${init.key}`}
              className={`relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${accent.bgHover} shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group space-y-4`}
            >
              <div className="space-y-3">
                {/* Header Row: Badge & Source */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${accent.badge}`}>
                    {init.badge}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                    {init.sourceLabel}
                  </span>
                </div>

                {/* Title & Icon */}
                <div className="flex items-start space-x-2.5">
                  <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${accent.text} border border-slate-200 dark:border-slate-700 shrink-0`}>
                    {renderIcon(init.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {init.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {init.subtitle}
                    </p>
                  </div>
                </div>

                {/* Metrics Row: Spend Baseline & Target % */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">
                      Evaluated Spend
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{init.spendInrCr.toFixed(2)} Cr
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">
                      Target Realization
                    </span>
                    <span className={`font-bold ${accent.text}`}>
                      {init.savingsPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Clickable Savings Number Hero Box */}
                <button
                  type="button"
                  data-testid={`btn-savings-number-${init.key}`}
                  onClick={() => handleInitiativeClick(init)}
                  title={strings.clickToReviewTooltip}
                  className="w-full p-3 rounded-xl bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all text-left flex items-center justify-between group/num cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">
                      Identified Savings Target
                    </span>
                    <span className={`text-2xl font-black font-mono ${accent.text} group-hover/num:scale-105 transition-transform block`}>
                      {formatSavingsAmountCr(init.savingsInrCr)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center space-x-1 group-hover/num:translate-x-1 transition-transform">
                    <span>{strings.reviewDetailAction}</span>
                  </span>
                </button>
              </div>

              {/* Footer: Execution Lever & Platform */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] truncate max-w-[170px]" title={init.lever}>
                  {init.lever}
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {init.executionPlatform}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison & Review Action Breakdown Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{strings.tableTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {strings.tableSubtitle}
            </p>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{strings.tableHeaders.initiative}</th>
                  <th className="py-3 px-4 text-right">{strings.tableHeaders.evaluatedSpend}</th>
                  <th className="py-3 px-4 text-right">{strings.tableHeaders.targetPct}</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">{strings.tableHeaders.savingsPotential}</th>
                  <th className="py-3 px-4">{strings.tableHeaders.executionLever}</th>
                  <th className="py-3 px-4 text-right">{strings.tableHeaders.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {metrics.initiatives.map((init) => {
                  const accent = getAccentClasses(init.accentColor);
                  return (
                    <tr
                      key={init.key}
                      className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center space-x-2">
                          <span className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${accent.text}`}>
                            {renderIcon(init.iconName)}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {init.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {init.sourceLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200">
                        ₹{init.spendInrCr.toFixed(2)} Cr
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${accent.text}`}>
                        {init.savingsPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {/* Clickable savings metric in table */}
                        <button
                          type="button"
                          data-testid={`btn-table-savings-${init.key}`}
                          onClick={() => handleInitiativeClick(init)}
                          title={strings.clickToReviewTooltip}
                          className="hover:underline cursor-pointer"
                        >
                          {formatSavingsAmountCr(init.savingsInrCr)}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {init.lever}
                        </div>
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                          {init.executionPlatform}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          type="button"
                          data-testid={`btn-table-action-${init.key}`}
                          onClick={() => handleInitiativeClick(init)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs active:scale-95 flex items-center space-x-1 ml-auto cursor-pointer ${accent.btn}`}
                        >
                          <span>Review Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
