import { afterEach, describe, expect, it, vi } from 'vitest';
import { D1_QUERY_LOG_MESSAGES, D1_RUNTIME_RECENT_AUDIT_LIMIT } from '../../src/constants/db';
import type {
  CloudflareD1Database,
  CloudflareD1PreparedStatement,
  CloudflareD1QueryResult
} from '../../src/types/cloudflare';
import {
  createD1RequestMetrics,
  getD1RuntimeMetrics,
  instrumentD1Database,
  isD1DatabaseInstrumented,
  recordD1CacheAccess
} from '../../src/services/d1QueryTelemetry';
import logger from '../../src/utils/logger';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

type QueryFixture = {
  prepareFailure?: Error;
  firstResult?: Record<string, unknown> | null;
  allResult?: CloudflareD1QueryResult<Record<string, unknown>>;
  runResult?: unknown;
  executeFailure?: unknown;
  bindFailure?: Error;
};

class FakeStatement implements CloudflareD1PreparedStatement {
  constructor(private readonly fixture: QueryFixture) {}
  bind(): CloudflareD1PreparedStatement {
    if (this.fixture.bindFailure) throw this.fixture.bindFailure;
    return this;
  }
  async first<T>(): Promise<T | null> {
    if (this.fixture.executeFailure !== undefined) throw this.fixture.executeFailure;
    return (this.fixture.firstResult ?? null) as T | null;
  }
  async all<T>(): Promise<CloudflareD1QueryResult<T>> {
    if (this.fixture.executeFailure !== undefined) throw this.fixture.executeFailure;
    return (this.fixture.allResult || { results: [] }) as CloudflareD1QueryResult<T>;
  }
  async run(): Promise<unknown> {
    if (this.fixture.executeFailure !== undefined) throw this.fixture.executeFailure;
    return this.fixture.runResult || { success: true };
  }
}

class FakeDatabase implements CloudflareD1Database {
  readonly statements: CloudflareD1PreparedStatement[] = [];
  constructor(private readonly fixture: QueryFixture = {}, private readonly batchFailure?: Error) {}
  prepare(): CloudflareD1PreparedStatement {
    if (this.fixture.prepareFailure) throw this.fixture.prepareFailure;
    const statement = new FakeStatement(this.fixture);
    this.statements.push(statement);
    return statement;
  }
  async batch(statements: CloudflareD1PreparedStatement[]): Promise<unknown[]> {
    if (this.batchFailure) throw this.batchFailure;
    return statements.map(() => ({ meta: { rows_written: 1, changes: 1 } }));
  }
}

