/**
 * Module 2 — Benefit Traceability & Audit Engine
 * Version: MODULE_2_SOURCING_LOGIC_V2.0
 * 
 * Provides complete transaction-level audit trail ("Why this number?")
 * matching Section 30 & 33 specifications.
 */

import type { SourcingDataConfidence } from '../types/module2StrategicSourcing';

export interface SourcingOpportunityAuditRecord {
  opportunityId: string;
  categoryId: string;
  categoryName: string;
  itemIds: string[];
  supplierIds: string[];
  opportunityType: 'E_AUCTION' | 'VENDOR_CONSOLIDATION' | 'CATEGORY_SPECIALIST' | 'VOLUME_BUNDLING' | 'PO_CONSOLIDATION';
  currentSpendInr: number;
  eligibleSpendInr: number;
  quantity: number;
  currentWeightedPrice: number;
  referencePrice: number;
  priceDifferential: number;
  referenceSupplierIds: string[];
  referenceTransactionIds: string[];
  referenceVolumeSharePct: number;
  grossOpportunityInr: number;
  overlapAmountInr: number;
  netOpportunityInr: number;
  confidence: SourcingDataConfidence;
  qualificationRules: string[];
  disqualificationRules: string[];
  calculationVersion: string;
  formulaDescription: string;
  timestamp: string;
}

export class Module2BenefitTraceabilityEngine {
  public static createAuditRecord(params: {
    opportunityId: string;
    categoryId: string;
    categoryName: string;
    itemIds: string[];
    supplierIds: string[];
    opportunityType: 'E_AUCTION' | 'VENDOR_CONSOLIDATION' | 'CATEGORY_SPECIALIST' | 'VOLUME_BUNDLING' | 'PO_CONSOLIDATION';
    currentSpendInr: number;
    eligibleSpendInr: number;
    quantity: number;
    currentWeightedPrice: number;
    referencePrice: number;
    referenceSupplierIds: string[];
    referenceTransactionIds: string[];
    referenceVolumeSharePct: number;
    grossOpportunityInr: number;
    overlapAmountInr: number;
    netOpportunityInr: number;
    confidence: SourcingDataConfidence;
    qualificationRules: string[];
    disqualificationRules?: string[];
    calculationVersion?: string;
  }): SourcingOpportunityAuditRecord {
    const diff = Math.max(0, params.currentWeightedPrice - params.referencePrice);
    const formulaDescription = `(${params.currentWeightedPrice.toFixed(2)} [Weighted Baseline] - ${params.referencePrice.toFixed(2)} [Credible Reference]) × ${params.quantity.toLocaleString()} [Eligible Qty] - ${params.overlapAmountInr} [Overlap Adjustment] = ₹${params.netOpportunityInr.toLocaleString()}`;

    return {
      opportunityId: params.opportunityId,
      categoryId: params.categoryId,
      categoryName: params.categoryName,
      itemIds: params.itemIds,
      supplierIds: params.supplierIds,
      opportunityType: params.opportunityType,
      currentSpendInr: Math.round(params.currentSpendInr),
      eligibleSpendInr: Math.round(params.eligibleSpendInr),
      quantity: Math.round(params.quantity),
      currentWeightedPrice: Math.round(params.currentWeightedPrice * 100) / 100,
      referencePrice: Math.round(params.referencePrice * 100) / 100,
      priceDifferential: Math.round(diff * 100) / 100,
      referenceSupplierIds: params.referenceSupplierIds,
      referenceTransactionIds: params.referenceTransactionIds,
      referenceVolumeSharePct: Math.round(params.referenceVolumeSharePct * 10) / 10,
      grossOpportunityInr: Math.round(params.grossOpportunityInr),
      overlapAmountInr: Math.round(params.overlapAmountInr),
      netOpportunityInr: Math.round(params.netOpportunityInr),
      confidence: params.confidence,
      qualificationRules: params.qualificationRules,
      disqualificationRules: params.disqualificationRules || [],
      calculationVersion: params.calculationVersion || 'MODULE_2_SOURCING_LOGIC_V2.0',
      formulaDescription,
      timestamp: new Date().toISOString()
    };
  }
}
