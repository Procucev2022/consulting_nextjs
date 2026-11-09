import { describe, expect, it, vi } from 'vitest';
import { handleAssessmentRoute as handleAssessmentRouteImpl } from '../src/workerD1Assessment';
import type { CloudflareD1Database } from '../src/types/cloudflare';
import { ASSESSMENT_D1_MESSAGES } from '../src/constants/assessmentD1';
import { D1_LOG_MESSAGES, D1_ROUTE_MESSAGES } from '../src/constants/d1';
import { createWorkerAuthToken } from '../src/workerAuth';
import logger from '../src/utils/logger';
import { createWorkerDatabase, runtimeEnvironment, WORKER_CORE_SECRET } from './helpers/workerCoreFixtures';

const mockDb = (records: {
  customers?: any[];
  assessments?: any[];
  versions?: any[];
  runs?: any[];
  auditLogs?: any[];
  snapshots?: Array<{ entry_type: string; assessment_id: string; entry_id: string; payload_json: string }>;
} = {}): CloudflareD1Database => {
  const customers = records.customers || [];
  const assessments = records.assessments || [];
  const versions = records.versions || [];
  const runs = records.runs || [];
  const auditLogs = records.auditLogs || [];

  const prepare = vi.fn((sql: string) => ({
    bind: vi.fn((...args: unknown[]) => ({
      all: vi.fn(async () => {
        if (sql.includes('AssessmentStoreEntry')) return {
          results: (records.snapshots || []).filter((row) => row.entry_type === args[0] &&
            (args.length < 2 || row.assessment_id === args[1]))
        };
        if (sql.includes('CustomerRecord')) return { results: customers };
        if (sql.includes('AssessmentRecord')) return { results: assessments };
        if (sql.includes('AssessmentDataVersion')) return { results: versions };
        if (sql.includes('AssessmentAnalysisRun')) return { results: runs };
        if (sql.includes('AssessmentAuditLog')) return { results: auditLogs };
        return { results: [] };
      }),
      first: vi.fn(async () => {
        if (sql.includes('SELECT 1')) return { ok: 1 };
        if (sql.includes('CustomerRecord')) {
          const id = args[0];
          return customers.find((c) => c.customer_id === id) || customers[0] || null;
        }
        if (sql.includes('AssessmentRecord')) {
          const id = args[0];
          return assessments.find((a) => a.assessment_id === id) || assessments[0] || null;
        }
        return null;
      }),
      run: vi.fn(async () => {})
    })),
    all: vi.fn(async () => {
      if (sql.includes('CustomerRecord')) return { results: customers };
      if (sql.includes('AssessmentRecord')) return { results: assessments };
      if (sql.includes('AssessmentDataVersion')) return { results: versions };
      if (sql.includes('AssessmentAnalysisRun')) return { results: runs };
      if (sql.includes('AssessmentAuditLog')) return { results: auditLogs };
      return { results: [] };
    }),
    first: vi.fn(async () => {
      if (sql.includes('SELECT 1')) return { ok: 1 };
      if (sql.includes('CustomerRecord')) return customers[0] || null;
      if (sql.includes('AssessmentRecord')) return assessments[0] || null;
      return null;
    }),
    run: vi.fn(async () => {})
  }));

  return { prepare } as unknown as CloudflareD1Database;
};

const req = (path: string, options: RequestInit = {}): Request =>
  new Request(`https://consulting.edge/api/assessment${path}`, options);

const handleAssessmentRoute = (
  db: CloudflareD1Database | undefined,
  subPath: string,
  request: Request,
  url: URL,
  environment: Parameters<typeof handleAssessmentRouteImpl>[4] = {}
) => handleAssessmentRouteImpl(db, subPath, request, url, {
  ...environment,
  REQUEST_TENANT_ID: environment.REQUEST_TENANT_ID || 'TNT-GLOBAL-8902'
});

