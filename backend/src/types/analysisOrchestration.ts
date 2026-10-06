/**
 * Analysis Orchestration, PCBI Quality Gate & Admin Reanalysis Types (Prompt 302)
 */

export type AnalysisJobStatus =
  | 'UPLOADED'
  | 'MODULE_1_READY'
  | 'ANALYSIS_QUEUED'
  | 'PCBI_REVIEW_REQUIRED'
  | 'PCBI_REVIEW_IN_PROGRESS'
  | 'READY_FOR_GENERATION'
  | 'REPORT_GENERATED'
  | 'ADMIN_REVIEW'
  | 'ADMIN_APPROVED'
  | 'SUBMITTED_TO_CUSTOMER'
  | 'CUSTOMER_VIEWED'
  | 'CUSTOMER_ACKNOWLEDGED'
  | 'ANALYSIS_BLOCKED';

export type PCBIGapStatus =
  | 'PCBI_COVERED'
  | 'PCBI_REQUIRED'
  | 'NOT_BENCHMARKABLE'
  | 'SERVICE_NON_COMMODITY'
  | 'EXCLUDED_MANUAL_REVIEW';

export type PCBIGapResolution =
  | 'PENDING'
  | 'MAPPED'
  | 'EXCLUDED'
  | 'RESEARCH_REQUESTED';

export type PCBIResolutionAction =
  | 'ADD_MAP_PCBI'
  | 'MAP_EXISTING'
  | 'EXCLUDE'
  | 'MARK_NOT_BENCHMARKABLE'
  | 'MARK_SERVICE'
  | 'REQUEST_RESEARCH';

export type PCBIExclusionReason =
  | 'NOT_BENCHMARKABLE'
  | 'CUSTOM_ENGINEERED_ITEM'
  | 'SERVICE'
  | 'NO_RELIABLE_MARKET_BENCHMARK'
  | 'INSUFFICIENT_MARKET_DATA'
  | 'CUSTOMER_SPECIFIC_SPECIFICATION'
  | 'BELOW_MATERIALITY_THRESHOLD'
  | 'OTHER';

export type ReanalysisReason =
  | 'INCORRECT_CATEGORY_MAPPING'
  | 'MISSING_TRANSACTIONS'
  | 'DUPLICATE_TRANSACTIONS'
  | 'INCORRECT_SUPPLIER_MAPPING'
  | 'INCORRECT_PLANT_MAPPING'
  | 'INCORRECT_QUANTITY_VALUE'
  | 'INCORRECT_MATERIAL_DESCRIPTION'
  | 'CUSTOMER_CLARIFICATION'
  | 'PCBI_MAPPING_CORRECTION'
  | 'OTHER';

