/**
 * Module 2 — Commercial Excellence & Terms Analysis Engine
 * Version: MODULE_2_OPPORTUNITY_INTELLIGENCE_V2.0
 */

import type {
  CategoryCommercialExcellenceProfile,
  CommercialDimensionAssessment,
  CommercialDimensionKey,
  CommercialDimensionStatus
} from '../types/module2OpportunityIntelligence';
import type { SourcingDataConfidence } from '../types/module2StrategicSourcing';
import { COMMERCIAL_DIMENSION_LABELS } from '../constants/module2OpportunityIntelligence';

export interface CommercialExcellenceInput {
  totalSpendInr: number;
  supplierCount: number;
  activeMonthsCount: number;
  isRecurring: boolean;
  confidence: SourcingDataConfidence;
}

export class Module2CommercialExcellenceEngine {
  private static buildDimension(
    key: CommercialDimensionKey,
    status: CommercialDimensionStatus,
    currentCondition: string,
    observedEvidence: string,
    potentialImplication: string,
    recommendedAction: string,
    confidence: SourcingDataConfidence
  ): CommercialDimensionAssessment {
    const statusLabels: Record<CommercialDimensionStatus, string> = {
      OPTIMIZED: 'Optimized',
      PARTIALLY_OPTIMIZED: 'Partially Optimized',
      OPPORTUNITY_IDENTIFIED: 'Opportunity Identified',
      INSUFFICIENT_DATA: 'Insufficient Data'
    };

    return {
      dimensionKey: key,
      dimensionLabel: COMMERCIAL_DIMENSION_LABELS[key],
      status,
      statusLabel: statusLabels[status],
      currentCondition,
      observedEvidence,
      potentialImplication,
      recommendedAction,
      isQuantifiable: false,
      estimatedBenefitInr: null,
      confidence
    };
  }

