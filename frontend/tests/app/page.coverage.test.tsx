import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import * as XLSX from 'xlsx';
import Home from '../../src/app/page';
import { apiClient, aiApiClient, authApiClient } from '@/utils/api';
import { assessmentApiClient } from '@/utils/assessmentApi';
import { orchestrationApi } from '@/utils/orchestrationApi';
import { getTaxonomyLoadState, loadUNSPSCTaxonomy } from '@/data/unspscTaxonomy';
import { frontendLogger } from '@/utils/logger';
import { UI_STRINGS } from '@/constants/uiStrings';
import { mockTenant, conversionFunnelStages } from '../fixtures/mockData';
import { EMPTY_TENANT } from '@/constants/app';
import type { AssessmentRecord, CustomerRecord, OperatingModeConfig } from '@/types/assessment';
import type { MaterialMappingEntry } from '../../src/types/module2MaterialMapping';
import type {
  AnalysisJob,
  LineItemMapping,
  Module1CanonicalViewModel,
  RawDocumentIngestion,
  ReportVersion,
  SavingsOpportunity,
  SpendCategorySummary,
  TenantMaster,
  UserProfile,
  ValidationPreCheckRecord,
  VendorPriceRank
} from '@/types';

// Shared state for the child-component harnesses. Each harness records the props the page passes to it,
// so tests can invoke the page's own handlers without rendering the heavy child UI.
const mocks = vi.hoisted(() => {
  const props: Record<string, Record<string, unknown>> = {};
  const harness = (
    create: typeof import('react').createElement,
    key: string,
    testId: string
  ) => (componentProps: Record<string, unknown>) => {
    props[key] = componentProps;
    return create('div', { 'data-testid': testId });
  };
  return {
    props,
    harness,
    saveModule2MaterialMappings: vi.fn(),
    routerPush: vi.fn(),
    useRouter: vi.fn(),
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => mocks.useRouter()
}));

vi.mock('@/utils/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/logger')>();
  return { ...actual, frontendLogger: mocks.logger, logger: mocks.logger };
});

vi.mock('@/utils/api', () => ({
  apiClient: {
    getProcurementCategoryMappings: vi.fn(),
    getConversionStages: vi.fn(),
    getTenant: vi.fn(),
    updateTenant: vi.fn(),
    getCurrencyRates: vi.fn(),
    getCurrencyConversion: vi.fn(),
    getCategories: vi.fn(),
    getVendors: vi.fn(),
    getSavingsOpportunities: vi.fn(),
    deployOpportunity: vi.fn(),
    getStoredUser: vi.fn(),
    getSimulatedTier: vi.fn(),
    setSimulatedTier: vi.fn(),
    getCanonicalModule1: vi.fn(),
    getModule2CanonicalLineItems: vi.fn(),
    getIngestionData: vi.fn(),
    uploadDocumentToObjectStore: vi.fn(),
    updateValidationRecord: vi.fn(),
    applyBlanketRemediation: vi.fn(),
    resetValidationRecords: vi.fn(),
    deleteIngestionDocument: vi.fn(),
    mergeVendor: vi.fn()
  },
  aiApiClient: { categorizeItems: vi.fn() },
  authApiClient: {
    getStoredUser: vi.fn(),
    getStoredToken: vi.fn(),
    clearStoredSession: vi.fn()
  }
}));

vi.mock('@/utils/module2MappingApi', () => ({
  saveModule2MaterialMappings: mocks.saveModule2MaterialMappings
}));

vi.mock('@/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getOperatingMode: vi.fn(),
    getAssessments: vi.fn(),
    getAssessmentById: vi.fn()
  }
}));

vi.mock('@/utils/orchestrationApi', () => ({
  orchestrationApi: { getJobs: vi.fn(), getJobDetails: vi.fn() }
}));

vi.mock('@/data/unspscTaxonomy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/unspscTaxonomy')>();
  return { ...actual, loadUNSPSCTaxonomy: vi.fn(), getTaxonomyLoadState: vi.fn() };
});

vi.mock('@/hooks/useUNSPSCTaxonomy', () => ({
  useUNSPSCTaxonomy: vi.fn()
}));

vi.mock('@/components/Header', async () => {
  const { createElement } = await import('react');
  return { Header: mocks.harness(createElement, 'header', 'harness-header') };
});

vi.mock('@/components/PipelineBar', async () => {
  const { createElement } = await import('react');
  return { PipelineBar: mocks.harness(createElement, 'pipeline', 'harness-pipeline') };
});

vi.mock('@/components/Module1Ingestion', async () => {
  const { createElement } = await import('react');
  return {
    Module1Ingestion: (componentProps: Record<string, unknown>) => {
      mocks.props.module1 = componentProps;
      // The summary anchor lets the refresh handler exercise its scroll-into-view branch.
      return createElement('section', {
        id: 'document-summary-section',
        'data-testid': 'harness-module1',
        ref: componentProps.summarySectionRef
      });
    }
  };
});

vi.mock('@/components/Module2Categorization', async () => {
  const { createElement } = await import('react');
  return { Module2Categorization: mocks.harness(createElement, 'module2', 'harness-module2') };
});

vi.mock('@/components/Module3TrendAnalytics', async () => {
  const { createElement } = await import('react');
  return { Module3TrendAnalytics: mocks.harness(createElement, 'module3', 'harness-module3') };
});

vi.mock('@/components/Module4SavingsEngine', async () => {
  const { createElement } = await import('react');
  return { Module4SavingsEngine: mocks.harness(createElement, 'module4', 'harness-module4') };
});

vi.mock('@/components/Module5ConversionMatrix', async () => {
  const { createElement } = await import('react');
  return { Module5ConversionMatrix: mocks.harness(createElement, 'module5', 'harness-module5') };
});

vi.mock('@/components/DatabaseSchemaView', async () => {
  const { createElement } = await import('react');
  return { DatabaseSchemaView: mocks.harness(createElement, 'schema', 'harness-schema') };
});

vi.mock('@/components/AnalyzingLoader', async () => {
  const { createElement } = await import('react');
  return { AnalyzingLoader: mocks.harness(createElement, 'analyzingLoader', 'harness-analyzing-loader') };
});

vi.mock('@/components/assessment/AssessmentWorkspace', async () => {
  const { createElement } = await import('react');
  return {
    AssessmentWorkspace: mocks.harness(createElement, 'assessmentWorkspace', 'harness-assessment-workspace')
  };
});

vi.mock('@/components/orchestration/CustomerAnalysisStatusCard', async () => {
  const { createElement } = await import('react');
  return {
    CustomerAnalysisStatusCard: mocks.harness(createElement, 'customerAnalysis', 'harness-analysis-status')
  };
});

vi.mock('@/components/orchestration/ReportAcknowledgementSection', async () => {
  const { createElement } = await import('react');
  return {
    ReportAcknowledgementSection: mocks.harness(createElement, 'reportAcknowledgement', 'harness-report-ack')
  };
});

vi.mock('@/components/presentation/ExecutiveOpportunityBriefView', async () => {
  const { createElement } = await import('react');
  return {
    ExecutiveOpportunityBriefView: mocks.harness(createElement, 'briefView', 'harness-brief-view')
  };
});

vi.mock('@/components/modals/ProCPXModal', async () => {
  const { createElement } = await import('react');
  return { ProCPXModal: mocks.harness(createElement, 'proCPX', 'harness-procpx') };
});

vi.mock('@/components/modals/DPSNXTModal', async () => {
  const { createElement } = await import('react');
  return { DPSNXTModal: mocks.harness(createElement, 'dpsNXT', 'harness-dpsnxt') };
});

vi.mock('@/components/modals/FixCurrencyModal', async () => {
  const { createElement } = await import('react');
  return { FixCurrencyModal: mocks.harness(createElement, 'fixCurrency', 'harness-fix-currency') };
});

vi.mock('@/components/modals/MergeVendorModal', async () => {
  const { createElement } = await import('react');
  return { MergeVendorModal: mocks.harness(createElement, 'mergeVendor', 'harness-merge-vendor') };
});

vi.mock('@/components/modals/MergeItemModal', async () => {
  const { createElement } = await import('react');
  return { MergeItemModal: mocks.harness(createElement, 'mergeItem', 'harness-merge-item') };
});

vi.mock('@/components/modals/ReassignModal', async () => {
  const { createElement } = await import('react');
  return { ReassignModal: mocks.harness(createElement, 'reassign', 'harness-reassign') };
});

vi.mock('@/components/modals/ClientIngestionSetupModal', async () => {
  const { createElement } = await import('react');
  return { ClientIngestionSetupModal: mocks.harness(createElement, 'clientSetup', 'harness-client-setup') };
});

vi.mock('@/components/modals/DetailedAnalysisModal', async () => {
  const { createElement } = await import('react');
  return { DetailedAnalysisModal: mocks.harness(createElement, 'detailedAnalysis', 'harness-detailed-analysis') };
});

type IngestionPayload = Awaited<ReturnType<typeof apiClient.getIngestionData>>;
type UploadResponse = Awaited<ReturnType<typeof apiClient.uploadDocumentToObjectStore>>;
type CanonicalResponse = Awaited<ReturnType<typeof apiClient.getCanonicalModule1>>;
type CategorizeResult = Awaited<ReturnType<typeof aiApiClient.categorizeItems>>;
type JobDetails = Awaited<ReturnType<typeof orchestrationApi.getJobDetails>>;

// Test responses sometimes carry envelopes or partial shapes that the typed clients do not declare.
const asIngestion = (value: unknown): IngestionPayload => value as IngestionPayload;
const asUploadResponse = (value: unknown): UploadResponse => value as UploadResponse;
const asCanonicalResponse = (value: unknown): CanonicalResponse => value as CanonicalResponse;
const asCategorizeResult = (value: unknown): CategorizeResult => value as CategorizeResult;
const asJobDetails = (value: unknown): JobDetails => value as JobDetails;
const asAssessmentResponse = (value: unknown): AssessmentRecord => value as AssessmentRecord;
const asCategories = (value: unknown): Awaited<ReturnType<typeof apiClient.getCategories>> =>
  value as Awaited<ReturnType<typeof apiClient.getCategories>>;
const asVendors = (value: unknown): Awaited<ReturnType<typeof apiClient.getVendors>> =>
  value as Awaited<ReturnType<typeof apiClient.getVendors>>;
const asSavings = (value: unknown): Awaited<ReturnType<typeof apiClient.getSavingsOpportunities>> =>
  value as Awaited<ReturnType<typeof apiClient.getSavingsOpportunities>>;
// Supplier rows in these fixtures are intentionally partial to exercise the page's fallback fields.
const asSupplierSpend = (value: unknown): Module1CanonicalViewModel['supplierSpend'] =>
  value as Module1CanonicalViewModel['supplierSpend'];

const BUYER_COMPANY = 'Enterprise Client';
const BUYER_USER = {
  id: 'USR-TEST-1',
  email: 'test@example.com',
  role: 'BUYER',
  status: 'ACTIVE',
  tier: 'GOLD',
  tenant_id: 'TNT-TEST-1',
  full_name: 'Test Buyer',
  company_name: BUYER_COMPANY,
  phone: '+1234567890',
  created_at: '2026-01-01T00:00:00.000Z'
} as UserProfile;

const SAAS_MODE = {
  mode: 'PUBLIC_SAAS',
  isInternalAssessment: false,
  isPublicSaaS: true,
  workspaceTitle: 'Enterprise Sourcing Suite',
  phaseName: 'Production SaaS',
  features: {
    publicRegistration: true,
    tierUpgrade: true,
    subscriptionPurchase: true,
    customerSelfOnboarding: true,
    customerSaaSDashboard: true,
    assessmentCentre: false
  },
  allowedRoles: ['INTERNAL_ADMIN', 'ANALYST', 'CONSULTANT']
} as OperatingModeConfig;

const INTERNAL_MODE = {
  ...SAAS_MODE,
  mode: 'INTERNAL_ASSESSMENT',
  isInternalAssessment: true,
  isPublicSaaS: false,
  workspaceTitle: 'Procurement Assessment Centre',
  phaseName: '30-Day Internal Validation Phase'
} as OperatingModeConfig;

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CATALOG_ERROR = 'Catalog request returned HTTP 503';
const ALWAYS_MOUNTED_HARNESSES = [
  'header',
  'pipeline',
  'proCPX',
  'dpsNXT',
  'fixCurrency',
  'mergeVendor',
  'mergeItem',
  'reassign',
  'clientSetup',
  'detailedAnalysis'
];

const buildDocument = (overrides: Partial<RawDocumentIngestion> = {}): RawDocumentIngestion => ({
  doc_id: 'DOC-PAGE-001',
  tenant_id: 'TNT-TEST-1',
  file_name: 'test_dataset.xlsx',
  file_type: 'XLSX',
  file_size_mb: 1.5,
  ocr_status: 'Completed',
  progress: 100,
  uploaded_at: '2026-03-15',
  records_count: 100,
  detected_currencies: ['USD', 'INR', 'EUR'],
  converted_inr_crores: 25.4,
  ...overrides
} as RawDocumentIngestion);

const buildRecord = (recordId: string, overrides: Partial<ValidationPreCheckRecord> = {}): ValidationPreCheckRecord => ({
  record_id: recordId,
  spend_year: 2025,
  po_number: `PO-${recordId}`,
  raw_desc: 'Chemical Raw Material',
  core_category: 'Direct Materials',
  column_l_code: '12352100',
  vendor_name: 'Acme Chemical',
  order_quantity: 100,
  net_price: 250,
  raw_currency: 'USD',
  fx_rate_applied: 83.5,
  inr_crores: 0.21,
  amount: 25000,
  issue_flag: 'Missing Currency',
  action_status: 'Action Needed',
  resolved: false,
  ...overrides
} as ValidationPreCheckRecord);

const buildOpportunity = (oppId: string, overrides: Partial<SavingsOpportunity> = {}): SavingsOpportunity => ({
  opp_id: oppId,
  category: 'Direct Materials',
  current_spend_inr_cr: 45,
  current_spend: 450000000,
  est_savings_inr_cr: 4.5,
  est_savings: 45000000,
  savings_percentage: 10,
  lever: 'Supplier Consolidation',
  push_to_module: 'proCPX',
  recommended_module: 'proCPX',
  complexity: 'Low',
  status: 'Ready to Deploy',
  ...overrides
} as SavingsOpportunity);

const buildLineItem = (mappingId: string, rawDesc: string, overrides: Partial<LineItemMapping> = {}): LineItemMapping => ({
  mapping_id: mappingId,
  line_item_id: `LINE-${mappingId}`,
  raw_desc: rawDesc,
  vendor_identified: 'Fastener Co',
  unspsc_code: '14111500',
  unspsc_category_name: 'Packaging (Cartons)',
  core_bucket: 'Packaging Materials',
  ai_confidence: 95,
  total_spend: 50000,
  inr_crores: 0.42,
  amount_inr: 4190000,
  spend_year: 2024,
  status: 'Pending',
  material_code: `MAT-${mappingId}`,
  ...overrides
} as LineItemMapping);

const buildVendorRank = (overrides: Partial<VendorPriceRank> = {}): VendorPriceRank => ({
  vendor_id: 'VND-PAGE-001',
  vendor_name: 'Acme Chemical',
  category: 'Direct Materials',
  total_spend_inr_cr: 25.5,
  price_creep_pct: 12.4,
  benchmark_index: 'ICIS Chemical Benchmark',
  variance_leakage_inr_cr: 2.1,
  variance_leakage_usd: 250000,
  risk_level: 'High',
  audit_flag: 'Price Creep Anomaly',
  ...overrides
} as VendorPriceRank);

const buildCategory = (): SpendCategorySummary => ({
  id: 'CAT-PAGE-001',
  category: 'Direct Materials',
  total_3yr_spend_inr_cr: 120.5,
  spend_fy24_cr: 38,
  spend_fy25_cr: 40.5,
  spend_fy26_cr: 42,
  three_year_cagr: 5.1,
  supplier_count: 14,
  major_suppliers: ['Acme Chemical'],
  sample_column_l_code: '12352100',
  sample_column_l_title: 'Chemicals (Solvents)',
  top_items: []
} as SpendCategorySummary);

