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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-md bg-white border border-[#DCE7F5] rounded-2xl shadow-2xl overflow-hidden text-[#0B1B33] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE7F5]">
          <div className="flex items-center gap-2 text-[#0284C7]">
            <RefreshCw className="w-5 h-5" />
            <h3 id="regenerate-modal-title" className="text-sm font-extrabold text-[#0B1B33]">
              {strings.regenerationModal.title}
            </h3>
          </div>
          <button
            type="button"
            data-testid="close-regenerate-modal-btn"
            onClick={onClose}
            disabled={isRegenerating}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0B1B33] hover:bg-[#EEF7FF] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close Confirmation Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#475569]">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200">
            <AlertCircle className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold text-[#0B1B33]">
              {strings.regenerationModal.question}
            </p>
          </div>
          <p className="text-[#64748B] leading-relaxed text-[11px]">
            {strings.regenerationModal.explanation} Source procurement transaction databases will remain unchanged.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#DCE7F5]">
          <button
            type="button"
            data-testid="cancel-regenerate-btn"
            onClick={onClose}
            disabled={isRegenerating}
            className="px-4 py-2 rounded-xl bg-white border border-[#DCE7F5] hover:bg-[#F8FBFE] text-[#0B1B33] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {strings.regenerationModal.cancelButton}
          </button>
          <button
            type="button"
            data-testid="confirm-regenerate-btn"
            onClick={onConfirm}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{isRegenerating ? strings.formats.regenerating : strings.regenerationModal.confirmButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
