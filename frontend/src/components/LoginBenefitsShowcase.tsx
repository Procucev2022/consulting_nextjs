'use client';

/**
 * Enterprise Procurement Technology Benefits & Profit Multiplier Showcase
 * Prominently showcases the aiCEV platform advantages and direct EBITDA multiplier.
 */

import React from 'react';
import Image from 'next/image';
import {
  TrendingDown,
  Layers,
  GitBranch,
  ShieldCheck,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import type { LoginBenefitsShowcaseProps } from '../types';
import { UI_STRINGS, AICEV_LOGO_SRC } from '../constants';

export const LoginBenefitsShowcase: React.FC<LoginBenefitsShowcaseProps> = ({
  className = '',
  showMetrics = true
}) => {
  return (
    <div className={`flex flex-col justify-between h-full text-slate-100 ${className}`}>
      {/* Brand & Prominent Logo Header */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-2xl border border-sky-400/30 inline-flex items-center justify-center transition-all hover:shadow-cyan-500/20 hover:border-cyan-400/50">
            <Image
              src={AICEV_LOGO_SRC}
              alt={UI_STRINGS.header.logoAlt}
              width={320}
              height={80}
              priority
              style={{ height: '64px', width: 'auto', maxHeight: '72px', maxWidth: '300px', objectFit: 'contain' }}
            />
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{UI_STRINGS.auth.benefitsBadge}</span>
          </span>
        </div>

        {/* Central Theme: Every Penny Saved in Procurement is a Direct Increase in Profit */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900/90 to-sky-950/40 p-6 sm:p-7 border border-emerald-500/30 shadow-xl backdrop-blur-sm">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-full border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {UI_STRINGS.auth.profitMultiplierBadge}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug tracking-tight mb-3">
            {UI_STRINGS.auth.profitHeadline}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {UI_STRINGS.auth.profitSubtext}
          </p>

          {/* Quantified Metrics Ribbon */}
          {showMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-700/60">
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
                <span className="block text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                  {UI_STRINGS.auth.statDirectEbitda}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  {UI_STRINGS.auth.statDirectEbitdaLabel}
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
                <span className="block text-lg sm:text-xl font-extrabold text-cyan-400 font-mono">
                  {UI_STRINGS.auth.statSavingsUnlocked}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  {UI_STRINGS.auth.statSavingsLabel}
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
                <span className="block text-lg sm:text-xl font-extrabold text-sky-400 font-mono">
                  {UI_STRINGS.auth.statAccuracyRate}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  {UI_STRINGS.auth.statAccuracyLabel}
                </span>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
                <span className="block text-lg sm:text-xl font-extrabold text-amber-400 font-mono">
                  {UI_STRINGS.auth.statTypicalRoi}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  {UI_STRINGS.auth.statTypicalRoiLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3 Core Technology Advantage Cards */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {UI_STRINGS.auth.benefitsTitle}
            </h3>
            <span className="text-[11px] text-cyan-400/80 font-medium">
              {UI_STRINGS.auth.benefitsSubtitle}
            </span>
          </div>

          {/* Pillar 1: Cost Savings & Leakage Elimination */}
          <div className="rounded-xl bg-slate-900/70 p-4 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-800/40 text-rose-400 shrink-0 mt-0.5">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{UI_STRINGS.auth.benefitCostSavingsTitle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {UI_STRINGS.auth.benefitCostSavingsDesc}
              </p>
            </div>
          </div>

          {/* Pillar 2: Strategic Sourcing & Category Intelligence */}
          <div className="rounded-xl bg-slate-900/70 p-4 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{UI_STRINGS.auth.benefitStrategicSourcingTitle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {UI_STRINGS.auth.benefitStrategicSourcingDesc}
              </p>
            </div>
          </div>

          {/* Pillar 3: Strategic Transformation Roadmap */}
          <div className="rounded-xl bg-slate-900/70 p-4 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-800/40 text-indigo-400 shrink-0 mt-0.5">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{UI_STRINGS.auth.benefitRoadmapTitle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {UI_STRINGS.auth.benefitRoadmapDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Enterprise Governance Footer */}
      <div className="pt-4 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{UI_STRINGS.header.securityBadge}</span>
        </div>
        <span className="font-mono text-slate-500">{UI_STRINGS.header.engineVersion}</span>
      </div>
    </div>
  );
};