const buildCanonical = (overrides: Partial<Module1CanonicalViewModel> = {}): Module1CanonicalViewModel => ({
  assessmentId: 'ASM-7',
  datasetId: 'DS-7',
  dataVersionId: 'DV-7',
  analysisJobId: 'JOB-7',
  sourceFileName: 'canonical_source.xlsx',
  sourceRowCount: 1200,
  validRowCount: 1100,
  excludedRowCount: 50,
  anomalyRowCount: 50,
  validFxNormalizedSpendInr: 1205000000,
  validFxNormalizedSpendCr: 120.5,
  detectedCurrencies: ['USD', 'INR'],
  currencyBreakdown: [],
  uniqueItems: 320,
  uniqueVendors: 45,
  materialGroups: 2,
  operatingPlants: 2,
  billingMonths: 12,
  supplierSpend: [],
  materialGroupSpend: [
    {
      group_code: 'DIRECT',
      group_name: 'Direct Materials',
      records_count: 800,
      unique_items_count: 200,
      unique_vendors_count: 30,
      po_count: 300,
      spend_inr_cr: 90.5,
      spend_usd_m: 10.8,
      share_pct: 75.1,
      sample_item: 'Solvent',
      primary_segment: 'Chemicals',
      fy24_spend_inr_cr: 30,
      fy25_spend_inr_cr: 35,
      fy26_spend_inr_cr: 25.5,
      color: '#0284c7'
    },
    {
      group_code: 'PACKAGING',
      group_name: 'Packaging Materials',
      records_count: 400,
      unique_items_count: 120,
      unique_vendors_count: 12,
      po_count: 150,
      spend_inr_cr: 30,
      spend_usd_m: 3.6,
      share_pct: 24.9,
      sample_item: 'Carton',
      primary_segment: 'Packaging',
      color: '#059669'
    }
  ],
  plantSpend: [
    {
      plant_code: '1000',
      plant_name: 'Plant 1000',
      records_count: 700,
      unique_items_count: 150,
      unique_vendors_count: 20,
      spend_inr_cr: 80,
      share_pct: 66
    }
  ],
  monthlySpend: [
    {
      month_key: '2024-04',
      month_label: 'Apr 2024',
      fiscalYear: 'FY25',
      records_count: 90,
      unique_items_count: 40,
      unique_vendors_count: 10,
      spend_inr_cr: 10,
      share_pct: 8,
      mom_change_pct: 2
    },
    {
      month_key: '2024-05',
      month_label: 'May 2024',
      records_count: 80,
      unique_items_count: 30,
      unique_vendors_count: 9,
      spend_inr_cr: 9
    }
  ],
  reconciliationVarianceInr: 0,
  reconciliationStatus: 'RECONCILED',
  fxMasterVersion: 'v1',
  fxMasterChecksum: 'checksum',
  moduleStatuses: { module1: 'COMPLETED', module2: 'COMPLETED', module3: 'IN_PROGRESS', module4: 'PENDING' },
  pareto: { totalSpendCr: 120.5, top80SpendCr: 96.4, top80SpendPct: 80, topSupplierCount: 5, totalSupplierCount: 45 },
  paretoHierarchy: {
    supplierToShortText: [
      {
        id: 'SUP-1',
        name: 'Acme Chemical',
        totalSpendCr: 60,
        sharePct: 50,
        cumulativeSpendCr: 60,
        cumulativePct: 50,
        children: []
      }
    ],
    shortTextToSupplier: [
      {
        id: 'ITM-1',
        name: 'Solvent',
        totalSpendCr: 60,
        sharePct: 50,
        cumulativeSpendCr: 60,
        cumulativePct: 50,
        children: []
      }
    ],
    reconciliation: {
      totalValidSpendCr: 120.5,
      vendorParetoSpendCr: 96.4,
      vendorParetoSpendPct: 80,
      vendorEntitiesCount: 5,
      itemParetoSpendCr: 90,
      itemParetoSpendPct: 75,
      itemEntitiesCount: 9,
      vendorChildVarianceCr: 0,
      itemChildVarianceCr: 0,
      reconciliationStatus: 'RECONCILED'
    }
  },
  periodMetadata: { actualFiscalYears: ['FY25'] },
  ...overrides
} as Module1CanonicalViewModel);

const buildAssessment = (overrides: Partial<AssessmentRecord> = {}): AssessmentRecord => ({
  assessmentId: 'ASM-1',
  customerName: 'Acme Industrial',
  industry: 'Manufacturing',
  assessmentPeriodStart: '2024-04-01',
  assessmentPeriodEnd: '2025-03-31',
  assignedAnalyst: 'analyst@example.com',
  ndaStatus: 'SIGNED',
  dataStatus: 'RECEIVED',
  status: 'DRAFT',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides
} as AssessmentRecord);

const buildCustomer = (customerName: string): CustomerRecord => ({
  id: `CUS-${customerName.replace(/\s+/g, '-')}`,
  customerName,
  industry: 'Manufacturing',
  baseCurrency: 'INR',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z'
} as CustomerRecord);

const buildJob = (overrides: Partial<AnalysisJob> = {}): AnalysisJob => ({
  analysisJobId: 'JOB-1',
  tenantId: 'USR-TEST-1',
  status: 'COMPLETED',
  createdAt: '2026-02-01T00:00:00.000Z',
  ...overrides
} as AnalysisJob);

const buildReport = (overrides: Partial<ReportVersion> = {}): ReportVersion => ({
  reportVersionId: 'RPT-1',
  analysisJobId: 'JOB-1',
  status: 'APPROVED',
  generatedAt: '2026-02-01T00:00:00.000Z',
  ...overrides
} as ReportVersion);

const defaultIngestion = (): IngestionPayload =>
  asIngestion({
    queue: [buildDocument()],
    validationRecords: [
      buildRecord('VAL-PAGE-001'),
      buildRecord('VAL-PAGE-002', { vendor_name: 'Amcor Pack Ltd', issue_flag: 'Unmapped Supplier Name' }),
      buildRecord('VAL-PAGE-003', { issue_flag: 'Duplicate Item Description' })
    ]
  });

const defaultLineItems = (): LineItemMapping[] => [
  buildLineItem('MAP-1', 'Steel Bolt M8'),
  buildLineItem('MAP-2', 'Cardboard'),
  buildLineItem('MAP-3', 'Zebra saddle')
];

const createDeferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void } => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

function harnessProps(name: string): Record<string, unknown> {
  const props = mocks.props[name];
  if (!props) {
    throw new Error(`Harness "${name}" has not rendered`);
  }
  return props;
}

function readProp<T>(name: string, key: string): T {
  return harnessProps(name)[key] as T;
}

function callProp(name: string, key: string, ...args: unknown[]): unknown {
  const callback = harnessProps(name)[key];
  if (typeof callback !== 'function') {
    throw new Error(`Callback "${key}" is missing on harness "${name}"`);
  }
  return (callback as (...values: unknown[]) => unknown)(...args);
}

async function runProp(name: string, key: string, ...args: unknown[]): Promise<void> {
  await act(async () => {
    await callProp(name, key, ...args);
  });
}

// Flushes pending promise chains (API mocks, dynamic imports, state updates) inside act.
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

async function renderPage(options: { expectOrchestration?: boolean } = {}): Promise<void> {
  render(<Home />);
  await waitFor(
    () => {
      for (const name of ALWAYS_MOUNTED_HARNESSES) {
        expect(mocks.props[name]).toBeDefined();
      }
    },
    { timeout: 4000 }
  );
  if (options.expectOrchestration !== false) {
    await waitFor(() => {
      expect(orchestrationApi.getJobs).toHaveBeenCalled();
    });
  }
  await settle();
}

async function switchTab(tab: string, harness: string): Promise<void> {
  delete mocks.props[harness];
  await runProp('pipeline', 'onSelectTab', tab);
  await waitFor(
    () => {
      expect(mocks.props[harness]).toBeDefined();
    },
    { timeout: 4000 }
  );
  await settle();
}

async function attachAssessment(assessment: AssessmentRecord): Promise<void> {
  await switchTab('assessment', 'assessmentWorkspace');
  await runProp('assessmentWorkspace', 'onActiveAssessmentChange', assessment);
  await settle();
}

async function seedModule2(items: LineItemMapping[] = defaultLineItems()): Promise<void> {
  await renderPage();
  vi.mocked(apiClient.getModule2CanonicalLineItems).mockResolvedValue(items);
  await attachAssessment(buildAssessment({ assessmentId: 'ASM-M2', activeDataVersionId: 'DV-M2' }));
  await switchTab('module2', 'module2');
}

// Replaces window.location with a plain object so navigation handlers can be asserted without jsdom navigation.
function stubLocation(origin = 'http://localhost:3000') {
  const fakeLocation = {
    href: `${origin}/`,
    origin,
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  };
  vi.spyOn(window, 'location', 'get').mockReturnValue(fakeLocation as unknown as Location);
  return fakeLocation;
}

// jsdom's File does not implement text() or arrayBuffer() in every version, so the page's reads are supplied here.
function makeTextFile(name: string, text: string, type = 'text/plain'): File {
  const file = new File([text], name, { type });
  Object.defineProperty(file, 'text', { value: (): Promise<string> => Promise.resolve(text) });
  return file;
}

function makeBinaryFile(name: string, bytes: Uint8Array, type: string): File {
  const file = new File([new Uint8Array(bytes)], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    value: (): Promise<ArrayBuffer> => Promise.resolve(new Uint8Array(bytes).buffer)
  });
  return file;
}

function makeUnreadableFile(name: string): File {
  const file = new File(['unreadable'], name, { type: 'text/csv' });
  Object.defineProperty(file, 'text', {
    value: (): Promise<string> => Promise.reject(new Error('read failed'))
  });
  return file;
}

function buildWorkbookBytes(rows: Array<Record<string, unknown>>): Uint8Array {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Sheet1');
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Uint8Array(output);
}

const RICH_ROWS: Array<Record<string, unknown>> = [
  { 'PO Number': 'PO-1001', 'Material Group': 'DIRECT', Material: 'MAT-100', 'Short Text': 'Cardboard', 'Vendor Name': 'Fastener Co', 'Order Qty': 100, 'Net Price': 50, Currency: 'usd', Plant: '1000', 'Posting Date': 45383, 'Net Value in Crs': 0.0004 },
  { 'PO Number': 'PO-1002', 'Material Group': 'PACKAGING', Material: 'MAT-200', 'Short Text': 'Unbleached paperboard', 'Vendor Name': 'Pack Works', 'Order Qty': 'many', 'Net Price': 20, Currency: 'INR', Plant: '2000', 'Posting Date': '2024-05-10' },
  { 'PO Number': '', 'Material Group': '', Material: '', 'Short Text': '123', 'Vendor Name': '', 'Order Qty': 10, 'Net Price': 0, Currency: '', Plant: '', 'Posting Date': '' },
  { 'PO Number': 'PO-1004', 'Material Group': 'FREIGHT', Material: 'MAT-400', 'Short Text': 'Zebra saddle', 'Vendor Name': 'Logi Ltd', 'Order Qty': 5, 'Net Price': 1000, Currency: 'EUR', Plant: '1000', 'Posting Date': 45413 },
  { 'PO Number': 'PO-1005', 'Material Group': 'PACKAGING', Material: '', 'Short Text': 'Mystery carton', 'Vendor Name': 'Pack Works', 'Order Qty': 3, 'Net Price': 12, Currency: 'USD', Plant: '1000', 'Posting Date': '2023-06-01' },
  { 'PO Number': 'PO-1006', 'Material Group': 'CONSUMABLES', Material: 'MAT-600', 'Short Text': 'Lubricant grease', 'Vendor Name': 'Logi Ltd', 'Order Qty': 2, 'Net Price': 40, Currency: 'USD', Plant: '2000', 'Posting Date': '2025-09-01' },
  { 'PO Number': 'PO-1007', 'Material Group': 'DIRECT', Material: 'MAT-700', 'Short Text': 'Detonator box', 'Vendor Name': 'Fastener Co', 'Order Qty': 4, 'Net Price': 25, Currency: 'INR', Plant: '1000', 'Posting Date': '2024-01-15', 'Net Value in Crs': 'x' }
];

async function uploadFile(file: File): Promise<void> {
  await runProp('module1', 'onAddBatchUpload', file, 'Purchase History');
  await settle();
}

function applyDefaultMocks(): void {
  vi.mocked(loadUNSPSCTaxonomy).mockResolvedValue(undefined);
  vi.mocked(getTaxonomyLoadState).mockReturnValue({ isLoading: false, error: null });
  vi.mocked(authApiClient.getStoredUser).mockReturnValue(BUYER_USER);
  vi.mocked(authApiClient.getStoredToken).mockReturnValue('token-123');
  vi.mocked(authApiClient.clearStoredSession).mockReturnValue(undefined);
  vi.mocked(apiClient.getStoredUser).mockReturnValue(BUYER_USER);
  vi.mocked(apiClient.getSimulatedTier).mockReturnValue('GOLD');
  vi.mocked(apiClient.setSimulatedTier).mockReturnValue(undefined);
  vi.mocked(apiClient.getProcurementCategoryMappings).mockResolvedValue({ mappings: {}, categories: [] });
  vi.mocked(apiClient.getConversionStages).mockResolvedValue(conversionFunnelStages);
  vi.mocked(apiClient.getTenant).mockResolvedValue({
    ...mockTenant,
    total_spend_evaluated_inr: 254.8,
    total_spend_evaluated: 2548000000
  });
  vi.mocked(apiClient.getCurrencyConversion).mockResolvedValue({
    amount: 25000,
    fromCurrency: 'EUR',
    amountINR: 4200,
    exchangeRate: 0.168,
    rateDate: null
  });
  vi.mocked(apiClient.getCurrencyRates).mockResolvedValue({
    USD: { currencyCode: 'USD', name: 'US Dollar', currentRate: 83.25, lastUpdated: '2026-10-31' },
    EUR: { currencyCode: 'EUR', name: 'Euro', currentRate: 90.5, lastUpdated: '2026-10-31' }
  });
  vi.mocked(apiClient.updateTenant).mockResolvedValue(mockTenant);
  vi.mocked(apiClient.getIngestionData).mockResolvedValue(defaultIngestion());
  vi.mocked(apiClient.getCategories).mockResolvedValue({ categories: [buildCategory()], categoryDetails: [] });
  vi.mocked(apiClient.getVendors).mockResolvedValue({ vendorRankings: [buildVendorRank()], vendorDetails: [] });
  vi.mocked(apiClient.getSavingsOpportunities).mockResolvedValue({
    opportunities: [
      buildOpportunity('OPP-PAGE-001'),
      buildOpportunity('OPP-PAGE-002', { category: 'Packaging Materials', push_to_module: 'DPS NXT', recommended_module: 'DPS NXT' })
    ],
    totalPotentialSavingsCr: 119.67
  });
  vi.mocked(apiClient.getCanonicalModule1).mockResolvedValue(null);
  vi.mocked(apiClient.getModule2CanonicalLineItems).mockResolvedValue([]);
  vi.mocked(apiClient.updateValidationRecord).mockResolvedValue(buildRecord('VAL-PAGE-001'));
  vi.mocked(apiClient.applyBlanketRemediation).mockResolvedValue({ updatedCount: 0, skippedCount: 0, records: [] });
  vi.mocked(apiClient.resetValidationRecords).mockResolvedValue([]);
  vi.mocked(apiClient.deleteIngestionDocument).mockResolvedValue([]);
  vi.mocked(apiClient.uploadDocumentToObjectStore).mockResolvedValue(
    asUploadResponse({ success: true, ingestion: buildDocument(), validationCount: 3 })
  );
  vi.mocked(apiClient.mergeVendor).mockResolvedValue({ success: true });
  vi.mocked(mocks.saveModule2MaterialMappings).mockImplementation(async (_assessmentId, mappings) => mappings.map((mapping) => ({
    sourceMaterialId: mapping.sourceMaterialId,
    sourceDescription: mapping.sourceMaterialId,
    sourceCategory: 'Test category',
    assignedUnspscCode: mapping.unspscCode,
    assignedUnspscTitle: `UNSPSC ${mapping.unspscCode}`,
    unspscSegment: '12',
    unspscFamily: '1234',
    unspscClass: '123456',
    unspscCommodity: mapping.unspscCode,
    taxonomyVersion: 'test',
    mappingMethod: mapping.mappingMethod || 'MANUAL_REVIEW_REQUIRED',
    confidenceScore: mapping.confidenceScore ?? 1,
    evidence: 'Persisted to D1 for test',
    reviewStatus: mapping.reviewStatus,
    mappingDate: '2026-10-31T00:00:00.000Z',
    totalSpendInr: 0,
    totalSpendCr: 0,
    transactionCount: 0,
    qualifyingSuppliersCount: 0,
    coreBucket: 'Direct Materials'
  } as MaterialMappingEntry)));
  vi.mocked(apiClient.deployOpportunity).mockResolvedValue(buildOpportunity('OPP-PAGE-001'));
  vi.mocked(aiApiClient.categorizeItems).mockResolvedValue(asCategorizeResult({ success: false, mappings: [] }));
  vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(SAAS_MODE);
  vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([]);
  vi.mocked(assessmentApiClient.getAssessmentById).mockResolvedValue(buildAssessment());
  vi.mocked(orchestrationApi.getJobs).mockResolvedValue([]);
  vi.mocked(orchestrationApi.getJobDetails).mockResolvedValue(null);
}

