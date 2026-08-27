'use client';
import React from 'react';
import { FileText, Printer, Download, CheckCircle2, X, TrendingUp, DollarSign, ShieldAlert, Award } from 'lucide-react';
import { TenantMaster, SavingsOpportunity } from '../../types';

interface ExecutiveReportModalProps {
  tenant: TenantMaster;
  opportunities: SavingsOpportunity[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  tenant,
  opportunities,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const totalSpendInrCr = 732.41; // ₹732.41 Cr
  const totalSavingsInrCr = 119.67; // ₹119.67 Cr

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col glass-panel-glow">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-800 dark:text-cyan-400 font-bold uppercase tracking-wider">
                Doc Reference: FRD-PRC-2026-V2 | Confidential
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Executive Advisory Diagnostic & ROI Blueprint (INR in Crores)
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-200 bg-white dark:bg-[#090e1a]">
          {/* Executive Header Banner */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  PROCUCEV PLATFORM ENGINE
                </h1>
                <p className="text-sm text-cyan-700 dark:text-cyan-400 font-semibold mt-1">
                  Strategic Procurement Advisory & AI Savings Realization Deliverable
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                <p>Date: August 12, 2026</p>
                <p>Author: Srinivas Mukku (Co-Founder & CEO)</p>
                <p>Base Currency: INR in Crores (₹ Cr)</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Enterprise Client:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{tenant.enterprise_name}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Evaluated Spend Window:</span>
                <p className="font-bold text-cyan-700 dark:text-cyan-300">36 Months (Multi-Currency)</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total Analyzed Spend:</span>
                <p className="font-bold font-mono text-slate-900 dark:text-white text-sm">₹{totalSpendInrCr.toFixed(2)} Crores</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Overall Realization:</span>
                <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">16.4% Net Target</p>
              </div>
            </div>
          </div>

          {/* Section 1: Executive KPI Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Savings</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                ₹{totalSavingsInrCr.toFixed(2)} Cr
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">16.4% of Total Spend</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Price Creep Leak</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                ₹20.53 Cr
              </p>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Unjustified vs Market Index</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Conversion Velocity</span>
              <p className="text-2xl font-black text-cyan-700 dark:text-cyan-400 font-mono mt-1">
                3x
              </p>
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-medium">Advisory to SaaS Lock-in</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">AI Confidence</span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mt-1">
                98.4%
              </p>
              <span className="text-[10px] text-purple-800 dark:text-purple-300 font-medium">Enterprise QUA Model</span>
            </div>
          </div>

          {/* Section 2: Category Breakdown in INR Crores */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              1. Category Spend & Target Savings Distribution (INR in Crores)
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Core Spend Category</th>
                    <th className="py-2.5 px-4">Baseline Spend (₹ Cr)</th>
                    <th className="py-2.5 px-4">Benchmark Target %</th>
                    <th className="py-2.5 px-4">Quantified Savings (₹ Cr)</th>
                    <th className="py-2.5 px-4">Execution Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                  <tr className="bg-white dark:bg-slate-900/30">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-white">Direct Materials</td>
                    <td className="py-2.5 px-4">₹358.66 Cr</td>
                    <td className="py-2.5 px-4 text-cyan-700 dark:text-cyan-400">18.5%</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹53.80 Cr</td>
                    <td className="py-2.5 px-4 font-sans text-cyan-700 dark:text-cyan-400">proCPX / DPS NXT</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900/30">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-white">Packaging Materials</td>
                    <td className="py-2.5 px-4">₹152.52 Cr</td>
                    <td className="py-2.5 px-4 text-cyan-700 dark:text-cyan-400">16.1%</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹25.98 Cr</td>
                    <td className="py-2.5 px-4 font-sans text-cyan-700 dark:text-cyan-400">proCPX</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900/30">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-white">Indirect & MRO</td>
                    <td className="py-2.5 px-4">₹129.05 Cr</td>
                    <td className="py-2.5 px-4 text-cyan-700 dark:text-cyan-400">14.2%</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹23.88 Cr</td>
                    <td className="py-2.5 px-4 font-sans text-purple-700 dark:text-purple-400">DPS NXT</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900/30">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-white">Logistics & Freight</td>
                    <td className="py-2.5 px-4">₹92.18 Cr</td>
                    <td className="py-2.5 px-4 text-cyan-700 dark:text-cyan-400">12.0%</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">₹16.01 Cr</td>
                    <td className="py-2.5 px-4 font-sans text-purple-700 dark:text-purple-400">DPS NXT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: High-Priority Strategic Initiatives */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              2. Actionable Sourcing & Contract Execution Pipeline (INR in Crores)
            </h3>
            <div className="space-y-2.5">
              {opportunities.slice(0, 4).map((opp) => (
                <div key={opp.opp_id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-cyan-800 dark:text-cyan-400 font-mono text-[10px] font-bold">
                        {opp.opp_id}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{opp.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Recommended: <span className="text-slate-800 dark:text-slate-200">{opp.recommended_action}</span> | Leak Type: {opp.contract_leak_type}
                    </p>
                  </div>
                  <div className="text-right pl-4 shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase">Savings Target</span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{(opp.est_savings_inr_cr || (opp.est_savings * 83.8 / 10000000)).toFixed(2)} Cr
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      opp.push_to_module === 'proCPX' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border border-purple-300 dark:border-purple-800/40'
                    }`}>
                      {opp.push_to_module}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Sign-off Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-500 dark:text-slate-400">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">PROCUCEV Advisory Leadership</p>
              <p className="font-mono text-cyan-700 dark:text-cyan-400">Srinivas Mukku, Co-Founder & CEO</p>
              <p className="text-[11px] text-slate-400">Document generated via PROCUCEV Platform Engine</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40 rounded-full font-semibold text-[11px]">
                Diagnostic Engagement: 100% Validated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
