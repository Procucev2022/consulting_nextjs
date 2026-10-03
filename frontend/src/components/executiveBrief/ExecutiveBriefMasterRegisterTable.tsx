'use client';

import React from 'react';
import type { ExecutiveBriefMasterOpportunityItem } from '../../types';

interface ExecutiveBriefMasterRegisterTableProps {
  readonly opportunities: readonly ExecutiveBriefMasterOpportunityItem[];
  readonly onSelectOpportunity?: (opportunityId: string) => void;
}

export const ExecutiveBriefMasterRegisterTable: React.FC<ExecutiveBriefMasterRegisterTableProps> = ({
  opportunities,
  onSelectOpportunity
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#DCE7F5] text-[#0B1B33] uppercase text-[10px] tracking-wider bg-[#F8FBFE]">
            <th className="py-2.5 px-2 font-semibold">ID</th>
            <th className="py-2.5 px-2 font-semibold">Module</th>
            <th className="py-2.5 px-2 font-semibold">Analysis</th>
            <th className="py-2.5 px-2 font-semibold">Category & Item</th>
            <th className="py-2.5 px-2 font-semibold">Supplier</th>
            <th className="py-2.5 px-2 font-semibold">Eligible Spend</th>
            <th className="py-2.5 px-2 font-semibold">Value Type</th>
            <th className="py-2.5 px-2 font-semibold">Classification</th>
            <th className="py-2.5 px-2 font-semibold">Range (L/B/H)</th>
            <th className="py-2.5 px-2 font-semibold text-right">Expected Opportunity</th>
            <th className="py-2.5 px-2 font-semibold">Mechanism</th>
            <th className="py-2.5 px-2 font-semibold">Overlap Group</th>
            <th className="py-2.5 px-2 font-semibold">Traceability Proof</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCE7F5] text-[#0B1B33]">
          {opportunities.map((o) => (
            <tr
              key={o.opportunityId}
              className="hover:bg-[#EEF7FF] cursor-pointer transition-colors bg-white"
              onClick={() => onSelectOpportunity?.(o.opportunityId)}
            >
              <td className="py-2.5 px-2 font-mono font-bold text-[#0284C7]">{o.opportunityId}</td>
              <td className="py-2.5 px-2 text-[#475569]">{o.module}</td>
              <td className="py-2.5 px-2 font-semibold text-[#0B1B33]">{o.analysis}</td>
              <td className="py-2.5 px-2 text-[11px]">
                <div className="font-semibold text-[#0B1B33]">{o.category}</div>
                <div className="text-[10px] text-[#64748B]">{o.item}</div>
              </td>
              <td className="py-2.5 px-2 text-[#475569] text-[11px]">{o.supplier}</td>
              <td className="py-2.5 px-2 tabular-nums text-[#64748B]">{o.eligibleSpend}</td>
              <td className="py-2.5 px-2 text-[11px] text-[#475569]">{o.valueTypeLabel}</td>
              <td className="py-2.5 px-2 text-[10px] font-semibold">
                <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-[#0284C7]">
                  {o.valueClassification}
                </span>
              </td>
              <td className="py-2.5 px-2 text-[10px] tabular-nums text-[#64748B]">
                {o.lowPercent} / {o.basePercent} / {o.highPercent}
              </td>
              <td className="py-2.5 px-2 tabular-nums font-bold text-right text-emerald-600">
                {o.indicativeOpportunity}
              </td>
              <td className="py-2.5 px-2 text-[10px] text-[#475569]">{o.executionMechanism}</td>
              <td className="py-2.5 px-2 text-[10px] font-mono text-amber-700">{o.overlapGroup}</td>
              <td className="py-2.5 px-2">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-50 text-[#0284C7] border border-sky-200" title={o.dataEvidence}>
                  {o.transactionSampleId}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
