/**
 * PCBI (Procucev Benchmark Intelligence) Centralized Calculation Engine
 * Reusable across multi-sector industrial procurement datasets.
 */

import type {
  PCBIBenchmarkMaster,
  PCBIBenchmarkComponent,
  PCBIWeeklyIndex,
  PCBIUNSPSCMapping,
  PCBIClientPurchaseTransaction,
  PCBIBasePurchase,
  PCBITransactionCalculation,
  PCBIComponentCalculation,
  PCBIExplainabilityAudit,
  PCBIDataQualityReport,
  PCBIExecutiveSummary,
  PCBIQualityRating
} from '../types/pcbi';
import {
  getMondayOfWeek,
  generateComparableKey,
  getIndexForDate,
  resolvePCBIMapping,
  analyzeDataQuality
} from './pcbiIndexResolver';
import { buildExecutiveSummary } from './pcbiSummaryBuilder';
import { buildExplainabilityAudit } from './pcbiAuditBuilder';
import { calculateCompositeCost } from './pcbiCompositeEngine';

export class PCBICalculationEngine {
  private benchmarks: Map<string, PCBIBenchmarkMaster> = new Map();
  private components: Map<string, PCBIBenchmarkComponent[]> = new Map();
  private weeklyIndices: Map<string, PCBIWeeklyIndex> = new Map();
  private unspscMappings: Map<string, PCBIUNSPSCMapping> = new Map();

  constructor(
    benchmarks: PCBIBenchmarkMaster[] = [],
    components: PCBIBenchmarkComponent[] = [],
    weeklyIndices: PCBIWeeklyIndex[] = [],
    unspscMappings: PCBIUNSPSCMapping[] = []
  ) {
    this.initMasterData(benchmarks, components, weeklyIndices, unspscMappings);
  }

  public initMasterData(
    benchmarks: PCBIBenchmarkMaster[],
    components: PCBIBenchmarkComponent[],
    weeklyIndices: PCBIWeeklyIndex[],
    unspscMappings: PCBIUNSPSCMapping[]
  ): void {
    this.benchmarks.clear();
    this.components.clear();
    this.weeklyIndices.clear();
    this.unspscMappings.clear();

    for (const bm of benchmarks) {
      if (bm.active) this.benchmarks.set(bm.pcbi_id, bm);
    }
    for (const comp of components) {
      if (comp.active) {
        const list = this.components.get(comp.pcbi_id) || [];
        list.push(comp);
        this.components.set(comp.pcbi_id, list);
      }
    }
    for (const idx of weeklyIndices) {
      const key = idx.component_id
        ? `${idx.pcbi_id}:${idx.component_id}:${idx.week_start}`
        : `${idx.pcbi_id}:${idx.week_start}`;
      this.weeklyIndices.set(key, idx);
    }
    for (const map of unspscMappings) {
      if (map.active) this.unspscMappings.set(map.unspsc_code, map);
    }
  }

  public getMondayOfWeek(dateStr: string): string {
    return getMondayOfWeek(dateStr);
  }

  public generateComparableKey(tx: Partial<PCBIClientPurchaseTransaction>): string {
    return generateComparableKey(tx);
  }

  public getIndexForDate(
    pcbiId: string,
    dateStr: string,
    componentId?: string
  ): { indexValue: number; source: string; quality: PCBIQualityRating } | null {
    return getIndexForDate(this.weeklyIndices, pcbiId, dateStr, componentId);
  }

  public resolvePCBIMapping(
    tx: PCBIClientPurchaseTransaction
  ): { pcbiId: string; quality: PCBIQualityRating; method: string } {
    return resolvePCBIMapping(this.unspscMappings, tx);
  }

