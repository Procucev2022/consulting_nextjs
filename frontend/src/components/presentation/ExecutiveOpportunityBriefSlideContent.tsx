'use client';

import React from 'react';
import { EXECUTIVE_BRIEF_PRESENTATION_CONTRACT } from '@/constants/executiveBriefPresentationConstants';
import { UI_STRINGS } from '@/constants/uiStrings';

export const ExecutiveOpportunityBriefSlideContent: React.FC<{ currentSlide: number }> = ({
  currentSlide
}): React.ReactElement => {
  const contract = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT;
  const strings = UI_STRINGS.opportunityBrief;

  switch (currentSlide) {
    case 1:
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="p-6 bg-emerald-50/50 border border-emerald-300 rounded-xl">
              <span className="text-xs font-semibold text-emerald-800 uppercase">{strings.primaryValueThesis}</span>
              <div className="text-4xl font-extrabold text-emerald-800 mt-2">
                Rs. {contract.netDirectSavingsCr.toFixed(2)} Cr
              </div>
              <div className="text-lg font-bold text-[#0B1B33] mt-1">{strings.directSavingsOpportunity}</div>
              <p className="text-xs text-[#475569] mt-3 leading-relaxed">
                Defensible P&L cost reduction across rate harmonization, volume pooling, and strategic tenders.
              </p>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <div className="text-xs text-[#64748B] font-bold">{strings.netDefensiblePipeline}</div>
                <div className="text-lg font-bold text-[#0284C7]">Rs. {contract.netDefensiblePipelineCr.toFixed(2)} Cr</div>
              </div>
              <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <div className="text-xs text-[#64748B] font-bold">{strings.strategicMarketValue}</div>
                <div className="text-lg font-bold text-[#0284C7]">Rs. {contract.strategicMarketValueCr.toFixed(2)} Cr</div>
              </div>
              <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">
                <div className="text-xs text-[#64748B] font-bold">{strings.spendEvaluated}</div>
                <div className="text-lg font-bold text-[#0B1B33]">
                  Rs. {contract.totalCustomerSpendCr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Cr
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { l: 'Concentration', v: '81.4%', s: 'Top 10% vendors' },
              { l: 'Price Spread', v: '18.5%', s: 'Inter-plant variance' },
              { l: 'Spot Purchases', v: '42.6%', s: 'Non-contracted' },
              { l: 'Tail Vendors', v: '912', s: '4.8% spend drag' },
              { l: 'Pipeline', v: `Rs. ${contract.netDefensiblePipelineCr.toFixed(2)} Cr`, s: 'Net value' }
            ].map((c) => (
              <div key={c.l} className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-center">
                <div className="text-xs text-[#64748B]">{c.l}</div>
                <div className="text-xl font-bold text-[#0B1B33] my-1">{c.v}</div>
                <div className="text-[10px] text-[#64748B]">{c.s}</div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-[#0B1B33]">
            Value is concentrated in price harmonization, supplier consolidation, strategic sourcing and benchmark-led market alignment.
          </div>
        </div>
      );
    case 3:
      return (
        <div className="space-y-3 text-xs">
          <div className="flex justify-between font-bold text-[#0B1B33] pb-1 border-b border-[#DCE7F5]">
            <span className="uppercase">{strings.whereConcentrated}</span>
            <span className="text-[#0284C7] font-bold">
              Rs. {contract.grossOpportunityCr.toFixed(2)} Cr {strings.grossIdentifiedOpp.toUpperCase()}
            </span>
          </div>
          <p className="text-[#475569] leading-relaxed">{strings.grossCalloutSubtitle}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
            {[
              { n: 'Direct Price', v: '42.80' },
              { n: 'E-Auction', v: '31.50' },
              { n: 'Consolidation', v: '26.40' },
              { n: 'Aggregation', v: '22.10' },
              { n: 'Payment Terms', v: '14.20' }
            ].map((lev) => (
              <div key={lev.n} className="p-2 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-center">
                <div className="text-[#64748B] text-[11px]">{lev.n}</div>
                <div className="text-sm font-bold text-[#0284C7]">Rs. {lev.v} Cr</div>
              </div>
            ))}
          </div>
        </div>
      );
    case 4:
      return (
        <div className="space-y-3 text-xs">
          <div className="font-bold text-sm text-[#0B1B33] uppercase tracking-wide">{strings.valueBridgeTitle}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-300 rounded-xl">
              <div className="text-emerald-800 font-bold text-sm">DIRECT SAVINGS OPPORTUNITY (P&L EBITDA EXPANSION)</div>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">Rs. {contract.netDirectSavingsCr.toFixed(2)} Cr</div>
              <div className="text-[#475569] mt-2">6 Defensible Core Levers (Wave 1 Validated)</div>
            </div>
            <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl">
              <div className="text-[#0284C7] font-bold text-sm">{strings.strategicMarketValue}</div>
              <div className="text-2xl font-extrabold text-[#0B1B33] mt-1">Rs. {contract.strategicMarketValueCr.toFixed(2)} Cr</div>
              <div className="text-[#475569] mt-2">4 Market Intelligence & Timing Levers</div>
            </div>
          </div>
        </div>
      );
    case 5:
      return (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl font-semibold text-[#0B1B33]">80% Defensibility Floor</div>
            <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl font-semibold text-[#0B1B33]">1.37x Overlap Deduplication</div>
            <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl font-semibold text-[#0B1B33]">Conservative Realization Discount</div>
            <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl font-semibold text-[#0B1B33]">Multi-Source Verification</div>
          </div>
        </div>
      );
    case 6:
      return (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5]">
              <div className="font-bold text-emerald-700">Module 1 — AI Diagnostics</div>
              <div className="text-[#475569] mt-1">Diagnostic spend extraction & baseline classification</div>
            </div>
            <div className="p-3 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5]">
              <div className="font-bold text-[#0284C7]">Module 2 — Strategic Sourcing</div>
              <div className="text-[#475569] mt-1">Rate benchmarking & supplier negotiation strategy</div>
            </div>
            <div className="p-3 bg-[#F8FBFE] rounded-xl border border-[#DCE7F5]">
              <div className="font-bold text-[#0284C7]">Module 4 — Savings Engine</div>
              <div className="text-[#475569] mt-1">Cross-plant PO pooling & volume consolidation</div>
            </div>
          </div>
        </div>
      );
    case 7:
      return (
        <div className="space-y-3 text-xs">
          <div className="text-emerald-800 font-bold text-base">Hero: Rs. {contract.validatedSavingsCr.toFixed(2)} Cr Validated Wave 1</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-[11px]">
            <div className="p-2 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-[#0B1B33] font-medium">Packaging Bags: Rs. 14.50 Cr</div>
            <div className="p-2 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-[#0B1B33] font-medium">Grinding Media: Rs. 11.20 Cr</div>
            <div className="p-2 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-[#0B1B33] font-medium">Imported Fuel: Rs. 9.80 Cr</div>
            <div className="p-2 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-[#0B1B33] font-medium">Lubricants: Rs. 6.40 Cr</div>
            <div className="p-2 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl text-[#0B1B33] font-medium">Refractory: Rs. 6.00 Cr</div>
          </div>
        </div>
      );
    case 8:
      return (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl font-semibold text-[#0B1B33]">Days 1–30: Mobilize & Quick Wins</div>
            <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl font-semibold text-[#0B1B33]">Days 31–60: Market Tenders & Negotiation</div>
            <div className="p-3 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl font-semibold text-[#0B1B33]">Days 61–90: Award & Savings Realization</div>
          </div>
        </div>
      );
    case 9:
      return (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center font-semibold text-[#0B1B33]">
            <div className="p-2.5 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">Procurement Expertise</div>
            <div className="p-2.5 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">Forensic Spend Intelligence</div>
            <div className="p-2.5 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">Market Benchmark Intelligence</div>
            <div className="p-2.5 bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl">Execution & Savings Realization</div>
          </div>
          <div className="text-[#64748B] text-center pt-2">From transaction data to procurement decision to measurable execution.</div>
        </div>
      );
    case 10:
      return (
        <div className="space-y-3 text-xs">
          <div className="font-bold text-sm text-[#0B1B33] uppercase tracking-wide">{strings.proposedNextSteps}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#F8FBFE] rounded-xl border border-emerald-300">
              <div className="text-emerald-800 font-bold">{strings.alignStep}</div>
              <div className="text-[#475569] mt-1">{strings.alignSub}</div>
            </div>
            <div className="p-3 bg-[#F8FBFE] rounded-xl border border-sky-300">
              <div className="text-[#0284C7] font-bold">{strings.mobilizeStep}</div>
              <div className="text-[#475569] mt-1">{strings.mobilizeSub}</div>
            </div>
            <div className="p-3 bg-[#F8FBFE] rounded-xl border border-sky-300">
              <div className="text-[#0284C7] font-bold">{strings.executeStep}</div>
              <div className="text-[#475569] mt-1">{strings.executeSub}</div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex justify-between items-center">
            <div>
              <div className="text-sm font-bold text-[#0B1B33]">{strings.moveFromDiag}</div>
              <div className="text-xs text-emerald-800">
                Rs. {contract.netDirectSavingsCr.toFixed(2)} Cr {strings.directSavingsOpportunity} | Rs. {contract.netDefensiblePipelineCr.toFixed(2)} Cr {strings.netDefensiblePipeline}
              </div>
            </div>
            <div className="text-[#0284C7] text-xs font-semibold">{strings.contactEmail}</div>
          </div>
        </div>
      );
    default:
      return <div className="text-[#64748B]">Slide {currentSlide}</div>;
  }
};
