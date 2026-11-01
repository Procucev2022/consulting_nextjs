'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Layers, Database } from 'lucide-react';
import type { PCBIMissingIndexStatusCardsProps } from '../../types/module3GapList';
import { UI_STRINGS } from '../../constants';

export const PCBIMissingIndexStatusCards: React.FC<PCBIMissingIndexStatusCardsProps> = ({
  report,
  selectedStatus,
  onSelectStatus
}) => {
  const strings = UI_STRINGS.module3.gapList;

  return (
    <div className="space-y-4">
      {/* 4 Primary Top KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Authoritative Baseline */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 rounded-xl p-4 text-white shadow-sm border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span className="font-semibold uppercase tracking-wider">{strings.kpiBaselineSpend}</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{report.baselineSpendCr.toFixed(4)} <span className="text-sm font-sans font-normal text-slate-300">Cr</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{strings.kpiBaselineSub}</div>
        </div>

        {/* Verified Observations Available */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-emerald-200/80 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs text-emerald-800 mb-1 font-semibold uppercase tracking-wider">
            <span>{strings.kpiVerifiedObs}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">READY: NO</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            ₹{report.verifiedSpendCr.toFixed(4)} <span className="text-sm font-sans font-normal text-emerald-600">Cr (0%)</span>
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">{strings.kpiVerifiedObsSub}</div>
        </div>

        {/* Missing-Index Gap Spend */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-rose-200/80 hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-xs text-rose-800 mb-1 font-semibold uppercase tracking-wider">
            <span>{strings.kpiMissingGapSpend}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            ₹{report.missingIndexGapSpendCr.toFixed(4)} <span className="text-sm font-sans font-normal text-rose-500">Cr (100%)</span>
          </div>
          <div className="text-[11px] text-rose-500/80 mt-1">{strings.kpiMissingGapSpendSub}</div>
        </div>

        {/* Quarantined Observations */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-amber-200/80 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1 font-semibold uppercase tracking-wider">
            <span>{strings.kpiQuarantined}</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {report.quarantinedObservationsCount} <span className="text-sm font-sans font-normal text-amber-500">Series</span>
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">{strings.kpiQuarantinedSub}</div>
        </div>
      </div>

      {/* Status-Wise Count & Spend Reconciliation Filter Buttons */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              {strings.summaryTitle}
            </h4>
            <p className="text-[11px] text-slate-500">{strings.summarySubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectStatus('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {strings.filterAllCount(report.items.length)}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {report.statusSummaries.map((summary) => {
            const isSelected = selectedStatus === summary.status;
            const isVerified = summary.status === 'VERIFIED OBSERVATIONS AVAILABLE';
            const isMissingObs = summary.status === 'BENCHMARK DEFINED — OBSERVATIONS MISSING';
            const isLicense = summary.status === 'LICENSE REQUIRED';

            return (
              <button
                key={summary.status}
                type="button"
                onClick={() => onSelectStatus(isSelected ? 'ALL' : summary.status)}
                className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMissingObs
                        ? 'bg-amber-100 text-amber-800'
                        : isLicense
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {summary.statusLabel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{summary.spendPercentage}%</span>
                </div>
                <div className="text-base font-black text-slate-900 font-mono">
                  ₹{summary.totalSpendCr.toFixed(4)} <span className="text-xs font-normal text-slate-500">Cr</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between mt-1">
                  <span>{summary.itemCount} distinct requirements</span>
                  <span>{summary.transactionCount.toLocaleString()} txs</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
