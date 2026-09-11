'use client';
import React from 'react';
import { Target, TrendingDown, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide4ExecutiveScorecard: React.FC<PresentationSlideProps> = ({
  totalSpendInrCr,
  totalSavingsInrCr,
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.scorecard;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
            {strings.badge}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {strings.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {strings.subtitle}
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-auto py-6">
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <Target className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-semibold uppercase">{strings.kpiBaselineSpend}</span>
          </div>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            ₹{totalSpendInrCr.toFixed(2)} Cr
          </p>
          <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-medium block">
            {strings.kpiBaselineSpendSub}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">{strings.kpiIdentifiedSavings}</span>
          </div>
          <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ₹{totalSavingsInrCr.toFixed(2)} Cr
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium block">
            {strings.kpiIdentifiedSavingsSub}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">{strings.kpiPriceCreep}</span>
          </div>
          <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
            {strings.kpiPriceCreepVal}
          </p>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium block">
            {strings.kpiPriceCreepSub}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">{strings.kpiVelocity}</span>
          </div>
          <p className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
            {strings.kpiVelocityVal}
          </p>
          <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium block">
            {strings.kpiVelocitySub}
          </span>
        </div>
      </div>

      {/* Strategic Takeaways List */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Management Takeaways & Strategic Summary:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>High concentration: 69.1% of multi-year spend resides within the Top 50 vendor cohort.</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Contract drift: Index pegging in proCPX will reclaim ₹20.53 Cr in cumulative price leakage.</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Dual-sourcing urgency: 16 critical items suffer from sole-source or sub-10% secondary vendor vulnerability.</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Execution velocity: DPS NXT e-auctions enable initial cash savings realization within 30 to 60 days.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
