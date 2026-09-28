import type {
  PCBIBenchmarkMaster,
  PCBIClientPurchaseTransaction,
  PCBITransactionCalculation,
  PCBIExecutiveSummary,
  PCBIQualityRating
} from '../types/pcbi';

export function aggregateCategories(
  calculations: PCBITransactionCalculation[],
  benchmarks: Map<string, PCBIBenchmarkMaster>
): PCBIExecutiveSummary['category_aggregations'] {
  const catMap = new Map<string, {
    spend: number;
    opp: number;
    fav: number;
    items: Set<string>;
    quality: PCBIQualityRating;
  }>();

  for (const c of calculations) {
    const bm = benchmarks.get(c.base_pcbi_id);
    const cat = bm?.category || 'General Category';
    const existing = catMap.get(cat) || {
      spend: 0,
      opp: 0,
      fav: 0,
      items: new Set<string>(),
      quality: c.benchmark_quality
    };
    existing.spend += c.actual_price * c.quantity;
    existing.opp += c.opportunity_value;
    existing.fav += c.favourable_variance;
    existing.items.add(c.material_code);
    catMap.set(cat, existing);
  }

  return Array.from(catMap.entries()).map(([category, val]) => ({
    category,
    spend_cr: Number((val.spend / 10000000).toFixed(2)),
    opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
    opportunity_pct: val.spend > 0 ? Number(((val.opp / val.spend) * 100).toFixed(1)) : 0,
    favourable_cr: Number((val.fav / 10000000).toFixed(2)),
    items_count: val.items.size,
    quality: val.quality
  })).sort((a, b) => b.opportunity_cr - a.opportunity_cr);
}

export function aggregateVendors(
  calculations: PCBITransactionCalculation[],
  benchmarks: Map<string, PCBIBenchmarkMaster>
): PCBIExecutiveSummary['vendor_aggregations'] {
  const venMap = new Map<string, {
    spend: number;
    opp: number;
    items: Set<string>;
    gapSum: number;
    count: number;
    topCat: string;
  }>();

  for (const c of calculations) {
    const v = c.vendor || 'Unknown Vendor';
    const bm = benchmarks.get(c.base_pcbi_id);
    const cat = bm?.category || 'General';
    const existing = venMap.get(v) || {
      spend: 0,
      opp: 0,
      items: new Set<string>(),
      gapSum: 0,
      count: 0,
      topCat: cat
    };
    existing.spend += c.actual_price * c.quantity;
    existing.opp += c.opportunity_value;
    existing.items.add(c.material_code);
    if (c.actual_price > 0 && c.price_gap_per_unit > 0) {
      existing.gapSum += (c.price_gap_per_unit / c.actual_price) * 100;
      existing.count++;
    }
    venMap.set(v, existing);
  }

  return Array.from(venMap.entries()).map(([vendor, val]) => ({
    vendor,
    spend_cr: Number((val.spend / 10000000).toFixed(2)),
    opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
    opportunity_pct: val.spend > 0 ? Number(((val.opp / val.spend) * 100).toFixed(1)) : 0,
    items_count: val.items.size,
    avg_price_gap_pct: val.count > 0 ? Number((val.gapSum / val.count).toFixed(1)) : 0,
    top_category: val.topCat
  })).sort((a, b) => b.opportunity_cr - a.opportunity_cr).slice(0, 20);
}

