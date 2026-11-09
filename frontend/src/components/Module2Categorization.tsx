'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import type { Module2CategorizationProps, LineItemMapping, UNSPSCCommodityRecord } from '../types';
import type { IndustryMaterialProfile } from '../types/industry';
import { searchUNSPSCTaxonomy, lookupUNSPSCDetails } from '../data/unspscTaxonomy';
import { useUNSPSCTaxonomy } from '../hooks/useUNSPSCTaxonomy';
import { formatINRAmount } from '../utils/currencyConverter';
import {
  calculateCategoryYearDetails,
  calculateVendorYearDetails,
  calculateStrategicVendorRisk
} from '../utils/step2Calculators';
import {
  UI_STRINGS,
  DEFAULT_INDUSTRY_MAJOR_SECTOR,
  DEFAULT_INDUSTRY_MINOR_SECTOR,
  categorizeMaterialWithIndustryContext
} from '../constants';
import { CategoryVendorBreakdownView } from './CategoryVendorBreakdownView';
import { StrategicSingleVendorRiskSection } from './strategicRisk';
import { Module2StrategicSourcingWorkspace } from './module2';
import { resolveHumanReadableCategory } from '../utils/procurementCategoryResolver';
import dynamic from 'next/dynamic';
import { AnalyzingLoader } from './AnalyzingLoader';
import { TierMaskOverlay } from './TierMaskOverlay';
import { loadIndustryCatalog } from '../utils/industryApi';
const UNSPSCDetailModal = dynamic(
  () => import('./modals/UNSPSCDetailModal').then((mod) => mod.UNSPSCDetailModal),
  { ssr: false }
);

