import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { pbkdf2Sync } from 'node:crypto';
import { AUTH_MESSAGES, AUTH_ROLES, AUTH_TOKEN_EXPIRY_SECONDS } from '../src/constants/auth';
import {
  authenticateWorkerUser, createWorkerAuthToken, handleAdminRoute, handleAuthRoute, verifyToken
} from '../src/workerAuth';
import type { AuthRouteResult, CloudflareEnvironment } from '../src/types/cloudflare';
import { issueEvidenceToken } from './helpers/evidenceSqlite';
import {
  createWorkerDatabase,
  insertRows,
  WORKER_CORE_SECRET,
  type WorkerDatabaseFixture
} from './helpers/workerCoreFixtures';

const AUTH_URL = 'https://edge.example.com/api/auth';
const ADMIN_URL = 'https://edge.example.com/api/admin';
const ENDPOINT_NOT_FOUND = 'Endpoint not found in the Cloudflare Worker.';
const ADMIN_USER_NOT_FOUND = 'User not found in registry';
const REGISTRATION = {
  name: 'Asha Rao',
  mobile_number: '+919812345678',
  email: 'Asha.Rao@Example.com',
  company_name: 'Rao Textiles',
  company_address: 'Pune, Maharashtra',
  password: 'Secret123'
};
const NORMALIZED_EMAIL = 'asha.rao@example.com';

let fixture: WorkerDatabaseFixture;

beforeEach(() => {
  fixture = createWorkerDatabase();
});

afterEach(() => {
  fixture.close();
});

const environmentWith = (overrides: CloudflareEnvironment = {}): CloudflareEnvironment => ({
  DB: fixture.d1,
  AUTH_SECRET: WORKER_CORE_SECRET,
  ...overrides
});

interface CallOptions {
  body?: unknown;
  rawBody?: string;
  headers?: Record<string, string>;
  environment?: CloudflareEnvironment;
}

const authCall = (method: string, path: string, options: CallOptions = {}): Promise<AuthRouteResult> => {
  const request = new Request(`${AUTH_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body))
  });
  return handleAuthRoute(request, options.environment ?? environmentWith(), new URL(request.url));
};

const adminCall = (path: string, options: CallOptions & { method?: string } = {}): Promise<AuthRouteResult> => {
  const request = new Request(`${ADMIN_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body))
  });
  return handleAdminRoute(request, options.environment ?? environmentWith(), new URL(request.url));
};

const bearer = (token: string): Record<string, string> => ({ Authorization: `Bearer ${token}` });

const tokenFor = (userId: string, claims: Record<string, unknown> = {}): Promise<string> =>
  issueEvidenceToken({ userId, ...claims }, WORKER_CORE_SECRET);

const register = (overrides: Record<string, unknown> = {}): Promise<AuthRouteResult> =>
  authCall('POST', '/register', { body: { ...REGISTRATION, ...overrides } });

const registeredId = (result: AuthRouteResult): string => String((result.body.user as Record<string, unknown>).id);

const userRow = (id: string): Promise<Record<string, unknown> | null> =>
  fixture.d1.prepare('SELECT * FROM User WHERE id = ?').bind(id).first<Record<string, unknown>>();

const countUsers = async (): Promise<number> => {
  const row = await fixture.d1.prepare('SELECT COUNT(*) AS total FROM User').first<{ total: number }>();
  return Number(row?.total ?? -1);
};

