'use client';
import React from 'react';
import { Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import type { ProcurementMaturityScorecardResult } from '../../types/module2OpportunityIntelligence';

export interface ProcurementMaturityScorecardViewProps {
  procurementMaturity?: ProcurementMaturityScorecardResult;
}

export const ProcurementMaturityScorecardView: React.FC<ProcurementMaturityScorecardViewProps> = ({
  procurementMaturity
}) => {
  if (!procurementMaturity) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white text-xs text-slate-500">
        Procurement Maturity Scorecard not available for this category.
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'OPTIMIZED':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
      case 'MANAGED':
        return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300';
      case 'DEVELOPING':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300';
      case 'BASIC':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
      default:
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              10-Dimension Procurement Maturity Diagnostic Scorecard
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Diagnostic capability evaluation. Never converted directly into monetary savings.
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {procurementMaturity.overallScore}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Maturity Index</div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${getLevelColor(procurementMaturity.overallMaturityLevel)}`}>
            {procurementMaturity.overallMaturityLevel}
          </span>
        </div>
      </div>

      {/* Top Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Top Weaknesses */}
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 space-y-2">
          <div className="font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Priority Improvement Areas (Weaknesses)
          </div>
          <div className="space-y-1.5">
            {procurementMaturity.topWeaknesses.map((w) => (
              <div key={w.dimensionKey} className="text-xs p-2 rounded bg-white dark:bg-white border border-rose-100 dark:border-rose-900/30 flex justify-between items-center">
                <span className="font-medium text-slate-800 dark:text-slate-200">{w.dimensionLabel}</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{w.score}/10</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Strengths */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
          <div className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Core Capability Anchors (Strengths)
          </div>
          <div className="space-y-1.5">
            {procurementMaturity.topStrengths.map((s) => (
              <div key={s.dimensionKey} className="text-xs p-2 rounded bg-white dark:bg-white border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                <span className="font-medium text-slate-800 dark:text-slate-200">{s.dimensionLabel}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.score}/10</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10 Diagnostic Dimensions Detail Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-white shadow-sm">
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#EEF4FC] border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
          Complete 10-Dimension Diagnostic Breakdown
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {procurementMaturity.dimensions.map((dim) => (
            <div key={dim.dimensionKey} className="p-3 space-y-1 hover:bg-slate-50/50 dark:hover:bg-[#EEF4FC] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{dim.dimensionLabel}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getLevelColor(dim.maturityLevel)}`}>
                    {dim.maturityLevel}
                  </span>
                  <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300 w-8 text-right">
                    {dim.score}/10
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">Observed Condition: </span>
                {dim.observedCondition}
              </p>
              <div className="text-[11px] text-cyan-700 dark:text-cyan-400">
                <span className="font-medium">Recommendation: </span>
                {dim.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
