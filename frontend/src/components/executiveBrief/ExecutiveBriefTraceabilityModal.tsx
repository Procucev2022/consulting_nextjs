'use client';
import React from 'react';
import { X, ArrowDown, Database } from 'lucide-react';
import type { ExecutiveBriefTraceabilityModalProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefTraceabilityModal: React.FC<ExecutiveBriefTraceabilityModalProps> = ({
  isOpen,
  onClose,
  activeItem,
  items
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;
  const current = activeItem || items[0] || null;

  if (!isOpen || !current) return null;

  const lineageSteps = [
    { label: strings.traceability.findingId, value: current.findingId, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' },
    { label: strings.traceability.module, value: current.module, color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' },
    { label: strings.traceability.category, value: current.category, color: 'text-purple-400 bg-purple-950/80 border-purple-800' },
    { label: strings.traceability.item, value: current.item, color: 'text-sky-400 bg-sky-950/80 border-sky-800' },
    { label: strings.traceability.supplier, value: current.supplier, color: 'text-amber-400 bg-amber-950/80 border-amber-800' },
    { label: strings.traceability.erpRecord, value: current.erpRecord, color: 'text-slate-300 bg-slate-900 border-slate-700' },
    { label: strings.traceability.calculation, value: current.calculation, color: 'text-yellow-400 bg-yellow-950/80 border-yellow-800' },
    { label: strings.traceability.opportunity, value: current.opportunity, color: 'text-blue-400 bg-blue-950/80 border-blue-800' },
    { label: strings.traceability.savings, value: current.savings, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800 font-extrabold' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="traceability-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 id="traceability-modal-title" className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                {strings.traceability.modalTitle}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {current.findingId} • Forensic ERP Audit Chain
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-traceability-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Traceability Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 9-Step Vertical Traceability Pipeline */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-2">
          {lineageSteps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{step.label}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${step.color} truncate max-w-full sm:max-w-[360px]`}>
                  {step.value}
                </div>
              </div>

              {idx < lineageSteps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-cyan-500/70" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            100% Traceable to Verified Purchase Transactions
          </span>
          <button
            type="button"
            data-testid="close-traceability-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            {strings.traceability.close}
          </button>
        </div>
      </div>
    </div>
  );
};
