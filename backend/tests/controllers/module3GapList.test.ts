import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { Module3PcbiGapExportHelper } from '../../src/services/module3PcbiGapExportHelper';
import { BOROSIL_MISSING_INDEX_GAP_REPORT } from '../../src/constants/module3PcbiGapList';

describe('Module 3 PCBI — Missing-Index Gap List & Export Endpoints', () => {
  it('GET /api/module3/gap-list returns authoritative Borosil missing-index report', async () => {
    const res = await request(app)
      .get('/api/module3/gap-list?assessmentId=AIC-2026-0002')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.report).toBeDefined();

    const report = res.body.report;
    expect(report.assessmentId).toBe('AIC-2026-0002');
    expect(report.customerName).toBe('Borosil Ltd');
    expect(report.baselineSpendCr).toBe(556.5346);
    expect(report.baselineTransactions).toBe(27777);
    expect(report.verifiedObservationsCount).toBe(0);
    expect(report.verifiedSpendCr).toBe(0.0);
    expect(report.missingIndexGapSpendCr).toBe(556.5346);
    expect(report.missingIndexGapSpendPct).toBe(100.0);
    expect(report.quarantinedObservationsCount).toBe(14);
    expect(report.pcbiIndexCalculated).toBe(false);
    expect(report.certifiedSavingsCr).toBe(0.0);
    expect(report.realizedSavingsCr).toBe(0.0);

    // Verify 8 status categories exist
    expect(report.statusSummaries).toHaveLength(8);

    // Verify distinct items exist — 22 real material requirement rows:
    // GAP-BOR-001 to GAP-BOR-021 (21 named gaps) + GAP-BOR-022 (consolidated MRO tail).
    // GAP-BOR-023 was an audit/governance summary row (not a material requirement) and was removed.
    expect(report.items.length).toBeGreaterThanOrEqual(22);
  });

  it('reconciles status summaries to exact authoritative baseline', async () => {
    const res = await request(app)
      .get('/api/module3/gap-list?assessmentId=AIC-2026-0002')
      .expect(200);

    const report = res.body.report;
    let sumSpendCr = 0;
    let sumTxs = 0;

    for (const s of report.statusSummaries) {
      sumSpendCr += s.totalSpendCr;
      sumTxs += s.transactionCount;
    }

    expect(Number(sumSpendCr.toFixed(4))).toBe(556.5346);
    expect(sumTxs).toBe(27777);
  });

  it('GET /api/module3/gap-list/export returns CSV file attachment', async () => {
    const res = await request(app)
      .get('/api/module3/gap-list/export?assessmentId=AIC-2026-0002')
      .expect(200);

    expect(res.header['content-type']).toContain('text/csv');
    expect(res.header['content-disposition']).toContain('attachment');
    expect(res.header['content-disposition']).toContain('Borosil_PCBI_Missing_Index_Gap_List');

    const csvText = res.text;
    expect(csvText).toContain('Material Code,Material Description,Commodity Classification');
    expect(csvText).toContain('100SA02G');
    expect(csvText).toContain('100SSW13FG-L');
    expect(csvText).toContain('400LSH01I');
    expect(csvText).toContain('58.1170');
  });

  it('rejects missing or invalid assessment ID', async () => {
    await request(app)
      .get('/api/module3/gap-list')
      .expect(400);

    await request(app)
      .get('/api/module3/gap-list?assessmentId=INVALID_ID')
      .expect(400);

    await request(app)
      .get('/api/module3/gap-list?assessmentId=AIC-2026-0001')
      .expect(404);
  });

  it('Module3PcbiGapExportHelper.buildCsv produces formatted CSV text', () => {
    const csv = Module3PcbiGapExportHelper.buildCsv(BOROSIL_MISSING_INDEX_GAP_REPORT.items);
    expect(csv).toContain('Material Code,Material Description');
    expect(csv).toContain('"100SA02G"');
    expect(csv).toContain('58.1170');
  });
});
