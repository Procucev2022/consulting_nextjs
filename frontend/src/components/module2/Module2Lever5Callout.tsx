'use client';

import React from 'react';
import { AlertTriangle, Briefcase, Calendar, ShieldCheck } from 'lucide-react';
import type { Module2Lever5CalloutProps } from '../../types/module2SavingsDeduplication';
import { UI_STRINGS } from '../../constants/uiStrings';

export const Module2Lever5Callout: React.FC<Module2Lever5CalloutProps> = ({ data }) => {
  const strings = UI_STRINGS.module2SavingsDeduplication;

  return (
    <div className="space-y-3" data-testid="lever5-callout-container">
      {/* Prominent Business Disclosure Banner: Benefit Cannot Be Ascertained */}
      <div
        className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-500/50 dark:border-amber-600/60 rounded-xl"
        data-testid="payment-terms-unavailable-banner"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 tracking-wide uppercase">
              {strings.benefitCannotBeAscertainedTitle}
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {strings.benefitCannotBeAscertainedMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Actual Metric Status & Segregation Card */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
          <div className="flex items-start gap-2.5">
            <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                {strings.lever5SectionTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {strings.workingCapitalNote}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>NEVER ADDED TO PROCUREMENT SAVINGS</span>
          </div>
        </div>

        {/* Actual Presentation (Non-Ascertainable) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="block text-[10px] font-sans font-semibold text-slate-400 uppercase">
              Actual Working Capital Benefit
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400 text-[11px] block mt-1">
              {strings.actualWcBenefitUnavailable}
            </span>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="block text-[10px] font-sans font-semibold text-slate-400 uppercase">
              Actual Annual Financing Benefit
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400 text-[11px] block mt-1">
              {strings.actualFinancingBenefitUnavailable}
            </span>
          </div>
          <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="block text-[10px] font-sans font-semibold text-slate-400 uppercase">
              Additional Credit Days
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400 text-[11px] block mt-1">
              {strings.actualCreditDaysUnavailable}
            </span>
          </div>
        </div>

        {/* Separately Labelled Illustrative Planning Scenario */}
        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>{strings.planningScenarioTitle}</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1.5">WC Released:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  ₹{data.lever5WorkingCapitalReleasedCr.toFixed(4)} Cr
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1.5">Financing Benefit:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  ₹{data.lever5AnnualFinancingBenefitCr.toFixed(4)} Cr
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-snug">
            {strings.planningScenarioDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
