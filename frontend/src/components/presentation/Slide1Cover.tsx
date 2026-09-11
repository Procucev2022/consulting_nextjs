'use client';
import React from 'react';
import { ShieldCheck, Building2, Calendar, UserCheck, FileCode } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';
import { ProcucevLogo } from './ProcucevLogo';

export const Slide1Cover: React.FC<PresentationSlideProps> = ({
  tenantEnterpriseName,
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.cover;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-gradient-to-br from-white via-slate-50 to-sky-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Decorative top-right accent */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Slide Header: Logo & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6 relative z-10">
        <ProcucevLogo size="lg" />
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-3 py-1 rounded-full border border-cyan-300 dark:border-cyan-800">
            {strings.badge}
          </span>
          <span className="text-xs font-mono text-slate-500">
            {slideNumber}/{totalSlides}
          </span>
        </div>
      </div>

      {/* Main Slide Body: Title & Subtitle */}
      <div className="my-auto py-8 space-y-4 relative z-10 max-w-4xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{strings.classification}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {strings.deckTitle}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {strings.deckSubtitle}
        </p>
      </div>

      {/* Slide Footer: Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800/80 text-xs relative z-10">
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-600" />
            <span>{strings.preparedForLabel}</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
            {tenantEnterpriseName}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{strings.dateLabel}</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">
            {strings.dateValue}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{strings.authorLabel}</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
            {strings.authorValue}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <FileCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>{strings.docRefLabel}</span>
          </div>
          <p className="font-bold font-mono text-cyan-700 dark:text-cyan-400 text-xs">
            {strings.docRefValue}
          </p>
        </div>
      </div>
    </div>
  );
};
