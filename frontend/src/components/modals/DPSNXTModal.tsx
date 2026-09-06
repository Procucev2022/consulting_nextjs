'use client';
import React, { useState } from 'react';
import { FileCheck, ShieldCheck, CheckCircle2, ArrowRight, X, Lock, Sliders, Zap } from 'lucide-react';
import { SavingsOpportunity, DPSNXTModalProps } from '../../types';
import confetti from 'canvas-confetti';
import {
  UI_STRINGS,
  DEFAULT_MAX_PRICE_CREEP_CAP,
  DEFAULT_INDEX_PEGGING,
  dpsnxtFormSchema
} from '../../constants';
import { validateInput } from '../../utils/validation';

export const DPSNXTModal: React.FC<DPSNXTModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [maxPriceCreepCap, setMaxPriceCreepCap] = useState<number>(DEFAULT_MAX_PRICE_CREEP_CAP);
  const [indexPegging, setIndexPegging] = useState<string>(DEFAULT_INDEX_PEGGING);

  const [autoRebateTier, setAutoRebateTier] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedSuccess, setExecutedSuccess] = useState(false);

  if (!isOpen || !opportunity) return null;

  const handleExecute = () => {
    const validation = validateInput(dpsnxtFormSchema, {
      oppId: opportunity.opp_id,
      indexPegging,
      contractTermMonths: 24,
      maxPriceCreepCapPct: maxPriceCreepCap,
      rateCardCurrency: 'INR'
    });
    if (!validation.success) return;

    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setExecutedSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        onSuccess(opportunity.opp_id);
        setExecutedSuccess(false);
        onClose();
      }, 1800);
    }, 1200);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-purple-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/40">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-800/60">
                  {UI_STRINGS.modals.dpsNXT.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.dpsNXT.subtitle}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {UI_STRINGS.modals.dpsNXT.heading}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {executedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{UI_STRINGS.modals.dpsNXT.deployedSuccess}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {UI_STRINGS.modals.dpsNXT.deployedDesc(opportunity.title, `$${opportunity.est_savings.toLocaleString()}`)}
              </p>
            </div>
          ) : (
            <>
              {/* Opportunity Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                      {opportunity.category}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                      {opportunity.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.dpsNXT.targetSavings}</span>
                    <p className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ${opportunity.est_savings.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/40">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">{UI_STRINGS.modals.dpsNXT.recommendedAction}</span>
                  <span className="text-slate-800 dark:text-slate-200">{opportunity.recommended_action}</span>
                </div>
              </div>

              {/* Rate Enforcement Config Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                      <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>{UI_STRINGS.modals.dpsNXT.maxPriceCreepCap}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={maxPriceCreepCap}
                        onChange={(e) => setMaxPriceCreepCap(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">{UI_STRINGS.modals.dpsNXT.percentMax}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{UI_STRINGS.modals.dpsNXT.commodityIndexPegging}</span>
                    </label>
                    <select
                      value={indexPegging}
                      onChange={(e) => setIndexPegging(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value={UI_STRINGS.modals.dpsNXT.benchmarks.lme}>{UI_STRINGS.modals.dpsNXT.benchmarks.lme}</option>
                      <option value={UI_STRINGS.modals.dpsNXT.benchmarks.platts}>{UI_STRINGS.modals.dpsNXT.benchmarks.platts}</option>
                      <option value={UI_STRINGS.modals.dpsNXT.benchmarks.cass}>{UI_STRINGS.modals.dpsNXT.benchmarks.cassShort}</option>
                      <option value={UI_STRINGS.modals.dpsNXT.benchmarks.ppi}>{UI_STRINGS.modals.dpsNXT.benchmarks.ppiShort}</option>
                    </select>
                  </div>
                </div>

                {/* Automation Rules */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-purple-900/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{UI_STRINGS.modals.dpsNXT.rules.invoicePriceMatch}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 rounded border border-emerald-300 dark:border-emerald-800/40 text-[10px] font-bold">{UI_STRINGS.modals.dpsNXT.rules.statusActive}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{UI_STRINGS.modals.dpsNXT.rules.autoRejectBenchmark}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-400 rounded border border-purple-300 dark:border-purple-800/40 text-[10px] font-bold">{UI_STRINGS.modals.dpsNXT.rules.statusEnabled}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{UI_STRINGS.modals.dpsNXT.rules.rebateTier}</span>
                    <button
                      type="button"
                      onClick={() => setAutoRebateTier(!autoRebateTier)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        autoRebateTier ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-400 dark:border-cyan-800/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {autoRebateTier ? UI_STRINGS.modals.dpsNXT.rules.statusEnforced : UI_STRINGS.modals.dpsNXT.rules.statusOff}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Lock Note */}
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>
                  {UI_STRINGS.modals.dpsNXT.securityNote}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!executedSuccess && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 dark:border-purple-500/20 bg-slate-50/80 dark:bg-slate-950/60">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {UI_STRINGS.modals.dpsNXT.cancel}
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center space-x-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-md shadow-purple-600/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{UI_STRINGS.modals.dpsNXT.enforcing}</span>
                </>
              ) : (
                <>
                  <span>{UI_STRINGS.modals.dpsNXT.pushButton}</span>
                  <FileCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
