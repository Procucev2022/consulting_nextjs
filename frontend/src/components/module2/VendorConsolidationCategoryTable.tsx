'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Users, Package, Factory } from 'lucide-react';
import type { CategoryConsolidationProfile } from '../../types/module2VendorConsolidation';
import { UI_STRINGS } from '../../constants';
import { resolveHumanReadableCategory } from '../../utils/procurementCategoryResolver';

interface VendorConsolidationCategoryTableProps {
  categories: CategoryConsolidationProfile[];
  onSelectCategory: (category: CategoryConsolidationProfile) => void;
}

export const VendorConsolidationCategoryTable: React.FC<VendorConsolidationCategoryTableProps> = ({
  categories,
  onSelectCategory
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (statusFilter !== 'ALL' && c.categoryOpportunityStatus !== statusFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          c.spendCategory.toLowerCase().includes(query) ||
          c.unspscCode.toLowerCase().includes(query) ||
          c.unspscCategory.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [categories, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Opportunity Identified':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Potential Opportunity — Further Validation Required':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Insufficient Data':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getFragmentationBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const getClassificationBadge = (type: string) => {
    switch (type) {
      case 'VERIFIED_UNSPSC':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'PROVISIONAL_UNSPSC':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'SOURCE_SPEND_CATEGORY':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {strings.tabCategoryAnalysis}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Categories assessed for supplier fragmentation, multi-sourcing, and enterprise consolidation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={strings.searchPlaceholder}
              className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">{strings.allStatuses}</option>
            <option value="Opportunity Identified">Opportunity Identified</option>
            <option value="Potential Opportunity — Further Validation Required">Potential Opportunity</option>
            <option value="No Clear Opportunity Identified">No Clear Opportunity</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">{strings.colUnspscCategory}</th>
              <th className="py-2.5 px-3">Column L Code</th>
              <th className="py-2.5 px-3 text-right">{strings.colTotalSpend}</th>
              <th className="py-2.5 px-3 text-right">{strings.colAddressableSpend}</th>
              <th className="py-2.5 px-3 text-center">{strings.colCategoryCandidateSpend}</th>
              <th className="py-2.5 px-3 text-center">{strings.colDistinctSuppliers}</th>
              <th className="py-2.5 px-3 text-center">{strings.colDistinctMaterials}</th>
              <th className="py-2.5 px-3 text-center">{strings.colDistinctPlants}</th>
              <th className="py-2.5 px-3 text-right">{strings.colTop1Share}</th>
              <th className="py-2.5 px-3 text-right">{strings.colCr3Share}</th>
              <th className="py-2.5 px-3 text-center">{strings.colFragmentation}</th>
              <th className="py-2.5 px-3">{strings.colOpportunityStatus}</th>
              <th className="py-2.5 px-3 text-center">{UI_STRINGS.common.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-6 text-center text-slate-500">
                  {strings.noRecordsFound}
                </td>
              </tr>
            ) : (
              filteredCategories.map((c) => (
                <tr
                  key={c.spendCategory}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{resolveHumanReadableCategory(c.spendCategory || c.unspscCategory, c.unspscCode)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getClassificationBadge(c.classificationType)}`}>
                        {c.classificationLabel}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-700">
                    <span className="bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {c.unspscCode || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{c.totalSpendCr.toFixed(4)} Cr
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    ₹{c.sameMaterialMultiSourcingSpendCr.toFixed(4)} Cr
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[10px]">
                    {c.categoryConsolidationCandidateStatus === 'NOT_APPLICABLE' ? (
                      <span className="text-slate-400">N/A</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {strings.statusNotYetQuantifiable}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Users className="w-3 h-3 text-slate-400" />
                      {c.distinctSuppliersCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Package className="w-3 h-3 text-slate-400" />
                      {c.distinctMaterialsCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Factory className="w-3 h-3 text-slate-400" />
                      {c.distinctPlantsCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {c.top1SharePct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {c.top3SharePct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getFragmentationBadge(
                        c.fragmentationLevel
                      )}`}
                    >
                      {c.fragmentationLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                        c.categoryOpportunityStatus
                      )}`}
                    >
                      {c.categoryOpportunityStatus}
                    </span>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {c.categoryOpportunityReason}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectCategory(c)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1 mx-auto"
                    >
                      <span>Analyse</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
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
