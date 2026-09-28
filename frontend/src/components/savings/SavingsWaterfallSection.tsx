'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import type { SavingsWaterfallSectionProps } from '../../types/components';
import { UI_STRINGS } from '../../constants/uiStrings';

export const SavingsWaterfallSection: React.FC<SavingsWaterfallSectionProps> = ({
  waterfallMetrics,
  className = ''
}) => {
  const sStrings = UI_STRINGS.module4.savingsWaterfall;
  const steps = sStrings.steps;

  const totalSpendCr = waterfallMetrics?.total_spend_inr_cr ?? 100.0;
  const addressableSpendCr = waterfallMetrics?.addressable_spend_inr_cr ?? 88.0;
  const identifiedOppsCr = waterfallMetrics?.identified_opportunities_count ? Number(((waterfallMetrics.gross_potential_savings_inr_cr || 17.6) * 1.2).toFixed(2)) : 19.8;
  const dedupOverlapCr = waterfallMetrics?.deduplicated_overlap_inr_cr ?? 5.0;
  const netPotentialSavingsCr = waterfallMetrics?.net_potential_savings_inr_cr ?? 12.6;
  const validatedSavingsCr = waterfallMetrics?.validated_savings_inr_cr ?? 6.5;
  const approvedSavingsCr = waterfallMetrics?.approved_savings_inr_cr ?? 4.2;
  const realizedSavingsCr = waterfallMetrics?.realized_savings_inr_cr ?? 1.8;

  const waterfallStages = [
    {
      title: steps.totalSpend,
      valueCr: totalSpendCr,
      note: 'Total Operational Spend',
      color: 'from-slate-700 to-slate-900 text-white',
      barColor: 'bg-slate-700 dark:bg-slate-600',
      pct: 100.0
    },
    {
      title: steps.addressableSpend,
      valueCr: addressableSpendCr,
      note: 'UNSPSC / Sourcing Addressable',
      color: 'from-blue-600 to-indigo-700 text-white',
      barColor: 'bg-blue-600 dark:bg-blue-500',
      pct: totalSpendCr > 0 ? Number(((addressableSpendCr / totalSpendCr) * 100).toFixed(1)) : 88.0
    },
    {
      title: steps.identifiedOpportunities,
      valueCr: identifiedOppsCr,
      note: 'Gross Levers Flagged',
      color: 'from-cyan-600 to-teal-700 text-white',
      barColor: 'bg-cyan-600 dark:bg-cyan-500',
      pct: totalSpendCr > 0 ? Number(((identifiedOppsCr / totalSpendCr) * 100).toFixed(1)) : 19.8
    },
    {
      title: steps.potentialSavings,
      valueCr: netPotentialSavingsCr,
      note: `Net Non-Overlapping (-₹${dedupOverlapCr.toFixed(1)} Cr dedup)`,
      color: 'from-emerald-600 to-green-700 text-white',
      barColor: 'bg-emerald-600 dark:bg-emerald-500',
      pct: totalSpendCr > 0 ? Number(((netPotentialSavingsCr / totalSpendCr) * 100).toFixed(1)) : 12.6
    },
    {
      title: steps.validatedSavings,
      valueCr: validatedSavingsCr,
      note: 'Client Team Validated',
      color: 'from-indigo-600 to-purple-700 text-white',
      barColor: 'bg-indigo-600 dark:bg-indigo-500',
      pct: totalSpendCr > 0 ? Number(((validatedSavingsCr / totalSpendCr) * 100).toFixed(1)) : 6.5
    },
    {
      title: steps.approvedSavings,
      valueCr: approvedSavingsCr,
      note: 'Management & CPO Approved',
      color: 'from-purple-600 to-pink-700 text-white',
      barColor: 'bg-purple-600 dark:bg-purple-500',
      pct: totalSpendCr > 0 ? Number(((approvedSavingsCr / totalSpendCr) * 100).toFixed(1)) : 4.2
    },
    {
      title: steps.realizedSavings,
      valueCr: realizedSavingsCr,
      note: 'Audited & Realized in ERP',
      color: 'from-teal-600 to-emerald-700 text-white',
      barColor: 'bg-teal-600 dark:bg-teal-500',
      pct: totalSpendCr > 0 ? Number(((realizedSavingsCr / totalSpendCr) * 100).toFixed(1)) : 1.8
    }
  ];

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{sStrings.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sStrings.subtitle}
          </p>
        </div>
        <div className="text-xs font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
          Rule 4: Potential Opportunity ≠ Realized Savings
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 items-stretch">
        {waterfallStages.map((st, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex flex-col justify-between space-y-2 hover:border-emerald-500/50 transition-all"
          >
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">
                Stage {idx + 1}
              </span>
              <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-tight block">
                {st.title}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                {st.note}
              </span>
            </div>

            <div>
              <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                ₹{st.valueCr.toFixed(2)} Cr
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full ${st.barColor}`}
                  style={{ width: `${Math.min(100, st.pct)}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-400 block mt-1">
                {st.pct.toFixed(1)}% of total
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Governance Note: </span>
        {sStrings.note}
      </div>
    </div>
  );
};
