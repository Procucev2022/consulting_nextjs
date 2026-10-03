'use client';

/**
 * Customer Plan Display Component (Prompt 288 §12)
 * Renders the customer's Procurement Intelligence Plan inside the profile menu.
 */

import React from 'react';
import { Crown, Sparkles, Shield, ArrowUpRight } from 'lucide-react';
import type { CustomerPlanDisplayProps } from '../../types';
import { UI_STRINGS, TIER_DISPLAY_CONFIG } from '../../constants';

export const CustomerPlanDisplay: React.FC<CustomerPlanDisplayProps> = ({
  currentTier,
  planInfo,
  onRequestUpgrade
}) => {
  const config = TIER_DISPLAY_CONFIG[currentTier] || TIER_DISPLAY_CONFIG.BRONZE;
  const isBronze = currentTier === 'BRONZE';
  const isSilver = currentTier === 'SILVER';
  const isGold = currentTier === 'GOLD';

  const targetTier = isBronze ? 'SILVER' : isSilver ? 'GOLD' : null;
  const ctaLabel = isBronze
    ? UI_STRINGS.subscription.exploreSilver
    : isSilver
      ? UI_STRINGS.subscription.exploreGold
      : null;

  return (
    <div
      data-testid="customer-plan-display"
      className="py-3 border-b border-slate-200/80 dark:border-slate-800"
    >
      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
        {UI_STRINGS.subscription.planSectionTitle}
      </div>

      <div
        className={`p-3 rounded-xl border transition-all ${
          isGold
            ? 'bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-amber-950/20 border-amber-500/30'
            : isSilver
              ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/90 border-slate-700'
              : 'bg-slate-50 dark:bg-white border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {isGold ? (
              <Crown className="w-4 h-4 text-amber-500" />
            ) : isSilver ? (
              <Sparkles className="w-4 h-4 text-slate-300" />
            ) : (
              <Shield className="w-4 h-4 text-amber-700 dark:text-amber-500" />
            )}
            <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase">
              {config.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-[#EEF4FC] text-slate-600 dark:text-slate-400">
              {config.edition}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isGold
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                : isSilver
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                  : 'bg-slate-200 dark:bg-[#EEF4FC] text-slate-700 dark:text-slate-300'
            }`}
          >
            {planInfo?.is_pending_activation
              ? UI_STRINGS.subscription.activationRequired
              : isBronze
                ? UI_STRINGS.subscription.freePlan
                : UI_STRINGS.subscription.activePlan}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
          {config.description}
        </p>

        {targetTier && ctaLabel && (
          <button
            type="button"
            data-testid={`upgrade-to-${targetTier.toLowerCase()}-btn`}
            onClick={() => onRequestUpgrade?.(targetTier)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs"
          >
            <span>{ctaLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}

        {isGold && (
          <div className="text-[10px] text-center font-bold text-amber-600 dark:text-amber-400 py-1">
            {UI_STRINGS.subscription.currentAccess}
          </div>
        )}
      </div>
    </div>
  );
};
