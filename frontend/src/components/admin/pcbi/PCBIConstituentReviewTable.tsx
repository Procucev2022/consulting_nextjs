'use client';

/**
 * PCBI Constituent Weight Integrity Review Component
 * Displays SUM(constituent_weight) per PCBI ID with PASS / WARNING status.
 * Zero automatic weight normalization.
 */

import React from 'react';
import { Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import type { PCBIConstituentReviewTableProps } from '../../../types/components';

export const PCBIConstituentReviewTable: React.FC<PCBIConstituentReviewTableProps> = ({
  constituentTotals
}) => {
  if (!constituentTotals || constituentTotals.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers size={14} className="text-purple-400" />
            {UI_STRINGS.pcbiAdmin.constituentReviewTitle}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {UI_STRINGS.pcbiAdmin.constituentReviewSubtitle}
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {constituentTotals.length} PCBI Series Evaluated
        </span>
      </div>

      <div className="overflow-x-auto max-h-60 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 sticky top-0 bg-slate-900">
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colConstituentPcbiId}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colConstituentName}</th>
              <th className="py-2 px-3 font-semibold text-right">{UI_STRINGS.pcbiAdmin.colConstituentTotal}</th>
              <th className="py-2 px-3 font-semibold text-right">{UI_STRINGS.pcbiAdmin.colConstituentDiff}</th>
              <th className="py-2 px-3 font-semibold text-center">{UI_STRINGS.pcbiAdmin.colConstituentStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {constituentTotals.map((item) => {
              const isPass = item.status === 'PASS';
              return (
                <tr key={item.pcbiId} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono font-bold text-white">{item.pcbiId}</td>
                  <td className="py-2 px-3 text-slate-300">{item.benchmarkName || '—'}</td>
                  <td className="py-2 px-3 font-mono text-right font-bold text-slate-100">
                    {item.totalWeight}%
                  </td>
                  <td
                    className={`py-2 px-3 font-mono text-right ${
                      isPass
                        ? 'text-emerald-400'
                        : item.differenceFrom100 > 0
                        ? 'text-amber-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }`}
                  >
                    {item.differenceFrom100 === 0
                      ? '0%'
                      : item.differenceFrom100 > 0
                      ? `+${item.differenceFrom100}%`
                      : `${item.differenceFrom100}%`}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isPass
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {isPass ? (
                        <>
                          <CheckCircle2 size={11} className="text-emerald-400" />
                          {UI_STRINGS.pcbiAdmin.badgePass}
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={11} className="text-amber-400" />
                          {UI_STRINGS.pcbiAdmin.badgeRequiresReview}
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