  public calculate(transactions: PCBIClientPurchaseTransaction[]): {
    calculations: PCBITransactionCalculation[];
    basePurchases: PCBIBasePurchase[];
    dataQuality: PCBIDataQualityReport;
    executiveSummary: PCBIExecutiveSummary;
  } {
    const dataQuality = analyzeDataQuality(transactions, this.unspscMappings);
    const validTransactions = transactions
      .filter((t) => t.quantity > 0 && t.unit_price > 0 && Boolean(t.po_date))
      .sort((a, b) => new Date(a.po_date).getTime() - new Date(b.po_date).getTime());

    const basePurchasesMap = new Map<string, PCBIBasePurchase>();
    const basePurchasesList: PCBIBasePurchase[] = [];
    const calculations: PCBITransactionCalculation[] = [];

    for (const tx of validTransactions) {
      const compKey = tx.comparable_key || this.generateComparableKey(tx);
      const benchmarkInfo = this.resolveTxBenchmark(tx);

      if (!basePurchasesMap.has(compKey)) {
        const { baseRec, calcRow } = this.createBasePurchase(tx, compKey, benchmarkInfo);
        basePurchasesMap.set(compKey, baseRec);
        basePurchasesList.push(baseRec);
        calculations.push(calcRow);
      } else {
        const baseRec = basePurchasesMap.get(compKey);
        if (baseRec) {
          const calcRow = this.calculateSubsequentPurchase(tx, compKey, baseRec, benchmarkInfo);
          calculations.push(calcRow);
        }
      }
    }

    const executiveSummary = buildExecutiveSummary(
      transactions,
      calculations,
      dataQuality.overall_score,
      this.benchmarks
    );

    return { calculations, basePurchases: basePurchasesList, dataQuality, executiveSummary };
  }

  private resolveTxBenchmark(tx: PCBIClientPurchaseTransaction): {
    benchmark: PCBIBenchmarkMaster;
    quality: PCBIQualityRating;
    currentIndex: number;
    benchmarkability: number;
    residualPct: number;
  } {
    const explicitPcbiId = tx.pcbi_id;
    const mapping = explicitPcbiId && this.benchmarks.has(explicitPcbiId)
      ? {
        pcbiId: explicitPcbiId,
        quality: (this.benchmarks.get(explicitPcbiId)?.quality_rating || 'A') as PCBIQualityRating
      }
      : this.resolvePCBIMapping(tx);

    const benchmark = this.benchmarks.get(mapping.pcbiId)
      || this.benchmarks.get('PCBI-STEEL-001')
      || Array.from(this.benchmarks.values())[0];
    const indexInfo = benchmark ? this.getIndexForDate(benchmark.pcbi_id, tx.po_date) : null;
    const currentIndex = indexInfo ? indexInfo.indexValue : 100.0;
    const benchmarkability = benchmark?.benchmarkability_percent !== undefined
      ? benchmark.benchmarkability_percent
      : 70;
    const residualPct = benchmark?.residual_percent !== undefined
      ? benchmark.residual_percent
      : Math.max(0, 100 - benchmarkability);

    return { benchmark, quality: mapping.quality, currentIndex, benchmarkability, residualPct };
  }

