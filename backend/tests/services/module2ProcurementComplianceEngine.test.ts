import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { Module2ProcurementComplianceChecks } from '../../src/services/module2ProcurementComplianceChecks';
import { Module2ProcurementComplianceEngine } from '../../src/services/module2ProcurementComplianceEngine';
import { Module2ProcurementComplianceExcelBuilder } from '../../src/services/module2ProcurementComplianceExcelBuilder';
import { Module2ProcurementComplianceController } from '../../src/controllers/module2ProcurementCompliance.controller';
import {
  COMPLIANCE_REVIEW_STATUSES,
  COMPLIANCE_CHECK_TYPES,
  COMPLIANCE_FINANCIAL_LABELS,
  COMPLIANCE_CONFIGURABLE_THRESHOLDS,
  COMPLIANCE_AUTHORIZED_ROLES,
  COMPLIANCE_DISCLOSURES,
  COMPLIANCE_METHODOLOGY_SAFEGUARDS,
  COMPLIANCE_EXCEL_SHEETS,
  procurementComplianceQuerySchema,
  procurementComplianceReviewSchema
} from '../../src/constants/module2ProcurementCompliance';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { ComplianceAuditStore } from '../../src/services/complianceAuditStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { generateAuthToken } from '../../src/utils/auth';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { ProcurementComplianceResult } from '../../src/types/module2ProcurementCompliance';

