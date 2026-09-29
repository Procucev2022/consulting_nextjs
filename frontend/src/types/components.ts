/**
 * Component and Modal Types & Interfaces Module (Frontend)
 */

import type {
  TenantMaster,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  SpendCategorySummary,
  LineItemMapping,
  VendorPriceRank,
  SavingsOpportunity,
  ConversionFunnelPhase,
  CategoryYearDetail,
  VendorYearDetail,
  MaterialGroupSummary,
  PlantSummary,
  MonthWiseSummary,
  DocumentSpendCurrency,
  MonthGraphViewMode
} from './models';
import type { HeaderCurrency } from './currency';
import type { CoreBucket, UNSPSCCommodityRecord } from './taxonomy';
import type { ParetoSpendData } from './pareto';
import type { SubscriptionTier, UserProfile } from './auth';

// Main View & Navigation Props
export interface HeaderProps {
  tenant: TenantMaster;
  onSelectTenant: (tenant: TenantMaster) => void;
  currency: HeaderCurrency;
  onSelectCurrency: (currency: HeaderCurrency) => void;
  onOpenReport: () => void;
  theme: 'light' | 'dark';
  onSelectTheme: (theme: 'light' | 'dark') => void;
  onStartAnalysis?: () => void;
  isAnalyzing?: boolean;
  currentUser?: UserProfile | null;
  currentTier?: SubscriptionTier;
  onSelectSimulatedTier?: (tier: SubscriptionTier | null) => void;
  user?: UserProfile | null;
  onLogout?: () => void;
  onOpenClientSetup?: () => void;
  onContactSupport?: () => void;
}

export type PipelineActiveTab = 'module1' | 'module2' | 'module3' | 'module4' | 'module5' | 'schema';

export interface PipelineBarProps {
  activeTab: PipelineActiveTab;
  onSelectTab: (tab: PipelineActiveTab) => void;
  tenant?: TenantMaster;
  opportunities?: SavingsOpportunity[];
  ingestionQueue?: RawDocumentIngestion[];
  totalSpendCr?: number;
  isStep1Complete?: boolean;
  isStep2Complete?: boolean;
  isStep3Complete?: boolean;
  isStep4Complete?: boolean;
  unlockedTabs?: PipelineActiveTab[];
  onLockedTabClick?: (tab: PipelineActiveTab) => void;
}

export type DatabaseSchemaViewProps = Record<string, never>;

// Core Pipeline Module Props
export interface Module1IngestionProps {
  tenant: TenantMaster;
  onUpdateTenant: (tenant: TenantMaster) => void;
  ingestionQueue: RawDocumentIngestion[];
  validationRecords: ValidationPreCheckRecord[];
  onFixCurrency: (record: ValidationPreCheckRecord) => void;
  onMergeVendor: (record: ValidationPreCheckRecord) => void;
  onMergeItem?: (record: ValidationPreCheckRecord) => void;
  onDeleteDocument?: (docId?: string) => void;
  onApplyBlanketFixes?: () => void;
  onResetValidationRecords?: () => void;
  onRunAICategorization: () => void;
  onAddBatchUpload: (file: File, datasetType: DatasetType) => void;
  materialGroupSummaries?: MaterialGroupSummary[];
  plantSummaries?: PlantSummary[];
  monthWiseSummaries?: MonthWiseSummary[];
  uniqueItemsCount?: number;
  uniqueVendorsCount?: number;
  isDataRefreshed?: boolean;
  paretoSpendData?: ParetoSpendData;
  onRefreshWithFixes?: () => void;
  rawUploadRecords?: Record<string, unknown>[] | unknown;
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
}

export interface ValidationPreCheckSectionProps {
  validationRecords: ValidationPreCheckRecord[];
  onFixCurrency: (record: ValidationPreCheckRecord) => void;
  onMergeVendor: (record: ValidationPreCheckRecord) => void;
  onMergeItem?: (record: ValidationPreCheckRecord) => void;
  onApplyBlanketFixes?: () => void;
  onResetValidationRecords?: () => void;
  onRunAICategorization: () => void;
  isDataRefreshed?: boolean;
  onRefreshWithFixes?: () => void;
}

