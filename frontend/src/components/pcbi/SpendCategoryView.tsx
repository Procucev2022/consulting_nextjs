'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import type { SpendCategoryViewProps } from '../../types/components';
import { UI_STRINGS } from '../../constants/uiStrings';

export const SpendCategoryView: React.FC<SpendCategoryViewProps> = ({
  summary,
  className = ''
}) => {
  const catStrings = UI_STRINGS.module3.spendCategoryView;
  const headers = catStrings.headers;
  const totalSpendCr = summary?.total_spend_inr_cr ?? 100.0;

  const rawAggregations = summary?.category_aggregations || [];
  const hasAggregations = rawAggregations.length > 0;

  // Derive categories dynamically from actual customer aggregations or clean empty structure
  const categories = hasAggregations
    ? rawAggregations.map((agg) => {
        const isServices = agg.category.toLowerCase().includes('service') || agg.category.toLowerCase().includes('freight');
        const spendPct = totalSpendCr > 0 ? Number(((agg.spend_cr / totalSpendCr) * 100).toFixed(1)) : 0.0;
        let statusColor = 'bg-slate-100 text-slate-700 dark:bg-[#EEF4FC] dark:text-slate-300 border-slate-300';
        if (agg.category.toLowerCase().includes('direct')) {
          statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
        } else if (agg.category.toLowerCase().includes('pack')) {
          statusColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
        } else if (agg.category.toLowerCase().includes('mro') || agg.category.toLowerCase().includes('consumable')) {
          statusColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
        } else if (agg.category.toLowerCase().includes('indirect')) {
          statusColor = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300';
        }

        return {
          name: agg.category,
          spendCr: agg.spend_cr,
          spendPct,
          txs: agg.items_count ?? 0,
          unspscCoverage: 0.0,
          pcbiCoverage: 0.0,
          benchmarkableSpendCr: 0.0,
          benchmarkabilityPct: 0.0,
          potentialOpportunityCr: agg.opportunity_cr,
          statusColor,
          note: isServices ? 'Rule 6: Excluded from Material PCBI' : undefined
        };
      })
    : [
        {
          name: catStrings.directMaterials,
          spendCr: 0.0,
          spendPct: 0.0,
          txs: 0,
          unspscCoverage: 0.0,
          pcbiCoverage: 0.0,
          benchmarkableSpendCr: 0.0,
          benchmarkabilityPct: 0.0,
          potentialOpportunityCr: 0.0,
          statusColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
        },
        {
          name: catStrings.packingMaterials,
          spendCr: 0.0,
          spendPct: 0.0,
          unspscCoverage: 0.0,
          pcbiCoverage: 0.0,
          benchmarkableSpendCr: 0.0,
          benchmarkabilityPct: 0.0,
          potentialOpportunityCr: 0.0,
          statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
        },
        {
          name: catStrings.mro,
          spendCr: 0.0,
          spendPct: 0.0,
          unspscCoverage: 0.0,
          pcbiCoverage: 0.0,
          benchmarkableSpendCr: 0.0,
          benchmarkabilityPct: 0.0,
          potentialOpportunityCr: 0.0,
          statusColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
        },
        {
          name: catStrings.indirectMaterials,
          spendCr: 0.0,
          spendPct: 0.0,
          unspscCoverage: 0.0,
          pcbiCoverage: 0.0,
          benchmarkableSpendCr: 0.0,
          benchmarkabilityPct: 0.0,
          potentialOpportunityCr: 0.0,
          statusColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300'
        },
        {
          name: catStrings.services,
          spendCr: 0.0,
          spendPct: 0.0,
          unspscCoverage: 0.0,
          pcbiCoverage: 0.0,
          benchmarkableSpendCr: 0.0,
          benchmarkabilityPct: 0.0,
          potentialOpportunityCr: 0.0,
          statusColor: 'bg-slate-100 text-slate-700 dark:bg-[#EEF4FC] dark:text-slate-300 border-slate-300',
          note: 'Rule 6: Excluded from Material PCBI'
        },
        {
          name: catStrings.unmapped,
          spendCr: 0.0,
          spendPct: 0.0,
          unspscCoverage: 0.0,
          pcbiCoverage: 0.0,
          benchmarkableSpendCr: 0.0,
          benchmarkabilityPct: 0.0,
          potentialOpportunityCr: 0.0,
          statusColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
          note: 'Review Queue'
        }
      ];

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800 glass-panel space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{catStrings.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {catStrings.subtitle}
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Independent of UNSPSC primary taxonomy
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-start space-x-3 text-xs">
        <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 uppercase tracking-wide">
          {catStrings.mappingBasisBadge}
        </span>
        <span className="text-slate-600 dark:text-slate-400">
          {catStrings.mappingBasisDesc}
        </span>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#F8FBFE] text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{headers.category}</th>
                <th className="py-3 px-4">{headers.transactions}</th>
                <th className="py-3 px-4">{headers.spendCr}</th>
                <th className="py-3 px-4">{headers.spendPct}</th>
                <th className="py-3 px-4">{headers.unspscCoverage}</th>
                <th className="py-3 px-4">{headers.pcbiCoverage}</th>
                <th className="py-3 px-4">{headers.benchmarkableSpendCr}</th>
                <th className="py-3 px-4">{headers.benchmarkabilityPct}</th>
                <th className="py-3 px-4 text-right">{headers.potentialOpportunityCr}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
              {categories.map((cat, idx) => (
                <tr
                  key={idx}
                  className="bg-white dark:bg-white hover:bg-slate-50 dark:hover:bg-[#EEF4FC] transition-colors"
                >
                  <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${cat.statusColor}`}>
                        {cat.name}
                      </span>
                      {cat.note && (
                        <span className="text-[10px] font-sans text-slate-400 italic">
                          ({cat.note})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {cat.txs ? cat.txs.toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    ₹{cat.spendCr.toFixed(2)} Cr
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {cat.spendPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-cyan-700 dark:text-cyan-400 font-semibold">
                    {cat.unspscCoverage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-indigo-700 dark:text-indigo-400 font-semibold">
                    {cat.pcbiCoverage.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">
                    ₹{cat.benchmarkableSpendCr.toFixed(2)} Cr
                  </td>
                  <td className="py-3 px-4 text-emerald-800 dark:text-emerald-300 font-bold">
                    {cat.benchmarkabilityPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                    {cat.potentialOpportunityCr > 0
                      ? `₹${cat.potentialOpportunityCr.toFixed(2)} Cr`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
