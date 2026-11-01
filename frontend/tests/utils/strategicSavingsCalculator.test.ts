import { describe, it, expect } from 'vitest';
import {
  buildStrategicSavingsSummary,
  getInitiativeByKey,
  formatSavingsAmountCr
} from '../../src/utils/strategicSavingsCalculator';
import {
  DEFAULT_STRATEGIC_SAVINGS_INITIATIVES,
  calculateDefaultStrategicSavingsMetrics
} from '../../src/constants/savingsInitiatives';
import type {
  SavingsOpportunity,
  RecurringConsolidationItem,
  StrategicSingleVendorItem,
  MultiplePoItem
} from '../../src/types';

describe('strategicSavingsCalculator', () => {
  it('returns default metrics when no options are provided', () => {
    const defaultMetrics = calculateDefaultStrategicSavingsMetrics();
    const result = buildStrategicSavingsSummary();

    expect(result.grandTotalSpendInrCr).toBe(defaultMetrics.grandTotalSpendInrCr);
    expect(result.grandTotalSavingsInrCr).toBe(defaultMetrics.grandTotalSavingsInrCr);
    expect(result.overallSavingsPct).toBe(defaultMetrics.overallSavingsPct);
    expect(result.initiativesCount).toBe(5);
    expect(result.initiatives).toHaveLength(5);
  });

  it('calculates dynamic values when consolidationItems are passed', () => {
    const mockConsolidationItems: RecurringConsolidationItem[] = [
      {
        id: 'C-01',
        category: 'Packaging Materials',
        item_group_title: 'Boxes',
        item_group_code: 'GRP-01',
        unspsc_family: 'Boxes',
        unspsc_code: '24111500',
        total_spend_inr_cr: 100.0,
        vendor_count: 6,
        recurring_monthly: true,
        procurement_cadence: '12/12',
        monthly_po_avg: 10,
        annual_units: 1000,
        unit_of_measure: 'PCS',
        price_variance_pct: 10,
        target_consolidated_vendors: 2,
        est_volume_savings_pct: 15.0,
        est_volume_savings_cr: 15.0,
        recommended_auction_type: 'Reverse',
        auction_platform: 'DPS NXT',
        suppliers: [],
        consolidation_roadmap: ['Step 1', 'Step 2']
      }
    ];

    const result = buildStrategicSavingsSummary({
      consolidationItems: mockConsolidationItems
    });

    const init = getInitiativeByKey(result.initiatives, 'VENDOR_CONSOLIDATION');
    expect(init).toBeDefined();
    expect(init?.spendInrCr).toBe(100.0);
    expect(init?.savingsInrCr).toBe(15.0);
    expect(init?.savingsPct).toBe(15.0);
  });

  it('calculates dynamic values when poItems are passed', () => {
    const mockPoItems: MultiplePoItem[] = [
      {
        id: 'PO-01',
        vendor_id: 'V-01',
        vendor_name: 'Test Steel',
        category: 'Direct Materials',
        item_description: 'Coils',
        material_code: 'MAT-01',
        total_annual_spend_cr: 200.0,
        annual_po_count: 100,
        avg_pos_per_month: 8,
        avg_po_value_lakhs: 20,
        primary_plant: 'Plant 1',
        cadence_options: {
          MONTHLY: {
            cadence: 'MONTHLY',
            label: 'Monthly',
            target_pos_per_year: 12,
            po_reduction_pct: 88,
            scale_discount_pct: 5,
            scale_savings_cr: 10,
            admin_savings_lakhs: 88,
            total_benefit_cr: 10.88
          },
          QUARTERLY: {
            cadence: 'QUARTERLY',
            label: 'Quarterly',
            target_pos_per_year: 4,
            po_reduction_pct: 96,
            scale_discount_pct: 10,
            scale_savings_cr: 20,
            admin_savings_lakhs: 96,
            total_benefit_cr: 20.96
          },
          HALF_YEARLY: {
            cadence: 'HALF_YEARLY',
            label: 'Half-Yearly',
            target_pos_per_year: 2,
            po_reduction_pct: 98,
            scale_discount_pct: 12,
            scale_savings_cr: 24,
            admin_savings_lakhs: 98,
            total_benefit_cr: 24.98
          },
          ANNUAL: {
            cadence: 'ANNUAL',
            label: 'Annual',
            target_pos_per_year: 1,
            po_reduction_pct: 99,
            scale_discount_pct: 16,
            scale_savings_cr: 32,
            admin_savings_lakhs: 99,
            total_benefit_cr: 32.99
          }
        },
        recommended_cadence: 'ANNUAL',
        best_practice_recommendation: 'Rec',
        blanket_po_strategy: 'Strategy',
        monthly_distribution: []
      }
    ];

    const result = buildStrategicSavingsSummary({
      poItems: mockPoItems
    });

    const init = getInitiativeByKey(result.initiatives, 'PO_CONSOLIDATION');
    expect(init).toBeDefined();
    expect(init?.spendInrCr).toBe(200.0);
    expect(init?.savingsInrCr).toBe(32.99);
  });

  it('calculates dynamic values when strategicRiskItems are passed', () => {
    const mockStrategicRiskItems: StrategicSingleVendorItem[] = [
      {
        material_code: 'MAT-01',
        material_desc: 'Refined Nickel',
        total_spend_inr_cr: 500.0,
        core_bucket: 'Direct Materials',
        unspsc_code: '11101701',
        unspsc_commodity_title: 'Nickel',
        unspsc_class_title: 'Metals',
        unspsc_class_code: '11101700',
        unspsc_family_title: 'Minerals',
        segment_code: '11000000',
        primary_vendor: {
          vendor_name: 'Vendor A',
          spend_inr_cr: 500.0,
          share_percentage: 100.0,
          is_primary: true,
          is_secondary_single_digit: false
        },
        risk_level: 'SOLE_SOURCE_CRITICAL',
        risk_score: 99,
        annual_quantity: 100,
        unit_of_measure: 'MT',
        po_count: 10,
        mitigation_urgency: 'IMMEDIATE_ACTION',
        actionable_mitigation: 'Mitigation plan',
        suggested_action_plan: []
      }
    ];

    const result = buildStrategicSavingsSummary({
      strategicRiskItems: mockStrategicRiskItems
    });

    const init = getInitiativeByKey(result.initiatives, 'STRATEGIC_SINGLE_VENDOR');
    expect(init).toBeDefined();
    expect(init?.spendInrCr).toBe(500.0);
    expect(init?.savingsInrCr).toBe(29.0); // 500 * 0.058
  });

  it('calculates dynamic values when opportunities are passed', () => {
    const mockOpportunities: SavingsOpportunity[] = [
      {
        opp_id: 'OPP-1',
        category: 'Packaging Materials',
        title: 'Boxes RFP',
        current_spend: 1000000,
        current_spend_inr_cr: 50.0,
        target_savings_pct: 20.0,
        est_savings: 200000,
        est_savings_inr_cr: 10.0,
        recommended_action: 'Action',
        push_to_module: 'proCPX',
        status: 'Identified',
        risk_level: 'Low',
        contract_leak_type: 'Leak'
      },
      {
        opp_id: 'OPP-2',
        category: 'Direct Materials',
        title: 'Chemical Pegging',
        current_spend: 1000000, // Unnormalized source amount is not treated as INR crores.
        target_savings_pct: 10.0,
        est_savings: 100000,
        recommended_action: 'Action',
        push_to_module: 'DPS NXT',
        status: 'Identified',
        risk_level: 'Low',
        contract_leak_type: 'Leak'
      }
    ];

    const result = buildStrategicSavingsSummary({
      opportunities: mockOpportunities
    });

    const init = getInitiativeByKey(result.initiatives, 'CATEGORY_SAVINGS_PIPELINE');
    expect(init).toBeDefined();
    expect(init?.spendInrCr).toBe(50.0);
    expect(init?.savingsInrCr).toBe(10.0);
  });

  it('handles edge case of 0 spend or empty arrays', () => {
    const zeroSpendConsolidation: RecurringConsolidationItem[] = [
      {
        id: 'C-0',
        category: 'Packaging Materials',
        item_group_title: 'Zero',
        item_group_code: 'GRP-0',
        unspsc_family: 'Family',
        unspsc_code: '00000000',
        total_spend_inr_cr: 0,
        vendor_count: 6,
        recurring_monthly: true,
        procurement_cadence: '12/12',
        monthly_po_avg: 0,
        annual_units: 0,
        unit_of_measure: 'PCS',
        price_variance_pct: 0,
        target_consolidated_vendors: 2,
        est_volume_savings_pct: 0,
        est_volume_savings_cr: 0,
        recommended_auction_type: 'Reverse',
        auction_platform: 'DPS NXT',
        suppliers: [],
        consolidation_roadmap: ['Step 1']
      }
    ];

    const result = buildStrategicSavingsSummary({
      consolidationItems: zeroSpendConsolidation,
      poItems: [],
      strategicRiskItems: [],
      opportunities: []
    });

    const init = getInitiativeByKey(result.initiatives, 'VENDOR_CONSOLIDATION');
    expect(init?.savingsPct).toBe(0);
  });

  it('getInitiativeByKey returns undefined for non-existent key', () => {
    const result = getInitiativeByKey(DEFAULT_STRATEGIC_SAVINGS_INITIATIVES, 'NON_EXISTENT' as any);
    expect(result).toBeUndefined();
  });

  it('formatSavingsAmountCr formats numbers in Crores', () => {
    expect(formatSavingsAmountCr(120.456)).toBe('₹120.46 Cr');
    expect(formatSavingsAmountCr(0)).toBe('₹0.00 Cr');
  });

  it('covers CATEGORY_SAVINGS_PIPELINE with baseline_spend_inr_cr/estimated_savings_inr_cr fallback (lines 75-76, 86-87)', () => {
    // Opportunities use baseline_spend_inr_cr and estimated_savings_inr_cr (third fallback in || chain)
    const oppsWithBaseline: SavingsOpportunity[] = [
      {
        opp_id: 'OPP-BASELINE-1',
        category: 'Indirect Materials',
        current_spend_inr_cr: undefined,
        current_spend: 0,
        baseline_spend_inr_cr: 5.0,    // hits line 75 third branch
        est_savings_inr_cr: undefined,
        est_savings: 0,
        estimated_savings_inr_cr: 0.9,  // hits line 86 third branch
        target_savings_pct: 18,
        status: 'validated',
        push_to_module: 'proCPX'
      }
    ];
    const result = buildStrategicSavingsSummary({
      consolidationItems: [],
      poItems: [],
      strategicRiskItems: [],
      opportunities: oppsWithBaseline
    });
    const categoryInit = getInitiativeByKey(result.initiatives, 'CATEGORY_SAVINGS_PIPELINE');
    expect(categoryInit?.spendInrCr).toBeCloseTo(5.0, 1);
    expect(categoryInit?.savingsInrCr).toBeCloseTo(0.9, 1);
  });

  it('covers VENDOR_SUPPLY_RATIONALIZATION with non-empty opportunities (line 111 branch)', () => {
    // opportunities.length > 0 → returns { ...init } without zeroing
    const opps: SavingsOpportunity[] = [
      {
        opp_id: 'OPP-VSR-1',
        category: 'MRO',
        current_spend_inr_cr: 8.0,
        est_savings_inr_cr: 1.2,
        target_savings_pct: 15,
        status: 'pending',
        push_to_module: 'DPS NXT'
      }
    ];
    const result = buildStrategicSavingsSummary({
      consolidationItems: [],
      poItems: [],
      strategicRiskItems: [],
      opportunities: opps
    });
    // VENDOR_SUPPLY_RATIONALIZATION returns { ...init } when opps.length > 0
    const rationInit = getInitiativeByKey(result.initiatives, 'VENDOR_SUPPLY_RATIONALIZATION');
    expect(rationInit).toBeDefined();
  });

  it('calculates metrics accurately when authoritative strategicSummary and waterfallMetrics are provided', () => {
    const mockWaterfallMetrics = {
      total_spend_inr_cr: 613.8805,
      addressable_spend_inr_cr: 315.021,
      identified_opportunities_count: 191,
      gross_potential_savings_inr_cr: 110.764,
      deduplicated_overlap_inr_cr: 25.123,
      net_potential_savings_inr_cr: 85.641,
      proven_opportunity_inr_cr: 82.380,
      discovery_opportunity_inr_cr: 3.261,
      validated_savings_inr_cr: 0.0,
      approved_savings_inr_cr: 0.0,
      realized_savings_inr_cr: 0.0
    };

    const mockStrategicSummary = {
      totalSpendAnalyzedInrCr: 613.881,
      totalAddressableSpendInrCr: 315.021,
      totalPotentialEAuctionOpportunityInrCr: 55.146,
      totalPotentialConsolidationOpportunityInrCr: 49.764,
      volumeBundlingQuantifiableBenefitInrCr: 5.854,
      grossQuantifiableBenefitInrCr: 110.764,
      totalOverlappingOpportunityInrCr: 25.123,
      netQuantifiableOpportunityInrCr: 85.641,
      provenOpportunityInrCr: 82.380,
      discoveryOpportunityInrCr: 3.261,
      vendorConsolidationAddressableSpendInrCr: 315.021,
      volumeBundlingAddressableSpendInrCr: 315.021,
      eauctionAddressableSpendInrCr: 315.021,
      categorySpecialistOpportunityInrCr: 0
    };

    const result = buildStrategicSavingsSummary({
      waterfallMetrics: mockWaterfallMetrics,
      strategicSummary: mockStrategicSummary
    });

    expect(result.grandTotalSpendInrCr).toBe(613.88);
    expect(result.grandTotalSavingsInrCr).toBe(85.64);
    expect(result.netModelledOpportunityInrCr).toBe(85.64);
    expect(result.grossOpportunityInrCr).toBe(110.76);
    expect(result.overlapDeductionsInrCr).toBe(25.12);
    expect(result.provenOpportunityInrCr).toBe(82.38);
    expect(result.discoveryOpportunityInrCr).toBe(3.261);
    expect(result.realizedSavingsInrCr).toBe(0.0);
    expect(result.overallSavingsPct).toBeCloseTo(14.0, 1);

    const vendorConsolidation = getInitiativeByKey(result.initiatives, 'VENDOR_CONSOLIDATION');
    expect(vendorConsolidation?.spendInrCr).toBe(315.021);
    expect(vendorConsolidation?.savingsInrCr).toBe(49.764);
    expect(vendorConsolidation?.savingsPct).toBe(15.8);

    const poConsolidation = getInitiativeByKey(result.initiatives, 'PO_CONSOLIDATION');
    expect(poConsolidation?.spendInrCr).toBe(315.021);
    expect(poConsolidation?.savingsInrCr).toBe(5.854);
    expect(poConsolidation?.savingsPct).toBe(1.9);

    const strategicSingleVendor = getInitiativeByKey(result.initiatives, 'STRATEGIC_SINGLE_VENDOR');
    expect(strategicSingleVendor?.spendInrCr).toBe(315.021);
    expect(strategicSingleVendor?.savingsInrCr).toBe(55.146);
    expect(strategicSingleVendor?.savingsPct).toBe(17.5);

    const supplyRationalization = getInitiativeByKey(result.initiatives, 'VENDOR_SUPPLY_RATIONALIZATION');
    expect(supplyRationalization?.spendInrCr).toBe(0);
    expect(supplyRationalization?.savingsInrCr).toBe(0);

    const categoryPipeline = getInitiativeByKey(result.initiatives, 'CATEGORY_SAVINGS_PIPELINE');
    expect(categoryPipeline?.spendInrCr).toBe(0);
    expect(categoryPipeline?.savingsInrCr).toBe(0);
  });

  it('handles edge case where strategicSummary has zero spend and categorySpecialistOpportunityInrCr has a value', () => {
    const result = buildStrategicSavingsSummary({
      waterfallMetrics: {
        total_spend_inr_cr: 0,
        addressable_spend_inr_cr: 0,
        identified_opportunities_count: 0,
        gross_potential_savings_inr_cr: 0,
        deduplicated_overlap_inr_cr: 0,
        net_potential_savings_inr_cr: 0,
        proven_opportunity_inr_cr: 0,
        discovery_opportunity_inr_cr: 0,
        validated_savings_inr_cr: 0,
        approved_savings_inr_cr: 0,
        realized_savings_inr_cr: 0
      },
      strategicSummary: {
        totalSpendAnalyzedInrCr: 0,
        totalAddressableSpendInrCr: 0,
        categorySpecialistOpportunityInrCr: 2.5
      }
    });

    expect(result.grandTotalSpendInrCr).toBe(0);
    expect(result.overallSavingsPct).toBe(0);

    const categoryPipeline = getInitiativeByKey(result.initiatives, 'CATEGORY_SAVINGS_PIPELINE');
    expect(categoryPipeline?.savingsInrCr).toBe(2.5);
    expect(categoryPipeline?.savingsPct).toBe(0);

    const vendorConsolidation = getInitiativeByKey(result.initiatives, 'VENDOR_CONSOLIDATION');
    expect(vendorConsolidation?.savingsPct).toBe(0);
  });

  it('uses evaluatedBaselineSpendCr when waterfallMetrics total_spend_inr_cr is undefined', () => {
    const result = buildStrategicSavingsSummary({
      evaluatedBaselineSpendCr: 450.75,
      consolidationItems: []
    });

    expect(result.grandTotalSpendInrCr).toBe(450.75);
    expect(result.netModelledOpportunityInrCr).toBe(0);
  });

  it('handles empty options without waterfallMetrics hitting fallback branch in extractWaterfallBreakdown', () => {
    const result = buildStrategicSavingsSummary({
      opportunities: []
    });

    expect(result.grandTotalSavingsInrCr).toBe(0);
    expect(result.netModelledOpportunityInrCr).toBe(0);
    expect(result.grossOpportunityInrCr).toBe(0);
    expect(result.overlapDeductionsInrCr).toBe(0);
    expect(result.provenOpportunityInrCr).toBe(0);
    expect(result.discoveryOpportunityInrCr).toBe(0);
    expect(result.addressableSpendInrCr).toBe(0);
  });

  it('hits the || 0 final fallback when all spend and savings fields on an opportunity are falsy', () => {
    // Opportunity has every spend/savings field explicitly 0 or undefined,
    // forcing the || 0 at the end of each chain (lines 71 and 82) to be evaluated.
    const allFalsyOpp: SavingsOpportunity[] = [
      {
        opp_id: 'OPP-ZERO-ALL',
        category: 'Test Category',
        title: 'Zero Spend Opp',
        current_spend_inr_cr: 0,
        current_spend: 0,
        baseline_spend_inr_cr: 0,
        est_savings_inr_cr: 0,
        est_savings: 0,
        estimated_savings_inr_cr: 0,
        target_savings_pct: 10,
        status: 'Identified',
        push_to_module: 'proCPX',
        recommended_action: 'Review',
        risk_level: 'Low',
        contract_leak_type: 'None'
      }
    ];
    const result = buildStrategicSavingsSummary({
      consolidationItems: [],
      poItems: [],
      strategicRiskItems: [],
      opportunities: allFalsyOpp
    });
    const categoryInit = getInitiativeByKey(result.initiatives, 'CATEGORY_SAVINGS_PIPELINE');
    // All fields are 0 → || 0 fallback fires → spend and savings are 0
    expect(categoryInit?.spendInrCr).toBe(0);
    expect(categoryInit?.savingsInrCr).toBe(0);
  });
});
