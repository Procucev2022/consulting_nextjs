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
      <div className="p-6 bg-white border border-[#DCE7F5] rounded-2xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-sky-50 text-[#0284C7] border border-sky-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#0284C7]" />
                Active Published Baseline
              </span>
              <span className="text-xl font-extrabold text-[#0B1B33] tracking-tight">
                {activeVersion ? activeVersion.version : 'V1.0'}
              </span>
              <span className="text-xs text-[#475569] font-mono">
                ({activeVersion ? activeVersion.file_name : 'PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx'})
              </span>
            </div>
            <p className="text-sm text-[#475569] max-w-2xl leading-relaxed">
              {UI_STRINGS.pcbiAdmin.publishedVersionsSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-[#0284C7]" />
                Uploaded: {activeVersion ? new Date(activeVersion.upload_date).toLocaleDateString() : '2026-01-01'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-[#0284C7]" />
                Coverage: {metrics?.date_start || '2020-04-01'} to {metrics?.date_end || '2026-07-31'}
              </span>
              <span className="flex items-center gap-1">
                <FileCheck size={13} className="text-[#0284C7]" />
                Effective Engine: Module 3 PCBI Trend Analysis
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <UploadCloud size={15} />
              {UI_STRINGS.pcbiAdmin.uploadButton}
            </button>
            <button
              type="button"
              onClick={onNavigateToVersions}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#475569] border border-[#DCE7F5] rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs"
            >
              <Layers size={15} />
              {UI_STRINGS.pcbiAdmin.tabVersionHistory}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalPCBIRecords}</span>
            <Database size={14} className="text-[#0284C7]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1B33] mt-2 tabular-nums">{metrics?.benchmark_count || 290}</div>
          <span className="text-[10px] text-[#0284C7] font-medium">Primary Benchmarks</span>
        </div>

        <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalWeeklyIndexRecords}</span>
            <TrendingUp size={14} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#0B1B33] mt-2 tabular-nums">{(metrics?.weekly_records_count || 95700).toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Weekly Data Points</span>
        </div>

        <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalConstituentRecords}</span>
            <Layers size={14} className="text-[#0284C7]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1B33] mt-2 tabular-nums">{metrics?.constituent_count || 290}</div>
          <span className="text-[10px] text-[#0284C7] font-medium">Cost Driver Models</span>
        </div>

        <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalUNSPSCMappingRecords}</span>
            <FileCheck size={14} className="text-[#F97316]" />
          </div>
          <div className="text-2xl font-bold text-[#0B1B33] mt-2 tabular-nums">{metrics?.unspsc_mappings_count || 73}</div>
          <span className="text-[10px] text-[#F97316] font-medium">Automated Mappings</span>
        </div>

        <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>{UI_STRINGS.pcbiAdmin.totalBenchmarkablePct}</span>
            <Award size={14} className="text-[#0284C7]" />
          </div>
          <div className="text-2xl font-bold text-[#0284C7] mt-2 tabular-nums">{metrics?.total_benchmarkable_pct?.toFixed(1) || '75.8'}%</div>
          <span className="text-[10px] text-[#0284C7] font-medium">Average Coverage</span>
        </div>

        <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Quality Rating</span>
            <Award size={14} className="text-emerald-600" />
          </div>
          <div className="text-xs font-bold text-[#0B1B33] mt-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-emerald-600">A Quality:</span>
              <span className="tabular-nums">{metrics?.a_quality_count || 240}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-600">B Quality:</span>
              <span className="tabular-nums">{metrics?.b_quality_count || 45}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-600">C Quality:</span>
              <span className="tabular-nums">{metrics?.c_quality_count || 5}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PCBI V1.3.1 Independent Governance Dimensions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimension 1: PCBI Definition Status */}
        <div className="p-5 bg-white border border-[#DCE7F5] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Database size={16} className="text-[#0284C7]" />
                {UI_STRINGS.pcbiAdmin.definitionStatusTitle}
              </h3>
              <p className="text-xs text-[#475569] mt-0.5">
                {UI_STRINGS.pcbiAdmin.definitionStatusSubtitle}
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-sky-50 text-[#0284C7] border border-sky-200 rounded-lg">
              Dimension 1
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.definedLabel}
              </span>
              <span className="text-xl font-extrabold text-[#0B1B33] mt-1 block tabular-nums">13</span>
              <span className="text-[10px] text-[#64748B]">Catalogued</span>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.missingLabel}
              </span>
              <span className="text-xl font-extrabold text-rose-800 mt-1 block tabular-nums">1</span>
              <span className="text-[10px] text-[#64748B]">Uncatalogued</span>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.underReviewLabel}
              </span>
              <span className="text-xl font-extrabold text-amber-800 mt-1 block tabular-nums">1</span>
              <span className="text-[10px] text-[#64748B]">Pending Review</span>
            </div>

            <div className="p-3 bg-slate-50 border border-[#DCE7F5] rounded-xl">
              <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.notBenchmarkableLabel}
              </span>
              <span className="text-xl font-extrabold text-[#0B1B33] mt-1 block tabular-nums">1</span>
              <span className="text-[10px] text-[#64748B]">Services Excluded</span>
            </div>
          </div>
        </div>

        {/* Dimension 2: PCBI Historical Data Status */}
        <div className="p-5 bg-white border border-[#DCE7F5] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
                <Clock size={16} className="text-emerald-600" />
                {UI_STRINGS.pcbiAdmin.dataStatusTitle}
              </h3>
              <p className="text-xs text-[#475569] mt-0.5">
                {UI_STRINGS.pcbiAdmin.dataStatusSubtitle}
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              Dimension 2
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.completeDataLabel}
              </span>
              <span className="text-lg font-bold text-[#0B1B33] mt-0.5 block tabular-nums">2</span>
              <span className="text-[9px] text-[#64748B]">Full 2020-2026</span>
            </div>

            <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl">
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.partialHistoryLabel}
              </span>
              <span className="text-lg font-bold text-amber-800 mt-0.5 block tabular-nums">7</span>
              <span className="text-[9px] text-[#64748B]">Gap Backfill Req</span>
            </div>

            <div className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-xl">
              <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.noHistoryLabel}
              </span>
              <span className="text-lg font-bold text-rose-800 mt-0.5 block tabular-nums">2</span>
              <span className="text-[9px] text-[#64748B]">Zero Observations</span>
            </div>

            <div className="p-2.5 bg-purple-50/60 border border-purple-200 rounded-xl">
              <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.freqMismatchLabel}
              </span>
              <span className="text-lg font-bold text-[#0B1B33] mt-0.5 block tabular-nums">2</span>
              <span className="text-[9px] text-[#64748B]">Monthly vs Weekly</span>
            </div>

            <div className="p-2.5 bg-sky-50/60 border border-sky-200 rounded-xl">
              <span className="text-[10px] font-semibold text-[#0284C7] uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.specMismatchLabel}
              </span>
              <span className="text-lg font-bold text-[#0284C7] mt-0.5 block tabular-nums">1</span>
              <span className="text-[9px] text-[#64748B]">Grade / Form Mismatch</span>
            </div>

            <div className="p-2.5 bg-orange-50/60 border border-orange-200 rounded-xl">
              <span className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider block">
                {UI_STRINGS.pcbiAdmin.sourceUnverifiedLabel}
              </span>
              <span className="text-lg font-bold text-orange-800 mt-0.5 block tabular-nums">2</span>
              <span className="text-[9px] text-[#64748B]">Candidate Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Materiality Governance Rule Notice */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-4 text-xs text-[#475569] shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center shrink-0 text-[#0284C7] font-bold">
          !
        </div>
        <div className="space-y-1">
          <span className="font-bold text-[#0B1B33] uppercase tracking-wider text-[11px] block">
            Critical Materiality Governance Rule
          </span>
          <p className="text-[#475569] leading-relaxed">
            {UI_STRINGS.pcbiAdmin.criticalMaterialityRuleNotice}
          </p>
        </div>
      </div>
    </div>
  );
};

