'use client';
import React from 'react';
import { TrendingUp, AlertOctagon, Receipt, Shuffle, CheckCircle2 } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide8PriceCreepContractLeakage: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.priceCreep;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
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

      {/* 3 Leakage Pillars + Quantified Leakage Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto py-6">
        <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <TrendingUp className="w-5 h-5 shrink-0" />
            <h3>{strings.indexDriftTitle}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.indexDriftDesc}
          </p>
          <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
            Identified Leak: ₹8.72 Cr
          </div>
        </div>

        <div className="p-5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-3">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <h3>{strings.bracketLeakageTitle}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.bracketLeakageDesc}
          </p>
          <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 text-[11px] font-mono font-bold text-rose-700 dark:text-rose-400">
            Identified Leak: ₹6.45 Cr
          </div>
        </div>

        <div className="p-5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-3">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
            <Shuffle className="w-5 h-5 shrink-0" />
            <h3>{strings.maverickTitle}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.maverickDesc}
          </p>
          <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400">
            Identified Leak: ₹5.36 Cr
          </div>
        </div>
      </div>

      {/* Footer Banner: Total Recoverable */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold">
          <Receipt className="w-4 h-4" />
          <span>Total Quantified Contract Leakage: ₹20.53 Cr (Direct EBITDA Impact)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-cyan-700 dark:text-cyan-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Mitigated via Automated In-Line Invoice PO Match in DPS NXT</span>
        </div>
      </div>
    </div>
  );
};
