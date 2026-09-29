/**
 * Module 2 Sourcing Scorecard & Strategic Lever Matrix Engine
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 * 
 * Implements:
 * - Section 16: 15-Lever Sourcing Matrix
 * - Section 17: 10-Dimension Strategic Sourcing Scorecard
 * - Section 18: Strategic Sourcing Recommendation Engine
 */

import type {
  SourcingLeverRecommendation,
  StrategicSourcingScorecard,
  SourcingDataConfidence,
  PriceDispersionMetrics,
  CategorySupplierStructureItem,
  SupplierFragmentationLevel
} from '../types/module2StrategicSourcing';
import {
  SOURCING_LEVERS_CATALOG
} from '../constants/module2StrategicSourcing';

import { Module2ScorecardDimensions } from './module2ScorecardDimensions';

export class Module2ScorecardEngine {
  /**
   * Evaluate the 10 scorecard dimensions
   */
  public static evaluateScorecard(params: {
    materiality: 'HIGH' | 'MEDIUM' | 'LOW';
    fragmentation: SupplierFragmentationLevel;
    dispersion: PriceDispersionMetrics | null;
    isRecurring: boolean;
    supplierCount: number;
    comparableTxCount: number;
    totalTxCount: number;
    addressableSpendInr: number;
    confidence: SourcingDataConfidence;
  }): StrategicSourcingScorecard {
    const dimensions = Module2ScorecardDimensions.buildDimensions(params);

    // Calculate Overall Weighted Score (0 to 100)
    let totalScore = 0;
    for (const d of dimensions) {
      totalScore += d.score * (d.weightPct / 10);
    }
    const overallScore = Math.round(totalScore);

    const { recommendation, recommendationLabel, notes } = Module2ScorecardDimensions.determineRecommendation(params);

    return {
      overallScore,
      recommendation,
      recommendationLabel,
      dimensions,
      justificationNotes: notes
    };
  }

