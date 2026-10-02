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
          <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
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
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {opportunities.map((o) => (
            <tr
              key={o.opportunityId}
              className="hover:bg-slate-800/40 cursor-pointer"
              onClick={() => onSelectOpportunity?.(o.opportunityId)}
            >
              <td className="py-2.5 px-2 font-mono font-bold text-cyan-400">{o.opportunityId}</td>
              <td className="py-2.5 px-2 text-slate-300">{o.module}</td>
              <td className="py-2.5 px-2 font-semibold text-white">{o.analysis}</td>
              <td className="py-2.5 px-2 text-[11px]">
                <div className="font-semibold text-slate-200">{o.category}</div>
                <div className="text-[10px] text-slate-400">{o.item}</div>
              </td>
              <td className="py-2.5 px-2 text-slate-300 text-[11px]">{o.supplier}</td>
              <td className="py-2.5 px-2 font-mono text-slate-400">{o.eligibleSpend}</td>
              <td className="py-2.5 px-2 text-[11px] text-slate-300">{o.valueTypeLabel}</td>
              <td className="py-2.5 px-2 text-[10px] font-mono font-semibold">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                  {o.valueClassification}
                </span>
              </td>
              <td className="py-2.5 px-2 text-[10px] font-mono text-slate-400">
                {o.lowPercent} / {o.basePercent} / {o.highPercent}
              </td>
              <td className="py-2.5 px-2 font-mono font-bold text-right text-emerald-400">
                {o.indicativeOpportunity}
              </td>
              <td className="py-2.5 px-2 text-[10px] text-slate-300">{o.executionMechanism}</td>
              <td className="py-2.5 px-2 text-[10px] font-mono text-amber-300">{o.overlapGroup}</td>
              <td className="py-2.5 px-2">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60" title={o.dataEvidence}>
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
