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
        current_spend: 1000000, // fallback calculation when current_spend_inr_cr is undefined
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
    expect(init?.spendInrCr).toBeGreaterThan(50.0);
    expect(init?.savingsInrCr).toBeGreaterThan(10.0);
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
});
