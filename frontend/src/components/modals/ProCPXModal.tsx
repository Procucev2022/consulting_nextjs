'use client';
import React, { useState } from 'react';
import { Send, CheckCircle2, Shield, X, Layers } from 'lucide-react';
import type { ProCPXModalProps, ProCPXEventType } from '../../types';
import confetti from 'canvas-confetti';
import {
  UI_STRINGS,
  DEFAULT_INVITED_SUPPLIERS,
  DEFAULT_PROCPX_BASELINE,
  proCPXFormSchema
} from '../../constants';
import { validateInput } from '../../utils/validation';

export const ProCPXModal: React.FC<ProCPXModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [eventType, setEventType] = useState<ProCPXEventType>('Multi-Stage RFP');
  const [targetBaseline, setTargetBaseline] = useState<number>(
    (opportunity && opportunity.est_savings > 0)
      ? opportunity.est_savings
      : (DEFAULT_PROCPX_BASELINE > 0 ? DEFAULT_PROCPX_BASELINE : (opportunity?.current_spend || 1850000))
  );
  const [invitedSuppliers] = useState<string[]>(() => {
    if (opportunity?.category) {
      return [`${opportunity.category} Qualified Suppliers`];
    }
    return DEFAULT_INVITED_SUPPLIERS.length > 0 ? [...DEFAULT_INVITED_SUPPLIERS] : ['Enterprise Qualified Suppliers'];
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedSuccess, setDeployedSuccess] = useState(false);

  if (!isOpen || !opportunity) return null;

  const handleLaunch = (): void => {
    const validation = validateInput(proCPXFormSchema, {
      oppId: opportunity.opp_id,
      eventType,
      baselineSpendCr: targetBaseline,
      targetSavingsPct: opportunity.target_savings_pct ?? 10,
      invitedSuppliers,
      auctionEndDate: new Date().toISOString()
    });
    if (!validation.success) return;

    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setDeployedSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        onSuccess(opportunity.opp_id);
        setDeployedSuccess(false);
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden glass-panel-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/60">
                  {UI_STRINGS.modals.proCPX.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.proCPX.subtitle}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {UI_STRINGS.modals.proCPX.heading}
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
          {deployedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-500/40 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{UI_STRINGS.modals.proCPX.deployedSuccess}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {UI_STRINGS.modals.proCPX.deployedDesc(opportunity.opp_id, invitedSuppliers.length, `$${opportunity.est_savings.toLocaleString()}`)}
              </p>
            </div>
          ) : (
            <>
              {/* Opportunity Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">
                      {opportunity.category}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                      {opportunity.title}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{UI_STRINGS.modals.proCPX.identifiedSavings}</span>
                    <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ${(opportunity.est_savings ?? ((opportunity.est_savings_inr_cr || 0) * 10000000 / 83.8)).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/40">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">{UI_STRINGS.modals.proCPX.rootCause}</span>
                  <span>{opportunity.contract_leak_type}</span>
                </div>
              </div>

              {/* Event Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {UI_STRINGS.modals.proCPX.sourcingMechanism}
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as ProCPXEventType)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Multi-Stage RFP">{UI_STRINGS.modals.proCPX.mechanisms.multiStageRFP}</option>
                    <option value="Reverse Auction">{UI_STRINGS.modals.proCPX.mechanisms.reverseAuction}</option>
                    <option value="Sealed Bid">{UI_STRINGS.modals.proCPX.mechanisms.sealedBid}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {UI_STRINGS.modals.proCPX.targetBaselineLabel}
                  </label>
                  <input
                    type="number"
                    value={targetBaseline}
                    onChange={(e) => setTargetBaseline(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Supplier Roster */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                  <span>{UI_STRINGS.modals.proCPX.supplierCohortLabel(invitedSuppliers.length)}</span>
                  <span className="text-cyan-600 dark:text-cyan-400 text-[11px] cursor-pointer hover:underline font-semibold">{UI_STRINGS.modals.proCPX.addSupplier}</span>
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {invitedSuppliers.map((supplier, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-white">{supplier}</span>
                      <span className="text-[10px] text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/40">{UI_STRINGS.modals.proCPX.verifiedVendor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>
                  {UI_STRINGS.modals.proCPX.complianceNote}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!deployedSuccess && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 dark:border-cyan-500/20 bg-slate-50/80 dark:bg-slate-950/60">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {UI_STRINGS.modals.proCPX.cancel}
            </button>
            <button
              onClick={handleLaunch}
              disabled={isDeploying}
              className="flex items-center space-x-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md shadow-cyan-600/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{UI_STRINGS.modals.proCPX.deploying}</span>
                </>
              ) : (
                <>
                  <span>{UI_STRINGS.modals.proCPX.pushButton}</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
