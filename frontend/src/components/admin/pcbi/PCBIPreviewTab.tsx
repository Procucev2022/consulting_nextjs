'use client';

/**
 * PCBI Preview Sub-Tab — Pre-Import 50-Record Previews & KPI Summary
 */

import React, { useState } from 'react';
import {
  Table,
  CheckCircle2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import type { PCBIPreviewTabProps } from '../../../types/components';

export const PCBIPreviewTab: React.FC<PCBIPreviewTabProps> = ({
  validationSummary,
  datasets,
  onProceedToImport
}) => {
  const [selectedDatasetKey, setSelectedDatasetKey] = useState<string>('PCBI_MASTER');

  const rows = (datasets[selectedDatasetKey] || []).slice(0, 50);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const canImport = (validationSummary?.blockingErrorCount || 0) === 0;

  return (
    <div className="space-y-6">
      {/* PCBI V1.3.1 Preview Safety & Sandbox Isolation Header */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[11px] font-extrabold uppercase tracking-wider">
              {UI_STRINGS.pcbiAdmin.previewSimulationBadge}
            </span>
            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-md text-[11px] font-extrabold uppercase tracking-wider">
              {UI_STRINGS.pcbiAdmin.previewNotProductionBadge}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-[#475569] border border-slate-300 rounded-md text-[11px] font-extrabold uppercase tracking-wider">
              {UI_STRINGS.pcbiAdmin.previewNotApprovedBadge}
            </span>
          </div>
          <p className="text-xs text-[#475569] max-w-3xl leading-relaxed pt-1">
            {UI_STRINGS.pcbiAdmin.previewSandboxNotice}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[#64748B]">Prod Writes: <strong className="text-emerald-600">0</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-[#64748B]">Savings: <strong className="text-emerald-600">0</strong></span>
          <span className="text-slate-300">|</span>
          <span className="text-[#64748B]">Mod 4: <strong className="text-amber-600">DISCONNECTED</strong></span>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
          <span className="text-[#64748B]">PCBI Master</span>
          <p className="text-lg font-bold text-[#0B1B33] mt-1 tabular-nums">
            {(datasets.PCBI_MASTER || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
          <span className="text-[#64748B]">Weekly Index</span>
          <p className="text-lg font-bold text-emerald-600 mt-1 tabular-nums">
            {(datasets.WEEKLY_INDEX || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
          <span className="text-[#64748B]">Constituents</span>
          <p className="text-lg font-bold text-[#0B1B33] mt-1 tabular-nums">
            {(datasets.CONSTITUENTS || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
          <span className="text-[#64748B]">UNSPSC Map</span>
          <p className="text-lg font-bold text-[#F97316] mt-1 tabular-nums">
            {(datasets.UNSPSC_MAPPING || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
          <span className="text-[#64748B]">Quality A / B / C</span>
          <p className="text-lg font-bold text-[#0284C7] mt-1 tabular-nums">
            {validationSummary?.aQualityCount || 0} / {validationSummary?.bQualityCount || 0} /{' '}
            {validationSummary?.cQualityCount || 0}
          </p>
        </div>

        <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
          <span className="text-[#64748B]">Avg Benchmarkable</span>
          <p className="text-lg font-bold text-[#0284C7] mt-1 tabular-nums">
            {validationSummary?.avgBenchmarkability || 70}%
          </p>
        </div>

        <div className="p-3 bg-white border border-[#DCE7F5] rounded-xl text-xs shadow-sm">
          <span className="text-[#64748B]">Date Range</span>
          <p className="text-[11px] font-bold text-[#0B1B33] mt-1 truncate">
            {validationSummary?.dateStart || '2020'} to {validationSummary?.dateEnd || '2026'}
          </p>
        </div>
      </div>

      {/* Dataset Selection Tabs & Table */}
      <div className="p-5 bg-white border border-[#DCE7F5] rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
              <Table size={16} className="text-[#0284C7]" />
              {UI_STRINGS.pcbiAdmin.previewTitle}
            </h4>
            <p className="text-xs text-[#475569]">
              {UI_STRINGS.pcbiAdmin.previewSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'PCBI_MASTER', label: 'Benchmark Master' },
              { key: 'WEEKLY_INDEX', label: 'Weekly Index' },
              { key: 'CONSTITUENTS', label: 'Constituents' },
              { key: 'SOURCES', label: 'Sources' },
              { key: 'UNSPSC_MAPPING', label: 'UNSPSC Mapping' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedDatasetKey(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDatasetKey === tab.key
                    ? 'bg-[#0284C7] text-white shadow-sm'
                    : 'bg-slate-100 text-[#475569] hover:bg-slate-200 hover:text-[#0B1B33]'
                }`}
              >
                {tab.label} ({(datasets[tab.key] || []).length})
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FBFE] rounded-xl">
            No records found for this dataset.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DCE7F5] text-[#475569] sticky top-0 bg-[#F8FBFE]">
                  <th className="py-2.5 px-3 font-semibold w-12 text-[#64748B]">#</th>
                  {headers.map((h) => (
                    <th key={h} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE7F5] text-[#0B1B33]">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-[#EEF7FF] transition-colors">
                    <td className="py-2 px-3 text-[#64748B] tabular-nums text-[11px]">{i + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="py-2 px-3 whitespace-nowrap text-[11px] max-w-xs truncate text-[#0B1B33]">
                        {String(r[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-sm">
        <div className="text-xs">
          {!canImport ? (
            <span className="text-rose-600 flex items-center gap-1.5 font-bold">
              <ShieldAlert size={14} />
              {UI_STRINGS.pcbiAdmin.importDisabledTooltip}
            </span>
          ) : (
            <span className="text-emerald-600 flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={14} />
              Validation Passed: Ready to create new version and import into production.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onProceedToImport}
          disabled={!canImport}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <span>{UI_STRINGS.pcbiAdmin.importButton}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
