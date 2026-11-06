import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorkerDatabase } from '../helpers/workerCoreFixtures';
import type { CloudflareD1Database, CloudflareEnvironment, CloudflareR2Bucket } from '../../src/types/cloudflare';
import {
  uploadAssessmentDataVersion as uploadAssessmentDataVersionRaw,
  validateAssessmentDataVersion as validateAssessmentDataVersionRaw
} from '../../src/services/assessmentDataVersionD1';
import { ASSESSMENT_DATA_VERSION_MAX_BYTES } from '../../src/constants/assessmentValidation';
import * as XLSX from 'xlsx';
import logger from '../../src/utils/logger';
import { readAssessmentSnapshot } from '../../src/services/assessmentDataVersionD1Helpers';
import { ASSESSMENT_D1_LOG_MESSAGES } from '../../src/constants/assessmentD1';

const WORKBOOK_CSV = [
  'PO Number,Supplier Name,Description,Quantity,Net Price,Currency,Transaction Date',
  'PO-1,Acme Supplies,Packaging,2,500,INR,2025-01-02',
  'PO-2,Northwind,Raw material,3,10,,2025-02-02',
  'PO-3,,Service,1,25,INR,2025-03-02'
].join('\n');

const toBytes = (value = WORKBOOK_CSV): Uint8Array => new TextEncoder().encode(value);
const toBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64');
const TEST_TENANT_ID = 'TNT-UPLOAD-1';
const sha256 = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
};

