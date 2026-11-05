import { describe, expect, it, vi } from 'vitest';
import {
  mapD1Customer, mapD1Assessment, mapD1DataVersion, mapD1AnalysisRun, mapD1AuditLog,
  loadAssessmentSnapshots, loadAssessmentSnapshotsForIds, mapD1SnapshotCollection
} from '../../src/services/assessmentD1Mappers';
import { ASSESSMENT_SNAPSHOT_SQL } from '../../src/constants/assessmentD1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';

describe('assessment D1 API serialization', () => {
  it('maps customer fields and serialized website profiles into the frontend contract', () => {
    const customer = mapD1Customer({
      customer_id: 'C1', customer_name: 'Acme', company_website: 'https://acme.test',
      website_profile_json: '{"sector":"Textile"}', business_unit: null, notes: undefined,
      created_at: '2026-10-26', status: 'ACTIVE'
    });
    expect(customer).toEqual({
      customerId: 'C1', customerName: 'Acme', companyWebsite: 'https://acme.test',
      websiteProfile: { sector: 'Textile' }, createdAt: '2026-10-26', status: 'ACTIVE'
    });
    expect(() => mapD1Customer({ website_profile_json: 'invalid' })).toThrow();
  });

  it('maps assessment values and normalizes all boolean flags', () => {
    expect(mapD1Assessment({
      assessment_id: 'A1', customer_id: 'C1', customer_name: 'Acme',
      assessment_period_start: '2025-01-01', total_spend_cr: 42,
      is_test_data: 0, is_report_accepted: 1, all_modules_completed: true
    })).toEqual({
      assessmentId: 'A1', customerId: 'C1', customerName: 'Acme',
      assessmentPeriodStart: '2025-01-01', totalSpendCr: 42,
      isTestData: false, isReportAccepted: true, allModulesCompleted: true
    });
    expect(mapD1DataVersion({ data_version_id: 'V1', is_superseded: 1 }))
      .toEqual({ dataVersionId: 'V1', isSuperseded: true });
  });

  it('deserializes run metrics without allowing them to override database identity', () => {
    expect(mapD1AnalysisRun({
      analysis_run_id: 'R1', is_approved: true, all_gates_passed: 0,
      metrics_json: '{"analysisRunId":"wrong","reviewGates":[{"passed":true}],"module1Metrics":{"validRows":4}}'
    })).toEqual({
      analysisRunId: 'R1', isApproved: true, allGatesPassed: false,
      reviewGates: [{ passed: true }], module1Metrics: { validRows: 4 }
    });
    expect(mapD1AnalysisRun({ analysis_run_id: 'R2', metrics_json: null }))
      .toEqual({ analysisRunId: 'R2', reviewGates: [] });
    expect(() => mapD1AnalysisRun({ metrics_json: '[]' })).toThrow();
  });

  it('deserializes audit details and preserves the original audit identity', () => {
    expect(mapD1AuditLog({ id: 'L1', actor_email: 'user@test', details_json: '{"action":"updated"}' }))
      .toEqual({ id: 'L1', actorEmail: 'user@test', details: { action: 'updated' } });
  });

  it('preserves source-only snapshot metadata while current scalar edits take precedence', () => {
    expect(mapD1Assessment({ assessment_id: 'A1', status: 'APPROVED' }, {
      assessmentId: 'A1', status: 'CREATED', activeAnalysisRunId: 'RUN-1'
    })).toEqual({ assessmentId: 'A1', status: 'APPROVED', activeAnalysisRunId: 'RUN-1' });
    expect(mapD1Customer({ customer_id: 'C1' }, { customMetadata: true })).toHaveProperty('customMetadata', true);
    expect(mapD1DataVersion({ data_version_id: 'V1' }, { original: true })).toHaveProperty('original', true);
    expect(mapD1AuditLog({ id: 'L1' }, { original: true })).toHaveProperty('original', true);
    expect(mapD1AnalysisRun({ analysis_run_id: 'R1' }, { canonicalModule1: { total: 1 } }))
      .toHaveProperty('canonicalModule1', { total: 1 });
  });

  it('loads complete snapshot objects with assessment isolation for colliding run identifiers', async () => {
    const all = vi.fn().mockResolvedValue({
      results: [{ entry_id: 'RUN-1', payload_json: '{"analysisRunId":"RUN-1","assessmentId":"A1"}' }]
    });
    const bind = vi.fn().mockReturnValue({ all });
    const prepare = vi.fn().mockReturnValue({ bind });
    const database = { prepare } as unknown as CloudflareD1Database;
    const snapshots = await loadAssessmentSnapshots(database, 'run', 'A1');
    expect(snapshots.get('RUN-1')).toEqual({ analysisRunId: 'RUN-1', assessmentId: 'A1' });
    expect(prepare).toHaveBeenCalledWith(ASSESSMENT_SNAPSHOT_SQL.byAssessment);
    expect(bind).toHaveBeenCalledWith('run', 'A1');
    await loadAssessmentSnapshots(database, 'customer');
    expect(prepare).toHaveBeenLastCalledWith(ASSESSMENT_SNAPSHOT_SQL.byType);
    expect(bind).toHaveBeenLastCalledWith('customer');
    all.mockResolvedValueOnce({ results: [{ entry_id: 'bad', payload_json: 'invalid' }] });
    await expect(loadAssessmentSnapshots(database, 'run', 'A1')).rejects.toThrow();
  });

  it('loads snapshots for multiple scoped records in one statement and skips empty scopes', async () => {
    const all = vi.fn().mockResolvedValue({
      results: [
        { entry_id: 'C1', payload_json: '{"customerId":"C1","custom":"one"}' },
        { entry_id: 'C2', payload_json: '{"customerId":"C2","custom":"two"}' }
      ]
    });
    const bind = vi.fn().mockReturnValue({ all });
    const prepare = vi.fn().mockReturnValue({ bind });
    const database = { prepare } as unknown as CloudflareD1Database;

    await expect(loadAssessmentSnapshotsForIds(database, 'customer', [])).resolves.toEqual(new Map());
    expect(prepare).not.toHaveBeenCalled();

    const snapshots = await loadAssessmentSnapshotsForIds(database, 'customer', ['C1', 'C2']);
    expect(snapshots).toEqual(new Map([
      ['C1', { customerId: 'C1', custom: 'one' }], ['C2', { customerId: 'C2', custom: 'two' }]
    ]));
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare).toHaveBeenCalledWith(ASSESSMENT_SNAPSHOT_SQL.byAssessmentIds);
    expect(bind).toHaveBeenCalledWith('customer', '["C1","C2"]');
  });

  it('returns all source runs and versions despite legacy scalar identifiers colliding across assessments', () => {
    const snapshots = new Map([
      ['RUN-1', { analysisRunId: 'RUN-1', assessmentId: 'A2', totalSpendCr: 600 }],
      ['RUN-2', { analysisRunId: 'RUN-2', assessmentId: 'A2', totalSpendCr: 600 }]
    ]);
    expect(mapD1SnapshotCollection([
      { analysis_run_id: 'RUN-2', assessment_id: 'A2', total_spend_cr: 10 }
    ], snapshots, mapD1AnalysisRun)).toEqual([
      { reviewGates: [], analysisRunId: 'RUN-1', assessmentId: 'A2', totalSpendCr: 600 },
      { reviewGates: [], analysisRunId: 'RUN-2', assessmentId: 'A2', totalSpendCr: 600 }
    ]);
    expect(mapD1SnapshotCollection([{ data_version_id: 'V1' }], new Map(), mapD1DataVersion))
      .toEqual([{ dataVersionId: 'V1' }]);
  });

  it('keeps new D1 runs and versions visible alongside migrated snapshots', () => {
    const snapshots = new Map([['RUN-1', { analysisRunId: 'RUN-1', assessmentId: 'A2' }]]);
    expect(mapD1SnapshotCollection([
      { analysis_run_id: 'RUN-1', assessment_id: 'A2' },
      { analysis_run_id: 'RUN-NEW', assessment_id: 'A2', total_spend_cr: 42 }
    ], snapshots, mapD1AnalysisRun)).toEqual([
      { reviewGates: [], analysisRunId: 'RUN-1', assessmentId: 'A2' },
      { reviewGates: [], analysisRunId: 'RUN-NEW', assessmentId: 'A2', totalSpendCr: 42 }
    ]);
    expect(mapD1SnapshotCollection([
      { data_version_id: 'V2', assessment_id: 'A2' }, { id: 'AUDIT-2', assessment_id: 'A2' }
    ], new Map([['V1', { dataVersionId: 'V1' }]]), mapD1DataVersion)).toHaveLength(3);
  });
});
