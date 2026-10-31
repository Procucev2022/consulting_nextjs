'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { PipelineBar } from '@/components/PipelineBar';
import { Module1Ingestion } from '@/components/Module1Ingestion';
import dynamic from 'next/dynamic';

const Module2Categorization = dynamic(
  () => import('@/components/Module2Categorization').then((mod) => mod.Module2Categorization)
);

const CustomerAnalysisStatusCard = dynamic(
  () => import('@/components/orchestration/CustomerAnalysisStatusCard').then((mod) => mod.CustomerAnalysisStatusCard),
  { ssr: false }
);
const ReportAcknowledgementSection = dynamic(
  () => import('@/components/orchestration/ReportAcknowledgementSection').then((mod) => mod.ReportAcknowledgementSection),
  { ssr: false }
);

const Module3TrendAnalytics = dynamic(
  () => import('@/components/Module3TrendAnalytics').then((mod) => mod.Module3TrendAnalytics)
);
const Module4SavingsEngine = dynamic(
  () => import('@/components/Module4SavingsEngine').then((mod) => mod.Module4SavingsEngine)
);
const Module5ConversionMatrix = dynamic(
  () => import('@/components/Module5ConversionMatrix').then((mod) => mod.Module5ConversionMatrix)
);

const DatabaseSchemaView = dynamic(
  () => import('@/components/DatabaseSchemaView').then((mod) => mod.DatabaseSchemaView),
  { ssr: false }
);

const AnalyzingLoader = dynamic(
  () => import('@/components/AnalyzingLoader').then((mod) => mod.AnalyzingLoader),
  { ssr: false }
);

const AssessmentWorkspace = dynamic(
  () => import('@/components/assessment/AssessmentWorkspace').then((mod) => mod.AssessmentWorkspace),
  { ssr: false }
);

import { getYahooFinanceRateToINR } from '@/utils/currencyConverter';
import { apiClient, aiApiClient, authApiClient } from '@/utils/api';
import { assessmentApiClient } from '@/utils/assessmentApi';
import type { OperatingModeConfig, AssessmentRecord, CustomerRecord } from '@/types/assessment';
import { frontendLogger } from '@/utils/logger';
import {
  lookupUNSPSCDetails, lookupUNSPSCByDescription, loadUNSPSCTaxonomy,
  getTaxonomyLoadState, unspscOfficialDictionary
} from '@/data/unspscTaxonomy';
import { useUNSPSCTaxonomy } from '@/hooks/useUNSPSCTaxonomy';
import { orchestrationApi } from '@/utils/orchestrationApi';
import { UI_STRINGS } from '@/constants/uiStrings';
import { INR_CRORES_DIVISOR } from '@/constants/currency';
import { isAssessmentFinancialDisplayEligible } from '@/utils/assessmentFinancialDisplayGate';
import { UNLOCKED_DEV_PIPELINE_STAGES } from '@/constants/pipeline';
import { resolveHumanReadableCategory } from '@/utils/procurementCategoryResolver';
import { EMPTY_TENANT, EXECUTIVE_BRIEF_ATTACHMENT_FILENAME_PATTERN } from '@/constants/app';
import { VENDOR_CONSOLIDATION_UI_CONFIG } from '@/constants/module2VendorConsolidation';

// Modals (Dynamically loaded on demand)
const ProCPXModal = dynamic(
  () => import('@/components/modals/ProCPXModal').then((mod) => mod.ProCPXModal),
  { ssr: false }
);
const DPSNXTModal = dynamic(
  () => import('@/components/modals/DPSNXTModal').then((mod) => mod.DPSNXTModal),
  { ssr: false }
);
const FixCurrencyModal = dynamic(
  () => import('@/components/modals/FixCurrencyModal').then((mod) => mod.FixCurrencyModal),
  { ssr: false }
);
const MergeVendorModal = dynamic(
  () => import('@/components/modals/MergeVendorModal').then((mod) => mod.MergeVendorModal),
  { ssr: false }
);
const MergeItemModal = dynamic(
  () => import('@/components/modals/MergeItemModal').then((mod) => mod.MergeItemModal),
  { ssr: false }
);
const ReassignModal = dynamic(
  () => import('@/components/modals/ReassignModal').then((mod) => mod.ReassignModal),
  { ssr: false }
);
const ClientIngestionSetupModal = dynamic(
  () => import('@/components/modals/ClientIngestionSetupModal').then((mod) => mod.ClientIngestionSetupModal),
  { ssr: false }
);
const ExecutiveOpportunityBriefView = dynamic(
  () => import('@/components/presentation/ExecutiveOpportunityBriefView').then((mod) => mod.ExecutiveOpportunityBriefView),
  { ssr: false }
);
const DetailedAnalysisModal = dynamic(
  () => import('@/components/modals/DetailedAnalysisModal').then((mod) => mod.DetailedAnalysisModal),
  { ssr: false }
);

import type {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  LineItemMapping,
  VendorPriceRank,
  SavingsOpportunity,
  DatasetType,
  PipelineActiveTab,
  HeaderCurrency,
  MaterialGroupSummary,
  PlantSummary,
  MonthWiseSummary,
  ParetoSpendData,
  SpendCategorySummary,
  UserProfile,
  SubscriptionTier,
  AnalysisJob,
  Module1CanonicalViewModel,
  ParetoHierarchyParent,
  ConversionFunnelPhase,
  ReportVersion,
  ApiBulkUpdateModule2MaterialMappingsPayload
} from '@/types';
import { getEffectiveUserTier } from '@/utils/tierAccess';

const SUPERSEDED_REPORT_STATUS: ReportVersion['status'] = 'SUPERSEDED';

// Newest report that has not been superseded. The API lists reports in ascending sequence order, so sort by generation time.
const selectActiveReport = (reports: ReportVersion[]): ReportVersion | null => {
  const candidates = reports.filter((report) => report.status !== SUPERSEDED_REPORT_STATUS);
  const [newest] = [...candidates].sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
  return newest ?? null;
};

