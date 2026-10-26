import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import * as XLSX from 'xlsx';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2SavingsDeduplicationEngine } from '../../src/services/module2SavingsDeduplicationEngine';
import { Module2MaterialMappingRegister } from '../../src/services/module2MaterialMappingRegister';
import { db } from '../../src/services/db';

describe('ABC Textile Canonical Lineage & Classification Verification', () => {
  const testDataDir = path.resolve(__dirname, '../../../data/test');
  const textilePath = path.resolve(testDataDir, 'assessments/AIC-2026-0002/uploads/Textile1.xlsx');

  beforeAll(() => {
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(testDataDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
  });

  it('1. Independently calculates total evaluated spend and material/service split from Textile1.xlsx', () => {
    const wb = XLSX.readFile(textilePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    expect(rows.length).toBe(23570);

    let totalSpendInr = 0;
    let serviceSpendInr = 0;
    let serviceCount = 0;
    let materialSpendInr = 0;
    let materialCount = 0;

    for (const r of rows) {
      const inr = Number(r['Net Value In INR'] || 0);
      const poCat = String(r['PO Category'] || '').trim().toUpperCase();
      totalSpendInr += inr;

      if (poCat === 'SERVICES' || poCat === 'PROJ SERVICES') {
        serviceSpendInr += inr;
        serviceCount++;
      } else {
        materialSpendInr += inr;
        materialCount++;
      }
    }

    const totalCr = totalSpendInr / 10000000;
    const serviceCr = serviceSpendInr / 10000000;
    const materialCr = materialSpendInr / 10000000;

    expect(Number(totalCr.toFixed(4))).toBe(613.8805);
    expect(Number(serviceCr.toFixed(4))).toBe(201.4367);
    expect(Number(materialCr.toFixed(4))).toBe(412.4438);
    expect(serviceCount).toBe(4029);
    expect(materialCount).toBe(19541);
    expect(serviceCount + materialCount).toBe(23570);
    expect(Number((materialCr + serviceCr).toFixed(4))).toBe(613.8805);
  }, 60000);

  it('2. Traces Module 2 canonical sourcing and deduplication outputs for AIC-2026-0002', () => {
    const canonicalInput = Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
    expect(canonicalInput.validRowCount).toBe(23570);
    expect(canonicalInput.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);

    const sourcing = Module2CanonicalService.getSourcingAnalysis('AIC-2026-0002');
    expect(sourcing.summary.totalAddressableSpendInrCr).toBe(315.021);

    const bridge = Module2CanonicalService.getMathematicalBridge('AIC-2026-0002');
    expect(bridge.totalValidatedSpendCr).toBeCloseTo(613.8805, 3);
    expect(bridge.addressableSpendCr).toBe(315.021);

    const consolidated = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings('AIC-2026-0002');
    expect(consolidated.assessmentId).toBe('AIC-2026-0002');
    expect(consolidated.customerName).toBe('ABC Textile Ltd');
    expect(consolidated.opportunities.length).toBeGreaterThan(0);
  }, 60000);


  it('3. Verifies customer isolation between AIC-2026-0002 and other assessments in db service', () => {
    // ABC Textile (AIC-2026-0002)
    const abcPcbi = db.getPCBILastCalculationResults('AIC-2026-0002');
    expect(abcPcbi.executiveSummary.total_spend_inr_cr).toBe(613.8805);
    expect(abcPcbi.executiveSummary.not_benchmarkable_spend_inr_cr).toBe(613.8805);
    expect(abcPcbi.executiveSummary.total_opportunity_inr_cr).toBe(0);

    const abcSavings = db.getConsolidatedSavings('AIC-2026-0002');
    expect(abcSavings.waterfallMetrics.total_spend_inr_cr).toBe(613.8805);
    expect(abcSavings.waterfallMetrics.addressable_spend_inr_cr).toBe(315.021);
    expect(abcSavings.waterfallMetrics.gross_potential_savings_inr_cr).toBe(110.764);
    expect(abcSavings.waterfallMetrics.deduplicated_overlap_inr_cr).toBe(25.123);
    expect(abcSavings.waterfallMetrics.net_potential_savings_inr_cr).toBe(85.641);
    expect(abcSavings.waterfallMetrics.proven_opportunity_inr_cr).toBe(82.380);
    expect(abcSavings.waterfallMetrics.discovery_opportunity_inr_cr).toBe(3.261);
    expect(abcSavings.waterfallMetrics.validated_savings_inr_cr).toBe(0.00);
    expect(abcSavings.waterfallMetrics.approved_savings_inr_cr).toBe(0.00);
    expect(abcSavings.waterfallMetrics.realized_savings_inr_cr).toBe(0.00);

    // VGT / Other assessment (AIC-2026-0001) must NOT receive ABC Textile values
    const otherSavings = db.getConsolidatedSavings('AIC-2026-0001');
    expect(otherSavings.waterfallMetrics.total_spend_inr_cr).not.toBe(613.8805);
    expect(otherSavings.waterfallMetrics.net_potential_savings_inr_cr).not.toBe(85.641);
  }, 60000);

  afterAll(() => {
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(undefined);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
  });
});

