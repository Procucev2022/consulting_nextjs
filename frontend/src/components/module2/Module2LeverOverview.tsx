'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lock,
  Layers,
  AlertCircle
} from 'lucide-react';
import type { Module2LeverOverviewProps, LeverOverviewItem } from '../../types';
import { UI_STRINGS, TEN_LEVERS_OVERVIEW_CONFIG } from '../../constants';

const LEVER_TAB_MAP: Record<number, string> = {
  1: 'directPrice',
  2: 'eAuction',
  3: 'vendorConsolidation',
  4: 'volumeAggregation',
  5: 'paymentTerms',
  6: 'categorySpecialisation',
  7: 'logisticsPackaging',
  8: 'specificationRationalisation',
  9: 'procurementCompliance',
  10: 'alternateSourcing'
};

export const Module2LeverOverview: React.FC<Module2LeverOverviewProps> = ({
  assessmentId = '',
  onSelectLever,
  directPriceOppCr
}) => {
  const strings = UI_STRINGS.module2LeversOverview;
  const [expandedDiagnostics, setExpandedDiagnostics] = useState<Record<number, boolean>>({});

  const toggleDiagnostics = (leverId: number): void => {
    setExpandedDiagnostics((prev) => ({
      ...prev,
      [leverId]: !prev[leverId]
    }));
  };

  const renderStatusBadge = (lever: LeverOverviewItem) => {
    if (lever.implementationStatus === 'IMPLEMENTED') {
      const label = lever.statusLabel || strings.statusImplemented;
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <ShieldCheck className="w-3 h-3" />
          {label}
        </span>
      );
    }
    if (lever.implementationStatus === 'COMING_SOON') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <Clock className="w-3 h-3" />
          {strings.statusComingSoon}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <Clock className="w-3 h-3" />
        {strings.statusPlanned}
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full py-4">
      {/* Overview Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            {strings.sectionBadge}
          </span>
          <span className="text-xs text-slate-500 font-mono">{assessmentId}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
          {strings.pageTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-4xl">
          {strings.pageSubtitle}
        </p>

        {/* Governance Callout */}
        <div className="mt-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
            {strings.governanceDisclaimer}
          </p>
        </div>

        {/* Part F Consolidated Deduplication Banner */}
        <div className="mt-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {strings.savingsControlBadge}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {strings.deduplicationEngineActive}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {strings.consolidatedSavingsDescription}
            </p>
          </div>
          {onSelectLever && (
            <button
              type="button"
              onClick={() => onSelectLever('consolidatedSavings')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <span>{strings.btnViewConsolidatedSavings}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 10 Levers Grid / List */}
      <div className="space-y-4">
        {TEN_LEVERS_OVERVIEW_CONFIG.map((lever: LeverOverviewItem) => {
          const isImplemented = lever.implementationStatus === 'IMPLEMENTED';
          const isExpanded = !!expandedDiagnostics[lever.id];
          const histOppText = lever.id === 1 && directPriceOppCr !== undefined
            ? strings.formatOpportunity(directPriceOppCr)
            : strings.unquantifiedNotice;

          return (
            <div
              key={lever.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm transition-all ${
                isImplemented
                  ? 'border-blue-300 dark:border-blue-700/60 ring-1 ring-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Lever Top Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs flex-shrink-0 ${
                      isImplemented
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {lever.id}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {lever.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {lever.name}
                      </h3>
                      {renderStatusBadge(lever)}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                      {lever.purpose}
                    </p>
                  </div>
                </div>

                {/* Right Side Metrics & Action */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 lg:justify-end">
                  <div className="text-left sm:text-right min-w-[140px]">
                    <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      {strings.lblHistoricalOpp}
                    </div>
                    <div className={`text-base font-bold mt-0.5 ${lever.id === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 font-mono text-xs'}`}>
                      {histOppText}
                    </div>
                  </div>

                  <div className="text-left sm:text-right min-w-[120px]">
                    <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      {strings.lblValidatedSavings}
                    </div>
                    <div className="text-base font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      {strings.zeroValidatedSavings}
                    </div>
                  </div>

                  <div className="min-w-[160px] flex justify-end">
                    {isImplemented && onSelectLever ? (
                      <button
                        type="button"
                        data-testid={`lever-open-btn-${lever.id}`}
                        onClick={() => onSelectLever(LEVER_TAB_MAP[lever.id] || 'directPrice')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <span>{strings.btnOpenAnalysis}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : lever.implementationStatus === 'COMING_SOON' ? (
                      <button
                        type="button"
                        disabled
                        data-testid={`lever-coming-soon-btn-${lever.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-semibold cursor-not-allowed"
                        title={strings.comingSoonTitle}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{strings.btnComingSoon}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed"
                      >
                        <Lock className="w-3 h-3" />
                        <span>{strings.btnPending}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Methodology Accordion Toggle */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  data-testid={`lever-accordion-btn-${lever.id}`}
                  onClick={() => toggleDiagnostics(lever.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{strings.collapsibleToggle}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <div className="text-[10px] text-slate-400 italic">
                  {isImplemented ? strings.provisionalNotice : lever.implementationStatus === 'COMING_SOON' ? strings.statusComingSoon : strings.statusPlanned}
                </div>
              </div>

              {/* Collapsed by Default: Diagnostics Body */}
              {isExpanded && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-3 animate-in fade-in duration-150">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{strings.methodologySummaryTitle}</span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">{lever.methodologySummary}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{strings.requiredFieldsTitle}</div>
                      <div className="flex flex-wrap gap-1">
                        {lever.requiredFields.map((f: string) => (
                          <span key={f} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{strings.preconditionsTitle}</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                        {lever.preconditions.map((p: string) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
