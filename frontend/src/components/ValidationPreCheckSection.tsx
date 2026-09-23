'use client';
import React, { useState } from 'react';
import {
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  Sparkles,
  Zap,
  Building2,
  ArrowRight
} from 'lucide-react';
import type {
  ValidationPreCheckSectionProps,
  ValidationIssueCategoryFilter
} from '../types';
import { UI_STRINGS } from '../constants';

export const ValidationPreCheckSection: React.FC<ValidationPreCheckSectionProps> = ({
  validationRecords,
  onFixCurrency,
  onMergeVendor,
  onMergeItem,
  onApplyBlanketFixes,
  onResetValidationRecords,
  onRunAICategorization,
  isDataRefreshed,
  onRefreshWithFixes: _onRefreshWithFixes
}) => {
  const [filterIssue, setFilterIssue] = useState<ValidationIssueCategoryFilter>('ALL');

  // Metrics
  const totalValidationCount = validationRecords.length;
  const allResolvedCount = validationRecords.filter((r) => r.resolved || r.issue_flag === 'Passed Clean').length;
  const pendingActionsCount = validationRecords.filter((r) => !r.resolved && r.issue_flag !== 'Passed Clean').length;

  const conversionCount = validationRecords.filter(
    (r) => !r.resolved && (r.issue_category === 'CONVERSION' || r.issue_flag === 'Missing Currency Code' || r.issue_flag === 'Tax Discrepancy')
  ).length;

  const vendorDupCount = validationRecords.filter(
    (r) => !r.resolved && (r.issue_category === 'VENDOR_DUPLICATION' || r.issue_flag === 'Unmapped Supplier Name')
  ).length;

  const itemDupCount = validationRecords.filter(
    (r) => !r.resolved && (r.issue_category === 'ITEM_DUPLICATION' || r.issue_flag === 'Duplicate Item Description')
  ).length;

  const totalEvaluatedSpendInrCr = validationRecords.reduce(
    (acc, r) => acc + (r.inr_crores || ((r.order_quantity || 100) * (r.net_price || 100) * (r.fx_rate_applied || 83.8)) / 10000000),
    0
  );

  const pendingIssuesSpendCr = validationRecords
    .filter((r) => !r.resolved && r.issue_flag !== 'Passed Clean')
    .reduce(
      (acc, r) => acc + (r.inr_crores || ((r.order_quantity || 100) * (r.net_price || 100) * (r.fx_rate_applied || 83.8)) / 10000000),
      0
    );

  const validatedSpendInrCr = totalEvaluatedSpendInrCr - pendingIssuesSpendCr;
  const dataQualityIndex = totalValidationCount > 0 ? (allResolvedCount / totalValidationCount) * 100 : 100;

  // Filtered rows
  const filteredRecords = validationRecords.filter((rec) => {
    const isClean = rec.resolved || rec.issue_flag === 'Passed Clean';
    if (filterIssue === 'CLEAN') return isClean;
    if (filterIssue === 'NEEDS_ACTION') return !isClean;
    if (filterIssue === 'CONVERSION') {
      return !isClean && (rec.issue_category === 'CONVERSION' || rec.issue_flag === 'Missing Currency Code' || rec.issue_flag === 'Tax Discrepancy');
    }
    if (filterIssue === 'VENDOR_DUPLICATION') {
      return !isClean && (rec.issue_category === 'VENDOR_DUPLICATION' || rec.issue_flag === 'Unmapped Supplier Name');
    }
    if (filterIssue === 'ITEM_DUPLICATION') {
      return !isClean && (rec.issue_category === 'ITEM_DUPLICATION' || rec.issue_flag === 'Duplicate Item Description');
    }
    return true;
  });

  return (
    <div
      id="validation-precheck-section"
      className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-5"
    >
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.module1.validationSectionTitle}</span>
            </h3>
            {isDataRefreshed && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                {UI_STRINGS.module1.revisedBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {UI_STRINGS.module1.validationSectionSubtitle}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onApplyBlanketFixes && pendingActionsCount > 0 && (
            <button
              onClick={onApplyBlanketFixes}
              className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ {UI_STRINGS.module1.applyBlanketFixes}</span>
            </button>
          )}

          {onResetValidationRecords && (pendingActionsCount === 0 || isDataRefreshed) && (
            <button
              type="button"
              onClick={onResetValidationRecords}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <span>↺ {UI_STRINGS.module1.resetAnomalyState}</span>
            </button>
          )}
        </div>
      </div>

      {/* Categorized Filter Tabs (6 Options) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setFilterIssue('ALL')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
            filterIssue === 'ALL'
              ? 'bg-cyan-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {UI_STRINGS.module1.filterTabs.allRecords(totalValidationCount)}
        </button>

        <button
          onClick={() => setFilterIssue('NEEDS_ACTION')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
            filterIssue === 'NEEDS_ACTION'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300'
          }`}
        >
          <span>{UI_STRINGS.module1.filterTabs.needsAction(pendingActionsCount)}</span>
          {pendingIssuesSpendCr > 0 && (
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-900/40 text-amber-200 font-mono">
              -₹{pendingIssuesSpendCr.toFixed(2)} Cr
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterIssue('CONVERSION')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            filterIssue === 'CONVERSION'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300'
          }`}
        >
          <span>{UI_STRINGS.module1.filterTabs.conversion(conversionCount)}</span>
        </button>

        <button
          onClick={() => setFilterIssue('VENDOR_DUPLICATION')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            filterIssue === 'VENDOR_DUPLICATION'
              ? 'bg-sky-600 text-white shadow-xs font-bold'
              : 'text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300'
          }`}
        >
          <span>{UI_STRINGS.module1.filterTabs.vendorDuplication(vendorDupCount)}</span>
        </button>

        <button
          onClick={() => setFilterIssue('ITEM_DUPLICATION')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            filterIssue === 'ITEM_DUPLICATION'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300'
          }`}
        >
          <span>{UI_STRINGS.module1.filterTabs.itemDuplication(itemDupCount)}</span>
        </button>

        <button
          onClick={() => setFilterIssue('CLEAN')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
            filterIssue === 'CLEAN'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300'
          }`}
        >
          {UI_STRINGS.module1.filterTabs.readyAndCleared(allResolvedCount)}
        </button>
      </div>

      {/* Recalculated / Refreshed Post-Fix Validation Integrity Banner */}
      {isDataRefreshed && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono space-y-2 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-bold">{UI_STRINGS.module1.postFixValidation.integrityTitle}:</span>
              <span className="text-slate-600 dark:text-slate-300">{UI_STRINGS.module1.dataRefreshedBanner}</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] shrink-0 font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                ✓ {UI_STRINGS.module1.postFixValidation.spendReconciliationVerified}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                🛡️ {UI_STRINGS.module1.postFixValidation.zeroDrift}
              </span>
              {pendingActionsCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  🔍 {UI_STRINGS.module1.postFixValidation.governanceChecksActive(pendingActionsCount)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spend Reconciliation KPI Cards (4 Metric Boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{UI_STRINGS.module1.kpis.totalFileSpend}</span>
            <Database className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xl font-black font-mono text-slate-900 dark:text-white">₹{totalEvaluatedSpendInrCr.toFixed(2)} Cr</p>
          <p className="text-[10px] text-slate-500 font-sans">{totalValidationCount} Sample Records Evaluated</p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-300 font-bold">{UI_STRINGS.module1.kpis.validatedSpend}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">₹{validatedSpendInrCr.toFixed(2)} Cr</p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-medium">{allResolvedCount} of {totalValidationCount} Records Cleared</p>
        </div>

        <div className={`p-3.5 rounded-xl border transition-all space-y-1 ${
          pendingIssuesSpendCr > 0
            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
            : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-mono font-bold ${pendingIssuesSpendCr > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-slate-400'}`}>
              {UI_STRINGS.module1.kpis.pendingIssues}
            </span>
            <AlertTriangle className={`w-3.5 h-3.5 ${pendingIssuesSpendCr > 0 ? 'text-amber-600 dark:text-amber-400 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <p className={`text-xl font-black font-mono ${pendingIssuesSpendCr > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            ₹{pendingIssuesSpendCr.toFixed(2)} Cr
          </p>
          <p className="text-[10px] text-amber-700 dark:text-amber-300 font-sans font-medium">
            {pendingActionsCount > 0 ? `${pendingActionsCount} Anomalies Excluded from Analytics` : '0 Exclusions (All Reconciled)'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-300/80 dark:border-cyan-800/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-cyan-800 dark:text-cyan-300 font-bold">{UI_STRINGS.module1.kpis.qualityIndex}</span>
            <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-xl font-black font-mono text-cyan-700 dark:text-cyan-400">{dataQualityIndex.toFixed(1)}%</p>
          <p className="text-[10px] text-cyan-700 dark:text-cyan-300 font-sans font-medium">
            {dataQualityIndex === 100 ? '100% Clean Data Reconciled' : 'Remediation in Progress'}
          </p>
        </div>
      </div>

      {/* Validation Records Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Record & Year</th>
                <th className="py-3 px-3">PO & Line Item Description</th>
                <th className="py-3 px-3">Category & Column L Code</th>
                <th className="py-3 px-3">Vendor Entity</th>
                <th className="py-3 px-3 text-right">Order Qty (Q)</th>
                <th className="py-3 px-3 text-right">Net Price (P)</th>
                <th className="py-3 px-3 text-right">Currency & FX Rate</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">Line Spend (₹ Cr)</th>
                <th className="py-3 px-3">Inclusion & ETL Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
              {filteredRecords.map((record, idx) => {
                const qty = record.order_quantity || 1000;
                const price = record.net_price || 100;
                const curr = record.raw_currency || 'USD';
                const fx = record.fx_rate_applied || 83.8;
                const totalCr = record.inr_crores || ((qty * price * fx) / 10000000);
                const isClean = record.issue_flag === 'Passed Clean' || record.resolved;

                return (
                  <tr
                    key={record.record_id || `rec-${idx}`}
                    className={`transition-colors ${
                      isClean
                        ? 'bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-amber-50/60 dark:bg-amber-950/25 border-l-4 border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-900/30'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className="font-bold text-cyan-700 dark:text-cyan-400 block">{record.record_id}</span>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {record.spend_year || 2024}
                        </span>
                        {record.transaction_date && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[9px] font-mono font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {record.transaction_date}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans max-w-[220px]">
                      <span className="font-mono text-[10px] text-slate-400 block truncate">{record.po_number}</span>
                      <span className="text-slate-900 dark:text-white text-xs font-medium line-clamp-2">{record.raw_desc}</span>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {record.core_category || 'Direct Materials'}
                      </span>
                      {record.column_l_code && (
                        <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-400 mt-1 block">
                          Col L: {record.column_l_code}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-sans font-medium text-slate-700 dark:text-slate-200">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{record.vendor_name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">{qty.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">{curr} {price.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-cyan-700 dark:text-cyan-400 block">₹{fx.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">1 {curr}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-black text-emerald-700 dark:text-emerald-400 text-sm">₹{totalCr.toFixed(2)} Cr</div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      {isClean ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center space-x-1 text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Passed Clean</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">Active in Spend (₹{totalCr.toFixed(2)} Cr)</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] font-bold ${
                            record.issue_category === 'CONVERSION' || record.issue_flag === 'Missing Currency Code' || record.issue_flag === 'Tax Discrepancy'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              : record.issue_category === 'VENDOR_DUPLICATION' || record.issue_flag === 'Unmapped Supplier Name'
                              ? 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>{record.issue_flag}</span>
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">⚠️ Excluded until resolved</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {(record.issue_flag === 'Missing Currency Code' || record.issue_flag === 'Missing Currency' || record.issue_flag === 'Tax Discrepancy') && !record.resolved && (
                        <button
                          onClick={() => onFixCurrency(record)}
                          className="px-2.5 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-xs cursor-pointer"
                        >
                          {UI_STRINGS.module1.fixInr}
                        </button>
                      )}
                      {(record.issue_flag === 'Unmapped Supplier Name' || record.issue_flag === 'Unmapped Vendor' || record.issue_flag === 'Unmapped Supplier') && !record.resolved && (
                        <button
                          onClick={() => onMergeVendor(record)}
                          className="px-2.5 py-1.5 text-xs font-bold text-sky-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-all shadow-xs cursor-pointer"
                        >
                          {UI_STRINGS.module1.mergeVendor}
                        </button>
                      )}
                      {(record.issue_flag === 'Duplicate Item Description' || record.issue_flag === 'Duplicate Item') && !record.resolved && onMergeItem && (
                        <button
                          onClick={() => onMergeItem(record)}
                          className="px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-all shadow-xs cursor-pointer"
                        >
                          {UI_STRINGS.module1.mergeItem}
                        </button>
                      )}
                      {isClean && (
                        <span className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/40 rounded-lg inline-block">
                          Ready
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Button & Refresh Option */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Ready to trigger Public & Enterprise QUA AI UNSPSC Taxonomy Engine (INR Base)</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRunAICategorization}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>{UI_STRINGS.module1.runAiCategorization}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
