'use client';
import React, { useState } from 'react';
import {
  Target,
  FileCheck,
  ArrowRight,
  Send,
  Zap,
  Sparkles,
  Award,
  Check
} from 'lucide-react';
import type { Module4SavingsEngineProps } from '../types';
import {
  UI_STRINGS,
  DEFAULT_SPEND_BASELINE_INR_CR,
  DEFAULT_SAVINGS_TARGET_INR_CR
} from '../constants';

export const Module4SavingsEngine: React.FC<Module4SavingsEngineProps> = ({
  opportunities,
  onOpenProCPX,
  onOpenDPSNXT,
  onProceedToConversion
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');

  const totalEvaluatedSpendInrCr = DEFAULT_SPEND_BASELINE_INR_CR; // ₹732.41 Cr
  const totalSavingsInrCr = DEFAULT_SAVINGS_TARGET_INR_CR; // ₹119.67 Cr (16.4% Net Target)


  const categoryBreakdowns = [
    {
      name: UI_STRINGS.module4.categories.directMaterials,
      targetPct: UI_STRINGS.module4.categoryTargets.directMaterials,
      savingsFound: UI_STRINGS.module4.categorySavingsFound.directMaterials,
      color: 'from-cyan-500 to-blue-500',
      textColor: 'text-cyan-700 dark:text-cyan-400',
      progressPct: 100
    },
    {
      name: UI_STRINGS.module4.categories.packagingMaterials,
      targetPct: UI_STRINGS.module4.categoryTargets.packagingMaterials,
      savingsFound: UI_STRINGS.module4.categorySavingsFound.packagingMaterials,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      progressPct: 106
    },
    {
      name: UI_STRINGS.module4.categories.indirectMRO,
      targetPct: UI_STRINGS.module4.categoryTargets.indirectMRO,
      savingsFound: UI_STRINGS.module4.categorySavingsFound.indirectMRO,
      color: 'from-purple-500 to-violet-500',
      textColor: 'text-purple-700 dark:text-purple-400',
      progressPct: 96
    },
    {
      name: UI_STRINGS.module4.categories.logisticsFreight,
      targetPct: UI_STRINGS.module4.categoryTargets.logisticsFreight,
      savingsFound: UI_STRINGS.module4.categorySavingsFound.logisticsFreight,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      progressPct: 102
    }
  ];

  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedCategory !== 'ALL' && opp.category !== selectedCategory) return false;
    if (filterModule !== 'ALL' && opp.push_to_module !== filterModule) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 border border-emerald-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              {UI_STRINGS.module4.badge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.module4.frRef}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {UI_STRINGS.module4.heading}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {UI_STRINGS.module4.description}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400 text-xs font-bold font-mono">
            <Award className="w-4 h-4" />
            <span>{UI_STRINGS.module4.realizationTargetBadge}</span>
          </span>
        </div>
      </div>

      {/* Grid: 1. Hero Total Savings Highlight Card (5 cols) + 2. Target vs Realized Distribution (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/80 dark:via-slate-900 dark:to-teal-950/60 border border-emerald-200 dark:border-emerald-500/30 p-6 flex flex-col justify-between glass-panel-glow shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
                {UI_STRINGS.module4.heroBadge}
              </span>
              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                {UI_STRINGS.module4.netSpendBadge}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{UI_STRINGS.module4.enterprisePotential}</span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                ₹{totalSavingsInrCr.toFixed(2)} Cr
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {UI_STRINGS.module4.historicalProcurementNote(totalEvaluatedSpendInrCr)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">{UI_STRINGS.module4.directSourcingLabel}</span>
              <span className="text-cyan-700 dark:text-cyan-400 font-bold text-sm">{UI_STRINGS.module4.directSourcingVal}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">{UI_STRINGS.module4.contractRulesLabel}</span>
              <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">{UI_STRINGS.module4.contractRulesVal}</span>
            </div>
          </div>
        </div>

        {/* Category Progress Breakdown */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.module4.distributionTitle}</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{UI_STRINGS.module4.distributionSubtitle}</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryBreakdowns.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.module4.targetPrefix(cat.targetPct)}</span>
                    <span className={`font-black ${cat.textColor}`}>{cat.savingsFound}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                    style={{ width: `${Math.min(cat.progressPct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Savings Opportunities Action Pipeline Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{UI_STRINGS.module4.pipelineTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.module4.pipelineSubtitle}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">{UI_STRINGS.module4.filterCategories.all}</option>
              <option value={UI_STRINGS.module4.categories.directMaterials}>{UI_STRINGS.module4.filterCategories.direct}</option>
              <option value={UI_STRINGS.module4.categories.packagingMaterials}>{UI_STRINGS.module4.filterCategories.packaging}</option>
              <option value={UI_STRINGS.module4.categories.indirectMRO}>{UI_STRINGS.module4.filterCategories.indirect}</option>
              <option value={UI_STRINGS.module4.categories.logisticsFreight}>{UI_STRINGS.module4.filterCategories.logistics}</option>
            </select>

            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">{UI_STRINGS.module4.filterEngines.all}</option>
              <option value="proCPX">{UI_STRINGS.module4.filterEngines.proCPX}</option>
              <option value="DPS NXT">{UI_STRINGS.module4.filterEngines.dpsNXT}</option>
            </select>
          </div>
        </div>

        {/* Pipeline Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.oppIdAndCategory}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.titleAndLeakage}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.currentSpendInrCr}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.targetPct}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.estSavingsInrCr}</th>
                  <th className="py-3 px-4 text-center">{UI_STRINGS.module4.tableHeaders.suiteIntegration}</th>
                  <th className="py-3 px-4 text-right">{UI_STRINGS.module4.tableHeaders.executionAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {filteredOpportunities.map((opp) => (
                  <tr
                    key={opp.opp_id}
                    className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-cyan-700 dark:text-cyan-400 block font-mono">
                        {opp.opp_id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">{opp.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{opp.title}</div>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5">
                        {UI_STRINGS.module4.leakPrefix(opp.contract_leak_type)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                      ₹{opp.current_spend_inr_cr?.toFixed(2) || (opp.current_spend * 83.8 / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-cyan-700 dark:text-cyan-400 font-bold">
                      {opp.target_savings_pct}%
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{opp.est_savings_inr_cr?.toFixed(2) || (opp.est_savings * 83.8 / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          opp.push_to_module === 'proCPX'
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border border-purple-300 dark:border-purple-800/60'
                        }`}
                      >
                        {opp.push_to_module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      {opp.status === 'Pushed to proCPX' || opp.status === 'Pushed to DPS NXT' ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/50 text-xs font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>{UI_STRINGS.module4.pushedBadge}</span>
                        </span>
                      ) : opp.push_to_module === 'proCPX' ? (
                        <button
                          onClick={() => onOpenProCPX(opp)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all shadow-xs active:scale-95 flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>{UI_STRINGS.module4.pushToProCPX}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenDPSNXT(opp)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all shadow-xs active:scale-95 flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>{UI_STRINGS.module4.pushToDPSNXT}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA to Module 5 */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{UI_STRINGS.module4.ctaSubtitle}</span>
          </div>
          <button
            onClick={onProceedToConversion}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl shadow-md shadow-purple-600/20 transition-all transform active:scale-95 group cursor-pointer"
          >
            <span>{UI_STRINGS.module4.ctaProceedButton}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
