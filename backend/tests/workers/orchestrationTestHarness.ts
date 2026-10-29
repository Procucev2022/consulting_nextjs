/**
 * Test harness for the Analysis Orchestration Worker API. Runs the real SQL against an in-memory SQLite
 * database created from d1-schema.sql, so the tests exercise the same statements that run on D1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
import { AUTH_TOKEN_EXPIRY_SECONDS } from '../../src/constants/auth';
import { handleOrchestrationRequest } from '../../src/workerD1Orchestration';
import type { CloudflareD1PreparedStatement, CloudflareEnvironment } from '../../src/types/cloudflare';
import type { OrchestrationDatabase, OrchestrationRuntime } from '../../src/types/orchestrationD1';

export interface SqliteStatementLike {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): { changes: number | bigint };
}

export interface SqliteDatabaseLike {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatementLike;
  close(): void;
}

interface SqliteModule {
  DatabaseSync: new (location: string) => SqliteDatabaseLike;
}

const { DatabaseSync } = createRequire(path.join(__dirname, 'orchestrationTestHarness.ts'))('node:sqlite') as SqliteModule;
const SCHEMA_PATH = path.resolve(__dirname, '../../d1-schema.sql');

export const TEST_AUTH_SECRET = 'orchestration-test-secret-0123456789';

export const ADMIN_ID = 'usr-admin-001';
export const CUSTOMER_A_ID = 'cust-user-a';
export const CUSTOMER_B_ID = 'cust-user-b';
export const SUSPENDED_ID = 'usr-suspended';
export const GUEST_ID = 'usr-guest';

export interface HarnessOptions {
  /** When false, the binding has no batch(); writes run one statement at a time. */
  withBatch?: boolean;
  /** Runs before every statement. Tests use it to simulate a concurrent writer. */
  beforeStatement?: (sql: string, sqlite: SqliteDatabaseLike) => void;
  /** Overrides the environment, for example to remove AUTH_SECRET or the DB binding. */
  environment?: Partial<CloudflareEnvironment>;
}

export interface OrchestrationHarness {
  sqlite: SqliteDatabaseLike;
  database: OrchestrationDatabase;
  environment: CloudflareEnvironment;
  runtime: OrchestrationRuntime;
  close: () => void;
}

export interface CallOptions {
  method?: string;
  path: string;
  token?: string;
  /** Raw Authorization header value, used to test malformed schemes. Overrides token. */
  authorization?: string;
  body?: unknown;
  rawBody?: string;
  query?: string;
  requestId?: string;
  origin?: string;
}

export interface CallResult {
  status: number;
  body: Record<string, any>;
  headers: Headers;
  response: Response;
}

interface StatementContext {
  sqlite: SqliteDatabaseLike;
  beforeStatement?: (sql: string, sqlite: SqliteDatabaseLike) => void;
}

class TestStatement implements CloudflareD1PreparedStatement {
  constructor(
    private readonly context: StatementContext,
    private readonly sql: string,
    private readonly params: readonly unknown[] = []
  ) {}

  bind(...values: unknown[]): CloudflareD1PreparedStatement {
    return new TestStatement(this.context, this.sql, values);
  }

  private prepareExecution(): SqliteStatementLike {
    this.context.beforeStatement?.(this.sql, this.context.sqlite);
    return this.context.sqlite.prepare(this.sql);
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const row = this.prepareExecution().get(...this.params);
    return (row ?? null) as T | null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    return { results: this.prepareExecution().all(...this.params) as T[] };
  }

  async run(): Promise<unknown> {
    const info = this.prepareExecution().run(...this.params);
    return { success: true, meta: { changes: Number(info.changes) } };
  }
}

const runBatch = async (sqlite: SqliteDatabaseLike, statements: CloudflareD1PreparedStatement[]): Promise<unknown[]> => {
  sqlite.exec('BEGIN');
  try {
    const results: unknown[] = [];
    for (const statement of statements) results.push(await statement.run());
    sqlite.exec('COMMIT');
    return results;
  } catch (error: unknown) {
    sqlite.exec('ROLLBACK');
    throw error;
  }
};

let clockTick = 0;
let idCounter = 0;

