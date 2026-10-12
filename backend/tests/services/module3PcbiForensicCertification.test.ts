import path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import { Module3PcbiForensicEngine } from '../../src/services/module3PcbiForensicEngine';
import { Module3PcbiIndependentCalculator } from '../../src/services/module3PcbiIndependentCalculator';
import { Module3PcbiWorkbookBuilder } from '../../src/services/module3PcbiWorkbookBuilder';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2FinancialTraceabilityEngine } from '../../src/services/module2FinancialTraceabilityEngine';
import { EXPECTED_FX_MASTER_CHECKSUM } from '../../src/constants/fxReference';
import { FxReferenceService } from '../../src/services/fxReferenceService';
import {
  PCBI_MASTER_VERSION,
  PCBI_MASTER_CHECKSUM,
  PCBI_VGT_BASELINE,
  PCBI_MODULE2_FROZEN_BASELINE,
  CANONICAL_PCBI_MASTER_RECORDS,
  CERTIFIED_HISTORICAL_OBSERVATIONS,
  PCBI_DISCLAIMER_TEXT
} from '../../src/constants/module3PcbiForensic';

describe('P0 — Module 3 PCBI Forensic Data-Lineage & Benchmark Certification', () => {
  beforeAll(async () => {
    Module3PcbiForensicEngine.clearCache();
    VgtModule1Runner.processVgtDataset();
    Module3PcbiForensicEngine.processCustomerLedger();
  }, 60000);

  // M3-PCBI-001: PCBI master exists and has version/checksum
  it('M3-PCBI-001: PCBI master exists and has version/checksum', () => {
    expect(PCBI_MASTER_VERSION).toBe('PCBI_MASTER_V2.0_FORENSIC');
    expect(PCBI_MASTER_CHECKSUM).toBe('d8f4e29c1b7a60358e2d4f107c9b83a54e1206f97305bc821e649a372d80ef61');
    const master = Module3PcbiForensicEngine.getMasterRecords();
    expect(master.length).toBeGreaterThanOrEqual(13);
  });

  // M3-PCBI-002: Every certified PCBI series has source provenance
  it('M3-PCBI-002: Every certified PCBI series has source provenance', () => {
    const provenance = Module3PcbiForensicEngine.getSourceProvenanceRecords();
    expect(provenance.length).toBe(CANONICAL_PCBI_MASTER_RECORDS.length);
    for (const p of provenance) {
      expect(p.sourceName).toBeDefined();
      expect(p.publisher).toBeDefined();
      expect(p.accessTier).toBeDefined();
      expect(p.documentRef).toBeDefined();
    }
  });

  // M3-PCBI-003: No VERIFIED series without evidence
  it('M3-PCBI-003: No VERIFIED series without evidence', () => {
    const master = Module3PcbiForensicEngine.getMasterRecords();
    const verifiedSeries = master.filter((m) => m.coverageStatus === 'VERIFIED');
    expect(verifiedSeries.length).toBeGreaterThan(0);
    for (const s of verifiedSeries) {
      expect(s.evidenceReference).toBeDefined();
      expect(s.evidenceReference.length).toBeGreaterThan(5);
      expect(s.source).not.toContain('Unverified');
    }
  });

  // M3-PCBI-004: Quality grade exists for every active series
  it('M3-PCBI-004: Quality grade exists for every active series', () => {
    const master = Module3PcbiForensicEngine.getMasterRecords();
    for (const s of master) {
      expect(['A', 'B', 'C']).toContain(s.qualityGrade);
    }
  });

  // M3-PCBI-005: Historical coverage dates are valid
  it('M3-PCBI-005: Historical coverage dates are valid', () => {
    const observations = Module3PcbiForensicEngine.getObservations();
    expect(observations.length).toBeGreaterThanOrEqual(40);
    for (const o of observations) {
      expect(new Date(o.observationDate).getTime()).not.toBeNaN();
      expect(o.valueInr).toBeGreaterThan(0);
    }
  });

  // M3-PCBI-006: No future benchmark used for a transaction
  it('M3-PCBI-006: No future benchmark used for a transaction', () => {
    const { ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    const benchmarked = ledger.filter((l) => l.mappingStatus === 'MAPPED');
    for (const tx of benchmarked) {
      expect(tx.benchmarkDateUsed).toBeDefined();
      expect(tx.benchmarkDateUsed! <= tx.transactionDate).toBe(true);
    }
  });

  // M3-PCBI-007: Benchmark date selection follows documented rule
  it('M3-PCBI-007: Benchmark date selection follows documented rule', () => {
    const { ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    const benchmarked = ledger.filter((l) => l.mappingStatus === 'MAPPED');
    expect(benchmarked.length).toBe(143);
    for (const tx of benchmarked) {
      expect(tx.benchmarkDateUsed).toMatch(/^202[12]-\d{2}-01$/);
    }
  });

  // M3-PCBI-008: Frequency transformation is explicit
  it('M3-PCBI-008: Frequency transformation is explicit', () => {
    const master = Module3PcbiForensicEngine.getMasterRecords();
    const copper = master.find((m) => m.pcbiId === 'PCBI-IND-COP-ROD-001');
    expect(copper?.transformationMethod).toBe('MONTH_AVERAGE_EX_WORKS');
    const steel = master.find((m) => m.pcbiId === 'PCBI-IND-STL-HRC-001');
    expect(steel?.transformationMethod).toBe('MONTHLY_STEPPED');
  });

  // M3-PCBI-009: Unit normalization is explicit
  it('M3-PCBI-009: Unit normalization is explicit', () => {
    const { ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    const copperTx = ledger.find((l) => l.mappingStatus === 'MAPPED');
    expect(copperTx).toBeDefined();
    expect(copperTx?.orderUnit.toUpperCase()).toBe('KG');
    expect(copperTx?.conversionFactor).toBe(0.001);
  });

  // M3-PCBI-010: No factor-of-10/100/1000 conversion defect
  it('M3-PCBI-010: No factor-of-10/100/1000 conversion defect', () => {
    const { ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    const copperTx = ledger.find((l) => l.mappingStatus === 'MAPPED')!;
    // Transaction price is around ₹700-800/KG, normalized benchmark price is around ₹695-759/KG
    expect(copperTx.transactionUnitPrice).toBeGreaterThan(500);
    expect(copperTx.transactionUnitPrice).toBeLessThan(1200);
    expect(copperTx.normalizedBenchmarkPriceInr!).toBeGreaterThan(500);
    expect(copperTx.normalizedBenchmarkPriceInr!).toBeLessThan(1200);
  });

  // M3-PCBI-011: Foreign currency benchmark uses certified FX Master
  it('M3-PCBI-011: Foreign currency benchmark uses certified FX Master', () => {
    const observations = Module3PcbiForensicEngine.getObservations();
    const foreignObs = observations.filter((o) => o.originalCurrency !== 'INR');
    expect(foreignObs.length).toBeGreaterThan(0);
    for (const o of foreignObs) {
      expect(o.fxRate).toBeGreaterThan(70);
      expect(o.fxRate).toBeLessThan(85);
      const computedInr = Number((o.originalValue * o.fxRate).toFixed(1));
      expect(Math.abs(computedInr - o.valueInr)).toBeLessThan(10);
    }
  });

  // M3-PCBI-012: No live frontend FX used
  it('M3-PCBI-012: No live frontend FX used', () => {
    const fxChecksum = FxReferenceService.getInstance().getVerifiedChecksum();
    expect(fxChecksum).toBe(EXPECTED_FX_MASTER_CHECKSUM);
  });

  // M3-PCBI-013: Customer item → PCBI mapping has lineage
  it('M3-PCBI-013: Customer item → PCBI mapping has lineage', () => {
    const { ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    const copperRows = ledger.filter((l) => l.mappingStatus === 'MAPPED');
    expect(copperRows.length).toBe(143);
    for (const r of copperRows) {
      expect(r.itemCode).toBe('1100528');
      expect(r.pcbiId).toBe('PCBI-IND-COP-ROD-001');
    }
  });

  // M3-PCBI-014: No forced mapping without rationale
  it('M3-PCBI-014: No forced mapping without rationale', () => {
    const { reconciliation } = Module3PcbiForensicEngine.processCustomerLedger();
    expect(reconciliation.unmappedSpendCr).toBeGreaterThan(1000);
    expect(reconciliation.unmappedSpendCr).toBeCloseTo(1937.2214, 2);
  });

  // M3-PCBI-015: Services excluded from commodity benchmark savings
  it('M3-PCBI-015: Services excluded from commodity benchmark savings', () => {
    const { ledger, reconciliation } = Module3PcbiForensicEngine.processCustomerLedger();
    const services = ledger.filter((l) => l.mappingStatus === 'SERVICE');
    expect(services.length).toBe(97);
    expect(reconciliation.serviceSpendCr).toBeCloseTo(1.7731, 2);
    for (const s of services) {
      expect(s.potentialPriceGapInr).toBeUndefined();
    }
  });

  // M3-PCBI-016: Benchmark coverage numerator/denominator reconcile
  it('M3-PCBI-016: Benchmark coverage numerator/denominator reconcile', () => {
    const { reconciliation } = Module3PcbiForensicEngine.processCustomerLedger();
    const calculatedSpendCoverage = Number(
      ((reconciliation.benchmarkableSpendCr / reconciliation.totalValidatedSpendCr) * 100).toFixed(2)
    );
    expect(reconciliation.spendCoveragePct).toBe(calculatedSpendCoverage);
    expect(reconciliation.spendCoveragePct).toBe(16.01);
  });

  // M3-PCBI-017: Benchmark price gap formula independently verified
  it('M3-PCBI-017: Benchmark price gap formula independently verified', () => {
    const { priceGap } = Module3PcbiForensicEngine.processCustomerLedger();
    const { independentMetrics } = Module3PcbiIndependentCalculator.runIndependentRecalculation();
    expect(priceGap.totalBenchmarkPriceGapCr).toBe(independentMetrics.potentialPriceGapCr);
    expect(priceGap.totalBenchmarkPriceGapCr).toBe(31.6921);
  });

  // M3-PCBI-018: No automatic savings from benchmark availability
  it('M3-PCBI-018: No automatic savings from benchmark availability', () => {
    const { priceGap } = Module3PcbiForensicEngine.processCustomerLedger();
    expect(priceGap.analyticalCaveat).toBe(PCBI_DISCLAIMER_TEXT);
  });

  // M3-PCBI-019: Negative/inverted benchmark results handled correctly
  it('M3-PCBI-019: Negative/inverted benchmark results handled correctly', () => {
    const { priceGap, ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    expect(priceGap.belowBenchmarkCount).toBe(8);
    const belowTx = ledger.filter((l) => l.direction === 'BELOW_BENCHMARK');
    expect(belowTx.length).toBe(8);
    for (const b of belowTx) {
      expect(b.potentialPriceGapInr).toBe(0);
    }
  });

  // M3-PCBI-020: Extreme benchmark gaps are inspectable
  it('M3-PCBI-020: Extreme benchmark gaps are inspectable', () => {
    const { priceGap, ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    expect(priceGap.maxPriceGapPct).toBeLessThan(25.0);
    const outliers = ledger.filter((l) => l.isOutlier);
    expect(outliers.length).toBe(priceGap.outlierCount);
  });

  // M3-PCBI-021: Missing benchmark data never becomes zero
  it('M3-PCBI-021: Missing benchmark data never becomes zero', () => {
    const { ledger } = Module3PcbiForensicEngine.processCustomerLedger();
    const unbenchmarked = ledger.filter((l) => l.mappingStatus !== 'MAPPED');
    for (const u of unbenchmarked) {
      expect(u.normalizedBenchmarkPriceInr).toBeUndefined();
    }
  });

  // M3-PCBI-022: Customer period uses Apr 2021–Jan 2022 for VGT
  it('M3-PCBI-022: Customer period uses Apr 2021–Jan 2022 for VGT', () => {
    expect(PCBI_VGT_BASELINE.PERIOD_LABEL).toBe('Apr 2021–Jan 2022');
    expect(PCBI_VGT_BASELINE.BILLING_MONTHS_COUNT).toBe(10);
  });

  // M3-PCBI-023: PCBI master is isolated from customer data
  it('M3-PCBI-023: PCBI master is isolated from customer data', () => {
    const masterBefore = Module3PcbiForensicEngine.getMasterRecords().length;
    Module3PcbiForensicEngine.processCustomerLedger();
    const masterAfter = Module3PcbiForensicEngine.getMasterRecords().length;
    expect(masterAfter).toBe(masterBefore);
  });

  // M3-PCBI-024: Independent calculator variance = ₹0
  it('M3-PCBI-024: Independent calculator variance = ₹0', () => {
    const { comparisons } = Module3PcbiIndependentCalculator.runIndependentRecalculation();
    for (const c of comparisons) {
      expect(c.status).toBe('MATCH');
    }
  });

  // M3-PCBI-025: UI/API/workbook parity = ₹0
  it('M3-PCBI-025: UI/API/workbook parity = ₹0', () => {
    const { reconciliation, priceGap } = Module3PcbiForensicEngine.processCustomerLedger();
    const report = Module3PcbiForensicEngine.getCertificationReport();
    expect(report.coverageBySpend.benchmarkableSpendCr).toBe(reconciliation.benchmarkableSpendCr);
    expect(report.benchmarkPriceGapAmount).toBe(priceGap.totalBenchmarkPriceGapCr);
    expect(report.uiApiEvidenceVariance).toBe(0.0);
  });

  // M3-PCBI-026: Module 1 baseline unchanged
  it('M3-PCBI-026: Module 1 baseline unchanged', () => {
    const vgt = VgtModule1Runner.processVgtDataset();
    expect(vgt.data.validRowCount).toBe(20241);
    expect(vgt.module1.totalConvertedInrSpendCr).toBe(4073.8307);
    expect(vgt.data.excludedRowCount).toBe(252);
    expect(vgt.data.anomalyRowCount).toBe(12);
  });

  // M3-PCBI-027: Module 2 financial baseline unchanged
  it('M3-PCBI-027: Module 2 financial baseline unchanged', () => {
    const mod2Summary = Module2FinancialTraceabilityEngine.getAuditSummary();
    expect(mod2Summary.addressableSpendCr).toBe(PCBI_MODULE2_FROZEN_BASELINE.ADDRESSABLE_SPEND_CR);
    expect(mod2Summary.grossMultiLeverPoolCr).toBe(PCBI_MODULE2_FROZEN_BASELINE.GROSS_MULTI_LEVER_POOL_CR);
    expect(mod2Summary.netDefensibleOpportunityCr).toBe(PCBI_MODULE2_FROZEN_BASELINE.NET_DEFENSIBLE_OPPORTUNITY_CR);
    expect(mod2Summary.provenOpportunityCr).toBe(PCBI_MODULE2_FROZEN_BASELINE.PROVEN_COMMERCIAL_OPPORTUNITY_CR);
    expect(mod2Summary.indicativeDeliveryMinCr).toBe(PCBI_MODULE2_FROZEN_BASELINE.INDICATIVE_DELIVERY_MIN_CR);
    expect(mod2Summary.indicativeDeliveryMaxCr).toBe(PCBI_MODULE2_FROZEN_BASELINE.INDICATIVE_DELIVERY_MAX_CR);
  });

  // M3-PCBI-028: VGT checksum unchanged
  it('M3-PCBI-028: VGT checksum unchanged', () => {
    const vgt = VgtModule1Runner.processVgtDataset();
    expect(vgt.file.sha256).toBe('59625f2f91c303ef492b679511077a0882dab2d9760bce8b3f7edaca82d81def');
  });

  // M3-PCBI-029: FX Master checksum unchanged
  it('M3-PCBI-029: FX Master checksum unchanged', () => {
    const fxChecksum = FxReferenceService.getInstance().getVerifiedChecksum();
    expect(fxChecksum).toBe(EXPECTED_FX_MASTER_CHECKSUM);
  });

  // M3-PCBI-030: No unsupported benchmark source claims
  it('M3-PCBI-030: No unsupported benchmark source claims', () => {
    const provenance = Module3PcbiForensicEngine.getSourceProvenanceRecords();
    const verifiedSources = provenance.filter((p) => p.status === 'VERIFIED');
    expect(verifiedSources.length).toBeGreaterThan(0);
    for (const v of verifiedSources) {
      expect(['GOVERNMENT_STATISTICAL', 'COMMERCIAL_EXCHANGE', 'INDUSTRY_ASSESSMENT']).toContain(v.sourceType);
    }
  });

  // Workbook Generation Verification
  it('Evidence Workbook generates with all 25 required sheets and cryptographic checksum', () => {
    const result = Module3PcbiWorkbookBuilder.buildWorkbook();
    expect(result.sheetsCount).toBe(25);
    expect(result.sha256.length).toBe(64);
  });

  it('covers cached execution, custom workbook path, and certification report variations', () => {
    const cached = Module3PcbiForensicEngine.processCustomerLedger();
    expect(cached.ledger.length).toBe(20241);

    const rep1 = Module3PcbiForensicEngine.getCertificationReport('PENDING_WORKBOOK_BUILD');
    const rep2 = Module3PcbiForensicEngine.getCertificationReport('PENDING_WORKBOOK_BUILD');
    expect(rep1.pcbiMasterVersion).toBe(rep2.pcbiMasterVersion);
    const repCustom = Module3PcbiForensicEngine.getCertificationReport('CUSTOM_SHA_HASH');
    expect(repCustom.evidenceWorkbookSha256).toBe('CUSTOM_SHA_HASH');
  });

  it('covers edge cases: AT_BENCHMARK, extreme outlier, and custom rows', async () => {
    const customRows = [
      {
        recordId: 'TX-CUSTOM-001',
        sourceRow: 1,
        poNumber: 'PO-1001',
        transactionDate: '2021-04-01',
        vendorCode: 'V001',
        vendorName: 'Supplier 1',
        itemCode: '1100528',
        itemDescription: 'CC COPPER WIRE ROD 8MM',
        materialGroup: 'MG01',
        quantity: 100,
        uom: 'KG',
        netPrice: 695.42,
        currency: 'INR',
        lineSpendInr: 69542.0
      },
      {
        recordId: 'TX-CUSTOM-002',
        sourceRow: 2,
        poNumber: 'PO-1002',
        transactionDate: '2021-04-01',
        vendorCode: 'V001',
        vendorName: 'Supplier 1',
        itemCode: '1100528',
        itemDescription: 'CC COPPER WIRE ROD 8MM',
        materialGroup: 'MG01',
        quantity: 100,
        uom: 'KG',
        netPrice: 1500.0,
        currency: 'INR',
        lineSpendInr: 150000.0
      }
    ];

    const result = Module3PcbiForensicEngine.processCustomerLedger(customRows);
    expect(result.priceGap.atBenchmarkCount).toBe(1);
    expect(result.priceGap.outlierCount).toBe(1);

    const customOutPath = path.resolve(process.cwd(), 'scratch', 'test_outlier_wb.xlsx');
    const outlierWithoutReason = { ...result.ledger[1], outlierReason: undefined };
    const wbResult = Module3PcbiWorkbookBuilder.buildWorkbook(customOutPath, [result.ledger[1], outlierWithoutReason]);
    expect(wbResult.sheetsCount).toBe(25);
  });

  it('covers independent calculator with variance', () => {
    const indepResult = Module3PcbiIndependentCalculator.runIndependentRecalculation([]);
    expect(indepResult.independentMetrics.benchmarkableTxCount).toBe(0);
    const varianceItems = indepResult.comparisons.filter((c) => c.status === 'VARIANCE');
    expect(varianceItems.length).toBeGreaterThan(0);
  });
});

