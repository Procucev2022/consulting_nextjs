'use client';
import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, Table, ShieldAlert, AlertTriangle, ExternalLink } from 'lucide-react';
import type {
  StrategicSingleVendorItem,
  StrategicSingleVendorRiskSectionProps
} from '../../types';
import {
  UI_STRINGS,
  STRATEGIC_RISK_FILTER_TYPES,
  type StrategicRiskFilterType,
  calculateStrategicRiskSummary,
  isSoleSource,
  isSingleDigitSecondary
} from '../../constants';
import { mockStrategicSingleVendorItems } from '../../data/mockStrategicSingleVendorItems';
import { StrategicRiskSummaryBanner } from './StrategicRiskSummaryBanner';
import { StrategicSingleVendorCard } from './StrategicSingleVendorCard';
import { StrategicRiskMitigationModal } from './StrategicRiskMitigationModal';

export const StrategicSingleVendorRiskSection: React.FC<StrategicSingleVendorRiskSectionProps> = ({
  items = mockStrategicSingleVendorItems
}) => {
  const strings = UI_STRINGS.module2.strategicVendorRisk;
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState<StrategicRiskFilterType>(STRATEGIC_RISK_FILTER_TYPES.ALL);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedItemForModal, setSelectedItemForModal] = useState<StrategicSingleVendorItem | null>(null);

  const summary = useMemo(() => calculateStrategicRiskSummary(items), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Risk filter
      if (riskFilter === STRATEGIC_RISK_FILTER_TYPES.SOLE_SOURCE && !isSoleSource(item)) {
        return false;
      }
      if (riskFilter === STRATEGIC_RISK_FILTER_TYPES.SINGLE_DIGIT_SECONDARY && !isSingleDigitSecondary(item)) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && item.core_bucket !== categoryFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.material_code.toLowerCase().includes(q);
        const matchDesc = item.material_desc.toLowerCase().includes(q);
        const matchPrimary = item.primary_vendor.vendor_name.toLowerCase().includes(q);
        const matchSecondary = item.secondary_vendor?.vendor_name.toLowerCase().includes(q) || false;
        const matchUnspsc = item.unspsc_code.toLowerCase().includes(q) || item.unspsc_commodity_title.toLowerCase().includes(q);
        return matchCode || matchDesc || matchPrimary || matchSecondary || matchUnspsc;
      }

      return true;
    });
  }, [items, riskFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Executive KPI Banner */}
      <StrategicRiskSummaryBanner summary={summary} />

      {/* Control Bar: Risk Filters, Category, Search, View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
        {/* Risk Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            data-testid="filter-all"
            onClick={() => setRiskFilter(STRATEGIC_RISK_FILTER_TYPES.ALL)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === STRATEGIC_RISK_FILTER_TYPES.ALL
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {strings.filters.all} ({summary.totalStrategicItems})
          </button>

          <button
            data-testid="filter-sole-source"
            onClick={() => setRiskFilter(STRATEGIC_RISK_FILTER_TYPES.SOLE_SOURCE)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              riskFilter === STRATEGIC_RISK_FILTER_TYPES.SOLE_SOURCE
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{strings.filters.soleSourceOnly} ({summary.soleSourceCount})</span>
          </button>

          <button
            data-testid="filter-single-digit"
            onClick={() => setRiskFilter(STRATEGIC_RISK_FILTER_TYPES.SINGLE_DIGIT_SECONDARY)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              riskFilter === STRATEGIC_RISK_FILTER_TYPES.SINGLE_DIGIT_SECONDARY
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{strings.filters.singleDigitOnly} ({summary.singleDigitSecondaryCount})</span>
          </button>
        </div>

        {/* Right Search, Category & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={strings.filters.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">{strings.filters.categoryAll}</option>
            <option value="Direct Materials">Direct Materials</option>
            <option value="Packaging Materials">Packaging Materials</option>
            <option value="Indirect & MRO">Indirect & MRO</option>
            <option value="Logistics & Freight">Logistics & Freight</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title={strings.views.cardView}
              aria-label={strings.views.cardView}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title={strings.views.tableView}
              aria-label={strings.views.tableView}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Results Display */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
          {strings.emptyMessage}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredItems.map((item) => (
            <StrategicSingleVendorCard
              key={item.material_code}
              item={item}
              onSelectDetails={(selected) => setSelectedItemForModal(selected)}
            />
          ))}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto bg-white dark:bg-slate-900">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">{strings.table.materialCode}</th>
                <th className="py-2.5 px-3">{strings.table.category}</th>
                <th className="py-2.5 px-3 text-right">{strings.table.spendCr}</th>
                <th className="py-2.5 px-3">{strings.table.primaryVendor}</th>
                <th className="py-2.5 px-3">{strings.table.secondaryVendor}</th>
                <th className="py-2.5 px-3">{strings.table.unspsc}</th>
                <th className="py-2.5 px-3">{strings.table.riskLevel}</th>
                <th className="py-2.5 px-3 text-center">{strings.table.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const soleSource = isSoleSource(item);
                return (
                  <tr
                    key={item.material_code}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {item.material_code}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]" title={item.material_desc}>
                        {item.material_desc}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                      {item.core_bucket}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{item.total_spend_inr_cr.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[160px]" title={item.primary_vendor.vendor_name}>
                        {item.primary_vendor.vendor_name}
                      </span>
                      <span className="font-mono text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                        {item.primary_vendor.share_percentage.toFixed(1)}% Share
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {item.secondary_vendor ? (
                        <div>
                          <span className="text-slate-700 dark:text-slate-300 block truncate max-w-[150px]" title={item.secondary_vendor.vendor_name}>
                            {item.secondary_vendor.vendor_name}
                          </span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-[10px] bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 inline-block mt-0.5">
                            {item.secondary_vendor.share_percentage.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                          None (100% Sole)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold block">
                        {item.unspsc_code}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block max-w-[150px]" title={item.unspsc_commodity_title}>
                        {item.unspsc_commodity_title}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded border inline-block ${
                          soleSource
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {soleSource ? 'SOLE SOURCE' : 'DOMINANT < 10%'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedItemForModal(item)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950 text-cyan-600 dark:text-cyan-400 transition-colors"
                        title={strings.card.actionBtn}
                        aria-label={strings.card.actionBtn}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Risk Mitigation Deep-Dive Modal */}
      <StrategicRiskMitigationModal
        item={selectedItemForModal}
        isOpen={Boolean(selectedItemForModal)}
        onClose={() => setSelectedItemForModal(null)}
      />
    </div>
  );
};
