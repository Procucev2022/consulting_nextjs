'use client';
import React, { useState, useMemo } from 'react';
import {
  Gavel,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown
} from 'lucide-react';
import type { RecurringConsolidationItem, VendorConsolidationSectionProps } from '../../types';
import {
  UI_STRINGS,
  CONSOLIDATION_CATEGORY_TABS,
  CONSOLIDATION_SORT_OPTIONS
} from '../../constants';
import {
  mockRecurringConsolidationItems,
  calculateVendorConsolidationSummary
} from '../../data/mockVendorConsolidation';
import { VendorConsolidationSummaryBanner } from './VendorConsolidationSummaryBanner';
import { VendorConsolidationCard } from './VendorConsolidationCard';
import { VendorConsolidationModal } from './VendorConsolidationModal';

export const VendorConsolidationSection: React.FC<VendorConsolidationSectionProps> = ({
  items = mockRecurringConsolidationItems
}) => {
  const strings = UI_STRINGS.vendorConsolidation;

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('SPEND_DESC');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedItem, setSelectedItem] = useState<RecurringConsolidationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Dynamic Summary Metrics
  const summary = useMemo(() => calculateVendorConsolidationSummary(items), [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          item.item_group_title.toLowerCase().includes(q) ||
          item.item_group_code.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.unspsc_family.toLowerCase().includes(q) ||
          item.suppliers.some((s) => s.vendor_name.toLowerCase().includes(q));

        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortOption === 'VENDORS_DESC') {
          return b.vendor_count - a.vendor_count;
        }
        if (sortOption === 'SAVINGS_DESC') {
          return b.est_volume_savings_cr - a.est_volume_savings_cr;
        }
        return b.total_spend_inr_cr - a.total_spend_inr_cr;
      });
  }, [items, selectedCategory, searchQuery, sortOption]);

  const handleOpenModal = (item: RecurringConsolidationItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div
      data-testid="vendor-consolidation-section"
      className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800/70 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
            {strings.badge}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2 mt-1">
            <Gavel className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{strings.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-4xl mt-0.5">
            {strings.subtitle}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            aria-label={strings.viewGrid}
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{strings.viewGrid}</span>
          </button>
          <button
            type="button"
            aria-label={strings.viewTable}
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{strings.viewTable}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <VendorConsolidationSummaryBanner summary={summary} />

      {/* Controls: Category Filter Tabs, Search & Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CONSOLIDATION_CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? strings.filterAll : cat}
            </button>
          ))}
        </div>

        {/* Search & Sort Options */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label={strings.searchPlaceholder}
              placeholder={strings.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label={strings.sortByLabel}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              {CONSOLIDATION_SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Line */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between">
        <span>{strings.showingItemsCount(filteredItems.length, items.length)}</span>
      </div>

      {/* Main Content: Card Grid View or Matrix Table View */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
          {strings.noResultsFound}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <VendorConsolidationCard
              key={item.id}
              item={item}
              onInitiateConsolidation={handleOpenModal}
            />
          ))}
        </div>
      ) : (
        /* Matrix Table View */
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">{strings.matrixColCategory}</th>
                <th className="py-3 px-3.5">{strings.matrixColItemGroup}</th>
                <th className="py-3 px-3.5 text-right">{strings.matrixColSpend}</th>
                <th className="py-3 px-3.5 text-center">{strings.matrixColVendors}</th>
                <th className="py-3 px-3.5 text-center">{strings.matrixColCadence}</th>
                <th className="py-3 px-3.5 text-right">{strings.matrixColVariance}</th>
                <th className="py-3 px-3.5 text-right">{strings.matrixColSavings}</th>
                <th className="py-3 px-3.5 text-right">{strings.matrixColAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.item_group_title}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.item_group_code}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{item.total_spend_inr_cr.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {item.vendor_count} Vendors
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono text-[10px] text-slate-500">
                    {item.procurement_cadence}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    +{item.price_variance_pct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                    ₹{item.est_volume_savings_cr.toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(item)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-colors"
                    >
                      Consolidate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <VendorConsolidationModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
