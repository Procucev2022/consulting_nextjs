'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  FileCheck,
  ArrowRight,
  Send,
  Zap,
  Sparkles,
  Award,
  Check
} from 'lucide-react';
import type { Module4SavingsEngineProps, PipelineActiveTab } from '../types';
import { TierMaskOverlay } from './TierMaskOverlay';
import { StrategicSavingsSummaryBanner } from './savings/StrategicSavingsSummaryBanner';
import { SavingsWaterfallSection } from './savings/SavingsWaterfallSection';
import { OverlapDeduplicationTable } from './savings/OverlapDeduplicationTable';
import { ActionPlanTracker } from './savings/ActionPlanTracker';
import { buildStrategicSavingsSummary } from '../utils/strategicSavingsCalculator';
import { apiClient } from '../utils/api';
import type {
  ConsolidatedSavingsData,
  ActionPlanItem,
  SavingsOpportunityStatus,
  ActionOwner
} from '../types/savings';
import { UI_STRINGS } from '../constants';

export const Module4SavingsEngine: React.FC<Module4SavingsEngineProps> = ({
  opportunities,
  onOpenProCPX,
  onOpenDPSNXT,
  onProceedToConversion,
  currentTier = 'GOLD',
  onUpgrade,
  onNavigateToSection
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedSavingsData | null>(null);
  const pipelineTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getConsolidatedSavings()
      .then((data) => {
        if (isMounted && data) {
          setConsolidatedData(data);
        }
      })
      .catch(() => {
        // Fall back gracefully
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigate = (targetModule: PipelineActiveTab, targetSectionId: string) => {
    if (targetModule === 'module4' && targetSectionId === 'savings-pipeline-table-section') {
      pipelineTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onNavigateToSection?.(targetModule, targetSectionId);
  };

  const handleUpdateActionPlan = (
    actionId: string,
    updates: {
      status?: ActionPlanItem['status'];
      owner?: ActionOwner;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
      comments?: string;
    }
  ) => {
    setConsolidatedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        actionPlans: prev.actionPlans.map((p) => (p.id === actionId ? { ...p, ...updates } : p))
      };
    });

    apiClient.updateActionPlan(actionId, updates).catch(() => {
      // Local state already updated
    });
  };

  const handleUpdateOpportunityStatus = (oppId: string, status: SavingsOpportunityStatus) => {
    setConsolidatedData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        opportunities: prev.opportunities.map((o) => (o.opportunity_id === oppId ? { ...o, status } : o))
      };
    });

    apiClient.updateSavingsOpportunityStatus(oppId, status).catch(() => {
      // Local state already updated
    });
  };

  const totalSavingsInrCr = opportunities.reduce(
    (acc, opp) => acc + (opp.estimated_savings_inr_cr || (opp.estimated_savings_usd ? opp.estimated_savings_usd * 83.8 / 10000000 : 0) || 0),
    0
  );
  const totalEvaluatedSpendInrCr = opportunities.reduce(
    (acc, opp) => acc + (opp.baseline_spend_inr_cr || (opp.current_spend_usd ? opp.current_spend_usd * 83.8 / 10000000 : 0) || 0),
    0
  );

  const realizationTargetPct = totalEvaluatedSpendInrCr > 0
    ? ((totalSavingsInrCr / totalEvaluatedSpendInrCr) * 100).toFixed(1)
    : '16.4';

  const directSourcingSavingsCr = opportunities
    .filter((o) => o.push_to_module === 'proCPX')
    .reduce((s, o) => s + (o.estimated_savings_inr_cr || 0), 0);

  const contractRulesSavingsCr = opportunities
    .filter((o) => o.push_to_module === 'DPS NXT')
    .reduce((s, o) => s + (o.estimated_savings_inr_cr || 0), 0);

  const getCategoryMetrics = (catName: string) => {
    const catOpps = opportunities.filter((o) => o.category === catName);
    const catSavings = catOpps.reduce((s, o) => s + (o.estimated_savings_inr_cr || 0), 0);
    const catSpend = catOpps.reduce((s, o) => s + (o.baseline_spend_inr_cr || (o.current_spend_usd ? o.current_spend_usd * 83.8 / 10000000 : 0) || 0), 0);
    const targetPct = catSpend > 0 ? `${((catSavings / catSpend) * 100).toFixed(1)}%` : (catSavings > 0 ? `${realizationTargetPct}%` : '0.0%');
    return {
      savingsFound: `₹${catSavings.toFixed(2)} Cr`,
      targetPct,
      progressPct: catSpend > 0 ? Math.min(100, Math.round((catSavings / catSpend) * 100)) : (catSavings > 0 ? 100 : 0)
    };
  };

  const dmMetrics = getCategoryMetrics('Direct Materials');
  const pkgMetrics = getCategoryMetrics('Packaging Materials');
  const mroMetrics = getCategoryMetrics('Indirect & MRO');
  const logMetrics = getCategoryMetrics('Logistics & Freight');

  const categoryBreakdowns = [
    {
      name: UI_STRINGS.module4.categories.directMaterials,
      targetPct: dmMetrics.targetPct,
      savingsFound: dmMetrics.savingsFound,
      color: 'from-cyan-500 to-blue-500',
      textColor: 'text-cyan-700 dark:text-cyan-400',
      progressPct: dmMetrics.progressPct
    },
    {
      name: UI_STRINGS.module4.categories.packagingMaterials,
      targetPct: pkgMetrics.targetPct,
      savingsFound: pkgMetrics.savingsFound,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      progressPct: pkgMetrics.progressPct
    },
    {
      name: UI_STRINGS.module4.categories.indirectMRO,
      targetPct: mroMetrics.targetPct,
      savingsFound: mroMetrics.savingsFound,
      color: 'from-purple-500 to-violet-500',
      textColor: 'text-purple-700 dark:text-purple-400',
      progressPct: mroMetrics.progressPct
    },
    {
      name: UI_STRINGS.module4.categories.logisticsFreight,
      targetPct: logMetrics.targetPct,
      savingsFound: logMetrics.savingsFound,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      progressPct: logMetrics.progressPct
    }
  ];

  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedCategory !== 'ALL' && opp.category !== selectedCategory) return false;
    if (filterModule !== 'ALL' && opp.push_to_module !== filterModule) return false;
    return true;
  });

  if (currentTier === 'BRONZE') {
    return (
      <div className="relative min-h-[500px]">
        <TierMaskOverlay
          title={UI_STRINGS.subscription.savingsWhereLockedTitle}
          description={UI_STRINGS.subscription.stageMaskedBronzeDesc}
          requiredTier="SILVER"
          onUpgrade={() => onUpgrade?.('SILVER')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 border border-emerald-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              {UI_STRINGS.module4.badge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.module4.frRef}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {UI_STRINGS.module4.heading}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {UI_STRINGS.module4.description}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400 text-xs font-bold font-mono">
            <Award className="w-4 h-4" />
            <span>{realizationTargetPct}% Realization Target</span>
          </span>
        </div>
      </div>

      {/* 1. Consolidated Savings Waterfall (Prompt 100: Total Spend -> Addressable -> Identified -> Potential -> Validated -> Approved -> Realized) */}
      <SavingsWaterfallSection waterfallMetrics={consolidatedData?.waterfallMetrics as any} />

      {/* 2. Overlap De-Duplication & Multi-Engine Resolution Table */}
      <OverlapDeduplicationTable
        overlaps={consolidatedData?.overlaps as any}
        opportunities={consolidatedData?.opportunities as any}
        onUpdateStatus={handleUpdateOpportunityStatus}
      />

      {/* 3. Executive Action Plan & Implementation Tracker */}
      <ActionPlanTracker
        actionPlans={consolidatedData?.actionPlans as any}
        onUpdateAction={handleUpdateActionPlan}
      />

      {/* 4. Cross-Module Strategic Sourcing & AI Categorization Savings Summary Banner */}
      <StrategicSavingsSummaryBanner
        summaryMetrics={buildStrategicSavingsSummary({
          opportunities,
          consolidationItems: opportunities.length > 0 ? undefined : [],
          poItems: opportunities.length > 0 ? undefined : [],
          strategicRiskItems: opportunities.length > 0 ? undefined : []
        })}
        onNavigateToSection={handleNavigate}
      />

      {/* 5. Grid: Hero Total Savings Highlight Card (5 cols) + Target vs Realized Distribution (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/80 dark:via-slate-900 dark:to-teal-950/60 border border-emerald-200 dark:border-emerald-500/30 p-6 flex flex-col justify-between glass-panel-glow shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
                {UI_STRINGS.module4.heroBadge}
              </span>
              <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                {realizationTargetPct}% Net Spend
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{UI_STRINGS.module4.enterprisePotential}</span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                ₹{totalSavingsInrCr.toFixed(2)} Cr
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {UI_STRINGS.module4.historicalProcurementNote(totalEvaluatedSpendInrCr)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">{UI_STRINGS.module4.directSourcingLabel}</span>
              <span className="text-cyan-700 dark:text-cyan-400 font-bold text-sm">₹{directSourcingSavingsCr.toFixed(2)} Cr</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">{UI_STRINGS.module4.contractRulesLabel}</span>
              <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">₹{contractRulesSavingsCr.toFixed(2)} Cr</span>
            </div>
          </div>
        </div>

        {/* Category Progress Breakdown */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.module4.distributionTitle}</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{UI_STRINGS.module4.distributionSubtitle}</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryBreakdowns.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-slate-500 dark:text-slate-400">{UI_STRINGS.module4.targetPrefix(cat.targetPct)}</span>
                    <span className={`font-black ${cat.textColor}`}>{cat.savingsFound}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                    style={{ width: `${Math.min(cat.progressPct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Savings Opportunities Action Pipeline Table */}
      {currentTier === 'SILVER' ? (
        <div className="relative min-h-[300px]">
          <TierMaskOverlay
            title={UI_STRINGS.subscription.savingsWhereLockedTitle}
            description={UI_STRINGS.subscription.savingsWhereLockedNote}
            requiredTier="GOLD"
            onUpgrade={() => onUpgrade?.('GOLD')}
          />
        </div>
      ) : (
        <div
          ref={pipelineTableRef}
          id="savings-pipeline-table-section"
          data-testid="savings-pipeline-table-section"
          className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4"
        >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{UI_STRINGS.module4.pipelineTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.module4.pipelineSubtitle}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">{UI_STRINGS.module4.filterCategories.all}</option>
              <option value={UI_STRINGS.module4.categories.directMaterials}>{UI_STRINGS.module4.filterCategories.direct}</option>
              <option value={UI_STRINGS.module4.categories.packagingMaterials}>{UI_STRINGS.module4.filterCategories.packaging}</option>
              <option value={UI_STRINGS.module4.categories.indirectMRO}>{UI_STRINGS.module4.filterCategories.indirect}</option>
              <option value={UI_STRINGS.module4.categories.logisticsFreight}>{UI_STRINGS.module4.filterCategories.logistics}</option>
            </select>

            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">{UI_STRINGS.module4.filterEngines.all}</option>
              <option value="proCPX">{UI_STRINGS.module4.filterEngines.proCPX}</option>
              <option value="DPS NXT">{UI_STRINGS.module4.filterEngines.dpsNXT}</option>
            </select>
          </div>
        </div>

        {/* Pipeline Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.oppIdAndCategory}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.titleAndLeakage}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.currentSpendInrCr}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.targetPct}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module4.tableHeaders.estSavingsInrCr}</th>
                  <th className="py-3 px-4 text-center">{UI_STRINGS.module4.tableHeaders.suiteIntegration}</th>
                  <th className="py-3 px-4 text-right">{UI_STRINGS.module4.tableHeaders.executionAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 font-sans text-xs">
                      Awaiting dataset ingestion. Upload a procurement dataset in Module 1 to generate actionable savings pipelines.
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp) => (
                    <tr
                      key={opp.opp_id}
                      className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-cyan-700 dark:text-cyan-400 block font-mono">
                          {opp.opp_id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">{opp.category}</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{opp.title}</div>
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5">
                          {UI_STRINGS.module4.leakPrefix(opp.contract_leak_type)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        ₹{opp.current_spend_inr_cr?.toFixed(2) || (opp.current_spend * 83.8 / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-cyan-700 dark:text-cyan-400 font-bold">
                        {opp.target_savings_pct}%
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{opp.est_savings_inr_cr?.toFixed(2) || (opp.est_savings * 83.8 / 10000000).toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-center font-sans">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            (opp.push_to_module || opp.recommended_module) === 'proCPX'
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border border-purple-300 dark:border-purple-800/60'
                          }`}
                        >
                          {opp.push_to_module || opp.recommended_module || 'proCPX'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        {opp.status === 'Pushed to proCPX' || opp.status === 'Pushed to DPS NXT' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/50 text-xs font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>{UI_STRINGS.module4.pushedBadge}</span>
                          </span>
                        ) : (opp.push_to_module || opp.recommended_module) === 'proCPX' ? (
                          <button
                            type="button"
                            onClick={() => onOpenProCPX(opp)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all shadow-xs active:scale-95 flex items-center space-x-1 ml-auto cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>{UI_STRINGS.module4.pushToProCPX}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenDPSNXT(opp)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-all shadow-xs active:scale-95 flex items-center space-x-1 ml-auto cursor-pointer"
                          >
                            <FileCheck className="w-3 h-3" />
                            <span>{UI_STRINGS.module4.pushToDPSNXT}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* CTA to Executive Brief & Conversion Matrix */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{UI_STRINGS.module4.ctaSubtitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onProceedToConversion}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <span>{UI_STRINGS.module4.ctaProceedButton}</span>
          </button>
          <a
            href="/executive-brief"
            data-testid="module4-open-brief-btn"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') window.location.href = '/executive-brief';
            }}
            className="flex items-center justify-center space-x-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl shadow-md shadow-cyan-600/20 transition-all transform active:scale-95 group cursor-pointer"
          >
            <span>Generate Executive Brief</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};
