import type {
  StrategicSavingsInitiative,
  StrategicSavingsSummaryMetrics
} from '../types/savingsInitiatives';
import { UI_STRINGS } from './uiStrings';

export const STRATEGIC_SAVINGS_INITIATIVE_KEYS = {
  VENDOR_CONSOLIDATION: 'VENDOR_CONSOLIDATION',
  PO_CONSOLIDATION: 'PO_CONSOLIDATION',
  STRATEGIC_SINGLE_VENDOR: 'STRATEGIC_SINGLE_VENDOR',
  VENDOR_SUPPLY_RATIONALIZATION: 'VENDOR_SUPPLY_RATIONALIZATION',
  CATEGORY_SAVINGS_PIPELINE: 'CATEGORY_SAVINGS_PIPELINE'
} as const;

export const DEFAULT_STRATEGIC_SAVINGS_INITIATIVES: StrategicSavingsInitiative[] = [
  {
    key: 'VENDOR_CONSOLIDATION',
    title: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorConsolidation.title,
    subtitle: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorConsolidation.subtitle,
    badge: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorConsolidation.badge,
    source: 'MODULE2_AI_CATEGORIZATION',
    sourceLabel: UI_STRINGS.savingsInitiativesSummary.sources.module2,
    targetModule: 'module2',
    targetSectionId: 'vendor-consolidation-section',
    spendInrCr: 162.8,
    savingsInrCr: 20.45,
    savingsPct: 12.6,
    lever: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorConsolidation.lever,
    executionPlatform: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorConsolidation.executionPlatform,
    accentColor: 'cyan',
    iconName: 'gavel'
  },
  {
    key: 'PO_CONSOLIDATION',
    title: UI_STRINGS.savingsInitiativesSummary.initiatives.poConsolidation.title,
    subtitle: UI_STRINGS.savingsInitiativesSummary.initiatives.poConsolidation.subtitle,
    badge: UI_STRINGS.savingsInitiativesSummary.initiatives.poConsolidation.badge,
    source: 'MODULE2_AI_CATEGORIZATION',
    sourceLabel: UI_STRINGS.savingsInitiativesSummary.sources.module2,
    targetModule: 'module2',
    targetSectionId: 'po-consolidation-section',
    spendInrCr: 182.4,
    savingsInrCr: 24.86,
    savingsPct: 13.6,
    lever: UI_STRINGS.savingsInitiativesSummary.initiatives.poConsolidation.lever,
    executionPlatform: UI_STRINGS.savingsInitiativesSummary.initiatives.poConsolidation.executionPlatform,
    accentColor: 'blue',
    iconName: 'fileSpreadsheet'
  },
  {
    key: 'STRATEGIC_SINGLE_VENDOR',
    title: UI_STRINGS.savingsInitiativesSummary.initiatives.strategicSingleVendor.title,
    subtitle: UI_STRINGS.savingsInitiativesSummary.initiatives.strategicSingleVendor.subtitle,
    badge: UI_STRINGS.savingsInitiativesSummary.initiatives.strategicSingleVendor.badge,
    source: 'MODULE2_AI_CATEGORIZATION',
    sourceLabel: UI_STRINGS.savingsInitiativesSummary.sources.module2,
    targetModule: 'module2',
    targetSectionId: 'strategic-risk-section',
    spendInrCr: 4307.81,
    savingsInrCr: 38.7,
    savingsPct: 5.8,
    lever: UI_STRINGS.savingsInitiativesSummary.initiatives.strategicSingleVendor.lever,
    executionPlatform: UI_STRINGS.savingsInitiativesSummary.initiatives.strategicSingleVendor.executionPlatform,
    accentColor: 'rose',
    iconName: 'shieldAlert'
  },
  {
    key: 'VENDOR_SUPPLY_RATIONALIZATION',
    title: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorSupplyRationalization.title,
    subtitle: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorSupplyRationalization.subtitle,
    badge: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorSupplyRationalization.badge,
    source: 'MODULE2_AI_CATEGORIZATION',
    sourceLabel: UI_STRINGS.savingsInitiativesSummary.sources.module2,
    targetModule: 'module2',
    targetSectionId: 'vendor-category-supply-section',
    spendInrCr: 94.5,
    savingsInrCr: 14.25,
    savingsPct: 15.1,
    lever: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorSupplyRationalization.lever,
    executionPlatform: UI_STRINGS.savingsInitiativesSummary.initiatives.vendorSupplyRationalization.executionPlatform,
    accentColor: 'purple',
    iconName: 'layers'
  },
  {
    key: 'CATEGORY_SAVINGS_PIPELINE',
    title: UI_STRINGS.savingsInitiativesSummary.initiatives.categorySavingsPipeline.title,
    subtitle: UI_STRINGS.savingsInitiativesSummary.initiatives.categorySavingsPipeline.subtitle,
    badge: UI_STRINGS.savingsInitiativesSummary.initiatives.categorySavingsPipeline.badge,
    source: 'MODULE4_SAVINGS_ENGINE',
    sourceLabel: UI_STRINGS.savingsInitiativesSummary.sources.module4,
    targetModule: 'module4',
    targetSectionId: 'savings-pipeline-table-section',
    spendInrCr: 732.41,
    savingsInrCr: 119.67,
    savingsPct: 16.4,
    lever: UI_STRINGS.savingsInitiativesSummary.initiatives.categorySavingsPipeline.lever,
    executionPlatform: UI_STRINGS.savingsInitiativesSummary.initiatives.categorySavingsPipeline.executionPlatform,
    accentColor: 'emerald',
    iconName: 'zap'
  }
];

export const calculateDefaultStrategicSavingsMetrics = (): StrategicSavingsSummaryMetrics => {
  const initiatives = DEFAULT_STRATEGIC_SAVINGS_INITIATIVES;

  const module2SpendInrCr = Number(
    initiatives
      .filter((i) => i.source === 'MODULE2_AI_CATEGORIZATION')
      .reduce((acc, curr) => acc + curr.spendInrCr, 0)
      .toFixed(2)
  );

  const module2SavingsInrCr = Number(
    initiatives
      .filter((i) => i.source === 'MODULE2_AI_CATEGORIZATION')
      .reduce((acc, curr) => acc + curr.savingsInrCr, 0)
      .toFixed(2)
  );

  const module4SpendInrCr = Number(
    initiatives
      .filter((i) => i.source === 'MODULE4_SAVINGS_ENGINE')
      .reduce((acc, curr) => acc + curr.spendInrCr, 0)
      .toFixed(2)
  );

  const module4SavingsInrCr = Number(
    initiatives
      .filter((i) => i.source === 'MODULE4_SAVINGS_ENGINE')
      .reduce((acc, curr) => acc + curr.savingsInrCr, 0)
      .toFixed(2)
  );

  const grandTotalSavingsInrCr = Number((module2SavingsInrCr + module4SavingsInrCr).toFixed(2));
  // Total operational spend evaluated (excluding non-overlapping duplicate commodities)
  const grandTotalSpendInrCr = Number(
    (162.8 + 182.4 + 94.5 + 732.41).toFixed(2)
  ); // ₹1,172.11 Cr operational baseline

  const overallSavingsPct = Number(
    ((grandTotalSavingsInrCr / grandTotalSpendInrCr) * 100).toFixed(1)
  );

  return {
    grandTotalSpendInrCr,
    grandTotalSavingsInrCr,
    overallSavingsPct,
    module2SpendInrCr,
    module2SavingsInrCr,
    module4SpendInrCr,
    module4SavingsInrCr,
    initiativesCount: initiatives.length,
    initiatives
  };
};
