'use client';

/**
 * Tier Mask Overlay Component
 * Renders an elegant, glassmorphic barrier over premium module content based on subscription tier rules.
 */

import React from 'react';
import { Lock, Sparkles, Crown, ArrowRight } from 'lucide-react';
import type { TierMaskOverlayProps } from '../types';
import { UI_STRINGS } from '../constants';

export const TierMaskOverlay: React.FC<TierMaskOverlayProps> = ({
  requiredTier,
  title,
  description,
  onUpgrade,
  ctaText,
  isSummaryVisible = false
}) => {
  const isGold = requiredTier === 'GOLD';
  const badgeLabel = isGold
    ? UI_STRINGS.subscription.tierGoldBadge
    : UI_STRINGS.subscription.tierSilverBadge;

  const defaultCta = isGold
    ? UI_STRINGS.subscription.upgradeToGold
    : UI_STRINGS.subscription.upgradeToSilver;

  const actionText = ctaText || defaultCta;

  return (
    <div
      data-testid="tier-mask-overlay"
      className={`relative w-full rounded-2xl overflow-hidden border ${
        isGold
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950/95'
          : 'border-slate-400/30 bg-gradient-to-b from-slate-900/80 via-slate-900/95 to-slate-950/95'
      } backdrop-blur-xl shadow-2xl p-8 sm:p-10 my-6 transition-all duration-300`}
    >
      {/* Decorative Glow Elements */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isGold ? 'bg-amber-500/15' : 'bg-sky-500/10'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
        {/* Tier Requirement Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 shadow-lg border">
          {isGold ? (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 px-3 py-1 rounded-full border border-amber-300/50 shadow-amber-500/20 shadow-md">
              <Crown className="w-3.5 h-3.5 text-amber-950" />
              <span>{badgeLabel}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 px-3 py-1 rounded-full border border-slate-300/60 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>{badgeLabel}</span>
            </div>
          )}
        </div>

        {/* Lock Icon with Glowing Enclosure */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl border ${
            isGold
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10'
              : 'bg-slate-800/80 border-slate-600/40 text-slate-300 shadow-sky-500/5'
          }`}
        >
          <Lock className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
          {title}
        </h3>

        {/* Descriptive Body */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
          {description}
        </p>

        {/* Summary Visibility Notice */}
        {isSummaryVisible && (
          <div className="w-full mb-6 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-cyan-300 font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{UI_STRINGS.subscription.savingsAvailableSummaryOnly}</span>
          </div>
        )}

        {/* Upgrade / Unlock CTA Button */}
        {onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ${
              isGold
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-amber-950 border border-amber-300/60 shadow-amber-500/30'
                : 'bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-400 hover:to-cyan-500 text-white border border-cyan-400/40 shadow-cyan-500/30'
            }`}
          >
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
