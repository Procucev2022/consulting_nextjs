'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';
import type { ExecutiveOpportunityDashboardViewProps } from '../../types/module2Components';
import type { OpportunityRegisterSummary } from '../../types/module2OpportunityRegister';
import { Module2OpportunityRegisterApi } from '../../utils/module2OpportunityRegisterApi';
import { logger } from '../../utils/logger';

export const ExecutiveOpportunityDashboardView: React.FC<ExecutiveOpportunityDashboardViewProps> = ({
  assessmentId,
  onNavigateToRegister
}) => {
  const [summary, setSummary] = useState<OpportunityRegisterSummary | null>(null);
  const [customerName, setCustomerName] = useState<string>('Borosil Ltd');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Module2OpportunityRegisterApi.getExecutiveDashboard(assessmentId);
      if (res) {
        setSummary(res.summary);
        setCustomerName(res.customerName);
      }
    } catch (err) {
      logger.error('Failed to load Executive Opportunity Dashboard', { assessmentId }, err);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mr-3" />
        <span className="text-sm font-medium">Loading Executive Sourcing Intelligence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 rounded-xl border border-slate-700 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                STAGE 2 DECISION ENGINE
              </span>
              <span className="text-xs text-slate-400 font-mono">ASSESSMENT: {assessmentId}</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
              <span>{customerName} — Strategic Sourcing Decision Dashboard</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Authoritative spend boundaries, mutually qualifying sourcing levers, and empirical rate-card dispersion.
              Zero speculative external benchmarks applied.
            </p>
          </div>
          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow"
            >
              <span>View Material Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Baseline & Spend Boundary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Baseline Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Authoritative Baseline
          </span>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            ₹{summary?.authoritativeBaselineSpendCr.toFixed(4)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary?.authoritativeBaselineTransactions.toLocaleString()} Included Transactions
          </div>
          <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Module 1 Net Certified</span>
          </div>
        </div>

        {/* Direct Price Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Direct Price Eligible
          </span>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            ₹{summary?.directPriceEligibleSpendCr.toFixed(4)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary?.directPriceEligibleTransactions.toLocaleString()} Coded Non-Zero Lines
          </div>
          <div className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>Defensible Opp: ₹{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.defensibleValueCr.toFixed(2)} Cr</span>
          </div>
        </div>

        {/* Supplier Consolidation Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Supplier Consolidation
          </span>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            ₹{summary?.supplierConsolidationEligibleSpendCr.toFixed(4)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary?.byType?.SUPPLIER_CONSOLIDATION?.count} Multi-Sourced Materials
          </div>
          <div className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Share of Wallet Potential</span>
          </div>
        </div>

        {/* Volume Aggregation Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Volume Aggregation
          </span>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            ₹{summary?.volumeConsolidationCandidateSpendCr.toFixed(4)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary?.byType?.VOLUME_DEMAND_CONSOLIDATION?.count} High-Volume Groups
          </div>
          <div className="mt-2 text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" />
            <span>Inter-Plant Pooling</span>
          </div>
        </div>

        {/* Spend Requiring Review Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-300 dark:border-amber-800/60 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Review Required
          </span>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            ₹{summary?.spendRequiringReviewCr.toFixed(4)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">5,023 Uncoded Transactions</div>
          <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Held For Code Validation</span>
          </div>
        </div>
      </div>

      {/* Non-Additive Overlap & Governance Notice Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="font-bold uppercase tracking-wider">
            Critical Data Integrity Safeguard: Non-Additive Opportunity Levers
          </div>
          <p>{summary?.overlapDeductionNotice}</p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            Direct price dispersion (₹{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.defensibleValueCr.toFixed(2)} Cr) and
            supplier consolidation address overlapping purchase transactions. Certified realized savings remain at{' '}
            <span className="font-bold underline">₹0.00 Cr</span> until commercial vendor contract renegotiations are
            certified in Module 4.
          </p>
        </div>
      </div>

      {/* Sourcing Levers Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Sourcing Levers Decision Matrix
          </h3>
          <span className="text-xs text-slate-500">
            Total Traceable Candidates: {summary?.totalOpportunitiesCount.toLocaleString()}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Lever Classification</th>
                <th className="py-2.5 px-4 text-right">Candidate Items</th>
                <th className="py-2.5 px-4 text-right">Historical Spend (₹ Cr)</th>
                <th className="py-2.5 px-4 text-right">Defensible Valuation (₹ Cr)</th>
                <th className="py-2.5 px-4">Commercial Status</th>
                <th className="py-2.5 px-4">Governing Validation Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Lever 1: Direct Price Improvement
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{summary?.byType?.DIRECT_PRICE_IMPROVEMENT?.defensibleValueCr.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">Analytical Rate Dispersion</td>
                <td className="py-3 px-4 text-slate-500">Procurement — Direct Sourcing Team</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Lever 3: Supplier Base Consolidation
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.SUPPLIER_CONSOLIDATION?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.SUPPLIER_CONSOLIDATION?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-slate-400">Pending Terms</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">Multi-Vendor Fragmentation</td>
                <td className="py-3 px-4 text-slate-500">Strategic Sourcing & Vendor Management</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Lever 4: Volume & Demand Consolidation
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.VOLUME_DEMAND_CONSOLIDATION?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.VOLUME_DEMAND_CONSOLIDATION?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-slate-400">Pending Tiering</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">Inter-Plant Lot Aggregation</td>
                <td className="py-3 px-4 text-slate-500">Central SCM & Plant Operations</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Lever 8: Specification Rationalisation
                </td>
                <td className="py-3 px-4 text-right">{summary?.byType?.SPECIFICATION_PROCESS_REVIEW?.count}</td>
                <td className="py-3 px-4 text-right">₹{summary?.byType?.SPECIFICATION_PROCESS_REVIEW?.spendCr.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-slate-400">Technical Audit</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">Standardization Candidate</td>
                <td className="py-3 px-4 text-slate-500">Technical Review Committee</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance & Data Limitations Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-4 h-4 text-cyan-600" />
            <span>Data Limitations & Analytical Boundaries</span>
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            {summary?.dataLimitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-cyan-600 font-bold">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Validation Requirements Before Execution</span>
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            {summary?.validationRequirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
