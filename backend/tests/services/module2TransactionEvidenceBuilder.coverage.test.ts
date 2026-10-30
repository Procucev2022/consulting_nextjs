/**
 * Coverage tests for Module2TransactionEvidenceBuilder.
 * Drives the eligibility gates, identifier and item fallbacks, and the exclusion ledger with
 * steel plate purchase lines.
 */

import { describe, expect, it } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { TransactionEvidenceRecord } from '../../src/types/module2EvidenceChain';
import { EXCLUSION_REASON_DESCRIPTIONS } from '../../src/constants/module2EvidenceChain';
import { Module2TransactionEvidenceBuilder } from '../../src/services/module2TransactionEvidenceBuilder';

const CATEGORY_NAME = 'Structural Steel';

function purchaseLine(
  id: string,
  vendorName: string,
  unitPrice: number,
  quantity: number,
  overrides: Partial<StrategicInputTransaction> = {}
): StrategicInputTransaction {
  return {
    id,
    po_number: `PO-${id}`,
    po_date: '2026-01-10',
    vendor_code: `SUPP-${vendorName.slice(0, 4).toUpperCase()}`,
    vendor_name: vendorName,
    material_code: 'MAT-PLT-10',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity,
    uom: 'MT',
    unit_price: unitPrice,
    total_spend_inr: unitPrice * quantity,
    currency: 'INR',
    plant: 'Plant Jamshedpur',
    spend_category: CATEGORY_NAME,
    ...overrides
  };
}

function buildRecords(transactions: StrategicInputTransaction[]): TransactionEvidenceRecord[] {
  return Module2TransactionEvidenceBuilder.buildTransactionEvidenceRecords(CATEGORY_NAME, transactions);
}

function recordFor(records: TransactionEvidenceRecord[], transactionId: string): TransactionEvidenceRecord {
  const match = records.find(record => record.transactionId === transactionId);
  if (!match) {
    throw new Error(`Missing evidence record for ${transactionId}`);
  }
  return match;
}

