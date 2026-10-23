/**
 * Frontend Types and Interfaces for aiCEV Internal Assessment Mode
 */

import type { Module1CanonicalViewModel } from './module1Canonical';

export type AppOperatingMode = 'INTERNAL_ASSESSMENT' | 'PUBLIC_SAAS';

export type NdaStatus = 'NOT_REQUESTED' | 'SENT' | 'SIGNED' | 'EXPIRED';

export type DataStatus = 'NOT_RECEIVED' | 'AWAITING_DATA' | 'RECEIVED' | 'VALIDATING' | 'VALIDATION_IN_PROGRESS' | 'VALIDATED' | 'REJECTED' | 'REQUIRES_CLARIFICATION';

export type AssessmentStatus =
  | 'DRAFT'
  | 'DATA_AWAITING'
  | 'IN_PROGRESS'
  | 'PCBI_REVIEW'
  | 'AWAITING_REVIEW'
  | 'MODULE_1_READY'
  | 'ANALYST_REVIEW'
  | 'APPROVED'
  | 'DELIVERED'
  | 'ACCEPTED'
  | 'BLOCKED';

export type AssessmentRole = 'INTERNAL_ADMIN' | 'ANALYST' | 'CONSULTANT';

export type ReviewGate =
  | 'INPUT_VALIDATION_CLEAN'
  | 'MODULE_1_RECONCILED'
  | 'MODULE_2_SAVINGS_CONSISTENT'
  | 'MODULE_3_COMPLETED'
  | 'MODULE_4_BENCHMARKED'
  | 'FORENSIC_EXCEPTION_REVIEWED'
  | 'CURRENCY_FX_AUDITED'
  | 'REPORT_CONSISTENCY_VERIFIED';

export interface ReviewGateResult {
  gate: ReviewGate;
  passed: boolean;
  acknowledged?: boolean;
  evaluatedAt: string;
  message: string;
}

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
  id: string;
  customerId?: string;
  customerName: string;
  industry: string;
  businessUnit?: string;
  region?: string;
  baseCurrency?: string;
  companyWebsite?: string;
  websiteProfile?: CustomerWebsiteProfile;
  contactEmail?: string;
  contactPerson?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'ONBOARDING';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  customerName: string;
  industry: string;
  businessUnit?: string;
  region?: string;
  baseCurrency?: string;
  companyWebsite?: string;
  contactEmail?: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  customerName?: string;
  industry?: string;
  businessUnit?: string;
  region?: string;
  baseCurrency?: string;
  companyWebsite?: string;
  contactEmail?: string;
  contactPerson?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'ONBOARDING';
  notes?: string;
}

export interface AssessmentRecord {
  id?: string;
  assessmentId: string;
  customerId?: string;
  customerName: string;
  businessUnit?: string;
  industry: string;
  companyWebsite?: string;
  websiteProfile?: CustomerWebsiteProfile;
  assessmentPeriod?: string;
  assessmentPeriodStart: string;
  assessmentPeriodEnd: string;
  dataReceivedAt?: string;
  ndaStatus: NdaStatus;
  dataStatus: DataStatus;
  assignedAnalyst: string;
  assessmentOwner?: string;
  currency?: string;
  notes?: string;
  status: AssessmentStatus;
  currentDataVersionId?: string;
  activeDataVersionId?: string;
  activeAnalysisRunId?: string;
  canonicalModule1?: Module1CanonicalViewModel;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentInput {
  customerId?: string;
  customerName: string;
  businessUnit?: string;
  industry: string;
  assessmentPeriodStart: string;
  assessmentPeriodEnd: string;
  assignedAnalyst: string;
  assessmentOwner?: string;
  currency?: string;
  ndaStatus?: NdaStatus;
  dataReceivedDate?: string;
  notes?: string;
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

export interface Module1Metrics {
  sourceRows: number;
  validRows: number;
  exclusions: number;
  anomalies: number;
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
  action: string;
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
  analysisRunId: string;
  dataVersionId: string;
  generatedAt: string;
  fileName: string;
}

export interface DeliveryPackageResult {
  assessmentId: string;
  analysisRunId: string;
  dataVersionId: string;
  customerName: string;
  packageTitle: string;
  assessmentPeriod?: string;
  releaseVersion?: string;
  generatedAt: string;
  approvedBy: string;
  approvedAt: string;
  checksums?: {
    vgtDataset?: string;
    fxMaster?: string;
    pcbiMaster?: string;
    evidenceWorkbook?: string;
    [key: string]: string | undefined;
  };
  items: DeliveryPackageItem[];
}

export interface AssessmentWorkspaceProps {
  onSelectAssessment?: (assessmentId: string) => void;
  onActiveAssessmentChange?: (assessment: AssessmentRecord | null) => void;
  onSelectCustomer?: (customer: CustomerRecord | null) => void;
  onNavigateToModule1?: (assessment: AssessmentRecord) => void;
  initialActiveTab?: 'customers' | 'assessments';
}

export interface CustomerManagementViewProps {
  onSelectCustomer: (customer: CustomerRecord) => void;
  onCreateAssessmentForCustomer: (customer: CustomerRecord) => void;
  onOpenAssessmentInModule1?: (assessment: AssessmentRecord) => void;
  selectedCustomerId?: string | null;
}

export interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: CustomerRecord) => void;
}

