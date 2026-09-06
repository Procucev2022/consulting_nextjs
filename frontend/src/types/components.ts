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
  VendorYearDetail
} from './models';
import type { HeaderCurrency } from './currency';
import type { CoreBucket } from './taxonomy';

// Main View & Navigation Props
export interface HeaderProps {
  tenant: TenantMaster;
  onSelectTenant: (tenant: TenantMaster) => void;
  currency: HeaderCurrency;
  onSelectCurrency: (currency: HeaderCurrency) => void;
  onOpenReport: () => void;
  theme: 'light' | 'dark';
  onSelectTheme: (theme: 'light' | 'dark') => void;
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
  onApplyBlanketFixes?: () => void;
  onResetValidationRecords?: () => void;
  onRunAICategorization: () => void;
  onAddBatchUpload: (file: File, datasetType: DatasetType) => void;
}

export interface Module2CategorizationProps {
  categories: SpendCategorySummary[];
  lineItems: LineItemMapping[];
  onConfirmMapping: (mappingId: string) => void;
  onReassignMapping: (item: LineItemMapping) => void;
  onProceedToTrend: () => void;
}

export interface Module3TrendAnalyticsProps {
  vendorRankings: VendorPriceRank[];
  onProceedToSavings: () => void;
  theme?: 'light' | 'dark';
}

export interface Module4SavingsEngineProps {
  opportunities: SavingsOpportunity[];
  onOpenProCPX: (opp: SavingsOpportunity) => void;
  onOpenDPSNXT: (opp: SavingsOpportunity) => void;
  onProceedToConversion: () => void;
}

export interface Module5ConversionMatrixProps {
  tenant: TenantMaster;
  funnelStages: ConversionFunnelPhase[];
  onOpenReport: () => void;
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

export interface DeclarativeDownloadPayload {
  href: string;
  filename: string;
}

