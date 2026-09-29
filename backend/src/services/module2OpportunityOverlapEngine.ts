/**
 * Module 2 — Opportunity Overlap & Deduplication Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Strict Waterfall & Overlap Control.
 * Guarantees that no single transaction or spend pool contributes twice across
 * E-Auction, Vendor Consolidation, Specialist Realignment, or Volume Bundling.
 */

import type { PrimarySourcingLever, SourcingOpportunityStatus } from '../types/module2StrategicSourcing';

export interface OverlapDeduplicationResult {
  grossOpportunityInr: number;
  grossOpportunityInrCr: number;
  overlappingOpportunityInr: number;
  overlappingOpportunityInrCr: number;
  netQuantifiableOpportunityInr: number | null;
  netQuantifiableOpportunityInrCr: number | null;
  isQuantifiable: boolean;
  status: SourcingOpportunityStatus;
  statusLabel: string;
  primaryLever: PrimarySourcingLever;
  deduplicationRationale: string;
}

export class Module2OpportunityOverlapEngine {
  private static toCr(inr: number | null): number | null {
    if (inr === null) return null;
    return Math.round((inr / 10000000) * 1000) / 1000;
  }

  private static resolvePrimaryLever(
    maxCommercial: number,
    eauct: number,
    consol: number,
    spec: number,
    vol: number,
    adm: number
  ): PrimarySourcingLever {
    if (maxCommercial === eauct && eauct > 0) return 'E_AUCTION';
    if (maxCommercial === consol && consol > 0) return 'VENDOR_CONSOLIDATION';
    if (maxCommercial === spec && spec > 0) return 'CATEGORY_SPECIALIST_REALIGNMENT';
    if (maxCommercial === vol && vol > 0) return 'VOLUME_BUNDLING';
    if (adm > 0) return 'PO_CONSOLIDATION';
    return 'NO_QUANTIFIABLE_BENEFIT';
  }

  private static resolveStatus(
    eauct: number,
    consol: number,
    netTotal: number
  ): { status: SourcingOpportunityStatus; statusLabel: string } {
    if (netTotal <= 0) {
      return {
        status: 'IDENTIFIED_NOT_QUANTIFIABLE',
        statusLabel: 'Opportunity Identified — Benefit Not Yet Quantifiable'
      };
    }
    if (eauct > 0 && consol > 0) {
      return {
        status: 'E_AUCTION_AND_CONSOLIDATION',
        statusLabel: 'E-Auction & Vendor Consolidation Candidate'
      };
    }
    if (eauct > 0) {
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

  private static buildInsufficientResult(): OverlapDeduplicationResult {
    return {
      grossOpportunityInr: 0,
      grossOpportunityInrCr: 0,
      overlappingOpportunityInr: 0,
      overlappingOpportunityInrCr: 0,
      netQuantifiableOpportunityInr: null,
      netQuantifiableOpportunityInrCr: null,
      isQuantifiable: false,
      status: 'IDENTIFIED_NOT_QUANTIFIABLE',
      statusLabel: 'Opportunity Identified — Benefit Not Yet Quantifiable',
      primaryLever: 'NO_QUANTIFIABLE_BENEFIT',
      deduplicationRationale: 'Insufficient comparable transaction evidence to substantiate quantifiable commercial opportunity.'
    };
  }

  private static buildRationale(overlapInr: number): string {
    if (overlapInr > 0) {
      return `Eliminated ₹${(overlapInr / 100000).toFixed(2)} Lakhs in cross-lever overlap between E-Auction, Consolidation and Specialist sourcing to strictly prevent double counting.`;
    }
    return 'No cross-lever overlap detected across evaluated sourcing pools.';
  }

  public static deduplicateCategoryOpportunities(
    eauctionInr: number | null,
    consolidationInr: number | null,
    specialistInr = 0,
    volumeBundlingInr = 0,
    adminInr = 0,
    isDataSufficient = true,
    comparableTxCount = 2
  ): OverlapDeduplicationResult {
    if (!isDataSufficient || comparableTxCount < 2) {
      return this.buildInsufficientResult();
    }

    const eauct = eauctionInr || 0;
    const consol = consolidationInr || 0;
    const spec = specialistInr || 0;
    const vol = volumeBundlingInr || 0;
    const adm = adminInr || 0;

    const commercialGross = eauct + consol + spec + vol;
    const totalGross = commercialGross + adm;

    // Mutually exclusive commercial selection (highest verified lever) plus independent admin
    const maxCommercial = Math.max(eauct, consol, spec, vol);
    const netTotal = maxCommercial + adm;
    const overlapInr = Math.max(0, totalGross - netTotal);

    const primaryLever = this.resolvePrimaryLever(maxCommercial, eauct, consol, spec, vol, adm);
    const { status, statusLabel } = this.resolveStatus(eauct, consol, netTotal);
    const deduplicationRationale = this.buildRationale(overlapInr);

    const isQuantifiable = netTotal > 0;
    const netQuantifiableOpportunityInr = isQuantifiable ? netTotal : null;

    return {
      grossOpportunityInr: totalGross,
      grossOpportunityInrCr: this.toCr(totalGross) || 0,
      overlappingOpportunityInr: overlapInr,
      overlappingOpportunityInrCr: this.toCr(overlapInr) || 0,
      netQuantifiableOpportunityInr,
      netQuantifiableOpportunityInrCr: this.toCr(netQuantifiableOpportunityInr),
      isQuantifiable,
      status,
      statusLabel,
      primaryLever,
      deduplicationRationale
    };
  }
}
