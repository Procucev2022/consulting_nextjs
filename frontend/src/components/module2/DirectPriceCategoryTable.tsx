'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  FolderTree
} from 'lucide-react';
import type { DirectPriceCategorySummary } from '../../types';
import { UI_STRINGS } from '../../constants';

export interface DirectPriceCategoryTableProps {
  categories: DirectPriceCategorySummary[];
  onSelectCategory: (category: DirectPriceCategorySummary) => void;
  selectedCategoryName?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export const DirectPriceCategoryTable: React.FC<DirectPriceCategoryTableProps> = ({
  categories,
  onSelectCategory,
  selectedCategoryName
}) => {
  const strings = UI_STRINGS.module2DirectPrice;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'spend' | 'opp' | 'txs' | 'mats'>('spend');
  const [sortAsc, setSortAsc] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => {
        if (statusFilter !== 'ALL' && c.dataQualityStatus !== statusFilter) {
          return false;
        }
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchCode = c.unspscCode.toLowerCase().includes(q);
          const matchTitle = c.unspscCategory.toLowerCase().includes(q);
          const matchSpendCat = c.spendCategory.toLowerCase().includes(q);
          if (!matchCode && !matchTitle && !matchSpendCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a.actualPurchaseCostInr;
        let valB = b.actualPurchaseCostInr;
        if (sortField === 'opp') {
          valA = a.historicalLostOpportunityInr;
          valB = b.historicalLostOpportunityInr;
        } else if (sortField === 'txs') {
          valA = a.eligibleTransactionCount;
          valB = b.eligibleTransactionCount;
        } else if (sortField === 'mats') {
          valA = a.distinctMaterialCount;
          valB = b.distinctMaterialCount;
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [categories, statusFilter, searchTerm, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const handleSort = (field: 'spend' | 'opp' | 'txs' | 'mats'): void => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search category code, name or group..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Qualification States</option>
            <option value="Qualified">Qualified</option>
            <option value="Requires Data Review">Requires Data Review</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary UNSPSC Category Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold tracking-wide">
              <th className="py-3 px-3">1. {strings.colUnspscCode}</th>
              <th className="py-3 px-3">2. {strings.colUnspscCategory}</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('mats')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>3. {strings.colDistinctMaterials}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('txs')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>4. {strings.colEligibleTransactions}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('spend')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>5. {strings.colEligibleSpend}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">6. {strings.colActualPurchaseCost}</th>
              <th className="py-3 px-3 text-right">7. {strings.colBenchmarkCost}</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('opp')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>8. {strings.colOpportunity}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">9. {strings.colOpportunityPct}</th>
              <th className="py-3 px-3">10. {strings.colDataQualityStatus}</th>
              <th className="py-3 px-3 text-center">Drill-Down</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedCategories.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-500">
                  No UNSPSC categories matching the selected criteria.
                </td>
              </tr>
            ) : (
              paginatedCategories.map((c) => {
                const isSelected = selectedCategoryName === c.spendCategory;
                const isReview = c.dataQualityStatus !== 'Qualified';

                return (
                  <tr
                    key={c.spendCategory}
                    onClick={() => onSelectCategory(c)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/30 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-950/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {c.unspscCode}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {c.unspscCategory}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Source Category: {c.spendCategory}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {c.distinctMaterialCount}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {c.eligibleTransactionCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      ₹{c.eligibleSpendCr.toFixed(4)} Cr
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                      ₹{c.actualPurchaseCostCr.toFixed(4)} Cr
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                      ₹{c.benchmarkCostCr.toFixed(4)} Cr
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {c.historicalLostOpportunityCr > 0 ? `₹${c.historicalLostOpportunityCr.toFixed(4)} Cr` : '₹0.00'}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {c.opportunityPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isReview
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {isReview ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {c.dataQualityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCategory(c);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded font-medium text-[11px] transition-colors"
                      >
                        <FolderTree className="w-3 h-3" />
                        <span>{strings.btnViewMaterials}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {paginatedCategories.length} of {filteredCategories.length} categories analysed
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
