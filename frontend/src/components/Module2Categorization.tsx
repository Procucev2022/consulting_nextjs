'use client';
import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  Edit3,
  Search,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  Check,
  Calendar,
  TrendingUp,
  Factory,
  Layers,
  Package,
  Truck,
  Wrench,
  Tag,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import type { Module2CategorizationProps, LineItemMapping, UNSPSCCommodityRecord } from '../types';
import { searchUNSPSCTaxonomy, lookupUNSPSCDetails } from '../data/unspscTaxonomy';
import { categoryYearWiseDetails } from '../data/mockData';
import { formatINRAmount } from '../utils/currencyConverter';
import {
  UI_STRINGS,
  DEFAULT_INDUSTRY_MAJOR_SECTOR,
  DEFAULT_INDUSTRY_MINOR_SECTOR,
  getDistinctMajorSectors,
  getMinorSectorsForMajor,
  getIndustryMaterialProfile,
  categorizeMaterialWithIndustryContext
} from '../constants';
import { CategoryVendorBreakdownView } from './CategoryVendorBreakdownView';
import { StrategicSingleVendorRiskSection } from './strategicRisk';
import { VendorConsolidationSection } from './vendorConsolidation';
import { PoConsolidationSection } from './poConsolidation';
import { VendorCategorySupplyMatrix } from './VendorCategorySupplyMatrix';
import dynamic from 'next/dynamic';
import { AnalyzingLoader } from './AnalyzingLoader';
import { TierMaskOverlay } from './TierMaskOverlay';
const UNSPSCDetailModal = dynamic(
  () => import('./modals/UNSPSCDetailModal').then((mod) => mod.UNSPSCDetailModal),
  { ssr: false }
);

