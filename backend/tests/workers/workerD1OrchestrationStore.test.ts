import { describe, expect, it, vi } from 'vitest';
import type { CloudflareD1PreparedStatement } from '../../src/types/cloudflare';
import type { OrchestrationDatabase, OrchestrationRuntime } from '../../src/types/orchestrationD1';
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
  runAtomically
} from '../../src/workerD1OrchestrationStore';
import {
  createHarness,
  seedStandardFixtures,
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
  batch: withBatch ? vi.fn(async (statements: CloudflareD1PreparedStatement[]) => statements.map(() => ({}))) : undefined
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
    await runAtomically(database, [first.statement, second.statement]);
    expect(database.batch).toHaveBeenCalledTimes(1);
    expect(first.runs()).toBe(0);
  });

  it('runs each statement in order when the binding has no batch', async () => {
    const first = fakeStatement();
    const second = fakeStatement();
    await runAtomically(fakeDatabase(first.statement, false), [first.statement, second.statement]);
    expect(first.runs()).toBe(1);
    expect(second.runs()).toBe(1);
  });
});

describe('count and sequence defaults', () => {
  it('returns zero open corrections and sequence one when the query returns no row', async () => {
    const empty = fakeDatabase(fakeStatement().statement, false);
    expect(await countOpenCorrections(empty, null)).toBe(0);
    expect(await countOpenCorrections(empty, 'AIC-1')).toBe(0);
    expect(await nextReportSequence(empty, 'AIC-1')).toBe(1);
  });

  it('reads the open correction count and next sequence from the returned row', async () => {
    const counted = fakeDatabase(fakeStatement({ first: { open_count: 4, next_sequence: 3 } }).statement, false);
    expect(await countOpenCorrections(counted, null)).toBe(4);
    expect(await nextReportSequence(counted, 'AIC-1')).toBe(3);
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
      expect(await listJobRows(harness.database, null)).toHaveLength(8);
      expect(await listJobRows(harness.database, 'cust-user-b')).toHaveLength(1);
      expect(await findJobRow(harness.database, 'AIC-ZZZ')).toBeNull();
      expect(await findJobRow(harness.database, 'AIC-A1')).toMatchObject({ customer_id: 'cust-user-a' });
      expect(await listCorrectionRows(harness.database, 'AIC-A1')).toEqual([]);
    } finally {
      harness.close();
    }
  });
});
