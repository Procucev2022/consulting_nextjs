'use client';

import React, { useState, useMemo } from 'react';
import { Layers, Search, LayoutGrid, Table, ArrowUpDown } from 'lucide-react';
import type { PoConsolidationSectionProps, MultiplePoItem, PoConsolidationCadence } from '../../types/poConsolidation';
import { calculatePoConsolidationSummary } from '../../data/mockPoConsolidation';
import { PO_CONSOLIDATION_CATEGORY_TABS, PO_CONSOLIDATION_SORT_OPTIONS, getCadenceBadgeClass } from '../../constants/poConsolidation';
import { UI_STRINGS } from '../../constants/uiStrings';
import { PoConsolidationSummaryBanner } from './PoConsolidationSummaryBanner';
import { PoConsolidationCard } from './PoConsolidationCard';
import { PoConsolidationModal } from './PoConsolidationModal';

export const PoConsolidationSection: React.FC<PoConsolidationSectionProps> = ({
  items = []
}) => {
  const [globalCadence, setGlobalCadence] = useState<PoConsolidationCadence>('QUARTERLY');
  const [cardCadences, setCardCadences] = useState<Record<string, PoConsolidationCadence>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('POS_DESC');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [selectedItemForModal, setSelectedItemForModal] = useState<MultiplePoItem | null>(null);
  const [modalActiveCadence, setModalActiveCadence] = useState<PoConsolidationCadence>('QUARTERLY');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSelectGlobalCadence = (cadence: PoConsolidationCadence): void => {
    setGlobalCadence(cadence);
    const updated: Record<string, PoConsolidationCadence> = {};
    items.forEach((item) => {
      updated[item.id] = cadence;
    });
    setCardCadences(updated);
  };

  const handleSelectCardCadence = (itemId: string, cadence: PoConsolidationCadence): void => {
    setCardCadences((prev) => ({ ...prev, [itemId]: cadence }));
  };

  const handleOpenModal = (item: MultiplePoItem): void => {
    setSelectedItemForModal(item);
    setModalActiveCadence(cardCadences[item.id] || item.recommended_cadence || globalCadence);
    setIsModalOpen(true);
  };

  const summary = useMemo(() => {
    return calculatePoConsolidationSummary(items, globalCadence);
  }, [items, globalCadence]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.vendor_name.toLowerCase().includes(q) ||
          item.item_description.toLowerCase().includes(q) ||
          item.material_code.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.primary_plant.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const cadA = cardCadences[a.id] || globalCadence;
        const cadB = cardCadences[b.id] || globalCadence;
        if (sortBy === 'SPEND_DESC') return b.total_annual_spend_cr - a.total_annual_spend_cr;
        if (sortBy === 'SAVINGS_DESC') {
          return b.cadence_options[cadB].scale_savings_cr - a.cadence_options[cadA].scale_savings_cr;
        }
        return b.annual_po_count - a.annual_po_count;
      });
  }, [items, selectedCategory, searchQuery, sortBy, cardCadences, globalCadence]);

  return (
    <div data-testid="po-consolidation-section" className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase tracking-wide">
              {UI_STRINGS.poConsolidation.badge}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2 mt-1">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{UI_STRINGS.poConsolidation.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl mt-0.5">
            {UI_STRINGS.poConsolidation.subtitle}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 self-start lg:self-center">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.poConsolidation.viewGrid}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.poConsolidation.viewTable}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Banner with Global Cadence Simulator */}
      <PoConsolidationSummaryBanner
        summary={summary}
        selectedGlobalCadence={globalCadence}
        onSelectGlobalCadence={handleSelectGlobalCadence}
      />

      {/* Control Bar: Categories, Search, Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PO_CONSOLIDATION_CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? UI_STRINGS.poConsolidation.filterAll : cat}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={UI_STRINGS.poConsolidation.searchPlaceholder}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs w-60 sm:w-72 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {PO_CONSOLIDATION_SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid or Table */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          {UI_STRINGS.poConsolidation.noResultsFound}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <PoConsolidationCard
              key={item.id}
              item={item}
              selectedCadence={cardCadences[item.id] || globalCadence}
              onSelectCadence={handleSelectCardCadence}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">{UI_STRINGS.poConsolidation.matrixColSupplier}</th>
                <th className="p-3">{UI_STRINGS.poConsolidation.matrixColCategory}</th>
                <th className="p-3 text-right">{UI_STRINGS.poConsolidation.matrixColSpend}</th>
                <th className="p-3 text-center">{UI_STRINGS.poConsolidation.matrixColFrequency}</th>
                <th className="p-3 text-right">{UI_STRINGS.poConsolidation.matrixColAvgPo}</th>
                <th className="p-3 text-center">{UI_STRINGS.poConsolidation.matrixColRecommended}</th>
                <th className="p-3 text-right">{UI_STRINGS.poConsolidation.matrixColScaleBenefit}</th>
                <th className="p-3 text-center">{UI_STRINGS.poConsolidation.matrixColAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const cadence = cardCadences[item.id] || globalCadence;
                const opt = item.cadence_options[cadence];
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      <div>{item.vendor_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.material_code}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{item.category}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{item.total_annual_spend_cr.toFixed(2)} Cr
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {item.avg_pos_per_month} POs/Mo ({item.annual_po_count}/Yr)
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      ₹{item.avg_po_value_lakhs.toFixed(1)}L
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${getCadenceBadgeClass(item.recommended_cadence)}`}>
                        {item.cadence_options[item.recommended_cadence].label}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">
                      ₹{opt.scale_savings_cr.toFixed(2)} Cr (+{opt.scale_discount_pct}%)
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold"
                      >
                        Consolidate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <PoConsolidationModal
        item={selectedItemForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeCadence={modalActiveCadence}
        onCadenceChange={(cad) => {
          setModalActiveCadence(cad);
          if (selectedItemForModal) {
            handleSelectCardCadence(selectedItemForModal.id, cad);
          }
        }}
      />
    </div>
  );
};
