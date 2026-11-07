import { describe, expect, it, vi } from 'vitest';
import type { CloudflareD1PreparedStatement } from '../../src/types/cloudflare';
import type { OrchestrationDatabase, OrchestrationRuntime } from '../../src/types/orchestrationD1';
import logger from '../../src/utils/logger';
import {
  buildAuditEvent,
  buildNotificationInput,
  buildNotificationRow,
  changedRowCount,
  compareAndSet,
  countOpenCorrections,
  findJobRow,
  listCorrectionRows,
  listJobRows,
  nextReportSequence,
  runAtomically,
  runCompareAndSetAtomically
} from '../../src/workerD1OrchestrationStore';
import {
  createHarness,
  seedStandardFixtures,
  TEST_TENANT_ID,
  type OrchestrationHarness
} from './orchestrationTestHarness';

vi.mock('../../src/utils/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

interface FakeStatement {
  statement: CloudflareD1PreparedStatement;
  runs: () => number;
}

/** A statement whose first(), all() and run() return fixed values, and which counts run() calls. */
const fakeStatement = (values: { first?: unknown; all?: unknown[]; run?: unknown } = {}): FakeStatement => {
  let runCount = 0;
  const statement = {
    bind: () => statement,
    first: async () => values.first ?? null,
    all: async () => ({ results: values.all ?? [] }),
    run: async () => {
      runCount += 1;
      return values.run ?? { meta: { changes: 1 } };
    }
  };
  return {
    statement: statement as unknown as CloudflareD1PreparedStatement,
    runs: () => runCount
  };
};

const fakeDatabase = (statement: CloudflareD1PreparedStatement, withBatch: boolean): OrchestrationDatabase => ({
  prepare: () => statement,
  batch: withBatch
    ? vi.fn(async (statements: CloudflareD1PreparedStatement[]) =>
      statements.map((_statement, index) => index === 0 ? { meta: { changes: 1 } } : {}))
    : undefined
});

const runtime: OrchestrationRuntime = {
  now: () => '2026-01-05T00:00:00.000Z',
  createId: (prefix: string) => `${prefix}-fixed`
};

describe('changedRowCount', () => {
  it.each([
    ['a non-object result', 'changed'],
    ['null', null],
    ['an object without meta', { success: true }],
    ['meta that is not an object', { meta: 5 }],
    ['meta without changes', { meta: {} }],
    ['changes that is not a number', { meta: { changes: '3' } }]
  ])('counts zero changes for %s', (_label, result) => {
    expect(changedRowCount(result)).toBe(0);
  });

  it('reads the changed-row count from D1 metadata', () => {
    expect(changedRowCount({ success: true, meta: { changes: 2 } })).toBe(2);
  });
});

describe('compareAndSet', () => {
  it('succeeds only when exactly one row changed', async () => {
    expect(await compareAndSet(fakeStatement({ run: { meta: { changes: 1 } } }).statement)).toBe(true);
    expect(await compareAndSet(fakeStatement({ run: { meta: { changes: 0 } } }).statement)).toBe(false);
    expect(await compareAndSet(fakeStatement({ run: { meta: { changes: 2 } } }).statement)).toBe(false);
  });
});

describe('runAtomically', () => {
  it('uses the binding batch when it is available', async () => {
    const first = fakeStatement();
    const second = fakeStatement();
    const database = fakeDatabase(first.statement, true);
    await runAtomically(database, [first.statement, second.statement], {
      requestId: 'req-atomic-batch',
      tenantId: TEST_TENANT_ID,
      assessmentId: 'AIC-BATCH',
      action: '/api/orchestration/jobs/AIC-BATCH/write'
    });
    expect(database.batch).toHaveBeenCalledTimes(1);
    expect(first.runs()).toBe(0);
  });

  it('rejects a multi-statement write before running any statement when batch is unavailable', async () => {
    const first = fakeStatement();
    const second = fakeStatement();
    await expect(runAtomically(fakeDatabase(first.statement, false), [first.statement, second.statement], {
      requestId: 'req-atomic-test',
      tenantId: TEST_TENANT_ID,
      assessmentId: 'AIC-ATOMIC',
      action: '/api/orchestration/jobs/AIC-ATOMIC/quality-gate'
    })).rejects.toMatchObject({ statusCode: 503 });
    expect(first.runs()).toBe(0);
    expect(second.runs()).toBe(0);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('transactional D1 batch support is unavailable'),
      expect.objectContaining({
        requestId: 'req-atomic-test',
        tenantId: TEST_TENANT_ID,
        assessmentId: 'AIC-ATOMIC',
        action: '/api/orchestration/jobs/AIC-ATOMIC/quality-gate',
        statementCount: 2
      }),
      expect.any(Error)
    );
  });

  it('allows a single independent statement when batch is unavailable', async () => {
    const first = fakeStatement();
    await runAtomically(fakeDatabase(first.statement, false), [first.statement], {
      requestId: 'req-atomic-single',
      tenantId: TEST_TENANT_ID,
      assessmentId: 'AIC-SINGLE',
      action: '/api/orchestration/jobs/AIC-SINGLE/write'
    });
    expect(first.runs()).toBe(1);
  });

  it('logs and rethrows a failed batch with request and tenant context', async () => {
    const failure = new Error('audit storage unavailable');
    const statement = fakeStatement();
    const database = fakeDatabase(statement.statement, true);
    database.batch = vi.fn(async () => { throw failure; });

    await expect(runAtomically(database, [statement.statement, statement.statement], {
      requestId: 'req-atomic-failure',
      tenantId: TEST_TENANT_ID,
      assessmentId: 'AIC-ATOMIC-FAILURE',
      action: '/api/orchestration/jobs/AIC-ATOMIC-FAILURE/submit'
    })).rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith(
      'Orchestration D1 atomic write failed',
      expect.objectContaining({
        requestId: 'req-atomic-failure',
        tenantId: TEST_TENANT_ID,
        assessmentId: 'AIC-ATOMIC-FAILURE',
        statementCount: 2,
        batch: true,
        durationMs: expect.any(Number)
      }),
      failure
    );
  });
});

