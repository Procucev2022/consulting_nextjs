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
          className="bg-white border border-[#DCE7F5] rounded-2xl p-5 shadow-sm space-y-3 cursor-pointer hover:border-[#0284C7] transition-all"
        >
          <div className="flex items-center justify-between border-b border-[#DCE7F5] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>
              <h3 id="special-displays-heading" className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
                PO Consolidation — Operational Productivity Model
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Productivity Benefit
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-[#F8FBFE] p-2.5 rounded-xl border border-[#DCE7F5]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Current State</span>
              <div className="text-sm font-black text-[#0B1B33] mt-0.5">{po.currentStatePOs}</div>
            </div>
            <div className="bg-[#F8FBFE] p-2.5 rounded-xl border border-[#DCE7F5]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Optimized State</span>
              <div className="text-sm font-black text-indigo-700 mt-0.5">{po.optimizedStatePOs}</div>
            </div>
            <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-200">
              <span className="text-[10px] text-indigo-700 uppercase font-semibold">Reduction</span>
              <div className="text-sm font-black text-indigo-700 mt-0.5">{po.transactionReductionPercent}</div>
            </div>
          </div>

          <div className="bg-[#F8FBFE] p-3 rounded-xl border border-[#DCE7F5] space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-medium">Workload Optimization:</span>
              <span className="font-bold text-indigo-700">{po.processEffortReductionLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-medium">Direct Spend Savings:</span>
              <span className="tabular-nums font-semibold text-[#0B1B33]">{po.monetarySavingsLabel}</span>
            </div>
            <p className="text-[10px] text-[#64748B] pt-1 border-t border-[#DCE7F5] leading-relaxed">
              {po.financialImpactNote} {po.bandwidthBenefit}
            </p>
          </div>
        </div>

        {/* Section 13: Vendor Consolidation - Volume Leverage Model */}
        <div
          onClick={() => onSelectLever?.('vendor_consolidation')}
          className="bg-white border border-[#DCE7F5] rounded-2xl p-5 shadow-sm space-y-3 cursor-pointer hover:border-[#0284C7] transition-all"
        >
          <div className="flex items-center justify-between border-b border-[#DCE7F5] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
                Vendor Consolidation — Volume Discount Model
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Volume Leverage
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-[#F8FBFE] p-2.5 rounded-xl border border-[#DCE7F5]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Active Vendors</span>
              <div className="text-sm font-black text-[#0B1B33] mt-0.5">{vc.currentSuppliers}</div>
            </div>
            <div className="bg-[#F8FBFE] p-2.5 rounded-xl border border-[#DCE7F5]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Target Panel</span>
              <div className="text-sm font-black text-emerald-700 mt-0.5">{vc.targetSuppliers}</div>
            </div>
            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 uppercase font-semibold">Indicative Opp</span>
              <div className="text-sm font-black text-emerald-700 mt-0.5">{vc.indicativeOpportunityCr}</div>
            </div>
          </div>

          <div className="bg-[#F8FBFE] p-3 rounded-xl border border-[#DCE7F5] space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              7-Step Sourcing Realization Plan:
            </span>
            <ul className="text-[10px] text-[#475569] space-y-0.5">
              {vc.realizationSteps.slice(0, 3).map((step, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
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
          className="bg-white border border-[#DCE7F5] rounded-2xl p-5 shadow-sm space-y-3 cursor-pointer hover:border-[#0284C7] transition-all"
        >
          <div className="flex items-center justify-between border-b border-[#DCE7F5] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-[#0284C7]">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
                PCBI Market Benchmark — Independent Price Gap
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-50 text-[#0284C7] border border-sky-200">
              Grade A Index
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-[#F8FBFE] p-3 rounded-xl border border-[#DCE7F5]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Current Purchase Rate</span>
              <div className="text-sm font-black text-[#0B1B33] mt-0.5">{bm.currentPrice}</div>
              <span className="text-[10px] text-[#64748B] font-mono">Volume-Weighted FY24</span>
            </div>
            <div className="bg-[#F8FBFE] p-3 rounded-xl border border-[#DCE7F5]">
              <span className="text-[10px] text-[#0284C7] uppercase font-semibold">PCBI Benchmark</span>
              <div className="text-sm font-black text-[#0284C7] mt-0.5">{bm.benchmarkPrice}</div>
              <span className="text-[10px] text-emerald-700 tabular-nums font-semibold">{bm.priceGap}</span>
            </div>
          </div>

          <div className="bg-[#F8FBFE] p-3 rounded-xl border border-[#DCE7F5] flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#475569] leading-relaxed">
              <span className="font-semibold text-[#0B1B33]">Opportunity Envelope: </span>
              {bm.indicativeOpportunityCr} across {bm.addressableSpendCr} addressable spend. {bm.cfoDisclaimer}
            </p>
          </div>
        </div>

        {/* Section 15: 5-Phase Realization Roadmap */}
        <div className="bg-white border border-[#DCE7F5] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#DCE7F5] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
                5-Phase Procurement Realization Roadmap
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#64748B]">0–120+ Days</span>
          </div>

          <div className="space-y-2 pt-1">
            {REALIZATION_ROADMAP_STAGES.map((stage) => (
              <div
                key={stage.period}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F8FBFE] border border-[#DCE7F5] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {stage.period}
                  </span>
                  <span className="font-bold text-[#0B1B33] text-[11px]">{stage.title}</span>
                </div>
                <span className="text-[10px] text-[#64748B] hidden sm:inline truncate max-w-[200px]" title={stage.description}>
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