describe('Module2TransactionEvidenceBuilder coverage', () => {
  it('returns no records or ledger entries for a category without purchase lines', () => {
    expect(buildRecords([])).toEqual([]);
    expect(Module2TransactionEvidenceBuilder.buildExclusionLedger([])).toEqual([]);
  });

  it('marks a line without a supplier name as insufficient data under an unspecified supplier', () => {
    const records = buildRecords([purchaseLine('TX-NOSUP', '', 65000, 1000, { vendor_code: undefined })]);
    const record = recordFor(records, 'TX-NOSUP');

    expect(record.isEligible).toBe(false);
    expect(record.exclusionReason).toBe('EXCLUDED_INSUFFICIENT_DATA');
    expect(record.comparabilityStatus).toBe('EXCLUDED');
    expect(record.dataQualityStatus).toBe('SUSPECT');
    expect(record.supplierName).toBe('Unspecified Supplier');
    expect(record.supplierId).toBe('SUPP-UNSP');
    expect(record.exclusionExplanation).toBe(EXCLUSION_REASON_DESCRIPTIONS.EXCLUDED_INSUFFICIENT_DATA);
  });

  it('marks a line without a material description as insufficient data and labels its item generically', () => {
    const records = buildRecords([purchaseLine('TX-NODESC', 'JSW Steel Ltd', 60000, 800, { material_desc: '' })]);
    const record = recordFor(records, 'TX-NODESC');

    expect(record.exclusionReason).toBe('EXCLUDED_INSUFFICIENT_DATA');
    expect(record.itemDescription).toBe('Unspecified Item');
    expect(record.subCategory).toBe('General');
  });

  it('uses the UNSPSC commodity as the sub-category when the line carries one', () => {
    const records = buildRecords([
      purchaseLine('TX-UNSPSC', 'JSW Steel Ltd', 60000, 800, { unspsc_commodity: 'Plates and Sheets' })
    ]);
    const record = recordFor(records, 'TX-UNSPSC');

    expect(record.subCategory).toBe('Plates and Sheets');
    expect(record.isEligible).toBe(true);
    expect(record.dataQualityStatus).toBe('VERIFIED');
  });

  it('excludes a line with zero unit price as an invalid transaction', () => {
    const records = buildRecords([purchaseLine('TX-FREE', 'Tata Steel Ltd', 0, 100, { total_spend_inr: 0 })]);
    const record = recordFor(records, 'TX-FREE');

    expect(record.exclusionReason).toBe('EXCLUDED_INVALID_TRANSACTION');
    expect(record.comparabilityStatus).toBe('EXCLUDED');
    expect(record.unitPrice).toBe(0);
    expect(record.totalValue).toBe(0);
  });

  it('excludes a line with zero quantity as an invalid transaction', () => {
    const records = buildRecords([purchaseLine('TX-ZERO', 'Tata Steel Ltd', 65000, 0, { total_spend_inr: 0 })]);
    const record = recordFor(records, 'TX-ZERO');

    expect(record.exclusionReason).toBe('EXCLUDED_INVALID_TRANSACTION');
    expect(record.comparabilityStatus).toBe('EXCLUDED');
    expect(record.quantity).toBe(0);
    expect(record.totalValue).toBe(0);
  });

  it('excludes a line priced above three times the category average as a single-source outlier', () => {
    // Average of 100, 100, 100, 100 and 1000 is 280, so 1000 is above 840.
    const records = buildRecords([
      purchaseLine('TX-A', 'Tata Steel Ltd', 100, 10),
      purchaseLine('TX-B', 'JSW Steel Ltd', 100, 10),
      purchaseLine('TX-C', 'Jindal Steel & Power', 100, 10),
      purchaseLine('TX-D', 'Steel Authority of India Ltd', 100, 10),
      purchaseLine('TX-E', 'Local Trader', 1000, 10)
    ]);

    expect(recordFor(records, 'TX-E').exclusionReason).toBe('EXCLUDED_SINGLE_SOURCE_OUTLIER');
    expect(recordFor(records, 'TX-A').isEligible).toBe(true);
    expect(recordFor(records, 'TX-A').exclusionReason).toBeUndefined();
  });

  it('excludes a line priced below one fifth of the category average as an outlier', () => {
    // Average of 1000, 1000, 1000, 1000 and 100 is 820, so 100 is below 164.
    const records = buildRecords([
      purchaseLine('TX-P1', 'Tata Steel Ltd', 1000, 10),
      purchaseLine('TX-P2', 'JSW Steel Ltd', 1000, 10),
      purchaseLine('TX-P3', 'Jindal Steel & Power', 1000, 10),
      purchaseLine('TX-P4', 'Steel Authority of India Ltd', 1000, 10),
      purchaseLine('TX-LOW', 'Broker Trader', 100, 10)
    ]);

    expect(recordFor(records, 'TX-LOW').exclusionReason).toBe('EXCLUDED_SINGLE_SOURCE_OUTLIER');
    expect(recordFor(records, 'TX-P1').isEligible).toBe(true);
  });

  it('skips the outlier test when the average price is not positive and keeps the remaining line', () => {
    // A credit line at a negative price drags the average to zero and the category spend to zero.
    const records = buildRecords([
      purchaseLine('TX-PURCHASE', 'Tata Steel Ltd', 100, 10, { total_spend_inr: 1000 }),
      purchaseLine('TX-CREDIT', 'Tata Steel Ltd', -100, 10, { total_spend_inr: -1000 })
    ]);

    expect(recordFor(records, 'TX-PURCHASE').isEligible).toBe(true);
    expect(recordFor(records, 'TX-PURCHASE').exclusionReason).toBeUndefined();
    expect(recordFor(records, 'TX-CREDIT').exclusionReason).toBe('EXCLUDED_INVALID_TRANSACTION');
  });

  it('flags a line below half a percent of category spend as low volume and keeps it partially comparable', () => {
    const records = buildRecords([
      purchaseLine('TX-BULK', 'Tata Steel Ltd', 65000, 1000),
      purchaseLine('TX-SAMPLE', 'JSW Steel Ltd', 60000, 1)
    ]);
    const sample = recordFor(records, 'TX-SAMPLE');

    expect(sample.exclusionReason).toBe('EXCLUDED_LOW_VOLUME');
    expect(sample.comparabilityStatus).toBe('PARTIALLY_COMPARABLE');
    expect(recordFor(records, 'TX-BULK').isEligible).toBe(true);
  });

  it('derives identifiers and item attributes from defaults when the source line omits them', () => {
    const records = buildRecords([
      {
        vendor_name: 'Jindal Steel & Power',
        material_desc: 'Carbon Steel Plate 12mm',
        quantity: 600,
        unit_price: 58000,
        total_spend_inr: 34800000
      }
    ]);
    const [record] = records;

    expect(record.transactionId).toBe('TX-STR-1');
    expect(record.poNumber).toBe('PO-1001');
    expect(record.poDate).toBe('2026-01-15');
    expect(record.supplierId).toBe('SUPP-JIND');
    expect(record.itemId).toBe('ITEM-101');
    expect(record.uom).toBe('Units');
    expect(record.currency).toBe('INR');
    expect(record.deliveryLocation).toBe('Primary Manufacturing Facility');
    expect(record.subCategory).toBe('Carbon Steel Plate 12mm');
    expect(record.itemDescription).toBe('Carbon Steel Plate 12mm');
    expect(record.sourceRow).toBe(1);
    expect(record.isEligible).toBe(true);
  });

  it('derives line value from unit price and quantity when the spend field is zero', () => {
    const records = buildRecords([purchaseLine('TX-NOSPEND', 'JSW Steel Ltd', 60000, 800, { total_spend_inr: 0 })]);

    expect(recordFor(records, 'TX-NOSPEND').totalValue).toBe(48000000);
  });

  it('copies exclusion explanations into the ledger and falls back to the reason description when absent', () => {
    const [zeroRecord] = buildRecords([
      purchaseLine('TX-ZERO-LEDGER', 'Tata Steel Ltd', 65000, 0, { total_spend_inr: 0 })
    ]);

    const [withExplanation] = Module2TransactionEvidenceBuilder.buildExclusionLedger([zeroRecord]);
    expect(withExplanation).toMatchObject({
      transactionId: 'TX-ZERO-LEDGER',
      exclusionCode: 'EXCLUDED_INVALID_TRANSACTION',
      spendInr: 0,
      quantity: 0,
      unitPrice: 65000,
      uom: 'MT'
    });
    expect(withExplanation.exclusionDetail).toBe(zeroRecord.exclusionExplanation);

    const [withoutExplanation] = Module2TransactionEvidenceBuilder.buildExclusionLedger([
      { ...zeroRecord, exclusionExplanation: undefined }
    ]);
    expect(withoutExplanation.exclusionDetail).toBe(EXCLUSION_REASON_DESCRIPTIONS.EXCLUDED_INVALID_TRANSACTION);
  });

  it('lists excluded lines in the ledger in input order and leaves out eligible lines', () => {
    const records = buildRecords([
      purchaseLine('TX-OK', 'Tata Steel Ltd', 65000, 1000),
      purchaseLine('TX-ZERO-QTY', 'JSW Steel Ltd', 60000, 0, { total_spend_inr: 0 }),
      purchaseLine('TX-NOVENDOR', '', 58000, 500, { vendor_code: undefined })
    ]);
    const ledger = Module2TransactionEvidenceBuilder.buildExclusionLedger(records);

    expect(ledger.map(entry => entry.transactionId)).toEqual(['TX-ZERO-QTY', 'TX-NOVENDOR']);
    expect(ledger.map(entry => entry.exclusionCode)).toEqual([
      'EXCLUDED_INVALID_TRANSACTION',
      'EXCLUDED_INSUFFICIENT_DATA'
    ]);
  });

  it('ignores ineligible records that carry no exclusion reason when building the ledger', () => {
    const [eligible] = buildRecords([purchaseLine('TX-KEEP', 'Tata Steel Ltd', 65000, 1000)]);
    const orphan: TransactionEvidenceRecord = { ...eligible, isEligible: false, exclusionReason: undefined };

    expect(Module2TransactionEvidenceBuilder.buildExclusionLedger([eligible, orphan])).toEqual([]);
  });
});
