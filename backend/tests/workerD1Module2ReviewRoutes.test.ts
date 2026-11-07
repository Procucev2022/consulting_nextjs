import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudflareD1Database } from '../src/types/cloudflare';
import type { MaterialMappingEntry } from '../src/types/module2MaterialMapping';
import { MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS, MODULE2_D1_ROUTE_MESSAGES } from '../src/constants/module2D1Scoped';
import {
  executeMaterialMappingStatements, handleBulkMaterialMappingUpdate, handleMaterialMappingUpdate, handleProcurementComplianceReview,
  handleSpecificationReview, procurementComplianceReport, specificationReport
} from '../src/workerD1Module2ReviewRoutes';

const routeMocks = vi.hoisted(() => ({
  scoped: vi.fn(),
  authenticate: vi.fn(),
  loadHistory: vi.fn(),
  applyHistory: vi.fn(),
  clearCache: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn()
}));

vi.mock('../src/services/workerD1Module2Scoped', () => ({
  clearScopedModule2Cache: routeMocks.clearCache,
  handleScopedModule2Route: routeMocks.scoped
}));
vi.mock('../src/workerAuth', () => ({ authenticateWorkerUser: routeMocks.authenticate }));
vi.mock('../src/services/workerD1SpecificationReviews', () => ({
  applySpecificationReviewHistory: routeMocks.applyHistory,
  loadSpecificationReviewHistory: routeMocks.loadHistory
}));
vi.mock('../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: routeMocks.logInfo, warn: routeMocks.logWarn, error: routeMocks.logError }
}));

const user = {
  id: 'user-1', name: 'Review User', email: 'reviewer@example.test', role: 'USER' as const,
  tenantId: 'tenant-1', tenantActive: true
};
const mapping: MaterialMappingEntry = {
  sourceMaterialId: 'MAT-1', sourceDescription: 'Resin', sourceCategory: 'Chemicals',
  assignedUnspscCode: '', assignedUnspscTitle: '', unspscSegment: '', unspscFamily: '',
  unspscClass: '', unspscCommodity: '', taxonomyVersion: '', mappingMethod: 'MANUAL_REVIEW_REQUIRED',
  confidenceScore: 0, evidence: '', reviewStatus: 'AWAITING_REVIEW', mappingDate: '', totalSpendInr: 0,
  totalSpendCr: 0, transactionCount: 1, qualifyingSuppliersCount: 1
};
const taxonomy = {
  commodity_code: '12345678', commodity_title: 'Resins', class_code: '123456', family_code: '1234',
  segment_code: '12', taxonomy_version: '2026', core_bucket: 'Direct Materials'
};
const exception = { exceptionId: 'COMP-1' };
const candidate = { candidateId: 'SPEC-1' };

const makeDb = (options: { taxonomyResults?: unknown; batch?: boolean } = {}): CloudflareD1Database => {
  const statement = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn(async () => options.taxonomyResults === undefined
      ? { results: [taxonomy] } : options.taxonomyResults),
    run: vi.fn(async () => ({ success: true }))
  };
  return {
    prepare: vi.fn(() => statement),
    ...(options.batch === false ? {} : { batch: vi.fn(async () => []) })
  } as unknown as CloudflareD1Database;
};

