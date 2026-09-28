import type {
  PCBIBenchmarkMaster,
  PCBITransactionCalculation,
  PCBIExplainabilityAudit
} from '../types/pcbi';

export function buildExplainabilityAudit(
  calcId: string,
  calculations: PCBITransactionCalculation[],
  benchmarks: Map<string, PCBIBenchmarkMaster>
): PCBIExplainabilityAudit | null {
  const calc = calculations.find((c) => c.id === calcId || c.transaction_id === calcId);
  if (!calc) return null;

  const benchmark = benchmarks.get(calc.base_pcbi_id)
    || benchmarks.get('PCBI-STEEL-001')
    || Array.from(benchmarks.values())[0];
  const P0 = calc.base_price;
  const I0 = calc.base_pcbi_index;
  const I1 = calc.current_pcbi_index;
  const B = calc.benchmarkability_percent / 100;

  const residualVal = Number((P0 * (1 - B)).toFixed(2));
  const benchmarkVal = Number((P0 * B * (I1 / I0)).toFixed(2));
  const isComposite = calc.calculation_method === 'COMPOSITE_BENCHMARK';

  const components = calc.component_breakdowns?.map((c) => ({
    name: c.component_name,
    weight: c.weight_percent,
    base_cost: c.base_component_cost,
    base_index: c.base_index,
    current_index: c.current_index,
    movement_pct: Number((((c.current_index - c.base_index) / c.base_index) * 100).toFixed(1)),
    current_cost: c.current_component_cost
  }));

  const grossOpp = calc.gross_opportunity !== undefined
    ? calc.gross_opportunity
    : Number((calc.price_gap_per_unit * calc.quantity).toFixed(2));

  const expFmt = calc.expected_price.toLocaleString('en-IN');
  const actFmt = calc.actual_price.toLocaleString('en-IN');
  const gapFmt = calc.price_gap_per_unit.toLocaleString('en-IN');
  const oppFmt = calc.opportunity_value.toLocaleString('en-IN');
  const qtyFmt = calc.quantity.toLocaleString('en-IN');
  const grossOppFmt = grossOpp.toLocaleString('en-IN');

  const formulaDisplay = isComposite
    ? `Expected Price = SUM(Base_Comp_i * (Current_Index_i / Base_Index_i)) + Residual = ₹${expFmt}`
    : `Expected Benchmark Price = Baseline Price × (${I1} / ${I0}) = ₹${expFmt} | `
      + `Price Gap = ₹${actFmt} - ₹${expFmt} = ₹${gapFmt} | `
      + `Gross Opportunity = ₹${gapFmt} × ${qtyFmt} = ₹${grossOppFmt} | `
      + `PCBI Potential Opportunity = ₹${oppFmt}`;

  return {
    transaction_id: calc.transaction_id,
    po_number: calc.po_number,
    material_code: calc.material_code,
    material_description: calc.short_text,
    vendor: calc.vendor,
    sector: calc.sector,
    category: benchmark ? benchmark.category : 'General',
    pcbi_id: benchmark ? benchmark.pcbi_id : calc.base_pcbi_id,
    benchmark_name: benchmark ? benchmark.benchmark_name : 'Standard Benchmark',
    quality_rating: calc.benchmark_quality,
    base_purchase: {
      po_number: calc.base_po_number,
      date: calc.base_date,
      price: calc.base_price,
      pcbi_index: calc.base_pcbi_index,
      quantity: calc.quantity
    },
    current_purchase: {
      po_number: calc.po_number,
      date: calc.current_date,
      price: calc.actual_price,
      pcbi_index: calc.current_pcbi_index,
      quantity: calc.quantity
    },
    benchmarkability_percent: calc.benchmarkability_percent,
    residual_percent: calc.residual_percent,
    formula_display: formulaDisplay,
    residual_component_value: residualVal,
    benchmark_adjusted_component_value: benchmarkVal,
    expected_price: calc.expected_price,
    actual_price: calc.actual_price,
    price_gap_per_unit: calc.price_gap_per_unit,
    quantity: calc.quantity,
    opportunity_value: calc.opportunity_value,
    opportunity_value_lakhs: Number((calc.opportunity_value / 100000).toFixed(2)),
    opportunity_value_crores: Number((calc.opportunity_value / 10000000).toFixed(4)),
    favourable_variance: calc.favourable_variance,
    favourable_variance_lakhs: Number((calc.favourable_variance / 100000).toFixed(2)),
    favourable_variance_crores: Number((calc.favourable_variance / 10000000).toFixed(4)),
    is_composite: isComposite,
    components
  };
}
