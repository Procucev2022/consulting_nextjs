/**
 * Module 2 — Opportunity Waterfall Builder
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 */

import type {
  OpportunityWaterfallStage,
  OpportunityWaterfallV2Stage,
  OpportunityEvidenceState,
  SourcingDataConfidence
} from '../types/module2StrategicSourcing';

export interface Module2WaterfallParams {
  totalSpendInr: number;
  totalSpendInrCr: number;
  addressableSpendInr: number;
  addressableSpendInrCr: number;
  eauctionOpp: number;
  consolOpp: number;
  overlapOpp: number;
  netOpp: number;
  volumeBundlingOpp?: number;
  specialistOpp?: number;
  contractedSpendInr?: number;
}

export interface WaterfallV2Params {
  totalSpendInr: number;
  addressableSpendInr: number;
  comparableSpendInr: number;
  priceOpp: number;
  volumeBundlingOpp: number;
  eauctionOpp: number;
  consolOpp: number;
  specialistOpp: number;
  commercialOpp?: number;
  processOpp?: number;
  marketDiscoveryOpp?: number;
  overlapOpp: number;
  netOpp: number;
  evidenceState: OpportunityEvidenceState;
  confidence: SourcingDataConfidence;
}

export class Module2WaterfallBuilder {
  private static toCr(inr: number): number {
    return Math.round((inr / 10000000) * 1000) / 1000;
  }

  private static toPct(num: number, denom: number): number {
    if (denom <= 0) return 0;
    return Math.round((num / denom) * 1000) / 10;
  }

  public static buildWaterfall(
    totalSpendInr: number,
    totalSpendInrCr: number,
    addressableSpendInr: number,
    addressableSpendInrCr: number,
    eauctionOpp: number,
    consolOpp: number,
    overlapOpp: number,
    netOpp: number,
    volumeBundlingOpp = 0,
    specialistOpp = 0,
    contractedSpendInr = 0
  ): OpportunityWaterfallStage[] {
    const contractuallyAddressableSpend = Math.max(0, addressableSpendInr - contractedSpendInr);

    return [
      {
        stage: 'TOTAL_HISTORICAL_SPEND',
        label: '1. Total Historical Spend',
        amountInr: Math.round(totalSpendInr),
        amountInrCr: totalSpendInrCr,
        percentageOfTotal: 100,
        calculationBasis: 'Sum of all historical customer purchase transactions in category.'
      },
      {
        stage: 'ADDRESSABLE_SPEND',
        label: '2. Addressable Spend',
        amountInr: Math.round(addressableSpendInr),
        amountInrCr: addressableSpendInrCr,
        percentageOfTotal: this.toPct(addressableSpendInr, totalSpendInr),
        calculationBasis: 'Strictly comparable transactions meeting specification and UOM standards.'
      },
      {
        stage: 'COMPARABLE_SPEND',
        label: '3. Contractually / Operationally Addressable Spend',
        amountInr: Math.round(contractuallyAddressableSpend),
        amountInrCr: this.toCr(contractuallyAddressableSpend),
        percentageOfTotal: this.toPct(contractuallyAddressableSpend, totalSpendInr),
        calculationBasis: 'Spend unlocked and currently available for commercial renegotiation.'
      },
      {
        stage: 'PRICE_DISPERSION_OPPORTUNITY',
        label: '4. Price Dispersion Opportunity',
        amountInr: eauctionOpp,
        amountInrCr: this.toCr(eauctionOpp),
        percentageOfTotal: this.toPct(eauctionOpp, totalSpendInr),
        calculationBasis: 'Variance between current weighted purchase price and demonstrated reference price.'
      },
      {
        stage: 'VOLUME_AGGREGATION_OPPORTUNITY',
        label: '5. Volume Aggregation Opportunity',
        amountInr: volumeBundlingOpp,
        amountInrCr: this.toCr(volumeBundlingOpp),
        percentageOfTotal: this.toPct(volumeBundlingOpp, totalSpendInr),
        calculationBasis: 'Historical lower pricing demonstrated across aggregated order volume tiers.'
      },
      {
        stage: 'E_AUCTION_OPPORTUNITY',
        label: '6. E-Auction Opportunity',
        amountInr: eauctionOpp,
        amountInrCr: this.toCr(eauctionOpp),
        percentageOfTotal: this.toPct(eauctionOpp, totalSpendInr),
        calculationBasis: 'Dynamic competitive reverse auction price compression across verified suppliers.'
      },
      {
        stage: 'VENDOR_CONSOLIDATION_OPPORTUNITY',
        label: '7. Vendor Consolidation Opportunity',
        amountInr: consolOpp,
        amountInrCr: this.toCr(consolOpp),
        percentageOfTotal: this.toPct(consolOpp, totalSpendInr),
        calculationBasis: 'Fragmented tail volume shifted to competitive core suppliers at demonstrated rates.'
      },
      {
        stage: 'CATEGORY_SPECIALIST_REALIGNMENT',
        label: '8. Category Specialist Realignment',
        amountInr: specialistOpp,
        amountInrCr: this.toCr(specialistOpp),
        percentageOfTotal: this.toPct(specialistOpp, totalSpendInr),
        calculationBasis: 'Reallocating demand from multi-category vendors to demonstrated lower-price specialists.'
      },
      {
        stage: 'OVERLAP_REMOVAL',
        label: '9. Overlap Elimination (Deduplication)',
        amountInr: overlapOpp,
        amountInrCr: this.toCr(overlapOpp),
        percentageOfTotal: this.toPct(overlapOpp, totalSpendInr),
        calculationBasis: 'Shared addressable volume variance eliminated to strictly prevent double-counting.'
      },
      {
        stage: 'NET_QUANTIFIABLE_OPPORTUNITY',
        label: '10. Net Defensible Sourcing Opportunity',
        amountInr: netOpp,
        amountInrCr: this.toCr(netOpp),
        percentageOfTotal: this.toPct(netOpp, totalSpendInr),
        calculationBasis: 'Net mathematically defensible opportunity = Gross Sourcing Levers - Overlap.'
      }
    ];
  }

