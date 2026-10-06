'use client';

/**
 * Detailed Analysis Notification Modal (Prompt 313)
 * Post-Module-1 non-blocking notification informing customer that Spend Summary
 * is available and background detailed procurement analysis is queued (24-48h turnaround).
 */

import React, { useEffect, useCallback } from 'react';
import { Sparkles, Clock, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { UI_STRINGS } from '../../constants';
import type { DetailedAnalysisModalProps } from '../../types';

export function DetailedAnalysisModal({
  isOpen,
  onClose,
  onContinueToModule1,
  onViewSpendSummary,
  job
}: DetailedAnalysisModalProps): React.ReactElement | null {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const handleContinue = (): void => {
    if (onContinueToModule1) {
      onContinueToModule1();
    } else if (onViewSpendSummary) {
      onViewSpendSummary();
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detailed-analysis-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Header */}
        <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-full text-sky-100">
                  {UI_STRINGS.orchestration.statusModule1Ready}
                </span>
                <h3 id="detailed-analysis-modal-title" className="text-lg font-black mt-1 text-white">
                  {UI_STRINGS.orchestration.detailedAnalysisInProgressTitle}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Spend Summary Ready Callout */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900">
              <span className="font-bold block">Spend Summary Available</span>
              <span className="text-emerald-700">
                Your purchase records and multi-currency transactions have been classified and verified.
              </span>
            </div>
          </div>

          {/* Main 24-48h Notification Narrative */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-sky-50/50 border border-sky-100/80">
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {UI_STRINGS.orchestration.detailedAnalysisInProgressMessage}
            </p>
          </div>

          {/* Highlights / Badges Strip */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[#64748B] block text-[11px] font-medium mb-0.5">
                {UI_STRINGS.orchestration.labelAnalysisPeriod}
              </span>
              <span className="font-bold text-slate-900">
                {job?.analysisPeriod || 'FY 2023 - FY 2026'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-[#64748B] block text-[11px] font-medium mb-0.5">
                Target Turnaround SLA
              </span>
              <span className="font-bold text-sky-700 flex items-center gap-1">
                <Clock size={12} />
                <span>24 – 48 Hours</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{UI_STRINGS.orchestration.btnContinueToModule1}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
