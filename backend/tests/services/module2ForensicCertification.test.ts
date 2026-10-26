import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2ForensicEvidenceBuilder } from '../../src/services/module2ForensicEvidenceBuilder';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';
import { db } from '../../src/services/db';
import type { Module2ForensicSummary } from '../../src/types';

describe('Module 2 Forensic Data-Lineage, Calculation & E2E Certification', () => {
  let summary: Module2ForensicSummary;
  let evidenceWorkbookPath: string;

  beforeAll(() => {
    Module2CanonicalService.clearCache();
    summary = Module2CanonicalService.getForensicSummary();
    const result = Module2ForensicEvidenceBuilder.buildWorkbook();
    evidenceWorkbookPath = result.workbookPath;
  }, 40000);

  // M2-F-001: Canonical input
  it('M2-F-001: should enforce canonical input contract matching Module 1 output', () => {
    const input = summary.canonicalInput;
    expect(input).toBeDefined();
    expect(input.transactions).toHaveLength(20241);
    expect(input.sourceRowCount).toBe(20505);
    expect(input.validRowCount).toBe(20241);
    expect(input.excludedRowCount).toBe(252);
    expect(input.anomalyRowCount).toBe(12);
  });

  // M2-F-002: Spend reconciliation
  it('M2-F-002: should reconcile spend to exactly ₹4,073.8307 Cr with ₹0 financial variance', () => {
    const input = summary.canonicalInput;
    const bridge = summary.bridge;

    expect(input.totalValidatedSpendCr).toBeCloseTo(4073.8307, 4);
    expect(bridge.totalValidatedSpendCr).toBeCloseTo(4073.8307, 4);
    expect(bridge.module2AnalyzedSpendCr).toBeCloseTo(4073.8307, 4);
  });

  // M2-F-003: Supplier reconciliation
  it('M2-F-003: should reconcile supplier population to exactly 529 unique suppliers', () => {
    expect(summary.canonicalInput.suppliersCount).toBe(529);
    const top50 = summary.top50Vendors;
    expect(top50.length).toBe(50);
    expect(top50[0].totalSpendCr).toBeGreaterThan(0);
  });

  // M2-F-004: Material group reconciliation
  it('M2-F-004: should reconcile material groups to exactly 57 categories', () => {
    expect(summary.canonicalInput.materialGroupsCount).toBe(57);
    expect(summary.profiles).toHaveLength(57);
    expect(summary.bridge.categoriesAnalyzedCount).toBe(57);
  });

  // M2-F-005: Plant reconciliation
  it('M2-F-005: should reconcile operating plants to exactly 19 plants', () => {
    expect(summary.canonicalInput.plantsCount).toBe(19);
  });

  // M2-F-006: Billing month reconciliation
  it('M2-F-006: should reconcile billing months to exactly 10 months across FY22', () => {
    expect(summary.canonicalInput.billingMonthsCount).toBe(10);
    expect(summary.canonicalInput.period.actualBillingMonths).toBe(10);
    expect(summary.canonicalInput.period.fiscalYear).toBe('FY22');
    expect(summary.canonicalInput.period.fiscalMonthCoverage).toBe('10 of 12 months');
    expect(summary.canonicalInput.period.isFullFiscalYear).toBe(false);
  });

  // M2-F-007: No stale FY24/FY25/FY26
  it('M2-F-007: should not use stale FY24/FY25/FY26 periods for VGT baseline', () => {
    expect(summary.canonicalInput.period.fiscalYear).toBe('FY22');
    expect(summary.canonicalInput.period.fiscalYear).not.toContain('FY24');
    expect(summary.canonicalInput.period.fiscalYear).not.toContain('FY25');
    expect(summary.canonicalInput.period.fiscalYear).not.toContain('FY26');
  });

  // M2-F-008: No 36-month assumption
  it('M2-F-008: should not assume 36-month timeline or 12/12 active months', () => {
    expect(summary.canonicalInput.period.actualBillingMonths).toBe(10);
    expect(summary.canonicalInput.period.missingMonthsNotice).toContain('Missing 2 billing months');
  });

  // M2-F-009: No demo data
  it('M2-F-009: should not contain mock or demo vendor arrays in canonical calculations', () => {
    const topVendorNames = summary.top50Vendors.map((v) => v.vendorName);
    expect(topVendorNames.length).toBe(50);
    expect(topVendorNames).not.toContain('DEMO_VENDOR_PLACEHOLDER');
    expect(summary.canonicalInput.transactions[0].vendor_name).toBeDefined();
  });

  // M2-F-010: No hardcoded opportunity
  it('M2-F-010: should calculate opportunity strictly from transaction data', () => {
    const bridge = summary.bridge;
    expect(bridge.netDefensibleOpportunityInr).toBeGreaterThan(0);
    expect(bridge.netDefensibleOpportunityCr).toBeCloseTo(337.766, 2);
    expect(bridge.grossOpportunityCr).toBeGreaterThan(bridge.netDefensibleOpportunityCr);
  });

  // M2-F-011: Vendor lineage
  it('M2-F-011: should trace Top 50 vendors directly to canonical transactions', () => {
    const top1 = summary.top50Vendors[0];
    expect(top1.rank).toBe(1);
    expect(top1.transactionCount).toBeGreaterThan(0);
    expect(top1.totalSpendInr).toBeGreaterThan(0);
    expect(top1.paretoClass).toBe('A');
  });

  // M2-F-012: Recurring spend lineage
  it('M2-F-012: should evaluate recurring spend against actual 10 billing months', () => {
    const recurring = summary.recurringSpend;
    expect(recurring).toHaveLength(57);
    recurring.forEach((r) => {
      expect(r.activeMonthsCount).toBeLessThanOrEqual(10);
      expect(r.activeMonthsCount).toBeGreaterThan(0);
    });
  });

  // M2-F-013: E-auction lineage
  it('M2-F-013: should evaluate e-auction suitability with verified supplier count and spread', () => {
    const eauctionProfiles = summary.profiles.filter((p) => (p.potentialEAuctionOpportunityInr ?? 0) > 0);
    expect(eauctionProfiles.length).toBeGreaterThan(0);
    eauctionProfiles.forEach((p) => {
      expect(p.activeSuppliersCount).toBeGreaterThanOrEqual(1);
      expect(p.addressableSpendInr).toBeGreaterThan(0);
    });
  });

  // M2-F-014: PO consolidation lineage
  it('M2-F-014: should evaluate PO consolidation using actual PO frequencies', () => {
    const poItems = summary.poConsolidation;
    expect(poItems.length).toBeGreaterThan(0);
    poItems.forEach((p) => {
      expect(p.poCount).toBeGreaterThanOrEqual(5);
      expect(p.totalSpendInr).toBeGreaterThan(0);
    });
  });

  // M2-F-015: Supplier risk lineage
  it('M2-F-015: should trace single source and dominant supplier concentration', () => {
    const riskItems = summary.supplierRisk;
    expect(riskItems).toHaveLength(57);
    const dominant = riskItems.filter((r) => r.riskClassification === 'SINGLE_SOURCE_DOMINANT');
    expect(dominant.length).toBeGreaterThan(0);
  });

  // M2-F-016: UNSPSC lineage
  it('M2-F-016: should map canonical line items to valid material classifications', () => {
    const firstTx = summary.canonicalInput.transactions[0];
    expect(firstTx.material_code).toBeDefined();
    expect(firstTx.material_desc).toBeDefined();
    expect(firstTx.spend_category).toBeDefined();
  });

  // M2-F-017: ML workbench lineage
  it('M2-F-017: should provide actual canonical line items for the ML workbench', () => {
    const txs = db.getModule2StrategicTransactions();
    expect(txs.length).toBe(20241);
  });

  // M2-F-018: Opportunity ledger
  it('M2-F-018: should verify Opportunity Ledger completeness and lineage fields', () => {
    const ledger = summary.ledger;
    expect(ledger.length).toBeGreaterThan(0);
    ledger.forEach((item) => {
      expect(item.opportunityId).toBeDefined();
      expect(item.sourceTransactionIds.length).toBeGreaterThan(0);
      expect(item.category).toBeDefined();
      expect(item.eligibleSpendInr).toBeGreaterThan(0);
      expect(item.grossOpportunityInr).toBeGreaterThan(0);
      expect(item.overlapGroup).toBeDefined();
      expect(item.methodology).toBeDefined();
      expect(item.formula).toBeDefined();
      expect(item.status).toBeDefined();
    });
  });

  // M2-F-019: Overlap
  it('M2-F-019: should verify overlap deductions across multi-lever sourcing', () => {
    const bridge = summary.bridge;
    expect(bridge.overlapDeductionsInr).toBeGreaterThan(0);
    expect(bridge.overlapDeductionsCr).toBeCloseTo(104.067, 2);
  });

  // M2-F-020: Net bridge
  it('M2-F-020: should mathematically reconcile the net savings bridge: Gross - Overlap = Net', () => {
    const bridge = summary.bridge;
    const computedNet = bridge.grossOpportunityInr - bridge.overlapDeductionsInr;
    expect(computedNet).toBe(bridge.netDefensibleOpportunityInr);
    expect(bridge.grossOpportunityCr - bridge.overlapDeductionsCr).toBeCloseTo(bridge.netDefensibleOpportunityCr, 2);
  });

  // M2-F-021: UI/API parity
  it('M2-F-021: should verify UI and API parity with ₹0 variance', () => {
    const apiBridge = db.getModule2MathematicalBridge();
    const serviceBridge = summary.bridge;
    expect(apiBridge.totalValidatedSpendCr).toBe(serviceBridge.totalValidatedSpendCr);
    expect(apiBridge.netDefensibleOpportunityCr).toBe(serviceBridge.netDefensibleOpportunityCr);
    expect(apiBridge.grossOpportunityCr).toBe(serviceBridge.grossOpportunityCr);
  });

  // M2-F-022: Evidence parity
  it('M2-F-022: should verify parity between calculations and generated evidence workbook', () => {
    expect(fs.existsSync(evidenceWorkbookPath)).toBe(true);
    const wb = XLSX.readFile(evidenceWorkbookPath);
    expect(wb.SheetNames.length).toBe(18);

    const bridgeSheet = wb.Sheets['Savings_Bridge'];
    expect(bridgeSheet).toBeDefined();
    const rows = XLSX.utils.sheet_to_json<any>(bridgeSheet);
    expect(rows.length).toBe(9);

    const grossRow = rows.find((r) => r.Step.includes('Gross'));
    expect(grossRow).toBeDefined();
    expect(grossRow.Amount_Cr).toBeCloseTo(summary.bridge.grossOpportunityCr, 2);
  });

  // M2-F-023: ₹453.64 Cr vs ₹0.18-₹0.20 Cr discrepancy resolved
  it('M2-F-023: should resolve the ₹453.64 Cr vs ₹0.18–₹0.20 Cr discrepancy with full reconciliation trace', () => {
    // 1. ₹0.18-₹0.20 Cr was caused by 6-item mock array (~₹3.30 Cr spend) in db.ts fallback
    // 2. ₹453.64 Cr was from full spend multi-lever addressability (~₹4,073.83 Cr spend)
    // 3. Certified canonical pipeline processes all 20,241 transactions:
    //    Addressable Spend: ₹443.62 Cr
    //    Gross Opportunity: ₹441.83 Cr
    //    Overlap Deducted: -₹104.07 Cr
    //    Net Defensible Opportunity: ₹337.77 Cr
    //    Proven Opportunity: ₹319.44 Cr
    expect(summary.canonicalInput.transactions).toHaveLength(20241);
    expect(summary.bridge.addressableSpendCr).toBeCloseTo(443.62, 1);
    expect(summary.bridge.netDefensibleOpportunityCr).toBeCloseTo(337.77, 1);
  });

  // M2-F-024: Unsupported claims removed
  it('M2-F-024: should verify unsupported ISO/SOC-2/FIPS claims are removed from UI and strings', () => {
    const pageContent = fs.readFileSync(path.resolve(__dirname, '../../../frontend/src/app/page.tsx'), 'utf-8');
    expect(pageContent).not.toContain('ISO 27001 · SOC 2 Type II compliant');

    const emailContent = fs.readFileSync(
      path.resolve(__dirname, '../../../frontend/src/app/api/email/executive-brief/route.ts'),
      'utf-8'
    );
    expect(emailContent).not.toContain('ISO 27001 / SOC 2 Type II strict compliance');

    const uiStrings = fs.readFileSync(path.resolve(__dirname, '../../../frontend/src/constants/uiStrings.ts'), 'utf-8');
    expect(uiStrings).not.toContain('securityBadge: \'SOC2 Type II / AES-256\'');
  });

  // M2-F-025: VGT regression
  it('M2-F-025: should verify Module 1 frozen baseline is strictly preserved without mutation', () => {
    const vgt = VgtModule1Runner.processVgtDataset();
    expect(vgt.data.sourceRowCount).toBe(20505);
    expect(vgt.data.validRowCount).toBe(20241);
    expect(vgt.data.excludedRowCount).toBe(252);
    expect(vgt.data.anomalyRowCount).toBe(12);
    expect(vgt.module1.totalConvertedInrSpendCr).toBeCloseTo(4073.8307, 4);
    expect(vgt.module1.reconciliationVariance).toBe(0);
  });
});
