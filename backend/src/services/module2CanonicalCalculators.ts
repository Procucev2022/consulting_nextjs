import type {
  CategoryStrategicSourcingProfile,
  StrategicInputTransaction,
  Module2OpportunityLedgerItem,
  Module2Top50VendorItem,
  Module2SupplierRiskItem,
  Module2PoConsolidationItem,
  Module2RecurringSpendItem,
  Module2CanonicalInput,
  Module2StrategicSourcingDashboardSummary,
  Module2MathematicalBridge
} from '../types';

const safeNum = (v?: number | null): number => (typeof v === 'number' ? v : 0);

interface OpportunityStrategyMeta {
  oppType: 'E_AUCTION' | 'VENDOR_CONSOLIDATION' | 'COMBINED_STRATEGIC';
  methodology: string;
  formula: string;
  assumption: string;
}

const resolveOpportunityStrategy = (recommendation: string): OpportunityStrategyMeta => {
  if (recommendation === 'E_AUCTION_RECOMMENDED') {
    return {
      oppType: 'E_AUCTION',
      methodology: 'Reverse e-auction dynamic market bidding against credible benchmark price',
      formula: 'Addressable Quantity × (Weighted Average Price - Credible Reference Price)',
      assumption: 'DATA-DERIVED OPPORTUNITY: Statistically valid price spread with >= 2 active suppliers'
    };
  }
  if (recommendation === 'VENDOR_CONSOLIDATION_REVIEW') {
    return {
      oppType: 'VENDOR_CONSOLIDATION',
      methodology: 'Supplier tier consolidation and volume reallocation to cost-efficient partners',
      formula: 'Target Consolidated Quantity × Demonstrated Tier Volume Discount',
      assumption: 'MODELLING ASSUMPTION: 3.5% pricing concession upon 50% vendor count consolidation'
    };
  }
  return {
    oppType: 'COMBINED_STRATEGIC',
    methodology: 'Enterprise multi-lever strategic sourcing and volume bundling',
    formula: 'Addressable Spend × Combined Net Sourcing Advantage',
    assumption: 'DATA-DERIVED OPPORTUNITY: Proven category price dispersion and supplier structure'
  };
};