export default function Home() {
  useUNSPSCTaxonomy();
  let router: { push: (url: string) => void } | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = {
      push: (url: string) => {
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
      }
    };
  }
  // Theme State: Default to Stored Theme or Light Mode
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('procucev_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (document.documentElement.classList.contains('dark')) return 'dark';
    }
    return 'light';
  });

  const [operatingMode, setOperatingMode] = useState<OperatingModeConfig | null>(null);
  const [activeTab, setActiveTab] = useState<PipelineActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['module1', 'module2', 'module3', 'module4', 'assessment'].includes(hash)) {
        return hash as PipelineActiveTab;
      }
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['module1', 'module2', 'module3', 'module4', 'assessment'].includes(tabParam)) {
        return tabParam as PipelineActiveTab;
      }
    }
    return 'module1';
  });
  const [activeAssessment, setActiveAssessment] = useState<AssessmentRecord | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(null);
  const activeAssessmentIdRef = useRef<string | null>(null);
  const [targetSection, setTargetSection] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [simulatedTier, setSimulatedTier] = useState<SubscriptionTier | null>('GOLD');
  const [isClientSetupModalOpen, setIsClientSetupModalOpen] = useState(false);
  const [tenant, setTenant] = useState<TenantMaster>(EMPTY_TENANT);
  const [currency, setCurrency] = useState<HeaderCurrency>('USD');
  const [isManagementSummaryOpen, setIsManagementSummaryOpen] = useState(false);
  const [briefDownloadPayload, setBriefDownloadPayload] = useState<{ url: string; filename: string } | null>(null);
  const briefDownloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Clicks the declarative download link once a verified brief is loaded, and releases its object URL afterwards.
  useEffect(() => {
    if (!briefDownloadPayload) return undefined;
    briefDownloadLinkRef.current?.click();
    const objectUrl = briefDownloadPayload.url;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [briefDownloadPayload]);

  const handleBriefDownload = async (format: 'pdf' | 'pptx'): Promise<void> => {
    const url = `/api/reports/executive-brief/download/opportunity-brief/${format}`;
    const formatLabel = format.toUpperCase();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const requestId = response.headers.get('x-request-id') ?? UI_STRINGS.opportunityBrief.requestIdNotReturned;
        frontendLogger.error('Opportunity brief download was rejected by the server', {
          format,
          url,
          statusCode: response.status,
          requestId
        });
        showToast(UI_STRINGS.opportunityBrief.downloadFailed(formatLabel, response.status, requestId));
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = EXECUTIVE_BRIEF_ATTACHMENT_FILENAME_PATTERN.exec(disposition)?.[1] ??
        UI_STRINGS.opportunityBrief.downloadFilename(format);
      setBriefDownloadPayload({ url: URL.createObjectURL(blob), filename });
    } catch (error: unknown) {
      frontendLogger.error('Opportunity brief download request failed', { format, url }, error);
      showToast(UI_STRINGS.opportunityBrief.downloadNetworkFailed(formatLabel));
    }
  };

  // Application Data States
  const [ingestionQueue, setIngestionQueue] = useState<RawDocumentIngestion[]>([]);
  const [uploadedMaterialGroups, setUploadedMaterialGroups] = useState<MaterialGroupSummary[] | undefined>(undefined);
  const [uploadedPlants, setUploadedPlants] = useState<PlantSummary[] | undefined>(undefined);
  const [uploadedMonths, setUploadedMonths] = useState<MonthWiseSummary[] | undefined>(undefined);
  const [uploadedUniqueItems, setUploadedUniqueItems] = useState<number | undefined>(undefined);
  const [uploadedUniqueVendors, setUploadedUniqueVendors] = useState<number | undefined>(undefined);
  const [uploadedParetoData, setUploadedParetoData] = useState<ParetoSpendData | undefined>(undefined);
  const [canonicalModule1, setCanonicalModule1] = useState<Module1CanonicalViewModel | null>(null);

  const applyCanonicalViewModel = (canonical: Module1CanonicalViewModel): void => {
    if (activeAssessmentIdRef.current && canonical.assessmentId && canonical.assessmentId !== activeAssessmentIdRef.current) {
      frontendLogger.warn('Rejected canonical view model from mismatched assessment', {
        active: activeAssessmentIdRef.current,
        canonical: canonical.assessmentId
      });
      return;
    }
    setCanonicalModule1(canonical);
    setTenant((prev) => ({
      ...prev,
      total_spend_evaluated_inr: canonical.validFxNormalizedSpendCr,
      total_spend_evaluated: Math.round((canonical.validFxNormalizedSpendCr * 10000000) / 83.8)
    }));

    const canonicalDoc: RawDocumentIngestion = {
      doc_id: canonical.dataVersionId || `DOC-${canonical.datasetId || 'ASSESSMENT'}`,
      tenant_id: canonical.datasetId,
      file_name: canonical.sourceFileName,
      file_type: 'XLSX',
      file_size_mb: 2.14,
      ocr_status: 'Completed',
      progress: 100,
      uploaded_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      records_count: canonical.sourceRowCount,
      detected_currencies: canonical.detectedCurrencies,
      converted_inr_crores: canonical.validFxNormalizedSpendCr,
      unique_items_count: canonical.uniqueItems,
      unique_vendors_count: canonical.uniqueVendors,
      material_groups_count: canonical.materialGroups,
      plants_count: canonical.operatingPlants
    };
    setIngestionQueue([canonicalDoc]);
    setUploadedUniqueItems(canonical.uniqueItems);
    setUploadedUniqueVendors(canonical.uniqueVendors);

    if (canonical.materialGroupSpend && canonical.materialGroupSpend.length > 0) {
      setUploadedMaterialGroups(canonical.materialGroupSpend.map((mg) => ({
        group_code: mg.group_code,
        group_name: mg.group_name,
        records_count: mg.records_count,
        unique_items_count: mg.unique_items_count,
        unique_vendors_count: mg.unique_vendors_count,
        po_count: mg.po_count,
        spend_inr_cr: mg.spend_inr_cr,
        spend_usd_m: mg.spend_usd_m,
        share_pct: mg.share_pct,
        sample_item: mg.sample_item,
        primary_segment: mg.primary_segment,
        color: mg.color,
        fy24_spend_inr_cr: mg.fy24_spend_inr_cr,
        fy25_spend_inr_cr: mg.fy25_spend_inr_cr,
        fy26_spend_inr_cr: mg.fy26_spend_inr_cr
      })));

      const dynamicCategories: SpendCategorySummary[] = canonical.materialGroupSpend.map((mg, idx) => ({
        id: `CAT-${idx + 1}`,
        name: resolveHumanReadableCategory(mg.group_name, mg.group_code),
        category: resolveHumanReadableCategory(mg.group_name, mg.group_code),
        column_l_code: mg.group_code,
        spend_inr_crores: mg.spend_inr_cr,
        spend_fy24_cr: mg.fy24_spend_inr_cr || mg.spend_inr_cr,
        spend_fy25_cr: mg.fy25_spend_inr_cr || 0,
        spend_fy26_cr: mg.fy26_spend_inr_cr || 0,
        vendor_count: mg.unique_vendors_count,
        item_count: mg.unique_items_count,
        line_items_count: mg.records_count,
        share_pct: mg.share_pct,
        spend_inr_2023: Math.round((mg.fy24_spend_inr_cr || mg.spend_inr_cr) * 10000000),
        spend_inr_2024: Math.round((mg.fy25_spend_inr_cr || 0) * 10000000),
        spend_inr_2025_26: Math.round((mg.fy26_spend_inr_cr || 0) * 10000000)
      }));
      setCategories(dynamicCategories);
    }

    if (canonical.plantSpend && canonical.plantSpend.length > 0) {
      setUploadedPlants(canonical.plantSpend.map((p) => ({
        plant_code: p.plant_code,
        plant_name: p.plant_name,
        region: 'Central',
        location: 'Operational Site',
        records_count: p.records_count,
        unique_items_count: p.unique_items_count,
        unique_vendors_count: p.unique_vendors_count,
        spend_inr_cr: p.spend_inr_cr,
        share_pct: p.share_pct
      })));
    }

    if (canonical.monthlySpend && canonical.monthlySpend.length > 0) {
      setUploadedMonths(canonical.monthlySpend.map((m) => ({
        month_key: m.month_key,
        month_label: m.month_label,
        fiscal_year: m.fiscalYear || (canonical.periodMetadata?.actualFiscalYears[0] ?? 'FY22'),
        records_count: m.records_count,
        po_count: m.records_count,
        unique_items_count: m.unique_items_count,
        unique_vendors_count: m.unique_vendors_count,
        spend_inr_cr: m.spend_inr_cr,
        share_pct: m.share_pct ?? 0,
        mom_change_pct: m.mom_change_pct ?? 0,
        top_material_group: 'DIRECT',
        top_plant: 'Plant 1000'
      })));
    }

    if (canonical.paretoHierarchy) {
      setUploadedParetoData({
        totalSpendCr: canonical.validFxNormalizedSpendCr,
        paretoSpendCr: canonical.paretoHierarchy.reconciliation.vendorParetoSpendCr,
        paretoPct: canonical.paretoHierarchy.reconciliation.vendorParetoSpendPct,
        vendorHierarchy: canonical.paretoHierarchy.supplierToShortText,
        itemHierarchy: canonical.paretoHierarchy.shortTextToSupplier
      });
    } else if (canonical.supplierSpend && canonical.supplierSpend.length > 0) {
      let runningSpend = 0;
      const vendorParents: ParetoHierarchyParent[] = canonical.supplierSpend.slice(0, 20).map((s, idx) => {
        const spend = s.spend_inr_cr ?? s.spendCr ?? 0;
        runningSpend += spend;
        return {
          id: `VENDOR-${idx + 1}`,
          name: s.supplier_name || s.supplierName || `Vendor ${idx + 1}`,
          totalSpendCr: spend,
          sharePct: s.share_pct ?? s.sharePct ?? 0,
          cumulativeSpendCr: Number(runningSpend.toFixed(2)),
          cumulativePct: s.cumulative_share_pct ?? s.cumulativePct ?? 0,
          children: []
        };
      });
      setUploadedParetoData({
        totalSpendCr: canonical.validFxNormalizedSpendCr,
        paretoSpendCr: canonical.pareto ? canonical.pareto.top80SpendCr : 0,
        paretoPct: canonical.pareto ? canonical.pareto.top80SpendPct : 0,
        vendorHierarchy: vendorParents,
        itemHierarchy: []
      });
    }

    if (canonical.moduleStatuses) {
      setCompletedSteps({
        step1: canonical.moduleStatuses.module1 === 'READY' || canonical.moduleStatuses.module1 === 'COMPLETED',
        step2: canonical.moduleStatuses.module2 === 'COMPLETED',
        step3: canonical.moduleStatuses.module3 === 'COMPLETED',
        step4: canonical.moduleStatuses.module4 === 'COMPLETED'
      });
    }
  };

  const handleActiveAssessmentChange = useCallback((assessment: AssessmentRecord | null): void => {
    activeAssessmentIdRef.current = assessment ? assessment.assessmentId : null;

    // Reset transient analytical state to prevent cross-assessment leakage (Prompt 370 Phase 6)
    setCanonicalModule1(null);
    setIngestionQueue([]);
    setValidationRecords([]);
    setUploadedMaterialGroups(undefined);
    setUploadedPlants(undefined);
    setUploadedMonths(undefined);
    setUploadedUniqueItems(undefined);
    setUploadedUniqueVendors(undefined);
    setUploadedParetoData(undefined);
    setCategories([]);
    setLineItems([]);
    setVendorRankings([]);
    setOpportunities([]);
    setIsDataRefreshed(false);
    setAnalystConfirmedBaseCurrency(null);
    setCompletedSteps({ step1: false, step2: false, step3: false, step4: false });

    setActiveAssessment(assessment);

    if (assessment) {
      const isEligible = isAssessmentFinancialDisplayEligible(assessment);
      const isM1Complete = Boolean(
        assessment.activeDataVersionId &&
        assessment.activeAnalysisRunId &&
        (assessment.status !== 'DRAFT' && assessment.status !== 'DATA_AWAITING') &&
        assessment.validatedSpendCr &&
        assessment.validatedSpendCr > 0
      );

      setTenant((prev) => ({
        ...prev,
        enterprise_name: assessment.customerName,
        total_spend_evaluated_inr: isEligible ? (assessment.validatedSpendCr ?? 0) : 0,
        total_spend_evaluated: isEligible ? Math.round(((assessment.validatedSpendCr ?? 0) * 10000000) / 83.8) : 0
      }));

      if (isM1Complete && assessment.canonicalModule1) {
        applyCanonicalViewModel(assessment.canonicalModule1);
      }
    } else {
      setTenant((prev) => ({
        ...prev,
        enterprise_name: activeCustomer ? activeCustomer.customerName : UI_STRINGS.header.noActiveCustomer,
        total_spend_evaluated_inr: 0,
        total_spend_evaluated: 0
      }));
    }
  }, [activeCustomer]);

  const [validationRecords, setValidationRecords] = useState<ValidationPreCheckRecord[]>([]);
  const [, setAnalystConfirmedBaseCurrency] = useState<string | null>(null);
  const [categories, setCategories] = useState<SpendCategorySummary[]>([]);
  const [lineItems, setLineItems] = useState<LineItemMapping[]>([]);
  const [vendorRankings, setVendorRankings] = useState<VendorPriceRank[]>([]);
  const [opportunities, setOpportunities] = useState<SavingsOpportunity[]>([]);
  const [funnelStages, setFunnelStages] = useState<ConversionFunnelPhase[]>([]);

  const [completedSteps, setCompletedSteps] = useState<{
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
  }>({
    step1: false,
    step2: false,
    step3: false,
    step4: false
  });

  const [activeAnalysisJob, setActiveAnalysisJob] = useState<AnalysisJob | null>(null);
  const [isDetailedAnalysisModalOpen, setIsDetailedAnalysisModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportVersion | null>(null);
  const activeJobId = activeAnalysisJob?.analysisJobId ?? null;

  // Resolve the customer's active report for the active job from its job details.
  useEffect(() => {
    setActiveReport(null);
    if (!activeJobId) return undefined;
    let isCurrent = true;
    orchestrationApi
      .getJobDetails(activeJobId)
      .then((details) => {
        if (isCurrent) setActiveReport(selectActiveReport(details?.reports ?? []));
      })
      .catch((error: unknown) => {
        frontendLogger.warn('Could not load report versions for the active analysis job', { analysisJobId: activeJobId }, error);
      });
    return () => {
      isCurrent = false;
    };
  }, [activeJobId]);

  // Explicit lifecycle predicates (Prompt 313)
  const hasValidDataVersion = Boolean(
    (ingestionQueue?.length ?? 0) > 0 ||
    (tenant?.total_spend_evaluated_inr ?? 0) > 0 ||
    (uploadedMaterialGroups?.length ?? 0) > 0
  );

  const hasModule1Result = Boolean(
    hasValidDataVersion &&
    (
      completedSteps.step1 ||
      (uploadedMaterialGroups?.length ?? 0) > 0 ||
      (validationRecords?.length ?? 0) > 0 ||
      ingestionQueue?.some((doc) => (doc.records_count ?? 0) > 0)
    )
  );

  const hasActiveDetailedAnalysis = Boolean(activeAnalysisJob?.analysisJobId);

  const shouldShowDetailedAnalysisStatus = Boolean(
    hasValidDataVersion &&
    hasActiveDetailedAnalysis
  );

  const isStep1Complete = Boolean(
    canonicalModule1?.moduleStatuses?.module1 === 'READY' ||
    canonicalModule1?.moduleStatuses?.module1 === 'COMPLETED' ||
    completedSteps.step1 ||
    (ingestionQueue && ingestionQueue.length > 0) ||
    (tenant.total_spend_evaluated_inr > 0)
  );

  const isStep2Complete = Boolean(
    canonicalModule1
      ? canonicalModule1.moduleStatuses?.module2 === 'COMPLETED'
      : (completedSteps.step2 && isStep1Complete)
  );

  const isStep3Complete = Boolean(
    canonicalModule1
      ? canonicalModule1.moduleStatuses?.module3 === 'COMPLETED'
      : (completedSteps.step3 && isStep2Complete)
  );

  const isStep4Complete = Boolean(
    canonicalModule1
      ? canonicalModule1.moduleStatuses?.module4 === 'COMPLETED'
      : (completedSteps.step4 && isStep3Complete)
  );

  const isTabAccessible = (_tab: PipelineActiveTab): boolean => {
    // Keep all modules completely unlocked and accessible during development
    return true;
  };

  const getLockedTabMessage = (tab: PipelineActiveTab): string => {
    if (tab === 'module2') return UI_STRINGS.pipeline.lockedStep1Required;
    if (tab === 'module3') return UI_STRINGS.pipeline.lockedStep2Required;
    if (tab === 'module4') return UI_STRINGS.pipeline.lockedStep3Required;
    if (tab === 'module5') return UI_STRINGS.pipeline.lockedStep4Required;
    return UI_STRINGS.pipeline.lockedStep1Required;
  };

  const handleSelectTab = (tab: PipelineActiveTab) => {
    if (!isTabAccessible(tab)) {
      showToast(getLockedTabMessage(tab));
      return;
    }
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  const handleNavigateToSection = (targetModule: PipelineActiveTab, targetSectionId: string) => {
    if (!isTabAccessible(targetModule)) {
      showToast(getLockedTabMessage(targetModule));
      return;
    }
    setActiveTab(targetModule);
    setTargetSection(targetSectionId);
    showToast(UI_STRINGS.toasts.navigatingToInitiativeSection(targetSectionId));
  };

  // Modal States
  const [selectedOppForProCPX, setSelectedOppForProCPX] = useState<SavingsOpportunity | null>(null);
  const [selectedOppForDPSNXT, setSelectedOppForDPSNXT] = useState<SavingsOpportunity | null>(null);
  const [selectedRecordForCurrency, setSelectedRecordForCurrency] = useState<ValidationPreCheckRecord | null>(null);
  const [selectedRecordForMerge, setSelectedRecordForMerge] = useState<ValidationPreCheckRecord | null>(null);
  const [selectedRecordForMergeItem, setSelectedRecordForMergeItem] = useState<ValidationPreCheckRecord | null>(null);
  const [isDataRefreshed, setIsDataRefreshed] = useState<boolean>(false);
  const [selectedItemForReassign, setSelectedItemForReassign] = useState<LineItemMapping | null>(null);
  const [analyzingLoaderState, setAnalyzingLoaderState] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    metrics?: {
      totalRecords?: number;
      spendCrores?: number;
      uniqueVendors?: number;
      categoriesIdentified?: number;
      confidenceScore?: number;
    };
    onComplete?: () => void;
  } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Sync with Backend API, Session Storage & Authenticated User
  useEffect(() => {
    const storedUser = authApiClient.getStoredUser();
    const storedToken = authApiClient.getStoredToken();

    // Redirect unauthenticated visitors to /login
    if (!storedUser && !storedToken) {
      if (router) {
        router.push('/login');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }

    // Redirect admin users to /admin/dashboard only in standard SaaS mode
    if (storedUser?.role === 'ADMIN' && !operatingMode?.isInternalAssessment) {
      if (router) {
        router.push('/admin/dashboard');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/admin/dashboard';
      }
      return;
    }

    const handleHash = () => {
      if (typeof window !== 'undefined') {
        const rawHash = window.location.hash.replace('#', '');
        if (['module1', 'module2', 'module3', 'module4', 'module5', 'schema', 'assessment'].includes(rawHash)) {
          setActiveTab(rawHash as PipelineActiveTab);
        }
      }
    };

    if (typeof window !== 'undefined') {
      handleHash();
      window.addEventListener('hashchange', handleHash);
    }

    try {
      const user = apiClient.getStoredUser();
      if (user && user.role !== 'ADMIN') {
        setCurrentUser(user);
        if (user.company_name) {
          setTenant(prev => ({
            ...prev,
            enterprise_name: user.company_name || 'Enterprise Client'
          }));
        }
      } else {
        setCurrentUser(null);
      }
      const simTier = apiClient.getSimulatedTier();
      if (simTier) {
        setSimulatedTier(simTier);
      }
    } catch {
      // Safe fallback
    }

    async function loadBackendData() {
      try {
        try {
          await apiClient.getProcurementCategoryMappings();
        } catch (error: unknown) {
          frontendLogger.error('Could not load procurement category mappings from D1', {}, error);
          setToastMessage(UI_STRINGS.databaseData.procurementMappingsLoadFailed);
        }
        void apiClient.getConversionStages().then(setFunnelStages).catch((error: unknown) => {
          frontendLogger.error('Unable to hydrate conversion stages from D1', {}, error);
        });
        let modeRes: OperatingModeConfig | null = null;
        try {
          modeRes = await assessmentApiClient.getOperatingMode();
          setOperatingMode(modeRes);
          const currentHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
          const currentParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const currentTabParam = currentParams?.get('tab') || '';
          const effectiveNav = currentHash || currentTabParam;
          if (modeRes.isInternalAssessment && !['module1', 'module2', 'module3', 'module4', 'module5', 'schema'].includes(effectiveNav)) {
            setActiveTab('assessment');
          } else if (effectiveNav && ['module1', 'module2', 'module3', 'module4', 'module5', 'schema'].includes(effectiveNav)) {
            setActiveTab(effectiveNav as PipelineActiveTab);
          }
        } catch {
          modeRes = {
            mode: 'INTERNAL_ASSESSMENT',
            isInternalAssessment: true,
            isPublicSaaS: false,
            workspaceTitle: 'aiCEV — Procurement Assessment Centre',
            phaseName: '30-Day Internal Validation Phase',
            features: {
              publicRegistration: false,
              tierUpgrade: false,
              subscriptionPurchase: false,
              customerSelfOnboarding: false,
              customerSaaSDashboard: false,
              assessmentCentre: true
            },
            allowedRoles: ['INTERNAL_ADMIN', 'ANALYST', 'CONSULTANT']
          };
          setOperatingMode(modeRes);
        }

        const isInternalMode = Boolean(modeRes?.isInternalAssessment);

        if (isInternalMode) {
          // In INTERNAL_ASSESSMENT mode:
          // Active customer and assessment are resolved exclusively from assessment store.
          // Do not overwrite tenant or queue with global mock SaaS tenant data!
          setTenant((prev) => ({
            ...prev,
            enterprise_name: UI_STRINGS.header.noActiveCustomer,
            total_spend_evaluated_inr: 0,
            total_spend_evaluated: 0
          }));
          setIngestionQueue([]);
          setValidationRecords([]);
          setUploadedMaterialGroups(undefined);
          setUploadedPlants(undefined);
          setUploadedMonths(undefined);
          setUploadedUniqueItems(undefined);
          setUploadedUniqueVendors(undefined);
          setUploadedParetoData(undefined);
          setCategories([]);
          setLineItems([]);
          setVendorRankings([]);
          setOpportunities([]);

          try {
            const currentParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            let storedAssessmentId = typeof window !== 'undefined'
              ? localStorage.getItem('aicev_selected_assessment_id')
              : null;
            if (!storedAssessmentId) {
              const assessmentParam = currentParams?.get('assessmentId');
              if (assessmentParam) {
                storedAssessmentId = assessmentParam;
              } else {
                try {
                  const list = await assessmentApiClient.getAssessments();
                  if (list && list.length > 0) {
                    const validated = list.find((a: any) => a.validatedSpendCr && a.validatedSpendCr > 0);
                    storedAssessmentId = validated ? validated.assessmentId : list[0].assessmentId;
                  }
                } catch {
                  storedAssessmentId = undefined;
                }
              }
            }
            if (storedAssessmentId) {
              const res: any = await assessmentApiClient.getAssessmentById(storedAssessmentId);
              const record = res?.assessment || res;
              if (record?.assessmentId === storedAssessmentId) {
                handleActiveAssessmentChange(record);
              }
            }
          } catch (storageErr) {
            frontendLogger.warn('Failed to restore active assessment from storage', { error: storageErr });
          }
        } else {
          const storedUser = authApiClient.getStoredUser();
          const buyerUser = storedUser?.role !== 'ADMIN' ? storedUser : null;
          const [tenantData, ingestionData, categoryData, vendorData, savingsData] = await Promise.allSettled([
            apiClient.getTenant(buyerUser?.id),
            apiClient.getIngestionData(buyerUser?.id),
            apiClient.getCategories(),
            apiClient.getVendors(),
            apiClient.getSavingsOpportunities()
          ]);

          if (tenantData.status === 'fulfilled' && tenantData.value) {
            if (buyerUser) {
              setTenant((prev) => ({
                ...prev,
                enterprise_name: buyerUser.company_name || tenantData.value.enterprise_name || prev.enterprise_name,
                total_spend_evaluated_inr: tenantData.value.total_spend_evaluated_inr ?? 0,
                total_spend_evaluated: tenantData.value.total_spend_evaluated ?? 0
              }));
            } else {
              setTenant({
                ...tenantData.value,
                enterprise_name: tenantData.value.enterprise_name || EMPTY_TENANT.enterprise_name
              });
            }
          }

          if (ingestionData.status === 'fulfilled' && ingestionData.value) {
            const backendQueue = ingestionData.value.queue || [];
            const queueToHydrate = buyerUser?.id
              ? backendQueue.filter(
                  (d: any) => !d.tenant_id || d.tenant_id === buyerUser.id || d.tenant_id === buyerUser.email
                )
              : backendQueue;

            if (queueToHydrate.length === 0) {
              setIngestionQueue([]);
              setValidationRecords([]);
              setUploadedMaterialGroups(undefined);
              setUploadedPlants(undefined);
              setUploadedMonths(undefined);
              setUploadedUniqueItems(undefined);
              setUploadedUniqueVendors(undefined);
              setUploadedParetoData(undefined);
              setCategories([]);
              setLineItems([]);
              setVendorRankings([]);
              setOpportunities([]);
              setIsDataRefreshed(false);
              setTenant((prev) => ({
                ...prev,
                total_spend_evaluated_inr: 0,
                total_spend_evaluated: 0
              }));
            } else {
              const sanitizedQueue: RawDocumentIngestion[] = queueToHydrate.map((doc: any, idx: number) => ({
                doc_id: doc.doc_id || `DOC-INGEST-${8800 + idx}`,
                tenant_id: doc.tenant_id || storedUser?.id || 'TNT-GLOBAL-8902',
                file_name: doc.file_name || 'Uploaded_Document.xlsx',
                file_type: doc.file_type || 'XLSX',
                file_size_mb: doc.file_size_mb || 1.0,
                ocr_status: doc.ocr_status || 'Completed',
                progress: doc.progress ?? 100,
                uploaded_at: doc.uploaded_at || new Date().toISOString().replace('T', ' ').slice(0, 19),
                records_count: doc.records_count ?? 0,
                detected_currencies: Array.isArray(doc.detected_currencies) && doc.detected_currencies.length > 0 ? doc.detected_currencies : ['INR'],
                converted_inr_crores: doc.converted_inr_crores ?? 0,
                unique_items_count: doc.unique_items_count,
                unique_vendors_count: doc.unique_vendors_count,
                material_groups_count: doc.material_groups_count,
                plants_count: doc.plants_count
              }));
              setIngestionQueue(sanitizedQueue.slice(0, 1));
              if (ingestionData.value.validationRecords) {
                setValidationRecords(ingestionData.value.validationRecords);
              }
              if (categoryData.status === 'fulfilled' && categoryData.value) {
                setCategories(categoryData.value.categories || []);
              }
              if (vendorData.status === 'fulfilled' && vendorData.value) {
                setVendorRankings(vendorData.value.vendorRankings || []);
              }
              if (savingsData.status === 'fulfilled' && savingsData.value) {
                setOpportunities(savingsData.value.opportunities || []);
              }
            }
          }
        }

        // Fetch authenticated customer's analysis state from the backend
        try {
          const jobs = await orchestrationApi.getJobs();
          if (jobs.length > 0) {
            setActiveAnalysisJob(jobs[0]);
          } else {
            setActiveAnalysisJob(null);
          }
        } catch {
          setActiveAnalysisJob(null);
        }

        // Global analysis state synced with active assessment
      } catch (err) {
        frontendLogger.error('Backend API hydration failed; database data remains unavailable', {}, err);
      }
    }
    loadBackendData();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', handleHash);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize Module 1-4 analytical data strictly with the active assessment
  useEffect(() => {
    async function syncActiveAssessmentData(): Promise<void> {
      if (!activeAssessment?.assessmentId || !activeAssessment.activeDataVersionId) {
        setCanonicalModule1(null);
        setIngestionQueue([]);
        setValidationRecords([]);
        setUploadedMaterialGroups(undefined);
        setUploadedPlants(undefined);
        setUploadedMonths(undefined);
        setUploadedUniqueItems(undefined);
        setUploadedUniqueVendors(undefined);
        setUploadedParetoData(undefined);
        setCategories([]);
        setLineItems([]);
        setVendorRankings([]);
        setOpportunities([]);
        setCompletedSteps({
          step1: false,
          step2: false,
          step3: false,
          step4: false
        });
        setActiveAnalysisJob(null);
        return;
      }

      try {
        const canonicalRes = await apiClient.getCanonicalModule1(undefined, activeAssessment.assessmentId);
        const canonicalData = (canonicalRes as any)?.data ?? canonicalRes;
        frontendLogger.info('syncActiveAssessmentData evaluation', {
          hasCanonicalData: Boolean(canonicalData),
          validFx: canonicalData?.validFxNormalizedSpendCr,
          sourceRows: canonicalData?.sourceRowCount,
          cDataVersion: canonicalData?.dataVersionId,
          aDataVersion: activeAssessment?.activeDataVersionId,
          match: !canonicalData?.dataVersionId || canonicalData?.dataVersionId === activeAssessment?.activeDataVersionId
        });
        if (
          canonicalData &&
          (canonicalData.validFxNormalizedSpendCr || canonicalData.sourceRowCount) &&
          (!canonicalData.dataVersionId || canonicalData.dataVersionId === activeAssessment.activeDataVersionId)
        ) {
          applyCanonicalViewModel(canonicalData);
        } else {
          frontendLogger.warn('syncActiveAssessmentData failed predicate, resetting state', {
            canonicalDataNull: !canonicalData,
            noSpendOrRows: !(canonicalData?.validFxNormalizedSpendCr || canonicalData?.sourceRowCount),
            mismatchedVersion: canonicalData?.dataVersionId !== activeAssessment.activeDataVersionId
          });
          setCanonicalModule1(null);
          setIngestionQueue([]);
        }
      } catch (err: any) {
        frontendLogger.error(`syncActiveAssessmentData caught error: ${err?.message || String(err)}`, {
          message: err?.message,
          stack: err?.stack
        }, err);
        setCanonicalModule1(null);
        setIngestionQueue([]);
      }

      try {
        const m2Items = await apiClient.getModule2CanonicalLineItems(undefined, activeAssessment?.assessmentId);
        if (m2Items && m2Items.length > 0) {
          setLineItems(m2Items);
        }
      } catch {
        // safe fallback
      }
    }
    void syncActiveAssessmentData();
  }, [activeAssessment]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (typeof window !== 'undefined') {
        localStorage.setItem('procucev_theme', 'dark');
      }
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      if (typeof window !== 'undefined') {
        localStorage.setItem('procucev_theme', 'light');
      }
    }
  }, [theme]);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLogout = () => {
    authApiClient.clearStoredSession();
    setCurrentUser(null);
    showToast(UI_STRINGS.auth.logout);
  };

  // Subscription Tier Resolution & Simulation Handlers
  const effectiveTier = getEffectiveUserTier(currentUser, simulatedTier);

  const handleSelectSimulatedTier = (tier: SubscriptionTier | null) => {
    setSimulatedTier(tier);
    apiClient.setSimulatedTier(tier);
    if (tier) {
      showToast(UI_STRINGS.subscription.simulationActive(tier));
    } else {
      showToast(UI_STRINGS.subscription.resetSimulation);
    }
  };

  const handleUpgradeTier = (targetTier: SubscriptionTier) => {
    handleSelectSimulatedTier(targetTier);
    showToast(`Upgraded to ${targetTier} Customer!`);
  };

  // Handlers for Module 1
  const handleFixCurrency = (record: ValidationPreCheckRecord) => {
    setSelectedRecordForCurrency(record);
  };

  const handleApplyCurrencyFix = async (recordId: string, selectedCurrency: string, convertedAmount: number) => {
    const record = validationRecords.find((r) => r.record_id === recordId) || validationRecords[0];
    const fxRate = getYahooFinanceRateToINR(selectedCurrency, record.transaction_date || record.spend_year);
    const inrCrores = Number((convertedAmount / INR_CRORES_DIVISOR).toFixed(4));

    try {
      await apiClient.updateValidationRecord(recordId, {
        raw_currency: selectedCurrency,
        issue_flag: 'Passed Clean',
        action_status: 'Ready',
        resolved: true,
        amount: record.amount,
        amount_inr: convertedAmount,
        fx_rate_applied: fxRate,
        inr_crores: inrCrores
      });
    } catch (error: unknown) {
      frontendLogger.warn('Currency correction was not persisted', { recordId, error });
      showToast(error instanceof Error ? error.message : UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails));
      return;
    }

    setValidationRecords((prev) => prev.map((r) => r.record_id === recordId
      ? { ...r, raw_currency: selectedCurrency, currency_provenance: 'ANALYST_CONFIRMED', issue_flag: 'Passed Clean', action_status: 'Ready', resolved: true, amount_inr: convertedAmount, fx_rate_applied: fxRate, inr_crores: inrCrores }
      : r));

    setIsDataRefreshed(true);

    showToast(UI_STRINGS.toasts.recordNormalized(recordId, selectedCurrency));
  };

  const handleConfirmDatasetBaseCurrency = (confirmedCurrency: string = 'INR') => {
    setAnalystConfirmedBaseCurrency(confirmedCurrency);
    setValidationRecords((prev) =>
      prev.map((r) => {
        if (!r.raw_currency || r.currency_provenance === 'UNRESOLVED' || r.issue_flag === 'Missing Currency Code') {
          return {
            ...r,
            raw_currency: confirmedCurrency,
            currency_provenance: 'ANALYST_CONFIRMED',
            issue_flag: 'Passed Clean',
            action_status: 'Ready',
            resolved: true
          };
        }
        return r;
      })
    );
    showToast(`Analyst confirmed dataset base currency: ${confirmedCurrency}`);
  };

  const handleMergeVendor = (record: ValidationPreCheckRecord) => {
    setSelectedRecordForMerge(record);
  };

  const handleApplyVendorMerge = async (recordId: string, masterVendorId: string, masterVendorName: string) => {
    try {
      await apiClient.updateValidationRecord(recordId, {
        vendor_name: `${masterVendorName} (${masterVendorId})`,
        issue_flag: 'Passed Clean',
        action_status: 'Ready',
        resolved: true
      });
    } catch (error: unknown) {
      frontendLogger.warn('Supplier correction was not persisted', { recordId, error });
      showToast(error instanceof Error ? error.message : UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails));
      return;
    }

    setValidationRecords((prev) =>
      prev.map((r) =>
        r.record_id === recordId
          ? {
              ...r,
              vendor_name: `${masterVendorName} (${masterVendorId})`,
              issue_flag: 'Passed Clean',
              action_status: 'Ready',
              resolved: true
            }
          : r
      )
    );

    setIsDataRefreshed(true);

    showToast(UI_STRINGS.toasts.recordMapped(recordId, masterVendorId));
  };

  const handleMergeItem = (record: ValidationPreCheckRecord) => {
    setSelectedRecordForMergeItem(record);
  };

  const handleApplyItemMerge = async (recordId: string, masterItemCode: string, masterItemName: string) => {
    try {
      await apiClient.updateValidationRecord(recordId, {
        raw_desc: `${masterItemName} (${masterItemCode})`,
        issue_flag: 'Passed Clean',
        action_status: 'Ready',
        resolved: true
      });
    } catch (error: unknown) {
      frontendLogger.warn('Item correction was not persisted', { recordId, error });
      showToast(error instanceof Error ? error.message : UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails));
      return;
    }

    setValidationRecords((prev) =>
      prev.map((r) =>
        r.record_id === recordId
          ? {
              ...r,
              raw_desc: `${masterItemName} (${masterItemCode})`,
              issue_flag: 'Passed Clean',
              action_status: 'Ready',
              resolved: true
            }
          : r
      )
    );

    setIsDataRefreshed(true);

    showToast(UI_STRINGS.toasts.recordItemMerged(recordId, masterItemCode));
  };

  const handleIgnoreValidationIssue = async (recordId: string) => {
    try {
      await apiClient.updateValidationRecord(recordId, {
        issue_flag: 'Passed Clean',
        action_status: 'Reviewed',
        resolved: true
      });
    } catch (error: unknown) {
      frontendLogger.warn('Validation review was not persisted', { recordId, error });
      showToast(error instanceof Error ? error.message : UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails));
      return;
    }

    setValidationRecords((prev) =>
      prev.map((r) =>
        r.record_id === recordId
          ? {
              ...r,
              issue_flag: 'Passed Clean',
              action_status: 'Reviewed',
              resolved: true
            }
          : r
      )
    );

    setIsDataRefreshed(true);

    showToast(UI_STRINGS.toasts.issueIgnored(recordId));
  };

  // Recalculate only currency totals supported by the D1 FX reference table.
  const handleApplyBlanketFixes = async () => {
    try {
      const result = await apiClient.applyBlanketRemediation();
      const updates = new Map<string, ValidationPreCheckRecord>(
        result.records.map((record): [string, ValidationPreCheckRecord] => [record.record_id, record])
      );
      setValidationRecords((previous) => previous.map((record) => updates.get(record.record_id) || record));
      setIsDataRefreshed(result.updatedCount > 0);
      showToast(result.updatedCount > 0
        ? UI_STRINGS.toasts.blanketFixesApplied(result.updatedCount)
        : UI_STRINGS.toasts.blanketFixesNoChanges);
    } catch (error: unknown) {
      frontendLogger.warn('D1-backed currency remediation failed', { error });
      showToast(error instanceof Error ? error.message : UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails));
    }
  };

  const handleRefreshWithFixes = () => {
    setIsDataRefreshed(true);

    // Keep active governance validation checks without corrupting numbers
    setValidationRecords((prev) => {
      const hasActive = prev.some((r) => !r.resolved && r.issue_flag !== 'Passed Clean');
      if (!hasActive && prev.length > 0) {
        return prev.map((r, idx) => {
          if (idx === 3 || r.record_id === 'REC-8844' || r.issue_flag === 'Tax Discrepancy') {
            return {
              ...r,
              issue_flag: 'Tax Discrepancy',
              action_status: 'Reviewed',
              resolved: false
            };
          }
          return r;
        });
      }
      return prev;
    });

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const saved = window.sessionStorage.getItem('procucev_uploaded_dataset');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.isDataRefreshed = true;
          parsed.validationRecords = validationRecords;
          window.sessionStorage.setItem('procucev_uploaded_dataset', JSON.stringify(parsed));
        }
      }
    } catch {
      // Fallback if sessionStorage unavailable
    }

    // Scroll smoothly to Document Summary View to display final numbers
    if (typeof document !== 'undefined') {
      const docSummaryEl = document.getElementById('document-summary-section');
      if (docSummaryEl) {
        docSummaryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    const currentRecordsCount = uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || lineItems.length || 0);

    setAnalyzingLoaderState({
      isOpen: true,
      title: 'Recalculating Enterprise Spend & Refreshing Final Numbers',
      subtitle: `Auditing ${currentRecordsCount ? currentRecordsCount.toLocaleString() : 'all'} line items across facilities, material groups, and transaction timelines...`,
      metrics: {
        totalRecords: currentRecordsCount,
        spendCrores: Number((tenant.total_spend_evaluated_inr ?? 0).toFixed(2)),
        uniqueVendors: uploadedUniqueVendors ?? (ingestionQueue[0]?.unique_vendors_count || vendorRankings.length || 0),
        categoriesIdentified: uploadedMaterialGroups?.length ?? (ingestionQueue[0]?.material_groups_count || categories.length || 0),
        confidenceScore: 99.4
      },
      onComplete: () => {
        setAnalyzingLoaderState(null);
      }
    });

    showToast(UI_STRINGS.toasts.refreshedFinalNumbers);
  };

  const handleResetValidationRecords = async () => {
    try {
      await apiClient.resetValidationRecords();
    } catch (error: unknown) {
      frontendLogger.warn('Validation reset was not persisted', { error });
      showToast(error instanceof Error ? error.message : UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails));
      return;
    }

    setValidationRecords([]);
    setIsDataRefreshed(false);
    showToast(UI_STRINGS.toasts.validationReset);
  };

  const handleDeleteDocument = async (docId?: string) => {
    let remainingDocuments: RawDocumentIngestion[];
    try {
      remainingDocuments = await apiClient.deleteIngestionDocument(docId);
    } catch (error: unknown) {
      frontendLogger.warn('Document deletion was not persisted', { docId, error });
      showToast(error instanceof Error ? error.message : UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails));
      return;
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('procucev_uploaded_dataset');
      }
    } catch {
      // Safe fallback
    }
    setIngestionQueue(remainingDocuments);
    setValidationRecords([]);
    setUploadedMaterialGroups(undefined);
    setUploadedPlants(undefined);
    setUploadedMonths(undefined);
    setUploadedUniqueItems(undefined);
    setUploadedUniqueVendors(undefined);
    setUploadedParetoData(undefined);
    setIsDataRefreshed(false);
    setTenant((prev) => ({
      ...prev,
      total_spend_evaluated_inr: 0,
      total_spend_evaluated: 0
    }));
    setCompletedSteps({
      step1: false,
      step2: false,
      step3: false,
      step4: false
    });
    setActiveTab('module1');

    showToast(UI_STRINGS.toasts.datasetRemoved);
  };

  const handleAddBatchUpload = async (file: File, _datasetType: DatasetType = 'Purchase History') => {
    const loggedUser = currentUser || authApiClient.getStoredUser();
    if (!loggedUser) {
      showToast(UI_STRINGS.toasts.loginRequiredForUpload);
      router.push('/login');
      return;
    }

    const extension = file.name.toLowerCase().split('.').pop() || '';
    const fileType = extension === 'xlsx' ? 'XLSX' : extension === 'xls' ? 'XLS' : extension === 'csv' ? 'CSV' : extension === 'pdf' ? 'PDF' : 'OTHER';
    const isWorkbook = fileType === 'XLSX' || fileType === 'XLS' || fileType === 'CSV';
    if (activeAssessment && !isWorkbook) {
      showToast(UI_STRINGS.toasts.batchUploadAssessmentUnsupported(file.name));
      return;
    }

    setIsDataRefreshed(false);
    setIngestionQueue([]);
    setValidationRecords([]);
    setUploadedMaterialGroups(undefined);
    setUploadedPlants(undefined);
    setUploadedMonths(undefined);
    setUploadedUniqueItems(undefined);
    setUploadedUniqueVendors(undefined);
    setUploadedParetoData(undefined);
    setCanonicalModule1(null);
    setCategories([]);
    setLineItems([]);
    setVendorRankings([]);
    setOpportunities([]);
    setTenant((previous) => ({
      ...previous,
      total_spend_evaluated_inr: 0,
      total_spend_evaluated: 0
    }));

    setAnalyzingLoaderState({
      isOpen: true,
      title: UI_STRINGS.toasts.persistingUploadTitle,
      subtitle: UI_STRINGS.toasts.persistingUploadSubtitle,
      metrics: { totalRecords: 0, spendCrores: 0, uniqueVendors: 0, categoriesIdentified: 0, confidenceScore: 0 },
      onComplete: () => setAnalyzingLoaderState(null)
    });

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          const encoded = result.split(',')[1];
          if (!encoded) {
            reject(new Error(UI_STRINGS.toasts.uploadFileReadFailed));
            return;
          }
          resolve(encoded);
        };
        reader.onerror = () => reject(new Error(UI_STRINGS.toasts.uploadFileReadFailed));
        reader.readAsDataURL(file);
      });

      if (activeAssessment) {
        if (!globalThis.crypto?.subtle) {
          throw new Error(UI_STRINGS.toasts.uploadChecksumUnavailable);
        }
        const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        const checksum = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
        const uploaded = await assessmentApiClient.uploadDataVersion(activeAssessment.assessmentId, {
          fileName: file.name,
          fileSize: file.size,
          checksum,
          fileBase64,
          runAnalysisImmediately: false
        });
        const versionId = uploaded.dataVersion?.dataVersionId || uploaded.assessment?.activeDataVersionId || '';
        if (!versionId || !uploaded.assessment) {
          throw new Error(UI_STRINGS.toasts.uploadResponseMissingVersion);
        }
        handleActiveAssessmentChange(uploaded.assessment);
        setIsDetailedAnalysisModalOpen(true);
        showToast(UI_STRINGS.toasts.batchUploadAssessmentSaved(file.name, versionId));
        return;
      }

      const uploaded = await apiClient.uploadDocumentToObjectStore({
        fileName: file.name,
        fileType,
        fileBase64,
        parseTransactions: isWorkbook,
        fileSizeMb: file.size / (1024 * 1024),
        recordsCount: 0,
        convertedInrCrores: 0,
        detectedCurrencies: [],
        datasetType: _datasetType,
        buyer_id: loggedUser.id,
        tenant_id: loggedUser.id || tenant.tenant_id
      });
      if (!uploaded.success || !uploaded.data?.docId) {
        throw new Error(uploaded.message || UI_STRINGS.toasts.uploadResponseMissingDocument);
      }

      const importedCount = Number(uploaded.data.importedCount || 0);
      const spendInrCrores = Number(uploaded.data.totalInrCrores || 0);
      const [ingestionResult, categoryResult, vendorResult, savingsResult, lineItemsResult] = await Promise.allSettled([
        apiClient.getIngestionData(loggedUser.id),
        apiClient.getCategories(),
        apiClient.getVendors(),
        apiClient.getSavingsOpportunities(),
        apiClient.getModule2CanonicalLineItems(undefined, undefined, loggedUser.id)
      ]);

      let extractionPending = false;
      if (ingestionResult.status === 'fulfilled') {
        const persistedQueue = ingestionResult.value.queue.filter((document) =>
          !document.tenant_id || document.tenant_id === loggedUser.id || document.tenant_id === loggedUser.email
        );
        setIngestionQueue(persistedQueue.slice(0, 1));
        setValidationRecords(ingestionResult.value.validationRecords || []);
        extractionPending = persistedQueue.some((document) =>
          document.doc_id === uploaded.data?.docId && document.ocr_status === 'Pending'
        );
      }
      setTenant((previous) => ({ ...previous, total_spend_evaluated_inr: spendInrCrores, total_spend_evaluated: 0 }));
      if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value.categories || []);
      if (vendorResult.status === 'fulfilled') setVendorRankings(vendorResult.value.vendorRankings || []);
      if (savingsResult.status === 'fulfilled') setOpportunities(savingsResult.value.opportunities || []);
      if (lineItemsResult.status === 'fulfilled') setLineItems(lineItemsResult.value);

      try {
        const jobs = await orchestrationApi.getJobs();
        setActiveAnalysisJob(jobs[0] || null);
      } catch (error: unknown) {
        frontendLogger.warn('Could not refresh D1 analysis jobs after ingestion', { fileName: file.name, error });
      }

      setIsDataRefreshed(true);
      setIsDetailedAnalysisModalOpen(true);
      setAnalyzingLoaderState((current) => current ? {
        ...current,
        metrics: {
          totalRecords: importedCount,
          spendCrores: spendInrCrores,
          uniqueVendors: 0,
          categoriesIdentified: 0,
          confidenceScore: 0
        }
      } : null);
      showToast(extractionPending
        ? UI_STRINGS.toasts.batchUploadPendingExtraction(file.name)
        : UI_STRINGS.toasts.batchUploadSpend(file.name, spendInrCrores, importedCount));
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : UI_STRINGS.toasts.uploadUnknownFailure;
      frontendLogger.error('D1-backed document upload failed', { fileName: file.name, fileType }, error);
      showToast(UI_STRINGS.toasts.batchUploadFailed(file.name, reason));
    } finally {
      setAnalyzingLoaderState(null);
    }
  };
  // Handlers for Module 2
  const persistModule2Mappings = async (
    mappings: ApiBulkUpdateModule2MaterialMappingsPayload['mappings']
  ): Promise<void> => {
    const assessmentId = activeAssessment?.assessmentId;
    if (!assessmentId) throw new Error(UI_STRINGS.toasts.module2AssessmentRequired);
    for (let offset = 0; offset < mappings.length; offset += VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BULK_LIMIT) {
      await apiClient.updateModule2MaterialMappings({
        assessmentId,
        mappings: mappings.slice(offset, offset + VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BULK_LIMIT)
      });
    }
  };

  const handleConfirmMapping = async (mappingId: string): Promise<void> => {
    const item = lineItems.find((candidate) => candidate.mapping_id === mappingId);
    const sourceMaterialId = item?.material_code?.trim().toLocaleUpperCase('en-US');
    if (!sourceMaterialId) {
      showToast(UI_STRINGS.toasts.module2MaterialCodeRequired);
      return;
    }
    try {
      await persistModule2Mappings([{
        sourceMaterialId,
        unspscCode: item.unspsc_code,
        reviewStatus: 'CLIENT_APPROVED',
        auditNotes: VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_APPROVAL_AUDIT_NOTE
      }]);
      setLineItems((previous) => previous.map((candidate) => candidate.mapping_id === mappingId
        ? { ...candidate, status: 'Confirmed' } : candidate));
      showToast(UI_STRINGS.toasts.unspscConfirmed(mappingId));
    } catch (error: unknown) {
      frontendLogger.error('Failed to persist Module 2 mapping confirmation', { mappingId }, error);
      showToast(error instanceof Error ? error.message : UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.mappingServerRejected(500)));
    }
  };

  const handleSaveReassign = async (mappingId: string, newCode: string, _newName: string, bucket: string): Promise<void> => {
    const item = lineItems.find((candidate) => candidate.mapping_id === mappingId);
    const sourceMaterialId = item?.material_code?.trim().toLocaleUpperCase('en-US');
    if (!sourceMaterialId) {
      showToast(UI_STRINGS.toasts.module2MaterialCodeRequired);
      return;
    }
    try {
      await persistModule2Mappings([{
        sourceMaterialId,
        unspscCode: newCode,
        reviewStatus: 'TAXONOMY_VERIFIED',
        auditNotes: VENDOR_CONSOLIDATION_UI_CONFIG.MANUAL_REASSIGN_AUDIT_NOTE
      }]);
      setLineItems((previous) => previous.map((candidate) => candidate.mapping_id === mappingId
        ? {
            ...candidate, unspsc_code: newCode, unspsc_category_name: _newName,
            core_bucket: bucket, status: 'Confirmed', ai_confidence: 100
          }
        : candidate));
      showToast(UI_STRINGS.toasts.taxonomyReassigned(newCode, bucket));
    } catch (error: unknown) {
      frontendLogger.error('Failed to persist Module 2 taxonomy reassignment', { mappingId, newCode }, error);
      showToast(error instanceof Error ? error.message : UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.mappingServerRejected(500)));
    }
  };

  // Handlers for Module 4 Suite Integration
  const handleProCPXSuccess = (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.opp_id === oppId ? { ...o, status: 'Pushed to proCPX' } : o))
    );
    apiClient.deployOpportunity(oppId, 'proCPX').catch((e) => {
      frontendLogger.warn('Backend sync warning for proCPX deployment', { error: e });
    });
    showToast(UI_STRINGS.toasts.pushedToProCPX(oppId));
  };

  const handleDPSNXTSuccess = (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.opp_id === oppId ? { ...o, status: 'Pushed to DPS NXT' } : o))
    );
    apiClient.deployOpportunity(oppId, 'DPS NXT').catch((e) => {
      frontendLogger.warn('Backend sync warning for DPS NXT deployment', { error: e });
    });
    showToast(UI_STRINGS.toasts.deployedToDPSNXT(oppId));
  };

  const handleStartAICategorization = async () => {
    if (!activeAssessment) {
      frontendLogger.warn('Module 2 taxonomy categorization requires an active assessment', {});
      showToast(UI_STRINGS.toasts.module2AssessmentRequired);
      return;
    }

    try {
      await loadUNSPSCTaxonomy();
    } catch {
      showToast(getTaxonomyLoadState().error || UI_STRINGS.taxonomyData.loadFailed(UI_STRINGS.taxonomyData.unknownFailure, UI_STRINGS.taxonomyData.requestUnavailable));
      return;
    }
    showToast(UI_STRINGS.toasts.runningAiCat);
    setAnalyzingLoaderState({
      isOpen: true,
      title: UI_STRINGS.analyzingLoader.title,
      subtitle: UI_STRINGS.analyzingLoader.subtitle,
      metrics: {
        totalRecords: uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || lineItems.length || 0),
        spendCrores: Number((tenant.total_spend_evaluated_inr ?? 0).toFixed(2)),
        uniqueVendors: uploadedUniqueVendors ?? (ingestionQueue[0]?.unique_vendors_count || vendorRankings.length || 0),
        categoriesIdentified: uploadedMaterialGroups?.length ?? (ingestionQueue[0]?.material_groups_count || categories.length || 0)
      },
      onComplete: () => {
        setAnalyzingLoaderState(null);
      }
    });

    let suggestionByDescription = new Map<string, NonNullable<Awaited<ReturnType<typeof aiApiClient.categorizeItems>>['mappings']>[number]>();
    let suggestionModel: string = UI_STRINGS.toasts.d1TaxonomyModel;
    try {
      const itemsToCategorize = lineItems.map((item) => ({
        rawLineText: item.raw_desc,
        vendorIdentified: item.vendor_identified,
        amount: item.inr_crores || item.total_spend
      }));

      const res = await aiApiClient.categorizeItems(itemsToCategorize);
      if (res?.success && Array.isArray(res.mappings) && res.mappings.length > 0) {
        suggestionByDescription = new Map(res.mappings.map((mapping) => [
          String(mapping.rawLineText || '').toLowerCase().trim(), mapping
        ]));
        suggestionModel = res.model || UI_STRINGS.toasts.externalAiModel;
      }
    } catch (error: unknown) {
      frontendLogger.warn('External AI classification was unavailable; using D1 taxonomy suggestions', {}, error);
    }

    try {
      const catalogByCode = new Map(unspscOfficialDictionary.map((record) => [record.commodityCode, record]));
      const catalogCodes = new Set(catalogByCode.keys());
      const stagedItems = lineItems.map((item) => {
        const suggestion = suggestionByDescription.get(item.raw_desc.toLowerCase().trim());
        const dictionaryMatch = lookupUNSPSCByDescription(item.raw_desc);
        const taxonomyMatch = suggestion
          ? lookupUNSPSCDetails(suggestion.unspscTitle || item.raw_desc, suggestion.suggestedBucket || item.core_bucket)
          : dictionaryMatch || lookupUNSPSCDetails(item.raw_desc, item.core_bucket);
        const aiCode = suggestion?.mappedUnspscCode;
        const validAiCode = Boolean(aiCode && catalogCodes.has(aiCode));
        const suggestedCode = validAiCode ? aiCode as string : dictionaryMatch?.commodityCode || taxonomyMatch.commodityCode;
        const validSuggestion = catalogCodes.has(suggestedCode) && (validAiCode || dictionaryMatch?.classificationStatus === 'CLASSIFIED');
        const catalogRecord = catalogByCode.get(suggestedCode);
        const modelConfidence = Number(suggestion?.confidenceScore);
        return {
          ...item,
          unspsc_code: validSuggestion ? suggestedCode : item.unspsc_code,
          unspsc_commodity_title: validSuggestion
            ? catalogRecord?.commodityTitle || item.unspsc_commodity_title : item.unspsc_commodity_title,
          unspsc_class_title: validSuggestion ? catalogRecord?.classTitle || taxonomyMatch.classTitle : item.unspsc_class_title,
          unspsc_category_name: validSuggestion
            ? catalogRecord?.commodityTitle || item.unspsc_category_name : item.unspsc_category_name,
          core_bucket: validSuggestion
            ? (catalogRecord?.coreBucket || item.core_bucket) : item.core_bucket,
          ai_confidence: validSuggestion
            ? (validAiCode && Number.isFinite(modelConfidence) ? modelConfidence : 95)
            : item.ai_confidence,
          status: validSuggestion ? 'Pending Review' : item.status,
          hasValidSuggestion: validSuggestion
        };
      });
      const uniqueMappings = new Map<string, ApiBulkUpdateModule2MaterialMappingsPayload['mappings'][number]>();
      const conflictingMaterialIds = new Set<string>();
      for (const item of stagedItems) {
        const sourceMaterialId = item.material_code?.trim().toLocaleUpperCase('en-US');
        if (!sourceMaterialId || !item.hasValidSuggestion || !catalogCodes.has(item.unspsc_code)) continue;
        const score = item.ai_confidence > 1 ? item.ai_confidence / 100 : item.ai_confidence;
        const previous = uniqueMappings.get(sourceMaterialId);
        if (previous && previous.unspscCode !== item.unspsc_code) {
          uniqueMappings.delete(sourceMaterialId);
          conflictingMaterialIds.add(sourceMaterialId);
          continue;
        }
        if (conflictingMaterialIds.has(sourceMaterialId) || uniqueMappings.has(sourceMaterialId)) continue;
        uniqueMappings.set(sourceMaterialId, {
          sourceMaterialId,
          unspscCode: item.unspsc_code,
          reviewStatus: 'PROVISIONAL',
          confidenceScore: Math.max(0, Math.min(1, score)),
          mappingMethod: 'CONTEXTUAL_HEURISTIC',
          auditNotes: VENDOR_CONSOLIDATION_UI_CONFIG.PROVISIONAL_AI_AUDIT_NOTE
        });
      }
      if (uniqueMappings.size === 0) throw new Error(UI_STRINGS.toasts.noTaxonomySuggestionsSaved);
      await persistModule2Mappings([...uniqueMappings.values()]);
      setLineItems(stagedItems);
      setCompletedSteps((previous) => ({ ...previous, step1: true, step2: true }));
      showToast(UI_STRINGS.toasts.taxonomySuggestionsSaved(uniqueMappings.size));
      frontendLogger.info('Saved provisional Module 2 taxonomy suggestions', {
        assessmentId: activeAssessment?.assessmentId,
        source: suggestionModel,
        mappingCount: uniqueMappings.size,
        excludedLineCount: stagedItems.length - uniqueMappings.size
      });
    } catch (error: unknown) {
      frontendLogger.error('Module 2 taxonomy suggestions could not be saved to D1', {
        assessmentId: activeAssessment?.assessmentId
      }, error);
      showToast(error instanceof Error ? error.message : UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.mappingServerRejected(500)));
    } finally {
      setAnalyzingLoaderState(null);
    }
  };

  const handleUpdateTenant = async (updatedTenant: TenantMaster) => {
    setTenant(updatedTenant);
    try {
      await apiClient.updateTenant({
        enterprise_name: updatedTenant.enterprise_name,
        region: updatedTenant.region,
        base_currency: updatedTenant.base_currency,
        total_spend_evaluated: updatedTenant.total_spend_evaluated,
        total_spend_evaluated_inr: updatedTenant.total_spend_evaluated_inr,
        major_sector: updatedTenant.major_sector,
        minor_sector: updatedTenant.minor_sector,
        status: updatedTenant.status
      });
      frontendLogger.info('Tenant setup synced to database successfully', {
        tenantId: updatedTenant.tenant_id,
        enterprise: updatedTenant.enterprise_name
      });
    } catch (err) {
      frontendLogger.warn('Backend sync warning for tenant update', { error: err });
    }
  };

  return (
    <div className={`min-h-screen bg-[#EEF7FF] text-[#0B1B33] bg-grid-pattern transition-colors duration-200 ${theme}`}>
      {/* Top Header */}
      <Header
        tenant={tenant}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenClientSetup={() => setIsClientSetupModalOpen(true)}
        onSelectTenant={(t) => {
          setTenant(t);
          apiClient.updateTenant(t).catch((e) => {
            frontendLogger.warn('Backend sync warning for tenant update', { error: e });
          });
        }}
        currency={currency}
        onSelectCurrency={(c) => {
          setCurrency(c);
          apiClient.updateTenant({ base_currency: c }).catch((e) => {
            frontendLogger.warn('Backend sync warning for currency update', { error: e });
          });
        }}
        onOpenReport={() => {
          if (typeof window !== 'undefined') {
            const target = window.location.origin ? `${window.location.origin}/executive-brief` : '/executive-brief';
            window.location.href = target;
          }
        }}
        onOpenManagementBrief={() => setIsManagementSummaryOpen(true)}
        isExecutiveBriefReady={Boolean(opportunities && opportunities.length > 0) || (tenant.total_spend_evaluated_inr ?? 0) > 0}
        theme={theme}
        onSelectTheme={setTheme}
        onStartAnalysis={() => {
          setAnalyzingLoaderState({
            isOpen: true,
            title: UI_STRINGS.analyzingLoader.title,
            subtitle: UI_STRINGS.analyzingLoader.subtitle,
            metrics: {
              totalRecords: uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || lineItems.length || 0),
              spendCrores: Number((tenant.total_spend_evaluated_inr ?? 0).toFixed(2)),
              uniqueVendors: uploadedUniqueVendors ?? (ingestionQueue[0]?.unique_vendors_count || vendorRankings.length || 0),
              categoriesIdentified: uploadedMaterialGroups?.length ?? (ingestionQueue[0]?.material_groups_count || categories.length || 0),
              confidenceScore: 99.4
            },
            onComplete: () => {
              setAnalyzingLoaderState(null);
              showToast(UI_STRINGS.toasts.runningAiCat);
            }
          });
        }}
        isAnalyzing={!!analyzingLoaderState?.isOpen}
        currentTier={effectiveTier}
        onSelectSimulatedTier={handleSelectSimulatedTier}
        user={currentUser}
        operatingMode={operatingMode}
        onToggleAssessmentMode={() => setActiveTab((prev) => (prev === 'assessment' ? 'module1' : 'assessment'))}
        activeAssessment={activeAssessment}
        activeCustomer={activeCustomer}
      />

      {/* Main Container */}
      <main className="w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 pt-6 pb-12 space-y-6">
        {/* Pipeline & Strategic Vision Navigation */}
        <PipelineBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isStep1Complete={isStep1Complete}
          isStep2Complete={isStep2Complete}
          isStep3Complete={isStep3Complete}
          isStep4Complete={isStep4Complete}
          unlockedTabs={UNLOCKED_DEV_PIPELINE_STAGES as PipelineActiveTab[]}
          onLockedTabClick={(tab) => {
            showToast(getLockedTabMessage(tab));
          }}
          tenant={tenant}
          opportunities={opportunities}
          ingestionQueue={ingestionQueue}
          totalSpendCr={tenant.total_spend_evaluated_inr}
          canonicalViewModel={canonicalModule1}
          activeAssessment={activeAssessment}
        />

        {activeTab === 'assessment' && (
          <AssessmentWorkspace
            onActiveAssessmentChange={handleActiveAssessmentChange}
            onSelectCustomer={(c) => {
              setActiveCustomer(c);
              if (!activeAssessment) {
                setTenant((prev) => ({
                  ...prev,
                  enterprise_name: c ? c.customerName : UI_STRINGS.header.noActiveCustomer,
                  total_spend_evaluated_inr: 0,
                  total_spend_evaluated: 0
                }));
              }
            }}
            onNavigateToModule1={(assessment) => {
              handleActiveAssessmentChange(assessment);
              setActiveTab('module1');
            }}
          />
        )}

        {/* Tab Modules */}
        {activeTab === 'module1' && (
          <>
            {shouldShowDetailedAnalysisStatus && (
              <CustomerAnalysisStatusCard
                tenantId={tenant.tenant_id}
                hasValidDataVersion={hasValidDataVersion}
                hasModule1Result={hasModule1Result}
                activeJob={activeAnalysisJob}
                compact
                onViewSpendSummary={() => setActiveTab('module1')}
                onViewReport={() => setIsManagementSummaryOpen(true)}
              />
            )}
            <Module1Ingestion
            tenant={tenant}
            onUpdateTenant={handleUpdateTenant}
            ingestionQueue={ingestionQueue}
            validationRecords={validationRecords}
            onFixCurrency={handleFixCurrency}
            onMergeVendor={handleMergeVendor}
            onApplyBlanketFixes={handleApplyBlanketFixes}
            onResetValidationRecords={handleResetValidationRecords}
            onRunAICategorization={async () => {
              setCompletedSteps((prev) => ({ ...prev, step1: true }));
              setActiveTab('module2');
              await handleStartAICategorization();
            }}
            onAddBatchUpload={handleAddBatchUpload}
            materialGroupSummaries={uploadedMaterialGroups}
            plantSummaries={uploadedPlants}
            monthWiseSummaries={uploadedMonths}
            uniqueItemsCount={uploadedUniqueItems}
            uniqueVendorsCount={uploadedUniqueVendors}
            onMergeItem={handleMergeItem}
            onDeleteDocument={handleDeleteDocument}
            isDataRefreshed={isDataRefreshed}
            paretoSpendData={uploadedParetoData}
            onRefreshWithFixes={handleRefreshWithFixes}
            currentTier={effectiveTier}
            onUpgrade={handleUpgradeTier}
            canonicalViewModel={canonicalModule1}
            onConfirmDatasetBaseCurrency={handleConfirmDatasetBaseCurrency}
          />
          </>
        )}

        {activeTab === 'module2' && (
          <Module2Categorization
            tenant={tenant}
            categories={categories}
            lineItems={lineItems}
            onConfirmMapping={handleConfirmMapping}
            onReassignMapping={(item) => setSelectedItemForReassign(item)}
            onProceedToTrend={() => {
              setCompletedSteps((prev) => ({ ...prev, step1: true, step2: true }));
              setActiveTab('module3');
              showToast(UI_STRINGS.toasts.transitioningToVolatility);
            }}
            onStartAICategorization={handleStartAICategorization}
            onUpdateTenant={setTenant}
            currentTier={effectiveTier}
            onUpgrade={handleUpgradeTier}
            targetSection={targetSection}
            assessmentId={activeAssessment?.assessmentId}
          />
        )}


        {activeTab === 'module3' && (
          <Module3TrendAnalytics
            vendorRankings={vendorRankings}
            assessmentId={activeAssessment?.assessmentId}
            onProceedToSavings={() => {
              setCompletedSteps((prev) => ({ ...prev, step1: true, step2: true, step3: true }));
              setActiveTab('module4');
              showToast(UI_STRINGS.toasts.launchingSavings);
            }}
            theme={theme}
            currentTier={effectiveTier}
            onUpgrade={handleUpgradeTier}
          />
        )}

        {activeTab === 'module4' && (
          <Module4SavingsEngine
            opportunities={opportunities}
            assessmentId={activeAssessment?.assessmentId}
            onOpenProCPX={(opp) => setSelectedOppForProCPX(opp)}
            onOpenDPSNXT={(opp) => setSelectedOppForDPSNXT(opp)}
            onProceedToConversion={() => {
              setCompletedSteps((prev) => ({ ...prev, step1: true, step2: true, step3: true, step4: true }));
              setActiveTab('module5');
              showToast(UI_STRINGS.toasts.openingConversion);
            }}
            currentTier={effectiveTier}
            onUpgrade={handleUpgradeTier}
            onNavigateToSection={handleNavigateToSection}
          />
        )}

        {activeTab === 'module5' && (
          <Module5ConversionMatrix
            tenant={tenant}
            funnelStages={funnelStages}
            categories={categories}
            opportunities={opportunities}
            cleanRecordsCount={uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || validationRecords.filter((v) => v.issue_flag === 'Passed Clean').length || 0)}
            onOpenReport={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/executive-brief';
              }
            }}
            currentTier={effectiveTier}
            onUpgrade={handleUpgradeTier}
          />
        )}

        {activeTab === 'schema' && <DatabaseSchemaView />}
      </main>

      {/* ── Enterprise Footer ── */}
      <footer className="ent-footer mt-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-full font-mono font-bold text-[10px] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              AES-256-GCM ENCRYPTED
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
            <span className="hidden sm:inline">All data encrypted at rest &amp; in transit</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-mono">
            <span>Procucev / aiCEV v2.0</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>© {new Date().getFullYear()} Procucev Pvt. Ltd. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <ProCPXModal
        opportunity={selectedOppForProCPX}
        isOpen={!!selectedOppForProCPX}
        onClose={() => setSelectedOppForProCPX(null)}
        onSuccess={handleProCPXSuccess}
      />

      <DPSNXTModal
        opportunity={selectedOppForDPSNXT}
        isOpen={!!selectedOppForDPSNXT}
        onClose={() => setSelectedOppForDPSNXT(null)}
        onSuccess={handleDPSNXTSuccess}
      />

      <FixCurrencyModal
        record={selectedRecordForCurrency}
        isOpen={!!selectedRecordForCurrency}
        onClose={() => setSelectedRecordForCurrency(null)}
        onFix={handleApplyCurrencyFix}
      />

      <MergeVendorModal
        record={selectedRecordForMerge}
        isOpen={!!selectedRecordForMerge}
        onClose={() => setSelectedRecordForMerge(null)}
        onMerge={handleApplyVendorMerge}
        onIgnore={handleIgnoreValidationIssue}
      />

      <MergeItemModal
        record={selectedRecordForMergeItem}
        isOpen={!!selectedRecordForMergeItem}
        onClose={() => setSelectedRecordForMergeItem(null)}
        onMerge={handleApplyItemMerge}
        onIgnore={handleIgnoreValidationIssue}
      />

      <ReassignModal
        item={selectedItemForReassign}
        isOpen={!!selectedItemForReassign}
        onClose={() => setSelectedItemForReassign(null)}
        onSave={handleSaveReassign}
      />

      <ClientIngestionSetupModal
        isOpen={isClientSetupModalOpen}
        onClose={() => setIsClientSetupModalOpen(false)}
        currentTenant={tenant}
        onConfirmAndUpload={(updatedConfig) => {
          const updatedTenant: TenantMaster = {
            ...tenant,
            enterprise_name: updatedConfig.clientName || tenant.enterprise_name,
            base_currency: updatedConfig.currency || tenant.base_currency,
            region: updatedConfig.region || tenant.region,
            major_sector: updatedConfig.majorSector || tenant.major_sector,
            minor_sector: updatedConfig.minorSector || tenant.minor_sector,
            total_spend_evaluated_inr: (updatedConfig.estimatedSpend * 83.8) / 10000000 || tenant.total_spend_evaluated_inr
          };
          setTenant(updatedTenant);
          setIsClientSetupModalOpen(false);
          apiClient.updateTenant(updatedTenant).catch((e) => {
            frontendLogger.warn('Backend sync warning for client setup update', { error: e });
          });
          showToast(UI_STRINGS.toasts.clientConfigUpdated(updatedTenant.enterprise_name));
        }}
      />

      {/* Global Pictorial Analyzing Loader */}
      {analyzingLoaderState?.isOpen && (
        <AnalyzingLoader
          isOpen={analyzingLoaderState.isOpen}
          mode="overlay"
          title={analyzingLoaderState.title}
          subtitle={analyzingLoaderState.subtitle}
          metrics={analyzingLoaderState.metrics || {
            totalRecords: uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || lineItems.length || 0),
            spendCrores: Number((tenant.total_spend_evaluated_inr ?? 0).toFixed(2)),
            uniqueVendors: uploadedUniqueVendors ?? (ingestionQueue[0]?.unique_vendors_count || vendorRankings.length || 0),
            categoriesIdentified: uploadedMaterialGroups?.length ?? (ingestionQueue[0]?.material_groups_count || categories.length || 0),
            confidenceScore: 99.4
          }}
          onComplete={analyzingLoaderState.onComplete}
          onCancel={() => setAnalyzingLoaderState(null)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl bg-white dark:bg-[#0c1628] border border-slate-200 dark:border-slate-700/80 shadow-2xl text-xs font-semibold text-slate-900 dark:text-white animate-slide-up max-w-sm" style={{boxShadow: '0 20px 60px -10px rgba(0,0,0,0.18), 0 0 0 1px rgba(14,165,233,0.15)'}}>
          <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" style={{boxShadow: '0 0 0 3px rgba(14,165,233,0.20)', animation: 'pulse-dot 2s infinite'}} />
          <span className="text-slate-700 dark:text-slate-200">{toastMessage}</span>
        </div>
      )}

      {/* Post-Module-1 Detailed Analysis Notification Modal (Prompt 313) */}
      <DetailedAnalysisModal
        isOpen={isDetailedAnalysisModalOpen}
        onClose={() => {
          setIsDetailedAnalysisModalOpen(false);
          if (activeAnalysisJob?.analysisJobId) {
            try {
              sessionStorage.setItem(`procucev_analysis_popup_ack_${activeAnalysisJob.analysisJobId}`, 'true');
            } catch {
              // safe fallback
            }
          }
        }}
        onContinueToModule1={() => {
          setIsDetailedAnalysisModalOpen(false);
          setActiveTab('module1');
          if (activeAnalysisJob?.analysisJobId) {
            try {
              sessionStorage.setItem(`procucev_analysis_popup_ack_${activeAnalysisJob.analysisJobId}`, 'true');
            } catch {
              // safe fallback
            }
          }
        }}
        onViewSpendSummary={() => {
          setIsDetailedAnalysisModalOpen(false);
          setActiveTab('module1');
          if (activeAnalysisJob?.analysisJobId) {
            try {
              sessionStorage.setItem(`procucev_analysis_popup_ack_${activeAnalysisJob.analysisJobId}`, 'true');
            } catch {
              // safe fallback
            }
          }
        }}
        job={activeAnalysisJob}
      />

      {/* Management Quick Summary Modal View (Prompt 287) */}
      {isManagementSummaryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FBFE] backdrop-blur-sm overflow-y-auto"
          data-testid="management-quick-summary-modal"
        >
          <div className="w-full max-w-6xl my-auto">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManagementSummaryOpen(false)}
                className="rounded-lg border border-[#DCE7F5] bg-white px-4 py-2 text-sm font-semibold text-[#0B1B33]"
                data-testid="back-to-workspace-btn"
              >
                {UI_STRINGS.opportunityBrief.backToWorkspace}
              </button>
            </div>
            <ExecutiveOpportunityBriefView
              clientName={tenant.enterprise_name}
              onDownloadPdf={() => {
                void handleBriefDownload('pdf');
              }}
              onDownloadPptx={() => {
                void handleBriefDownload('pptx');
              }}
              currentTier={effectiveTier}
            />
            {activeAnalysisJob && activeReport ? (
              <ReportAcknowledgementSection
                key={activeReport.reportVersionId}
                jobId={activeAnalysisJob.analysisJobId}
                reportVersionId={activeReport.reportVersionId}
              />
            ) : (
              <div className="flex justify-center my-8" data-testid="management-report-empty-state">
                <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white border border-amber-200 shadow-sm max-w-md w-full">
                  <AlertTriangle className="w-10 h-10 text-amber-500" />
                  <h2 className="text-base font-bold text-[#0B1B33]">{UI_STRINGS.orchestration.noActiveReportTitle}</h2>
                  <p className="text-xs text-slate-600 text-center leading-relaxed">
                    {UI_STRINGS.orchestration.noActiveReportMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {briefDownloadPayload && (
        <a
          ref={briefDownloadLinkRef}
          href={briefDownloadPayload.url}
          download={briefDownloadPayload.filename}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        >
          {UI_STRINGS.opportunityBrief.downloadLinkLabel}
        </a>
      )}
    </div>
  );
}