describe('runCompareAndSetAtomically', () => {
  it('returns true only when the state transition changes exactly one row', async () => {
    const statement = fakeStatement();
    const database = fakeDatabase(statement.statement, true);

    await expect(runCompareAndSetAtomically(database, statement.statement, [statement.statement], {
      requestId: 'req-cas-atomic',
      tenantId: TEST_TENANT_ID,
      assessmentId: 'AIC-CAS-ATOMIC',
      action: '/api/orchestration/jobs/AIC-CAS-ATOMIC/submit'
    })).resolves.toBe(true);
    expect(database.batch).toHaveBeenCalledWith([statement.statement, statement.statement]);
  });

  it('returns false and still executes the guarded transaction when the state transition changes no rows', async () => {
    const statement = fakeStatement();
    const database = fakeDatabase(statement.statement, true);
    database.batch = vi.fn(async () => [{ meta: { changes: 0 } }, {}]);

    await expect(runCompareAndSetAtomically(database, statement.statement, [statement.statement], {
      requestId: 'req-cas-conflict',
      tenantId: TEST_TENANT_ID,
      assessmentId: 'AIC-CAS-CONFLICT',
      action: '/api/orchestration/jobs/AIC-CAS-CONFLICT/submit'
    })).resolves.toBe(false);
    expect(database.batch).toHaveBeenCalledTimes(1);
  });
});

describe('count and sequence defaults', () => {
  it('returns zero open corrections and sequence one when the query returns no row', async () => {
    const empty = fakeDatabase(fakeStatement().statement, false);
    expect(await countOpenCorrections(empty, null, TEST_TENANT_ID)).toBe(0);
    expect(await countOpenCorrections(empty, 'AIC-1', TEST_TENANT_ID)).toBe(0);
    expect(await nextReportSequence(empty, 'AIC-1', TEST_TENANT_ID)).toBe(1);
  });

  it('reads the open correction count and next sequence from the returned row', async () => {
    const counted = fakeDatabase(fakeStatement({ first: { open_count: 4, next_sequence: 3 } }).statement, false);
    expect(await countOpenCorrections(counted, null, TEST_TENANT_ID)).toBe(4);
    expect(await nextReportSequence(counted, 'AIC-1', TEST_TENANT_ID)).toBe(3);
  });
});

describe('builders', () => {
  it('stamps audit events with an id and the runtime time', () => {
    const event = buildAuditEvent(runtime, {
      tenantId: 'cust-1',
      assessmentId: 'AIC-1',
      actorId: 'usr-admin-001',
      actorRole: 'ADMIN',
      eventType: 'REPORT_GENERATED',
      entityType: 'ReportVersion',
      entityId: 'RPT-1',
      previousState: null,
      newState: 'ADMIN_REVIEW',
      metadata: null
    });
    expect(event).toMatchObject({ eventId: 'aud-fixed', createdAt: '2026-01-05T00:00:00.000Z' });
  });

  it('stamps notifications with an id and the runtime time, and maps them to rows', () => {
    const input = buildNotificationInput(runtime, {
      recipientType: 'ADMIN',
      tenantId: 'cust-1',
      assessmentId: 'AIC-1',
      reportVersionId: null,
      title: 'Title',
      message: 'Message',
      severity: 'WARNING',
      emailStatus: null,
      emailLastError: null
    });
    expect(input).toMatchObject({ notificationId: 'notif-fixed', createdAt: '2026-01-05T00:00:00.000Z' });
    expect(buildNotificationRow(input)).toMatchObject({
      notification_id: 'notif-fixed',
      read_flag: 0,
      email_retry_count: 0,
      severity: 'WARNING',
      email_status: null
    });
  });
});

describe('reads against the SQLite schema', () => {
  let harness: OrchestrationHarness;

  it('lists jobs for everyone and for one customer, and finds a single job', async () => {
    harness = createHarness();
    seedStandardFixtures(harness.sqlite);
    try {
      expect(await listJobRows(harness.database, TEST_TENANT_ID, null)).toHaveLength(8);
      expect(await listJobRows(harness.database, TEST_TENANT_ID, 'cust-user-b')).toHaveLength(1);
      expect(await findJobRow(harness.database, 'AIC-ZZZ', TEST_TENANT_ID)).toBeNull();
      expect(await findJobRow(harness.database, 'AIC-A1', TEST_TENANT_ID)).toMatchObject({ customer_id: 'cust-user-a', tenant_id: TEST_TENANT_ID });
      expect(await listCorrectionRows(harness.database, 'AIC-A1', TEST_TENANT_ID)).toEqual([]);
    } finally {
      harness.close();
    }
  });
});