/** Deterministic runtime: each call advances the clock and produces a unique, ordered identifier. */
export const createTestRuntime = (): OrchestrationRuntime => ({
  now: () => {
    clockTick += 1;
    return new Date(Date.UTC(2026, 0, 1) + clockTick * 1000).toISOString();
  },
  createId: (prefix: string) => {
    idCounter += 1;
    return `${prefix}-${String(idCounter).padStart(6, '0')}`;
  }
});

export const createHarness = (options: HarnessOptions = {}): OrchestrationHarness => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const context: StatementContext = { sqlite, beforeStatement: options.beforeStatement };
  const database: OrchestrationDatabase = {
    prepare: (sql: string) => new TestStatement(context, sql),
    batch: options.withBatch === false ? undefined : (statements) => runBatch(sqlite, statements)
  };
  const environment: CloudflareEnvironment = {
    DB: database,
    AUTH_SECRET: TEST_AUTH_SECRET,
    ...options.environment
  };
  return { sqlite, database, environment, runtime: createTestRuntime(), close: () => sqlite.close() };
};

const ROLE_BY_USER: Record<string, string> = {
  [ADMIN_ID]: 'ADMIN',
  [CUSTOMER_A_ID]: 'USER',
  [CUSTOMER_B_ID]: 'USER',
  [SUSPENDED_ID]: 'USER',
  [GUEST_ID]: 'USER'
};

export interface MintTokenOptions {
  userId: string;
  role?: string;
  /** Epoch milliseconds. Defaults to the standard 24-hour expiry. */
  expiresAt?: number;
  secret?: string;
}

/**
 * Signs a token in the same HS256 layout that the Worker issues (header.payload.signature, base64url).
 * verifyToken in workerAuth checks every token minted here, so the layout is validated on each use.
 */
export const mintToken = (options: MintTokenOptions): string => {
  const encode = (value: unknown): string => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    userId: options.userId,
    email: `${options.userId}@example.test`,
    role: options.role ?? ROLE_BY_USER[options.userId] ?? 'USER',
    tier: 'BRONZE',
    exp: options.expiresAt ?? Date.now() + AUTH_TOKEN_EXPIRY_SECONDS * 1000
  });
  const signature = createHmac('sha256', options.secret ?? TEST_AUTH_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
};

export const tokenFor = async (userId: string): Promise<string> => mintToken({ userId });

/** Sends one request through the Worker handler and returns the status, parsed JSON body and headers. */
export const send = async (harness: OrchestrationHarness, options: CallOptions): Promise<CallResult> => {
  const url = new URL(`https://edge.example/api/orchestration${options.path}${options.query ?? ''}`);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (options.authorization !== undefined) headers.set('Authorization', options.authorization);
  else if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  if (options.requestId) headers.set('X-Request-Id', options.requestId);
  if (options.origin) headers.set('Origin', options.origin);
  const method = options.method ?? 'GET';
  const bodyText = options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
  const carriesBody = method !== 'GET' && method !== 'HEAD';
  const request = new Request(url, {
    method,
    headers,
    body: carriesBody ? (bodyText ?? '') : undefined
  });
  const response = await handleOrchestrationRequest(request, harness.environment, url, harness.runtime);
  const contentType = response.headers.get('Content-Type') ?? '';
  const body = contentType.includes('application/json')
    ? (await response.clone().json()) as Record<string, any>
    : {};
  return { status: response.status, body, headers: response.headers, response };
};

/* ---------------------------------- fixtures ---------------------------------- */

export const seedUser = (
  sqlite: SqliteDatabaseLike,
  user: { id: string; name: string; role: string; status: string }
): void => {
  sqlite.prepare(
    'INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, '
      + 'subscription_tier) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)'
  ).run(
    user.id, user.name, '+910000000000', `${user.id}@example.test`, 'Test Company', 'Test Address',
    'hash', user.role, user.status, 'BRONZE'
  );
};

