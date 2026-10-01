'use client';

import React from 'react';
import {
  FileText,
  Users,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ExecutiveBriefSpecialDisplaysProps } from '../../types';
import {
  PO_CONSOLIDATION_DISPLAY_DATA,
  VENDOR_CONSOLIDATION_DISPLAY_DATA,
  BENCHMARK_SPECIAL_DISPLAY_DATA,
  REALIZATION_ROADMAP_STAGES
} from '../../constants';

export const ExecutiveBriefSpecialDisplays: React.FC<ExecutiveBriefSpecialDisplaysProps> = ({
  onSelectLever
}) => {
  const po = PO_CONSOLIDATION_DISPLAY_DATA;
  const vc = VENDOR_CONSOLIDATION_DISPLAY_DATA;
  const bm = BENCHMARK_SPECIAL_DISPLAY_DATA;

  return (
    <section aria-labelledby="special-displays-heading" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section 12: PO Consolidation - Productivity Model */}
        <div
          onClick={() => onSelectLever?.('po_consolidation')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <h3 id="special-displays-heading" className="text-xs font-black uppercase tracking-wider text-white">
                PO Consolidation — Operational Productivity Model
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/60">
              Productivity Benefit
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Current State</span>
              <div className="text-sm font-black text-slate-200 mt-0.5">{po.currentStatePOs}</div>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Optimized State</span>
              <div className="text-sm font-black text-indigo-300 mt-0.5">{po.optimizedStatePOs}</div>
            </div>
            <div className="bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-800/40">
              <span className="text-[10px] text-indigo-300 uppercase font-semibold">Reduction</span>
              <div className="text-sm font-black text-indigo-400 mt-0.5">{po.transactionReductionPercent}</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Workload Optimization:</span>
              <span className="font-bold text-indigo-300">{po.processEffortReductionLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Direct Spend Savings:</span>
              <span className="font-mono text-slate-300">{po.monetarySavingsLabel}</span>
            </div>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 leading-relaxed">
              {po.financialImpactNote} {po.bandwidthBenefit}
            </p>
          </div>
        </div>

        {/* Section 13: Vendor Consolidation - Volume Leverage Model */}
        <div
          onClick={() => onSelectLever?.('vendor_consolidation')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Vendor Consolidation — Volume Discount Model
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
              Volume Leverage
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Vendors</span>
              <div className="text-sm font-black text-slate-200 mt-0.5">{vc.currentSuppliers}</div>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Target Panel</span>
              <div className="text-sm font-black text-emerald-300 mt-0.5">{vc.targetSuppliers}</div>
            </div>
            <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40">
              <span className="text-[10px] text-emerald-300 uppercase font-semibold">Indicative Opp</span>
              <div className="text-sm font-black text-emerald-400 mt-0.5">{vc.indicativeOpportunityCr}</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              7-Step Sourcing Realization Plan:
            </span>
            <ul className="text-[10px] text-slate-400 space-y-0.5">
              {vc.realizationSteps.slice(0, 3).map((step, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 14: Benchmark Special Display & Section 15 Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section 14: PCBI Benchmark Gap Display */}
        <div
          onClick={() => onSelectLever?.('benchmark_gap')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                PCBI Market Benchmark — Independent Price Gap
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
              Grade A Index
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Purchase Rate</span>
              <div className="text-sm font-black text-slate-200 mt-0.5">{bm.currentPrice}</div>
              <span className="text-[10px] text-slate-500 font-mono">Volume-Weighted FY24</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-cyan-400 uppercase font-semibold">PCBI Benchmark</span>
              <div className="text-sm font-black text-cyan-300 mt-0.5">{bm.benchmarkPrice}</div>
              <span className="text-[10px] text-emerald-400 font-mono">{bm.priceGap}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Opportunity Envelope: </span>
              {bm.indicativeOpportunityCr} across {bm.addressableSpendCr} addressable spend. {bm.cfoDisclaimer}
            </p>
          </div>
        </div>

        {/* Section 15: 5-Phase Realization Roadmap */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-800/60 text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                5-Phase Procurement Realization Roadmap
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">0–120+ Days</span>
          </div>

          <div className="space-y-2 pt-1">
            {REALIZATION_ROADMAP_STAGES.map((stage) => (
              <div
                key={stage.period}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/70 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                    {stage.period}
                  </span>
                  <span className="font-bold text-slate-200 text-[11px]">{stage.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[200px]" title={stage.description}>
                  {stage.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
