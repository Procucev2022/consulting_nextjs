'use client';
import React from 'react';
import { Target, CheckCircle2, ArrowRight } from 'lucide-react';
import type { ActionRecommendationOutput, SourcingNextAction } from '../../types/module2OpportunityIntelligence';

export interface ActionRecommendationPanelProps {
  actionRecommendation?: ActionRecommendationOutput;
}

export const ActionRecommendationPanel: React.FC<ActionRecommendationPanelProps> = ({
  actionRecommendation
}) => {
  if (!actionRecommendation) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
        Action-Oriented Roadmap not available for this category.
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  const getActionLabel = (action: SourcingNextAction) => {
    switch (action) {
      case 'RUN_E_AUCTION':
        return '1. Run Dynamic Reverse E-Auction';
      case 'RUN_RFQ':
        return '2. Execute Structured Competitive RFQ';
      case 'CONSOLIDATE_VOLUME':
        return '3. Bundle & Consolidate Volume Demand';
      case 'CONSOLIDATE_SUPPLIERS':
        return '4. Rationalize Tail Suppliers';
      case 'HARMONIZE_SPECIFICATIONS':
        return '5. Harmonize Item Specifications';
      case 'SEPARATE_CATEGORY_SOURCING':
        return '6. Unbundle Generalist to Specialists';
      case 'NEGOTIATE_COMMERCIAL_TERMS':
        return '7. Harmonize Commercial Payment Terms';
      case 'REVIEW_CONTRACT':
        return '8. Transition Spot to Annual Rate Contract';
      case 'PERFORM_MARKET_DISCOVERY':
        return '9. Conduct Market Price Discovery Tender';
      case 'COLLECT_MISSING_DATA':
        return '10. Enrich Data Quality & Specifications';
      case 'MONITOR':
        return '11. Continue Active Performance Monitoring';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              Action-Oriented Category Sourcing Roadmap
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Defensible next actions for procurement leads based on evidence and commercial feasibility.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Sourcing Priority:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getPriorityBadge(actionRecommendation.priorityLevel)}`}>
            {actionRecommendation.priorityLevel}
          </span>
        </div>
      </div>

      {/* 5-Pillar Sourcing Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* What We Found */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm">
          <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            1. What We Found
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {actionRecommendation.whatWeFound}
          </p>
        </div>

        {/* Why It Matters */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm">
          <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider text-amber-600 dark:text-amber-400">
            2. Why It Matters
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {actionRecommendation.whyItMatters}
          </p>
        </div>

        {/* What We Can Quantify */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm">
          <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            3. What We Can Quantify
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {actionRecommendation.whatWeCanQuantify}
          </p>
        </div>

        {/* What Cannot Yet Be Quantified */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-sm">
          <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider text-purple-600 dark:text-purple-400">
            4. What Requires External Testing
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {actionRecommendation.whatShouldBeTested}
          </p>
        </div>
      </div>

      {/* Recommended Action Checklist */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Recommended Immediate Procurement Actions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actionRecommendation.whatProcurementShouldDoNext.map((act) => (
            <div
              key={act}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2 shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span>{getActionLabel(act)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