const seedRegistry = (): void => {
  insertRows(fixture.db, 'INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    ['usr-admin', 'Admin', '+910000000001', 'admin@procucev.com', 'Procucev', 'Bengaluru', 'hash', 'ADMIN', 'ACTIVE', 'GOLD', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'],
    ['usr-asha', 'Asha Rao', '+910000000002', 'asha@alpha.example', 'Alpha Textile', 'Pune', 'hash', 'USER', 'ACTIVE', 'BRONZE', '2026-01-02T00:00:00Z', '2026-01-02T00:00:00Z'],
    ['usr-ravi', 'Ravi Alpha', '+910000000003', 'ravi@example.com', ' alpha textile ', 'Delhi', 'hash', 'USER', 'SUSPENDED', 'SILVER', '2026-01-03T00:00:00Z', '2026-01-03T00:00:00Z'],
    ['usr-meera', 'Meera Iyer', '+910000000004', 'meera@beta.example', 'Beta Cement', 'Chennai', 'hash', 'USER', 'ACTIVE', 'BRONZE', '2026-01-04T00:00:00Z', '2026-01-04T00:00:00Z'],
    ['usr-guest', 'Guest', '+910000000005', 'guest@example.com', 'Guest Co', 'Mumbai', 'hash', 'GUEST', 'ACTIVE', 'BRONZE', '2026-01-05T00:00:00Z', '2026-01-05T00:00:00Z']
  ]);
};

describe('workerAuth route guards', () => {
  it('authenticates existing Express password hashes without resetting or replacing the stored password', async () => {
    const salt = '00112233445566778899aabbccddeeff';
    const storedHash = `${salt}:${pbkdf2Sync(REGISTRATION.password, salt, 100000, 64, 'sha512').toString('hex')}`;
    insertRows(fixture.db, 'INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [[
      'usr-migrated', REGISTRATION.name, REGISTRATION.mobile_number, NORMALIZED_EMAIL,
      REGISTRATION.company_name, REGISTRATION.company_address, storedHash, 'USER', 'ACTIVE', 'GOLD'
    ]]);
    const result = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: REGISTRATION.password } });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, user: { id: 'usr-migrated' } });
    expect(await verifyToken(String(result.body.token), WORKER_CORE_SECRET)).toMatchObject({ userId: 'usr-migrated' });
    expect((await userRow('usr-migrated'))?.password_hash).toBe(storedHash);
    expect((await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: 'WrongPassword123' } })).status).toBe(401);
  });

  it('returns 503 when the D1 binding is missing', async () => {
    const result = await authCall('POST', '/register', {
      body: REGISTRATION,
      environment: environmentWith({ DB: undefined })
    });

    expect(result).toEqual({
      status: 503,
      body: { success: false, message: 'Cloudflare D1 or AUTH_SECRET is not configured.' }
    });
  });

  it('returns 503 when AUTH_SECRET is not configured', async () => {
    const result = await authCall('POST', '/login', {
      body: { email: NORMALIZED_EMAIL, password: 'Secret123' },
      environment: environmentWith({ AUTH_SECRET: undefined })
    });

    expect(result.status).toBe(503);
  });
});

describe('authenticateWorkerUser', () => {
  it('requires configured D1 and an unexpired token for an active account', async () => {
    const request = new Request(`${AUTH_URL}/mutation`);
    await expect(authenticateWorkerUser(request, environmentWith({ DB: undefined })))
      .resolves.toMatchObject({ status: 503 });
    await expect(authenticateWorkerUser(request, environmentWith({ AUTH_SECRET: undefined })))
      .resolves.toMatchObject({ status: 503 });
    await expect(authenticateWorkerUser(request, environmentWith()))
      .resolves.toMatchObject({ status: 401 });

    const missingUserToken = await tokenFor('usr-missing');
    await expect(authenticateWorkerUser(
      new Request(`${AUTH_URL}/mutation`, { headers: bearer(missingUserToken) }), environmentWith()
    )).resolves.toMatchObject({ status: 401 });
  });

  it('uses the active D1 role and identity instead of trusting token claims', async () => {
    seedRegistry();
    const regularToken = await tokenFor('usr-asha', { role: AUTH_ROLES.ADMIN });
    const regularRequest = new Request(`${AUTH_URL}/mutation`, { headers: bearer(regularToken) });
    await expect(authenticateWorkerUser(regularRequest, environmentWith()))
      .resolves.toMatchObject({ status: 200, user: { id: 'usr-asha', role: 'USER', name: 'Asha Rao' } });
    await expect(authenticateWorkerUser(regularRequest, environmentWith(), true))
      .resolves.toMatchObject({ status: 403 });

    const suspendedToken = await tokenFor('usr-ravi');
    await expect(authenticateWorkerUser(
      new Request(`${AUTH_URL}/mutation`, { headers: bearer(suspendedToken) }), environmentWith()
    )).resolves.toMatchObject({ status: 401 });

    const guestToken = await tokenFor('usr-guest');
    await expect(authenticateWorkerUser(
      new Request(`${AUTH_URL}/mutation`, { headers: bearer(guestToken) }), environmentWith()
    )).resolves.toMatchObject({ status: 403 });

    const adminToken = await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN });
    await expect(authenticateWorkerUser(
      new Request(`${AUTH_URL}/mutation`, { headers: bearer(adminToken) }), environmentWith(), true
    )).resolves.toMatchObject({ status: 200, user: { id: 'usr-admin', role: 'ADMIN' } });
  });
});

