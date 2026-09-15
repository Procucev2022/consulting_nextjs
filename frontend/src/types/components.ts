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
  currentTier?: SubscriptionTier;
  onSelectSimulatedTier?: (tier: SubscriptionTier | null) => void;
  user?: UserProfile | null;
  onContactSupport?: () => void;
}

export type PipelineActiveTab = 'module1' | 'module2' | 'module3' | 'module4' | 'module5' | 'schema';

export interface PipelineBarProps {
  activeTab: PipelineActiveTab;
  onSelectTab: (tab: PipelineActiveTab) => void;
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
}

export interface Module5ConversionMatrixProps {
  tenant: TenantMaster;
  funnelStages: ConversionFunnelPhase[];
  onOpenReport: () => void;
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
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
}

export interface LoginBenefitsShowcaseProps {
  className?: string;
  showMetrics?: boolean;
}


