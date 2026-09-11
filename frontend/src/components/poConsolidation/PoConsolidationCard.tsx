'use client';

import React from 'react';
import { TrendingDown, ArrowUpRight, AlertTriangle, Star } from 'lucide-react';
import type { PoConsolidationCardProps, PoConsolidationCadence } from '../../types/poConsolidation';
import { getCadenceBadgeClass } from '../../constants/poConsolidation';
import { UI_STRINGS } from '../../constants/uiStrings';

const CADENCE_LIST: PoConsolidationCadence[] = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL'];

export const PoConsolidationCard: React.FC<PoConsolidationCardProps> = ({
  item,
  selectedCadence,
  onSelectCadence,
  onOpenModal
}) => {
  const currentOption = item.cadence_options[selectedCadence];

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="space-y-3.5">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
            <span>{UI_STRINGS.poConsolidation.monthlyPoBadge(item.avg_pos_per_month)}</span>
          </span>

          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {item.category}
          </span>
        </div>

        {/* Supplier & Description */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
            {item.vendor_name}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
            {item.item_description}
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1 font-mono">
            <span>{item.material_code}</span>
            <span>•</span>
            <span className="truncate max-w-[200px]">{item.primary_plant}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase">
              {UI_STRINGS.poConsolidation.annualSpendLabel}
            </div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              ₹{item.total_annual_spend_cr.toFixed(2)} Cr
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase">
              {UI_STRINGS.poConsolidation.avgPoValueLabel}
            </div>
            <div className="text-base font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">
              {UI_STRINGS.poConsolidation.avgPoValueVal(item.avg_po_value_lakhs)}
            </div>
          </div>
        </div>

        {/* Target Cadence Selector Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold">{UI_STRINGS.poConsolidation.recommendedCadenceLabel}:</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getCadenceBadgeClass(item.recommended_cadence)} flex items-center space-x-1`}>
              <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
              <span>{item.cadence_options[item.recommended_cadence].label}</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {CADENCE_LIST.map((cadence) => {
              const active = selectedCadence === cadence;
              return (
                <button
                  key={cadence}
                  type="button"
                  onClick={() => onSelectCadence(item.id, cadence)}
                  className={`py-1.5 px-1 rounded text-[10px] font-semibold text-center transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="truncate">
                    {cadence === 'MONTHLY' && 'Monthly'}
                    {cadence === 'QUARTERLY' && 'Quarterly'}
                    {cadence === 'HALF_YEARLY' && '6-Month'}
                    {cadence === 'ANNUAL' && 'Annual'}
                  </div>
                  <div className="text-[9px] opacity-80">
                    {cadence === 'MONTHLY' && '12 POs'}
                    {cadence === 'QUARTERLY' && '4 POs'}
                    {cadence === 'HALF_YEARLY' && '2 POs'}
                    {cadence === 'ANNUAL' && '1 PO'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Economies of Scale Benefit Box */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
            <span className="flex items-center space-x-1">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              <span>{UI_STRINGS.poConsolidation.scaleSavingsLabel}</span>
            </span>
            <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {UI_STRINGS.poConsolidation.scaleSavingsValue(
                currentOption.scale_savings_cr,
                currentOption.scale_discount_pct
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {item.annual_po_count} POs → {currentOption.target_pos_per_year} POs (-{currentOption.po_reduction_pct}%)
            </span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              +{UI_STRINGS.poConsolidation.adminSavingsValue(currentOption.admin_savings_lakhs)} admin
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onOpenModal(item)}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
        >
          <span>{UI_STRINGS.poConsolidation.exploreConsolidationBtn}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