describe('workerAuth register', () => {
  it('rejects an invalid payload with field-level issues and creates no account', async () => {
    const result = await authCall('POST', '/register', { body: { name: 'A', email: 'not-an-email' } });
    const fields = (result.body.errors as Array<{ path: PropertyKey[] }>).map((issue) => issue.path[0]);

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ success: false, message: 'Validation failed' });
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'mobile_number', 'password']));
    expect(await countUsers()).toBe(0);
  });

  it('treats a non-JSON body as an empty payload and rejects it with 400', async () => {
    const result = await authCall('POST', '/register', { rawBody: 'not-json' });

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ success: false, message: 'Validation failed' });
  });

  it('rejects a duplicate organization email with 409 and keeps a single account', async () => {
    await register();
    const duplicate = await register({ email: 'ASHA.RAO@EXAMPLE.COM' });

    expect(duplicate).toEqual({ status: 409, body: { success: false, message: AUTH_MESSAGES.EMAIL_EXISTS } });
    expect(await countUsers()).toBe(1);
  });

  it('creates an account with a salted hash and returns a token that verifies', async () => {
    const result = await register();
    const user = result.body.user as Record<string, unknown>;

    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({
      success: true,
      message: AUTH_MESSAGES.REGISTER_SUCCESS,
      expires_in_seconds: AUTH_TOKEN_EXPIRY_SECONDS
    });
    expect(user).toMatchObject({
      email: NORMALIZED_EMAIL,
      name: 'Asha Rao',
      role: AUTH_ROLES.USER,
      status: 'ACTIVE',
      subscription_tier: 'BRONZE'
    });
    expect(user).not.toHaveProperty('password_hash');

    const claims = await verifyToken(String(result.body.token), WORKER_CORE_SECRET);
    expect(claims).toMatchObject({ userId: user.id, email: NORMALIZED_EMAIL, role: AUTH_ROLES.USER, tier: 'BRONZE' });

    const stored = await userRow(String(user.id));
    expect(stored?.password_hash).toMatch(/^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/u);
    expect(String(stored?.password_hash)).not.toContain(REGISTRATION.password);
  });

  it('never echoes the submitted password back in the response', async () => {
    const result = await register();
    const user = result.body.user as Record<string, unknown>;

    expect(user).not.toHaveProperty('password');
    expect(JSON.stringify(result.body)).not.toContain(REGISTRATION.password);
  });

  it('honours an explicit subscription tier', async () => {
    const result = await register({ subscription_tier: 'GOLD' });

    expect((result.body.user as Record<string, unknown>).subscription_tier).toBe('GOLD');
  });
});

