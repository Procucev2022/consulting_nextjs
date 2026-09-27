/**
 * PCBI (Procucev Benchmark Intelligence) Centralized Calculation Engine
 * Reusable across multi-sector industrial procurement datasets.
 * 
 * Complies with strict PCBI specifications:
 * 1. Client First Valid Comparable Purchase = BASE PURCHASE (Fixed base across subsequent periods).
 * 2. Expected Price: P0 * (1-B) + P0 * B * (I1 / I0)
 * 3. Composite Price: SUM(Base_Comp_i * (I1_i / I0_i)) + Residual
 * 4. Opportunity: MAX(0, Actual - Expected) * Qty
 * 5. Favourable Variance: MAX(0, Expected - Actual) * Qty (Tracked separately).
 * 6. Explainable audit trail for every transaction.
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
      if (bm.active) {
        this.benchmarks.set(bm.pcbi_id, bm);
      }
    }

    for (const comp of components) {
      if (comp.active) {
        const list = this.components.get(comp.pcbi_id) || [];
        list.push(comp);
        this.components.set(comp.pcbi_id, list);
      }
    }

    for (const idx of weeklyIndices) {
      // Key: `pcbi_id:week_start` or `pcbi_id:comp_id:week_start`
      const key = idx.component_id
        ? `${idx.pcbi_id}:${idx.component_id}:${idx.week_start}`
        : `${idx.pcbi_id}:${idx.week_start}`;
      this.weeklyIndices.set(key, idx);
    }

    for (const map of unspscMappings) {
      if (map.active) {
        this.unspscMappings.set(map.unspsc_code, map);
      }
    }
  }

  /**
   * Helper: Given a date string (YYYY-MM-DD), find the Monday of that week
   */
  public getMondayOfWeek(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2023-01-02';
    const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Helper: Build deterministic comparable key
   */
  public generateComparableKey(tx: Partial<PCBIClientPurchaseTransaction>): string {
    const matCode = (tx.material_code || 'GENERIC').trim().toUpperCase();
    const uom = (tx.uom || 'EA').trim().toUpperCase();
    const spec = (tx.specification || '').trim().toUpperCase();
    const grade = (tx.grade || '').trim().toUpperCase();
    const brand = (tx.brand || '').trim().toUpperCase();

    const parts = [matCode, uom];
    if (spec) parts.push(`SPEC:${spec}`);
    if (grade) parts.push(`GRD:${grade}`);
    if (brand) parts.push(`BRD:${brand}`);
    return parts.join('|');
  }

  /**
   * Helper: Retrieve weekly index value with forward-fill fallback if necessary
   */
  public getIndexForDate(pcbiId: string, dateStr: string, componentId?: string): { indexValue: number; source: string; quality: PCBIQualityRating } | null {
    const monday = this.getMondayOfWeek(dateStr);
    const key = componentId ? `${pcbiId}:${componentId}:${monday}` : `${pcbiId}:${monday}`;
    const directMatch = this.weeklyIndices.get(key);

    if (directMatch) {
      return {
        indexValue: directMatch.index_value,
        source: directMatch.source,
        quality: directMatch.quality_rating
      };
    }

    // Fallback: search closest preceding index
    let latestBefore: PCBIWeeklyIndex | null = null;
    for (const item of this.weeklyIndices.values()) {
      if (componentId) {
        if (item.pcbi_id === pcbiId && item.component_id === componentId && item.week_start <= monday) {
          if (!latestBefore || item.week_start > latestBefore.week_start) {
            latestBefore = item;
          }
        }
      } else {
        if (item.pcbi_id === pcbiId && !item.component_id && item.week_start <= monday) {
          if (!latestBefore || item.week_start > latestBefore.week_start) {
            latestBefore = item;
          }
        }
      }
    }

    if (latestBefore) {
      return {
        indexValue: latestBefore.index_value,
        source: `${latestBefore.source} (Forward-Filled from ${latestBefore.week_start})`,
        quality: 'B'
      };
    }

    // Default neutral index
    return { indexValue: 100.0, source: 'Base Baseline (100.0)', quality: 'C' };
  }

  /**
   * Categorization Engine: Level 1 (UNSPSC Commodity) -> Level 2 (Class) -> Level 3 (AI/Text) -> Level 4 (Default)
   */
  public resolvePCBIMapping(tx: PCBIClientPurchaseTransaction): { pcbiId: string; quality: PCBIQualityRating; method: string } {
    if (tx.unspsc) {
      const cleanUnspsc = tx.unspsc.trim();
      // Level 1: Exact Commodity (8-digits)
      const commodityMap = this.unspscMappings.get(cleanUnspsc);
      if (commodityMap) {
        return { pcbiId: commodityMap.pcbi_id, quality: commodityMap.quality_rating, method: 'UNSPSC_COMMODITY' };
      }

      // Level 2: Class (first 6-digits + '00')
      if (cleanUnspsc.length >= 6) {
        const classCode = cleanUnspsc.substring(0, 6) + '00';
        const classMap = this.unspscMappings.get(classCode);
        if (classMap) {
          return { pcbiId: classMap.pcbi_id, quality: 'B', method: 'UNSPSC_CLASS' };
        }
      }
    }

    // Level 3: Short text heuristic matching
    const desc = `${tx.short_text || ''} ${tx.material_code || ''}`.toLowerCase();
    if (desc.includes('bearing') || desc.includes('roller') || desc.includes('ball bearing') || desc.includes('skf') || desc.includes('fag')) {
      return { pcbiId: 'PCBI-BRG-COMP-001', quality: 'A', method: 'AI_TEXT_CLASSIFICATION' };
    }
    if (desc.includes('steel') || desc.includes('plate') || desc.includes('sheet') || desc.includes('hrc') || desc.includes('structural') || desc.includes('liner')) {
      return { pcbiId: 'PCBI-STEEL-001', quality: 'A', method: 'AI_TEXT_CLASSIFICATION' };
    }
    if (desc.includes('caustic') || desc.includes('soda') || desc.includes('naoh') || desc.includes('lye') || desc.includes('chemical')) {
      return { pcbiId: 'PCBI-CHEM-CAUSTIC-001', quality: 'A', method: 'AI_TEXT_CLASSIFICATION' };
    }
    if (desc.includes('coal') || desc.includes('fuel') || desc.includes('thermal') || desc.includes('boiler')) {
      return { pcbiId: 'PCBI-ENERGY-COAL-001', quality: 'A', method: 'AI_TEXT_CLASSIFICATION' };
    }
    if (desc.includes('bag') || desc.includes('hdpe') || desc.includes('polymer') || desc.includes('sack') || desc.includes('packaging')) {
      return { pcbiId: 'PCBI-POLY-HDPE-001', quality: 'A', method: 'AI_TEXT_CLASSIFICATION' };
    }
    if (desc.includes('cable') || desc.includes('wire') || desc.includes('conductor') || desc.includes('copper')) {
      return { pcbiId: 'PCBI-ELEC-CABLE-001', quality: 'A', method: 'AI_TEXT_CLASSIFICATION' };
    }
    if (desc.includes('lubricant') || desc.includes('oil') || desc.includes('hydraulic') || desc.includes('grease')) {
      return { pcbiId: 'PCBI-LUB-OIL-001', quality: 'B', method: 'AI_TEXT_CLASSIFICATION' };
    }
    if (desc.includes('refractory') || desc.includes('brick') || desc.includes('alumina') || desc.includes('kiln')) {
      return { pcbiId: 'PCBI-REFRAC-001', quality: 'B', method: 'AI_TEXT_CLASSIFICATION' };
    }

    // Default fallback
    return { pcbiId: 'PCBI-STEEL-001', quality: 'C', method: 'SECTOR_DEFAULT_PROXY' };
  }

  /**
   * Execute full calculation on a batch of client purchase transactions
   */
  public calculate(transactions: PCBIClientPurchaseTransaction[]): {
    calculations: PCBITransactionCalculation[];
    basePurchases: PCBIBasePurchase[];
    dataQuality: PCBIDataQualityReport;
    executiveSummary: PCBIExecutiveSummary;
  } {
    // 1. Data Quality Analysis
    const dataQuality = this.analyzeDataQuality(transactions);

    // 2. Filter & Sort Transactions chronologically (PO Date Ascending)
    const validTransactions = transactions
      .filter((t) => t.quantity > 0 && t.unit_price > 0 && Boolean(t.po_date))
      .sort((a, b) => new Date(a.po_date).getTime() - new Date(b.po_date).getTime());

    // 3. Group by Comparable Key & Identify Fixed Base Purchases
    const basePurchasesMap = new Map<string, PCBIBasePurchase>();
    const basePurchasesList: PCBIBasePurchase[] = [];
    const calculations: PCBITransactionCalculation[] = [];

    for (const tx of validTransactions) {
      const compKey = tx.comparable_key || this.generateComparableKey(tx);
      const mapping = this.resolvePCBIMapping(tx);
      const benchmark = this.benchmarks.get(mapping.pcbiId) || this.benchmarks.get('PCBI-STEEL-001') || Array.from(this.benchmarks.values())[0];
      const indexInfo = benchmark ? this.getIndexForDate(benchmark.pcbi_id, tx.po_date) : null;
      const currentPCBIIndex = indexInfo ? indexInfo.indexValue : 100.0;
      const benchmarkId = benchmark ? benchmark.pcbi_id : 'PCBI-GENERIC-001';
      const benchmarkability = benchmark?.benchmarkability_percent !== undefined ? benchmark.benchmarkability_percent : 70;
      const residualPct = benchmark?.residual_percent !== undefined ? benchmark.residual_percent : Math.max(0, 100 - benchmarkability);

      if (!basePurchasesMap.has(compKey)) {
        // This is the FIRST VALID PURCHASE -> becomes the BASE PURCHASE
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
          base_pcbi_index: currentPCBIIndex,
          benchmarkability_percent: benchmarkability,
          base_version: 1,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        };
        basePurchasesMap.set(compKey, baseRec);
        basePurchasesList.push(baseRec);

        // Record Base Calculation Row
        calculations.push({
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
          base_pcbi_index: currentPCBIIndex,
          current_date: tx.po_date,
          current_pcbi_index: currentPCBIIndex,
          benchmarkability_percent: benchmarkability,
          residual_percent: residualPct,
          expected_price: Number(tx.unit_price.toFixed(2)),
          actual_price: Number(tx.unit_price.toFixed(2)),
          price_gap_per_unit: 0,
          quantity: tx.quantity,
          opportunity_value: 0,
          favourable_variance: 0,
          benchmark_quality: mapping.quality,
          calculation_method: benchmark?.benchmark_type === 'COMPOSITE' ? 'COMPOSITE_BENCHMARK' : 'SINGLE_BENCHMARK',
          calculation_status: 'BASE_RECORD',
          created_at: new Date().toISOString()
        });
      } else {
        // Subsequent Purchase: Compare against the FIXED BASE PURCHASE
        const baseRec = basePurchasesMap.get(compKey)!;
        const P0 = baseRec.base_price;
        const I0 = baseRec.base_pcbi_index > 0 ? baseRec.base_pcbi_index : 100.0;
        const I1 = currentPCBIIndex;
        const benchPercent = baseRec.benchmarkability_percent !== undefined ? baseRec.benchmarkability_percent : 70;
        const B = benchPercent / 100;
        const actualPrice = Number(tx.unit_price.toFixed(2));
        const currentResidualPct = benchmark?.residual_percent !== undefined ? benchmark.residual_percent : Math.max(0, 100 - benchPercent);

        let expectedPrice = 0;
        let componentBreakdowns: PCBIComponentCalculation[] | undefined = undefined;

        if (benchmark?.benchmark_type === 'COMPOSITE') {
          // Composite Benchmark calculation
          const comps = this.components.get(benchmarkId) || [];
          let currentCompCostsSum = 0;
          componentBreakdowns = [];

          for (const comp of comps) {
            const weight = comp.weight_percent / 100;
            const baseCompCost = P0 * weight;
            const baseCompIdx = this.getIndexForDate(benchmarkId, baseRec.base_date, comp.id)?.indexValue || 100;
            const currCompIdx = this.getIndexForDate(benchmarkId, tx.po_date, comp.id)?.indexValue || 100;
            const movementRatio = baseCompIdx > 0 ? currCompIdx / baseCompIdx : 1;
            const currentCompCost = baseCompCost * movementRatio;
            currentCompCostsSum += currentCompCost;

            componentBreakdowns.push({
              transaction_id: tx.id,
              component_id: comp.id,
              component_name: comp.component_name,
              base_component_cost: Number(baseCompCost.toFixed(2)),
              base_index: baseCompIdx,
              current_index: currCompIdx,
              index_movement_ratio: Number(movementRatio.toFixed(4)),
              current_component_cost: Number(currentCompCost.toFixed(2)),
              weight_percent: comp.weight_percent
            });
          }

          const residualCost = P0 * (currentResidualPct / 100);
          expectedPrice = Number((currentCompCostsSum + residualCost).toFixed(2));
        } else {
          // Single Benchmark Formula: P0 * (1 - B) + P0 * B * (I1 / I0)
          const residualCost = P0 * (1 - B);
          const benchmarkAdjustedCost = P0 * B * (I1 / I0);
          expectedPrice = Number((residualCost + benchmarkAdjustedCost).toFixed(2));
        }

        // Strict non-negative opportunity and distinct favorable variance
        const priceGap = Math.max(0, Number((actualPrice - expectedPrice).toFixed(2)));
        const opportunityValue = Number((priceGap * tx.quantity).toFixed(2));
        const favourableVariance = Math.max(0, Number(((expectedPrice - actualPrice) * tx.quantity).toFixed(2)));

        calculations.push({
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
          benchmarkability_percent: benchmark.benchmarkability_percent,
          residual_percent: benchmark.residual_percent,
          expected_price: expectedPrice,
          actual_price: actualPrice,
          price_gap_per_unit: priceGap,
          quantity: tx.quantity,
          opportunity_value: opportunityValue,
          favourable_variance: favourableVariance,
          benchmark_quality: mapping.quality,
          calculation_method: benchmark.benchmark_type === 'COMPOSITE' ? 'COMPOSITE_BENCHMARK' : 'SINGLE_BENCHMARK',
          calculation_status: 'SUCCESS',
          component_breakdowns: componentBreakdowns,
          created_at: new Date().toISOString()
        });
      }
    }

    // 4. Generate Executive Summary & Aggregations
    const executiveSummary = this.buildExecutiveSummary(transactions, calculations, dataQuality.overall_score);

    return {
      calculations,
      basePurchases: basePurchasesList,
      dataQuality,
      executiveSummary
    };
  }

  /**
   * Explainability Audit: Detailed step-by-step mathematical proof for a calculation
   */
  public generateExplainabilityAudit(calcId: string, calculations: PCBITransactionCalculation[]): PCBIExplainabilityAudit | null {
    const calc = calculations.find((c) => c.id === calcId || c.transaction_id === calcId);
    if (!calc) return null;

    const benchmark = this.benchmarks.get(calc.base_pcbi_id) || this.benchmarks.get('PCBI-STEEL-001')!;
    const P0 = calc.base_price;
    const I0 = calc.base_pcbi_index;
    const I1 = calc.current_pcbi_index;
    const B = calc.benchmarkability_percent / 100;
    const residual = 1 - B;

    const residualVal = Number((P0 * residual).toFixed(2));
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

    const formulaDisplay = isComposite
      ? `Expected Price = SUM(Base_Comp_i * (Current_Index_i / Base_Index_i)) + Residual (${(calc.residual_percent)}% of ₹${P0.toLocaleString()}) = ₹${calc.expected_price.toLocaleString()}`
      : `Expected Price = ₹${P0.toLocaleString()} × ${calc.residual_percent}% [Residual] + ₹${P0.toLocaleString()} × ${calc.benchmarkability_percent}% × (${I1} / ${I0}) [Index Movement] = ₹${residualVal.toLocaleString()} + ₹${benchmarkVal.toLocaleString()} = ₹${calc.expected_price.toLocaleString()}`;

    return {
      transaction_id: calc.transaction_id,
      po_number: calc.po_number,
      material_code: calc.material_code,
      material_description: calc.short_text,
      vendor: calc.vendor,
      sector: calc.sector,
      category: benchmark.category,
      pcbi_id: benchmark.pcbi_id,
      benchmark_name: benchmark.benchmark_name,
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

  /**
   * Data Quality Engine
   */
  private analyzeDataQuality(transactions: PCBIClientPurchaseTransaction[]): PCBIDataQualityReport {
    let clean = 0;
    let warnings = 0;
    let errors = 0;
    let missingDates = 0;
    let missingQty = 0;
    let missingPrices = 0;
    let missingUnspsc = 0;
    const gradeCounts = { A: 0, B: 0, C: 0, UNMAPPED: 0 };
    const issues: PCBIDataQualityReport['validation_issues'] = [];

    transactions.forEach((t, idx) => {
      let rowErrors = 0;
      let rowWarnings = 0;

      if (!t.po_date) {
        missingDates++;
        rowErrors++;
        issues.push({ row_index: idx + 1, po_number: t.po_number, material_code: t.material_code, severity: 'ERROR', message: 'Missing PO Transaction Date', field: 'po_date' });
      }
      if (t.quantity === undefined || t.quantity <= 0) {
        missingQty++;
        rowErrors++;
        issues.push({ row_index: idx + 1, po_number: t.po_number, material_code: t.material_code, severity: 'ERROR', message: 'Invalid or missing Quantity (Q <= 0)', field: 'quantity' });
      }
      if (t.unit_price === undefined || t.unit_price <= 0) {
        missingPrices++;
        rowErrors++;
        issues.push({ row_index: idx + 1, po_number: t.po_number, material_code: t.material_code, severity: 'ERROR', message: 'Invalid or missing Unit Price (P <= 0)', field: 'unit_price' });
      }
      if (!t.unspsc) {
        missingUnspsc++;
        rowWarnings++;
        issues.push({ row_index: idx + 1, po_number: t.po_number, material_code: t.material_code, severity: 'WARNING', message: 'UNSPSC code missing (fallback to AI text classification)', field: 'unspsc' });
      }

      if (rowErrors > 0) {
        errors++;
      } else if (rowWarnings > 0) {
        warnings++;
      } else {
        clean++;
      }

      const mapping = this.resolvePCBIMapping(t);
      if (mapping.quality === 'A') gradeCounts.A++;
      else if (mapping.quality === 'B') gradeCounts.B++;
      else gradeCounts.C++;
    });

    const total = transactions.length || 1;
    const errorPenalty = (errors / total) * 60;
    const warningPenalty = (warnings / total) * 20;
    const score = Math.max(0, Math.min(100, Math.round(100 - errorPenalty - warningPenalty)));

    return {
      overall_score: score,
      total_records: transactions.length,
      clean_records: clean,
      records_with_warnings: warnings,
      records_with_errors: errors,
      benchmarkable_records: transactions.length - errors,
      mapping_required_records: gradeCounts.C,
      missing_dates_count: missingDates,
      missing_quantities_count: missingQty,
      missing_prices_count: missingPrices,
      missing_unspsc_count: missingUnspsc,
      missing_indices_count: 0,
      quality_grade_counts: gradeCounts,
      validation_issues: issues.slice(0, 50)
    };
  }

  /**
   * Executive Summary Builder
   */
  private buildExecutiveSummary(
    rawTx: PCBIClientPurchaseTransaction[],
    calculations: PCBITransactionCalculation[],
    qualityScore: number
  ): PCBIExecutiveSummary {
    const totalSpendInr = rawTx.reduce((sum, t) => sum + (t.total_value || (t.quantity * t.unit_price) || 0), 0);
    const totalSpendInrCr = Number((totalSpendInr / 10000000).toFixed(2));

    const totalOppInr = calculations.reduce((sum, c) => sum + (c.opportunity_value || 0), 0);
    const totalOppInrCr = Number((totalOppInr / 10000000).toFixed(2));

    const totalFavInr = calculations.reduce((sum, c) => sum + (c.favourable_variance || 0), 0);
    const totalFavInrCr = Number((totalFavInr / 10000000).toFixed(2));

    const oppPct = totalSpendInr > 0 ? Number(((totalOppInr / totalSpendInr) * 100).toFixed(1)) : 0;

    // Category aggregation
    const catMap = new Map<string, { spend: number; opp: number; fav: number; items: Set<string>; quality: PCBIQualityRating }>();
    for (const c of calculations) {
      const bm = this.benchmarks.get(c.base_pcbi_id);
      const cat = bm?.category || 'General Category';
      const existing = catMap.get(cat) || { spend: 0, opp: 0, fav: 0, items: new Set<string>(), quality: c.benchmark_quality };
      existing.spend += c.actual_price * c.quantity;
      existing.opp += c.opportunity_value;
      existing.fav += c.favourable_variance;
      existing.items.add(c.material_code);
      catMap.set(cat, existing);
    }

    const categoryAggregations = Array.from(catMap.entries()).map(([category, val]) => ({
      category,
      spend_cr: Number((val.spend / 10000000).toFixed(2)),
      opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
      opportunity_pct: Number(((val.opp / val.spend) * 100).toFixed(1)),
      favourable_cr: Number((val.fav / 10000000).toFixed(2)),
      items_count: val.items.size,
      quality: val.quality
    })).sort((a, b) => b.opportunity_cr - a.opportunity_cr);

    // Vendor aggregation
    const venMap = new Map<string, { spend: number; opp: number; items: Set<string>; gapSum: number; count: number; topCat: string }>();
    for (const c of calculations) {
      const v = c.vendor || 'Unknown Vendor';
      const bm = this.benchmarks.get(c.base_pcbi_id);
      const cat = bm?.category || 'General';
      const existing = venMap.get(v) || { spend: 0, opp: 0, items: new Set<string>(), gapSum: 0, count: 0, topCat: cat };
      existing.spend += c.actual_price * c.quantity;
      existing.opp += c.opportunity_value;
      existing.items.add(c.material_code);
      if (c.actual_price > 0 && c.price_gap_per_unit > 0) {
        existing.gapSum += (c.price_gap_per_unit / c.actual_price) * 100;
        existing.count++;
      }
      venMap.set(v, existing);
    }

    const vendorAggregations = Array.from(venMap.entries()).map(([vendor, val]) => ({
      vendor,
      spend_cr: Number((val.spend / 10000000).toFixed(2)),
      opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
      opportunity_pct: Number(((val.opp / val.spend) * 100).toFixed(1)),
      items_count: val.items.size,
      avg_price_gap_pct: val.count > 0 ? Number((val.gapSum / val.count).toFixed(1)) : 0,
      top_category: val.topCat
    })).sort((a, b) => b.opportunity_cr - a.opportunity_cr).slice(0, 20);

    // Material aggregation
    const matMap = new Map<string, { desc: string; cat: string; spend: number; opp: number; baseP: number; latestAct: number; latestExp: number; quality: PCBIQualityRating }>();
    for (const c of calculations) {
      const bm = this.benchmarks.get(c.base_pcbi_id);
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

    const materialAggregations = Array.from(matMap.entries()).map(([code, val]) => ({
      material_code: code,
      short_text: val.desc,
      category: val.cat,
      spend_cr: Number((val.spend / 10000000).toFixed(2)),
      opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
      opportunity_pct: Number(((val.opp / val.spend) * 100).toFixed(1)),
      base_price: val.baseP,
      latest_actual_price: val.latestAct,
      latest_expected_price: val.latestExp,
      price_trend_gap_pct: Number((((val.latestAct - val.latestExp) / val.latestExp) * 100).toFixed(1)),
      benchmark_quality: val.quality
    })).sort((a, b) => b.opportunity_cr - a.opportunity_cr).slice(0, 25);

    // Monthly Trend Aggregation
    const monthMap = new Map<string, { spend: number; expSpend: number; opp: number; fav: number; idxSum: number; count: number }>();
    for (const c of calculations) {
      const monthStr = c.po_date.substring(0, 7);
      const existing = monthMap.get(monthStr) || { spend: 0, expSpend: 0, opp: 0, fav: 0, idxSum: 0, count: 0 };
      existing.spend += c.actual_price * c.quantity;
      existing.expSpend += c.expected_price * c.quantity;
      existing.opp += c.opportunity_value;
      existing.fav += c.favourable_variance;
      existing.idxSum += c.current_pcbi_index;
      existing.count++;
      monthMap.set(monthStr, existing);
    }

    const monthlyTrend = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, val]) => ({
      month_year: month,
      spend_cr: Number((val.spend / 10000000).toFixed(2)),
      expected_spend_cr: Number((val.expSpend / 10000000).toFixed(2)),
      opportunity_cr: Number((val.opp / 10000000).toFixed(2)),
      favourable_cr: Number((val.fav / 10000000).toFixed(2)),
      pcbi_index_avg: Number((val.idxSum / val.count).toFixed(1))
    }));

    return {
      total_spend_inr: totalSpendInr,
      total_spend_inr_cr: totalSpendInrCr,
      mapped_spend_inr: totalSpendInr,
      mapped_spend_inr_cr: totalSpendInrCr,
      mapped_spend_percent: 100.0,
      benchmarkable_spend_inr: totalSpendInr,
      benchmarkable_spend_inr_cr: totalSpendInrCr,
      benchmarkable_spend_percent: 100.0,
      total_opportunity_inr: totalOppInr,
      total_opportunity_inr_cr: totalOppInrCr,
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
}
