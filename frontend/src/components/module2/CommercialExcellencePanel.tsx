'use client';
import React from 'react';
import { Briefcase, FileText, ShieldAlert } from 'lucide-react';
import type { CategoryCommercialExcellenceProfile } from '../../types/module2OpportunityIntelligence';

export interface CommercialExcellencePanelProps {
  commercialExcellence?: CategoryCommercialExcellenceProfile;
}

export const CommercialExcellencePanel: React.FC<CommercialExcellencePanelProps> = ({ commercialExcellence }) => {
  if (!commercialExcellence) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
        Commercial Excellence Profile not available.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPTIMIZED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'PARTIALLY_OPTIMIZED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      case 'OPPORTUNITY_IDENTIFIED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Commercial Terms & Contract Excellence Profile
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Status: <span className="font-semibold text-slate-700 dark:text-slate-300">{commercialExcellence.overallStatusLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {commercialExcellence.opportunityIdentifiedCount} Opportunities
          </span>
          <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {commercialExcellence.partiallyOptimizedCount} Partially Optimized
          </span>
        </div>
      </div>

      {/* Governed Principle Notice */}
      <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Commercial and contract terms provide operational efficiency, working capital, and risk mitigation benefits. They are strictly NOT converted into synthetic price savings without validated cost data.
        </span>
      </div>

      {/* 12 Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {commercialExcellence.dimensions.map((dim) => (
          <div
            key={dim.dimensionKey}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                {dim.dimensionLabel}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(dim.status)}`}>
                {dim.statusLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">Observed Condition: </span>
              {dim.currentCondition}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-300">Potential Implication: </span>
              {dim.potentialImplication}
            </p>
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-cyan-700 dark:text-cyan-400 font-medium">
              <span>Action: </span>
              {dim.recommendedAction}
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Summary */}
      <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs space-y-1">
        <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Commercial Harmonization Roadmap
        </div>
        <p className="text-indigo-800 dark:text-indigo-400 text-[11px] leading-relaxed">
          {commercialExcellence.strategicActionSummary}
        </p>
      </div>
    </div>
  );
};