export interface Module2CategorizationProps {
  tenant?: TenantMaster;
  categories: SpendCategorySummary[];
  lineItems: LineItemMapping[];
  onConfirmMapping: (mappingId: string) => void;
  onReassignMapping: (item: LineItemMapping) => void;
  onProceedToTrend: () => void;
  onStartAICategorization?: () => void;
  speedMultiplier?: number;
  onUpdateTenant?: (tenant: TenantMaster) => void;
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
  targetSection?: string | null;
}

export interface Module3TrendAnalyticsProps {
  vendorRankings: VendorPriceRank[];
  onProceedToSavings: () => void;
  theme?: 'light' | 'dark';
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
}

export interface Module4SavingsEngineProps {
  opportunities: SavingsOpportunity[];
  onOpenProCPX: (opp: SavingsOpportunity) => void;
  onOpenDPSNXT: (opp: SavingsOpportunity) => void;
  onProceedToConversion: () => void;
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onNavigateToSection?: (targetModule: PipelineActiveTab, targetSectionId: string) => void;
}

export interface Module5ConversionMatrixProps {
  tenant: TenantMaster;
  funnelStages: ConversionFunnelPhase[];
  onOpenReport: () => void;
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
  categories?: SpendCategorySummary[];
  opportunities?: SavingsOpportunity[];
  cleanRecordsCount?: number;
}

export interface SummaryScopeModeEnum {
  mode: 'TOP_10' | 'ALL';
}
export type SummaryScopeMode = 'TOP_10' | 'ALL';

export interface DocumentSummaryViewProps {
  tenant?: TenantMaster;
  ingestionQueue?: RawDocumentIngestion[];
  materialGroupSummaries?: MaterialGroupSummary[];
  plantSummaries?: PlantSummary[];
  monthWiseSummaries?: MonthWiseSummary[];
  uniqueItemsCount?: number;
  uniqueVendorsCount?: number;
  isDataRefreshed?: boolean;
  onNavigateToCategorization?: () => void;
}

export interface MonthWiseTrendChartProps {
  months: MonthWiseSummary[];
  spendCurrency: DocumentSpendCurrency;
  selectedFy: 'ALL' | 'FY24' | 'FY25' | 'FY26';
  onSelectFy: (fy: 'ALL' | 'FY24' | 'FY25' | 'FY26') => void;
  viewMode: MonthGraphViewMode;
  onChangeViewMode: (mode: MonthGraphViewMode) => void;
  searchQuery?: string;
}

export interface PlantWiseSpendChartProps {
  plants: PlantSummary[];
  spendCurrency: DocumentSpendCurrency;
}

export interface MultiYearLineGraphProps {
  months: MonthWiseSummary[];
  spendCurrency: DocumentSpendCurrency;
  visibleYears: { FY24: boolean; FY25: boolean; FY26: boolean };
  onToggleYear: (fy: 'FY24' | 'FY25' | 'FY26') => void;
  selectedMonthIndex: number;
  onSelectMonthIndex: (index: number) => void;
}

export interface MultiYearComparisonCardProps {
  selectedMonthDef: { key: string; label: string; fullName: string; index: number };
  selectedFy24: MonthWiseSummary | null;
  selectedFy25: MonthWiseSummary | null;
  selectedFy26: MonthWiseSummary | null;
  fy25YoY: number | null;
  fy26YoY: number | null;
  spendCurrency: DocumentSpendCurrency;
}

export interface MonthTimelineBarChartProps {
  months: MonthWiseSummary[];
  spendCurrency: DocumentSpendCurrency;
  selectedFy: 'ALL' | 'FY24' | 'FY25' | 'FY26';
  onSelectFy: (fy: 'ALL' | 'FY24' | 'FY25' | 'FY26') => void;
  hoveredMonth: MonthWiseSummary | null;
  onHoverMonth: (month: MonthWiseSummary | null) => void;
  searchQuery?: string;
}

export interface CategoryVendorBreakdownViewProps {
  tenant?: TenantMaster;
  categories?: CategoryYearDetail[];
  vendors?: VendorYearDetail[];
  lineItems?: LineItemMapping[];
}

// Modal Props & Types
export type DatasetType = 'Purchase History' | 'Invoice Data' | 'Trial Balance';

export interface ClientIngestionSetupConfig {
  clientName: string;
  datasetType: DatasetType;
  spendPeriod: string;
  currency: HeaderCurrency;
  region: 'NA' | 'EU' | 'APAC' | 'GLOBAL';
  estimatedSpend: number;
  majorSector: string;
  minorSector: string;
}

