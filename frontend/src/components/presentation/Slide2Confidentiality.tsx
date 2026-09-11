'use client';
import React from 'react';
import { Lock, ShieldAlert, FileText, CheckCircle2, Scale } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide2Confidentiality: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.confidentiality;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-300 dark:border-rose-800/60 flex items-center space-x-1">
              <Lock className="w-3 h-3 mr-1" />
              <span>{strings.badge}</span>
            </span>
          </div>
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

      {/* 4 Governance Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto py-6">
        {/* Section 1 */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <h3>{strings.section1Title}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.section1Body}
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <h3>{strings.section2Title}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.section2Body}
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
            <Scale className="w-4 h-4 shrink-0" />
            <h3>{strings.section3Title}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.section3Body}
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <FileText className="w-4 h-4 shrink-0" />
            <h3>{strings.section4Title}</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {strings.section4Body}
          </p>
        </div>
      </div>

      {/* Footer Compliance Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{strings.complianceStamp}</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          ISO/IEC 27001 Certified · AES-256-GCM Encrypted
        </span>
      </div>
    </div>
  );
};
