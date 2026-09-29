'use client';
import React from 'react';
import type { CategoryStrategicSourcingProfile } from '../../types';

export interface CategoryPriceDispersionTabProps {
  profile: CategoryStrategicSourcingProfile;
}

export const CategoryPriceDispersionTab: React.FC<CategoryPriceDispersionTabProps> = ({ profile }) => {
  return (
    <div className="space-y-4">
      {/* Price Percentile Breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Price Dispersion & Non-Parametric Percentile Analysis
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center font-mono">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-sans">Min</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              ₹{profile.priceDispersion?.minPrice.toFixed(2) ?? 'N/A'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800">
            <span className="text-[10px] text-emerald-600 uppercase font-sans font-bold">P25 (Ref)</span>
            <div className="font-bold text-emerald-600 mt-1">
              ₹{profile.priceDispersion?.p25Price.toFixed(2) ?? 'N/A'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-sans">Median</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              ₹{profile.priceDispersion?.medianPrice.toFixed(2) ?? 'N/A'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-800">
            <span className="text-[10px] text-cyan-600 uppercase font-sans font-bold">WAP (Base)</span>
            <div className="font-bold text-cyan-600 mt-1">
              ₹{profile.priceDispersion?.weightedAveragePrice.toFixed(2) ?? 'N/A'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-sans">P75</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              ₹{profile.priceDispersion?.p75Price.toFixed(2) ?? 'N/A'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-sans">Max</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              ₹{profile.priceDispersion?.maxPrice.toFixed(2) ?? 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Dispersion Narrative */}
      <div className="p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 text-xs space-y-1">
        <span className="font-bold text-cyan-900 dark:text-cyan-300">Statistical Dispersion Interpretation</span>
        <div className="text-cyan-800 dark:text-cyan-400 text-[11px] leading-relaxed">
          {profile.priceDispersion?.dispersionInterpretation || profile.credibleReference.explanation}
        </div>
      </div>
    </div>
  );
};
