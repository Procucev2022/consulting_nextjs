/**
 * Strategic Sourcing Engine Unit Tests (Module 2B - Master Product Spec Prompt 100)
 * Validates all 8 Strategic Sourcing engines:
 * 1. Vendor Consolidation
 * 2. PO Consolidation
 * 3. E-Auction / Competitive Sourcing
 * 4. Rate Contract
 * 5. Specification Rationalization
 * 6. Demand Consolidation
 * 7. New Vendor Development
 * 8. Alternate Material / Make-Buy (marked as OPPORTUNITY REQUIRING VALIDATION)
 */

import { describe, it, expect } from 'vitest';
import { StrategicSourcingEngine } from '../../src/services/strategicSourcingEngine';
import { STRATEGIC_SOURCING_CONSTANTS } from '../../src/constants/strategicSourcing';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('StrategicSourcingEngine (Prompt 100 - Module 2B)', () => {
  const engine = new StrategicSourcingEngine();

  it('handles empty or undefined transaction inputs cleanly', () => {
    const emptyResult = engine.analyzeAll([]);
    expect(emptyResult.opportunities.length).toBe(0);
    expect(emptyResult.summary.total_strategic_opportunities_count).toBe(0);
    expect(emptyResult.summary.spend_analyzed_inr).toBe(0);

    const undefinedResult = engine.analyzeAll(undefined as any);
    expect(undefinedResult.opportunities.length).toBe(0);
  });

  it('1. VENDOR CONSOLIDATION: Identifies fragmented vendors and calculates consolidation savings', () => {
    // 3 vendors supplying same material: Steel Plate
    // Vendor A: ₹60L (Primary)
    // Vendor B: ₹25L (Tail)
    // Vendor C: ₹15L (Tail)
    // Tail spend = ₹40L -> 5% savings = ₹2,00,000
    const txs: StrategicInputTransaction[] = [
      {
        material_code: 'MAT-STL-PLT',
        material_desc: 'Structural Steel Plate 12mm',
        vendor_name: 'Tata Steel Ltd',
        plant: 'Jamshedpur',
        spend_category: 'DIRECT MATERIALS',
        quantity: 100,
        unit_price: 60000,
        total_spend_inr: 6000000
      },
      {
        material_code: 'MAT-STL-PLT',
        material_desc: 'Structural Steel Plate 12mm',
        vendor_name: 'JSW Steel Ltd',
        plant: 'Jamshedpur',
        spend_category: 'DIRECT MATERIALS',
        quantity: 40,
        unit_price: 62500,
        total_spend_inr: 2500000
      },
      {
        material_code: 'MAT-STL-PLT',
        material_desc: 'Structural Steel Plate 12mm',
        vendor_name: 'Local Steel Traders',
        plant: 'Jamshedpur',
        spend_category: 'DIRECT MATERIALS',
        quantity: 25,
        unit_price: 60000,
        total_spend_inr: 1500000
      }
    ];

    const res = engine.analyzeVendorConsolidation(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('VENDOR_CONSOLIDATION');
    expect(opp.vendor).toBe('Tata Steel Ltd');
    expect(opp.potential_savings_inr).toBe(200000); // 5% of 40L = 200,000

    const detail = res.details[0];
    expect(detail.current_vendor_count).toBe(3);
    expect(detail.target_vendor_count).toBe(1);
    expect(detail.affected_spend_inr).toBe(4000000);
    expect(detail.fragmented_vendors).toContain('JSW Steel Ltd');
    expect(detail.fragmented_vendors).toContain('Local Steel Traders');
  });

  it('2. PO CONSOLIDATION: Identifies repeated small orders and calculates administrative + volume savings', () => {
    // 5 small POs for Safety Helmets from SafetyFirst Corp
    // Total spend: ₹5,00,000 (avg ₹1,00,000 per PO)
    // Excess POs: 4 -> Admin savings: 4 * 2500 = ₹10,000
    // Volume rebate: 2% of 5L = ₹10,000
    // Total potential savings: ₹20,000
    const txs: StrategicInputTransaction[] = [1, 2, 3, 4, 5].map((idx) => ({
      po_number: `PO-00${idx}`,
      material_code: 'MRO-HLMT-01',
      material_desc: 'Industrial Safety Helmet',
      vendor_name: 'SafetyFirst Corp',
      plant: 'Plant 1',
      spend_category: 'MRO',
      quantity: 100,
      unit_price: 1000,
      total_spend_inr: 100000
    }));

    const res = engine.analyzePoConsolidation(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('PO_CONSOLIDATION');
    expect(opp.vendor).toBe('SafetyFirst Corp');
    expect(opp.potential_savings_inr).toBe(200000 * 0.1); // 10k admin + 10k volume = 20,000

    const detail = res.details[0];
    expect(detail.po_count).toBe(5);
    expect(detail.average_po_value_inr).toBe(100000);
    expect(detail.small_orders_count).toBe(4);
  });

  it('3. E-AUCTION: Identifies commodity categories with high spend and multiple vendors for reverse auction', () => {
    // Spend: ₹60 Lakhs, 2 vendors -> Qualified for E-Auction (threshold ₹50L)
    // Savings: 7% of 60L = ₹4,20,000
    const txs: StrategicInputTransaction[] = [
      {
        material_code: 'PKG-CORR-BOX',
        material_desc: 'Corrugated Shipping Boxes 5-Ply',
        vendor_name: 'Packwell Industries',
        plant: 'Main Plant',
        spend_category: 'PACKING MATERIALS',
        quantity: 20000,
        unit_price: 150,
        total_spend_inr: 3000000
      },
      {
        material_code: 'PKG-CORR-BOX',
        material_desc: 'Corrugated Shipping Boxes 5-Ply',
        vendor_name: 'Boxmakers Corp',
        plant: 'Main Plant',
        spend_category: 'PACKING MATERIALS',
        quantity: 20000,
        unit_price: 150,
        total_spend_inr: 3000000
      }
    ];

    const res = engine.analyzeEAuction(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('E_AUCTION');
    expect(opp.potential_savings_inr).toBe(420000); // 7% of 60L

    const detail = res.details[0];
    expect(detail.vendor_count).toBe(2);
    expect(detail.suitability_score).toBe(80);
    expect(detail.market_availability).toBe('HIGH');
  });

  it('4. RATE CONTRACT: Identifies recurring materials with predictable frequency and recommends annual rate contracts', () => {
    // 5 recurring orders with dates across months -> Qualifies for Annual Rate Contract
    // Total spend: ₹40 Lakhs -> 4% savings = ₹1,60,000
    const txs: StrategicInputTransaction[] = [
      '2023-01-15',
      '2023-03-20',
      '2023-06-10',
      '2023-09-05',
      '2023-11-12'
    ].map((date) => ({
      po_date: date,
      material_code: 'CHEM-HYD-01',
      material_desc: 'Hydraulic Oil Grade 46',
      vendor_name: 'Castrol India',
      plant: 'Plant 1',
      spend_category: 'MRO',
      quantity: 1000,
      unit_price: 800,
      total_spend_inr: 800000
    }));

    const res = engine.analyzeRateContracts(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('RATE_CONTRACT');
    expect(opp.potential_savings_inr).toBe(160000); // 4% of 40L

    const detail = res.details[0];
    expect(detail.recurring_po_count).toBe(5);
    expect(detail.recommended_contract_type).toBe('Annual Rate Contract');
  });

  it('5. SPECIFICATION RATIONALIZATION: Identifies variant clusters and recommends standardized catalog SKU', () => {
    // 3 bearing variants with same prefix 'BEARING' and spend > ₹10L
    // Spend: ₹15L -> 5% savings = ₹75,000
    const txs: StrategicInputTransaction[] = [
      {
        material_desc: 'BEARING 6205 STANDARD',
        spend_category: 'DIRECT MATERIALS',
        quantity: 500,
        unit_price: 1000,
        total_spend_inr: 500000,
        vendor_name: 'SKF'
      },
      {
        material_desc: 'BEARING 6205-2RS RUBBER SEAL',
        spend_category: 'DIRECT MATERIALS',
        quantity: 500,
        unit_price: 1000,
        total_spend_inr: 500000,
        vendor_name: 'FAG'
      },
      {
        material_desc: 'BEARING 6205-ZZ METAL SHIELD',
        spend_category: 'DIRECT MATERIALS',
        quantity: 500,
        unit_price: 1000,
        total_spend_inr: 500000,
        vendor_name: 'Timken'
      }
    ];

    const res = engine.analyzeSpecRationalization(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('SPECIFICATION_RATIONALIZATION');
    expect(opp.potential_savings_inr).toBe(75000); // 5% of 15L

    const detail = res.details[0];
    expect(detail.spec_cluster).toBe('BEARING');
    expect(detail.variant_count).toBe(3);
  });

  it('6. DEMAND CONSOLIDATION: Identifies purchases of same material across multiple plants for volume pooling', () => {
    // 2 plants buying same PE Resin
    // Plant A: ₹30L, Plant B: ₹20L -> Total ₹50L
    // Savings: 4% of 50L = ₹2,00,000
    const txs: StrategicInputTransaction[] = [
      {
        material_code: 'POLY-PE-01',
        material_desc: 'HDPE Injection Molding Resin',
        plant: 'Plant Pune',
        business_unit: 'Automotive',
        spend_category: 'DIRECT MATERIALS',
        quantity: 25000,
        unit_price: 120,
        total_spend_inr: 3000000,
        vendor_name: 'Reliance Industries'
      },
      {
        material_code: 'POLY-PE-01',
        material_desc: 'HDPE Injection Molding Resin',
        plant: 'Plant Chennai',
        business_unit: 'Appliances',
        spend_category: 'DIRECT MATERIALS',
        quantity: 16666,
        unit_price: 120,
        total_spend_inr: 2000000,
        vendor_name: 'Reliance Industries'
      }
    ];

    const res = engine.analyzeDemandConsolidation(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('DEMAND_CONSOLIDATION');
    expect(opp.potential_savings_inr).toBe(200000); // 4% of 50L
    expect(opp.plant).toContain('Plant Pune');
    expect(opp.plant).toContain('Plant Chennai');

    const detail = res.details[0];
    expect(detail.plants_involved.length).toBe(2);
    expect(detail.total_spend_inr).toBe(5000000);
  });

  it('7. NEW VENDOR DEVELOPMENT: Identifies single-source dependency >= 80% and recommends secondary supplier', () => {
    // Vendor monopoly: Custom Casting supplied 90% by Monopoly Foundry (₹45L out of ₹50L)
    // Savings: 6% of 50L = ₹3,00,000
    const txs: StrategicInputTransaction[] = [
      {
        material_code: 'CAST-CUST-99',
        material_desc: 'Custom Machine Casting Grade 4',
        vendor_name: 'Monopoly Foundry Ltd',
        plant: 'Main Plant',
        spend_category: 'DIRECT MATERIALS',
        quantity: 900,
        unit_price: 5000,
        total_spend_inr: 4500000
      },
      {
        material_code: 'CAST-CUST-99',
        material_desc: 'Custom Machine Casting Grade 4',
        vendor_name: 'Secondary Trial Shop',
        plant: 'Main Plant',
        spend_category: 'DIRECT MATERIALS',
        quantity: 100,
        unit_price: 5000,
        total_spend_inr: 500000
      }
    ];

    const res = engine.analyzeNewVendorDevelopment(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('NEW_VENDOR_DEVELOPMENT');
    expect(opp.vendor).toBe('Monopoly Foundry Ltd');
    expect(opp.potential_savings_inr).toBe(300000); // 6% of 50L

    const detail = res.details[0];
    expect(detail.dominant_vendor).toBe('Monopoly Foundry Ltd');
    expect(detail.dominant_share_pct).toBe(90);
    expect(detail.risk_level).toBe('HIGH_CONCENTRATION');
  });

  it('8. ALTERNATE MATERIAL / MAKE-BUY: CRITICAL SPEC REQUIREMENT: Marks strictly as OPPORTUNITY REQUIRING VALIDATION without automatic booking', () => {
    // High-spend packing material: ₹30 Lakhs
    // Potential value engineering savings: 8% of 30L = ₹2,40,000
    const txs: StrategicInputTransaction[] = [
      {
        material_code: 'PKG-EXP-TAPE',
        material_desc: 'Specialty Reinforced Filatex Packaging Tape',
        vendor_name: '3M India',
        plant: 'Plant 1',
        spend_category: 'PACKING MATERIALS',
        quantity: 10000,
        unit_price: 300,
        total_spend_inr: 3000000
      }
    ];

    const res = engine.analyzeAlternateMaterials(txs);
    expect(res.opportunities.length).toBe(1);
    expect(res.details.length).toBe(1);

    const opp = res.opportunities[0];
    expect(opp.source_engine).toBe('ALTERNATE_MATERIAL');
    expect(opp.potential_savings_inr).toBe(240000); // 8% of 30L

    // CRITICAL PROMPT 100 SPEC REQUIREMENT:
    // "Identify potential opportunities where data supports it. Do not automatically claim savings. Mark as: OPPORTUNITY REQUIRING VALIDATION"
    expect(opp.status).toBe('UNDER_VALIDATION');
    expect(opp.validation_notes).toContain('OPPORTUNITY REQUIRING VALIDATION');

    const detail = res.details[0];
    expect(detail.validation_status).toBe('OPPORTUNITY REQUIRING VALIDATION');
    expect(detail.technical_feasibility).toBe('PENDING_TECHNICAL_REVIEW');
  });

  it('runs master analyzeAll() pipeline across multi-engine enterprise dataset cleanly', () => {
    // Comprehensive test dataset exercising multiple engines concurrently
    const mixedTxs: StrategicInputTransaction[] = [
      // 1. Vendor Consolidation + Demand Consolidation (Steel plates across 2 plants and 2 vendors)
      {
        material_code: 'MAT-STL-01',
        material_desc: 'Steel Plates 10mm',
        vendor_name: 'Vendor A',
        plant: 'Plant 1',
        spend_category: 'DIRECT MATERIALS',
        quantity: 50,
        unit_price: 60000,
        total_spend_inr: 3000000,
        po_date: '2023-01-10'
      },
      {
        material_code: 'MAT-STL-01',
        material_desc: 'Steel Plates 10mm',
        vendor_name: 'Vendor B',
        plant: 'Plant 2',
        spend_category: 'DIRECT MATERIALS',
        quantity: 40,
        unit_price: 60000,
        total_spend_inr: 2400000,
        po_date: '2023-02-15'
      },
      // 2. PO Consolidation (5 POs for Gloves from Safety First)
      ...[1, 2, 3, 4, 5].map((i) => ({
        material_code: 'MRO-GLV-01',
        material_desc: 'Nitrile Safety Gloves',
        vendor_name: 'Safety First Ltd',
        plant: 'Plant 1',
        spend_category: 'MRO',
        quantity: 200,
        unit_price: 250,
        total_spend_inr: 50000,
        po_date: `2023-0${i}-10`
      }))
    ];

    const result = engine.analyzeAll(mixedTxs);
    expect(result.summary.total_strategic_opportunities_count).toBeGreaterThan(0);
    expect(result.summary.spend_analyzed_inr).toBe(5650000);
    expect(result.summary.spend_analyzed_inr_cr).toBe(0.565);
    expect(result.summary.total_potential_savings_inr).toBeGreaterThan(0);
  });

  it('covers fallback branches for missing material codes, missing vendor names, and SERVICES exclusion', () => {
    // 1. Transaction without material code, without vendor name, without category
    const sparseTxs: StrategicInputTransaction[] = [
      {
        material_desc: '',
        vendor_name: '',
        quantity: 10,
        unit_price: 100,
        total_spend_inr: 1000
      },
      // 2. Services category should be excluded from E-Auction
      {
        material_code: 'SRV-CONSULT',
        material_desc: 'Management Consulting Service',
        vendor_name: 'Consulting Partner A',
        spend_category: 'SERVICES',
        quantity: 1,
        unit_price: 6000000,
        total_spend_inr: 6000000
      },
      {
        material_code: 'SRV-CONSULT',
        material_desc: 'Management Consulting Service',
        vendor_name: 'Consulting Partner B',
        spend_category: 'SERVICES',
        quantity: 1,
        unit_price: 6000000,
        total_spend_inr: 6000000
      },
      // 3. Short description word (<3 chars) for spec rationalization
      {
        material_desc: 'AB 123',
        quantity: 1,
        unit_price: 1000,
        total_spend_inr: 1000,
        vendor_name: 'Vendor X'
      }
    ];

    const eauctRes = engine.analyzeEAuction(sparseTxs);
    // Services should NOT produce E-Auction opportunities
    expect(eauctRes.opportunities.length).toBe(0);

    const specRes = engine.analyzeSpecRationalization(sparseTxs);
    expect(specRes.opportunities.length).toBe(0);

    const demandRes = engine.analyzeDemandConsolidation(sparseTxs);
    expect(demandRes.opportunities.length).toBe(0);

    const newVendRes = engine.analyzeNewVendorDevelopment(sparseTxs);
    expect(newVendRes.opportunities.length).toBe(0);

    const altRes = engine.analyzeAlternateMaterials(sparseTxs);
    expect(altRes.opportunities.length).toBe(0);
  });
});
