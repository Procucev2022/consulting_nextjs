'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Users, Package, Factory } from 'lucide-react';
import type {
  CategoryConsolidationProfile,
  VendorConsolidationCategoryTableProps
} from '../../types/module2VendorConsolidation';
import { UI_STRINGS, CONSOLIDATION_STATUS_LABELS, VENDOR_CONSOLIDATION_UI_CONFIG } from '../../constants';
import { resolveHumanReadableCategory } from '../../utils/procurementCategoryResolver';

function matchesSearchQuery(category: CategoryConsolidationProfile, query: string): boolean {
  return (
    category.spendCategory.toLowerCase().includes(query) ||
    category.unspscCode.toLowerCase().includes(query) ||
    category.unspscCategory.toLowerCase().includes(query)
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case CONSOLIDATION_STATUS_LABELS.OPPORTUNITY_IDENTIFIED:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    case CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    case CONSOLIDATION_STATUS_LABELS.INSUFFICIENT_DATA:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    default:
      return 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800';
  }
}

function getFragmentationBadgeClass(level: string): string {
  switch (level) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-300';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
  }
}

function getClassificationBadgeClass(type: string): string {
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
}

export const VendorConsolidationCategoryTable: React.FC<VendorConsolidationCategoryTableProps> = ({
  categories,
  onSelectCategory
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(VENDOR_CONSOLIDATION_UI_CONFIG.ALL_FILTER_VALUE);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (
        statusFilter !== VENDOR_CONSOLIDATION_UI_CONFIG.ALL_FILTER_VALUE &&
        category.categoryOpportunityStatus !== statusFilter
      ) {
        return false;
      }
      if (searchTerm) {
        return matchesSearchQuery(category, searchTerm.toLowerCase());
      }
      return true;
    });
  }, [categories, searchTerm, statusFilter]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {strings.tabCategoryAnalysis}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {strings.tabCategorySubtitle}
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
            <option value={VENDOR_CONSOLIDATION_UI_CONFIG.ALL_FILTER_VALUE}>{strings.allStatuses}</option>
            <option value={CONSOLIDATION_STATUS_LABELS.OPPORTUNITY_IDENTIFIED}>
              {strings.filterOptionOpportunityIdentified}
            </option>
            <option value={CONSOLIDATION_STATUS_LABELS.POTENTIAL_OPPORTUNITY}>
              {strings.filterOptionPotentialOpportunity}
            </option>
            <option value={CONSOLIDATION_STATUS_LABELS.NO_CLEAR_OPPORTUNITY}>
              {strings.filterOptionNoClearOpportunity}
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3">{strings.colUnspscCategory}</th>
              <th className="py-2.5 px-3">{strings.colUnspscCode}</th>
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
              filteredCategories.map((category) => (
                <tr
                  key={category.spendCategory}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>
                        {resolveHumanReadableCategory(category.spendCategory || category.unspscCategory, category.unspscCode)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getClassificationBadgeClass(
                          category.classificationType
                        )}`}
                      >
                        {category.classificationLabel}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-700">
                    <span className="bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {category.unspscCode || strings.emptyCodePlaceholder}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {strings.formatCrore(category.totalSpendCr.toFixed(4))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    {strings.formatCrore(category.sameMaterialMultiSourcingSpendCr.toFixed(4))}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[10px]">
                    {category.categoryConsolidationCandidateStatus === 'NOT_APPLICABLE' ? (
                      <span className="text-slate-400">{UI_STRINGS.common.notAvailable}</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {strings.statusNotYetQuantifiable}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Users className="w-3 h-3 text-slate-400" />
                      {category.distinctSuppliersCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Package className="w-3 h-3 text-slate-400" />
                      {category.distinctMaterialsCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Factory className="w-3 h-3 text-slate-400" />
                      {category.distinctPlantsCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {strings.formatPercent(category.top1SharePct.toFixed(1))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {strings.formatPercent(category.top3SharePct.toFixed(1))}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getFragmentationBadgeClass(
                        category.fragmentationLevel
                      )}`}
                    >
                      {category.fragmentationLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(
                        category.categoryOpportunityStatus
                      )}`}
                    >
                      {category.categoryOpportunityStatus}
                    </span>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {category.categoryOpportunityReason}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectCategory(category)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1 mx-auto"
                    >
                      <span>{strings.btnAnalyse}</span>
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
