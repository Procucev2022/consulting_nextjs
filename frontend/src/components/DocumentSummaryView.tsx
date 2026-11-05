'use client';
import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Layers,
  Building2,
  Calendar,
  Search,
  CheckCircle2,
  Package,
  Users,
  AlertTriangle
} from 'lucide-react';
import type {
  DocumentSummaryViewProps,
  DocumentSummaryDimension,
  DocumentSpendCurrency,
  MonthGraphViewMode,
  SummaryScopeMode,
  DocumentSummaryPlantRecord,
  PlantSummary,
  LegacyPlantSummaryRecord
} from '../types';
import { INR_CRORES_DIVISOR, UI_STRINGS } from '../constants';
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
  onNavigateToCategorization,
  periodMetadata,
  canonicalViewModel,
  summarySectionRef
}) => {
  const [activeDimension, setActiveDimension] = useState<DocumentSummaryDimension>('MATERIAL_GROUP');
  const [spendCurrency, setSpendCurrency] = useState<DocumentSpendCurrency>('INR');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonthFy, setSelectedMonthFy] = useState<string>('ALL');
  const [monthViewMode, setMonthViewMode] = useState<MonthGraphViewMode>('CHART_AND_TABLE');
  const [plantScope, setPlantScope] = useState<SummaryScopeMode>('TOP_10');
  const [mgScope, setMgScope] = useState<SummaryScopeMode>('TOP_10');

  const activeDoc = ingestionQueue?.[0];
  const resolvedRecordsCount = activeDoc?.records_count ?? canonicalViewModel?.sourceRowCount ?? null;
  const resolvedFileName = activeDoc?.file_name || canonicalViewModel?.sourceFileName || UI_STRINGS.common.notAvailable;
  const resolvedSpendCr = activeDoc?.converted_inr_crores ?? canonicalViewModel?.validFxNormalizedSpendCr ?? null;

  const materialGroups = materialGroupSummaries ?? [];
  const plants: DocumentSummaryPlantRecord[] = (plantSummaries ?? []).map((plant) => {
    const row = plant as Partial<PlantSummary> & LegacyPlantSummaryRecord;
    return {
      plant_code: row.plant_code ?? row.plant,
      plant_name: row.plant_name ?? row.plant,
      region: row.region,
      location: row.location,
      po_count: row.po_count,
      total_po_count: row.total_po_count,
      records_count: row.records_count ?? row.count,
      spend_inr_cr: row.spend_inr_cr ?? row.totalSpendCr ?? (row.totalSpendINR != null ? row.totalSpendINR / INR_CRORES_DIVISOR : undefined),
      spend_usd_m: row.spend_usd_m,
      share_pct: row.share_pct,
      active_vendors_count: row.active_vendors_count,
      unique_items_count: row.unique_items_count,
      unique_vendors_count: row.unique_vendors_count,
      primary_material_group: row.primary_material_group,
      top_material_group: row.top_material_group
    };
  });
  const months = monthWiseSummaries ?? [];

  const resolvedUniqueItems = uniqueItemsCount ?? activeDoc?.unique_items_count ?? canonicalViewModel?.uniqueItems;
  const resolvedUniqueVendors = uniqueVendorsCount ?? activeDoc?.unique_vendors_count ?? canonicalViewModel?.uniqueVendors;
  const resolvedMaterialGroupsCount = materialGroups.length > 0 ? materialGroups.length : activeDoc?.material_groups_count ?? canonicalViewModel?.materialGroups ?? null;
  const resolvedPlantsCount = plants.length > 0 ? plants.length : activeDoc?.plants_count ?? canonicalViewModel?.operatingPlants ?? null;

  const totalSpendUsdM = materialGroups.length > 0 && materialGroups.every((group) => group.spend_usd_m != null)
    ? materialGroups.reduce((total, group) => total + (group.spend_usd_m ?? 0), 0)
    : null;
  const totalSpendFormatted = spendCurrency === 'INR'
    ? resolvedSpendCr == null ? UI_STRINGS.common.notAvailable : `₹${resolvedSpendCr.toFixed(2)} Cr`
    : totalSpendUsdM != null ? `$${totalSpendUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable;

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
      p.plant_code?.toLowerCase().includes(q) ||
      p.plant_name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.region?.toLowerCase().includes(q)
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
    const aSpend = a.spend_inr_cr ?? 0;
    const bSpend = b.spend_inr_cr ?? 0;
    return bSpend - aSpend;
  });
  const top10Plants = sortedPlants.slice(0, 10);
  const displayedPlants = plantScope === 'TOP_10' && !searchQuery ? top10Plants : sortedPlants;

  const totalPlantsSpendInrCr = sortedPlants.length > 0 && sortedPlants.every((plant) => plant.spend_inr_cr != null)
    ? sortedPlants.reduce((acc, plant) => acc + plant.spend_inr_cr, 0)
    : null;
  const top10PlantsSpendInrCr = top10Plants.length > 0 && top10Plants.every((plant) => plant.spend_inr_cr != null)
    ? top10Plants.reduce((acc, plant) => acc + plant.spend_inr_cr, 0)
    : null;
  const totalPlantsUsdM = sortedPlants.length > 0 && sortedPlants.every((plant) => plant.spend_usd_m != null)
    ? sortedPlants.reduce((total, plant) => total + (plant.spend_usd_m ?? 0), 0)
    : null;
  const top10PlantsUsdM = top10Plants.length > 0 && top10Plants.every((plant) => plant.spend_usd_m != null)
    ? top10Plants.reduce((total, plant) => total + (plant.spend_usd_m ?? 0), 0)
    : null;
  const balancePlantsCount = Math.max(0, sortedPlants.length - 10);
  const balancePlantsUsdM = totalPlantsUsdM != null && top10PlantsUsdM != null ? totalPlantsUsdM - top10PlantsUsdM : null;
  const balancePlantsSpendInrCr = totalPlantsSpendInrCr != null && top10PlantsSpendInrCr != null
    ? Math.max(0, Number((totalPlantsSpendInrCr - top10PlantsSpendInrCr).toFixed(2)))
    : null;
  const balancePlantsSharePct = totalPlantsSpendInrCr != null && totalPlantsSpendInrCr > 0 && balancePlantsSpendInrCr != null
    ? Number(((balancePlantsSpendInrCr / totalPlantsSpendInrCr) * 100).toFixed(1))
    : null;
  const top10PlantsSharePct = totalPlantsSpendInrCr != null && totalPlantsSpendInrCr > 0 && top10PlantsSpendInrCr != null
    ? Number(((top10PlantsSpendInrCr / totalPlantsSpendInrCr) * 100).toFixed(1))
    : null;
  const plantDeviationCr = resolvedSpendCr != null && totalPlantsSpendInrCr != null
    ? Math.abs(Number((resolvedSpendCr - totalPlantsSpendInrCr).toFixed(2)))
    : null;
  const plantDeviationPct = plantDeviationCr != null && resolvedSpendCr != null && resolvedSpendCr > 0
    ? Number(((plantDeviationCr / resolvedSpendCr) * 100).toFixed(2))
    : null;
  const plantsReconciled = plantDeviationCr != null && plantDeviationCr < 0.01;

  // Material Group Calculations & Reconciliation
  const sortedMgs = [...filteredMaterialGroups].sort((a, b) => {
    const aSpend = a.spend_inr_cr ?? 0;
    const bSpend = b.spend_inr_cr ?? 0;
    return bSpend - aSpend;
  });
  const top10Mgs = sortedMgs.slice(0, 10);
  const displayedMgs = mgScope === 'TOP_10' && !searchQuery ? top10Mgs : sortedMgs;

  const totalMgsSpendInrCr = sortedMgs.length > 0 && sortedMgs.every((group) => group.spend_inr_cr != null)
    ? sortedMgs.reduce((acc, group) => acc + group.spend_inr_cr, 0)
    : null;
  const effectiveTotalMgSpend = resolvedSpendCr ?? totalMgsSpendInrCr;
  const top10MgsSpendInrCr = top10Mgs.length > 0 && top10Mgs.every((group) => group.spend_inr_cr != null)
    ? top10Mgs.reduce((acc, group) => acc + group.spend_inr_cr, 0)
    : null;
  const totalMgsUsdM = sortedMgs.length > 0 && sortedMgs.every((group) => group.spend_usd_m != null)
    ? sortedMgs.reduce((total, group) => total + (group.spend_usd_m ?? 0), 0)
    : null;
  const top10MgsUsdM = top10Mgs.length > 0 && top10Mgs.every((group) => group.spend_usd_m != null)
    ? top10Mgs.reduce((total, group) => total + (group.spend_usd_m ?? 0), 0)
    : null;
  const balanceMgsCount = Math.max(0, sortedMgs.length - 10);
  const balanceMgsUsdM = totalMgsUsdM != null && top10MgsUsdM != null ? totalMgsUsdM - top10MgsUsdM : null;
  const balanceMgsSpendInrCr = effectiveTotalMgSpend != null && top10MgsSpendInrCr != null
    ? Math.max(0, Number((effectiveTotalMgSpend - top10MgsSpendInrCr).toFixed(2)))
    : null;
  const balanceMgsSharePct = effectiveTotalMgSpend != null && effectiveTotalMgSpend > 0 && balanceMgsSpendInrCr != null
    ? Number(((balanceMgsSpendInrCr / effectiveTotalMgSpend) * 100).toFixed(1))
    : null;
  const top10MgsSharePct = effectiveTotalMgSpend != null && effectiveTotalMgSpend > 0 && top10MgsSpendInrCr != null
    ? Number(((top10MgsSpendInrCr / effectiveTotalMgSpend) * 100).toFixed(1))
    : null;
  const mgDeviationCr = resolvedSpendCr != null && totalMgsSpendInrCr != null
    ? Math.abs(Number((resolvedSpendCr - totalMgsSpendInrCr).toFixed(2)))
    : null;
  const mgDeviationPct = mgDeviationCr != null && resolvedSpendCr != null && resolvedSpendCr > 0
    ? Number(((mgDeviationCr / resolvedSpendCr) * 100).toFixed(2))
    : null;
  const materialGroupsReconciled = mgDeviationCr != null && mgDeviationCr < 0.01;

  return (
    <div
      ref={summarySectionRef}
      id="document-summary-section"
      className="p-6 rounded-2xl bg-white border border-slate-200 glass-panel space-y-6"
    >
      {/* Top Banner: Ingested File Details & Currency Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono font-bold text-cyan-800 bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-300 shrink-0 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.documentSummary.badge}</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
              {UI_STRINGS.documentSummary.valuationBadge}
            </span>
            {isDataRefreshed && (
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300 shrink-0 flex items-center space-x-1 shadow-xs animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{UI_STRINGS.documentSummary.revisedNumbersBadge}</span>
              </span>
            )}
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {UI_STRINGS.documentSummary.heading}
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {UI_STRINGS.documentSummary.subheading(resolvedFileName, resolvedRecordsCount)}
          </p>
        </div>

        {/* Currency Switcher Toggle: INR vs USD */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-slate-600">
            {UI_STRINGS.documentSummary.currencyToggleLabel}
          </span>
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs font-mono shadow-xs">
            <button
              onClick={() => setSpendCurrency('INR')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                spendCurrency === 'INR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.documentSummary.currencies.inr}
            </button>
            <button
              onClick={() => setSpendCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                spendCurrency === 'USD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.documentSummary.currencies.usd}
            </button>
          </div>
        </div>
      </div>

      {/* 6 High-Level Key Performance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total Spend — label reflects actual spend provenance */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {canonicalViewModel?.spendProvenance === 'ERP_CONVERTED'
              ? UI_STRINGS.documentSummary.erpConvertedSpend
              : UI_STRINGS.documentSummary.validFxNormalizedSpend}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
            {totalSpendFormatted}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {spendCurrency === 'INR' ? UI_STRINGS.documentSummary.baseInrCrores : UI_STRINGS.documentSummary.usdDatabaseValue}
          </span>
        </div>

        {/* Total Line Items */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {UI_STRINGS.documentSummary.evaluatedRecords}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {resolvedRecordsCount?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {months.length > 0 ? UI_STRINGS.documentSummary.acrossBillingMonths(months.length) : UI_STRINGS.documentSummary.acrossBillingCycle}
          </span>
        </div>

        {/* Unique Items */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              {UI_STRINGS.documentSummary.uniqueItems}
            </span>
            <Package className="w-3.5 h-3.5 text-cyan-600 opacity-80" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-cyan-600">
            {resolvedUniqueItems?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.distinctSkusSubtitle}
          </span>
        </div>

        {/* Unique Vendors */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
              {UI_STRINGS.documentSummary.uniqueVendors}
            </span>
            <Users className="w-3.5 h-3.5 text-indigo-600 opacity-80" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-indigo-600">
            {resolvedUniqueVendors?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.activeSuppliersSubtitle}
          </span>
        </div>

        {/* Material Groups */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {UI_STRINGS.documentSummary.materialGroupsCount}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {resolvedMaterialGroupsCount == null ? UI_STRINGS.common.notAvailable : UI_STRINGS.documentSummary.dynamicGroupsCount(resolvedMaterialGroupsCount)}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.directConsumablesSubtitle}
          </span>
        </div>

        {/* Operating Plants */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
            {UI_STRINGS.documentSummary.operatingPlants}
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {resolvedPlantsCount == null ? UI_STRINGS.common.notAvailable : UI_STRINGS.documentSummary.dynamicFacilitiesCount(resolvedPlantsCount)}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {UI_STRINGS.documentSummary.acrossHubsSubtitle}
          </span>
        </div>
      </div>

      {/* Spend Provenance & FX Normalization Status Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-700">
          <span className="font-medium">
            {canonicalViewModel?.spendProvenance === 'ERP_CONVERTED'
              ? UI_STRINGS.documentSummary.erpConvertedNormalizationNote
              : UI_STRINGS.documentSummary.fxHistoricalNormalizationNote}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span
            className="px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold"
            title={UI_STRINGS.documentSummary.fxMethodologyImpactNote}
          >
            {!canonicalViewModel ||
            canonicalViewModel.spendProvenance === 'ERP_CONVERTED' ||
            canonicalViewModel.fxNormalizationImpactStatus === 'NOT_CALCULATED' ||
            (!canonicalViewModel.isTestData && canonicalViewModel.fxNormalizationImpactCr === 0) ? (
              <>
                <span>{UI_STRINGS.documentSummary.fxNormalizationImpactLabel}: </span>
                <span>{UI_STRINGS.documentSummary.fxNotCalculated}</span>
              </>
            ) : canonicalViewModel.fxNormalizationImpactCr !== undefined ? (
              `FX normalization impact vs profile rates: ₹${canonicalViewModel.fxNormalizationImpactCr.toFixed(2)} Cr`
            ) : (
              <span>{UI_STRINGS.documentSummary.fxMethodologyImpactLabel}</span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 font-sans">
            ({UI_STRINGS.documentSummary.fxMethodologyImpactNote})
          </span>
        </div>
      </div>

      {/* Duplicate Review Indicator — rendered whenever suspected duplicates exist */}
      {canonicalViewModel?.suspectedDuplicateRowCount !== undefined &&
        canonicalViewModel.suspectedDuplicateRowCount > 0 && (
        <div
          id="duplicate-review-banner"
          className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col md:flex-row md:items-start gap-3 text-xs font-mono"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-amber-700 font-bold shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>{UI_STRINGS.documentSummary.suspectedDuplicatesLabel}</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            {UI_STRINGS.documentSummary.suspectedDuplicatesNote(
              canonicalViewModel.suspectedDuplicateRowCount
            )}
          </p>
        </div>
      )}

      {/* Navigation Dimension Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Dimension Switcher Tabs */}
        <div className="flex flex-wrap items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs font-mono shadow-xs">
          <button
            onClick={() => {
              setActiveDimension('MATERIAL_GROUP');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeDimension === 'MATERIAL_GROUP'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{UI_STRINGS.documentSummary.dimensionTabs.month}</span>
          </button>
        </div>

        {/* Month View Fiscal Year Filter Buttons */}
        {activeDimension === 'MONTH' && (
          <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setSelectedMonthFy('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedMonthFy === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {UI_STRINGS.documentSummary.month.allMonthsFilter(months.length)}
            </button>
            {Array.from(new Set(months.map((m) => m.fiscal_year))).filter(Boolean).map((fy) => (
              <button
                key={fy}
                onClick={() => setSelectedMonthFy(fy)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedMonthFy === fy
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fy}
              </button>
            ))}
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
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* DIMENSION VIEW 1: MATERIAL GROUP SUMMARY */}
      {activeDimension === 'MATERIAL_GROUP' && (
        <div className="space-y-4">
          {/* Material Group Reconciliation & Scope Note Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-700 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{UI_STRINGS.documentSummary.reconciliation.mgScopeHeading}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {materialGroupsReconciled ? UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge : UI_STRINGS.common.notAvailable}
                </span>
              </div>

              {/* Scope Filter Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {UI_STRINGS.documentSummary.reconciliation.scopeToggleLabel}
                </span>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-mono shadow-2xs">
                  <button
                    onClick={() => setMgScope('TOP_10')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      mgScope === 'TOP_10'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.top10Scope}
                  </button>
                  <button
                    onClick={() => setMgScope('ALL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      mgScope === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.allScope(sortedMgs.length)}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-200/60">
              <div className="text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Scope Details: </span>
                {mgScope === 'TOP_10'
                  ? UI_STRINGS.documentSummary.reconciliation.top10MgNote(
                      top10Mgs.length,
                      activeDoc?.material_groups_count || sortedMgs.length,
                      spendCurrency === 'INR' ? top10MgsSpendInrCr != null ? `₹${top10MgsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : top10MgsUsdM != null ? `$${top10MgsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable,
                      spendCurrency === 'INR' ? effectiveTotalMgSpend != null ? `₹${effectiveTotalMgSpend.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : totalMgsUsdM != null ? `$${totalMgsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable,
                      top10MgsSharePct?.toFixed(1) ?? UI_STRINGS.common.notAvailable
                    )
                  : UI_STRINGS.documentSummary.reconciliation.allMgNote(
                      sortedMgs.length,
                      spendCurrency === 'INR' ? effectiveTotalMgSpend != null ? `₹${effectiveTotalMgSpend.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : totalMgsUsdM != null ? `$${totalMgsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable
                    )}
              </div>
              <div className="text-slate-600 leading-relaxed flex items-center md:justify-end space-x-1.5">
                <span className="font-bold text-emerald-700">Deviation / Gap: </span>
                <span className="font-bold text-slate-900">{mgDeviationCr != null && mgDeviationPct != null ? `₹${mgDeviationCr.toFixed(2)} Cr (${mgDeviationPct.toFixed(2)}%)` : UI_STRINGS.common.notAvailable}</span>
                <span className="text-[11px] text-slate-400">{materialGroupsReconciled ? UI_STRINGS.documentSummary.reconciliation.zeroDeviationText : UI_STRINGS.common.notAvailable}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.materialGroup.headers.code}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.materialGroup.headers.name}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.materialGroup.headers.sampleItem}</th>
                  <th className="py-3 px-3 text-right font-bold text-cyan-700">{UI_STRINGS.documentSummary.materialGroup.headers.uniqueItems}</th>
                  <th className="py-3 px-3 text-right font-bold text-indigo-700">{UI_STRINGS.documentSummary.materialGroup.headers.uniqueVendors}</th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.materialGroup.headers.records}</th>
                  <th className="py-3 px-3.5 text-right font-bold text-emerald-700">
                    {UI_STRINGS.documentSummary.materialGroup.headers.spend(spendCurrency === 'INR' ? '₹ Cr' : '$ M')}
                  </th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.materialGroup.headers.share}</th>
                  <th className="py-3 px-3.5 text-left">
                    {periodMetadata?.hasMultiYearComparison
                      ? UI_STRINGS.documentSummary.materialGroup.headers.trend
                      : UI_STRINGS.documentSummary.materialGroup.headers.trendSingleFy(
                          periodMetadata?.actualFiscalYears?.[0] || UI_STRINGS.common.notAvailable
                        )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedMgs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500 font-sans">
                      {UI_STRINGS.documentSummary.emptyFilter}
                    </td>
                  </tr>
                ) : (
                  displayedMgs.map((mg, mgIdx) => {
                    const groupCode = mg.group_code || UI_STRINGS.common.notAvailable;
                    const groupName = mg.group_name || UI_STRINGS.common.notAvailable;
                    const spendInrCr = mg.spend_inr_cr ?? 0;
                    const spendUsdM = mg.spend_usd_m;
                    const spendVal =
                      spendCurrency === 'INR'
                        ? `₹${spendInrCr.toFixed(2)} Cr`
                        : spendUsdM != null ? `$${spendUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable;
                    const sharePct = mg.share_pct;
                    const fy24 = mg.fy24_spend_inr_cr;
                    const fy25 = mg.fy25_spend_inr_cr;
                    const fy26 = mg.fy26_spend_inr_cr;
                    const recordsCount = mg.records_count;
                    const uniqueItems = mg.unique_items_count;
                    const uniqueVendors = mg.unique_vendors_count;

                    return (
                      <tr key={`mg-${groupCode}-${mgIdx}`} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-cyan-700 whitespace-nowrap">
                          {groupCode}
                        </td>
                        <td className="py-3 px-3.5 font-sans font-medium text-slate-900">
                          {groupName}
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[11px] truncate max-w-xs" title={mg.sample_item || mg.primary_segment}>
                          {mg.sample_item || mg.primary_segment || UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-cyan-700">
                          {uniqueItems?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-indigo-700">
                          {uniqueVendors?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          {recordsCount?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                          {spendVal}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">
                          {sharePct != null ? `${sharePct.toFixed(1)}%` : UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3.5 w-44">
                          {periodMetadata?.hasMultiYearComparison && fy24 != null && fy25 != null && fy26 != null ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] text-slate-400">
                                <span>FY24: ₹{fy24.toFixed(1)}</span>
                                <span>FY25: ₹{fy25.toFixed(1)}</span>
                                <span>FY26: ₹{fy26.toFixed(1)}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 flex overflow-hidden">
                                <div
                                  className="bg-sky-400 h-full"
                                  style={{ width: `${spendInrCr > 0 ? (fy24 / spendInrCr) * 100 : 0}%` }}
                                />
                                <div
                                  className="bg-blue-500 h-full"
                                  style={{ width: `${spendInrCr > 0 ? (fy25 / spendInrCr) * 100 : 0}%` }}
                                />
                                <div
                                  className="bg-indigo-600 h-full"
                                  style={{ width: `${spendInrCr > 0 ? (fy26 / spendInrCr) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                <span>{periodMetadata?.actualFiscalYears?.[0] || UI_STRINGS.common.notAvailable}: ₹{spendInrCr.toFixed(1)} Cr</span>
                                <span className="text-cyan-700 font-bold">{sharePct != null ? `${sharePct.toFixed(1)}%` : UI_STRINGS.common.notAvailable}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 flex overflow-hidden">
                                <div
                                  className="bg-cyan-500 h-full"
                                  style={{ width: `${sharePct != null ? Math.min(100, Math.max(0, sharePct * 2)) : 0}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 text-slate-900 text-xs font-mono font-bold border-t-2 border-slate-200">
                {/* Balance Row if in Top 10 Scope */}
                {mgScope === 'TOP_10' && balanceMgsCount > 0 && (
                  <tr className="bg-slate-50/70 text-slate-600 italic">
                    <td className="py-2.5 px-3.5 font-bold text-slate-500 whitespace-nowrap">
                      BAL-{balanceMgsCount}
                    </td>
                    <td className="py-2.5 px-3.5 font-sans font-medium text-slate-700">
                      {UI_STRINGS.documentSummary.reconciliation.balanceMgRowLabel(balanceMgsCount)}
                    </td>
                    <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                      {UI_STRINGS.documentSummary.reconciliation.balanceMgDesc(balanceMgsCount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-600">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      —
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-800 whitespace-nowrap">
                      {spendCurrency === 'INR' ? balanceMgsSpendInrCr != null ? `₹${balanceMgsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : balanceMgsUsdM != null ? `$${balanceMgsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                      {balanceMgsSharePct == null ? UI_STRINGS.common.notAvailable : `${balanceMgsSharePct.toFixed(1)}%`}
                    </td>
                    <td className="py-2.5 px-3.5 text-[10px] text-slate-400">
                      Balance Commodity Categories
                    </td>
                  </tr>
                )}

                {/* Grand Total Row */}
                <tr className="bg-slate-100/90 border-t border-slate-300">
                  <td className="py-3 px-3.5 font-black text-emerald-700">
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalLabel}
                  </td>
                  <td className="py-3 px-3.5 font-sans font-black text-slate-900" colSpan={2}>
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalMgDesc(sortedMgs.length)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-cyan-700">
                    {resolvedUniqueItems?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-indigo-700">
                    {resolvedUniqueVendors?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3 text-right font-sans font-black">
                    {resolvedRecordsCount?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-emerald-700 whitespace-nowrap text-sm">
                    {spendCurrency === 'INR' ? effectiveTotalMgSpend != null ? `₹${effectiveTotalMgSpend.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : totalMgsUsdM != null ? `$${totalMgsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {materialGroupsReconciled ? '100.0%' : UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3.5 text-[10px] font-bold text-emerald-600">
                    {materialGroupsReconciled ? UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge : UI_STRINGS.common.notAvailable}
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-700 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{UI_STRINGS.documentSummary.reconciliation.plantScopeHeading}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {plantsReconciled ? UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge : UI_STRINGS.common.notAvailable}
                </span>
              </div>

              {/* Scope Filter Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {UI_STRINGS.documentSummary.reconciliation.scopeToggleLabel}
                </span>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-mono shadow-2xs">
                  <button
                    onClick={() => setPlantScope('TOP_10')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      plantScope === 'TOP_10'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.top10Scope}
                  </button>
                  <button
                    onClick={() => setPlantScope('ALL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      plantScope === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {UI_STRINGS.documentSummary.reconciliation.allScope(sortedPlants.length)}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-200/60">
              <div className="text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Scope Details: </span>
                {plantScope === 'TOP_10'
                  ? UI_STRINGS.documentSummary.reconciliation.top10PlantNote(
                      top10Plants.length,
                      sortedPlants.length,
                      spendCurrency === 'INR' ? top10PlantsSpendInrCr != null ? `₹${top10PlantsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : top10PlantsUsdM != null ? `$${top10PlantsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable,
                      spendCurrency === 'INR' ? totalPlantsSpendInrCr != null ? `₹${totalPlantsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : totalPlantsUsdM != null ? `$${totalPlantsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable,
                      top10PlantsSharePct?.toFixed(1) ?? UI_STRINGS.common.notAvailable,
                      balancePlantsCount,
                      spendCurrency === 'INR' ? balancePlantsSpendInrCr != null ? `₹${balancePlantsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : balancePlantsUsdM != null ? `$${balancePlantsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable,
                      balancePlantsSharePct?.toFixed(1) ?? UI_STRINGS.common.notAvailable
                    )
                  : UI_STRINGS.documentSummary.reconciliation.allPlantNote(
                      sortedPlants.length,
                      spendCurrency === 'INR' ? totalPlantsSpendInrCr != null ? `₹${totalPlantsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : totalPlantsUsdM != null ? `$${totalPlantsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable
                    )}
              </div>
              <div className="text-slate-600 leading-relaxed flex items-center md:justify-end space-x-1.5">
                <span className="font-bold text-emerald-700">Deviation / Gap: </span>
                <span className="font-bold text-slate-900">{plantDeviationCr != null && plantDeviationPct != null ? `₹${plantDeviationCr.toFixed(2)} Cr (${plantDeviationPct.toFixed(2)}%)` : UI_STRINGS.common.notAvailable}</span>
                <span className="text-[11px] text-slate-400">{plantsReconciled ? UI_STRINGS.documentSummary.reconciliation.zeroDeviationText : UI_STRINGS.common.notAvailable}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.code}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.name}</th>
                  <th className="py-3 px-3">{UI_STRINGS.documentSummary.plant.headers.region}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.location}</th>
                  <th className="py-3 px-3 text-right font-bold text-cyan-700">{UI_STRINGS.documentSummary.plant.headers.uniqueItems}</th>
                  <th className="py-3 px-3 text-right font-bold text-indigo-700">{UI_STRINGS.documentSummary.plant.headers.vendors}</th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.plant.headers.records}</th>
                  <th className="py-3 px-3.5 text-right font-bold text-emerald-700">
                    {UI_STRINGS.documentSummary.plant.headers.spend(spendCurrency === 'INR' ? '₹ Cr' : '$ M')}
                  </th>
                  <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.plant.headers.share}</th>
                  <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.plant.headers.primaryGroup}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedPlants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-500 font-sans">
                      {UI_STRINGS.documentSummary.emptyFilter}
                    </td>
                  </tr>
                ) : (
                  displayedPlants.map((p, pIdx) => {
                    const plantCode = p.plant_code || UI_STRINGS.common.notAvailable;
                    const plantName = p.plant_name || UI_STRINGS.common.notAvailable;
                    const spendInrCr = p.spend_inr_cr;
                    const spendUsdM = p.spend_usd_m;
                    const spendVal =
                      spendCurrency === 'INR'
                        ? spendInrCr != null ? `₹${spendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable
                        : spendUsdM != null ? `$${spendUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable;
                    const recordsCount = p.records_count ?? p.total_po_count;
                    const uniqueItems = p.unique_items_count;
                    const uniqueVendors = p.unique_vendors_count;

                    return (
                      <tr key={`plant-${plantCode}-${pIdx}`} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-cyan-700 whitespace-nowrap">
                          {plantCode}
                        </td>
                        <td className="py-3 px-3.5 font-sans font-medium text-slate-900">
                          {plantName}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {p.region || UI_STRINGS.common.notAvailable}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[11px] truncate max-w-xs" title={p.location || UI_STRINGS.common.notAvailable}>
                          {p.location || UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-cyan-700">
                          {uniqueItems?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-indigo-700">
                          {uniqueVendors?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          {recordsCount?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                          {spendVal}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">
                          {p.share_pct != null ? `${p.share_pct.toFixed(1)}%` : UI_STRINGS.common.notAvailable}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            {p.primary_material_group || UI_STRINGS.common.notAvailable}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 text-slate-900 text-xs font-mono font-bold border-t-2 border-slate-200">
                {/* Balance Row if in Top 10 Scope */}
                {plantScope === 'TOP_10' && balancePlantsCount > 0 && (
                  <tr className="bg-slate-50/70 text-slate-600 italic">
                    <td className="py-2.5 px-3.5 font-bold text-slate-500 whitespace-nowrap">
                      BAL-{balancePlantsCount}
                    </td>
                    <td className="py-2.5 px-3.5 font-sans font-medium text-slate-700">
                      {UI_STRINGS.documentSummary.reconciliation.balanceRowLabel(balancePlantsCount)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px]">
                        Multi-Zone
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-[11px] text-slate-500">
                      {UI_STRINGS.documentSummary.reconciliation.balanceDesc(balancePlantsCount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-600">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      —
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-800 whitespace-nowrap">
                    {spendCurrency === 'INR' ? balancePlantsSpendInrCr != null ? `₹${balancePlantsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : balancePlantsUsdM != null ? `$${balancePlantsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                      {balancePlantsSharePct == null ? UI_STRINGS.common.notAvailable : `${balancePlantsSharePct.toFixed(1)}%`}
                    </td>
                    <td className="py-2.5 px-3.5 text-[10px] text-slate-400">
                      Balance Secondary Hubs
                    </td>
                  </tr>
                )}

                {/* Grand Total Row */}
                <tr className="bg-slate-100/90 border-t border-slate-300">
                  <td className="py-3 px-3.5 font-black text-emerald-700">
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalLabel}
                  </td>
                  <td className="py-3 px-3.5 font-sans font-black text-slate-900" colSpan={3}>
                    {UI_STRINGS.documentSummary.reconciliation.grandTotalDesc(sortedPlants.length)}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-cyan-700">
                    {resolvedUniqueItems?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-indigo-700">
                    {resolvedUniqueVendors?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3 text-right font-sans font-black">
                    {resolvedRecordsCount?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-emerald-700 whitespace-nowrap text-sm">
                    {spendCurrency === 'INR' ? totalPlantsSpendInrCr != null ? `₹${totalPlantsSpendInrCr.toFixed(2)} Cr` : UI_STRINGS.common.notAvailable : totalPlantsUsdM != null ? `$${totalPlantsUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {plantsReconciled ? '100.0%' : UI_STRINGS.common.notAvailable}
                  </td>
                  <td className="py-3 px-3.5 text-[10px] font-bold text-emerald-600">
                    {plantsReconciled ? UI_STRINGS.documentSummary.reconciliation.zeroDeviationBadge : UI_STRINGS.common.notAvailable}
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
            periodMetadata={periodMetadata}
          />

          {/* Detailed Monthly Data Table (shown in CHART_AND_TABLE and TABLE_ONLY modes) */}
          {monthViewMode !== 'CHART_ONLY' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.month.headers.month}</th>
                    <th className="py-3 px-3">{UI_STRINGS.documentSummary.month.headers.fy}</th>
                    <th className="py-3 px-3.5 text-right font-bold text-emerald-700">
                      {UI_STRINGS.documentSummary.month.headers.spend(spendCurrency === 'INR' ? '₹ Cr' : '$ M')}
                    </th>
                    <th className="py-3 px-3 text-right font-bold text-cyan-700">{UI_STRINGS.documentSummary.month.headers.uniqueItems}</th>
                    <th className="py-3 px-3 text-right font-bold text-indigo-700">{UI_STRINGS.documentSummary.month.headers.uniqueVendors}</th>
                    <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.month.headers.records}</th>
                    <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.month.headers.topGroup}</th>
                    <th className="py-3 px-3.5">{UI_STRINGS.documentSummary.month.headers.topPlant}</th>
                    <th className="py-3 px-3 text-right">{UI_STRINGS.documentSummary.month.headers.mom}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMonths.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-500 font-sans">
                        {UI_STRINGS.documentSummary.emptyFilter}
                      </td>
                    </tr>
                  ) : (
                    filteredMonths.map((m, mIdx) => {
                      const spendInrCr = m.spend_inr_cr ?? 0;
                      const spendUsdM = m.spend_usd_m;
                      const spendVal =
                        spendCurrency === 'INR'
                          ? `₹${spendInrCr.toFixed(2)} Cr`
                          : spendUsdM != null ? `$${spendUsdM.toFixed(2)} M` : UI_STRINGS.common.notAvailable;

                      const momChange = m.mom_change_pct;
                      const isPositive = momChange != null && momChange > 0;
                      const isZero = momChange === 0;
                      const recordsCount = m.records_count ?? m.line_items_count;
                      const uniqueItems = m.unique_items_count;
                      const uniqueVendors = m.unique_vendors_count;

                      return (
                        <tr key={`month-${m.month_key}-${mIdx}`} className="bg-white hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {m.month_label}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {m.fiscal_year}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                            {spendVal}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-cyan-700">
                            {uniqueItems?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-700">
                            {uniqueVendors?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            {recordsCount?.toLocaleString() ?? UI_STRINGS.common.notAvailable}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                              {m.top_material_group}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                              {m.top_plant}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isZero
                                  ? 'bg-slate-100 text-slate-600'
                                  : isPositive
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {momChange == null ? UI_STRINGS.common.notAvailable : isPositive ? `+${momChange.toFixed(1)}%` : `${momChange.toFixed(1)}%`}
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
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{UI_STRINGS.documentSummary.footerValidation(activeDoc?.records_count ?? resolvedRecordsCount ?? UI_STRINGS.common.notAvailable)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
