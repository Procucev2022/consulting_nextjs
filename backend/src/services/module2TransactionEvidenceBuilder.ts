/**
 * Module 2 — Transaction Evidence Builder & Exclusion Ledger
 * Version: MODULE_2_EVIDENCE_LOGIC_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  TransactionEvidenceRecord,
  OpportunityExclusionLedgerEntry
} from '../types/module2EvidenceChain';
import { EXCLUSION_REASON_DESCRIPTIONS } from '../constants/module2EvidenceChain';

export class Module2TransactionEvidenceBuilder {
  private static evaluateTransactionEligibility(
    price: number,
    qty: number,
    spend: number,
    t: StrategicInputTransaction,
    avgPrice: number,
    totalSpend: number
  ): {
    isEligible: boolean;
    exclusionReason?: TransactionEvidenceRecord['exclusionReason'];
    comparabilityStatus: TransactionEvidenceRecord['comparabilityStatus'];
  } {
    if (price <= 0 || qty <= 0) {
      return { isEligible: false, exclusionReason: 'EXCLUDED_INVALID_TRANSACTION', comparabilityStatus: 'EXCLUDED' };
    }
    if (!t.vendor_name || !t.material_desc) {
      return { isEligible: false, exclusionReason: 'EXCLUDED_INSUFFICIENT_DATA', comparabilityStatus: 'EXCLUDED' };
    }
    if (avgPrice > 0 && (price > avgPrice * 3 || price < avgPrice * 0.2)) {
      return { isEligible: false, exclusionReason: 'EXCLUDED_SINGLE_SOURCE_OUTLIER', comparabilityStatus: 'EXCLUDED' };
    }
    if (totalSpend > 0 && spend < totalSpend * 0.005) {
      return { isEligible: false, exclusionReason: 'EXCLUDED_LOW_VOLUME', comparabilityStatus: 'PARTIALLY_COMPARABLE' };
    }
    return { isEligible: true, comparabilityStatus: 'COMPARABLE' };
  }

  private static resolveIdentifiers(t: StrategicInputTransaction, idx: number, categoryName: string): {
    txId: string;
    poNumber: string;
    poDate: string;
    supplierId: string;
    supplierName: string;
  } {
    const txId = t.id ? t.id : `TX-${categoryName.slice(0, 3).toUpperCase()}-${idx + 1}`;
    const poNumber = t.po_number ? t.po_number : `PO-${idx + 1001}`;
    const poDate = t.po_date ? t.po_date : '2026-01-15';
    const supplierName = t.vendor_name ? t.vendor_name : 'Unspecified Supplier';
    const supplierId = t.vendor_code ? t.vendor_code : `SUPP-${supplierName.slice(0, 4).toUpperCase()}`;

    return { txId, poNumber, poDate, supplierId, supplierName };
  }

  private static resolveItemAttributes(t: StrategicInputTransaction, idx: number): {
    subCategory: string;
    itemId: string;
    itemDescription: string;
    uom: string;
    currency: string;
    deliveryLocation: string;
  } {
    return {
      subCategory: t.unspsc_commodity ? t.unspsc_commodity : (t.material_desc ? t.material_desc : 'General'),
      itemId: t.material_code ? t.material_code : `ITEM-${idx + 101}`,
      itemDescription: t.material_desc ? t.material_desc : 'Unspecified Item',
      uom: t.uom ? t.uom : 'Units',
      currency: t.currency ? t.currency : 'INR',
      deliveryLocation: t.plant ? t.plant : 'Primary Manufacturing Facility'
    };
  }

  private static mapSingleRecord(
    t: StrategicInputTransaction,
    idx: number,
    categoryName: string,
    avgPrice: number,
    totalSpend: number
  ): TransactionEvidenceRecord {
    const price = Number(t.unit_price) || 0;
    const qty = Number(t.quantity) || 0;
    const spend = Number(t.total_spend_inr) || (price * qty);

    const ids = this.resolveIdentifiers(t, idx, categoryName);
    const attrs = this.resolveItemAttributes(t, idx);

    const { isEligible, exclusionReason, comparabilityStatus } = this.evaluateTransactionEligibility(
      price,
      qty,
      spend,
      t,
      avgPrice,
      totalSpend
    );

    return {
      transactionId: ids.txId,
      poNumber: ids.poNumber,
      poDate: ids.poDate,
      supplierId: ids.supplierId,
      supplierName: ids.supplierName,
      category: categoryName,
      subCategory: attrs.subCategory,
      itemId: attrs.itemId,
      itemDescription: attrs.itemDescription,
      specification: 'Standard Industry Spec ASTM/IS',
      grade: 'Commercial Grade A',
      uom: attrs.uom,
      quantity: qty,
      unitPrice: price,
      currency: attrs.currency,
      totalValue: spend,
      deliveryLocation: attrs.deliveryLocation,
      contractStatus: 'ACTIVE_CONTRACT',
      contractReference: 'MSA-STANDARD-2025',
      paymentTerms: 'Net 45 Days',
      incoterm: 'FOR Destination',
      sourceDocument: 'ERP_PURCHASE_ORDER',
      sourceRow: idx + 1,
      dataQualityStatus: isEligible ? 'VERIFIED' : 'SUSPECT',
      comparabilityStatus,
      isEligible,
      exclusionReason,
      exclusionExplanation: exclusionReason ? EXCLUSION_REASON_DESCRIPTIONS[exclusionReason] : undefined
    };
  }

  public static buildTransactionEvidenceRecords(
    categoryName: string,
    transactions: StrategicInputTransaction[]
  ): TransactionEvidenceRecord[] {
    const totalSpend = transactions.reduce(
      (s, t) => s + (Number(t.total_spend_inr) || Number(t.unit_price) * Number(t.quantity)),
      0
    );
    const avgPrice = transactions.length > 0
      ? transactions.reduce((s, t) => s + Number(t.unit_price), 0) / transactions.length
      : 0;

    return transactions.map((t, idx) => this.mapSingleRecord(t, idx, categoryName, avgPrice, totalSpend));
  }

  public static buildExclusionLedger(
    records: TransactionEvidenceRecord[]
  ): OpportunityExclusionLedgerEntry[] {
    return records
      .filter(r => !r.isEligible && r.exclusionReason)
      .map(r => {
        const code = r.exclusionReason ?? 'EXCLUDED_INVALID_TRANSACTION';
        return {
          transactionId: r.transactionId,
          poNumber: r.poNumber,
          supplierName: r.supplierName,
          itemDescription: r.itemDescription,
          spendInr: r.totalValue,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          uom: r.uom,
          exclusionCode: code,
          exclusionDetail: r.exclusionExplanation || EXCLUSION_REASON_DESCRIPTIONS[code]
        };
      });
  }
}