export const seedAssessment = (
  sqlite: SqliteDatabaseLike,
  assessment: { id: string; customerId: string; customerName: string; createdAt?: string; totalSpendCr?: number }
): void => {
  sqlite.prepare(
    'INSERT INTO AssessmentRecord (assessment_id, customer_id, customer_name, industry, assessment_owner, '
      + 'assessment_period_start, assessment_period_end, total_spend_cr, created_at, updated_at) '
      + 'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)'
  ).run(
    assessment.id, assessment.customerId, assessment.customerName, 'Textile', 'analyst@procucev.com',
    'Jan 2023', 'Dec 2023', assessment.totalSpendCr ?? 100, assessment.createdAt ?? '2026-02-01T00:00:00.000Z'
  );
};

export const seedVersion = (
  sqlite: SqliteDatabaseLike,
  version: {
    id: string;
    assessmentId: string;
    number?: number;
    fileName?: string;
    uploadedAt?: string;
    recordCount?: number;
    notes?: string | null;
  }
): void => {
  sqlite.prepare(
    'INSERT INTO AssessmentDataVersion (data_version_id, assessment_id, version_number, file_name, file_size, '
      + 'checksum, uploaded_by, uploaded_at, record_count, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)'
  ).run(
    version.id, version.assessmentId, version.number ?? 1, version.fileName ?? 'Spend.xlsx', 2097152,
    `sha256-${version.id}`, 'analyst@procucev.com', version.uploadedAt ?? '2026-02-02T00:00:00.000Z',
    version.recordCount ?? 42, version.notes ?? null
  );
};

export const seedRun = (
  sqlite: SqliteDatabaseLike,
  run: {
    id: string;
    assessmentId: string;
    versionId: string;
    totalSpendCr?: number;
    addressableSpendCr?: number | null;
    approved?: number;
    gatesPassed?: number;
    superseded?: number;
    createdAt?: string;
  }
): void => {
  sqlite.prepare(
    'INSERT INTO AssessmentAnalysisRun (analysis_run_id, assessment_id, data_version_id, status, total_spend_cr, '
      + 'validated_spend_cr, addressable_spend_cr, potential_savings_cr, savings_pct, all_gates_passed, is_approved, '
      + 'is_superseded, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)'
  ).run(
    run.id, run.assessmentId, run.versionId, 'COMPLETED', run.totalSpendCr ?? 100,
    run.addressableSpendCr === undefined ? 90 : run.addressableSpendCr,
    9, 9, run.gatesPassed ?? 1, run.approved ?? 1, run.superseded ?? 0,
    run.createdAt ?? '2026-02-03T00:00:00.000Z'
  );
};

export const seedTransaction = (
  sqlite: SqliteDatabaseLike,
  transaction: {
    id: string;
    assessmentId: string;
    sourceDocumentId: string;
    supplier: string;
    plant: string | null;
    materialGroup: string;
    spendCr: number;
  }
): void => {
  sqlite.prepare(
    'INSERT INTO ProcurementTransaction (transaction_id, tenant_id, assessment_id, source_document_id, supplier_name, '
      + 'plant, material_group, total_in_cr_raw, currency, raw_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)'
  ).run(
    transaction.id, 'TNT-TEST', transaction.assessmentId, transaction.sourceDocumentId, transaction.supplier,
    transaction.plant, transaction.materialGroup, transaction.spendCr, 'INR', '{}'
  );
};

/**
 * Standard fixture set:
 * - AIC-A1 and AIC-A2 belong to customer A, with an approved, passing run. AIC-A1 also has procurement rows.
 * - AIC-B1 belongs to customer B and has no addressable spend, so readiness is blocked.
 * - AIC-C1 has no data version, so customers cannot see it.
 * - AIC-D1 has data but no analysis run. AIC-E1 has a run for an older version (stale).
 * - AIC-F1 has a run that failed its gates and is not approved. AIC-G1 has spend coverage below 85%.
 */
