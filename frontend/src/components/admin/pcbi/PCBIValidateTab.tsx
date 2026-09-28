'use client';

/**
 * PCBI Validation Sub-Tab — Data Quality Audit & Non-Silent Error Diagnostics
 * Orchestrates Summary Cards, Constituent Review, Issues Table, and Import Gate
 */

import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import { PCBIValidationSummaryCards } from './PCBIValidationSummaryCards';
import { PCBIConstituentReviewTable } from './PCBIConstituentReviewTable';
import { PCBIValidationIssuesTable } from './PCBIValidationIssuesTable';
import type { PCBIValidateTabProps } from '../../../types/components';

export const PCBIValidateTab: React.FC<PCBIValidateTabProps> = ({
  validationSummary,
  onProceedToPreview
}) => {
  if (!validationSummary) {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
        <Info size={32} className="mx-auto text-slate-500" />
        <h4 className="text-sm font-bold text-slate-300">No Validation Data Available</h4>
        <p className="text-xs text-slate-500">
          Upload a PCBI Master file to execute automated structural validation.
        </p>
      </div>
    );
  }

  const hasBlockingErrors = validationSummary.blockingErrorCount > 0;

  return (
    <div className="space-y-6">
      {/* 5 KPI Metric Cards, Dataset Breakdown & 9-Box Audit Grid */}
      <PCBIValidationSummaryCards summary={validationSummary} />

      {/* Constituent Weight Integrity Review Table (SUM(weight) = 100%) */}
      {validationSummary.constituentTotals && validationSummary.constituentTotals.length > 0 && (
        <PCBIConstituentReviewTable constituentTotals={validationSummary.constituentTotals} />
      )}

      {/* Interactive Diagnostics Issues Table (ALL / ERRORS / WARNINGS / INFORMATION) */}
      <PCBIValidationIssuesTable
        issues={validationSummary.issues}
        blockingErrorCount={validationSummary.blockingErrorCount}
        warningCount={validationSummary.warningCount}
        informationCount={validationSummary.informationCount}
      />

      {/* Gate Enforcement Banner & Proceed Action */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {hasBlockingErrors ? (
          <div className="flex items-center gap-2.5 text-xs text-rose-300">
            <ShieldAlert size={18} className="text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-200">
                {UI_STRINGS.pcbiAdmin.blockingGateNotice}
              </p>
              <p className="text-[11px] text-rose-400/80">
                Resolve {validationSummary.blockingErrorCount} blocking error(s) before file import can be executed.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">
                {UI_STRINGS.pcbiAdmin.readyForImport}
              </p>
              <p className="text-[11px] text-emerald-400/80">
                {validationSummary.warningCount} audit warnings recorded. Import is fully authorized.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onProceedToPreview}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95 shrink-0"
        >
          <span>{UI_STRINGS.pcbiAdmin.proceedToPreview}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