beforeEach(() => {
  vi.resetAllMocks();
  for (const key of Object.keys(mocks.props)) {
    delete mocks.props[key];
  }
  mocks.useRouter.mockReturnValue({ push: mocks.routerPush, replace: vi.fn(), prefetch: vi.fn() });
  // jsdom does not implement scrollIntoView, which the refresh handler calls on the summary anchor.
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: vi.fn() });
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  window.sessionStorage.clear();
  applyDefaultMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('Home page: session bootstrap, routing, and hydration', () => {
  it('sends visitors without a stored session to the login route', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(authApiClient.getStoredToken).mockReturnValue(null);

    render(<Home />);

    await waitFor(() => {
      expect(mocks.routerPush).toHaveBeenCalledWith('/login');
    });
    expect(apiClient.getTenant).not.toHaveBeenCalled();
  });

  it('sends ADMIN accounts to the admin dashboard before hydration', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue({ ...BUYER_USER, role: 'ADMIN' } as UserProfile);

    render(<Home />);

    await waitFor(() => {
      expect(mocks.routerPush).toHaveBeenCalledWith('/admin/dashboard');
    });
    expect(apiClient.getTenant).not.toHaveBeenCalled();
  });

  it('falls back to a location redirect when the router hook throws', async () => {
    mocks.useRouter.mockImplementationOnce(() => {
      throw new Error('App Router context is not mounted');
    });
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(authApiClient.getStoredToken).mockReturnValue(null);
    const fakeLocation = stubLocation();

    render(<Home />);

    await waitFor(() => {
      expect(fakeLocation.href).toBe('/login');
    });
    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it('uses the location fallback when the router hook returns no router', async () => {
    mocks.useRouter.mockReturnValueOnce(null);
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(authApiClient.getStoredToken).mockReturnValue(null);
    const fakeLocation = stubLocation();

    render(<Home />);

    await waitFor(() => expect(fakeLocation.href).toBe('/login'));
  });

  it('does not invent a D1 document when required database identifiers are missing', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(apiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [{ file_name: '', file_type: '', detected_currencies: [], progress: undefined, records_count: undefined }],
        validationRecords: []
      })
    );

    await renderPage({ expectOrchestration: false });

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([]);
    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe(UI_STRINGS.header.noActiveCustomer);
  });

  it('prioritizes the requested D1 document from the documentId query parameter', async () => {
    const selectedDocument = buildDocument({ doc_id: 'DOC-SELECTED' });
    const otherDocument = buildDocument({ doc_id: 'DOC-OTHER-AVAILABLE' });
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({ queue: [otherDocument, selectedDocument], validationRecords: [] })
    );
    window.history.replaceState(null, '', '/?documentId=DOC-SELECTED');

    await renderPage();

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([selectedDocument]);
  });

  it('loads the next validation page and merges records by stable record ID', async () => {
    const firstRecord = buildRecord('VAL-FIRST');
    const secondRecord = buildRecord('VAL-SECOND');
    const cursor = { createdAt: '2026-04-01T00:00:00Z', recordId: 'VAL-FIRST' };
    vi.mocked(apiClient.getIngestionData)
      .mockResolvedValueOnce(asIngestion({
        ...defaultIngestion(),
        validationRecords: [firstRecord],
        pagination: { validationRecords: { hasMore: true, nextCursor: cursor } },
        summary: {
          totalFiles: 1, totalRecords: 2, cleanCount: 0, anomaliesCount: 2, allResolvedCount: 0,
          pendingActionsCount: 2, conversionCount: 2, vendorDuplicationCount: 0, itemDuplicationCount: 0,
          totalSpendCr: 0.42, pendingSpendCr: 0.42
        }
      }))
      .mockResolvedValueOnce(asIngestion({
        queue: [], validationRecords: [secondRecord],
        pagination: { validationRecords: { hasMore: false, nextCursor: null } }
      }));

    await renderPage();
    await runProp('module1', 'onLoadMoreValidationRecords');

    expect(apiClient.getIngestionData).toHaveBeenLastCalledWith(BUYER_USER.tenant_id, { validationCursor: cursor });
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords').map((record) => record.record_id))
      .toEqual(['VAL-FIRST', 'VAL-SECOND']);
    expect(readProp<boolean>('module1', 'hasMoreValidationRecords')).toBe(false);
  });

  it('does not request a validation page when the server cursor is missing', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(asIngestion({
      ...defaultIngestion(),
      pagination: { validationRecords: { hasMore: true, nextCursor: null } }
    }));

    await renderPage();
    await runProp('module1', 'onLoadMoreValidationRecords');

    expect(apiClient.getIngestionData).toHaveBeenCalledTimes(1);
  });

  it('reports when the requested document is absent and tolerates optional D1 analytics failures', async () => {
    window.history.replaceState(null, '', '/?documentId=DOC-MISSING');
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(asIngestion({
      queue: [buildDocument({ doc_id: 'DOC-AVAILABLE' })]
    }));
    vi.mocked(apiClient.getCategories).mockRejectedValue(new Error('category read failed'));
    vi.mocked(apiClient.getVendors).mockRejectedValue(new Error('vendor read failed'));
    vi.mocked(apiClient.getSavingsOpportunities).mockRejectedValue(new Error('savings read failed'));

    await renderPage();

    expect(screen.getByText(UI_STRINGS.documentSummary.selectedDocumentUnavailable)).toBeInTheDocument();
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')).toEqual([]);
    await switchTab('module2', 'module2');
    expect(readProp<unknown[]>('module2', 'categories')).toEqual([]);
    await switchTab('module3', 'module3');
    expect(readProp<unknown[]>('module3', 'vendorRankings')).toEqual([]);
    await switchTab('module4', 'module4');
    expect(readProp<unknown[]>('module4', 'opportunities')).toEqual([]);
  });

  it('drops ingestion documents that belong to another tenant', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [buildDocument({ doc_id: 'DOC-OTHER', tenant_id: 'USR-OTHER' })],
        validationRecords: [buildRecord('VAL-OTHER')]
      })
    );

    await renderPage();

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([]);
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')).toEqual([]);
    expect(readProp<TenantMaster>('header', 'tenant').total_spend_evaluated_inr).toBe(0);
  });

  it('hydrates only the tenant explicitly assigned to the authenticated user', async () => {
    const assignedTenantDocument = buildDocument({ doc_id: 'DOC-ASSIGNED-TENANT', tenant_id: 'TNT-TEST-1' });
    const otherTenantDocument = buildDocument({ doc_id: 'DOC-OTHER-TENANT', tenant_id: 'TNT-OTHER' });
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(asIngestion({
      queue: [assignedTenantDocument, otherTenantDocument],
      validationRecords: []
    }));

    await renderPage();

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([assignedTenantDocument]);
  });

  it('fails closed for a buyer without an explicit tenant assignment', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue({ ...BUYER_USER, tenant_id: null });
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(asIngestion({
      queue: [buildDocument({ tenant_id: 'TNT-TEST-1' })],
      validationRecords: [buildRecord('VAL-UNASSIGNED')]
    }));

    await renderPage({ expectOrchestration: false });

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([]);
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')).toEqual([]);
    expect(apiClient.getTenant).not.toHaveBeenCalled();
    expect(apiClient.getIngestionData).not.toHaveBeenCalled();
    expect(apiClient.getCategories).not.toHaveBeenCalled();
    expect(apiClient.getVendors).not.toHaveBeenCalled();
    expect(apiClient.getSavingsOpportunities).not.toHaveBeenCalled();
    expect(orchestrationApi.getJobs).not.toHaveBeenCalled();
  });

  it('keeps the current state when tenant and analytics requests reject', async () => {
    vi.mocked(apiClient.getTenant).mockRejectedValue(new Error('tenant service unavailable'));
    vi.mocked(apiClient.getIngestionData).mockRejectedValue(new Error('ingestion service unavailable'));
    vi.mocked(apiClient.getCategories).mockRejectedValue(new Error('categories unavailable'));
    vi.mocked(apiClient.getVendors).mockRejectedValue(new Error('vendors unavailable'));
    vi.mocked(apiClient.getSavingsOpportunities).mockRejectedValue(new Error('savings unavailable'));

    await renderPage();

    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe(BUYER_COMPANY);
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([]);
    expect(frontendLogger.error).not.toHaveBeenCalled();
  });

  it('reports failed reference and conversion loads without blocking hydration', async () => {
    vi.mocked(apiClient.getProcurementCategoryMappings).mockRejectedValue(new Error('D1 offline'));
    vi.mocked(apiClient.getConversionStages).mockRejectedValue(new Error('conversion offline'));

    await renderPage();

    expect(screen.getByText(UI_STRINGS.databaseData.procurementMappingsLoadFailed)).toBeInTheDocument();
    expect(frontendLogger.error).toHaveBeenCalledTimes(2);
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toHaveLength(1);
  });

  it('logs a hydration failure when reading the stored session throws mid-load', async () => {
    vi.mocked(authApiClient.getStoredUser)
      .mockReturnValueOnce(BUYER_USER)
      .mockImplementationOnce(() => {
        throw new Error('storage unavailable');
      });

    render(<Home />);

    await waitFor(() => {
      expect(frontendLogger.error).toHaveBeenCalled();
    });
    expect(orchestrationApi.getJobs).not.toHaveBeenCalled();
  });

  it('opens the tab named in the URL hash', async () => {
    window.history.replaceState(null, '', '/#module3');

    render(<Home />);

    await waitFor(() => {
      expect(mocks.props.module3).toBeDefined();
    });
    expect(mocks.props.module1).toBeUndefined();
  });

  it('opens the tab named in the query string when no hash is present', async () => {
    window.history.replaceState(null, '', '/?tab=module4');

    render(<Home />);

    await waitFor(() => {
      expect(mocks.props.module4).toBeDefined();
    });
  });

  it('follows hash changes after the page has loaded', async () => {
    await renderPage();

    window.location.hash = '#module5';

    await waitFor(
      () => {
        expect(mocks.props.module5).toBeDefined();
      },
      { timeout: 4000 }
    );
  });
});

