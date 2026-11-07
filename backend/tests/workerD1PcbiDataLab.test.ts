import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { D1_LOG_MESSAGES, D1_REPORTING, D1_ROUTE_MESSAGES } from '../src/constants/d1';
import { SQL_PCBI_CUSTOMER_SPEND_BY_UNSPSC } from '../src/constants/pcbiDataLabSql';
import type { CloudflareD1Database, CloudflareD1PreparedStatement, CloudflareEnvironment } from '../src/types/cloudflare';
import type {
  PCBICommodityObservationRow,
  PCBICommodityPromotionRow,
  PCBICommoditySourceRow,
  PCBICommoditySpendByUnspscRow
} from '../src/types/pcbiDataLabStorage';
import logger from '../src/utils/logger';
import { handlePcbiRoute } from '../src/workerD1Pcbi';
import { handlePcbiDataLabRoute } from '../src/workerD1PcbiDataLab';

const { configureGeminiMock, generateGeminiJsonMock } = vi.hoisted(() => ({
  configureGeminiMock: vi.fn(),
  generateGeminiJsonMock: vi.fn()
}));

vi.mock('../src/services/geminiService', () => ({
  geminiService: { configureForEnvironment: configureGeminiMock, generateJson: generateGeminiJsonMock }
}));

vi.mock('../src/utils/logger', () => ({ default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const BENCHMARK = {
  pcbi_id: 'PCBI-STEEL-1', benchmark_name: 'Steel flat', benchmark_unit: 'INR/MT', currency: 'INR',
  geography: 'India', category: 'Metals', sub_category: 'Steel', sector: 'Steel', quality_rating: 'A',
  benchmarkability_percent: 90, effective_from: '2024-01-01', start_date: '2024-01-01', end_date: null,
  applicable_sectors: null, active: 1
};

class LabStatement implements CloudflareD1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly database: LabDatabase, private readonly sql: string) {}
  bind(...values: unknown[]): CloudflareD1PreparedStatement { this.values = values; return this; }
  async first<T>(): Promise<T | null> {
    if (this.sql.includes('PCBIMasterVersion') && this.sql.includes("status = 'PUBLISHED'")) {
      return this.database.publishedPayload
        ? ({ payload_json: JSON.stringify(this.database.publishedPayload) } as T)
        : null;
    }
    if (this.sql.includes('PCBIBenchmarkMaster')) return (this.database.benchmark.pcbi_id === this.values[0] || !this.sql.includes('WHERE pcbi_id = ?') ? this.database.benchmark : null) as T | null;
    if (this.sql.includes('PCBICommodityResearchWorkflow')) {
      return (this.database.workflows.find((row) => row.pcbi_id === this.values[0]) || null) as T | null;
    }
    if (this.sql.includes('PCBICommodityResearchAssignment')) {
      return (this.database.assignments.find((row) => row.pcbi_id === this.values[0]) || null) as T | null;
    }
    return null;
  }
  async all<T>(): Promise<{ results: T[] }> {
    if (this.sql.includes('PCBIMasterVersion') && this.sql.includes("status = 'PUBLISHED'")) {
      return {
        results: this.database.publishedPayload
          ? ([{ payload_json: JSON.stringify(this.database.publishedPayload) }] as T[])
          : []
      };
    }
    if (this.sql.includes('FROM ProcurementTransaction tx')) return { results: [...this.database.spendRows] as T[] };
    if (this.sql.includes('PCBIUNSPSCMapping')) return { results: [...this.database.unspscMappings] as T[] };
    if (this.sql.includes('PCBIBenchmarkMaster')) return { results: [this.database.benchmark as T] };
    if (this.sql.includes('PCBICommodityObservation')) {
      const observations = this.values.length ? this.database.observations.filter((row) => row.pcbi_id === this.values[0]) : this.database.observations;
      if (this.sql.includes('AS index_value')) {
        return { results: observations.map((row) => ({
          id: row.observation_id, pcbi_id: row.pcbi_id, week_start: row.observation_date,
          week_end: row.observation_date, index_value: row.normalized_value, currency: row.normalized_currency,
          unit: row.normalized_unit, source: this.database.sources.find((source) => source.source_id === row.source_id)?.source_name,
          quality_rating: 'A', component_id: null
        })) as T[] };
      }
      return { results: observations.map((row) => ({
        ...row, observationId: row.observation_id, sourceId: row.source_id, sourceDate: row.observation_date
      })) as T[] };
    }
    if (this.sql.includes('PCBICommoditySource')) {
      const sources = this.values.length ? this.database.sources.filter((row) => row.pcbi_id === this.values[0]) : this.database.sources;
      return { results: [...sources] as T[] };
    }
    if (this.sql.includes('PCBICommodityPromotion')) {
      const rows = this.values.length ? this.database.promotions.filter((row) => row.pcbi_id === this.values[0]) : this.database.promotions;
      return { results: [...rows] as T[] };
    }
    if (this.sql.includes('PCBICommodityResearchAssignment')) return { results: [...this.database.assignments] as T[] };
    if (this.sql.includes('PCBICommodityResearchWorkflow')) return { results: [...this.database.workflows] as T[] };
    return { results: [] };
  }
  async run(): Promise<unknown> {
    for (const [index, pattern] of this.database.failureSqlPatterns.entries()) {
      if (!this.sql.includes(pattern)) continue;
      this.database.failurePatternCounts[index] = (this.database.failurePatternCounts[index] || 0) + 1;
      if (this.database.failurePatternCounts[index] === this.database.failureAttemptNumbers[index]) {
        throw this.database.statementFailure;
      }
    }
    if (this.sql.includes('INSERT INTO PCBICommoditySource')) {
      const [source_id, commodity_id, pcbi_id, series_id, source_name, publisher, url, document_name, publication_date,
        uploaded_at, uploaded_by, file_type, checksum, object_key, geography, grade_specification, unit, currency,
        frequency, delivery_basis, historical_coverage, extraction_status, validation_status, methodology_status,
        approval_status, extracted_observations_count] = this.values;
      this.database.sources.unshift({
        source_id, commodity_id, pcbi_id, series_id, source_name, publisher, url, document_name, publication_date,
        uploaded_at, uploaded_by, file_type, checksum, object_key, geography, grade_specification, unit, currency,
        frequency, delivery_basis, historical_coverage, extraction_status, validation_status, methodology_status,
        approval_status, extracted_observations_count
      } as PCBICommoditySourceRow);
    } else if (this.sql.includes('INSERT INTO PCBICommodityObservation')) {
      this.database.observationInsertAttempts += 1;
      if (this.database.failObservationInsertAt === this.database.observationInsertAttempts) {
        throw this.database.observationInsertFailure;
      }
      const [observation_id, source_id, pcbi_id, observation_date, raw_value, raw_unit, raw_currency,
        normalized_value, normalized_unit, normalized_currency, frequency, status, payload_json] = this.values;
      this.database.observations.unshift({
        observation_id, source_id, pcbi_id, observation_date, raw_value, raw_unit, raw_currency,
        normalized_value, normalized_unit, normalized_currency, frequency, status, payload_json,
        observationId: observation_id, sourceId: source_id, sourceDate: observation_date
      } as PCBICommodityObservationRow);
    } else if (this.sql.includes('DELETE FROM PCBICommodityObservation')) {
      if (this.database.failCompensatingDelete) throw this.database.rollbackFailure;
      const remaining = this.database.observations.filter((row) => row.source_id !== this.values[0]);
      this.database.observations.splice(0, this.database.observations.length, ...remaining);
    } else if (this.sql.includes('DELETE FROM PCBICommoditySource')) {
      if (this.database.failCompensatingDelete) throw this.database.rollbackFailure;
      const remaining = this.database.sources.filter((row) => row.source_id !== this.values[0]);
      this.database.sources.splice(0, this.database.sources.length, ...remaining);
    } else if (this.sql.includes('INSERT INTO PCBICommodityPromotion')) {
      const [promotion_id, catalog_version_id, source_id, commodity_id, pcbi_id, approver_name, comments, promoted_at, observation_count] = this.values;
      this.database.promotions.unshift({ promotion_id, catalog_version_id, source_id, commodity_id, pcbi_id, approver_name, comments, promoted_at, observation_count } as PCBICommodityPromotionRow);
    } else if (this.sql.includes('DELETE FROM PCBICommodityPromotion')) {
      const index = this.database.promotions.findIndex((row) => row.promotion_id === this.values[0]);
      if (index >= 0) this.database.promotions.splice(index, 1);
    } else if (this.sql.includes('INSERT INTO PCBICommodityResearchAssignment')) {
      const [pcbi_id, assigned_to, assigned_by, assigned_at, updated_at] = this.values;
      const existing = this.database.assignments.find((row) => row.pcbi_id === pcbi_id);
      if (existing) Object.assign(existing, {
        assigned_to, assigned_by, updated_at,
        ...(this.sql.includes('assigned_at = excluded.assigned_at') ? { assigned_at } : {})
      });
      else this.database.assignments.push({ pcbi_id, assigned_to, assigned_by, assigned_at, updated_at });
    } else if (this.sql.includes('INSERT INTO PCBICommodityResearchWorkflow')) {
      const [pcbi_id, status, due_date, notes, updated_by, updated_at] = this.values;
      const existing = this.database.workflows.find((row) => row.pcbi_id === pcbi_id);
      if (existing) Object.assign(existing, { status, due_date, notes, updated_by, updated_at });
      else this.database.workflows.push({ pcbi_id, status, due_date, notes, updated_by, updated_at });
    } else if (this.sql.includes('DELETE FROM PCBICommodityResearchWorkflow')) {
      const workflowIndex = this.database.workflows.findIndex((row) => row.pcbi_id === this.values[0]);
      if (workflowIndex >= 0) this.database.workflows.splice(workflowIndex, 1);
    } else if (this.sql.includes('DELETE FROM PCBICommodityResearchAssignment')) {
      const assignmentIndex = this.database.assignments.findIndex((row) => row.pcbi_id === this.values[0]);
      if (assignmentIndex >= 0) this.database.assignments.splice(assignmentIndex, 1);
    } else if (this.sql.includes('UPDATE PCBICommoditySource')) {
      const sourceId = this.sql.includes('SET methodology_status = ?, approval_status = ?') ? this.values[2] : this.values[0];
      const source = this.database.sources.find((row) => row.source_id === sourceId);
      if (source && this.sql.includes('SET methodology_status = ?, approval_status = ?')) {
        Object.assign(source, { methodology_status: this.values[0], approval_status: this.values[1] });
      } else if (source) Object.assign(source, { methodology_status: 'METHODOLOGY_APPROVED', approval_status: 'ADMIN_APPROVED' });
    }
    return { success: true };
  }
}

class LabDatabase implements CloudflareD1Database {
  readonly benchmark = { ...BENCHMARK };
  readonly sources: PCBICommoditySourceRow[] = [];
  readonly observations: PCBICommodityObservationRow[] = [];
  readonly promotions: PCBICommodityPromotionRow[] = [];
  readonly assignments: Array<{ pcbi_id: string; assigned_to: string; assigned_by: string; assigned_at: string; updated_at: string }> = [];
  readonly workflows: Array<{ pcbi_id: string; status: string; due_date: string | null; notes: string; updated_by: string; updated_at: string }> = [];
  readonly spendRows: PCBICommoditySpendByUnspscRow[] = [];
  readonly unspscMappings: Record<string, unknown>[] = [];
  publishedPayload: Record<string, unknown> | null = null;
  observationInsertAttempts = 0;
  failObservationInsertAt: number | null = null;
  failCompensatingDelete = false;
  readonly observationInsertFailure = new Error('D1 observation insert failed');
  readonly rollbackFailure = new Error('D1 compensation failed');
  readonly statementFailure = new Error('D1 statement failed');
  failureSqlPatterns: string[] = [];
  failureAttemptNumbers: number[] = [];
  failurePatternCounts: number[] = [];
  batchCalls = 0;
  readonly batch?: CloudflareD1Database['batch'];
  constructor(withBatch = true) {
    if (withBatch) this.batch = async (statements) => {
      this.batchCalls += 1;
      const sourcesBefore = this.sources.map((row) => ({ ...row }));
      const observationsBefore = this.observations.map((row) => ({ ...row }));
      const promotionsBefore = this.promotions.map((row) => ({ ...row }));
      const assignmentsBefore = this.assignments.map((row) => ({ ...row }));
      const workflowsBefore = this.workflows.map((row) => ({ ...row }));
      try {
        return await Promise.all(statements.map((statement) => statement.run()));
      } catch (error: unknown) {
        this.sources.splice(0, this.sources.length, ...sourcesBefore);
        this.observations.splice(0, this.observations.length, ...observationsBefore);
        this.promotions.splice(0, this.promotions.length, ...promotionsBefore);
        this.assignments.splice(0, this.assignments.length, ...assignmentsBefore);
        this.workflows.splice(0, this.workflows.length, ...workflowsBefore);
        throw error;
      }
    };
  }
  prepare(sql: string): CloudflareD1PreparedStatement { return new LabStatement(this, sql); }
}

const environment = (db: CloudflareD1Database = new LabDatabase()): CloudflareEnvironment => ({
  DB: db,
  OBJECTS: { put: vi.fn().mockResolvedValue(undefined), get: vi.fn(), delete: vi.fn() }
});

const request = (path: string, method: string = 'GET', body?: unknown): Request => {
  const url = new URL(`https://edge.example/api/admin/pcbi/data-lab${path}`);
  return new Request(url, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'x-request-id': 'req-lab-1' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
};

const route = (env: CloudflareEnvironment, path: string, method = 'GET', body?: unknown) => {
  const req = request(path, method, body);
  return handlePcbiDataLabRoute(env, req, new URL(req.url), 'admin@example.test');
};

const csvBase64 = (csv = 'week_start,index_value\n2026-10-01,105\n'): string => Buffer.from(csv).toString('base64');
const validUpload = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, seriesId: 'SER-STEEL-1',
  sourceName: 'Steel market index', publisher: 'Market Authority', documentName: 'steel-index.csv',
  fileType: 'CSV', fileBase64: csvBase64(), geography: BENCHMARK.geography,
  unit: BENCHMARK.benchmark_unit, currency: BENCHMARK.currency, frequency: 'WEEKLY',
  ...overrides
});

