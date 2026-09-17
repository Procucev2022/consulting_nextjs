import type {
  SavingsOpportunity,
  RecurringConsolidationItem,
  StrategicSingleVendorItem,
  MultiplePoItem,
  StrategicSavingsInitiative,
  StrategicSavingsSummaryMetrics,
  SavingsInitiativeKey
} from '../types';
import {
  DEFAULT_STRATEGIC_SAVINGS_INITIATIVES,
  calculateDefaultStrategicSavingsMetrics
} from '../constants/savingsInitiatives';

export interface StrategicSavingsBuildOptions {
  opportunities?: SavingsOpportunity[];
  consolidationItems?: RecurringConsolidationItem[];
  poItems?: MultiplePoItem[];
  strategicRiskItems?: StrategicSingleVendorItem[];
}

const updateVendorConsolidation = (
  init: StrategicSavingsInitiative,
  items?: RecurringConsolidationItem[]
): StrategicSavingsInitiative => {
  if (items === undefined) return { ...init };
  if (items.length === 0) return { ...init, spendInrCr: 0, savingsInrCr: 0, savingsPct: 0 };
  const spend = Number(items.reduce((acc, c) => acc + c.total_spend_inr_cr, 0).toFixed(2));
  const savings = Number(items.reduce((acc, c) => acc + c.est_volume_savings_cr, 0).toFixed(2));
  const pct = spend > 0 ? Number(((savings / spend) * 100).toFixed(1)) : 0;
  return { ...init, spendInrCr: spend, savingsInrCr: savings, savingsPct: pct };
};

const updatePoConsolidation = (
  init: StrategicSavingsInitiative,
  items?: MultiplePoItem[]
): StrategicSavingsInitiative => {
  if (items === undefined) return { ...init };
  if (items.length === 0) return { ...init, spendInrCr: 0, savingsInrCr: 0, savingsPct: 0 };
  const spend = Number(items.reduce((acc, p) => acc + p.total_annual_spend_cr, 0).toFixed(2));
  const savings = Number(
    items
      .reduce((acc, p) => {
        const chosen = p.cadence_options[p.recommended_cadence];
        return acc + (chosen?.total_benefit_cr || 0);
      }, 0)
      .toFixed(2)
  );
  const pct = spend > 0 ? Number(((savings / spend) * 100).toFixed(1)) : 0;
  return { ...init, spendInrCr: spend, savingsInrCr: savings, savingsPct: pct };
};

const updateStrategicRisk = (
  init: StrategicSavingsInitiative,
  items?: StrategicSingleVendorItem[]
): StrategicSavingsInitiative => {
  if (items === undefined) return { ...init };
  if (items.length === 0) return { ...init, spendInrCr: 0, savingsInrCr: 0, savingsPct: 0 };
  const spend = Number(items.reduce((acc, s) => acc + s.total_spend_inr_cr, 0).toFixed(2));
  const savings = Number((spend * 0.058).toFixed(2));
  return { ...init, spendInrCr: spend, savingsInrCr: savings, savingsPct: 5.8 };
};

const updateCategorySavings = (
  init: StrategicSavingsInitiative,
  items?: SavingsOpportunity[]
): StrategicSavingsInitiative => {
  if (items === undefined) return { ...init };
  if (items.length === 0) return { ...init, spendInrCr: 0, savingsInrCr: 0, savingsPct: 0 };
  const spend = Number(
    items
      .reduce((acc, opp) => acc + (opp.current_spend_inr_cr || ((opp.current_spend || 0) * 83.8) / 10000000 || opp.baseline_spend_inr_cr || 0), 0)
      .toFixed(2)
  );
  const savings = Number(
    items
      .reduce((acc, opp) => acc + (opp.est_savings_inr_cr || ((opp.est_savings || 0) * 83.8) / 10000000 || opp.estimated_savings_inr_cr || 0), 0)
      .toFixed(2)
  );
  const pct = spend > 0 ? Number(((savings / spend) * 100).toFixed(1)) : 0;
  return { ...init, spendInrCr: spend, savingsInrCr: savings, savingsPct: pct };
};

const resolveInitiativeData = (
  init: StrategicSavingsInitiative,
  options: StrategicSavingsBuildOptions
): StrategicSavingsInitiative => {
  switch (init.key) {
    case 'VENDOR_CONSOLIDATION':
      return updateVendorConsolidation(init, options.consolidationItems);
    case 'PO_CONSOLIDATION':
      return updatePoConsolidation(init, options.poItems);
    case 'STRATEGIC_SINGLE_VENDOR':
      return updateStrategicRisk(init, options.strategicRiskItems);
    case 'VENDOR_SUPPLY_RATIONALIZATION':
      if (options.opportunities !== undefined && options.opportunities.length === 0) {
        return { ...init, spendInrCr: 0, savingsInrCr: 0, savingsPct: 0 };
      }
      return { ...init };
    case 'CATEGORY_SAVINGS_PIPELINE':
      return updateCategorySavings(init, options.opportunities);
    default:
      return { ...init };
  }
};

export const buildStrategicSavingsSummary = (
  options?: StrategicSavingsBuildOptions
): StrategicSavingsSummaryMetrics => {
  if (!options) {
    return calculateDefaultStrategicSavingsMetrics();
  }

  // Map each initiative using dedicated resolvers
  const initiatives: StrategicSavingsInitiative[] = DEFAULT_STRATEGIC_SAVINGS_INITIATIVES.map((init) =>
    resolveInitiativeData(init, options)
  );

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
  const grandTotalSpendInrCr = Number(
    initiatives.reduce((acc, curr) => {
      // Exclude strategic raw material total to preserve operating spend baseline
      if (curr.key === 'STRATEGIC_SINGLE_VENDOR') return acc;
      return acc + curr.spendInrCr;
    }, 0).toFixed(2)
  );

  const overallSavingsPct = grandTotalSpendInrCr > 0
    ? Number(((grandTotalSavingsInrCr / grandTotalSpendInrCr) * 100).toFixed(1))
    : 0;

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

export const getInitiativeByKey = (
  initiatives: StrategicSavingsInitiative[],
  key: SavingsInitiativeKey
): StrategicSavingsInitiative | undefined => {
  return initiatives.find((item) => item.key === key);
};

export const formatSavingsAmountCr = (amountInrCr: number): string => {
  return `₹${amountInrCr.toFixed(2)} Cr`;
};
