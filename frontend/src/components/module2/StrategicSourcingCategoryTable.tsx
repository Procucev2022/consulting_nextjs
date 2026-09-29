'use client';
import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Download,
  Search,
  ExternalLink
} from 'lucide-react';
import type { StrategicSourcingCategoryTableProps } from '../../types';
import { UI_STRINGS } from '../../constants';

type SortField =
  | 'totalSpendInr'
  | 'addressableSpendInr'
  | 'netQuantifiableOpportunityInr'
  | 'activeSuppliersCount'
  | 'priceDispersionPct'
  | 'categoryMateriality'
  | 'dataConfidence';

export const StrategicSourcingCategoryTable: React.FC<StrategicSourcingCategoryTableProps> = ({
  profiles = [],
  onSelectCategory,
  onExportAudit,
  selectedCategoryName,
  onOpenHowCalculated
}) => {
  const strings = UI_STRINGS.module2Sourcing;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMateriality, setFilterMateriality] = useState<string>('ALL');
  const [filterSuitability, setFilterSuitability] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('netQuantifiableOpportunityInr');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filteredAndSortedProfiles = useMemo(() => {
    return profiles
      .filter((p) => {
        const matchesSearch =
          !searchQuery ||
          p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.module2Classification.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMat = filterMateriality === 'ALL' || p.categoryMateriality === filterMateriality;
        const matchesSuit =
          filterSuitability === 'ALL' ||
          (filterSuitability === 'E_AUCTION' && (p.potentialEAuctionOpportunityInr || 0) > 0) ||
          (filterSuitability === 'CONSOLIDATION' && (p.potentialVendorConsolidationOpportunityInr || 0) > 0) ||
          (filterSuitability === 'QUANTIFIABLE' && p.isQuantifiable);
        return matchesSearch && matchesMat && matchesSuit;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === 'totalSpendInr') {
          valA = a.totalSpendInr;
          valB = b.totalSpendInr;
        } else if (sortField === 'addressableSpendInr') {
          valA = a.addressableSpendInr;
          valB = b.addressableSpendInr;
        } else if (sortField === 'netQuantifiableOpportunityInr') {
          valA = a.netQuantifiableOpportunityInr || 0;
          valB = b.netQuantifiableOpportunityInr || 0;
        } else if (sortField === 'activeSuppliersCount') {
          valA = a.activeSuppliersCount;
          valB = b.activeSuppliersCount;
        } else if (sortField === 'priceDispersionPct') {
          valA = a.priceDispersion?.priceDispersionPct || 0;
          valB = b.priceDispersion?.priceDispersionPct || 0;
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [profiles, searchQuery, filterMateriality, filterSuitability, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search category or UNSPSC commodity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Materiality filter */}
          <select
            value={filterMateriality}
            onChange={(e) => setFilterMateriality(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Materiality</option>
            <option value="HIGH">High Spend Materiality</option>
            <option value="MEDIUM">Medium Spend Materiality</option>
            <option value="LOW">Low Spend Materiality</option>
          </select>

          {/* Sourcing lever filter */}
          <select
            value={filterSuitability}
            onChange={(e) => setFilterSuitability(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Opportunities</option>
            <option value="E_AUCTION">E-Auction Eligible</option>
            <option value="CONSOLIDATION">Consolidation Eligible</option>
            <option value="QUANTIFIABLE">Quantifiable Only</option>
          </select>

          {/* Export Audit Dossier */}
          {onExportAudit && (
            <button
              type="button"
              onClick={onExportAudit}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 rounded-lg border border-cyan-300 dark:border-cyan-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{strings.btnExportAudit}</span>
            </button>
          )}
        </div>
      </div>

      {/* 17-Column Strategic Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-2.5 px-3 whitespace-nowrap">{strings.colCategory}</th>
              <th
                onClick={() => handleSort('totalSpendInr')}
                className="py-2.5 px-3 whitespace-nowrap cursor-pointer hover:text-cyan-600"
              >
                <div className="flex items-center space-x-1">
                  <span>{strings.colSpend}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 whitespace-nowrap text-center">{strings.colTransactions}</th>
              <th
                onClick={() => handleSort('activeSuppliersCount')}
                className="py-2.5 px-2 whitespace-nowrap text-center cursor-pointer hover:text-cyan-600"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{strings.colSuppliers}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">{strings.colConcentration}</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">{strings.colFragmentation}</th>
              <th
                onClick={() => handleSort('addressableSpendInr')}
                className="py-2.5 px-3 whitespace-nowrap cursor-pointer hover:text-cyan-600"
              >
                <div className="flex items-center space-x-1">
                  <span>{strings.colAddressableSpend}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 whitespace-nowrap text-center">{strings.colEAuctionSuitability}</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">{strings.colEAuctionOpp}</th>
              <th className="py-2.5 px-2 whitespace-nowrap text-center">{strings.colConsolSuitability}</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">{strings.colConsolOpp}</th>
              <th className="py-2.5 px-2 whitespace-nowrap text-right text-amber-600">{strings.colOverlap}</th>
              <th
                onClick={() => handleSort('netQuantifiableOpportunityInr')}
                className="py-2.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-emerald-600 font-bold"
              >
                <div className="flex items-center justify-end space-x-1 text-emerald-600 dark:text-emerald-400">
                  <span>{strings.colNetOpp}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 whitespace-nowrap text-center">{strings.colConfidence}</th>
              <th className="py-2.5 px-3 whitespace-nowrap">{strings.colRecommendedLever}</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">{strings.colNextAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAndSortedProfiles.map((p) => {
              const isSelected = selectedCategoryName === p.categoryName;
              return (
                <tr
                  key={p.categoryId}
                  onClick={() => onSelectCategory(p)}
                  className={`hover:bg-cyan-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-50/70 dark:bg-cyan-950/40 font-medium' : ''
                  }`}
                >
                  {/* Category */}
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-1.5">
                      <span>{p.categoryName}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.unspscCode}</div>
                  </td>

                  {/* Spend */}
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                    ₹{p.totalSpendInrCr.toFixed(2)} Cr
                  </td>

                  {/* Txns */}
                  <td className="py-2.5 px-2 font-mono text-center text-slate-600 dark:text-slate-400">
                    {p.transactionCount}
                  </td>

                  {/* Suppliers */}
                  <td className="py-2.5 px-2 font-mono text-center text-slate-700 dark:text-slate-300">
                    {p.activeSuppliersCount}
                  </td>

                  {/* Concentration HHI */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        p.hhiScore > 2500
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                          : p.hhiScore >= 1500
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                      }`}
                    >
                      {p.hhiScore}
                    </span>
                  </td>

                  {/* Fragmentation Level */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        p.fragmentationLevel === 'EXTREME_FRAGMENTATION'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : p.fragmentationLevel === 'HIGH_FRAGMENTATION'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : p.fragmentationLevel === 'MODERATE_FRAGMENTATION'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {p.fragmentationLevel.replace('_FRAGMENTATION', '')}
                    </span>
                  </td>

                  {/* Addressable Spend */}
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                    ₹{p.addressableSpendInrCr.toFixed(2)} Cr
                  </td>

                  {/* E-Auction Suitability */}
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.eauctionSuitability === 'HIGH'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : p.eauctionSuitability === 'MEDIUM'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {p.eauctionSuitability}
                    </span>
                  </td>

                  {/* E-Auction Opp */}
                  <td className="py-2.5 px-3 font-mono text-right text-cyan-700 dark:text-cyan-400 font-semibold">
                    {p.potentialEAuctionOpportunityInr !== null
                      ? `₹${((p.potentialEAuctionOpportunityInr || 0) / 100000).toFixed(2)} L`
                      : '—'}
                  </td>

                  {/* Consolidation Suitability */}
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.consolidationSuitability === 'HIGH'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : p.consolidationSuitability === 'MEDIUM'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {p.consolidationSuitability}
                    </span>
                  </td>

                  {/* Consolidation Opp */}
                  <td className="py-2.5 px-3 font-mono text-right text-purple-700 dark:text-purple-400 font-semibold">
                    {p.potentialVendorConsolidationOpportunityInr !== null
                      ? `₹${((p.potentialVendorConsolidationOpportunityInr || 0) / 100000).toFixed(2)} L`
                      : '—'}
                  </td>

                  {/* Overlap */}
                  <td className="py-2.5 px-2 font-mono text-right text-amber-600 dark:text-amber-400">
                    {p.overlappingOpportunityInr > 0
                      ? `-₹${(p.overlappingOpportunityInr / 100000).toFixed(2)} L`
                      : '₹0'}
                  </td>

                  {/* Net Quantifiable Opportunity */}
                  <td className="py-2.5 px-3 font-mono text-right text-emerald-700 dark:text-emerald-400 font-black">
                    <div className="flex items-center justify-end space-x-1.5">
                      <span>
                        {p.netQuantifiableOpportunityInr !== null ? (
                          `₹${((p.netQuantifiableOpportunityInr || 0) / 100000).toFixed(2)} L`
                        ) : (
                          <span className="text-[10px] font-sans font-medium text-amber-600 dark:text-amber-400 italic">
                            Not Quantifiable
                          </span>
                        )}
                      </span>
                      {onOpenHowCalculated && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenHowCalculated(p);
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-colors"
                          title="Click to view step-by-step mathematical calculation"
                        >
                          How calculated?
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        p.dataConfidence === 'HIGH'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : p.dataConfidence === 'MEDIUM'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {p.dataConfidence}
                    </span>
                  </td>

                  {/* Recommended Lever */}
                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                    <span className="font-semibold">{p.scorecard.recommendationLabel}</span>
                  </td>

                  {/* Action Button */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCategory(p);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-xs transition-transform active:scale-95"
                    >
                      {strings.btnViewDeepDive}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
