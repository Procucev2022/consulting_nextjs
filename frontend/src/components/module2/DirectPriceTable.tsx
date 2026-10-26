'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import type {
  DirectPriceTableProps,
  ItemQualificationStatus
} from '../../types';
import { UI_STRINGS } from '../../constants';

export const DirectPriceTable: React.FC<DirectPriceTableProps> = ({
  items,
  availableFinancialYears,
  selectedFinancialYear,
  onSelectFinancialYear,
  onViewEvidence
}) => {
  const strings = UI_STRINGS.module2DirectPrice;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        item.materialDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.spendCategory.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'ALL' || item.qualificationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const getStatusBadge = (status: ItemQualificationStatus, warnings: string[]): React.ReactElement => {
    if (status === 'QUALIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          {strings.statusQualified}
        </span>
      );
    }

    const isCommodity = status === 'VOLATILE_COMMODITY';
    const label = isCommodity ? strings.statusVolatileCommodity : strings.statusSpecMismatch;

    return (
      <div className="flex flex-col gap-1 items-start">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isCommodity
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          {label}
        </span>
        {warnings.length > 0 && (
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-normal truncate max-w-[160px]">
            {warnings[0]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {strings.itemAnalysisTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {filteredItems.length} of {items.length} materials analyzed
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* FY Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Financial Year Filter"
              value={selectedFinancialYear}
              onChange={(e) => onSelectFinancialYear(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {availableFinancialYears.map((fy) => (
                <option key={fy} value={fy} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {fy === 'ALL' ? strings.allFinancialYears : fy}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Qualification Status Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{strings.allStatuses}</option>
              <option value="QUALIFIED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{strings.statusQualified}</option>
              <option value="VOLATILE_COMMODITY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{strings.statusVolatileCommodity}</option>
              <option value="SPEC_MISMATCH" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{strings.statusSpecMismatch}</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={strings.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 md:w-56"
            />
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">{strings.colItem}</th>
              <th className="py-3 px-3">{strings.colCategory}</th>
              <th className="py-3 px-3 text-right">{strings.colLowestPrice}</th>
              <th className="py-3 px-3 text-right">{strings.colWeightedAvgPrice}</th>
              <th className="py-3 px-3 text-right">{strings.colHighestPrice}</th>
              <th className="py-3 px-3 text-right">{strings.colDispersion}</th>
              <th className="py-3 px-3 text-right">{strings.colSpend}</th>
              <th className="py-3 px-3 text-right">{strings.colOpportunity}</th>
              <th className="py-3 px-3 text-center">{strings.colStatus}</th>
              <th className="py-3 px-4 text-center">{strings.colAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  {strings.noItemsFound}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.itemKey}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Item Description & Code */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate" title={item.materialDesc}>
                      {item.materialDesc}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono">{item.materialCode}</span>
                      <span>•</span>
                      <span>{item.uom}</span>
                    </div>
                  </td>

                  {/* Spend Category */}
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                      {item.spendCategory}
                    </span>
                  </td>

                  {/* Lowest Price (Benchmark) */}
                  <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    ₹{item.lowestUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Weighted Average Price */}
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                    ₹{item.weightedAveragePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Highest Price */}
                  <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400">
                    ₹{item.highestUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Price Dispersion % */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-semibold ${
                        item.priceDispersionPct > 20
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.priceDispersionPct.toFixed(1)}%
                    </span>
                  </td>

                  {/* Actual Spend */}
                  <td className="py-3 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                    ₹{item.actualPurchaseCostCr.toFixed(3)} Cr
                  </td>

                  {/* Historical Lost Opportunity */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.historicalLostOpportunityCr.toFixed(3)} Cr
                    </div>
                  </td>

                  {/* Qualification Status */}
                  <td className="py-3 px-3 text-center">
                    {getStatusBadge(item.qualificationStatus, item.warnings)}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onViewEvidence(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium text-xs transition-colors"
                      title="View Transaction Evidence and Price Drilldown"
                    >
                      <span>{strings.btnViewEvidence}</span>
                      <ExternalLink className="w-3 h-3" />
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
