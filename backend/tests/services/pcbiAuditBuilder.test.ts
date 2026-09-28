import { describe, it, expect } from 'vitest';
import { buildExplainabilityAudit } from '../../src/services/pcbiAuditBuilder';
import type { PCBITransactionCalculation, PCBIBenchmarkMaster } from '../../src/types/pcbi';

describe('pcbiAuditBuilder (backend/src/services/pcbiAuditBuilder.ts)', () => {
  const mockBenchmark: PCBIBenchmarkMaster = {
    pcbi_id: 'PCBI-STEEL-001',
    benchmark_name: 'Structural Steel Index',
    category: 'Metals & Mining',
    sub_category: 'Carbon Steel',
    commodity_type: 'RAW_MATERIAL',
    publisher: 'JPC',
    frequency: 'MONTHLY',
    geography: 'INDIA',
    unit_of_measure: 'MT',
    currency: 'INR',
    base_year: 2024,
    base_month: 4,
    base_index_value: 100,
    current_index_value: 110,
    current_period: '2026-06',
    historical_points_count: 24,
    data_quality_score: 95,
    methodology: 'WEIGHTED_BASKET',
    is_active: true
  };

  const benchmarksMap = new Map<string, PCBIBenchmarkMaster>();
  benchmarksMap.set('PCBI-STEEL-001', mockBenchmark);

  const baseCalc: PCBITransactionCalculation = {
    id: 'calc-001',
    transaction_id: 'tx-001',
    po_number: 'PO-1001',
    material_code: 'MAT-STEEL',
    short_text: 'Steel Beams IS 2062',
    vendor: 'Tata Steel',
    sector: 'Manufacturing',
    base_pcbi_id: 'PCBI-STEEL-001',
    base_po_number: 'PO-BASE',
    base_date: '2024-04-01',
    base_price: 150,
    base_pcbi_index: 105,
    current_date: '2026-06-01',
    actual_price: 180,
    current_pcbi_index: 110,
    quantity: 10000,
    benchmarkability_percent: 70,
    residual_percent: 30,
    expected_price: 157.14,
    price_gap_per_unit: 22.86,
    opportunity_value: 160020,
    gross_opportunity: 228600,
    favourable_variance: 0,
    benchmark_quality: 'HIGH',
    calculation_method: 'SINGLE_BENCHMARK',
    is_favourable: false,
    spend: 1800000,
    benchmarkable_spend: 1260000
  };

  it('should return null if calculation is not found', () => {
    const result = buildExplainabilityAudit('unknown-id', [baseCalc], benchmarksMap);
    expect(result).toBeNull();
  });

  it('should build standard explainability audit report with en-IN formatting', () => {
    const result = buildExplainabilityAudit('calc-001', [baseCalc], benchmarksMap);
    expect(result).not.toBeNull();
    expect(result!.transaction_id).toBe('tx-001');
    expect(result!.expected_price).toBe(157.14);
    expect(result!.formula_display).toContain('157.14');
    expect(result!.formula_display).toContain('22.86');
    expect(result!.formula_display).toMatch(/2,?28,?600/);
    expect(result!.formula_display).toMatch(/1,?60,?020/);
    expect(result!.opportunity_value_lakhs).toBe(1.6);
    expect(result!.opportunity_value_crores).toBe(0.016);
  });

  it('should build composite benchmark audit when calculation_method is COMPOSITE_BENCHMARK', () => {
    const compositeCalc: PCBITransactionCalculation = {
      ...baseCalc,
      id: 'calc-comp',
      transaction_id: 'tx-comp',
      calculation_method: 'COMPOSITE_BENCHMARK',
      gross_opportunity: undefined,
      component_breakdowns: [
        {
          component_name: 'Steel',
          weight_percent: 60,
          base_component_cost: 600,
          base_index: 100,
          current_index: 110,
          current_component_cost: 660
        }
      ]
    };

    const result = buildExplainabilityAudit('calc-comp', [compositeCalc], benchmarksMap);
    expect(result).not.toBeNull();
    expect(result!.is_composite).toBe(true);
    expect(result!.formula_display).toContain('Expected Price = SUM');
    expect(result!.components?.length).toBe(1);
    expect(result!.components?.[0].movement_pct).toBe(10);
  });

  it('should handle missing benchmark map entry gracefully', () => {
    const unknownBenchmarkCalc: PCBITransactionCalculation = {
      ...baseCalc,
      id: 'calc-unknown',
      base_pcbi_id: 'PCBI-NON-EXISTENT'
    };

    const emptyMap = new Map<string, PCBIBenchmarkMaster>();
    const result = buildExplainabilityAudit('calc-unknown', [unknownBenchmarkCalc], emptyMap);
    expect(result).not.toBeNull();
    expect(result!.category).toBe('General');
    expect(result!.benchmark_name).toBe('Standard Benchmark');
  });
});
