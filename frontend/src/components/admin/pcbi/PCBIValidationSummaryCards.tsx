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
        <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl">
          <span className="text-[11px] font-semibold text-[#475569] tracking-wider">
            {UI_STRINGS.pcbiAdmin.totalRecords}
          </span>
          <div className="text-2xl font-black text-[#0B1B33] mt-1 tabular-nums">
            {(summary.totalRecords ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-[#64748B]">All Worksheets</span>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.validRecords}</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
            {(summary.validRecords ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600">Ready for Import</span>
        </div>

        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.blockingErrors}</span>
            <ShieldAlert size={14} className="text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">
            {(summary.blockingErrorCount ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-600">Must Be 0 to Import</span>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-700 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.warnings}</span>
            <AlertTriangle size={14} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">
            {(summary.warningCount ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-600">Recorded in Audit</span>
        </div>

        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-sky-700 tracking-wider">
            <span>{UI_STRINGS.pcbiAdmin.information}</span>
            <Info size={14} className="text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1 tabular-nums">
            {(summary.informationCount ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-sky-600">Pending / Metadata</span>
        </div>
      </div>

      {/* Dataset Record Breakdown */}
      <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-[#0B1B33] uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} className="text-[#0284C7]" />
          {UI_STRINGS.pcbiAdmin.datasetBreakdownTitle}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-[#EEF7FF] border border-[#DCE7F5] rounded-lg">
            <span className="text-[10px] text-[#475569] uppercase font-semibold flex items-center gap-1.5">
              <Database size={12} className="text-[#0284C7]" />
              {UI_STRINGS.pcbiAdmin.pcbiMasterRecords}
            </span>
            <p className="text-base font-bold text-[#0B1B33] mt-1 tabular-nums">
              {(summary.masterRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-[#EEF7FF] border border-[#DCE7F5] rounded-lg">
            <span className="text-[10px] text-[#475569] uppercase font-semibold flex items-center gap-1.5">
              <FileSpreadsheet size={12} className="text-[#0284C7]" />
              {UI_STRINGS.pcbiAdmin.weeklyIndexRecords}
            </span>
            <p className="text-base font-bold text-[#0284C7] mt-1 tabular-nums">
              {(summary.weeklyRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="text-[10px] text-[#475569] uppercase font-semibold flex items-center gap-1.5">
              <Layers size={12} className="text-purple-600" />
              {UI_STRINGS.pcbiAdmin.constituentRecords}
            </span>
            <p className="text-base font-bold text-purple-700 mt-1 tabular-nums">
              {(summary.constituentRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-[10px] text-[#475569] uppercase font-semibold flex items-center gap-1.5">
              <Globe size={12} className="text-emerald-600" />
              {UI_STRINGS.pcbiAdmin.sourceRecords}
            </span>
            <p className="text-base font-bold text-emerald-700 mt-1 tabular-nums">
              {(summary.sourceRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#475569] uppercase font-semibold flex items-center gap-1.5">
              <Tag size={12} className="text-amber-600" />
              {UI_STRINGS.pcbiAdmin.unspscMappingRecords}
            </span>
            <p className="text-base font-bold text-amber-700 mt-1 tabular-nums">
              {(summary.unspscRecordsCount ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 9-Box Data Quality & Audit Indicators Grid */}
      <div className="p-4 bg-white border border-[#DCE7F5] rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-[#0B1B33] uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          {UI_STRINGS.pcbiAdmin.auditBreakdownTitle}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          <div className="p-2.5 bg-[#EEF7FF] border border-[#DCE7F5] rounded-lg flex items-center justify-between">
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.uniquePcbiIds}</span>
            <span className="text-sm font-bold text-[#0B1B33] tabular-nums">{summary.uniquePcbiIdsCount ?? 0}</span>
          </div>

          <div
            className={`p-2.5 border rounded-lg flex items-center justify-between ${
              (summary.duplicateTechnicalIdsCount ?? 0) > 0
                ? 'border-rose-300 bg-rose-50'
                : 'border-[#DCE7F5] bg-[#EEF7FF]'
            }`}
          >
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.duplicateTechnicalIds}</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                (summary.duplicateTechnicalIdsCount ?? 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {summary.duplicateTechnicalIdsCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 border rounded-lg flex items-center justify-between ${
              (summary.missingQualityCount ?? 0) > 0 ? 'border-amber-300 bg-amber-50' : 'border-[#DCE7F5] bg-[#EEF7FF]'
            }`}
          >
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.missingQuality}</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                (summary.missingQualityCount ?? 0) > 0 ? 'text-amber-700' : 'text-[#475569]'
              }`}
            >
              {summary.missingQualityCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 border rounded-lg flex items-center justify-between ${
              (summary.missingBenchmarkabilityCount ?? 0) > 0
                ? 'border-amber-300 bg-amber-50'
                : 'border-[#DCE7F5] bg-[#EEF7FF]'
            }`}
          >
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.missingBenchmarkability}</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                (summary.missingBenchmarkabilityCount ?? 0) > 0 ? 'text-amber-700' : 'text-[#475569]'
              }`}
            >
              {summary.missingBenchmarkabilityCount ?? 0}
            </span>
          </div>

          <div className="p-2.5 bg-[#EEF7FF] border border-[#DCE7F5] rounded-lg flex items-center justify-between">
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.missingSource}</span>
            <span className="text-sm font-bold text-[#475569] tabular-nums">{summary.missingSourceCount ?? 0}</span>
          </div>

          <div className="p-2.5 bg-[#EEF7FF] border border-[#DCE7F5] rounded-lg flex items-center justify-between">
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.missingUnspsc}</span>
            <span className="text-sm font-bold text-[#475569] tabular-nums">{summary.missingUnspscCount ?? 0}</span>
          </div>

          <div
            className={`p-2.5 border rounded-lg flex items-center justify-between ${
              (summary.invalidIndexValuesCount ?? 0) > 0 ? 'border-rose-300 bg-rose-50' : 'border-[#DCE7F5] bg-[#EEF7FF]'
            }`}
          >
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.invalidIndexValues}</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                (summary.invalidIndexValuesCount ?? 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {summary.invalidIndexValuesCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 border rounded-lg flex items-center justify-between ${
              (summary.duplicateWeeklyRecordsCount ?? 0) > 0
                ? 'border-rose-300 bg-rose-50'
                : 'border-[#DCE7F5] bg-[#EEF7FF]'
            }`}
          >
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.duplicateWeeklyRecords}</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                (summary.duplicateWeeklyRecordsCount ?? 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {summary.duplicateWeeklyRecordsCount ?? 0}
            </span>
          </div>

          <div
            className={`p-2.5 border rounded-lg flex items-center justify-between ${
              (summary.constituentWeightIssuesCount ?? 0) > 0
                ? 'border-amber-300 bg-amber-50'
                : 'border-[#DCE7F5] bg-[#EEF7FF]'
            }`}
          >
            <span className="text-xs text-[#475569]">{UI_STRINGS.pcbiAdmin.constituentWeightIssues}</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                (summary.constituentWeightIssuesCount ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
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
