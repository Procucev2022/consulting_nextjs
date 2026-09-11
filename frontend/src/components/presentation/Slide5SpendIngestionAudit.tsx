'use client';
import React from 'react';
import { Database, FileSpreadsheet, Users, Layers, ShieldCheck, CheckCheck } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide5SpendIngestionAudit: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.ingestion;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 rounded border border-blue-300 dark:border-blue-800">
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

      {/* 4 Ingestion Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-auto py-6">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mb-1" />
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{strings.recordsAudited}</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{strings.recordsAuditedLabel}</p>
          <span className="text-[10px] text-slate-400 block">Parsed across FY23, FY24, FY25 & FY26</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
          <Users className="w-5 h-5 text-cyan-600 mb-1" />
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{strings.vendorsHarmonized}</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{strings.vendorsHarmonizedLabel}</p>
          <span className="text-[10px] text-slate-400 block">Aliases unified under Master Parent IDs</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{strings.cleanRecordRate}</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{strings.cleanRecordRateLabel}</p>
          <span className="text-[10px] text-emerald-600/80 block">Zero unmapped anomalies</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
          <Database className="w-5 h-5 text-indigo-600 mb-1" />
          <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{strings.currenciesNormalized}</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{strings.currenciesNormalizedLabel}</p>
          <span className="text-[10px] text-slate-400 block">Real-time daily FX time-series rates</span>
        </div>
      </div>

      {/* Forensic Audit Capabilities */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <CheckCheck className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>Automated Pre-Check Validation: Resolves currency mismatches, tax drifts, and duplicates prior to taxonomy mapping.</span>
        </div>
        <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
          <Layers className="w-3.5 h-3.5" />
          <span>48 Granular Sourcing Categories Indexed</span>
        </div>
      </div>
    </div>
  );
};
