'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Layers,
  Filter,
  CheckCircle2,
  BarChart3,
  Calendar,
  Database,
  Building2
} from 'lucide-react';
import type {
  ExecutiveBriefTotalValuePortfolioProps,
  ExecutiveBriefMasterOpportunityItem
} from '../../types';
import {
  EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES,
  EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS,
  EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN,
  EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS,
  EXECUTIVE_BRIEF_ASSUMPTION_REGISTER,
  EXECUTIVE_BRIEF_VALIDATION_CHECKLIST
} from '../../constants';
import { ExecutiveBriefExpanderCard } from './ExecutiveBriefExpanderCard';
import { ExecutiveBriefMasterRegisterTable } from './ExecutiveBriefMasterRegisterTable';

export const ExecutiveBriefTotalValuePortfolio: React.FC<ExecutiveBriefTotalValuePortfolioProps> = ({
  onSelectOpportunity
}) => {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: true,
    8: true
  });

  const toggleSection = (idx: number): void => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const p = EXECUTIVE_BRIEF_PORTFOLIO_SECTIONS;
  const opps = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES;

  const renderBadge = (txt: string, color = 'cyan'): React.ReactElement => (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-${color}-300 border border-${color}-800/50`}>
      {txt}
    </span>
  );

  const renderFinding19 = (item: ExecutiveBriefMasterOpportunityItem): React.ReactElement => (
    <div
      key={item.opportunityId}
      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
      onClick={() => onSelectOpportunity?.(item.opportunityId)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-cyan-400">{item.opportunityId}</span>
          <span className="text-xs font-semibold text-white">{item.analysis}</span>
          <span className="text-[10px] text-slate-400">({item.category} • {item.item})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
            {item.valueClassification}
          </span>
          {renderBadge(item.classificationLabel)}
          <span className="text-xs font-mono font-bold text-emerald-400">{item.indicativeOpportunity}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] leading-snug">
        <div><span className="font-bold text-slate-400 uppercase text-[10px]">Background: </span><span className="text-slate-300">{item.background}</span></div>
        <div><span className="font-bold text-slate-400 uppercase text-[10px]">Objective: </span><span className="text-slate-300">{item.objective}</span></div>
        <div><span className="font-bold text-slate-400 uppercase text-[10px]">Evidence: </span><span className="text-slate-300">{item.dataEvidence} <span className="font-mono text-cyan-400">[{item.transactionSampleId}]</span></span></div>
        <div><span className="font-bold text-slate-400 uppercase text-[10px]">Current State: </span><span className="text-slate-300">{item.currentState ?? item.whatWeFound}</span></div>
        <div><span className="font-bold text-slate-400 uppercase text-[10px]">Finding: </span><span className="text-slate-300">{item.finding}</span></div>
        <div><span className="font-bold text-emerald-400 uppercase text-[10px]">Range (L/B/H): </span><span className="text-emerald-300 font-mono font-semibold">{item.lowValue} / {item.baseValue} / {item.highValue}</span></div>
        <div><span className="font-bold text-slate-400 uppercase text-[10px]">Calculation: </span><span className="text-slate-300 font-mono">{item.calculation}</span></div>
        <div><span className="font-bold text-indigo-400 uppercase text-[10px]">Approach: </span><span className="text-indigo-300">{item.executionApproach}</span></div>
        <div><span className="font-bold text-cyan-400 uppercase text-[10px]">Next Step: </span><span className="text-slate-300">{item.nextStep}</span></div>
        <div className="md:col-span-2 lg:col-span-3"><span className="font-bold text-amber-400 uppercase text-[10px]">Validation Required: </span><span className="text-amber-200/90">{item.validationRequired}</span></div>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="total-value-portfolio-heading" className="space-y-4">
      {/* Headline Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 id="total-value-portfolio-heading" className="text-sm font-black uppercase tracking-wider text-white">
                {p.headlineTitle}
              </h2>
              <p className="text-xs text-slate-400 font-medium">{p.headlineSubtitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CFO-Grade Multi-Lever Taxonomy
          </span>
        </div>

        {/* 6 Headline CFO Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Addressable Spend</span>
            <div className="text-base font-black text-slate-200 mt-1">{p.totalAddressableSpend}</div>
            <div className="mt-1">{renderBadge('FACTUAL BASELINE')}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-600/50 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wide">Net Opportunity</span>
            <div className="text-base font-black text-emerald-300 mt-1">{p.netIndicativeOpportunity}</div>
            <div className="mt-1">{renderBadge('ESTIMATED')}</div>
          </div>
          <div className="bg-slate-950/70 border border-indigo-900/40 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wide">Process Effort</span>
            <div className="text-base font-black text-indigo-300 mt-1">20% Reduction</div>
            <div className="mt-1">{renderBadge('ANALYTICAL')}</div>
          </div>
          <div className="bg-slate-950/70 border border-sky-900/40 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-sky-300 uppercase tracking-wide">Risk Avoidance</span>
            <div className="text-base font-black text-sky-300 mt-1">4 Sole-Sources</div>
            <div className="mt-1">{renderBadge('ANALYTICAL')}</div>
          </div>
          <div className="bg-slate-950/70 border border-purple-900/40 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wide">Validated Run-Rate</span>
            <div className="text-base font-black text-purple-300 mt-1">₹68.00 Cr Cash</div>
            <div className="mt-1">{renderBadge('VALIDATED')}</div>
          </div>
          <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide">Deductions</span>
            <div className="text-base font-black text-amber-400 mt-1">{p.overlapDeductionCr}</div>
            <div className="mt-1">{renderBadge('OVERLAP ZERO')}</div>
          </div>
        </div>

        {/* Visible Value Classification Legend (Prompt 276 Section 10) */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            CFO Value Classification Legend &amp; Governance Standard
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px]">
            {EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS.map((c) => (
              <div key={c.code} className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
                <span className="font-mono font-bold text-cyan-300 block">{c.code}</span>
                <span className="text-slate-400 leading-tight block mt-0.5">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* E-Auction Sourcing Role Clarification */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{p.eauctionShareNote}</span>
          <span className="font-mono text-cyan-400 font-semibold">Opportunity-Led • Multi-Lever</span>
        </div>
      </div>

      {/* 11 Expandable Sections per Section 16 */}
      <div className="space-y-2">
        <ExecutiveBriefExpanderCard title={p.expanders.sec1Title} icon={<Database className="w-4 h-4 text-cyan-400" />} isOpen={openSections[1] ?? false} onToggle={() => toggleSection(1)}>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed space-y-1.5">
            <div className="font-bold text-cyan-300">Verified Spend Base (Module 1 Diagnostics)</div>
            <p>Total Customer Evaluated Spend: ₹5,920.35 Cr • Addressable Procurement Base: ₹4,931.00 Cr (83.3%) across 31,671 transactions, 4,120 POs, and 912 tail suppliers. Non-addressable spend (taxes, statutory, inter-company) excluded.</p>
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec2Title} icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} isOpen={openSections[2] ?? false} onToggle={() => toggleSection(2)}>
          {opps.filter((o) => o.analysis === 'Vendor Consolidation').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec3Title} icon={<Layers className="w-4 h-4 text-indigo-400" />} isOpen={openSections[3] ?? false} onToggle={() => toggleSection(3)}>
          {opps.filter((o) => o.valueClassification === 'PROCESS_PRODUCTIVITY').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec4Title} icon={<Building2 className="w-4 h-4 text-teal-400" />} isOpen={openSections[4] ?? false} onToggle={() => toggleSection(4)}>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-teal-300">Category Consolidation &amp; Rationalization: </span>
            16 spend categories evaluated. Fragmented MRO, Packaging, and Logistics categories consolidated across standardized specifications.
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec5Title} icon={<BarChart3 className="w-4 h-4 text-sky-400" />} isOpen={openSections[5] ?? false} onToggle={() => toggleSection(5)}>
          {opps.filter((o) => o.analysis.includes('Strategic Sourcing')).map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec6Title} icon={<ShieldCheck className="w-4 h-4 text-amber-400" />} isOpen={openSections[6] ?? false} onToggle={() => toggleSection(6)}>
          {opps.filter((o) => o.valueClassification === 'COST_AVOIDANCE').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec7Title} icon={<BarChart3 className="w-4 h-4 text-cyan-400" />} isOpen={openSections[7] ?? false} onToggle={() => toggleSection(7)}>
          {opps.filter((o) => o.module === 'Module 3').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec8Title} icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} isOpen={openSections[8] ?? false} onToggle={() => toggleSection(8)}>
          <ExecutiveBriefMasterRegisterTable opportunities={opps} onSelectOpportunity={onSelectOpportunity} />
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec9Title} icon={<Filter className="w-4 h-4 text-rose-400" />} isOpen={openSections[9] ?? false} onToggle={() => toggleSection(9)}>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 text-xs text-slate-300">
            <div className="font-bold text-rose-300">Zero-Overlap Double Counting Protection Bridge</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center pt-1 font-mono">
              <div className="p-2 bg-slate-900 rounded border border-slate-800"><div className="text-[10px] text-slate-400">Gross Identified</div><div className="text-white font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.grossIdentifiedCr}</div></div>
              <div className="p-2 bg-slate-900 rounded border border-amber-900/40"><div className="text-[10px] text-amber-400">Overlap Deduction</div><div className="text-amber-400 font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.overlapAdjustmentCr}</div></div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800"><div className="text-[10px] text-slate-400">Exclusions</div><div className="text-slate-400 font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.exclusionsCr}</div></div>
              <div className="p-2 bg-slate-900 rounded border border-emerald-800/40"><div className="text-[10px] text-emerald-400">Net Defensible Total</div><div className="text-emerald-300 font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.netDefensibleCr}</div></div>
            </div>
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec10Title} icon={<CheckCircle2 className="w-4 h-4 text-cyan-400" />} isOpen={openSections[10] ?? false} onToggle={() => toggleSection(10)}>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 text-xs text-slate-300">
            <div>
              <div className="font-bold text-cyan-300 mb-1">Assumption Register (Section 19 Transparency)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                {EXECUTIVE_BRIEF_ASSUMPTION_REGISTER.map((asm) => (
                  <div key={asm.assumptionId} className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="font-mono text-cyan-400 font-bold">{asm.assumptionId} ({asm.opportunityId}): </span>
                    <span className="text-white font-medium">{asm.assumption}</span>
                    <div className="text-slate-400 text-[10px] mt-0.5">{asm.basis} • Impact: {asm.impact}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <div className="font-bold text-emerald-300 mb-1">Customer Validation Checklist (Section 20 Implementation Gates)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                {EXECUTIVE_BRIEF_VALIDATION_CHECKLIST.map((val) => (
                  <div key={val.itemId} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-400">{val.itemId}: </span>
                      <span className="text-white">{val.item}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${val.status === 'VALIDATED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                      {val.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec11Title} icon={<Calendar className="w-4 h-4 text-indigo-400" />} isOpen={openSections[11] ?? false} onToggle={() => toggleSection(11)}>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed space-y-1">
            <span className="font-bold text-indigo-300">Procurement Value Realization Roadmap: </span>
            <p>Phase 1 (Day 1–30): Index resets &amp; RFP issuance • Phase 2 (Day 31–90): Volume negotiation &amp; dual-source audits • Phase 3 (Day 91–180): Blanket POs &amp; ERP rate enforcement.</p>
          </div>
        </ExecutiveBriefExpanderCard>
      </div>
    </section>
  );
};
