'use client';
import React, { useState } from 'react';
import {
  Target,
  DollarSign,
  TrendingUp,
  Layers,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  Zap,
  Sparkles,
  Award,
  Filter,
  Check
} from 'lucide-react';
import { SavingsOpportunity } from '../types';

interface Module4SavingsEngineProps {
  opportunities: SavingsOpportunity[];
  onOpenProCPX: (opp: SavingsOpportunity) => void;
  onOpenDPSNXT: (opp: SavingsOpportunity) => void;
  onProceedToConversion: () => void;
}

export const Module4SavingsEngine: React.FC<Module4SavingsEngineProps> = ({
  opportunities,
  onOpenProCPX,
  onOpenDPSNXT,
  onProceedToConversion
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');

  const totalEvaluatedSpendInrCr = 732.41; // ₹732.41 Cr
  const totalSavingsInrCr = 119.67; // ₹119.67 Cr (16.4% Net Target)

  const categoryBreakdowns = [
    {
      name: 'Direct Materials',
      targetPct: '18.5%',
      savingsFound: '₹53.80 Cr',
      color: 'from-cyan-500 to-blue-500',
      textColor: 'text-cyan-700 dark:text-cyan-400',
      progressPct: 100
    },
    {
      name: 'Packaging Materials',
      targetPct: '16.1%',
      savingsFound: '₹25.98 Cr',
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      progressPct: 106
    },
    {
      name: 'Indirect & MRO',
      targetPct: '14.2%',
      savingsFound: '₹23.88 Cr',
      color: 'from-purple-500 to-violet-500',
      textColor: 'text-purple-700 dark:text-purple-400',
      progressPct: 96
    },
    {
      name: 'Logistics & Freight',
      targetPct: '12.0%',
      savingsFound: '₹16.01 Cr',
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
              Module 4: Real-Time Savings Engine & Optimization Targets
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">FR-SAV-01, FR-SAV-02</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Savings Engine Dashboard & Suite Integration (INR in Crores)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Real-time opportunity quantification denominated in <strong>INR Crores (₹ Cr)</strong> with native execution export into proCPX (e-sourcing) and DPS NXT (contract rate cards).
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400 text-xs font-bold font-mono">
            <Award className="w-4 h-4" />
            <span>16.4% Realization Target</span>
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
                Total Quantified Savings Target
              </span>
              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                16.4% Net Spend
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enterprise Potential Realization</span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                ₹{totalSavingsInrCr.toFixed(2)} Cr
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Across <strong>₹{totalEvaluatedSpendInrCr.toFixed(2)} Cr</strong> evaluated historical procurement spend (multi-currency FX normalized).
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Direct Sourcing (proCPX)</span>
              <span className="text-cyan-700 dark:text-cyan-400 font-bold text-sm">₹64.71 Cr</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Contract Rules (DPS NXT)</span>
              <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">₹54.96 Cr</span>
            </div>
          </div>
        </div>

        {/* Category Progress Breakdown */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Target vs Realized Savings Distribution (INR in Crores)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">All 4 Core Buckets Active</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryBreakdowns.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-slate-500 dark:text-slate-400">Target: {cat.targetPct}</span>
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
              <span>Identified Opportunity Pipeline & Suite Integration Triggers</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive launchers to push validated savings initiatives directly to <strong>proCPX</strong> (e-Sourcing) and <strong>DPS NXT</strong> (Rate-Card Contracts).
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Direct Materials">Direct Materials</option>
              <option value="Packaging Materials">Packaging Materials</option>
              <option value="Indirect & MRO">Indirect & MRO</option>
              <option value="Logistics & Freight">Logistics & Freight</option>
            </select>

            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Execution Engines</option>
              <option value="proCPX">proCPX Sourcing Engine</option>
              <option value="DPS NXT">DPS NXT Rate Enforcement</option>
            </select>
          </div>
        </div>

        {/* Pipeline Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Opportunity ID & Category</th>
                  <th className="py-3 px-4">Title & Contract Leakage Mechanism</th>
                  <th className="py-3 px-4">Current Spend (₹ Cr)</th>
                  <th className="py-3 px-4">Target %</th>
                  <th className="py-3 px-4">Est. Savings (₹ Cr)</th>
                  <th className="py-3 px-4 text-center">Suite Integration</th>
                  <th className="py-3 px-4 text-right">Execution Action</th>
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
                        Leak: {opp.contract_leak_type}
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
                          <span>Pushed</span>
                        </span>
                      ) : opp.push_to_module === 'proCPX' ? (
                        <button
                          onClick={() => onOpenProCPX(opp)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all shadow-xs active:scale-95 flex items-center space-x-1 ml-auto"
                        >
                          <Send className="w-3 h-3" />
                          <span>Push to proCPX</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenDPSNXT(opp)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all shadow-xs active:scale-95 flex items-center space-x-1 ml-auto"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>Push to DPS NXT</span>
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
            <span>Ready to calculate Client ROI and Transition to Commercial Lock-in Funnel</span>
          </div>
          <button
            onClick={onProceedToConversion}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl shadow-md shadow-purple-600/20 transition-all transform active:scale-95 group"
          >
            <span>Proceed to Conversion Matrix & ROI Engine</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
