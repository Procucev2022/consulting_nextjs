'use client';

import React, { useEffect } from 'react';
import {
  FileSearch,
  Upload,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { PCBIMaterialAuditModalProps } from '../../types/module3GapList';
import { UI_STRINGS } from '../../constants';

export const PCBIMaterialAuditModal: React.FC<PCBIMaterialAuditModalProps> = ({
  isOpen,
  item,
  onClose,
  onUploadBenchmark,
  onNavigateToMappingReview
}) => {
  const strings = UI_STRINGS.module3.gapList;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) {
    return null;
  }

  const handleUploadClick = (): void => {
    if (onUploadBenchmark) {
      onUploadBenchmark(item);
      onClose();
    }
  };

  const handleMappingReviewClick = (): void => {
    if (onNavigateToMappingReview) {
      onNavigateToMappingReview(item.materialCode);
      onClose();
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'VERIFIED OBSERVATIONS AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'BENCHMARK DEFINED — OBSERVATIONS MISSING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SOURCE IDENTIFIED — DATA NOT ACQUIRED':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'LICENSE REQUIRED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'MAPPING / SPECIFICATION REVIEW REQUIRED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'NO SUITABLE BENCHMARK IDENTIFIED':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'UNMAPPED — RESEARCH REQUIRED':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-audit-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {strings.auditBadgeModal}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                {item.materialCode}
              </span>
              {item.unspscCode && item.unspscCode !== 'N/A' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  UNSPSC: {item.unspscCode}
                </span>
              )}
            </div>
            <h3
              id="material-audit-modal-title"
              className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2"
            >
              <FileSearch className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>
                {strings.drillDownTitle}: {item.materialDescription}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{strings.auditModalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title={strings.drillDownClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Grid of Key Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Commodity Classification & Spec */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {strings.auditLabelClassification}
              </div>
              <div className="font-bold text-slate-800">{item.commodityClassification}</div>
              <div className="text-[11px] text-slate-600 pt-1">
                <span className="font-semibold text-slate-700">{strings.auditLabelSpecification}: </span>
                {item.existingGradeSpecification}
              </div>
            </div>

            {/* Spend & Transactions */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {strings.auditLabelCustomerSpend}
              </div>
              <div className="font-black text-slate-900 font-mono text-sm">
                ₹{item.customerSpendCr.toFixed(4)} <span className="text-xs font-sans text-slate-500 font-normal">Cr (₹{item.customerSpendInr.toLocaleString('en-IN')})</span>
              </div>
              <div className="text-[11px] text-slate-600 pt-1">
                {item.transactionCount} transactions ({item.spendSharePct.toFixed(2)}% of Borosil Spend)
              </div>
            </div>

            {/* PCBI Series ID */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {strings.auditLabelPcbiSeries}
              </div>
              {item.pcbiSeriesId ? (
                <div>
                  <span className="font-mono text-xs bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded font-bold">
                    {item.pcbiSeriesId}
                  </span>
                  {item.benchmarkSeriesName && (
                    <div className="text-[11px] text-slate-600 mt-1">{item.benchmarkSeriesName}</div>
                  )}
                </div>
              ) : (
                <div className="text-xs font-mono text-rose-600 font-semibold italic">
                  UNMAPPED — NO APPROVED PCBI SERIES
                </div>
              )}
            </div>

            {/* Benchmark Source & Coverage */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {strings.auditLabelBenchmarkSource}
              </div>
              <div className="font-bold text-slate-800">{item.benchmarkPublisherSource}</div>
              <div className="text-[11px] text-slate-600 pt-1">
                <span className="font-semibold text-slate-700">{strings.auditLabelObservationCoverage}: </span>
                {item.observationCoverage}
                {item.latestObservationDate && (
                  <span className="font-mono text-slate-400 ml-1">({item.latestObservationDate})</span>
                )}
              </div>
            </div>
          </div>

          {/* Gap Status & Reason */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {strings.auditLabelGapStatus}
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.gapStatus)}`}>
                {item.gapStatus}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.gapReason}</p>
          </div>

          {/* Recommended Next Action Banner */}
          <div className="p-3.5 bg-indigo-50/90 rounded-xl border border-indigo-200 space-y-1 text-indigo-950">
            <div className="text-[10px] uppercase font-black tracking-wider text-indigo-700">
              {strings.drillDownActionRequired}
            </div>
            <p className="text-xs font-semibold leading-relaxed">{item.nextActionRequired}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {onUploadBenchmark && (
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow-sm cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{strings.btnUploadRequirementBenchmark}</span>
              </button>
            )}
            {onNavigateToMappingReview && (
              <button
                type="button"
                onClick={handleMappingReviewClick}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{strings.auditBtnRouteMapping}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors self-end sm:self-auto"
          >
            {strings.auditBtnClose}
          </button>
        </div>
      </div>
    </div>
  );
};