describe('D1 Commodity Data Lab', () => {
  beforeEach(() => {
    generateGeminiJsonMock.mockReset().mockResolvedValue({
      status: 'NOT_CONFIGURED', data: null, model: null, error: 'GEMINI_API_KEY not set'
    });
    configureGeminiMock.mockClear();
  });

  afterEach(() => vi.restoreAllMocks());

  it('rejects invalid request bodies and missing Cloudflare bindings', async () => {
    const env = environment();
    expect(await route(env, '/detect-domain', 'POST', {})).toMatchObject({ status: 400 });
    expect(await route(env, '/upload-source', 'POST', { pcbiId: 'x' })).toMatchObject({ status: 400 });
    await expect(route({ AUTH_SECRET: 'x' }, '/queue')).rejects.toThrow(D1_ROUTE_MESSAGES.missingBinding);
  });

  it('assigns a researcher to a PCBI gap and persists the assignment in the queue', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const assigned = await route(env, '/assignment', 'POST', {
      pcbiId: BENCHMARK.pcbi_id, assignee: 'researcher@example.test', status: 'RESEARCHING',
      dueDate: '2026-11-07', notes: 'Confirm source coverage.'
    });
    expect(assigned.data).toMatchObject({
      success: true,
      assignment: {
        pcbiId: BENCHMARK.pcbi_id, assignedTo: 'researcher@example.test', assignedBy: 'admin@example.test',
        workflowStatus: 'RESEARCHING', dueDate: '2026-11-07', notes: 'Confirm source coverage.'
      }
    });
    expect(db.assignments).toHaveLength(1);
    expect((await route(env, '/queue')).data).toMatchObject({
      queue: [{
        pcbiId: BENCHMARK.pcbi_id, assignedTo: 'researcher@example.test', assignedAt: expect.any(String),
        workflowStatus: 'RESEARCHING', workflowDueDate: '2026-11-07', workflowNotes: 'Confirm source coverage.'
      }]
    });

    const unassigned = await route(env, '/assignment', 'POST', { pcbiId: BENCHMARK.pcbi_id, assignee: null });
    expect(unassigned.data).toMatchObject({ success: true, assignment: null });
    expect((await route(env, '/queue')).data).toMatchObject({ queue: [{ assignedTo: null, assignedAt: null }] });
    expect(db.assignments).toHaveLength(0);
    expect(db.workflows).toHaveLength(0);
  });

  it('preserves workflow defaults and existing research details with D1 batches', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const assigned = await route(env, '/assignment', 'POST', {
      pcbiId: BENCHMARK.pcbi_id, assignee: 'first-researcher@example.test'
    });
    expect(assigned.data).toMatchObject({
      success: true,
      assignment: {
        assignedTo: 'first-researcher@example.test', workflowStatus: 'QUEUED', dueDate: null, notes: ''
      }
    });
    expect(db.assignments).toHaveLength(1);
    expect(db.workflows).toMatchObject([{ status: 'QUEUED', due_date: null, notes: '' }]);

    db.workflows[0].due_date = '2026-11-28';
    db.workflows[0].notes = 'Keep the existing research plan.';
    const reassigned = await route(env, '/assignment', 'POST', {
      pcbiId: BENCHMARK.pcbi_id, assignee: 'second-researcher@example.test'
    });
    expect(reassigned.data).toMatchObject({
      assignment: {
        assignedTo: 'second-researcher@example.test', workflowStatus: 'QUEUED',
        dueDate: '2026-11-28', notes: 'Keep the existing research plan.'
      }
    });

    const unassigned = await route(env, '/assignment', 'POST', {
      pcbiId: BENCHMARK.pcbi_id, assignee: null
    });
    expect(unassigned.data).toMatchObject({ success: true, assignment: null });
    expect(db.assignments).toHaveLength(0);
    expect(db.workflows).toHaveLength(0);
  });

  it('keeps assignment state unchanged when a D1 batch fails', async () => {
    const db = new LabDatabase();
    const previousAssignment = {
      pcbi_id: BENCHMARK.pcbi_id, assigned_to: 'old@example.test', assigned_by: 'prior-admin@example.test',
      assigned_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-02T00:00:00.000Z'
    };
    const previousWorkflow = {
      pcbi_id: BENCHMARK.pcbi_id, status: 'RESEARCHING', due_date: '2026-10-20', notes: 'Original plan',
      updated_by: 'prior-admin@example.test', updated_at: '2026-10-02T00:00:00.000Z'
    };
    db.assignments.push({ ...previousAssignment });
    db.workflows.push({ ...previousWorkflow });
    db.failureSqlPatterns = ['INSERT INTO PCBICommodityResearchWorkflow'];
    db.failureAttemptNumbers = [1];

    await expect(route(environment(db), '/assignment', 'POST', {
      pcbiId: BENCHMARK.pcbi_id, assignee: 'new@example.test', notes: 'Changed plan'
    })).rejects.toThrow(db.statementFailure);

    expect(db.assignments).toEqual([previousAssignment]);
    expect(db.workflows).toEqual([previousWorkflow]);
    expect(logger.error).toHaveBeenCalledWith(
      D1_LOG_MESSAGES.atomicWriteFailed,
      expect.objectContaining({ requestId: 'req-lab-1', action: 'pcbi.research.assign', statementCount: 2 }),
      db.statementFailure
    );
  });

  it('rejects assignment and unassignment before writes when D1 batching is unavailable', async () => {
    const db = new LabDatabase(false);
    const previousAssignment = {
      pcbi_id: BENCHMARK.pcbi_id, assigned_to: 'old@example.test', assigned_by: 'prior-admin@example.test',
      assigned_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-02T00:00:00.000Z'
    };
    const previousWorkflow = {
      pcbi_id: BENCHMARK.pcbi_id, status: 'RESEARCHING', due_date: '2026-10-20', notes: 'Original plan',
      updated_by: 'prior-admin@example.test', updated_at: '2026-10-02T00:00:00.000Z'
    };
    db.assignments.push(previousAssignment);
    db.workflows.push(previousWorkflow);

    await expect(route(environment(db), '/assignment', 'POST', {
      pcbiId: BENCHMARK.pcbi_id, assignee: 'new@example.test'
    })).rejects.toThrow(D1_ROUTE_MESSAGES.atomicBatchUnavailable);
    await expect(route(environment(db), '/assignment', 'POST', {
      pcbiId: BENCHMARK.pcbi_id, assignee: null
    })).rejects.toThrow(D1_ROUTE_MESSAGES.atomicBatchUnavailable);

    expect(db.assignments).toEqual([previousAssignment]);
    expect(db.workflows).toEqual([previousWorkflow]);
    expect(logger.error).toHaveBeenCalledWith(
      D1_LOG_MESSAGES.atomicBatchUnavailable,
      expect.objectContaining({ requestId: 'req-lab-1', operation: 'pcbi.research.assign', pcbiId: BENCHMARK.pcbi_id, fallback: 'none' }),
      expect.any(Error)
    );
  });

  it('rejects invalid assignments, unknown benchmark IDs, malformed JSON, and unsupported methods', async () => {
    const env = environment();
    expect(await route(env, '/assignment', 'POST', { pcbiId: '', assignee: 'researcher' })).toMatchObject({ status: 400 });
    expect(await route(env, '/assignment', 'POST', { pcbiId: BENCHMARK.pcbi_id, assignee: '  ' })).toMatchObject({ status: 400 });
    expect(await route(env, '/assignment', 'POST', { pcbiId: 'PCBI-UNKNOWN', assignee: 'researcher' })).toMatchObject({ status: 404 });
    expect(await route(env, '/assignment', 'GET')).toMatchObject({ status: 405 });
    const malformed = request('/assignment', 'POST');
    const malformedBody = new Request(malformed.url, { method: 'POST', body: '{' });
    expect(await handlePcbiDataLabRoute(env, malformedBody, new URL(malformedBody.url), 'admin'))
      .toMatchObject({ status: 400 });
    expect(await route(env, '/approve', 'POST', {})).toMatchObject({ status: 400 });
    expect(await route(env, '/approve', 'POST', {
      commodityId: 'COM-MISSING', pcbiId: 'PCBI-UNKNOWN', approverName: 'Admin'
    })).toMatchObject({ status: 404 });
    expect(await route(env, '')).toMatchObject({ status: 404 });
  });

  it('detects supported domains and routes customer or PCBI master files away from research upload', async () => {
    const env = environment();
    const research = await route(env, '/detect-domain', 'POST', {
      fileName: 'steel-price-index.csv', fileContentSnippet: 'commodity date index_value', targetArea: 'COMMODITY_DATA_LAB'
    });
    expect(research.data).toMatchObject({ success: true, detection: { detectedDomain: 'COMMODITY_RESEARCH_EVIDENCE', isAllowedInTarget: true } });
    const customer = await route(env, '/detect-domain', 'POST', {
      fileName: 'Customer_PO.xlsx', fileContentSnippet: '', targetArea: 'COMMODITY_DATA_LAB'
    });
    expect(customer.data).toMatchObject({ success: true, detection: { detectedDomain: 'CUSTOMER_PURCHASE_HISTORY', isAllowedInTarget: false } });
    const master = await route(env, '/detect-domain', 'POST', {
      fileName: 'pcbi_master.xlsx', targetArea: 'COMMODITY_DATA_LAB'
    });
    expect(master.data).toMatchObject({ success: true, detection: { detectedDomain: 'PCBI_MASTER_SYSTEM_DATA', isAllowedInTarget: false } });
    expect(await route(env, '/detect-domain', 'POST', {
      fileName: 'customer_purchase_history.csv', targetArea: 'MODULE_1_INGESTION'
    })).toMatchObject({ data: { detection: { isAllowedInTarget: true } } });
    expect(await route(env, '/detect-domain', 'POST', {
      fileName: 'weekly_index_master.csv', targetArea: 'PCBI_MASTER'
    })).toMatchObject({ data: { detection: { isAllowedInTarget: true } } });
    expect(await route(env, '/detect-domain', 'POST', {
      fileName: 'weekly_index_master.csv', targetArea: 'MODULE_1_INGESTION'
    })).toMatchObject({ data: { detection: { isAllowedInTarget: false, guidanceMessage: expect.stringContaining('PCBI Master') } } });
  });

  it('derives the queue and dashboard from active D1 benchmarks and observations only', async () => {
    const env = environment();
    const queue = await route(env, '/queue');
    expect(queue.data).toMatchObject({ success: true, total: 1, queue: [{ pcbiId: BENCHMARK.pcbi_id, currentStatus: 'NO_HISTORY', customerSpendCr: '0.00' }] });
    expect(await route(env, '/dashboard')).toMatchObject({ data: { metrics: { totalCommodities: 1, noHistoryCount: 1, productionReadyCount: 0 } } });
    expect(await route(env, `/commodity/${BENCHMARK.pcbi_id}?tab=OVERVIEW`)).toMatchObject({
      data: { success: true, workspace: { overview: { commodityName: 'Steel flat', requiredUnit: 'INR/MT' }, approvalPackage: { canWriteToCatalog: false } } }
    });
    expect(await route(env, '/commodity/UNKNOWN')).toMatchObject({ status: 404 });
  });

  it('links D1 procurement spend to active PCBI UNSPSC mappings in the queue and workspace', async () => {
    const db = new LabDatabase();
    db.spendRows.push({ unspsc_code: '12345678', spend_inr: 125000000, transaction_count: 7 });
    db.unspscMappings.push({ unspsc_code: '12345678', pcbi_id: BENCHMARK.pcbi_id });
    db.unspscMappings.push({ unspsc_code: '12345678', pcbi_id: BENCHMARK.pcbi_id });
    db.unspscMappings.push({ unspsc_code: '', pcbi_id: BENCHMARK.pcbi_id });
    db.unspscMappings.push({ unspsc_code: '99999999', pcbi_id: 'PCBI-WITHOUT-SPEND' });
    const env = environment(db);

    expect(await route(env, '/queue')).toMatchObject({
      data: { queue: [{
        unspsc: '12345678', customerSpend: 12.5, customerSpendCr: '12.50', transactionCount: 7,
        priority: 'P1 — Critical Coverage Gap', priorityScore: 100, priorityReason: 'RANKED_BY_CUSTOMER_SPEND'
      }] }
    });
    expect(await route(env, '/dashboard')).toMatchObject({
      data: { metrics: { highImpactGapsCount: 1, queueByPriority: { p1Critical: 1 } } }
    });
    expect(await route(env, `/commodity/${BENCHMARK.pcbi_id}`)).toMatchObject({
      data: { workspace: { overview: {
        unspsc: '12345678', customerSpendInr: 125000000, customerSpendCr: '12.50', transactionCount: 7,
        priority: 'P1 — Critical Coverage Gap', priorityScore: 100, priorityReason: 'RANKED_BY_CUSTOMER_SPEND'
      } } }
    });
  });

  it('aggregates only current-version procurement rows and prioritizes saved classification overrides', () => {
    const { DatabaseSync } = require('node:sqlite');
    const database = new DatabaseSync(':memory:');
    try {
      database.exec(`
        CREATE TABLE AssessmentDataVersion (data_version_id TEXT, assessment_id TEXT, version_number INTEGER, uploaded_at TEXT);
        CREATE TABLE ProcurementTransaction (
          transaction_id TEXT, assessment_id TEXT, source_document_id TEXT, total_inr_raw REAL,
          total_in_cr_raw REAL, deletion_indicator TEXT, material_code TEXT, raw_json TEXT
        );
        CREATE TABLE AssessmentMaterialMapping (assessment_id TEXT, source_material_id TEXT, payload_json TEXT);
        CREATE TABLE MaterialMappingRegister (source_material_id TEXT, payload_json TEXT);
        INSERT INTO AssessmentDataVersion VALUES ('DV-OLD', 'A-1', 1, '2026-01-01');
        INSERT INTO AssessmentDataVersion VALUES ('DV-CURRENT', 'A-1', 2, '2026-02-01');
        INSERT INTO ProcurementTransaction VALUES ('TX-OLD', 'A-1', 'DV-OLD', 99000000, 9.9, '', 'MAT-1', '{"unspscCode":"12345678"}');
        INSERT INTO ProcurementTransaction VALUES ('TX-CURRENT', 'A-1', 'DV-CURRENT', 100000000, 10, '', 'MAT-1', '{"unspscCode":"12345678"}');
        INSERT INTO ProcurementTransaction VALUES ('TX-LEGACY', 'A-2', 'DOC-LEGACY', 50000000, 5, '', 'MAT-2', '{"unspsc_code":"12345678"}');
        INSERT INTO ProcurementTransaction VALUES ('TX-DELETED', 'A-2', 'DOC-LEGACY', 30000000, 3, 'L', 'MAT-2', '{"unspsc_code":"12345678"}');
        INSERT INTO AssessmentMaterialMapping VALUES ('A-1', 'MAT-1', '{"assignedUnspscCode":"87654321"}');
      `);

      const rows = database.prepare(SQL_PCBI_CUSTOMER_SPEND_BY_UNSPSC).all(D1_REPORTING.inrPerCrore);

      expect(rows).toEqual([
        { unspsc_code: '12345678', spend_inr: 50000000, transaction_count: 1 },
        { unspsc_code: '87654321', spend_inr: 100000000, transaction_count: 1 }
      ]);
    } finally {
      database.close();
    }
  });

  it('reads a published PCBI master version from D1 before the base benchmark table', async () => {
    const db = new LabDatabase();
    db.spendRows.push({ unspsc_code: '12345678', spend_inr: 125000000, transaction_count: 7 });
    db.publishedPayload = {
      version: 'V9.1', file_name: 'master.csv', file_size_mb: 0.2, uploaded_by: 'Admin', worksheets: [],
      mappings: {
        PCBI_MASTER: [
          { excelColumn: 'ID', mappedField: 'pcbi_id' },
          { excelColumn: 'Name', mappedField: 'benchmark_name' },
          { excelColumn: 'Unit', mappedField: 'benchmark_unit' },
          { excelColumn: 'Currency', mappedField: 'currency' },
          { excelColumn: 'Start', mappedField: 'start_date' },
          { excelColumn: 'End', mappedField: 'end_date' },
          { excelColumn: 'Score', mappedField: 'benchmarkability_percent' }
        ],
        UNSPSC_MAPPING: [
          { excelColumn: 'Code', mappedField: 'unspsc_code' },
          { excelColumn: 'PCBI', mappedField: 'pcbi_id' }
        ]
      },
      benchmarks: [
        { ID: 'PCBI-IMPORTED-1', Name: 'Imported steel index', Unit: 'USD/MT', Currency: 'USD', Start: '2025-01-01', End: '2026-01-01', Score: 87 },
        { ID: 'PCBI-IMPORTED-2', Name: 'Imported copper index', Unit: 'USD/MT', Currency: 'USD', Start: '', End: '', Score: 'unknown' },
        { ID: '', Name: 'Incomplete row', Unit: 'USD/MT', Currency: 'USD' }
      ],
      weeklyIndices: [], constituents: [], sources: [], unspscMappings: [{ Code: '12345678', PCBI: 'PCBI-IMPORTED-1' }],
      validationSummary: {
        totalRecords: 1, validRecords: 1, warningRecords: 0, errorRecords: 0, blockingErrorCount: 0,
        warningCount: 0, aQualityCount: 1, bQualityCount: 0, cQualityCount: 0,
        avgBenchmarkability: 87, dateStart: '2025-01-01', dateEnd: '2026-01-01', issues: []
      }
    };
    const env = environment(db);
    const queue = await route(env, '/queue');
    expect(queue.data).toMatchObject({ queue: expect.arrayContaining([
      expect.objectContaining({ pcbiId: 'PCBI-IMPORTED-1', commodity: 'Imported steel index' })
    ]) });
    expect(queue.data).toMatchObject({ total: 2 });
    expect(queue.data).toMatchObject({ queue: expect.arrayContaining([
      expect.objectContaining({
        pcbiId: 'PCBI-IMPORTED-1', unspsc: '12345678', customerSpend: 12.5, transactionCount: 7,
        priority: 'P1 — Critical Coverage Gap', priorityScore: 100
      })
    ]) });
    expect(await route(env, '/commodity/PCBI-IMPORTED-1')).toMatchObject({
      data: { workspace: { overview: { commodityName: 'Imported steel index', requiredUnit: 'USD/MT' } } }
    });
    expect(await route(env, '/commodity/PCBI-STEEL-1')).toMatchObject({
      data: { workspace: { overview: { commodityName: 'Steel flat' } } }
    });
    expect(await route(env, '/commodity/PCBI-IMPORTED-2')).toMatchObject({
      data: { workspace: { overview: { commodityName: 'Imported copper index', requiredStartDate: '' } } }
    });
  });

  it('persists real CSV evidence in R2 and extracted rows in D1, then publishes validated weekly observations', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const upload = await route(env, '/upload-source', 'POST', validUpload());
    expect(upload.data).toMatchObject({ success: true, source: { extractionStatus: 'EXTRACTED', validationStatus: 'VALIDATED', extractedObservationsCount: 1 } });
    expect(db.batchCalls).toBe(1);
    expect(env.OBJECTS?.put).toHaveBeenCalledWith(expect.stringContaining('pcbi/commodities/PCBI-STEEL-1'), expect.any(Uint8Array), expect.any(Object));
    expect(db.sources).toHaveLength(1);
    expect(db.observations).toHaveLength(1);
    expect(await route(env, `/commodity/${BENCHMARK.pcbi_id}?tab=EXTRACTED_OBSERVATIONS`)).toMatchObject({
      data: { workspace: { extractedObservations: [{ sourceDate: '2026-10-01', normalizedValue: 105, status: 'VERIFIED' }] } }
    });
    expect((await route(env, '/queue')).data).toMatchObject({ queue: [{ currentStatus: 'PARTIAL_HISTORY', researchStatus: 'DATA_UPLOADED' }] });
    expect((await route(env, '/sources')).data).toMatchObject({ total: 1, sources: [{ documentName: 'steel-index.csv' }] });
    const approval = await route(env, '/approve', 'POST', {
      commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, approverName: 'Untrusted body name', comments: 'Reviewed source.'
    });
    expect(approval.data).toMatchObject({ result: { success: true, approvalStatus: 'ADMIN_APPROVED', catalogVersionCreated: true } });
    expect(db.promotions[0].approver_name).toBe('admin@example.test');
    expect(db.sources[0].approval_status).toBe('ADMIN_APPROVED');
    const seriesUrl = new URL(`https://edge.example/api/pcbi/indices/${BENCHMARK.pcbi_id}`);
    const publishedSeries = await handlePcbiRoute(db, `/indices/${BENCHMARK.pcbi_id}`, new Request(seriesUrl), seriesUrl);
    expect(publishedSeries.data).toMatchObject([{ pcbi_id: BENCHMARK.pcbi_id, index_value: 105, source: 'Steel market index' }]);
    expect((await route(env, '/queue')).data).toMatchObject({ queue: [{ currentStatus: 'PRODUCTION_READY', researchStatus: 'RESOLVED' }] });
    expect((await route(env, '/version-history')).data).toMatchObject({ total: 1, versions: [{ observation_count: 1 }] });
  });

  it('parses JSON observation packs, validates row specifications, and accepts a matching checksum', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const jsonBytes = JSON.stringify([{ date: '2026-10-08', price: '1,205', unit: 'INR/MT', currency: 'INR', geography: 'India' }]);
    const checksum = createHash('sha256').update(jsonBytes).digest('hex');
    const result = await route(env, '/upload-source', 'POST', validUpload({
      fileType: 'JSON', documentName: 'steel-index.json', checksum,
      fileBase64: Buffer.from(jsonBytes).toString('base64')
    }));
    expect(result.data).toMatchObject({ source: { extractionStatus: 'EXTRACTED', validationStatus: 'VALIDATED' } });
    expect(db.observations[0]).toMatchObject({ observation_date: '2026-10-08', raw_value: 1205, status: 'VERIFIED' });

    const serialRows = JSON.stringify({ observations: [
      null,
      'ignored',
      { week_start: 45500, index_value: 110, unit: 'INR/MT', currency: 'INR', geography: 'India' },
      { week_start: '2026-02-30', index_value: 111, unit: 'INR/MT', currency: 'INR', geography: 'India' },
      { week_start: '2026-10-08', index_value: 112, unit: 'INR/MT', currency: 'INR', geography: 'India' }
    ] });
    const serialResult = await route(env, '/upload-source', 'POST', validUpload({
      fileType: 'JSON', documentName: 'serial-and-duplicate.json',
      fileBase64: Buffer.from(serialRows).toString('base64')
    }));
    expect(serialResult.data).toMatchObject({ source: { extractionStatus: 'EXTRACTED', validationStatus: 'ISSUES_DETECTED' } });
    expect(db.observations).toHaveLength(3);
    expect(db.observations.some((row) => row.observation_date === new Date(Date.UTC(1899, 11, 30) + 45500 * 86400000).toISOString().slice(0, 10))).toBe(true);

    const defaults = validUpload({
      fileType: 'JSON', documentName: 'defaults.json',
      fileBase64: Buffer.from(JSON.stringify([{ date: '2026-10-15', price: 115 }])).toString('base64')
    });
    delete defaults.seriesId;
    delete defaults.unit;
    delete defaults.currency;
    delete defaults.geography;
    delete defaults.frequency;
    expect(await route(env, '/upload-source', 'POST', defaults)).toMatchObject({
      data: { source: { validationStatus: 'VALIDATED', unit: 'INR/MT', currency: 'INR', frequency: 'WEEKLY' } }
    });
  });

  it('extracts tabular TXT research evidence into D1 observations', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const result = await route(env, '/upload-source', 'POST', validUpload({
      fileType: 'TXT', documentName: 'weekly-steel-index.txt',
      fileBase64: Buffer.from('week_start,index_value\n2026-10-15,118.5\n').toString('base64')
    }));

    expect(result.data).toMatchObject({
      success: true,
      source: { extractionStatus: 'EXTRACTED', validationStatus: 'VALIDATED', extractedObservationsCount: 1 }
    });
    expect(db.observations[0]).toMatchObject({ observation_date: '2026-10-15', normalized_value: 118.5 });
  });

  it('handles rejected R2 writes, malformed files, and successful batch promotion', async () => {
    const db = new LabDatabase(false);
    const env = environment(db);
    expect(await route(env, '/upload-source', 'POST', validUpload({ pcbiId: 'UNKNOWN-PCBI' }))).toMatchObject({ status: 404 });
    vi.mocked(logger.warn).mockClear();
    const malformedJson = await route(env, '/upload-source', 'POST', validUpload({
      fileType: 'JSON', fileBase64: Buffer.from('{ invalid').toString('base64')
    }));
    expect(malformedJson.data).toMatchObject({
      source: { extractionStatus: 'FAILED', validationStatus: 'ISSUES_DETECTED' },
      banner: 'SOURCE_STAGED_WITH_ISSUES',
      message: D1_ROUTE_MESSAGES.pcbiDataLabFileInvalid
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'PCBI structured research source could not be parsed; source will be staged for review',
      expect.objectContaining({ requestId: 'req-lab-1', pcbiId: BENCHMARK.pcbi_id, fileType: 'JSON' }),
      expect.objectContaining({ name: 'SyntaxError' })
    );

    const failedR2 = environment(new LabDatabase());
    failedR2.OBJECTS = { put: vi.fn().mockRejectedValue(new Error('R2 offline')), get: vi.fn(), delete: vi.fn() };
    expect(await route(failedR2, '/upload-source', 'POST', validUpload())).toMatchObject({ status: 503 });

    const sourceCountBeforeUnavailableBatch = db.sources.length;
    const objectPutsBeforeUnavailableBatch = vi.mocked(env.OBJECTS!.put).mock.calls.length;
    const objectDeletesBeforeUnavailableBatch = vi.mocked(env.OBJECTS!.delete).mock.calls.length;
    const unavailableBatchUpload = await route(env, '/upload-source', 'POST', validUpload());
    expect(unavailableBatchUpload).toMatchObject({
      status: 503, data: { message: D1_ROUTE_MESSAGES.pcbiDataLabPersistenceFailed }
    });
    expect(db.sources).toHaveLength(sourceCountBeforeUnavailableBatch);
    expect(db.observations).toHaveLength(0);
    expect(vi.mocked(env.OBJECTS!.put)).toHaveBeenCalledTimes(objectPutsBeforeUnavailableBatch);
    expect(vi.mocked(env.OBJECTS!.delete)).toHaveBeenCalledTimes(objectDeletesBeforeUnavailableBatch);

    const batchEnvironment = environment(new LabDatabase());
    const upload = await route(batchEnvironment, '/upload-source', 'POST', validUpload());
    expect(upload.data).toMatchObject({ source: { validationStatus: 'VALIDATED' } });
    const approved = await route(batchEnvironment, '/approve', 'POST', { commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, approverName: 'Admin' });
    expect(approved.data).toMatchObject({ result: { success: true } });
    expect((batchEnvironment.DB as LabDatabase).sources[0]).toMatchObject({ approval_status: 'ADMIN_APPROVED' });
  });

  it('restores approval state when a D1 batch update fails', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    await route(env, '/upload-source', 'POST', validUpload());
    const previousSource = { ...db.sources[0] };
    db.failureSqlPatterns = ['UPDATE PCBICommoditySource'];
    db.failureAttemptNumbers = [1];

    await expect(route(env, '/approve', 'POST', {
      commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, approverName: 'Admin'
    })).rejects.toThrow(db.statementFailure);

    expect(db.promotions).toHaveLength(0);
    expect(db.sources[0]).toMatchObject({
      methodology_status: previousSource.methodology_status,
      approval_status: previousSource.approval_status
    });
    expect(logger.error).toHaveBeenCalledWith(
      D1_LOG_MESSAGES.atomicWriteFailed,
      expect.objectContaining({ requestId: 'req-lab-1', action: 'pcbi.data_lab.approve', statementCount: 2 }),
      db.statementFailure
    );
  });

  it('rolls back source approval when a later promotion insert in the D1 batch fails', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    await route(env, '/upload-source', 'POST', validUpload());
    const previousSource = { ...db.sources[0] };
    db.failureSqlPatterns = ['INSERT INTO PCBICommodityPromotion'];
    db.failureAttemptNumbers = [1];

    await expect(route(env, '/approve', 'POST', {
      commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, approverName: 'Admin'
    })).rejects.toThrow(db.statementFailure);

    expect(db.promotions).toHaveLength(0);
    expect(db.sources[0]).toMatchObject({
      methodology_status: previousSource.methodology_status,
      approval_status: previousSource.approval_status
    });
    expect(logger.error).toHaveBeenCalledWith(
      D1_LOG_MESSAGES.atomicWriteFailed,
      expect.objectContaining({ requestId: 'req-lab-1', action: 'pcbi.data_lab.approve', statementCount: 2 }),
      db.statementFailure
    );
  });

  it('rejects approval before changing source status when D1 batching is unavailable', async () => {
    const sourceEnvironment = environment(new LabDatabase());
    await route(sourceEnvironment, '/upload-source', 'POST', validUpload());
    const sourceDatabase = sourceEnvironment.DB as LabDatabase;
    const db = new LabDatabase(false);
    db.sources.push(...sourceDatabase.sources.map((row) => ({ ...row })));
    db.observations.push(...sourceDatabase.observations.map((row) => ({ ...row })));
    const previousSource = { ...db.sources[0] };

    await expect(route(environment(db), '/approve', 'POST', {
      commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, approverName: 'Admin'
    })).rejects.toThrow(D1_ROUTE_MESSAGES.atomicBatchUnavailable);

    expect(db.promotions).toHaveLength(0);
    expect(db.sources[0]).toMatchObject({
      methodology_status: previousSource.methodology_status,
      approval_status: previousSource.approval_status
    });
    expect(logger.error).toHaveBeenCalledWith(
      D1_LOG_MESSAGES.atomicBatchUnavailable,
      expect.objectContaining({ requestId: 'req-lab-1', operation: 'pcbi.data_lab.approve', sourceId: previousSource.source_id, fallback: 'none' }),
      expect.any(Error)
    );
  });

  it('rejects before side effects without D1 batching and cleans up R2 after batch failures', async () => {
    const atomicDb = new LabDatabase();
    atomicDb.failObservationInsertAt = 1;
    const atomicEnvironment = environment(atomicDb);
    const atomicObjectDelete = vi.fn().mockResolvedValue(undefined);
    atomicEnvironment.OBJECTS = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn(), delete: atomicObjectDelete };
    const atomicFailure = await route(atomicEnvironment, '/upload-source', 'POST', validUpload());
    expect(atomicFailure).toMatchObject({ status: 503, data: { message: D1_ROUTE_MESSAGES.pcbiDataLabPersistenceFailed } });
    expect(atomicDb.batchCalls).toBe(1);
    expect(atomicDb.sources).toHaveLength(0);
    expect(atomicDb.observations).toHaveLength(0);
    expect(atomicObjectDelete).toHaveBeenCalledWith(expect.stringContaining('pcbi/commodities/PCBI-STEEL-1'));

    const recoveryDb = new LabDatabase(false);
    const recoveryEnvironment = environment(recoveryDb);
    const recoveryObjectDelete = vi.fn().mockResolvedValue(undefined);
    recoveryEnvironment.OBJECTS = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn(), delete: recoveryObjectDelete };
    vi.mocked(logger.error).mockClear();
    const recovered = await route(recoveryEnvironment, '/upload-source', 'POST', validUpload());
    expect(recovered).toMatchObject({ status: 503, data: { message: D1_ROUTE_MESSAGES.pcbiDataLabPersistenceFailed } });
    expect(recoveryDb.sources).toHaveLength(0);
    expect(recoveryDb.observations).toHaveLength(0);
    expect(recoveryEnvironment.OBJECTS?.put).not.toHaveBeenCalled();
    expect(recoveryObjectDelete).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      D1_LOG_MESSAGES.atomicBatchUnavailable,
      expect.objectContaining({ requestId: 'req-lab-1', operation: 'pcbi.data_lab.upload.persist', sourceId: expect.any(String), fallback: 'none' }),
      expect.any(Error)
    );
    expect(logger.error).toHaveBeenCalledWith(
      'PCBI commodity source upload rejected before object storage or D1 writes',
      expect.objectContaining({ requestId: 'req-lab-1', operation: 'pcbi.data_lab.upload.persist', pcbiId: BENCHMARK.pcbi_id }),
      expect.any(Error)
    );

    const cleanupFailureDb = new LabDatabase();
    cleanupFailureDb.failObservationInsertAt = 1;
    const cleanupFailureEnvironment = environment(cleanupFailureDb);
    const objectCleanupFailure = new Error('R2 cleanup failed');
    cleanupFailureEnvironment.OBJECTS = {
      put: vi.fn().mockResolvedValue(undefined), get: vi.fn(), delete: vi.fn().mockRejectedValue(objectCleanupFailure)
    };
    const cleanupFailure = await route(cleanupFailureEnvironment, '/upload-source', 'POST', validUpload());
    expect(cleanupFailure).toMatchObject({ status: 503, data: { message: D1_ROUTE_MESSAGES.pcbiDataLabPersistenceFailed } });
    expect(cleanupFailureDb.sources).toHaveLength(0);
    expect(cleanupFailureDb.observations).toHaveLength(0);
    expect(cleanupFailureEnvironment.OBJECTS?.put).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to remove PCBI evidence object after D1 persistence failure',
      expect.objectContaining({ requestId: 'req-lab-1', pcbiId: BENCHMARK.pcbi_id }),
      objectCleanupFailure
    );
  });

  it('blocks catalog promotion when source metadata or observation review status fails validation', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    await route(env, '/upload-source', 'POST', validUpload());
    const source = db.sources[0];
    const approve = () => route(env, '/approve', 'POST', {
      commodityId: source.commodity_id, pcbiId: source.pcbi_id, approverName: 'Admin'
    });

    source.frequency = 'MONTHLY';
    expect(await approve()).toMatchObject({ status: 422 });
    source.frequency = 'WEEKLY';
    source.unit = null as unknown as string;
    expect(await approve()).toMatchObject({ status: 422 });
    source.unit = 'KG';
    expect(await approve()).toMatchObject({ status: 422 });
    source.unit = BENCHMARK.benchmark_unit;
    source.currency = 'USD';
    expect(await approve()).toMatchObject({ status: 422 });
    source.currency = BENCHMARK.currency;
    source.geography = 'Global';
    expect(await approve()).toMatchObject({ status: 422 });
    source.geography = BENCHMARK.geography;
    db.observations[0].status = 'NEEDS_REVIEW';
    expect(await approve()).toMatchObject({ status: 422 });
    db.observations[0].status = 'VERIFIED';

    db.promotions.push({
      promotion_id: 'PROMOTION-EXISTING', catalog_version_id: 'PCBI-EXISTING', source_id: source.source_id,
      commodity_id: source.commodity_id, pcbi_id: source.pcbi_id, approver_name: 'existing-admin@example.test',
      comments: null, promoted_at: '2026-11-01T00:00:00.000Z', observation_count: 1
    });
    expect(await approve()).toMatchObject({ status: 422 });
    db.promotions.pop();

    await approve();
    expect(await approve()).toMatchObject({ status: 422 });
  });

  it('extracts PDF research prices into D1 and only allows promotion after source checks pass', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const fileBase64 = Buffer.from('%PDF-1.4 commodity benchmark report').toString('base64');
    generateGeminiJsonMock.mockResolvedValueOnce({
      status: 'SUCCESS',
      data: { observations: [
        { observationDate: '2026-10-01', value: 125.5, unit: 'INR/MT', currency: 'INR', geography: 'India' },
        { observationDate: '2026-10-08', value: 128.25, unit: 'INR/MT', currency: 'INR', geography: 'India' }
      ] },
      model: 'gemini-test',
      error: null
    });

    const upload = await route(env, '/upload-source', 'POST', validUpload({
      fileType: 'PDF', documentName: 'steel-price-index.pdf', fileBase64
    }));

    expect(configureGeminiMock).toHaveBeenCalledWith(env);
    expect(generateGeminiJsonMock).toHaveBeenCalledWith(expect.objectContaining({
      inlineData: fileBase64, mimeType: 'application/pdf', fileName: 'steel-price-index.pdf'
    }));
    expect(upload.data).toMatchObject({
      success: true,
      source: { extractionStatus: 'EXTRACTED', validationStatus: 'VALIDATED', extractedObservationsCount: 2 }
    });
    expect(db.observations).toEqual(expect.arrayContaining([
      expect.objectContaining({ observation_date: '2026-10-01', normalized_value: 125.5, status: 'VERIFIED' }),
      expect.objectContaining({ observation_date: '2026-10-08', normalized_value: 128.25, status: 'VERIFIED' })
    ]));
  });

  it('keeps PDF evidence staged with actionable status when extraction is unavailable or invalid', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const upload = await route(env, '/upload-source', 'POST', validUpload({
      fileType: 'PDF', fileBase64: Buffer.from('%PDF-1.4').toString('base64'), documentName: 'market-report.pdf'
    }));
    expect(upload.data).toMatchObject({
      message: D1_ROUTE_MESSAGES.pcbiDataLabPdfExtractionUnavailable,
      source: { extractionStatus: 'FAILED', validationStatus: 'ISSUES_DETECTED', extractedObservationsCount: 0 }
    });
    const approval = await route(env, '/approve', 'POST', { commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, approverName: 'Admin' });
    expect(approval).toMatchObject({ status: 422, data: { message: D1_ROUTE_MESSAGES.pcbiDataLabApprovalBlocked } });

    generateGeminiJsonMock.mockResolvedValueOnce({ status: 'SUCCESS', data: { observations: [] }, model: 'gemini-test', error: null });
    const invalid = await route(env, '/upload-source', 'POST', validUpload({
      fileType: 'PDF', fileBase64: Buffer.from('%PDF-1.4').toString('base64'), documentName: 'steel-price-index.pdf'
    }));
    expect(invalid.data).toMatchObject({
      message: D1_ROUTE_MESSAGES.pcbiDataLabPdfExtractionFailed,
      source: { extractionStatus: 'FAILED', validationStatus: 'ISSUES_DETECTED' }
    });
  });

  it('rejects files that cannot be validated, mismatch the benchmark, have bad checksums, or contain customer purchase data', async () => {
    const db = new LabDatabase();
    const env = environment(db);
    const wrongUnit = await route(env, '/upload-source', 'POST', validUpload({ unit: 'KG' }));
    expect(wrongUnit.data).toMatchObject({ source: { validationStatus: 'ISSUES_DETECTED' } });
    expect((await route(env, '/queue')).data).toMatchObject({ queue: [{ currentStatus: 'PARTIAL_HISTORY', researchStatus: 'DATA_UPLOADED', sourceStatus: 'ISSUES_DETECTED' }] });
    expect((await route(env, '/approve', 'POST', { commodityId: 'COM-STEEL-1', pcbiId: BENCHMARK.pcbi_id, approverName: 'Admin' })).status).toBe(422);
    expect(await route(env, '/upload-source', 'POST', validUpload({ checksum: 'bad' }))).toMatchObject({ status: 400 });
    expect(await route(env, '/upload-source', 'POST', validUpload({ documentName: 'Customer_PO.csv' }))).toMatchObject({ status: 422 });
    const invalidRows = await route(env, '/upload-source', 'POST', validUpload({
      documentName: 'index-data.csv', fileBase64: csvBase64('week_start,index_value\nnot-a-date,0\n')
    }));
    expect(invalidRows.data).toMatchObject({ source: { extractionStatus: 'FAILED', validationStatus: 'ISSUES_DETECTED' } });
  });

  it('handles missing files, unavailable R2, malformed or oversized base64, unsupported paths, and methods', async () => {
    const env = environment();
    expect(await route(env, '/upload-source', 'POST', validUpload({ fileBase64: '' }))).toMatchObject({ status: 400 });
    expect(await route(env, '/upload-source', 'POST', validUpload({ fileBase64: ' ' }))).toMatchObject({ status: 400 });
    expect(await route({ DB: env.DB }, '/upload-source', 'POST', validUpload())).toMatchObject({ status: 503 });
    expect(await route(env, '/upload-source', 'POST', validUpload({ fileBase64: '💥' }))).toMatchObject({ status: 400 });
    expect(await route(env, '/upload-source', 'POST', validUpload({ fileBase64: 'A'.repeat(15_000_000) }))).toMatchObject({ status: 413 });
    expect(await route(env, '/unknown')).toMatchObject({ status: 404 });
    expect(await route(env, '/queue', 'POST')).toMatchObject({ status: 405 });
    expect(await route(env, '/approve', 'GET')).toMatchObject({ status: 405 });
    expect(await route(env, '/detect-domain', 'GET')).toMatchObject({ status: 405 });
    expect(await route(env, '/upload-source', 'GET')).toMatchObject({ status: 405 });

    const malformedUpload = request('/upload-source', 'POST');
    const malformedBody = new Request(malformedUpload.url, { method: 'POST', body: '{' });
    expect(await handlePcbiDataLabRoute(env, malformedBody, new URL(malformedBody.url), 'admin')).toMatchObject({ status: 400 });
    const malformedDetection = request('/detect-domain', 'POST');
    const malformedDetectionBody = new Request(malformedDetection.url, { method: 'POST', body: '{' });
    expect(await handlePcbiDataLabRoute(env, malformedDetectionBody, new URL(malformedDetectionBody.url), 'admin')).toMatchObject({ status: 400 });
    const malformedApproval = request('/approve', 'POST');
    const malformedApprovalBody = new Request(malformedApproval.url, { method: 'POST', body: '{' });
    expect(await handlePcbiDataLabRoute(env, malformedApprovalBody, new URL(malformedApprovalBody.url), 'admin')).toMatchObject({ status: 400 });
  });
});

