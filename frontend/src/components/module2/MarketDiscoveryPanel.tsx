'use client';
import React from 'react';
import { AlertTriangle, Compass, CheckCircle2, FileText } from 'lucide-react';
import type { MarketDiscoveryAssessment } from '../../types/module2OpportunityIntelligence';

export interface MarketDiscoveryPanelProps {
  marketDiscovery?: MarketDiscoveryAssessment;
}

export const MarketDiscoveryPanel: React.FC<MarketDiscoveryPanelProps> = ({ marketDiscovery }) => {
  if (!marketDiscovery) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
        Market Discovery Assessment not available for this category.
      </div>
    );
  }

  const isRequired = marketDiscovery.isMarketDiscoveryRequired;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isRequired
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-start space-x-3">
          {isRequired ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm">{marketDiscovery.discoveryStatusLabel}</div>
            <div className="text-xs opacity-90 mt-0.5">{marketDiscovery.diagnosticRationale}</div>
          </div>
        </div>
        <div className="shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-current shadow-sm">
            {marketDiscovery.recommendedSourcingVehicle.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Structural Triggers */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-cyan-500" />
          Structural Market Discovery Triggers ({marketDiscovery.triggers.length})
        </h4>

        {marketDiscovery.triggers.length === 0 ? (
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500">
            No adverse structural triggers identified. Internal competitive density provides sufficient historical baseline pricing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {marketDiscovery.triggers.map((trigger) => (
              <div
                key={trigger.triggerKey}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {trigger.triggerLabel}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      trigger.severity === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    }`}
                  >
                    {trigger.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Observed: </span>
                  {trigger.observedCondition}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Structural Impact: </span>
                  {trigger.structuralImpact}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategic Recommendation */}
      <div className="p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20 text-xs space-y-1">
        <div className="font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          Recommended Procurement Execution Strategy
        </div>
        <p className="text-cyan-800 dark:text-cyan-400 text-[11px] leading-relaxed">
          {marketDiscovery.marketTestingRecommendation}
        </p>
      </div>
    </div>
  );
};
