/**
 * PCBI Calculation Engine Unit & Acceptance Tests (Master Product Spec - Prompt 100)
 * Validates:
 * 1. Exact Test Case from Master Product Specification:
 *    - Baseline purchase: ₹150, Baseline PCBI Index: 105
 *    - Current PCBI Index: 110, Current actual purchase: ₹180, Quantity: 10,000, Benchmarkability: 70%
 *    - Expected benchmark: ₹150 × (110 / 105) = ₹157.14
 *    - Price gap: ₹180 - ₹157.14 = ₹22.86
 *    - Gross opportunity: ₹22.86 × 10,000 = ₹228,600
 *    - PCBI potential opportunity: ₹228,600 × 70% = ₹160,020
 * 2. Multi-constituent Composite PCBI Calculation & Decomposition (Steel 60%, Rubber 10%, Conversion 30%)
 * 3. Benchmarkability & Benchmarkable Spend Calculation
 * 4. "Why This Benchmark?" Explainability Panel & Formula Transparency Proofs
 * 5. Data Quality Scoring & Edge Case Handling
 */

import { describe, it, expect } from 'vitest';
import { PCBICalculationEngine } from '../../src/services/pcbiCalculationEngine';
import type {
  PCBIBenchmarkMaster,
  PCBIBenchmarkComponent,
  PCBIWeeklyIndex,
  PCBIClientPurchaseTransaction
} from '../../src/types/pcbi';

