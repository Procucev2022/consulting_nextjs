'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import type { EAuctionMaterialCandidate, AuctionSuitabilityClassification } from '../../types/module2EAuction';
import { UI_STRINGS } from '../../constants';

export interface EAuctionMaterialTableProps {
  materials: EAuctionMaterialCandidate[];
  categoryName: string;
  onBack: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export const EAuctionMaterialTable: React.FC<EAuctionMaterialTableProps> = ({
  materials,
  categoryName,
  onBack
}) => {
  const strings = UI_STRINGS.module2EAuction;
  const [searchTerm, setSearchTerm] = useState('');
  const [suitabilityFilter, setSuitabilityFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (suitabilityFilter !== 'ALL' && m.suitability !== suitabilityFilter) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchCode = m.materialCode.toLowerCase().includes(q);
        const matchDesc = m.materialDesc.toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }
      return true;
    });
  }, [materials, suitabilityFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage, pageSize]);

  const getSuitabilityBadge = (status: AuctionSuitabilityClassification): React.ReactElement => {
    switch (status) {
      case 'Candidate for Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {strings.suitabilityCandidateForReview}
          </span>
        );
      case 'Further Data Required':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            {strings.suitabilityFurtherDataRequired}
          </span>
        );
      case 'Not Currently Suitable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            {strings.suitabilityNotCurrentlySuitable}
          </span>
        );
      case 'Not Assessed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
            <HelpCircle className="w-3 h-3 text-rose-600" />
            {strings.suitabilityNotAssessed}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={strings.btnBackToCategories}
            onClick={onBack}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {strings.categoryDrilldownTitle(categoryName)}
            </div>
            <div className="text-xs text-slate-500">
              {strings.categoryDrilldownSubtitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={strings.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <select
            aria-label={strings.filterSuitability}
            value={suitabilityFilter}
            onChange={(e) => {
              setSuitabilityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">{strings.allSuitabilities}</option>
            <option value="Candidate for Review">{strings.suitabilityCandidateForReview}</option>
            <option value="Further Data Required">{strings.suitabilityFurtherDataRequired}</option>
            <option value="Not Currently Suitable">{strings.suitabilityNotCurrentlySuitable}</option>
            <option value="Not Assessed">{strings.suitabilityNotAssessed}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold tracking-wide">
              <th className="py-3 px-3">{strings.colMaterialCode}</th>
              <th className="py-3 px-3">{strings.colMaterialDesc}</th>
              <th className="py-3 px-3">FY</th>
              <th className="py-3 px-3 text-right">Total Spend</th>
              <th className="py-3 px-3 text-right">{strings.colAddressableSpend}</th>
              <th className="py-3 px-3 min-w-[140px]">{strings.colSavingsRange}</th>
              <th className="py-3 px-3 text-right">Quantity & UOM</th>
              <th className="py-3 px-3 text-right">POs</th>
              <th className="py-3 px-3 text-right">Suppliers</th>
              <th className="py-3 px-3 text-right">Plants</th>
              <th className="py-3 px-3">Observed Price Range</th>
              <th className="py-3 px-3 text-right">Weighted Avg</th>
              <th className="py-3 px-3">Auction Suitability</th>
              <th className="py-3 px-3 min-w-[200px]">Evidence Rationale</th>
              <th className="py-3 px-3 min-w-[180px]">Governance Prerequisite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedMaterials.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-8 text-center text-slate-500">
                  {strings.noCandidatesFound}
                </td>
              </tr>
            ) : (
              paginatedMaterials.map((m) => {
                const sr = m.savingsRange;
                const hasRange = sr?.savingsRangeStatus === 'ESTIMATED';
                return (
                  <tr key={`${m.materialCode}-${m.financialYear}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">{m.materialCode}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 max-w-[220px]">{m.materialDesc}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{m.financialYear}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      ₹{m.totalSpendCr.toFixed(4)} Cr
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-purple-700 dark:text-purple-300">
                      ₹{(m.addressableSpendCr ?? 0).toFixed(4)} Cr
                    </td>
                    <td className="py-3 px-3">
                      {hasRange && sr ? (
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
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {m.totalQuantity.toLocaleString()} {m.uom}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-medium">{m.poCount}</td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-medium">{m.supplierCount}</td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">{m.plantCount}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{m.priceRangeStr}</td>
                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                      ₹{m.weightedAveragePrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">{getSuitabilityBadge(m.suitability)}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 text-[11px] leading-tight">{m.evidenceRationale}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] leading-tight">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <ShieldAlert className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span>{m.procurementReviewRequirements[0] || strings.defaultReviewRequirement}</span>
                      </div>
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
        <div className="flex items-center gap-3">
          <span>{strings.materialsShowingSummary(paginatedMaterials.length, filteredMaterials.length)}</span>
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              aria-label={strings.rowsPerPageLabel}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-300"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={strings.btnPreviousPage}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            {strings.paginationStatus(currentPage, totalPages)}
          </span>
          <button
            type="button"
            aria-label={strings.btnNextPage}
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
