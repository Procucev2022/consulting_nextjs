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

  const renderBadge = (txt: string): React.ReactElement => (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-[#0284C7] border border-sky-200">
      {txt}
    </span>
  );

  const renderFinding19 = (item: ExecutiveBriefMasterOpportunityItem): React.ReactElement => (
    <div
      key={item.opportunityId}
      className="p-3.5 rounded-xl bg-white border border-[#DCE7F5] space-y-2.5 hover:border-[#0284C7] transition-colors"
      onClick={() => onSelectOpportunity?.(item.opportunityId)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE7F5] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#0284C7]">{item.opportunityId}</span>
          <span className="text-xs font-semibold text-[#0B1B33]">{item.analysis}</span>
          <span className="text-[10px] text-[#64748B]">({item.category} • {item.item})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F8FBFE] border border-[#DCE7F5] text-[#475569]">
            {item.valueClassification}
          </span>
          {renderBadge(item.classificationLabel)}
          <span className="text-xs tabular-nums font-bold text-emerald-700">{item.indicativeOpportunity}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] leading-snug">
        <div><span className="font-bold text-[#64748B] uppercase text-[10px]">Background: </span><span className="text-[#475569]">{item.background}</span></div>
        <div><span className="font-bold text-[#64748B] uppercase text-[10px]">Objective: </span><span className="text-[#475569]">{item.objective}</span></div>
        <div><span className="font-bold text-[#64748B] uppercase text-[10px]">Evidence: </span><span className="text-[#475569]">{item.dataEvidence} <span className="font-mono text-[#0284C7]">[{item.transactionSampleId}]</span></span></div>
        <div><span className="font-bold text-[#64748B] uppercase text-[10px]">Current State: </span><span className="text-[#475569]">{item.currentState ?? item.whatWeFound}</span></div>
        <div><span className="font-bold text-[#64748B] uppercase text-[10px]">Finding: </span><span className="text-[#475569]">{item.finding}</span></div>
        <div><span className="font-bold text-emerald-700 uppercase text-[10px]">Range (L/B/H): </span><span className="text-emerald-700 tabular-nums font-semibold">{item.lowValue} / {item.baseValue} / {item.highValue}</span></div>
        <div><span className="font-bold text-[#64748B] uppercase text-[10px]">Calculation: </span><span className="text-[#0B1B33] tabular-nums font-medium">{item.calculation}</span></div>
        <div><span className="font-bold text-indigo-700 uppercase text-[10px]">Approach: </span><span className="text-indigo-700">{item.executionApproach}</span></div>
        <div><span className="font-bold text-[#0284C7] uppercase text-[10px]">Next Step: </span><span className="text-[#475569]">{item.nextStep}</span></div>
        <div className="md:col-span-2 lg:col-span-3"><span className="font-bold text-amber-700 uppercase text-[10px]">Validation Required: </span><span className="text-amber-800">{item.validationRequired}</span></div>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="total-value-portfolio-heading" className="space-y-4">
      {/* Headline Header */}
      <div className="bg-white border border-[#DCE7F5] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE7F5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 id="total-value-portfolio-heading" className="text-sm font-black uppercase tracking-wider text-[#0B1B33]">
                {p.headlineTitle}
              </h2>
              <p className="text-xs text-[#475569] font-medium">{p.headlineSubtitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284C7] text-xs font-mono font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CFO-Grade Multi-Lever Taxonomy
          </span>
        </div>

        {/* 6 Headline CFO Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wide">Addressable Spend</span>
            <div className="text-base font-black text-[#0B1B33] mt-1">{p.totalAddressableSpend}</div>
            <div className="mt-1">{renderBadge('FACTUAL BASELINE')}</div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Net Opportunity</span>
            <div className="text-base font-black text-emerald-800 mt-1">{p.netIndicativeOpportunity}</div>
            <div className="mt-1">{renderBadge('ESTIMATED')}</div>
          </div>
          <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">Process Effort</span>
            <div className="text-base font-black text-indigo-700 mt-1">20% Reduction</div>
            <div className="mt-1">{renderBadge('ANALYTICAL')}</div>
          </div>
          <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#0284C7] uppercase tracking-wide">Risk Avoidance</span>
            <div className="text-base font-black text-[#0284C7] mt-1">4 Sole-Sources</div>
            <div className="mt-1">{renderBadge('ANALYTICAL')}</div>
          </div>
          <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide">Validated Run-Rate</span>
            <div className="text-base font-black text-purple-700 mt-1">₹68.00 Cr Cash</div>
            <div className="mt-1">{renderBadge('VALIDATED')}</div>
          </div>
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Deductions</span>
            <div className="text-base font-black text-amber-700 mt-1">{p.overlapDeductionCr}</div>
            <div className="mt-1">{renderBadge('OVERLAP ZERO')}</div>
          </div>
        </div>

        {/* Visible Value Classification Legend (Prompt 276 Section 10) */}
        <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#DCE7F5] space-y-2">
          <div className="text-[11px] font-bold text-[#0B1B33] uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
            CFO Value Classification Legend &amp; Governance Standard
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px]">
            {EXECUTIVE_BRIEF_VALUE_CLASSIFICATIONS.map((c) => (
              <div key={c.code} className="p-1.5 rounded bg-white border border-[#DCE7F5]">
                <span className="font-mono font-bold text-[#0284C7] block">{c.code}</span>
                <span className="text-[#64748B] leading-tight block mt-0.5">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* E-Auction Sourcing Role Clarification */}
        <div className="p-2.5 rounded-lg bg-[#F8FBFE] border border-[#DCE7F5] text-[11px] text-[#475569] flex items-center justify-between">
          <span>{p.eauctionShareNote}</span>
          <span className="font-mono text-[#0284C7] font-semibold">Opportunity-Led • Multi-Lever</span>
        </div>
      </div>

      {/* 11 Expandable Sections per Section 16 */}
      <div className="space-y-2">
        <ExecutiveBriefExpanderCard title={p.expanders.sec1Title} icon={<Database className="w-4 h-4 text-[#0284C7]" />} isOpen={openSections[1] ?? false} onToggle={() => toggleSection(1)}>
          <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg text-xs text-[#475569] leading-relaxed space-y-1.5">
            <div className="font-bold text-[#0284C7]">Verified Spend Base (Module 1 Diagnostics)</div>
            <p>Total Customer Evaluated Spend: ₹5,920.35 Cr • Addressable Procurement Base: ₹4,931.00 Cr (83.3%) across 31,671 transactions, 4,120 POs, and 912 tail suppliers. Non-addressable spend (taxes, statutory, inter-company) excluded.</p>
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec2Title} icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} isOpen={openSections[2] ?? false} onToggle={() => toggleSection(2)}>
          {opps.filter((o) => o.analysis === 'Vendor Consolidation').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec3Title} icon={<Layers className="w-4 h-4 text-indigo-600" />} isOpen={openSections[3] ?? false} onToggle={() => toggleSection(3)}>
          {opps.filter((o) => o.valueClassification === 'PROCESS_PRODUCTIVITY').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec4Title} icon={<Building2 className="w-4 h-4 text-teal-600" />} isOpen={openSections[4] ?? false} onToggle={() => toggleSection(4)}>
          <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg text-xs text-[#475569] leading-relaxed">
            <span className="font-bold text-teal-700">Category Consolidation &amp; Rationalization: </span>
            16 spend categories evaluated. Fragmented MRO, Packaging, and Logistics categories consolidated across standardized specifications.
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec5Title} icon={<BarChart3 className="w-4 h-4 text-[#0284C7]" />} isOpen={openSections[5] ?? false} onToggle={() => toggleSection(5)}>
          {opps.filter((o) => o.analysis.includes('Strategic Sourcing')).map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec6Title} icon={<ShieldCheck className="w-4 h-4 text-amber-600" />} isOpen={openSections[6] ?? false} onToggle={() => toggleSection(6)}>
          {opps.filter((o) => o.valueClassification === 'COST_AVOIDANCE').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec7Title} icon={<BarChart3 className="w-4 h-4 text-[#0284C7]" />} isOpen={openSections[7] ?? false} onToggle={() => toggleSection(7)}>
          {opps.filter((o) => o.module === 'Module 3').map(renderFinding19)}
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec8Title} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} isOpen={openSections[8] ?? false} onToggle={() => toggleSection(8)}>
          <ExecutiveBriefMasterRegisterTable opportunities={opps} onSelectOpportunity={onSelectOpportunity} />
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec9Title} icon={<Filter className="w-4 h-4 text-rose-600" />} isOpen={openSections[9] ?? false} onToggle={() => toggleSection(9)}>
          <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg space-y-2 text-xs text-[#475569]">
            <div className="font-bold text-rose-700">Zero-Overlap Double Counting Protection Bridge</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center pt-1 tabular-nums">
              <div className="p-2 bg-white rounded border border-[#DCE7F5]"><div className="text-[10px] text-[#64748B]">Gross Identified</div><div className="text-[#0B1B33] font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.grossIdentifiedCr}</div></div>
              <div className="p-2 bg-amber-50/50 rounded border border-amber-200"><div className="text-[10px] text-amber-800">Overlap Deduction</div><div className="text-amber-700 font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.overlapAdjustmentCr}</div></div>
              <div className="p-2 bg-white rounded border border-[#DCE7F5]"><div className="text-[10px] text-[#64748B]">Exclusions</div><div className="text-[#64748B] font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.exclusionsCr}</div></div>
              <div className="p-2 bg-emerald-50/50 rounded border border-emerald-200"><div className="text-[10px] text-emerald-800">Net Defensible Total</div><div className="text-emerald-700 font-bold">{EXECUTIVE_BRIEF_WATERFALL_BREAKDOWN.netDefensibleCr}</div></div>
            </div>
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec10Title} icon={<CheckCircle2 className="w-4 h-4 text-[#0284C7]" />} isOpen={openSections[10] ?? false} onToggle={() => toggleSection(10)}>
          <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg space-y-3 text-xs text-[#475569]">
            <div>
              <div className="font-bold text-[#0284C7] mb-1">Assumption Register (Section 19 Transparency)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                {EXECUTIVE_BRIEF_ASSUMPTION_REGISTER.map((asm) => (
                  <div key={asm.assumptionId} className="p-2 rounded bg-white border border-[#DCE7F5]">
                    <span className="font-mono text-[#0284C7] font-bold">{asm.assumptionId} ({asm.opportunityId}): </span>
                    <span className="text-[#0B1B33] font-medium">{asm.assumption}</span>
                    <div className="text-[#64748B] text-[10px] mt-0.5">{asm.basis} • Impact: {asm.impact}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-[#DCE7F5]">
              <div className="font-bold text-emerald-700 mb-1">Customer Validation Checklist (Section 20 Implementation Gates)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                {EXECUTIVE_BRIEF_VALIDATION_CHECKLIST.map((val) => (
                  <div key={val.itemId} className="p-2 rounded bg-white border border-[#DCE7F5] flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[#64748B]">{val.itemId}: </span>
                      <span className="text-[#0B1B33]">{val.item}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${val.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                      {val.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ExecutiveBriefExpanderCard>

        <ExecutiveBriefExpanderCard title={p.expanders.sec11Title} icon={<Calendar className="w-4 h-4 text-indigo-600" />} isOpen={openSections[11] ?? false} onToggle={() => toggleSection(11)}>
          <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-lg text-xs text-[#475569] leading-relaxed space-y-1">
            <span className="font-bold text-indigo-700">Procurement Value Realization Roadmap: </span>
            <p>Phase 1 (Day 1–30): Index resets &amp; RFP issuance • Phase 2 (Day 31–90): Volume negotiation &amp; dual-source audits • Phase 3 (Day 91–180): Blanket POs &amp; ERP rate enforcement.</p>
          </div>
        </ExecutiveBriefExpanderCard>
      </div>
    </section>
  );
};
