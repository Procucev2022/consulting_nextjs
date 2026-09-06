'use client';
import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Calculator,
  Layers,
  Sparkles
} from 'lucide-react';
import type { Module5ConversionMatrixProps } from '../types';
import {
  UI_STRINGS,
  DEFAULT_SPEND_BASELINE_INR_CR,
  DEFAULT_SAVINGS_TARGET_PCT,
  DEFAULT_SAAS_FEE_RATE,
  conversionInputsSchema
} from '../constants';
import { validateInput } from '../utils/validation';
import confetti from 'canvas-confetti';

export const Module5ConversionMatrix: React.FC<Module5ConversionMatrixProps> = ({
  tenant: _tenant,
  funnelStages,
  onOpenReport
}) => {
  // ROI Interactive Calculator State in INR in Crores (₹ Cr)
  const [annualSpendCr, setAnnualSpendCr] = useState<number>(DEFAULT_SPEND_BASELINE_INR_CR); // ₹732.41 Cr
  const [savingsRate, setSavingsRate] = useState<number>(DEFAULT_SAVINGS_TARGET_PCT); // 16.4%
  const [saasFeeRate, setSaasFeeRate] = useState<number>(DEFAULT_SAAS_FEE_RATE); // 0.85% of spend or platform fee

  const calculatedGrossSavingsCr = (annualSpendCr * savingsRate) / 100;
  const calculatedPlatformFeeCr = (annualSpendCr * saasFeeRate) / 100;
  const netClientBenefitCr = calculatedGrossSavingsCr - calculatedPlatformFeeCr;
  const roiMultiple = calculatedGrossSavingsCr / (calculatedPlatformFeeCr || 1);

  const handleSimulateLockIn = () => {
    const validation = validateInput(conversionInputsSchema, {
      annualSpendCr,
      savingsRate,
      saasFeeRate
    });
    if (!validation.success) return;

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 }
    });
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-purple-950/40 border border-purple-100 dark:border-purple-500/30 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded border border-purple-300 dark:border-purple-800">
              {UI_STRINGS.module5.badge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.module5.badgeSubtitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {UI_STRINGS.module5.heading}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {UI_STRINGS.module5.description}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md shadow-purple-600/20 border border-purple-400/40 transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{UI_STRINGS.module5.generateBrief}</span>
          </button>
        </div>
      </div>

      {/* Wireframe Screen 5: Client Conversion Funnel Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{UI_STRINGS.module5.funnelTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.module5.funnelSubtitle}
            </p>
          </div>
          <span className="text-xs font-mono text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-800/50">
            {UI_STRINGS.module5.conversionViewBadge}
          </span>
        </div>

        {/* Funnel Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">{UI_STRINGS.module5.funnelHeaders.funnelPhase}</th>
                  <th className="py-3.5 px-5">{UI_STRINGS.module5.funnelHeaders.actionableFocus}</th>
                  <th className="py-3.5 px-5">{UI_STRINGS.module5.funnelHeaders.valueOutcome}</th>
                  <th className="py-3.5 px-5 text-right">{UI_STRINGS.module5.funnelHeaders.commercialMetric}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                {funnelStages.map((stage) => (
                  <tr
                    key={stage.phase_num}
                    className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${stage.status === 'Completed'
                              ? 'bg-emerald-600 text-white'
                              : stage.status === 'In Progress'
                                ? 'bg-cyan-600 text-white animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                        >
                          {stage.phase_num}
                        </span>
                        <span>{stage.phase_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                      {stage.platform_actionable_focus}
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      {stage.value_outcome_delivered}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${stage.phase_num === 1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                            : stage.phase_num === 2
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800/60'
                          }`}
                      >
                        {stage.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{stage.commercial_lock_in_metric}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive ROI & Commercial Lock-In Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders & Inputs (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-card space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.module5.calculatorTitle}</span>
            </h3>
            <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 font-semibold">{UI_STRINGS.module5.interactiveModelBadge}</span>
          </div>

          {/* Spend Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{UI_STRINGS.module5.annualSpendLabel}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {UI_STRINGS.module5.annualSpendVal(annualSpendCr)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2500}
              step={25}
              value={annualSpendCr}
              onChange={(e) => setAnnualSpendCr(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600 dark:accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{UI_STRINGS.module5.minSpend}</span>
              <span>{UI_STRINGS.module5.midSpend}</span>
              <span>{UI_STRINGS.module5.maxSpend}</span>
            </div>
          </div>

          {/* Savings Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{UI_STRINGS.module5.targetSavingsRateLabel}</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {UI_STRINGS.module5.savingsRateVal(savingsRate)}
              </span>
            </div>
            <input
              type="range"
              min={8.0}
              max={25.0}
              step={0.5}
              value={savingsRate}
              onChange={(e) => setSavingsRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{UI_STRINGS.module5.conservativeLabel}</span>
              <span>{UI_STRINGS.module5.frdBenchmarkLabel}</span>
              <span>{UI_STRINGS.module5.aggressiveLabel}</span>
            </div>
          </div>

          {/* SaaS Fee Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{UI_STRINGS.module5.platformFeeLabel}</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-400 text-sm">
                {UI_STRINGS.module5.platformFeeVal(saasFeeRate, calculatedPlatformFeeCr)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2.0}
              step={0.05}
              value={saasFeeRate}
              onChange={(e) => setSaasFeeRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400"
            />
          </div>
        </div>

        {/* Calculated Payback & Lock-In Metrics (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950/50 dark:via-slate-900 dark:to-slate-950 border border-purple-200 dark:border-purple-500/30 shadow-md dark:shadow-2xl glass-panel flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs text-purple-800 dark:text-purple-400 uppercase font-bold tracking-wider">
              {UI_STRINGS.module5.projectedCommercialRealization}
            </span>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{UI_STRINGS.module5.grossAnnualizedSavings}</span>
                <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                  {UI_STRINGS.module5.grossSavingsCrVal(calculatedGrossSavingsCr)}
                </p>
                <span className="text-[10px] text-slate-400">{UI_STRINGS.module5.acrossCoreBuckets}</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{UI_STRINGS.module5.netClientBenefit}</span>
                <p className="text-2xl font-black font-mono text-cyan-700 dark:text-cyan-400 mt-1">
                  {UI_STRINGS.module5.netBenefitCrVal(netClientBenefitCr)}
                </p>
                <span className="text-[10px] text-slate-400">{UI_STRINGS.module5.afterPlatformFee}</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-900 dark:text-purple-300 font-semibold">{UI_STRINGS.module5.clientRoiMultiple}</span>
                <p className="text-3xl font-black font-mono text-purple-950 dark:text-white mt-0.5">
                  {UI_STRINGS.module5.roiMultipleVal(roiMultiple)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-purple-900 dark:text-purple-300 font-semibold">{UI_STRINGS.module5.estimatedPayback}</span>
                <p className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {UI_STRINGS.module5.paybackMonthsVal(12 / roiMultiple)}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSimulateLockIn}
            className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl shadow-md shadow-purple-600/20 transition-all transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{UI_STRINGS.module5.lockInButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