const makeDatabase = () => {
  const fixture = createWorkerDatabase();
  fixture.db.prepare(`INSERT INTO AssessmentRecord (
    assessment_id, tenant_id, customer_id, customer_name, industry, assessment_owner, data_status, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'AIC-UPLOAD-1', TEST_TENANT_ID, 'CUST-UPLOAD-1', 'Upload Client', 'Manufacturing',
    'analyst@example.test', 'NOT_RECEIVED', 'CREATED'
  );
  return fixture;
};

const withTenant = <T extends { environment: CloudflareEnvironment }>(context: T): T => ({
  ...context,
  environment: { REQUEST_TENANT_ID: TEST_TENANT_ID, ...context.environment }
});

const uploadAssessmentDataVersion = (
  context: Parameters<typeof uploadAssessmentDataVersionRaw>[0]
) => uploadAssessmentDataVersionRaw(withTenant(context));

const validateAssessmentDataVersion = (
  context: Parameters<typeof validateAssessmentDataVersionRaw>[0]
) => validateAssessmentDataVersionRaw(withTenant(context));

const makeBucket = (deleteOverride?: CloudflareR2Bucket['delete']) => {
  const objects = new Map<string, Uint8Array>();
  const bucket: CloudflareR2Bucket = {
    put: vi.fn(async (key, value) => {
      objects.set(key, value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer));
    }),
    get: vi.fn(async () => null),
    delete: deleteOverride || vi.fn(async (key) => { objects.delete(key); })
  };
  return { bucket, objects };
};

const makeBody = async (fileName = 'transactions.csv', bytes = toBytes()) => ({
  fileName,
  fileSize: bytes.byteLength,
  checksum: await sha256(bytes),
  fileBase64: toBase64(bytes),
  runAnalysisImmediately: false
});

const dataOf = (result: { data: unknown }): Record<string, any> => result.data as Record<string, any>;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('assessment data version D1 lifecycle', () => {
  it('imports a version and all source rows into D1 and stores the original in R2', async () => {
    const fixture = makeDatabase();
    const { bucket, objects } = makeBucket();
    try {
      fixture.db.prepare(`INSERT INTO AssessmentStoreEntry (entry_type, assessment_id, entry_id, payload_json, source_checksum)
        VALUES ('assessment', 'AIC-UPLOAD-1', 'AIC-UPLOAD-1', '{', 'corrupt')`).run();
      const baseBody = await makeBody();
      const body = { ...baseBody, expectedChecksum: baseBody.checksum };
      const result = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket, R2_BUCKET: 'assessment-files' },
        assessmentId: 'AIC-UPLOAD-1', body, requestId: 'request-upload'
      });
      const resultData = dataOf(result);
      expect(result.status).toBe(201);
      expect(resultData).toMatchObject({ success: true, importedCount: 3, validationCount: 3 });
      expect(resultData.dataVersion).toMatchObject({
        assessmentId: 'AIC-UPLOAD-1', versionNumber: 1, fileName: 'transactions.csv', recordCount: 3,
        isSuperseded: false
      });
      expect(resultData.assessment).toMatchObject({
        dataStatus: 'RECEIVED', currentDataVersionId: resultData.dataVersion.dataVersionId
      });
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction WHERE assessment_id = ?')
        .get('AIC-UPLOAD-1').count).toBe(3);
      expect(fixture.db.prepare('SELECT DISTINCT tenant_id FROM ProcurementTransaction WHERE assessment_id = ?')
        .all('AIC-UPLOAD-1')).toEqual([{ tenant_id: TEST_TENANT_ID }]);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ValidationPreCheckRecord WHERE record_id LIKE ?')
        .get(`REC-${resultData.dataVersion.dataVersionId}-ROW-%`).count).toBe(3);
      expect(fixture.db.prepare('SELECT DISTINCT tenant_id FROM ValidationPreCheckRecord WHERE record_id LIKE ?')
        .all(`REC-${resultData.dataVersion.dataVersionId}-ROW-%`)).toEqual([{ tenant_id: TEST_TENANT_ID }]);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ObjectMetadata WHERE assessment_id = ?')
        .get('AIC-UPLOAD-1').count).toBe(1);
      expect(fixture.db.prepare('SELECT tenant_id FROM ObjectMetadata WHERE assessment_id = ?')
        .get('AIC-UPLOAD-1')).toEqual({ tenant_id: TEST_TENANT_ID });
      expect(objects.size).toBe(1);
      expect(Array.from(objects.values())[0]).toEqual(toBytes());
    } finally {
      fixture.close();
    }
  });

  it('rejects uploads and validation reads when the assigned tenant does not own the assessment', async () => {
    const fixture = makeDatabase();
    const { bucket, objects } = makeBucket();
    try {
      const body = await makeBody();
      const unauthorizedUpload = await uploadAssessmentDataVersionRaw({
        db: fixture.d1,
        environment: { OBJECTS: bucket, REQUEST_TENANT_ID: 'TNT-OTHER' },
        assessmentId: 'AIC-UPLOAD-1', body
      });
      expect(unauthorizedUpload).toMatchObject({
        status: 404, data: { success: false }
      });
      expect(objects.size).toBe(0);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction').get().count).toBe(0);

      const unauthorizedValidation = await validateAssessmentDataVersionRaw({
        db: fixture.d1,
        environment: { REQUEST_TENANT_ID: 'TNT-OTHER' },
        assessmentId: 'AIC-UPLOAD-1', body: {}
      });
      expect(unauthorizedValidation).toMatchObject({
        status: 404, data: { success: false }
      });
      expect(fixture.db.prepare('SELECT data_status FROM AssessmentRecord WHERE assessment_id = ?')
        .get('AIC-UPLOAD-1')).toEqual({ data_status: 'NOT_RECEIVED' });
    } finally {
      fixture.close();
    }
  });

  it('keeps another tenant data intact when a failed upload collides on its generated source ID', async () => {
    const fixture = makeDatabase();
    const { bucket, objects } = makeBucket();
    const dataVersionId = 'DV-fixed-upload-version';
    const sourceRowId = `OTHER-${dataVersionId}`;
    const validationRecordId = `REC-${dataVersionId}-ROW-2`;
    fixture.db.prepare(`INSERT INTO ProcurementTransaction (
      transaction_id, tenant_id, assessment_id, source_document_id, source_row_number,
      supplier_name, currency, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      sourceRowId, 'TNT-OTHER', 'AIC-OTHER', dataVersionId, 2, 'Other Supplier', 'INR', '{}'
    );
    fixture.db.prepare(`INSERT INTO ValidationPreCheckRecord (
      record_id, tenant_id, po_number, vendor_name, raw_desc
    ) VALUES (?, ?, ?, ?, ?)`).run(
      validationRecordId, 'TNT-OTHER', 'PO-OTHER', 'Other Supplier', 'Other tenant data'
    );
    const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('fixed-upload-version');

    try {
      await expect(uploadAssessmentDataVersion({
        db: fixture.d1,
        environment: { OBJECTS: bucket },
        assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody()
      })).rejects.toThrow();

      expect(fixture.db.prepare('SELECT tenant_id, assessment_id FROM ProcurementTransaction WHERE transaction_id = ?')
        .get(sourceRowId)).toEqual({ tenant_id: 'TNT-OTHER', assessment_id: 'AIC-OTHER' });
      expect(fixture.db.prepare('SELECT tenant_id, raw_desc FROM ValidationPreCheckRecord WHERE record_id = ?')
        .get(validationRecordId)).toEqual({ tenant_id: 'TNT-OTHER', raw_desc: 'Other tenant data' });
      expect(objects.size).toBe(0);
    } finally {
      uuidSpy.mockRestore();
      fixture.close();
    }
  });

  it('supersedes the prior active version and adds a version snapshot on a replacement upload', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const environment: CloudflareEnvironment = { OBJECTS: bucket };
      const first = await uploadAssessmentDataVersion({
        db: fixture.d1, environment, assessmentId: 'AIC-UPLOAD-1', body: await makeBody()
      });
      const firstId = dataOf(first).dataVersion.dataVersionId;
      const replacement = await uploadAssessmentDataVersion({
        db: fixture.d1, environment, assessmentId: 'AIC-UPLOAD-1', body: await makeBody('replacement.csv')
      });
      const replacementId = dataOf(replacement).dataVersion.dataVersionId;
      const versions = fixture.db.prepare('SELECT data_version_id, version_number, is_superseded FROM AssessmentDataVersion ORDER BY version_number').all();
      expect(versions).toEqual([
        { data_version_id: firstId, version_number: 1, is_superseded: 1 },
        { data_version_id: replacementId, version_number: 2, is_superseded: 0 }
      ]);
      expect(fixture.db.prepare("SELECT entry_id FROM AssessmentStoreEntry WHERE entry_type = 'version' ORDER BY entry_id").all())
        .toHaveLength(2);
    } finally {
      fixture.close();
    }
  });

  it('accepts legacy XLS workbooks and stores them with the Excel binary content type', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([
        ['PO Number', 'Supplier Name', 'Description', 'Quantity', 'Net Price', 'Currency'],
        ['PO-XLS', 'Acme', 'Parts', 1, 10, 'INR']
      ]);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Transactions');
      const bytes = new Uint8Array(XLSX.write(workbook, { bookType: 'biff8', type: 'array' }));
      const result = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody('transactions.xls', bytes)
      });
      expect(result.status).toBe(201);
      expect(bucket.put).toHaveBeenCalledWith(expect.any(String), bytes, {
        httpMetadata: { contentType: 'application/vnd.ms-excel' }
      });
      expect(dataOf(result).importedCount).toBe(1);
    } finally {
      fixture.close();
    }
  });

  it('sanitizes path separators and control characters in the R2 object key', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const fileName = 'folder/name\u0000\\transactions.csv';
      const result = await uploadAssessmentDataVersion({
        db: fixture.d1,
        environment: { OBJECTS: bucket },
        assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody(fileName)
      });
      expect(result.status).toBe(201);
      const objectKey = vi.mocked(bucket.put).mock.calls[0][0];
      expect(objectKey).toContain('/folder_name__transactions.csv');
    } finally {
      fixture.close();
    }
  });

  it('validates persisted version rows and reports valid, excluded, anomaly, and clean-yield counts', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const upload = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1', body: await makeBody()
      });
      const dataVersionId = dataOf(upload).dataVersion.dataVersionId as string;
      fixture.db.prepare("UPDATE AssessmentDataVersion SET checksum = '' WHERE data_version_id = ?")
        .run(dataVersionId);
      fixture.db.prepare(`INSERT INTO ValidationPreCheckRecord (
        record_id, tenant_id, po_number, vendor_name, raw_desc, issue_flag, action_status, resolved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(`REC-${dataVersionId}-ROW-9`, TEST_TENANT_ID, 'PO-X', 'Supplier X', 'Excluded row', 'Excluded by user', 'Excluded', 1);
      fixture.db.prepare(`INSERT INTO ValidationPreCheckRecord (
        record_id, tenant_id, po_number, vendor_name, raw_desc, issue_flag, action_status, resolved
      ) VALUES (?, ?, ?, ?, ?, '', '', 0)`)
        .run(`REC-${dataVersionId}-ROW-10`, TEST_TENANT_ID, 'PO-Y', 'Supplier Y', 'Unclassified row');
      const validation = await validateAssessmentDataVersion({
        db: fixture.d1, environment: {}, assessmentId: 'AIC-UPLOAD-1', body: { dataVersionId }
      });
      expect(dataOf(validation).validationSummary).toEqual({
        sourceRowCount: 5, validRowCount: 1, excludedRowCount: 1, anomalyRowCount: 3, cleanSpendYieldPct: 20
      });
      expect(dataOf(validation).assessment.dataStatus).toBe('VALIDATED');
      expect(dataOf(validation).dataVersion.dataVersionId).toBe(dataVersionId);
    } finally {
      fixture.close();
    }
  });

  it('validates the latest active version when no identifier is supplied', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const upload = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1', body: await makeBody()
      });
      fixture.db.prepare('UPDATE AssessmentRecord SET data_status = NULL WHERE assessment_id = ?').run('AIC-UPLOAD-1');
      const validation = await validateAssessmentDataVersion({
        db: fixture.d1, environment: {}, assessmentId: 'AIC-UPLOAD-1', body: undefined
      });
      expect(dataOf(validation).dataVersion.dataVersionId).toBe(dataOf(upload).dataVersion.dataVersionId);
      expect(dataOf(validation).validationSummary.sourceRowCount).toBe(3);
    } finally {
      fixture.close();
    }
  });

  it('returns a clarification state for a valid uploaded version with no parsed source rows', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const upload = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody('empty.csv', toBytes('PO Number,Supplier Name,Description'))
      });
      const validation = await validateAssessmentDataVersion({
        db: fixture.d1, environment: {}, assessmentId: 'AIC-UPLOAD-1',
        body: { dataVersionId: dataOf(upload).dataVersion.dataVersionId }
      });
      expect(dataOf(validation).validationSummary).toEqual({
        sourceRowCount: 0, validRowCount: 0, excludedRowCount: 0, anomalyRowCount: 0, cleanSpendYieldPct: 0
      });
      expect(dataOf(validation).assessment.dataStatus).toBe('REQUIRES_CLARIFICATION');
    } finally {
      fixture.close();
    }
  });

  it('returns useful validation failures before storing an upload', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const validBody = await makeBody();
      const missingFile = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: { ...validBody, fileBase64: undefined }
      });
      const invalidBody = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1', body: { fileName: '' }
      });
      const invalidBase64 = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: { ...validBody, fileBase64: 'not_base64!' }
      });
      const wrongSize = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: { ...validBody, fileSize: validBody.fileSize + 1 }
      });
      const wrongChecksum = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: { ...validBody, checksum: '0'.repeat(64) }
      });
      const wrongExpected = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: { ...validBody, expectedChecksum: 'f'.repeat(64) }
      });
      const unsupported = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody('transactions.json')
      });
      const tooLarge = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: { ...validBody, fileSize: ASSESSMENT_DATA_VERSION_MAX_BYTES + 1 }
      });
      expect([missingFile, invalidBody, invalidBase64, wrongSize, wrongChecksum, wrongExpected, unsupported, tooLarge]
        .map((result) => result.status)).toEqual([400, 400, 400, 400, 400, 400, 400, 400]);
      expect(bucket.put).not.toHaveBeenCalled();
    } finally {
      fixture.close();
    }
  });

  it('requires D1, R2, an existing assessment, and a valid assessment file name', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const body = await makeBody();
      const noObjects = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { REQUEST_TENANT_ID: TEST_TENANT_ID }, assessmentId: 'AIC-UPLOAD-1', body
      });
      const noTenant = await uploadAssessmentDataVersionRaw({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1', body
      });
      const noAssessment = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'UNKNOWN', body
      });
      const malformed = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody('file.csv.exe')
      });
      const invalidAssessment = await validateAssessmentDataVersion({
        db: fixture.d1, environment: {}, assessmentId: 'UNKNOWN', body: {}
      });
      const noTenantValidation = await validateAssessmentDataVersionRaw({
        db: fixture.d1, environment: {}, assessmentId: 'AIC-UPLOAD-1', body: {}
      });
      const invalidVersionId = await validateAssessmentDataVersion({
        db: fixture.d1, environment: {}, assessmentId: 'AIC-UPLOAD-1', body: { dataVersionId: '' }
      });
      const missingVersion = await validateAssessmentDataVersion({
        db: fixture.d1, environment: {}, assessmentId: 'AIC-UPLOAD-1', body: {}
      });
      expect([noObjects, noTenant, noAssessment, malformed, invalidAssessment, noTenantValidation, invalidVersionId, missingVersion]
        .map((result) => result.status)).toEqual([503, 403, 404, 400, 404, 403, 400, 404]);
    } finally {
      fixture.close();
    }
  });

  it('rolls back the R2 object when a correctly checksummed but malformed workbook is rejected', async () => {
    const fixture = makeDatabase();
    const { bucket, objects } = makeBucket();
    try {
      const result = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody('broken.xlsx', toBytes('not an xlsx workbook'))
      });
      expect(result.status).toBe(400);
      expect(objects.size).toBe(0);
      expect(bucket.delete).toHaveBeenCalledTimes(1);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentDataVersion').get().count).toBe(0);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction').get().count).toBe(0);
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentStoreEntry').get().count).toBe(0);
    } finally {
      fixture.close();
    }
  });

  it('keeps the request recoverable if R2 cleanup also fails after a corrupt workbook', async () => {
    const fixture = makeDatabase();
    const failedDelete = vi.fn(async () => { throw new Error('R2 unavailable'); });
    const { bucket } = makeBucket(failedDelete);
    try {
      const result = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1',
        body: await makeBody('broken.xlsx', toBytes('still not a workbook'))
      });
      expect(result.status).toBe(400);
      expect(failedDelete).toHaveBeenCalledOnce();
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentDataVersion').get().count).toBe(0);
    } finally {
      fixture.close();
    }
  });

  it('logs rollback failures and preserves the original D1 persistence error', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    const database = {
      prepare: (sql: string) => {
        const statement = fixture.d1.prepare(sql);
        return {
          bind: (...values: unknown[]) => {
            const bound = statement.bind(...values);
            if (sql.includes('INSERT INTO ProcurementTransaction')) {
              return { ...bound, run: vi.fn(async () => { throw new Error('D1 persistence unavailable'); }) };
            }
            if (sql.startsWith('DELETE FROM ProcurementTransaction')) {
              return { ...bound, run: vi.fn(async () => { throw new Error('D1 cleanup unavailable'); }) };
            }
            return bound;
          }
        };
      }
    } as unknown as CloudflareD1Database;
    try {
      await expect(uploadAssessmentDataVersion({
        db: database, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1', body: await makeBody()
      })).rejects.toThrow('D1 persistence unavailable');
      expect(bucket.delete).toHaveBeenCalledOnce();
      expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM AssessmentDataVersion').get().count).toBe(0);
    } finally {
      fixture.close();
    }
  });

  it('returns a validation error if the Base64 runtime decoder rejects an otherwise well-shaped value', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    try {
      const body = await makeBody();
      vi.stubGlobal('atob', () => { throw new Error('decoder rejected input'); });
      const result = await uploadAssessmentDataVersion({
        db: fixture.d1, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1', body
      });
      expect(result.status).toBe(400);
      expect(bucket.put).not.toHaveBeenCalled();
    } finally {
      fixture.close();
    }
  });

  it('cleans up an invalid stored assessment snapshot and can use D1 batch for writes', async () => {
    const fixture = makeDatabase();
    const { bucket } = makeBucket();
    const batched = {
      ...fixture.d1,
      batch: vi.fn(async (statements) => Promise.all(statements.map((statement) => statement.run())))
    } as CloudflareD1Database;
    try {
      fixture.db.prepare(`INSERT INTO AssessmentStoreEntry (entry_type, assessment_id, entry_id, payload_json, source_checksum)
        VALUES ('assessment', 'AIC-UPLOAD-1', 'AIC-UPLOAD-1', '[]', 'old')`).run();
      const result = await uploadAssessmentDataVersion({
        db: batched, environment: { OBJECTS: bucket }, assessmentId: 'AIC-UPLOAD-1', body: await makeBody()
      });
      expect(result.status).toBe(201);
      expect(batched.batch).toHaveBeenCalled();
      const snapshot = JSON.parse(fixture.db.prepare("SELECT payload_json FROM AssessmentStoreEntry WHERE entry_type = 'assessment'").get().payload_json as string);
      expect(snapshot.currentDataVersionId).toBe(dataOf(result).dataVersion.dataVersionId);
    } finally {
      fixture.close();
    }
  });
});

describe('assessment D1 snapshot reads', () => {
  it('logs malformed stored JSON with request context and keeps the empty-object fallback', async () => {
    const fixture = makeDatabase();
    const warning = vi.spyOn(logger, 'warn').mockImplementation(() => logger.formatEntry('warn', ''));
    fixture.db.prepare(`INSERT INTO AssessmentStoreEntry (
      entry_type, assessment_id, entry_id, payload_json, source_checksum
    ) VALUES (?, ?, ?, ?, ?)`).run('assessment', 'AIC-UPLOAD-1', 'AIC-UPLOAD-1', '{private snapshot', 'checksum');
    try {
      await expect(readAssessmentSnapshot(fixture.d1, 'assessment', 'AIC-UPLOAD-1', 'AIC-UPLOAD-1', {
        requestId: 'req-snapshot-invalid', tenantId: TEST_TENANT_ID
      })).resolves.toEqual({});
      expect(warning).toHaveBeenCalledWith(
        ASSESSMENT_D1_LOG_MESSAGES.invalidSnapshotFallback,
        expect.objectContaining({
          action: 'assessment.snapshot.read', assessmentId: 'AIC-UPLOAD-1', entryType: 'assessment',
          entryId: 'AIC-UPLOAD-1', tenantId: TEST_TENANT_ID, requestId: 'req-snapshot-invalid',
          fallback: 'empty-snapshot-object'
        }),
        expect.any(SyntaxError)
      );
      expect(JSON.stringify(warning.mock.calls)).not.toContain('private snapshot');
    } finally {
      fixture.close();
    }
  });

  it('logs valid JSON with an invalid snapshot shape and keeps the empty-object fallback', async () => {
    const fixture = makeDatabase();
    const warning = vi.spyOn(logger, 'warn').mockImplementation(() => logger.formatEntry('warn', ''));
    fixture.db.prepare(`INSERT INTO AssessmentStoreEntry (
      entry_type, assessment_id, entry_id, payload_json, source_checksum
    ) VALUES (?, ?, ?, ?, ?)`).run('assessment', 'AIC-UPLOAD-1', 'AIC-UPLOAD-1', '["private snapshot"]', 'checksum');
    try {
      await expect(readAssessmentSnapshot(fixture.d1, 'assessment', 'AIC-UPLOAD-1')).resolves.toEqual({});
      expect(warning).toHaveBeenCalledWith(
        ASSESSMENT_D1_LOG_MESSAGES.invalidSnapshotFallback,
        expect.objectContaining({
          action: 'assessment.snapshot.read', assessmentId: 'AIC-UPLOAD-1', entryType: 'assessment',
          entryId: 'AIC-UPLOAD-1', fallback: 'empty-snapshot-object'
        }),
        expect.any(TypeError)
      );
      expect(JSON.stringify(warning.mock.calls)).not.toContain('private snapshot');
    } finally {
      fixture.close();
    }
  });
});
