import React, { useId } from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import type { VendorSupplyFilterBarProps } from '../../types/vendorSupply';
import { UI_STRINGS } from '../../constants/uiStrings';

export const VendorSupplyFilterBar: React.FC<VendorSupplyFilterBarProps> = ({
  searchQuery,
  categoryFilter,
  highSpendOnly,
  riskOnly,
  totalCount,
  filteredCount,
  onSearchChange,
  onCategoryFilterChange,
  onHighSpendToggle,
  onRiskToggle,
  onResetFilters
}) => {
  const strings = UI_STRINGS.module2.vendorSupply;
  const searchInputId = useId();

  const hasActiveFilters = Boolean(searchQuery || categoryFilter !== 'ALL' || highSpendOnly || riskOnly);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id={searchInputId}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={strings.tableSearchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="filter-vendor-all"
            onClick={() => onCategoryFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {strings.filterAll}
          </button>
          <button
            type="button"
            id="filter-vendor-multi"
            onClick={() => onCategoryFilterChange('MULTI_CATEGORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === 'MULTI_CATEGORY'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            {strings.filterMultiOnly}
          </button>
          <button
            type="button"
            id="filter-vendor-single"
            onClick={() => onCategoryFilterChange('SINGLE_CATEGORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === 'SINGLE_CATEGORY'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {strings.filterSingleOnly}
          </button>
          <button
            type="button"
            id="filter-vendor-high-spend"
            onClick={onHighSpendToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
              highSpendOnly
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>{strings.filterHighSpendOnly}</span>
          </button>
          <button
            type="button"
            id="filter-vendor-risk-only"
            onClick={onRiskToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
              riskOnly
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{strings.filterAlarmOnly}</span>
          </button>
        </div>
      </div>

      {/* Legend & Summary Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 gap-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <span>{strings.showingVendorsSummary(filteredCount, totalCount)}</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{strings.yoyLegendIncrease}</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-[11px] text-rose-700 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{strings.yoyLegendObservation}</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{strings.yoyLegendDecrease}</span>
          </span>
          <span className="inline-flex items-center space-x-1 text-[11px] text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{strings.yoyLegendRemark}</span>
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            id="btn-reset-vendor-filters"
            onClick={onResetFilters}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold self-start sm:self-auto"
          >
            {strings.resetFilters}
          </button>
        )}
      </div>
    </div>
  );
};