describe('workerD1Assessment handler', () => {
  it('dispatches assessment workbook upload and validation to the D1 lifecycle', async () => {
    const fixture = createWorkerDatabase();
    fixture.db.prepare(`INSERT INTO AssessmentRecord (
      assessment_id, customer_id, customer_name, industry, assessment_owner, data_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'A1', 'C1', 'Client', 'Manufacturing', 'analyst@example.test', 'NOT_RECEIVED', 'CREATED'
    );
    const bytes = new TextEncoder().encode(
      'PO Number,Supplier Name,Description,Quantity,Net Price,Currency\nPO-1,Acme,Packaging,2,500,INR'
    );
    const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
      (value) => value.toString(16).padStart(2, '0')).join('');
    const bucket = {
      put: vi.fn(async () => undefined), get: vi.fn(async () => null), delete: vi.fn(async () => undefined)
    };
    const environment = { OBJECTS: bucket };
    const upload = req('/A1/upload', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'assessment.csv', fileSize: bytes.byteLength, checksum,
        fileBase64: Buffer.from(bytes).toString('base64')
      })
    });
    try {
      const uploaded = await handleAssessmentRoute(fixture.d1, '/A1/upload', upload, new URL(upload.url), environment);
      expect(uploaded.status).toBe(201);
      const dataVersionId = (uploaded.data as { dataVersion: { dataVersionId: string } }).dataVersion.dataVersionId;
      const validate = req('/A1/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataVersionId })
      });
      const validated = await handleAssessmentRoute(fixture.d1, '/A1/validate', validate, new URL(validate.url), environment);
      expect((validated.data as { validationSummary: { sourceRowCount: number } }).validationSummary.sourceRowCount).toBe(1);
      const runModule1 = req('/A1/run-module1', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataVersionId })
      });
      const module1 = await handleAssessmentRoute(fixture.d1, '/A1/run-module1', runModule1, new URL(runModule1.url), environment);
      expect(module1.data).toMatchObject({
        success: true,
        assessment: { assessmentId: 'A1', totalSpendCr: 0.0001, validatedSpendCr: 0.0001 },
        analysisRun: { dataVersionId, status: 'COMPLETED', allGatesPassed: false, module1Metrics: { sourceRows: 1, validRows: 1 } }
      });
      const fullRun = req('/A1/run-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataVersionId })
      });
      expect(await handleAssessmentRoute(fixture.d1, '/A1/run-analysis', fullRun, new URL(fullRun.url), environment))
        .toMatchObject({ data: { dataVersionId, status: 'COMPLETED', allGatesPassed: false } });
      await expect(fixture.d1.prepare('SELECT COUNT(*) AS count FROM AssessmentAnalysisRun WHERE assessment_id = ? AND is_superseded = 0')
        .bind('A1').first()).resolves.toEqual({ count: 1 });
      await expect(fixture.d1.prepare('SELECT COUNT(*) AS count FROM AssessmentAuditLog WHERE assessment_id = ? AND action = ?')
        .bind('A1', 'ANALYSIS_COMPLETED').first()).resolves.toEqual({ count: 2 });
    } finally {
      fixture.close();
    }
  });

  it('rejects malformed action payloads, missing assessments, missing versions and superseded versions', async () => {
    const fixture = createWorkerDatabase();
    try {
      fixture.db.prepare(`INSERT INTO AssessmentRecord (assessment_id, customer_id, customer_name, industry, assessment_owner)
        VALUES (?, ?, ?, ?, ?)`).run('A1', 'C1', 'Client', 'Manufacturing', 'analyst@example.test');
      const run = (path: string, body: unknown) => {
        const request = req(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        return handleAssessmentRoute(fixture.d1, path, request, new URL(request.url));
      };
      expect(await run('/A1/run-module1', { dataVersionId: '' })).toMatchObject({ status: 400, data: { success: false } });
      expect(await run('/MISSING/run-analysis', {})).toMatchObject({ status: 404, data: { success: false } });
      expect(await run('/A1/run-analysis', {})).toMatchObject({ status: 404, data: { success: false } });
      fixture.db.prepare(`INSERT INTO AssessmentDataVersion (data_version_id, assessment_id, version_number, file_name, checksum, is_superseded)
        VALUES (?, ?, ?, ?, ?, ?)`).run('DV-OLD', 'A1', 1, 'old.csv', 'checksum', 1);
      expect(await run('/A1/run-analysis', { dataVersionId: 'DV-OLD' }))
        .toMatchObject({ status: 409, data: { message: ASSESSMENT_D1_MESSAGES.dataVersionSuperseded } });
      fixture.db.prepare(`INSERT INTO AssessmentDataVersion (data_version_id, assessment_id, version_number, file_name, checksum, record_count)
        VALUES (?, ?, ?, ?, ?, ?)`).run('DV-EMPTY', 'A1', 2, 'empty.csv', 'checksum', 1);
      expect(await run('/A1/run-analysis', { dataVersionId: 'DV-EMPTY' }))
        .toMatchObject({ status: 409, data: { message: ASSESSMENT_D1_MESSAGES.analysisDataMissing } });
    } finally {
      fixture.close();
    }
  });

  it('rejects unknown actions and wrong methods without returning an assessment detail success', async () => {
    const database = mockDb();
    const unknown = req('/A1/not-an-action');
    expect(await handleAssessmentRoute(database, '/A1/not-an-action', unknown, new URL(unknown.url))).toEqual({
      status: 404, data: { success: false, message: ASSESSMENT_D1_MESSAGES.unknownAction }
    });
    for (const [path, method] of [['/A1', 'DELETE'], ['/A1/nda', 'GET'], ['/A1/audit', 'POST']]) {
      const request = req(path, { method });
      expect(await handleAssessmentRoute(database, path, request, new URL(request.url))).toEqual({
        status: 405, data: { success: false, message: ASSESSMENT_D1_MESSAGES.unsupportedMethod }
      });
    }
  });
  it('validates empty customer and assessment creates and does not fabricate API entities', async () => {
    const empty = mockDb();
    for (const path of ['/customers', '/']) {
      const request = req(path, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
      const response = await handleAssessmentRoute(empty, path, request, new URL(request.url));
      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({ success: false, errors: expect.any(Array) });
    }
    const patch = req('/customers/C1', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        customerName: 'Acme', industry: 'Textile', businessUnit: 'Plant', region: 'EU', baseCurrency: 'EUR',
        companyWebsite: 'https://acme.test', contactEmail: 'user@acme.test', contactPerson: 'User',
        status: 'ACTIVE', notes: 'Updated'
      })
    });
    expect((await handleAssessmentRoute(empty, '/customers/C1', patch, new URL(patch.url))).data).toBeNull();
    for (const action of ['nda', 'data-status']) {
      const path = `/A1/${action}`;
      const request = req(path, { method: 'PATCH', body: '{}', headers: { 'Content-Type': 'application/json' } });
      expect((await handleAssessmentRoute(empty, path, request, new URL(request.url))).status).toBe(404);
    }
    expect((await handleAssessmentRoute(empty, '//', req('//'), new URL(req('//').url))).status).toBe(404);
  });
  it('preserves complete source snapshots and isolates reused run identifiers by assessment', async () => {
    const snapshot = (entry_type: string, assessment_id: string, entry_id: string, data: object) => ({
      entry_type, assessment_id, entry_id, payload_json: JSON.stringify(data)
    });
    const database = mockDb({
      assessments: [{ assessment_id: 'A2', customer_name: 'Acme', total_spend_cr: 600 }],
      runs: [{ analysis_run_id: 'RUN-2', total_spend_cr: 10 }],
      snapshots: [
        snapshot('assessment', 'A2', 'A2', { assessmentId: 'A2', activeAnalysisRunId: 'RUN-2' }),
        snapshot('run', 'A2', 'RUN-1', { analysisRunId: 'RUN-1', assessmentId: 'A2', totalSpendCr: 600 }),
        snapshot('run', 'A2', 'RUN-2', { analysisRunId: 'RUN-2', assessmentId: 'A2', totalSpendCr: 600 }),
        snapshot('run', 'A1', 'RUN-1', { analysisRunId: 'RUN-1', assessmentId: 'A1', totalSpendCr: 4000 }),
        snapshot('version', 'A2', 'DV-1', { dataVersionId: 'DV-1', assessmentId: 'A2' }),
        snapshot('audit', 'A2', 'LOG-1', { id: 'LOG-1', assessmentId: 'A2', details: { original: true } })
      ]
    });
    const result = await handleAssessmentRoute(database, '/A2', req('/A2'), new URL(req('/A2').url));
    expect((result.data as any).assessment.activeAnalysisRunId).toBe('RUN-2');
    expect((result.data as any).runs).toHaveLength(2);
    expect((result.data as any).runs.every((run: any) => run.assessmentId === 'A2' && run.totalSpendCr === 600)).toBe(true);
    expect((result.data as any).versions).toEqual([{ dataVersionId: 'DV-1', assessmentId: 'A2' }]);
    expect((result.data as any).auditLogs[0].details).toEqual({ original: true });
  });
  it('throws error when DB is undefined', async () => {
    await expect(handleAssessmentRoute(undefined, '/mode', req('/mode'), new URL('https://consulting.edge/api/assessment/mode'))).rejects.toThrow(
      'Cloudflare D1 binding DB is not configured'
    );
  });

  it('handles /mode and /system-info', async () => {
    const db = mockDb();
    const mode = await handleAssessmentRoute(db, '/mode', req('/mode'), new URL('https://consulting.edge/api/assessment/mode'));
    expect(db.prepare).not.toHaveBeenCalled();
    expect(mode.data).toHaveProperty('mode', 'INTERNAL_ASSESSMENT');

    const sys = await handleAssessmentRoute(db, '/system-info', req('/system-info'), new URL('https://consulting.edge/api/assessment/system-info'));
    expect(db.prepare).toHaveBeenCalledWith('SELECT 1 AS ok');
    expect(sys.data).toHaveProperty('appVersion', '2.4.0');
  });

  it('fails closed when a database-backed assessment request has no authenticated tenant scope', async () => {
    const db = mockDb();
    const response = await handleAssessmentRouteImpl(
      db, '/customers', req('/customers'), new URL('https://consulting.edge/api/assessment/customers'), {}
    );
    expect(response.status).toBe(403);
    expect(response.data).toMatchObject({ success: false, message: ASSESSMENT_D1_MESSAGES.tenantScopeRequired });
  });

  it('isolates customer and assessment lists and details by the authenticated tenant', async () => {
    const fixture = createWorkerDatabase();
    fixture.db.prepare(`INSERT INTO CustomerRecord (customer_id, tenant_id, customer_name, industry)
      VALUES ('C-A', 'TENANT-A', 'Alpha', 'Manufacturing'), ('C-B', 'TENANT-B', 'Beta', 'Cement')`).run();
    fixture.db.prepare(`INSERT INTO AssessmentRecord (assessment_id, tenant_id, customer_id, customer_name, industry, assessment_owner)
      VALUES ('A-A', 'TENANT-A', 'C-A', 'Alpha', 'Manufacturing', 'analyst@example.test'),
        ('A-B', 'TENANT-B', 'C-B', 'Beta', 'Cement', 'analyst@example.test')`).run();
    const environment = { REQUEST_TENANT_ID: 'TENANT-A' };
    try {
      const customers = await handleAssessmentRoute(fixture.d1, '/customers', req('/customers'),
        new URL('https://consulting.edge/api/assessment/customers'), environment);
      const assessments = await handleAssessmentRoute(fixture.d1, '', req(''),
        new URL('https://consulting.edge/api/assessment'), environment);
      const customerDetail = await handleAssessmentRoute(fixture.d1, '/customers/C-A', req('/customers/C-A'),
        new URL('https://consulting.edge/api/assessment/customers/C-A'), environment);
      const foreignCustomer = await handleAssessmentRoute(fixture.d1, '/customers/C-B', req('/customers/C-B'),
        new URL('https://consulting.edge/api/assessment/customers/C-B'), environment);
      const foreignAssessment = await handleAssessmentRoute(fixture.d1, '/A-B', req('/A-B'),
        new URL('https://consulting.edge/api/assessment/A-B'), environment);

      expect((customers.data as Array<{ customerId: string }>).map((row) => row.customerId)).toEqual(['C-A']);
      expect((assessments.data as Array<{ assessmentId: string }>).map((row) => row.assessmentId)).toEqual(['A-A']);
      expect((customerDetail.data as { assessments: Array<{ assessmentId: string }> }).assessments)
        .toMatchObject([{ assessmentId: 'A-A' }]);
      expect(foreignCustomer.status).toBe(404);
      expect(foreignAssessment.status).toBe(404);
    } finally {
      fixture.close();
    }
  });

  it('loads list snapshots for all tenant customers with one scoped D1 query', async () => {
    const fixture = createWorkerDatabase();
    fixture.db.prepare(`INSERT INTO CustomerRecord (customer_id, tenant_id, customer_name, industry)
      VALUES ('C-A', 'TENANT-A', 'Alpha', 'Manufacturing'), ('C-C', 'TENANT-A', 'Gamma', 'Automotive')`).run();
    fixture.db.prepare(`INSERT INTO AssessmentStoreEntry (entry_type, assessment_id, entry_id, payload_json, source_checksum)
      VALUES ('customer', 'C-A', 'C-A', '{"customerId":"C-A","customMetadata":{"segment":"A"}}', 'sum-a'),
        ('customer', 'C-C', 'C-C', '{"customerId":"C-C","customMetadata":{"segment":"C"}}', 'sum-c'),
        ('customer', 'C-OTHER', 'C-OTHER', '{"customerId":"C-OTHER","customMetadata":{"segment":"other"}}', 'sum-other')`).run();
    const prepare = vi.spyOn(fixture.d1, 'prepare');
    try {
      const response = await handleAssessmentRoute(fixture.d1, '/customers', req('/customers'),
        new URL('https://consulting.edge/api/assessment/customers'), { REQUEST_TENANT_ID: 'TENANT-A' });
      const snapshotQueries = prepare.mock.calls.filter(([sql]) => sql.includes('AssessmentStoreEntry'));
      expect(snapshotQueries).toHaveLength(1);
      expect(snapshotQueries[0][0]).toContain('json_each(?)');
      expect(response.data).toMatchObject([
        { customerId: 'C-A', customMetadata: { segment: 'A' } },
        { customerId: 'C-C', customMetadata: { segment: 'C' } }
      ]);
      expect(response.data).not.toMatchObject([{ customerId: 'C-OTHER' }]);
    } finally {
      fixture.close();
    }
  });

  it('creates an unlinked customer and assessment together inside the assigned tenant', async () => {
    const fixture = createWorkerDatabase();
    const create = req('/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'New Client', industry: 'Manufacturing', assessmentPeriodStart: '2026-01-01', assessmentPeriodEnd: '2026-12-31' })
    });
    try {
      const response = await handleAssessmentRoute(fixture.d1, '/', create,
        new URL('https://consulting.edge/api/assessment'), { REQUEST_TENANT_ID: 'TENANT-A' });
      const data = response.data as { assessmentId: string; customerId: string; status: string; dataStatus: string };
      expect(response.status).toBe(201);
      expect(data).toMatchObject({ status: 'CREATED', dataStatus: 'NOT_RECEIVED' });
      expect(await fixture.d1.prepare('SELECT tenant_id FROM CustomerRecord WHERE customer_id = ?').bind(data.customerId).first())
        .toEqual({ tenant_id: 'TENANT-A' });
      expect(await fixture.d1.prepare('SELECT tenant_id FROM AssessmentRecord WHERE assessment_id = ?').bind(data.assessmentId).first())
        .toEqual({ tenant_id: 'TENANT-A' });
    } finally {
      fixture.close();
    }
  });

  it('rejects customer and assessment creation before either write when transactional batch is unavailable', async () => {
    const fixture = createWorkerDatabase();
    delete fixture.d1.batch;
    const create = req('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': 'assessment-create-no-batch' },
      body: JSON.stringify({
        customerName: 'New Client', industry: 'Manufacturing',
        assessmentPeriodStart: '2026-01-01', assessmentPeriodEnd: '2026-12-31'
      })
    });
    const logError = vi.spyOn(logger, 'error');
    try {
      await expect(handleAssessmentRoute(fixture.d1, '/', create, new URL(create.url)))
        .rejects.toMatchObject({ message: D1_ROUTE_MESSAGES.atomicBatchUnavailable });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM CustomerRecord WHERE customer_name = ?')
        .get('New Client')).toEqual({ count: 0 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentRecord WHERE customer_name = ?')
        .get('New Client')).toEqual({ count: 0 });
      expect(logError).toHaveBeenCalledWith(
        D1_LOG_MESSAGES.atomicBatchUnavailable,
        expect.objectContaining({
          operation: 'assessment.create',
          action: 'assessment.create',
          requestId: 'assessment-create-no-batch',
          tenantId: 'TNT-GLOBAL-8902',
          assessmentId: expect.any(String),
          statementCount: 2,
          fallback: 'none'
        }),
        expect.any(Error)
      );
      expect(logError).toHaveBeenCalledWith(
        'Failed to create tenant-scoped assessment',
        expect.objectContaining({ requestId: 'assessment-create-no-batch', tenantId: 'TNT-GLOBAL-8902' }),
        expect.any(Error)
      );
    } finally {
      logError.mockRestore();
      fixture.close();
    }
  });

  it('rolls the customer insert back when the assessment insert fails in the D1 batch', async () => {
    const fixture = createWorkerDatabase();
    fixture.db.exec(`
      CREATE TRIGGER reject_new_client_assessment
      BEFORE INSERT ON AssessmentRecord
      WHEN NEW.customer_name = 'New Client'
      BEGIN
        SELECT RAISE(ABORT, 'assessment insert failed');
      END;
    `);
    const create = req('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': 'assessment-create-batch-failure' },
      body: JSON.stringify({
        customerName: 'New Client', industry: 'Manufacturing',
        assessmentPeriodStart: '2026-01-01', assessmentPeriodEnd: '2026-12-31'
      })
    });
    const logError = vi.spyOn(logger, 'error');
    try {
      await expect(handleAssessmentRoute(fixture.d1, '/', create, new URL(create.url)))
        .rejects.toThrow('assessment insert failed');
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM CustomerRecord WHERE customer_name = ?')
        .get('New Client')).toEqual({ count: 0 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentRecord WHERE customer_name = ?')
        .get('New Client')).toEqual({ count: 0 });
      expect(logError).toHaveBeenCalledWith(
        D1_LOG_MESSAGES.atomicWriteFailed,
        expect.objectContaining({
          operation: 'assessment.create',
          action: 'assessment.create',
          requestId: 'assessment-create-batch-failure',
          tenantId: 'TNT-GLOBAL-8902',
          statementCount: 2
        }),
        expect.any(Error)
      );
    } finally {
      logError.mockRestore();
      fixture.close();
    }
  });

  it('keeps a single assessment insert available without batch support for an existing customer', async () => {
    const fixture = createWorkerDatabase();
    fixture.db.prepare(`INSERT INTO CustomerRecord (
      customer_id, tenant_id, customer_name, industry, status
    ) VALUES (?, ?, ?, ?, 'ACTIVE')`).run(
      'CUST-EXISTING', 'TNT-GLOBAL-8902', 'Existing Client', 'Manufacturing'
    );
    delete fixture.d1.batch;
    const create = req('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'CUST-EXISTING', customerName: 'Ignored Name', industry: 'Ignored Industry',
        assessmentPeriodStart: '2026-01-01', assessmentPeriodEnd: '2026-12-31'
      })
    });
    try {
      const response = await handleAssessmentRoute(fixture.d1, '/', create, new URL(create.url));
      expect(response.status).toBe(201);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM CustomerRecord WHERE customer_id = ?')
        .get('CUST-EXISTING')).toEqual({ count: 1 });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentRecord WHERE customer_id = ?')
        .get('CUST-EXISTING')).toEqual({ count: 1 });
    } finally {
      fixture.close();
    }
  });

  it('handles /customers listing and creation with generated and explicit customerId', async () => {
    const sampleCustomer = { customer_id: 'CUST-001', customer_name: 'Acme Corp', status: 'ACTIVE' };
    const db = mockDb({ customers: [sampleCustomer] });

    const listRes = await handleAssessmentRoute(db, '/customers', req('/customers'), new URL('https://consulting.edge/api/assessment/customers'));
    expect(listRes.data).toEqual([{ customerId: 'CUST-001', customerName: 'Acme Corp', status: 'ACTIVE' }]);

    // POST without customerId
    const postReq = req('/customers', {
      method: 'POST',
      body: JSON.stringify({ customerName: 'New Corp', industry: 'Textile' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const createRes = await handleAssessmentRoute(db, '/customers', postReq, new URL('https://consulting.edge/api/assessment/customers'));
    expect(createRes.status).toBe(201);

    // POST with explicit customerId and all optional fields
    const postReq2 = req('/customers/', {
      method: 'POST',
      body: JSON.stringify({
        customerId: 'CUST-EXPLICIT-1',
        customerName: 'Explicit Corp',
        industry: 'Chemical',
        businessUnit: 'Specialty BU',
        region: 'EU',
        baseCurrency: 'EUR',
        companyWebsite: 'https://explicit.com',
        contactEmail: 'corp@explicit.com',
        contactPerson: 'Alice',
        status: 'ONBOARDING',
        notes: 'Priority onboarding'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const createRes2 = await handleAssessmentRoute(db, '/customers/', postReq2, new URL('https://consulting.edge/api/assessment/customers/'));
    expect(createRes2.status).toBe(201);
  });

  it('handles /customers/:id get, patch, put, and not found', async () => {
    const sampleCustomer = { customer_id: 'CUST-001', customer_name: 'Acme Corp' };
    const db = mockDb({ customers: [sampleCustomer] });

    const getRes = await handleAssessmentRoute(db, '/customers/CUST-001', req('/customers/CUST-001'), new URL('https://consulting.edge/api/assessment/customers/CUST-001'));
    expect(getRes.data).toEqual({ customer: { customerId: 'CUST-001', customerName: 'Acme Corp' }, assessments: [] });

    const patchReq = req('/customers/CUST-001', {
      method: 'PATCH',
      body: JSON.stringify({ customerName: 'Updated Corp' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const patchRes = await handleAssessmentRoute(db, '/customers/CUST-001', patchReq, new URL('https://consulting.edge/api/assessment/customers/CUST-001'));
    expect(patchRes.data).toBeDefined();

    const putReq = req('/customers/CUST-001', {
      method: 'PUT',
      body: JSON.stringify({ customerName: 'Put Corp' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const putRes = await handleAssessmentRoute(db, '/customers/CUST-001', putReq, new URL('https://consulting.edge/api/assessment/customers/CUST-001'));
    expect(putRes.data).toBeDefined();

    const emptyDb = mockDb({ customers: [] });
    const notFound = await handleAssessmentRoute(emptyDb, '/customers/CUST-999', req('/customers/CUST-999'), new URL('https://consulting.edge/api/assessment/customers/CUST-999'));
    expect(notFound.status).toBe(404);
  });

  it('handles assessment collection list and creation with generated and explicit assessmentId', async () => {
    const sampleAssessment = { assessment_id: 'AIC-2026-0001', customer_name: 'Acme' };
    const db = mockDb({
      assessments: [sampleAssessment],
      customers: [
        { customer_id: 'CUST-002', customer_name: 'New Client', industry: 'Manufacturing', status: 'ACTIVE' },
        { customer_id: 'CUST-003', customer_name: 'Full Client', industry: 'Automotive', status: 'ACTIVE' }
      ]
    });

    const listRes = await handleAssessmentRoute(db, '', req(''), new URL('https://consulting.edge/api/assessment'));
    expect(listRes.data).toEqual([{ assessmentId: 'AIC-2026-0001', customerName: 'Acme' }]);

    const listRes2 = await handleAssessmentRoute(db, '/list', req('/list'), new URL('https://consulting.edge/api/assessment/list'));
    expect(listRes2.data).toEqual([{ assessmentId: 'AIC-2026-0001', customerName: 'Acme' }]);

    // Create with generated id
    const createReq = req('/', {
      method: 'POST',
      body: JSON.stringify({ customerName: 'New Client', industry: 'Manufacturing', customerId: 'CUST-002', assessmentPeriodStart: '2026-01-01', assessmentPeriodEnd: '2026-12-31' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const createRes = await handleAssessmentRoute(db, '/', createReq, new URL('https://consulting.edge/api/assessment'));
    expect(createRes.status).toBe(201);

    // Create with explicit assessmentId and full details
    const createReq2 = req('/', {
      method: 'POST',
      body: JSON.stringify({
        assessmentId: 'AIC-2026-EXPLICIT',
        customerName: 'Full Client',
        customerId: 'CUST-003',
        industry: 'Automotive',
        businessUnit: 'Plant BU',
        companyWebsite: 'https://auto.com',
        assessmentOwner: 'lead@procucev.com',
        currency: 'USD',
        assessmentPeriodStart: '2024-01-01',
        assessmentPeriodEnd: '2024-12-31',
        assignedAnalyst: 'analyst@procucev.com',
        notes: 'Full evaluation'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const createRes2 = await handleAssessmentRoute(db, '/', createReq2, new URL('https://consulting.edge/api/assessment'));
    expect(createRes2.status).toBe(201);
  });

  it('handles /:id actions: nda, data-status, audit, and detail', async () => {
    const sampleAssessment = { assessment_id: 'AIC-2026-0001', customer_name: 'Acme' };
    const db = mockDb({
      assessments: [sampleAssessment],
      versions: [{ data_version_id: 'DV-1' }],
      runs: [{ analysis_run_id: 'RUN-1' }],
      auditLogs: [{ id: 'LOG-1' }]
    });

    // nda with explicit status
    const ndaReq = req('/AIC-2026-0001/nda', {
      method: 'PATCH',
      body: JSON.stringify({ ndaStatus: 'SIGNED' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const ndaRes = await handleAssessmentRoute(db, '/AIC-2026-0001/nda', ndaReq, new URL('https://consulting.edge/api/assessment/AIC-2026-0001/nda'));
    expect(ndaRes.data).toBeDefined();

    // nda with POST and default status
    const ndaReq2 = req('/AIC-2026-0001/nda', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    });
    const ndaRes2 = await handleAssessmentRoute(db, '/AIC-2026-0001/nda', ndaReq2, new URL('https://consulting.edge/api/assessment/AIC-2026-0001/nda'));
    expect(ndaRes2.data).toBeDefined();

    // data-status with explicit status
    const dataStatusReq = req('/AIC-2026-0001/data-status', {
      method: 'PATCH',
      body: JSON.stringify({ dataStatus: 'VALIDATED' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const dsRes = await handleAssessmentRoute(db, '/AIC-2026-0001/data-status', dataStatusReq, new URL('https://consulting.edge/api/assessment/AIC-2026-0001/data-status'));
    expect(dsRes.data).toBeDefined();

    // data-status with POST and default status
    const dataStatusReq2 = req('/AIC-2026-0001/data-status', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    });
    const dsRes2 = await handleAssessmentRoute(db, '/AIC-2026-0001/data-status', dataStatusReq2, new URL('https://consulting.edge/api/assessment/AIC-2026-0001/data-status'));
    expect(dsRes2.data).toBeDefined();

    const auditRes = await handleAssessmentRoute(db, '/AIC-2026-0001/audit', req('/AIC-2026-0001/audit'), new URL('https://consulting.edge/api/assessment/AIC-2026-0001/audit'));
    expect(auditRes.data).toHaveLength(1);

    const detailRes = await handleAssessmentRoute(db, '/AIC-2026-0001', req('/AIC-2026-0001'), new URL('https://consulting.edge/api/assessment/AIC-2026-0001'));
    expect((detailRes.data as any).assessment).toBeDefined();
    expect((detailRes.data as any).versions).toHaveLength(1);

    const emptyDb = mockDb({ assessments: [] });
    const notFound = await handleAssessmentRoute(emptyDb, '/AIC-2026-9999', req('/AIC-2026-9999'), new URL('https://consulting.edge/api/assessment/AIC-2026-9999'));
    expect(notFound.status).toBe(404);
  });

  it('reads and persists evidence-backed review gates in D1 with role and schema validation', async () => {
    const fixture = createWorkerDatabase();
    fixture.db.prepare(`INSERT INTO AssessmentRecord (
      assessment_id, customer_id, customer_name, industry, assessment_owner, status
    ) VALUES (?, ?, ?, ?, ?, ?)`).run('A-GATES', 'C-GATES', 'Gate Demo', 'Manufacturing', 'analyst@example.test', 'ANALYST_REVIEW');
    fixture.db.prepare(`INSERT INTO User (
      id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'review-admin', 'Review Admin', '+10000000000', 'review-admin@example.test', 'Internal', 'Address',
      'unused', 'ADMIN', 'ACTIVE', 'GOLD'
    );
    fixture.db.prepare(`INSERT INTO User (
      id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, tenant_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'review-user', 'Review User', '+10000000001', 'review-user@example.test', 'Customer', 'Address',
      'unused', 'USER', 'ACTIVE', 'BRONZE', 'TNT-GLOBAL-8902'
    );
    const adminToken = await createWorkerAuthToken({
      id: 'review-admin', email: 'review-admin@example.test', role: 'ADMIN'
    }, WORKER_CORE_SECRET);
    const userToken = await createWorkerAuthToken({
      id: 'review-user', email: 'review-user@example.test', role: 'USER'
    }, WORKER_CORE_SECRET);
    const environment = runtimeEnvironment({ DB: fixture.d1 });
    const url = new URL('https://consulting.edge/api/assessment/A-GATES/review-gates');
    try {
      const getRequest = new Request(url, { method: 'GET' });
      const initial = await handleAssessmentRoute(fixture.d1, '/A-GATES/review-gates', getRequest, url);
      expect(initial.data).toHaveLength(26);
      expect((initial.data as Array<{ status: string }>).every((gate) => gate.status === 'PENDING')).toBe(true);

      const updateRequest = new Request(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: ['Bearer', adminToken].join(' '),
          'x-user-role': 'ANALYST',
          'x-user-email': 'spoofed@example.test'
        },
        body: JSON.stringify({
          gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PASSED',
          evidenceReference: 'D1:AssessmentDataVersion/DV-1', reviewNote: 'Rows reconciled'
        })
      });
      const updated = await handleAssessmentRoute(fixture.d1, '/A-GATES/review-gates', updateRequest, url, environment);
      expect((updated.data as Array<{ gateKey: string; status: string; reviewedBy: string | null }>)
        .find((gate) => gate.gateKey === 'M1_INPUT_ROW_RECONCILIATION'))
        .toMatchObject({ status: 'PASSED', reviewedBy: 'review-admin@example.test' });
      expect(fixture.db.prepare('SELECT actor_email, actor_role FROM AssessmentAuditLog').get())
        .toEqual({ actor_email: 'review-admin@example.test', actor_role: 'ADMIN' });

      const blockedRequest = new Request(url, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', adminToken].join(' ') },
        body: JSON.stringify({ gateKey: 'M1_CURRENCY_NORMALIZATION', status: 'BLOCKED', reviewNote: 'FX evidence is incomplete' })
      });
      const blocked = await handleAssessmentRoute(fixture.d1, '/A-GATES/review-gates', blockedRequest, url, environment);
      expect((blocked.data as Array<{ gateKey: string; status: string; reviewedBy: string | null }>)
        .find((gate) => gate.gateKey === 'M1_CURRENCY_NORMALIZATION'))
        .toMatchObject({ status: 'BLOCKED', reviewedBy: 'review-admin@example.test' });

      const resetRequest = new Request(url, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', adminToken].join(' ') },
        body: JSON.stringify({ gateKey: 'M1_CURRENCY_NORMALIZATION', status: 'PENDING' })
      });
      const reset = await handleAssessmentRoute(fixture.d1, '/A-GATES/review-gates', resetRequest, url, environment);
      expect((reset.data as Array<{ gateKey: string; status: string; reviewedBy: string | null }>)
        .find((gate) => gate.gateKey === 'M1_CURRENCY_NORMALIZATION'))
        .toMatchObject({ status: 'PENDING', reviewedBy: null });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentAuditLog').get().count).toBe(3);

      const invalidRequest = new Request(url, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', adminToken].join(' ') },
        body: JSON.stringify({ gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PASSED' })
      });
      expect((await handleAssessmentRoute(fixture.d1, '/A-GATES/review-gates', invalidRequest, url, environment)).status).toBe(400);

      const forbiddenRequest = new Request(url, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: ['Bearer', userToken].join(' ') },
        body: JSON.stringify({ gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PENDING' })
      });
      expect((await handleAssessmentRoute(fixture.d1, '/A-GATES/review-gates', forbiddenRequest, url, environment)).status).toBe(403);
      const anonymousRequest = new Request(url, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-role': 'INTERNAL_ADMIN' },
        body: JSON.stringify({ gateKey: 'M1_INPUT_ROW_RECONCILIATION', status: 'PENDING' })
      });
      expect((await handleAssessmentRoute(fixture.d1, '/A-GATES/review-gates', anonymousRequest, url, environment)).status)
        .toBe(401);

      const missingRequest = new Request('https://consulting.edge/api/assessment/UNKNOWN/review-gates', { method: 'GET' });
      expect((await handleAssessmentRoute(fixture.d1, '/UNKNOWN/review-gates', missingRequest, new URL(missingRequest.url))).status).toBe(404);
    } finally {
      fixture.close();
    }
  });
});
