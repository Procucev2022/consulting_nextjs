'use client';

/**
 * PCBI Validation Summary Cards Component
 * Renders Top 5 KPI Cards, Dataset Breakdown, and 9-box Data Quality & Audit Grid
 */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Database,
  Layers,
  FileSpreadsheet,
  Globe,
  Tag
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import type { PCBIValidationSummaryCardsProps } from '../../../types/components';

export const PCBIValidationSummaryCards: React.FC<PCBIValidationSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="space-y-6">
      {/* 5 Top-Level KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
            {UI_STRINGS.pcbiAdmin.totalRecords}
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {(summary.totalRecords ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">All Worksheets</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-emerald-900/50 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.validRecords}</span>
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {(summary.validRecords ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-500">Ready for Import</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-rose-900/50 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-400 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.blockingErrors}</span>
            <ShieldAlert size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {(summary.blockingErrorCount ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-500">Must Be 0 to Import</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-amber-900/50 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.warnings}</span>
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {(summary.warningCount ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-500">Recorded in Audit</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-cyan-900/50 rounded-xl col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.information}</span>
            <Info size={14} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {(summary.informationCount ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-cyan-500">Pending / Metadata</span>
        </div>
      </div>

      {/* Dataset Record Breakdown */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} className="text-cyan-400" />
          {UI_STRINGS.pcbiAdmin.datasetBreakdownTitle}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Database size={12} className="text-cyan-400" />
              {UI_STRINGS.pcbiAdmin.pcbiMasterRecords}
            </span>
            <p className="text-base font-bold text-white mt-1">
              {(summary.masterRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <FileSpreadsheet size={12} className="text-cyan-400" />
              {UI_STRINGS.pcbiAdmin.weeklyIndexRecords}
            </span>
            <p className="text-base font-bold text-cyan-400 mt-1">
              {(summary.weeklyRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Layers size={12} className="text-purple-400" />
              {UI_STRINGS.pcbiAdmin.constituentRecords}
            </span>
            <p className="text-base font-bold text-purple-400 mt-1">
              {(summary.constituentRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Globe size={12} className="text-emerald-400" />
              {UI_STRINGS.pcbiAdmin.sourceRecords}
            </span>
            <p className="text-base font-bold text-emerald-400 mt-1">
              {(summary.sourceRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
              <Tag size={12} className="text-amber-400" />
              {UI_STRINGS.pcbiAdmin.unspscMappingRecords}
            </span>
            <p className="text-base font-bold text-amber-300 mt-1">
              {(summary.unspscRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 9-Box Data Quality & Audit Indicators Grid */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          {UI_STRINGS.pcbiAdmin.auditBreakdownTitle}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.uniquePcbiIds}</span>
            <span className="text-sm font-bold text-white font-mono">{summary.uniquePcbiIdsCount ?? 0}</span>
          </div>

          <div
            className={`p-2.5 bg-slate-950/60 border rounded-lg flex items-center justify-between ${
              (summary.duplicateTechnicalIdsCount ?? 0) > 0
                ? 'border-rose-800/80 bg-rose-950/20 text-rose-300'
                : 'border-slate-800'
            }`}
          >
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.duplicateTechnicalIds}</span>
            <span
              className={`text-sm font-bold font-mono ${
                (summary.duplicateTechnicalIdsCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summary.duplicateTechnicalIdsCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 bg-slate-950/60 border rounded-lg flex items-center justify-between ${
              (summary.missingQualityCount ?? 0) > 0 ? 'border-amber-900/60' : 'border-slate-800'
            }`}
          >
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.missingQuality}</span>
            <span
              className={`text-sm font-bold font-mono ${
                (summary.missingQualityCount ?? 0) > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {summary.missingQualityCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 bg-slate-950/60 border rounded-lg flex items-center justify-between ${
              (summary.missingBenchmarkabilityCount ?? 0) > 0 ? 'border-amber-900/60' : 'border-slate-800'
            }`}
          >
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.missingBenchmarkability}</span>
            <span
              className={`text-sm font-bold font-mono ${
                (summary.missingBenchmarkabilityCount ?? 0) > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {summary.missingBenchmarkabilityCount ?? 0}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.missingSource}</span>
            <span className="text-sm font-bold text-slate-300 font-mono">{summary.missingSourceCount ?? 0}</span>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.missingUnspsc}</span>
            <span className="text-sm font-bold text-slate-300 font-mono">{summary.missingUnspscCount ?? 0}</span>
          </div>

          <div
            className={`p-2.5 bg-slate-950/60 border rounded-lg flex items-center justify-between ${
              (summary.invalidIndexValuesCount ?? 0) > 0
                ? 'border-rose-800/80 bg-rose-950/20'
                : 'border-slate-800'
            }`}
          >
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.invalidIndexValues}</span>
            <span
              className={`text-sm font-bold font-mono ${
                (summary.invalidIndexValuesCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summary.invalidIndexValuesCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 bg-slate-950/60 border rounded-lg flex items-center justify-between ${
              (summary.duplicateWeeklyRecordsCount ?? 0) > 0
                ? 'border-rose-800/80 bg-rose-950/20'
                : 'border-slate-800'
            }`}
          >
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.duplicateWeeklyRecords}</span>
            <span
              className={`text-sm font-bold font-mono ${
                (summary.duplicateWeeklyRecordsCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summary.duplicateWeeklyRecordsCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 bg-slate-950/60 border rounded-lg flex items-center justify-between ${
              (summary.constituentWeightIssuesCount ?? 0) > 0
                ? 'border-amber-900/60 bg-amber-950/20'
                : 'border-slate-800'
            }`}
          >
            <span className="text-xs text-slate-400">{UI_STRINGS.pcbiAdmin.constituentWeightIssues}</span>
            <span
              className={`text-sm font-bold font-mono ${
                (summary.constituentWeightIssuesCount ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {summary.constituentWeightIssuesCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