describe('Module 2 — Lever 9: Procurement Compliance & Control', () => {
  beforeAll(async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    ComplianceAuditStore.getInstance().setCustomDataDir(devDir);
    Module2CanonicalService.clearCache();
    await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
    await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');
  }, 180000);

  describe('1. Constants and Schema Validation', () => {
    it('exports complete governance constants and disclosures', () => {
      expect(COMPLIANCE_REVIEW_STATUSES.POTENTIAL_EXCEPTION).toBe('POTENTIAL_EXCEPTION');
      expect(COMPLIANCE_REVIEW_STATUSES.NOT_AN_EXCEPTION).toBe('NOT_AN_EXCEPTION');
      expect(COMPLIANCE_CHECK_TYPES.PRICE_INCONSISTENCY).toBe('PRICE_INCONSISTENCY');
      expect(COMPLIANCE_FINANCIAL_LABELS.POTENTIAL_EXPOSURE_REQUIRES_VALIDATION).toContain('Requires Validation');
      expect(COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE).toContain('Additional Contract or Rate-Card Data Required');
      expect(COMPLIANCE_METHODOLOGY_SAFEGUARDS.length).toBeGreaterThanOrEqual(8);
      expect(COMPLIANCE_EXCEL_SHEETS.SHEET_1_EXECUTIVE).toBe('Executive Summary');
    });

    it('validates query schema with defaults and custom values', () => {
      const parsedDefault = procurementComplianceQuerySchema.parse({});
      expect(parsedDefault.assessmentId).toBe('AIC-2026-0002');

      const parsedCustom = procurementComplianceQuerySchema.parse({ assessmentId: 'AIC-2026-0003' });
      expect(parsedCustom.assessmentId).toBe('AIC-2026-0003');

      const invalid = procurementComplianceQuerySchema.safeParse({ assessmentId: '' });
      expect(invalid.success).toBe(false);
    });

    it('validates review schema requiring dismissalReason when status is NOT_AN_EXCEPTION', () => {
      const valid = procurementComplianceReviewSchema.safeParse({
        candidateId: 'EX-001',
        status: 'VERIFIED_EXCEPTION',
        reviewerName: 'Lead Auditor',
        technicalJustification: 'Audit confirmed invoice variation'
      });
      expect(valid.success).toBe(true);

      const invalidDismissal = procurementComplianceReviewSchema.safeParse({
        candidateId: 'EX-002',
        status: 'NOT_AN_EXCEPTION',
        reviewerName: 'Lead Auditor',
        technicalJustification: 'No violation found'
      });
      expect(invalidDismissal.success).toBe(false);

      const emptyDismissal = procurementComplianceReviewSchema.safeParse({
        candidateId: 'EX-002',
        status: 'NOT_AN_EXCEPTION',
        reviewerName: 'Lead Auditor',
        technicalJustification: 'No violation found',
        dismissalReason: '   '
      });
      expect(emptyDismissal.success).toBe(false);

      const validDismissal = procurementComplianceReviewSchema.safeParse({
        candidateId: 'EX-002',
        status: 'NOT_AN_EXCEPTION',
        reviewerName: 'Lead Auditor',
        technicalJustification: 'No violation found',
        dismissalReason: 'Bulk purchase volume discount applied per commercial agreement'
      });
      expect(validDismissal.success).toBe(true);
    });
  });

  describe('2. Defensible Procurement Compliance Checks', () => {
    it('maps to supporting transactions accurately with complete and sparse data', () => {
      const txFull: StrategicInputTransaction = {
        id: 'TX-1',
        po_number: 'PO-1001',
        po_date: '2026-01-15',
        vendor_code: 'V-01',
        vendor_name: 'Supplier A',
        material_code: 'M-10',
        material_desc: 'Cotton Yarn 30s',
        plant: 'Plant 1',
        quantity: 500,
        uom: 'kg',
        unit_price: 200,
        total_spend_inr: 100000,
        currency: 'INR',
        ...({ invoice_number: 'INV-101', payment_terms: 'Net 30' } as unknown as Record<string, unknown>)
      };
      const suppFull = Module2ProcurementComplianceChecks.mapToSupportingTransaction(txFull);
      expect(suppFull.poNumber).toBe('PO-1001');
      expect(suppFull.totalSpendInr).toBe(100000);
      expect(suppFull.vendorName).toBe('Supplier A');
      expect(suppFull.invoiceNumber).toBe('INV-101');
      expect(suppFull.paymentTerms).toBe('Net 30');

      // Sparse data and whitespace
      const txSparse: StrategicInputTransaction = {
        id: '   ',
        po_number: '   ',
        po_date: '   ',
        vendor_code: '   ',
        vendor_name: '   ',
        material_code: '   ',
        material_desc: '   ',
        quantity: 0,
        unit_price: 0,
        total_spend_inr: 0,
        ...({ invoice_number: '   ', payment_terms: '   ' } as unknown as Record<string, unknown>)
      };
      const suppSparse = Module2ProcurementComplianceChecks.mapToSupportingTransaction(txSparse);
      expect(suppSparse.poNumber).toBe('N/A');
      expect(suppSparse.vendorName).toBe('Unknown Supplier');
      expect(suppSparse.materialDesc).toBe('General Material');
      expect(suppSparse.uom).toBe('units');
      expect(suppSparse.currency).toBe('INR');
      expect(suppSparse.invoiceNumber).toBeUndefined();
      expect(suppSparse.paymentTerms).toBeUndefined();
    });

    it('identifies price inconsistencies across material groups with sufficient variance and spend', () => {
      const group = new Map<string, StrategicInputTransaction[]>();
      group.set('M-10', [
        {
          id: 'TX-1',
          po_number: 'PO-1',
          po_date: '2026-01-10',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-10',
          material_desc: 'Cotton Yarn',
          quantity: 1000,
          uom: 'kg',
          unit_price: 260,
          total_spend_inr: 260000,
          currency: 'INR'
        },
        {
          id: 'TX-2',
          po_number: 'PO-2',
          po_date: '2026-01-20',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-10',
          material_desc: 'Cotton Yarn',
          quantity: 2000,
          uom: 'kg',
          unit_price: 200,
          total_spend_inr: 400000,
          currency: 'INR'
        }
      ]);

      const exceptions = Module2ProcurementComplianceChecks.checkPriceInconsistencies(group);
      expect(exceptions.length).toBe(1);
      expect(exceptions[0].checkType).toBe('PRICE_INCONSISTENCY');
      expect(exceptions[0].potentialFinancialExposureInr).toBe(60000); // 1000 * (260 - 200)
    });

    it('returns empty array when price is uniform or transactions are insufficient', () => {
      const group = new Map<string, StrategicInputTransaction[]>();
      group.set('M-20', [
        {
          id: 'TX-1',
          po_number: 'PO-1',
          po_date: '2026-01-10',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-20',
          material_desc: 'Uniform Yarn',
          quantity: 100,
          uom: 'kg',
          unit_price: 200,
          total_spend_inr: 20000,
          currency: 'INR'
        },
        {
          id: 'TX-2',
          po_number: 'PO-2',
          po_date: '2026-01-20',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-20',
          material_desc: 'Uniform Yarn',
          quantity: 200,
          uom: 'kg',
          unit_price: 200,
          total_spend_inr: 40000,
          currency: 'INR'
        }
      ]);
      expect(Module2ProcurementComplianceChecks.checkPriceInconsistencies(group).length).toBe(0);
      expect(Module2ProcurementComplianceChecks.checkPriceInconsistencies(new Map()).length).toBe(0);

      // Single item group
      const singleGroup = new Map<string, StrategicInputTransaction[]>();
      singleGroup.set('M-30', [
        {
          id: 'TX-1',
          po_number: 'PO-1',
          po_date: '2026-01-10',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-30',
          material_desc: 'Single Yarn',
          quantity: 100,
          uom: 'kg',
          unit_price: 200,
          total_spend_inr: 20000,
          currency: 'INR'
        }
      ]);
      expect(Module2ProcurementComplianceChecks.checkPriceInconsistencies(singleGroup).length).toBe(0);

      // Variance < 15%
      const smallVarianceGroup = new Map<string, StrategicInputTransaction[]>();
      smallVarianceGroup.set('M-40', [
        {
          id: 'TX-1',
          po_number: 'PO-1',
          po_date: '2026-01-10',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-40',
          material_desc: 'Yarn',
          quantity: 100,
          uom: 'kg',
          unit_price: 200,
          total_spend_inr: 20000,
          currency: 'INR'
        },
        {
          id: 'TX-2',
          po_number: 'PO-2',
          po_date: '2026-01-20',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-40',
          material_desc: 'Yarn',
          quantity: 100,
          uom: 'kg',
          unit_price: 210,
          total_spend_inr: 21000,
          currency: 'INR'
        }
      ]);
      expect(Module2ProcurementComplianceChecks.checkPriceInconsistencies(smallVarianceGroup).length).toBe(0);

      // Total excess < 25,000
      const smallExcessGroup = new Map<string, StrategicInputTransaction[]>();
      smallExcessGroup.set('M-50', [
        {
          id: 'TX-1',
          po_number: 'PO-1',
          po_date: '2026-01-10',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-50',
          material_desc: 'Yarn',
          quantity: 10,
          uom: 'kg',
          unit_price: 200,
          total_spend_inr: 2000,
          currency: 'INR'
        },
        {
          id: 'TX-2',
          po_number: 'PO-2',
          po_date: '2026-01-20',
          vendor_code: 'V-01',
          vendor_name: 'Supplier A',
          material_code: 'M-50',
          material_desc: 'Yarn',
          quantity: 10,
          uom: 'kg',
          unit_price: 300,
          total_spend_inr: 3000,
          currency: 'INR'
        }
      ]);
      expect(Module2ProcurementComplianceChecks.checkPriceInconsistencies(smallExcessGroup).length).toBe(0);
    });

    it('detects deterministic duplicates matching vendor, item, date, qty, and spend', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-10',
          po_number: 'PO-10',
          po_date: '2026-02-01',
          vendor_code: 'V-99',
          vendor_name: 'Vendor Z',
          material_code: 'M-99',
          material_desc: 'Packaging Tape',
          quantity: 50,
          uom: 'ROLL',
          unit_price: 100,
          total_spend_inr: 5000,
          currency: 'INR'
        },
        {
          id: 'TX-11',
          po_number: 'PO-11',
          po_date: '2026-02-01',
          vendor_code: 'V-99',
          vendor_name: 'Vendor Z',
          material_code: 'M-99',
          material_desc: 'Packaging Tape',
          quantity: 50,
          uom: 'ROLL',
          unit_price: 100,
          total_spend_inr: 5000,
          currency: 'INR'
        },
        // Incomplete record should return null key and be ignored
        {
          id: 'TX-12',
          po_number: 'PO-12',
          po_date: '2026-02-01',
          vendor_code: '',
          vendor_name: 'Vendor Z',
          material_code: 'M-99',
          quantity: 50,
          total_spend_inr: 5000
        }
      ];

      const dups = Module2ProcurementComplianceChecks.checkDeterministicDuplicates(txs);
      expect(dups.length).toBe(1);
      expect(dups[0].supportingTransactionsCount).toBe(2);
      expect(dups[0].potentialFinancialExposureInr).toBe(5000);
    });

    it('flags unreferenced PO / missing PO reference transactions with empty or dummy PO numbers', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-50',
          po_number: '',
          po_date: '2026-02-05',
          vendor_code: 'V-50',
          vendor_name: 'Maintenance Vendor',
          material_code: 'M-50',
          material_desc: 'Ad-hoc repair',
          quantity: 1,
          uom: 'SRV',
          unit_price: 75000,
          total_spend_inr: 75000,
          currency: 'INR'
        },
        {
          id: 'TX-51',
          po_number: 'DUMMY',
          po_date: '2026-02-06',
          vendor_code: 'V-51',
          vendor_name: 'Adhoc Vendor',
          material_code: 'M-51',
          material_desc: 'Ad-hoc repair 2',
          quantity: 1,
          uom: 'SRV',
          unit_price: 25000,
          total_spend_inr: 25000,
          currency: 'INR'
        },
        {
          id: 'TX-52',
          po_number: 'UNKNOWN',
          po_date: '2026-02-07',
          vendor_code: 'V-52',
          material_code: 'M-52',
          total_spend_inr: 1000
        },
        {
          id: 'TX-53',
          po_number: 'N/A',
          po_date: '2026-02-07',
          vendor_code: 'V-53',
          material_code: 'M-53',
          total_spend_inr: 1000
        },
        {
          id: 'TX-54',
          po_number: 'NULL',
          po_date: '2026-02-07',
          vendor_code: 'V-54',
          material_code: 'M-54',
          total_spend_inr: 1000
        },
        {
          id: 'TX-55',
          po_number: 'NONE',
          po_date: '2026-02-07',
          vendor_code: 'V-55',
          material_code: 'M-55',
          total_spend_inr: 1000
        },
        {
          id: 'TX-56',
          po_number: 'VALID-PO-99',
          po_date: '2026-02-07',
          vendor_code: 'V-56',
          vendor_name: 'Standard Vendor',
          material_code: 'M-56',
          material_desc: 'Standard item',
          quantity: 1,
          unit_price: 10000,
          total_spend_inr: 10000
        }
      ];
      const ex = Module2ProcurementComplianceChecks.checkPOAndControlGaps(txs);
      expect(ex.length).toBe(1);
      expect(ex[0].checkType).toBe('PO_TRANSACTION_EXCEPTION');
      expect(ex[0].supportingTransactionsCount).toBe(6);
      expect(ex[0].expenditureUnderReviewInr).toBe(104000);

      // When no missing POs exist
      expect(Module2ProcurementComplianceChecks.checkPOAndControlGaps([txs[6]]).length).toBe(0);
    });

    it('handles items with invalid or zero unit prices gracefully in price check', () => {
      const group = new Map<string, StrategicInputTransaction[]>();
      group.set('M-ZERO', [
        {
          id: 'TX-Z1',
          po_number: 'PO-Z1',
          quantity: 10,
          unit_price: 0,
          total_spend_inr: 0
        },
        {
          id: 'TX-Z2',
          po_number: 'PO-Z2',
          quantity: 10,
          unit_price: -10,
          total_spend_inr: 0
        }
      ]);
      expect(Module2ProcurementComplianceChecks.checkPriceInconsistencies(group).length).toBe(0);
    });

    it('identifies price inconsistencies with fallback defaults for missing category, vendor, desc, and uom', () => {
      const group = new Map<string, StrategicInputTransaction[]>();
      group.set('M-FALLBACK', [
        {
          id: 'TX-FB-1',
          po_number: 'PO-FB1',
          po_date: '2026-01-10',
          vendor_code: 'V-FB',
          material_code: 'M-FB',
          quantity: 1000,
          unit_price: 260,
          total_spend_inr: 260000
        },
        {
          id: 'TX-FB-2',
          po_number: 'PO-FB2',
          po_date: '2026-01-20',
          vendor_code: 'V-FB',
          material_code: 'M-FB',
          quantity: 2000,
          unit_price: 200,
          total_spend_inr: 400000
        }
      ]);

      const exceptions = Module2ProcurementComplianceChecks.checkPriceInconsistencies(group);
      expect(exceptions.length).toBe(1);
      expect(exceptions[0].spendCategory).toBe('General Procurement');
      expect(exceptions[0].vendorName).toBe('Multiple Suppliers');
      expect(exceptions[0].materialDesc).toBe('Clean Material Item');
    });

    it('identifies deterministic duplicates with fallback defaults when category, vendor, desc, or PO are missing', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-DUP-FB1',
          po_date: '2026-02-01',
          vendor_code: 'V-DUP',
          material_code: 'M-DUP',
          quantity: 100,
          unit_price: 50,
          total_spend_inr: 5000
        },
        {
          id: 'TX-DUP-FB2',
          po_date: '2026-02-01',
          vendor_code: 'V-DUP',
          material_code: 'M-DUP',
          quantity: 100,
          unit_price: 50,
          total_spend_inr: 5000
        }
      ];

      const dups = Module2ProcurementComplianceChecks.checkDeterministicDuplicates(txs);
      expect(dups.length).toBe(1);
      expect(dups[0].spendCategory).toBe('General Procurement');
      expect(dups[0].vendorName).toBe('Vendor');
      expect(dups[0].materialDesc).toBe('Item');
      expect(dups[0].evidenceDetails.some((d) => d.includes('POs involved'))).toBe(true);
    });

    it('covers non-string, standard, and zero-day payment terms in checkPaymentAndApprovalGaps', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-77',
          po_number: 'PO-77',
          po_date: '2026-02-10',
          vendor_code: 'V-77',
          vendor_name: 'Supplier X',
          material_code: 'M-77',
          material_desc: 'Urgent Supplies',
          quantity: 10,
          uom: 'EA',
          unit_price: 1000,
          total_spend_inr: 10000,
          currency: 'INR',
          ...({ payment_terms: '0 DAYS' } as unknown as Record<string, unknown>)
        },
        {
          id: 'TX-78',
          po_number: 'PO-78',
          po_date: '2026-02-11',
          vendor_code: 'V-78',
          vendor_name: 'Supplier Y',
          material_code: 'M-78',
          material_desc: 'Cash Supplies',
          quantity: 5,
          unit_price: 2000,
          total_spend_inr: 10000,
          ...({ payment_terms: 'CASH' } as unknown as Record<string, unknown>)
        },
        {
          id: 'TX-NUM-TERM',
          po_number: 'PO-NUM',
          po_date: '2026-02-10',
          vendor_code: 'V-NUM',
          vendor_name: 'Supplier Num',
          material_code: 'M-NUM',
          material_desc: 'Supplies',
          quantity: 10,
          unit_price: 1000,
          total_spend_inr: 10000,
          ...({ payment_terms: 45 } as unknown as Record<string, unknown>)
        }
      ];
      const ex = Module2ProcurementComplianceChecks.checkPaymentAndApprovalGaps(txs);
      expect(ex.length).toBe(2);
      expect(ex[0].checkType).toBe('PAYMENT_COMMERCIAL_EXCEPTION');
      expect(ex[0].supportingTransactionsCount).toBe(2);
      expect(ex[1].checkType).toBe('CONTRACT_COMPLIANCE_DISCLOSURE');
    });

    it('uses invoice_date when po_date is missing in deterministic duplicate check', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-INV-1',
          vendor_code: 'V-INV',
          material_code: 'M-INV',
          quantity: 10,
          total_spend_inr: 1000,
          ...({ invoice_date: '2026-03-01T00:00:00' } as unknown as Record<string, unknown>)
        },
        {
          id: 'TX-INV-2',
          vendor_code: 'V-INV',
          material_code: 'M-INV',
          quantity: 10,
          total_spend_inr: 1000,
          ...({ invoice_date: '2026-03-01T00:00:00' } as unknown as Record<string, unknown>)
        }
      ];
      const dups = Module2ProcurementComplianceChecks.checkDeterministicDuplicates(txs);
      expect(dups.length).toBe(1);
      expect(dups[0].expenditureUnderReviewInr).toBe(2000);
      expect(dups[0].potentialFinancialExposureInr).toBe(1000);
    });

    it('handles missing total spend in checkPOAndControlGaps and checkPaymentAndApprovalGaps', () => {
      const txMissingPO: StrategicInputTransaction[] = [
        {
          id: 'TX-NO-SPEND',
          po_number: '',
          quantity: 1,
          total_spend_inr: 0
        }
      ];
      const exPO = Module2ProcurementComplianceChecks.checkPOAndControlGaps(txMissingPO);
      expect(exPO.length).toBe(1);
      expect(exPO[0].expenditureUnderReviewInr).toBe(0);

      const txZeroDaysNoSpend: StrategicInputTransaction[] = [
        {
          id: 'TX-NO-SPEND-ZERO',
          quantity: 1,
          total_spend_inr: 0,
          ...({ payment_terms: 'IMMEDIATE' } as unknown as Record<string, unknown>)
        }
      ];
      const exPay = Module2ProcurementComplianceChecks.checkPaymentAndApprovalGaps(txZeroDaysNoSpend);
      expect(exPay.length).toBe(2);
      expect(exPay[0].expenditureUnderReviewInr).toBe(0);
    });

    it('identifies purchase pattern concentration when a supplier exceeds 40% of category spend', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-PAT-1',
          spend_category: 'Dyes & Chemicals',
          vendor_name: 'Sole Chemical Supplier',
          vendor_code: 'V-SOLE',
          quantity: 100,
          unit_price: 15000,
          total_spend_inr: 1500000
        },
        {
          id: 'TX-PAT-2',
          spend_category: 'Dyes & Chemicals',
          vendor_name: 'Secondary Supplier',
          vendor_code: 'V-SEC',
          quantity: 50,
          unit_price: 10000,
          total_spend_inr: 500000
        }
      ];
      const ex = Module2ProcurementComplianceChecks.checkPurchasePatternExceptions(txs);
      expect(ex.length).toBeGreaterThan(0);
      expect(ex[0].checkType).toBe('PURCHASE_PATTERN_EXCEPTION');
      expect(ex[0].potentialFinancialExposureInr).toBe(0);
      expect(ex[0].methodologyDescription).toContain('40%');
    });

    it('identifies sourcing approval gaps for transactions exceeding sourcing threshold', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-HIGH-1',
          vendor_name: 'Heavy Engineering Ltd',
          quantity: 1,
          unit_price: 3000000,
          total_spend_inr: 3000000
        }
      ];
      const ex = Module2ProcurementComplianceChecks.checkSourcingApprovalGaps(txs);
      expect(ex.length).toBe(1);
      expect(ex[0].checkType).toBe('SOURCING_APPROVAL_GAP');
      expect(ex[0].expenditureUnderReviewInr).toBe(3000000);
      expect(ex[0].potentialFinancialExposureInr).toBe(0);
    });

    it('records credit notes and transaction reversals without generating positive exposure', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-CR-1',
          po_number: 'PO-RET',
          vendor_name: 'Adjusted Supplier',
          quantity: -2,
          unit_price: 1000,
          total_spend_inr: -2000
        }
      ];
      const ex = Module2ProcurementComplianceChecks.checkPOAndControlGaps(txs);
      expect(ex.some((x) => x.checkTitle.includes('Credit Notes'))).toBe(true);
      const crEx = ex.find((x) => x.checkTitle.includes('Credit Notes'))!;
      expect(crEx.potentialFinancialExposureInr).toBe(0);
      expect(crEx.expenditureUnderReviewInr).toBe(2000);
    });
  });

  describe('3. Engine Execution & Calculation', () => {
    it('executes calculateProcurementCompliance on customer dataset', async () => {
      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      expect(result.assessmentId).toBe('AIC-2026-0002');
      expect(result.summary.totalTransactionsReviewedCount).toBeGreaterThan(0);
      expect(result.exceptions.length).toBeGreaterThan(0);
      expect(result.controlChecks.length).toBeGreaterThan(0);
      expect(result.contractComplianceNotice).toContain('Additional Contract or Rate-Card Data Required');
      expect(result.methodologySafeguards.length).toBeGreaterThan(5);
    });

    it('executes calculateProcurementCompliance on AIC-2026-0003 dataset', async () => {
      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0003');
      expect(result.assessmentId).toBe('AIC-2026-0003');
      expect(result.customerName).toBe('PQR Cement Ltd');
    });

    it('executes calculateProcurementCompliance with custom client fallback', async () => {
      const spy = vi.spyOn(Module2CanonicalService, 'getCanonicalTransactions').mockResolvedValueOnce([]);
      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-CUSTOM-99');
      expect(result.customerName).toBe('Enterprise Client (AIC-CUSTOM-99)');
      spy.mockRestore();
    });

    it('supports user review record injection, dismissal, and history appending', async () => {
      const initial = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      const targetId1 = initial.exceptions[0]?.exceptionId || 'COMPL-PRC-0001';
      const targetId2 = initial.exceptions[1]?.exceptionId || 'COMPL-DUP-0001';

      const reviews = {
        [targetId1]: [
          {
            reviewId: 'REV-01',
            reviewerName: 'Senior Auditor',
            reviewDate: '2026-03-01',
            status: COMPLIANCE_REVIEW_STATUSES.VERIFIED_EXCEPTION,
            technicalJustification: 'Confirmed price anomaly with supplier'
          }
        ],
        [targetId2]: {
          reviewId: 'REV-02',
          reviewerName: 'Lead Auditor',
          reviewerRole: 'Internal Audit',
          reviewDate: '2026-03-02',
          status: COMPLIANCE_REVIEW_STATUSES.NOT_AN_EXCEPTION,
          technicalJustification: 'Validated separate shipments',
          dismissalReason: 'Legitimate separate deliveries confirmed'
        }
      };

      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002', { reviews });
      const matched1 = result.exceptions.find((e) => e.exceptionId === targetId1);
      expect(matched1).toBeDefined();
      expect(matched1?.reviewStatus).toBe('VERIFIED_EXCEPTION');
      expect(matched1?.nextActionRequired).toContain('Exception verified by controller');

      const matched2 = result.exceptions.find((e) => e.exceptionId === targetId2);
      expect(matched2).toBeDefined();
      expect(matched2?.reviewStatus).toBe('NOT_AN_EXCEPTION');
      expect(matched2?.nextActionRequired).toContain('Exception dismissed by controller');
    });

    it('handles non-existent assessment error gracefully', async () => {
      await expect(
        Module2ProcurementComplianceEngine.calculateProcurementCompliance('NON_EXISTENT_ID')
      ).rejects.toThrow();
    });
  });

  describe('4. Authoritative Excel Export Workbook Generation', () => {
    it('generates an authentic 6-sheet Excel workbook buffer', async () => {
      const result = await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
      const buffer = Module2ProcurementComplianceExcelBuilder.buildWorkbook(result);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      const wb = XLSX.read(buffer, { type: 'buffer' });
      expect(wb.SheetNames).toContain(COMPLIANCE_EXCEL_SHEETS.SHEET_1_EXECUTIVE);
      expect(wb.SheetNames).toContain(COMPLIANCE_EXCEL_SHEETS.SHEET_2_EXCEPTIONS);
      expect(wb.SheetNames).toContain(COMPLIANCE_EXCEL_SHEETS.SHEET_3_CHECKS);
      expect(wb.SheetNames).toContain(COMPLIANCE_EXCEL_SHEETS.SHEET_4_DATA_GAPS);
      expect(wb.SheetNames).toContain(COMPLIANCE_EXCEL_SHEETS.SHEET_5_REVIEW_HISTORY);
      expect(wb.SheetNames).toContain(COMPLIANCE_EXCEL_SHEETS.SHEET_6_METHODOLOGY);
    });

    it('covers all optional fields in Excel workbook generation', () => {
      const mockResult: ProcurementComplianceResult = {
        assessmentId: 'TEST-01',
        customerName: 'Test Client',
        calculatedAt: '2026-03-01T10:00:00Z',
        contractComplianceNotice: 'Notice',
        financialDisclaimer: 'Disclaimer',
        methodologySafeguards: ['Safeguard 1'],
        summary: {
          tenantId: 'TEST',
          customerName: 'Test Client',
          totalTransactionsReviewedCount: 10,
          totalExceptionsIdentifiedCount: 1,
          awaitingReviewCount: 0,
          verifiedExceptionsCount: 1,
          dismissedCount: 0,
          potentialExceptionsCount: 0,
          dataInsufficientCount: 0,
          totalExpenditureUnderReviewInr: 100000,
          totalExpenditureUnderReviewCr: 0.01,
          totalPotentialFinancialExposureInr: 10000,
          totalPotentialFinancialExposureCr: 0.001,
          nonQuantifiableExceptionsCount: 0,
          totalDisclosedDataGapsCount: 1,
          contractComplianceStatus: 'Pending',
          financialDisclaimer: 'Disclaimer'
        },
        controlChecks: [
          {
            checkType: 'PRICE_INCONSISTENCY',
            checkTitle: 'Price Inconsistency',
            eligibleTransactionsCount: 10,
            exceptionsIdentifiedCount: 1,
            expenditureUnderReviewInr: 100000,
            expenditureUnderReviewCr: 0.01,
            potentialFinancialExposureInr: 10000,
            potentialFinancialExposureCr: 0.001,
            dataCoveragePct: 100,
            primaryDataGapNotice: undefined // covers undefined fallback
          }
        ],
        exceptions: [
          {
            exceptionId: 'EX-TEST-1',
            checkType: 'PRICE_INCONSISTENCY',
            checkTitle: 'Price Inconsistency',
            spendCategory: 'Direct Materials',
            vendorName: 'Supplier 1',
            vendorCode: undefined,
            materialCode: undefined,
            materialDesc: 'Sample Material',
            plant: undefined,
            supportingTransactionsCount: 2,
            expenditureUnderReviewInr: 100000,
            expenditureUnderReviewCr: 0.01,
            potentialFinancialExposureInr: 10000,
            potentialFinancialExposureCr: 0.001,
            financialExposureStatus: 'POTENTIAL_EXPOSURE_REQUIRES_VALIDATION',
            financialExposureStatusLabel: 'Requires Validation',
            methodologyDescription: 'Sample test',
            evidenceDetails: ['Sample evidence'],
            dataGapsDisclosed: ['Sample gap'],
            reviewStatus: 'VERIFIED_EXCEPTION',
            reviewHistory: [
              {
                reviewId: 'REV-1',
                reviewerName: 'Auditor',
                reviewerRole: undefined, // covers undefined fallback
                reviewDate: '2026-03-01',
                status: 'VERIFIED_EXCEPTION',
                technicalJustification: 'Valid',
                correctiveActionPlan: undefined, // covers undefined fallback
                dismissalReason: undefined // covers undefined fallback
              }
            ],
            potentialRelatedLevers: ['LEVER_1'],
            nextActionRequired: 'Review',
            supportingTransactions: []
          }
        ]
      };

      const buffer = Module2ProcurementComplianceExcelBuilder.buildWorkbook(mockResult);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('5. REST Controller Endpoints', () => {
    const testAuthToken = generateAuthToken(
      'usr-auditor-1',
      'lead.auditor@procucev.internal',
      'AUDIT_LEAD',
      'GOLD',
      'AIC-2026-0002'
    );
    const authHeaders = { authorization: `Bearer ${testAuthToken}` };

    it('returns 200 and compliance result for getProcurementCompliance', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: authHeaders } as unknown as Request;
      let responseData: unknown = null;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: unknown) => {
          responseData = data;
          return res;
        }
      } as unknown as Response;

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(statusCode).toBe(200);
      expect(responseData).toBeDefined();
    });

    it('rejects invalid query in getProcurementCompliance with 400 Bad Request', async () => {
      const req = { query: { assessmentId: '' }, headers: authHeaders } as unknown as Request;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(statusCode).toBe(400);
    });

    it('handles unexpected non-Error rejections in getProcurementCompliance with 500', async () => {
      const spy = vi.spyOn(Module2ProcurementComplianceEngine, 'calculateProcurementCompliance').mockRejectedValueOnce('Raw string error');
      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: authHeaders } as unknown as Request;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(statusCode).toBe(500);
      spy.mockRestore();
    });

    it('handles unexpected errors in getProcurementCompliance with 500', async () => {
      const spy = vi.spyOn(Module2ProcurementComplianceEngine, 'calculateProcurementCompliance').mockRejectedValueOnce(new Error('Simulated engine failure'));
      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: authHeaders } as unknown as Request;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(statusCode).toBe(500);
      spy.mockRestore();
    });

    it('handles review submissions and records audit entries', async () => {
      const req = {
        headers: authHeaders,
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0001',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Chief Procurement Auditor',
          reviewerRole: 'Internal Audit',
          technicalJustification: 'Validated against historical purchase register'
        }
      } as unknown as Request;

      let responseData: unknown = null;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: unknown) => {
          responseData = data;
          return res;
        }
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(statusCode).toBe(200);
      expect(responseData).toBeDefined();
    });

    it('rejects review submission with 403 Forbidden when user role is unauthorized', async () => {
      const guestToken = generateAuthToken(
        'usr-guest',
        'guest@procucev.internal',
        'UNAUTHORIZED_GUEST',
        'GOLD',
        'AIC-2026-0002'
      );
      const req = {
        headers: { authorization: `Bearer ${guestToken}`, 'x-user-role': 'UNAUTHORIZED_GUEST' },
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0001',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Guest User',
          reviewerRole: 'Guest',
          technicalJustification: 'Attempted audit review'
        }
      } as unknown as Request;

      let statusCode = 200;
      let responseBody: any = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: unknown) => {
          responseBody = data;
          return res;
        }
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(statusCode).toBe(403);
      expect(responseBody.message).toContain('not authorized');
    });

    it('rejects review submission with 404 Not Found when exception candidate does not exist', async () => {
      const req = {
        headers: authHeaders,
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-NONEXISTENT-9999',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Chief Auditor',
          reviewerRole: 'Auditor',
          technicalJustification: 'Valid justification'
        }
      } as unknown as Request;

      let statusCode = 200;
      let responseBody: any = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: unknown) => {
          responseBody = data;
          return res;
        }
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(statusCode).toBe(404);
      expect(responseBody.message).toContain('not found');
    });

    it('persists append-only compliance review audit history across backend restart', async () => {
      ComplianceAuditStore.getInstance().clear();
      const candidateId = 'COMPL-PRC-0001';
      const leadToken = generateAuthToken(
        'usr-lead',
        'Audit Lead 1',
        'AUDIT_LEAD',
        'GOLD',
        'AIC-2026-0002'
      );
      const req1 = {
        headers: { authorization: `Bearer ${leadToken}`, 'x-user-role': 'AUDIT_LEAD' },
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId,
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Audit Lead 1',
          reviewerRole: 'AUDIT_LEAD',
          technicalJustification: 'First verification justification',
          correctiveActionPlan: 'Initiate supplier credit adjustment'
        }
      } as unknown as Request;

      const res1 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req1, res1);

      const controllerToken = generateAuthToken(
        'usr-ctrl',
        'Finance Controller',
        'CONTROLLER',
        'GOLD',
        'AIC-2026-0002'
      );
      const req2 = {
        headers: { authorization: `Bearer ${controllerToken}`, 'x-user-role': 'CONTROLLER' },
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId,
          status: 'NOT_AN_EXCEPTION',
          reviewerName: 'Finance Controller',
          reviewerRole: 'CONTROLLER',
          technicalJustification: 'Re-reviewed after commercial confirmation',
          dismissalReason: 'Freight inclusion agreed in contract addendum'
        }
      } as unknown as Request;

      const res2 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req2, res2);

      // Simulate backend restart by resetting store instance
      ComplianceAuditStore.resetInstance();
      const freshStore = ComplianceAuditStore.getInstance();
      freshStore.setCustomDataDir(getDevelopmentDataDir());
      freshStore.loadFromDisk();

      const history = freshStore.getReviewHistoryForException('AIC-2026-0002', candidateId);
      expect(history.length).toBeGreaterThanOrEqual(2);

      const firstReview = history[0];
      expect(firstReview.exceptionId).toBe(candidateId);
      expect(firstReview.reviewerName).toBe('Audit Lead 1');
      expect(firstReview.reviewerRole).toBe('AUDIT_LEAD');
      expect(firstReview.status).toBe('VERIFIED_EXCEPTION');
      expect(firstReview.decision).toBe('VERIFY_EXCEPTION');
      expect(firstReview.technicalJustification).toBe('First verification justification');
      expect(firstReview.correctiveActionPlan).toBe('Initiate supplier credit adjustment');
      expect(firstReview.timestamp).toBeDefined();

      const secondReview = history[1];
      expect(secondReview.exceptionId).toBe(candidateId);
      expect(secondReview.previousStatus).toBe('VERIFIED_EXCEPTION');
      expect(secondReview.status).toBe('NOT_AN_EXCEPTION');
      expect(secondReview.decision).toBe('DISMISS_EXCEPTION');
      expect(secondReview.dismissalReason).toBe('Freight inclusion agreed in contract addendum');
      expect(secondReview.timestamp).toBeDefined();
    });

    it('rejects invalid review submissions with 400 Bad Request', async () => {
      const req = {
        headers: authHeaders,
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0002',
          status: 'NOT_AN_EXCEPTION',
          reviewerName: 'Auditor',
          technicalJustification: 'Dismissed'
          // dismissalReason omitted intentionally
        }
      } as unknown as Request;

      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(statusCode).toBe(400);
    });

    it('handles unexpected non-Error rejections in submitComplianceReview with 500', async () => {
      const spy = vi.spyOn(Module2ProcurementComplianceEngine, 'calculateProcurementCompliance').mockRejectedValueOnce('Simulated string rejection');
      const req = {
        headers: authHeaders,
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0001',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Auditor',
          technicalJustification: 'Justification'
        }
      } as unknown as Request;

      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(statusCode).toBe(500);
      spy.mockRestore();
    });

    it('handles unexpected errors in submitComplianceReview with 500', async () => {
      const spy = vi.spyOn(Module2ProcurementComplianceEngine, 'calculateProcurementCompliance').mockRejectedValueOnce(new Error('Simulated review failure'));
      const req = {
        headers: authHeaders,
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0001',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Auditor',
          technicalJustification: 'Justification'
        }
      } as unknown as Request;

      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(statusCode).toBe(500);
      spy.mockRestore();
    });

    it('exports excel workbook with proper headers', async () => {
      const headers: Record<string, string> = {};
      let bufferSent: unknown = null;

      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: authHeaders } as unknown as Request;
      const res = {
        setHeader: (key: string, val: string) => {
          headers[key] = val;
        },
        status: vi.fn().mockReturnThis(),
        send: (data: unknown) => {
          bufferSent = data;
        }
      } as unknown as Response;

      await Module2ProcurementComplianceController.exportExcel(req, res);
      expect(headers['Content-Type']).toContain('spreadsheetml');
      expect(headers['Content-Disposition']).toContain('attachment');
      expect(bufferSent).toBeDefined();
    });

    it('rejects invalid query in exportExcel with 400 Bad Request', async () => {
      const req = { query: { assessmentId: '' }, headers: authHeaders } as unknown as Request;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.exportExcel(req, res);
      expect(statusCode).toBe(400);
    });

    it('handles unexpected non-Error rejections in exportExcel with 500', async () => {
      const spy = vi.spyOn(Module2ProcurementComplianceEngine, 'calculateProcurementCompliance').mockRejectedValueOnce('Simulated raw export rejection');
      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: authHeaders } as unknown as Request;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.exportExcel(req, res);
      expect(statusCode).toBe(500);
      spy.mockRestore();
    });

    it('handles unexpected errors in exportExcel with 500', async () => {
      const spy = vi.spyOn(Module2ProcurementComplianceEngine, 'calculateProcurementCompliance').mockRejectedValueOnce(new Error('Simulated export failure'));
      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: authHeaders } as unknown as Request;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: vi.fn()
      } as unknown as Response;

      await Module2ProcurementComplianceController.exportExcel(req, res);
      expect(statusCode).toBe(500);
      spy.mockRestore();
    });

    it('clears controller memory reviews', () => {
      Module2ProcurementComplianceController.clearReviews();
      expect(Module2ProcurementComplianceController.getReviewsForAssessment('AIC-2026-0002')).toEqual({});
    });
  });
});