describe('workerAuth login', () => {
  it('rejects an invalid login payload with 400', async () => {
    const result = await authCall('POST', '/login', { body: {} });

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ success: false, message: 'Validation failed' });
  });

  it('returns the same 401 for an unknown account and for a wrong password', async () => {
    await register();

    const unknown = await authCall('POST', '/login', { body: { email: 'nobody@example.com', password: 'Secret123' } });
    const wrong = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: 'Wrong999' } });

    expect(unknown).toEqual({ status: 401, body: { success: false, message: AUTH_MESSAGES.INVALID_CREDENTIALS } });
    expect(wrong).toEqual(unknown);
  });

  it('rejects a stored hash that has no salt and hash separator', async () => {
    const id = registeredId(await register());
    fixture.db.prepare('UPDATE User SET password_hash = ? WHERE id = ?').run('no-separator', id);

    const result = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: 'Secret123' } });

    expect(result.status).toBe(401);
  });

  it.each(['@@@:YWJj', 'YWJj:@@@', ':YWJj', 'YWJj:', 'YWJj:YWJj:extra'])
    ('rejects malformed stored password material %s without a server error', async (storedHash) => {
      const id = registeredId(await register());
      fixture.db.prepare('UPDATE User SET password_hash = ? WHERE id = ?').run(storedHash, id);
      const result = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: REGISTRATION.password } });
      expect(result).toEqual({ status: 401, body: { success: false, message: AUTH_MESSAGES.INVALID_CREDENTIALS } });
    });

  it('rejects a stored hash whose digest has been truncated', async () => {
    const id = registeredId(await register());
    const stored = String((await userRow(id))?.password_hash);
    const [salt, digest] = stored.split(':');
    fixture.db.prepare('UPDATE User SET password_hash = ? WHERE id = ?').run(`${salt}:${digest.slice(0, 10)}`, id);

    const result = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: 'Secret123' } });

    expect(result.status).toBe(401);
  });

  it('returns 403 for a suspended account even when the password is correct', async () => {
    const id = registeredId(await register());
    fixture.db.prepare("UPDATE User SET status = 'SUSPENDED' WHERE id = ?").run(id);

    const result = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: 'Secret123' } });

    expect(result).toEqual({ status: 403, body: { success: false, message: AUTH_MESSAGES.ACCOUNT_INACTIVE } });
  });

  it('logs in by email in any letter case and omits the password hash from the profile', async () => {
    await register();

    const result = await authCall('POST', '/login', { body: { email: 'ASHA.RAO@example.COM', password: 'Secret123' } });
    const user = result.body.user as Record<string, unknown>;

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, message: AUTH_MESSAGES.LOGIN_SUCCESS });
    expect(user).toMatchObject({ email: NORMALIZED_EMAIL });
    expect(user).not.toHaveProperty('password_hash');
    await expect(verifyToken(String(result.body.token), WORKER_CORE_SECRET)).resolves.toMatchObject({ email: NORMALIZED_EMAIL });
  });

  it('accepts the buyer identifier in place of the email', async () => {
    const id = registeredId(await register());

    const result = await authCall('POST', '/login', { body: { email: id, password: 'Secret123' } });

    expect(result.status).toBe(200);
    expect((result.body.user as Record<string, unknown>).id).toBe(id);
  });
});

