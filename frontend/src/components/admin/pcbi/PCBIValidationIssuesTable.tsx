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
    <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck size={16} className="text-cyan-400" />
            {UI_STRINGS.pcbiAdmin.validationTitle}
          </h4>
          <p className="text-xs text-slate-400">
            {UI_STRINGS.pcbiAdmin.validationSubtitle}
          </p>
        </div>

        {/* Filter Pills: ALL, ERRORS, WARNINGS, INFORMATION */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter size={13} className="text-slate-400" />
          <button
            type="button"
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'ALL'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {UI_STRINGS.pcbiAdmin.filterAll} ({issues.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity('BLOCKING_ERROR')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterSeverity === 'BLOCKING_ERROR'
                ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                : 'bg-slate-800/60 text-slate-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert size={12} className={filterSeverity === 'BLOCKING_ERROR' ? 'text-rose-200' : 'text-rose-400'} />
            <span>{UI_STRINGS.pcbiAdmin.filterErrors} ({blockingErrorCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity('WARNING')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterSeverity === 'WARNING'
                ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                : 'bg-slate-800/60 text-slate-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle size={12} className={filterSeverity === 'WARNING' ? 'text-amber-200' : 'text-amber-400'} />
            <span>{UI_STRINGS.pcbiAdmin.filterWarnings} ({warningCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSeverity('INFORMATION')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterSeverity === 'INFORMATION'
                ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-700'
                : 'bg-slate-800/60 text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Info size={12} className={filterSeverity === 'INFORMATION' ? 'text-cyan-200' : 'text-cyan-400'} />
            <span>{UI_STRINGS.pcbiAdmin.filterInfo} ({informationCount})</span>
          </button>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-2">
          <CheckCircle2 size={28} className="mx-auto text-emerald-400" />
          <p className="text-xs font-bold text-emerald-300">
            Zero issues detected for the selected filter!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 sticky top-0 bg-slate-900">
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colSeverity}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colDataset}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colRow}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colColumn}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colOriginalValue}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colRule}</th>
                <th className="py-2.5 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.colResolution}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredIssues.slice(0, 150).map((issue) => {
                let badgeClass = 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60';
                let badgeText: string = UI_STRINGS.pcbiAdmin.information;
                if (issue.severity === 'BLOCKING_ERROR') {
                  badgeClass = 'bg-rose-950/80 text-rose-300 border border-rose-800/60';
                  badgeText = UI_STRINGS.pcbiAdmin.blockingErrors;
                } else if (issue.severity === 'WARNING') {
                  badgeClass = 'bg-amber-950/80 text-amber-300 border border-amber-800/60';
                  badgeText = UI_STRINGS.pcbiAdmin.warnings;
                }

                return (
                  <tr key={issue.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-cyan-400 font-bold whitespace-nowrap">
                      {issue.sheetName}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-300">
                      {issue.rowNumber > 0 ? `L${issue.rowNumber}` : '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">
                      {issue.column}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 truncate max-w-[140px]">
                      {issue.rawValue || '(blank / null)'}
                    </td>
                    <td className="py-2 px-3 font-mono text-cyan-300/90 whitespace-nowrap">
                      {issue.rule}
                    </td>
                    <td className="py-2 px-3">
                      <p className="font-medium text-slate-200">{issue.message}</p>
                      <p className="text-[11px] text-cyan-300/80 mt-0.5">{issue.resolution}</p>
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
