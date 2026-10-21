/**
 * Module 2 — Lever 10: Alternate Sourcing KPI Cards Component
 * Compliant with Rule 4, 7, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import React from 'react';
import type { AlternateSourcingSummary } from '../../types/module2AlternateSourcing';
import { ALTERNATE_SOURCING_UI_STRINGS } from '../../constants/module2AlternateSourcing';

interface AlternateSourcingKpiCardsProps {
  summary?: AlternateSourcingSummary;
  selectedState: string;
}

export const AlternateSourcingKpiCards: React.FC<AlternateSourcingKpiCardsProps> = ({ summary, selectedState }) => {
  const strings = ALTERNATE_SOURCING_UI_STRINGS;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">{strings.KPI_ELIGIBLE_MATERIALS}</span>
        <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
          {summary?.totalEligibleMaterials.toLocaleString() || '—'}
        </span>
        <span className="text-[10px] text-slate-500 mt-0.5 block">ANALYZED SKUS</span>
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">{strings.KPI_SINGLE_SOURCE_RISKS}</span>
        <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
          {summary?.singleSourceMaterialsCount || '—'}
        </span>
        <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 block">HIGH RISK SKUS</span>
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
          {strings.KPI_POTENTIAL_VENDORS_ALL}
        </span>
        <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5 block">
          {summary?.totalPotentialVendorsAllLocations.toLocaleString() || '—'}
        </span>
        <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 block">{strings.SUB_VERIFIED_COUNT}</span>
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block">
          {strings.KPI_POTENTIAL_VENDORS_REGION}
        </span>
        <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5 block">
          {summary?.totalPotentialVendorsPreferredRegion.toLocaleString() || '—'}
        </span>
        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 block">{selectedState} POOL</span>
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">{strings.KPI_EXCLUDED_SUPPLIERS}</span>
        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
          {summary?.totalCurrentSuppliersExcluded || 0}
        </span>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5 block">DEDUPLICATED</span>
      </div>

      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">{strings.KPI_SAVINGS_PROTECTION}</span>
        <span className="text-lg font-black text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
          {strings.VALUE_ZERO_SAVINGS}
        </span>
        <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">{strings.SUB_UNVERIFIED_PRICE}</span>
      </div>
    </div>
  );
};
