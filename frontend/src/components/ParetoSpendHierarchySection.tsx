'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Layers,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import type {
  ParetoHierarchyParent,
  ParetoSpendHierarchyProps
} from '../types';
import { UI_STRINGS } from '../constants';
import { getDefaultParetoData } from '../utils/paretoCalculator';

export const ParetoSpendHierarchySection: React.FC<ParetoSpendHierarchyProps> = ({
  vendorHierarchy: propVendorHierarchy,
  itemHierarchy: propItemHierarchy,
  totalSpendCr: propTotalSpendCr,
  currency = '₹'
}) => {
  const [activeTab, setActiveTab] = useState<'vendor' | 'item'>('vendor');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback to rich pre-seeded data if props are omitted
  const defaultData = useMemo(() => getDefaultParetoData(), []);
  const vendorHierarchy = propVendorHierarchy || defaultData.vendorHierarchy;
  const itemHierarchy = propItemHierarchy || defaultData.itemHierarchy;
  const totalSpend = propTotalSpendCr || defaultData.totalSpendCr;

  const currentHierarchy: ParetoHierarchyParent[] = activeTab === 'vendor' ? vendorHierarchy : itemHierarchy;

  // Filter hierarchy by search query
  const filteredHierarchy = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentHierarchy;
    }
    const q = searchQuery.toLowerCase().trim();
    return currentHierarchy.filter((parent) => {
      const matchParent = parent.name.toLowerCase().includes(q);
      const matchChild = parent.children.some((c) => c.name.toLowerCase().includes(q));
      return matchParent || matchChild;
    });
  }, [currentHierarchy, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set(filteredHierarchy.map((p) => p.id));
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const strings = UI_STRINGS.module1.paretoHierarchy;

  // Compute total spend in current visible Pareto set
  const visibleParetoSpend = useMemo(() => {
    return filteredHierarchy.reduce((acc, curr) => acc + curr.totalSpendCr, 0);
  }, [filteredHierarchy]);

  const visiblePercentage = totalSpend > 0 ? Number(((visibleParetoSpend / totalSpend) * 100).toFixed(1)) : 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded border border-sky-200 flex items-center space-x-1">
                <BarChart3 className="w-3 h-3 inline mr-1" />
                <span>{strings.badge}</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {strings.excelViewBadge}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {strings.sectionTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {strings.sectionSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-900">
              {strings.cumulativeLabel(visibleParetoSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 }))}
            </div>
          </div>
        </div>

        {/* Tab Selection & Table Actions Toolbar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab('vendor');
                setExpandedIds(new Set());
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'vendor'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{strings.tabVendorFirst}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('item');
                setExpandedIds(new Set());
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'item'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{strings.tabItemFirst}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={strings.searchPlaceholder}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 w-44 sm:w-60"
              />
            </div>
            <button
              onClick={handleExpandAll}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {strings.expandAll}
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {strings.collapseAll}
            </button>
          </div>
        </div>
      </div>

      {/* Excel Pivot Hierarchical Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-[#d9eaf7] text-slate-800 border-b border-sky-300/80 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4 w-[38%] border-r border-sky-200/60">
                <div className="flex items-center justify-between">
                  <span>{activeTab === 'vendor' ? strings.vendorColumn : strings.itemColumn}</span>
                  <SlidersHorizontal className="w-3 h-3 text-sky-700 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-4 w-[42%] border-r border-sky-200/60">
                <div className="flex items-center justify-between">
                  <span>{activeTab === 'vendor' ? strings.itemColumn : strings.vendorColumn}</span>
                  <span className="text-[10px] font-normal lowercase opacity-70">(collapsible)</span>
                </div>
              </th>
              <th className="py-2.5 px-4 w-[20%] text-right">
                <span>{strings.spendColumn}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHierarchy.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
                  {strings.noRecords}
                </td>
              </tr>
            ) : (
              filteredHierarchy.map((parent) => {
                const isExpanded = expandedIds.has(parent.id);
                return (
                  <React.Fragment key={parent.id}>
                    {/* Parent Row */}
                    <tr
                      onClick={() => toggleExpand(parent.id)}
                      className={`cursor-pointer transition-colors group ${
                        isExpanded
                          ? 'bg-sky-50/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-4 font-bold text-slate-900 border-r border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-slate-300 bg-white text-slate-700 group-hover:border-sky-500 text-[10px] font-mono select-none">
                            {isExpanded ? '-' : '+'}
                          </span>
                          <span className="truncate max-w-xs sm:max-w-md" title={parent.name}>
                            {parent.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-slate-500 border-r border-slate-100">
                        <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400 italic">
                          {isExpanded ? (
                            <span className="not-italic text-sky-700 font-medium">
                              {activeTab === 'vendor'
                                ? strings.childItemsCount(parent.children.length)
                                : strings.childVendorsCount(parent.children.length)}
                            </span>
                          ) : (
                            <span>
                              {activeTab === 'vendor'
                                ? `[+] ${strings.childItemsCount(parent.children.length)} (click to expand)`
                                : `[+] ${strings.childVendorsCount(parent.children.length)} (click to expand)`}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                        {currency} {parent.totalSpendCr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Child Rows (Rendered when expanded) */}
                    {isExpanded &&
                      parent.children.map((child, cIdx) => (
                        <tr
                          key={`${parent.id}-child-${cIdx}`}
                          className="bg-slate-50/70 hover:bg-slate-100/60 text-slate-700"
                        >
                          <td className="py-1.5 px-4 pl-10 border-r border-slate-100 text-slate-400 text-[11px]">
                            <span className="border-l-2 border-slate-300 pl-2">↳</span>
                          </td>
                          <td className="py-1.5 px-4 border-r border-slate-100 font-medium text-slate-800">
                            <span className="truncate block max-w-sm sm:max-w-lg" title={child.name}>
                              {child.name}
                            </span>
                          </td>
                          <td className="py-1.5 px-4 text-right font-mono text-slate-600">
                            {currency} {child.spendCr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pareto Cutoff Notice */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{strings.showingSummary(filteredHierarchy.length, currentHierarchy.length, visiblePercentage)}</span>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          {strings.cutoffNotice}
        </div>
      </div>
    </div>
  );
};
