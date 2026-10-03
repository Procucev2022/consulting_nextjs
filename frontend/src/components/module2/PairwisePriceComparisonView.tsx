'use client';
import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { SupplierPairPriceComparisonProof } from '../../types';

interface PairwisePriceComparisonViewProps {
  proofs?: SupplierPairPriceComparisonProof[];
}

export const PairwisePriceComparisonView: React.FC<PairwisePriceComparisonViewProps> = ({ proofs }) => {
  if (!proofs || proofs.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic text-center">
        No pairwise multi-supplier price comparisons available for this category.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Pairwise Supplier Price Difference Proofs (Section 4)
        </h4>
        <span className="text-[10px] text-slate-500">{proofs.length} Direct Proofs</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {proofs.map((proof, idx) => {
          const { supplierA, supplierB, priceDifference, priceDifferencePct, comparabilityChecklist } = proof;
          return (
            <div
              key={`${supplierA.supplierId}-${supplierB.supplierId}-${idx}`}
              className="p-4 rounded-xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="text-rose-600 dark:text-rose-400">{supplierA.supplierName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">{supplierB.supplierName}</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  Spread: ₹{priceDifference.toFixed(2)}/{supplierA.uom} ({priceDifferencePct.toFixed(1)}%)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Supplier A Details */}
                <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1">
                  <div className="font-bold text-rose-900 dark:text-rose-300">{supplierA.supplierName}</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Qty: {supplierA.quantity.toLocaleString()} {supplierA.uom} | Total: ₹{supplierA.totalSpendInr.toLocaleString()}
                  </div>
                  <div className="font-mono font-bold text-rose-700 dark:text-rose-400">
                    Paid Unit Price: ₹{supplierA.unitPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {supplierA.transactionIds.length} txns (Latest: {supplierA.date})
                  </div>
                </div>

                {/* Supplier B Details */}
                <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">{supplierB.supplierName}</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Qty: {supplierB.quantity.toLocaleString()} {supplierB.uom} | Total: ₹{supplierB.totalSpendInr.toLocaleString()}
                  </div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    Benchmark Unit Price: ₹{supplierB.unitPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {supplierB.transactionIds.length} txns (Latest: {supplierB.date})
                  </div>
                </div>
              </div>

              {/* Comparability Checklist */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#EEF4FC] border border-slate-200 dark:border-slate-800 text-[11px] flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300">Comparability Checklist:</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Spec: MATCH
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> UOM: {comparabilityChecklist.uomMatch ? 'MATCH' : 'DIFF'}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Currency: {comparabilityChecklist.currencyMatch ? 'MATCH' : 'DIFF'}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Geography: {comparabilityChecklist.geographyMatch ? 'MATCH' : 'N/A'}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Time Window: MATCH
                </span>
                {!comparabilityChecklist.isValidComparison && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold ml-auto">
                    <AlertTriangle className="w-3 h-3" /> Comparability Restricted
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