describe('request-scoped D1 query telemetry', () => {
  afterEach(() => vi.clearAllMocks());

  it('records row scans, affected rows, timing, model, and request correlation for bound queries', async () => {
    const database = new FakeDatabase({
      allResult: { results: [{ id: 'TX-1' }], meta: { rows_read: 10001, duration: 5 } }
    });
    const metrics = createD1RequestMetrics();
    const instrumented = instrumentD1Database(database, 'req-scan', metrics);

    await instrumented.prepare('SELECT * FROM ProcurementTransaction WHERE tenant_id = ?').bind('T-1').all();

    expect(metrics).toMatchObject({ totalQueries: 1, slowQueries: 1, totalRowsRead: 10001 });
    expect(logger.warn).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.slow, expect.objectContaining({
      requestId: 'req-scan', operation: 'SELECT', model: 'ProcurementTransaction',
      rowsRead: 10001, affectedRows: 1, cacheStatus: 'miss'
    }));
    expect(isD1DatabaseInstrumented(instrumented)).toBe(true);
    expect(isD1DatabaseInstrumented(database)).toBe(false);
  });

  it('records first and run operations and warns when Cloudflare reports a slow duration', async () => {
    const database = new FakeDatabase({
      firstResult: null,
      runResult: { meta: { duration: 150, rows_written: 2, changes: 2 } }
    });
    const metrics = createD1RequestMetrics();
    const instrumented = instrumentD1Database(database, 'req-write', metrics);

    await instrumented.prepare('SELECT 1').first();
    await instrumented.prepare('UPDATE TenantMaster SET status = ?').bind('ACTIVE').run();

    expect(metrics).toMatchObject({ totalQueries: 2, slowQueries: 1, totalRowsWritten: 2 });
    expect(logger.debug).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.completed, expect.objectContaining({
      requestId: 'req-write', operation: 'SELECT', affectedRows: 0
    }));
    expect(logger.warn).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.slow, expect.objectContaining({
      operation: 'UPDATE', model: 'TenantMaster', databaseDurationMs: 150, affectedRows: 2
    }));
  });

  it('records failed prepare, bind, and execution attempts before rethrowing', async () => {
    const prepareError = new Error('prepare failed');
    const bindError = new Error('bind failed');
    const executeError = new Error('query failed');
    const metrics = createD1RequestMetrics();
    const prepareFailure = instrumentD1Database(new FakeDatabase({ prepareFailure: prepareError }), 'req-fail', metrics);
    const bindFailure = instrumentD1Database(new FakeDatabase({ bindFailure: bindError }), 'req-fail', metrics);
    const executeFailure = instrumentD1Database(new FakeDatabase({ executeFailure: executeError }), 'req-fail', metrics);

    expect(() => prepareFailure.prepare('SELECT * FROM TenantMaster')).toThrow(prepareError);
    expect(() => bindFailure.prepare('SELECT * FROM TenantMaster').bind('T-1')).toThrow(bindError);
    await expect(executeFailure.prepare('SELECT * FROM TenantMaster').all()).rejects.toThrow(executeError);

    expect(metrics).toMatchObject({ totalQueries: 3, failedQueries: 3 });
    expect(logger.error).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.failed, expect.objectContaining({
      requestId: 'req-fail', operation: 'SELECT', model: 'TenantMaster'
    }), executeError);
  });

  it('unwraps prepared statements for D1 batch and records each statement result', async () => {
    const database = new FakeDatabase();
    const metrics = createD1RequestMetrics();
    const instrumented = instrumentD1Database(database, 'req-batch', metrics);
    const statements = [
      instrumented.prepare('UPDATE TenantMaster SET status = ?').bind('ACTIVE'),
      instrumented.prepare('INSERT INTO AuditLog (id) VALUES (?)').bind('LOG-1')
    ];
    const clock = vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(140);

    await instrumented.batch?.(statements);

    expect(database.statements).toHaveLength(2);
    expect(metrics).toMatchObject({ totalQueries: 2, totalRowsWritten: 2, totalDurationMs: 40 });
    expect(getD1RuntimeMetrics(instrumented).averageDurationMs).toBe(20);
    expect(logger.debug).toHaveBeenCalledTimes(2);
    expect(logger.debug).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.completed, expect.objectContaining({
      requestId: 'req-batch', operation: 'INSERT', model: 'AuditLog', affectedRows: 1,
      durationMs: 20, durationSource: 'batch-allocation', batchDurationMs: 40, batchSize: 2,
      batchStatementIndex: 2, wallDurationMs: 40
    }));
    expect(getD1RuntimeMetrics(instrumented).recentAudits[0]).toMatchObject({
      durationMs: 20, wallDurationMs: 40, durationSource: 'batch-allocation',
      batchDurationMs: 40, batchSize: 2, batchStatementIndex: 2
    });
    clock.mockRestore();
  });

  it('uses D1 per-statement durations and warns once when batch latency is slow', async () => {
    const database = new FakeDatabase();
    const metrics = createD1RequestMetrics();
    const instrumented = instrumentD1Database(database, 'req-batch-slow', metrics);
    const statements = [
      instrumented.prepare('UPDATE TenantMaster SET status = ?').bind('ACTIVE'),
      instrumented.prepare('INSERT INTO AuditLog (id) VALUES (?)').bind('LOG-1')
    ];
    const clock = vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(300);
    database.batch = async () => [
      { meta: { duration: 20, rows_written: 1, changes: 1 } },
      { meta: { duration: 30, rows_written: 1, changes: 1 } }
    ];

    await instrumented.batch?.(statements);

    expect(metrics).toMatchObject({ totalQueries: 2, totalDurationMs: 50, slowQueries: 0 });
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.slowBatch, expect.objectContaining({
      requestId: 'req-batch-slow', operation: 'BATCH', durationMs: 200, batchSize: 2
    }));
    expect(logger.debug).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.completed, expect.objectContaining({
      requestId: 'req-batch-slow', durationMs: 30, databaseDurationMs: 30,
      durationSource: 'database', batchDurationMs: 200, batchStatementIndex: 2,
      wallDurationMs: 200
    }));
    clock.mockRestore();
  });

  it('falls back to measured batch allocation when a D1 result has no metadata', async () => {
    const database = new FakeDatabase();
    database.batch = async () => [null, { meta: null }];
    const metrics = createD1RequestMetrics();
    const instrumented = instrumentD1Database(database, 'req-batch-no-meta', metrics);
    const statements = [
      instrumented.prepare('UPDATE TenantMaster SET status = ?').bind('ACTIVE'),
      instrumented.prepare('INSERT INTO AuditLog (id) VALUES (?)').bind('LOG-1')
    ];

    await instrumented.batch?.(statements);

    expect(metrics).toMatchObject({ totalQueries: 2 });
    expect(getD1RuntimeMetrics(instrumented).recentAudits).toEqual(expect.arrayContaining([
      expect.objectContaining({ durationSource: 'batch-allocation', batchSize: 2 })
    ]));
  });

  it('logs batch failures and leaves an unsupported batch binding undefined', async () => {
    const failure = new Error('batch failed');
    const metrics = createD1RequestMetrics();
    const failedDatabase = instrumentD1Database(new FakeDatabase({}, failure), 'req-batch-fail', metrics);
    const statement = failedDatabase.prepare('DELETE FROM TenantMaster WHERE tenant_id = ?').bind('T-1');

    await expect(failedDatabase.batch?.([statement, new FakeStatement({})])).rejects.toThrow(failure);

    const noBatch = { prepare: (sql: string) => new FakeStatement({ allResult: { results: [] } }) };
    const withoutBatch = instrumentD1Database(noBatch, 'req-no-batch', createD1RequestMetrics());
    expect(withoutBatch.batch).toBeUndefined();
    expect(metrics).toMatchObject({ totalQueries: 1, failedQueries: 1 });
    expect(logger.error).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.failed, expect.objectContaining({
      requestId: 'req-batch-fail', operation: 'DELETE', model: 'TenantMaster'
    }), failure);
  });

  it('uses safe fallbacks for statements without a recognizable SQL operation or table', async () => {
    const metrics = createD1RequestMetrics();
    const database = instrumentD1Database(new FakeDatabase({ firstResult: { ok: 1 } }), 'req-unknown', metrics);

    await database.prepare('???').first();

    expect(logger.debug).toHaveBeenCalledWith(D1_QUERY_LOG_MESSAGES.completed, expect.objectContaining({
      operation: 'UNKNOWN', model: undefined
    }));
  });

  it('aggregates query and cache metrics per database with correlated bounded audit rows', async () => {
    const database = new FakeDatabase({
      allResult: { results: [{ id: 'TEN-1' }], meta: { changes: 1 } }
    });
    const metrics = createD1RequestMetrics();
    const instrumented = instrumentD1Database(database, 'req-metrics', metrics);

    recordD1CacheAccess(instrumented, 'miss');
    recordD1CacheAccess(instrumented, 'hit');
    recordD1CacheAccess(instrumented, 'coalesced');
    await instrumented.prepare('SELECT * FROM TenantMaster').all();

    expect(metrics).toMatchObject({ totalQueries: 1, cacheHits: 2, cacheMisses: 1 });
    expect(getD1RuntimeMetrics(instrumented)).toMatchObject({
      totalQueries: 1,
      cacheHits: 2,
      cacheMisses: 1,
      cacheHitRatio: 2 / 3,
      averageDurationMs: expect.any(Number),
      recentAudits: [expect.objectContaining({
        queryId: 'req-metrics:1', requestId: 'req-metrics', operation: 'SELECT',
        model: 'TenantMaster', cached: false, rowsAffected: 1
      })]
    });
    expect(getD1RuntimeMetrics(new FakeDatabase())).toMatchObject({
      totalQueries: 0, cacheHits: 0, cacheMisses: 0, cacheHitRatio: 0, recentAudits: []
    });
  });

  it('retains only the configured number of recent query audit rows', async () => {
    const instrumented = instrumentD1Database(new FakeDatabase(), 'req-audit-cap', createD1RequestMetrics());

    for (let index = 0; index <= D1_RUNTIME_RECENT_AUDIT_LIMIT; index += 1) {
      await instrumented.prepare('SELECT 1').first();
    }

    const audits = getD1RuntimeMetrics(instrumented).recentAudits;
    expect(audits).toHaveLength(D1_RUNTIME_RECENT_AUDIT_LIMIT);
    expect(audits[0]?.queryId).toBe(`req-audit-cap:${D1_RUNTIME_RECENT_AUDIT_LIMIT + 1}`);
    expect(audits[audits.length - 1]?.queryId).toBe('req-audit-cap:2');
  });

  it('preserves unwrapped database methods and safely handles incomplete batch results', async () => {
    const nativeDatabase = new FakeDatabase() as FakeDatabase & { probe: () => boolean };
    nativeDatabase.probe = function probe() { return this === nativeDatabase; };
    nativeDatabase.batch = async () => undefined as unknown as unknown[];
    const instrumented = instrumentD1Database(nativeDatabase, 'req-adapter', createD1RequestMetrics());

    expect(instrumented.probe()).toBe(true);
    await instrumented.batch?.([new FakeStatement({})]);
    expect(logger.debug).not.toHaveBeenCalled();
  });
});