export interface ClientIngestionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: TenantMaster;
  onConfirmAndUpload: (config: ClientIngestionSetupConfig) => void;
}

export interface CategoryTopItemsModalProps {
  category: CategoryYearDetail | null;
  isOpen: boolean;
  onClose: () => void;
  totalEvaluatedSpendInrCr: number;
}

export interface VendorTopItemsModalProps {
  vendor: VendorYearDetail | null;
  isOpen: boolean;
  onClose: () => void;
  totalEvaluatedSpendInrCr: number;
}

export interface FixCurrencyModalProps {
  record: ValidationPreCheckRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onFix: (recordId: string, selectedCurrency: string, convertedAmountINR: number) => void;
}

export interface MergeVendorModalProps {
  record: ValidationPreCheckRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onMerge: (recordId: string, masterVendorId: string, masterVendorName: string) => void;
  onIgnore?: (recordId: string) => void;
}

export interface MasterItemDefinition {
  code: string;
  name: string;
  category: string;
  column_l_code: string;
  aliases: string[];
}

export interface MergeItemModalProps {
  record: ValidationPreCheckRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onMerge: (recordId: string, masterItemCode: string, masterItemName: string) => void;
  onIgnore?: (recordId: string) => void;
}

export type ProCPXEventType = 'Reverse Auction' | 'Multi-Stage RFP' | 'Sealed Bid';

export interface ProCPXModalProps {
  opportunity: SavingsOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (oppId: string) => void;
}

export interface DPSNXTModalProps {
  opportunity: SavingsOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (oppId: string) => void;
}

export interface ExecutiveReportModalProps {
  tenant: TenantMaster;
  opportunities: SavingsOpportunity[];
  isOpen: boolean;
  onClose: () => void;
}

export interface ReassignModalProps {
  item: LineItemMapping | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mappingId: string, newCode: string, newName: string, bucket: CoreBucket | string) => void;
}

