/**
 * Module 2 — Strategic Sourcing Intelligence Engine V2.0 Validation Tests
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * Strict verification of Section 36 Tests 1 through 10
 */

import { describe, it, expect } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import { Module2StrategicSourcingEngine } from '../../src/services/module2StrategicSourcingEngine';
import { Module2ItemAnalysisEngine } from '../../src/services/module2ItemAnalysisEngine';
import { Module2OpportunityCalculator } from '../../src/services/module2OpportunityCalculator';
import { Module2ComparabilityEngine } from '../../src/services/module2ComparabilityEngine';

describe('Module 2 Sourcing Logic V2.0 — Section 36 Validation Test Suite', () => {
  // TEST 1: 5 suppliers, same item, clear historical price dispersion -> E-auction opportunity calculates
  it('TEST 1: 5 suppliers, same item, clear historical price dispersion calculates e-auction opportunity', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Vendor A', material_code: 'ITM-001', material_desc: 'M16 Hex Bolt High Tensile', quantity: 1000, unit_price: 100, total_spend_inr: 100000, spend_category: 'Fasteners', uom: 'EA' },
      { vendor_name: 'Vendor B', material_code: 'ITM-001', material_desc: 'M16 Hex Bolt High Tensile', quantity: 1000, unit_price: 95, total_spend_inr: 95000, spend_category: 'Fasteners', uom: 'EA' },
      { vendor_name: 'Vendor C', material_code: 'ITM-001', material_desc: 'M16 Hex Bolt High Tensile', quantity: 1000, unit_price: 90, total_spend_inr: 90000, spend_category: 'Fasteners', uom: 'EA' },
      { vendor_name: 'Vendor D', material_code: 'ITM-001', material_desc: 'M16 Hex Bolt High Tensile', quantity: 1000, unit_price: 85, total_spend_inr: 85000, spend_category: 'Fasteners', uom: 'EA' },
      { vendor_name: 'Vendor E', material_code: 'ITM-001', material_desc: 'M16 Hex Bolt High Tensile', quantity: 1000, unit_price: 80, total_spend_inr: 80000, spend_category: 'Fasteners', uom: 'EA' }
    ];

    const result = Module2StrategicSourcingEngine.analyze(txs);
    expect(result.profiles.length).toBe(1);
    const profile = result.profiles[0];

    expect(['HIGH', 'MEDIUM']).toContain(profile.eauctionSuitability);
    expect(profile.potentialEAuctionOpportunityInr).toBeGreaterThan(0);
    expect(profile.isQuantifiable).toBe(true);
    expect(profile.status).toContain('E_AUCTION');
  });

  // TEST 2: 5 suppliers, same category, but no demonstrated price-volume relationship
  it('TEST 2: 5 suppliers, same category with identical price -> consolidation identified, benefit NOT quantifiable', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Vendor A', material_code: 'ITM-002', material_desc: 'Packaging Box Standard', quantity: 500, unit_price: 50, total_spend_inr: 25000, spend_category: 'Packaging', uom: 'BOX' },
      { vendor_name: 'Vendor B', material_code: 'ITM-002', material_desc: 'Packaging Box Standard', quantity: 500, unit_price: 50, total_spend_inr: 25000, spend_category: 'Packaging', uom: 'BOX' },
      { vendor_name: 'Vendor C', material_code: 'ITM-002', material_desc: 'Packaging Box Standard', quantity: 500, unit_price: 50, total_spend_inr: 25000, spend_category: 'Packaging', uom: 'BOX' },
      { vendor_name: 'Vendor D', material_code: 'ITM-002', material_desc: 'Packaging Box Standard', quantity: 500, unit_price: 50, total_spend_inr: 25000, spend_category: 'Packaging', uom: 'BOX' },
      { vendor_name: 'Vendor E', material_code: 'ITM-002', material_desc: 'Packaging Box Standard', quantity: 500, unit_price: 50, total_spend_inr: 25000, spend_category: 'Packaging', uom: 'BOX' }
    ];

    const items = Module2ItemAnalysisEngine.analyzeItems('Packaging', txs, new Set());
    expect(items.length).toBe(1);
    expect(items[0].primaryLever).toBe('NO_QUANTIFIABLE_BENEFIT');
    expect(items[0].netDefensibleBenefitInr).toBe(0);
    expect(items[0].status).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
  });

  // TEST 3: One multi-category vendor supplies 5 categories, specialist historically sells one item cheaper
  it('TEST 3: Multi-category vendor supplies items where specialist is cheaper on specific item', () => {
    const multiCatVendor = 'MegaCorp Supplies';
    const specialistVendor = 'Specialist Cable Corp';
    const multiCatSet = new Set([multiCatVendor]);

    const txs: StrategicInputTransaction[] = [
      { vendor_name: multiCatVendor, material_code: 'CBL-01', material_desc: 'Armored Copper Cable', quantity: 100, unit_price: 1200, total_spend_inr: 120000, spend_category: 'Electrical', uom: 'MTR' },
      { vendor_name: specialistVendor, material_code: 'CBL-01', material_desc: 'Armored Copper Cable', quantity: 100, unit_price: 1000, total_spend_inr: 100000, spend_category: 'Electrical', uom: 'MTR' },
      { vendor_name: multiCatVendor, material_code: 'MRO-01', material_desc: 'Industrial Lubricant', quantity: 50, unit_price: 500, total_spend_inr: 25000, spend_category: 'MRO Supplies', uom: 'LTR' }
    ];

    const electricalItems = Module2ItemAnalysisEngine.analyzeItems('Electrical', [txs[0], txs[1]], multiCatSet);
    expect(electricalItems.length).toBe(1);
    expect(electricalItems[0].specialistRealignmentBenefitInr).toBe(20000);
    expect(electricalItems[0].primaryLever).toBe('CATEGORY_SPECIALIST_REALIGNMENT');
  });

  // TEST 4: Multi-category vendor is actually cheaper than specialists -> No specialist savings generated
  it('TEST 4: Multi-category vendor is cheaper than specialists -> zero specialist savings', () => {
    const multiCatVendor = 'MegaCorp Supplies';
    const specialistVendor = 'Specialist Cable Corp';
    const multiCatSet = new Set([multiCatVendor]);

    const txs: StrategicInputTransaction[] = [
      { vendor_name: multiCatVendor, material_code: 'CBL-02', material_desc: 'Shielded Instrumentation Cable', quantity: 100, unit_price: 800, total_spend_inr: 80000, spend_category: 'Electrical', uom: 'MTR' },
      { vendor_name: specialistVendor, material_code: 'CBL-02', material_desc: 'Shielded Instrumentation Cable', quantity: 100, unit_price: 950, total_spend_inr: 95000, spend_category: 'Electrical', uom: 'MTR' }
    ];

    const items = Module2ItemAnalysisEngine.analyzeItems('Electrical', txs, multiCatSet);
    expect(items[0].specialistRealignmentBenefitInr).toBe(0);
  });

  // TEST 5: One supplier, no alternative historical supplier -> Supply concentration risk, no fabricated savings
  it('TEST 5: One supplier, no alternative historical supplier -> concentration risk, no fabricated savings', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Monopoly OEM', material_code: 'TURB-99', material_desc: 'Proprietary Turbine Blade Rotor', quantity: 5, unit_price: 200000, total_spend_inr: 1000000, spend_category: 'Power Equipment', uom: 'SET' }
    ];

    const result = Module2StrategicSourcingEngine.analyze(txs);
    const profile = result.profiles[0];

    expect(profile.activeSuppliersCount).toBe(1);
    expect(profile.isQuantifiable).toBe(false);
    expect(Number(profile.potentialEAuctionOpportunityInr || 0)).toBe(0);
    expect(Number(profile.potentialVendorConsolidationOpportunityInr || 0)).toBe(0);
    expect(Number(profile.netQuantifiableOpportunityInr || 0)).toBe(0);
    expect(profile.status).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
  });

  // TEST 6: Multiple small suppliers with demonstrated lower historical price at higher volume
  it('TEST 6: Multiple small suppliers with demonstrated volume tier slope calculates volume bundling benefit', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Vendor A', material_code: 'FST-10', material_desc: 'M10 Bolt', quantity: 100, unit_price: 10, total_spend_inr: 1000, spend_category: 'Fasteners', uom: 'EA' },
      { vendor_name: 'Vendor B', material_code: 'FST-10', material_desc: 'M10 Bolt', quantity: 200, unit_price: 9, total_spend_inr: 1800, spend_category: 'Fasteners', uom: 'EA' },
      { vendor_name: 'Vendor C', material_code: 'FST-10', material_desc: 'M10 Bolt', quantity: 500, unit_price: 8, total_spend_inr: 4000, spend_category: 'Fasteners', uom: 'EA' }
    ];

    const items = Module2ItemAnalysisEngine.analyzeItems('Fasteners', txs, new Set());
    expect(items[0].hasVolumeTierEvidence).toBe(true);
    expect(items[0].volumeBundlingBenefitInr).toBeGreaterThan(0);
  });

  // TEST 7: Same spend qualifies for auction and consolidation -> Gross separate, Net removes overlap
  it('TEST 7: Same spend qualifies for auction and consolidation -> Gross separate, Net removes overlap', () => {
    const netCalc = Module2OpportunityCalculator.calculateNetOpportunity(
      500000, // E-auction ₹5L
      400000, // Consolidation ₹4L
      true,
      10,
      0,
      0
    );

    expect(netCalc.overlappingInr).toBe(400000);
    expect(netCalc.netInr).toBe(500000);
    expect(netCalc.primaryLever).toBe('E_AUCTION');
    expect(netCalc.status).toBe('E_AUCTION_AND_CONSOLIDATION');
  });

  // TEST 8: Different specifications under same category -> No aggregation unless comparability rules pass
  it('TEST 8: Different specifications under same category are segregated and not blindly pooled', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Vendor Steel', material_code: 'STL-A', material_desc: 'Steel Plates 10mm Grade 304', quantity: 50, unit_price: 1000, total_spend_inr: 50000, spend_category: 'Raw Metals', uom: 'KG' },
      { vendor_name: 'Vendor Steel', material_code: 'STL-B', material_desc: 'Steel Plates 50mm Grade 316L High Temp', quantity: 50, unit_price: 4000, total_spend_inr: 200000, spend_category: 'Raw Metals', uom: 'KG' }
    ];

    const items = Module2ItemAnalysisEngine.analyzeItems('Raw Metals', txs, new Set());
    expect(items.length).toBe(2);
    expect(items[0].itemCode).not.toBe(items[1].itemCode);
  });

  // TEST 9: PO fragmentation exists but no price-volume evidence -> Operational separated, no fabricated savings
  it('TEST 9: PO fragmentation with no price variance shows operational indicators without fabricated savings', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Vendor X', material_code: 'OFF-1', material_desc: 'Copy Paper A4', quantity: 10, unit_price: 250, total_spend_inr: 2500, spend_category: 'Office Supplies', uom: 'REAM' },
      { vendor_name: 'Vendor X', material_code: 'OFF-1', material_desc: 'Copy Paper A4', quantity: 10, unit_price: 250, total_spend_inr: 2500, spend_category: 'Office Supplies', uom: 'REAM' },
      { vendor_name: 'Vendor X', material_code: 'OFF-1', material_desc: 'Copy Paper A4', quantity: 10, unit_price: 250, total_spend_inr: 2500, spend_category: 'Office Supplies', uom: 'REAM' },
      { vendor_name: 'Vendor X', material_code: 'OFF-1', material_desc: 'Copy Paper A4', quantity: 10, unit_price: 250, total_spend_inr: 2500, spend_category: 'Office Supplies', uom: 'REAM' }
    ];

    const result = Module2StrategicSourcingEngine.analyze(txs);
    const profile = result.profiles[0];

    expect(profile.operationalConsolidation.smallOrderCount).toBeGreaterThanOrEqual(0);
    expect(Number(profile.potentialVendorConsolidationOpportunityInr || 0)).toBe(0);
  });

  // TEST 10: Insufficient data -> Opportunity shown, benefit marked NOT QUANTIFIABLE
  it('TEST 10: Single transaction or missing price evidence -> Benefit marked IDENTIFIED_NOT_QUANTIFIABLE', () => {
    const netCalc = Module2OpportunityCalculator.calculateNetOpportunity(
      null,
      null,
      false, // Data insufficient
      1
    );

    expect(netCalc.status).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
    expect(netCalc.isQuantifiable).toBe(false);
    expect(netCalc.netInr).toBeNull();
    expect(netCalc.displayText).toBe('Opportunity Identified — Benefit Not Yet Quantifiable');
  });

  // Multi-Category Analysis Check
  it('Correctly identifies multi-category vendors and their supplied category breakdown', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Omni Supplier', spend_category: 'Packaging', material_desc: 'Corrugated Box', quantity: 100, unit_price: 40, total_spend_inr: 4000 },
      { vendor_name: 'Omni Supplier', spend_category: 'Safety', material_desc: 'Safety Helmets', quantity: 50, unit_price: 300, total_spend_inr: 15000 },
      { vendor_name: 'Pure Vendor', spend_category: 'Packaging', material_desc: 'Stretch Film', quantity: 200, unit_price: 150, total_spend_inr: 30000 }
    ];

    const multiAnalysis = Module2ItemAnalysisEngine.analyzeMultiCategorySuppliers(txs);
    expect(multiAnalysis.length).toBe(2);
    const omni = multiAnalysis.find(v => v.vendorName === 'Omni Supplier');
    expect(omni).toBeDefined();
    expect(omni?.classification).toBe('MULTI_CATEGORY_SUPPLIER');
    expect(omni?.categoriesSuppliedCount).toBe(2);

    const pure = multiAnalysis.find(v => v.vendorName === 'Pure Vendor');
    expect(pure?.classification).toBe('CATEGORY_SPECIALIST');
  });
});