export interface EditCustomerModalProps {
  isOpen: boolean;
  customer: CustomerRecord | null;
  onClose: () => void;
  onUpdated: (customer: CustomerRecord) => void;
}

export interface NewAssessmentModalProps {
  isOpen: boolean;
  preselectedCustomer?: CustomerRecord | null;
  onClose: () => void;
  onCreated: (assessment: AssessmentRecord) => void;
}

export interface AssessmentDetailWorkflowProps {
  assessmentId: string;
  onBack: () => void;
  onUpdate: (updated: AssessmentRecord) => void;
}

export interface SystemBuildInfo {
  applicationVersion: string;
  buildNumber: string;
  gitCommit: string;
  buildTimestamp: string;
  operatingMode: string;
  certificationStatus: string;
  e2eCertificationId: string;
  fxMaster: {
    version: string;
    checksum: string;
  };
  pcbiMaster: {
    version: string;
    checksum: string;
  };
}

export interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AssessmentUploadTabProps {
  assessment: AssessmentRecord;
  onUploadSuccess: (updatedAssessment: AssessmentRecord) => void;
  onCancel?: () => void;
}

export interface AssessmentPipelineTabProps {
  assessment: AssessmentRecord;
  activeRun?: AssessmentAnalysisRun | null;
  isProcessing: boolean;
  onNdaChange: (status: NdaStatus) => void;
  onDataStatusChange: (status: DataStatus) => void;
  onRunAnalysis: () => void;
}

export interface AssessmentChecklistTabProps {
  assessment: AssessmentRecord;
}

export interface AssessmentDeliveryTabProps {
  deliveryPackage: DeliveryPackageResult | null;
  assessment?: AssessmentRecord;
  onGeneratePackage?: () => void;
  isProcessing?: boolean;
}

export interface AssessmentAuditTabProps {
  auditLogs: AssessmentAuditLog[];
}

export interface DesktopReleaseManifest {
  productName: string;
  version: string;
  buildIdentifier: string;
  gitCommit: string;
  buildTimestamp: string;
  operatingMode: string;
  publicSaaSStatus: string;
  installerFileName: string;
  installerSha256: string;
  installerSizeBytes: number;
  backendBuildIdentifier: string;
  frontendBuildIdentifier: string;
  requiredRegressionSuiteResults: string;
  financialParityResult: string;
  securityVerificationResult: string;
  releaseCertificationStatus: string;
  certificationStatus?: string;
  releaseNotes?: string[];
  e2eCertificationId?: string;
  fxMasterVersion?: string;
  fxMasterChecksum?: string;
  pcbiMasterVersion?: string;
  pcbiMasterChecksum?: string;
  appVersion?: string;
  buildNumber?: string;
}

export interface DesktopUpdateCheckResult {
  isUpdateAvailable: boolean;
  currentVersion: string;
  currentBuildNumber: string;
  availableVersion: string | null;
  availableBuildNumber: string | null;
  releaseDate: string | null;
  releaseNotes: string[];
  verificationStatus: 'CERTIFIED_AND_VERIFIED' | 'FAILED' | 'NONE';
  installerFileName: string | null;
  installerSha256: string | null;
  installerSizeBytes: number | null;
  installerPath: string | null;
  manifestPath: string | null;
  errorMessage: string | null;
  isStagedOnly: boolean;
  manifest: DesktopReleaseManifest | null;
}

export interface DesktopInstallUpdateResponse {
  success: boolean;
  message: string;
  installerPath?: string;
  error?: string;
}

export interface DesktopUpdateBannerProps {
  onUpdateInitiated?: () => void;
}