describe('workerAuth authenticated routes', () => {
  it('returns 401 when no Authorization header is supplied', async () => {
    const result = await authCall('GET', '/me');

    expect(result).toEqual({ status: 401, body: { success: false, message: AUTH_MESSAGES.UNAUTHORIZED } });
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const id = registeredId(await register());
    const forged = await issueEvidenceToken({ userId: id, role: AUTH_ROLES.ADMIN }, 'another-secret');

    const result = await authCall('GET', '/me', { headers: bearer(forged) });

    expect(result).toEqual({ status: 401, body: { success: false, message: AUTH_MESSAGES.UNAUTHORIZED } });
  });

  it.each([
    ['a single segment', 'not-a-token'],
    ['a token with an invalid base64 signature', 'abc.def.@@@'],
    ['a token whose signature is not valid base64', 'a.b.c']
  ])('returns 401 instead of failing the request for %s', async (_label, token) => {
    const result = await authCall('GET', '/me', { headers: bearer(token) });

    expect(result).toEqual({ status: 401, body: { success: false, message: AUTH_MESSAGES.UNAUTHORIZED } });
  });

  it('returns 401 for an expired token', async () => {
    const id = registeredId(await register());

    const result = await authCall('GET', '/me', { headers: bearer(await tokenFor(id, { exp: Date.now() - 1000 })) });

    expect(result.status).toBe(401);
  });

  it('returns 401 when the token carries no user identifier', async () => {
    const token = await issueEvidenceToken({ role: AUTH_ROLES.ADMIN }, WORKER_CORE_SECRET);

    const result = await authCall('GET', '/me', { headers: bearer(token) });

    expect(result.status).toBe(401);
  });

  it('returns 401 when the token references a user that does not exist', async () => {
    const result = await authCall('GET', '/me', { headers: bearer(await tokenFor('usr-missing')) });

    expect(result.status).toBe(401);
  });

  it('returns 401 when the payload was altered after signing', async () => {
    const id = registeredId(await register());
    const [header, payload, signature] = (await tokenFor(id, { role: AUTH_ROLES.USER })).split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
    const forgedPayload = Buffer.from(JSON.stringify({ ...claims, role: AUTH_ROLES.ADMIN })).toString('base64url');

    const result = await authCall('GET', '/me', { headers: bearer(`${header}.${forgedPayload}.${signature}`) });

    expect(result.status).toBe(401);
  });

  it('returns the caller profile without the password hash for a valid Bearer token', async () => {
    const registration = await register();
    const id = registeredId(registration);

    const result = await authCall('GET', '/me', { headers: bearer(String(registration.body.token)) });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, user: { id, email: NORMALIZED_EMAIL } });
    expect((result.body.user as Record<string, unknown>)).not.toHaveProperty('password_hash');
  });

  it('accepts a raw token without the Bearer prefix', async () => {
    const id = registeredId(await register());

    const result = await authCall('GET', '/me', { headers: { Authorization: await tokenFor(id) } });

    expect(result.status).toBe(200);
  });

  it('returns 404 for an unknown authenticated endpoint', async () => {
    const id = registeredId(await register());

    const result = await authCall('GET', '/logout', { headers: bearer(await tokenFor(id)) });

    expect(result).toEqual({ status: 404, body: { success: false, message: ENDPOINT_NOT_FOUND } });
  });

  it('returns 404 when a known path is called with an unsupported method', async () => {
    const id = registeredId(await register());

    const meWithPost = await authCall('POST', '/me', { headers: bearer(await tokenFor(id)) });
    const changeWithGet = await authCall('GET', '/change-password', { headers: bearer(await tokenFor(id)) });

    expect(meWithPost.status).toBe(404);
    expect(changeWithGet.status).toBe(404);
  });

  it('rejects a password change with an invalid payload', async () => {
    const registration = await register();

    const result = await authCall('POST', '/change-password', {
      body: { currentPassword: '', newPassword: '123' },
      headers: bearer(String(registration.body.token))
    });

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ success: false, message: 'Validation failed' });
  });

  it('rejects a password change when the current password is wrong', async () => {
    const registration = await register();

    const result = await authCall('POST', '/change-password', {
      body: { currentPassword: 'Wrong999', newPassword: 'NewSecret456' },
      headers: bearer(String(registration.body.token))
    });

    expect(result).toEqual({
      status: 400,
      body: { success: false, message: AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT }
    });
  });

  it('changes the password so that only the new password logs in afterwards', async () => {
    const registration = await register();

    const changed = await authCall('POST', '/change-password', {
      body: { currentPassword: 'Secret123', newPassword: 'NewSecret456' },
      headers: bearer(String(registration.body.token))
    });
    const oldLogin = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: 'Secret123' } });
    const newLogin = await authCall('POST', '/login', { body: { email: NORMALIZED_EMAIL, password: 'NewSecret456' } });

    expect(changed).toEqual({ status: 200, body: { success: true, message: AUTH_MESSAGES.PASSWORD_CHANGED } });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });
});

