import { describe, expect, it, vi } from 'vitest';
import { ORCHESTRATION_DEFAULTS } from '../../src/constants/orchestration';
import {
  buildStatsByDocument,
  mapAcknowledgement,
  mapAnalysisJob,
  mapAuditEvent,
  mapChecklist,
  mapCorrectionRequest,
  mapDatasetVersions,
  mapPcbiGap,
  mapNotification,
  mapReport,
  parseMetadata,
  parseStoredChecklist
} from '../../src/workerD1OrchestrationMapper';
import type {
  AcknowledgementRow,
  AssessmentJobRow,
  AuditRow,
  ChecklistRow,
  CorrectionRow,
  DataVersionRow,
  NotificationRow,
  ProcurementStatsRow,
  ReportRow
} from '../../src/types/orchestrationD1';
import type { PCBIGapSourceRow } from '../../src/types/orchestrationPcbi';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const jobRow = (overrides: Partial<AssessmentJobRow> = {}): AssessmentJobRow => ({
  assessment_id: 'AIC-1',
  customer_id: 'cust-1',
  customer_name: 'Customer One',
  assessment_owner: 'owner@example.test',
  assessment_period_start: 'Jan 2023',
  assessment_period_end: 'Dec 2023',
  record_spend_cr: 50,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  current_version_id: 'DV-1',
  current_uploaded_by: 'analyst@example.test',
  current_record_count: 10,
  original_version_id: 'DV-1',
  run_id: 'RUN-1',
  run_version_id: 'DV-1',
  run_spend_cr: 60,
  run_addressable_spend_cr: 50,
  run_is_approved: 1,
  run_gates_passed: 1,
  report_id: null,
  report_state: null,
  report_generated_at: null,
  report_submitted_at: null,
  report_viewed_at: null,
  report_acknowledged_at: null,
  report_updated_at: null,
  checklist_complete: null,
  ...overrides
});

const versionRow = (overrides: Partial<DataVersionRow> = {}): DataVersionRow => ({
  data_version_id: 'DV-1',
  assessment_id: 'AIC-1',
  version_number: 1,
  file_name: 'Spend.csv',
  file_size: 1048576,
  checksum: 'sha',
  uploaded_by: 'analyst@example.test',
  uploaded_at: '2026-01-03T00:00:00.000Z',
  record_count: 5,
  notes: null,
  ...overrides
});

const reportRow = (overrides: Partial<ReportRow> = {}): ReportRow => ({
  report_version_id: 'RPT-AIC-1-v1',
  assessment_id: 'AIC-1',
  sequence_number: 1,
  analysis_run_id: 'RUN-1',
  data_version_id: 'DV-1',
  workflow_state: 'ADMIN_REVIEW',
  generated_by: 'usr-admin-001',
  generated_at: '2026-01-04T00:00:00.000Z',
  submitted_by: null,
  submitted_at: null,
  customer_viewed_at: null,
  acknowledged_at: null,
  superseded_by: null,
  superseded_at: null,
  supersede_reason: null,
  created_at: '2026-01-04T00:00:00.000Z',
  updated_at: '2026-01-04T00:00:00.000Z',
  ...overrides
});

const checklistJson = (flag: boolean): string => JSON.stringify({
  dataQuality: { sourceDataValidated: flag, spendReconciles: true, duplicateChecksCompleted: true, classificationReviewed: true },
  pcbi: { requiredPcbiCategoriesResolved: true, benchmarkSourcesValidated: true, exclusionsDocumented: true, pcbiCoverageAcceptable: true },
  financial: {
    savingsCalculationsValidated: true, noDoubleCounting: true, overlapsHandled: true, exclusionsApplied: true, totalsReconcile: true
  },
  report: { module1Reviewed: true, module2Reviewed: true, module3Reviewed: true, module4Reviewed: true, executiveSummaryReviewed: true }
});

