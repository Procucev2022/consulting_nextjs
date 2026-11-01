import { describe, expect, it } from 'vitest';
import { handleAssessmentRoute } from '../../src/workerD1Assessment';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';
import { ASSESSMENT_REVIEW_GATE_KEYS } from '../../src/constants/assessmentD1';
import type { CloudflareEnvironment } from '../../src/types/cloudflare';

const createArtifactEnvironment = () => {
  const stored = new Map<string, Uint8Array>();
  const environment: CloudflareEnvironment = {
    APP_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
    OBJECTS: {
      put: async (key, value) => { stored.set(key, new Uint8Array(value as Uint8Array)); },
      get: async (key) => {
        const bytes = stored.get(key);
        return bytes ? { body: new Response(bytes).body as ReadableStream } : null;
      },
      delete: async (key) => { stored.delete(key); }
    }
  };
  return { environment, stored };
};

const seedAssessment = (fixture: ReturnType<typeof createWorkerDatabase>, options: Record<string, unknown> = {}): void => {
  const assessmentId = String(options.assessmentId || 'A-LIFECYCLE');
  const runId = options.activeRunId === null ? '' : String(options.activeRunId || 'RUN-LIFECYCLE');
  fixture.db.prepare(`INSERT INTO AssessmentRecord (
    assessment_id, customer_id, customer_name, industry, assessment_owner, status, is_test_data,
    assessment_period_start, assessment_period_end
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    assessmentId, 'C-LIFECYCLE', 'Lifecycle Client', 'Manufacturing', 'analyst@example.test',
    String(options.status || 'ANALYST_REVIEW'), Number(options.isTestData || 0), '2025-04-01', '2026-03-31'
  );
  if (!options.missingVersion) {
    fixture.db.prepare(`INSERT INTO AssessmentDataVersion (
      data_version_id, assessment_id, version_number, file_name, file_size, checksum, uploaded_by, record_count
    ) VALUES (?, ?, 1, ?, 16, ?, ?, 1)`).run(
      'DV-LIFECYCLE', assessmentId, 'source.csv', 'dataset-checksum', 'analyst@example.test'
    );
  }
  if (runId && !options.missingRun) {
    fixture.db.prepare(`INSERT INTO AssessmentAnalysisRun (
      analysis_run_id, assessment_id, data_version_id, status, total_spend_cr, validated_spend_cr,
      potential_savings_cr, savings_pct, all_gates_passed, is_approved, is_superseded
    ) VALUES (?, ?, ?, ?, 10, 10, 2, 20, ?, ?, ?)`)
      .run(runId, assessmentId, 'DV-LIFECYCLE', String(options.runStatus || 'COMPLETED'),
        Number(options.gatesPassed ?? 1), Number(options.runApproved || 0), Number(options.runSuperseded || 0));
  }
  const snapshot = {
    assessmentId,
    status: String(options.status || 'ANALYST_REVIEW'),
    ...(runId ? { activeAnalysisRunId: runId } : {})
  };
  fixture.db.prepare(`INSERT INTO AssessmentStoreEntry (
    entry_type, assessment_id, entry_id, payload_json, source_checksum
  ) VALUES ('assessment', ?, ?, ?, 'fixture')`).run(assessmentId, assessmentId, JSON.stringify(snapshot));
  if (!options.skipReviewGates) {
    for (const gateKey of ASSESSMENT_REVIEW_GATE_KEYS) {
      fixture.db.prepare(`INSERT INTO AssessmentReviewGate (
        assessment_id, gate_key, status, evidence_reference, review_note, reviewed_by, reviewed_at
      ) VALUES (?, ?, 'PASSED', ?, ?, ?, CURRENT_TIMESTAMP)`)
        .run(assessmentId, gateKey, `D1 test evidence: ${gateKey}`, 'Reviewed by lifecycle fixture', 'analyst@example.test');
    }
  }
};

const invoke = async (
  fixture: ReturnType<typeof createWorkerDatabase>,
  action: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; assessmentId?: string; environment?: CloudflareEnvironment } = {}
) => {
  const assessmentId = options.assessmentId || 'A-LIFECYCLE';
  const path = `/${assessmentId}/${action}`;
  const headers = { ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers };
  const request = new Request(`https://consulting.edge/api/assessment${path}`, {
    method: options.method || 'POST',
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
  });
  return handleAssessmentRoute(fixture.d1, path, request, new URL(request.url), options.environment || createArtifactEnvironment().environment);
};

