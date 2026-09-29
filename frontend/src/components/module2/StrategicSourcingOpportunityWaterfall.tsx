'use client';
import React from 'react';
import { ArrowDown, Layers, Info } from 'lucide-react';
import type { StrategicSourcingOpportunityWaterfallProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const StrategicSourcingOpportunityWaterfall: React.FC<StrategicSourcingOpportunityWaterfallProps> = ({
  stages = [],
  categoryName
}) => {
  const strings = UI_STRINGS.module2Sourcing;

  const stageColors: Record<string, { bg: string; text: string; border: string }> = {
    TOTAL_CATEGORY_SPEND: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-900 dark:text-white',
      border: 'border-slate-300 dark:border-slate-700'
    },
    NON_ADDRESSABLE_SPEND: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-300 dark:border-rose-800'
    },
    ADDRESSABLE_SPEND: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-800'
    },
    E_AUCTION_OPPORTUNITY: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      text: 'text-cyan-700 dark:text-cyan-400',
      border: 'border-cyan-300 dark:border-cyan-800'
    },
    CONSOLIDATION_OPPORTUNITY: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-300 dark:border-purple-800'
    },
    OVERLAP_REMOVED: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-800'
    },
    NET_QUANTIFIABLE_OPPORTUNITY: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-400 dark:border-emerald-600'
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>{strings.waterfallTitle}</span>
            {categoryName && <span className="text-cyan-600">({categoryName})</span>}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {strings.waterfallSubtitle}
          </p>
        </div>
      </div>

      {/* Waterfall Stages Container */}
      <div className="space-y-2">
        {stages.map((st, idx) => {
          const colors = stageColors[st.stage] || stageColors.TOTAL_CATEGORY_SPEND;
          const isNegative = st.stage === 'NON_ADDRESSABLE_SPEND' || st.stage === 'OVERLAP_REMOVED';
          const isFinal = st.stage === 'NET_QUANTIFIABLE_OPPORTUNITY';

          return (
            <React.Fragment key={st.stage}>
              <div
                className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                  colors.bg
                } ${colors.border} ${isFinal ? 'ring-2 ring-emerald-500/30' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-xs font-bold font-mono opacity-50 shrink-0 mt-0.5">
                    0{idx + 1}.
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{st.label}</span>
                      {st.percentageOfTotal > 0 && (
                        <span className="text-[10px] font-mono opacity-70">
                          ({st.percentageOfTotal.toFixed(1)}% of category spend)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Info className="w-3 h-3 shrink-0" />
                      <span>{st.calculationBasis}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-sm lg:text-base font-black font-mono ${colors.text}`}>
                    {isNegative ? '-' : ''}₹{(st.amountInr / 100000).toFixed(2)} Lakhs
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    (₹{st.amountInrCr.toFixed(3)} Cr)
                  </div>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