export function aggregateMaterials(
  calculations: PCBITransactionCalculation[],
  benchmarks: Map<string, PCBIBenchmarkMaster>
): PCBIExecutiveSummary['material_aggregations'] {
  const matMap = new Map<string, {
    desc: string;
    cat: string;
    spend: number;
    opp: number;
    baseP: number;
    latestAct: number;
    latestExp: number;
    quality: PCBIQualityRating;
  }>();

  for (const c of calculations) {
    const bm = benchmarks.get(c.base_pcbi_id);
    const cat = bm?.category || 'General';
    const existing = matMap.get(c.material_code) || {
      desc: c.short_text,
      cat,
      spend: 0,
      opp: 0,
      baseP: c.base_price,
      latestAct: c.actual_price,
      latestExp: c.expected_price,
      quality: c.benchmark_quality
    };
    existing.spend += c.actual_price * c.quantity;
    existing.opp += c.opportunity_value;
    existing.latestAct = c.actual_price;
    existing.latestExp = c.expected_price;
    matMap.set(c.material_code, existing);
  }

  return Array.from(matMap.entries()).map(([code, val]) => {
    const trendGap = val.latestExp > 0
      ? Number((((val.latestAct - val.latestExp) / val.latestExp) * 100).toFixed(1))
      : 0;
    return {
      material_code: code,
      short_text: val.desc,
      category: val.cat,
      spend_cr: Number((val.spend / 10000000).toFixed(2)),
      opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
      opportunity_pct: val.spend > 0 ? Number(((val.opp / val.spend) * 100).toFixed(1)) : 0,
      base_price: val.baseP,
      latest_actual_price: val.latestAct,
      latest_expected_price: val.latestExp,
      price_trend_gap_pct: trendGap,
      benchmark_quality: val.quality
    };
  }).sort((a, b) => b.opportunity_cr - a.opportunity_cr).slice(0, 25);
}

export function aggregateMonthlyTrend(
  calculations: PCBITransactionCalculation[]
): PCBIExecutiveSummary['monthly_trend'] {
  const monthMap = new Map<string, {
    spend: number;
    expSpend: number;
    opp: number;
    fav: number;
    idxSum: number;
    count: number;
  }>();

  for (const c of calculations) {
    const monthStr = c.po_date.substring(0, 7);
    const existing = monthMap.get(monthStr) || {
      spend: 0,
      expSpend: 0,
      opp: 0,
      fav: 0,
      idxSum: 0,
      count: 0
    };
    existing.spend += c.actual_price * c.quantity;
    existing.expSpend += c.expected_price * c.quantity;
    existing.opp += c.opportunity_value;
    existing.fav += c.favourable_variance;
    existing.idxSum += c.current_pcbi_index;
    existing.count++;
    monthMap.set(monthStr, existing);
  }

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, val]) => ({
      month_year: month,
      spend_cr: Number((val.spend / 10000000).toFixed(2)),
      expected_spend_cr: Number((val.expSpend / 10000000).toFixed(2)),
      opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
      favourable_cr: Number((val.fav / 10000000).toFixed(2)),
      pcbi_index_avg: val.count > 0 ? Number((val.idxSum / val.count).toFixed(1)) : 100
    }));
}

