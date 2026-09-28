'use client';

/**
 * PCBI Master Admin — Dashboard Sub-Tab
 */

import React from 'react';
import {
  Database,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  UploadCloud,
  FileCheck,
  Award
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import type { PCBIDashboardTabProps } from '../../../types/components';

export const PCBIDashboardTab: React.FC<PCBIDashboardTabProps> = ({
  activeVersion,
  onNavigateToUpload,
  onNavigateToVersions
}) => {
  const metrics = activeVersion?.metrics;

  return (
    <div className="space-y-6">
      {/* Active Production Version Banner */}
      <div className="p-6 bg-slate-900/80 border border-cyan-500/30 rounded-2xl relative overflow-hidden backdrop-blur-md shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-cyan-400" />
                Active Published Baseline
              </span>
              <span className="text-xl font-extrabold text-white tracking-tight">
                {activeVersion ? activeVersion.version : 'V1.0'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({activeVersion ? activeVersion.file_name : 'PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx'})
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {UI_STRINGS.pcbiAdmin.publishedVersionsSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-cyan-400" />
                Uploaded:{' '}
                {activeVersion ? new Date(activeVersion.upload_date).toLocaleDateString() : '2026-01-01'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-cyan-400" />
                Coverage: {metrics?.date_start || '2020-04-01'} to {metrics?.date_end || '2026-07-31'}
              </span>
              <span className="flex items-center gap-1">
                <FileCheck size={13} className="text-cyan-400" />
                Effective Engine: Module 3 PCBI Trend Analysis
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
            >
              <UploadCloud size={15} />
              {UI_STRINGS.pcbiAdmin.uploadButton}
            </button>
            <button
              type="button"
              onClick={onNavigateToVersions}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Layers size={15} />
              {UI_STRINGS.pcbiAdmin.tabVersionHistory}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalPCBIRecords}</span>
            <Database size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics?.benchmark_count || 290}
          </div>
          <span className="text-[10px] text-cyan-400 font-medium">Primary Benchmarks</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalWeeklyIndexRecords}</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {(metrics?.weekly_records_count || 95700).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Weekly Data Points</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalConstituentRecords}</span>
            <Layers size={14} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics?.constituent_count || 290}
          </div>
          <span className="text-[10px] text-purple-400 font-medium">Cost Driver Models</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalUNSPSCMappingRecords}</span>
            <FileCheck size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {metrics?.unspsc_mappings_count || 73}
          </div>
          <span className="text-[10px] text-amber-400 font-medium">Automated Mappings</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalBenchmarkablePct}</span>
            <Award size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2">
            {metrics?.total_benchmarkable_pct?.toFixed(1) || '75.8'}%
          </div>
          <span className="text-[10px] text-cyan-400 font-medium">Average Coverage</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Quality Rating</span>
            <Award size={14} className="text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-slate-200 mt-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-emerald-400">A Quality:</span>
              <span>{metrics?.a_quality_count || 240}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400">B Quality:</span>
              <span>{metrics?.b_quality_count || 45}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-400">C Quality:</span>
              <span>{metrics?.c_quality_count || 5}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PCBI V1.3.1 Independent Governance Dimensions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimension 1: PCBI Definition Status */}
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database size={16} className="text-cyan-400" />
                {UI_STRINGS.pcbiAdmin.definitionStatusTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {UI_STRINGS.pcbiAdmin.definitionStatusSubtitle}
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded-lg">
              Dimension 1
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-slate-950/50 border border-emerald-500/30 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.definedLabel}
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block">13</span>
              <span className="text-[10px] text-slate-400">Catalogued</span>
            </div>

            <div className="p-3 bg-slate-950/50 border border-rose-500/30 rounded-xl">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.missingLabel}
              </span>
              <span className="text-xl font-extrabold text-rose-300 mt-1 block">1</span>
              <span className="text-[10px] text-slate-400">Uncatalogued</span>
            </div>

            <div className="p-3 bg-slate-950/50 border border-amber-500/30 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.underReviewLabel}
              </span>
              <span className="text-xl font-extrabold text-amber-300 mt-1 block">1</span>
              <span className="text-[10px] text-slate-400">Pending Review</span>
            </div>

            <div className="p-3 bg-slate-950/50 border border-slate-700 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.notBenchmarkableLabel}
              </span>
              <span className="text-xl font-extrabold text-slate-300 mt-1 block">1</span>
              <span className="text-[10px] text-slate-400">Services Excluded</span>
            </div>
          </div>
        </div>

        {/* Dimension 2: PCBI Historical Data Status */}
        <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-emerald-400" />
                {UI_STRINGS.pcbiAdmin.dataStatusTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {UI_STRINGS.pcbiAdmin.dataStatusSubtitle}
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded-lg">
              Dimension 2
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 bg-slate-950/50 border border-emerald-500/30 rounded-xl">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.completeDataLabel}
              </span>
              <span className="text-lg font-bold text-white mt-0.5 block">2</span>
              <span className="text-[9px] text-slate-400">Full 2020-2026</span>
            </div>

            <div className="p-2.5 bg-slate-950/50 border border-amber-500/30 rounded-xl">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.partialHistoryLabel}
              </span>
              <span className="text-lg font-bold text-amber-300 mt-0.5 block">7</span>
              <span className="text-[9px] text-slate-400">Gap Backfill Req</span>
            </div>

            <div className="p-2.5 bg-slate-950/50 border border-rose-500/30 rounded-xl">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.noHistoryLabel}
              </span>
              <span className="text-lg font-bold text-rose-300 mt-0.5 block">2</span>
              <span className="text-[9px] text-slate-400">Zero Observations</span>
            </div>

            <div className="p-2.5 bg-slate-950/50 border border-purple-500/30 rounded-xl">
              <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.freqMismatchLabel}
              </span>
              <span className="text-lg font-bold text-purple-300 mt-0.5 block">2</span>
              <span className="text-[9px] text-slate-400">Monthly vs Weekly</span>
            </div>

            <div className="p-2.5 bg-slate-950/50 border border-cyan-500/30 rounded-xl">
              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.specMismatchLabel}
              </span>
              <span className="text-lg font-bold text-cyan-300 mt-0.5 block">1</span>
              <span className="text-[9px] text-slate-400">Grade / Form Mismatch</span>
            </div>

            <div className="p-2.5 bg-slate-950/50 border border-orange-500/30 rounded-xl">
              <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.sourceUnverifiedLabel}
              </span>
              <span className="text-lg font-bold text-orange-300 mt-0.5 block">2</span>
              <span className="text-[9px] text-slate-400">Candidate Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Materiality Governance Rule Notice */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl flex items-center gap-4 text-xs text-slate-300 shadow-md">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 font-bold">
          !
        </div>
        <div className="space-y-1">
          <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
            Critical Materiality Governance Rule
          </span>
          <p className="text-slate-400 leading-relaxed">
            {UI_STRINGS.pcbiAdmin.criticalMaterialityRuleNotice}
          </p>
        </div>
      </div>
    </div>
  );
};

