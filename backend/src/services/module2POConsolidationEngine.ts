/**
 * Module 2 — PO Consolidation & Transaction Efficiency Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Order-Frequency Optimization.
 * Administrative savings strictly marked NOT_QUANTIFIABLE unless customer provides cost-per-PO.
 * Zero synthetic scale discounts.
 */

export interface PoConsolidationCadenceAnalysis {
  cadence: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  targetPosPerYear: number;
  poReductionPct: number;
  quantifiableAdminSavingsInr: number | null;
  administrativeStatus: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE';
  explanation: string;
}

export interface PoConsolidationEvaluation {
  supplierName: string;
  categoryName: string;
  annualSpendInr: number;
  currentAnnualPoCount: number;
  avgPoValueInr: number;
  proposedCadence: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  targetPoCount: number;
  transactionReductionPct: number;
  quantifiableAdminSavingsInr: number | null;
  administrativeBenefitStatus: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE';
  cadenceOptions: Record<string, PoConsolidationCadenceAnalysis>;
}

export class Module2POConsolidationEngine {
  public static evaluatePoConsolidation(
    supplierName: string,
    categoryName: string,
    annualSpendInr: number,
    currentPoCount: number,
    customerCostPerPoInr: number | null = null
  ): PoConsolidationEvaluation {
    const pos = Math.max(1, currentPoCount);
    const avgValue = Math.round(annualSpendInr / pos);

    const cadences: Record<string, { target: number; label: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' }> = {
      MONTHLY: { target: 12, label: 'MONTHLY' },
      QUARTERLY: { target: 4, label: 'QUARTERLY' },
      HALF_YEARLY: { target: 2, label: 'HALF_YEARLY' },
      ANNUAL: { target: 1, label: 'ANNUAL' }
    };

    const cadenceOptions: Record<string, PoConsolidationCadenceAnalysis> = {};

    for (const [key, cfg] of Object.entries(cadences)) {
      const targetPos = Math.min(pos, cfg.target);
      const reduction = pos > 0 ? Math.max(0, Math.round(((pos - targetPos) / pos) * 1000) / 10) : 0;
      let adminSavings: number | null = null;
      let adminStatus: 'QUANTIFIABLE' | 'NOT_QUANTIFIABLE' = 'NOT_QUANTIFIABLE';

      if (customerCostPerPoInr !== null && customerCostPerPoInr > 0) {
        adminSavings = Math.round((pos - targetPos) * customerCostPerPoInr);
        adminStatus = 'QUANTIFIABLE';
      }

      cadenceOptions[key] = {
        cadence: cfg.label,
        targetPosPerYear: targetPos,
        poReductionPct: reduction,
        quantifiableAdminSavingsInr: adminSavings,
        administrativeStatus: adminStatus,
        explanation: adminStatus === 'QUANTIFIABLE'
          ? `PO reduction from ${pos} to ${targetPos} yielding ₹${((adminSavings || 0) / 100000).toFixed(2)} Lakhs transaction savings.`
          : `PO reduction from ${pos} to ${targetPos} (${reduction}% reduction). Administrative savings: NOT QUANTIFIABLE (cost-per-PO required).`
      };
    }

    const recommended = cadenceOptions.QUARTERLY;

    return {
      supplierName,
      categoryName,
      annualSpendInr,
      currentAnnualPoCount: pos,
      avgPoValueInr: avgValue,
      proposedCadence: 'QUARTERLY',
      targetPoCount: recommended.targetPosPerYear,
      transactionReductionPct: recommended.poReductionPct,
      quantifiableAdminSavingsInr: recommended.quantifiableAdminSavingsInr,
      administrativeBenefitStatus: recommended.administrativeStatus,
      cadenceOptions
    };
  }
}
