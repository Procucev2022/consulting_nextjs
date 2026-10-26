'use client';

import React from 'react';
import {
  DollarSign,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  FolderTree,
  AlertTriangle
} from 'lucide-react';
import type { DirectPriceCardsProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const DirectPriceCards: React.FC<DirectPriceCardsProps> = ({ result }) => {
  const strings = UI_STRINGS.module2DirectPrice;

  return (
    <div className="space-y-4">
      {/* Certification Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-lg text-amber-700 dark:text-amber-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 dark:text-amber-200 text-sm tracking-wide">
                {strings.certificationNotice}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                UNAUDITED / PROVISIONAL
              </span>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              {strings.disclaimer}
            </p>
          </div>
        </div>
        <div className="text-xs text-amber-900 dark:text-amber-200 font-medium px-3 py-1.5 bg-amber-100/80 dark:bg-amber-900/40 rounded-md border border-amber-200 dark:border-amber-800 whitespace-nowrap">
          {strings.badge}
        </div>
      </div>

      {/* Primary 5-KPI Header Cards as mandated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Total Eligible Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              {strings.cardTotalEligibleSpend}
            </span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            ₹{result.actualSpendCr.toFixed(2)} Cr
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {result.totalEligibleTransactions.toLocaleString()} eligible transactions
          </div>
        </div>

        {/* 2. Total Historical Lost Opportunity */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-xl p-4 shadow-sm hover:shadow transition-shadow ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
              {strings.cardLostOpportunity}
            </span>
            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₹{result.historicalLostOpportunityCr.toFixed(2)} Cr
          </div>
          <div className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
            Indicative internal rate variance
          </div>
        </div>

        {/* 3. Number of Categories Analysed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              {strings.cardCategoriesAnalysed}
            </span>
            <FolderTree className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {result.categoriesAnalysedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {result.itemsEvaluatedCount.toLocaleString()} distinct materials
          </div>
        </div>

        {/* 4. Number of Categories Requiring Data Review */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-amber-700 dark:text-amber-400 uppercase">
              {strings.cardCategoriesRequiringReview}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
            {result.categoriesRequiringReviewCount}
          </div>
          <div className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400/80">
            Unmapped / spec review required
          </div>
        </div>

        {/* 5. Commercially Validated Savings */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              {strings.cardValidatedSavings}
            </span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-700 dark:text-slate-300 tracking-tight">
            ₹0.00 Cr
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Remains ₹0.00 until verified
          </div>
        </div>
      </div>
    </div>
  );
};
