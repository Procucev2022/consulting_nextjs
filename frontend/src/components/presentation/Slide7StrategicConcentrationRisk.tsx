'use client';
import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, SplitSquareVertical } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide7StrategicConcentrationRisk: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.strategicRisk;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 flex items-center space-x-1 w-fit">
            <ShieldAlert className="w-3 h-3 mr-1" />
            <span>{strings.badge}</span>
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

      {/* 4 Risk KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-auto py-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase">{strings.totalAtRiskLabel}</p>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{strings.totalAtRisk}</p>
          <span className="text-[10px] text-slate-400 block">Identified across 16 strategic commodities</span>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 space-y-1">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">{strings.soleSourceItemsLabel}</p>
          <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{strings.soleSourceItems}</p>
          <span className="text-[10px] text-rose-700 dark:text-rose-300 block">Critical single point of failure (100% volume)</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 space-y-1">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">{strings.dominantSecondaryLabel}</p>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{strings.dominantSecondary}</p>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 block">Secondary vendor lacks capacity to absorb shocks</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase">{strings.avgConcentrationLabel}</p>
          <p className="text-2xl font-black font-mono text-cyan-700 dark:text-cyan-400">{strings.avgConcentration}</p>
          <span className="text-[10px] text-slate-400 block">Extreme primary supplier dependency</span>
        </div>
      </div>

      {/* Concrete Risk Case Highlights & Action Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-2">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>High-Risk Observation: Trafigura & Jindal Stainless</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Materials like High Purity Nickel (₹1,215.81 Cr) and Seamless Steel Tubes (₹1,546.00 Cr) exhibit &gt;93% allocation to a single vendor. While secondary suppliers exist, their 6.2% share cannot absorb operational shutdowns.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-700 dark:text-cyan-400 font-bold">
            <SplitSquareVertical className="w-4 h-4 shrink-0" />
            <span>Immediate Sourcing Mitigation Roadmap</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            1. Launch competitive dual-sourcing RFQ on DPS NXT with pre-qualified cohort.<br />
            2. Calibrate secondary supplier tooling to increase capacity allocation from 6% to 25%.<br />
            3. Establish 45-day strategic buffer inventory for critical unhedged sole-source lines.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Strategic Risk Engine: Monitored continuously across 100% of ERP line items</span>
        </div>
      </div>
    </div>
  );
};
