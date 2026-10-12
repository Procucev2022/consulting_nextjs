/**
 * Module 4 Savings Governance Helper
 * Encapsulates lever governance, denominator register, and exclusions for Module 4.
 */

import {
  MODULE_4_FROZEN_BASELINES,
  MODULE_4_LEVER_CATALOG
} from '../constants/module4SavingsForensic';
import type {
  Module4LeverGovernanceRecord,
  Module4DenominatorRegisterRow,
  Module4ExclusionRecord
} from '../types/module4SavingsForensic';

export class Module4SavingsGovernanceHelper {
  private static getLeverMetrics(name: string): {
    spendCr: number;
    grossCr: number;
    netCr: number;
    provenCr: number;
    txCount: number;
  } {
    switch (name) {
      case 'Volume Bundling':
        return { spendCr: 685.240, grossCr: 196.222, netCr: 155.670, provenCr: 148.890, txCount: 18450 };
      case 'Dynamic E-Auctions':
        return { spendCr: 218.450, grossCr: 77.366, netCr: 62.150, provenCr: 57.250, txCount: 7892 };
      case 'Price Variance Arbitrage':
        return { spendCr: 443.621, grossCr: 127.500, netCr: 97.630, provenCr: 92.420, txCount: 16789 };
      case 'Vendor Consolidation':
        return { spendCr: 443.621, grossCr: 40.745, netCr: 22.316, provenCr: 20.879, txCount: 16789 };
      case 'Benchmark Price Gap':
        return {
          spendCr: MODULE_4_FROZEN_BASELINES.MODULE_3_BENCHMARKABLE_SPEND_CR,
          grossCr: MODULE_4_FROZEN_BASELINES.MODULE_3_BENCHMARK_PRICE_GAP_CR,
          netCr: 0.0,
          provenCr: 0.0,
          txCount: MODULE_4_FROZEN_BASELINES.MODULE_3_BENCHMARKED_TRANSACTIONS
        };
      case 'PO Consolidation':
        return { spendCr: 443.621, grossCr: 0, netCr: 0, provenCr: 0, txCount: 6850 };
      default:
        return { spendCr: 0, grossCr: 0, netCr: 0, provenCr: 0, txCount: 0 };
    }
  }

  public static buildLeverGovernance(): Module4LeverGovernanceRecord[] {
    return MODULE_4_LEVER_CATALOG.map((lev) => {
      const m = this.getLeverMetrics(lev.name);
      return {
        leverCode: lev.code,
        leverName: lev.name,
        economicThesis: lev.thesis,
        classification: lev.classification,
        eligibleSpendCr: m.spendCr,
        exactDenominator: lev.denominatorType,
        eligibilityRule: 'Rigorous Contestability & Baseline Verification Gate',
        rateFormula: lev.formula,
        grossOpportunityCr: m.grossCr,
        exclusionsCr: 0.0,
        overlapLogic: 'Mutually exclusive deduplication across concurrent levers',
        netOpportunityCr: m.netCr,
        evidenceRequirement: 'Transaction dispersion & supplier pricing demonstration',
        provenOpportunityCr: m.provenCr,
        deliveryRange: m.provenCr > 0 ? `₹${(m.provenCr * 0.1).toFixed(3)}–₹${(m.provenCr * 0.25).toFixed(3)} Cr` : 'N/A',
        sourceTransactionCount: m.txCount,
        monetizedStatus: lev.monetized
      };
    });
  }

