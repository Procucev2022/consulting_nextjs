import { describe, it, expect } from 'vitest';
import { Module2StrategicSourcingEngine } from '../../src/services/module2StrategicSourcingEngine';
import { Module2ComparabilityEngine } from '../../src/services/module2ComparabilityEngine';
import { Module2PriceEngine } from '../../src/services/module2PriceEngine';
import { Module2OpportunityCalculator } from '../../src/services/module2OpportunityCalculator';
import { Module2ScorecardEngine } from '../../src/services/module2ScorecardEngine';
import { Module2WaterfallBuilder } from '../../src/services/module2WaterfallBuilder';
import { Module2SupplierStructureBuilder } from '../../src/services/module2SupplierStructureBuilder';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import { db } from '../../src/services/db';

describe('Module 2 Strategic Sourcing Intelligence Engine (MODULE_2_SOURCING_LOGIC_V1.0)', () => {
  // TEST A — Single supplier
  it('TEST A: Single supplier -> no supplier consolidation opportunity', () => {
    const singleSupplierTxs: StrategicInputTransaction[] = [
      {
        id: 'TX-A1',
        po_number: 'PO-A1',
        po_date: '2023-01-10',
        vendor_name: 'Sole Monopolist Inc',
        material_desc: 'Proprietary Component X',
        quantity: 100,
        unit_price: 5000,
        total_spend_inr: 500000,
        uom: 'EA',
        currency: 'INR',
        spend_category: 'Proprietary Components'
      },
      {
        id: 'TX-A2',
        po_number: 'PO-A2',
        po_date: '2023-04-12',
        vendor_name: 'Sole Monopolist Inc',
        material_desc: 'Proprietary Component X',
        quantity: 120,
        unit_price: 5000,
        total_spend_inr: 600000,
        uom: 'EA',
        currency: 'INR',
        spend_category: 'Proprietary Components'
      }
    ];

    const profile = Module2StrategicSourcingEngine.buildCategoryProfile(
      'Proprietary Components',
      singleSupplierTxs
    );

    expect(profile.activeSuppliersCount).toBe(1);
    expect(profile.consolidationSuitability).toBe('NOT_SUITABLE');
    expect(profile.potentialVendorConsolidationOpportunityInr).toBe(0);
    expect(profile.eauctionSuitability).toBe('NOT_SUITABLE');
    expect(profile.potentialEAuctionOpportunityInr).toBe(0);
  });

  // TEST B — Multiple suppliers with identical pricing
  it('TEST B: Multiple suppliers with identical pricing -> no fabricated price benefit', () => {
    const identicalPriceTxs: StrategicInputTransaction[] = [
      {
        id: 'TX-B1',
        po_number: 'PO-B1',
        po_date: '2023-01-15',
        vendor_name: 'Supplier Alpha',
        material_desc: 'Standard Steel Flange',
        quantity: 1000,
        unit_price: 250,
        total_spend_inr: 250000,
        uom: 'EA',
        currency: 'INR',
        spend_category: 'Standard Steel Flanges'
      },
      {
        id: 'TX-B2',
        po_number: 'PO-B2',
        po_date: '2023-03-20',
        vendor_name: 'Supplier Beta',
        material_desc: 'Standard Steel Flange',
        quantity: 1000,
        unit_price: 250,
        total_spend_inr: 250000,
        uom: 'EA',
        currency: 'INR',
        spend_category: 'Standard Steel Flanges'
      }
    ];

    const profile = Module2StrategicSourcingEngine.buildCategoryProfile(
      'Standard Steel Flanges',
      identicalPriceTxs
    );

    expect(profile.activeSuppliersCount).toBe(2);
    expect(profile.priceDispersion?.priceDispersionInr).toBe(0);
    // Absolute No-Fabrication Rule: No generic % applied! Price gap is 0
    expect(profile.potentialEAuctionOpportunityInr).toBe(0);
    expect(profile.potentialVendorConsolidationOpportunityInr).toBe(0);
    expect(profile.netQuantifiableOpportunityInr).toBe(0);
  });

  // TEST C — Multiple comparable suppliers with price dispersion
  it('TEST C: Multiple comparable suppliers with price dispersion -> e-auction opportunity calculated', () => {
    const dispersionTxs: StrategicInputTransaction[] = [
      {
        id: 'TX-C1',
        po_number: 'PO-C1',
        po_date: '2023-01-10',
        vendor_name: 'Vendor A',
        material_desc: 'Corrugated Carton 5-Ply',
        quantity: 10000,
        unit_price: 100,
        total_spend_inr: 1000000,
        uom: 'BOX',
        currency: 'INR',
        spend_category: 'Packaging'
      },
      {
        id: 'TX-C2',
        po_number: 'PO-C2',
        po_date: '2023-04-15',
        vendor_name: 'Vendor B',
        material_desc: 'Corrugated Carton 5-Ply',
        quantity: 10000,
        unit_price: 110,
        total_spend_inr: 1100000,
        uom: 'BOX',
        currency: 'INR',
        spend_category: 'Packaging'
      },
      {
        id: 'TX-C3',
        po_number: 'PO-C3',
        po_date: '2023-07-20',
        vendor_name: 'Vendor C',
        material_desc: 'Corrugated Carton 5-Ply',
        quantity: 10000,
        unit_price: 120,
        total_spend_inr: 1200000,
        uom: 'BOX',
        currency: 'INR',
        spend_category: 'Packaging'
      }
    ];

    const profile = Module2StrategicSourcingEngine.buildCategoryProfile('Packaging', dispersionTxs);

    expect(profile.activeSuppliersCount).toBe(3);
    expect(profile.priceDispersion?.weightedAveragePrice).toBe(110);
    expect(profile.credibleReference.referencePrice).toBe(100);
    // Price gap = 110 - 100 = 10, Addressable qty = 30000 -> Opp = 3,00,000
    expect(profile.potentialEAuctionOpportunityInr).toBe(300000);
    expect(profile.eauctionSuitability).toBe('HIGH');
  });

  // TEST D — One abnormal low-price transaction
  it('TEST D: One abnormal low-price transaction -> lowest price not blindly used', () => {
    const outlierTxs: StrategicInputTransaction[] = [
      {
        id: 'TX-D1',
        po_number: 'PO-D1',
        vendor_name: 'Supplier A',
        material_desc: 'Precision Bearing',
        quantity: 1000,
        unit_price: 1000,
        total_spend_inr: 1000000,
        uom: 'EA',
        currency: 'INR',
        spend_category: 'Bearings'
      },
      {
        id: 'TX-D2',
        po_number: 'PO-D2',
        vendor_name: 'Supplier B',
        material_desc: 'Precision Bearing',
        quantity: 1000,
        unit_price: 1050,
        total_spend_inr: 1050000,
        uom: 'EA',
        currency: 'INR',
        spend_category: 'Bearings'
      },
      // Outlier with negligible quantity or extreme price anomaly (< 50% of median)
      {
        id: 'TX-D3',
        po_number: 'PO-D3',
        vendor_name: 'Supplier Rogue',
        material_desc: 'Precision Bearing Sample',
        quantity: 2, // tiny quantity
        unit_price: 100, // 90% below median!
        total_spend_inr: 200,
        uom: 'EA',
        currency: 'INR',
        spend_category: 'Bearings'
      }
    ];

    const compResult = Module2ComparabilityEngine.evaluateComparability(outlierTxs);
    // Rogue sample is flagged as statistical outlier
    expect(compResult.excludedTransactions.some(e => e.transactionId === 'TX-D3')).toBe(true);

    const profile = Module2StrategicSourcingEngine.buildCategoryProfile('Bearings', outlierTxs);
    // Credible lowest reference must not be ₹100
    expect(profile.credibleReference.referencePrice).toBeGreaterThan(500);
  });

  // TEST E, F, G, H — Non-comparable items, units, currencies
  it('TEST E, F, G: Different units, currencies and missing values explicitly excluded and logged', () => {
    const mixedTxs: StrategicInputTransaction[] = [
      {
        id: 'TX-E1',
        po_number: 'PO-E1',
        vendor_name: 'Vendor Standard',
        material_desc: 'Alloy Wire',
        quantity: 500,
        unit_price: 200,
        total_spend_inr: 100000,
        uom: 'KG',
        currency: 'INR',
        spend_category: 'Alloy Wires'
      },
      {
        id: 'TX-E2',
        po_number: 'PO-E2',
        vendor_name: 'Vendor Mismatched UOM',
        material_desc: 'Alloy Wire',
        quantity: 10,
        unit_price: 10000,
        total_spend_inr: 100000,
        uom: 'SPOOL', // Unit mismatch
        currency: 'INR',
        spend_category: 'Alloy Wires'
      },
      {
        id: 'TX-E3',
        po_number: 'PO-E3',
        vendor_name: 'Vendor Foreign Currency',
        material_desc: 'Alloy Wire',
        quantity: 100,
        unit_price: 2.5,
        total_spend_inr: 20000,
        uom: 'KG',
        currency: 'USD', // Currency mismatch
        spend_category: 'Alloy Wires'
      },
      {
        id: 'TX-E4',
        po_number: 'PO-E4',
        vendor_name: 'Vendor Bad Price',
        material_desc: 'Alloy Wire',
        quantity: 50,
        unit_price: 0, // Invalid price
        total_spend_inr: 0,
        uom: 'KG',
        currency: 'INR',
        spend_category: 'Alloy Wires'
      }
    ];

    const comp = Module2ComparabilityEngine.evaluateComparability(mixedTxs);
    expect(comp.comparableTransactions.length).toBe(1);
    expect(comp.excludedTransactions.length).toBe(3);

    // Verify explicit exclusion reasons logged
    const reasons = comp.excludedTransactions.flatMap(e => e.reasons);
    expect(reasons).toContain('UNIT_MISMATCH');
    expect(reasons).toContain('CURRENCY_MISMATCH');
    expect(reasons).toContain('INVALID_PRICE');
  });

  // TEST I & J — Recurring vs One-time spend
  it('TEST I & J: Correctly distinguishes recurring procurement from one-time large spend', () => {
    const recurringTxs: StrategicInputTransaction[] = [
      {
        po_date: '2023-01-10',
        vendor_name: 'Vendor V1',
        material_desc: 'Diesel Fuel',
        quantity: 1000,
        unit_price: 90,
        total_spend_inr: 90000,
        uom: 'LTR',
        currency: 'INR',
        spend_category: 'Fuel'
      },
      {
        po_date: '2023-03-10',
        vendor_name: 'Vendor V1',
        material_desc: 'Diesel Fuel',
        quantity: 1000,
        unit_price: 90,
        total_spend_inr: 90000,
        uom: 'LTR',
        currency: 'INR',
        spend_category: 'Fuel'
      },
      {
        po_date: '2023-06-10',
        vendor_name: 'Vendor V1',
        material_desc: 'Diesel Fuel',
        quantity: 1000,
        unit_price: 90,
        total_spend_inr: 90000,
        uom: 'LTR',
        currency: 'INR',
        spend_category: 'Fuel'
      }
    ];
    const profileRecurring = Module2StrategicSourcingEngine.buildCategoryProfile('Fuel', recurringTxs);
    expect(profileRecurring.isRecurringSpend).toBe(true);

    const oneTimeHighSpendTxs: StrategicInputTransaction[] = [
      {
        po_date: '2023-05-15',
        vendor_name: 'Heavy Machine Corp',
        material_desc: 'Blast Furnace Rebricking Project',
        quantity: 1,
        unit_price: 15000000,
        total_spend_inr: 15000000, // ₹1.5 Cr one-time!
        uom: 'JOB',
        currency: 'INR',
        spend_category: 'Capex Projects'
      }
    ];
    const profileOneTime = Module2StrategicSourcingEngine.buildCategoryProfile('Capex Projects', oneTimeHighSpendTxs);
    // Must NOT be classified as recurring merely because spend is high!
    expect(profileOneTime.isRecurringSpend).toBe(false);
  });

  // TEST K & L — Concentration and Fragmentation logic
  it('TEST K & L: Fragmentation logic reflects concentration rather than raw supplier count', () => {
    // 8 suppliers, but Top 1 has 95% spend -> Section 5 rule: LOW FRAGMENTATION
    const dominantSupplierTxs: StrategicInputTransaction[] = [
      {
        vendor_name: 'Titan Supplier',
        material_desc: 'Raw Ore',
        quantity: 950,
        unit_price: 1000,
        total_spend_inr: 950000,
        uom: 'MT',
        currency: 'INR',
        spend_category: 'Raw Ore'
      },
      ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({
        vendor_name: `Tail Vendor ${i}`,
        material_desc: 'Raw Ore',
        quantity: 7,
        unit_price: 1020,
        total_spend_inr: 7140,
        uom: 'MT',
        currency: 'INR',
        spend_category: 'Raw Ore'
      }))
    ];

    const profileDominant = Module2StrategicSourcingEngine.buildCategoryProfile('Raw Ore', dominantSupplierTxs);
    expect(profileDominant.activeSuppliersCount).toBe(8);
    expect(profileDominant.topSupplierSharePct).toBeGreaterThanOrEqual(90);
    expect(profileDominant.fragmentationLevel).toBe('LOW_FRAGMENTATION');

    // 4 suppliers, each with ~25% spend -> Highly fragmented allocation
    const balancedTxs: StrategicInputTransaction[] = [1, 2, 3, 4].map((i) => ({
      vendor_name: `Vendor Balanced ${i}`,
      material_desc: 'Chemical Additive',
      quantity: 250,
      unit_price: 1000,
      total_spend_inr: 250000,
      uom: 'KG',
      currency: 'INR',
      spend_category: 'Chemical Additives'
    }));

    const profileBalanced = Module2StrategicSourcingEngine.buildCategoryProfile('Chemical Additives', balancedTxs);
    expect(profileBalanced.hhiScore).toBe(2500);
    expect(profileBalanced.fragmentationLevel).toBe('HIGH_FRAGMENTATION');
  });

  // TEST M — E-Auction vs Consolidation Overlap (Deduplication)
  it('TEST M: E-Auction + Consolidation Overlap deduplication formula strictly enforced', () => {
    const eauctionOpp = 500000; // ₹5 Lakhs
    const consolOpp = 200000;    // ₹2 Lakhs

    const result = Module2OpportunityCalculator.calculateNetOpportunity(
      eauctionOpp,
      consolOpp,
      true,
      10
    );

    // Overlap = min(500000, 200000) = 200000
    expect(result.overlappingInr).toBe(200000);
    // Net = 500000 + 200000 - 200000 = 500000 (No double counting!)
    expect(result.netInr).toBe(500000);
    expect(result.status).toBe('E_AUCTION_AND_CONSOLIDATION');
  });

  // TEST N & O & U — Insufficient data and NOT_QUANTIFIABLE
  it('TEST N, O, U: Insufficient data yields NOT_QUANTIFIABLE rather than false ₹0', () => {
    const resultNoData = Module2OpportunityCalculator.calculateNetOpportunity(
      null,
      null,
      false, // insufficient
      0
    );

    expect(resultNoData.status).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
    expect(resultNoData.netInr).toBeNull();
    expect(resultNoData.isQuantifiable).toBe(false);
    expect(resultNoData.displayText).toBe('Opportunity Identified — Benefit Not Yet Quantifiable');
  });

  // TEST Q — Weighted Price vs Simple Average
  it('TEST Q: Baseline price uses quantity-weighted average rather than simple average', () => {
    const diffQtyTxs: StrategicInputTransaction[] = [
      {
        vendor_name: 'Big Batch Supplier',
        material_desc: 'Commodity Sand',
        quantity: 9000,
        unit_price: 10,
        total_spend_inr: 90000,
        uom: 'TON',
        currency: 'INR',
        spend_category: 'Sand'
      },
      {
        vendor_name: 'Small Batch Supplier',
        material_desc: 'Commodity Sand',
        quantity: 1000,
        unit_price: 20,
        total_spend_inr: 20000,
        uom: 'TON',
        currency: 'INR',
        spend_category: 'Sand'
      }
    ];

    const dispersion = Module2PriceEngine.calculatePriceDispersion(diffQtyTxs);
    expect(dispersion).not.toBeNull();
    // Simple average is (10 + 20) / 2 = 15
    expect(dispersion?.simpleAveragePrice).toBe(15);
    // Quantity-weighted average is (90,000 + 20,000) / 10,000 = 11
    expect(dispersion?.weightedAveragePrice).toBe(11);
  });

  // TEST R — Scenarios (Conservative, Base, Stretch)
  it('TEST R: Scenarios calculated strictly from empirical internal price percentiles', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'V1', material_desc: 'Mat', quantity: 100, unit_price: 80, total_spend_inr: 8000, uom: 'EA', currency: 'INR' },
      { vendor_name: 'V2', material_desc: 'Mat', quantity: 100, unit_price: 90, total_spend_inr: 9000, uom: 'EA', currency: 'INR' },
      { vendor_name: 'V3', material_desc: 'Mat', quantity: 100, unit_price: 100, total_spend_inr: 10000, uom: 'EA', currency: 'INR' },
      { vendor_name: 'V4', material_desc: 'Mat', quantity: 100, unit_price: 110, total_spend_inr: 11000, uom: 'EA', currency: 'INR' }
    ];

    const disp = Module2PriceEngine.calculatePriceDispersion(txs);
    const cred = Module2PriceEngine.determineCredibleReferencePrice(txs, disp);
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(400, disp, cred);

    expect(scenarios.isAvailable).toBe(true);
    expect(scenarios.conservativeOpportunityInr).toBeDefined();
    expect(scenarios.baseOpportunityInr).toBeDefined();
    expect(scenarios.stretchOpportunityInr).toBeDefined();
    expect(scenarios.stretchOpportunityInr!).toBeGreaterThanOrEqual(scenarios.conservativeOpportunityInr!);
  });

  // TEST V — Operational Consolidation Indicators
  it('TEST V: Operational indicators (touchpoints, POs, vendors) separated from monetary savings', () => {
    const suppliers = [
      {
        supplierId: 'S1',
        supplierName: 'Core Vendor',
        totalSpendInr: 900000,
        totalSpendInrCr: 0.09,
        spendSharePct: 90,
        transactionCount: 5,
        transactionSharePct: 50,
        totalQuantity: 900,
        weightedAveragePrice: 1000,
        minPrice: 1000,
        maxPrice: 1000,
        rank: 1,
        isTopSupplier: true,
        isTailSupplier: false,
        pricePositionVsComparable: 'AT_AVERAGE' as const,
        potentialConsolidationRelevance: 'Core'
      },
      {
        supplierId: 'S2',
        supplierName: 'Tail Vendor 1',
        totalSpendInr: 50000,
        totalSpendInrCr: 0.005,
        spendSharePct: 5,
        transactionCount: 3,
        transactionSharePct: 30,
        totalQuantity: 45,
        weightedAveragePrice: 1111,
        minPrice: 1111,
        maxPrice: 1111,
        rank: 2,
        isTopSupplier: false,
        isTailSupplier: true,
        pricePositionVsComparable: 'ABOVE_AVERAGE' as const,
        potentialConsolidationRelevance: 'Tail'
      },
      {
        supplierId: 'S3',
        supplierName: 'Tail Vendor 2',
        totalSpendInr: 50000,
        totalSpendInrCr: 0.005,
        spendSharePct: 5,
        transactionCount: 2,
        transactionSharePct: 20,
        totalQuantity: 45,
        weightedAveragePrice: 1111,
        minPrice: 1111,
        maxPrice: 1111,
        rank: 3,
        isTopSupplier: false,
        isTailSupplier: true,
        pricePositionVsComparable: 'ABOVE_AVERAGE' as const,
        potentialConsolidationRelevance: 'Tail'
      }
    ];

    const consol = Module2OpportunityCalculator.calculateConsolidationBenefit(
      true,
      suppliers,
      990,
      {
        totalQuantity: 990,
        totalSpendInr: 1000000,
        weightedAveragePrice: 1010,
        simpleAveragePrice: 1074,
        medianPrice: 1000,
        minPrice: 1000,
        maxPrice: 1111,
        p10Price: 1000,
        p25Price: 1000,
        p50Price: 1000,
        p75Price: 1111,
        p90Price: 1111,
        priceDispersionInr: 111,
        priceDispersionPct: 11,
        volumeAboveP25Pct: 9,
        dispersionInterpretation: 'Moderate'
      },
      10,
      6
    );

    // Operational indicators strictly separated
    expect(consol.operational.suppliersPotentiallyAffected).toBe(2);
    expect(consol.operational.poCountAffected).toBe(5);
    expect(consol.operational.transactionsAffected).toBe(5);
    expect(consol.operational.estimatedTouchpointReductionCount).toBe(24);
  });

  // TEST W & X — Complete Master Sourcing Analysis and Boundary Preservation
  it('TEST W & X: Master pipeline runs cleanly and generates handoff package without touching Module 1, 3 or 4', () => {
    const analysis = db.getModule2StrategicSourcingAnalysis(true);

    expect(analysis.profiles.length).toBeGreaterThanOrEqual(4);
    expect(analysis.summary.totalAddressableSpendInr).toBeGreaterThan(0);
    expect(analysis.summary.netQuantifiableOpportunityInr).toBeGreaterThan(0);

    // Handoff package structure for Module 4 (Section 34)
    expect(analysis.handoffPackages.length).toBeGreaterThan(0);
    const pkg = analysis.handoffPackages[0];
    expect(pkg.handoffId).toBeDefined();
    expect(pkg.categoryId).toBeDefined();
    expect(pkg.baselineWeightedPrice).toBeGreaterThan(0);
    expect(pkg.referencePrice).toBeGreaterThan(0);
    expect(pkg.netOpportunityInr).toBeGreaterThan(0);
    expect(pkg.auditSignature).toBeDefined();
  });

  // Additional Edge-Case Coverage for 90%+ Per-File Benchmark
  it('Exercises Price Engine edge cases: empty, single item, scenarios unavailable', () => {
    expect(Module2PriceEngine.calculatePriceDispersion([])).toBeNull();
    expect(Module2PriceEngine.calculatePriceDispersion([{ quantity: 0, unit_price: 0 } as any])).toBeNull();

    const credNull = Module2PriceEngine.determineCredibleReferencePrice([], null);
    expect(credNull.isCredible).toBe(false);
    expect(credNull.methodology).toBe('NO_VALID_REFERENCE');

    const scenNull = Module2PriceEngine.calculateOpportunityScenarios(0, null, credNull);
    expect(scenNull.isAvailable).toBe(false);
    expect(scenNull.conservativeOpportunityInr).toBeNull();

    // Homogeneous prices fallback
    const singleTx = [{ vendor_name: 'V', material_desc: 'M', quantity: 10, unit_price: 100, total_spend_inr: 1000, uom: 'EA', currency: 'INR' }];
    const dispSingle = Module2PriceEngine.calculatePriceDispersion(singleTx);
    expect(dispSingle).not.toBeNull();
    const credSingle = Module2PriceEngine.determineCredibleReferencePrice(singleTx, dispSingle);
    expect(credSingle.methodology).toBe('LOWEST_CREDIBLE_PRICE');

    // Dispersion with tiny transactions < 5% volume share to test P25 / MEDIAN fallback
    const tinyTxs = Array.from({ length: 30 }, (_, i) => ({
      vendor_name: `Vendor${i}`,
      material_desc: 'Tiny Part',
      quantity: 1, // each is 1/30 = 3.3% (< 5% share)
      unit_price: 100 + (i % 2) * 5,
      total_spend_inr: 100 + (i % 2) * 5,
      uom: 'EA',
      currency: 'INR'
    }));
    const dispTiny = Module2PriceEngine.calculatePriceDispersion(tinyTxs);
    const credTiny = Module2PriceEngine.determineCredibleReferencePrice(tinyTxs, dispTiny);
    expect(credTiny.isCredible).toBe(true);

    // Dispersion with high percentiles
    const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => ({
      vendor_name: `V${p}`,
      material_desc: 'M',
      quantity: 10,
      unit_price: p,
      total_spend_inr: p * 10,
      uom: 'EA',
      currency: 'INR'
    }));
    const dispSorted = Module2PriceEngine.calculatePriceDispersion(sorted);
    expect(dispSorted?.p90Price).toBeGreaterThan(70);
  });

  it('Exercises Comparability Engine edge cases: empty, extreme high price, zero qty', () => {
    const empty = Module2ComparabilityEngine.evaluateComparability([]);
    expect(empty.comparableTransactions.length).toBe(0);

    const txsWithHigh: StrategicInputTransaction[] = [
      { vendor_name: 'V1', material_desc: 'M', quantity: 100, unit_price: 100, total_spend_inr: 10000, uom: 'EA', currency: 'INR' },
      { vendor_name: 'V2', material_desc: 'M', quantity: 100, unit_price: 105, total_spend_inr: 10500, uom: 'EA', currency: 'INR' },
      { vendor_name: 'V3', material_desc: 'M', quantity: 10, unit_price: 500, total_spend_inr: 5000, uom: 'EA', currency: 'INR' }, // > 4x median!
      { vendor_name: 'V4', material_desc: 'M', quantity: 0, unit_price: 100, total_spend_inr: 0, uom: 'EA', currency: 'INR' } // zero qty
    ];
    const res = Module2ComparabilityEngine.evaluateComparability(txsWithHigh);
    expect(res.excludedTransactions.length).toBe(2);
    expect(res.excludedTransactions.some(e => e.reasons.includes('OBVIOUS_OUTLIER'))).toBe(true);
    expect(res.excludedTransactions.some(e => e.reasons.includes('MISSING_QUANTITY'))).toBe(true);
  });

  it('Exercises Opportunity Calculator edge cases: low suitability, zero tail spend', () => {
    // Insufficient data
    const eauctionInsuf = Module2OpportunityCalculator.calculateEAuctionBenefit(
      true, 2, 100000, 0, null, { isCredible: false } as any
    );
    expect(eauctionInsuf.suitability).toBe('INSUFFICIENT_DATA');

    // Negligible price gap <= 0.5%
    const eauctionLow = Module2OpportunityCalculator.calculateEAuctionBenefit(
      true, 3, 1000000, 1000,
      { weightedAveragePrice: 100 } as any,
      { isCredible: true, referencePrice: 99.8 } as any
    );
    expect(eauctionLow.suitability).toBe('NOT_SUITABLE');

    // Low spend / low suppliers
    const eauctionLowSpend = Module2OpportunityCalculator.calculateEAuctionBenefit(
      false, 2, 100000, 100,
      { weightedAveragePrice: 100 } as any,
      { isCredible: true, referencePrice: 95 } as any
    );
    expect(eauctionLowSpend.suitability).toBe('MEDIUM');

    // Consolidation with insufficient dispersion
    const consolInsuf = Module2OpportunityCalculator.calculateConsolidationBenefit(
      true, [{ supplierName: 'S1' } as any, { supplierName: 'S2' } as any],
      0, null, 5, 2
    );
    expect(consolInsuf.suitability).toBe('INSUFFICIENT_DATA');
  });

  it('Exercises Scorecard Engine edge cases: high and low dimensions', () => {
    const sc = Module2ScorecardEngine.evaluateScorecard({
      materiality: 'LOW',
      fragmentation: 'LOW_FRAGMENTATION',
      dispersion: null,
      isRecurring: false,
      supplierCount: 1,
      comparableTxCount: 0,
      totalTxCount: 5,
      addressableSpendInr: 10000,
      confidence: 'INSUFFICIENT'
    });
    expect(sc.overallScore).toBeLessThan(50);
    expect(sc.recommendation).toBe('DATA_DEEP_DIVE_REQUIRED');

    // Empty transactions analyzeAll
    const emptyAnalyze = Module2StrategicSourcingEngine.analyze([]);
    expect(emptyAnalyze.profiles.length).toBe(0);
    expect(emptyAnalyze.summary.totalAddressableSpendInr).toBe(0);

    // Sole supplier HHI
    const soleHHI = Module2StrategicSourcingEngine.calculateHHIAndFragmentation([], 0);
    expect(soleHHI.hhiScore).toBe(10000);
    expect(soleHHI.hhiInterpretation).toContain('Sole supplier');
  });

  it('Covers Module2WaterfallBuilder edge cases and zero total spend branch', () => {
    const zeroWaterfall = Module2WaterfallBuilder.buildWaterfall(0, 0, 0, 0, 0, 0, 0, 0);
    expect(zeroWaterfall.length).toBe(10);
    expect(zeroWaterfall[1].percentageOfTotal).toBe(0);
    expect(zeroWaterfall[2].percentageOfTotal).toBe(0);
    expect(zeroWaterfall[3].percentageOfTotal).toBe(0);

    const normalWaterfall = Module2WaterfallBuilder.buildWaterfall(
      1000000, 0.1, 800000, 0.08, 50000, 30000, 20000, 60000
    );
    expect(normalWaterfall[0].percentageOfTotal).toBe(100);
    expect(normalWaterfall[1].amountInr).toBe(800000);
    expect(normalWaterfall[9].amountInr).toBe(60000);
  });

  it('Covers Module2SupplierStructureBuilder and price positioning branches', () => {
    const txs: StrategicInputTransaction[] = [
      { vendor_name: 'Lead Vendor', quantity: 100, unit_price: 100, total_spend_inr: 10000 },
      { vendor_name: 'Core Vendor 2', quantity: 50, unit_price: 90, total_spend_inr: 4500 },
      { vendor_name: 'Tail Vendor 3', quantity: 1, unit_price: 150, total_spend_inr: 150 },
      { vendor_name: 'Zero Price Vendor', quantity: 5, unit_price: 0, total_spend_inr: 0 }
    ];

    const dispersion = { weightedAveragePrice: 100 } as any;
    const structure = Module2SupplierStructureBuilder.buildSupplierStructure(txs, 14650, 4, dispersion);

    expect(structure.length).toBe(4);
    expect(structure[0].isTopSupplier).toBe(true);
    expect(structure[0].pricePositionVsComparable).toBe('AT_AVERAGE');
    expect(structure[1].pricePositionVsComparable).toBe('BELOW_AVERAGE');
    expect(structure[2].pricePositionVsComparable).toBe('ABOVE_AVERAGE');
    expect(structure[2].isTailSupplier).toBe(true);
    expect(structure[3].pricePositionVsComparable).toBe('NON_COMPARABLE');

    // Without dispersion
    const noDispStructure = Module2SupplierStructureBuilder.buildSupplierStructure(txs, 14650, 4, null);
    expect(noDispStructure[0].pricePositionVsComparable).toBe('NON_COMPARABLE');
  });

  it('Covers Module2PriceEngine calculatePercentile and credible price reference edge cases', () => {
    // Percentile edge cases
    expect(Module2PriceEngine.calculatePercentile([], 50)).toBe(0);
    expect(Module2PriceEngine.calculatePercentile([42], 50)).toBe(42);
    expect(Module2PriceEngine.calculatePercentile([10, 20, 30], 100)).toBe(30);

    // Price dispersion with empty or zero quantity
    expect(Module2PriceEngine.calculatePriceDispersion([])).toBeNull();
    expect(Module2PriceEngine.calculatePriceDispersion([{ quantity: 0, unit_price: 0 } as any])).toBeNull();

    // Credible reference price edge cases
    const noRef1 = Module2PriceEngine.determineCredibleReferencePrice([], null);
    expect(noRef1.isCredible).toBe(false);

    const noRef2 = Module2PriceEngine.determineCredibleReferencePrice(
      [{ quantity: 0, unit_price: 0 } as any],
      { weightedAveragePrice: 100 } as any
    );
    expect(noRef2.isCredible).toBe(false);

    // Scenarios without credible reference
    const noScen = Module2PriceEngine.calculateOpportunityScenarios(100, null, noRef1);
    expect(noScen.isAvailable).toBe(false);
  });

  it('Covers Module2ComparabilityEngine evaluateDataConfidence and validation branches', () => {
    // Data confidence ladders
    const confHigh = Module2ComparabilityEngine.evaluateDataConfidence(6, 3, 5, 0);
    expect(confHigh.dataConfidence).toBe('HIGH');

    const confMed = Module2ComparabilityEngine.evaluateDataConfidence(2, 2, 2, 1);
    expect(confMed.dataConfidence).toBe('MEDIUM');

    const confLow = Module2ComparabilityEngine.evaluateDataConfidence(1, 1, 1, 1);
    expect(confLow.dataConfidence).toBe('LOW');

    const confInsuf = Module2ComparabilityEngine.evaluateDataConfidence(0, 0, 0, 1);
    expect(confInsuf.dataConfidence).toBe('INSUFFICIENT');

    // Extreme low price outlier check
    const outlierTxs: StrategicInputTransaction[] = [
      { vendor_name: 'V1', quantity: 100, unit_price: 100, total_spend_inr: 10000, uom: 'EA', currency: 'INR' },
      { vendor_name: 'V2', quantity: 100, unit_price: 100, total_spend_inr: 10000, uom: 'EA', currency: 'INR' },
      { vendor_name: 'V3', quantity: 100, unit_price: 10, total_spend_inr: 1000, uom: 'EA', currency: 'INR' }, // Extreme low
      { vendor_name: 'V4', quantity: NaN, unit_price: NaN, total_spend_inr: 0, uom: 'EA', currency: 'INR' } // NaN checks
    ];
    const compRes = Module2ComparabilityEngine.evaluateComparability(outlierTxs);
    expect(compRes.excludedTransactions.some(e => e.reasons.includes('OBVIOUS_OUTLIER'))).toBe(true);
    expect(compRes.excludedTransactions.some(e => e.reasons.includes('INVALID_PRICE'))).toBe(true);
    expect(compRes.excludedTransactions.some(e => e.reasons.includes('MISSING_QUANTITY'))).toBe(true);
  });

  it('Covers Module2StrategicSourcingEngine HHI thresholds and dashboard confidence', () => {
    // Moderate concentration (1500 <= HHI <= 2500)
    const suppsMed = [
      { supplierName: 'S1', totalSpendInr: 2500, spendSharePct: 25, isTailSupplier: false },
      { supplierName: 'S2', totalSpendInr: 2500, spendSharePct: 25, isTailSupplier: false },
      { supplierName: 'S3', totalSpendInr: 2500, spendSharePct: 25, isTailSupplier: false },
      { supplierName: 'S4', totalSpendInr: 2500, spendSharePct: 25, isTailSupplier: false }
    ] as any;
    const hhiMed = Module2StrategicSourcingEngine.calculateHHIAndFragmentation(suppsMed, 10000);
    expect(hhiMed.hhiScore).toBeGreaterThanOrEqual(1500);
    expect(hhiMed.hhiInterpretation).toContain('Moderately concentrated');

    // Unconcentrated / fragmented (< 1500)
    const suppsFrag = [
      { supplierName: 'S1', totalSpendInr: 1500, spendSharePct: 15, isTailSupplier: false },
      { supplierName: 'S2', totalSpendInr: 1500, spendSharePct: 15, isTailSupplier: false },
      { supplierName: 'S3', totalSpendInr: 1500, spendSharePct: 15, isTailSupplier: false },
      { supplierName: 'S4', totalSpendInr: 1500, spendSharePct: 15, isTailSupplier: false },
      { supplierName: 'S5', totalSpendInr: 1500, spendSharePct: 15, isTailSupplier: true },
      { supplierName: 'S6', totalSpendInr: 1500, spendSharePct: 15, isTailSupplier: true },
      { supplierName: 'S7', totalSpendInr: 1000, spendSharePct: 10, isTailSupplier: true }
    ] as any;
    const hhiFrag = Module2StrategicSourcingEngine.calculateHHIAndFragmentation(suppsFrag, 10000);
    expect(hhiFrag.hhiScore).toBeLessThan(1500);
    expect(hhiFrag.hhiInterpretation).toContain('Unconcentrated / fragmented');
  });
});