describe('Home page: operating mode and assessment restoration', () => {
  it('falls back to internal mode state when the operating mode endpoint fails', async () => {
    vi.mocked(assessmentApiClient.getOperatingMode).mockRejectedValue(new Error('mode endpoint offline'));

    await renderPage();

    await waitFor(() => {
      expect(assessmentApiClient.getAssessments).toHaveBeenCalled();
    });
    expect(readProp<OperatingModeConfig>('header', 'operatingMode').isInternalAssessment).toBe(true);
    expect(mocks.props.assessmentWorkspace).toBeUndefined();
    expect(mocks.props.module1).toBeDefined();
  });

  it('restores the stored assessment and applies its canonical view in internal mode', async () => {
    const canonical = buildCanonical();
    const assessment = buildAssessment({
      assessmentId: 'ASM-7',
      status: 'ACCEPTED',
      isReportAccepted: true,
      acceptedAt: '2026-02-01T00:00:00.000Z',
      activeDataVersionId: 'DV-7',
      activeAnalysisRunId: 'RUN-7',
      validatedSpendCr: 120.5,
      potentialSavingsCr: 6.2,
      canonicalModule1: canonical
    });
    window.localStorage.setItem('aicev_selected_assessment_id', 'ASM-7');
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessmentById).mockResolvedValue(
      asAssessmentResponse({ assessment })
    );
    vi.mocked(apiClient.getCanonicalModule1).mockResolvedValue(canonical);

    await renderPage();

    await waitFor(() => {
      expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe(assessment.customerName);
    });
    expect(readProp<TenantMaster>('header', 'tenant').total_spend_evaluated_inr).toBe(120.5);
    expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')?.assessmentId).toBe('ASM-7');

    await switchTab('module1', 'module1');
    expect(readProp<unknown[]>('module1', 'materialGroupSummaries')).toHaveLength(2);
    expect(readProp<number>('module1', 'uniqueItemsCount')).toBe(320);
  });

  it('restores the assessment named in the query string', async () => {
    window.history.replaceState(null, '', '/?assessmentId=ASM-Q');
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessmentById).mockResolvedValue(buildAssessment({ assessmentId: 'ASM-Q' }));

    await renderPage();

    await waitFor(() => {
      expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')?.assessmentId).toBe('ASM-Q');
    });
    expect(assessmentApiClient.getAssessmentById).toHaveBeenCalledWith('ASM-Q');
  });

  it('restores the validated assessment from the list when none is stored', async () => {
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([
      buildAssessment({ assessmentId: 'ASM-1', validatedSpendCr: 0 }),
      buildAssessment({ assessmentId: 'ASM-2', validatedSpendCr: 50 })
    ]);

    await renderPage();

    await waitFor(() => {
      expect(assessmentApiClient.getAssessmentById).toHaveBeenCalledWith('ASM-2');
    });
  });

  it('uses the first listed assessment when none has validated spend', async () => {
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessments).mockResolvedValue([buildAssessment({ assessmentId: 'ASM-1' })]);

    await renderPage();

    await waitFor(() => {
      expect(assessmentApiClient.getAssessmentById).toHaveBeenCalledWith('ASM-1');
    });
  });

  it('skips restoration when the assessment list cannot be loaded', async () => {
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessments).mockRejectedValue(new Error('list offline'));

    await renderPage();

    expect(assessmentApiClient.getAssessmentById).not.toHaveBeenCalled();
    expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')).toBeNull();
  });

  it('ignores a stored assessment response whose id does not match', async () => {
    window.localStorage.setItem('aicev_selected_assessment_id', 'ASM-7');
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessmentById).mockResolvedValue(buildAssessment({ assessmentId: 'ASM-OTHER' }));

    await renderPage();

    await waitFor(() => {
      expect(assessmentApiClient.getAssessmentById).toHaveBeenCalledWith('ASM-7');
    });
    expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')).toBeNull();
    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe(UI_STRINGS.header.noActiveCustomer);
  });

  it('logs a warning when restoring the stored assessment fails', async () => {
    window.localStorage.setItem('aicev_selected_assessment_id', 'ASM-7');
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessmentById).mockRejectedValue(new Error('assessment missing'));

    await renderPage();

    await waitFor(() => {
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  it('treats a rejected job lookup as no active analysis job', async () => {
    vi.mocked(orchestrationApi.getJobs).mockRejectedValue(new Error('jobs offline'));

    await renderPage();

    expect(mocks.props.customerAnalysis).toBeUndefined();
  });
});

describe('Home page: Module 1 data actions', () => {
  it('persists currency fixes and rejects unknown record ids without changing another record', async () => {
    await renderPage();
    const [record] = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');

    await runProp('module1', 'onFixCurrency', record);
    expect(readProp<ValidationPreCheckRecord | null>('fixCurrency', 'record')).toBe(record);

    await runProp('fixCurrency', 'onFix', record.record_id, 'EUR', 4200);
    expect(apiClient.updateValidationRecord).toHaveBeenCalledWith(
      record.record_id,
      expect.objectContaining({ raw_currency: 'EUR', amount: record.amount, amount_inr: 4200, issue_flag: 'Passed Clean', resolved: true })
    );
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')[0]).toMatchObject({
      raw_currency: 'EUR',
      currency_provenance: 'ANALYST_CONFIRMED',
      resolved: true
    });
    expect(screen.getByText(UI_STRINGS.toasts.recordNormalized(record.record_id, 'EUR'))).toBeInTheDocument();

    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce(new Error('Sync rejected'));
    await runProp('fixCurrency', 'onFix', record.record_id, 'GBP', 4200);
    await waitFor(() => {
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
    expect(screen.getByText(/Sync rejected/)).toBeInTheDocument();

    await runProp('fixCurrency', 'onFix', 'UNKNOWN-RECORD', 'GBP', 4200);
    expect(screen.getByText(UI_STRINGS.module1.currencyRecordNotFound('UNKNOWN-RECORD'))).toBeInTheDocument();
    expect(apiClient.updateValidationRecord).toHaveBeenCalledTimes(2);
  });

  it('confirms the dataset base currency for records whose currency is unresolved', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [buildDocument()],
        validationRecords: [
          buildRecord('REC-NO-CCY', { raw_currency: '' }),
          buildRecord('REC-UNRESOLVED', { currency_provenance: 'UNRESOLVED' }),
          buildRecord('REC-CODE-MISSING', { issue_flag: 'Missing Currency Code' }),
          buildRecord('REC-CLEAN', { issue_flag: 'Passed Clean', resolved: true })
        ]
      })
    );
    await renderPage();

    await runProp('module1', 'onConfirmDatasetBaseCurrency');

    const records = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');
    expect(records.map((record) => record.raw_currency)).toEqual(['INR', 'INR', 'INR', 'USD']);
    expect(records[3].resolved).toBe(true);

    await runProp('module1', 'onConfirmDatasetBaseCurrency', 'USD');
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')[0].raw_currency).toBe('INR');
  });

  it('saves a supplier correction without claiming the master merge or total recalculation', async () => {
    await renderPage();
    const [record] = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');

    await runProp('module1', 'onMergeVendor', record);
    expect(readProp<ValidationPreCheckRecord | null>('mergeVendor', 'record')).toBe(record);
    await runProp('mergeVendor', 'onMerge', record.record_id, 'VND-9', 'Master Supplier');

    expect(apiClient.updateValidationRecord).toHaveBeenCalledWith(
      record.record_id,
      expect.objectContaining({ vendor_name: 'Master Supplier (VND-9)' })
    );
    expect(readProp<number | undefined>('module1', 'uniqueVendorsCount')).toBeUndefined();
    expect(screen.getByText(UI_STRINGS.toasts.recordMapped(record.record_id, 'VND-9'))).toBeInTheDocument();

    await runProp('mergeVendor', 'onIgnore', record.record_id);
    expect(apiClient.updateValidationRecord).toHaveBeenLastCalledWith(
      record.record_id,
      expect.objectContaining({ issue_flag: 'Passed Clean', action_status: 'Reviewed' })
    );
    expect(screen.getByText(UI_STRINGS.toasts.issueIgnored(record.record_id))).toBeInTheDocument();

    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce(new Error('merge rejected'));
    await runProp('mergeVendor', 'onMerge', record.record_id, 'VND-9', 'Master Supplier');
    await waitFor(() => {
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  it('saves a corrected item description without changing aggregate counts', async () => {
    await renderPage();
    const [record] = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');

    await runProp('module1', 'onMergeItem', record);
    await runProp('mergeItem', 'onMerge', record.record_id, 'ITM-7', 'Steel Bolt');

    expect(readProp<number | undefined>('module1', 'uniqueItemsCount')).toBeUndefined();
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')[0].raw_desc).toBe('Steel Bolt (ITM-7)');
    expect(screen.getByText(UI_STRINGS.toasts.recordItemMerged(record.record_id, 'ITM-7'))).toBeInTheDocument();

    await runProp('mergeItem', 'onIgnore', record.record_id);
    expect(screen.getByText(UI_STRINGS.toasts.issueIgnored(record.record_id))).toBeInTheDocument();
  });

  it('shows the safe persistence message when D1 rejects Module 1 corrections with non-Error values', async () => {
    const fallbackMessage = UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails);
    await renderPage();
    const [record] = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');

    vi.mocked(apiClient.getCurrencyConversion).mockRejectedValueOnce('currency service unavailable');
    await runProp('module1', 'onFixCurrency', record);
    await runProp('fixCurrency', 'onFix', record.record_id, 'EUR', 100);
    expect(screen.getByText(fallbackMessage)).toBeInTheDocument();

    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce('supplier update unavailable');
    await runProp('module1', 'onMergeVendor', record);
    await runProp('mergeVendor', 'onMerge', record.record_id, 'VND-9', 'Master Supplier');
    expect(screen.getByText(fallbackMessage)).toBeInTheDocument();

    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce('item update unavailable');
    await runProp('module1', 'onMergeItem', record);
    await runProp('mergeItem', 'onMerge', record.record_id, 'ITM-9', 'Master Item');
    expect(screen.getByText(fallbackMessage)).toBeInTheDocument();
  });
});

describe('Home page: Module 1 remediation, refresh, and deletion', () => {
  it('applies only the currency updates returned from D1', async () => {
    const corrected = buildRecord('VAL-PAGE-001', {
      fx_rate_applied: 85,
      amount_inr: 8500,
      inr_crores: 0.00085,
      issue_flag: 'Passed Clean',
      action_status: 'Ready',
      resolved: true
    });
    vi.mocked(apiClient.applyBlanketRemediation).mockResolvedValueOnce({ updatedCount: 1, skippedCount: 0, records: [corrected] });
    await renderPage();

    await runProp('module1', 'onApplyBlanketFixes');

    expect(apiClient.applyBlanketRemediation).toHaveBeenCalled();
    const records = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');
    expect(records[0]).toMatchObject({ fx_rate_applied: 85, amount_inr: 8500, inr_crores: 0.00085, resolved: true });
    expect(records[0].vendor_name).toBe('Acme Chemical');
    expect(screen.getByText(UI_STRINGS.toasts.blanketFixesApplied(1))).toBeInTheDocument();
  });

  it('does not claim corrections when D1 has no eligible currency rows', async () => {
    await renderPage();

    await runProp('module1', 'onApplyBlanketFixes');

    expect(screen.getByText(UI_STRINGS.toasts.blanketFixesNoChanges)).toBeInTheDocument();
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')[0].resolved).toBe(false);
  });

  it('resets validation records while preserving the uploaded document queue', async () => {
    await renderPage();

    await runProp('module1', 'onResetValidationRecords');

    expect(apiClient.resetValidationRecords).toHaveBeenCalled();
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')).toEqual([]);
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([buildDocument()]);
    expect(screen.getByText(UI_STRINGS.toasts.validationReset)).toBeInTheDocument();
  });

  it('shows safe messages when D1 reset and delete operations reject with non-Error values', async () => {
    const fallbackMessage = UI_STRINGS.module4.saveFailed(UI_STRINGS.module4.apiNoDetails);
    await renderPage();

    vi.mocked(apiClient.resetValidationRecords).mockRejectedValueOnce('reset unavailable');
    await runProp('module1', 'onResetValidationRecords');
    expect(screen.getByText(fallbackMessage)).toBeInTheDocument();

    vi.mocked(apiClient.deleteIngestionDocument).mockRejectedValueOnce('delete unavailable');
    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');
    expect(screen.getByText(fallbackMessage)).toBeInTheDocument();
  });

  it('refreshes D1 validation records and scrolls to the summary section without a browser data copy', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [buildDocument()],
        validationRecords: [0, 1, 2, 3].map((index) =>
          buildRecord(`REC-R${index}`, { resolved: true, issue_flag: 'Passed Clean' })
        )
      })
    );
    await renderPage();

    await runProp('module1', 'onRefreshWithFixes');

    const records = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');
    expect(records[3]).toMatchObject({ issue_flag: 'Tax Discrepancy', action_status: 'Reviewed', resolved: false });
    expect(records[0].issue_flag).toBe('Passed Clean');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByText(UI_STRINGS.toasts.refreshedFinalNumbers)).toBeInTheDocument();
  });

  it('keeps unresolved D1 records on refresh without browser storage', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [buildDocument({ records_count: 0 })],
        validationRecords: [buildRecord('REC-OPEN', { resolved: false, issue_flag: 'Missing Currency' })]
      })
    );
    await renderPage();

    await runProp('module1', 'onRefreshWithFixes');

    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')[0]).toMatchObject({
      record_id: 'REC-OPEN',
      issue_flag: 'Missing Currency',
      resolved: false
    });
    expect(readProp<{ totalRecords: number }>('analyzingLoader', 'metrics').totalRecords).toBe(0);
    expect(screen.getByText(UI_STRINGS.toasts.refreshedFinalNumbers)).toBeInTheDocument();
  });

  it('deletes the uploaded document and resets derived Module 1 state', async () => {
    await renderPage();

    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');

    expect(apiClient.deleteIngestionDocument).toHaveBeenCalledWith('DOC-PAGE-001', 'TNT-TEST-1');
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([]);
    expect(readProp<TenantMaster>('header', 'tenant').total_spend_evaluated_inr).toBe(0);
    expect(readProp<number | undefined>('module1', 'uniqueItemsCount')).toBeUndefined();
  });

  it('filters documents returned after deletion to the assigned tenant', async () => {
    vi.mocked(apiClient.deleteIngestionDocument).mockResolvedValueOnce([
      buildDocument({ doc_id: 'DOC-RETAINED' }),
      buildDocument({ doc_id: 'DOC-FOREIGN', tenant_id: 'TNT-OTHER' })
    ]);
    await renderPage();

    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([
      buildDocument({ doc_id: 'DOC-RETAINED' })
    ]);
  });

  it('does not submit document deletion when the document id is absent', async () => {
    await renderPage();

    await runProp('module1', 'onDeleteDocument');

    expect(apiClient.deleteIngestionDocument).not.toHaveBeenCalled();
    expect(frontendLogger.warn).toHaveBeenCalledWith(
      'Document deletion skipped because the document identifier is missing',
      expect.objectContaining({ action: 'ingestion.document.delete', userId: BUYER_USER.id })
    );
  });

  it('blocks document deletion when the user has no assigned tenant', async () => {
    const unassignedUser = { ...BUYER_USER, tenant_id: null };
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(unassignedUser);
    vi.mocked(apiClient.getStoredUser).mockReturnValue(unassignedUser);
    await renderPage({ expectOrchestration: false });

    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');

    expect(apiClient.deleteIngestionDocument).not.toHaveBeenCalled();
    expect(screen.getByText(UI_STRINGS.auth.tenantAssignmentRequired)).toBeInTheDocument();
    expect(frontendLogger.warn).toHaveBeenCalledWith(
      'Document deletion skipped because the user has no assigned tenant',
      expect.objectContaining({ action: 'ingestion.document.delete', userId: BUYER_USER.id, documentId: 'DOC-PAGE-001' })
    );
  });

  it('falls back to zero analysis metrics when no document is loaded', async () => {
    await renderPage();
    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');

    await runProp('header', 'onStartAnalysis');

    expect(readProp<{ totalRecords: number }>('analyzingLoader', 'metrics').totalRecords).toBe(0);
    expect(readProp<{ confidenceScore?: number }>('analyzingLoader', 'metrics').confidenceScore).toBeUndefined();
  });
});

describe('Home page: batch upload pipeline', () => {
  it('requires a signed-in user before parsing an upload', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue(null);
    vi.mocked(apiClient.getStoredUser).mockReturnValue(null);
    await renderPage({ expectOrchestration: false });

    await uploadFile(makeTextFile('signed-out.csv', 'PO\n1\n', 'text/csv'));

    expect(mocks.routerPush).toHaveBeenCalledWith('/login');
    expect(apiClient.uploadDocumentToObjectStore).not.toHaveBeenCalled();
  });

  it('blocks uploads until the account has an assigned tenant', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue({ ...BUYER_USER, tenant_id: null });
    vi.mocked(apiClient.getStoredUser).mockReturnValue({ ...BUYER_USER, tenant_id: null });
    await renderPage({ expectOrchestration: false });

    await uploadFile(makeTextFile('unassigned.csv', 'PO\n1\n', 'text/csv'));

    expect(screen.getByText(UI_STRINGS.auth.tenantAssignmentRequired)).toBeInTheDocument();
    expect(apiClient.uploadDocumentToObjectStore).not.toHaveBeenCalled();
  });

  it('blocks uploads until the account has an assigned tenant', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue({ ...BUYER_USER, tenant_id: null });
    vi.mocked(apiClient.getStoredUser).mockReturnValue({ ...BUYER_USER, tenant_id: null });
    await renderPage({ expectOrchestration: false });

    await uploadFile(makeTextFile('unassigned.csv', 'PO\n1\n', 'text/csv'));

    expect(screen.getByText(UI_STRINGS.auth.tenantAssignmentRequired)).toBeInTheDocument();
    expect(apiClient.uploadDocumentToObjectStore).not.toHaveBeenCalled();
  });

  it('reports a taxonomy load failure with the default reason when no stored error exists', async () => {
    vi.mocked(loadUNSPSCTaxonomy).mockRejectedValueOnce(new Error('catalog offline'));
    await renderPage();

    await uploadFile(makeTextFile('catalog.csv', 'PO\n1\n', 'text/csv'));

    expect(
      screen.getByText(
        UI_STRINGS.taxonomyData.loadFailed(UI_STRINGS.taxonomyData.unknownFailure, UI_STRINGS.taxonomyData.requestUnavailable)
      )
    ).toBeInTheDocument();
    expect(apiClient.uploadDocumentToObjectStore).not.toHaveBeenCalled();
  });

  it('reports the stored taxonomy error when the catalog load state has one', async () => {
    vi.mocked(loadUNSPSCTaxonomy).mockRejectedValueOnce(new Error('catalog offline'));
    vi.mocked(getTaxonomyLoadState).mockReturnValueOnce({ isLoading: false, error: CATALOG_ERROR });
    await renderPage();

    await uploadFile(makeTextFile('catalog.csv', 'PO\n1\n', 'text/csv'));

    expect(screen.getByText(CATALOG_ERROR)).toBeInTheDocument();
  });

  it('parses a multi-column workbook into ingestion, line items, and the analysis popup', async () => {
    await renderPage();

    await uploadFile(makeBinaryFile('spend_detail.xlsx', buildWorkbookBytes(RICH_ROWS), XLSX_MIME));

    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'spend_detail.xlsx',
        fileType: 'XLSX',
        recordsCount: RICH_ROWS.length,
        buyer_id: 'TNT-TEST-1',
        tenant_id: 'TNT-TEST-1'
      })
    );
    const [queueDoc] = readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue');
    expect(queueDoc.records_count).toBe(RICH_ROWS.length);
    expect(queueDoc.detected_currencies).toEqual(expect.arrayContaining(['USD', 'INR', 'EUR']));
    expect(readProp<{ isOpen: boolean }>('detailedAnalysis', 'isOpen')).toBe(true);
    expect(readProp<number>('module1', 'uniqueVendorsCount')).toBeGreaterThan(0);

    await switchTab('module2', 'module2');
    expect(readProp<LineItemMapping[]>('module2', 'lineItems')).toHaveLength(RICH_ROWS.length);
  });

  it('refreshes the uploaded queue, validation records, and spend from D1 after a persisted import', async () => {
    const d1Document = buildDocument({ doc_id: 'DOC-D1-UPLOAD', records_count: 2, converted_inr_crores: 3.25 });
    vi.mocked(apiClient.getIngestionData)
      .mockResolvedValueOnce(defaultIngestion())
      .mockResolvedValueOnce(asIngestion({
        queue: [d1Document],
        validationRecords: [buildRecord('REC-D1-ROW-2')]
      }));
    vi.mocked(apiClient.uploadDocumentToObjectStore).mockResolvedValueOnce(asUploadResponse({
      success: true,
      data: { docId: 'DOC-D1-UPLOAD', importedCount: 2, totalInrCrores: 3.25 }
    }));

    await renderPage();
    await uploadFile(makeTextFile('spend.csv', 'PO,Vendor\n1,Acme\n2,Beta\n', 'text/csv'));

    expect(apiClient.getIngestionData).toHaveBeenCalledTimes(2);
    expect(apiClient.getIngestionData).toHaveBeenLastCalledWith('TNT-TEST-1');
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([d1Document]);
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')).toHaveLength(1);
    expect(readProp<TenantMaster>('header', 'tenant').total_spend_evaluated_inr).toBe(3.25);
  });

  it('derives the spend total from a Total INR column and a numeric year column', async () => {
    await renderPage();
    const rows = [
      {
        'Vendor Name': 'Alpha Supplies',
        Material: 'M-1',
        'Short Text': 'Glass Bottle',
        'Total INR': 2500000,
        'Order Qty': 2,
        'Net Price': 10,
        'Plant Code': 'P-9',
        Year: 2023,
        'Material Group': 'DIRECT'
      }
    ];

    await uploadFile(makeBinaryFile('inr_totals.xls', buildWorkbookBytes(rows), XLSX_MIME));

    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(
      expect.objectContaining({ recordsCount: 1, convertedInrCrores: 0.25 })
    );
  });

  it('falls back to generated defaults for a minimal workbook without recognised columns', async () => {
    await renderPage();

    await uploadFile(makeBinaryFile('minimal.xlsx', buildWorkbookBytes([{ Item: 'Gasket', Count: 4 }, { Item: 'Seal', Count: 2 }]), XLSX_MIME));

    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(expect.objectContaining({ recordsCount: 2 }));
    await switchTab('module2', 'module2');
    expect(readProp<LineItemMapping[]>('module2', 'lineItems').map((item) => item.raw_desc)).toEqual(['Item-1', 'Item-2']);
  });

  it('records zero rows for a workbook that has a header but no data rows', async () => {
    await renderPage();

    await uploadFile(makeBinaryFile('header_only.xlsx', buildWorkbookBytes([]), XLSX_MIME));

    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(expect.objectContaining({ recordsCount: 0 }));
  });

  it('estimates the record count from file size when a spreadsheet cannot be parsed', async () => {
    await renderPage();

    await uploadFile(makeBinaryFile('broken_export.xlsx', new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]), XLSX_MIME));

    expect(mocks.logger.warn).toHaveBeenCalled();
    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(expect.objectContaining({ recordsCount: 1 }));
  });

  it('uses the catalog size estimate for an unreadable UNSPSC workbook', async () => {
    await renderPage();

    await uploadFile(
      makeBinaryFile('UNSPSC_Master_Catalog.xlsx', new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]), XLSX_MIME)
    );

    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(expect.objectContaining({ recordsCount: 158467 }));
  });
});