export const Module2Categorization: React.FC<Module2CategorizationProps> = ({
  tenant,
  categories: _categories,
  lineItems,
  onConfirmMapping,
  onReassignMapping,
  onProceedToTrend,
  onStartAICategorization,
  speedMultiplier,
  onUpdateTenant,
  currentTier = 'GOLD',
  onUpgrade
}) => {
  const [isCategorizing, setIsCategorizing] = useState<boolean>(false);
  const [isCategorized, setIsCategorized] = useState<boolean>(false);
  const [selectedBucket, setSelectedBucket] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [selectedSectorRelevanceFilter, setSelectedSectorRelevanceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minConfidence] = useState<number>(0);

  // Industry Sector Lens State
  const [activeMajorSector, setActiveMajorSector] = useState<string>(
    tenant?.major_sector || DEFAULT_INDUSTRY_MAJOR_SECTOR
  );
  const [activeMinorSector, setActiveMinorSector] = useState<string>(
    tenant?.minor_sector || DEFAULT_INDUSTRY_MINOR_SECTOR
  );

  const distinctMajorSectors = getDistinctMajorSectors();
  const availableMinorSectors = getMinorSectorsForMajor(activeMajorSector);
  const activeMaterialProfile = getIndustryMaterialProfile(activeMajorSector, activeMinorSector);

  const handleSectorChange = (newMajor: string, newMinor?: string) => {
    setActiveMajorSector(newMajor);
    const resolvedMinor = newMinor || getMinorSectorsForMajor(newMajor)[0];
    setActiveMinorSector(resolvedMinor);
    if (tenant && onUpdateTenant) {
      onUpdateTenant({
        ...tenant,
        major_sector: newMajor,
        minor_sector: resolvedMinor
      });
    }
  };

  const handleStartAICategorization = () => {
    setIsCategorizing(true);
    onStartAICategorization?.();
  };

  const handleCategorizationComplete = () => {
    setIsCategorizing(false);
    setIsCategorized(true);
  };

  // UNSPSC Column L Live Explorer State
  const [explorerSearch, setExplorerSearch] = useState<string>('');
  const [explorerBucketFilter, setExplorerBucketFilter] = useState<string>('ALL');
  const [selectedUNSPSCRecord, setSelectedUNSPSCRecord] = useState<UNSPSCCommodityRecord | null>(null);

  // Matrix View Tab: Top 50 Vendor Material Supply Categorization vs Category Matrix
  const [matrixTab, setMatrixTab] = useState<'VENDOR_SUPPLY' | 'CATEGORY_MATRIX'>('VENDOR_SUPPLY');

  // Column L Section Tab: Strategic Single/Dominant Vendor Risk Engine (Default) vs UNSPSC Catalog
  const [columnLTab, setColumnLTab] = useState<'strategicRisk' | 'catalog'>('strategicRisk');

  const matchesSearchQuery = (item: LineItemMapping, q: string): boolean => {
    const query = q.toLowerCase();
    const fields = [
      item.raw_desc,
      item.vendor_identified,
      item.unspsc_code,
      item.po_number,
      item.material_code,
      item.material_desc,
      item.unspsc_commodity_title,
      item.unspsc_class_title,
      item.unspsc_category_name
    ];
    return fields.some((f) => f?.toLowerCase().includes(query));
  };

  const filteredItems = lineItems.filter((item) => {
    if (selectedBucket !== 'ALL' && item.core_bucket !== selectedBucket) return false;
    if (selectedYearFilter !== 'ALL' && String(item.spend_year) !== selectedYearFilter) return false;
    if (item.ai_confidence < minConfidence) return false;

    if (selectedSectorRelevanceFilter !== 'ALL') {
      const relevanceResult = categorizeMaterialWithIndustryContext(
        item.raw_desc,
        item.unspsc_code,
        activeMajorSector,
        activeMinorSector
      );
      if (relevanceResult.sectorRelevance !== selectedSectorRelevanceFilter) return false;
    }

    if (searchQuery && !matchesSearchQuery(item, searchQuery)) {
      return false;
    }
    return true;
  });

  const explorerResults = searchUNSPSCTaxonomy(explorerSearch, explorerBucketFilter).slice(0, 8);

  const totalEvaluatedSpendInrCr = categoryYearWiseDetails.reduce(
    (sum, item) => sum + item.total_3yr_spend_inr_cr,
    0
  );

  const handleUpgradeSilver = () => {
    onUpgrade?.('SILVER');
  };

  const handleUpgradeGold = () => {
    onUpgrade?.('GOLD');
  };

  if (currentTier === 'BRONZE') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <TierMaskOverlay
          requiredTier="SILVER"
          title={UI_STRINGS.subscription.stageMaskedTitle('Module 2: UNSPSC Taxonomy & Categorization')}
          description={UI_STRINGS.subscription.stageMaskedBronzeDesc}
          onUpgrade={handleUpgradeSilver}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Pictorial Analyzing Loader for UNSPSC AI Categorization */}
      {isCategorizing && (
        <AnalyzingLoader
          isOpen={isCategorizing}
          mode="overlay"
          title={UI_STRINGS.module2.industryContext.materialsDnaTitle}
          subtitle={UI_STRINGS.module2.industryContext.calibratedFor(activeMajorSector, activeMinorSector)}
          onComplete={handleCategorizationComplete}
          onCancel={() => setIsCategorizing(false)}
          speedMultiplier={speedMultiplier}
        />
      )}

      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 border border-sky-100 dark:border-cyan-500/20 shadow-sm dark:shadow-xl glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
              {UI_STRINGS.module2.badge}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/60">
              {UI_STRINGS.module2.valuationBadge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {UI_STRINGS.module2.heading}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {UI_STRINGS.module2.descriptionPrefix}<strong>{UI_STRINGS.module2.descriptionHighlight}</strong>{UI_STRINGS.module2.descriptionSuffix}
          </p>
        </div>

        {/* Start AI Categorization as per UNSPSC Button */}
        <button
          type="button"
          onClick={handleStartAICategorization}
          disabled={isCategorizing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 shrink-0 ${
            isCategorized
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
              : isCategorizing
              ? 'bg-cyan-700 text-cyan-100 cursor-wait'
              : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/25 hover:shadow-cyan-600/40'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isCategorizing ? 'animate-spin' : ''}`} />
          <span>
            {isCategorizing
              ? UI_STRINGS.module2.aiCategorizationRunning
              : isCategorized
              ? UI_STRINGS.module2.aiCategorizationCompleted
              : UI_STRINGS.module2.startAiCategorization}
          </span>
        </button>
      </div>

      {/* Industry Sector Lens & Material DNA Profile Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                  {UI_STRINGS.module2.industryContext.badge}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {UI_STRINGS.module2.industryContext.calibratedFor(activeMajorSector, activeMinorSector)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {activeMaterialProfile.tagline}
              </h3>
            </div>
          </div>

          {/* Major and Minor Sector Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <select
                aria-label={UI_STRINGS.modals.clientSetup.industrySector.majorSectorLabel}
                value={activeMajorSector}
                onChange={(e) => handleSectorChange(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {distinctMajorSectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <select
                aria-label={UI_STRINGS.modals.clientSetup.industrySector.minorSectorLabel}
                value={activeMinorSector}
                onChange={(e) => handleSectorChange(activeMajorSector, e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {availableMinorSectors.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4 Pictorial Quadrants: Direct, Packaging, Logistics, MRO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Direct Materials */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{UI_STRINGS.module2.industryContext.relevancePills.coreDirect}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                {activeMaterialProfile.benchmarkSpendSplit.directPct}% Spend
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeMaterialProfile.typicalDirectMaterials.map((mat) => (
                <span
                  key={mat}
                  className="text-[10px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 leading-tight"
                >
                  {mat}
                </span>
              ))}
            </div>
          </div>

          {/* Packaging Materials */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{UI_STRINGS.module2.industryContext.relevancePills.criticalPackaging}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-300 dark:border-cyan-800">
                {activeMaterialProfile.benchmarkSpendSplit.packagingPct}% Spend
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeMaterialProfile.typicalPackagingMaterials.map((pkg) => (
                <span
                  key={pkg}
                  className="text-[10px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 leading-tight"
                >
                  {pkg}
                </span>
              ))}
            </div>
          </div>

          {/* Logistics & Freight */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{UI_STRINGS.module2.industryContext.relevancePills.sectorLogistics}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.2 rounded border border-purple-300 dark:border-purple-800">
                {activeMaterialProfile.benchmarkSpendSplit.logisticsPct}% Spend
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeMaterialProfile.typicalLogisticsCategories.map((log) => (
                <span
                  key={log}
                  className="text-[10px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 leading-tight"
                >
                  {log}
                </span>
              ))}
            </div>
          </div>

          {/* Plant MRO Spares */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>{UI_STRINGS.module2.industryContext.relevancePills.generalMro}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                {activeMaterialProfile.benchmarkSpendSplit.mroPct}% Spend
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeMaterialProfile.typicalMroCategories.map((mro) => (
                <span
                  key={mro}
                  className="text-[10px] bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 leading-tight"
                >
                  {mro}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Categorization Heuristic Guidance Note */}
        <div className="p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-between text-xs text-cyan-950 dark:text-cyan-300">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>{activeMaterialProfile.categorizationGuidance}</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-200/60 dark:bg-cyan-900/80 px-2 py-0.5 rounded text-cyan-950 dark:text-cyan-200 shrink-0">
            {UI_STRINGS.module2.industryContext.sectorBenchmarkPill(
              activeMaterialProfile.benchmarkSpendSplit.directPct,
              activeMaterialProfile.benchmarkSpendSplit.packagingPct
            )}
          </span>
        </div>
      </div>

      {/* Category & Vendor Spend Breakdown Analysis */}
      <CategoryVendorBreakdownView tenant={tenant} />

      {/* Silver Customer Detail Mask */}
      {currentTier === 'SILVER' ? (
        <div className="space-y-6">
          <TierMaskOverlay
            requiredTier="GOLD"
            title={UI_STRINGS.subscription.stageMaskedTitle('Granular SKU Line Items & Reclassification')}
            description={UI_STRINGS.subscription.stageMaskedSilverDesc}
            onUpgrade={handleUpgradeGold}
            isSummaryVisible
          />
          {/* CTA to Module 3 */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.module2.taxonomyVerifiedFooter}</span>
            </div>
            <button
              type="button"
              onClick={onProceedToTrend}
              className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-md shadow-cyan-600/20 transition-all transform active:scale-95 group cursor-pointer"
            >
              <span>{UI_STRINGS.module2.btnProceedToTrend}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Year-Wise Category Spend Valuation Matrix & Top 50 Vendor Supply Categorization */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {matrixTab === 'VENDOR_SUPPLY'
                  ? UI_STRINGS.module2.vendorSupply.sectionTitle
                  : UI_STRINGS.module2.matrixTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {matrixTab === 'VENDOR_SUPPLY'
                  ? UI_STRINGS.module2.vendorSupply.sectionDesc
                  : UI_STRINGS.module2.matrixDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMatrixTab('VENDOR_SUPPLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  matrixTab === 'VENDOR_SUPPLY'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{UI_STRINGS.module2.tabVendorSupply}</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="High-Spend Disparity Alarm" />
              </button>
              <button
                type="button"
                onClick={() => setMatrixTab('CATEGORY_MATRIX')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  matrixTab === 'CATEGORY_MATRIX'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{UI_STRINGS.module2.matrixTitle}</span>
              </button>
            </div>

            <span className="text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800">
              {UI_STRINGS.module2.totalEvaluated(totalEvaluatedSpendInrCr)}
            </span>
          </div>
        </div>

        {/* Tab View: Top 50 Vendors Supply Categorization & Risk Alarm */}
        {matrixTab === 'VENDOR_SUPPLY' ? (
          <VendorCategorySupplyMatrix />
        ) : (
          /* Year-Wise Table */
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{UI_STRINGS.module2.matrixHeaders.category}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.matrixHeaders.colLRange}</th>
                  <th className="py-3 px-4 text-right" title="1st April 2023 – 31st March 2024">{UI_STRINGS.module2.matrixHeaders.fy24}</th>
                  <th className="py-3 px-4 text-right" title="1st April 2024 – 31st March 2025">{UI_STRINGS.module2.matrixHeaders.fy25}</th>
                  <th className="py-3 px-4 text-right" title="1st April 2025 – 31st March 2026">{UI_STRINGS.module2.matrixHeaders.fy26}</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">{UI_STRINGS.module2.matrixHeaders.total}</th>
                  <th className="py-3 px-4 text-center">{UI_STRINGS.module2.matrixHeaders.yoyTrend}</th>
                  <th className="py-3 px-4 text-right">{UI_STRINGS.module2.matrixHeaders.targetSavings}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {categoryYearWiseDetails.map((cat) => {
                  const targetSavingsRate =
                    cat.core_bucket === 'Direct Materials'
                      ? 0.185
                      : cat.core_bucket === 'Packaging Materials'
                      ? 0.161
                      : cat.core_bucket === 'Logistics & Freight'
                      ? 0.12
                      : cat.core_bucket === 'Other Balance'
                      ? 0.08
                      : 0.142;

                  const targetSavingsInrCr = cat.total_3yr_spend_inr_cr * targetSavingsRate;
                  const fy24 = cat.spend_fy24_cr || cat.spend_inr_2023_cr;
                  const fy25 = cat.spend_fy25_cr || cat.spend_inr_2024_cr;
                  const fy26 = cat.spend_fy26_cr || cat.spend_inr_2025_26_cr;

                  return (
                    <tr
                      key={cat.id || cat.category}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        cat.is_balance_category
                          ? 'bg-slate-50/80 dark:bg-slate-900/60 font-semibold'
                          : 'bg-white dark:bg-slate-900/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
                        <span className={`w-6 h-5 rounded px-1 text-[10px] font-mono font-bold flex items-center justify-center ${
                          cat.rank && cat.rank <= 3
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {cat.rank ? `#${cat.rank}` : '•'}
                        </span>
                        <span className="truncate max-w-[260px]" title={cat.category}>{cat.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                          {UI_STRINGS.module2.colLPrefix(cat.sample_column_l_code.split(',')[0])}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200">
                        ₹{fy24.toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200">
                        ₹{fy25.toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200">
                        ₹{fy26.toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{cat.total_3yr_spend_inr_cr.toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center space-x-1 text-amber-700 dark:text-amber-400 text-xs font-bold">
                          <span>+{cat.yoy_growth_pct}%</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{targetSavingsInrCr.toFixed(2)} Cr
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Column L Section: Strategic Single-Vendor Risk Engine (Default) & UNSPSC Catalog */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="tab-strategic-vendor-risk"
              onClick={() => setColumnLTab('strategicRisk')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                columnLTab === 'strategicRisk'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{UI_STRINGS.module2.strategicVendorRisk.tabs.strategicRisk}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                {UI_STRINGS.module2.strategicVendorRisk.header.badgeImmediateAttention}
              </span>
            </button>

            <button
              type="button"
              data-testid="tab-unspsc-catalog"
              onClick={() => setColumnLTab('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                columnLTab === 'catalog'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{UI_STRINGS.module2.strategicVendorRisk.tabs.catalog}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                {UI_STRINGS.module2.catalogRecordsBadge}
              </span>
            </button>
          </div>
        </div>

        {/* View 1: Strategic Single-Vendor & Dominant Supplier Risk Engine (Default) */}
        {columnLTab === 'strategicRisk' && (
          <div data-testid="strategic-vendor-risk-container">
            <StrategicSingleVendorRiskSection />
          </div>
        )}

        {/* View 2: Official UNSPSC English File Column L Live Taxonomy Engine & Search (Preserved in DOM) */}
        <div className={columnLTab === 'catalog' ? 'space-y-4' : 'hidden'}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {UI_STRINGS.module2.catalogTitle}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                    {UI_STRINGS.module2.catalogRecordsBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {UI_STRINGS.module2.catalogDescPrefix}<strong>{UI_STRINGS.module2.catalogDescHighlight}</strong>.
                </p>
              </div>
            </div>

            {/* Explorer Search & Filter */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder={UI_STRINGS.module2.catalogSearchPlaceholder}
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
                />
              </div>
              <select
                value={explorerBucketFilter}
                onChange={(e) => setExplorerBucketFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">{UI_STRINGS.module2.categories.all}</option>
                <option value="Packaging Materials">{UI_STRINGS.module2.categories.packaging}</option>
                <option value="Direct Materials">{UI_STRINGS.module2.categories.direct}</option>
                <option value="Indirect & MRO">{UI_STRINGS.module2.categories.indirect}</option>
                <option value="Logistics & Freight">{UI_STRINGS.module2.categories.logistics}</option>
              </select>
            </div>
          </div>

          {/* Live Search Results from Column L */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {explorerResults.map((item) => (
              <div
                key={item.commodityCode}
                data-testid={`unspsc-card-${item.commodityCode}`}
                onClick={() => setSelectedUNSPSCRecord(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedUNSPSCRecord(item);
                  }
                }}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                      {UI_STRINGS.module2.colLPrefix(item.commodityCode)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans font-semibold truncate">
                      {item.coreBucket}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block">
                      {UI_STRINGS.module2.commodityTitleLabel}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" title={item.commodityTitle}>
                      {item.commodityTitle}
                    </h5>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      {UI_STRINGS.module2.classTitleLabel}
                    </span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate" title={`${item.classTitle} (${item.classCode})`}>
                      {item.classTitle} <span className="font-mono text-[10px] text-slate-400">({item.classCode})</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate" title={`${item.familyTitle} (${item.familyCode})`}>
                      {UI_STRINGS.module2.familyTitleLabel}: {item.familyTitle} ({item.familyCode})
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-[11px] mt-1">
                  <span className="font-mono text-[10px] text-slate-400">
                    {UI_STRINGS.module2.segmentCodeLabel(item.segmentCode)}
                  </span>
                  <span className="inline-flex items-center space-x-1 font-semibold text-cyan-600 dark:text-cyan-400 group-hover:underline">
                    <span>{UI_STRINGS.module2.moreDetailsBtn}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Value Recurring Spend & Vendor Consolidation Engine (> 5 Vendors) */}
      <VendorConsolidationSection />

      {/* Multiple Monthly PO Consolidation & Economies of Scale Engine */}
      <PoConsolidationSection />

      {/* Machine Learning Line Item Review Workbench */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{UI_STRINGS.module2.workbenchTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.module2.workbenchDescPrefix}<strong>{UI_STRINGS.module2.workbenchDescHighlight}</strong>{UI_STRINGS.module2.workbenchDescSuffix}.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-cyan-600 mr-1.5" />
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{UI_STRINGS.module2.years.all}</option>
                <option value="2023">{UI_STRINGS.module2.years.y2023}</option>
                <option value="2024">{UI_STRINGS.module2.years.y2024}</option>
                <option value="2025">{UI_STRINGS.module2.years.y2025}</option>
                <option value="2026">{UI_STRINGS.module2.years.y2026}</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">{UI_STRINGS.module2.categories.all}</option>
              <option value="Direct Materials">{UI_STRINGS.module2.categories.direct}</option>
              <option value="Packaging Materials">{UI_STRINGS.module2.categories.packagingMaterials}</option>
              <option value="Indirect & MRO">{UI_STRINGS.module2.categories.indirect}</option>
              <option value="Logistics & Freight">{UI_STRINGS.module2.categories.logistics}</option>
            </select>

            {/* Sector Relevance Filter */}
            <select
              aria-label={UI_STRINGS.module2.industryContext.badge}
              value={selectedSectorRelevanceFilter}
              onChange={(e) => setSelectedSectorRelevanceFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ALL">All Sector Alignments</option>
              <option value="CORE_DIRECT">{UI_STRINGS.module2.industryContext.relevancePills.coreDirect}</option>
              <option value="CRITICAL_PACKAGING">{UI_STRINGS.module2.industryContext.relevancePills.criticalPackaging}</option>
              <option value="SECTOR_LOGISTICS">{UI_STRINGS.module2.industryContext.relevancePills.sectorLogistics}</option>
              <option value="GENERAL_MRO">{UI_STRINGS.module2.industryContext.relevancePills.generalMro}</option>
              <option value="CROSS_DOMAIN">{UI_STRINGS.module2.industryContext.relevancePills.crossDomain}</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={UI_STRINGS.module2.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.lineItemYear}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.poNumber}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.materialCodeDesc}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.vendor}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.unspscColLCommodityClass}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.category}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.industryContext.badge}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.spendValue}</th>
                  <th className="py-3 px-4">{UI_STRINGS.module2.lineItemHeaders.aiConfidence}</th>
                  <th className="py-3 px-4 text-right">{UI_STRINGS.module2.lineItemHeaders.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
                {filteredItems.map((item) => {
                  const sectorResult = categorizeMaterialWithIndustryContext(
                    item.raw_desc,
                    item.unspsc_code,
                    activeMajorSector,
                    activeMinorSector
                  );
                  const commodityDetails = (item.unspsc_commodity_title && item.unspsc_class_title)
                    ? { commodityTitle: item.unspsc_commodity_title, classTitle: item.unspsc_class_title }
                    : lookupUNSPSCDetails(item.raw_desc, item.core_bucket);
                  const matCode = item.material_code || `MAT-${item.line_item_id.replace(/^LI(TM)?-/i, '')}`;
                  const matDesc = item.material_desc || item.raw_desc;

                  return (
                    <tr
                      key={item.mapping_id}
                      className="bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-cyan-700 dark:text-cyan-400 block font-mono">
                          {item.line_item_id}
                        </span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.spend_year || 2024}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="inline-flex items-center font-semibold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {item.po_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans max-w-xs">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100/70 dark:bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                            {matCode}
                          </span>
                        </div>
                        <span className="text-slate-900 dark:text-white text-xs font-semibold block leading-tight line-clamp-2">
                          {matDesc}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-200 font-medium">
                        <span className="block font-semibold text-xs text-slate-900 dark:text-white">
                          {item.vendor_identified}
                        </span>
                        {item.master_supplier_id && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {item.master_supplier_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                            {UI_STRINGS.module2.unspscCodeBadge(item.unspsc_code)}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-900 dark:text-slate-100 leading-tight">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mr-1">
                            {UI_STRINGS.module2.commodityLabel}
                          </span>
                          {commodityDetails.commodityTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                            {UI_STRINGS.module2.classLabel}
                          </span>
                          {commodityDetails.classTitle}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.core_bucket === 'Packaging Materials'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border border-blue-300 dark:border-blue-800/40'
                              : item.core_bucket === 'Direct Materials'
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40'
                              : item.core_bucket === 'Logistics & Freight'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border border-purple-300 dark:border-purple-800/40'
                          }`}
                        >
                          {item.core_bucket}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          title={sectorResult.explanation}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-help inline-flex items-center space-x-1 ${
                            sectorResult.sectorRelevance === 'CORE_DIRECT'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : sectorResult.sectorRelevance === 'CRITICAL_PACKAGING'
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                              : sectorResult.sectorRelevance === 'SECTOR_LOGISTICS'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : sectorResult.sectorRelevance === 'GENERAL_MRO'
                              ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <span>
                            {sectorResult.sectorRelevance === 'CORE_DIRECT'
                              ? UI_STRINGS.module2.industryContext.relevancePills.coreDirect
                              : sectorResult.sectorRelevance === 'CRITICAL_PACKAGING'
                              ? UI_STRINGS.module2.industryContext.relevancePills.criticalPackaging
                              : sectorResult.sectorRelevance === 'SECTOR_LOGISTICS'
                              ? UI_STRINGS.module2.industryContext.relevancePills.sectorLogistics
                              : sectorResult.sectorRelevance === 'GENERAL_MRO'
                              ? UI_STRINGS.module2.industryContext.relevancePills.generalMro
                              : UI_STRINGS.module2.industryContext.relevancePills.crossDomain}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="text-emerald-700 dark:text-emerald-400 font-black">
                          ₹{(item.inr_crores || item.total_spend / 10000000).toFixed(2)} Cr
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({formatINRAmount(item.amount_inr || item.total_spend)})
                        </span>
                      </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.ai_confidence > 90
                                ? 'bg-emerald-500'
                                : item.ai_confidence > 80
                                ? 'bg-cyan-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.ai_confidence}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono text-xs font-bold ${
                            item.ai_confidence > 90
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.ai_confidence > 80
                              ? 'text-cyan-600 dark:text-cyan-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.ai_confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.status === 'Confirmed' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40 text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            <span>{UI_STRINGS.module2.statusConfirmed}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onConfirmMapping(item.mapping_id)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-xs active:scale-95"
                          >
                            {UI_STRINGS.module2.btnConfirm}
                          </button>
                        )}
                        <button
                          onClick={() => onReassignMapping(item)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-300 dark:border-slate-700 flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{UI_STRINGS.module2.btnReassign}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>

        {/* CTA to Module 3 */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{UI_STRINGS.module2.taxonomyVerifiedFooter}</span>
          </div>
          <button
            onClick={onProceedToTrend}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-md shadow-cyan-600/20 transition-all transform active:scale-95 group"
          >
            <span>{UI_STRINGS.module2.btnProceedToTrend}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      </>
      )}

      {/* UNSPSC Taxonomy Detailed Specification Pop-up Modal */}
      {selectedUNSPSCRecord && (
        <UNSPSCDetailModal
          record={selectedUNSPSCRecord}
          isOpen={Boolean(selectedUNSPSCRecord)}
          onClose={() => setSelectedUNSPSCRecord(null)}
        />
      )}
    </div>
  );
};