  /**
   * Build Strategic Sourcing Lever Matrix (Section 16)
   */
  public static buildLeverMatrix(params: {
    addressableSpendInr: number;
    supplierCount: number;
    suppliers: CategorySupplierStructureItem[];
    dispersion: PriceDispersionMetrics | null;
    isRecurring: boolean;
    confidence: SourcingDataConfidence;
    eauctionOppInr: number | null;
    consolidationOppInr: number | null;
  }): SourcingLeverRecommendation[] {
    const {
      addressableSpendInr,
      supplierCount,
      dispersion,
      isRecurring,
      confidence,
      eauctionOppInr,
      consolidationOppInr
    } = params;

    const levers: SourcingLeverRecommendation[] = [];
    const spendCr = Math.round((addressableSpendInr / 10000000) * 1000) / 1000;

    // Helper to push lever
    const addLever = (
      key: keyof typeof SOURCING_LEVERS_CATALOG,
      isApplicable: boolean,
      potentialBenefitInr: number | null,
      benefitLabel: string,
      evidence: string,
      risks: string[],
      customAction?: string
    ): void => {
      const meta = SOURCING_LEVERS_CATALOG[key];
      levers.push({
        lever: key,
        leverLabel: meta.name,
        rationale: meta.defaultRationale,
        evidence,
        addressableSpendInr,
        addressableSpendInrCr: spendCr,
        potentialBenefitInr,
        potentialBenefitLabel: benefitLabel,
        dataConfidence: confidence,
        risks,
        nextAction: customAction || meta.defaultAction,
        isApplicable
      });
    };

    // 1. E-Auction
    const eauctionApplicable = (eauctionOppInr || 0) > 0 && supplierCount >= 2;
    addLever(
      'E_AUCTION',
      eauctionApplicable,
      eauctionOppInr,
      eauctionOppInr ? `₹${(eauctionOppInr / 100000).toFixed(2)}L potential opportunity` : 'Not Applicable',
      `${supplierCount} suppliers, ${(dispersion?.priceDispersionPct || 0).toFixed(1)}% price dispersion`,
      ['Supplier collusion risk', 'Delivery lead time disruption']
    );

    // 2. RFQ Competition
    addLever(
      'RFQ_COMPETITION',
      supplierCount >= 2,
      eauctionOppInr ? Math.round(eauctionOppInr * 0.8) : null,
      eauctionOppInr ? `₹${((eauctionOppInr * 0.8) / 100000).toFixed(2)}L potential benefit` : 'Applicable',
      `${supplierCount} qualified vendors in active transaction history`,
      ['Extended negotiation cycles']
    );

    // 3. Vendor Consolidation
    const consolApplicable = (consolidationOppInr || 0) > 0;
    addLever(
      'VENDOR_CONSOLIDATION',
      consolApplicable,
      consolidationOppInr,
      consolidationOppInr ? `₹${(consolidationOppInr / 100000).toFixed(2)}L consolidation benefit` : 'Operational only',
      'Fragmented purchase distribution across tail vendors',
      ['Single point of failure', 'Supplier capacity constraints']
    );

    // 4. Volume Consolidation
    addLever(
      'VOLUME_CONSOLIDATION',
      isRecurring && addressableSpendInr > 2000000,
      null,
      'Tier Volume Rebates (Indicative)',
      `₹${(addressableSpendInr / 100000).toFixed(2)}L recurring category spend`,
      ['Internal requisition misalignment']
    );

    // 5. Contract Consolidation
    addLever(
      'CONTRACT_CONSOLIDATION',
      isRecurring,
      null,
      'Rate contract protection against spot price spikes',
      'Repeat purchases occurring across multiple active months',
      ['Contractual lock-in during market declines']
    );

    // 6. Order Frequency Optimization
    addLever(
      'ORDER_FREQUENCY_OPTIMIZATION',
      true,
      null,
      'Logistics freight batch savings',
      'Purchase order count exceeds monthly requirements',
      ['Warehouse storage capacity limitations']
    );

    // 7. MOQ / Lot-Size Optimization
    addLever(
      'MOQ_LOT_SIZE_OPTIMIZATION',
      true,
      null,
      'Standard batch run economies',
      'Purchases made in sub-optimal lot sizes',
      ['Increased working capital carrying costs']
    );

    // 8. Specification Standardization
    addLever(
      'SPECIFICATION_STANDARDIZATION',
      true,
      null,
      'Grade harmonization savings',
      'Multiple product descriptions identified for identical commodity',
      ['Engineering re-qualification requirements']
    );

    // 9. Supplier Tail Reduction
    addLever(
      'SUPPLIER_TAIL_REDUCTION',
      consolApplicable,
      null,
      'Administrative overhead reduction',
      'Long tail of low-volume vendors',
      ['Loss of backup emergency sources']
    );

    // 10. Payment Term Review
    addLever(
      'PAYMENT_TERM_REVIEW',
      true,
      null,
      'Working capital cash flow optimization',
      'Terms vary between Net 30 and Net 60',
      ['Supplier pushback on extended credit']
    );

    // 11. Delivery Term Review
    addLever(
      'DELIVERY_TERM_REVIEW',
      true,
      null,
      'FOR Destination freight harmonization',
      'Mixed Ex-Works and Delivered purchase terms',
      ['Transit damage claim responsibility']
    );

    // 12. Freight Logistics Review
    addLever(
      'FREIGHT_LOGISTICS_REVIEW',
      true,
      null,
      'Route bundling and freight rationalization',
      'Multiple regional plant delivery points',
      ['Dedicated vehicle minimum utilization']
    );

    // 13. Localization / Geographic Sourcing
    addLever(
      'LOCALIZATION_GEOGRAPHIC',
      true,
      null,
      'Lead time reduction and transit duty avoidance',
      'Distant supply origins identified',
      ['Local supplier technical qualification cycle']
    );

    // 14. Make / Buy Review
    addLever(
      'MAKE_BUY_REVIEW',
      false, // Per Section 16: ONLY IF DATA SUPPORTS IT
      null,
      'Requires internal cost center data',
      'Internal fabrication capability requires further validation',
      ['Capex commitment', 'Depreciation costs']
    );

    // 15. Demand Consolidation
    addLever(
      'DEMAND_CONSOLIDATION',
      true,
      null,
      'BOM rationalization and shared requirements',
      'Internal consumption across parallel facilities',
      ['Cross-plant operational coordination']
    );

    return levers;
  }
}