describe('Home page: batch upload outcomes', () => {
  it('counts CSV lines and falls back to a default count when the file cannot be read', async () => {
    await renderPage();

    await uploadFile(makeTextFile('spend.csv', 'PO,Vendor\n1,A\n2,B\n', 'text/csv'));
    await uploadFile(makeUnreadableFile('locked.csv'));

    const payloads = vi.mocked(apiClient.uploadDocumentToObjectStore).mock.calls.map(([payload]) => payload);
    expect(payloads[0]).toMatchObject({ fileType: 'CSV', recordsCount: 2 });
    expect(payloads[1]).toMatchObject({ recordsCount: 14200 });
  });

  it('counts TXT lines and uploads PDF and ZIP documents without parsing their contents', async () => {
    await renderPage();

    await uploadFile(makeTextFile('notes.txt', 'line one\nline two\n'));
    await uploadFile(makeTextFile('contract.pdf', '%PDF-1.4', 'application/pdf'));
    await uploadFile(makeTextFile('bundle.zip', 'PK', 'application/zip'));

    const payloads = vi.mocked(apiClient.uploadDocumentToObjectStore).mock.calls.map(([payload]) => payload);
    expect(payloads[0]).toMatchObject({ recordsCount: 1 });
    expect(payloads[1]).toMatchObject({ fileType: 'PDF', recordsCount: 0 });
    expect(payloads[2]).toMatchObject({ recordsCount: 0 });
    const queueDoc = readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')[0];
    expect(queueDoc.file_type).toBe('ZIP');
  });

  it('sends no base64 payload when the file reader fails', async () => {
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementationOnce(function (this: FileReader) {
      this.dispatchEvent(new ProgressEvent('error'));
    });
    await renderPage();

    await uploadFile(makeTextFile('reader.csv', 'PO\n1\n', 'text/csv'));

    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(
      expect.objectContaining({ fileBase64: undefined })
    );
  });

  it('applies the canonical view returned by an upload for the active data version', async () => {
    await renderPage();
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-U', activeDataVersionId: 'DV-U', status: 'DRAFT' }));
    vi.mocked(apiClient.uploadDocumentToObjectStore).mockResolvedValueOnce(
      asUploadResponse({
        success: true,
        data: {
          canonical: buildCanonical({
            assessmentId: 'ASM-U',
            dataVersionId: 'DV-U',
            validFxNormalizedSpendCr: 77.7,
            sourceRowCount: 500,
            uniqueItems: 210
          }),
          analysisJob: buildJob({ analysisJobId: 'JOB-U' })
        }
      })
    );
    await switchTab('module1', 'module1');

    await uploadFile(makeTextFile('canonical.csv', 'PO\n1\n', 'text/csv'));

    expect(readProp<number | undefined>('module1', 'uniqueItemsCount')).toBe(210);
    expect(readProp<AnalysisJob | null>('customerAnalysis', 'activeJob')).toMatchObject({ analysisJobId: 'JOB-U' });
    expect(screen.getByText(UI_STRINGS.toasts.batchUploadSpend('canonical.csv', 77.7, 500))).toBeInTheDocument();
  });

  it('loads the analysis job separately when the upload response has none', async () => {
    vi.mocked(orchestrationApi.getJobs)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([buildJob({ analysisJobId: 'JOB-L' })]);
    await renderPage();

    await uploadFile(makeTextFile('no-job.csv', 'PO\n1\n', 'text/csv'));
    expect(readProp<AnalysisJob | null>('customerAnalysis', 'activeJob')).toMatchObject({ analysisJobId: 'JOB-L' });

    vi.mocked(orchestrationApi.getJobs).mockRejectedValueOnce(new Error('jobs offline'));
    await uploadFile(makeTextFile('no-job-2.csv', 'PO\n1\n', 'text/csv'));
    expect(readProp<AnalysisJob | null>('customerAnalysis', 'activeJob')).toMatchObject({ analysisJobId: 'JOB-L' });
  });

  it('logs a warning and keeps the popup closed when the upload request fails', async () => {
    vi.mocked(apiClient.uploadDocumentToObjectStore).mockRejectedValueOnce(new Error('Object store unavailable'));
    await renderPage();

    await uploadFile(makeTextFile('rejected.csv', 'PO\n1\n', 'text/csv'));

    expect(mocks.logger.warn).toHaveBeenCalled();
    expect(readProp<{ isOpen: boolean }>('detailedAnalysis', 'isOpen')).toBe(false);
  });
});

describe('Home page: Module 2 categorization', () => {
  it('requires an assessment for categorization and a material code for reassignment', async () => {
    await renderPage();
    await switchTab('module2', 'module2');

    await runProp('module2', 'onStartAICategorization');
    expect(screen.getByText(UI_STRINGS.toasts.module2AssessmentRequired)).toBeInTheDocument();

    await runProp('reassign', 'onSave', 'MISSING-MAPPING', '31161500', 'Bolts', 'Direct Materials');
    expect(screen.getByText(UI_STRINGS.toasts.module2MaterialCodeRequired)).toBeInTheDocument();
  });

  it('confirms a line item mapping and reassigns another through the reassign modal', async () => {
    await seedModule2();
    const [first, second] = readProp<LineItemMapping[]>('module2', 'lineItems');

    await runProp('module2', 'onConfirmMapping', first.mapping_id);
    expect(readProp<LineItemMapping[]>('module2', 'lineItems')[0].status).toBe('Confirmed');
    expect(mocks.saveModule2MaterialMappings).toHaveBeenLastCalledWith('ASM-M2', [expect.objectContaining({
      sourceMaterialId: first.material_code,
      unspscCode: first.unspsc_code,
      reviewStatus: 'CLIENT_APPROVED'
    })]);
    expect(screen.getByText(UI_STRINGS.toasts.unspscConfirmed(first.mapping_id))).toBeInTheDocument();

    await runProp('module2', 'onReassignMapping', second);
    expect(readProp<LineItemMapping | null>('reassign', 'item')).toBe(second);

    await runProp('reassign', 'onSave', second.mapping_id, '31161500', 'Bolts', 'Indirect & MRO');
    expect(readProp<LineItemMapping[]>('module2', 'lineItems')[1]).toMatchObject({
      unspsc_code: '31161500',
      core_bucket: 'Direct Materials',
      status: 'Confirmed'
    });
    expect(screen.getByText(UI_STRINGS.toasts.taxonomyReassigned('31161500', 'Direct Materials'))).toBeInTheDocument();
    expect(mocks.saveModule2MaterialMappings).toHaveBeenLastCalledWith('ASM-M2', [expect.objectContaining({
      sourceMaterialId: second.material_code,
      unspscCode: '31161500',
      reviewStatus: 'CLIENT_APPROVED'
    })]);

    await runProp('reassign', 'onClose');
    expect(readProp<LineItemMapping | null>('reassign', 'item')).toBeNull();
  });

  it('applies AI categorization mappings and falls back to the default model label', async () => {
    await seedModule2();
    vi.mocked(aiApiClient.categorizeItems).mockResolvedValueOnce(
      asCategorizeResult({
        success: true,
        model: 'gemini-test',
        mappings: [
          {
            rawLineText: 'Steel Bolt M8',
            mappedUnspscCode: '31161500',
            unspscTitle: 'Bolts',
            suggestedBucket: 'Indirect & MRO',
            confidenceScore: 97
          },
          { rawLineText: 'Cardboard', mappedUnspscCode: '', unspscTitle: '', suggestedBucket: '' }
        ]
      })
    );

    await runProp('module2', 'onStartAICategorization');

    const items = readProp<LineItemMapping[]>('module2', 'lineItems');
    expect(mocks.saveModule2MaterialMappings).toHaveBeenLastCalledWith('ASM-M2', expect.arrayContaining([
      expect.objectContaining({ sourceMaterialId: 'MAT-MAP-1', reviewStatus: 'PROVISIONAL' })
    ]));
    expect(items[0]).toMatchObject({ unspsc_code: '31161500', ai_confidence: 97, status: 'Pending Review', core_bucket: 'Direct Materials' });
    expect(items[1]).toMatchObject({ ai_confidence: 99.4, status: 'Pending Review' });
    expect(items[2].status).toBe('Pending Review');

    vi.mocked(aiApiClient.categorizeItems).mockResolvedValueOnce(
      asCategorizeResult({
        success: true,
        mappings: [
          { rawLineText: 'Zebra saddle', mappedUnspscCode: '31161500', unspscTitle: 'Saddles', suggestedBucket: 'Logistics & Freight', confidenceScore: 91 }
        ]
      })
    );
    await runProp('module2', 'onStartAICategorization');
    expect(readProp<LineItemMapping[]>('module2', 'lineItems')[2].ai_confidence).toBe(91);
  });

  it('does not apply a mapping when the source material has no stable D1 identifier', async () => {
    await seedModule2([buildLineItem('MAP-NO-MATERIAL', 'Steel Bolt M8', { material_code: undefined })]);
    const [item] = readProp<LineItemMapping[]>('module2', 'lineItems');
    await runProp('module2', 'onConfirmMapping', item.mapping_id);
    expect(screen.getByText(UI_STRINGS.toasts.module2MaterialCodeRequired)).toBeInTheDocument();
    expect(mocks.saveModule2MaterialMappings).not.toHaveBeenCalled();
  });

  it('keeps the previous D1 mapping visible when saving a decision fails', async () => {
    await seedModule2();
    const [item] = readProp<LineItemMapping[]>('module2', 'lineItems');
    vi.mocked(mocks.saveModule2MaterialMappings).mockRejectedValueOnce(
      new Error(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.mappingServerRejected(503)))
    );
    await runProp('module2', 'onConfirmMapping', item.mapping_id);
    expect(readProp<LineItemMapping[]>('module2', 'lineItems')[0].status).toBe('Pending');
    expect(screen.getByText(UI_STRINGS.toasts.module2MappingFailed(UI_STRINGS.toasts.mappingServerRejected(503)))).toBeInTheDocument();
  });

  it('falls back to catalog matching when the AI response has no mappings or the call fails', async () => {
    await seedModule2();
    vi.mocked(aiApiClient.categorizeItems).mockResolvedValueOnce(asCategorizeResult({ success: false, mappings: [] }));

    await runProp('module2', 'onStartAICategorization');
    expect(readProp<LineItemMapping[]>('module2', 'lineItems').every((item) => item.status === 'Pending Review')).toBe(true);

    vi.mocked(aiApiClient.categorizeItems).mockRejectedValueOnce(new Error('AI gateway timeout'));
    await runProp('module2', 'onStartAICategorization');
    expect(frontendLogger.error).toHaveBeenCalled();
    expect(readProp<LineItemMapping[]>('module2', 'lineItems').every((item) => item.status === 'Pending Review')).toBe(true);
  });

  it('stops AI categorization and shows the catalog error when the taxonomy cannot load', async () => {
    await seedModule2();
    vi.mocked(loadUNSPSCTaxonomy).mockRejectedValueOnce(new Error('catalog unavailable'));
    vi.mocked(getTaxonomyLoadState).mockReturnValueOnce({ isLoading: false, error: CATALOG_ERROR });

    await runProp('module2', 'onStartAICategorization');

    expect(screen.getByText(CATALOG_ERROR)).toBeInTheDocument();
    expect(aiApiClient.categorizeItems).not.toHaveBeenCalled();
  });

  it('starts AI categorization from Module 1 and opens Module 2', async () => {
    await renderPage();
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-AI-START', activeDataVersionId: 'DV-AI-START' }));
    await switchTab('module1', 'module1');

    await runProp('module1', 'onRunAICategorization');

    await waitFor(() => {
      expect(mocks.props.module2).toBeDefined();
    });
    expect(aiApiClient.categorizeItems).toHaveBeenCalled();
  });

  it('moves Module 2 to Module 3 and Module 3 to Module 4 with their transition toasts', async () => {
    await renderPage();
    await switchTab('module2', 'module2');

    await runProp('module2', 'onProceedToTrend');
    await waitFor(() => {
      expect(mocks.props.module3).toBeDefined();
    });
    expect(screen.getByText(UI_STRINGS.toasts.transitioningToVolatility)).toBeInTheDocument();

    await runProp('module3', 'onProceedToSavings');
    await waitFor(() => {
      expect(mocks.props.module4).toBeDefined();
    });
    expect(screen.getByText(UI_STRINGS.toasts.launchingSavings)).toBeInTheDocument();
  });
});

