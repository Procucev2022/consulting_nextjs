'use client';
import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide9SavingsLeversRoadmap: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides,
  opportunities = []
}) => {
  const strings = UI_STRINGS.presentation.savingsLevers;

  const defaultInitiatives = [
    {
      id: 'OPP-01',
      title: 'Direct Chemical Raw Material Index Pegging',
      category: 'Direct Materials',
      action: 'Enforce ICIS/Platts contract formula & volume rebate brackets',
      savings: '₹53.80 Cr',
      engine: 'proCPX Capex Cloud',
      engineBadge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400'
    },
    {
      id: 'OPP-02',
      title: 'Corrugated Packaging Specification Harmonization',
      category: 'Packaging Materials',
      action: 'Consolidate 14 carton specs across 3 manufacturing plants',
      savings: '₹25.98 Cr',
      engine: 'proCPX Clean-Sheet',
      engineBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
    },
    {
      id: 'OPP-03',
      title: 'MRO Plant Spares Dynamic Reverse Auctions',
      category: 'Indirect & MRO',
      action: 'Multi-round competitive bidding across 6 pre-qualified distributors',
      savings: '₹23.88 Cr',
      engine: 'DPS NXT Dynamic Auction',
      engineBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400'
    },
    {
      id: 'OPP-04',
      title: 'Primary Freight Lane Sourcing & Carrier Rationalization',
      category: 'Logistics & Freight',
      action: 'Contract benchmarking against Cass Freight Index with dedicated lanes',
      savings: '₹16.01 Cr',
      engine: 'DPS NXT Sourcing',
      engineBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
    }
  ];

  const displayInitiatives = opportunities.length > 0
    ? opportunities.slice(0, 4).map((opp, idx) => ({
        id: opp.opp_id || `OPP-0${idx + 1}`,
        title: opp.title,
        category: opp.category,
        action: opp.recommended_action,
        savings: `₹${(opp.est_savings_inr_cr || ((opp.est_savings || 50000) * 83.8 / 10000000)).toFixed(2)} Cr`,
        engine: opp.push_to_module === 'proCPX' ? 'proCPX Capex' : 'DPS NXT Auction',
        engineBadge: opp.push_to_module === 'proCPX'
          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400'
      }))
    : defaultInitiatives;

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
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

      {/* Initiatives Table */}
      <div className="my-auto py-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-16">{strings.leverColId}</th>
                <th className="py-2.5 px-3">{strings.leverColTitle}</th>
                <th className="py-2.5 px-3">{strings.leverColCategory}</th>
                <th className="py-2.5 px-3">{strings.leverColAction}</th>
                <th className="py-2.5 px-3 text-right">{strings.leverColSavings}</th>
                <th className="py-2.5 px-3 text-right">{strings.leverColEngine}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
              {displayInitiatives.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {item.id}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                    {item.category}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300 max-w-xs">
                    {item.action}
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm text-right">
                    {item.savings}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 ${item.engineBadge}`}>
                      {item.engine}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Combined Realizable Opportunity: <strong>₹119.67 Cr</strong> (16.4% Addressable Baseline)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-cyan-700 dark:text-cyan-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Automated Deployment via proCPX & DPS NXT</span>
        </div>
      </div>
    </div>
  );
};
