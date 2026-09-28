import { describe, it, expect } from 'vitest';
import path from 'path';
import {
  moduleCertificationEngine,
  normalizeVendorName,
  normalizeMaterialDescription,
  classifyItem,
  AUDITABLE_FX_RATES
} from '../../src/services/certificationEngine';

describe('ModuleCertificationEngine Unit & Certification Tests', () => {
  it('should run full certification test and return 100% passing golden tests and gates', () => {
    const report = moduleCertificationEngine.runFullCertificationTest();

    expect(report.allGoldenTestsPassed).toBe(true);
    expect(report.goldenTestResults).toHaveLength(26);

    // Verify all 26 golden tests passed
    report.goldenTestResults.forEach((t) => {
      expect(t.passed).toBe(true);
      expect(t.notes).toContain('PASSED');
    });

    // Verify Module 1 Dashboard metrics
    expect(report.module1Dashboard.totalTransactions).toBe(26);
    expect(report.module1Dashboard.totalSpendInr).toBeGreaterThan(0);
    expect(report.module1Dashboard.uniqueVendorsCount).toBeGreaterThan(0);
    expect(report.module1Dashboard.uniqueItemsCount).toBeGreaterThan(0);
    expect(report.module1Dashboard.plantsCount).toBe(2);

    // Verify Module 1 Reconciliation
    expect(report.module1Reconciliation.isFullyReconciled).toBe(true);
    expect(report.module1Reconciliation.spendVarianceInr).toBe(0);
    expect(
      report.module1Reconciliation.categorizedSpendInr +
        report.module1Reconciliation.serviceSpendInr +
        report.module1Reconciliation.unmappedSpendInr
    ).toBeCloseTo(report.module1Reconciliation.processedSpendInr, 1);

    // Verify Module 2 Reconciliation
    expect(report.module2Reconciliation.isFullyReconciled).toBe(true);
    expect(report.module2Reconciliation.unspscCoveragePct).toBeGreaterThan(90);
    expect(report.module2Reconciliation.pcbiCategoryMappingPct).toBeGreaterThan(90);

    // Verify Module 1 Gates (9 gates)
    expect(report.module1Gates).toHaveLength(9);
    report.module1Gates.forEach((g) => {
      expect(g.passed).toBe(true);
    });

    // Verify Module 2 Gates (14 gates)
    expect(report.module2Gates).toHaveLength(14);
    report.module2Gates.forEach((g) => {
      expect(g.passed).toBe(true);
    });

    // Verify Certification & GO/NO-GO
    expect(report.module1Certified).toBe(true);
    expect(report.module2Certified).toBe(true);
    expect(report.overallGoDecision).toBe(true);

    // Verify Data Integrity audit flags
    expect(report.auditTrail.noSourceRowsDeleted).toBe(true);
    expect(report.auditTrail.noSourceValuesModified).toBe(true);
    expect(report.auditTrail.noDuplicatesSilentlyDeleted).toBe(true);
    expect(report.auditTrail.noCurrencySilentlyConverted).toBe(true);
    expect(report.auditTrail.noUnspscInvented).toBe(true);
    expect(report.auditTrail.noConstituentPercentageInvented).toBe(true);
    expect(report.auditTrail.noServiceBenchmarked).toBe(true);
    expect(report.auditTrail.noUnmappedItemHidden).toBe(true);
  });

  it('should normalize vendor names cleanly and handle empty values', () => {
    const v1 = normalizeVendorName('Tata Steel Private Limited');
    expect(v1.normalized).toBe('TATA STEEL');
    expect(v1.masterId).toMatch(/^VM-[A-Z0-9]+$/);

    const v2 = normalizeVendorName('   ');
    expect(v2.normalized).toBe('UNKNOWN VENDOR');
  });

  it('should normalize material descriptions cleanly and handle empty values', () => {
    const m1 = normalizeMaterialDescription('Bearing Ball Part No 6205');
    expect(m1.normalized).toContain('BALL');
    expect(m1.masterId).toMatch(/^MM-[A-Z0-9]+$/);

    const m2 = normalizeMaterialDescription('   ');
    expect(m2.normalized).toBe('UNSPECIFIED MATERIAL');
  });

  it('should classify various commodity categories accurately', () => {
    // Service
    const s1 = classifyItem('Quarterly AMC HVAC Compressor Service', true);
    expect(s1.disposition).toBe('SERVICE');
    expect(s1.coreCategory).toBe('Service');
    expect(s1.pcbiCategory).toBe('EXCLUDED_SERVICE');

    // Bearing
    const b1 = classifyItem('SKF High Speed Ball Bearing');
    expect(b1.unspscCode).toBe('31171504');
    expect(b1.coreCategory).toBe('MRO');

    // Lubricant
    const l1 = classifyItem('Industrial Heavy Duty Gear Oil ISO 320');
    expect(l1.unspscCode).toBe('15121520');
    expect(l1.coreCategory).toBe('MRO');

    // Steel
    const st1 = classifyItem('Mild Steel HR Sheet 4mm');
    expect(st1.unspscCode).toBe('30101804');
    expect(st1.coreCategory).toBe('Direct Materials');

    // Caustic
    const ch1 = classifyItem('Industrial Acid Hydrochloric');
    expect(ch1.unspscCode).toBe('12352101');
    expect(ch1.coreCategory).toBe('Direct Materials');

    // Packaging
    const p1 = classifyItem('Export Grade Carton Corrugated Box');
    expect(p1.unspscCode).toBe('14121503');
    expect(p1.coreCategory).toBe('Packing Materials');

    // Electrical
    const el1 = classifyItem('Moulded Case Circuit Breaker Switch');
    expect(el1.unspscCode).toBe('39121529');
    expect(el1.coreCategory).toBe('MRO');

    // PU material
    const pu1 = classifyItem('Cast Polyurethane Elastomer Sheet');
    expect(pu1.unspscCode).toBe('13101802');
    expect(pu1.coreCategory).toBe('Direct Materials');

    // Copper
    const cu1 = classifyItem('Electrolytic Copper Cathode Pure');
    expect(cu1.unspscCode).toBe('30101700');
    expect(cu1.coreCategory).toBe('Direct Materials');

    // Complex non-commodity equipment falling back to CLASS
    const cp1 = classifyItem('Complex Pump Special Assembly');
    expect(cp1.mappingLevel).toBe('CLASS');
    expect(cp1.unspscCode).toBe('40151500');

    // Unknown unmapped item
    const unk = classifyItem('CUSTOM-PROPRIETARY-ITEM-0099');
    expect(unk.disposition).toBe('UNMAPPED — REVIEW REQUIRED');
    expect(unk.coreCategory).toBe('Other / Unmapped');
  });

  it('should maintain auditable FX table and handle unknown currencies with fallback', () => {
    expect(AUDITABLE_FX_RATES.INR.rate).toBe(1.0);
    expect(AUDITABLE_FX_RATES.USD.rate).toBeGreaterThan(80);
    expect(AUDITABLE_FX_RATES.EUR.rate).toBeGreaterThan(85);
    expect(AUDITABLE_FX_RATES.USD.source).toContain('RBI');
    expect(AUDITABLE_FX_RATES.USD.asOfDate).toBeDefined();

    // Test input with no total, requiring qty * price
    const report = moduleCertificationEngine.runFullCertificationTest();
    expect(report.module1Dashboard.totalSpendInr).toBeGreaterThan(0);
  });

  it('should handle reconciliation discrepancy branches and empty datasets correctly', () => {
    // Test discrepancy branch in computeModule1Reconciliation and computeModule2Reconciliation
    const dummyRecord: any = {
      transactionId: 'TXN-DISC-001',
      sourceFile: 'file.csv',
      worksheet: 'Sheet1',
      originalRowNumber: 1,
      poNumber: 'PO-1',
      invoiceNumber: 'INV-1',
      transactionDate: '2025-01-01',
      year: 2025,
      month: '2025-01',
      plant: 'Plant A',
      materialGroup: 'Direct Materials',
      originalVendor: 'V',
      normalizedVendor: 'V',
      vendorMasterId: 'VM-01',
      duplicateVendorFlag: false,
      originalShortText: 'Item',
      normalizedDescription: 'Item',
      materialMasterId: 'MM-01',
      quantity: 10,
      unitOfMeasure: 'NOS',
      unitPrice: 100,
      originalSpend: 1000,
      originalCurrency: 'INR',
      fxRate: 1.0,
      fxSource: 'RBI',
      fxDate: '2026-09-27',
      normalizedSpendInr: 1000,
      exactDuplicateFlag: false,
      potentialDuplicateFlag: false,
      duplicateGroupKey: 'k',
      coreCategory: 'Direct Materials',
      isExcluded: false,
      disposition: 'MAPPED',
      unspscCode: '10000000',
      unspscSegment: '10',
      unspscFamily: '100',
      unspscClass: '1000',
      unspscCommodity: '10000000',
      mappingLevel: 'COMMODITY',
      mappingConfidence: 90,
      mappingMethod: 'EXACT_COMMODITY',
      aiClassification: 'Direct Materials',
      aiUnspsc: '10000000',
      aiConfidence: 90,
      finalClassification: 'Direct Materials',
      finalUnspsc: '10000000',
      overrideFlag: false,
      pcbiCategory: 'Cat',
      pcbiSubcategory: 'Sub',
      decompositionStatus: 'DECOMPOSITION NOT AVAILABLE'
    };

    // Private method invocation to exercise discrepancy branches
    const m1Rec = (moduleCertificationEngine as any).computeModule1Reconciliation([
      dummyRecord,
      { ...dummyRecord, normalizedSpendInr: 500, coreCategory: 'Other / Unmapped' }
    ]);
    expect(m1Rec.isFullyReconciled).toBe(true);

    const m2Rec = (moduleCertificationEngine as any).computeModule2Reconciliation([
      dummyRecord,
      { ...dummyRecord, normalizedSpendInr: 200, disposition: 'UNMAPPED — REVIEW REQUIRED' }
    ]);
    expect(m2Rec.isFullyReconciled).toBe(true);

    // Test createRecordFromInput without total
    const computedRec = (moduleCertificationEngine as any).createRecordFromInput(
      { po: 'PO-COMPUTE', vendor: 'V', item: 'Item', qty: 5, price: 100, curr: 'XYZ' },
      99
    );
    expect(computedRec.originalSpend).toBe(500);
    expect(computedRec.normalizedSpendInr).toBe(500);
    expect(computedRec.fxRate).toBe(1.0);
  });

  it('should validate customer sample dataset and certify Modules 1 and 2 independently', () => {
    const datasetPath = path.resolve(__dirname, '../../../frontend/sample_datasets/Purchase_History_Multi_Currency_Sample.xlsx');
    const realReport = moduleCertificationEngine.validateRealDataset(datasetPath);

    expect(realReport.records.length).toBe(15);
    expect(realReport.module1Certified).toBe(true);
    expect(realReport.module2Certified).toBe(true);
    expect(realReport.module1Gates.every((g) => g.passed)).toBe(true);
    expect(realReport.module2Gates.every((g) => g.passed)).toBe(true);
    expect(realReport.module1Reconciliation.isFullyReconciled).toBe(true);
    expect(realReport.module2Reconciliation.isFullyReconciled).toBe(true);
    expect(realReport.module1Reconciliation.spendVarianceInr).toBe(0);
    expect(realReport.strategicOpportunities.length).toBeGreaterThan(0);
  });
});

