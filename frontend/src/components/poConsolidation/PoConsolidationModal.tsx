'use client';

import React, { useState } from 'react';
import { X, CheckCircle, FileText, Star } from 'lucide-react';
import type { PoConsolidationModalProps, PoConsolidationCadence } from '../../types/poConsolidation';
import { getCadenceBadgeClass } from '../../constants/poConsolidation';
import { UI_STRINGS } from '../../constants/uiStrings';

const CADENCE_LIST: PoConsolidationCadence[] = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL'];

export const PoConsolidationModal: React.FC<PoConsolidationModalProps> = ({
  item,
  isOpen,
  onClose,
  activeCadence,
  onCadenceChange
}) => {
  const [draftGenerated, setDraftGenerated] = useState(false);

  if (!isOpen || !item) return null;

  const currentOption = item.cadence_options[activeCadence];

  const handleGenerateDraft = (): void => {
    setDraftGenerated(true);
    setTimeout(() => setDraftGenerated(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {UI_STRINGS.poConsolidation.modalBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono">{item.material_code}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {UI_STRINGS.poConsolidation.modalTitle(item.vendor_name)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.poConsolidation.modalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{UI_STRINGS.poConsolidation.vendorLabel}</div>
              <div className="font-bold text-slate-900 dark:text-white truncate">{item.vendor_name}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{UI_STRINGS.poConsolidation.materialLabel}</div>
              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.category}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{UI_STRINGS.poConsolidation.annualSpendLabel}</div>
              <div className="font-bold font-mono text-slate-900 dark:text-white">₹{item.total_annual_spend_cr.toFixed(2)} Cr</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{UI_STRINGS.poConsolidation.currentPoFrequencyLabel}</div>
              <div className="font-bold font-mono text-rose-600 dark:text-rose-400">
                {UI_STRINGS.poConsolidation.currentPoFrequencyVal(item.avg_pos_per_month, item.annual_po_count)}
              </div>
            </div>
          </div>

          {/* Interactive Cadence Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{UI_STRINGS.poConsolidation.cadenceSelectorLabel}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {item.best_practice_recommendation}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CADENCE_LIST.map((cadence) => {
                const opt = item.cadence_options[cadence];
                const active = activeCadence === cadence;
                const isRec = item.recommended_cadence === cadence;
                return (
                  <button
                    key={cadence}
                    type="button"
                    onClick={() => onCadenceChange(cadence)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      active
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isRec && (
                      <span className="absolute top-2 right-2 flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3 fill-current mr-0.5" />
                        Rec
                      </span>
                    )}
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {opt.target_pos_per_year} POs/Yr (-{opt.po_reduction_pct}%)
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      +{opt.scale_discount_pct}% Scale Benefit
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Benefit Hero */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Target PO Frequency</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {currentOption.target_pos_per_year} POs / Year
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                -{currentOption.po_reduction_pct}% Transactions
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Volume Scale Benefit</div>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{currentOption.scale_savings_cr.toFixed(2)} Cr
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                +{currentOption.scale_discount_pct}% Volume Tier Rebate
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Admin Cost Savings</div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                ₹{currentOption.admin_savings_lakhs.toFixed(1)} Lakhs
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">@ ₹3,500 / Processed PO</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Total Quantified Impact</div>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-300 mt-0.5">
                ₹{currentOption.total_benefit_cr.toFixed(2)} Cr
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Net Annual Bottom-Line</div>
            </div>
          </div>

          {/* Month-by-Month PO Distribution */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {UI_STRINGS.poConsolidation.distributionTitle}
            </h4>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center">
              {item.monthly_distribution.map((m) => (
                <div key={m.month} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px]">
                  <div className="font-bold text-slate-600 dark:text-slate-300">{m.month}</div>
                  <div className="font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">{m.po_count} POs</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">₹{m.spend_inr_lakhs.toFixed(0)}L</div>
                </div>
              ))}
            </div>
          </div>

          {/* Economies of Scale Tier Ladder Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {UI_STRINGS.poConsolidation.scaleTierLadderTitle}
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                  <tr>
                    <th className="p-2.5">{UI_STRINGS.poConsolidation.tierColCadence}</th>
                    <th className="p-2.5 text-center">{UI_STRINGS.poConsolidation.tierColPosPerYear}</th>
                    <th className="p-2.5 text-center">{UI_STRINGS.poConsolidation.tierColReduction}</th>
                    <th className="p-2.5 text-center">{UI_STRINGS.poConsolidation.tierColDiscount}</th>
                    <th className="p-2.5 text-right">{UI_STRINGS.poConsolidation.tierColScaleSavings}</th>
                    <th className="p-2.5 text-right">{UI_STRINGS.poConsolidation.tierColAdminSavings}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="bg-rose-50/30 dark:bg-rose-950/10">
                    <td className="p-2.5 font-semibold text-rose-700 dark:text-rose-400">
                      {UI_STRINGS.poConsolidation.tierCurrentSpot}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-rose-600">{item.annual_po_count} POs</td>
                    <td className="p-2.5 text-center text-slate-400">Baseline (0%)</td>
                    <td className="p-2.5 text-center text-slate-400">0.0%</td>
                    <td className="p-2.5 text-right font-mono text-slate-400">₹0.00 Cr</td>
                    <td className="p-2.5 text-right font-mono text-slate-400">₹0.0L</td>
                  </tr>
                  {CADENCE_LIST.map((cadence) => {
                    const opt = item.cadence_options[cadence];
                    const isSelected = activeCadence === cadence;
                    return (
                      <tr key={cadence} className={isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/30 font-semibold' : ''}>
                        <td className="p-2.5 flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${getCadenceBadgeClass(cadence)}`}>
                            {opt.label}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{opt.target_pos_per_year} POs</td>
                        <td className="p-2.5 text-center text-emerald-600 font-mono">-{opt.po_reduction_pct}%</td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">+{opt.scale_discount_pct}%</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">₹{opt.scale_savings_cr.toFixed(2)} Cr</td>
                        <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-300">₹{opt.admin_savings_lakhs.toFixed(1)}L</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4-Step ERP Setup Roadmap */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {UI_STRINGS.poConsolidation.strategyTitle}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{UI_STRINGS.poConsolidation.step1Title}</div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{UI_STRINGS.poConsolidation.step1Desc}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{UI_STRINGS.poConsolidation.step2Title}</div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{UI_STRINGS.poConsolidation.step2Desc}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{UI_STRINGS.poConsolidation.step3Title}</div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{UI_STRINGS.poConsolidation.step3Desc}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{UI_STRINGS.poConsolidation.step4Title}</div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{UI_STRINGS.poConsolidation.step4Desc}</p>
              </div>
            </div>
          </div>

          {draftGenerated && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{UI_STRINGS.poConsolidation.consolidationDraftSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {UI_STRINGS.poConsolidation.closeModalBtn}
          </button>
          <button
            type="button"
            onClick={handleGenerateDraft}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>{UI_STRINGS.poConsolidation.applyConsolidationBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
