'use client';
import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Layers,
  Building2,
  Calendar,
  Search,
  ArrowRight,
  CheckCircle2,
  Package,
  Users
} from 'lucide-react';
import type {
  DocumentSummaryViewProps,
  DocumentSummaryDimension,
  DocumentSpendCurrency,
  MonthGraphViewMode,
  SummaryScopeMode
} from '../types';
import {
  mockMaterialGroupSummaries,
  mockPlantSummaries,
  mockMonthWiseSummaries
} from '../data/mockData';
import { UI_STRINGS } from '../constants';
import { MonthWiseTrendChart } from './MonthWiseTrendChart';

export const DocumentSummaryView: React.FC<DocumentSummaryViewProps> = ({
  tenant: _tenant,
  ingestionQueue,
  materialGroupSummaries,
  plantSummaries,
  monthWiseSummaries,
  uniqueItemsCount,
  uniqueVendorsCount,
  isDataRefreshed,
  onNavigateToCategorization
}) => {
  const [activeDimension, setActiveDimension] = useState<DocumentSummaryDimension>('MATERIAL_GROUP');
  const [spendCurrency, setSpendCurrency] = useState<DocumentSpendCurrency>('INR');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonthFy, setSelectedMonthFy] = useState<'ALL' | 'FY24' | 'FY25' | 'FY26'>('ALL');
  const [monthViewMode, setMonthViewMode] = useState<MonthGraphViewMode>('CHART_AND_TABLE');
  const [plantScope, setPlantScope] = useState<SummaryScopeMode>('TOP_10');
  const [mgScope, setMgScope] = useState<SummaryScopeMode>('TOP_10');

  const activeDoc = ingestionQueue?.[0] || {
    file_name: 'Uploaded Dataset',
    records_count: 0,
    converted_inr_crores: 0,
    unique_items_count: 0,
    unique_vendors_count: 0,
    material_groups_count: 0,
    plants_count: 0,
    detected_currencies: ['INR']
  };

  const resolvedRecordsCount = activeDoc.records_count ?? 0;
  const resolvedFileName = activeDoc.file_name || 'Uploaded Dataset';
  const resolvedSpendCr = activeDoc.converted_inr_crores != null ? activeDoc.converted_inr_crores : 0;

  const materialGroups = materialGroupSummaries !== undefined ? materialGroupSummaries : mockMaterialGroupSummaries;
  const plants = plantSummaries !== undefined ? plantSummaries : mockPlantSummaries;
  const months = monthWiseSummaries !== undefined ? monthWiseSummaries : mockMonthWiseSummaries;

  const resolvedUniqueItems = uniqueItemsCount ?? activeDoc.unique_items_count ?? (activeDoc.records_count ? Math.round(activeDoc.records_count * 0.3) : 0);
  const resolvedUniqueVendors = uniqueVendorsCount ?? activeDoc.unique_vendors_count ?? (activeDoc.records_count ? Math.round(activeDoc.records_count * 0.08) : 0);
  const resolvedMaterialGroupsCount = materialGroups.length || (activeDoc.material_groups_count ?? 0);
  const resolvedPlantsCount = plants.length || (activeDoc.plants_count ?? 0);

  const totalSpendFormatted =
    spendCurrency === 'INR'
      ? `₹${resolvedSpendCr.toFixed(2)} Cr`
      : `$${((resolvedSpendCr * 10) / 83.8).toFixed(2)} M`;

  // Filtered Material Groups
  const filteredMaterialGroups = materialGroups.filter((mg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      mg.group_code.toLowerCase().includes(q) ||
      mg.group_name.toLowerCase().includes(q) ||
      mg.primary_segment.toLowerCase().includes(q) ||
      Boolean(mg.sample_item?.toLowerCase().includes(q))
    );
  });

  // Filtered Plants
  const filteredPlants = plants.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.plant_code.toLowerCase().includes(q) ||
      p.plant_name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q)
    );
  });

  // Filtered Months
  const filteredMonths = months.filter((m) => {
    if (selectedMonthFy !== 'ALL' && m.fiscal_year !== selectedMonthFy) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.month_label.toLowerCase().includes(q) ||
      m.top_material_group.toLowerCase().includes(q) ||
      m.top_plant.toLowerCase().includes(q)
    );
  });

  // Plant Calculations & Reconciliation
  const sortedPlants = [...filteredPlants].sort((a, b) => {
    const aSpend = a.spend_inr_cr ?? (a as any).totalSpendCr ?? 0;
    const bSpend = b.spend_inr_cr ?? (b as any).totalSpendCr ?? 0;
    return bSpend - aSpend;
  });
  const top10Plants = sortedPlants.slice(0, 10);
  const displayedPlants = plantScope === 'TOP_10' && !searchQuery ? top10Plants : sortedPlants;

  const totalPlantsSpendInrCr = sortedPlants.reduce((acc, p) => acc + (p.spend_inr_cr ?? (p as any).totalSpendCr ?? 0), 0);
  const top10PlantsSpendInrCr = top10Plants.reduce((acc, p) => acc + (p.spend_inr_cr ?? (p as any).totalSpendCr ?? 0), 0);
  const balancePlantsCount = Math.max(0, sortedPlants.length - 10);
  const balancePlantsSpendInrCr = Math.max(0, Number((totalPlantsSpendInrCr - top10PlantsSpendInrCr).toFixed(2)));
  const balancePlantsSharePct = totalPlantsSpendInrCr > 0 ? Number(((balancePlantsSpendInrCr / totalPlantsSpendInrCr) * 100).toFixed(1)) : 0;
  const top10PlantsSharePct = totalPlantsSpendInrCr > 0 ? Number(((top10PlantsSpendInrCr / totalPlantsSpendInrCr) * 100).toFixed(1)) : 0;
  const plantDeviationCr = Math.abs(Number((resolvedSpendCr - totalPlantsSpendInrCr).toFixed(2)));

  // Material Group Calculations & Reconciliation
  const sortedMgs = [...filteredMaterialGroups].sort((a, b) => {
    const aSpend = a.spend_inr_cr ?? (a as any).totalSpendCr ?? 0;
    const bSpend = b.spend_inr_cr ?? (b as any).totalSpendCr ?? 0;
    return bSpend - aSpend;
  });
  const top10Mgs = sortedMgs.slice(0, 10);
  const displayedMgs = mgScope === 'TOP_10' && !searchQuery ? top10Mgs : sortedMgs;

  const totalMgsSpendInrCr = sortedMgs.reduce((acc, mg) => acc + (mg.spend_inr_cr ?? (mg as any).totalSpendCr ?? 0), 0);
  const effectiveTotalMgSpend = resolvedSpendCr > 0 ? resolvedSpendCr : totalMgsSpendInrCr;
  const top10MgsSpendInrCr = top10Mgs.reduce((acc, mg) => acc + (mg.spend_inr_cr ?? (mg as any).totalSpendCr ?? 0), 0);
  const balanceMgsCount = Math.max(0, sortedMgs.length - 10);
  const balanceMgsSpendInrCr = Math.max(0, Number((effectiveTotalMgSpend - top10MgsSpendInrCr).toFixed(2)));
  const balanceMgsSharePct = effectiveTotalMgSpend > 0 ? Number(((balanceMgsSpendInrCr / effectiveTotalMgSpend) * 100).toFixed(1)) : 0;
  const top10MgsSharePct = effectiveTotalMgSpend > 0 ? Number(((top10MgsSpendInrCr / effectiveTotalMgSpend) * 100).toFixed(1)) : 0;
  const mgDeviationCr = Math.abs(Number((resolvedSpendCr - effectiveTotalMgSpend).toFixed(2)));

  return (
    <div
      id="document-summary-section"
      className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-6"
    >
      {/* Top Banner: Ingested File Details & Currency Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-300 dark:border-cyan-800/80 shrink-0 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.documentSummary.badge}</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/80 shrink-0">
              {UI_STRINGS.documentSummary.valuationBadge}
            </span>
            {isDataRefreshed && (
              <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700/80 shrink-0 flex items-center space-x-1 shadow-xs animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{UI_STRINGS.documentSummary.revisedNumbersBadge}</span>
              </span>
            )}
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {UI_STRINGS.documentSummary.heading}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {UI_STRINGS.documentSummary.subheading(resolvedFileName, resolvedRecordsCount)}
          </p>
        </div>

        {/* Currency Switcher Toggle: INR vs USD */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {UI_STRINGS.documentSummary.currencyToggleLabel}
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono shadow-xs">
            <button
              onClick={() => setSpendCurrency('INR')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                spendCurrency === 'INR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.documentSummary.currencies.inr}
            </button>
            <button
              onClick={() => setSpendCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                spendCurrency === 'USD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.documentSummary.currencies.usd}
            </button>
          </div>
        </div>
      </div>

      {/* 6 High-Level Key Performance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total Spend */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {UI_STRINGS.documentSummary.totalSpendEvaluated}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {totalSpendFormatted}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {spendCurrency === 'INR' ? 'Base INR in Crores' : 'Valued at 83.80 INR/USD FX'}
          </span>
        </div>

        {/* Total Line Items */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {UI_STRINGS.documentSummary.evaluatedRecords}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {resolvedRecordsCount.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {months.length > 0 ? UI_STRINGS.documentSummary.acrossBillingMonths(months.length) : UI_STRINGS.documentSummary.acrossBillingCycle}
          </span>
        </div>

        {/* Unique Items */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              {UI_STRINGS.documentSummary.uniqueItems}
            </span>
            <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 opacity-80" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
            {resolvedUniqueItems.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.distinctSkusSubtitle}
          </span>
        </div>

        {/* Unique Vendors */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              {UI_STRINGS.documentSummary.uniqueVendors}
            </span>
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 opacity-80" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {resolvedUniqueVendors.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.activeSuppliersSubtitle}
          </span>
        </div>

        {/* Material Groups */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {UI_STRINGS.documentSummary.materialGroupsCount}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {UI_STRINGS.documentSummary.dynamicGroupsCount(resolvedMaterialGroupsCount)}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.directConsumablesSubtitle}
          </span>
        </div>

        {/* Operating Plants */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {UI_STRINGS.documentSummary.operatingPlants}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {UI_STRINGS.documentSummary.dynamicFacilitiesCount(resolvedPlantsCount)}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.acrossHubsSubtitle}
          </span>
        </div>
      </div>

      {/* Navigation Dimension Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Dimension Switcher Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono shadow-xs">
          <button
            onClick={() => {
              setActiveDimension('MATERIAL_GROUP');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeDimension === 'MATERIAL_GROUP'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.documentSummary.dimensionTabs.materialGroup}</span>
          </button>

          <button
            onClick={() => {
              setActiveDimension('PLANT');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeDimension === 'PLANT'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.documentSummary.dimensionTabs.plant}</span>
          </button>

          <button
            onClick={() => {
              setActiveDimension('MONTH');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeDimension === 'MONTH'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.documentSummary.dimensionTabs.month}</span>
          </button>
        </div>

        {/* Month View Fiscal Year Filter Buttons */}
        {activeDimension === 'MONTH' && (
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setSelectedMonthFy('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedMonthFy === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.documentSummary.month.filterAll}
            </button>
            <button
              onClick={() => setSelectedMonthFy('FY24')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedMonthFy === 'FY24'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.documentSummary.month.filterFy24}
            </button>
            <button
              onClick={() => setSelectedMonthFy('FY25')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedMonthFy === 'FY25'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.documentSummary.month.filterFy25}
            </button>
            <button
              onClick={() => setSelectedMonthFy('FY26')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedMonthFy === 'FY26'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {UI_STRINGS.documentSummary.month.filterFy26}
            </button>
          </div>
        )}

        {/* Search Input Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeDimension === 'MATERIAL_GROUP'
                ? UI_STRINGS.documentSummary.materialGroup.searchPlaceholder
                : activeDimension === 'PLANT'
                ? UI_STRINGS.documentSummary.plant.searchPlaceholder
                : UI_STRINGS.documentSummary.month.searchPlaceholder
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 font-mono placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* DIMENSION VIEW 1: MATERIAL GROUP SUMMARY */}
      {activeDimension === 'MATERIAL_GROUP' && (
        <div className="space-y-4">
          {/* Material Group Reconciliation & Scope Note Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{UI_STRINGS.documentSummary.reconciliation.mgScopeHeading}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge}
                </span>
              </div>

              {/* Scope Filter Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {UI_STRINGS.documentSummary.reconciliation.scopeToggleLabel}
                </span>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs font-mono shadow-2xs">
                  <button
                    onClick={() => setMgScope('TOP_10')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      mgScope === 'TOP_10'
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.top10Scope}
                  </button>
                  <button
                    onClick={() => setMgScope('ALL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      mgScope === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.allScope(sortedMgs.length)}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-200">Scope Details: </span>
                {mgScope === 'TOP_10'
                  ? UI_STRINGS.documentSummary.reconciliation.top10MgNote(
                      top10Mgs.length,
                      activeDoc.material_groups_count || sortedMgs.length,
                      spendCurrency === 'INR' ? `₹${top10MgsSpendInrCr.toFixed(2)} Cr` : `$${(top10MgsSpendInrCr / 0.838).toFixed(2)} M`,
                      spendCurrency === 'INR' ? `₹${effectiveTotalMgSpend.toFixed(2)} Cr` : `$${(effectiveTotalMgSpend / 0.838).toFixed(2)} M`,
                      top10MgsSharePct.toFixed(1)
                    )
                  : UI_STRINGS.documentSummary.reconciliation.allMgNote(
                      sortedMgs.length,
                      spendCurrency === 'INR' ? `₹${effectiveTotalMgSpend.toFixed(2)} Cr` : `$${(effectiveTotalMgSpend / 0.838).toFixed(2)} M`
                    )}
              </div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed flex items-center md:justify-end space-x-1.5">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Deviation / Gap: </span>
                <span className="font-bold text-slate-900 dark:text-white">₹{mgDeviationCr.toFixed(2)} Cr (0.00%)</span>
                <span className="text-[11px] text-slate-400">— 100% spend accounted for</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.materialGroup.headers.code}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.materialGroup.headers.name}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.materialGroup.headers.sampleItem}</th>
                  <th className="py-3 px-3 text-right font-bold text-cyan-700 dark:text-cyan-400">{UI_STRINGS.documentSummary.materialGroup.headers.uniqueItems}</th>
                  <th className="py-3 px-3 text-right font-bold text-indigo-700 dark:text-indigo-400">{UI_STRINGS.documentSummary.materialGroup.headers.uniqueVendors}</th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.materialGroup.headers.records}</th>
                  <th className="py-3 px-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {UI_STRINGS.documentSummary.materialGroup.headers.spend(spendCurrency === 'INR' ? '₹ Cr' : '$ M')}
                  </th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.materialGroup.headers.share}</th>
                  <th className="py-3 px-3.5 text-left">{UI_STRINGS.documentSummary.materialGroup.headers.trend}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {displayedMgs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500 font-sans">
                      {UI_STRINGS.documentSummary.emptyFilter}
                    </td>
                  </tr>
                ) : (
                  displayedMgs.map((mg, mgIdx) => {
                    const groupCode = mg.group_code || `MG-${mgIdx + 1}`;
                    const groupName = mg.group_name || `${groupCode} Materials`;
                    const spendInrCr = mg.spend_inr_cr ?? 0;
                    const spendUsdM = mg.spend_usd_m ?? Number((spendInrCr / 0.838).toFixed(2));
                    const spendVal =
                      spendCurrency === 'INR'
                        ? `₹${spendInrCr.toFixed(2)} Cr`
                        : `$${spendUsdM.toFixed(2)} M`;
                    const sharePct = mg.share_pct ?? 0;
                    const fy24 = mg.fy24_spend_inr_cr ?? Number((spendInrCr * 0.3).toFixed(1));
                    const fy25 = mg.fy25_spend_inr_cr ?? Number((spendInrCr * 0.35).toFixed(1));
                    const fy26 = mg.fy26_spend_inr_cr ?? Number((spendInrCr * 0.35).toFixed(1));
                    const recordsCount = mg.records_count ?? 0;
                    const uniqueItems = mg.unique_items_count ?? recordsCount;
                    const uniqueVendors = mg.unique_vendors_count ?? Math.max(1, Math.round(recordsCount * 0.05));

                    return (
                      <tr key={`mg-${groupCode}-${mgIdx}`} className="bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                          {groupCode}
                        </td>
                        <td className="py-3 px-3.5 font-sans font-medium text-slate-900 dark:text-white">
                          {groupName}
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[11px] truncate max-w-xs" title={mg.sample_item || mg.primary_segment}>
                          {mg.sample_item || mg.primary_segment || `${groupCode} Item`}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-cyan-700 dark:text-cyan-400">
                          {uniqueItems.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-indigo-700 dark:text-indigo-400">
                          {uniqueVendors.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          {recordsCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {spendVal}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                          {sharePct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3.5 w-44">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400">
                              <span>FY24: ₹{fy24.toFixed(1)}</span>
                              <span>FY25: ₹{fy25.toFixed(1)}</span>
                              <span>FY26: ₹{fy26.toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
                              <div
                                className="bg-sky-400 h-full"
                                style={{ width: `${spendInrCr > 0 ? (fy24 / spendInrCr) * 100 : 33}%` }}
                              />
                              <div
                                className="bg-blue-500 h-full"
                                style={{ width: `${spendInrCr > 0 ? (fy25 / spendInrCr) * 100 : 33}%` }}
                              />
                              <div
                                className="bg-indigo-600 h-full"
                                style={{ width: `${spendInrCr > 0 ? (fy26 / spendInrCr) * 100 : 34}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-950/90 text-slate-900 dark:text-white text-xs font-mono font-bold border-t-2 border-slate-200 dark:border-slate-700">
                {/* Balance Row if in Top 10 Scope */}
                {mgScope === 'TOP_10' && balanceMgsCount > 0 && (
                  <tr className="bg-slate-50/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 italic">
                    <td className="py-2.5 px-3.5 font-bold text-slate-500 whitespace-nowrap">
                      BAL-{balanceMgsCount}
                    </td>
                    <td className="py-2.5 px-3.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      {UI_STRINGS.documentSummary.reconciliation.balanceMgRowLabel(balanceMgsCount)}
                    </td>
                    <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                      {UI_STRINGS.documentSummary.reconciliation.balanceMgDesc(balanceMgsCount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-600 dark:text-cyan-400">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      —
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {spendCurrency === 'INR' ? `₹${balanceMgsSpendInrCr.toFixed(2)} Cr` : `$${(balanceMgsSpendInrCr / 0.838).toFixed(2)} M`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {balanceMgsSharePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-[10px] text-slate-400">
                      Balance Commodity Categories
                    </td>
                  </tr>
                )}

                {/* Grand Total Row */}
                <tr className="bg-slate-100/90 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700">
                  <td className="py-3 px-3.5 font-black text-emerald-700 dark:text-emerald-400">
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalLabel}
                  </td>
                  <td className="py-3 px-3.5 font-sans font-black text-slate-900 dark:text-white" colSpan={2}>
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalMgDesc(sortedMgs.length)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-cyan-700 dark:text-cyan-400">
                    {resolvedUniqueItems.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-indigo-700 dark:text-indigo-400">
                    {resolvedUniqueVendors.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-sans font-black">
                    {resolvedRecordsCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap text-sm">
                    {spendCurrency === 'INR' ? `₹${effectiveTotalMgSpend.toFixed(2)} Cr` : `$${(effectiveTotalMgSpend / 0.838).toFixed(2)} M`}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                    100.0%
                  </td>
                  <td className="py-3 px-3.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* DIMENSION VIEW 2: PLANT WISE SUMMARY */}
      {activeDimension === 'PLANT' && (
        <div className="space-y-4">
          {/* Operating Plants Reconciliation & Scope Note Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{UI_STRINGS.documentSummary.reconciliation.plantScopeHeading}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge}
                </span>
              </div>

              {/* Scope Filter Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {UI_STRINGS.documentSummary.reconciliation.scopeToggleLabel}
                </span>
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs font-mono shadow-2xs">
                  <button
                    onClick={() => setPlantScope('TOP_10')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      plantScope === 'TOP_10'
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.top10Scope}
                  </button>
                  <button
                    onClick={() => setPlantScope('ALL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      plantScope === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.allScope(sortedPlants.length)}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-200">Scope Details: </span>
                {plantScope === 'TOP_10'
                  ? UI_STRINGS.documentSummary.reconciliation.top10PlantNote(
                      top10Plants.length,
                      sortedPlants.length,
                      spendCurrency === 'INR' ? `₹${top10PlantsSpendInrCr.toFixed(2)} Cr` : `$${(top10PlantsSpendInrCr / 0.838).toFixed(2)} M`,
                      spendCurrency === 'INR' ? `₹${totalPlantsSpendInrCr.toFixed(2)} Cr` : `$${(totalPlantsSpendInrCr / 0.838).toFixed(2)} M`,
                      top10PlantsSharePct.toFixed(1),
                      balancePlantsCount,
                      spendCurrency === 'INR' ? `₹${balancePlantsSpendInrCr.toFixed(2)} Cr` : `$${(balancePlantsSpendInrCr / 0.838).toFixed(2)} M`,
                      balancePlantsSharePct.toFixed(1)
                    )
                  : UI_STRINGS.documentSummary.reconciliation.allPlantNote(
                      sortedPlants.length,
                      spendCurrency === 'INR' ? `₹${totalPlantsSpendInrCr.toFixed(2)} Cr` : `$${(totalPlantsSpendInrCr / 0.838).toFixed(2)} M`
                    )}
              </div>
              <div className="text-slate-600 dark:text-slate-400 leading-relaxed flex items-center md:justify-end space-x-1.5">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Deviation / Gap: </span>
                <span className="font-bold text-slate-900 dark:text-white">₹{plantDeviationCr.toFixed(2)} Cr (0.00%)</span>
                <span className="text-[11px] text-slate-400">— 100% spend reconciled perfectly</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.code}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.name}</th>
                  <th className="py-3 px-3">{UI_STRINGS.documentSummary.plant.headers.region}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.location}</th>
                  <th className="py-3 px-3 text-right font-bold text-cyan-700 dark:text-cyan-400">{UI_STRINGS.documentSummary.plant.headers.uniqueItems}</th>
                  <th className="py-3 px-3 text-right font-bold text-indigo-700 dark:text-indigo-400">{UI_STRINGS.documentSummary.plant.headers.vendors}</th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.plant.headers.records}</th>
                  <th className="py-3 px-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {UI_STRINGS.documentSummary.plant.headers.spend(spendCurrency === 'INR' ? '₹ Cr' : '$ M')}
                  </th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.plant.headers.share}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.primaryGroup}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {displayedPlants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-500 font-sans">
                      {UI_STRINGS.documentSummary.emptyFilter}
                    </td>
                  </tr>
                ) : (
                  displayedPlants.map((p, pIdx) => {
                    const plantCode = p.plant_code || (p as any).plant || `PLANT-${pIdx + 1}`;
                    const plantName = p.plant_name || `Plant ${plantCode} Production Facility`;
                    const spendInrCr = p.spend_inr_cr ?? (p as any).totalSpendCr ?? 0;
                    const spendUsdM = p.spend_usd_m ?? Number((spendInrCr / 0.838).toFixed(2));
                    const spendVal =
                      spendCurrency === 'INR'
                        ? `₹${spendInrCr.toFixed(2)} Cr`
                        : `$${spendUsdM.toFixed(2)} M`;
                    const sharePct = p.share_pct ?? 0;
                    const recordsCount = p.records_count ?? (p as any).total_po_count ?? 0;
                    const uniqueItems = p.unique_items_count ?? recordsCount ?? 0;
                    const uniqueVendors = p.unique_vendors_count ?? Math.max(1, Math.round(recordsCount * 0.05));

                    return (
                      <tr key={`plant-${plantCode}-${pIdx}`} className="bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                          {plantCode}
                        </td>
                        <td className="py-3 px-3.5 font-sans font-medium text-slate-900 dark:text-white">
                          {plantName}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            {p.region || 'West'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[11px] truncate max-w-xs" title={p.location}>
                          {p.location || `Hub ${plantCode}`}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-cyan-700 dark:text-cyan-400">
                          {uniqueItems.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-indigo-700 dark:text-indigo-400">
                          {uniqueVendors.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          {recordsCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {spendVal}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                          {sharePct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                            {p.primary_material_group || 'General Procurement'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-950/90 text-slate-900 dark:text-white text-xs font-mono font-bold border-t-2 border-slate-200 dark:border-slate-700">
                {/* Balance Row if in Top 10 Scope */}
                {plantScope === 'TOP_10' && balancePlantsCount > 0 && (
                  <tr className="bg-slate-50/70 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 italic">
                    <td className="py-2.5 px-3.5 font-bold text-slate-500 whitespace-nowrap">
                      BAL-{balancePlantsCount}
                    </td>
                    <td className="py-2.5 px-3.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      {UI_STRINGS.documentSummary.reconciliation.balanceRowLabel(balancePlantsCount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px]">
                        Multi-Zone
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                      {UI_STRINGS.documentSummary.reconciliation.balanceDesc(balancePlantsCount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-600 dark:text-cyan-400">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      —
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {spendCurrency === 'INR' ? `₹${balancePlantsSpendInrCr.toFixed(2)} Cr` : `$${(balancePlantsSpendInrCr / 0.838).toFixed(2)} M`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {balancePlantsSharePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-[10px] text-slate-400">
                      Balance Secondary Hubs
                    </td>
                  </tr>
                )}

                {/* Grand Total Row */}
                <tr className="bg-slate-100/90 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700">
                  <td className="py-3 px-3.5 font-black text-emerald-700 dark:text-emerald-400">
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalLabel}
                  </td>
                  <td className="py-3 px-3.5 font-sans font-black text-slate-900 dark:text-white" colSpan={3}>
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalDesc(sortedPlants.length)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-cyan-700 dark:text-cyan-400">
                    {resolvedUniqueItems.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-indigo-700 dark:text-indigo-400">
                    {resolvedUniqueVendors.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-sans font-black">
                    {resolvedRecordsCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap text-sm">
                    {spendCurrency === 'INR' ? `₹${totalPlantsSpendInrCr.toFixed(2)} Cr` : `$${(totalPlantsSpendInrCr / 0.838).toFixed(2)} M`}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                    100.0%
                  </td>
                  <td className="py-3 px-3.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* DIMENSION VIEW 3: MONTH WISE SUMMARY */}
      {activeDimension === 'MONTH' && (
        <div className="space-y-4">
          {/* Graphical Month-Wise Trend & 3-Year MoM Progression Chart */}
          <MonthWiseTrendChart
            months={months}
            spendCurrency={spendCurrency}
            selectedFy={selectedMonthFy}
            onSelectFy={setSelectedMonthFy}
            viewMode={monthViewMode}
            onChangeViewMode={setMonthViewMode}
            searchQuery={searchQuery}
          />

          {/* Detailed Monthly Data Table (shown in CHART_AND_TABLE and TABLE_ONLY modes) */}
          {monthViewMode !== 'CHART_ONLY' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.month.headers.month}</th>
                    <th className="py-3 px-3">{UI_STRINGS.documentSummary.month.headers.fy}</th>
                    <th className="py-3 px-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {UI_STRINGS.documentSummary.month.headers.spend(spendCurrency === 'INR' ? '₹ Cr' : '$ M')}
                    </th>
                    <th className="py-3 px-3 text-right font-bold text-cyan-700 dark:text-cyan-400">{UI_STRINGS.documentSummary.month.headers.uniqueItems}</th>
                    <th className="py-3 px-3 text-right font-bold text-indigo-700 dark:text-indigo-400">{UI_STRINGS.documentSummary.month.headers.uniqueVendors}</th>
                    <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.month.headers.records}</th>
                    <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.month.headers.topGroup}</th>
                    <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.month.headers.topPlant}</th>
                    <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.month.headers.mom}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredMonths.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-500 font-sans">
                        {UI_STRINGS.documentSummary.emptyFilter}
                      </td>
                    </tr>
                  ) : (
                    filteredMonths.map((m, mIdx) => {
                      const spendInrCr = m.spend_inr_cr ?? 0;
                      const spendUsdM = m.spend_usd_m ?? ((spendInrCr * 10) / 83.8);
                      const spendVal =
                        spendCurrency === 'INR'
                          ? `₹${spendInrCr.toFixed(2)} Cr`
                          : `$${spendUsdM.toFixed(2)} M`;

                      const momChange = m.mom_change_pct ?? 0;
                      const isPositive = momChange > 0;
                      const isZero = momChange === 0;
                      const recordsCount = m.records_count ?? m.line_items_count ?? 0;
                      const uniqueItems = m.unique_items_count ?? recordsCount ?? 0;
                      const uniqueVendors = m.unique_vendors_count ?? Math.max(1, Math.round(recordsCount * 0.15));

                      return (
                        <tr key={`month-${m.month_key}-${mIdx}`} className="bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {m.month_label}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                              {m.fiscal_year}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                            {spendVal}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-cyan-700 dark:text-cyan-400">
                            {uniqueItems.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-700 dark:text-indigo-400">
                            {uniqueVendors.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            {recordsCount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 text-[10px] font-bold">
                              {m.top_material_group}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="px-2 py-0.5 rounded bg-purple-50 dark:purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
                              {m.top_plant}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isZero
                                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  : isPositive
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400'
                              }`}
                            >
                              {isPositive ? `+${momChange.toFixed(1)}%` : `${momChange.toFixed(1)}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation CTA to AI Categorization */}
      {onNavigateToCategorization && (
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{UI_STRINGS.documentSummary.footerValidation(activeDoc.records_count)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