describe('mapAnalysisJob', () => {
  it('omits report fields from a viewer who may not see the report', () => {
    const job = mapAnalysisJob(jobRow({ report_id: 'RPT-AIC-1-v1', report_state: 'ADMIN_REVIEW' }), 'ADMIN_REVIEW', false);
    expect(job).not.toHaveProperty('reportVersionId');
    expect(job).not.toHaveProperty('reportGeneratedAt');
    expect(job.lastUpdatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('includes report timeline fields for a viewer who may see the report', () => {
    const job = mapAnalysisJob(jobRow({
      report_id: 'RPT-AIC-1-v1',
      report_generated_at: '2026-01-04T00:00:00.000Z',
      report_submitted_at: '2026-01-05T00:00:00.000Z',
      report_viewed_at: '2026-01-06T00:00:00.000Z',
      report_acknowledged_at: '2026-01-07T00:00:00.000Z',
      report_updated_at: '2026-01-08T00:00:00.000Z'
    }), 'CUSTOMER_ACKNOWLEDGED', true);
    expect(job).toMatchObject({
      reportVersionId: 'RPT-AIC-1-v1',
      reportGeneratedAt: '2026-01-04T00:00:00.000Z',
      submittedAt: '2026-01-05T00:00:00.000Z',
      customerViewedAt: '2026-01-06T00:00:00.000Z',
      acknowledgedAt: '2026-01-07T00:00:00.000Z',
      lastUpdatedAt: '2026-01-08T00:00:00.000Z'
    });
  });

  it('keeps the job timestamp when the report was last updated before it', () => {
    const job = mapAnalysisJob(jobRow({ report_id: 'RPT-AIC-1-v1', report_updated_at: '2025-12-31T00:00:00.000Z' }), 'ADMIN_REVIEW', true);
    expect(job.lastUpdatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('falls back to record spend and then zero when no analysis run exists', () => {
    const recordOnly = mapAnalysisJob(jobRow({ run_spend_cr: null, run_id: null }), 'ANALYSIS_QUEUED', false);
    expect(recordOnly.totalSpendCr).toBe(50);
    const empty = mapAnalysisJob(jobRow({ run_spend_cr: null, run_id: null, record_spend_cr: null }), 'UPLOADED', false);
    expect(empty.totalSpendCr).toBe(0);
  });

  it('uses empty identifiers and the assessment owner when no data version exists', () => {
    const job = mapAnalysisJob(jobRow({
      current_version_id: null,
      current_uploaded_by: null,
      current_record_count: null,
      original_version_id: null,
      assessment_period_start: null,
      assessment_period_end: null
    }), 'UPLOADED', false);
    expect(job).toMatchObject({
      uploadedBy: 'owner@example.test',
      originalUploadId: '',
      currentDataVersionId: '',
      module1VersionId: '',
      totalTransactions: 0,
      analysisPeriod: ORCHESTRATION_DEFAULTS.periodFallback
    });
  });
});

describe('mapDatasetVersions and buildStatsByDocument', () => {
  const stats: ProcurementStatsRow[] = [
    { source_document_id: 'AIC-1:DV-2', supplier_count: 3, plant_count: 2, category_count: 4, spend_cr: 1.23456789 }
  ];

  it('links versions to their parent and derives processing, validation and source from the latest run', () => {
    const versions = mapDatasetVersions([
      versionRow({ data_version_id: 'DV-1', file_name: 'Spend.csv', notes: null }),
      versionRow({ data_version_id: 'DV-2', version_number: 2, file_name: 'correction.xlsx', notes: 'fixed', record_count: 7 })
    ], {
      assessmentId: 'AIC-1',
      customerId: 'cust-1',
      latestRunVersionId: 'DV-2',
      latestRunGatesPassed: false,
      statsByDocument: buildStatsByDocument(stats)
    });
    expect(versions[0]).toMatchObject({
      versionId: 'DV-1',
      parentVersionId: undefined,
      fileType: 'CSV',
      source: 'CUSTOMER_ORIGINAL',
      processingStatus: 'PENDING',
      validationStatus: 'WARNINGS',
      supplierCount: 0,
      notes: undefined
    });
    expect(versions[1]).toMatchObject({
      versionId: 'DV-2',
      parentVersionId: 'DV-1',
      fileType: 'XLSX',
      source: 'ADMIN_CORRECTION',
      processingStatus: 'PROCESSED',
      validationStatus: 'ERRORS',
      transactionCount: 7,
      supplierCount: 3,
      plantCount: 2,
      categoryCount: 4,
      spendInrCr: 1.2346,
      notes: 'fixed'
    });
  });

  it('marks an analysed version valid when its gates passed, and treats names without an extension as unknown', () => {
    const [version] = mapDatasetVersions([versionRow({ file_name: 'trailing.', file_size: 0 })], {
      assessmentId: 'AIC-1',
      customerId: 'cust-1',
      latestRunVersionId: 'DV-1',
      latestRunGatesPassed: true,
      statsByDocument: new Map()
    });
    expect(version).toMatchObject({ validationStatus: 'VALID', fileType: 'UNKNOWN', fileSizeMb: 0 });
  });

  it('indexes procurement statistics by source document', () => {
    expect(buildStatsByDocument(stats).get('AIC-1:DV-2')?.supplier_count).toBe(3);
  });
});

describe('mapPcbiGap', () => {
  const gapRow = (overrides: Partial<PCBIGapSourceRow> = {}): PCBIGapSourceRow => ({
    category_key: 'MG-1',
    item_category: 'MG-1',
    relevant_classification: 'MG-1',
    spend_cr: 1.25,
    transaction_count: 4,
    supplier_count: 2,
    plant_count: 3,
    action: null,
    target_pcbi_series: null,
    benchmark_source: null,
    quality_rating: null,
    exclusion_reason: null,
    exclusion_notes: null,
    research_notes: null,
    resolved_by: null,
    resolved_at: null,
    ...overrides
  });

  it('maps pending gaps with a stable safe ID and preserves their D1 metrics', async () => {
    const first = await mapPcbiGap(gapRow(), 'tenant-1');
    const second = await mapPcbiGap(gapRow(), 'tenant-1');
    expect(first).toMatchObject({
      gapId: expect.stringMatching(/^PCBI-GAP-[a-f0-9]{64}$/u),
      tenantId: 'tenant-1',
      itemCategory: 'MG-1',
      relevantClassification: 'MG-1',
      customerSpendInrCr: 1.25,
      transactionCount: 4,
      supplierCount: 2,
      plantCount: 3,
      status: 'PCBI_REQUIRED',
      resolutionStatus: 'PENDING'
    });
    expect(second.gapId).toBe(first.gapId);
  });

  it.each([
    ['MAP_EXISTING', 'MAPPED', 'PCBI_COVERED'],
    ['ADD_MAP_PCBI', 'MAPPED', 'PCBI_COVERED'],
    ['EXCLUDE', 'EXCLUDED', 'EXCLUDED_MANUAL_REVIEW'],
    ['MARK_NOT_BENCHMARKABLE', 'EXCLUDED', 'NOT_BENCHMARKABLE'],
    ['MARK_SERVICE', 'EXCLUDED', 'SERVICE_NON_COMMODITY'],
    ['REQUEST_RESEARCH', 'RESEARCH_REQUESTED', 'PCBI_REQUIRED']
  ] as const)('maps the %s resolution to API state', async (action, resolutionStatus, status) => {
    const mapped = await mapPcbiGap(gapRow({
      action,
      target_pcbi_series: action === 'MAP_EXISTING' || action === 'ADD_MAP_PCBI' ? 'PCBI-1' : null,
      benchmark_source: action === 'MAP_EXISTING' || action === 'ADD_MAP_PCBI' ? 'Benchmark source' : null,
      exclusion_reason: action === 'EXCLUDE' ? 'OTHER' : null,
      exclusion_notes: 'Reviewed',
      research_notes: 'Research this category',
      resolved_by: 'admin-1',
      resolved_at: '2026-01-01T00:00:00.000Z'
    }), 'tenant-1');
    expect(mapped).toMatchObject({ resolutionStatus, status, resolvedBy: 'admin-1' });
    if (action === 'MAP_EXISTING' || action === 'ADD_MAP_PCBI') expect(mapped.reasonForReview).toContain('PCBI-1');
    if (action === 'EXCLUDE') expect(mapped.exclusionReason).toBe('OTHER');
    if (action === 'REQUEST_RESEARCH') expect(mapped.reasonForReview).toBe('Research this category');
  });

  it('uses safe numeric fallbacks when malformed values reach the mapper', async () => {
    const mapped = await mapPcbiGap(gapRow({
      spend_cr: Number.NaN,
      transaction_count: Number.NaN,
      supplier_count: Number.NaN,
      plant_count: Number.NaN
    }), 'tenant-1');
    expect(mapped).toMatchObject({
      customerSpendInrCr: 0,
      estimatedSpendImpactCr: 0,
      transactionCount: 0,
      supplierCount: 0,
      plantCount: 0
    });
  });

  it('marks a resolution pending again if its benchmark series has since been deactivated', async () => {
    const mapped = await mapPcbiGap(gapRow({
      action: 'MAP_EXISTING', target_pcbi_series: 'PCBI-RETIRED', benchmark_source: null
    }), 'tenant-1');
    expect(mapped).toMatchObject({
      status: 'PCBI_REQUIRED',
      resolutionStatus: 'PENDING',
      reasonForReview: 'PCBI series PCBI-RETIRED is no longer active in D1. Select another active series before generating the report.'
    });
  });

  it('uses descriptive fallbacks for incomplete legacy resolution records', async () => {
    const exclusion = await mapPcbiGap(gapRow({ action: 'EXCLUDE', exclusion_reason: null }), 'tenant-1');
    const research = await mapPcbiGap(gapRow({ action: 'REQUEST_RESEARCH', research_notes: null }), 'tenant-1');
    expect(exclusion.reasonForReview).toContain('OTHER');
    expect(research.reasonForReview).toBe('PCBI research has been requested for this category.');
  });
});

describe('mapReport', () => {
  it.each([
    ['ADMIN_REVIEW', 'GENERATED_PENDING_ADMIN_REVIEW', false],
    ['SUBMITTED_TO_CUSTOMER', 'SUBMITTED', true],
    ['CUSTOMER_VIEWED', 'SUBMITTED', true],
    ['CUSTOMER_ACKNOWLEDGED', 'SUBMITTED', true],
    ['SUPERSEDED', 'SUPERSEDED', false]
  ])('maps workflow state %s to frontend status %s', (state, status, visible) => {
    expect(mapReport(reportRow({ workflow_state: state }))).toMatchObject({
      status,
      isCustomerVisible: visible,
      workflowState: state
    });
  });

  it('includes the approver only once the report was submitted', () => {
    expect(mapReport(reportRow()).approvedBy).toBeUndefined();
    expect(mapReport(reportRow({ submitted_by: 'usr-admin-001', submitted_at: '2026-01-05T00:00:00.000Z' })))
      .toMatchObject({ approvedBy: 'usr-admin-001', approvedAt: '2026-01-05T00:00:00.000Z' });
  });

  it('fails loudly when the stored workflow state is outside the known vocabulary', () => {
    expect(() => mapReport(reportRow({ workflow_state: 'BOGUS' }))).toThrow(
      'Unexpected report workflow state value "BOGUS"'
    );
  });
});

describe('checklist mapping', () => {
  it('parses a stored checklist and rejects invalid JSON or an invalid shape', () => {
    expect(parseStoredChecklist(checklistJson(true))?.dataQuality.sourceDataValidated).toBe(true);
    expect(parseStoredChecklist('{not json')).toBeNull();
    expect(parseStoredChecklist('{"dataQuality": {}}')).toBeNull();
  });

  it('adds the confirming admin and confirmation time, leaving confirmedAt undefined when incomplete', () => {
    const row: ChecklistRow = {
      checklist_id: 'chk-1',
      assessment_id: 'AIC-1',
      report_version_id: 'RPT-AIC-1-v1',
      checklist_json: checklistJson(true),
      is_complete: 0,
      unconfirmed_count: 1,
      confirmed_by: 'usr-admin-001',
      confirmed_at: null,
      created_at: '2026-01-04T00:00:00.000Z'
    };
    const parsed = parseStoredChecklist(row.checklist_json);
    if (parsed === null) throw new Error('fixture checklist must be valid');
    const mapped = mapChecklist(row, parsed);
    expect(mapped.confirmedByAdminId).toBe('usr-admin-001');
    expect(mapped.confirmedAt).toBeUndefined();
    expect(mapChecklist({ ...row, confirmed_at: '2026-01-05T00:00:00.000Z' }, parsed).confirmedAt)
      .toBe('2026-01-05T00:00:00.000Z');
  });
});

describe('acknowledgement, correction and notification mapping', () => {
  it('maps an acknowledgement and drops empty notes', () => {
    const row: AcknowledgementRow = {
      acknowledgement_id: 'ack-1',
      report_version_id: 'RPT-AIC-1-v1',
      assessment_id: 'AIC-1',
      tenant_id: 'cust-1',
      user_id: 'cust-user',
      user_name: 'Customer User',
      notes: null,
      acknowledged_at: '2026-01-06T00:00:00.000Z'
    };
    expect(mapAcknowledgement(row)).toMatchObject({ acknowledgementId: 'ack-1', status: 'ACKNOWLEDGED' });
    expect(mapAcknowledgement(row).notes).toBeUndefined();
    expect(mapAcknowledgement({ ...row, notes: 'Thanks' }).notes).toBe('Thanks');
  });

  it('maps correction requests with optional fields and rejects an unknown status', () => {
    const row: CorrectionRow = {
      request_id: 'corr-1',
      assessment_id: 'AIC-1',
      tenant_id: 'cust-1',
      user_id: 'cust-user',
      category: 'OTHER',
      description: 'Please review the plant mapping.',
      supporting_file_name: null,
      status: 'REVIEWED',
      reviewed_by: 'usr-admin-001',
      admin_response: 'Reviewed and scheduled',
      created_at: '2026-01-06T00:00:00.000Z'
    };
    expect(mapCorrectionRequest(row)).toMatchObject({
      requestId: 'corr-1',
      status: 'REVIEWED',
      reviewedBy: 'usr-admin-001',
      adminResponse: 'Reviewed and scheduled',
      supportingFileName: undefined
    });
    expect(() => mapCorrectionRequest({ ...row, status: 'UNKNOWN' })).toThrow('correction request status');
  });

  const notificationRow = (overrides: Partial<NotificationRow> = {}): NotificationRow => ({
    notification_id: 'notif-1',
    recipient_type: 'CUSTOMER',
    tenant_id: 'cust-1',
    assessment_id: 'AIC-1',
    report_version_id: 'RPT-AIC-1-v1',
    title: 'Ready',
    message: 'Your analysis is ready.',
    severity: 'SUCCESS',
    read_flag: 1,
    email_status: null,
    email_last_error: null,
    email_retry_count: 0,
    created_at: '2026-01-05T00:00:00.000Z',
    ...overrides
  });

  it('maps a notification without email delivery and marks it read when the flag is set', () => {
    const mapped = mapNotification(notificationRow());
    expect(mapped).toMatchObject({ recipientType: 'CUSTOMER', severity: 'SUCCESS', read: true });
    expect(mapped.emailDelivery).toBeUndefined();
  });

  it('maps email delivery details when an email was requested', () => {
    const mapped = mapNotification(notificationRow({
      email_status: 'NOT_SENT',
      email_last_error: 'No provider',
      email_retry_count: 2
    }));
    expect(mapped.emailDelivery).toEqual({ status: 'NOT_SENT', lastError: 'No provider', retryCount: 2 });
    expect(mapNotification(notificationRow({ email_status: 'FAILED' })).emailDelivery?.lastError).toBeUndefined();
  });

  it('rejects unknown recipient types, severities and email statuses', () => {
    expect(() => mapNotification(notificationRow({ recipient_type: 'PARTNER' }))).toThrow('notification recipient');
    expect(() => mapNotification(notificationRow({ severity: 'LOUD' }))).toThrow('notification severity');
    expect(() => mapNotification(notificationRow({ email_status: 'LOST' }))).toThrow('email delivery status');
  });
});

describe('audit mapping and metadata parsing', () => {
  const auditRow = (overrides: Partial<AuditRow> = {}): AuditRow => ({
    event_id: 'aud-1',
    tenant_id: 'cust-1',
    assessment_id: 'AIC-1',
    actor_id: 'usr-admin-001',
    actor_role: 'ADMIN',
    event_type: 'REPORT_GENERATED',
    entity_type: 'ReportVersion',
    entity_id: 'RPT-AIC-1-v1',
    previous_state: null,
    new_state: 'ADMIN_REVIEW',
    metadata_json: '{"analysisRunId":"RUN-1"}',
    created_at: '2026-01-04T00:00:00.000Z',
    ...overrides
  });

  it('maps an audit event and keeps object metadata', () => {
    expect(mapAuditEvent(auditRow())).toMatchObject({
      eventId: 'aud-1',
      actorRole: 'ADMIN',
      timestamp: '2026-01-04T00:00:00.000Z',
      previousState: undefined,
      newState: 'ADMIN_REVIEW',
      metadata: { analysisRunId: 'RUN-1' }
    });
  });

  it('parses metadata only when it is a JSON object', () => {
    expect(parseMetadata(null)).toBeUndefined();
    expect(parseMetadata('{"reason":"x"}')).toEqual({ reason: 'x' });
    expect(parseMetadata('[1,2]')).toBeUndefined();
    expect(parseMetadata('"text"')).toBeUndefined();
    expect(parseMetadata('null')).toBeUndefined();
    expect(parseMetadata('{broken')).toBeUndefined();
  });

  it('rejects an audit actor role outside the allowed list', () => {
    expect(() => mapAuditEvent(auditRow({ actor_role: 'ROBOT' }))).toThrow('audit actor role');
  });
});
