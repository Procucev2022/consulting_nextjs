import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWorkerDatabase, insertRows, type WorkerDatabaseFixture } from '../helpers/workerCoreFixtures';
import { runAssessmentAnalysisFromD1 } from '../../src/services/assessmentAnalysisD1';
import { ASSESSMENT_D1_MESSAGES } from '../../src/constants/assessmentD1';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../../src/types/cloudflare';

let fixture: WorkerDatabaseFixture;

beforeEach(() => { fixture = createWorkerDatabase(); });
afterEach(() => { fixture.close(); });

const seedAssessment = (owner = 'analyst@example.test'): void => {
  insertRows(fixture.db, `INSERT INTO AssessmentRecord (
    assessment_id, customer_id, customer_name, industry, assessment_owner
  ) VALUES (?, ?, ?, ?, ?)`, [['A1', 'T1', 'Client One', 'Chemicals', owner]]);
};

const seedVersion = (id: string, count: number, superseded = 0): void => {
  insertRows(fixture.db, `INSERT INTO AssessmentDataVersion (
    data_version_id, assessment_id, version_number, file_name, checksum, record_count, is_superseded
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [[id, 'A1', 1, `${id}.csv`, 'checksum', count, superseded]]);
};

const context = (body: unknown = {}, assessmentId = 'A1') => ({
  db: fixture.d1, environment: {}, assessmentId, body, requestId: 'req-analysis'
});

const seedCompleteDataset = (versionId: string): void => {
  insertRows(fixture.db, `INSERT INTO ProcurementTransaction (
    transaction_id, tenant_id, assessment_id, source_document_id, source_row_number, document_date_raw,
    supplier_name, material_code, short_text, material_group, plant, order_quantity, order_unit,
    net_price, currency, total_inr_raw, total_in_cr_raw, raw_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [[
    `${versionId}-ROW-2`, 'T1', 'A1', versionId, 2, '2025-04-30', 'Supplier A', 'MAT-1',
    'Material one', 'Chemicals', 'Plant A', 1, 'EA', 10000000, 'INR', 10000000, 1, '{}'
  ]]);
  insertRows(fixture.db, `INSERT INTO ValidationPreCheckRecord (
    record_id, po_number, vendor_name, raw_desc, amount, raw_currency, amount_inr, inr_crores, resolved, issue_flag, action_status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [[
    `REC-${versionId}-ROW-2`, 'PO-1', 'Supplier A', 'Material one', 10000000, 'INR', 10000000, 1, 1, 'Passed Clean', 'Ready'
  ]]);
};

const wrapDatabase = (
  db: CloudflareD1Database,
  options: {
    emptyResultTables?: string[];
    missingFinalReads?: boolean;
  } = {}
): CloudflareD1Database => {
  let assessmentReadCount = 0;
  const wrapStatement = (
    statement: CloudflareD1PreparedStatement,
    sql: string,
    isAssessmentRead: boolean
  ): CloudflareD1PreparedStatement => ({
    bind: (...values) => wrapStatement(statement.bind(...values), sql, isAssessmentRead),
    first: async () => {
      if (options.missingFinalReads && isAssessmentRead && assessmentReadCount > 1) return null;
      if (options.missingFinalReads && sql.includes('SELECT * FROM AssessmentAnalysisRun WHERE analysis_run_id')) return null;
      return statement.first();
    },
    all: async () => options.emptyResultTables?.some((table) => sql.includes(table)) ? {} as { results: never[] } : statement.all(),
    run: () => statement.run()
  });
  return {
    prepare: (sql) => {
      const isAssessmentRead = sql.includes('SELECT * FROM AssessmentRecord WHERE assessment_id');
      if (isAssessmentRead) assessmentReadCount += 1;
      return wrapStatement(db.prepare(sql), sql, isAssessmentRead);
    },
    batch: db.batch?.bind(db)
  };
};

describe('D1 assessment analysis', () => {
  it('computes an assessment run from its persisted transactions and validation rows', async () => {
    seedAssessment();
    seedVersion('DV-A1', 1);
    seedCompleteDataset('DV-A1');

    const result = await runAssessmentAnalysisFromD1(context({ dataVersionId: 'DV-A1' }), 'module1');

    expect(result.data).toMatchObject({
      success: true,
      assessment: {
        assessmentId: 'A1', status: 'MODULE_1_READY', dataStatus: 'VALIDATED',
        totalSpendCr: 1, validatedSpendCr: 1, potentialSavingsCr: 0
      },
      analysisRun: {
        assessmentId: 'A1', dataVersionId: 'DV-A1', status: 'COMPLETED', allGatesPassed: false,
        module1Metrics: {
          sourceRows: 1, validRows: 1, exclusions: 0, anomalies: 0, fxCoveragePct: 100,
          validatedSpendCr: 1, suppliers: 1, materialGroups: 1, plants: 1, billingMonths: 1
        }
      }
    });
    await expect(fixture.d1.prepare('SELECT status, total_spend_cr, gross_opportunity_cr, potential_savings_cr FROM AssessmentRecord WHERE assessment_id = ?')
      .bind('A1').first()).resolves.toEqual({
      status: 'MODULE_1_READY', total_spend_cr: 1, gross_opportunity_cr: 0, potential_savings_cr: 0
    });
    await expect(fixture.d1.prepare('SELECT action FROM AssessmentAuditLog WHERE assessment_id = ?').bind('A1').first())
      .resolves.toEqual({ action: 'ANALYSIS_COMPLETED' });
  });

  it('keeps failed data quality gates visible and does not claim full-module approval', async () => {
    seedAssessment();
    seedVersion('DV-MIXED', 4);
    insertRows(fixture.db, `INSERT INTO ProcurementTransaction (
      transaction_id, tenant_id, assessment_id, source_document_id, source_row_number, document_date_raw,
      supplier_name, material_group, plant, currency, total_inr_raw, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      ['TX-1', 'T1', 'A1', 'DV-MIXED', 2, '2025-01-02', 'Supplier A', 'Chemicals', 'Plant A', 'INR', 10000000, '{}'],
      ['TX-2', 'T1', 'A1', 'DV-MIXED', 3, '2025-02-02', 'Supplier A', 'Chemicals', 'Plant A', 'USD', 20000000, '{}'],
      ['TX-3', 'T1', 'A1', 'DV-MIXED', 4, '2025-03-02', 'Unmapped Supplier', '', '', 'EUR', 'invalid', '{}'],
      ['TX-4', 'T1', 'A1', 'DV-MIXED', 5, '', '  ', ' ', ' ', '', null, '{}']
    ]);
    insertRows(fixture.db, `INSERT INTO ValidationPreCheckRecord (
      record_id, po_number, vendor_name, raw_desc, amount, raw_currency, amount_inr, inr_crores, fx_rate_applied,
      resolved, issue_flag, action_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      ['REC-DV-MIXED-ROW-2', 'PO-1', 'Supplier A', 'A', 10000000, 'INR', 10000000, 1, null, 1, 'Passed Clean', 'Ready'],
      ['REC-DV-MIXED-ROW-3', 'PO-2', 'Supplier A', 'B', 20000000, 'USD', 20000000, null, 80, 1, 'Passed Clean', 'Ready'],
      ['REC-DV-MIXED-ROW-4', 'PO-3', 'Unmapped Supplier', 'C', 30000000, 'EUR', null, null, 0, 1, 'Excluded', 'Excluded'],
      ['REC-DV-MIXED-ROW-5', 'PO-4', ' ', 'D', 'not-a-number', '', null, null, 0, 0, 'Missing currency', 'Review']
    ]);

    const result = await runAssessmentAnalysisFromD1(context({}), 'full');
    const run = result.data as { module1Metrics: Record<string, unknown> };

    expect(run.module1Metrics).toMatchObject({
      sourceRows: 4, validRows: 2, exclusions: 1, anomalies: 1, fxCoveragePct: 50,
      validatedSpendCr: 3, suppliers: 1, materialGroups: 1, plants: 1, billingMonths: 3
    });
    const stored = await fixture.d1.prepare('SELECT metrics_json, all_gates_passed, is_approved FROM AssessmentAnalysisRun WHERE assessment_id = ?')
      .bind('A1').first<{ metrics_json: string; all_gates_passed: number; is_approved: number }>();
    const metrics = JSON.parse(stored?.metrics_json || '{}') as { reviewGates: Array<{ gate: string; passed: boolean }> };
    expect(metrics.reviewGates.find((gate) => gate.gate === 'M1_TRANSACTION_VALIDITY')?.passed).toBe(false);
    expect(metrics.reviewGates.find((gate) => gate.gate === 'M2_OPPORTUNITY_ELIGIBILITY')?.passed).toBe(false);
    expect(stored).toMatchObject({ all_gates_passed: 0, is_approved: 0 });
    expect(await fixture.d1.prepare('SELECT total_spend_cr FROM AssessmentRecord WHERE assessment_id = ?').bind('A1').first())
      .toEqual({ total_spend_cr: 3 });
    expect(run.module1Metrics.validatedSpendCr).toBe(3);
  });

  it('runs full analysis after Module 1 gates pass and uses snapshots when final reads are absent', async () => {
    seedAssessment('');
    seedVersion('DV-FALLBACK', 1);
    seedCompleteDataset('DV-FALLBACK');
    insertRows(fixture.db, 'UPDATE AssessmentDataVersion SET checksum = ? WHERE data_version_id = ?', [['', 'DV-FALLBACK']]);

    const result = await runAssessmentAnalysisFromD1({
      ...context({ dataVersionId: 'DV-FALLBACK' }),
      db: wrapDatabase(fixture.d1, { missingFinalReads: true }),
      body: undefined
    }, 'full');

    expect(result.data).toMatchObject({
      status: 'COMPLETED', assessmentId: 'A1', dataVersionId: 'DV-FALLBACK',
      module1Metrics: { sourceRows: 1, validRows: 1, fxCoveragePct: 100 }
    });
    await expect(fixture.d1.prepare('SELECT status FROM AssessmentRecord WHERE assessment_id = ?').bind('A1').first())
      .resolves.toEqual({ status: 'ANALYSIS_IN_PROGRESS' });
    await expect(fixture.d1.prepare('SELECT actor_email FROM AssessmentAuditLog WHERE assessment_id = ?').bind('A1').first())
      .resolves.toEqual({ actor_email: 'analyst@procucev.com' });
  });

  it('handles D1 query results without result arrays as missing imported rows', async () => {
    seedAssessment();
    seedVersion('DV-NO-RESULTS', 1);
    const db = wrapDatabase(fixture.d1, {
      emptyResultTables: ['ProcurementTransaction', 'ValidationPreCheckRecord']
    });
    const result = await runAssessmentAnalysisFromD1({ ...context({ dataVersionId: 'DV-NO-RESULTS' }), db }, 'module1');
    expect(result).toEqual({
      status: 409, data: { success: false, message: ASSESSMENT_D1_MESSAGES.analysisDataMissing }
    });
  });

  it('rejects invalid assessments, unavailable versions, superseded versions and empty imported datasets', async () => {
    seedAssessment();
    expect(await runAssessmentAnalysisFromD1(context({ dataVersionId: '' }), 'module1'))
      .toMatchObject({ status: 400, data: { success: false } });
    expect(await runAssessmentAnalysisFromD1(context({}, 'A404'), 'module1'))
      .toMatchObject({ status: 404, data: { success: false } });
    expect(await runAssessmentAnalysisFromD1(context({}), 'module1'))
      .toMatchObject({ status: 404, data: { message: ASSESSMENT_D1_MESSAGES.dataVersionMissingForAnalysis('A1') } });
    seedVersion('DV-OLD', 1, 1);
    expect(await runAssessmentAnalysisFromD1(context({ dataVersionId: 'DV-OLD' }), 'full'))
      .toMatchObject({ status: 409, data: { message: ASSESSMENT_D1_MESSAGES.dataVersionSuperseded } });
    seedVersion('DV-EMPTY', 1);
    expect(await runAssessmentAnalysisFromD1(context({ dataVersionId: 'DV-EMPTY' }), 'full'))
      .toMatchObject({ status: 409, data: { message: ASSESSMENT_D1_MESSAGES.analysisDataMissing } });
  });
});