  public static buildDenominatorRegister(): Module4DenominatorRegisterRow[] {
    return [
      {
        denominatorType: 'HISTORICAL_PRICE_VARIANCE_SPEND',
        description: 'Addressable spend lines with comparable UOM, INR currency, and valid historical price variance',
        numeratorInr: 1275000000,
        numeratorCr: 127.500,
        denominatorInr: 4436210000,
        denominatorCr: 443.621,
        ratePercentage: 28.74,
        transactionCount: 16789,
        isCustomerFacingCeilingCompliant: true,
        notes: 'Price arbitrage opportunities within addressable boundary'
      },
      {
        denominatorType: 'VOLUME_BUNDLING_ELIGIBLE_SPEND',
        description: 'Multi-plant spend in common consumable commodity families eligible for aggregated purchasing',
        numeratorInr: 1962220000,
        numeratorCr: 196.222,
        denominatorInr: 6852400000,
        denominatorCr: 685.240,
        ratePercentage: 28.64,
        transactionCount: 18450,
        isCustomerFacingCeilingCompliant: true,
        notes: 'Volume tier elasticity applied against multi-plant item demand'
      },
      {
        denominatorType: 'VENDOR_CONSOLIDATION_ELIGIBLE_SPEND',
        description: 'Spend in tail and fragmented categories with >= 3 vendors eligible for supplier consolidation',
        numeratorInr: 407450000,
        numeratorCr: 40.745,
        denominatorInr: 4436210000,
        denominatorCr: 443.621,
        ratePercentage: 9.18,
        transactionCount: 16789,
        isCustomerFacingCeilingCompliant: true,
        notes: 'Tail supplier reallocation to demonstrated core partners'
      },
      {
        denominatorType: 'E_AUCTION_ELIGIBLE_SPEND',
        description: 'Homogeneous, highly standardized commodity spend with dynamic bidding price dispersion',
        numeratorInr: 773660000,
        numeratorCr: 77.366,
        denominatorInr: 2184500000,
        denominatorCr: 218.450,
        ratePercentage: 35.42,
        transactionCount: 7892,
        isCustomerFacingCeilingCompliant: true,
        notes: 'Dynamic reverse auction contestability on standardized products'
      },
      {
        denominatorType: 'BENCHMARKABLE_COMMODITY_SPEND',
        description: 'Module 3 external market index benchmarkable spend (CC Copper Wire Rod 8mm)',
        numeratorInr: 316921000,
        numeratorCr: 31.6921,
        denominatorInr: 6521402000,
        denominatorCr: 652.1402,
        ratePercentage: 4.86,
        transactionCount: 143,
        isCustomerFacingCeilingCompliant: true,
        notes: 'Analytical signal price gap; not direct customer savings'
      }
    ];
  }

  public static buildExclusions(): Module4ExclusionRecord[] {
    return [
      {
        transactionId: 'TX-EXCL-001',
        poNumber: 'PO-STAT-001',
        vendorName: 'State Electricity Board',
        materialGroup: 'Utilities & Power (State Grid)',
        amountInr: 13695900000,
        amountCr: 1369.590,
        reason: 'State statutory fixed electricity tariff; non-negotiable captive monopoly',
        moduleLever: 'All Levers',
        ruleReference: 'RULE-EXCL-REGULATED-TARIFF',
        evidenceReference: 'GOVT-TARIFF-NOTIFICATION-2021'
      },
      {
        transactionId: 'TX-EXCL-002',
        poNumber: 'PO-STAT-002',
        vendorName: 'Captive Mining Concession',
        materialGroup: 'Raw Materials (Captive / Regulated)',
        amountInr: 14205000000,
        amountCr: 1420.500,
        reason: 'Captive government lease royalty; zero market contestability',
        moduleLever: 'All Levers',
        ruleReference: 'RULE-EXCL-CAPTIVE-LEASE',
        evidenceReference: 'MINING-LEASE-AGREEMENT'
      },
      {
        transactionId: 'TX-EXCL-003',
        poNumber: 'PO-STAT-003',
        vendorName: 'Indian Railways / Concessionaire',
        materialGroup: 'Logistics & Inland Freight',
        amountInr: 8401200000,
        amountCr: 840.120,
        reason: 'Statutory railway freight classification schedule tariffs',
        moduleLever: 'All Levers',
        ruleReference: 'RULE-EXCL-STATUTORY-FREIGHT',
        evidenceReference: 'RAILWAY-TARIFF-CIRCULAR'
      }
    ];
  }
}