describe('workerAuth verifyToken', () => {
  it.each([
    ['an empty string', ''],
    ['one segment', 'abc'],
    ['two segments', 'a.b'],
    ['an empty payload segment', 'a..c'],
    ['an empty header segment', '.b.c'],
    ['an empty signature segment', 'a.b.']
  ])('returns null for %s', async (_label, token) => {
    await expect(verifyToken(token, WORKER_CORE_SECRET)).resolves.toBeNull();
  });

  it('returns the claims for a freshly signed token', async () => {
    const token = await tokenFor('usr-asha', { role: AUTH_ROLES.USER });

    await expect(verifyToken(token, WORKER_CORE_SECRET)).resolves.toMatchObject({ userId: 'usr-asha', role: AUTH_ROLES.USER });
  });

  it('returns null when the secret differs', async () => {
    await expect(verifyToken(await tokenFor('usr-asha'), 'other-secret')).resolves.toBeNull();
  });

  it('returns null once the expiry has passed', async () => {
    await expect(verifyToken(await tokenFor('usr-asha', { exp: Date.now() - 1 }), WORKER_CORE_SECRET)).resolves.toBeNull();
  });

  it('returns null when the expiry claim is not a number', async () => {
    await expect(verifyToken(await tokenFor('usr-asha', { exp: 'tomorrow' }), WORKER_CORE_SECRET)).resolves.toBeNull();
  });
});