  public static buildWaterfallV2(params: WaterfallV2Params): OpportunityWaterfallV2Stage[] {
    const nonAddressable = Math.max(0, params.totalSpendInr - params.addressableSpendInr);
    const nonComparable = Math.max(0, params.addressableSpendInr - params.comparableSpendInr);

    return [
      {
        stageKey: 'TOTAL_CATEGORY_SPEND',
        label: '1. Total Category Spend',
        startingAmountInr: Math.round(params.totalSpendInr),
        eligibleAmountInr: Math.round(params.totalSpendInr),
        excludedAmountInr: 0,
        exclusionReason: 'None (Full historical baseline)',
        evidenceLevel: 'PROVEN_OPPORTUNITY',
        confidence: params.confidence
      },
      {
        stageKey: 'ADDRESSABLE_SPEND',
        label: '2. Addressable Spend',
        startingAmountInr: Math.round(params.totalSpendInr),
        eligibleAmountInr: Math.round(params.addressableSpendInr),
        excludedAmountInr: Math.round(nonAddressable),
        exclusionReason: nonAddressable > 0 ? 'Excludes non-addressable capital/statutory or contractually locked spend' : 'Fully addressable',
        evidenceLevel: 'PROVEN_OPPORTUNITY',
        confidence: params.confidence
      },
      {
        stageKey: 'COMPARABLE_SPEND',
        label: '3. Comparable Spend (Harmonized)',
        startingAmountInr: Math.round(params.addressableSpendInr),
        eligibleAmountInr: Math.round(params.comparableSpendInr),
        excludedAmountInr: Math.round(nonComparable),
        exclusionReason: nonComparable > 0 ? 'Excludes transactions with specification/UOM mismatch or outlier prices' : 'All transactions strictly comparable',
        evidenceLevel: 'PROVEN_OPPORTUNITY',
        confidence: params.confidence
      },
      {
        stageKey: 'PRICE_OPPORTUNITY',
        label: '4. Historical Price Opportunity',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.priceOpp),
        excludedAmountInr: 0,
        exclusionReason: 'Variance vs lowest credible reference price',
        evidenceLevel: params.priceOpp > 0 ? 'PROVEN_OPPORTUNITY' : 'LOW_EVIDENCED_OPPORTUNITY',
        confidence: params.confidence
      },
      {
        stageKey: 'VOLUME_LEVERAGE',
        label: '5. Volume Leverage Opportunity',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.volumeBundlingOpp),
        excludedAmountInr: 0,
        exclusionReason: 'Verified volume tier price elasticity',
        evidenceLevel: params.volumeBundlingOpp > 0 ? 'PROVEN_OPPORTUNITY' : 'IDENTIFIED_NOT_QUANTIFIABLE',
        confidence: params.confidence
      },
      {
        stageKey: 'E_AUCTION_OPPORTUNITY',
        label: '6. E-Auction Opportunity',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.eauctionOpp),
        excludedAmountInr: 0,
        exclusionReason: 'Dynamic bidding compression potential',
        evidenceLevel: params.eauctionOpp > 0 ? 'PROVEN_OPPORTUNITY' : 'MARKET_DISCOVERY_OPPORTUNITY',
        confidence: params.confidence
      },
      {
        stageKey: 'SUPPLIER_CONSOLIDATION',
        label: '7. Supplier Consolidation Opportunity',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.consolOpp),
        excludedAmountInr: 0,
        exclusionReason: 'Tail reallocation to core supplier reference',
        evidenceLevel: params.consolOpp > 0 ? 'PROVEN_OPPORTUNITY' : 'IDENTIFIED_NOT_QUANTIFIABLE',
        confidence: params.confidence
      },
      {
        stageKey: 'CATEGORY_SPECIALIZATION',
        label: '8. Category Specialization Opportunity',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.specialistOpp),
        excludedAmountInr: 0,
        exclusionReason: 'Generalist to specialist price delta',
        evidenceLevel: params.specialistOpp > 0 ? 'PROVEN_OPPORTUNITY' : 'IDENTIFIED_NOT_QUANTIFIABLE',
        confidence: params.confidence
      },
      {
        stageKey: 'COMMERCIAL_CONTRACT_OPPORTUNITY',
        label: '9. Commercial & Contract Terms Opportunity',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.commercialOpp || 0),
        excludedAmountInr: 0,
        exclusionReason: 'Working capital and terms alignment (non-monetary structural potential)',
        evidenceLevel: 'IDENTIFIED_NOT_QUANTIFIABLE',
        confidence: params.confidence
      },
      {
        stageKey: 'PROCESS_DEMAND_OPPORTUNITY',
        label: '10. Process & Demand Optimization',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.processOpp || 0),
        excludedAmountInr: 0,
        exclusionReason: 'Requisition cadence and PO administration (operational efficiency)',
        evidenceLevel: 'IDENTIFIED_NOT_QUANTIFIABLE',
        confidence: params.confidence
      },
      {
        stageKey: 'MARKET_DISCOVERY_POTENTIAL',
        label: '11. Market Discovery Potential',
        startingAmountInr: Math.round(params.comparableSpendInr),
        eligibleAmountInr: Math.round(params.marketDiscoveryOpp || 0),
        excludedAmountInr: 0,
        exclusionReason: 'Requires external competitive tender to validate market-clearing rate',
        evidenceLevel: 'MARKET_DISCOVERY_OPPORTUNITY',
        confidence: params.confidence
      },
      {
        stageKey: 'OVERLAP_DOUBLE_COUNT_ADJUSTMENT',
        label: '12. Overlap / Double-Count Adjustment',
        startingAmountInr: Math.round(
          params.priceOpp + params.volumeBundlingOpp + params.eauctionOpp + params.consolOpp + params.specialistOpp
        ),
        eligibleAmountInr: 0,
        excludedAmountInr: Math.round(params.overlapOpp),
        exclusionReason: 'Deduplicated to eliminate shared addressable volume double-counting',
        evidenceLevel: 'PROVEN_OPPORTUNITY',
        confidence: params.confidence
      },
      {
        stageKey: 'NET_DEFENSIBLE_OPPORTUNITY_POTENTIAL',
        label: '13. Net Defensible Opportunity Potential',
        startingAmountInr: Math.round(
          params.priceOpp +
            params.volumeBundlingOpp +
            params.eauctionOpp +
            params.consolOpp +
            params.specialistOpp -
            params.overlapOpp
        ),
        eligibleAmountInr: Math.round(params.netOpp),
        excludedAmountInr: 0,
        exclusionReason: 'Mathematically verified net opportunity pool',
        evidenceLevel: params.netOpp > 0 ? 'PROVEN_OPPORTUNITY' : params.evidenceState,
        confidence: params.confidence
      }
    ];
  }
}