const resolveConfidence = (conf: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (conf === 'HIGH') return 'HIGH';
  if (conf === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
};

function resolveCategoryTransactionIds(
  p: CategoryStrategicSourcingProfile,
  txs: StrategicInputTransaction[]
): string[] {
  const rawCatCode = p.categoryId.replace(/^CAT-/, '');
  const categoryTxs = txs.filter(
    (t) =>
      t.spend_category === p.categoryName ||
      t.spend_category === rawCatCode ||
      t.spend_category === p.categoryId
  );
  if (categoryTxs.length > 0) {
    return categoryTxs
      .slice(0, 10)
      .map((t) => t.id)
      .filter((id): id is string => Boolean(id));
  }
  return (p.evidenceTransactionIds || []).slice(0, 10);
}

export class Module2CanonicalCalculators {
  public static buildOpportunityLedger(
    profiles: CategoryStrategicSourcingProfile[],
    txs: StrategicInputTransaction[]
  ): Module2OpportunityLedgerItem[] {
    const ledger: Module2OpportunityLedgerItem[] = [];

    for (const p of profiles) {
      const grossInr = p.grossQuantifiableBenefitInr ?? 0;
      const netInr = p.netQuantifiableOpportunityInr ?? 0;
      const overlapInr = p.overlappingOpportunityInr ?? 0;

      if (grossInr <= 0 && netInr <= 0) {
        continue;
      }

      const sampleTxIds = resolveCategoryTransactionIds(p, txs);
      const supplierIds = p.suppliers
        .slice(0, 5)
        .map((s) => s.supplierName)
        .filter((s): s is string => Boolean(s));
      const strat = resolveOpportunityStrategy(p.scorecard.recommendation);

      ledger.push({
        opportunityId: `OPP-M2-${p.categoryId}`,
        sourceTransactionIds: sampleTxIds,
        category: p.categoryName,
        supplierIds,
        materialIds: [p.categoryId],
        opportunityType: strat.oppType,
        eligibleSpendInr: p.addressableSpendInr,
        eligibleSpendCr: p.addressableSpendInrCr,
        grossOpportunityInr: grossInr,
        grossOpportunityCr: p.grossQuantifiableBenefitInrCr ?? 0,
        overlapGroup: `OG-CAT-${p.categoryId}`,
        overlapAmountInr: overlapInr,
        overlapAmountCr: p.overlappingOpportunityInrCr ?? 0,
        netOpportunityInr: netInr,
        netOpportunityCr: p.netQuantifiableOpportunityInrCr ?? 0,
        methodology: strat.methodology,
        formula: strat.formula,
        assumption: strat.assumption,
        confidence: resolveConfidence(p.dataConfidence),
        status: p.evidenceState === 'PROVEN_OPPORTUNITY' ? 'PROVEN' : 'QUALIFIED'
      });
    }

    return ledger;
  }

  public static buildTop50Vendors(txs: StrategicInputTransaction[]): Module2Top50VendorItem[] {
    const vendorMap = new Map<string, {
      code: string;
      name: string;
      spendInr: number;
      categories: Set<string>;
      txCount: number;
    }>();

    let totalSpendInr = 0;
    for (const t of txs) {
      totalSpendInr += t.total_spend_inr;
      const vName = t.vendor_name;
      let existing = vendorMap.get(vName);
      if (!existing) {
        existing = {
          code: t.vendor_code || 'VND-UNKNOWN',
          name: vName,
          spendInr: 0,
          categories: new Set(),
          txCount: 0
        };
        vendorMap.set(vName, existing);
      }
      existing.spendInr += t.total_spend_inr;
      existing.txCount += 1;
      if (t.spend_category) {
        existing.categories.add(t.spend_category);
      }
    }

    const sorted = Array.from(vendorMap.values()).sort((a, b) => b.spendInr - a.spendInr);
    let runningSpend = 0;
    const top50: Module2Top50VendorItem[] = sorted.slice(0, 50).map((v, idx) => {
      const cats = Array.from(v.categories);
      const isMulti = cats.length > 1;
      const sharePct = totalSpendInr > 0 ? Number(((v.spendInr / totalSpendInr) * 100).toFixed(2)) : 0;
      runningSpend += v.spendInr;
      const cumPct = totalSpendInr > 0 ? Number(((runningSpend / totalSpendInr) * 100).toFixed(2)) : 0;
      const pClass: 'A' | 'B' | 'C' = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C';

      return {
        rank: idx + 1,
        vendorCode: v.code,
        vendorName: v.name,
        totalSpendInr: Math.round(v.spendInr),
        totalSpendCr: Number((v.spendInr / 10000000).toFixed(4)),
        spendSharePct: sharePct,
        cumulativeSharePct: cumPct,
        paretoClass: pClass,
        categoriesSuppliedCount: cats.length,
        categoriesList: cats,
        transactionCount: v.txCount,
        vendorType: isMulti ? ('MULTI_CATEGORY_PARTNER' as const) : ('SINGLE_CATEGORY_SPECIALIST' as const)
      };
    });

    return top50;
  }

  public static buildSupplierRisk(profiles: CategoryStrategicSourcingProfile[]): Module2SupplierRiskItem[] {
    const risks: Module2SupplierRiskItem[] = [];

    for (const p of profiles) {
      const topSupplier = p.suppliers[0];
      const primaryShare = topSupplier ? topSupplier.spendSharePct : 0;
      const primarySpendCr = topSupplier ? topSupplier.totalSpendInrCr : 0;
      const primaryName = topSupplier ? topSupplier.supplierName : 'N/A';

      let riskClass: Module2SupplierRiskItem['riskClassification'] = 'FRAGMENTED_COMPETITIVE';
      if (primaryShare >= 70 || p.suppliers.length === 1) {
        riskClass = 'SINGLE_SOURCE_DOMINANT';
      } else if (primaryShare >= 40) {
        riskClass = 'MODERATE_CONCENTRATION';
      }

      risks.push({
        materialGroup: p.categoryName,
        totalSpendInr: p.totalSpendInr,
        totalSpendCr: p.totalSpendInrCr,
        totalSuppliersCount: p.activeSuppliersCount,
        primarySupplierName: primaryName,
        primarySupplierSpendCr: primarySpendCr,
        primarySupplierSharePct: primaryShare,
        riskClassification: riskClass,
        hhiScore: p.scorecard.dimensions.find((d) => d.dimension === 'SUPPLIER_STRUCTURE')?.score ?? 50
      });
    }

    return risks;
  }

  public static buildPoConsolidation(txs: StrategicInputTransaction[]): Module2PoConsolidationItem[] {
    const pairMap = new Map<string, {
      vendor: string;
      desc: string;
      cat: string;
      pos: Set<string>;
      spendInr: number;
    }>();

    for (const t of txs) {
      if (!t.po_number) continue;
      const key = `${t.vendor_name}:::${t.material_desc}`;
      let existing = pairMap.get(key);
      if (!existing) {
        existing = {
          vendor: t.vendor_name || 'UNKNOWN',
          desc: t.material_desc || 'UNKNOWN',
          cat: t.spend_category || 'Direct Materials',
          pos: new Set<string>(),
          spendInr: 0
        };
        pairMap.set(key, existing);
      }
      if (existing) {
        existing.pos.add(t.po_number);
        existing.spendInr += t.total_spend_inr;
      }
    }

    const poItems: Module2PoConsolidationItem[] = [];
    let idCounter = 1001;

    for (const p of pairMap.values()) {
      if (p.pos.size >= 5) {
        poItems.push({
          pairId: `POC-${idCounter++}`,
          vendorName: p.vendor,
          materialDesc: p.desc,
          category: p.cat,
          poCount: p.pos.size,
          totalSpendInr: Math.round(p.spendInr),
          totalSpendCr: Number((p.spendInr / 10000000).toFixed(4)),
          avgPoValueInr: Math.round(p.spendInr / p.pos.size),
          frequency: `${p.pos.size} POs across 10 billing months`,
          consolidationSuitability: p.pos.size > 20 ? 'HIGH' : 'MEDIUM'
        });
      }
    }

    return poItems.sort((a, b) => b.poCount - a.poCount);
  }

  public static buildRecurringSpend(profiles: CategoryStrategicSourcingProfile[]): Module2RecurringSpendItem[] {
    return profiles.map((p) => ({
      category: p.categoryName,
      activeMonthsCount: p.activeMonthsCount,
      totalSpendInr: p.totalSpendInr,
      totalSpendCr: p.totalSpendInrCr,
      transactionCount: p.transactionCount,
      supplierCount: p.activeSuppliersCount,
      isRecurring: p.isRecurringSpend,
      classification: p.isRecurringSpend
        ? `Recurring across ${p.activeMonthsCount} of 10 billing months`
        : `Ad-hoc / Non-recurring (${p.activeMonthsCount} active months)`
    }));
  }

  public static buildBridge(
    input: Module2CanonicalInput,
    summary: Module2StrategicSourcingDashboardSummary
  ): Module2MathematicalBridge {
    return {
      totalValidatedSpendInr: input.totalValidatedSpendInr,
      totalValidatedSpendCr: input.totalValidatedSpendCr,
      module2AnalyzedSpendInr: input.totalValidatedSpendInr,
      module2AnalyzedSpendCr: input.totalValidatedSpendCr,
      addressableSpendInr: summary.totalAddressableSpendInr,
      addressableSpendCr: summary.totalAddressableSpendInrCr,
      grossOpportunityInr: safeNum(summary.grossQuantifiableBenefitInr),
      grossOpportunityCr: safeNum(summary.grossQuantifiableBenefitInrCr),
      overlapDeductionsInr: safeNum(summary.totalOverlappingOpportunityInr),
      overlapDeductionsCr: safeNum(summary.totalOverlappingOpportunityInrCr),
      netDefensibleOpportunityInr: safeNum(summary.netQuantifiableOpportunityInr),
      netDefensibleOpportunityCr: safeNum(summary.netQuantifiableOpportunityInrCr),
      provenOpportunityInr: safeNum(summary.provenOpportunityInr),
      provenOpportunityCr: safeNum(summary.provenOpportunityInrCr),
      quantifiableRangeMinInr: safeNum(summary.quantifiableRangeMinInr),
      quantifiableRangeMinCr: safeNum(summary.quantifiableRangeMinInrCr),
      quantifiableRangeMaxInr: safeNum(summary.quantifiableRangeMaxInr),
      quantifiableRangeMaxCr: safeNum(summary.quantifiableRangeMaxInrCr),
      categoriesReadyCount: summary.categoriesReadyForSourcingCount,
      eauctionCandidatesCount: summary.eauctionCandidatesCount,
      consolidationCandidatesCount: summary.consolidationCandidatesCount,
      categoriesAnalyzedCount: summary.categoriesAnalyzedCount
    };
  }
}
