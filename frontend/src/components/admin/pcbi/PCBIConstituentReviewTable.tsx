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
    <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-[#0B1B33] uppercase tracking-wider flex items-center gap-2">
            <Layers size={14} className="text-[#0284C7]" />
            {UI_STRINGS.pcbiAdmin.constituentReviewTitle}
          </h4>
          <p className="text-[11px] text-[#475569] mt-0.5">
            {UI_STRINGS.pcbiAdmin.constituentReviewSubtitle}
          </p>
        </div>
        <span className="text-[11px] font-medium tabular-nums text-[#475569]">
          {constituentTotals.length} PCBI Series Evaluated
        </span>
      </div>

      <div className="overflow-x-auto max-h-60 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#DCE7F5] text-[#475569] sticky top-0 bg-[#F8FBFE]">
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colConstituentPcbiId}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colConstituentName}</th>
              <th className="py-2 px-3 font-semibold text-right">{UI_STRINGS.pcbiAdmin.colConstituentTotal}</th>
              <th className="py-2 px-3 font-semibold text-right">{UI_STRINGS.pcbiAdmin.colConstituentDiff}</th>
              <th className="py-2 px-3 font-semibold text-center">{UI_STRINGS.pcbiAdmin.colConstituentStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7F5] text-[#0B1B33]">
            {constituentTotals.map((item) => {
              const isPass = item.status === 'PASS';
              return (
                <tr key={item.pcbiId} className="hover:bg-[#EEF7FF] transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-[#0B1B33]">{item.pcbiId}</td>
                  <td className="py-2 px-3 text-[#475569]">{item.benchmarkName || '—'}</td>
                  <td className="py-2 px-3 tabular-nums text-right font-bold text-[#0B1B33]">
                    {item.totalWeight}%
                  </td>
                  <td
                    className={`py-2 px-3 tabular-nums text-right ${
                      isPass
                        ? 'text-emerald-600 font-semibold'
                        : 'text-amber-600 font-bold'
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
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isPass ? (
                        <>
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          {UI_STRINGS.pcbiAdmin.badgePass}
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={11} className="text-amber-600" />
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