export function buildExecutiveSummary(
  rawTx: Array<PCBIClientPurchaseTransaction & { spend_category?: string }>,
  calculations: PCBITransactionCalculation[],
  qualityScore: number,
  benchmarks: Map<string, PCBIBenchmarkMaster>
): PCBIExecutiveSummary {
  const totalSpendInr = rawTx.reduce((sum, t) => sum + (t.total_value || (t.quantity * t.unit_price) || 0), 0);
  const totalSpendInrCr = Number((totalSpendInr / 10000000).toFixed(2));

  const totalOppInr = calculations.reduce((sum, c) => sum + (c.opportunity_value || 0), 0);
  const totalOppInrCr = Number((totalOppInr / 10000000).toFixed(2));

  const totalFavInr = calculations.reduce((sum, c) => sum + (c.favourable_variance || 0), 0);
  const totalFavInrCr = Number((totalFavInr / 10000000).toFixed(2));

  const oppPct = totalSpendInr > 0 ? Number(((totalOppInr / totalSpendInr) * 100).toFixed(1)) : 0;

  const categoryAggregations = aggregateCategories(calculations, benchmarks);
  const vendorAggregations = aggregateVendors(calculations, benchmarks);
  const materialAggregations = aggregateMaterials(calculations, benchmarks);
  const monthlyTrend = aggregateMonthlyTrend(calculations);

  const materialSpendInr = rawTx
    .filter((t) => t.spend_category !== 'SERVICES')
    .reduce((sum, t) => sum + (t.total_value || (t.quantity * t.unit_price) || 0), 0);
  const materialSpendInrCr = Number((materialSpendInr / 10000000).toFixed(2));

  const serviceSpendInr = rawTx
    .filter((t) => t.spend_category === 'SERVICES')
    .reduce((sum, t) => sum + (t.total_value || (t.quantity * t.unit_price) || 0), 0);
  const serviceSpendInrCr = Number((serviceSpendInr / 10000000).toFixed(2));

  const benchmarkableSpendInr = calculations.reduce(
    (sum, c) => {
      const calcSpend = c.actual_price * c.quantity * (c.benchmarkability_percent / 100);
      return sum + (c.benchmarkable_spend !== undefined ? c.benchmarkable_spend : calcSpend);
    },
    0
  );
  const benchmarkableSpendInrCr = Number((benchmarkableSpendInr / 10000000).toFixed(2));
  const benchmarkabilityPct = totalSpendInr > 0
    ? Number(((benchmarkableSpendInr / totalSpendInr) * 100).toFixed(1))
    : 70.0;

  const qualityASpend = calculations.filter((c) => c.benchmark_quality === 'A')
    .reduce((sum, c) => sum + c.actual_price * c.quantity, 0);
  const qualityBSpend = calculations.filter((c) => c.benchmark_quality === 'B')
    .reduce((sum, c) => sum + c.actual_price * c.quantity, 0);
  const qualityCSpend = calculations.filter((c) => c.benchmark_quality === 'C')
    .reduce((sum, c) => sum + c.actual_price * c.quantity, 0);
  const notBenchmarkableSpend = Math.max(0, totalSpendInr - benchmarkableSpendInr);

  return {
    total_spend_inr: totalSpendInr,
    total_spend_inr_cr: totalSpendInrCr,
    material_spend_inr: materialSpendInr,
    material_spend_inr_cr: materialSpendInrCr,
    service_spend_inr: serviceSpendInr,
    service_spend_inr_cr: serviceSpendInrCr,
    unspsc_mapped_spend_inr: totalSpendInr,
    unspsc_mapped_spend_inr_cr: totalSpendInrCr,
    unspsc_mapping_percent: 100.0,
    pcbi_mapped_spend_inr: totalSpendInr,
    pcbi_mapped_spend_inr_cr: totalSpendInrCr,
    pcbi_coverage_percent: 100.0,
    mapped_spend_inr: totalSpendInr,
    mapped_spend_inr_cr: totalSpendInrCr,
    mapped_spend_percent: 100.0,
    benchmarkable_spend_inr: benchmarkableSpendInr,
    benchmarkable_spend_inr_cr: benchmarkableSpendInrCr,
    benchmarkable_spend_percent: benchmarkabilityPct,
    benchmarkability_percent: benchmarkabilityPct,
    a_quality_spend_inr_cr: Number((qualityASpend / 10000000).toFixed(2)),
    b_quality_spend_inr_cr: Number((qualityBSpend / 10000000).toFixed(2)),
    c_quality_spend_inr_cr: Number((qualityCSpend / 10000000).toFixed(2)),
    not_benchmarkable_spend_inr_cr: Number((notBenchmarkableSpend / 10000000).toFixed(2)),
    total_opportunity_inr: totalOppInr,
    total_opportunity_inr_cr: totalOppInrCr,
    strategic_sourcing_opportunity_inr_cr: 5.4,
    total_potential_opportunity_inr_cr: Number((totalOppInrCr + 5.4).toFixed(2)),
    validated_savings_inr_cr: 0,
    realized_savings_inr_cr: 0,
    opportunity_percent: oppPct,
    total_favourable_variance_inr: totalFavInr,
    total_favourable_variance_inr_cr: totalFavInrCr,
    total_transactions: rawTx.length,
    benchmarkable_transactions: calculations.length,
    mapping_required_transactions: calculations.filter((c) => c.benchmark_quality === 'C').length,
    data_quality_score: qualityScore,
    category_aggregations: categoryAggregations,
    vendor_aggregations: vendorAggregations,
    material_aggregations: materialAggregations,
    monthly_trend: monthlyTrend
  };
}
