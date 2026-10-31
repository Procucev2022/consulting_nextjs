import type {
  AppOperatingMode,
  NdaStatus,
  DataStatus,
  AssessmentStatus,
  AssessmentRole,
  AuditAction,
  ReviewGate,
  PersistenceEnvironment
} from '../constants/assessment';
import type { Module1CanonicalViewModel } from './module1Canonical';

export type {
  AppOperatingMode,
  NdaStatus,
  DataStatus,
  AssessmentStatus,
  AssessmentRole,
  AuditAction,
  ReviewGate,
  PersistenceEnvironment
};

export interface CustomerWebsiteProfile {
  companyWebsite: string;
  businessDescription: string;
  sector: string;
  mainProducts: string[];
  operatingFootprint: string;
  revenueOrProfit?: string;
  businessPriorities: string[];
  sourceUrls: string[];
  reportingPeriod: string;
  retrievedAt: string;
}

export interface CustomerRecord {
  customerId: string;
  id?: string;
  customerName: string;
  industry: string;
  businessUnit?: string;
  region?: string;
  baseCurrency?: string;
  companyWebsite?: string;
  websiteProfile?: CustomerWebsiteProfile;
  contactEmail?: string;
  contactPerson?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'ONBOARDING';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

import type { CreateCustomerInput, UpdateCustomerInput } from './assessmentValidation';
export type { CreateCustomerInput, UpdateCustomerInput };

export interface AssessmentRecord {
  assessmentId: string;
  customerId?: string;
  customerName: string;
  industry: string;
  businessUnit?: string;
  assessmentOwner?: string;
  currency?: string;
  companyWebsite?: string;
  websiteProfile?: CustomerWebsiteProfile;
  assessmentPeriodStart: string;
  assessmentPeriodEnd: string;
  actualDataCoverageStart?: string;
  actualDataCoverageEnd?: string;
  dataCoverageNotice?: string;
  includedEntities?: string[];
  excludedEntities?: string[];
  sourceRowCount?: number;
  includedRowCount?: number;
  excludedRowCount?: number;
  annualizedSpendEstimateCr?: number;
  annualizedSpendNotice?: string;
  dataReceivedAt?: string;
  ndaStatus: NdaStatus;
  dataStatus: DataStatus;
  assignedAnalyst: string;
  status: AssessmentStatus;
  activeDataVersionId?: string;
  activeAnalysisRunId?: string;
  isTestData?: boolean;
  totalSpendCr?: number;
  validatedSpendCr?: number;
  baselineSpendCr?: number;
  fxImpactCr?: number;
  addressableSpendCr?: number;
  grossOpportunityCr?: number;
  overlapDeductionsCr?: number;
  netDefensibleOpportunityCr?: number;
  provenOpportunityCr?: number;
  deliveryRangeMinCr?: number;
  deliveryRangeMaxCr?: number;
  pcbiAnalyticalSignalCr?: number;
  potentialSavingsCr?: number;
  savingsPct?: number;
  approvedBy?: string;
  approvedAt?: string;
  approvalComment?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  isReportAccepted?: boolean;
  allModulesCompleted?: boolean;
  closedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDataVersion {
  dataVersionId: string;
  assessmentId: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  checksum: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  recordCount: number;
  notes?: string;
  isSuperseded: boolean;
}

export interface ReviewGateResult {
  gate: ReviewGate;
  passed: boolean;
  acknowledged?: boolean;
  evaluatedAt: string;
  message: string;
}

export interface Module1Metrics {
  sourceRows: number;
  validRows: number;
  exclusions: number;
  anomalies: number;
  /** Number of PO-line pairs (Purch.Doc. + Item) that appear more than once in the source workbook. */
  suspectedDuplicateRowCount?: number;
  fxCoveragePct: number;
  validatedSpendCr: number;
  suppliers: number;
  materialGroups: number;
  plants: number;
  billingMonths: number;
}

export interface Module2Metrics {
  categorizedSpendCr: number;
  materialGroups: number;
  sourcingOpportunitiesCount: number;
}

export interface PcbiMetrics {
  benchmarkedSpendCr: number;
  commodityGroupsCount: number;
  benchmarkCoveragePct: number;
  uncoveredItemsCount: number;
}

export interface Module4Metrics {
  savingsClassifications: {
    directPriceRenegotiationCr: number;
    volumeTierBundlingCr: number;
    specificationRationalizationCr: number;
    paymentTermsOptimizationCr: number;
  };
  financialBridgeCr: {
    baselineSpendCr: number;
    fxImpactCr: number;
    addressableSpendCr: number;
    netPotentialSavingsCr: number;
  };
}

export interface AssessmentAnalysisRun {
  analysisRunId: string;
  assessmentId: string;
  dataVersionId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalSpendCr: number;
  validatedSpendCr: number;
  baselineSpendCr?: number;
  fxImpactCr?: number;
  addressableSpendCr?: number;
  grossOpportunityCr?: number;
  overlapDeductionsCr?: number;
  netDefensibleOpportunityCr?: number;
  provenOpportunityCr?: number;
  deliveryRangeMinCr?: number;
  deliveryRangeMaxCr?: number;
  pcbiAnalyticalSignalCr?: number;
  potentialSavingsCr: number;
  savingsPct: number;
  reviewGates: ReviewGateResult[];
  allGatesPassed: boolean;
  isApproved: boolean;
  isSuperseded: boolean;
  module1Metrics?: Module1Metrics;
  module2Metrics?: Module2Metrics;
  pcbiMetrics?: PcbiMetrics;
  module4Metrics?: Module4Metrics;
  canonicalModule1?: Module1CanonicalViewModel;
  createdAt: string;
}

export interface AssessmentAuditLog {
  id: string;
  assessmentId: string;
  actorEmail: string;
  actorRole: AssessmentRole | string;
  action: AuditAction;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface OperatingModeConfig {
  mode: AppOperatingMode;
  isInternalAssessment: boolean;
  isPublicSaaS: boolean;
  workspaceTitle: string;
  phaseName: string;
  features: {
    publicRegistration: boolean;
    tierUpgrade: boolean;
    subscriptionPurchase: boolean;
    customerSelfOnboarding: boolean;
    customerSaaSDashboard: boolean;
    assessmentCentre: boolean;
  };
  allowedRoles: AssessmentRole[];
}

export interface DeliveryPackageItem {
  id: string;
  title: string;
  format: 'PDF' | 'PPTX' | 'XLSX';
  artifactStatus: 'NOT_GENERATED' | 'GENERATED';
  analysisRunId: string;
  dataVersionId: string;
  generatedAt: string;
  fileName: string;
  storageKey?: string;
  contentType?: string;
  encryptionIv?: string;
}

export interface DeliveryPackageResult {
  assessmentId: string;
  analysisRunId: string;
  dataVersionId: string;
  customerName: string;
  assessmentPeriod: string;
  packageTitle: string;
  generatedAt: string;
  approvedBy: string;
  approvedAt: string;
  releaseVersion: string;
  checksums: Record<string, string>;
  items: DeliveryPackageItem[];
}

export type AssessmentReviewGateStatus = 'PENDING' | 'PASSED' | 'BLOCKED';

export interface AssessmentReviewGateRecord {
  assessmentId: string;
  gateKey: string;
  status: AssessmentReviewGateStatus;
  evidenceReference: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface AssessmentReviewGateUpdate {
  gateKey: string;
  status: AssessmentReviewGateStatus;
  evidenceReference?: string;
  reviewNote?: string;
}

export type { SystemBuildInfo, PersistenceInfo, PersistedStoreData } from './assessmentPersistence';
