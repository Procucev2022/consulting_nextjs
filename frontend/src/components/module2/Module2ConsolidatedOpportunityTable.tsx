'use client';

import React, { useState, useMemo } from 'react';
import { Filter, Search, CheckCircle, AlertTriangle, Layers, XCircle } from 'lucide-react';
import type { Module2CanonicalSavingsOpportunity, DeduplicationStatus } from '../../types';
import { UI_STRINGS } from '../../constants';

interface Module2ConsolidatedOpportunityTableProps {
  opportunities: Module2CanonicalSavingsOpportunity[];
}

export const Module2ConsolidatedOpportunityTable: React.FC<Module2ConsolidatedOpportunityTableProps> = ({
  opportunities
}) => {
  const strings = UI_STRINGS.module2SavingsDeduplication;
  const [selectedLever, setSelectedLever] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (selectedLever !== 'ALL' && opp.leverCode !== selectedLever) {
        return false;
      }
      if (selectedStatus !== 'ALL' && opp.deduplicationStatus !== selectedStatus) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = opp.opportunityId.toLowerCase().includes(term);
        const matchesScope = opp.categoryOrMaterialName.toLowerCase().includes(term);
        const matchesCode = opp.categoryOrMaterialId.toLowerCase().includes(term);
        if (!matchesId && !matchesScope && !matchesCode) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, selectedLever, selectedStatus, searchTerm]);

  const renderStatusBadge = (status: DeduplicationStatus) => {
    switch (status) {
      case 'MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {strings.badgeRetained}
          </span>
        );
      case 'DEDUPLICATED_OVERLAP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            {strings.badgeDeduplicated}
          </span>
        );
      case 'INCREMENTAL_VALIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            {strings.badgeIndependent}
          </span>
        );
      case 'UNRESOLVED_EXCLUDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            {strings.badgeExcluded}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {strings.opportunityRegisterTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredOpportunities.length} of {opportunities.length} canonical opportunity records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={strings.searchPlaceholder}
              className="pl-8 pr-3 py-1 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-52 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Lever Filter */}
          <select
            value={selectedLever}
            onChange={(e) => setSelectedLever(e.target.value)}
            className="text-xs border rounded-lg px-2.5 py-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Levers (1–10)</option>
            <option value="LEV-01">LEV-01: Direct Price</option>
            <option value="LEV-02">LEV-02: E-Auction</option>
            <option value="LEV-03">LEV-03: Vendor Consolidation</option>
            <option value="LEV-03-ADMIN">LEV-03: Admin PO</option>
            <option value="LEV-04">LEV-04: Volume Aggregation</option>
            <option value="LEV-05">LEV-05: Payment Terms</option>
            <option value="LEV-06">LEV-06: Category Specialisation</option>
            <option value="LEV-08">LEV-08: Specification Rationalisation</option>
            <option value="LEV-09">LEV-09: Procurement Compliance</option>
            <option value="LEV-10">LEV-10: Alternate Sourcing</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border rounded-lg px-2.5 py-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED">Maximum Defensible Retained</option>
            <option value="DEDUPLICATED_OVERLAP">Deduplicated Overlap</option>
            <option value="INCREMENTAL_VALIDATED">Incremental Validated</option>
            <option value="UNRESOLVED_EXCLUDED">Unresolved Excluded</option>
            <option value="DISCOVERY_ONLY">Discovery Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">{strings.colOpportunityId}</th>
              <th className="px-3.5 py-2.5">{strings.colLever}</th>
              <th className="px-3.5 py-2.5">{strings.colScope}</th>
              <th className="px-3.5 py-2.5 text-right">{strings.colGross}</th>
              <th className="px-3.5 py-2.5 text-right">Overlap Deducted</th>
              <th className="px-3.5 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                {strings.colNet}
              </th>
              <th className="px-3.5 py-2.5 text-right">{strings.colValidated}</th>
              <th className="px-3.5 py-2.5">{strings.colStatus}</th>
              <th className="px-3.5 py-2.5">{strings.colCalculationBasis}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {filteredOpportunities.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  {strings.emptyOpportunities}
                </td>
              </tr>
            ) : (
              filteredOpportunities.map((opp) => (
                <tr key={opp.opportunityId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-3.5 py-2.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {opp.opportunityId}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{opp.leverCode}</span>
                    <span className="block text-[10px] text-slate-400">{opp.leverName}</span>
                  </td>
                  <td className="px-3.5 py-2.5 max-w-[200px] truncate" title={opp.categoryOrMaterialName}>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{opp.categoryOrMaterialName}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{opp.categoryOrMaterialId}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    {opp.estimatedGrossSavingsCr > 0 ? `₹${opp.estimatedGrossSavingsCr.toFixed(4)} Cr` : '₹0.00 Cr'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap text-amber-600 dark:text-amber-400">
                    {opp.overlapAmountCr > 0 ? `-₹${opp.overlapAmountCr.toFixed(4)} Cr` : '—'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {opp.netEstimatedSavingsCr > 0 ? `₹${opp.netEstimatedSavingsCr.toFixed(4)} Cr` : '₹0.00 Cr'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-medium">
                    {opp.commerciallyValidatedSavingsCr > 0
                      ? `₹${opp.commerciallyValidatedSavingsCr.toFixed(4)} Cr`
                      : '₹0.00 Cr'}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    {renderStatusBadge(opp.deduplicationStatus)}
                  </td>
                  <td className="px-3.5 py-2.5 max-w-[220px] truncate text-slate-500 dark:text-slate-400" title={opp.calculationBasis}>
                    {opp.calculationBasis}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
