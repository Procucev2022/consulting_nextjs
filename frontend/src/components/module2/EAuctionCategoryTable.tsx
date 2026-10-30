'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  FolderTree
} from 'lucide-react';
import type {
  EAuctionCategoryCandidate,
  AuctionSuitabilityClassification
} from '../../types/module2EAuction';
import { UI_STRINGS } from '../../constants';
import { resolveHumanReadableCategory } from '../../utils/procurementCategoryResolver';

export interface EAuctionCategoryTableProps {
  categories: EAuctionCategoryCandidate[];
  onSelectCategory: (category: EAuctionCategoryCandidate) => void;
  selectedCategoryName?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function getSuitabilityBadge(status: AuctionSuitabilityClassification): React.ReactElement {
  switch (status) {
    case 'Candidate for Review':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {UI_STRINGS.module2EAuction.suitabilityCandidateForReview}
        </span>
      );
    case 'Further Data Required':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          {UI_STRINGS.module2EAuction.suitabilityFurtherDataRequired}
        </span>
      );
    case 'Not Currently Suitable':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <AlertCircle className="w-3 h-3 text-slate-500" />
          {UI_STRINGS.module2EAuction.suitabilityNotCurrentlySuitable}
        </span>
      );
    case 'Not Assessed':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
          <HelpCircle className="w-3 h-3 text-rose-600" />
          {UI_STRINGS.module2EAuction.suitabilityNotAssessed}
        </span>
      );
  }
}

export const EAuctionCategoryTable: React.FC<EAuctionCategoryTableProps> = ({
  categories,
  onSelectCategory,
  selectedCategoryName
}) => {
  const strings = UI_STRINGS.module2EAuction;
  const [searchTerm, setSearchTerm] = useState('');
  const [suitabilityFilter, setSuitabilityFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'spend' | 'mats' | 'pos' | 'suppliers'>('spend');
  const [sortAsc, setSortAsc] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => {
        if (suitabilityFilter !== 'ALL' && c.auctionSuitability !== suitabilityFilter) return false;
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
        let valA = a.totalSpendInr;
        let valB = b.totalSpendInr;
        if (sortField === 'mats') {
          valA = a.distinctMaterialCount;
          valB = b.distinctMaterialCount;
        } else if (sortField === 'pos') {
          valA = a.poCount;
          valB = b.poCount;
        } else if (sortField === 'suppliers') {
          valA = a.supplierCount;
          valB = b.supplierCount;
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [categories, suitabilityFilter, searchTerm, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  // A shrinking result set (for example after a financial year change) must not leave the table on an empty page.
  const activePage = Math.min(currentPage, totalPages);
  const paginatedCategories = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, activePage, pageSize]);

  const handleSort = (field: 'spend' | 'mats' | 'pos' | 'suppliers'): void => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={strings.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            aria-label={strings.filterSuitability}
            value={suitabilityFilter}
            onChange={(e) => {
              setSuitabilityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">{strings.allSuitabilities}</option>
            <option value="Candidate for Review">{strings.suitabilityCandidateForReview}</option>
            <option value="Further Data Required">{strings.suitabilityFurtherDataRequired}</option>
            <option value="Not Currently Suitable">{strings.suitabilityNotCurrentlySuitable}</option>
            <option value="Not Assessed">{strings.suitabilityNotAssessed}</option>
          </select>

          <select
            aria-label={strings.rowsPerPageLabel}
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

      {/* 14 Columns Table with Addressable Spend & Estimated Savings Range */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold tracking-wide">
              <th className="py-3 px-3">1. {strings.colUnspscCode}</th>
              <th className="py-3 px-3">2. {strings.colUnspscCategory}</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('spend')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>3. {strings.colTotalSpend}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">4. {strings.colAddressableSpend}</th>
              <th className="py-3 px-3 text-right">5. {strings.colPurchaseQuantity}</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('mats')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>6. {strings.colDistinctMaterials}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('pos')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>7. {strings.colPoCount}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => handleSort('suppliers')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>8. {strings.colSupplierCount}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">9. {strings.colPriceVariation}</th>
              <th className="py-3 px-3">10. {strings.colAuctionSuitability}</th>
              <th className="py-3 px-3 min-w-[150px]">11. {strings.colSavingsRange}</th>
              <th className="py-3 px-3 min-w-[180px]">12. {strings.colEvidenceRationale}</th>
              <th className="py-3 px-3 min-w-[160px]">13. {strings.colDataLimitations}</th>
              <th className="py-3 px-3 text-center">14. Drill-Down</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedCategories.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-slate-500">
                  {strings.noCandidatesFound}
                </td>
              </tr>
            ) : (
              paginatedCategories.map((c) => {
                const isSelected = selectedCategoryName === c.spendCategory;
                const sr = c.savingsRange;
                const hasRange = sr?.savingsRangeStatus === 'ESTIMATED';

                return (
                  <tr
                    key={c.spendCategory}
                    onClick={() => onSelectCategory(c)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/30 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-950/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{c.unspscCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {resolveHumanReadableCategory(c.unspscCategory || c.spendCategory)}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      ₹{c.totalSpendCr.toFixed(4)} Cr
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-purple-700 dark:text-purple-300">
                      ₹{c.addressableSpendCr.toFixed(4)} Cr
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {c.purchaseQuantity.toLocaleString()} {c.uom}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {c.distinctMaterialCount}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {c.poCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-medium">
                      {c.supplierCount}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{c.priceVariationIndicator}</td>
                    <td className="py-3 px-3">{getSuitabilityBadge(c.auctionSuitability)}</td>
                    <td className="py-3 px-3">
                      {hasRange ? (
                        <div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-300">
                            ₹{sr.minEstimatedSavingsCr?.toFixed(2)} - ₹{sr.maxEstimatedSavingsCr?.toFixed(2)} Cr
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {strings.expectedSavingsDetail(sr.expectedEstimatedSavingsCr?.toFixed(2) ?? '', ((sr.expectedSavingsRate || 0) * 100).toFixed(1))}
                          </div>
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                            {strings.planningAssumptionBadge}
                          </div>
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {strings.statusNotYetQuantifiable}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 text-[11px] leading-tight">
                      {c.evidenceBasedRationale}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] leading-tight">{c.dataLimitations}</td>
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
          {strings.categoriesShowingSummary(paginatedCategories.length, filteredCategories.length)}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={strings.btnPreviousPage}
            disabled={activePage <= 1}
            onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            {strings.paginationStatus(activePage, totalPages)}
          </span>
          <button
            type="button"
            aria-label={strings.btnNextPage}
            disabled={activePage >= totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