describe('Home page: Modules 4 and 5, pipeline navigation', () => {
  it('pushes opportunities to proCPX and DPS NXT and logs deployment failures', async () => {
    await renderPage();
    await switchTab('module4', 'module4');
    const [proOpportunity, dpsOpportunity] = readProp<SavingsOpportunity[]>('module4', 'opportunities');

    await runProp('module4', 'onOpenProCPX', proOpportunity);
    expect(readProp<SavingsOpportunity | null>('proCPX', 'opportunity')).toBe(proOpportunity);
    await runProp('proCPX', 'onSuccess', proOpportunity.opp_id);
    expect(apiClient.deployOpportunity).toHaveBeenCalledWith(proOpportunity.opp_id, 'proCPX');
    expect(screen.getByText(UI_STRINGS.toasts.pushedToProCPX(proOpportunity.opp_id))).toBeInTheDocument();
    await runProp('proCPX', 'onClose');

    await runProp('module4', 'onOpenDPSNXT', dpsOpportunity);
    const deploymentError = new Error('DPS sync failed');
    vi.mocked(apiClient.deployOpportunity).mockRejectedValueOnce(deploymentError);
    await expect(runProp('dpsNXT', 'onSuccess', dpsOpportunity.opp_id)).rejects.toBe(deploymentError);
    expect(apiClient.deployOpportunity).toHaveBeenLastCalledWith(dpsOpportunity.opp_id, 'DPS NXT');
    expect(screen.queryByText(UI_STRINGS.toasts.deployedToDPSNXT(dpsOpportunity.opp_id))).not.toBeInTheDocument();

    vi.mocked(apiClient.deployOpportunity).mockResolvedValueOnce({
      ...dpsOpportunity,
      status: 'Pushed to DPS NXT'
    });
    await runProp('dpsNXT', 'onSuccess', dpsOpportunity.opp_id);
    expect(readProp<SavingsOpportunity[]>('module4', 'opportunities').find(
      (opportunity) => opportunity.opp_id === dpsOpportunity.opp_id
    )?.status).toBe('Pushed to DPS NXT');

    vi.mocked(apiClient.deployOpportunity).mockResolvedValueOnce(dpsOpportunity);
    await runProp('dpsNXT', 'onSuccess', 'OPP-NOT-IN-STATE');
    expect(readProp<SavingsOpportunity[]>('module4', 'opportunities').some(
      (opportunity) => opportunity.opp_id === 'OPP-NOT-IN-STATE'
    )).toBe(false);
    await runProp('dpsNXT', 'onClose');
  });

  it('navigates to a module section and shows the locked-step message for each gated tab', async () => {
    await renderPage();
    await switchTab('module4', 'module4');

    await runProp('module4', 'onNavigateToSection', 'module2', 'sec-anchor');
    expect(screen.getByText(UI_STRINGS.toasts.navigatingToInitiativeSection('sec-anchor'))).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.props.module2).toBeDefined();
    });
    expect(readProp<string | null>('module2', 'targetSection')).toBe('sec-anchor');

    await runProp('pipeline', 'onLockedTabClick', 'module2');
    expect(screen.getByText(UI_STRINGS.pipeline.lockedStep1Required)).toBeInTheDocument();
    await runProp('pipeline', 'onLockedTabClick', 'module3');
    expect(screen.getByText(UI_STRINGS.pipeline.lockedStep2Required)).toBeInTheDocument();
    await runProp('pipeline', 'onLockedTabClick', 'module4');
    expect(screen.getByText(UI_STRINGS.pipeline.lockedStep3Required)).toBeInTheDocument();
    await runProp('pipeline', 'onLockedTabClick', 'module5');
    expect(screen.getByText(UI_STRINGS.pipeline.lockedStep4Required)).toBeInTheDocument();
    await runProp('pipeline', 'onLockedTabClick', 'assessment');
    expect(screen.getByText(UI_STRINGS.pipeline.lockedStep1Required)).toBeInTheDocument();
  });

  it('completes Module 4 into Module 5 and opens the executive brief route from the conversion matrix', async () => {
    await renderPage();
    await switchTab('module4', 'module4');
    await runProp('module4', 'onProceedToConversion');
    await waitFor(() => {
      expect(mocks.props.module5).toBeDefined();
    });
    expect(screen.getByText(UI_STRINGS.toasts.openingConversion)).toBeInTheDocument();

    const fakeLocation = stubLocation();
    await runProp('module5', 'onOpenReport');
    expect(fakeLocation.href).toBe('/executive-brief');
  });

  it('opens the database schema view from the pipeline', async () => {
    await renderPage();

    await switchTab('schema', 'schema');

    expect(mocks.props.schema).toBeDefined();
  });
});

describe('Home page: header and shell actions', () => {
  it('logs out, clears the stored session, and confirms with the logout message', async () => {
    await renderPage();

    await runProp('header', 'onLogout');

    expect(authApiClient.clearStoredSession).toHaveBeenCalled();
    expect(readProp<UserProfile | null>('header', 'currentUser')).toBeNull();
    expect(screen.getByText(UI_STRINGS.auth.logout)).toBeInTheDocument();
  });

  it('saves client setup values, using existing values for blank fields and computing spend', async () => {
    await renderPage();

    const before = readProp<TenantMaster>('header', 'tenant');
    await runProp('header', 'onOpenClientSetup');
    expect(readProp<{ isOpen: boolean }>('clientSetup', 'isOpen')).toBe(true);
    await runProp('clientSetup', 'onConfirmAndUpload', {
      clientName: '',
      currency: '',
      region: '',
      majorSector: '',
      minorSector: '',
      estimatedSpend: 0
    });
    expect(before.enterprise_name).toBe(BUYER_COMPANY);
    expect(apiClient.updateTenant).toHaveBeenLastCalledWith(
      expect.objectContaining({ enterprise_name: before.enterprise_name, base_currency: before.base_currency })
    );

    await runProp('header', 'onOpenClientSetup');
    await runProp('clientSetup', 'onConfirmAndUpload', {
      clientName: 'Northwind Metals',
      currency: 'EUR',
      region: 'EU',
      majorSector: 'Metals',
      minorSector: 'Steel',
      estimatedSpend: 1000000000
    });
    expect(screen.getByText(UI_STRINGS.toasts.clientConfigUpdated('Northwind Metals'))).toBeInTheDocument();
    expect(readProp<TenantMaster>('header', 'tenant')).toMatchObject({
      enterprise_name: 'Northwind Metals',
      base_currency: 'EUR',
      total_spend_evaluated_inr: 100
    });
    expect(readProp<{ isOpen: boolean }>('clientSetup', 'isOpen')).toBe(false);
  });

  it('selects a tenant and currency and syncs both to the backend, logging rejected syncs', async () => {
    await renderPage();
    const picked = { ...mockTenant, enterprise_name: 'Picked Tenant' };

    await runProp('header', 'onSelectTenant', picked);
    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe('Picked Tenant');
    expect(apiClient.updateTenant).toHaveBeenCalledWith(picked);

    await runProp('header', 'onSelectCurrency', 'EUR');
    expect(readProp<string>('header', 'currency')).toBe('EUR');
    expect(apiClient.updateTenant).toHaveBeenLastCalledWith({ base_currency: 'EUR' });

    vi.mocked(apiClient.updateTenant).mockRejectedValueOnce(new Error('tenant sync failed'));
    await runProp('header', 'onSelectTenant', picked);
    await waitFor(() => {
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  it('opens the executive report route from the current origin', async () => {
    await renderPage();
    const fakeLocation = stubLocation('https://brief.example.com');

    await runProp('header', 'onOpenReport');

    expect(fakeLocation.href).toBe('https://brief.example.com/executive-brief');
  });

  it('opens a relative report route when the origin is unavailable', async () => {
    await renderPage();
    const fakeLocation = stubLocation('');

    await runProp('header', 'onOpenReport');

    expect(fakeLocation.href).toBe('/executive-brief');
  });

  it('opens the management brief, shows the empty report state, and closes it', async () => {
    await renderPage();

    await runProp('header', 'onOpenManagementBrief');

    expect(screen.getByTestId('management-quick-summary-modal')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.noActiveReportTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.orchestration.noActiveReportMessage)).toBeInTheDocument();

    await runProp('briefView', 'onBackToWorkspace');
    expect(screen.queryByTestId('management-quick-summary-modal')).not.toBeInTheDocument();
  });

  it('starts analysis from the header and completes it into the AI categorization toast', async () => {
    await renderPage();

    await runProp('header', 'onStartAnalysis');
    expect(readProp<string>('analyzingLoader', 'title')).toBe(UI_STRINGS.analyzingLoader.title);
    await runProp('analyzingLoader', 'onComplete');

    expect(screen.getByText(UI_STRINGS.toasts.runningAiCat)).toBeInTheDocument();
  });

  it('cancels a running analysis without raising errors', async () => {
    await renderPage();
    await runProp('header', 'onStartAnalysis');

    await runProp('analyzingLoader', 'onCancel');

    expect(mocks.logger.error).not.toHaveBeenCalled();
  });
});

describe('Home page: tiers, theme, and assessment toggle', () => {
  it('switches simulated subscription tiers and reports each change', async () => {
    await renderPage();

    await runProp('header', 'onSelectSimulatedTier', 'SILVER');
    expect(apiClient.setSimulatedTier).toHaveBeenCalledWith('SILVER');
    expect(screen.getByText(UI_STRINGS.subscription.simulationActive('SILVER'))).toBeInTheDocument();

    await runProp('header', 'onSelectSimulatedTier', null);
    expect(screen.getByText(UI_STRINGS.subscription.resetSimulation)).toBeInTheDocument();

    await runProp('module1', 'onUpgrade', 'GOLD');
    expect(apiClient.setSimulatedTier).toHaveBeenLastCalledWith('GOLD');
  });

  it('switches the theme and persists the choice', async () => {
    await renderPage();

    await runProp('header', 'onSelectTheme', 'dark');
    expect(window.localStorage.getItem('procucev_theme')).toBe('dark');
    expect(readProp<string>('header', 'theme')).toBe('dark');

    await runProp('header', 'onSelectTheme', 'light');
    expect(window.localStorage.getItem('procucev_theme')).toBe('light');
  });

  it('toggles the assessment workspace from the header', async () => {
    await renderPage();

    await runProp('header', 'onToggleAssessmentMode');
    await waitFor(() => {
      expect(mocks.props.assessmentWorkspace).toBeDefined();
    });

    delete mocks.props.module1;
    await runProp('header', 'onToggleAssessmentMode');
    await waitFor(() => {
      expect(mocks.props.module1).toBeDefined();
    });
  });

  it('applies the header tier selection to the Module 1 upgrade prompt', async () => {
    await renderPage();

    await runProp('module1', 'onUpgrade', 'SILVER');

    expect(apiClient.setSimulatedTier).toHaveBeenCalledWith('SILVER');
  });
});

describe('Home page: executive brief downloads', () => {
  it('downloads the executive brief and reports server and network failures', async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(new Response('{"error":"not ready"}', { status: 503, headers: { 'x-request-id': 'REQ-BRIEF-9' } }))
      .mockResolvedValueOnce(new Response('{"error":"not ready"}', { status: 500 }))
      .mockResolvedValueOnce(new Response('pptx-bytes', { status: 200 }))
      .mockResolvedValueOnce(new Response('pdf-bytes', { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const createObjectUrl = vi.fn(() => 'blob:brief-1');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectUrl });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await renderPage();
    await runProp('header', 'onOpenManagementBrief');

    await runProp('briefView', 'onDownloadPdf');
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.opportunityBrief.downloadFailed('PDF', 503, 'REQ-BRIEF-9'))).toBeInTheDocument();
    });

    await runProp('briefView', 'onDownloadPdf');
    await waitFor(() => {
      expect(
        screen.getByText(
          UI_STRINGS.opportunityBrief.downloadFailed('PDF', 500, UI_STRINGS.opportunityBrief.requestIdNotReturned)
        )
      ).toBeInTheDocument();
    });

    await runProp('briefView', 'onDownloadPptx');
    await waitFor(() => {
      expect(anchorClick).toHaveBeenCalledTimes(1);
    });
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(screen.getByText(UI_STRINGS.opportunityBrief.downloadLinkLabel)).toBeInTheDocument();

    await runProp('briefView', 'onDownloadPdf');
    await waitFor(() => {
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:brief-1');
    });

    await runProp('briefView', 'onDownloadPdf');
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.opportunityBrief.downloadNetworkFailed('PDF'))).toBeInTheDocument();
    });
    const [pdfUrl, pdfInit] = fetchMock.mock.calls[0];
    expect(pdfUrl).toBe('/api/reports/executive-brief/download/opportunity-brief/pdf');
    expect(new Headers(pdfInit?.headers).get('Authorization')).toBe('Bearer token-123');
    expect(new Headers(pdfInit?.headers).get('x-request-id')).toMatch(/^[A-Za-z0-9._:-]+$/u);
    const [pptxUrl, pptxInit] = fetchMock.mock.calls[2];
    expect(pptxUrl).toBe('/api/reports/executive-brief/download/opportunity-brief/pptx');
    expect(new Headers(pptxInit?.headers).get('Authorization')).toBe('Bearer token-123');
    // Unmount while the URL stubs still exist, so the payload cleanup can revoke the object URL.
    cleanup();
  });
});

