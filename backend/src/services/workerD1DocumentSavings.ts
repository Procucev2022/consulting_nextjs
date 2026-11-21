import { SAVINGS_D1_INR_PER_CRORE } from '../constants/savingsD1';
import type { ActionPlanItem, SavingsOpportunityItem, SavingsWaterfallMetrics, SavingsSourceEngine } from '../types/savings';
import type { ExecutiveOpportunityBriefMaterialGroupRow } from '../types/executiveOpportunityBrief';

const numberValue = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;

export const buildStrategicSummary = (addressableSpendCr: number): Record<string, number> => {
  const baseSpend = Number(Math.max(0, addressableSpendCr).toFixed(2));
  const vendorConsolidationSpend = Number((baseSpend * 0.38).toFixed(2));
  const vendorConsolidationSavings = Number((vendorConsolidationSpend * 0.072).toFixed(2));
  const volumeBundlingSpend = Number((baseSpend * 0.28).toFixed(2));
  const volumeBundlingSavings = Number((volumeBundlingSpend * 0.064).toFixed(2));
  const eauctionSpend = Number((baseSpend * 0.22).toFixed(2));
  const eauctionSavings = Number((eauctionSpend * 0.091).toFixed(2));
  const categorySpecialistSavings = Number((baseSpend * 0.045).toFixed(2));

  return {
    totalAddressableSpendInrCr: baseSpend,
    vendorConsolidationAddressableSpendInrCr: vendorConsolidationSpend,
    totalPotentialConsolidationOpportunityInrCr: vendorConsolidationSavings,
    volumeBundlingAddressableSpendInrCr: volumeBundlingSpend,
    volumeBundlingQuantifiableBenefitInrCr: volumeBundlingSavings,
    eauctionAddressableSpendInrCr: eauctionSpend,
    totalPotentialEAuctionOpportunityInrCr: eauctionSavings,
    categorySpecialistOpportunityInrCr: categorySpecialistSavings
  };
};

const LEVERS_SPEC: ReadonlyArray<{ lever: string; engine: SavingsSourceEngine; pct: number }> = [
  { lever: 'DIRECT PRICE RENEGOTIATION', engine: 'PRICE_DISPERSION', pct: 0.065 },
  { lever: 'SUPPLIER CONSOLIDATION', engine: 'VENDOR_CONSOLIDATION', pct: 0.075 },
  { lever: 'VOLUME POOLING', engine: 'VOLUME_AGGREGATION', pct: 0.080 },
  { lever: 'REVERSE E-AUCTIONS', engine: 'E_AUCTION', pct: 0.095 },
  { lever: 'CONTRACT COMPLIANCE', engine: 'RATE_CONTRACT', pct: 0.060 },
  { lever: 'SPECIFICATION HARMONIZATION', engine: 'SPECIFICATION_RATIONALIZATION', pct: 0.070 }
];

export const buildDocumentSavingsResult = (
  materialGroups: ExecutiveOpportunityBriefMaterialGroupRow[],
  totalSpendCrInput: number
): Record<string, unknown> => {
  const materialSpendSum = materialGroups.reduce((acc, g) => acc + numberValue(g.spend_cr), 0);
  const totalSpendCr = totalSpendCrInput > 0 ? totalSpendCrInput : Number(materialSpendSum.toFixed(2));

  const opportunities: SavingsOpportunityItem[] = materialGroups.map((group, idx) => {
    const spec = LEVERS_SPEC[idx % LEVERS_SPEC.length];
    const spendCr = numberValue(group.spend_cr);
    const savingsCr = Number((spendCr * spec.pct).toFixed(2));
    const oppId = `OPP-${String(idx + 1).padStart(3, '0')}`;
    const category = group.label?.trim() || 'Materials';
    return {
      opportunity_id: oppId,
      source_module: 'MODULE_2_STRATEGIC',
      source_engine: spec.engine,
      category,
      item: `${category} - ${spec.lever}`,
      vendor: '',
      plant: '',
      spend_inr: spendCr * SAVINGS_D1_INR_PER_CRORE,
      spend_inr_cr: spendCr,
      potential_savings_inr: savingsCr * SAVINGS_D1_INR_PER_CRORE,
      potential_savings_inr_cr: savingsCr,
      is_overlapping: false,
      net_savings_inr: savingsCr * SAVINGS_D1_INR_PER_CRORE,
      net_savings_inr_cr: savingsCr,
      status: 'IDENTIFIED',
      owner: 'Procurement',
      department: category,
      timeline: 'Q1 2027',
      validation_notes: `Benchmark supplier pricing and consolidate volumes for ${category}.`,
      created_at: new Date().toISOString()
    };
  });

  const actionPlans: ActionPlanItem[] = opportunities.slice(0, 4).map((opp, idx) => ({
    id: `ACT-${String(idx + 1).padStart(3, '0')}`,
    opportunity_id: opp.opportunity_id,
    action: `Consolidate supplier allocation and execute rate harmonization for ${opp.category}.`,
    owner: 'Procurement',
    department: opp.category,
    target_date: '2026-12-31',
    priority: idx === 0 ? 'HIGH' : 'MEDIUM',
    expected_value_inr: opp.potential_savings_inr,
    expected_value_inr_cr: opp.potential_savings_inr_cr,
    status: 'Open',
    comments: `Benchmark supplier pricing against validated baseline of ₹${opp.spend_inr_cr.toFixed(2)} Cr.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const grossSavingsCr = Number(opportunities.reduce((acc, o) => acc + o.potential_savings_inr_cr, 0).toFixed(2));
  const overlapDeductionCr = Number((grossSavingsCr * 0.03).toFixed(2));
  const netSavingsCr = Number(Math.max(0, grossSavingsCr - overlapDeductionCr).toFixed(2));
  const provenOppCr = Number((netSavingsCr * 0.35).toFixed(2));
  const discoveryOppCr = Number((netSavingsCr - provenOppCr).toFixed(2));

  const waterfallMetrics: SavingsWaterfallMetrics = {
    total_spend_inr_cr: totalSpendCr,
    addressable_spend_inr_cr: totalSpendCr,
    identified_opportunities_count: opportunities.length,
    gross_potential_savings_inr_cr: grossSavingsCr,
    deduplicated_overlap_inr_cr: overlapDeductionCr,
    net_potential_savings_inr_cr: netSavingsCr,
    proven_opportunity_inr_cr: provenOppCr,
    discovery_opportunity_inr_cr: discoveryOppCr,
    validated_savings_inr_cr: 0,
    approved_savings_inr_cr: 0,
    realized_savings_inr_cr: 0
  };

  const strategicSummary = buildStrategicSummary(totalSpendCr);

  return {
    opportunities,
    overlaps: [],
    waterfallMetrics,
    actionPlans,
    strategicSummary,
    totalGrossSavingsCr: waterfallMetrics.gross_potential_savings_inr_cr,
    overlapDeductionCr: waterfallMetrics.deduplicated_overlap_inr_cr,
    netClientSavingsCr: waterfallMetrics.net_potential_savings_inr_cr,
    actionPlansCount: actionPlans.length
  };
};
