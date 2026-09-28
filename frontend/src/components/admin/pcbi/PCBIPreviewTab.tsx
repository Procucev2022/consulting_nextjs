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
      <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md text-[11px] font-mono font-extrabold uppercase tracking-wider">
              {UI_STRINGS.pcbiAdmin.previewSimulationBadge}
            </span>
            <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-md text-[11px] font-mono font-extrabold uppercase tracking-wider">
              {UI_STRINGS.pcbiAdmin.previewNotProductionBadge}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[11px] font-mono font-extrabold uppercase tracking-wider">
              {UI_STRINGS.pcbiAdmin.previewNotApprovedBadge}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed pt-1">
            {UI_STRINGS.pcbiAdmin.previewSandboxNotice}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
          <span className="text-slate-400">Prod Writes: <strong className="text-emerald-400">0</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Savings: <strong className="text-emerald-400">0</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Mod 4: <strong className="text-amber-400">DISCONNECTED</strong></span>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">PCBI Master</span>
          <p className="text-lg font-bold text-white mt-1">
            {(datasets.PCBI_MASTER || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">Weekly Index</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">
            {(datasets.WEEKLY_INDEX || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">Constituents</span>
          <p className="text-lg font-bold text-purple-400 mt-1">
            {(datasets.CONSTITUENTS || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">UNSPSC Map</span>
          <p className="text-lg font-bold text-amber-400 mt-1">
            {(datasets.UNSPSC_MAPPING || []).length.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">Quality A / B / C</span>
          <p className="text-lg font-bold text-cyan-300 mt-1">
            {validationSummary?.aQualityCount || 0} / {validationSummary?.bQualityCount || 0} /{' '}
            {validationSummary?.cQualityCount || 0}
          </p>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">Avg Benchmarkable</span>
          <p className="text-lg font-bold text-cyan-400 mt-1">
            {validationSummary?.avgBenchmarkability || 70}%
          </p>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">Date Range</span>
          <p className="text-[11px] font-bold text-slate-200 mt-1 truncate">
            {validationSummary?.dateStart || '2020'} to {validationSummary?.dateEnd || '2026'}
          </p>
        </div>
      </div>

      {/* Dataset Selection Tabs & Table */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Table size={16} className="text-cyan-400" />
              {UI_STRINGS.pcbiAdmin.previewTitle}
            </h4>
            <p className="text-xs text-slate-400">
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
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label} ({(datasets[tab.key] || []).length})
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/30 rounded-xl">
            No records found for this dataset.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 sticky top-0 bg-slate-900">
                  <th className="py-2.5 px-3 font-semibold w-12 text-slate-500">#</th>
                  {headers.map((h) => (
                    <th key={h} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{i + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="py-2 px-3 whitespace-nowrap font-mono text-[11px] max-w-xs truncate">
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="text-xs">
          {!canImport ? (
            <span className="text-rose-400 flex items-center gap-1.5 font-bold">
              <ShieldAlert size={14} />
              {UI_STRINGS.pcbiAdmin.importDisabledTooltip}
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={14} />
              Validation Passed: Ready to create new version and import into production.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onProceedToImport}
          disabled={!canImport}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
        >
          <span>{UI_STRINGS.pcbiAdmin.importButton}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