export const Module2Categorization: React.FC<Module2CategorizationProps> = ({
  tenant,
  categories = [],
  lineItems,
  onConfirmMapping,
  onReassignMapping,
  onProceedToTrend,
  onStartAICategorization,
  speedMultiplier,
  onUpdateTenant: _onUpdateTenant,
  currentTier = 'GOLD',
  onUpgrade,
  targetSection,
  assessmentId: propAssessmentId
}) => {
  const taxonomyState = useUNSPSCTaxonomy();
  const assessmentId =
    propAssessmentId ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('aicev_selected_assessment_id') || undefined
      : undefined);
  const [isCategorizing, setIsCategorizing] = useState<boolean>(false);
  const [isCategorized, setIsCategorized] = useState<boolean>(false);
  const [selectedBucket, setSelectedBucket] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [selectedSectorRelevanceFilter, setSelectedSectorRelevanceFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minConfidence] = useState<number>(0);

  // Consolidated Module 2 Area Navigation State
  const [activeArea, setActiveArea] = useState<
    'ALL' | 'SPEND_INTELLIGENCE' | 'AI_REVIEW' | 'STRATEGIC_SOURCING' | 'VENDOR_INTELLIGENCE'
  >('ALL');

  // Section Refs for smooth declarative navigation
  const strategicRiskRef = useRef<HTMLDivElement>(null);
  const vendorSupplyRef = useRef<HTMLDivElement>(null);
  const reviewWorkbenchRef = useRef<HTMLDivElement>(null);

  // Industry Sector Lens State
  const [activeMajorSector] = useState<string>(
    tenant?.major_sector || DEFAULT_INDUSTRY_MAJOR_SECTOR
  );
  const [activeMinorSector] = useState<string>(
    tenant?.minor_sector || DEFAULT_INDUSTRY_MINOR_SECTOR
  );
  const [industryProfiles, setIndustryProfiles] = useState<IndustryMaterialProfile[]>([]);

  useEffect(() => {
    let isCurrent = true;
    loadIndustryCatalog().then((catalog) => {
      if (isCurrent) setIndustryProfiles(catalog.profiles);
    }).catch(() => {
      if (isCurrent) setIndustryProfiles([]);
    });
    return () => { isCurrent = false; };
  }, []);

  const activeMaterialProfile = industryProfiles.find((profile) =>
    profile.majorSector === activeMajorSector && profile.minorSector === activeMinorSector
  );

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

  // Consolidated Vendor Intelligence Tab: Vendor Rankings, Single-Source Risk, UNSPSC Catalog
  const [columnLTab, setColumnLTab] = useState<'vendorRankings' | 'strategicRisk' | 'catalog'>('vendorRankings');

  useEffect(() => {
    if (!targetSection) return;

    if (targetSection === 'vendor-consolidation-section' || targetSection === 'vendor-category-supply-section') {
      setColumnLTab('vendorRankings');
      vendorSupplyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (targetSection === 'po-consolidation-section') {
      setActiveArea('STRATEGIC_SOURCING');
    } else if (targetSection === 'strategic-risk-section') {
      setColumnLTab('strategicRisk');
      strategicRiskRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (targetSection === 'review-workbench-section') {
      reviewWorkbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetSection]);

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

  const getDerivedStatus = (item: LineItemMapping): string => {
    if (item.status === 'Confirmed' || item.status === 'CLIENT_APPROVED' || item.status === 'APPROVED') {
      return 'CLIENT_APPROVED';
    }
    if (item.status === 'TAXONOMY_VERIFIED' || item.ai_confidence >= 90) {
      return 'TAXONOMY_VERIFIED';
    }
    if (item.status === 'PROVISIONAL' || (item.ai_confidence >= 75 && item.ai_confidence < 90)) {
      return 'PROVISIONAL';
    }
    return 'AWAITING_REVIEW';
  };

  const filteredItems = lineItems.filter((item) => {
    if (selectedBucket !== 'ALL' && item.core_bucket !== selectedBucket) return false;
    if (selectedYearFilter !== 'ALL' && String(item.spend_year) !== selectedYearFilter) return false;
    if (item.ai_confidence < minConfidence) return false;

    if (selectedStatusFilter !== 'ALL') {
      const derived = getDerivedStatus(item);
      if (derived !== selectedStatusFilter) return false;
    }

    if (selectedSectorRelevanceFilter !== 'ALL') {
      const relevanceResult = categorizeMaterialWithIndustryContext(
        item.raw_desc,
        item.unspsc_code,
        activeMaterialProfile
      );
      if (relevanceResult.sectorRelevance !== selectedSectorRelevanceFilter) return false;
    }

    if (searchQuery && !matchesSearchQuery(item, searchQuery)) {
      return false;
    }
    return true;
  });

  const explorerResults = searchUNSPSCTaxonomy(explorerSearch, explorerBucketFilter).slice(0, 8);
  const averageClassificationConfidence = lineItems.length > 0
    ? Number((lineItems.reduce((total, item) => total + item.ai_confidence, 0) / lineItems.length).toFixed(1))
    : undefined;

  const categoriesList = useMemo(() => categories || [], [categories]);

  const totalEvaluatedSpendInrCr = useMemo(() => {
    if (tenant?.total_spend_evaluated_inr != null && tenant.total_spend_evaluated_inr > 0) {
      return tenant.total_spend_evaluated_inr;
    }
    if (lineItems && lineItems.length > 0) {
      const lineItemSum = lineItems.reduce(
        (sum, it) => sum + (it.inr_crores ?? (it.total_spend ? it.total_spend / 10000000 : 0)),
        0
      );
      if (lineItemSum > 0) return Number(lineItemSum.toFixed(2));
    }
    return categoriesList.reduce(
      (sum, item) => sum + ((item as any).spend_inr_crores || (item as any).total_3yr_spend_inr_cr || 0),
      0
    ) || 0;
  }, [tenant?.total_spend_evaluated_inr, lineItems, categoriesList]);

  const actualBucketSpend = useMemo(() => {
    let direct = 0;
    let packaging = 0;
    let logistics = 0;
    let mro = 0;
    let total = 0;

    lineItems.forEach((it) => {
      const spend = it.inr_crores ?? (it.total_spend ? it.total_spend / 10000000 : 0);
      total += spend;
      const bucket = it.core_bucket || '';
      if (bucket === 'Direct Materials') {
        direct += spend;
      } else if (bucket === 'Packaging Materials') {
        packaging += spend;
      } else if (bucket === 'Logistics & Freight') {
        logistics += spend;
      } else {
        mro += spend;
      }
    });

    const safeTotal = total > 0 ? total : 1;
    return {
      directCr: Number(direct.toFixed(2)),
      directPct: total > 0 ? Number(((direct / safeTotal) * 100).toFixed(1)) : 0,
      packagingCr: Number(packaging.toFixed(2)),
      packagingPct: total > 0 ? Number(((packaging / safeTotal) * 100).toFixed(1)) : 0,
      logisticsCr: Number(logistics.toFixed(2)),
      logisticsPct: total > 0 ? Number(((logistics / safeTotal) * 100).toFixed(1)) : 0,
      mroCr: Number(mro.toFixed(2)),
      mroPct: total > 0 ? Number(((mro / safeTotal) * 100).toFixed(1)) : 0,
      totalSpendCr: Number(total.toFixed(2))
    };
  }, [lineItems]);



  const dynamicCategoryDetails = useMemo(() => {
    if (taxonomyState.isLoading || taxonomyState.error) return [];
    return calculateCategoryYearDetails(lineItems, categoriesList, totalEvaluatedSpendInrCr);
  }, [lineItems, categoriesList, totalEvaluatedSpendInrCr, taxonomyState]);

  const dynamicVendorDetails = useMemo(() => {
    if (taxonomyState.isLoading || taxonomyState.error) return [];
    return calculateVendorYearDetails(lineItems, totalEvaluatedSpendInrCr);
  }, [lineItems, totalEvaluatedSpendInrCr, taxonomyState]);

  const dynamicStrategicRiskItems = useMemo(() => {
    if (taxonomyState.isLoading || taxonomyState.error) return [];
    return calculateStrategicVendorRisk(lineItems);
  }, [lineItems, taxonomyState]);

  const handleUpgradeSilver = () => {
    onUpgrade?.('SILVER');
  };

  const handleUpgradeGold = () => {
    onUpgrade?.('GOLD');
  };

  if (currentTier === 'BRONZE') {
    return (
      <div className="space-y-6 animate-fade-in">
        <TierMaskOverlay
          requiredTier="SILVER"
          title={UI_STRINGS.subscription.stageMaskedTitle(UI_STRINGS.module2.badge)}
          description={UI_STRINGS.subscription.stageMaskedBronzeDesc}
          onUpgrade={handleUpgradeSilver}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pictorial Analyzing Loader for UNSPSC AI Categorization */}
      {isCategorizing && (
        <AnalyzingLoader
          isOpen={isCategorizing}
          mode="overlay"
          title={UI_STRINGS.module2.industryContext.materialsDnaTitle}
          subtitle={UI_STRINGS.module2.industryContext.calibratedFor(activeMajorSector, activeMinorSector)}
          metrics={{
            totalRecords: lineItems.length,
            spendCrores: Number(totalEvaluatedSpendInrCr.toFixed(2)),
            uniqueVendors: new Set(lineItems.map((i) => i.vendor_identified).filter(Boolean)).size,
            categoriesIdentified: categories.length,
            confidenceScore: averageClassificationConfidence
          }}
          onComplete={handleCategorizationComplete}
          onCancel={() => setIsCategorizing(false)}
          speedMultiplier={speedMultiplier}
        />
      )}

      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-100 shadow-sm glass-panel">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded border border-cyan-300">
              {UI_STRINGS.module2.badge}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              {UI_STRINGS.module2.valuationBadge}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {UI_STRINGS.module2.heading}
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
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

      {/* Module 2 Consolidated 4-Area Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
        <button
          type="button"
          data-testid="tab-area-all"
          onClick={() => setActiveArea('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeArea === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.module2.areaTabs.consolidatedView}</span>
        </button>

        <button
          type="button"
          data-testid="tab-area-spend-intelligence"
          onClick={() => setActiveArea('SPEND_INTELLIGENCE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeArea === 'SPEND_INTELLIGENCE'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.module2.areaTabs.clientSpend}</span>
        </button>

        <button
          type="button"
          data-testid="tab-area-ai-review"
          onClick={() => setActiveArea('AI_REVIEW')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeArea === 'AI_REVIEW'
              ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.module2.areaTabs.aiReview}</span>
        </button>

        <button
          type="button"
          data-testid="tab-area-strategic-sourcing"
          onClick={() => setActiveArea('STRATEGIC_SOURCING')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeArea === 'STRATEGIC_SOURCING'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.module2.areaTabs.strategicSourcing}</span>
        </button>

        <button
          type="button"
          data-testid="tab-area-vendor-intelligence"
          onClick={() => setActiveArea('VENDOR_INTELLIGENCE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeArea === 'VENDOR_INTELLIGENCE'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{UI_STRINGS.module2.areaTabs.vendorIntelligence}</span>
        </button>
      </div>

      {/* Area A: Client Spend & Category Intelligence */}
      <div
        id="client-spend-intelligence-area"
        data-testid="client-spend-intelligence-area"
        className={activeArea === 'ALL' || activeArea === 'SPEND_INTELLIGENCE' ? 'space-y-6' : 'hidden'}
      >
        {/* Data-Backed Material DNA & Taxonomy Profile Summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 glass-panel space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded border border-cyan-300">
                    {UI_STRINGS.module2.industryContext.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {activeMajorSector} › {activeMinorSector}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {activeMaterialProfile?.tagline || UI_STRINGS.module2.industryContext.profileUnavailable}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-300">
                {UI_STRINGS.module2.totalEvaluated(actualBucketSpend.totalSpendCr > 0 ? actualBucketSpend.totalSpendCr : totalEvaluatedSpendInrCr)}
              </span>
            </div>
          </div>

          {/* 4 Data-Backed Category Spend Quadrants: Direct, Packaging, Logistics, MRO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Direct Materials */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{UI_STRINGS.module2.industryContext.relevancePills.coreDirect}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                  ₹{actualBucketSpend.directCr.toFixed(2)} Cr ({actualBucketSpend.directPct}%)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(activeMaterialProfile?.typicalDirectMaterials || []).map((mat) => (
                  <span
                    key={mat}
                    className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 leading-tight"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>

            {/* Packaging Materials */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{UI_STRINGS.module2.industryContext.relevancePills.criticalPackaging}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-100 px-1.5 py-0.2 rounded border border-cyan-300">
                  ₹{actualBucketSpend.packagingCr.toFixed(2)} Cr ({actualBucketSpend.packagingPct}%)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(activeMaterialProfile?.typicalPackagingMaterials || []).map((pkg) => (
                  <span
                    key={pkg}
                    className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 leading-tight"
                  >
                    {pkg}
                  </span>
                ))}
              </div>
            </div>

            {/* Logistics & Freight */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Truck className="w-3.5 h-3.5 text-purple-600" />
                  <span>{UI_STRINGS.module2.industryContext.relevancePills.sectorLogistics}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-300">
                  ₹{actualBucketSpend.logisticsCr.toFixed(2)} Cr ({actualBucketSpend.logisticsPct}%)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(activeMaterialProfile?.typicalLogisticsCategories || []).map((log) => (
                  <span
                    key={log}
                    className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 leading-tight"
                  >
                    {log}
                  </span>
                ))}
              </div>
            </div>

            {/* Plant MRO Spares */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-600" />
                  <span>{UI_STRINGS.module2.industryContext.relevancePills.generalMro}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                  ₹{actualBucketSpend.mroCr.toFixed(2)} Cr ({actualBucketSpend.mroPct}%)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(activeMaterialProfile?.typicalMroCategories || []).map((mro) => (
                  <span
                    key={mro}
                    className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 leading-tight"
                  >
                    {mro}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category Spend Breakdown Analysis */}
        <CategoryVendorBreakdownView
          tenant={tenant}
          categories={dynamicCategoryDetails as any}
          vendors={dynamicVendorDetails}
          lineItems={lineItems}
          lockMode="CATEGORY"
        />

      {/* Year-Wise Category Spend Valuation Matrix & Top 50 Vendor Supply Categorization */}
      <div
        ref={vendorSupplyRef}
        id="vendor-category-supply-section"
        data-testid="vendor-category-supply-section"
        className="p-6 rounded-2xl bg-white border border-slate-200 glass-panel space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {UI_STRINGS.module2.matrixTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {UI_STRINGS.module2.matrixDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-300">
              {UI_STRINGS.module2.totalEvaluated(totalEvaluatedSpendInrCr)}
            </span>
          </div>
        </div>

        {/* Year-Wise Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          {(() => {
            const totalFY24 = dynamicCategoryDetails.reduce((sum: number, c: any) => sum + (c.spend_fy24_cr || 0), 0);
            const totalFY25 = dynamicCategoryDetails.reduce((sum: number, c: any) => sum + (c.spend_fy25_cr || 0), 0);
            const totalFY26 = dynamicCategoryDetails.reduce((sum: number, c: any) => sum + (c.spend_fy26_cr || 0), 0);
            const hasFY25 = totalFY25 > 0;
            const hasFY26 = totalFY26 > 0;

            return (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{UI_STRINGS.module2.matrixHeaders.category}</th>
                    <th className="py-3 px-4">{UI_STRINGS.module2.matrixHeaders.colLRange}</th>
                    <th className="py-3 px-4 text-right" title={UI_STRINGS.common.fiscalYearRanges.fy24}>{UI_STRINGS.module2.matrixHeaders.fy24}</th>
                    <th className="py-3 px-4 text-right" title={hasFY25 ? UI_STRINGS.common.fiscalYearRanges.fy25 : UI_STRINGS.module2.matrixNoTransactionsInUpload('FY25')}>
                      {UI_STRINGS.module2.matrixHeaders.fy25}
                      {!hasFY25 && <span className="block text-[8px] font-normal text-slate-400 lowercase">{UI_STRINGS.module2.matrixUnavailableHeader}</span>}
                    </th>
                    <th className="py-3 px-4 text-right" title={hasFY26 ? UI_STRINGS.common.fiscalYearRanges.fy26 : UI_STRINGS.module2.matrixNoTransactionsInUpload('FY26')}>
                      {UI_STRINGS.module2.matrixHeaders.fy26}
                      {!hasFY26 && <span className="block text-[8px] font-normal text-slate-400 lowercase">{UI_STRINGS.module2.matrixUnavailableHeader}</span>}
                    </th>
                    <th className="py-3 px-4 text-right font-bold text-emerald-700">{UI_STRINGS.module2.matrixHeaders.total}</th>
                    <th className="py-3 px-4 text-center">{UI_STRINGS.module2.matrixHeaders.yoyTrend}</th>
                    <th className="py-3 px-4 text-right">{UI_STRINGS.module2.matrixHeaders.spendShare}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {dynamicCategoryDetails.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                        {UI_STRINGS.module2.categoryBreakdownEmptyState}
                      </td>
                    </tr>
                  ) : (
                    dynamicCategoryDetails.map((cat: any) => {
                    const fy24 = cat.spend_fy24_cr || 0;
                    const fy25 = cat.spend_fy25_cr || 0;
                    const fy26 = cat.spend_fy26_cr || 0;

                    return (
                      <tr
                        key={cat.id || cat.category}
                        className={`hover:bg-slate-50 transition-colors ${
                          cat.is_balance_category
                            ? 'bg-slate-50/80 font-semibold'
                            : 'bg-white'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-sans font-bold text-slate-900 flex items-center space-x-2.5">
                          <span className={`w-6 h-5 rounded px-1 text-[10px] font-mono font-bold flex items-center justify-center ${
                            cat.rank && cat.rank <= 3
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {cat.rank ? `#${cat.rank}` : '•'}
                          </span>
                          <span className="truncate max-w-[260px]" title={cat.category}>{resolveHumanReadableCategory(cat.category, cat.sample_column_l_code)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            {UI_STRINGS.module2.colLPrefix(cat.sample_column_l_code ? String(cat.sample_column_l_code).split(',')[0] : 'UNSPSC')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-800">
                          ₹{(fy24 || 0).toFixed(2)} Cr
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-800">
                          {hasFY25 ? `₹${(fy25 || 0).toFixed(2)} Cr` : <span className="text-slate-400 text-[11px]" title={UI_STRINGS.module2.matrixNoTransactionsForYear('FY25')}>—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-800">
                          {hasFY26 ? `₹${(fy26 || 0).toFixed(2)} Cr` : <span className="text-slate-400 text-[11px]" title={UI_STRINGS.module2.matrixNoTransactionsForYear('FY26')}>—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          ₹{Number(cat.total_3yr_spend_inr_cr || cat.spend_inr_crores || 0).toFixed(2)} Cr
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 text-slate-700 text-xs font-semibold">
                            <span>{cat.yoy_growth_pct != null ? `+${cat.yoy_growth_pct}%` : (!hasFY25 && !hasFY26 ? UI_STRINGS.module2.matrixSinglePeriod : UI_STRINGS.module2.vendorSupply.yoyUnavailable)}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-slate-800">
                            {cat.spend_share_pct ? `${Number(cat.spend_share_pct).toFixed(1)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
                {dynamicCategoryDetails.length > 0 && (
                  <tfoot className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="py-3.5 px-4 font-sans uppercase text-xs" colSpan={2}>
                        {UI_STRINGS.module2.categoryTotalsLabel}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        ₹{totalFY24.toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasFY25 ? `₹${totalFY25.toFixed(2)} Cr` : <span className="text-slate-400 text-xs font-normal">{UI_STRINGS.module2.matrixUnavailableTotal}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasFY26 ? `₹${totalFY26.toFixed(2)} Cr` : <span className="text-slate-400 text-xs font-normal">{UI_STRINGS.module2.matrixUnavailableTotal}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-800">
                        ₹{dynamicCategoryDetails.reduce((sum: number, c: any) => sum + (c.total_3yr_spend_inr_cr || c.spend_inr_crores || 0), 0).toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-sans text-emerald-700">
                        {UI_STRINGS.module2.validationEvidenceMissing}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {UI_STRINGS.module2.categoryShareTotal(
                          dynamicCategoryDetails.reduce((sum: number, category: any) => sum + Number(category.spend_share_pct || 0), 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            );
          })()}
        </div>
      </div>
    </div>


      {/* Area D: Vendor Intelligence */}
      <div
        id="vendor-intelligence-area"
        data-testid="vendor-intelligence-area"
        className={activeArea === 'ALL' || activeArea === 'VENDOR_INTELLIGENCE' ? 'space-y-6' : 'hidden'}
      >
        {/* Consolidated Vendor Intelligence Workspace */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 glass-panel space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="tab-vendor-rankings"
              onClick={() => setColumnLTab('vendorRankings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                columnLTab === 'vendorRankings'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Vendor Rankings & Spend Concentration</span>
            </button>

            <button
              type="button"
              data-testid="tab-strategic-vendor-risk"
              onClick={() => setColumnLTab('strategicRisk')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                columnLTab === 'strategicRisk'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Supplier Concentration & Single-Source Risk</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                Analytical Signal
              </span>
            </button>

            <button
              type="button"
              data-testid="tab-unspsc-catalog"
              onClick={() => setColumnLTab('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                columnLTab === 'catalog'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{UI_STRINGS.module2.strategicVendorRisk.tabs.catalog}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                {UI_STRINGS.module2.catalogRecordsBadge}
              </span>
            </button>
          </div>
        </div>

        {/* View 1: Vendor Rankings & Spend Concentration Breakdown */}
        {columnLTab === 'vendorRankings' && (
          <div data-testid="vendor-rankings-container">
            <CategoryVendorBreakdownView
              tenant={tenant}
              categories={dynamicCategoryDetails as any}
              vendors={dynamicVendorDetails}
              lineItems={lineItems}
              lockMode="VENDOR"
            />
          </div>
        )}

        {/* View 2: Supplier Concentration & Single-Source Risk Indicators */}
        {columnLTab === 'strategicRisk' && (
          <div
            ref={strategicRiskRef}
            id="strategic-risk-section"
            data-testid="strategic-vendor-risk-container"
          >
            <StrategicSingleVendorRiskSection items={dynamicStrategicRiskItems} />
          </div>
        )}

        {/* View 2: Official UNSPSC English File Column L Live Taxonomy Engine & Search (Preserved in DOM) */}
        <div className={columnLTab === 'catalog' ? 'space-y-4' : 'hidden'}>
          {taxonomyState.isLoading && <p role="status">{UI_STRINGS.taxonomyData.loading}</p>}
          {taxonomyState.error && <p role="alert">{taxonomyState.error}</p>}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700 border border-cyan-300">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {UI_STRINGS.module2.catalogTitle}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                    {UI_STRINGS.module2.catalogRecordsBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
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
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
                />
              </div>
              <select
                value={explorerBucketFilter}
                onChange={(e) => setExplorerBucketFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-500"
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
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded border border-cyan-300">
                      {UI_STRINGS.module2.colLPrefix(item.commodityCode)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans font-semibold truncate">
                      {item.coreBucket}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-cyan-700 uppercase tracking-wider block">
                      {UI_STRINGS.module2.commodityTitleLabel}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-cyan-600 transition-colors" title={item.commodityTitle}>
                      {item.commodityTitle}
                    </h5>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {UI_STRINGS.module2.classTitleLabel}
                    </span>
                    <p className="text-[11px] text-slate-700 font-medium truncate" title={`${item.classTitle} (${item.classCode})`}>
                      {item.classTitle} <span className="font-mono text-[10px] text-slate-400">({item.classCode})</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate" title={`${item.familyTitle} (${item.familyCode})`}>
                      {UI_STRINGS.module2.familyTitleLabel}: {item.familyTitle} ({item.familyCode})
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] mt-1">
                  <span className="font-mono text-[10px] text-slate-400">
                    {UI_STRINGS.module2.segmentCodeLabel(item.segmentCode)}
                  </span>
                  <span className="inline-flex items-center space-x-1 font-semibold text-cyan-600 group-hover:underline">
                    <span>{UI_STRINGS.module2.moreDetailsBtn}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Area C: Strategic Sourcing Opportunities */}
      <div
        id="strategic-sourcing-area"
        data-testid="strategic-sourcing-area"
        className={activeArea === 'ALL' || activeArea === 'STRATEGIC_SOURCING' ? 'space-y-6' : 'hidden'}
      >
        {/* Module 2 Strategic Sourcing Intelligence, E-Auction & Opportunity Engine */}
        <div
          id="module2-strategic-sourcing-workspace-section"
          data-testid="module2-strategic-sourcing-workspace-container"
        >
          <Module2StrategicSourcingWorkspace assessmentId={assessmentId} />
        </div>
      </div>

      {/* Area B: AI Categorization & Review */}
      <div
        id="ai-categorization-review-area"
        data-testid="ai-categorization-review-area"
        className={activeArea === 'ALL' || activeArea === 'AI_REVIEW' ? 'space-y-6' : 'hidden'}
      >
        {/* Machine Learning Line Item Review Workbench */}
        <div
          ref={reviewWorkbenchRef}
          id="review-workbench-section"
          data-testid="review-workbench-section"
          className="p-6 rounded-2xl bg-white border border-slate-200 glass-panel space-y-4"
        >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-600" />
              <span>{UI_STRINGS.module2.workbenchTitle}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {UI_STRINGS.module2.workbenchDescPrefix}<strong>{UI_STRINGS.module2.workbenchDescHighlight}</strong>{UI_STRINGS.module2.workbenchDescSuffix}.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Filter */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-cyan-600 mr-1.5" />
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-500"
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ALL">All Sector Alignments</option>
              <option value="CORE_DIRECT">{UI_STRINGS.module2.industryContext.relevancePills.coreDirect}</option>
              <option value="CRITICAL_PACKAGING">{UI_STRINGS.module2.industryContext.relevancePills.criticalPackaging}</option>
              <option value="SECTOR_LOGISTICS">{UI_STRINGS.module2.industryContext.relevancePills.sectorLogistics}</option>
              <option value="GENERAL_MRO">{UI_STRINGS.module2.industryContext.relevancePills.generalMro}</option>
              <option value="CROSS_DOMAIN">{UI_STRINGS.module2.industryContext.relevancePills.crossDomain}</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label={UI_STRINGS.module2.areaTabs.statusFilterAll}
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              <option value="ALL">{UI_STRINGS.module2.areaTabs.statusFilterAll}</option>
              <option value="TAXONOMY_VERIFIED">{UI_STRINGS.module2.areaTabs.statusTaxonomyVerified}</option>
              <option value="PROVISIONAL">{UI_STRINGS.module2.areaTabs.statusProvisional}</option>
              <option value="AWAITING_REVIEW">{UI_STRINGS.module2.areaTabs.statusAwaitingReview}</option>
              <option value="CLIENT_APPROVED">{UI_STRINGS.module2.areaTabs.statusClientApproved}</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={UI_STRINGS.module2.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        {currentTier === 'SILVER' ? (
          <TierMaskOverlay
            requiredTier="GOLD"
            title={UI_STRINGS.subscription.stageMaskedTitle('Granular SKU Line Items & Reclassification')}
            description={UI_STRINGS.subscription.stageMaskedSilverDesc}
            onUpgrade={handleUpgradeGold}
            isSummaryVisible
          />
        ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-semibold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {filteredItems.slice(0, 100).map((item) => {
                  const sectorResult = categorizeMaterialWithIndustryContext(
                    item.raw_desc,
                    item.unspsc_code,
                    activeMaterialProfile
                  );
                  const commodityDetails = (item.unspsc_commodity_title && item.unspsc_class_title)
                    ? { commodityTitle: item.unspsc_commodity_title, classTitle: item.unspsc_class_title }
                    : lookupUNSPSCDetails(item.raw_desc, item.core_bucket);
                  const matCode = item.material_code || `MAT-${item.line_item_id.replace(/^LI(TM)?-/i, '')}`;
                  const matDesc = item.material_desc || item.raw_desc;
                  const derivedStatus = getDerivedStatus(item);

                  return (
                    <tr
                      key={item.mapping_id}
                      className="bg-white hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-cyan-700 block font-mono">
                          {item.line_item_id}
                        </span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">
                          {item.spend_year || 2024}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="inline-flex items-center font-semibold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.po_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans max-w-xs">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-100/70 px-1.5 py-0.5 rounded border border-cyan-300">
                            {matCode}
                          </span>
                        </div>
                        <span className="text-slate-900 text-xs font-semibold block leading-tight line-clamp-2">
                          {matDesc}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700 font-medium">
                        <span className="block font-semibold text-xs text-slate-900">
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
                          <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            {UI_STRINGS.module2.unspscCodeBadge(item.unspsc_code)}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-900 leading-tight">
                          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                            {UI_STRINGS.module2.commodityLabel}
                          </span>
                          {commodityDetails.commodityTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
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
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : item.core_bucket === 'Direct Materials'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              : item.core_bucket === 'Logistics & Freight'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-purple-100 text-purple-800 border border-purple-300'
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
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : sectorResult.sectorRelevance === 'CRITICAL_PACKAGING'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              : sectorResult.sectorRelevance === 'SECTOR_LOGISTICS'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : sectorResult.sectorRelevance === 'GENERAL_MRO'
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
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
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="text-emerald-700 font-black">
                          ₹{(item.inr_crores || item.total_spend / 10000000).toFixed(2)} Cr
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({formatINRAmount(item.amount_inr || item.total_spend)})
                        </span>
                      </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
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
                              ? 'text-emerald-600'
                              : item.ai_confidence > 80
                              ? 'text-cyan-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {item.ai_confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1.5">
                        {item.status === 'Confirmed' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            <span>{UI_STRINGS.module2.statusConfirmed}</span>
                          </span>
                        ) : (
                          <>
                            <span
                              className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                derivedStatus === 'CLIENT_APPROVED'
                                  ? 'text-emerald-800 bg-emerald-100 border border-emerald-300'
                                  : derivedStatus === 'TAXONOMY_VERIFIED'
                                  ? 'text-cyan-800 bg-cyan-100 border border-cyan-300'
                                  : derivedStatus === 'PROVISIONAL'
                                  ? 'text-amber-800 bg-amber-100 border border-amber-300'
                                  : 'text-slate-700 bg-slate-100 border border-slate-300'
                              }`}
                            >
                              <span>{derivedStatus}</span>
                            </span>
                            <button
                              onClick={() => onConfirmMapping(item.mapping_id)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              {UI_STRINGS.module2.btnConfirm}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onReassignMapping(item)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all border border-slate-300 flex items-center space-x-1 cursor-pointer"
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
            {filteredItems.length > 100 && (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200 font-sans">
                Showing first 100 of {filteredItems.length.toLocaleString()} line items. Filter or search to inspect specific records.
              </div>
            )}
          </div>
        </div>
        )}
        {/* CTA to Module 3 */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
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
      </div>

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
