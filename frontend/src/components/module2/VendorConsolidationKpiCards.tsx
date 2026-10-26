'use client';

import React from 'react';
import {
  Layers, ShieldCheck, TrendingDown, Users, Package, Factory, HelpCircle, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import type { VendorConsolidationResult } from '../../types/module2VendorConsolidation';
import { UI_STRINGS } from '../../constants';

interface VendorConsolidationKpiCardsProps {
  result: VendorConsolidationResult;
}

export const VendorConsolidationKpiCards: React.FC<VendorConsolidationKpiCardsProps> = ({ result }) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const cov = result.coverageSummary;

  return (
    <div className="space-y-4">
      {/* Classification Coverage Waterfall Banner */}
      {cov && (
        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-900/90 dark:via-blue-950/40 dark:to-purple-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-200">
                Material UNSPSC Classification Coverage Waterfall
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>100.0% Workflow Coverage</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Taxonomy: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">UNSPSC UNv260801</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
            {/* 1. Taxonomy Verified */}
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Taxonomy-Verified</span>
                </span>
                <span className="text-xs font-mono font-black">
                  {(cov.taxonomyVerifiedSpendPct ?? cov.approvedSpendPct)}% Spend
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                ₹{(cov.taxonomyVerifiedSpendCr ?? cov.approvedSpendCr).toFixed(4)} Cr
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {cov.taxonomyVerifiedCount ?? cov.approvedCount} materials (
                {(cov.taxonomyVerifiedMaterialPct ?? cov.approvedMaterialPct)}% of total)
              </div>
            </div>

            {/* 2. Provisional Classification */}
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-200 dark:border-blue-900/40">
              <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Provisional</span>
                </span>
                <span className="text-xs font-mono font-black">{cov.provisionalSpendPct}% Spend</span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                ₹{cov.provisionalSpendCr.toFixed(4)} Cr
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {cov.provisionalCount} materials ({cov.provisionalMaterialPct}% of total)
              </div>
            </div>

            {/* 3. Awaiting Review */}
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Awaiting Review</span>
                </span>
                <span className="text-xs font-mono font-black">{cov.awaitingReviewSpendPct}% Spend</span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                ₹{cov.awaitingReviewSpendCr.toFixed(4)} Cr
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {cov.awaitingReviewCount} materials ({cov.awaitingReviewMaterialPct}% of total)
              </div>
            </div>

            {/* 4. Client-Approved Mapping */}
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-purple-200 dark:border-purple-900/40">
              <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Client-Approved</span>
                </span>
                <span className="text-xs font-mono font-black">
                  {cov.clientApprovedSpendPct ?? 0}% Spend
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                ₹{(cov.clientApprovedSpendCr ?? 0).toFixed(4)} Cr
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {cov.clientApprovedCount ?? 0} materials ({cov.clientApprovedMaterialPct ?? 0}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial & Governed Opportunity Measures */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* 1. Total Spend Reviewed */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase">{strings.cardTotalSpend}</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
            ₹{result.totalAssessmentSpendCr.toFixed(4)} Cr
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {result.categoriesAnalysedCount} {strings.cardCategoriesAnalysed.toLowerCase()}
          </div>
        </div>

        {/* 2. Same-Material Multi-Sourcing Spend */}
        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase">{strings.cardAddressableSpend}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-blue-900 dark:text-blue-200 font-mono">
            ₹{result.sameMaterialMultiSourcingSpendCr.toFixed(4)} Cr
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
            {result.multiSourcedMaterialsCount} multi-sourced items
          </div>
        </div>

        {/* 3. Category-Level Consolidation Candidate Spend */}
        <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/40">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase">{strings.cardCategoryConsolidation}</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-black text-purple-900 dark:text-purple-200 uppercase tracking-tight">
            {strings.statusNotYetQuantifiable}
          </div>
          <div className="text-[10px] text-purple-700 dark:text-purple-400 mt-0.5 leading-tight">
            {result.categoryConsolidationOpportunitiesCount} multi-vendor categories
          </div>
        </div>

        {/* 4. Estimated Savings (Governed Not Yet Quantifiable) */}
        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase">{strings.cardEstimatedSavings}</span>
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">
            {strings.statusNotYetQuantifiable}
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 leading-tight">
            {strings.cardEstimatedSavingsSubtitle}
          </div>
        </div>

        {/* 5. Commercially Validated Savings */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase">{strings.cardValidatedSavings}</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
            ₹0.0000 Cr
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Validated upon execution
          </div>
        </div>
      </div>

      {/* Operational Baseline Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">{strings.cardSuppliersIdentified}</div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>{result.distinctSuppliersCount}</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">{strings.cardMaterialsAnalysed}</div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-cyan-500" />
            <span>{result.distinctMaterialsCount}</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">{strings.cardMultiSourcedMaterials}</div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            <span>{result.multiSourcedMaterialsCount}</span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">{strings.cardOperatingPlants}</div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-purple-500" />
            <span>{result.distinctPlantsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
