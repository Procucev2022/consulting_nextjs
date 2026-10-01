'use client';
import React from 'react';
import { RefreshCw, X, AlertCircle, Loader2 } from 'lucide-react';
import type { ExecutiveBriefRegenerateConfirmModalProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefRegenerateConfirmModal: React.FC<ExecutiveBriefRegenerateConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isRegenerating
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="regenerate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <RefreshCw className="w-5 h-5" />
            <h3 id="regenerate-modal-title" className="text-sm font-extrabold text-white">
              {strings.regenerationModal.title}
            </h3>
          </div>
          <button
            type="button"
            data-testid="close-regenerate-modal-btn"
            onClick={onClose}
            disabled={isRegenerating}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close Confirmation Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold text-slate-200">
              {strings.regenerationModal.question}
            </p>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {strings.regenerationModal.explanation} Source procurement transaction databases will remain unchanged.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
          <button
            type="button"
            data-testid="cancel-regenerate-btn"
            onClick={onClose}
            disabled={isRegenerating}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {strings.regenerationModal.cancelButton}
          </button>
          <button
            type="button"
            data-testid="confirm-regenerate-btn"
            onClick={onConfirm}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-600/20"
          >
            {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{isRegenerating ? strings.formats.regenerating : strings.regenerationModal.confirmButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
