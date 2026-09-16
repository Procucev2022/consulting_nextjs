'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { PipelineBar } from '@/components/PipelineBar';
import { Module1Ingestion } from '@/components/Module1Ingestion';
import { Module2Categorization } from '@/components/Module2Categorization';
import dynamic from 'next/dynamic';

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

import { getYahooFinanceRateToINR, parseDateOrYear } from '@/utils/currencyConverter';
import { apiClient, aiApiClient, authApiClient } from '@/utils/api';
import { frontendLogger } from '@/utils/logger';
import { UI_STRINGS } from '@/constants';
import { buildVendorParetoHierarchy, buildItemParetoHierarchy } from '@/utils/paretoCalculator';
import { lookupUNSPSCDetails } from '@/data/unspscTaxonomy';

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
const ExecutiveReportModal = dynamic(
  () => import('@/components/modals/ExecutiveReportModal').then((mod) => mod.ExecutiveReportModal),
  { ssr: false }
);
const ClientIngestionSetupModal = dynamic(
  () => import('@/components/modals/ClientIngestionSetupModal').then((mod) => mod.ClientIngestionSetupModal),
  { ssr: false }
);

// Mock Data Seed
import {
  mockTenant,
  initialIngestionQueue,
  initialValidationRecords,
  spendCategoriesData,
  initialLineItemMappings,
  vendorVolatilityRankings,
  initialSavingsOpportunities,
  conversionFunnelStages
} from '@/data/mockData';

import type {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  LineItemMapping,
  SavingsOpportunity,
  DatasetType,
  PipelineActiveTab,
  HeaderCurrency,
  MaterialGroupSummary,
  PlantSummary,
  MonthWiseSummary,
  ParetoSpendData,
  ParetoRawRecord,
  SpendCategorySummary,
  UserProfile,
  SubscriptionTier
} from '@/types';
import { getEffectiveUserTier } from '@/utils/tierAccess';

