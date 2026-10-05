'use client';

import React from 'react';
import { X, FileSpreadsheet, ShieldCheck, Info } from 'lucide-react';
import type { SavingsTypeDetailModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const SavingsTypeDetailModal: React.FC<SavingsTypeDetailModalProps> = ({
  isOpen,
  item,
  jobId,
  onClose,
  onDownload
}) => {
  if (!isOpen || !item) return null;

  const strings = UI_STRINGS.evidence.savingsTypes;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="savings-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {item.initiativeId && (
                  <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300">
                    {item.initiativeId}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-mono">
                  {item.sheetCount} Evidence Sheets
                </span>
              </div>
              <h3 id="savings-detail-title" className="text-sm font-bold text-slate-900 mt-0.5">
                {item.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            {item.description}
          </p>

          {/* Financial Breakdown Grid */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 font-mono">
            {item.grossAmountCr !== undefined && item.grossAmountCr > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{strings.grossLabel}:</span>
                <span className="font-bold text-slate-800">₹{item.grossAmountCr.toFixed(2)} Cr</span>
              </div>
            )}
            {item.overlapAmountCr !== undefined && item.overlapAmountCr > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{strings.overlapLabel}:</span>
                <span className="font-bold text-rose-600">-₹{item.overlapAmountCr.toFixed(2)} Cr</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700">{strings.netLabel}:</span>
              <span className="text-base font-black text-emerald-600">
                ₹{item.netAmountCr.toFixed(2)} Cr
              </span>
            </div>
          </div>

          {/* Compliance & Modelling Note */}
          {item.classificationNote && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{item.classificationNote}</span>
            </div>
          )}

          {/* Audit Verification Badge */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Target Analysis Job: {jobId} | Verified Single Source of Truth</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2.5 p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onDownload(item.savingsType)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{strings.btnEvidenceExcelDownload}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