describe('PCBI Calculation Engine - Master Product Specification Tests (Prompt 100)', () => {
  // Test Setup: Single Benchmark
  const singleBenchmark: PCBIBenchmarkMaster = {
    id: 'test-bm-001',
    pcbi_id: 'PCBI-TEST-001',
    sector: 'Industrial',
    category: 'Industrial Consumables',
    benchmark_name: 'Lubricant Index',
    benchmark_source: 'Official Market Benchmark',
    source_series: 'LUB-IND-01',
    benchmark_unit: 'L',
    currency: 'INR',
    geography: 'India',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 70, // 70%
    residual_percent: 30,         // 30%
    quality_rating: 'A',
    calculation_method: 'Expected = P0 * (I1 / I0)',
    effective_from: '2020-04-01',
    version: 1,
    active: true
  };

  // Test Setup: Composite Benchmark (Bearing: Steel 60%, Rubber 10%, Conversion 30%)
  const compositeBenchmark: PCBIBenchmarkMaster = {
    id: 'comp-bm-001',
    pcbi_id: 'PCBI-BEARING-001',
    sector: 'Manufacturing',
    category: 'Bearings & Assemblies',
    benchmark_name: 'Bearing Composite Benchmark',
    benchmark_source: 'Multi-Commodity Constituent Model',
    benchmark_unit: 'EA',
    currency: 'INR',
    geography: 'India',
    benchmark_type: 'COMPOSITE',
    benchmarkability_percent: 70, // Steel 60% + Rubber 10% = 70% benchmarkable
    residual_percent: 30,         // Conversion 30%
    quality_rating: 'B',
    calculation_method: 'COMPOSITE_CONSTITUENTS',
    effective_from: '2020-04-01',
    version: 1,
    active: true
  };

  const compositeComponents: PCBIBenchmarkComponent[] = [
    {
      id: 'comp-steel',
      pcbi_id: 'PCBI-BEARING-001',
      component_name: 'Alloy Bearing Steel',
      weight_percent: 60,
      source_commodity_code: 'STEEL-ALLOY',
      created_at: new Date().toISOString(),
      active: true
    },
    {
      id: 'comp-rubber',
      pcbi_id: 'PCBI-BEARING-001',
      component_name: 'Synthetic Rubber Seal',
      weight_percent: 10,
      source_commodity_code: 'RUBBER-SYN',
      created_at: new Date().toISOString(),
      active: true
    }
  ];

  const testIndices: PCBIWeeklyIndex[] = [
    // Single benchmark indices
    {
      id: 'idx-single-base',
      pcbi_id: 'PCBI-TEST-001',
      week_start: '2023-07-10',
      week_end: '2023-07-16',
      index_value: 105.0, // Baseline PCBI Index = 105
      quality_rating: 'A',
      source: 'Official Index',
      currency: 'INR',
      unit: 'INDEX',
      created_at: new Date().toISOString()
    },
    {
      id: 'idx-single-curr',
      pcbi_id: 'PCBI-TEST-001',
      week_start: '2023-09-25',
      week_end: '2023-10-01',
      index_value: 110.0, // Current PCBI Index = 110
      quality_rating: 'A',
      source: 'Official Index',
      currency: 'INR',
      unit: 'INDEX',
      created_at: new Date().toISOString()
    },
    // Composite component indices
    {
      id: 'idx-steel-base',
      pcbi_id: 'PCBI-BEARING-001',
      component_id: 'comp-steel',
      week_start: '2023-07-10',
      week_end: '2023-07-16',
      index_value: 100.0,
      quality_rating: 'A',
      source: 'Steel Index',
      currency: 'INR',
      unit: 'INDEX',
      created_at: new Date().toISOString()
    },
    {
      id: 'idx-steel-curr',
      pcbi_id: 'PCBI-BEARING-001',
      component_id: 'comp-steel',
      week_start: '2023-09-25',
      week_end: '2023-10-01',
      index_value: 110.0, // Steel movement: +10%
      quality_rating: 'A',
      source: 'Steel Index',
      currency: 'INR',
      unit: 'INDEX',
      created_at: new Date().toISOString()
    },
    {
      id: 'idx-rubber-base',
      pcbi_id: 'PCBI-BEARING-001',
      component_id: 'comp-rubber',
      week_start: '2023-07-10',
      week_end: '2023-07-16',
      index_value: 100.0,
      quality_rating: 'A',
      source: 'Rubber Index',
      currency: 'INR',
      unit: 'INDEX',
      created_at: new Date().toISOString()
    },
    {
      id: 'idx-rubber-curr',
      pcbi_id: 'PCBI-BEARING-001',
      component_id: 'comp-rubber',
      week_start: '2023-09-25',
      week_end: '2023-10-01',
      index_value: 105.0, // Rubber movement: +5%
      quality_rating: 'A',
      source: 'Rubber Index',
      currency: 'INR',
      unit: 'INDEX',
      created_at: new Date().toISOString()
    }
  ];

  const engine = new PCBICalculationEngine(
    [singleBenchmark, compositeBenchmark],
    compositeComponents,
    testIndices,
    []
  );

  it('MUST EXACTLY REPRODUCE Prompt 100 Test Case: Baseline ₹150, Base Index 105, Curr Index 110, Actual ₹180, Qty 10,000, Benchmarkability 70%', () => {
    /**
     * Test Case specifications from Prompt 100:
     * Baseline purchase: ₹150
     * Baseline PCBI Index: 105
     * Current PCBI Index: 110
     * Current actual purchase: ₹180
     * Quantity: 10,000
     * Benchmarkability: 70%
     * 
     * Expected benchmark: ₹150 × (110 / 105) = ₹157.14
     * Price gap: ₹180 - ₹157.14 = ₹22.86
     * Gross opportunity: ₹22.86 × 10,000 = ₹228,600
     * PCBI potential opportunity: ₹228,600 × 70% = ₹160,020
     */
    const transactions: PCBIClientPurchaseTransaction[] = [
      {
        id: 'tx-prompt100-baseline',
        sector: 'Industrial',
        plant: 'Main Plant',
        po_number: 'PO-BASE-001',
        po_date: '2023-07-12', // Week 2023-07-10 (Index: 105)
        material_code: 'MAT-LUBRICANT-01',
        short_text: 'Industrial Lubricant Oil',
        vendor: 'ABC Vendor',
        quantity: 5000,
        uom: 'L',
        currency: 'INR',
        unit_price: 150.0, // Baseline Purchase Price: ₹150
        total_value: 750000.0,
        pcbi_id: 'PCBI-TEST-001',
        comparable_key: 'MAT-LUBRICANT-01|L'
      },
      {
        id: 'tx-prompt100-subsequent',
        sector: 'Industrial',
        plant: 'Main Plant',
        po_number: 'PO-CURR-002',
        po_date: '2023-09-28', // Week 2023-09-25 (Index: 110)
        material_code: 'MAT-LUBRICANT-01',
        short_text: 'Industrial Lubricant Oil',
        vendor: 'ABC Vendor',
        quantity: 10000, // Quantity: 10,000
        uom: 'L',
        currency: 'INR',
        unit_price: 180.0, // Current Actual Purchase: ₹180
        total_value: 1800000.0,
        pcbi_id: 'PCBI-TEST-001',
        comparable_key: 'MAT-LUBRICANT-01|L'
      }
    ];

    const result = engine.calculate(transactions);

    // Verify exactly 2 calculation results
    expect(result.calculations.length).toBe(2);

    // Verify Baseline record
    const baseCalc = result.calculations[0];
    expect(baseCalc.calculation_status).toBe('BASE_RECORD');
    expect(baseCalc.base_price).toBe(150.0);
    expect(baseCalc.base_pcbi_index).toBe(105.0);
    expect(baseCalc.price_gap_per_unit).toBe(0);
    expect(baseCalc.opportunity_value).toBe(0);

    // Verify Subsequent record
    const subsequentCalc = result.calculations[1];
    expect(subsequentCalc.calculation_status).toBe('SUCCESS');

    // 1. Expected Benchmark Price: 150 * (110 / 105) = 157.14
    expect(subsequentCalc.expected_price).toBe(157.14);

    // 2. Price Gap: 180 - 157.14 = 22.86
    expect(subsequentCalc.price_gap_per_unit).toBe(22.86);

    // 3. Price Gap %: (22.86 / 157.14) * 100 = 14.55%
    expect(subsequentCalc.price_gap_pct).toBe(14.55);

    // 4. Gross Opportunity: 22.86 * 10,000 = 228,600
    expect(subsequentCalc.gross_opportunity).toBe(228600.0);

    // 5. Benchmarkability: 70%
    expect(subsequentCalc.benchmarkability_percent).toBe(70);

    // 6. PCBI Potential Opportunity: 228,600 * 70% = 160,020
    expect(subsequentCalc.opportunity_value).toBe(160020.0);

    // 7. Benchmarkable Spend: 180 * 10,000 * 0.70 = 1,260,000
    expect(subsequentCalc.benchmarkable_spend).toBe(1260000.0);

    // Verify Explainability Audit
    const audit = engine.generateExplainabilityAudit('tx-prompt100-subsequent', result.calculations);
    expect(audit).not.toBeNull();
    expect(audit!.expected_price).toBe(157.14);
    expect(audit!.price_gap_per_unit).toBe(22.86);
    expect(audit!.opportunity_value).toBe(160020.0);
    expect(audit!.formula_display).toContain('157.14');
    expect(audit!.formula_display).toContain('22.86');
    expect(audit!.formula_display).toMatch(/2,?28,?600/);
    expect(audit!.formula_display).toMatch(/1,?60,?020/);
  });

  it('calculates Multi-Constituent Composite PCBI decomposition correctly (Bearing: Steel 60%, Rubber 10%, Conversion 30%)', () => {
    // Base purchase: Price ₹1,000 (Steel 60% = 600, Rubber 10% = 100, Residual Conversion 30% = 300)
    // Subsequent: Steel movement +10% (600 * 1.10 = 660), Rubber movement +5% (100 * 1.05 = 105), Conversion fixed 300
    // Expected Benchmark Price = 660 + 105 + 300 = 1065.00
    // Actual Price: 1,200, Qty: 100
    // Price Gap = 1,200 - 1,065 = 135.00
    // Gross Opportunity = 135 * 100 = 13,500
    // Benchmarkability = 70%
    // PCBI Potential Opportunity = 13,500 * 70% = 9,450.00
    const compositeTxs: PCBIClientPurchaseTransaction[] = [
      {
        id: 'tx-bearing-base',
        sector: 'Manufacturing',
        plant: 'Plant 1',
        po_number: 'PO-BRG-01',
        po_date: '2023-07-12',
        material_code: 'MAT-BEARING-6205',
        short_text: 'Deep Groove Ball Bearing 6205',
        vendor: 'SKF India',
        quantity: 50,
        uom: 'EA',
        currency: 'INR',
        unit_price: 1000.0,
        total_value: 50000.0,
        pcbi_id: 'PCBI-BEARING-001',
        comparable_key: 'MAT-BEARING-6205|EA'
      },
      {
        id: 'tx-bearing-subsequent',
        sector: 'Manufacturing',
        plant: 'Plant 1',
        po_number: 'PO-BRG-02',
        po_date: '2023-09-28',
        material_code: 'MAT-BEARING-6205',
        short_text: 'Deep Groove Ball Bearing 6205',
        vendor: 'SKF India',
        quantity: 100,
        uom: 'EA',
        currency: 'INR',
        unit_price: 1200.0,
        total_value: 120000.0,
        pcbi_id: 'PCBI-BEARING-001',
        comparable_key: 'MAT-BEARING-6205|EA'
      }
    ];

    const result = engine.calculate(compositeTxs);
    const subsequent = result.calculations[1];

    expect(subsequent.calculation_method).toBe('COMPOSITE_BENCHMARK');
    expect(subsequent.expected_price).toBe(1065.0);
    expect(subsequent.actual_price).toBe(1200.0);
    expect(subsequent.price_gap_per_unit).toBe(135.0);
    expect(subsequent.gross_opportunity).toBe(13500.0);
    expect(subsequent.opportunity_value).toBe(9450.0);

    // Verify component breakdowns
    expect(subsequent.component_breakdowns).toBeDefined();
    expect(subsequent.component_breakdowns!.length).toBe(2);
    expect(subsequent.component_breakdowns![0].component_name).toBe('Alloy Bearing Steel');
    expect(subsequent.component_breakdowns![0].current_component_cost).toBe(660.0);
    expect(subsequent.component_breakdowns![1].component_name).toBe('Synthetic Rubber Seal');
    expect(subsequent.component_breakdowns![1].current_component_cost).toBe(105.0);

    const compAudit = engine.generateExplainabilityAudit('tx-bearing-subsequent', result.calculations);
    expect(compAudit).not.toBeNull();
    expect(compAudit?.is_composite).toBe(true);
    expect(compAudit?.components?.length).toBe(2);
    expect(compAudit?.formula_display).toContain('Expected Price = SUM');
  });

  it('calculates executive summary KPIs including material, service, benchmarkable spend and quality spend', () => {
    const mixedTxs: any[] = [
      {
        id: 'tx-mat-1',
        sector: 'Industrial',
        plant: 'Main Plant',
        po_number: 'PO-M1',
        po_date: '2023-07-12',
        material_code: 'MAT-01',
        short_text: 'Direct Material Plate',
        vendor: 'Supplier 1',
        quantity: 1000,
        uom: 'KG',
        currency: 'INR',
        unit_price: 100.0,
        total_value: 100000.0,
        spend_category: 'DIRECT MATERIALS',
        pcbi_id: 'PCBI-TEST-001'
      },
      {
        id: 'tx-srv-1',
        sector: 'Industrial',
        plant: 'Main Plant',
        po_number: 'PO-S1',
        po_date: '2023-07-12',
        material_code: 'SRV-01',
        short_text: 'Equipment Maintenance Service',
        vendor: 'Service Corp',
        quantity: 1,
        uom: 'LOT',
        currency: 'INR',
        unit_price: 50000.0,
        total_value: 50000.0,
        spend_category: 'SERVICES',
        pcbi_id: 'PCBI-TEST-001'
      }
    ];

    const result = engine.calculate(mixedTxs);
    const summary = result.executiveSummary;

    expect(summary.total_spend_inr).toBe(150000.0);
    expect(summary.material_spend_inr).toBe(100000.0);
    expect(summary.service_spend_inr).toBe(50000.0);
    expect(summary.benchmarkable_spend_inr).toBeGreaterThan(0);
    expect(summary.benchmarkability_percent).toBeGreaterThan(0);
    expect(summary.strategic_sourcing_opportunity_inr_cr).toBe(5.4);
    expect(summary.total_potential_opportunity_inr_cr).toBeGreaterThan(0);
  });

  it('calculates Favourable Variance when actual purchase price is BELOW expected benchmark price', () => {
    // Expected Benchmark: ₹157.14
    // Actual Purchase: ₹140.00
    // Price Gap = 0
    // Favourable Variance = (157.14 - 140.00) * 10,000 = ₹171,400
    const favourableTxs: PCBIClientPurchaseTransaction[] = [
      {
        id: 'tx-fav-base',
        sector: 'Industrial',
        plant: 'Main Plant',
        po_number: 'PO-FAV-BASE',
        po_date: '2023-07-12',
        material_code: 'MAT-FAV-01',
        short_text: 'Favourable Material Test',
        vendor: 'ABC Vendor',
        quantity: 1000,
        uom: 'KG',
        currency: 'INR',
        unit_price: 150.0,
        total_value: 150000.0,
        pcbi_id: 'PCBI-TEST-001',
        comparable_key: 'MAT-FAV-01|KG'
      },
      {
        id: 'tx-fav-subsequent',
        sector: 'Industrial',
        plant: 'Main Plant',
        po_number: 'PO-FAV-SUB',
        po_date: '2023-09-28',
        material_code: 'MAT-FAV-01',
        short_text: 'Favourable Material Test',
        vendor: 'ABC Vendor',
        quantity: 10000,
        uom: 'KG',
        currency: 'INR',
        unit_price: 140.0, // Below expected 157.14!
        total_value: 1400000.0,
        pcbi_id: 'PCBI-TEST-001',
        comparable_key: 'MAT-FAV-01|KG'
      }
    ];

    const result = engine.calculate(favourableTxs);
    const sub = result.calculations[1];

    expect(sub.expected_price).toBe(157.14);
    expect(sub.actual_price).toBe(140.0);
    expect(sub.price_gap_per_unit).toBe(0);
    expect(sub.opportunity_value).toBe(0);
    expect(sub.favourable_variance).toBe(171400.0);
  });

  it('exercises text classification heuristics, unspsc class fallback and index forward fill', () => {
    // 1. Text heuristics
    expect(engine.resolvePCBIMapping({ short_text: 'caustic soda lye naoh' } as any).pcbiId).toBe('PCBI-CHEM-CAUSTIC-001');
    expect(engine.resolvePCBIMapping({ short_text: 'thermal coal boiler fuel' } as any).pcbiId).toBe('PCBI-ENERGY-COAL-001');
    expect(engine.resolvePCBIMapping({ short_text: 'hdpe sack packaging polymer bag' } as any).pcbiId).toBe('PCBI-POLY-HDPE-001');
    expect(engine.resolvePCBIMapping({ short_text: 'copper cable wire conductor' } as any).pcbiId).toBe('PCBI-ELEC-CABLE-001');
    expect(engine.resolvePCBIMapping({ short_text: 'hydraulic lubricant oil grease' } as any).pcbiId).toBe('PCBI-LUB-OIL-001');
    expect(engine.resolvePCBIMapping({ short_text: 'refractory kiln brick alumina' } as any).pcbiId).toBe('PCBI-REFRAC-001');
    expect(engine.resolvePCBIMapping({ short_text: 'structural steel plate' } as any).pcbiId).toBe('PCBI-STEEL-001');
    expect(engine.resolvePCBIMapping({ short_text: 'completely unmapped miscellaneous' } as any).pcbiId).toBe('PCBI-STEEL-001');

    // 2. UNSPSC Commodity & Class fallback
    const unspscEngine = new PCBICalculationEngine(
      [],
      [],
      [],
      [
        { unspsc_code: '30263601', pcbi_id: 'PCBI-BRG-COMP-001', quality_rating: 'A', match_level: 'COMMODITY', active: true },
        { unspsc_code: '30263600', pcbi_id: 'PCBI-BRG-COMP-001', quality_rating: 'B', match_level: 'CLASS', active: true }
      ]
    );
    expect(unspscEngine.resolvePCBIMapping({ unspsc: '30263601' } as any).method).toBe('UNSPSC_COMMODITY');
    expect(unspscEngine.resolvePCBIMapping({ unspsc: '30263605' } as any).method).toBe('UNSPSC_CLASS');

    // 3. Index forward fill & neutral fallback
    const ffResult = engine.getIndexForDate('PCBI-TEST-001', '2023-10-15');
    expect(ffResult).not.toBeNull();
    expect(ffResult.quality).toBe('B'); // Forward filled receives Quality B

    const neutralResult = engine.getIndexForDate('PCBI-UNKNOWN', '2020-01-01');
    expect(neutralResult.indexValue).toBe(100.0);
    expect(neutralResult.quality).toBe('C');
  });

  it('handles data quality validation issues, missing dates/prices/quantities, and comparable keys', () => {
    const problematicTxs: any[] = [
      {
        id: 'bad-1',
        po_number: 'PO-BAD',
        po_date: '', // Missing date
        material_code: 'MAT-BAD',
        short_text: 'Bad record',
        unit_price: 0, // Zero price
        quantity: 0
      }
    ];

    const res = engine.calculate(problematicTxs);
    expect(res.dataQuality.records_with_errors).toBe(1);
    expect(res.dataQuality.missing_dates_count).toBe(1);
    expect(res.dataQuality.overall_score).toBeLessThan(100);

    // Comparable keys
    const key = engine.generateComparableKey({
      material_code: 'MAT-123',
      uom: 'KG',
      specification: 'SPEC-A',
      grade: 'GR-1',
      brand: 'BR-X'
    } as any);
    expect(key).toBe('MAT-123|KG|SPEC:SPEC-A|GRD:GR-1|BRD:BR-X');
    expect(engine.generateComparableKey({} as any)).toBe('GENERIC|EA');

    // Empty list
    const emptyRes = engine.calculate([]);
    expect(emptyRes.executiveSummary.total_spend_inr).toBe(0);

    // Default constructor
    const def = new PCBICalculationEngine();
    expect(def).toBeDefined();

    // Invalid audit ID
    expect(engine.generateExplainabilityAudit('non-existent-id', [])).toBeNull();
  });
});
