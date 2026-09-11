'use client';
import React, { useEffect, useCallback } from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import type { StrategicRiskMitigationModalProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const StrategicRiskMitigationModal: React.FC<StrategicRiskMitigationModalProps> = ({
  item,
  isOpen,
  onClose
}) => {
  const modalStrings = UI_STRINGS.module2.strategicVendorRisk.modal;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !item) {
    return null;
  }

  const isSoleSource = item.risk_level === 'SOLE_SOURCE_CRITICAL' || !item.secondary_vendor;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="strategic-risk-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isSoleSource
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                {isSoleSource ? '100% SOLE SOURCE CRITICAL' : 'DOMINANT VENDOR: SECONDARY < 10%'}
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {item.material_code}
              </span>
            </div>
            <h3 id="strategic-risk-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              {item.material_desc}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {modalStrings.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Spend</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">₹{item.total_spend_inr_cr.toFixed(2)} Cr</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Annual Volume</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{item.annual_quantity.toLocaleString()} {item.unit_of_measure}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">PO Frequency</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{item.po_count} Orders / Yr</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">UNSPSC Col L</span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{item.unspsc_code}</span>
            </div>
          </div>

          {/* Supplier Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-cyan-600" />
              <span>{modalStrings.vendorBreakdownTitle}</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-left">
                  <tr>
                    <th className="py-2 px-3">{modalStrings.vendorCol}</th>
                    <th className="py-2 px-3 text-right">{modalStrings.spendCol}</th>
                    <th className="py-2 px-3 text-right">{modalStrings.shareCol}</th>
                    <th className="py-2 px-3">{modalStrings.statusCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Primary Vendor Row */}
                  <tr className="bg-white dark:bg-slate-900">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {item.primary_vendor.vendor_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{item.primary_vendor.spend_inr_cr.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {item.primary_vendor.share_percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        {isSoleSource ? modalStrings.soleSourceRole : modalStrings.dominantRole}
                      </span>
                    </td>
                  </tr>

                  {/* Secondary Vendor Row if present */}
                  {item.secondary_vendor && (
                    <tr className="bg-amber-50/20 dark:bg-amber-950/10">
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {item.secondary_vendor.vendor_name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        ₹{item.secondary_vendor.spend_inr_cr.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {item.secondary_vendor.share_percentage.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          {modalStrings.secondarySingleDigitRole}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Diagnostic Box */}
          <div
            className={`p-3.5 rounded-xl border space-y-1.5 ${
              isSoleSource
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider">
              {isSoleSource ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
              <span>{modalStrings.riskAnalysisTitle}</span>
            </div>
            <p className="text-xs leading-relaxed">
              {isSoleSource ? modalStrings.riskAnalysisSoleSourceText : modalStrings.riskAnalysisDominantText}
            </p>
            <p className="text-xs font-semibold pt-1 border-t border-rose-200/40 dark:border-rose-800/40">
              {item.actionable_mitigation}
            </p>
          </div>

          {/* Action Roadmap */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{modalStrings.mitigationRoadmapTitle}</span>
            </h4>
            <div className="space-y-2">
              {item.suggested_action_plan.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start space-x-2 text-xs"
                >
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                    Step {idx + 1}:
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {modalStrings.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
