'use client';

import React from 'react';
import {
  Layers,
  ShieldCheck,
  Scale,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ExecutiveBriefOpportunityTableProps } from '../../types';
import {
  EXECUTIVE_BRIEF_EXPORT_STRINGS,
  EXECUTIVE_BRIEF_OPPORTUNITY_ROWS,
  EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN
} from '../../constants';
import { ExecutiveBriefAssumptionsPanel } from './ExecutiveBriefAssumptionsPanel';
import { ExecutiveBriefSpecialDisplays } from './ExecutiveBriefSpecialDisplays';
import { ExecutiveBriefTotalValuePortfolio } from './ExecutiveBriefTotalValuePortfolio';

export const ExecutiveBriefOpportunityTable: React.FC<ExecutiveBriefOpportunityTableProps> = ({
  onDrillOpportunity
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;
  const oppStrings = strings.opportunityTable;
  const dblStrings = strings.doubleCountingControl;

  return (
    <section aria-labelledby="executive-opportunity-heading" className="space-y-6">
      {/* Section 15: Total Value Opportunity Portfolio with 7 Expandable Levers */}
      <ExecutiveBriefTotalValuePortfolio onSelectOpportunity={onDrillOpportunity} />

      {/* Section 13: How We Prevent Double Counting */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="executive-opportunity-heading" className="text-sm font-black uppercase tracking-wider text-white">
                {dblStrings.sectionTitle}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {dblStrings.subtitle}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-mono font-semibold self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Overlap Invariant
          </span>
        </div>

        {/* Waterfall Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Gross Identified */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {dblStrings.grossTitle}
            </span>
            <div className="text-xl font-black text-slate-200 mt-1">
              {EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.grossIdentifiedCr}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {dblStrings.grossDesc}
            </span>
          </div>

          {/* Overlap Adjustment */}
          <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
              {dblStrings.overlapTitle}
            </span>
            <div className="text-xl font-black text-amber-400 mt-1">
              {EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.overlapAdjustmentCr}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {dblStrings.overlapDesc}
            </span>
          </div>

          {/* Exclusions */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {dblStrings.exclusionTitle}
            </span>
            <div className="text-xl font-black text-slate-400 mt-1">
              {EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.exclusionsCr}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              {dblStrings.exclusionDesc}
            </span>
          </div>

          {/* Net Defensible Opportunity */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-cyan-950/40 border border-emerald-600/50 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wide">
                {dblStrings.netTitle}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.netDefensibleCr}
            </div>
            <span className="text-[10px] text-emerald-400/90 font-medium mt-1">
              {dblStrings.netDesc}
            </span>
          </div>
        </div>

        {/* Secondary Benefit Pillars (Productivity & Risk) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-indigo-900/40">
            <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-indigo-300">{dblStrings.productivityTitle}</div>
              <div className="text-slate-400 text-[11px]">{dblStrings.productivityDesc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-sky-900/40">
            <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-sky-300">{dblStrings.strategicRiskTitle}</div>
              <div className="text-slate-400 text-[11px]">{dblStrings.strategicRiskDesc}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 14: Analysis-Wise Executive Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              {oppStrings.sectionTitle}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {oppStrings.subtitle}
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            8 Analytical Levers • Certified Invariants
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
                <th className="py-3 px-3 font-semibold">{oppStrings.colAnalysis}</th>
                <th className="py-3 px-3 font-semibold">{oppStrings.colAddressableSpend}</th>
                <th className="py-3 px-3 font-semibold">{oppStrings.colAssumptionMethod}</th>
                <th className="py-3 px-3 font-semibold text-right">{oppStrings.colIndicativeOpportunity}</th>
                <th className="py-3 px-3 font-semibold">{oppStrings.colBenefitType}</th>
                <th className="py-3 px-3 font-semibold">{oppStrings.colConfidence}</th>
                <th className="py-3 px-3 font-semibold">{oppStrings.colPrimaryAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {EXECUTIVE_BRIEF_OPPORTUNITY_ROWS.map((row) => {
                const isSoftOrRisk = row.benefitType.includes('Productivity') || row.benefitType.includes('Risk');
                return (
                  <tr
                    key={row.analysis}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => onDrillOpportunity?.(row.analysis)}
                  >
                    <td className="py-3 px-3 font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {row.analysis}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{row.addressableSpend}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">{row.assumptionMethod}</td>
                    <td className={`py-3 px-3 font-mono font-bold text-right ${
                      isSoftOrRisk ? 'text-indigo-400' : 'text-emerald-400'
                    }`}>
                      {row.indicativeOpportunity}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isSoftOrRisk
                          ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60'
                          : row.benefitType.includes('Cost Avoidance')
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                      }`}>
                        {row.benefitType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-slate-300">{row.confidence}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs truncate" title={row.primaryAction}>
                      {row.primaryAction}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 16: CFO / CEO Mandatory Disclaimer */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-slate-300">CFO Governance Note: </span>
            {oppStrings.cfoNote}
          </p>
        </div>
      </div>

      {/* Section 8: Savings Assumptions & Methodology Taxonomy */}
      <ExecutiveBriefAssumptionsPanel />

      {/* Sections 12-15: PO, Vendor, Benchmark, and Roadmap Special Displays */}
      <ExecutiveBriefSpecialDisplays onSelectLever={onDrillOpportunity} />
    </section>
  );
};
