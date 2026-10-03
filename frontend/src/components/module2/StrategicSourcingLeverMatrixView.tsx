'use client';
import React from 'react';
import { Target, ArrowRight, Shield } from 'lucide-react';
import type { StrategicSourcingLeverMatrixViewProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const StrategicSourcingLeverMatrixView: React.FC<StrategicSourcingLeverMatrixViewProps> = ({
  levers = []
}) => {
  const strings = UI_STRINGS.module2Sourcing;

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <Target className="w-4 h-4 text-cyan-600" />
          <span>{strings.leversTitle}</span>
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">15 Standard Enterprise Levers</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {levers.map((item, idx) => {
          return (
            <div
              key={item.lever}
              className={`p-3 rounded-xl border transition-all ${
                item.isApplicable
                  ? 'bg-slate-50/70 dark:bg-[#EEF4FC] border-slate-200 dark:border-slate-700 hover:border-cyan-500'
                  : 'bg-slate-100/40 dark:bg-white border-slate-200/50 dark:border-slate-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.leverLabel}
                  </span>
                </div>
                {item.isApplicable ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    Applicable
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200 text-slate-600 dark:bg-[#EEF4FC] dark:text-slate-400 shrink-0">
                    Deferred
                  </span>
                )}
              </div>

              {/* Rationale */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {item.rationale}
              </p>

              {/* Potential benefit badge */}
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                  {item.potentialBenefitLabel}
                </span>
                <span className="font-mono text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" />
                  {item.dataConfidence}
                </span>
              </div>

              {/* Action */}
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-start space-x-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                <ArrowRight className="w-3 h-3 text-cyan-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.nextAction}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
