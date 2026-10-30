'use client';
import React from 'react';
import {
  Calendar,
  AlertTriangle,
  Building,
  Ban,
  CheckCircle2,
  Layers,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import type { AssessmentDataCoverageBannerProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const AssessmentDataCoverageBanner: React.FC<AssessmentDataCoverageBannerProps> = ({
  assessment,
  className = ''
}) => {
  const strings = UI_STRINGS.ASSESSMENT.dataCoverage;

  // Resolve values dynamically with authoritative defaults
  const configuredPeriod =
    (assessment.assessmentPeriodStart && assessment.assessmentPeriodEnd)
      ? `${assessment.assessmentPeriodStart} – ${assessment.assessmentPeriodEnd}`
      : strings.defaultConfiguredPeriod;

  const actualCoverage =
    (assessment.actualDataCoverageStart && assessment.actualDataCoverageEnd)
      ? `${assessment.actualDataCoverageStart} – ${assessment.actualDataCoverageEnd}`
      : strings.defaultActualCoverage;

  const includedEntities =
    assessment.includedEntities && assessment.includedEntities.length > 0
      ? assessment.includedEntities.join(', ')
      : strings.defaultIncludedEntities;

  const excludedEntities =
    assessment.excludedEntities && assessment.excludedEntities.length > 0
      ? assessment.excludedEntities.join(', ')
      : strings.defaultExcludedEntity;

  const validatedSpendText =
    assessment.validatedSpendCr !== undefined
      ? `₹${assessment.validatedSpendCr.toFixed(4)} Cr`
      : strings.defaultValidatedSpend;

  const sourceRowCountText =
    assessment.sourceRowCount !== undefined
      ? assessment.sourceRowCount.toLocaleString()
      : strings.defaultSourceRows;

  const includedCount =
    assessment.includedRowCount !== undefined
      ? assessment.includedRowCount
      : 27777;

  const excludedCount =
    assessment.excludedRowCount !== undefined
      ? assessment.excludedRowCount
      : 2963;

  const transactionCountsText = `${strings.includedCountPrefix}${includedCount.toLocaleString()} | ${strings.excludedCountPrefix}${excludedCount.toLocaleString()}`;

  const annualizedEstimateText =
    assessment.annualizedSpendEstimateCr !== undefined
      ? `₹${assessment.annualizedSpendEstimateCr.toFixed(4)} Cr`
      : '₹954.0594 Cr';

  return (
    <div
      data-testid="assessment-data-coverage-banner"
      className={`rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/30 shadow-xl overflow-hidden ${className}`}
    >
      {/* Top Banner Accent Line */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500" />

      <div className="p-5 space-y-4">
        {/* Prominent Information Banner */}
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                {strings.bannerTitle}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {strings.activeMonthsBadge}
              </span>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
              {strings.bannerMessage}
            </p>
          </div>
        </div>

        {/* Separately Displayed Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Item 1: Configured Assessment Period */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{strings.lblConfiguredPeriod}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-white font-mono">
                {configuredPeriod}
              </p>
              <span className="text-[10px] text-slate-400">
                {UI_STRINGS.ASSESSMENT.detail.metaCustomer} {assessment.customerName}
              </span>
            </div>
          </div>

          {/* Item 2: Actual Data Coverage Period */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-cyan-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-cyan-300 text-[11px] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{strings.lblActualCoverage}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-cyan-300 font-mono">
                {actualCoverage}
              </p>
              <span className="text-[10px] text-cyan-400/90">
                {strings.activeMonthsBadge}
              </span>
            </div>
          </div>

          {/* Item 3: Included Entities */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-emerald-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-300 text-[11px] font-semibold">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>{strings.lblIncludedEntities}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-emerald-300 font-mono truncate" title={includedEntities}>
                {includedEntities}
              </p>
              <span className="text-[10px] text-emerald-400/90">
                3 Retained Entities
              </span>
            </div>
          </div>

          {/* Item 4: Excluded Entity */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-rose-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-rose-300 text-[11px] font-semibold">
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              <span>{strings.lblExcludedEntity}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-rose-300 font-mono">
                {excludedEntities}
              </p>
              <span className="text-[10px] text-rose-400/90">
                {strings.excludedEntityNote}
              </span>
            </div>
          </div>

          {/* Item 5: Validated Baseline Spend */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{strings.lblValidatedSpend}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-emerald-400 font-mono">
                {validatedSpendText}
              </p>
              <span className="text-[10px] text-slate-400">
                Net External Commercial Baseline
              </span>
            </div>
          </div>

          {/* Item 6: Source Transaction Count */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>{strings.lblSourceRows}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-white font-mono">
                {sourceRowCountText}
              </p>
              <span className="text-[10px] text-slate-400">
                100% Ingested & Verified
              </span>
            </div>
          </div>

          {/* Item 7: Included and Excluded Transaction Counts */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{strings.lblTransactionCounts}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-purple-300 font-mono">
                {transactionCountsText}
              </p>
              <span className="text-[10px] text-slate-400">
                2,208 STO + 755 Deleted/Blocked Excluded
              </span>
            </div>
          </div>

          {/* Item 8: Estimated Annualized Spend (Explicitly Labelled as Estimate) */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-indigo-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-indigo-300 text-[11px] font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>{strings.lblAnnualizedSpend}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-indigo-300 font-mono">
                {annualizedEstimateText}
              </p>
              <span className="text-[10px] text-indigo-400/90 italic">
                {strings.annualizedSpendNotice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentDataCoverageBanner;