describe('Home page: analysis jobs, reports, and the detailed analysis popup', () => {
  it('shows the analysis status card on Module 1 and routes its report actions', async () => {
    vi.mocked(orchestrationApi.getJobs).mockResolvedValue([buildJob({ analysisJobId: 'JOB-1' })]);
    await renderPage();
    await waitFor(() => {
      expect(mocks.props.customerAnalysis).toBeDefined();
    });
    expect(readProp<AnalysisJob | null>('customerAnalysis', 'activeJob')).toMatchObject({ analysisJobId: 'JOB-1' });

    await runProp('customerAnalysis', 'onViewSpendSummary');
    await runProp('customerAnalysis', 'onViewReport');

    expect(screen.getByTestId('management-quick-summary-modal')).toBeInTheDocument();
    expect(screen.getByTestId('management-report-empty-state')).toBeInTheDocument();
  });

  it('shows the newest non-superseded report in the management brief', async () => {
    vi.mocked(orchestrationApi.getJobs).mockResolvedValue([buildJob({ analysisJobId: 'JOB-1' })]);
    vi.mocked(orchestrationApi.getJobDetails).mockResolvedValue(
      asJobDetails({
        reports: [
          buildReport({ reportVersionId: 'RPT-1', status: 'SUPERSEDED', generatedAt: '2026-02-01T00:00:00.000Z' }),
          buildReport({ reportVersionId: 'RPT-2', status: 'SUBMITTED', generatedAt: '2026-02-03T00:00:00.000Z' }),
          buildReport({ reportVersionId: 'RPT-3', status: 'APPROVED', generatedAt: '2026-02-02T00:00:00.000Z' })
        ]
      })
    );
    await renderPage();
    await waitFor(() => {
      expect(orchestrationApi.getJobDetails).toHaveBeenCalledWith('JOB-1');
    });

    await runProp('header', 'onOpenManagementBrief');

    await waitFor(() => {
      expect(mocks.props.reportAcknowledgement).toBeDefined();
    });
    expect(readProp<string>('reportAcknowledgement', 'reportVersionId')).toBe('RPT-2');
    expect(readProp<string>('reportAcknowledgement', 'jobId')).toBe('JOB-1');
    expect(screen.queryByTestId('management-report-empty-state')).not.toBeInTheDocument();
  });

  it('ignores a report lookup that resolves after the active job changed', async () => {
    const stale = createDeferred<JobDetails>();
    vi.mocked(orchestrationApi.getJobs).mockResolvedValue([buildJob({ analysisJobId: 'JOB-1' })]);
    vi.mocked(orchestrationApi.getJobDetails).mockReturnValueOnce(stale.promise);
    await renderPage();
    vi.mocked(apiClient.uploadDocumentToObjectStore).mockResolvedValueOnce(
      asUploadResponse({ success: true, data: { analysisJob: buildJob({ analysisJobId: 'JOB-2' }) } })
    );
    await uploadFile(makeTextFile('next.csv', 'PO\n1\n', 'text/csv'));

    stale.resolve(asJobDetails({ reports: [buildReport({ reportVersionId: 'RPT-STALE', status: 'APPROVED' })] }));
    await settle();
    await runProp('header', 'onOpenManagementBrief');

    expect(screen.getByTestId('management-report-empty-state')).toBeInTheDocument();
  });

  it('warns when report versions cannot be loaded for the active job', async () => {
    vi.mocked(orchestrationApi.getJobs).mockResolvedValue([buildJob({ analysisJobId: 'JOB-1' })]);
    vi.mocked(orchestrationApi.getJobDetails).mockRejectedValue(new Error('details offline'));

    await renderPage();

    await waitFor(() => {
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  it('records the popup acknowledgement for the active job when the popup closes', async () => {
    await renderPage();
    vi.mocked(apiClient.uploadDocumentToObjectStore).mockResolvedValueOnce(
      asUploadResponse({ success: true, data: { analysisJob: buildJob({ analysisJobId: 'JOB-5' }) } })
    );
    await uploadFile(makeTextFile('popup.csv', 'PO\n1\n', 'text/csv'));
    expect(readProp<{ isOpen: boolean }>('detailedAnalysis', 'isOpen')).toBe(true);

    await runProp('detailedAnalysis', 'onClose');

    expect(readProp<{ isOpen: boolean }>('detailedAnalysis', 'isOpen')).toBe(false);
    expect(window.sessionStorage.getItem('procucev_analysis_popup_ack_JOB-5')).toBe('true');
  });

  it('continues to Module 1 from the popup and records the acknowledgement', async () => {
    await renderPage();
    vi.mocked(apiClient.uploadDocumentToObjectStore).mockResolvedValueOnce(
      asUploadResponse({ success: true, data: { analysisJob: buildJob({ analysisJobId: 'JOB-6' }) } })
    );
    await uploadFile(makeTextFile('popup-two.csv', 'PO\n1\n', 'text/csv'));
    await switchTab('module2', 'module2');
    delete mocks.props.module1;

    await runProp('detailedAnalysis', 'onContinueToModule1');

    await waitFor(() => {
      expect(mocks.props.module1).toBeDefined();
    });
    expect(window.sessionStorage.getItem('procucev_analysis_popup_ack_JOB-6')).toBe('true');
    await runProp('detailedAnalysis', 'onViewSpendSummary');
    expect(window.sessionStorage.getItem('procucev_analysis_popup_ack_JOB-6')).toBe('true');
  });

  it('closes the popup without an acknowledgement when no analysis job is attached', async () => {
    await renderPage();
    await uploadFile(makeTextFile('plain.csv', 'PO\n1\n', 'text/csv'));

    await runProp('detailedAnalysis', 'onClose');

    expect(readProp<{ isOpen: boolean }>('detailedAnalysis', 'isOpen')).toBe(false);
    expect(window.sessionStorage.length).toBe(0);
  });
});

describe('Home page: assessment selection and canonical Module 1 views', () => {
  it('records the selected customer and sets the tenant name when no assessment is active', async () => {
    await renderPage();
    await switchTab('assessment', 'assessmentWorkspace');
    const customer = buildCustomer('Northwind Metals');

    await runProp('assessmentWorkspace', 'onSelectCustomer', customer);
    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe('Northwind Metals');
    expect(readProp<CustomerRecord | null>('header', 'activeCustomer')).toBe(customer);

    await runProp('assessmentWorkspace', 'onSelectCustomer', null);
    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe(UI_STRINGS.header.noActiveCustomer);
  });

  it('keeps the tenant name when a customer is picked while an assessment is active', async () => {
    await renderPage();
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-A', customerName: 'Acme Industrial' }));

    await runProp('assessmentWorkspace', 'onSelectCustomer', buildCustomer('Other Customer'));

    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe('Acme Industrial');
    expect(readProp<CustomerRecord | null>('header', 'activeCustomer')?.customerName).toBe('Other Customer');
  });

  it('clears the active assessment and restores the selected customer name', async () => {
    await renderPage();
    await switchTab('assessment', 'assessmentWorkspace');
    await runProp('assessmentWorkspace', 'onSelectCustomer', buildCustomer('Northwind Metals'));
    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', buildAssessment({ assessmentId: 'ASM-B' }));

    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', null);

    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe('Northwind Metals');
    expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')).toBeNull();
  });

  it('opens Module 1 with the chosen assessment', async () => {
    await renderPage();
    await switchTab('assessment', 'assessmentWorkspace');
    delete mocks.props.module1;

    await runProp('assessmentWorkspace', 'onNavigateToModule1', buildAssessment({ assessmentId: 'ASM-N' }));

    await waitFor(() => {
      expect(mocks.props.module1).toBeDefined();
    });
    expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')?.assessmentId).toBe('ASM-N');
  });

  it('applies the canonical Module 1 view with pareto hierarchy and module statuses', async () => {
    await renderPage();
    await attachAssessment(
      buildAssessment({
        assessmentId: 'ASM-C1',
        status: 'IN_PROGRESS',
        activeDataVersionId: 'DV-C1',
        activeAnalysisRunId: 'RUN-C1',
        validatedSpendCr: 120.5,
        canonicalModule1: buildCanonical({ assessmentId: 'ASM-C1', dataVersionId: 'DV-C1' })
      })
    );
    await switchTab('module1', 'module1');

    expect(readProp<unknown[]>('module1', 'materialGroupSummaries')).toHaveLength(2);
    expect(readProp<unknown[]>('module1', 'plantSummaries')).toHaveLength(1);
    expect(readProp<unknown[]>('module1', 'monthWiseSummaries')).toHaveLength(2);
    expect(readProp<{ vendorHierarchy: unknown[] }>('module1', 'paretoSpendData').vendorHierarchy).toHaveLength(1);
    expect(readProp<boolean>('pipeline', 'isStep1Complete')).toBe(true);
    expect(readProp<boolean>('pipeline', 'isStep2Complete')).toBe(true);
    expect(readProp<boolean>('pipeline', 'isStep3Complete')).toBe(false);
  });

  it('applies a supplier-based pareto when the canonical view has no hierarchy', async () => {
    await renderPage();
    vi.mocked(apiClient.getCanonicalModule1).mockResolvedValueOnce(
      asCanonicalResponse(
        buildCanonical({
          assessmentId: 'ASM-C2',
          dataVersionId: 'DV-C2',
          paretoHierarchy: undefined,
          moduleStatuses: undefined,
          supplierSpend: asSupplierSpend([
            { supplier_name: 'Alpha', spend_inr_cr: 40, share_pct: 33, cumulative_share_pct: 33 },
            { supplierName: 'Beta', spendCr: 20, sharePct: 16, cumulativePct: 49 },
            { spend_inr_cr: 5 }
          ])
        })
      )
    );
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-C2', activeDataVersionId: 'DV-C2', status: 'DRAFT' }));
    await switchTab('module1', 'module1');

    const pareto = readProp<{ vendorHierarchy: Array<{ name: string }>; paretoSpendCr: number }>(
      'module1',
      'paretoSpendData'
    );
    expect(pareto.vendorHierarchy).toHaveLength(3);
    expect(pareto.vendorHierarchy.slice(0, 2).map((parent) => parent.name)).toEqual(['Alpha', 'Beta']);
    expect(pareto.paretoSpendCr).toBe(96.4);
  });

  it('applies zero pareto totals when suppliers exist but no pareto summary is supplied', async () => {
    await renderPage();
    vi.mocked(apiClient.getCanonicalModule1).mockResolvedValueOnce(
      asCanonicalResponse(
        buildCanonical({
          assessmentId: 'ASM-C3',
          dataVersionId: 'DV-C3',
          paretoHierarchy: undefined,
          pareto: undefined,
          periodMetadata: undefined,
          supplierSpend: [{ supplier_name: 'Gamma', spend_inr_cr: 12 }]
        })
      )
    );
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-C3', activeDataVersionId: 'DV-C3', status: 'DRAFT' }));
    await switchTab('module1', 'module1');

    expect(readProp<{ paretoSpendCr: number; paretoPct: number }>('module1', 'paretoSpendData')).toMatchObject({
      paretoSpendCr: 0,
      paretoPct: 0
    });
  });
});

describe('Home page: canonical sync reconciliation', () => {
  it('applies canonical responses only when they match the active assessment data version', async () => {
    await renderPage();
    vi.mocked(apiClient.getCanonicalModule1)
      .mockResolvedValueOnce(asCanonicalResponse({ data: buildCanonical({ assessmentId: 'ASM-S', dataVersionId: 'DV-S' }) }))
      .mockResolvedValueOnce(asCanonicalResponse(buildCanonical({ assessmentId: 'ASM-T', dataVersionId: 'DV-OTHER' })))
      .mockResolvedValueOnce(asCanonicalResponse(buildCanonical({ assessmentId: 'ASM-OTHER', dataVersionId: 'DV-U2' })))
      .mockRejectedValueOnce(new Error('canonical offline'))
      .mockResolvedValueOnce(null);
    vi.mocked(apiClient.getModule2CanonicalLineItems).mockRejectedValueOnce(new Error('line items offline'));
    await switchTab('assessment', 'assessmentWorkspace');

    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', buildAssessment({ assessmentId: 'ASM-S', activeDataVersionId: 'DV-S', status: 'DRAFT' }));
    expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')?.assessmentId).toBe('ASM-S');
    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', buildAssessment({ assessmentId: 'ASM-T', activeDataVersionId: 'DV-T', status: 'DRAFT' }));
    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', buildAssessment({ assessmentId: 'ASM-U2', activeDataVersionId: 'DV-U2', status: 'DRAFT' }));
    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', buildAssessment({ assessmentId: 'ASM-V', activeDataVersionId: 'DV-V', status: 'DRAFT' }));
    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', buildAssessment({ assessmentId: 'ASM-W', activeDataVersionId: 'DV-W', status: 'DRAFT' }));
    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', buildAssessment({ assessmentId: 'ASM-X', status: 'DRAFT' }));

    expect(apiClient.getCanonicalModule1).toHaveBeenCalledTimes(5);
    expect(mocks.logger.warn).toHaveBeenCalled();
    expect(mocks.logger.error).toHaveBeenCalled();
    await switchTab('module1', 'module1');
    expect(readProp<number | undefined>('module1', 'uniqueItemsCount')).toBeUndefined();
  });

  it('keeps Module 1 empty when an assessment has no active data version', async () => {
    await renderPage();
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-NODV', status: 'DRAFT' }));
    await switchTab('module1', 'module1');

    expect(apiClient.getCanonicalModule1).not.toHaveBeenCalled();
    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')).toEqual([]);
  });

  it('loads Module 2 line items for an active data version', async () => {
    await seedModule2();

    expect(readProp<LineItemMapping[]>('module2', 'lineItems')).toHaveLength(3);
    expect(apiClient.getModule2CanonicalLineItems).toHaveBeenCalledWith(undefined, 'ASM-M2');
  });
});

describe('Home page: modal closers, sync failures, and storage fallbacks', () => {
  it('closes the currency, vendor, item, and client setup modals through their close handlers', async () => {
    await renderPage();

    await runProp('module1', 'onFixCurrency', buildRecord('VAL-X'));
    await runProp('fixCurrency', 'onClose');
    expect(readProp<ValidationPreCheckRecord | null>('fixCurrency', 'record')).toBeNull();

    await runProp('module1', 'onMergeVendor', buildRecord('VAL-Y'));
    await runProp('mergeVendor', 'onClose');
    expect(readProp<ValidationPreCheckRecord | null>('mergeVendor', 'record')).toBeNull();

    await runProp('module1', 'onMergeItem', buildRecord('VAL-Z'));
    await runProp('mergeItem', 'onClose');
    expect(readProp<ValidationPreCheckRecord | null>('mergeItem', 'record')).toBeNull();

    await runProp('header', 'onOpenClientSetup');
    await runProp('clientSetup', 'onClose');
    expect(readProp<{ isOpen: boolean }>('clientSetup', 'isOpen')).toBe(false);
  });

  it('logs each backend sync failure from the optimistic Module 1 and Module 4 updates', async () => {
    await renderPage();
    const [record] = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');
    const syncError = new Error('sync offline');

    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce(syncError);
    await runProp('fixCurrency', 'onFix', record.record_id, 'EUR', 4200);
    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce(syncError);
    await runProp('mergeVendor', 'onMerge', record.record_id, 'VND-1', 'Master');
    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce(syncError);
    await runProp('mergeItem', 'onMerge', record.record_id, 'ITM-1', 'Bolt');
    vi.mocked(apiClient.updateValidationRecord).mockRejectedValueOnce(syncError);
    await runProp('mergeVendor', 'onIgnore', record.record_id);
    vi.mocked(apiClient.applyBlanketRemediation).mockRejectedValueOnce(syncError);
    await runProp('module1', 'onApplyBlanketFixes');
    vi.mocked(apiClient.resetValidationRecords).mockRejectedValueOnce(syncError);
    await runProp('module1', 'onResetValidationRecords');
    vi.mocked(apiClient.deleteIngestionDocument).mockRejectedValueOnce(syncError);
    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');
    vi.mocked(apiClient.deployOpportunity).mockRejectedValueOnce(syncError);
    await expect(runProp('proCPX', 'onSuccess', 'OPP-PAGE-001')).rejects.toBe(syncError);
    vi.mocked(apiClient.updateTenant).mockRejectedValueOnce(syncError);
    await runProp('header', 'onSelectCurrency', 'GBP');
    vi.mocked(apiClient.updateTenant).mockRejectedValueOnce(syncError);
    await runProp('clientSetup', 'onConfirmAndUpload', { clientName: 'Sync Co', estimatedSpend: 0 });

    await waitFor(() => {
      expect(mocks.logger.warn).toHaveBeenCalledTimes(9);
    });
  });

  it('tolerates storage failures while deleting, uploading, and acknowledging the popup', async () => {
    await renderPage();
    vi.mocked(apiClient.uploadDocumentToObjectStore).mockResolvedValueOnce(
      asUploadResponse({ success: true, data: { analysisJob: buildJob({ analysisJobId: 'JOB-S' }) } })
    );
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');
    await uploadFile(makeTextFile('blocked.csv', 'PO\n1\n', 'text/csv'));
    removeSpy.mockRestore();
    expect(readProp<{ isOpen: boolean }>('detailedAnalysis', 'isOpen')).toBe(true);

    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    await runProp('detailedAnalysis', 'onClose');
    await runProp('detailedAnalysis', 'onContinueToModule1');
    await runProp('detailedAnalysis', 'onViewSpendSummary');
    setSpy.mockRestore();

    expect(readProp<{ isOpen: boolean }>('detailedAnalysis', 'isOpen')).toBe(false);
    expect(readProp<TenantMaster>('header', 'tenant').total_spend_evaluated_inr).toBe(0);
  });

  it('continues hydration when the stored user lookup throws, and restores the saved theme', async () => {
    window.localStorage.setItem('procucev_theme', 'dark');
    vi.mocked(apiClient.getStoredUser).mockImplementationOnce(() => {
      throw new Error('storage blocked');
    });

    await renderPage();

    expect(readProp<string>('header', 'theme')).toBe('dark');
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toHaveLength(1);
  });
});

describe('Home page: hydration defaults and optional payload fields', () => {
  it('hydrates the tenant from the backend when the buyer profile is absent at load time', async () => {
    vi.mocked(authApiClient.getStoredUser)
      .mockReturnValueOnce(BUYER_USER)
      .mockReturnValueOnce({ ...BUYER_USER, role: 'ADMIN' } as UserProfile);
    vi.mocked(apiClient.getTenant).mockResolvedValue({
      ...mockTenant,
      enterprise_name: '',
      total_spend_evaluated_inr: undefined,
      total_spend_evaluated: undefined
    });
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [buildDocument({ doc_id: 'DOC-NO-TENANT', tenant_id: '' })],
        validationRecords: []
      })
    );

    await renderPage();

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')[0]).toMatchObject({
      doc_id: 'DOC-NO-TENANT',
      tenant_id: ''
    });
    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe(EMPTY_TENANT.enterprise_name);
  });

  it('keeps empty arrays when category, vendor, and savings payloads omit their lists', async () => {
    vi.mocked(authApiClient.getStoredUser).mockReturnValue({ ...BUYER_USER, company_name: '' } as UserProfile);
    vi.mocked(apiClient.getCategories).mockResolvedValue(asCategories({ categoryDetails: [] }));
    vi.mocked(apiClient.getVendors).mockResolvedValue(asVendors({ vendorDetails: [] }));
    vi.mocked(apiClient.getSavingsOpportunities).mockResolvedValue(asSavings({ totalPotentialSavingsCr: 0 }));

    await renderPage();
    await switchTab('module3', 'module3');
    expect(readProp<unknown[]>('module3', 'vendorRankings')).toEqual([]);
    await switchTab('module4', 'module4');
    expect(readProp<unknown[]>('module4', 'opportunities')).toEqual([]);
  });

  it('keeps the spreadsheet tenant defaults when backend tenant totals are missing', async () => {
    vi.mocked(apiClient.getTenant).mockResolvedValue({
      ...mockTenant,
      total_spend_evaluated_inr: undefined,
      total_spend_evaluated: undefined
    });

    await renderPage();

    expect(readProp<TenantMaster>('header', 'tenant').total_spend_evaluated_inr).toBe(0);
    expect(readProp<TenantMaster>('header', 'tenant').enterprise_name).toBe(BUYER_COMPANY);
  });

  it('treats a missing ingestion queue as an empty queue', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(asIngestion({ validationRecords: [buildRecord('VAL-NOQ')] }));

    await renderPage();

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')).toEqual([]);
  });

  it('applies the stored assessment list tie-break and the eligible financial path without a validated figure', async () => {
    vi.mocked(assessmentApiClient.getOperatingMode).mockResolvedValue(INTERNAL_MODE);
    vi.mocked(assessmentApiClient.getAssessmentById).mockResolvedValue(
      buildAssessment({
        assessmentId: 'ASM-E',
        status: 'ACCEPTED',
        isReportAccepted: true,
        activeDataVersionId: 'DV-E',
        activeAnalysisRunId: 'RUN-E',
        potentialSavingsCr: 3
      })
    );
    window.localStorage.setItem('aicev_selected_assessment_id', 'ASM-E');

    await renderPage();

    await waitFor(() => {
      expect(readProp<AssessmentRecord | null>('header', 'activeAssessment')?.assessmentId).toBe('ASM-E');
    });
    expect(readProp<TenantMaster>('header', 'tenant').total_spend_evaluated_inr).toBe(0);
  });
});