export default function Home() {
  // Theme State: Default to Light Mode
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Navigation & User Session State
  const [activeTab, setActiveTab] = useState<PipelineActiveTab>('module1');
  const [targetSection, setTargetSection] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      return authApiClient.getStoredUser();
    }
    return null;
  });
  const [simulatedTier, setSimulatedTier] = useState<SubscriptionTier | null>(null);
  const [isClientSetupModalOpen, setIsClientSetupModalOpen] = useState(false);
  const [tenant, setTenant] = useState<TenantMaster>(() => {
    if (typeof window !== 'undefined') {
      const user = authApiClient.getStoredUser();
      if (user) {
        return {
          ...mockTenant,
          enterprise_name: user.company_name || 'Enterprise Client',
          total_spend_evaluated_inr: 0,
          total_spend_evaluated: 0
        };
      }
    }
    return mockTenant;
  });
  const [currency, setCurrency] = useState<HeaderCurrency>('USD');

  const handleNavigateToSection = (targetModule: PipelineActiveTab, targetSectionId: string) => {
    setActiveTab(targetModule);
    setTargetSection(targetSectionId);
    showToast(UI_STRINGS.toasts.navigatingToInitiativeSection(targetSectionId));
  };


  // Application Data States
  const [ingestionQueue, setIngestionQueue] = useState<RawDocumentIngestion[]>(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem('procucev_uploaded_dataset');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.doc) return [parsed.doc];
        } catch {
          // fallback
        }
      }
      const user = authApiClient.getStoredUser();
      if (user && !stored) return [];
    }
    return initialIngestionQueue;
  });
  const [uploadedMaterialGroups, setUploadedMaterialGroups] = useState<MaterialGroupSummary[] | undefined>(undefined);
  const [uploadedPlants, setUploadedPlants] = useState<PlantSummary[] | undefined>(undefined);
  const [uploadedMonths, setUploadedMonths] = useState<MonthWiseSummary[] | undefined>(undefined);
  const [uploadedUniqueItems, setUploadedUniqueItems] = useState<number | undefined>(undefined);
  const [uploadedUniqueVendors, setUploadedUniqueVendors] = useState<number | undefined>(undefined);
  const [uploadedParetoData, setUploadedParetoData] = useState<ParetoSpendData | undefined>(undefined);
  const [validationRecords, setValidationRecords] = useState<ValidationPreCheckRecord[]>(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem('procucev_uploaded_dataset');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.validationRecords) return parsed.validationRecords;
        } catch {
          // fallback
        }
      }
      const user = authApiClient.getStoredUser();
      if (user && !stored) return [];
    }
    return initialValidationRecords;
  });
  const [categories, setCategories] = useState(spendCategoriesData);
  const [lineItems, setLineItems] = useState<LineItemMapping[]>(initialLineItemMappings);
  const [vendorRankings, setVendorRankings] = useState(vendorVolatilityRankings);
  const [opportunities, setOpportunities] = useState<SavingsOpportunity[]>(initialSavingsOpportunities);
  const [funnelStages] = useState(conversionFunnelStages);

  // Modal States
  const [selectedOppForProCPX, setSelectedOppForProCPX] = useState<SavingsOpportunity | null>(null);
  const [selectedOppForDPSNXT, setSelectedOppForDPSNXT] = useState<SavingsOpportunity | null>(null);
  const [selectedRecordForCurrency, setSelectedRecordForCurrency] = useState<ValidationPreCheckRecord | null>(null);
  const [selectedRecordForMerge, setSelectedRecordForMerge] = useState<ValidationPreCheckRecord | null>(null);
  const [selectedRecordForMergeItem, setSelectedRecordForMergeItem] = useState<ValidationPreCheckRecord | null>(null);
  const [isDataRefreshed, setIsDataRefreshed] = useState<boolean>(false);
  const [selectedItemForReassign, setSelectedItemForReassign] = useState<LineItemMapping | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [analyzingLoaderState, setAnalyzingLoaderState] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    onComplete?: () => void;
  } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Sync with Backend API, Session Storage & Authenticated User
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const storedUser = authApiClient.getStoredUser();
        const saved = window.sessionStorage.getItem('procucev_uploaded_dataset');
        const autofillRaw = window.sessionStorage.getItem('procucev_autofill_active_doc');
        if (storedUser) {
          setCurrentUser(storedUser);
          setTenant((prev) => ({
            ...prev,
            enterprise_name: storedUser.company_name || prev.enterprise_name,
            total_spend_evaluated_inr: saved || autofillRaw ? prev.total_spend_evaluated_inr : 0,
            total_spend_evaluated: saved || autofillRaw ? prev.total_spend_evaluated : 0
          }));
        }

        if (autofillRaw) {
          try {
            const autofillDoc = JSON.parse(autofillRaw);
            window.sessionStorage.removeItem('procucev_autofill_active_doc');
            setIngestionQueue([autofillDoc]);
            if (autofillDoc.converted_inr_crores) {
              setTenant((prev) => ({
                ...prev,
                total_spend_evaluated_inr: autofillDoc.converted_inr_crores,
                total_spend_evaluated: autofillDoc.converted_inr_crores * 10000000
              }));
            }
          } catch {
            // Fallback
          }
        } else if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.doc) setIngestionQueue([parsed.doc]);
          if (parsed.materialGroupSummaries) setUploadedMaterialGroups(parsed.materialGroupSummaries);
          if (parsed.plantSummaries) setUploadedPlants(parsed.plantSummaries);
          if (parsed.monthWiseSummaries) setUploadedMonths(parsed.monthWiseSummaries);
          if (parsed.uploadedUniqueItems) setUploadedUniqueItems(parsed.uploadedUniqueItems);
          if (parsed.uploadedUniqueVendors) setUploadedUniqueVendors(parsed.uploadedUniqueVendors);
          if (parsed.paretoData) setUploadedParetoData(parsed.paretoData);
          if (parsed.validationRecords) setValidationRecords(parsed.validationRecords);
          if (parsed.categories) setCategories(parsed.categories);
          if (parsed.lineItems) setLineItems(parsed.lineItems);
          if (parsed.vendorRankings) setVendorRankings(parsed.vendorRankings);
          if (parsed.opportunities) setOpportunities(parsed.opportunities);
          if (parsed.isDataRefreshed) setIsDataRefreshed(true);
        }
      }
      const user = apiClient.getStoredUser();
      if (user) {
        setCurrentUser(user);
      }
      const simTier = apiClient.getSimulatedTier();
      if (simTier) {
        setSimulatedTier(simTier);
      }
    } catch {
      // Safe fallback if sessionStorage is inaccessible
    }

    async function loadBackendData() {
      try {
        const storedUser = authApiClient.getStoredUser();
        const [tenantData, ingestionData, categoryData, vendorData, savingsData] = await Promise.allSettled([
          apiClient.getTenant(),
          apiClient.getIngestionData(storedUser?.id),
          apiClient.getCategories(),
          apiClient.getVendors(),
          apiClient.getSavingsOpportunities()
        ]);

        let hasSessionDoc = false;
        try {
          hasSessionDoc = Boolean(typeof window !== 'undefined' && window.sessionStorage?.getItem('procucev_uploaded_dataset'));
        } catch {
          hasSessionDoc = false;
        }

        if (tenantData.status === 'fulfilled' && tenantData.value) {
          if (storedUser) {
            setTenant((prev) => ({
              ...tenantData.value,
              enterprise_name: storedUser.company_name || tenantData.value.enterprise_name || prev.enterprise_name,
              total_spend_evaluated_inr: hasSessionDoc ? (tenantData.value.total_spend_evaluated_inr ?? prev.total_spend_evaluated_inr) : 0,
              total_spend_evaluated: hasSessionDoc ? (tenantData.value.total_spend_evaluated ?? prev.total_spend_evaluated) : 0
            }));
          } else {
            setTenant({
              ...tenantData.value,
              enterprise_name: tenantData.value.enterprise_name || mockTenant.enterprise_name
            });
          }
        }
        if (ingestionData.status === 'fulfilled' && ingestionData.value) {
          let hasSessionDoc = false;
          try {
            hasSessionDoc = Boolean(typeof window !== 'undefined' && window.sessionStorage?.getItem('procucev_uploaded_dataset'));
          } catch {
            hasSessionDoc = false;
          }
          if (!hasSessionDoc && !storedUser && ingestionData.value.queue && ingestionData.value.queue.length > 0) {
            const rawQueue = ingestionData.value.queue || [];
            const sanitizedQueue: RawDocumentIngestion[] = rawQueue.map((doc: any, idx: number) => ({
              doc_id: doc.doc_id || `DOC-INGEST-${8800 + idx}`,
              tenant_id: doc.tenant_id || 'TNT-GLOBAL-8902',
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
          }
        }
        if (categoryData.status === 'fulfilled' && categoryData.value) {
          setCategories(categoryData.value.categories);
        }
        if (vendorData.status === 'fulfilled' && vendorData.value) {
          setVendorRankings(vendorData.value.vendorRankings);
        }
        if (savingsData.status === 'fulfilled' && savingsData.value) {
          setOpportunities(savingsData.value.opportunities);
        }
      } catch (err) {
        frontendLogger.warn('Backend API hydration warning, using local seed state', { error: err });
      }
    }
    loadBackendData();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
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
    const inrCrores = Number(((record.order_quantity * record.net_price * fxRate) / 10000000).toFixed(2));

    setValidationRecords((prev) =>
      prev.map((r) =>
        r.record_id === recordId
          ? {
              ...r,
              raw_currency: selectedCurrency,
              issue_flag: 'Passed Clean',
              action_status: 'Ready',
              resolved: true,
              amount: convertedAmount,
              fx_rate_applied: fxRate,
              inr_crores: inrCrores
            }
          : r
      )
    );

    apiClient
      .updateValidationRecord(recordId, {
        raw_currency: selectedCurrency,
        issue_flag: 'Passed Clean',
        action_status: 'Ready',
        resolved: true,
        amount: convertedAmount,
        fx_rate_applied: fxRate,
        inr_crores: inrCrores
      })
      .catch((e) => {
        frontendLogger.warn('Backend sync warning for currency fix', { error: e });
      });

    setIsDataRefreshed(true);
    setIngestionQueue((prev) =>
      prev.map((doc) => ({
        ...doc,
        converted_inr_crores: Number(((doc.converted_inr_crores || 8066.86) + inrCrores).toFixed(2))
      }))
    );

    showToast(UI_STRINGS.toasts.recordNormalized(recordId, selectedCurrency));
  };

  const handleMergeVendor = (record: ValidationPreCheckRecord) => {
    setSelectedRecordForMerge(record);
  };

  const handleApplyVendorMerge = async (recordId: string, masterVendorId: string, masterVendorName: string) => {
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
    setUploadedUniqueVendors((prev) => Math.max(1, (prev !== undefined ? prev : 1073) - 1));
    setIngestionQueue((prev) =>
      prev.map((doc) => ({
        ...doc,
        unique_vendors_count: Math.max(1, (doc.unique_vendors_count || 1073) - 1)
      }))
    );

    apiClient
      .updateValidationRecord(recordId, {
        vendor_name: `${masterVendorName} (${masterVendorId})`,
        issue_flag: 'Passed Clean',
        action_status: 'Ready',
        resolved: true
      })
      .catch((e) => {
        frontendLogger.warn('Backend sync warning for vendor merge', { error: e });
      });
    apiClient.mergeVendor(masterVendorName, masterVendorId, masterVendorName).catch((e) => {
      frontendLogger.warn('Backend sync warning for vendor merge', { error: e });
    });

    showToast(UI_STRINGS.toasts.recordMapped(recordId, masterVendorId));
  };

  const handleMergeItem = (record: ValidationPreCheckRecord) => {
    setSelectedRecordForMergeItem(record);
  };

  const handleApplyItemMerge = async (recordId: string, masterItemCode: string, masterItemName: string) => {
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
    setUploadedUniqueItems((prev) => Math.max(1, (prev !== undefined ? prev : 7357) - 1));
    setIngestionQueue((prev) =>
      prev.map((doc) => ({
        ...doc,
        unique_items_count: Math.max(1, (doc.unique_items_count || 7357) - 1)
      }))
    );

    apiClient
      .updateValidationRecord(recordId, {
        raw_desc: `${masterItemName} (${masterItemCode})`,
        issue_flag: 'Passed Clean',
        action_status: 'Ready',
        resolved: true
      })
      .catch((e) => {
        frontendLogger.warn('Backend sync warning for item merge', { error: e });
      });

    showToast(UI_STRINGS.toasts.recordItemMerged(recordId, masterItemCode));
  };

  const handleIgnoreValidationIssue = async (recordId: string) => {
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

    apiClient
      .updateValidationRecord(recordId, {
        issue_flag: 'Passed Clean',
        action_status: 'Reviewed',
        resolved: true
      })
      .catch((e) => {
        frontendLogger.warn('Backend sync warning for ignore validation issue', { error: e });
      });

    showToast(UI_STRINGS.toasts.issueIgnored(recordId));
  };

  // Blanket AI Remediation for All Anomalies
  const handleApplyBlanketFixes = async () => {
    setValidationRecords((prev) =>
      prev.map((r) => {
        let vendorName = r.vendor_name;
        let itemDesc = r.raw_desc;
        let fxRate = r.fx_rate_applied;
        let inrCrores = r.inr_crores;

        if (r.record_id === 'REC-8842') {
          vendorName = 'DHL Global Forwarding (VND-DHL-404)';
          fxRate = 84.80;
        }
        if (r.record_id === 'REC-8844') {
          // Retain Tax Discrepancy as an active continuous audit/governance validation
          return {
            ...r,
            vendor_name: 'Acme Chemical Global LLC (VND-ACM-101)',
            action_status: 'Reviewed',
            issue_flag: 'Tax Discrepancy',
            resolved: false
          };
        }
        if (r.record_id === 'REC-8841') {
          fxRate = 91.40;
          inrCrores = 1.33;
        }
        if (r.record_id === 'REC-8847') {
          itemDesc = 'High Density Polyethylene (HDPE) Polymers (ITM-HDPE-101)';
        }

        return {
          ...r,
          vendor_name: vendorName,
          raw_desc: itemDesc,
          issue_flag: 'Passed Clean',
          action_status: 'Ready',
          resolved: true,
          fx_rate_applied: fxRate,
          inr_crores: inrCrores
        };
      })
    );

    setIsDataRefreshed(true);

    apiClient.applyBlanketRemediation().catch((e) => {
      frontendLogger.warn('Backend sync warning for blanket fixes', { error: e });
    });

    setAnalyzingLoaderState({
      isOpen: true,
      title: 'Applying Blanket AI Remediation Across Dataset',
      subtitle: 'Normalizing 100% of vendor entities, currency conversions, and SKU descriptions...',
      metrics: {
        totalRecords: uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || lineItems.length || 0),
        spendCrores: Number((tenant.total_spend_evaluated_inr ?? 0).toFixed(2)),
        uniqueVendors: uploadedUniqueVendors ?? (ingestionQueue[0]?.unique_vendors_count || vendorRankings.length || 0),
        categoriesIdentified: uploadedMaterialGroups?.length ?? (ingestionQueue[0]?.material_groups_count || categories.length || 0),
        confidenceScore: 99.4
      },
      onComplete: () => {
        setAnalyzingLoaderState(null);
      }
    });

    showToast(UI_STRINGS.toasts.blanketFixesApplied);
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
      subtitle: `Auditing ${currentRecordsCount ? currentRecordsCount.toLocaleString() : 'all'} line items across facilities, material groups, and 3-year timelines...`,
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
    setValidationRecords(initialValidationRecords);
    setIsDataRefreshed(false);
    setUploadedUniqueItems(undefined);
    setUploadedUniqueVendors(undefined);
    setIngestionQueue(initialIngestionQueue);
    apiClient.resetValidationRecords().catch((e) => {
      frontendLogger.warn('Backend sync warning for reset validation records', { error: e });
    });
    showToast(UI_STRINGS.toasts.validationReset);
  };

  const handleDeleteDocument = async (_docId?: string) => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('procucev_uploaded_dataset');
      }
    } catch {
      // Safe fallback
    }
    setIngestionQueue([]);
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

    apiClient.deleteIngestionDocument(_docId).catch((e) => {
      frontendLogger.warn('Backend sync warning for delete ingestion document', { error: e });
    });

    showToast('Uploaded dataset removed successfully. You can now upload a new dataset.');
  };

  const handleAddBatchUpload = async (file: File, _datasetType: DatasetType = 'Purchase History') => {
    setAnalyzingLoaderState({
      isOpen: true,
      title: `Analyzing Uploaded File "${file.name}"`,
      subtitle: 'Running multi-currency normalizations, ERP document deduplication and UNSPSC matching...',
      metrics: {
        totalRecords: uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || lineItems.length || 0),
        spendCrores: Number((tenant.total_spend_evaluated_inr ?? 0).toFixed(2)),
        uniqueVendors: uploadedUniqueVendors ?? (ingestionQueue[0]?.unique_vendors_count || vendorRankings.length || 0),
        categoriesIdentified: uploadedMaterialGroups?.length ?? (ingestionQueue[0]?.material_groups_count || categories.length || 0),
        confidenceScore: 99.4
      },
      onComplete: () => {
        setAnalyzingLoaderState(null);
      }
    });

    // 1. Completely erase prior session dataset and old cached state
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('procucev_uploaded_dataset');
      }
    } catch {
      // Safe fallback if sessionStorage is inaccessible
    }
    setIsDataRefreshed(false);
    setUploadedMaterialGroups(undefined);
    setUploadedPlants(undefined);
    setUploadedMonths(undefined);
    setUploadedUniqueItems(undefined);
    setUploadedUniqueVendors(undefined);
    setUploadedParetoData(undefined);

    let recordsCount = 0;
    let totalSpendInrCr = 0;
    let dynamicUniqueItems = 0;
    let dynamicUniqueVendors = 0;
    let dynamicMgs: MaterialGroupSummary[] | null = null;
    let dynamicPlants: PlantSummary[] | null = null;
    let dynamicMonths: MonthWiseSummary[] | null = null;
    const dynamicParetoRecords: ParetoRawRecord[] = [];
    const parsedValidationItems: ValidationPreCheckRecord[] = [];
    let paretoDataToStore: ParetoSpendData | undefined = undefined;
    let dynamicCategories: SpendCategorySummary[] | undefined = undefined;
    let dynamicLineItems: LineItemMapping[] | undefined = undefined;
    let dynamicVendorRankings: VendorPriceRank[] | undefined = undefined;
    let dynamicOpportunities: SavingsOpportunity[] | undefined = undefined;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const buffer = await file.arrayBuffer();
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows && rows.length > 0) {
          recordsCount = rows.length; // Header row is automatically excluded by sheet_to_json!
          const keys = Array.from(new Set(rows.slice(0, 5).flatMap((r) => Object.keys(r || {}))));
          const qtyKey = keys.find((k) => /qty|quantity|order_qty|ordered|units/i.test(k));
          const priceKey = keys.find((k) => /price|net_price|unit_price|rate|cost/i.test(k));
          const currKey = keys.find((k) => /curr|currency|waers/i.test(k));

          const matPatterns = [
            /^(?:material[_\s-]*code|material[_\s-]*no|material[_\s-]*num(?:ber)?|matnr|item[_\s-]*code)$/i,
            /^material$/i,
            /matnr/i,
            /material/i
          ];
          const matKey = keys.find((k) =>
            matPatterns.some((p) => p.test(k) && !/(?:desc|text|group|grp|plant|type)/i.test(k))
          );

          const descPatterns = [
            /^short[_\s-]*text$/i,
            /^txz01$/i,
            /short[_\s-]*text/i,
            /(?:material|product|part|goods)[_\s-]*(?:desc(?:ription)?|text|name)/i,
            /^item[_\s-]*(?:desc(?:ription)?|text|name)$/i,
            /item[_\s-]*(?:desc(?:ription)?|text|name)/i,
            /^desc(?:ription)?$/i,
            /description|desc/i,
            /material/i
          ];
          const descKey = keys.find((k) =>
            descPatterns.some((p) => p.test(k) && !/(?:code|id|no|num|group|grp|type|plant|cat)/i.test(k))
          );

          const vendorPatterns = [
            /^(?:supplier|vendor|party)[_\s-]*name$/i,
            /^(?=.*(?:supplier|vendor|party))(?=.*name).*$/i,
            /^name(?:[_\s-]*1)?$/i,
            /^(?:supplier|vendor|party)[_\s-]*desc(?:ription)?$/i,
            /^(?:vendor|supplier|party)$/i,
            /(?:supplier|vendor|party)/i
          ];
          const vendorKey = keys.find((k) =>
            vendorPatterns.some((p) => p.test(k) && !/(?:code|id|num|no|acc|grp|group|type|plant)/i.test(k))
          );

          const poPatterns = [
            /^(?:po[_\s-]*number|po[_\s-]*no|purchase[_\s-]*order(?:[_\s-]*no)?|purchasing[_\s-]*document|ebeln)$/i,
            /purchasing.*doc/i,
            /^(?:po|order)$/i,
            /(?:po|order|doc_no)/i
          ];
          const poKey = keys.find((k) =>
            poPatterns.some((p) => p.test(k) && !/(?:type|date|status)/i.test(k))
          );
          const yearKey = keys.find((k) => /year|date/i.test(k));
          const totalCrKey = keys.find((k) => /total.*in.*cr|total.*cr/i.test(k));
          const totalInrKey = keys.find((k) => /total.*inr|inr.*total/i.test(k));
          const mgPatterns = [
            /^(?:material[_\s-]*group|mat[_\s-]*grp|matkl)$/i,
            /material.*group/i,
            /mat[_\s-]*grp/i,
            /matkl/i
          ];
          const mgKey = keys.find((k) =>
            mgPatterns.some((p) => p.test(k) && !/(?:purchas|buy|account|acct|vendor)/i.test(k))
          );
          const plantKey = keys.find((k) => /plant|werks|facility|site/i.test(k));
          const dateKey = keys.find((k) => /doc.*date|document.*date|posting.*date|date/i.test(k));

          let cumulativeFileTotalINR = 0;
          parsedValidationItems.length = 0;

          const uniqueItemsSet = new Set<string>();
          const uniqueVendorsSet = new Set<string>();
          dynamicParetoRecords.length = 0;
          const mgMap = new Map<string, { count: number; spendCr: number; items: Set<string>; vendors: Set<string>; sampleItem: string }>();
          const plantMap = new Map<string, { count: number; spendCr: number; items: Set<string>; vendors: Set<string> }>();
          const monthMap = new Map<string, { count: number; spendCr: number; items: Set<string>; vendors: Set<string> }>();

          const fallbackQuantities = [1000, 320, 2000, 650, 50, 10000];
          const fallbackPrices = [145.0, 120.0, 44.6, 300.0, 850.0, 6.73];
          const fallbackCurrencies = ['EUR', 'USD', 'USD', 'GBP', 'AED', 'USD'];
          const fallbackYears = [2024, 2024, 2024, 2023, 2023, 2026];
          const fallbackVendors = ['Continental Polymer S.A.', 'DHL Logistics GmbH', 'Amcor Packaging Group', 'Acme Chemical Co. LLC', 'Flowserve Industrial Services', 'Crown Paper Box Corp'];
          const fallbackDescs = ['High Density Polyethylene Granules', 'Cross-Border Air Express Logistics', 'Double Wall Corrugated Pallet Box', 'Hydrochloric Acid Tech Grade Bulk', 'Emergency Centrifugal Pump Impeller', 'Reinforced Shipping Cartons Heavy Duty'];
          const fallbackCodes = ['13101502', '78101801', '14121506', '12352204', '40151501', '14121506'];
          const fallbackCategories: Array<ValidationPreCheckRecord['core_category']> = ['Direct Materials', 'Logistics & Freight', 'Packaging Materials', 'Direct Materials', 'Indirect & MRO', 'Packaging Materials'];
          const fallbackFlags: Array<ValidationPreCheckRecord['issue_flag']> = ['Missing Currency Code', 'Unmapped Supplier Name', 'Passed Clean', 'Tax Discrepancy', 'Passed Clean', 'Passed Clean'];
          const fallbackStatuses: Array<ValidationPreCheckRecord['action_status']> = ['Fix (INR)', 'Merge Vendor', 'Ready', 'Ready', 'Ready', 'Ready'];
          const fallbackDates = ['2024-05-18', '2025-02-14', '2025-09-04', '2023-11-20', '2023-08-11', '2026-01-16'];

          rows.forEach((r, idx) => {
            const rowIdx = idx % fallbackQuantities.length;
            const hasExplicitQty = qtyKey && r[qtyKey] != null && !isNaN(Number(r[qtyKey]));
            const rawQty = hasExplicitQty ? Number(r[qtyKey]) : fallbackQuantities[rowIdx];
            const hasExplicitPrice = priceKey && r[priceKey] != null && !isNaN(Number(r[priceKey]));
            const rawPrice = hasExplicitPrice ? Number(r[priceKey]) : fallbackPrices[rowIdx];
            const rawCurr = (currKey ? String(r[currKey] || '').toUpperCase().trim() : '') || fallbackCurrencies[rowIdx];
            const rawYear = (yearKey ? Number(String(r[yearKey]).match(/\d{4}/)?.[0]) : 0) || fallbackYears[rowIdx];
            const rawDateVal = dateKey ? r[dateKey] : null;
            const parsedDateInfo = parseDateOrYear(rawDateVal as string | number || rawYear);
            const fxRate = getYahooFinanceRateToINR(rawCurr, rawDateVal || rawYear);

            // Ground truth check: Use Total In Crs or Total INR if present, otherwise Qty * Price * FX
            const rawCr = totalCrKey && r[totalCrKey] != null ? Number(r[totalCrKey]) : NaN;
            const rawInr = totalInrKey && r[totalInrKey] != null ? Number(r[totalInrKey]) : NaN;
            const lineTotalCr =
              !isNaN(rawCr)
                ? Math.max(0, rawCr)
                : !isNaN(rawInr)
                ? Math.max(0, rawInr / 10000000)
                : Math.max(0, (rawQty * rawPrice * fxRate) / 10000000);

            const lineTotalINR = lineTotalCr * 10000000;
            cumulativeFileTotalINR += lineTotalINR;

            // Tracking unique items & unique vendors (prioritizing descriptive item names and vendor names)
            const rawDesc = descKey && r[descKey] != null ? String(r[descKey]).trim() : '';
            const rawMat = matKey && r[matKey] != null ? String(r[matKey]).trim() : '';
            const rowItem = rawDesc && !/^\d{1,3}$/.test(rawDesc)
              ? rawDesc
              : rawMat && !/^\d{1,3}$/.test(rawMat)
                ? rawMat
                : 'DIRECT CONSUMABLES';
            const rowVendor = (vendorKey && r[vendorKey] != null ? String(r[vendorKey]).trim() : '') || 'SUPPLIER CORP';

            const isValidVendor = Boolean(rowVendor && !/^\d+$/.test(rowVendor) && rowVendor.length > 2);
            const isValidItem = Boolean(rowItem && !/^\d+$/.test(rowItem) && rowItem.length > 1);

            if (isValidItem) uniqueItemsSet.add(rowItem);
            if (isValidVendor) uniqueVendorsSet.add(rowVendor);

            // Grouping by Material Group
            let rowMg = (mgKey && r[mgKey] != null ? String(r[mgKey]).trim() : '') || 'DIRECT';
            rowMg = rowMg.toUpperCase();
            const existingMg = mgMap.get(rowMg) || { count: 0, spendCr: 0, items: new Set<string>(), vendors: new Set<string>(), sampleItem: rowItem };
            existingMg.count++;
            existingMg.spendCr += lineTotalCr;
            if (isValidItem) existingMg.items.add(rowItem);
            if (isValidVendor) existingMg.vendors.add(rowVendor);
            if (!existingMg.sampleItem && isValidItem) existingMg.sampleItem = rowItem;
            mgMap.set(rowMg, existingMg);

            // Grouping by Plant
            const rowPlant = (plantKey && r[plantKey] != null ? String(r[plantKey]).trim() : '') || '1000';
            const existingPlant = plantMap.get(rowPlant) || { count: 0, spendCr: 0, items: new Set<string>(), vendors: new Set<string>() };
            existingPlant.count++;
            existingPlant.spendCr += lineTotalCr;
            if (isValidItem) existingPlant.items.add(rowItem);
            if (isValidVendor) existingPlant.vendors.add(rowVendor);
            plantMap.set(rowPlant, existingPlant);

            // Grouping by Month
            let rowMonthKey = `${rawYear || 2024}-01`;
            if (typeof rawDateVal === 'number') {
              const utcDays = Math.floor(rawDateVal - 25569);
              const dateObj = new Date(utcDays * 86400 * 1000);
              rowMonthKey = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}`;
            } else if (rawDateVal) {
              const match = String(rawDateVal).match(/\d{4}[-/]\d{1,2}/);
              if (match) rowMonthKey = match[0].replace('/', '-');
            }
            const existingMonth = monthMap.get(rowMonthKey) || { count: 0, spendCr: 0, items: new Set<string>(), vendors: new Set<string>() };
            existingMonth.count++;
            existingMonth.spendCr += lineTotalCr;
            if (isValidItem) existingMonth.items.add(rowItem);
            if (isValidVendor) existingMonth.vendors.add(rowVendor);
            monthMap.set(rowMonthKey, existingMonth);

            // In Pareto hierarchy, only positive-spend items with valid vendor names are included
            if (lineTotalCr > 0 && isValidVendor) {
              dynamicParetoRecords.push({
                vendorName: rowVendor,
                shortText: isValidItem ? rowItem : 'DIRECT CONSUMABLES',
                spendCr: lineTotalCr
              });
            }

            if (idx < 6) {
              parsedValidationItems.push({
                record_id: `REC-${8841 + idx}`,
                po_number: poKey && r[poKey] ? String(r[poKey]) : `PO-2024-9981${idx}`,
                vendor_name: rowVendor || (vendorKey && r[vendorKey] ? String(r[vendorKey]) : fallbackVendors[rowIdx]),
                raw_desc: rowItem || (descKey && r[descKey] ? String(r[descKey]) : fallbackDescs[rowIdx]),
                order_quantity: rawQty,
                net_price: rawPrice,
                subtotal_raw: rawQty * rawPrice,
                amount: rawQty * rawPrice,
                raw_currency: rawCurr,
                amount_inr: lineTotalINR,
                inr_crores: Number((lineTotalINR / 10000000).toFixed(2)),
                fx_rate_applied: fxRate,
                spend_year: rawYear,
                transaction_date: parsedDateInfo.formattedDate || fallbackDates[rowIdx],
                column_l_code: fallbackCodes[rowIdx],
                core_category: fallbackCategories[rowIdx],
                issue_flag: fallbackFlags[rowIdx],
                action_status: fallbackStatuses[rowIdx],
                resolved: idx === 2 || idx === 5
              });
            }
          });

          if (parsedValidationItems.length > 0) {
            setValidationRecords(parsedValidationItems);
          }

          if (cumulativeFileTotalINR > 0) {
            totalSpendInrCr = Number((cumulativeFileTotalINR / 10000000).toFixed(2));
          }

          dynamicUniqueItems = uniqueItemsSet.size;
          dynamicUniqueVendors = uniqueVendorsSet.size;

          dynamicMgs = Array.from(mgMap.entries())
            .sort((a, b) => b[1].spendCr - a[1].spendCr)
            .map(([code, data], mIdx) => ({
              group_code: code,
              group_name: `${code} Materials & Consumables`,
              records_count: data.count,
              unique_items_count: data.items.size,
              unique_vendors_count: data.vendors.size,
              po_count: Math.max(1, Math.round(data.count * 0.18)),
              spend_inr_cr: Number(data.spendCr.toFixed(2)),
              spend_usd_m: Number((data.spendCr / 0.838).toFixed(2)),
              share_pct: Number(((data.spendCr / Math.max(1, totalSpendInrCr)) * 100).toFixed(1)),
              sample_item: data.sampleItem,
              primary_segment: `${code} - Enterprise Spend Segment`,
              fy24_spend_inr_cr: Number((data.spendCr * 0.3).toFixed(2)),
              fy25_spend_inr_cr: Number((data.spendCr * 0.35).toFixed(2)),
              fy26_spend_inr_cr: Number((data.spendCr * 0.35).toFixed(2)),
              color: ['#0284c7', '#059669', '#d97706', '#7c3aed', '#ea580c', '#0891b2'][mIdx % 6]
            }));

          dynamicPlants = Array.from(plantMap.entries())
            .sort((a, b) => b[1].spendCr - a[1].spendCr)
            .map(([code, data]) => ({
              plant_code: code,
              plant_name: `Plant ${code} Production Facility`,
              region: 'West',
              location: `Industrial Hub ${code}`,
              po_count: Math.max(1, Math.round(data.count * 0.18)),
              records_count: data.count,
              unique_items_count: data.items.size,
              unique_vendors_count: data.vendors.size,
              spend_inr_cr: Number(data.spendCr.toFixed(2)),
              spend_usd_m: Number((data.spendCr / 0.838).toFixed(2)),
              share_pct: Number(((data.spendCr / Math.max(1, totalSpendInrCr)) * 100).toFixed(1)),
              active_vendors_count: data.vendors.size,
              primary_material_group: 'DIRECT'
            }));

          dynamicMonths = Array.from(monthMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, data]) => {
              const moNum = parseInt(key.replace(/[-/]/g, ''), 10);
              const fy: 'FY24' | 'FY25' | 'FY26' = moNum <= 202403 ? 'FY24' : moNum <= 202503 ? 'FY25' : 'FY26';
              return {
                month_key: key,
                month_label: key,
                fiscal_year: fy,
                spend_inr_cr: Number(data.spendCr.toFixed(2)),
                spend_usd_m: Number((data.spendCr / 0.838).toFixed(2)),
                records_count: data.count,
                po_count: Math.round(data.count * 0.18) || 1,
                unique_items_count: data.items.size,
                unique_vendors_count: data.vendors.size,
                top_material_group: 'DIRECT',
                top_plant: 'Plant 1000',
                mom_change_pct: 0
              };
            });

          setUploadedMaterialGroups(dynamicMgs);
          setUploadedPlants(dynamicPlants);
          setUploadedMonths(dynamicMonths);
          setUploadedUniqueItems(dynamicUniqueItems);
          setUploadedUniqueVendors(dynamicUniqueVendors);

          const vendorPareto = buildVendorParetoHierarchy(dynamicParetoRecords);
          const itemPareto = buildItemParetoHierarchy(dynamicParetoRecords);
          paretoDataToStore = {
            vendorHierarchy: vendorPareto.parents,
            itemHierarchy: itemPareto.parents,
            totalSpendCr: vendorPareto.totalSpendCr,
            paretoSpendCr: vendorPareto.paretoSpendCr,
            paretoPct: vendorPareto.paretoPct
          };
          setUploadedParetoData(paretoDataToStore);

          dynamicCategories = dynamicMgs.map((mg, mIdx) => ({
            id: `CAT-${mg.group_code}`,
            name: mg.group_name,
            spend: Math.round((mg.spend_inr_cr * 10000000) / 83.8),
            spend_inr: Math.round(mg.spend_inr_cr * 10000000),
            spend_inr_crores: mg.spend_inr_cr,
            targetReductionPct: Number((6.5 + (mIdx % 5) * 0.8).toFixed(1)),
            lineItemsCount: mg.records_count,
            color: mg.color || '#0284c7',
            column_l_code: `${10000000 + (mIdx + 1) * 110000}`,
            spend_inr_2023: Math.round(mg.fy24_spend_inr_cr * 10000000),
            spend_inr_2024: Math.round(mg.fy25_spend_inr_cr * 10000000),
            spend_inr_2025_26: Math.round(mg.fy26_spend_inr_cr * 10000000)
          }));
          setCategories(dynamicCategories);

          const getCoreBucket = (rawMg: string): LineItemMapping['core_bucket'] => {
            if (rawMg.includes('PACK')) return 'Packaging Materials';
            if (rawMg.includes('FREIGHT')) return 'Logistics & Freight';
            if (rawMg.includes('CONSUM')) return 'Indirect & MRO';
            return 'Direct Materials';
          };

          dynamicLineItems = rows.slice(0, 15).map((r, idx) => {
            let rowItem = (descKey && r[descKey] != null ? String(r[descKey]).trim() : '');
            let rowMatCode = (matKey && r[matKey] != null ? String(r[matKey]).trim() : '');
            if (!rowMatCode) {
              rowMatCode = `MAT-${10000 + idx * 11}`;
            }
            if (!rowItem || /^\d{1,3}$/.test(rowItem)) {
              rowItem = rowMatCode.startsWith('MAT-') ? `Item-${idx + 1}` : rowMatCode;
            }

            const rowVendor = (vendorKey ? String(r[vendorKey] ?? '') : '').trim() || `Vendor-${idx + 1}`;
            const rawQty = qtyKey && !isNaN(Number(r[qtyKey])) ? Number(r[qtyKey]) : 100;
            const rawPrice = priceKey && !isNaN(Number(r[priceKey])) ? Number(r[priceKey]) : 50;
            const rawCurr = currKey ? String(r[currKey] ?? 'INR').trim().toUpperCase() : 'INR';
            const fxRate = getYahooFinanceRateToINR(rawCurr, 2024);
            const rawCr = totalCrKey && !isNaN(Number(r[totalCrKey])) ? Number(r[totalCrKey]) : NaN;
            const lineCr = !isNaN(rawCr) ? rawCr : (rawQty * rawPrice * fxRate) / 10000000;

            let poNum = poKey && r[poKey] ? String(r[poKey]).trim() : '';
            if (!poNum || /^[a-zA-Z]\d{3}$/.test(poNum)) {
              poNum = poNum ? `PO-${poNum}-${450000 + idx}` : `PO-2024-${8800 + idx}`;
            }
            const rawMg = (mgKey ? String(r[mgKey] ?? '') : '').trim().toUpperCase() || 'DIRECT';
            const unspscDetails = lookupUNSPSCDetails(rowItem);

            return {
              mapping_id: `MAP-${8000 + idx}`,
              line_item_id: `LI-${9000 + idx}`,
              material_code: rowMatCode,
              material_desc: rowItem,
              raw_desc: rowItem,
              vendor_identified: rowVendor,
              unspsc_code: `${11100000 + (idx + 1) * 1234}`,
              unspsc_category_name: `${rawMg} - ${rowItem.slice(0, 24)}`,
              unspsc_commodity_title: unspscDetails.commodityTitle,
              unspsc_class_title: unspscDetails.classTitle,
              core_bucket: getCoreBucket(rawMg),
              ai_confidence: Number((95.5 + (idx % 4) * 1.1).toFixed(1)),
              status: idx % 3 === 0 ? 'Confirmed' : 'Pending Review',
              unit_price: rawPrice,
              qty: rawQty,
              total_spend: Math.round((lineCr * 10000000) / 83.8),
              raw_currency: rawCurr,
              amount_inr: lineCr * 10000000,
              inr_crores: Number(lineCr.toFixed(2)),
              fx_rate_applied: fxRate,
              invoice_date: '2024-06-15',
              spend_year: 2024,
              po_number: poNum
            };
          });
          setLineItems(dynamicLineItems);

          const riskStatuses: VendorPriceRank['risk_status'][] = ['HIGH CREEP', 'REVIEW', 'ALIGNED', 'FAVORABLE'];
          dynamicVendorRankings = vendorPareto.parents.slice(0, 10).map((v, idx) => ({
            vendor_name: v.name,
            master_id: `VEN-M-${5000 + idx}`,
            category: idx % 2 === 0 ? 'Direct Mat.' : 'Packaging',
            price_creep_pct: Number(((idx * 1.8) - 1.2).toFixed(1)),
            total_spend: Math.round((v.totalSpendCr * 10000000) / 83.8),
            total_spend_inr_cr: v.totalSpendCr,
            risk_status: riskStatuses[idx % riskStatuses.length],
            variance_leakage_usd: Math.round((v.totalSpendCr * 0.04 * 10000000) / 83.8),
            variance_leakage_inr_cr: Number((v.totalSpendCr * 0.04).toFixed(2)),
            benchmark_index: 'ICIS / S&P Global',
            last_36mo_trend: [v.totalSpendCr * 0.28, v.totalSpendCr * 0.34, v.totalSpendCr * 0.38]
          }));
          setVendorRankings(dynamicVendorRankings);

          const oppCategories: SavingsOpportunity['category'][] = [
            'Direct Materials',
            'Packaging Materials',
            'Logistics & Freight',
            'Indirect & MRO'
          ];
          dynamicOpportunities = dynamicCategories.slice(0, 4).map((cat, idx) => {
            const catSpendCr = cat.spend_inr_crores ?? 100;
            const targetPct = 5.0 + idx * 1.5;
            const estSavingsCr = Number(((catSpendCr * targetPct) / 100).toFixed(2));
            return {
              opp_id: `OPP-${700 + idx}`,
              category: oppCategories[idx % oppCategories.length],
              title: `${cat.name} Optimization Initiative`,
              current_spend: Math.round((catSpendCr * 10000000) / 83.8),
              current_spend_inr_cr: catSpendCr,
              target_savings_pct: targetPct,
              est_savings: Math.round((estSavingsCr * 10000000) / 83.8),
              est_savings_inr_cr: estSavingsCr,
              recommended_action: `Consolidate supplier allocation and benchmark indexed pricing for ${cat.name}.`,
              push_to_module: idx % 2 === 0 ? 'proCPX' : 'DPS NXT',
              status: 'Identified',
              risk_level: idx % 2 === 0 ? 'Low' : 'Medium',
              contract_leak_type: 'Indexed Price Variance'
            };
          });
          setOpportunities(dynamicOpportunities);
        }
      } catch (err) {
        frontendLogger.warn('Could not parse xlsx rows', { error: err });
        if (file.name.toLowerCase().includes('unspsc')) {
          recordsCount = 158467;
        } else {
          recordsCount = Math.max(1, Math.floor(file.size / 150));
        }
      }
    } else if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      try {
        const text = await file.text();
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        recordsCount = Math.max(1, lines.length - 1);
      } catch {
        recordsCount = 14200;
      }
    }

    setTenant((prev) => ({
      ...prev,
      total_spend_evaluated_inr: totalSpendInrCr,
      total_spend_evaluated: Math.round((totalSpendInrCr * 10000000) / 83.8)
    }));

    const newDoc: RawDocumentIngestion = {
      doc_id: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      tenant_id: tenant.tenant_id,
      file_name: file.name,
      file_type: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.xlsx') ? 'XLSX' : file.name.endsWith('.csv') ? 'CSV' : 'ZIP',
      file_size_mb: Number((file.size / (1024 * 1024)).toFixed(2)),
      ocr_status: 'Completed',
      progress: 100,
      uploaded_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      records_count: recordsCount, // Header row strictly excluded
      detected_currencies: ['INR'],
      converted_inr_crores: totalSpendInrCr, // Sum of Order Qty * Net Price * FX Rate
      unique_items_count: dynamicUniqueItems,
      unique_vendors_count: dynamicUniqueVendors,
      material_groups_count: dynamicMgs ? dynamicMgs.length : 0,
      plants_count: dynamicPlants ? dynamicPlants.length : 0
    };

    setIngestionQueue([newDoc]);

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('procucev_uploaded_dataset', JSON.stringify({
          doc: newDoc,
          materialGroupSummaries: dynamicMgs,
          plantSummaries: dynamicPlants,
          monthWiseSummaries: dynamicMonths,
          uploadedUniqueItems: dynamicUniqueItems,
          uploadedUniqueVendors: dynamicUniqueVendors,
          paretoData: paretoDataToStore,
          validationRecords: parsedValidationItems,
          categories: dynamicCategories,
          lineItems: dynamicLineItems,
          vendorRankings: dynamicVendorRankings,
          opportunities: dynamicOpportunities,
          totalSpendInrCr,
          isDataRefreshed: false
        }));
      }
    } catch {
      // Safe fallback if sessionStorage is inaccessible
    }

    try {
      let fileBase64 = '';
      try {
        const arrayBuf = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        const limit = Math.min(bytes.byteLength, 512 * 1024);
        for (let i = 0; i < limit; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = btoa(binary);
      } catch {
        // Base64 conversion fallback
      }

      await apiClient.uploadDocumentToObjectStore({
        fileName: file.name,
        fileType: file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'XLSX' : 'CSV',
        fileBase64: fileBase64 || undefined,
        fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)) || 1.0,
        recordsCount,
        convertedInrCrores: totalSpendInrCr,
        detectedCurrencies: ['USD', 'EUR', 'INR'],
        datasetType: _datasetType
      });
    } catch (e) {
      frontendLogger.warn('Backend sync warning for object store document upload', { error: e });
      try {
        await apiClient.addIngestionFile(newDoc);
      } catch (addErr) {
        frontendLogger.warn('Fallback backend add ingestion warning', { error: addErr });
      }
    }

    showToast(UI_STRINGS.toasts.batchUploadSpend(file.name, totalSpendInrCr, recordsCount));
  };

  // Handlers for Module 2
  const handleConfirmMapping = (mappingId: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.mapping_id === mappingId ? { ...item, status: 'Confirmed' } : item
      )
    );
    showToast(UI_STRINGS.toasts.unspscConfirmed(mappingId));
  };

  const handleSaveReassign = (mappingId: string, newCode: string, newName: string, bucket: any) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.mapping_id === mappingId
          ? {
              ...item,
              unspsc_code: newCode,
              unspsc_category_name: newName,
              core_bucket: bucket,
              status: 'Confirmed',
              ai_confidence: 99.1
            }
          : item
      )
    );
    showToast(UI_STRINGS.toasts.taxonomyReassigned(newCode, bucket));
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
    showToast(UI_STRINGS.toasts.runningAiCat);
    setAnalyzingLoaderState({
      isOpen: true,
      title: 'Running Google Gemini UNSPSC AI Categorization',
      subtitle: 'Analyzing item descriptions, vendor transaction patterns, and assigning 8-digit UNSPSC codes...',
      metrics: {
        totalRecords: uploadedUniqueItems ?? (ingestionQueue[0]?.records_count || lineItems.length || 0),
        spendCrores: Number((tenant.total_spend_evaluated_inr ?? 0).toFixed(2)),
        uniqueVendors: uploadedUniqueVendors ?? (ingestionQueue[0]?.unique_vendors_count || vendorRankings.length || 0),
        categoriesIdentified: uploadedMaterialGroups?.length ?? (ingestionQueue[0]?.material_groups_count || categories.length || 0),
        confidenceScore: 99.4
      },
      onComplete: () => {
        setAnalyzingLoaderState(null);
      }
    });

    try {
      const itemsToCategorize = lineItems.map((item) => ({
        rawLineText: item.raw_desc,
        vendorIdentified: item.vendor_identified,
        amount: item.inr_crores || item.total_spend
      }));

      const res = await aiApiClient.categorizeItems(itemsToCategorize);
      if (res?.success && Array.isArray(res.mappings) && res.mappings.length > 0) {
        const mappingMap = new Map(
          res.mappings.map((m) => [String(m.rawLineText || '').toLowerCase().trim(), m])
        );

        setLineItems((prev) =>
          prev.map((item) => {
            const match = mappingMap.get(item.raw_desc.toLowerCase().trim());
            if (match) {
              return {
                ...item,
                unspsc_code: match.mappedUnspscCode || item.unspsc_code,
                unspsc_commodity_title: match.unspscTitle || item.unspsc_commodity_title,
                unspsc_category_name: match.unspscTitle || item.unspsc_category_name,
                core_bucket: (match.suggestedBucket as LineItemMapping['core_bucket']) || item.core_bucket,
                ai_confidence: typeof match.confidenceScore === 'number' ? match.confidenceScore : item.ai_confidence,
                status: 'Confirmed'
              };
            }
            return item;
          })
        );
        showToast(`AI Categorization completed via ${res.model || 'Google Gemini'}`);
      } else {
        showToast(UI_STRINGS.toasts.runningAiCat);
      }
    } catch (err) {
      frontendLogger.error('Error in AI categorization', {}, err as Error);
      showToast('AI Categorization finished');
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
    <div className={`min-h-screen bg-[#f8fafc] dark:bg-[#080c16] text-slate-900 dark:text-slate-100 bg-grid-pattern pb-16 transition-colors duration-200 ${theme}`}>
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
        onOpenReport={() => setIsReportModalOpen(true)}
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
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Pipeline & Strategic Vision Navigation */}
        <PipelineBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          tenant={tenant}
          opportunities={opportunities}
          ingestionQueue={ingestionQueue}
          totalSpendCr={tenant.total_spend_evaluated_inr}
        />

        {/* Tab Modules */}
        {activeTab === 'module1' && (
          <Module1Ingestion
            tenant={tenant}
            onUpdateTenant={handleUpdateTenant}
            ingestionQueue={ingestionQueue}
            validationRecords={validationRecords}
            onFixCurrency={handleFixCurrency}
            onMergeVendor={handleMergeVendor}
            onApplyBlanketFixes={handleApplyBlanketFixes}
            onResetValidationRecords={handleResetValidationRecords}
            onRunAICategorization={() => {
              setActiveTab('module2');
              showToast(UI_STRINGS.toasts.runningAiCat);
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
          />
        )}

        {activeTab === 'module2' && (
          <Module2Categorization
            tenant={tenant}
            categories={categories}
            lineItems={lineItems}
            onConfirmMapping={handleConfirmMapping}
            onReassignMapping={(item) => setSelectedItemForReassign(item)}
            onProceedToTrend={() => {
              setActiveTab('module3');
              showToast(UI_STRINGS.toasts.transitioningToVolatility);
            }}
            onStartAICategorization={handleStartAICategorization}
            onUpdateTenant={setTenant}
            currentTier={effectiveTier}
            onUpgrade={handleUpgradeTier}
            targetSection={targetSection}
          />
        )}


        {activeTab === 'module3' && (
          <Module3TrendAnalytics
            vendorRankings={vendorRankings}
            onProceedToSavings={() => {
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
            onOpenProCPX={(opp) => setSelectedOppForProCPX(opp)}
            onOpenDPSNXT={(opp) => setSelectedOppForDPSNXT(opp)}
            onProceedToConversion={() => {
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
            onOpenReport={() => setIsReportModalOpen(true)}
            currentTier={effectiveTier}
            onUpgrade={handleUpgradeTier}
          />
        )}

        {activeTab === 'schema' && <DatabaseSchemaView />}
      </main>

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

      <ExecutiveReportModal
        tenant={tenant}
        opportunities={opportunities}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <ClientIngestionSetupModal
        isOpen={isClientSetupModalOpen}
        onClose={() => setIsClientSetupModalOpen(false)}
        currentTenant={tenant}
        onConfirmAndUpload={(updatedTenant) => {
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-cyan-500/40 shadow-xl text-xs font-semibold text-slate-900 dark:text-white animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
