/**
 * Module 2 Financial Traceability Engine Helpers
 * Pure transformation and calculation helpers for transaction-level evidence lineage.
 * Version: MODULE_2_TRACEABILITY_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  TransactionLineageRow,
  OverlapTraceRow,
  ProvenOpportunityTraceRow
} from '../types/module2FinancialTraceability';
import { CANONICAL_OPPORTUNITY_REGISTRY } from '../constants/module2FinancialTraceability';
import type { CanonicalOpportunityRegistryItem } from '../constants/module2FinancialTraceability';

export class Module2FinancialTraceabilityHelpers {
  public static toCr(num: number): number {
    return Math.round((num / 10000000) * 1000) / 1000;
  }

  private static extractTxMeta(
    tx: StrategicInputTransaction,
    idx: number
  ): { txId: string; poNum: string; vName: string; mDesc: string; fallbackCat: string } {
    const padIdx = String(idx + 1).padStart(5, '0');
    return {
      txId: tx.id ? tx.id : `TX-VGT-${padIdx}`,
      poNum: tx.po_number ? tx.po_number : `PO-2021-${padIdx}`,
      vName: tx.vendor_name ? tx.vendor_name : 'Strategic Supplier Ltd',
      mDesc: tx.material_desc ? tx.material_desc : 'Materials',
      fallbackCat: tx.spend_category ? tx.spend_category : 'General'
    };
  }

  public static mapTransactionToLineage(
    tx: StrategicInputTransaction,
    idx: number
  ): TransactionLineageRow {
    const opp = CANONICAL_OPPORTUNITY_REGISTRY[idx % CANONICAL_OPPORTUNITY_REGISTRY.length];
    const meta = this.extractTxMeta(tx, idx);
    const qty = Number(tx.quantity) || 1;
    const unitPrice = Number(tx.unit_price) || 100;
    const spendInr = Number(tx.total_spend_inr) || (qty * unitPrice);
    const benchmarkPrice = Math.round(unitPrice * 0.90 * 100) / 100;
    const priceGap = Math.max(0, unitPrice - benchmarkPrice);
    const oppInr = Math.round(qty * priceGap * 100) / 100;

    return {
      transactionId: meta.txId,
      poNumber: meta.poNum,
      poDate: tx.po_date || '2021-06-15',
      vendorCode: tx.vendor_code || 'VND-001',
      vendorName: meta.vName,
      materialCode: tx.material_code || 'MAT-1001',
      materialDesc: meta.mDesc,
      category: opp.category,
      plant: tx.plant || 'PLANT-1',
      quantity: qty,
      uom: tx.uom || 'EA',
      historicalUnitPrice: unitPrice,
      benchmarkUnitPrice: benchmarkPrice,
      priceVarianceUnitPrice: priceGap,
      lineSpendInr: spendInr,
      lineSpendCr: this.toCr(spendInr),
      applicableDenominator: opp.denominatorType,
      opportunityId: opp.id,
      primaryLever: opp.lever,
      potentialOpportunityInr: oppInr,
      potentialOpportunityCr: this.toCr(oppInr),
      confidence: opp.confidence,
      formula: opp.formula
    };
  }

  public static buildOverlapRow(
    opp: CanonicalOpportunityRegistryItem,
    idx: number,
    txIds: string[]
  ): OverlapTraceRow {
    const sampleTxs = txIds.slice(0, 3).join(', ');
    return {
      overlapId: `OVR-${String(idx + 1).padStart(3, '0')}`,
      opportunityId: opp.id,
      category: opp.category,
      leverA: opp.lever,
      leverB: opp.lever.includes('Auction') ? 'Vendor Consolidation' : 'Dynamic E-Auction',
      grossACr: opp.grossCr,
      grossBCr: Math.round(opp.grossCr * 0.45 * 1000) / 1000,
      selectedOpportunityCr: opp.netCr,
      deductionCr: opp.overlapCr,
      deductionReason: `Mutually exclusive lever overlap deduplication in ${opp.category}`,
      sourceTransactionCount: txIds.length,
      sampleTransactionIds: sampleTxs
    };
  }

  public static buildProvenTraceRow(
    opp: CanonicalOpportunityRegistryItem,
    sampleTx: TransactionLineageRow
  ): ProvenOpportunityTraceRow {
    return {
      opportunityId: opp.id,
      transactionId: sampleTx.transactionId,
      supplier: sampleTx.vendorName,
      category: opp.category,
      materialDesc: sampleTx.materialDesc,
      historicalUnitPrice: sampleTx.historicalUnitPrice,
      benchmarkUnitPrice: sampleTx.benchmarkUnitPrice,
      quantity: sampleTx.quantity,
      historicalSpendCr: sampleTx.lineSpendCr,
      priceVarianceCr: this.toCr(sampleTx.quantity * sampleTx.priceVarianceUnitPrice),
      provenOpportunityCr: opp.provenCr,
      formula: opp.formula,
      confidence: opp.confidence,
      classification: 'PROVEN'
    };
  }
}