export interface PCBIGapCategory {
  gapId: string;
  tenantId: string;
  itemCategory: string;
  relevantClassification: string;
  customerSpendInrCr: number;
  transactionCount: number;
  supplierCount: number;
  plantCount: number;
  existingPcbiMapping?: string;
  requiredPcbiSeries?: string;
  benchmarkSource?: string;
  pcbiQualityRating?: string;
  status: PCBIGapStatus;
  reasonForReview: string;
  estimatedSpendImpactCr: number;
  resolutionStatus: PCBIGapResolution;
  exclusionReason?: PCBIExclusionReason;
  exclusionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface AnalysisReadinessSummary {
  categoryCoveragePct: number;
  spendCoveragePct: number;
  itemCoveragePct: number;
  categoriesRequiringReview: number;
  itemsExcluded: number;
  dataCorrectionsPending: number;
  overallReadiness: 'ACTION_REQUIRED' | 'READY_TO_GENERATE';
  blockingReasons: string[];
}

export interface DatasetVersion {
  versionId: string;
  parentVersionId?: string;
  tenantId: string;
  uploadedBy: string;
  uploaderRole: 'CUSTOMER' | 'ADMIN';
  uploadedAt: string;
  fileName: string;
  fileType: string;
  fileSizeMb: number;
  checksum: string;
  source: 'CUSTOMER_ORIGINAL' | 'ADMIN_CORRECTION' | 'CUSTOMER_REUPLOAD';
  correctionReason?: ReanalysisReason;
  notes?: string;
  processingStatus: 'PROCESSED' | 'PENDING' | 'FAILED';
  validationStatus: 'VALID' | 'WARNINGS' | 'ERRORS';
  transactionCount: number;
  supplierCount: number;
  spendInrCr: number;
  categoryCount: number;
  plantCount: number;
  datasetJson?: string;
}

export interface DataVersionDiffSummary {
  previousVersionId: string;
  newVersionId: string;
  previousTransactions: number;
  newTransactions: number;
  previousSuppliers: number;
  newSuppliers: number;
  previousSpendCr: number;
  newSpendCr: number;
  previousCategories: number;
  newCategories: number;
  previousPlants: number;
  newPlants: number;
  changedRecordsCount: number;
  addedRecordsCount: number;
  removedRecordsCount: number;
  modifiedRecordsCount: number;
}

export interface AdminQualityGateChecklist {
  dataQuality: {
    sourceDataValidated: boolean;
    spendReconciles: boolean;
    duplicateChecksCompleted: boolean;
    classificationReviewed: boolean;
  };
  pcbi: {
    requiredPcbiCategoriesResolved: boolean;
    benchmarkSourcesValidated: boolean;
    exclusionsDocumented: boolean;
    pcbiCoverageAcceptable: boolean;
  };
  financial: {
    savingsCalculationsValidated: boolean;
    noDoubleCounting: boolean;
    overlapsHandled: boolean;
    exclusionsApplied: boolean;
    totalsReconcile: boolean;
  };
  report: {
    module1Reviewed: boolean;
    module2Reviewed: boolean;
    module3Reviewed: boolean;
    module4Reviewed: boolean;
    executiveSummaryReviewed: boolean;
  };
  confirmedByAdminId?: string;
  confirmedAt?: string;
}

export interface ReportVersion {
  reportVersionId: string;
  analysisJobId: string;
  datasetVersionId: string;
  pcbiStateVersion: string;
  generatedAt: string;
  status: 'GENERATED_PENDING_ADMIN_REVIEW' | 'APPROVED' | 'SUBMITTED' | 'SUPERSEDED';
  isCustomerVisible: boolean;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  submittedAt?: string;
  summaryMetrics?: {
    totalSpendCr: number;
    totalSavingsCr: number;
    savingsPct: number;
    coveredCategories: number;
  };
}

export interface AnalysisJob {
  analysisJobId: string;
  tenantId: string;
  customerName: string;
  uploadedBy: string;
  originalUploadId: string;
  currentDataVersionId: string;
  module1VersionId: string;
  reportVersionId?: string;
  status: AnalysisJobStatus;
  createdAt: string;
  queuedAt?: string;
  module1ReadyAt?: string;
  pcbiReviewStartedAt?: string;
  pcbiReviewCompletedAt?: string;
  reportGeneratedAt?: string;
  adminReviewedAt?: string;
  approvedAt?: string;
  submittedAt?: string;
  customerViewedAt?: string;
  acknowledgedAt?: string;
  assignedAdminId?: string;
  lastUpdatedAt: string;
  failureReason?: string;
  adminNotes?: string;
  customerNotes?: string;
  totalSpendCr: number;
  totalTransactions: number;
  analysisPeriod: string;
  slaHoursTarget: number;
  fxMasterVersion?: string;
  fxMasterFileName?: string;
  fxMasterChecksum?: string;
  fxMasterAsOfDate?: string;
}

export interface CustomerReportAcknowledgement {
  acknowledgementId: string;
  reportVersionId: string;
  tenantId: string;
  userId: string;
  userName: string;
  acknowledgedAt: string;
  status: 'ACKNOWLEDGED';
  notes?: string;
}

export interface CustomerCorrectionRequest {
  requestId: string;
  analysisJobId: string;
  tenantId: string;
  userId: string;
  category: string;
  description: string;
  supportingFileName?: string;
  status: 'OPEN' | 'REVIEWED' | 'ACCEPTED_REANALYSIS' | 'REJECTED';
  createdAt: string;
  reviewedBy?: string;
  adminResponse?: string;
}

export interface AnalysisAuditEvent {
  eventId: string;
  tenantId: string;
  actorId: string;
  actorRole: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  timestamp: string;
  eventType: string;
  entityType: string;
  entityId: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationNotification {
  notificationId: string;
  recipientType: 'ADMIN' | 'CUSTOMER';
  tenantId: string;
  title: string;
  message: string;
  severity: 'INFO' | 'ACTION_REQUIRED' | 'WARNING' | 'SUCCESS';
  createdAt: string;
  read: boolean;
  emailDelivery?: {
    status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
    sentAt?: string;
    lastError?: string;
    retryCount: number;
  };
}

export interface AdminOrchestrationKPIs {
  newAnalyses: number;
  pcbiReviewsPending: number;
  dataCorrectionsPending: number;
  reportsPendingReview: number;
  reportsReadyToSubmit: number;
  customerAcknowledgementsPending: number;
  blockedAnalyses: number;
  totalAnalyses: number;
}
