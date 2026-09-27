'use client';

import React from 'react';
import {
  X,
  Calculator,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import type { PCBIExplainabilityModalProps } from '../../types/pcbi';

export const PCBIExplainabilityModal: React.FC<PCBIExplainabilityModalProps> = ({
  isOpen,
  onClose,
  audit
}) => {
  if (!isOpen || !audit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border-b border-indigo-500/20">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 text-indigo-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-md">
                  PCBI MATHEMATICAL AUDIT TRAIL
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-md">
                  QUALITY: GRADE {audit.quality_rating}
                </span>
              </div>
              <h2 className="text-lg font-black mt-1 text-white">
                Calculation Proof: {audit.material_code} — {audit.material_description}
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Main Opportunity Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Audited PCBI Opportunity Identified
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-cyan-400">
                  ₹{audit.opportunity_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-semibold text-cyan-200">
                  (₹{audit.opportunity_value_lakhs} Lakhs / ₹{audit.opportunity_value_crores} Cr)
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                PO: <strong className="text-white">{audit.po_number}</strong> | Vendor: <strong className="text-white">{audit.vendor}</strong> | Category: <strong className="text-white">{audit.category}</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase">Benchmark Applied</span>
              <p className="text-xs font-mono font-bold text-indigo-300 mt-0.5">{audit.pcbi_id}</p>
              <span className="text-[11px] text-slate-400 max-w-[200px] truncate block">{audit.benchmark_name}</span>
            </div>
          </div>

          {/* 2-Column Comparison: Base Purchase vs Current Transaction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Purchase (Fixed Base) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                    1. Fixed Base Purchase (P0)
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                  {audit.base_purchase.po_number}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Base PO Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{audit.base_purchase.date}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Base Unit Price (P0)</span>
                  <p className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
                    ₹{audit.base_purchase.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Base PCBI Index (I0)</span>
                  <p className="font-bold font-mono text-slate-800 dark:text-slate-200">{audit.base_purchase.pcbi_index.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Benchmarkability (B)</span>
                  <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{audit.benchmarkability_percent}%</p>
                </div>
              </div>
            </div>

            {/* Current Evaluated Transaction */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                    2. Evaluated Purchase (P1)
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded font-bold">
                  {audit.current_purchase.po_number}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Purchase Date</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{audit.current_purchase.date}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Actual Unit Price</span>
                  <p className="font-bold font-mono text-rose-600 dark:text-rose-400 text-sm">
                    ₹{audit.current_purchase.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Current Index (I1)</span>
                  <p className="font-bold font-mono text-slate-800 dark:text-slate-200">{audit.current_purchase.pcbi_index.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Order Quantity (Q)</span>
                  <p className="font-bold font-mono text-slate-800 dark:text-slate-200">{audit.quantity.toLocaleString('en-IN')} units</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Step-by-Step Breakdown Box */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                Step-by-Step Mathematical Derivation
              </h3>
            </div>

            {/* Formula display */}
            <div className="p-3.5 bg-white dark:bg-slate-950 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">1. Expected Price Formula:</span>
              <p className="mt-1 font-semibold">{audit.formula_display}</p>
            </div>

            {/* Composite Components (if applicable) */}
            {audit.is_composite && audit.components && audit.components.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
                  Composite Sub-Component Breakdown:
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                        <th className="py-1.5 px-2">Component</th>
                        <th className="py-1.5 px-2 text-right">Weight</th>
                        <th className="py-1.5 px-2 text-right">Base Cost</th>
                        <th className="py-1.5 px-2 text-right">Index Movement</th>
                        <th className="py-1.5 px-2 text-right">Adjusted Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {audit.components.map((c, i) => (
                        <tr key={i} className="font-mono text-[11px]">
                          <td className="py-1.5 px-2 font-sans font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                          <td className="py-1.5 px-2 text-right text-slate-500">{c.weight}%</td>
                          <td className="py-1.5 px-2 text-right">₹{c.base_cost.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-right text-cyan-600 dark:text-cyan-400">
                            {c.base_index} &rarr; {c.current_index} ({c.movement_pct >= 0 ? `+${c.movement_pct}%` : `${c.movement_pct}%`})
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-white">₹{c.current_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Final Sub-steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">PCBI Expected Price</span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  ₹{audit.expected_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">PCBI Price Gap / Unit</span>
                <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                  ₹{audit.price_gap_per_unit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/60 rounded-xl border border-cyan-300 dark:border-cyan-800 text-center">
                <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-300 block">Total Opportunity</span>
                <span className="text-base font-black font-mono text-cyan-700 dark:text-cyan-300 mt-1 block">
                  ₹{audit.opportunity_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Audit Proof Verified via PCBI Calculation Engine 2.0</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Close Proof
          </button>
        </div>
      </div>
    </div>
  );
};