const expectStatus = async (
  action: string,
  expected: number,
  seedOptions: Record<string, unknown> = {},
  requestOptions: Parameters<typeof invoke>[2] = {}
): Promise<void> => {
  const fixture = createWorkerDatabase();
  seedAssessment(fixture, seedOptions);
  try {
    const result = await invoke(fixture, action, requestOptions);
    expect(result.status).toBe(expected);
    expect((result.data as { success?: boolean }).success).toBe(false);
  } finally {
    fixture.close();
  }
};

describe('D1 assessment lifecycle actions', () => {
  it('approves a passed analysis, persists a D1 package manifest, delivers, accepts, and closes', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture);
    fixture.db.prepare(`INSERT INTO ProcurementTransaction (
      transaction_id, tenant_id, assessment_id, source_document_id, source_row_number, supplier_name,
      currency, total_inr_raw, total_in_cr_raw, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('TX-LIFECYCLE', 'C-LIFECYCLE', 'A-LIFECYCLE', 'DV-LIFECYCLE', 1, 'D1 Demo Supplier', 'INR', 100000, 0.001, '{}');
    fixture.db.prepare(`INSERT INTO ValidationPreCheckRecord (
      record_id, po_number, vendor_name, raw_desc, amount, amount_inr, raw_currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('REC-DV-LIFECYCLE-ROW-1', 'PO-1', 'D1 Demo Supplier', 'D1 sourced item', 100000, 100000, 'INR');
    const artifactEnvironment = createArtifactEnvironment();
    try {
      const approval = await invoke(fixture, 'approve', { body: { approvalComment: 'Reviewed and approved' } });
      expect(approval.data).toMatchObject({ status: 'APPROVED', approvedBy: 'analyst@procucev.com' });
      expect(fixture.db.prepare('SELECT is_approved FROM AssessmentAnalysisRun WHERE analysis_run_id = ?')
        .get('RUN-LIFECYCLE').is_approved).toBe(1);
      fixture.db.prepare(`INSERT INTO FxMasterVersion (
        version_id, workbook_name, created_date, sha256_checksum, validation_status
      ) VALUES (?, ?, ?, ?, ?)`).run('FX-V1', 'demo-fx.xlsx', '2026-10-01', 'd1-fx-checksum', 'VALIDATED');

      const packaged = await invoke(fixture, 'delivery-package', { body: {}, environment: artifactEnvironment.environment });
      expect((packaged.data as any).items).toHaveLength(10);
      expect((packaged.data as any).checksums.sourceDataset).toBe('dataset-checksum');
      expect((packaged.data as any).checksums.fxMaster).toBe('d1-fx-checksum');
      expect((packaged.data as any).checksums).not.toHaveProperty('evidenceWorkbook');
      expect((packaged.data as any).items.every((item: { artifactStatus: string }) => item.artifactStatus === 'GENERATED')).toBe(true);
      expect(artifactEnvironment.stored.size).toBe(10);
      const packagedAgain = await invoke(fixture, 'delivery-package', { method: 'GET', environment: artifactEnvironment.environment });
      expect((packagedAgain.data as any).assessmentPeriod).toBe('2025-04-01 – 2026-03-31');
      expect(fixture.db.prepare("SELECT COUNT(*) AS count FROM AssessmentStoreEntry WHERE entry_type = 'delivery_package'")
        .get().count).toBe(1);

      const delivered = await invoke(fixture, 'deliver', {
        body: { recipientEmail: 'buyer@example.test', deliveryChannel: 'PORTAL', notes: 'Secure release' },
        headers: { 'x-user-email': 'admin@example.test', 'x-user-role': 'INTERNAL_ADMIN' }
      });
      expect(delivered.data).toMatchObject({
        status: 'DELIVERED', deliveredBy: 'admin@example.test', deliveredToEmail: 'buyer@example.test',
        deliveryChannel: 'PORTAL'
      });

      const accepted = await invoke(fixture, 'accept', { body: { acceptanceComment: 'Reviewed', acceptedBy: 'buyer@example.test' } });
      expect(accepted.data).toMatchObject({
        status: 'ACCEPTED', isReportAccepted: true, allModulesCompleted: true
      });
      const closed = await invoke(fixture, 'close', { body: {} });
      expect((closed.data as any).status).toBe('CLOSED');
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentAuditLog WHERE assessment_id = ?')
        .get('A-LIFECYCLE').count).toBe(6);
    } finally {
      fixture.close();
    }
  });

  it('downloads a generated PDF from R2 and rejects missing, unknown, or unreadable artifacts', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', runApproved: 1 });
    fixture.db.prepare(`INSERT INTO ProcurementTransaction (
      transaction_id, tenant_id, assessment_id, source_document_id, source_row_number, supplier_name,
      currency, total_inr_raw, total_in_cr_raw, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('TX-LIFECYCLE-DOWNLOAD', 'C-LIFECYCLE', 'A-LIFECYCLE', 'DV-LIFECYCLE', 1, 'D1 Demo Supplier', 'INR', 100000, 0.001, '{}');
    const artifactEnvironment = createArtifactEnvironment();
    try {
      const packaged = await invoke(fixture, 'delivery-package', { body: {}, environment: artifactEnvironment.environment });
      expect((packaged.data as any).items[0].encryptionIv).toBeTruthy();
      const download = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', environment: artifactEnvironment.environment, headers: { 'x-request-id': 'req-delivery-1' }
      });
      expect(download.response?.status).toBe(200);
      expect(download.response?.headers.get('content-type')).toBe('application/pdf');
      expect(download.response?.headers.get('x-request-id')).toBe('req-delivery-1');
      const pdfBytes = new Uint8Array(await download.response?.arrayBuffer() as ArrayBuffer);
      const pdfText = new TextDecoder().decode(pdfBytes);
      expect(pdfText.slice(0, 5)).toBe('%PDF-');
      expect(pdfText).toContain('Source transaction rows: 1');
      const noRequestId = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', environment: artifactEnvironment.environment
      });
      expect(noRequestId.response?.headers.get('x-request-id')).toBeNull();
      const noR2 = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', environment: { APP_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef' }
      });
      expect(noR2.status).toBe(503);
      const missing = await invoke(fixture, 'delivery-package/UNKNOWN_ARTIFACT', { method: 'GET', environment: artifactEnvironment.environment });
      expect(missing.status).toBe(404);
      const unsupportedMethod = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'POST', body: {}, environment: artifactEnvironment.environment
      });
      expect(unsupportedMethod.status).toBe(405);
      const corruptKey = { ...artifactEnvironment.environment, APP_ENCRYPTION_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' };
      const corrupt = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', { method: 'GET', environment: corruptKey });
      expect(corrupt.status).toBe(500);
      const missingKey = { ...artifactEnvironment.environment };
      delete missingKey.APP_ENCRYPTION_KEY;
      const keyUnavailable = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', environment: missingKey
      });
      expect(keyUnavailable.status).toBe(503);
    } finally {
      fixture.close();
    }
  });

  it('handles missing assessments, invalid manifests, and missing R2 objects on artifact downloads', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', runApproved: 1 });
    const artifactEnvironment = createArtifactEnvironment();
    try {
      const absentAssessment = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', assessmentId: 'A-MISSING', environment: artifactEnvironment.environment
      });
      expect(absentAssessment.status).toBe(404);

      const packaged = await invoke(fixture, 'delivery-package', {
        body: {}, environment: artifactEnvironment.environment
      });
      const manifest = packaged.data as { analysisRunId: string; items: Array<{ id: string; storageKey: string }> };
      fixture.db.prepare(`UPDATE AssessmentStoreEntry SET payload_json = ?
        WHERE entry_type = 'delivery_package' AND assessment_id = ? AND entry_id = ?`)
        .run(JSON.stringify({ items: 'invalid' }), 'A-LIFECYCLE', manifest.analysisRunId);
      const invalidManifest = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', environment: artifactEnvironment.environment
      });
      expect(invalidManifest.status).toBe(404);

      fixture.db.prepare(`UPDATE AssessmentStoreEntry SET payload_json = ?
        WHERE entry_type = 'delivery_package' AND assessment_id = ? AND entry_id = ?`)
        .run(JSON.stringify(manifest), 'A-LIFECYCLE', manifest.analysisRunId);
      const [artifact] = manifest.items;
      artifactEnvironment.stored.delete(artifact.storageKey);
      const missingObject = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', environment: artifactEnvironment.environment
      });
      expect(missingObject.status).toBe(404);

      const bucket = artifactEnvironment.environment.OBJECTS;
      if (!bucket) throw new Error('Test R2 bucket is unavailable');
      bucket.get = async () => ({
        body: new ReadableStream({ start(controller) { controller.error('stream read failed'); } })
      });
      const streamFailure = await invoke(fixture, 'delivery-package/EXECUTIVE_OPPORTUNITY_BRIEF', {
        method: 'GET', environment: artifactEnvironment.environment
      });
      expect(streamFailure.status).toBe(500);
    } finally {
      fixture.close();
    }
  });

  it('removes encrypted R2 objects if the D1 delivery manifest cannot be committed', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', runApproved: 1 });
    const artifactEnvironment = createArtifactEnvironment();
    const prepare = fixture.d1.prepare.bind(fixture.d1);
    fixture.d1.prepare = (sql) => {
      const statement = prepare(sql);
      if (!sql.includes('INSERT INTO AssessmentStoreEntry')) return statement;
      return {
        ...statement,
        bind: (...values: unknown[]) => ({
          ...statement.bind(...values),
          run: async (): Promise<unknown> => { throw new Error('D1 manifest write failed'); }
        })
      };
    };
    try {
      const result = await invoke(fixture, 'delivery-package', {
        body: {}, environment: artifactEnvironment.environment
      });
      expect(result.status).toBe(503);
      expect(artifactEnvironment.stored.size).toBe(0);
    } finally {
      fixture.close();
    }
  });

  it('fails package generation when R2 or the AES-256-GCM key is unavailable and cleans up partial writes', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', runApproved: 1 });
    try {
      const missingR2 = await invoke(fixture, 'delivery-package', {
        body: {}, environment: { APP_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef' }
      });
      expect(missingR2.status).toBe(503);
      const invalidKey = createArtifactEnvironment();
      invalidKey.environment.APP_ENCRYPTION_KEY = 'short';
      const keyFailure = await invoke(fixture, 'delivery-package', { body: {}, environment: invalidKey.environment });
      expect(keyFailure.status).toBe(503);
      expect(invalidKey.stored.size).toBe(0);
      const partial = createArtifactEnvironment();
      const put = partial.environment.OBJECTS?.put;
      let calls = 0;
      if (partial.environment.OBJECTS && put) {
        partial.environment.OBJECTS.put = async (key, value, options) => {
          calls += 1;
          if (calls === 2) throw new Error('R2 unavailable');
          await put(key, value, options);
        };
      }
      const r2Failure = await invoke(fixture, 'delivery-package', { body: {}, environment: partial.environment });
      expect(r2Failure.status).toBe(503);
      expect(partial.stored.size).toBe(0);

      const missingKey = createArtifactEnvironment();
      delete missingKey.environment.APP_ENCRYPTION_KEY;
      const missingEncryptionKey = await invoke(fixture, 'delivery-package', {
        body: {}, environment: missingKey.environment
      });
      expect(missingEncryptionKey.status).toBe(503);
      expect(missingKey.stored.size).toBe(0);

      const cleanupFailure = createArtifactEnvironment();
      let storedAttempts = 0;
      const cleanupBucket = cleanupFailure.environment.OBJECTS;
      if (!cleanupBucket) throw new Error('Test R2 bucket is unavailable');
      const originalPut = cleanupBucket.put;
      cleanupBucket.put = async (key, value, options) => {
        storedAttempts += 1;
        if (storedAttempts === 2) throw 'R2 rejected the object';
        await originalPut(key, value, options);
      };
      cleanupBucket.delete = async (key) => {
        cleanupFailure.stored.delete(key);
        throw 'R2 cleanup failed';
      };
      const cleanupResult = await invoke(fixture, 'delivery-package', {
        body: {}, environment: cleanupFailure.environment
      });
      expect(cleanupResult.status).toBe(503);
      expect(cleanupFailure.stored.size).toBe(0);
    } finally {
      fixture.close();
    }
  });

  it('supports the legacy delivery request body and uses action-specific default actor identities', async () => {
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', runApproved: 1 });
    try {
      const delivered = await invoke(fixture, 'deliver', { body: { deliveredToEmail: 'buyer@example.test', deliveryNotes: 'Email release' } });
      expect(delivered.data).toMatchObject({
        deliveredBy: 'admin@procucev.com', deliveredToEmail: 'buyer@example.test', deliveryChannel: 'EMAIL'
      });
      const accepted = await invoke(fixture, 'accept', { body: {} });
      expect((accepted.data as any).acceptedBy).toBe('customer@procucev.com');
    } finally {
      fixture.close();
    }
  });

  it('rejects invalid and unauthorized approvals and enforces active run gates and data-version scope', async () => {
    await expectStatus('approve', 400, {}, { body: { approvalComment: 'no' } });
    await expectStatus('approve', 403, {}, {
      body: { approvalComment: 'Reviewed and approved' },
      headers: { 'x-user-role': 'CUSTOMER' }
    });
    await expectStatus('approve', 400, { activeRunId: null }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 404, { missingRun: true }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 400, { runSuperseded: 1 }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 400, { gatesPassed: 0 }, { body: { approvalComment: 'Reviewed and approved' } });
    await expectStatus('approve', 400, {}, {
      body: { approvalComment: 'Reviewed and approved', dataVersionId: 'DV-OTHER' }
    });
    const fixture = createWorkerDatabase();
    seedAssessment(fixture);
    try {
      const approved = await invoke(fixture, 'approve', {
        body: { approvalComment: 'Reviewed and approved', dataVersionId: 'DV-LIFECYCLE' },
        headers: { 'x-user-role': 'ANALYST', 'x-user-email': 'reviewer@example.test' }
      });
      expect((approved.data as any).approvedBy).toBe('reviewer@example.test');
    } finally {
      fixture.close();
    }
  });

  it('requires every evidence-backed assessment review gate before analyst approval', async () => {
    await expectStatus('approve', 400, { skipReviewGates: true }, {
      body: { approvalComment: 'Reviewed and approved' }
    });
  });

  it('rejects package generation unless actor, assessment, active run, approval, and source version are valid', async () => {
    await expectStatus('delivery-package', 403, { status: 'APPROVED', runApproved: 1 }, {
      body: {}, headers: { 'x-user-role': 'CUSTOMER' }
    });
    await expectStatus('delivery-package', 400, { status: 'ANALYST_REVIEW', runApproved: 1 }, { body: {} });
    await expectStatus('delivery-package', 400, { status: 'APPROVED', activeRunId: null }, { body: {} });
    await expectStatus('delivery-package', 404, { status: 'APPROVED', missingRun: true }, { body: {} });
    await expectStatus('delivery-package', 400, { status: 'APPROVED', runApproved: 0 }, { body: {} });
    await expectStatus('delivery-package', 400, { status: 'APPROVED', runApproved: 1, runSuperseded: 1 }, { body: {} });
    await expectStatus('delivery-package', 404, { status: 'APPROVED', runApproved: 1, missingVersion: true }, { body: {} });
  });

  it('validates delivery recipients and prevents delivery before approval or without test-data acknowledgement', async () => {
    await expectStatus('deliver', 400, { status: 'APPROVED' }, { body: {} });
    await expectStatus('deliver', 404, {}, { body: { recipientEmail: 'buyer@example.test' }, assessmentId: 'UNKNOWN' });
    await expectStatus('deliver', 400, { status: 'APPROVED', isTestData: 1 }, {
      body: { recipientEmail: 'buyer@example.test' }
    });
    await expectStatus('deliver', 400, { status: 'ANALYST_REVIEW' }, {
      body: { recipientEmail: 'buyer@example.test' }
    });
    const fixture = createWorkerDatabase();
    seedAssessment(fixture, { status: 'APPROVED', isTestData: 1 });
    try {
      const delivered = await invoke(fixture, 'deliver', {
        body: { recipientEmail: 'buyer@example.test', isTestDelivery: true }
      });
      expect((delivered.data as any).status).toBe('DELIVERED');
    } finally {
      fixture.close();
    }
  });

  it('requires an approved or delivered assessment with a completed active run for acceptance', async () => {
    await expectStatus('accept', 400, {}, { body: { acceptedBy: 'not-an-email' } });
    await expectStatus('accept', 404, {}, { body: {}, assessmentId: 'UNKNOWN' });
    await expectStatus('accept', 400, { status: 'ANALYST_REVIEW' }, { body: {} });
    await expectStatus('accept', 400, { status: 'APPROVED', activeRunId: null }, { body: {} });
    await expectStatus('accept', 404, { status: 'APPROVED', missingRun: true }, { body: {} });
    await expectStatus('accept', 400, { status: 'DELIVERED', runStatus: 'FAILED' }, { body: {} });
  });

  it('returns not found when closing an unknown assessment', async () => {
    await expectStatus('close', 404, {}, { body: {}, assessmentId: 'UNKNOWN' });
  });
});
