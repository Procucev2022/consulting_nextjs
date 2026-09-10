'use client';
import React from 'react';
import { X, Layers, FileSpreadsheet, Tag, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import type { UNSPSCDetailModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const UNSPSCDetailModal: React.FC<UNSPSCDetailModalProps> = ({
  record,
  isOpen,
  onClose
}) => {
  if (!isOpen || !record) return null;

  const segDigits = record.segmentCode.slice(0, 2);
  const famDigits = record.familyCode.slice(2, 4);
  const clsDigits = record.classCode.slice(4, 6);
  const comDigits = record.commodityCode.slice(6, 8);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unspsc-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-cyan-800 dark:text-cyan-400 font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                  {UI_STRINGS.module2.colLPrefix(record.commodityCode)}
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-300 dark:border-emerald-800">
                  {UI_STRINGS.modals.unspscDetail.badgeLevel}
                </span>
              </div>
              <h3 id="unspsc-detail-title" className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {UI_STRINGS.modals.unspscDetail.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_STRINGS.modals.unspscDetail.closeBtn}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Main Commodity & Class Focus Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50/70 via-sky-50/50 to-blue-50/60 dark:from-cyan-950/40 dark:via-sky-950/20 dark:to-blue-950/40 border border-cyan-200/80 dark:border-cyan-800/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{UI_STRINGS.modals.unspscDetail.commodityTitleLabel}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {record.commodityTitle}
                </h4>
              </div>
              <div className="shrink-0 flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-white dark:bg-slate-900 text-cyan-800 dark:text-cyan-300 px-3 py-1 rounded-lg border border-cyan-300 dark:border-cyan-700 shadow-sm">
                  {record.commodityCode}
                </span>
                {record.coreBucket && (
                  <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800">
                    {record.coreBucket}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-200/60 dark:border-cyan-800/40 flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {UI_STRINGS.modals.unspscDetail.classTitleLabel}:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {record.classTitle}
              </span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-semibold">
                ({record.classCode})
              </span>
            </div>
          </div>

          {/* 4-Level UNSPSC Taxonomy Hierarchy Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{UI_STRINGS.modals.unspscDetail.taxonomyTreeTitle}</span>
              </h5>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {UI_STRINGS.modals.unspscDetail.subtitle}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Level 1: Segment */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-300 dark:border-blue-800">
                  L1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {UI_STRINGS.modals.unspscDetail.level1Name}
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {record.segmentCode}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {record.segmentTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {UI_STRINGS.modals.unspscDetail.level1Desc}
                  </p>
                </div>
              </div>

              {/* Level 2: Family */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-300 dark:border-indigo-800">
                  L2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {UI_STRINGS.modals.unspscDetail.level2Name}
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {record.familyCode}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {record.familyTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {UI_STRINGS.modals.unspscDetail.level2Desc}
                  </p>
                </div>
              </div>

              {/* Level 3: Class */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-300 dark:border-purple-800">
                  L3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {UI_STRINGS.modals.unspscDetail.level3Name}
                    </span>
                    <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      {record.classCode}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {record.classTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {UI_STRINGS.modals.unspscDetail.level3Desc}
                  </p>
                </div>
              </div>

              {/* Level 4: Commodity */}
              <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-700 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-400 dark:border-cyan-600">
                  L4
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center space-x-1.5">
                      <span>{UI_STRINGS.modals.unspscDetail.level4Name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-800 dark:text-cyan-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-cyan-400 dark:border-cyan-700">
                      {record.commodityCode}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {record.commodityTitle}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    {UI_STRINGS.modals.unspscDetail.level4Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Procurement Standards & 8-Digit Structure */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{UI_STRINGS.modals.unspscDetail.digitBreakdownTitle}</span>
            </h5>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                {segDigits} (Seg)
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                {famDigits} (Fam)
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-800">
                {clsDigits} (Cls)
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-1 rounded border border-cyan-300 dark:border-cyan-800 font-bold">
                {comDigits} (Col L)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {UI_STRINGS.modals.unspscDetail.digitBreakdownDesc(segDigits, famDigits, clsDigits, comDigits)}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            {UI_STRINGS.modals.unspscDetail.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
