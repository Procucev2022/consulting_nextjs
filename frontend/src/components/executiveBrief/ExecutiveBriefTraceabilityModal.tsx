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
    { label: strings.traceability.findingId, value: current.findingId, color: 'text-[#0284C7] bg-sky-50 border-sky-200' },
    { label: strings.traceability.module, value: current.module, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { label: strings.traceability.category, value: current.category, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { label: strings.traceability.item, value: current.item, color: 'text-sky-700 bg-sky-50 border-sky-200' },
    { label: strings.traceability.supplier, value: current.supplier, color: 'text-amber-800 bg-amber-50 border-amber-200' },
    { label: strings.traceability.erpRecord, value: current.erpRecord, color: 'text-[#475569] bg-white border-[#DCE7F5]' },
    { label: strings.traceability.calculation, value: current.calculation, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: strings.traceability.opportunity, value: current.opportunity, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: strings.traceability.savings, value: current.savings, color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-extrabold' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="traceability-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#DCE7F5] rounded-2xl shadow-2xl overflow-hidden text-[#0B1B33] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DCE7F5] bg-[#F8FBFE]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-[#0284C7]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 id="traceability-modal-title" className="text-sm sm:text-base font-extrabold tracking-wide text-[#0B1B33]">
                {strings.traceability.modalTitle}
              </h3>
              <p className="text-[11px] text-[#64748B] font-mono">
                {current.findingId} • Forensic ERP Audit Chain
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-traceability-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white border border-[#DCE7F5] hover:bg-[#EEF7FF] text-[#64748B] hover:text-[#0B1B33] transition-colors cursor-pointer"
            aria-label="Close Traceability Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 9-Step Vertical Traceability Pipeline */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-2">
          {lineageSteps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="bg-[#F8FBFE] border border-[#DCE7F5] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white border border-[#DCE7F5] text-[#64748B] text-[10px] font-mono flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">{step.label}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${step.color} truncate max-w-full sm:max-w-[360px]`}>
                  {step.value}
                </div>
              </div>

              {idx < lineageSteps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-[#0284C7]" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DCE7F5] bg-[#F8FBFE] flex items-center justify-between text-xs">
          <span className="text-[#64748B] font-mono text-[11px]">
            100% Traceable to Verified Purchase Transactions
          </span>
          <button
            type="button"
            data-testid="close-traceability-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-[#DCE7F5] hover:bg-[#EEF7FF] text-[#0B1B33] font-semibold transition-colors cursor-pointer"
          >
            {strings.traceability.close}
          </button>
        </div>
      </div>
    </div>
  );
};