export const seedStandardFixtures = (sqlite: SqliteDatabaseLike): void => {
  seedUser(sqlite, { id: ADMIN_ID, name: 'System Administrator', role: 'ADMIN', status: 'ACTIVE' });
  seedUser(sqlite, { id: CUSTOMER_A_ID, name: 'Asha Customer', role: 'USER', status: 'ACTIVE' });
  seedUser(sqlite, { id: CUSTOMER_B_ID, name: 'Ben Customer', role: 'USER', status: 'ACTIVE' });
  seedUser(sqlite, { id: SUSPENDED_ID, name: 'Suspended User', role: 'USER', status: 'SUSPENDED' });
  seedUser(sqlite, { id: GUEST_ID, name: 'Guest User', role: 'GUEST', status: 'ACTIVE' });

  seedAssessment(sqlite, { id: 'AIC-A1', customerId: CUSTOMER_A_ID, customerName: 'Alpha Textile' });
  seedVersion(sqlite, { id: 'DV-A1', assessmentId: 'AIC-A1', uploadedAt: '2026-02-02T00:00:00.000Z' });
  seedRun(sqlite, { id: 'RUN-A1', assessmentId: 'AIC-A1', versionId: 'DV-A1' });
  seedTransaction(sqlite, {
    id: 'TX-1', assessmentId: 'AIC-A1', sourceDocumentId: 'AIC-A1:DV-A1',
    supplier: 'Supplier One', plant: 'P1', materialGroup: 'MG1', spendCr: 1.5
  });
  seedTransaction(sqlite, {
    id: 'TX-2', assessmentId: 'AIC-A1', sourceDocumentId: 'AIC-A1:DV-A1',
    supplier: 'Supplier Two', plant: 'P2', materialGroup: 'MG1', spendCr: 0.5
  });
  seedTransaction(sqlite, {
    id: 'TX-3', assessmentId: 'AIC-A1', sourceDocumentId: 'AIC-A1:DV-A1',
    supplier: 'Supplier One', plant: null, materialGroup: 'MG2', spendCr: 0.25
  });

  seedAssessment(sqlite, { id: 'AIC-A2', customerId: CUSTOMER_A_ID, customerName: 'Alpha Textile' });
  seedVersion(sqlite, { id: 'DV-A2', assessmentId: 'AIC-A2' });
  seedRun(sqlite, { id: 'RUN-A2', assessmentId: 'AIC-A2', versionId: 'DV-A2' });

  seedAssessment(sqlite, { id: 'AIC-B1', customerId: CUSTOMER_B_ID, customerName: 'Beta Cement' });
  seedVersion(sqlite, { id: 'DV-B1', assessmentId: 'AIC-B1' });
  seedRun(sqlite, { id: 'RUN-B1', assessmentId: 'AIC-B1', versionId: 'DV-B1', addressableSpendCr: null });

  seedAssessment(sqlite, { id: 'AIC-C1', customerId: CUSTOMER_A_ID, customerName: 'Gamma Steel' });

  seedAssessment(sqlite, { id: 'AIC-D1', customerId: CUSTOMER_A_ID, customerName: 'Delta Chemicals' });
  seedVersion(sqlite, { id: 'DV-D1', assessmentId: 'AIC-D1' });

  seedAssessment(sqlite, { id: 'AIC-E1', customerId: CUSTOMER_A_ID, customerName: 'Epsilon Polymers' });
  seedVersion(sqlite, { id: 'DV-E1', assessmentId: 'AIC-E1', number: 1 });
  seedVersion(sqlite, {
    id: 'DV-E2', assessmentId: 'AIC-E1', number: 2, uploadedAt: '2026-03-01T00:00:00.000Z'
  });
  seedRun(sqlite, { id: 'RUN-E1', assessmentId: 'AIC-E1', versionId: 'DV-E1' });

  seedAssessment(sqlite, { id: 'AIC-F1', customerId: CUSTOMER_A_ID, customerName: 'Zeta Foundry' });
  seedVersion(sqlite, { id: 'DV-F1', assessmentId: 'AIC-F1' });
  seedRun(sqlite, { id: 'RUN-F1', assessmentId: 'AIC-F1', versionId: 'DV-F1', approved: 0, gatesPassed: 0 });

  seedAssessment(sqlite, { id: 'AIC-G1', customerId: CUSTOMER_A_ID, customerName: 'Eta Fabrics' });
  seedVersion(sqlite, { id: 'DV-G1', assessmentId: 'AIC-G1' });
  seedRun(sqlite, { id: 'RUN-G1', assessmentId: 'AIC-G1', versionId: 'DV-G1', addressableSpendCr: 50 });
};