describe('workerAuth admin routes', () => {
  it('returns 503 when the D1 binding or AUTH_SECRET is missing', async () => {
    const withoutDb = await adminCall('/users', { environment: environmentWith({ DB: undefined }) });
    const withoutSecret = await adminCall('/users', { environment: environmentWith({ AUTH_SECRET: undefined }) });

    expect(withoutDb.status).toBe(503);
    expect(withoutSecret.status).toBe(503);
  });

  it.each([
    ['no token is supplied', undefined, undefined],
    ['the caller is a regular user', 'usr-asha', AUTH_ROLES.USER],
    ['the caller holds an unknown role', 'usr-guest', 'GUEST']
  ])('returns 403 when %s', async (_label, userId, role) => {
    const headers = userId && role ? bearer(await tokenFor(userId, { role })) : undefined;

    const result = await adminCall('/users', { headers });

    expect(result).toEqual({ status: 403, body: { success: false, message: AUTH_MESSAGES.FORBIDDEN_ADMIN_ONLY } });
  });

  it('returns 403 for an admin claim signed with a different secret', async () => {
    const forged = await issueEvidenceToken({ userId: 'usr-admin', role: AUTH_ROLES.ADMIN }, 'other-secret');

    const result = await adminCall('/users', { headers: bearer(forged) });

    expect(result.status).toBe(403);
  });

  it('accepts an administrator token supplied in the x-auth-token header', async () => {
    seedRegistry();
    const token = await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN });

    const result = await adminCall('/users', { headers: { 'x-auth-token': token } });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, total: 5 });
  });

  it('lists the registry without credential material and summarises it', async () => {
    seedRegistry();

    const result = await adminCall('/users', { headers: bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN })) });
    const users = result.body.users as Array<Record<string, unknown>>;

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, total: 5, activeCount: 4, companiesCount: 4 });
    expect(users.map((user) => user.id)).toEqual(['usr-guest', 'usr-meera', 'usr-ravi', 'usr-asha', 'usr-admin']);
    expect(users.some((user) => 'password_hash' in user)).toBe(false);
  });

  it('filters the registry by a case-insensitive search across name, email and company', async () => {
    seedRegistry();
    const headers = bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }));

    const byName = await adminCall('/users?search=ALPHA', { headers });
    const byEmail = await adminCall('/users?search=beta.example', { headers });

    expect((byName.body.users as Array<Record<string, unknown>>).map((user) => user.id)).toEqual(['usr-ravi', 'usr-asha']);
    expect(byName.body).toMatchObject({ total: 2, companiesCount: 1 });
    expect((byEmail.body.users as Array<Record<string, unknown>>).map((user) => user.id)).toEqual(['usr-meera']);
  });

  it('filters by role, status and tier while treating ALL as no filter', async () => {
    seedRegistry();
    const headers = bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }));

    const byRole = await adminCall('/users?role=USER&tier=ALL', { headers });
    const bySuspended = await adminCall('/users?status=SUSPENDED', { headers });
    const byTier = await adminCall('/users?tier=GOLD&role=ALL&status=ALL', { headers });
    const combined = await adminCall('/users?role=USER&status=ACTIVE&tier=BRONZE', { headers });
    const everyone = await adminCall('/users?role=ALL&status=ALL&tier=ALL', { headers });

    expect(byRole.body.total).toBe(3);
    expect((bySuspended.body.users as Array<Record<string, unknown>>).map((user) => user.id)).toEqual(['usr-ravi']);
    expect((byTier.body.users as Array<Record<string, unknown>>).map((user) => user.id)).toEqual(['usr-admin']);
    expect((combined.body.users as Array<Record<string, unknown>>).map((user) => user.id)).toEqual(['usr-meera', 'usr-asha']);
    expect(everyone.body.total).toBe(5);
  });

  it('suspends and reactivates a user and returns the profile without credentials', async () => {
    seedRegistry();
    const headers = bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }));

    const suspended = await adminCall('/users/usr-meera/status', { method: 'PATCH', body: { status: 'SUSPENDED' }, headers });
    const suspendedRow = await userRow('usr-meera');
    const reactivated = await adminCall('/users/usr-meera/status', { method: 'PATCH', body: { status: 'ACTIVE' }, headers });

    expect(suspended).toMatchObject({
      status: 200,
      body: { success: true, message: AUTH_MESSAGES.STATUS_UPDATED, user: { id: 'usr-meera', status: 'SUSPENDED' } }
    });
    expect(suspended.body.user).not.toHaveProperty('password_hash');
    expect(suspendedRow?.status).toBe('SUSPENDED');
    expect(reactivated.body.user).toMatchObject({ status: 'ACTIVE' });
  });

  it('rejects status values other than ACTIVE or SUSPENDED, including unreadable bodies', async () => {
    seedRegistry();
    const headers = bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }));
    const message = 'Invalid status. Must be ACTIVE or SUSPENDED.';

    const unknownStatus = await adminCall('/users/usr-meera/status', { method: 'PATCH', body: { status: 'DELETED' }, headers });
    const unreadable = await adminCall('/users/usr-meera/status', { method: 'PATCH', rawBody: '{oops', headers });

    expect(unknownStatus).toEqual({ status: 400, body: { success: false, message } });
    expect(unreadable).toEqual({ status: 400, body: { success: false, message } });
  });

  it('returns 404 when the status target does not exist', async () => {
    seedRegistry();

    const result = await adminCall('/users/usr-unknown/status', {
      method: 'PATCH',
      body: { status: 'SUSPENDED' },
      headers: bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }))
    });

    expect(result).toEqual({ status: 404, body: { success: false, message: ADMIN_USER_NOT_FOUND } });
  });

  it('decodes percent-encoded user identifiers in admin paths', async () => {
    seedRegistry();

    const result = await adminCall('/users/usr%2Dmeera/status', {
      method: 'PATCH',
      body: { status: 'SUSPENDED' },
      headers: bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }))
    });

    expect(result.status).toBe(200);
    expect(result.body.user).toMatchObject({ id: 'usr-meera' });
  });

  it('changes a subscription tier and rejects unknown or missing tiers', async () => {
    seedRegistry();
    const headers = bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }));

    const updated = await adminCall('/users/usr-asha/tier', { method: 'PATCH', body: { tier: 'GOLD' }, headers });
    const invalid = await adminCall('/users/usr-asha/tier', { method: 'PATCH', body: { tier: 'PLATINUM' }, headers });
    const missing = await adminCall('/users/usr-asha/tier', { method: 'PATCH', body: {}, headers });

    expect(updated).toMatchObject({
      status: 200,
      body: { success: true, message: AUTH_MESSAGES.TIER_UPDATED, user: { id: 'usr-asha', subscription_tier: 'GOLD' } }
    });
    expect((await userRow('usr-asha'))?.subscription_tier).toBe('GOLD');
    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(400);
  });

  it('returns 404 when the tier target does not exist', async () => {
    seedRegistry();

    const result = await adminCall('/users/usr-unknown/tier', {
      method: 'PATCH',
      body: { tier: 'SILVER' },
      headers: bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }))
    });

    expect(result).toEqual({ status: 404, body: { success: false, message: ADMIN_USER_NOT_FOUND } });
  });

  it('returns 404 for an unsupported admin endpoint', async () => {
    seedRegistry();

    const result = await adminCall('/users', {
      method: 'POST',
      headers: bearer(await tokenFor('usr-admin', { role: AUTH_ROLES.ADMIN }))
    });

    expect(result).toEqual({ status: 404, body: { success: false, message: ENDPOINT_NOT_FOUND } });
  });
});

