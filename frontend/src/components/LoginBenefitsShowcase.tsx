'use client';

/**
 * Enterprise Procurement Value Showcase (Prompt 290, 292 & 605)
 * Light Premium Enterprise Theme: Communicates the Discover -> Assess -> Optimize product journey,
 * core value proposition, and factual capabilities of aiCEV in a sleek, screen-fitted layout.
 */

import React from 'react';
import Image from 'next/image';
import {
  Search,
  SlidersHorizontal,
  Target,
  ArrowRight,
  TrendingDown,
  Layers,
  BarChart3,
  GitBranch,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import type { LoginBenefitsShowcaseProps } from '../types';
import { UI_STRINGS, AICEV_LOGO_SRC } from '../constants';

const capabilities = [
  { title: UI_STRINGS.auth.statDirectEbitda, label: UI_STRINGS.auth.statDirectEbitdaLabel, Icon: Search, color: 'text-sky-600' },
  { title: UI_STRINGS.auth.statSavingsUnlocked, label: UI_STRINGS.auth.statSavingsLabel, Icon: Target, color: 'text-emerald-600' },
  { title: UI_STRINGS.auth.statAccuracyRate, label: UI_STRINGS.auth.statAccuracyLabel, Icon: Layers, color: 'text-indigo-600' },
  { title: UI_STRINGS.auth.statTypicalRoi, label: UI_STRINGS.auth.statTypicalRoiLabel, Icon: GitBranch, color: 'text-amber-600' }
];

const benefits = [
  { title: UI_STRINGS.auth.benefitCostSavingsTitle, desc: UI_STRINGS.auth.benefitCostSavingsDesc, Icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  { title: UI_STRINGS.auth.benefitStrategicSourcingTitle, desc: UI_STRINGS.auth.benefitStrategicSourcingDesc, Icon: Layers, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
  { title: UI_STRINGS.auth.benefitBenchmarkTitle, desc: UI_STRINGS.auth.benefitBenchmarkDesc, Icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  { title: UI_STRINGS.auth.benefitRoadmapTitle, desc: UI_STRINGS.auth.benefitRoadmapDesc, Icon: GitBranch, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
];

export const LoginBenefitsShowcase: React.FC<LoginBenefitsShowcaseProps> = ({
  className = '',
  showMetrics = true
}) => {
  return (
    <div className={`contents lg:flex lg:flex-col lg:justify-start text-slate-800 ${className}`}>
      {/* 1. Brand & Clean Logo Placement */}
      <div className="order-1 lg:order-none flex items-center gap-2 mb-1 lg:mb-1.5">
        <div className="inline-flex items-center">
          <Image
            src={AICEV_LOGO_SRC}
            alt={UI_STRINGS.header.logoAlt}
            width={180}
            height={45}
            priority
            style={{ height: '30px', width: 'auto', maxHeight: '34px', maxWidth: '160px', objectFit: 'contain' }}
          />
        </div>
        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-200">
          <Sparkles size={11} className="text-sky-600" />
          <span>{UI_STRINGS.auth.procurementIntelligenceBadge}</span>
        </span>
      </div>

      {/* 2. Hero Section: Direct on canvas with refined enterprise scale */}
      <div className="order-2 lg:order-none mb-1.5 lg:mb-2">
        <h1 className="text-lg sm:text-xl lg:text-[22px] xl:text-[25px] font-extrabold text-[#0B1B33] leading-tight tracking-tight mb-1">
          {UI_STRINGS.auth.heroHeadline}
        </h1>

        <p className="text-xs sm:text-[12.5px] font-semibold text-sky-700 mb-0.5 leading-snug">
          {UI_STRINGS.auth.heroSecondLine}
        </p>

        <p className="text-[11px] sm:text-xs text-slate-600 leading-normal max-w-[620px] m-0">
          {UI_STRINGS.auth.heroSupportingText}
        </p>
      </div>

      {/* 3. Capability Ribbon: Compact Tiles */}
      {showMetrics && (
        <div className="order-3 lg:order-none grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-1.5 lg:mb-2">
          {capabilities.map((item) => {
            const ItemIcon = item.Icon;
            return (
              <div key={item.title} className="bg-white rounded-lg p-1.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className={`flex items-center gap-1 mb-0.5 ${item.color}`}>
                    <ItemIcon size={12} />
                    <span className="text-[11px] font-bold text-[#0B1B33]">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight block">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Product Journey Panel: Main Explanatory Visual Anchor */}
      <div className="order-5 lg:order-none mb-1.5 lg:mb-2 rounded-xl bg-white p-2 sm:p-2.5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">
            {UI_STRINGS.auth.modelTitle}
          </h2>
          <span className="text-[10px] font-mono font-bold text-sky-700">
            {UI_STRINGS.auth.modelSubtitle}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 items-stretch">
          {/* Stage 1: Bronze Discover */}
          <div className="rounded-lg bg-amber-50/40 p-1.5 sm:p-2 border border-amber-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-mono font-extrabold text-amber-800">{UI_STRINGS.auth.stage1Number}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  {UI_STRINGS.auth.stage1Tier}
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#0B1B33] flex items-center gap-1 mb-0.5">
                <Search className="w-3 h-3 text-amber-600" />
                <span>{UI_STRINGS.auth.stage1Name}</span>
              </h3>
              <p className="text-[10px] text-slate-600 leading-tight m-0">{UI_STRINGS.auth.stage1Desc}</p>
            </div>
            <div className="mt-1 pt-1 border-t border-amber-200/40 text-[9px] font-semibold text-amber-700 flex items-center justify-between">
              <span>Start here</span>
              <ArrowRight size={10} className="hidden sm:inline" />
            </div>
          </div>

          {/* Stage 2: Silver Assess */}
          <div className="rounded-lg bg-slate-50/70 p-1.5 sm:p-2 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-mono font-extrabold text-slate-700">{UI_STRINGS.auth.stage2Number}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-800 font-bold border border-slate-300">
                  {UI_STRINGS.auth.stage2Tier}
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#0B1B33] flex items-center gap-1 mb-0.5">
                <SlidersHorizontal className="w-3 h-3 text-slate-600" />
                <span>{UI_STRINGS.auth.stage2Name}</span>
              </h3>
              <p className="text-[10px] text-slate-600 leading-tight m-0">{UI_STRINGS.auth.stage2Desc}</p>
            </div>
            <div className="mt-1 pt-1 border-t border-slate-200/60 text-[9px] font-semibold text-slate-600 flex items-center justify-between">
              <span>Discover value</span>
              <ArrowRight size={10} className="hidden sm:inline" />
            </div>
          </div>

          {/* Stage 3: Gold Optimize */}
          <div className="rounded-lg bg-orange-50/40 p-1.5 sm:p-2 border border-orange-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-mono font-extrabold text-orange-800">{UI_STRINGS.auth.stage3Number}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-900 font-bold border border-orange-200">
                  {UI_STRINGS.auth.stage3Tier}
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#0B1B33] flex items-center gap-1 mb-0.5">
                <Target className="w-3 h-3 text-orange-600" />
                <span>{UI_STRINGS.auth.stage3Name}</span>
              </h3>
              <p className="text-[10px] text-slate-600 leading-tight m-0">{UI_STRINGS.auth.stage3Desc}</p>
            </div>
            <div className="mt-1 pt-1 border-t border-orange-200/40 text-[9px] font-semibold text-orange-700 flex items-center justify-between">
              <span>Expand when needed</span>
              <Sparkles size={10} className="hidden sm:inline text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Benefits Section: Clean 2x2 White-Card Grid */}
      <div className="order-6 lg:order-none space-y-1 mb-1.5 lg:mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">
            {UI_STRINGS.auth.benefitsTitle}
          </h2>
          <span className="text-[10px] text-sky-700 font-medium">
            {UI_STRINGS.auth.benefitsSubtitle}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 items-stretch">
          {benefits.map((b) => {
            const BenefitIcon = b.Icon;
            return (
              <div key={b.title} className="h-full rounded-lg bg-white p-1.5 border border-slate-200/90 shadow-xs flex gap-2 items-start">
                <div className={`p-1 rounded-md border ${b.bg} ${b.color} shrink-0 mt-0.5`}>
                  <BenefitIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] font-bold text-[#0B1B33] truncate m-0">{b.title}</h3>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-tight m-0">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Trust Statement Footer */}
      <div className="order-7 lg:order-none pt-1 border-t border-slate-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[9.5px] text-slate-500">
        <div>
          <span className="font-bold text-[#0B1B33] block sm:inline mr-1.5">
            {UI_STRINGS.auth.trustTitle}
          </span>
          <span className="text-slate-600">
            {UI_STRINGS.auth.trustSubtext}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-slate-500 font-mono text-[9.5px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{UI_STRINGS.header.engineVersion}</span>
        </div>
      </div>
    </div>
  );
};
