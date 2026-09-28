/**
 * Savings De-Duplication & Overlap Engine Unit Tests (Master Product Spec - Prompt 100)
 * Validates:
 * 1. Overlap detection when multiple opportunity engines flag the same spend/item
 * 2. Example from prompt:
 *    - Material has: PCBI Opportunity = ₹10L, E-Auction Opportunity = ₹7L, Vendor Consolidation = ₹5L
 *    - Do NOT add all three automatically. Detect overlap.
 *    - Ensure non-overlapping deduplicated savings
 * 3. Savings Waterfall metrics (Total Spend -> Addressable Spend -> Identified -> Potential -> Validated -> Approved -> Realized)
 * 4. Action Plan generation from opportunities
 */

import { describe, it, expect } from 'vitest';
import { SavingsDeduplicationEngine } from '../../src/services/savingsDeduplicationEngine';
import type { SavingsOpportunityItem } from '../../src/types/savings';

describe('Savings De-Duplication & Overlap Engine (Prompt 100)', () => {
  const engine = new SavingsDeduplicationEngine();

  it('MUST DETECT OVERLAP AND DEDUPLICATE: PCBI ₹10L, E-Auction ₹7L, Vendor Consolidation ₹5L on same material', () => {
    // 3 overlapping opportunities on the same material: Bearing 6205
    const opportunities: SavingsOpportunityItem[] = [
      {
        opportunity_id: 'OPP-PCBI-001',
        source_module: 'MODULE_3_PCBI',
        source_engine: 'PCBI_PRICE',
        category: 'Bearings & Assemblies',
        item: 'MAT-BRG-6205',
        vendor: 'SKF India',
        plant: 'Plant 1',
        spend_inr: 5000000,
        spend_inr_cr: 0.5,
        potential_savings_inr: 1000000, // ₹10 Lakhs
        potential_savings_inr_cr: 0.1,
        is_overlapping: false,
        net_savings_inr: 1000000,
        net_savings_inr_cr: 0.1,
        status: 'IDENTIFIED',
        owner: 'Procurement',
        timeline: '30 Days',
        created_at: new Date().toISOString()
      },
      {
        opportunity_id: 'OPP-EAUCTION-002',
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'E_AUCTION',
        category: 'Bearings & Assemblies',
        item: 'MAT-BRG-6205',
        vendor: 'SKF India',
        plant: 'Plant 1',
        spend_inr: 5000000,
        spend_inr_cr: 0.5,
        potential_savings_inr: 700000, // ₹7 Lakhs
        potential_savings_inr_cr: 0.07,
        is_overlapping: false,
        net_savings_inr: 700000,
        net_savings_inr_cr: 0.07,
        status: 'IDENTIFIED',
        owner: 'Procurement',
        timeline: '60 Days',
        created_at: new Date().toISOString()
      },
      {
        opportunity_id: 'OPP-VEND-003',
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'VENDOR_CONSOLIDATION',
        category: 'Bearings & Assemblies',
        item: 'MAT-BRG-6205',
        vendor: 'SKF India',
        plant: 'Plant 1',
        spend_inr: 5000000,
        spend_inr_cr: 0.5,
        potential_savings_inr: 500000, // ₹5 Lakhs
        potential_savings_inr_cr: 0.05,
        is_overlapping: false,
        net_savings_inr: 500000,
        net_savings_inr_cr: 0.05,
        status: 'IDENTIFIED',
        owner: 'Procurement',
        timeline: '90 Days',
        created_at: new Date().toISOString()
      }
    ];

    const result = engine.deduplicateOpportunities(opportunities, 100000000, 76000000);

    // 1. Verify overlap group detected
    expect(result.overlaps.length).toBe(1);
    const overlapGroup = result.overlaps[0];
    expect(overlapGroup.item).toBe('MAT-BRG-6205');
    expect(overlapGroup.primary_opportunity_id).toBe('OPP-PCBI-001');
    expect(overlapGroup.total_gross_savings_inr).toBe(2200000); // 10L + 7L + 5L = 22L
    expect(overlapGroup.total_net_savings_inr).toBe(1000000);   // Primary only: 10L
    expect(overlapGroup.total_deduplicated_inr).toBe(1200000);  // Deduplicated overlap: 7L + 5L = 12L

    // 2. Verify individual opportunity overlap flags
    const primary = result.opportunities.find((o) => o.opportunity_id === 'OPP-PCBI-001')!;
    expect(primary.is_overlapping).toBe(false);
    expect(primary.net_savings_inr).toBe(1000000);
    expect(primary.overlap_id).toBeDefined();

    const eauction = result.opportunities.find((o) => o.opportunity_id === 'OPP-EAUCTION-002')!;
    expect(eauction.is_overlapping).toBe(true);
    expect(eauction.net_savings_inr).toBe(0); // Deduplicated from total net
    expect(eauction.overlap_id).toBe(primary.overlap_id);

    const vendorConsol = result.opportunities.find((o) => o.opportunity_id === 'OPP-VEND-003')!;
    expect(vendorConsol.is_overlapping).toBe(true);
    expect(vendorConsol.net_savings_inr).toBe(0); // Deduplicated from total net
    expect(vendorConsol.overlap_id).toBe(primary.overlap_id);

    // 3. Verify Waterfall Metrics
    const metrics = result.waterfallMetrics;
    expect(metrics.total_spend_inr_cr).toBe(10.0); // 100,000,000 / 10,000,000
    expect(metrics.gross_potential_savings_inr_cr).toBe(0.22); // 22 Lakhs = 0.22 Cr
    expect(metrics.deduplicated_overlap_inr_cr).toBe(0.12);    // 12 Lakhs = 0.12 Cr
    expect(metrics.net_potential_savings_inr_cr).toBe(0.1);    // 10 Lakhs = 0.10 Cr
  });

  it('correctly tracks Validated, Approved, and Realized savings in the Savings Waterfall', () => {
    const opps: SavingsOpportunityItem[] = [
      {
        opportunity_id: 'OPP-VAL-1',
        source_module: 'MODULE_3_PCBI',
        source_engine: 'PCBI_PRICE',
        category: 'Direct Materials',
        item: 'MAT-STEEL-PLATE',
        vendor: 'Tata Steel',
        plant: 'Plant 1',
        spend_inr: 20000000,
        spend_inr_cr: 2.0,
        potential_savings_inr: 1500000,
        potential_savings_inr_cr: 0.15,
        is_overlapping: false,
        net_savings_inr: 1500000,
        net_savings_inr_cr: 0.15,
        status: 'VALIDATED', // Validated
        owner: 'Procurement',
        timeline: '30 Days',
        created_at: new Date().toISOString()
      },
      {
        opportunity_id: 'OPP-APP-2',
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'RATE_CONTRACT',
        category: 'Packaging',
        item: 'MAT-BOXES-CORR',
        vendor: 'Amcor Pack',
        plant: 'Plant 2',
        spend_inr: 10000000,
        spend_inr_cr: 1.0,
        potential_savings_inr: 800000,
        potential_savings_inr_cr: 0.08,
        is_overlapping: false,
        net_savings_inr: 800000,
        net_savings_inr_cr: 0.08,
        status: 'APPROVED', // Approved
        owner: 'SCM',
        timeline: '60 Days',
        created_at: new Date().toISOString()
      },
      {
        opportunity_id: 'OPP-REAL-3',
        source_module: 'MODULE_2_STRATEGIC',
        source_engine: 'PO_CONSOLIDATION',
        category: 'MRO',
        item: 'MAT-SAFETY-GEAR',
        vendor: 'Safety First',
        plant: 'Plant 1',
        spend_inr: 5000000,
        spend_inr_cr: 0.5,
        potential_savings_inr: 300000,
        potential_savings_inr_cr: 0.03,
        is_overlapping: false,
        net_savings_inr: 300000,
        net_savings_inr_cr: 0.03,
        status: 'REALIZED', // Realized
        owner: 'Plant',
        timeline: 'Completed',
        created_at: new Date().toISOString()
      }
    ];

    const res = engine.deduplicateOpportunities(opps, 50000000, 35000000);
    const metrics = res.waterfallMetrics;

    // Total net potential = 15L + 8L + 3L = 26L = 0.26 Cr
    expect(metrics.net_potential_savings_inr_cr).toBe(0.26);

    // Validated includes VALIDATED, APPROVED, REALIZED: 15L + 8L + 3L = 0.26 Cr
    expect(metrics.validated_savings_inr_cr).toBe(0.26);

    // Approved includes APPROVED, REALIZED: 8L + 3L = 0.11 Cr
    expect(metrics.approved_savings_inr_cr).toBe(0.11);

    // Realized includes REALIZED: 3L = 0.03 Cr
    expect(metrics.realized_savings_inr_cr).toBe(0.03);
  });

  it('converts an opportunity into a structured Action Plan item', () => {
    const opp: SavingsOpportunityItem = {
      opportunity_id: 'OPP-LUB-01',
      source_module: 'MODULE_3_PCBI',
      source_engine: 'PCBI_PRICE',
      category: 'Industrial Consumables',
      item: 'Industrial Lubricant Oil',
      vendor: 'ABC Vendor',
      plant: 'Main Plant',
      spend_inr: 1800000,
      spend_inr_cr: 0.18,
      potential_savings_inr: 160020,
      potential_savings_inr_cr: 0.016,
      is_overlapping: false,
      net_savings_inr: 160020,
      net_savings_inr_cr: 0.016,
      status: 'IDENTIFIED',
      owner: 'Procurement',
      timeline: '30 Days',
      created_at: new Date().toISOString()
    };

    const action = engine.convertToActionPlan(opp, {
      action: 'Renegotiate rate with ABC Vendor based on benchmark gap',
      owner: 'Procurement',
      priority: 'HIGH'
    });

    expect(action.id).toBe('act-OPP-LUB-01');
    expect(action.action).toContain('Renegotiate rate');
    expect(action.expected_value_inr).toBe(160020);
    expect(action.owner).toBe('Procurement');
    expect(action.status).toBe('Open');
    expect(action.priority).toBe('HIGH');
  });
});