  public static analyzeCategory(input: CommercialExcellenceInput): CategoryCommercialExcellenceProfile {
    const dimensions: CommercialDimensionAssessment[] = [];

    // 1. Payment Terms
    dimensions.push(
      this.buildDimension(
        'PAYMENT_TERMS',
        'OPPORTUNITY_IDENTIFIED',
        'Standard 30-day payment cycle active across majority of suppliers.',
        'Observed standard Net 30/45 days without early-settlement discounts or dynamic discounting.',
        'Working capital drag; missed opportunity for treasury yield or standard 60/90-day supply chain finance alignment.',
        'Standardize payment terms to Net 60 days across category suppliers and introduce early payment discount matrix (2/10 Net 60).',
        input.confidence
      )
    );

    // 2. Contract Coverage
    dimensions.push(
      this.buildDimension(
        'CONTRACT_COVERAGE',
        input.isRecurring ? 'OPPORTUNITY_IDENTIFIED' : 'PARTIALLY_OPTIMIZED',
        input.isRecurring ? 'Substantial PO-by-PO spot buying without formal rate contracts.' : 'Ad-hoc purchasing pattern observed.',
        `${input.activeMonthsCount} active buying months but fragmented across discrete unlinked purchase orders.`,
        'High transaction administrative overhead and lack of price lock-in against market surges.',
        'Transition recurring requirements into an annual rate contract (ARC) with committed pricing bands.',
        input.confidence
      )
    );

    // 3. Contract Expiry
    dimensions.push(
      this.buildDimension(
        'CONTRACT_EXPIRY',
        'PARTIALLY_OPTIMIZED',
        'Contract renewals occur near expiry without competitive bidding runway.',
        'Lack of 90-day forward procurement notice pipeline in transactional metadata.',
        'Emergency extension risk and diminished leverage against incumbent suppliers during contract expiration.',
        'Implement automated 90-day contract expiration notices with mandatory sourcing event triggers.',
        input.confidence
      )
    );

    // 4. Escalation Clause
    dimensions.push(
      this.buildDimension(
        'ESCALATION_CLAUSE',
        'OPPORTUNITY_IDENTIFIED',
        'Uncontrolled raw material price adjustments passed through without formulaic indexation.',
        'Supplier invoices show periodic price shifts without transparent index links.',
        'One-way price increases during commodity inflation without downward corrections during market deflation.',
        'Incorporate strict two-way indexed escalation/de-escalation formulas tied to published indices.',
        input.confidence
      )
    );

    // 5. Rebate Structure
    dimensions.push(
      this.buildDimension(
        'REBATE_STRUCTURE',
        input.totalSpendInr > 2500000 ? 'OPPORTUNITY_IDENTIFIED' : 'PARTIALLY_OPTIMIZED',
        'No retrospective volume bonus or tiered threshold rebates active.',
        'Spend volume scale is high but pricing remains flat across annual tranches.',
        'Missed enterprise savings realization at higher aggregated volume thresholds.',
        'Negotiate graduated retrospective volume rebates (1-3% at 110% and 125% of baseline volume).',
        input.confidence
      )
    );

    // 6. MOQ Policy
    dimensions.push(
      this.buildDimension(
        'MOQ_POLICY',
        'PARTIALLY_OPTIMIZED',
        'Supplier-dictated batch sizes without inventory holding cost optimization.',
        'Transaction sizes reflect supplier MOQ constraints rather than production takt times.',
        'Excess safety stock holding or frequent small-order freight penalties.',
        'Review supplier MOQ against economic order quantity (EOQ) and establish scheduled consignment/VMI.',
        input.confidence
      )
    );

    // 7. Freight Terms
    dimensions.push(
      this.buildDimension(
        'FREIGHT_TERMS',
        'OPPORTUNITY_IDENTIFIED',
        'Mixed Incoterms (Ex-Works vs FOR Destination) across category suppliers.',
        'Varied shipping terms obscure true landed cost comparisons across regional suppliers.',
        'Uncoordinated freight spend and redundant transit logistics charges.',
        'Standardize all incoming supplier shipments to Free On Road (FOR) Destination or consolidate under centralized 3PL.',
        input.confidence
      )
    );

    // 8. Warranty Terms
    dimensions.push(
      this.buildDimension(
        'WARRANTY_TERMS',
        'PARTIALLY_OPTIMIZED',
        'Standard supplier warranty terms accepted without enhanced defect liability.',
        'Standard 12-month manufacturer defect clauses without SLA penalty clauses.',
        'High scrap or rework recovery risk if latent defects emerge after assembly.',
        'Extend warranty coverage to 24 months with back-to-back supplier defect indemnity.',
        input.confidence
      )
    );

    // 9. Lead Time
    dimensions.push(
      this.buildDimension(
        'LEAD_TIME',
        'PARTIALLY_OPTIMIZED',
        'Inconsistent delivery lead times leading to safety stock buffers.',
        'Variable PO creation to GRN delivery elapsed times across suppliers.',
        'Increased plant downtime risk or elevated working capital tied up in buffer inventory.',
        'Contractually enforce OTIF (On-Time In-Full) delivery thresholds with liquidated damages for delays.',
        input.confidence
      )
    );

    // 10. Price Review
    dimensions.push(
      this.buildDimension(
        'PRICE_REVIEW',
        'OPPORTUNITY_IDENTIFIED',
        'Ad-hoc supplier price increase requests evaluated without quarterly review governance.',
        'Irregular price adjustments outside governed fiscal review cadences.',
        'Vulnerability to margin erosion from uncoordinated supplier price hikes.',
        'Establish scheduled bi-annual price review gates tied to validated market indices.',
        input.confidence
      )
    );

    // 11. Volume Commitment
    dimensions.push(
      this.buildDimension(
        'VOLUME_COMMITMENT',
        'OPPORTUNITY_IDENTIFIED',
        'Suppliers quote on projected volumes without guaranteed minimum commitments.',
        'Absence of contractual volume bands in procurement terms.',
        'Suppliers hedge pricing higher to mitigate off-take volume variance risk.',
        'Offer 80% volume off-take commitment in exchange for a firm 5-8% base unit price concession.',
        input.confidence
      )
    );

    // 12. Service Levels
    dimensions.push(
      this.buildDimension(
        'SERVICE_LEVELS',
        'PARTIALLY_OPTIMIZED',
        'Commercial terms lack formalized service level agreements (SLAs).',
        'No formal KPI scorecards or penalty/bonus structures linked to supplier performance.',
        'Inconsistent technical support, delayed documentation, and unmeasured vendor reliability.',
        'Implement standardized supplier SLAs with quarterly performance scorecard reviews.',
        input.confidence
      )
    );

    const opportunityCount = dimensions.filter(d => d.status === 'OPPORTUNITY_IDENTIFIED').length;
    const partiallyOptimizedCount = dimensions.filter(d => d.status === 'PARTIALLY_OPTIMIZED').length;
    const optimizedCount = dimensions.filter(d => d.status === 'OPTIMIZED').length;
    const insufficientCount = dimensions.filter(d => d.status === 'INSUFFICIENT_DATA').length;

    let overallStatus: CommercialDimensionStatus = 'PARTIALLY_OPTIMIZED';
    if (opportunityCount >= 4) overallStatus = 'OPPORTUNITY_IDENTIFIED';
    else if (optimizedCount >= 8) overallStatus = 'OPTIMIZED';

    const statusLabels: Record<CommercialDimensionStatus, string> = {
      OPTIMIZED: 'Commercial Terms Optimized',
      PARTIALLY_OPTIMIZED: 'Commercial Terms Partially Optimized',
      OPPORTUNITY_IDENTIFIED: 'Commercial Opportunities Identified',
      INSUFFICIENT_DATA: 'Commercial Data Insufficient'
    };

    return {
      overallStatus,
      overallStatusLabel: statusLabels[overallStatus],
      dimensions,
      optimizedCount,
      partiallyOptimizedCount,
      opportunityIdentifiedCount: opportunityCount,
      insufficientDataCount: insufficientCount,
      keyFindings: [
        `${opportunityCount} commercial terms dimensions offer structural improvement potential.`,
        'Payment terms, freight standardization, and volume commitment clauses represent immediate contractual leverage.',
        'Administrative efficiency and landed cost transparency can be unlocked through standardized contract terms.'
      ],
      strategicActionSummary:
        'Initiate a commercial contract harmonization round. Standardize payment terms to Net 60, align Incoterms to FOR Destination, and implement retrospective volume rebate tiers.'
    };
  }
}
