import type { PipelineActiveTab } from './components';
import type { SavingsOpportunity } from './models';
import type { RecurringConsolidationItem } from './vendorConsolidation';
import type { StrategicSingleVendorItem } from './strategicVendorRisk';
import type { MultiplePoItem } from './poConsolidation';
import type { SavingsWaterfallMetrics } from './savings';

export type SavingsInitiativeSource = 'MODULE2_AI_CATEGORIZATION' | 'MODULE4_SAVINGS_ENGINE';

export type SavingsInitiativeKey =
  | 'VENDOR_CONSOLIDATION'
  | 'PO_CONSOLIDATION'
  | 'STRATEGIC_SINGLE_VENDOR'
  | 'VENDOR_SUPPLY_RATIONALIZATION'
  | 'CATEGORY_SAVINGS_PIPELINE';

export interface StrategicSavingsInitiative {
  key: SavingsInitiativeKey;
  title: string;
  subtitle: string;
  badge: string;
  source: SavingsInitiativeSource;
  sourceLabel: string;
  targetModule: PipelineActiveTab;
  targetSectionId: string;
  spendInrCr: number;
  savingsInrCr: number;
  savingsPct: number;
  lever: string;
  executionPlatform: string;
  accentColor: string;
  iconName: 'gavel' | 'fileSpreadsheet' | 'shieldAlert' | 'layers' | 'zap';
}

export interface StrategicSavingsSummaryMetrics {
  grandTotalSpendInrCr: number;
  grandTotalSavingsInrCr: number;
  netModelledOpportunityInrCr: number;
  grossOpportunityInrCr: number;
  overlapDeductionsInrCr: number;
  provenOpportunityInrCr: number;
  discoveryOpportunityInrCr: number;
  realizedSavingsInrCr: number;
  addressableSpendInrCr: number;
  overallSavingsPct: number;
  module2SpendInrCr: number;
  module2SavingsInrCr: number;
  module4SpendInrCr: number;
  module4SavingsInrCr: number;
  initiativesCount: number;
  initiatives: StrategicSavingsInitiative[];
}

export interface StrategicSavingsSummaryBannerProps {
  summaryMetrics?: StrategicSavingsSummaryMetrics;
  onNavigateToSection?: (targetModule: PipelineActiveTab, targetSectionId: string) => void;
  currentTier?: string;
  onUpgrade?: (tier: string) => void;
}

export interface WaterfallBreakdownResult {
  netModelled: number;
  gross: number;
  overlap: number;
  proven: number;
  discovery: number;
  realized: number;
  addressable: number;
}

export interface StrategicSavingsBuildOptions {
  opportunities?: SavingsOpportunity[];
  consolidationItems?: RecurringConsolidationItem[];
  poItems?: MultiplePoItem[];
  strategicRiskItems?: StrategicSingleVendorItem[];
  waterfallMetrics?: SavingsWaterfallMetrics;
  strategicSummary?: Record<string, unknown>;
  evaluatedBaselineSpendCr?: number;
}