describe('Home page: analysis metrics, upload variants, and AI fallbacks', () => {
  it('derives analysis metrics from empty, hydrated, and uploaded dataset states', async () => {
    vi.mocked(apiClient.getVendors).mockResolvedValue({ vendorRankings: [], vendorDetails: [] });
    vi.mocked(apiClient.getCategories).mockResolvedValue({ categories: [], categoryDetails: [] });
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({ queue: [buildDocument({ records_count: 0 })], validationRecords: [] })
    );
    await renderPage();
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-METRICS', activeDataVersionId: 'DV-METRICS' }));
    await switchTab('module1', 'module1');

    await runProp('header', 'onStartAnalysis');
    await runProp('analyzingLoader', 'onCancel');
    await runProp('module1', 'onApplyBlanketFixes');
    await runProp('analyzingLoader', 'onComplete');
    await runProp('module1', 'onRefreshWithFixes');
    await runProp('analyzingLoader', 'onComplete');
    await runProp('module1', 'onRunAICategorization');
    await runProp('analyzingLoader', 'onComplete');
    await switchTab('module1', 'module1');

    await uploadFile(makeBinaryFile('metrics.xlsx', buildWorkbookBytes(RICH_ROWS), XLSX_MIME));
    await runProp('header', 'onStartAnalysis');
    await runProp('analyzingLoader', 'onComplete');
    await runProp('module1', 'onApplyBlanketFixes');
    await runProp('analyzingLoader', 'onComplete');
    await runProp('module1', 'onRefreshWithFixes');
    await runProp('analyzingLoader', 'onComplete');
    await switchTab('module1', 'module1');

    await runProp('module1', 'onDeleteDocument', 'DOC-PAGE-001');
    await runProp('header', 'onStartAnalysis');
    expect(readProp<{ totalRecords: number }>('analyzingLoader', 'metrics').totalRecords).toBe(RICH_ROWS.length);
    await runProp('analyzingLoader', 'onComplete');
  });

  it('classifies rows with partial spreadsheet columns, numeric descriptions, and analyst-confirmed currency', async () => {
    await renderPage();
    await switchTab('assessment', 'assessmentWorkspace');
    await runProp('assessmentWorkspace', 'onSelectCustomer', buildCustomer('Northwind Metals'));
    await switchTab('module1', 'module1');
    const rows = [
      { Description: 'Cardboard', Qty: 10, Cost: 5, Department: 'Packaging', Year: 2024, Supplier: 'Box Co', Material: 'MAT-1', Currency: 'USD' },
      { Description: '123', Qty: 4, Cost: 25, Department: 'Freight', Year: 'n/a', Supplier: '', Material: 'M-777', Currency: 'EUR' },
      { Description: '', Qty: 'x', Cost: 0, Department: '', Year: 2023, Supplier: 'Alpha', Material: 'MAT-9', Currency: 'INR' },
      { Description: 'Lubricant grease', Qty: 2, Cost: 40, Department: 'Consumables', Year: 2025, Supplier: 'Logi Ltd', Material: '', Currency: '' },
      { Description: 'Mystery carton', Qty: 3, Cost: 12, Department: 'Packaging', Year: 2024, Supplier: 'Box Co', Material: '', Currency: 'usd' },
      { Description: '', Qty: 1, Cost: 9, Department: 'Freight', Year: 2024, Supplier: 'Logi Ltd', Material: 'M-778', Currency: 'USD' }
    ];

    await uploadFile(makeBinaryFile('partial_columns.xlsx', buildWorkbookBytes(rows), XLSX_MIME));

    expect(apiClient.uploadDocumentToObjectStore).toHaveBeenCalledWith(
      expect.objectContaining({ recordsCount: rows.length })
    );
    await switchTab('module2', 'module2');
    const items = readProp<LineItemMapping[]>('module2', 'lineItems');
    expect(items.map((item) => item.raw_desc)).toContain('M-777');
    expect(items).toHaveLength(rows.length);
  });

  it('applies AI fallbacks for missing mapping text, zero spend lines, and catalog-matched items', async () => {
    vi.mocked(apiClient.getModule2CanonicalLineItems).mockResolvedValue([
      buildLineItem('MAP-A', 'Cardboard', { inr_crores: 0, total_spend: 7 }),
      buildLineItem('MAP-B', 'Zebra saddle', { inr_crores: 0.3 })
    ]);
    await renderPage();
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-AI', activeDataVersionId: 'DV-AI', status: 'DRAFT' }));
    await switchTab('module2', 'module2');

    vi.mocked(loadUNSPSCTaxonomy).mockRejectedValueOnce(new Error('catalog offline'));
    await runProp('module2', 'onStartAICategorization');
    expect(
      screen.getByText(
        UI_STRINGS.taxonomyData.loadFailed(UI_STRINGS.taxonomyData.unknownFailure, UI_STRINGS.taxonomyData.requestUnavailable)
      )
    ).toBeInTheDocument();

    vi.mocked(aiApiClient.categorizeItems).mockResolvedValueOnce(
      asCategorizeResult({
        success: true,
        model: '',
        mappings: [
          { rawLineText: undefined, mappedUnspscCode: '', unspscTitle: '', suggestedBucket: '', confidenceScore: 80 },
          { rawLineText: 'Zebra saddle', mappedUnspscCode: '31161500', unspscTitle: '', suggestedBucket: '', confidenceScore: 'high' }
        ]
      })
    );
    await runProp('module2', 'onStartAICategorization');
    const afterSuccess = readProp<LineItemMapping[]>('module2', 'lineItems');
    expect(afterSuccess[1]).toMatchObject({ unspsc_code: '31161500', ai_confidence: 99.4, status: 'Pending Review' });
    expect(afterSuccess[0].status).toBe('Pending Review');

    vi.mocked(aiApiClient.categorizeItems).mockResolvedValueOnce(asCategorizeResult({ success: false, mappings: [] }));
    await runProp('module2', 'onStartAICategorization');
    expect(readProp<LineItemMapping[]>('module2', 'lineItems')[0].unspsc_code).toBeTruthy();

    vi.mocked(aiApiClient.categorizeItems).mockRejectedValueOnce(new Error('AI gateway timeout'));
    await runProp('module2', 'onStartAICategorization');
    expect(frontendLogger.error).toHaveBeenCalled();
  });
});

describe('Home page: remaining fallbacks', () => {
  it('preserves a zero spend baseline and does not invent missing item counts during remediation', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [buildDocument({ converted_inr_crores: 0 })],
        validationRecords: [buildRecord('VAL-FALLBACK')]
      })
    );
    await renderPage();
    const [record] = readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords');

    await runProp('fixCurrency', 'onFix', record.record_id, 'JPY', 500);
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')[0].converted_inr_crores).toBe(0);

    await runProp('mergeItem', 'onMerge', record.record_id, 'ITM-1', 'Bolt');
    await runProp('mergeItem', 'onMerge', record.record_id, 'ITM-2', 'Nut');
    expect(readProp<number | undefined>('module1', 'uniqueItemsCount')).toBeUndefined();
  });

  it('keeps canonical D1 counts unchanged after validation-only corrections', async () => {
    const canonical = buildCanonical({ uniqueItems: 2, uniqueVendors: 2 });
    vi.mocked(apiClient.getCanonicalModule1).mockResolvedValue(canonical);
    await renderPage();
    await attachAssessment(buildAssessment({
      assessmentId: canonical.assessmentId,
      status: 'ACCEPTED',
      isReportAccepted: true,
      acceptedAt: '2026-02-01T00:00:00.000Z',
      activeDataVersionId: canonical.dataVersionId,
      activeAnalysisRunId: 'RUN-7',
      canonicalModule1: canonical
    }));
    await switchTab('module1', 'module1');
    await waitFor(() => expect(readProp<number>('module1', 'uniqueItemsCount')).toBe(2));
    for (let index = 0; index < 3; index += 1) {
      await runProp('mergeItem', 'onMerge', 'VAL-PAGE-001', 'ITM-1', 'Bolt');
      await runProp('mergeVendor', 'onMerge', 'VAL-PAGE-001', 'VND-1', 'Supplier');
    }
    expect(readProp<number>('module1', 'uniqueItemsCount')).toBe(2);
    expect(readProp<number>('module1', 'uniqueVendorsCount')).toBe(2);
    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')[0]).toMatchObject({
      unique_items_count: 2,
      unique_vendors_count: 2
    });
  });

  it('applies a canonical view with blank identifiers using the fallback document id', async () => {
    const blankCanonical = buildCanonical({ assessmentId: 'ASM-BLANK', dataVersionId: '', datasetId: '' });
    vi.mocked(apiClient.getCanonicalModule1).mockResolvedValue(blankCanonical);
    await renderPage();
    await attachAssessment(
      buildAssessment({
        assessmentId: 'ASM-BLANK',
        status: 'IN_PROGRESS',
        activeDataVersionId: 'DV-BLANK',
        activeAnalysisRunId: 'RUN-BLANK',
        validatedSpendCr: 50,
        canonicalModule1: blankCanonical
      })
    );
    await switchTab('module1', 'module1');

    expect(readProp<RawDocumentIngestion[]>('module1', 'ingestionQueue')[0]).toMatchObject({
      doc_id: 'DOC-ASSESSMENT'
    });
  });

  it('shows the default client name in the executive brief when the tenant name is blank', async () => {
    await renderPage();
    await runProp('header', 'onSelectTenant', { ...mockTenant, enterprise_name: '' });

    await runProp('header', 'onOpenManagementBrief');

    expect(readProp<string>('briefView', 'clientName')).toBeTruthy();
    expect(readProp<string>('briefView', 'clientName')).not.toBe('');
  });

  it('marks the executive brief as not ready when no opportunities or spend exist', async () => {
    await renderPage();
    await switchTab('assessment', 'assessmentWorkspace');

    await runProp('assessmentWorkspace', 'onActiveAssessmentChange', null);

    expect(readProp<boolean>('header', 'isExecutiveBriefReady')).toBe(false);
  });
});

describe('Home page: Module 5 counts and supplier spend defaults', () => {
  it('counts Passed Clean validation records for Module 5 when the document has no record count', async () => {
    vi.mocked(apiClient.getIngestionData).mockResolvedValue(
      asIngestion({
        queue: [buildDocument({ records_count: 0 })],
        validationRecords: [buildRecord('VAL-CLEAN-1', { issue_flag: 'Passed Clean', resolved: true })]
      })
    );
    await renderPage();
    await switchTab('module5', 'module5');

    expect(readProp<number>('module5', 'cleanRecordsCount')).toBe(1);
  });

  it('defaults supplier spend and share values to zero when the canonical supplier row has none', async () => {
    await renderPage();
    vi.mocked(apiClient.getCanonicalModule1).mockResolvedValueOnce(
      asCanonicalResponse(
        buildCanonical({
          assessmentId: 'ASM-SUP',
          dataVersionId: 'DV-SUP',
          paretoHierarchy: undefined,
          supplierSpend: asSupplierSpend([{ supplier_name: 'Delta' }])
        })
      )
    );
    await attachAssessment(buildAssessment({ assessmentId: 'ASM-SUP', activeDataVersionId: 'DV-SUP', status: 'DRAFT' }));
    await switchTab('module1', 'module1');

    const pareto = readProp<{ vendorHierarchy: Array<{ name: string; totalSpendCr: number; sharePct: number }> }>(
      'module1',
      'paretoSpendData'
    );
    expect(pareto.vendorHierarchy[0]).toMatchObject({ name: 'Delta', totalSpendCr: 0, sharePct: 0 });
  });
});

describe('Home page: FX and tenant mapping edge cases', () => {
  it('logs malformed FX reference data and keeps the workbook import fallback available', async () => {
    await renderPage();
    vi.mocked(apiClient.getCurrencyRates).mockResolvedValue({
      USD: { currencyCode: 'USD', name: 'US Dollar', currentRate: 0, lastUpdated: '2026-11-04' }
    });

    await uploadFile(makeBinaryFile(
      'invalid_fx.xlsx',
      buildWorkbookBytes([{ Description: 'Paper', Department: 'Packaging', Supplier: 'Paper Co', Currency: 'USD', Qty: 2, Cost: 5 }]),
      XLSX_MIME
    ));

    expect(frontendLogger.warn).toHaveBeenCalledWith(
      'Could not parse xlsx rows',
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('uses the active assessment INR currency when an uploaded row has no currency', async () => {
    await renderPage();
    await attachAssessment(buildAssessment({
      assessmentId: 'ASM-INR-FALLBACK',
      activeDataVersionId: 'DV-INR-FALLBACK',
      currency: 'INR'
    }));
    await switchTab('module1', 'module1');
    await uploadFile(makeBinaryFile(
      'missing_currency.xlsx',
      buildWorkbookBytes([{ Description: 'Steel Bolt', Department: 'Direct', Supplier: 'Bolt Co', Currency: '', Qty: 2, Cost: 5 }]),
      XLSX_MIME
    ));

    expect(readProp<ValidationPreCheckRecord[]>('module1', 'validationRecords')[0].raw_currency).toBe('INR');
  });

  it('rejects a mapping decision when uploaded rows have no active assessment', async () => {
    await renderPage();
    await uploadFile(makeBinaryFile(
      'unassigned_assessment.xlsx',
      buildWorkbookBytes([{ Description: 'Steel Bolt', Material: 'MAT-NO-ASSESSMENT', Department: 'Direct', Supplier: 'Bolt Co', Currency: 'INR', Qty: 2, Cost: 5 }]),
      XLSX_MIME
    ));
    await switchTab('module2', 'module2');

    const [item] = readProp<LineItemMapping[]>('module2', 'lineItems');
    expect(item.material_code).toBe('MAT-NO-ASSESSMENT');
    await runProp('module2', 'onConfirmMapping', item.mapping_id);

    expect(screen.getByText(UI_STRINGS.toasts.module2AssessmentRequired)).toBeInTheDocument();
    expect(mocks.saveModule2MaterialMappings).not.toHaveBeenCalled();
  });

  it('persists only one taxonomy decision for duplicate source material identifiers', async () => {
    const duplicateMaterialItems = [
      buildLineItem('MAP-DUPLICATE-1', 'Steel Bolt', { material_code: 'MAT-SHARED' }),
      buildLineItem('MAP-DUPLICATE-2', 'Cardboard', { material_code: 'MAT-SHARED' })
    ];
    await seedModule2(duplicateMaterialItems);
    vi.mocked(aiApiClient.categorizeItems).mockResolvedValueOnce(
      asCategorizeResult({ success: true, mappings: [] })
    );

    await runProp('module2', 'onStartAICategorization');

    const [, savedMappings] = vi.mocked(mocks.saveModule2MaterialMappings).mock.lastCall ?? [];
    expect(savedMappings).toHaveLength(1);
    expect(savedMappings?.[0].sourceMaterialId).toBe('MAT-SHARED');
  });
});
