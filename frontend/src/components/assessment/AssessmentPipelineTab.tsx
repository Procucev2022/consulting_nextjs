import React from 'react';
import { UI_STRINGS } from '../../constants';
import type { AssessmentPipelineTabProps } from '../../types';

export const AssessmentPipelineTab: React.FC<AssessmentPipelineTabProps> = ({
  assessment,
  activeRun,
  isProcessing,
  onNdaChange,
  onDataStatusChange,
  onRunAnalysis
}) => {
  const hasCompletedRun = Boolean(activeRun || assessment.activeAnalysisRunId);

  const validatedSpend = activeRun?.validatedSpendCr ?? assessment.validatedSpendCr;
  const addressableSpend = activeRun?.addressableSpendCr ?? assessment.addressableSpendCr;
  const grossOpp = activeRun?.grossOpportunityCr ?? assessment.grossOpportunityCr;
  const overlapDeductions = activeRun?.overlapDeductionsCr ?? assessment.overlapDeductionsCr;
  const netDefensibleOpp = activeRun?.netDefensibleOpportunityCr ?? assessment.netDefensibleOpportunityCr;
  const provenOpp = activeRun?.provenOpportunityCr ?? assessment.provenOpportunityCr;
  const deliveryMin = activeRun?.deliveryRangeMinCr ?? assessment.deliveryRangeMinCr;
  const deliveryMax = activeRun?.deliveryRangeMaxCr ?? assessment.deliveryRangeMaxCr;
  const pcbiSignal = activeRun?.pcbiAnalyticalSignalCr ?? assessment.pcbiAnalyticalSignalCr;

  const emptyVal = UI_STRINGS.ASSESSMENT.financial.emptyValue;

  return (
    <div className="space-y-6">
      {/* Test Data Badge / Certified Regression Notice */}
      {assessment.isTestData && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {UI_STRINGS.ASSESSMENT.table.badgeTestData}
            </span>
            <span className="text-amber-200 font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.testDataBadge}
            </span>
          </div>
          <span className="text-[11px] text-amber-400 font-mono">
            {assessment.assessmentId}
          </span>
        </div>
      )}

      {/* Pending State Banner */}
      {!hasCompletedRun && (
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/60 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h4 className="font-bold text-cyan-300">
              {UI_STRINGS.ASSESSMENT.financial.pendingTitle}
            </h4>
          </div>
          <p className="text-slate-400">
            {UI_STRINGS.ASSESSMENT.financial.pendingSubtitle}
          </p>
        </div>
      )}

      {/* Certified Sourcing & Opportunity Baseline Metric Cards */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">
              {UI_STRINGS.ASSESSMENT.financial.metricsTitle}
            </h3>
            <p className="text-[11px] text-slate-400">
              {UI_STRINGS.ASSESSMENT.financial.metricsSubtitle}
            </p>
          </div>
          {hasCompletedRun && grossOpp !== undefined && overlapDeductions !== undefined && netDefensibleOpp !== undefined && (
            <div className="px-3 py-1 rounded bg-slate-900 border border-slate-700/80 font-mono text-[11px] text-slate-300">
              Gross (₹{grossOpp.toFixed(3)} Cr) − Overlap (₹{overlapDeductions.toFixed(3)} Cr) = Net (₹{netDefensibleOpp.toFixed(3)} Cr)
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Validated Spend */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.validatedSpend}
            </span>
            <p className="text-lg font-bold text-white mt-1 font-mono">
              {hasCompletedRun && validatedSpend !== undefined ? `₹${validatedSpend.toFixed(4)} Cr` : emptyVal}
            </p>
            <span className="text-[10px] text-slate-500">
              {hasCompletedRun ? '100% FX Normalized' : UI_STRINGS.ASSESSMENT.financial.pendingLabel}
            </span>
          </div>

          {/* Card 2: Addressable Sourcing Spend */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.addressableSpend}
            </span>
            <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">
              {hasCompletedRun && addressableSpend !== undefined ? `₹${addressableSpend.toFixed(3)} Cr` : emptyVal}
            </p>
            <span className="text-[10px] text-slate-500">
              {hasCompletedRun ? 'Procurable Scope' : UI_STRINGS.ASSESSMENT.financial.pendingLabel}
            </span>
          </div>

          {/* Card 3: Gross Multi-Lever Opportunity Pool */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.grossOpportunity}
            </span>
            <p className="text-lg font-bold text-cyan-400 mt-1 font-mono">
              {hasCompletedRun && grossOpp !== undefined ? `₹${grossOpp.toFixed(3)} Cr` : emptyVal}
            </p>
            <span className="text-[10px] text-slate-500">
              {hasCompletedRun ? 'Aggregated Levers' : UI_STRINGS.ASSESSMENT.financial.pendingLabel}
            </span>
          </div>

          {/* Card 4: Overlap Deductions */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.overlapDeductions}
            </span>
            <p className="text-lg font-bold text-rose-400 mt-1 font-mono">
              {hasCompletedRun && overlapDeductions !== undefined ? `₹${overlapDeductions.toFixed(3)} Cr` : emptyVal}
            </p>
            <span className="text-[10px] text-slate-500">
              {hasCompletedRun ? 'Double-Count Deductions' : UI_STRINGS.ASSESSMENT.financial.pendingLabel}
            </span>
          </div>

          {/* Card 5: Net Defensible Opportunity */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.netDefensibleOpportunity}
            </span>
            <p className="text-lg font-bold text-emerald-300 mt-1 font-mono">
              {hasCompletedRun && netDefensibleOpp !== undefined ? `₹${netDefensibleOpp.toFixed(3)} Cr` : emptyVal}
            </p>
            <span className="text-[10px] text-slate-500">
              {hasCompletedRun ? 'Audit-Ready Baseline' : UI_STRINGS.ASSESSMENT.financial.pendingLabel}
            </span>
          </div>

          {/* Card 6: Proven Opportunity */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.provenOpportunity}
            </span>
            <p className="text-lg font-bold text-amber-300 mt-1 font-mono">
              {hasCompletedRun && provenOpp !== undefined ? `₹${provenOpp.toFixed(3)} Cr` : emptyVal}
            </p>
            <span className="text-[10px] text-slate-500">
              {hasCompletedRun ? 'Verified Evidence Anchor' : UI_STRINGS.ASSESSMENT.financial.pendingLabel}
            </span>
          </div>

          {/* Card 7: Delivery Range */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {UI_STRINGS.ASSESSMENT.financial.deliveryRange}
            </span>
            <p className="text-lg font-bold text-blue-400 mt-1 font-mono">
              {hasCompletedRun && deliveryMin !== undefined && deliveryMax !== undefined && deliveryMin > 0 && deliveryMax > 0
                ? `₹${deliveryMin.toFixed(3)}–₹${deliveryMax.toFixed(3)} Cr`
                : (hasCompletedRun ? UI_STRINGS.ASSESSMENT.financial.deliveryRangeUnquantified : emptyVal)}
            </p>
            <span className="text-[10px] text-slate-500">
              {hasCompletedRun ? 'Execution Band' : UI_STRINGS.ASSESSMENT.financial.pendingLabel}
            </span>
          </div>

          {/* Card 8: PCBI Benchmark Signal (Strictly Segregated) */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-700/60 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-300 uppercase font-semibold">
                {UI_STRINGS.ASSESSMENT.financial.pcbiSignal}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800">
                Signal
              </span>
            </div>
            <p className="text-lg font-bold text-indigo-300 mt-1 font-mono">
              {hasCompletedRun && pcbiSignal !== undefined ? `₹${pcbiSignal.toFixed(4)} Cr` : emptyVal}
            </p>
            <span className="text-[9px] text-indigo-400/90 block mt-0.5">
              {UI_STRINGS.ASSESSMENT.financial.pcbiSignalNotice}
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline Execution Controls */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Pipeline Execution Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <label className="text-[10px] font-semibold uppercase text-slate-400">1. Customer NDA</label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => onNdaChange('SIGNED')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${assessment.ndaStatus === 'SIGNED' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
              >
                Mark Signed
              </button>
              <button
                type="button"
                onClick={() => onNdaChange('SENT')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${assessment.ndaStatus === 'SENT' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
              >
                Mark Sent
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <label className="text-[10px] font-semibold uppercase text-slate-400">2. Data Receipt</label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => onDataStatusChange('RECEIVED')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${assessment.dataStatus === 'RECEIVED' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
              >
                Mark Received
              </button>
              <button
                type="button"
                onClick={() => onDataStatusChange('VALIDATED')}
                className={`px-3 py-1.5 rounded text-xs font-semibold ${assessment.dataStatus === 'VALIDATED' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
              >
                Mark Validated
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <label className="text-[10px] font-semibold uppercase text-slate-400">3. Execute Engine Run</label>
            <button
              type="button"
              onClick={onRunAnalysis}
              disabled={isProcessing}
              className="mt-2 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {UI_STRINGS.ASSESSMENT.detail.btnRunAnalysis}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPipelineTab;
