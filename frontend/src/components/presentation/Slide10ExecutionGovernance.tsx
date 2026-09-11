'use client';
import React from 'react';
import { CalendarClock, Award, CheckCircle2 } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide10ExecutionGovernance: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.governance;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-300 dark:border-indigo-800">
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

      {/* 3-Wave Roadmap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto py-6">
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 relative">
          <div className="flex items-center space-x-2 text-cyan-700 dark:text-cyan-400 font-bold text-sm">
            <CalendarClock className="w-5 h-5 shrink-0" />
            <h3>{strings.wave1Title}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.wave1Desc}
          </p>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-400">
            Target: ₹28.50 Cr In-Year
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 relative">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
            <CalendarClock className="w-5 h-5 shrink-0" />
            <h3>{strings.wave2Title}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.wave2Desc}
          </p>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-[10px] font-mono font-bold text-blue-800 dark:text-blue-400">
            Target: ₹54.20 Cr In-Year
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 relative">
          <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
            <CalendarClock className="w-5 h-5 shrink-0" />
            <h3>{strings.wave3Title}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.wave3Desc}
          </p>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[10px] font-mono font-bold text-indigo-800 dark:text-indigo-400">
            Target: ₹36.97 Cr In-Year
          </div>
        </div>
      </div>

      {/* Executive Sign-off Footer Banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{strings.leadershipTitle}</p>
          <p className="font-bold text-slate-900 dark:text-white text-sm">{strings.ceoName}</p>
          <p className="text-[10px] text-slate-400 font-mono">{strings.timestamp}</p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800/50 font-bold text-xs">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{strings.validatedBadge}</span>
          <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </div>
  );
};
