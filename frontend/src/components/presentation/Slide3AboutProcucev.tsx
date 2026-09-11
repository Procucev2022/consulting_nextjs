'use client';
import React from 'react';
import { Cpu, Boxes, ArrowRightLeft, Users2 } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';
import { ProcucevLogo } from './ProcucevLogo';

export const Slide3AboutProcucev: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.about;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Decorative subtle background gradient circle matching slide */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-sky-100/50 via-blue-50/20 to-transparent dark:from-sky-950/30 dark:via-blue-950/10 dark:to-transparent rounded-bl-full pointer-events-none" />

      {/* Top Bar: Slide Index */}
      <div className="flex justify-end items-center text-xs font-mono text-slate-500 relative z-10">
        <span>{slideNumber}/{totalSlides}</span>
      </div>

      {/* Center Top: Centered Logo & Top Pill */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto relative z-10">
        <ProcucevLogo size="xl" className="justify-center" />

        <div className="inline-flex items-center px-5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <span>{strings.pillBadge}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
          <span>{strings.headlineStart}</span>
          <span className="text-[#ff5500] font-sans font-black">{strings.headlineEmpower}</span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          {strings.bodyText}
        </p>
      </div>

      {/* Bottom Grid: 3 Platform Pills + 50k+ Verified Network Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-slate-200 dark:border-slate-800 relative z-10">
        {/* Pillar 1: QUA AI Engine */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2 hover:border-cyan-400 transition-colors">
          <div className="flex items-center space-x-2 text-cyan-700 dark:text-cyan-400">
            <Cpu className="w-5 h-5 shrink-0" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{strings.quaTitle}</h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {strings.quaDesc}
          </p>
        </div>

        {/* Pillar 2: proCPX Capex Cloud */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2 hover:border-blue-400 transition-colors">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
            <Boxes className="w-5 h-5 shrink-0" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{strings.proCpxTitle}</h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {strings.proCpxDesc}
          </p>
        </div>

        {/* Pillar 3: DPS NXT Source-to-Pay */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2 hover:border-indigo-400 transition-colors">
          <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400">
            <ArrowRightLeft className="w-5 h-5 shrink-0" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{strings.dpsNxtTitle}</h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            {strings.dpsNxtDesc}
          </p>
        </div>

        {/* Card 4: 50,000+ Verified Network Card (Matching attached slide design) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600/80 shadow-md flex flex-col justify-center text-center space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
            <Users2 className="w-5 h-5" />
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">{strings.networkCount}</span>
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {strings.networkLabel}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
            {strings.networkDesc}
          </p>
        </div>
      </div>
    </div>
  );
};
