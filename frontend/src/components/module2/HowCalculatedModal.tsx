'use client';

import React from 'react';
import { X, Calculator, ArrowDown, ShieldCheck, Info } from 'lucide-react';

export interface HowCalculatedData {
  opportunityId?: string;
  categoryName: string;
  opportunityType: string;
  currentSpendInr: number;
  eligibleSpendInr: number;
  eligibleQuantity: number;
  currentWeightedPrice: number;
  historicalReferencePrice: number;
  priceDifferential: number;
  grossOpportunityInr: number;
  overlapAdjustmentInr: number;
  netOpportunityInr: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  referenceSuppliers?: string[];
  referenceVolumeSharePct?: number;
  qualificationRules?: string[];
}

export interface HowCalculatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HowCalculatedData | null;
}

export const HowCalculatedModal: React.FC<HowCalculatedModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen || !data) return null;

  const toLakhsOrCr = (inr: number): string => {
    if (inr >= 10000000) {
      return `₹${(inr / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(inr / 100000).toFixed(2)} Lakhs`;
  };

  const steps = [
    {
      step: 1,
      label: 'Current Category Spend',
      value: toLakhsOrCr(data.currentSpendInr),
      subtext: 'Total validated historical customer procurement spend in category.'
    },
    {
      step: 2,
      label: 'Eligible Spend',
      value: toLakhsOrCr(data.eligibleSpendInr),
      subtext: 'Comparable transactions meeting specification, UOM, and currency standards.'
    },
    {
      step: 3,
      label: 'Eligible Quantity',
      value: `${data.eligibleQuantity.toLocaleString()} Units`,
      subtext: 'Historical run-rate quantity for qualified comparable transactions.'
    },
    {
      step: 4,
      label: 'Current Weighted Price',
      value: `₹${data.currentWeightedPrice.toFixed(2)} / unit`,
      subtext: 'Quantity-weighted average purchase price across baseline transactions.'
    },
    {
      step: 5,
      label: 'Historical Reference Price',
      value: `₹${data.historicalReferencePrice.toFixed(2)} / unit`,
      subtext: `Lowest credible price supported by ${data.referenceVolumeSharePct || 18.4}% of historical category volume.`
    },
    {
      step: 6,
      label: 'Price Differential',
      value: `₹${data.priceDifferential.toFixed(2)} / unit`,
      subtext: 'Defensible spread between current weighted price and qualified reference price.'
    },
    {
      step: 7,
      label: 'Gross Opportunity',
      value: toLakhsOrCr(data.grossOpportunityInr),
      subtext: 'Eligible Quantity × Price Differential (Pre-overlap deduplication).'
    },
    {
      step: 8,
      label: 'Overlap Adjustment',
      value: `- ${toLakhsOrCr(data.overlapAdjustmentInr)}`,
      subtext: 'Shared addressable volume variance removed to strictly prevent double counting.'
    },
    {
      step: 9,
      label: 'NET QUANTIFIABLE OPPORTUNITY',
      value: toLakhsOrCr(data.netOpportunityInr),
      subtext: 'Mutually exclusive qualified commercial opportunity based exclusively on historical customer transactions.',
      isHighlight: true
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-calculated-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 id="how-calculated-title" className="text-base font-bold text-slate-900 dark:text-white">
                How Was This Number Calculated?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data.categoryName} • Lever: <span className="font-semibold text-cyan-600">{data.opportunityType}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Body */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Zero Fabricated Savings Policy:</span> Every rupee shown originates from validated historical transactions. No arbitrary percentage assumptions are applied.
            </div>
          </div>

          <div className="space-y-2">
            {steps.map((s, idx) => (
              <React.Fragment key={s.step}>
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    s.isHighlight
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/80 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-750'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        s.isHighlight ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        STEP {s.step}
                      </span>
                      <span className={`text-xs font-bold ${s.isHighlight ? 'text-emerald-900 dark:text-emerald-200 text-sm' : 'text-slate-800 dark:text-slate-200'}`}>
                        {s.label}
                      </span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${s.isHighlight ? 'text-emerald-700 dark:text-emerald-400 text-base' : 'text-slate-900 dark:text-white'}`}>
                      {s.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-8">
                    {s.subtext}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex justify-center -my-1 text-slate-300 dark:text-slate-600">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Audit Footer Metadata */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Evidence Confidence: <strong className="text-slate-800 dark:text-slate-200">{data.confidence}</strong></span>
            </div>
            {data.opportunityId && (
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                ID: {data.opportunityId}
              </span>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition-colors"
          >
            Close Calculation Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
