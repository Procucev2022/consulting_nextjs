'use client';

import React from 'react';
import {
  DollarSign,
  FolderTree,
  CheckCircle2,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import type { EAuctionResult } from '../../types/module2EAuction';
import { UI_STRINGS } from '../../constants';

export interface EAuctionKpiCardsProps {
  result: EAuctionResult;
}

export const EAuctionKpiCards: React.FC<EAuctionKpiCardsProps> = ({ result }) => {
  const strings = UI_STRINGS.module2EAuction;
  const sr = result.summarySavingsRange;
  const hasRange = sr?.savingsRangeStatus === 'ESTIMATED';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
      {/* 1. Total Spend Reviewed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            {strings.cardTotalSpendReviewed}
          </span>
          <DollarSign className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
          ₹{result.totalSpendReviewedCr.toFixed(2)} Cr
        </div>
        <div className="text-[10px] text-slate-500">Historical spend pool</div>
      </div>

      {/* 2. Number of Categories Reviewed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            {strings.cardCategoriesReviewed}
          </span>
          <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
          {result.categoriesReviewedCount}
        </div>
        <div className="text-[10px] text-slate-500">UNSPSC categories</div>
      </div>

      {/* 3. Number of Candidate Categories & Materials */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
            {strings.cardCandidateCategories}
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {result.candidateCategoriesCount} Cat / {result.candidateMaterialsCount} Mat
        </div>
        <div className="text-[10px] text-emerald-700/80">Candidates for review</div>
      </div>

      {/* 4. Total Addressable Spend */}
      <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-purple-700 dark:text-purple-400 uppercase">
            Addressable Spend
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
        </div>
        <div className="mt-1 text-lg font-bold text-purple-700 dark:text-purple-300">
          ₹{(result.totalAddressableSpendCr ?? 0).toFixed(2)} Cr
        </div>
        <div className="text-[10px] text-purple-600/80">Eligible candidate spend</div>
      </div>

      {/* 5. Estimated Savings Range */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
            Estimated Savings
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
          {hasRange && sr ? (
            `₹${sr.minEstimatedSavingsCr?.toFixed(2)} - ₹${sr.maxEstimatedSavingsCr?.toFixed(2)} Cr`
          ) : (
            strings.statusNotYetQuantifiable
          )}
        </div>
        <div className="text-[10px] text-slate-500">
          {hasRange && sr ? (
            <>
              <div>Exp: ₹{sr.expectedEstimatedSavingsCr?.toFixed(2)} Cr ({((sr.expectedSavingsRate || 0) * 100).toFixed(1)}%)</div>
              <div className="text-[9px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {strings.provisionalEditableNotice}
              </div>
            </>
          ) : (
            `${result.recordsRequiringDataReviewCount} need data review`
          )}
        </div>
      </div>

      {/* 6. Commercially Validated Savings (strictly 0) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            {strings.cardValidatedSavings}
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="mt-1 text-lg font-bold text-slate-700 dark:text-slate-300">
          ₹0.00 Cr
        </div>
        <div className="text-[10px] text-slate-500">Pre-execution status</div>
      </div>
    </div>
  );
};