  private createBasePurchase(
    tx: PCBIClientPurchaseTransaction,
    compKey: string,
    info: ReturnType<PCBICalculationEngine['resolveTxBenchmark']>
  ): { baseRec: PCBIBasePurchase; calcRow: PCBITransactionCalculation } {
    const benchmarkId = info.benchmark ? info.benchmark.pcbi_id : 'PCBI-GENERIC-001';
    const baseRec: PCBIBasePurchase = {
      id: `base-${compKey}-${tx.id}`,
      comparable_key: compKey,
      transaction_id: tx.id,
      po_number: tx.po_number,
      material_code: tx.material_code,
      short_text: tx.short_text,
      vendor: tx.vendor || 'Generic Vendor',
      base_date: tx.po_date,
      base_price: Number(tx.unit_price.toFixed(2)),
      base_quantity: tx.quantity,
      base_pcbi_id: benchmarkId,
      base_pcbi_index: info.currentIndex,
      benchmarkability_percent: info.benchmarkability,
      base_version: 1,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    const baseBenchSpend = Number(((tx.unit_price * tx.quantity) * (info.benchmarkability / 100)).toFixed(2));
    const calcRow: PCBITransactionCalculation = {
      id: `calc-${tx.id}`,
      transaction_id: tx.id,
      po_number: tx.po_number,
      po_date: tx.po_date,
      material_code: tx.material_code,
      short_text: tx.short_text,
      vendor: tx.vendor || 'Generic Vendor',
      plant: tx.plant || 'Main Plant',
      sector: tx.sector || 'Industrial',
      comparable_key: compKey,
      base_transaction_id: tx.id,
      base_po_number: tx.po_number,
      base_date: tx.po_date,
      base_price: Number(tx.unit_price.toFixed(2)),
      base_pcbi_id: benchmarkId,
      base_pcbi_index: info.currentIndex,
      current_date: tx.po_date,
      current_pcbi_index: info.currentIndex,
      benchmarkability_percent: info.benchmarkability,
      residual_percent: info.residualPct,
      expected_price: Number(tx.unit_price.toFixed(2)),
      actual_price: Number(tx.unit_price.toFixed(2)),
      price_gap_per_unit: 0,
      price_gap_pct: 0,
      gross_opportunity: 0,
      benchmarkable_spend: baseBenchSpend,
      quantity: tx.quantity,
      opportunity_value: 0,
      favourable_variance: 0,
      benchmark_quality: info.quality,
      calculation_method: info.benchmark?.benchmark_type === 'COMPOSITE'
        ? 'COMPOSITE_BENCHMARK'
        : 'SINGLE_BENCHMARK',
      calculation_status: 'BASE_RECORD',
      created_at: new Date().toISOString()
    };

    return { baseRec, calcRow };
  }

  private calculateSubsequentPurchase(
    tx: PCBIClientPurchaseTransaction,
    compKey: string,
    baseRec: PCBIBasePurchase,
    info: ReturnType<PCBICalculationEngine['resolveTxBenchmark']>
  ): PCBITransactionCalculation {
    const P0 = baseRec.base_price;
    const I0 = baseRec.base_pcbi_index > 0 ? baseRec.base_pcbi_index : 100.0;
    const I1 = info.currentIndex;
    const benchPercent = baseRec.benchmarkability_percent !== undefined
      ? baseRec.benchmarkability_percent
      : 70;
    const actualPrice = Number(tx.unit_price.toFixed(2));
    const currentResidualPct = info.benchmark?.residual_percent !== undefined
      ? info.benchmark.residual_percent
      : Math.max(0, 100 - benchPercent);

    let expectedPrice = 0;
    let componentBreakdowns: PCBIComponentCalculation[] | undefined;

    if (info.benchmark?.benchmark_type === 'COMPOSITE') {
      const { price, breakdowns } = calculateCompositeCost(
        info.benchmark.pcbi_id,
        this.components,
        (pid, d, cid) => this.getIndexForDate(pid, d, cid),
        tx,
        P0,
        baseRec.base_date,
        currentResidualPct
      );
      expectedPrice = price;
      componentBreakdowns = breakdowns;
    } else {
      expectedPrice = Number((P0 * (I1 / I0)).toFixed(2));
    }

    const priceGap = Math.max(0, Number((actualPrice - expectedPrice).toFixed(2)));
    const priceGapPct = expectedPrice > 0 ? Number(((priceGap / expectedPrice) * 100).toFixed(2)) : 0;
    const grossOpportunity = Number((priceGap * tx.quantity).toFixed(2));
    const opportunityValue = Number((grossOpportunity * (benchPercent / 100)).toFixed(2));
    const favourableVariance = Math.max(0, Number(((expectedPrice - actualPrice) * tx.quantity).toFixed(2)));
    const benchmarkableSpend = Number(((actualPrice * tx.quantity) * (benchPercent / 100)).toFixed(2));

    return {
      id: `calc-${tx.id}`,
      transaction_id: tx.id,
      po_number: tx.po_number,
      po_date: tx.po_date,
      material_code: tx.material_code,
      short_text: tx.short_text,
      vendor: tx.vendor || 'Generic Vendor',
      plant: tx.plant || 'Main Plant',
      sector: tx.sector || 'Industrial',
      comparable_key: compKey,
      base_transaction_id: baseRec.transaction_id,
      base_po_number: baseRec.po_number,
      base_date: baseRec.base_date,
      base_price: baseRec.base_price,
      base_pcbi_id: baseRec.base_pcbi_id,
      base_pcbi_index: baseRec.base_pcbi_index,
      current_date: tx.po_date,
      current_pcbi_index: I1,
      benchmarkability_percent: benchPercent,
      residual_percent: currentResidualPct,
      expected_price: expectedPrice,
      actual_price: actualPrice,
      price_gap_per_unit: priceGap,
      price_gap_pct: priceGapPct,
      gross_opportunity: grossOpportunity,
      benchmarkable_spend: benchmarkableSpend,
      quantity: tx.quantity,
      opportunity_value: opportunityValue,
      favourable_variance: favourableVariance,
      benchmark_quality: info.quality,
      calculation_method: info.benchmark?.benchmark_type === 'COMPOSITE'
        ? 'COMPOSITE_BENCHMARK'
        : 'SINGLE_BENCHMARK',
      calculation_status: 'SUCCESS',
      component_breakdowns: componentBreakdowns,
      created_at: new Date().toISOString()
    };
  }

  public generateExplainabilityAudit(
    calcId: string,
    calculations: PCBITransactionCalculation[]
  ): PCBIExplainabilityAudit | null {
    return buildExplainabilityAudit(calcId, calculations, this.benchmarks);
  }
}
