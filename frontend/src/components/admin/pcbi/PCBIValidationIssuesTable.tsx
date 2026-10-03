'use client';

/**
 * PCBI Validation Issues Diagnostics Table Component
 * Filterable across ALL, ERRORS, WARNINGS, and INFORMATION
 */

import React, { useState } from 'react';
import {
  FileCheck,
  Filter,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Info
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import type { PCBIValidationSeverity } from '../../../types/pcbiAdmin';
import type { PCBIValidationIssuesTableProps } from '../../../types/components';

export const PCBIValidationIssuesTable: React.FC<PCBIValidationIssuesTableProps> = ({
  issues,
  blockingErrorCount,
  warningCount,
  informationCount
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | PCBIValidationSeverity>('ALL');

  const filteredIssues = issues.filter((issue) => {
    if (filterSeverity === 'ALL') return true;
    return issue.severity === filterSeverity;
  });

  return (
    <div className="p-5 bg-white border border-[#DCE7F5] rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
            <FileCheck size={16} className="text-[#0284C7]" />
            {UI_STRINGS.pcbiAdmin.validationTitle}
          </h4>
          <p className="text-xs text-[#475569]">
            {UI_STRINGS.pcbiAdmin.validationSubtitle}
          </p>
        </div>

        {/* Filter Pills: ALL, ERRORS, WARNINGS, INFORMATION */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter size={13} className="text-[#475569]" />
          <button
            type="button"
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'ALL'
                ? 'bg-[#0284C7] text-white shadow-sm'
                : 'bg-[#EEF7FF] text-[#475569] hover:text-[#0B1B33] border border-[#DCE7F5]'
            }`}
          >
            {UI_STRINGS.pcbiAdmin.filterAll} ({issues.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity('BLOCKING_ERROR')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterSeverity === 'BLOCKING_ERROR'
                ? 'bg-rose-600 text-white border border-rose-600'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <ShieldAlert size={12} />
            <span>{UI_STRINGS.pcbiAdmin.filterErrors} ({blockingErrorCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity('WARNING')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterSeverity === 'WARNING'
                ? 'bg-amber-500 text-white border border-amber-500'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle size={12} />
            <span>{UI_STRINGS.pcbiAdmin.filterWarnings} ({warningCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity('INFORMATION')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterSeverity === 'INFORMATION'
                ? 'bg-sky-600 text-white border border-sky-600'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            <Info size={12} />
            <span>{UI_STRINGS.pcbiAdmin.filterInfo} ({informationCount})</span>
          </button>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
          <CheckCircle2 size={28} className="mx-auto text-emerald-600" />
          <p className="text-xs font-bold text-emerald-700">
            Zero issues detected for the selected filter!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE7F5] text-[#475569] sticky top-0 bg-[#F8FBFE]">
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colSeverity}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colDataset}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colRow}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colColumn}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colOriginalValue}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colRule}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colResolution}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7F5] text-[#0B1B33]">
              {filteredIssues.slice(0, 150).map((issue) => {
                let badgeClass = 'bg-sky-100 text-sky-700 border border-sky-200';
                let badgeText: string = UI_STRINGS.pcbiAdmin.information;
                if (issue.severity === 'BLOCKING_ERROR') {
                  badgeClass = 'bg-rose-100 text-rose-700 border border-rose-200';
                  badgeText = UI_STRINGS.pcbiAdmin.blockingErrors;
                } else if (issue.severity === 'WARNING') {
                  badgeClass = 'bg-amber-100 text-amber-700 border border-amber-200';
                  badgeText = UI_STRINGS.pcbiAdmin.warnings;
                }

                return (
                  <tr key={issue.id} className="hover:bg-[#EEF7FF]">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#0284C7] font-semibold whitespace-nowrap">
                      {issue.sheetName}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#475569] tabular-nums">
                      {issue.rowNumber > 0 ? `L${issue.rowNumber}` : '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#0B1B33] whitespace-nowrap">
                      {issue.column}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#64748B] truncate max-w-[140px]">
                      {issue.rawValue || '(blank / null)'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#0284C7] whitespace-nowrap">
                      {issue.rule}
                    </td>
                    <td className="py-2 px-3">
                      <p className="font-medium text-[#0B1B33]">{issue.message}</p>
                      <p className="text-[11px] text-[#475569] mt-0.5">{issue.resolution}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