describe('administrator account provisioning', () => {
  const payload = {
    name: 'New Administrator', email: 'admin.new@example.com', mobile_number: '+919876543210',
    company_name: 'Acme Holdings', company_address: 'Bengaluru, India', password: 'SecureAdmin123',
    role: 'ADMIN', subscription_tier: 'GOLD'
  };

  it('allows first-admin bootstrap once, then requires the provisioned admin token', async () => {
    const created = await adminCall('/create-admin', { method: 'POST', body: payload });
    expect(created).toMatchObject({ status: 201, body: { success: true, user: { role: 'ADMIN' } } });
    const blocked = await adminCall('/create-admin', { method: 'POST', body: { ...payload, email: 'second@example.com' } });
    expect(blocked.status).toBe(401);
    const createdUser = created.body.user as Record<string, unknown>;
    const token = await createWorkerAuthToken(
      { id: createdUser.id, email: payload.email, role: 'ADMIN', subscription_tier: 'GOLD' }, WORKER_CORE_SECRET
    );
    const updated = await adminCall('/create-admin', {
      method: 'POST', body: { ...payload, name: 'Updated Administrator' }, headers: bearer(token)
    });
    expect(updated).toMatchObject({ status: 200, body: { success: true, user: { name: 'Updated Administrator' } } });
    expect(await countUsers()).toBe(1);
  });

  it('rejects invalid provisioning fields and unavailable D1 bindings', async () => {
    const invalid = await adminCall('/create-admin', { method: 'POST', body: { ...payload, password: 'short' } });
    const unavailable = await adminCall('/create-admin', {
      method: 'POST', body: payload, environment: environmentWith({ DB: undefined })
    });
    expect(invalid.status).toBe(400);
    expect(unavailable.status).toBe(503);
  });

  it('returns a signed worker token from the centralized issuer', async () => {
    const token = await createWorkerAuthToken({ id: 'usr-token', role: 'USER', subscription_tier: 'SILVER' }, WORKER_CORE_SECRET);
    expect(await verifyToken(token, WORKER_CORE_SECRET)).toMatchObject({ userId: 'usr-token', tier: 'SILVER' });
  });
});
