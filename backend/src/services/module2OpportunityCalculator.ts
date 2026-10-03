/**
 * Module 2 Opportunity Calculator & Overlap Deduplication Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type {
  PriceDispersionMetrics,
  CrediblePriceReferenceResult,
  EAuctionSuitability,
  ConsolidationSuitability,
  OperationalConsolidationIndicators,
  CategorySupplierStructureItem,
  SourcingOpportunityStatus,
  PrimarySourcingLever
} from '../types/module2StrategicSourcing';
import { E_AUCTION_SUITABILITY_RULES } from '../constants/module2StrategicSourcing';
import { Module2ConsolidationHelper } from './module2ConsolidationHelper';

export interface OpportunityCalculationResult {
  eauctionSuitability: EAuctionSuitability;
  eauctionSuitabilityRationale: string;
  potentialEAuctionOpportunityInr: number | null;
  potentialEAuctionOpportunityInrCr: number | null;
  potentialEAuctionOpportunityPct: number | null;

  consolidationSuitability: ConsolidationSuitability;
  consolidationSuitabilityRationale: string;
  potentialVendorConsolidationOpportunityInr: number | null;
  potentialVendorConsolidationOpportunityInrCr: number | null;
  potentialVendorConsolidationOpportunityPct: number | null;
  consolidationEvidencePath: 'PATH_A' | 'PATH_B' | 'PATH_C' | 'PATH_D';
  operationalConsolidation: OperationalConsolidationIndicators;

  overlappingOpportunityInr: number;
  overlappingOpportunityInrCr: number;
  netQuantifiableOpportunityInr: number | null;
  netQuantifiableOpportunityInrCr: number | null;
  netQuantifiableOpportunityPct: number | null;
  isQuantifiable: boolean;
  status: SourcingOpportunityStatus;
  statusLabel: string;
  quantifiableDisplayText: string;
}

export class Module2OpportunityCalculator {
  private static getEAuctionSuitabilityInfo(
    isRecurring: boolean,
    supplierCount: number,
    priceGapPct: number,
    addressableSpendInr: number
  ): { suitability: EAuctionSuitability; rationale: string } {
    if (
      isRecurring &&
      supplierCount >= E_AUCTION_SUITABILITY_RULES.MIN_COMPETITIVE_SUPPLIERS_HIGH &&
      priceGapPct >= E_AUCTION_SUITABILITY_RULES.MIN_PRICE_DISPERSION_PCT &&
      addressableSpendInr >= E_AUCTION_SUITABILITY_RULES.MIN_ADDRESSABLE_SPEND_INR
    ) {
      return {
        suitability: 'HIGH',
        rationale: `High suitability: ${supplierCount} active comparable suppliers, ${priceGapPct.toFixed(
          1
        )}% price dispersion, recurring procurement volume.`
      };
    }
    if (
      supplierCount >= E_AUCTION_SUITABILITY_RULES.MIN_COMPETITIVE_SUPPLIERS_MED &&
      priceGapPct > 1.0
    ) {
      return {
        suitability: 'MEDIUM',
        rationale: `Moderate suitability: ${supplierCount} suppliers with ${priceGapPct.toFixed(
          1
        )}% historical price dispersion.`
      };
    }
    if (priceGapPct <= 0.5) {
      return {
        suitability: 'NOT_SUITABLE',
        rationale: 'Negligible price dispersion among existing suppliers (<0.5%). Competitive auction unlikely to yield material gain.'
      };
    }
    return {
      suitability: 'LOW',
      rationale: 'Low supplier competition or sub-threshold addressable spend.'
    };
  }

  public static calculateEAuctionBenefit(
    isRecurring: boolean,
    supplierCount: number,
    addressableSpendInr: number,
    addressableQuantity: number,
    dispersion: PriceDispersionMetrics | null,
    credibleRef: CrediblePriceReferenceResult
  ): {
    suitability: EAuctionSuitability;
    rationale: string;
    opportunityInr: number | null;
    opportunityPct: number | null;
  } {
    if (!dispersion || addressableQuantity <= 0 || !credibleRef.isCredible) {
      return {
        suitability: 'INSUFFICIENT_DATA',
        rationale: 'Insufficient comparable transaction history to establish price reference.',
        opportunityInr: null,
        opportunityPct: null
      };
    }

    if (supplierCount <= 1) {
      return {
        suitability: 'NOT_SUITABLE',
        rationale: 'Single active supplier. Inadequate competitive tension for dynamic reverse auction.',
        opportunityInr: 0,
        opportunityPct: 0
      };
    }

    const baselinePrice = dispersion.weightedAveragePrice;
    const refPrice = credibleRef.referencePrice ?? baselinePrice;
    const priceGap = Math.max(0, baselinePrice - refPrice);
    const priceGapPct = baselinePrice > 0 ? (priceGap / baselinePrice) * 100 : 0;

    const { suitability, rationale } = this.getEAuctionSuitabilityInfo(
      isRecurring,
      supplierCount,
      priceGapPct,
      addressableSpendInr
    );

    const opportunityInr = Math.round(priceGap * addressableQuantity);
    return {
      suitability,
      rationale,
      opportunityInr,
      opportunityPct: Math.round(priceGapPct * 10) / 10
    };
  }

  public static calculateConsolidationBenefit(
    isRecurring: boolean,
    suppliers: CategorySupplierStructureItem[],
    addressableQuantity: number,
    dispersion: PriceDispersionMetrics | null,
    _totalTransactionCount: number,
    activeMonthsCount: number
  ): {
    suitability: ConsolidationSuitability;
    rationale: string;
    opportunityInr: number | null;
    opportunityPct: number | null;
    evidencePath: 'PATH_A' | 'PATH_B' | 'PATH_C' | 'PATH_D';
    operational: OperationalConsolidationIndicators;
  } {
    const { operational, tailSuppliers, tailSpend } = Module2ConsolidationHelper.buildOperationalIndicators(
      suppliers,
      activeMonthsCount
    );

    if (suppliers.length <= 1) {
      return {
        suitability: 'NOT_SUITABLE',
        rationale: 'Sole supplier configuration. Vendor consolidation not applicable.',
        opportunityInr: 0,
        opportunityPct: 0,
        evidencePath: 'PATH_D',
        operational
      };
    }

    if (!dispersion || addressableQuantity <= 0) {
      return {
        suitability: 'INSUFFICIENT_DATA',
        rationale: 'Insufficient comparable data to determine consolidation benefit.',
        opportunityInr: null,
        opportunityPct: null,
        evidencePath: 'PATH_D',
        operational
      };
    }

    const coreSuppliers = suppliers.filter(s => !s.isTailSupplier && s.weightedAveragePrice > 0);
    const bestCorePrice = coreSuppliers.length > 0
      ? Math.min(...coreSuppliers.map(s => s.weightedAveragePrice))
      : dispersion.weightedAveragePrice;

    let consolidationMonetaryOpp = 0;
    for (const tail of tailSuppliers) {
      if (tail.weightedAveragePrice > bestCorePrice) {
        const gap = tail.weightedAveragePrice - bestCorePrice;
        consolidationMonetaryOpp += gap * tail.totalQuantity;
      }
    }

    const evidencePath: 'PATH_A' | 'PATH_B' | 'PATH_C' | 'PATH_D' =
      consolidationMonetaryOpp > 0 ? 'PATH_B' : 'PATH_D';

    const { suitability, rationale } = Module2ConsolidationHelper.getConsolidationSuitabilityInfo(
      tailSuppliers.length,
      consolidationMonetaryOpp,
      isRecurring,
      tailSpend
    );

    const baselinePrice = dispersion.weightedAveragePrice;
    const oppPct = baselinePrice > 0 && addressableQuantity > 0
      ? (consolidationMonetaryOpp / (baselinePrice * addressableQuantity)) * 100
      : 0;

    return {
      suitability,
      rationale,
      opportunityInr: Math.round(consolidationMonetaryOpp),
      opportunityPct: Math.round(oppPct * 10) / 10,
      evidencePath,
      operational
    };
  }

  private static resolvePrimaryLever(
    netInr: number,
    spec: number,
    consol: number,
    vol: number
  ): PrimarySourcingLever {
    if (netInr === 0) return 'NO_QUANTIFIABLE_BENEFIT';
    if (netInr === spec) return 'CATEGORY_SPECIALIST_REALIGNMENT';
    if (netInr === consol) return 'VENDOR_CONSOLIDATION';
    if (netInr === vol) return 'VOLUME_BUNDLING';
    return 'E_AUCTION';
  }

  private static resolveOpportunityStatus(
    netInr: number,
    eauction: number,
    consol: number
  ): { status: SourcingOpportunityStatus; statusLabel: string } {
    if (netInr === 0) {
      return {
        status: 'IDENTIFIED_NOT_QUANTIFIABLE',
        statusLabel: 'Opportunity Identified — Benefit Not Yet Quantifiable'
      };
    }
    if (eauction > 0 && consol > 0) {
      return {
        status: 'E_AUCTION_AND_CONSOLIDATION',
        statusLabel: 'E-Auction & Vendor Consolidation Candidate'
      };
    }
    if (eauction > 0) {
      return {
        status: 'E_AUCTION_CANDIDATE',
        statusLabel: 'E-Auction Candidate'
      };
    }
    if (consol > 0) {
      return {
        status: 'CONSOLIDATION_CANDIDATE',
        statusLabel: 'Vendor Consolidation Candidate'
      };
    }
    return {
      status: 'QUANTIFIABLE',
      statusLabel: 'Quantifiable Sourcing Opportunity'
    };
  }

  public static calculateNetOpportunity(
    eauctionOppInr: number | null,
    consolidationOppInr: number | null,
    isDataSufficient: boolean,
    comparableTxCount: number,
    volumeBundlingOppInr = 0,
    specialistOppInr = 0
  ): {
    overlappingInr: number;
    netInr: number | null;
    status: SourcingOpportunityStatus;
    statusLabel: string;
    isQuantifiable: boolean;
    displayText: string;
    primaryLever: PrimarySourcingLever;
  } {
    if (!isDataSufficient || comparableTxCount < 2) {
      return {
        overlappingInr: 0,
        netInr: null,
        status: 'IDENTIFIED_NOT_QUANTIFIABLE',
        statusLabel: 'Opportunity Identified — Benefit Not Yet Quantifiable',
        isQuantifiable: false,
        displayText: 'Opportunity Identified — Benefit Not Yet Quantifiable',
        primaryLever: 'NO_QUANTIFIABLE_BENEFIT'
      };
    }

    const eauction = eauctionOppInr || 0;
    const consol = consolidationOppInr || 0;
    const vol = volumeBundlingOppInr || 0;
    const spec = specialistOppInr || 0;

    const grossInr = eauction + consol + vol + spec;
    const netInr = Math.max(eauction, consol, vol, spec);
    const overlappingInr = Math.max(0, grossInr - netInr);

    const primaryLever = this.resolvePrimaryLever(netInr, spec, consol, vol);
    const { status, statusLabel } = this.resolveOpportunityStatus(netInr, eauction, consol);

    return {
      overlappingInr,
      netInr,
      status,
      statusLabel,
      isQuantifiable: netInr > 0,
      displayText: netInr > 0 ? `₹${(netInr / 100000).toFixed(2)} Lakhs` : 'Opportunity Identified — Benefit Not Yet Quantifiable',
      primaryLever
    };
  }
}