export interface UNSPSCDetailModalProps {
  record: UNSPSCCommodityRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface DeclarativeDownloadPayload {
  href: string;
  filename: string;
}

export interface IngestionUploadSectionProps {
  tenant: TenantMaster;
  activeDatasetType: DatasetType;
  ingestionQueue: RawDocumentIngestion[];
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  totalEvaluatedSpendInrCr: number;
  onOpenSetupModal?: () => void;
  onDeleteDocument?: (docId?: string) => void;
}

export interface LoginBenefitsShowcaseProps {
  className?: string;
  showMetrics?: boolean;
}

// Module 3: PCBI Benchmark & Trend Analytics Props (Prompt 100)
export interface ExecutiveBenchmarkSummaryProps {
  summary: import('./pcbi').PCBIExecutiveSummary;
  className?: string;
}

export interface BenchmarkQualityDashboardProps {
  summary: import('./pcbi').PCBIExecutiveSummary;
  className?: string;
}

export interface BenchmarkCoverageWaterfallProps {
  summary: import('./pcbi').PCBIExecutiveSummary;
  className?: string;
}

export interface SpendCategoryViewProps {
  summary: import('./pcbi').PCBIExecutiveSummary;
  className?: string;
}

export interface CalculationTransparencyCardProps {
  className?: string;
}

export interface VendorPriceDispersionTableProps {
  vendorRankings?: VendorPriceRank[];
  calculations?: import('./pcbi').PCBITransactionCalculation[];
  onWhyThisBenchmark?: (item: import('./pcbi').PCBITransactionCalculation) => void;
  className?: string;
}

// Module 4: Consolidated Savings Engine Props (Prompt 100)
export interface SavingsWaterfallSectionProps {
  waterfallMetrics: import('./savings').SavingsWaterfallMetrics;
  className?: string;
}

export interface OverlapDeduplicationTableProps {
  overlaps: import('./savings').OpportunityOverlapGroup[];
  opportunities: import('./savings').SavingsOpportunityItem[];
  onUpdateStatus?: (oppId: string, status: import('./savings').SavingsOpportunityStatus) => void;
  className?: string;
}

export interface ActionPlanTrackerProps {
  actionPlans: import('./savings').ActionPlanItem[];
  onUpdateAction?: (actionId: string, updates: { status?: import('./savings').ActionPlanItem['status']; owner?: import('./savings').ActionOwner; priority?: 'HIGH' | 'MEDIUM' | 'LOW'; comments?: string }) => void;
  className?: string;
}

// Admin: PCBI Master Management Props (Prompts 103-104)
export interface PCBIUploadTabProps {
  uploadedFile: File | null;
  fileMetadata: {
    name: string;
    sizeMb: number;
    uploadDate: string;
    uploadedBy: string;
    worksheetCount: number;
    totalRecords: number;
  } | null;
  worksheets: import('./pcbiAdmin').PCBIWorksheetDetection[];
  mappings: Record<string, import('./pcbiAdmin').PCBIColumnMapping[]>;
  onFileUpload: (
    file: File,
    worksheets: import('./pcbiAdmin').PCBIWorksheetDetection[],
    datasets: Record<string, Record<string, unknown>[]>,
    mappings: Record<string, import('./pcbiAdmin').PCBIColumnMapping[]>
  ) => void;
  onOverrideWorksheet: (sheetName: string, newType: import('./pcbiAdmin').PCBIWorksheetType) => void;
  onOverrideColumnMapping: (sheetType: string, excelCol: string, mappedField: string) => void;
  onProceedToValidate: () => void;
}

export interface PCBIWorksheetDetectionSectionProps {
  worksheets: import('./pcbiAdmin').PCBIWorksheetDetection[];
  onOverrideWorksheet: (sheetName: string, newType: import('./pcbiAdmin').PCBIWorksheetType) => void;
}

export interface PCBIColumnMappingSectionProps {
  mappings: Record<string, import('./pcbiAdmin').PCBIColumnMapping[]>;
  selectedSheetForMapping: string;
  onSelectSheetForMapping: (sheetType: string) => void;
  onOverrideColumnMapping: (sheetType: string, excelCol: string, mappedField: string) => void;
}

export interface PCBIValidationSummaryCardsProps {
  summary: import('./pcbiAdmin').PCBIValidationSummary;
}

export interface PCBIConstituentReviewTableProps {
  constituentTotals: import('./pcbiAdmin').PCBIConstituentTotalSummary[];
}

export interface PCBIValidationIssuesTableProps {
  issues: import('./pcbiAdmin').PCBIValidationIssue[];
  blockingErrorCount: number;
  warningCount: number;
  informationCount: number;
}

export interface PCBIValidateTabProps {
  validationSummary: import('./pcbiAdmin').PCBIValidationSummary | null;
  onProceedToPreview: () => void;
}

export interface PCBIPreviewTabProps {
  validationSummary: import('./pcbiAdmin').PCBIValidationSummary | null;
  datasets: Record<string, Record<string, unknown>[]>;
  onProceedToImport: () => void;
}

export interface PCBIImportTabProps {
  importResult: import('./pcbiAdmin').PCBIImportResult | null;
  validationSummary: import('./pcbiAdmin').PCBIValidationSummary | null;
  fileName: string;
  isImporting: boolean;
  onExecuteImport: () => void;
  onOpenPublishModal: () => void;
  onViewImportedMaster: () => void;
}

export interface PCBIDashboardTabProps {
  activeVersion: import('./pcbiAdmin').PCBIVersionRecord | null;
  onNavigateToUpload: () => void;
  onNavigateToVersions: () => void;
}

export interface PCBIVersionsTabProps {
  versions: import('./pcbiAdmin').PCBIVersionRecord[];
  onPublishVersion: (version: string) => Promise<void>;
  showOnlyPublished?: boolean;
}

export interface PCBIPublishModalProps {
  isOpen: boolean;
  version: string;
  metrics: import('./pcbiAdmin').PCBIVersionMetrics | null;
  isPublishing: boolean;
  onConfirmPublish: () => Promise<void>;
  onClose: () => void;
}

export interface CommodityWorkspaceModalProps {
  isOpen: boolean;
  pcbiId: string | null;
  onClose: () => void;
  onSourceUploaded?: () => void;
  onDataApproved?: (version: string) => void;
}

export interface PCBICommodityDataLabViewProps {
  onOpenWorkspaceModal?: (pcbiId: string) => void;
  onNavigateToMaster?: () => void;
}