const requestFor = (path: string, body: unknown): Request => new Request(`https://unit.test${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});
const validSpecificationReview = (overrides: Record<string, unknown> = {}) => ({
  assessmentId: 'A-1', candidateId: 'SPEC-1', status: 'TECHNICALLY_VERIFIED', reviewerName: 'Untrusted',
  technicalJustification: 'Validated against approved drawings.', ...overrides
});
const validMapping = (overrides: Record<string, unknown> = {}) => ({
  assessmentId: 'A-1', sourceMaterialId: 'MAT-1', unspscCode: '12345678', reviewStatus: 'CLIENT_APPROVED',
  ...overrides
});
const validComplianceReview = (overrides: Record<string, unknown> = {}) => ({
  assessmentId: 'A-1', candidateId: 'COMP-1', status: 'VERIFIED_EXCEPTION',
  technicalJustification: 'Confirmed using procurement records.', ...overrides
});

beforeEach(() => {
  vi.clearAllMocks();
  routeMocks.authenticate.mockResolvedValue({ status: 200, user });
  routeMocks.loadHistory.mockResolvedValue({});
  routeMocks.applyHistory.mockImplementation((report: unknown) => report);
  routeMocks.scoped.mockImplementation(async (_db: unknown, path: string) => ({ data: path === '/vendor-consolidation'
    ? { mappingRegister: [mapping] }
    : { candidates: [candidate], exceptions: [exception] } }));
});

describe('Module 2 specification review routes', () => {
  it('preserves missing, failed, and successful scoped report results', async () => {
    const db = makeDb();
    const request = new Request('https://unit.test/report');
    const url = new URL(request.url);
    routeMocks.scoped.mockResolvedValueOnce(null);
    expect(await specificationReport(db, request, url, 'A-1')).toBeNull();
    routeMocks.scoped.mockResolvedValueOnce({ status: 503, data: { success: false } });
    expect(await specificationReport(db, request, url, 'A-1')).toMatchObject({ status: 503 });
    const report = { data: { candidates: [candidate] } };
    routeMocks.scoped.mockResolvedValueOnce(report);
    routeMocks.applyHistory.mockReturnValueOnce({ candidates: [candidate], reviewWorkflowAvailable: true });
    expect(await specificationReport(db, request, url, 'A-1')).toMatchObject({
      data: { reviewWorkflowAvailable: true }
    });
    expect(routeMocks.loadHistory).toHaveBeenCalledWith(db, 'A-1');
  });

  it('rejects invalid or unauthenticated reviews and reports missing candidates', async () => {
    const db = makeDb();
    const url = new URL('https://unit.test/review');
    expect(await handleSpecificationReview(db, requestFor('/review', {}), url)).toMatchObject({ status: 400 });
    routeMocks.authenticate.mockResolvedValueOnce({ status: 401 });
    expect(await handleSpecificationReview(db, requestFor('/review', validSpecificationReview()), url))
      .toMatchObject({ status: 401, data: { message: 'Authentication required.' } });
    routeMocks.authenticate.mockResolvedValueOnce({ status: 403, message: 'Forbidden.' });
    expect(await handleSpecificationReview(db, requestFor('/review', validSpecificationReview()), url))
      .toMatchObject({ status: 403, data: { message: 'Forbidden.' } });
    routeMocks.scoped.mockResolvedValueOnce({ data: { candidates: [] } });
    expect(await handleSpecificationReview(db, requestFor('/review', validSpecificationReview()), url))
      .toMatchObject({ status: 404 });
  });

  it('stores authenticated specification reviews with nullable and supplied optional fields', async () => {
    const db = makeDb();
    const url = new URL('https://unit.test/review');
    await handleSpecificationReview(db, requestFor('/review', validSpecificationReview()), url, 'secret');
    const firstStatement = vi.mocked(db.prepare).mock.results.at(-1)?.value;
    expect(firstStatement?.bind).toHaveBeenCalledWith(
      expect.stringMatching(/^SPEC-REV-/), 'A-1', 'SPEC-1', user.name, user.role, expect.any(String),
      'TECHNICALLY_VERIFIED', 'Validated against approved drawings.', null, null, null
    );
    await handleSpecificationReview(db, requestFor('/review', validSpecificationReview({
      proposedStandard: 'ISO standard', applicationScope: 'Plant 1', rejectionReason: 'Not rejected'
    })), url, 'secret');
    const secondStatement = vi.mocked(db.prepare).mock.results.at(-1)?.value;
    expect(secondStatement?.bind).toHaveBeenCalledWith(
      expect.stringMatching(/^SPEC-REV-/), 'A-1', 'SPEC-1', user.name, user.role, expect.any(String),
      'TECHNICALLY_VERIFIED', 'Validated against approved drawings.', 'ISO standard', 'Plant 1', 'Not rejected'
    );
    expect(routeMocks.logInfo).toHaveBeenCalledWith('Persisted D1 specification technical review', expect.any(Object));
  });
});

describe('Module 2 material mapping routes', () => {
  it('skips D1 batch calls when there are no prepared mapping statements', async () => {
    const db = makeDb({ batch: true });
    await expect(executeMaterialMappingStatements(db, [])).resolves.toBe(true);
    expect(db.batch).not.toHaveBeenCalled();
  });

  it('fails closed with a correlated error when atomic D1 batching is unavailable', async () => {
    const db = makeDb({ batch: false });
    const statement = db.prepare('UPDATE AssessmentMaterialMapping SET payload_json = ?');

    await expect(executeMaterialMappingStatements(db, [statement], 'mapping-request-1')).resolves.toBe(false);

    expect(db.batch).toBeUndefined();
    expect(statement.run).not.toHaveBeenCalled();
    expect(routeMocks.logError).toHaveBeenCalledWith(
      'Material mapping update aborted before writes because D1 atomic batching is unavailable',
      expect.objectContaining({
        action: MODULE2_D1_MATERIAL_MAPPING_DIAGNOSTICS.WRITE_ACTION,
        requestId: 'mapping-request-1',
        statementCount: 1,
        writesStarted: false,
        fallback: 'fail-closed'
      }),
      expect.objectContaining({ message: MODULE2_D1_ROUTE_MESSAGES.materialMappingBatchUnavailable })
    );
  });

  it('validates and authorizes single and bulk mapping updates', async () => {
    const db = makeDb();
    const url = new URL('https://unit.test/mappings');
    expect(await handleMaterialMappingUpdate(db, requestFor('/mappings', {}), url)).toMatchObject({ status: 400 });
    routeMocks.authenticate.mockResolvedValueOnce({ status: 401, message: 'Sign in again.' });
    expect(await handleMaterialMappingUpdate(db, requestFor('/mappings', validMapping()), url))
      .toMatchObject({ status: 401, data: { message: 'Sign in again.' } });
    expect(await handleBulkMaterialMappingUpdate(db, requestFor('/mappings', { assessmentId: 'A-1', mappings: [] }), url))
      .toMatchObject({ status: 400 });
    routeMocks.authenticate.mockResolvedValueOnce({ status: 403, message: 'Forbidden.' });
    expect(await handleBulkMaterialMappingUpdate(db, requestFor('/mappings', {
      assessmentId: 'A-1', mappings: [validMapping()]
    }), url)).toMatchObject({ status: 403 });
  });

  it('returns missing target and missing taxonomy errors from the persistence boundary', async () => {
    const db = makeDb({ taxonomyResults: { results: [] } });
    const url = new URL('https://unit.test/mappings');
    routeMocks.scoped.mockResolvedValueOnce({ data: {} });
    expect(await handleMaterialMappingUpdate(db, requestFor('/mappings', validMapping()), url))
      .toMatchObject({ status: 404 });
    routeMocks.scoped.mockResolvedValueOnce({ data: { mappingRegister: [mapping] } });
    expect(await handleMaterialMappingUpdate(db, requestFor('/mappings', validMapping()), url))
      .toMatchObject({ status: 400 });
    routeMocks.scoped.mockResolvedValueOnce({ data: { mappingRegister: [mapping] } });
    const undefinedResultsDb = makeDb({ taxonomyResults: { results: undefined } });
    expect(await handleBulkMaterialMappingUpdate(undefinedResultsDb, requestFor('/mappings', {
      assessmentId: 'A-1', mappings: [validMapping({ sourceMaterialId: 'MAT-1' })]
    }), url)).toMatchObject({ status: 400 });
  });

  it('persists approved and provisional classifications atomically and rejects adapters without batch support', async () => {
    const url = new URL('https://unit.test/mappings');
    const batchedDb = makeDb({ batch: true });
    const approved = await handleMaterialMappingUpdate(batchedDb, requestFor('/mappings', validMapping({
      mappingMethod: 'CONTEXTUAL_HEURISTIC', confidenceScore: 0.7
    })), url);
    expect(approved.data).toMatchObject({ success: true, mapping: {
      assignedUnspscCode: '12345678', evidence: expect.stringContaining('approved'), coreBucket: 'Direct Materials'
    } });
    expect(batchedDb.batch).toHaveBeenCalledOnce();

    const statementDb = makeDb({ taxonomyResults: { results: [{ ...taxonomy, core_bucket: 42 }] } });
    const provisional = await handleBulkMaterialMappingUpdate(statementDb, requestFor('/mappings', {
      assessmentId: 'A-1', mappings: [validMapping({ reviewStatus: 'PROVISIONAL', mappingMethod: undefined,
        confidenceScore: undefined, auditNotes: undefined })]
    }), url);
    expect(provisional.data).toMatchObject({ success: true, mappings: [expect.objectContaining({
      mappingMethod: 'MANUAL_REVIEW_REQUIRED', confidenceScore: 1, coreBucket: undefined,
      evidence: 'Unreviewed classification suggestion generated from assessment data.'
    })] });
    expect(statementDb.prepare).toHaveBeenCalledTimes(2);
    expect(statementDb.batch).toHaveBeenCalledOnce();
    expect(routeMocks.clearCache).toHaveBeenCalledTimes(2);
    expect(routeMocks.logInfo).toHaveBeenCalledWith('Persisted D1 assessment material classifications', expect.any(Object));

    const unsupportedDb = makeDb({ batch: false });
    const unavailable = await handleBulkMaterialMappingUpdate(unsupportedDb, new Request('https://unit.test/mappings', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-request-id': 'mapping-request-2' },
      body: JSON.stringify({ assessmentId: 'A-1', mappings: [validMapping()] })
    }), url);
    expect(unavailable).toEqual({
      status: 503,
      data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.materialMappingBatchUnavailable }
    });
    const updateStatement = vi.mocked(unsupportedDb.prepare).mock.results.at(-1)?.value;
    expect(updateStatement?.run).not.toHaveBeenCalled();
    expect(routeMocks.logError).toHaveBeenCalledWith(
      'Material mapping update aborted before writes because D1 atomic batching is unavailable',
      expect.objectContaining({ requestId: 'mapping-request-2', writesStarted: false }),
      expect.any(Error)
    );
  });
});

describe('Module 2 procurement compliance review routes', () => {
  it('returns scoped report errors, missing records, and a configured report', async () => {
    const db = makeDb();
    const request = new Request('https://unit.test/compliance');
    const url = new URL(request.url);
    routeMocks.scoped.mockResolvedValueOnce(null);
    expect(await procurementComplianceReport(db, request, url, 'A-1')).toBeNull();
    routeMocks.scoped.mockResolvedValueOnce({ status: 503, data: {} });
    expect(await handleProcurementComplianceReview(db, requestFor('/review', validComplianceReview()), url))
      .toMatchObject({ status: 503 });
    routeMocks.scoped.mockResolvedValueOnce({ data: { exceptions: [] } });
    expect(await handleProcurementComplianceReview(db, requestFor('/review', validComplianceReview()), url))
      .toMatchObject({ status: 404 });
  });

  it('validates and authorizes compliance reviews before writing', async () => {
    const db = makeDb();
    const url = new URL('https://unit.test/compliance');
    expect(await handleProcurementComplianceReview(db, requestFor('/review', {}), url)).toMatchObject({ status: 400 });
    routeMocks.authenticate.mockResolvedValueOnce({ status: 401, message: 'Authentication required.' });
    expect(await handleProcurementComplianceReview(db, requestFor('/review', validComplianceReview()), url))
      .toMatchObject({ status: 401 });
  });

  it('stores compliance decisions and handles absent scoped reports', async () => {
    const db = makeDb();
    const url = new URL('https://unit.test/compliance');
    routeMocks.scoped.mockResolvedValueOnce(null);
    expect(await handleProcurementComplianceReview(db, requestFor('/review', validComplianceReview()), url))
      .toMatchObject({ status: 409 });
    routeMocks.scoped.mockResolvedValue({ data: { exceptions: [exception] } });
    const saved = await handleProcurementComplianceReview(db, requestFor('/review', validComplianceReview({
      correctiveActionPlan: 'Reconcile the purchase order.', dismissalReason: 'Not dismissed.'
    })), url);
    expect(saved.data).toMatchObject({ exceptions: [exception] });
    const statement = vi.mocked(db.prepare).mock.results.at(-1)?.value;
    expect(statement?.bind).toHaveBeenCalledWith(
      expect.stringMatching(/^COMPLIANCE-REV-/), 'A-1', 'COMP-1', user.name, user.role, expect.any(String),
      'VERIFIED_EXCEPTION', 'Confirmed using procurement records.', 'Reconcile the purchase order.', 'Not dismissed.'
    );
    expect(routeMocks.logInfo).toHaveBeenCalledWith('Persisted D1 procurement compliance review', expect.any(Object));
  });
});
