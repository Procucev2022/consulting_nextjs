import {
  loginUserSchema, registerUserSchema, changePasswordSchema, adminProvisionSchema,
  adminAssignUserTenantSchema, adminUpdateUserStatusSchema, adminUpdateUserTierSchema
} from './constants/validation';
import { D1_SINGLE_ROW_CHANGE_COUNT } from './constants/db';
import {
  AUTH_HEX_BYTE_PATTERN, AUTH_LEGACY_PASSWORD_PATTERN, AUTH_MESSAGES, AUTH_ROLES, AUTH_SQL, AUTH_STATUS,
  AUTH_TOKEN_EXPIRY_SECONDS
} from './constants/auth';
import type { AuthRouteResult, CloudflareD1Database, CloudflareEnvironment } from './types/cloudflare';
import type { WorkerAuthCheckResult } from './types/auth';
import { handlePcbiAdminRoute } from './workerD1PcbiAdmin';
import { handlePcbiDataLabRoute } from './workerD1PcbiDataLab';
import { readJson } from './workerHttp';
import logger from './utils/logger';
import { d1ChangedRows } from './utils/d1Result';

const encodeBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
};

const decodeBase64Url = (value: string): Uint8Array => {
  const cleanValue = value.replace(/[\s=]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = cleanValue + '==='.slice((cleanValue.length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const tryDecodeBase64Url = (value: string): Uint8Array | null => {
  try {
    return decodeBase64Url(value);
  } catch {
    return null;
  }
};

const derivePasswordHash = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-512' }, key, 512
  );
  return new Uint8Array(bits);
};

const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${encodeBase64Url(salt)}:${encodeBase64Url(await derivePasswordHash(password, salt))}`;
};

const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [encodedSalt, encodedHash] = parts;
  if (!encodedSalt || !encodedHash) return false;
  const legacy = AUTH_LEGACY_PASSWORD_PATTERN.test(storedHash);
  // Express used the hexadecimal salt string itself as PBKDF2 input, not decoded salt bytes.
  const salt = legacy ? new TextEncoder().encode(encodedSalt) : tryDecodeBase64Url(encodedSalt);
  const expected = legacy
    ? Uint8Array.from(encodedHash.matchAll(AUTH_HEX_BYTE_PATTERN), ([byte]) => Number.parseInt(byte, 16))
    : tryDecodeBase64Url(encodedHash);
  if (!salt || !expected) return false;
  const actual = await derivePasswordHash(password, salt);
  if (actual.length !== expected.length) return false;
  return actual.reduce((result, byte, index) => result | (byte ^ expected[index]), 0) === 0;
};

export const createWorkerAuthToken = async (user: Record<string, unknown>, secret: string): Promise<string> => {
  const encode = (value: unknown): string => encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)));
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    userId: user.id,
    email: user.email,
    role: user.role,
    tier: user.subscription_tier,
    tenantId: typeof user.tenant_id === 'string' ? user.tenant_id : null,
    exp: Date.now() + AUTH_TOKEN_EXPIRY_SECONDS * 1000
  });
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
};

export const verifyToken = async (token: string, secret: string): Promise<Record<string, unknown> | null> => {
  const [header, encodedPayload, encodedSignature] = token.split('.');
  if (!header || !encodedPayload || !encodedSignature) return null;
  const signature = tryDecodeBase64Url(encodedSignature);
  if (!signature) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${header}.${encodedPayload}`));
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as Record<string, unknown>;
  return typeof payload.exp === 'number' && payload.exp > Date.now() ? payload : null;
};

export const authenticateWorkerUser = async (
  request: Request,
  environment: CloudflareEnvironment,
  adminOnly = false
): Promise<WorkerAuthCheckResult> => {
  if (!environment.DB || !environment.AUTH_SECRET) {
    return { status: 503, message: 'Cloudflare D1 or AUTH_SECRET is not configured.' };
  }
  const header = request.headers.get('Authorization') || request.headers.get('x-auth-token') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const claims = await verifyToken(token, environment.AUTH_SECRET);
  if (typeof claims?.userId !== 'string' || !claims.userId) {
    return { status: 401, message: 'Authentication required. Missing or invalid authorization token.' };
  }
  const user = await environment.DB.prepare(
    `SELECT User.id, User.name, User.email, User.role, User.status, User.tenant_id,
      TenantMaster.status AS tenant_status
      FROM User LEFT JOIN TenantMaster ON TenantMaster.tenant_id = User.tenant_id
      WHERE User.id = ?`
  ).bind(claims.userId).first<Record<string, unknown>>();
  if (!user || user.status !== AUTH_STATUS.ACTIVE) {
    return { status: 401, message: 'Authentication required. The user account is unavailable or inactive.' };
  }
  if (adminOnly && user.role !== AUTH_ROLES.ADMIN) {
    return { status: 403, message: AUTH_MESSAGES.FORBIDDEN_ADMIN_ONLY };
  }
  if (user.role !== AUTH_ROLES.ADMIN && user.role !== AUTH_ROLES.USER) {
    return { status: 403, message: 'The current account role cannot perform this action.' };
  }
  return {
    status: 200,
    user: {
      id: String(user.id),
      name: String(user.name || user.email),
      email: String(user.email),
      role: user.role as 'USER' | 'ADMIN',
      tenantId: typeof user.tenant_id === 'string' && user.tenant_id ? user.tenant_id : null,
      tenantActive: typeof user.tenant_id === 'string' && user.tenant_id
        ? user.tenant_status === AUTH_STATUS.ACTIVE
        : null
    }
  };
};

const result = (body: Record<string, unknown>, status: number): AuthRouteResult => ({ body, status });

const publicUser = (user: Record<string, unknown>): Record<string, unknown> => {
  const safeUser = { ...user };
  delete safeUser.password_hash;
  return safeUser;
};

const register = async (request: Request, database: CloudflareD1Database): Promise<AuthRouteResult> => {
  const parsed = registerUserSchema.safeParse(await readJson(request));
  if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const existing = await database.prepare(AUTH_SQL.USER_BY_NORMALIZED_EMAIL).bind(parsed.data.email).first();
  if (existing) return result({ success: false, message: AUTH_MESSAGES.EMAIL_EXISTS }, 409);
  const now = new Date().toISOString();
  const { password, ...profile } = parsed.data;
  const user = {
    id: `usr-${crypto.randomUUID()}`,
    ...profile,
    password_hash: await hashPassword(password),
    role: AUTH_ROLES.USER,
    status: AUTH_STATUS.PENDING,
    tenant_id: null,
    subscription_tier: parsed.data.subscription_tier || 'BRONZE',
    created_at: now,
    updated_at: now
  };
  const insertResult = await database.prepare(AUTH_SQL.REGISTER_IF_EMAIL_AVAILABLE).bind(
    user.id, user.name, user.mobile_number, user.email, user.company_name, user.company_address,
    user.password_hash, user.role, user.status, user.subscription_tier, null, now, now
  ).run();
  if (d1ChangedRows(insertResult) !== D1_SINGLE_ROW_CHANGE_COUNT) {
    const concurrentUser = await database.prepare(AUTH_SQL.USER_BY_NORMALIZED_EMAIL)
      .bind(user.email).first<{ id: string }>();
    const requestId = request.headers.get('x-request-id') || undefined;
    if (concurrentUser) {
      logger.warn('Registration rejected after a concurrent normalized-email conflict', {
        userId: concurrentUser.id, requestId, fallback: 'http-409'
      });
      return result({ success: false, message: AUTH_MESSAGES.EMAIL_EXISTS }, 409);
    }
    const error = new Error('Registration insert changed no rows and no normalized email conflict was found.');
    logger.error('Registration insert outcome could not be reconciled with the user registry', {
      attemptedUserId: user.id, requestId
    }, error);
    throw error;
  }
  logger.info('Enterprise account registration is awaiting tenant assignment', {
    userId: user.id, email: user.email, requestId: request.headers.get('x-request-id') || undefined
  });
  return result({ success: true, message: AUTH_MESSAGES.REGISTER_PENDING, user: publicUser(user) }, 201);
};

const login = async (request: Request, environment: CloudflareEnvironment): Promise<AuthRouteResult> => {
  const parsed = loginUserSchema.safeParse(await readJson(request));
  if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const userRow = await environment.DB?.prepare(
    `SELECT User.*, TenantMaster.status AS assigned_tenant_status FROM User
      LEFT JOIN TenantMaster ON TenantMaster.tenant_id = User.tenant_id
      WHERE lower(User.email) = lower(?1) OR User.id = ?1`
  ).bind(parsed.data.email).first<Record<string, unknown>>();
  if (!userRow) return result({ success: false, message: AUTH_MESSAGES.INVALID_CREDENTIALS }, 401);
  const { assigned_tenant_status: assignedTenantStatus, ...user } = userRow;
  const valid = typeof user.password_hash === 'string' && await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) return result({ success: false, message: AUTH_MESSAGES.INVALID_CREDENTIALS }, 401);
  if (user.status !== AUTH_STATUS.ACTIVE) {
    return result({
      success: false,
      message: user.status === AUTH_STATUS.PENDING || (user.role !== AUTH_ROLES.ADMIN && !user.tenant_id)
        ? AUTH_MESSAGES.TENANT_ASSIGNMENT_PENDING
        : AUTH_MESSAGES.ACCOUNT_INACTIVE
    }, 403);
  }
  if (user.role !== AUTH_ROLES.ADMIN && !user.tenant_id) {
    return result({ success: false, message: AUTH_MESSAGES.TENANT_ASSIGNMENT_PENDING }, 403);
  }
  if (user.role !== AUTH_ROLES.ADMIN && assignedTenantStatus !== AUTH_STATUS.ACTIVE) {
    logger.warn('Sign-in blocked because the assigned tenant is not active', {
      userId: user.id,
      tenantId: user.tenant_id,
      tenantStatus: assignedTenantStatus ?? null,
      requestId: request.headers.get('x-request-id') || undefined
    });
    return result({ success: false, message: AUTH_MESSAGES.TENANT_UNAVAILABLE }, 403);
  }
  logger.info('User signed in with an active account and tenant assignment', {
    userId: user.id,
    role: user.role,
    tenantId: user.tenant_id ?? null,
    requestId: request.headers.get('x-request-id') || undefined
  });
  return result({
    success: true,
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
    user: publicUser(user),
    token: await createWorkerAuthToken(user, environment.AUTH_SECRET || ''),
    expires_in_seconds: AUTH_TOKEN_EXPIRY_SECONDS
  }, 200);
};

const authenticatedUser = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Record<string, unknown> | null> => {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : authorization;
  const payload = await verifyToken(token, environment.AUTH_SECRET || '');
  if (!payload?.userId) return null;
  return environment.DB?.prepare('SELECT * FROM User WHERE id = ?1 AND status = ?2')
    .bind(payload.userId, AUTH_STATUS.ACTIVE)
    .first() || null;
};

const authenticatedRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<AuthRouteResult> => {
  const user = await authenticatedUser(request, environment);
  if (!user) {
    return result({
      success: false,
      message: 'Authentication required. Missing or invalid authorization token.'
    }, 401);
  }
  if (url.pathname.endsWith('/me') && request.method === 'GET') return result({ success: true, user: publicUser(user) }, 200);
  if (url.pathname.endsWith('/change-password') && request.method === 'POST') {
    const parsed = changePasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
    const valid = typeof user.password_hash === 'string' && await verifyPassword(parsed.data.currentPassword, user.password_hash);
    if (!valid) return result({ success: false, message: 'Current password is incorrect' }, 400);
    await environment.DB?.prepare(
      'UPDATE User SET password_hash = ?1, updated_at = ?2 WHERE id = ?3'
    ).bind(await hashPassword(parsed.data.newPassword), new Date().toISOString(), user.id).run();
    return result({ success: true, message: 'Password updated successfully' }, 200);
  }
  return result({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404);
};

export const handleAuthRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<AuthRouteResult> => {
  if (!environment.DB || !environment.AUTH_SECRET) return result({ success: false, message: 'Cloudflare D1 or AUTH_SECRET is not configured.' }, 503);
  if (url.pathname.endsWith('/register') && request.method === 'POST') return register(request, environment.DB);
  if (url.pathname.endsWith('/login') && request.method === 'POST') return login(request, environment);
  return authenticatedRoute(request, environment, url);
};

const provisionAdministrator = async (
  request: Request, environment: CloudflareEnvironment
): Promise<AuthRouteResult> => {
  if (!environment.DB || !environment.AUTH_SECRET) {
    return result({ success: false, message: 'Cloudflare D1 or AUTH_SECRET is not configured.' }, 503);
  }
  const adminCount = await environment.DB.prepare('SELECT COUNT(*) AS count FROM User WHERE role = ?')
    .bind(AUTH_ROLES.ADMIN).first<{ count: number }>();
  const bootstrap = Number(adminCount?.count || 0) === 0;
  if (!bootstrap) {
    const authorization = await authenticateWorkerUser(request, environment, true);
    if (!authorization.user) return result({ success: false, message: authorization.message }, authorization.status);
  }
  const parsed = adminProvisionSchema.safeParse(await readJson(request));
  if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const now = new Date().toISOString();
  const email = parsed.data.email.toLowerCase();
  const existing = await environment.DB.prepare('SELECT id FROM User WHERE lower(email) = lower(?)')
    .bind(email).first<{ id: string }>();
  const userId = existing?.id || `usr-${crypto.randomUUID()}`;
  const user = {
    id: userId,
    name: parsed.data.name,
    mobile_number: parsed.data.mobile_number,
    email,
    company_name: parsed.data.company_name,
    company_address: parsed.data.company_address,
    role: AUTH_ROLES.ADMIN,
    status: AUTH_STATUS.ACTIVE,
    subscription_tier: 'GOLD',
    created_at: now,
    updated_at: now
  };
  const passwordHash = await hashPassword(parsed.data.password);
  if (existing) {
    await environment.DB.prepare(`
      UPDATE User SET name = ?, mobile_number = ?, email = ?, company_name = ?, company_address = ?,
        password_hash = ?, role = ?, status = ?, subscription_tier = ?, updated_at = ? WHERE id = ?
    `).bind(
      user.name, user.mobile_number, user.email, user.company_name, user.company_address,
      passwordHash, user.role, user.status, user.subscription_tier, now, existing.id
    ).run();
  } else {
    await environment.DB.prepare(`
      INSERT INTO User (id, name, mobile_number, email, company_name, company_address,
        password_hash, role, status, subscription_tier, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id, user.name, user.mobile_number, user.email, user.company_name, user.company_address,
      passwordHash, user.role, user.status, user.subscription_tier, now, now
    ).run();
  }
  return result({
    success: true,
    message: existing ? 'Administrator profile updated successfully.' : 'Administrator account provisioned successfully.',
    user: publicUser(user)
  }, existing ? 200 : 201);
};

export const handleAdminRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<AuthRouteResult> => {
  if (!environment.DB || !environment.AUTH_SECRET) {
    return result({ success: false, message: 'Cloudflare D1 or AUTH_SECRET is not configured.' }, 503);
  }

  if (url.pathname === '/api/admin/create-admin' && request.method === 'POST') {
    return provisionAdministrator(request, environment);
  }

  const authorization = await authenticateWorkerUser(request, environment, true);
  if (!authorization.user) {
    return result({
      success: false,
      message: authorization.status === 403 ? AUTH_MESSAGES.FORBIDDEN_ADMIN_ONLY : authorization.message
    }, authorization.status);
  }

  if (url.pathname.startsWith('/api/admin/pcbi/data-lab')) {
    const actorName = authorization.user.email || authorization.user.id;
    const dataLabResult = await handlePcbiDataLabRoute(environment, request, url, actorName);
    return {
      body: dataLabResult.data as Record<string, unknown>,
      status: dataLabResult.status || 200
    };
  }

  if (url.pathname === '/api/admin/tenants' && request.method === 'GET') {
    const tenants = await environment.DB.prepare(
      'SELECT tenant_id, enterprise_name, status FROM TenantMaster ORDER BY enterprise_name, tenant_id'
    ).all<Record<string, unknown>>();
    return result({ success: true, tenants: tenants.results || [] }, 200);
  }

  const tenantMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/tenant$/u);
  if (tenantMatch && request.method === 'PATCH') {
    const userId = decodeURIComponent(tenantMatch[1]);
    const parsed = adminAssignUserTenantSchema.safeParse(await readJson(request));
    if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
    const [user, tenant] = await Promise.all([
      environment.DB.prepare('SELECT id, role FROM User WHERE id = ?').bind(userId).first<{ id: string; role: string }>(),
      environment.DB.prepare('SELECT tenant_id, enterprise_name, status FROM TenantMaster WHERE tenant_id = ?')
        .bind(parsed.data.tenant_id).first<{ tenant_id: string; enterprise_name: string; status: string }>()
    ]);
    if (!user) return result({ success: false, message: AUTH_MESSAGES.USER_NOT_FOUND }, 404);
    if (user.role !== AUTH_ROLES.USER && user.role !== AUTH_ROLES.ADMIN) {
      return result({ success: false, message: AUTH_MESSAGES.TENANT_ASSIGNMENT_ACCOUNT_ONLY }, 409);
    }
    if (!tenant) return result({ success: false, message: AUTH_MESSAGES.TENANT_NOT_FOUND }, 404);
    if (tenant.status !== AUTH_STATUS.ACTIVE) {
      return result({ success: false, message: AUTH_MESSAGES.TENANT_UNAVAILABLE }, 409);
    }
    const now = new Date().toISOString();
    await environment.DB.prepare(
      'UPDATE User SET tenant_id = ?, status = ?, updated_at = ? WHERE id = ? AND role = ?'
    ).bind(tenant.tenant_id, AUTH_STATUS.ACTIVE, now, user.id, user.role).run();
    const assigned = await environment.DB.prepare(
      'SELECT id, name, mobile_number, email, company_name, company_address, role, status, subscription_tier, tenant_id, created_at, updated_at FROM User WHERE id = ?'
    ).bind(user.id).first<Record<string, unknown>>();
    if (!assigned || assigned.role !== user.role || assigned.status !== AUTH_STATUS.ACTIVE || assigned.tenant_id !== tenant.tenant_id) {
      logger.warn('Tenant assignment did not persist the expected account scope', {
        actorId: authorization.user.id,
        userId,
        tenantId: tenant.tenant_id,
        persistedTenantId: assigned?.tenant_id ?? null,
        persistedStatus: assigned?.status ?? null,
        requestId: request.headers.get('x-request-id') || undefined
      });
      return result({ success: false, message: AUTH_MESSAGES.USER_NOT_FOUND }, 409);
    }
    logger.info('Administrator assigned an enterprise user to a tenant', {
      actorId: authorization.user.id, userId, tenantId: tenant.tenant_id,
      requestId: request.headers.get('x-request-id') || undefined
    });
    return result({ success: true, message: AUTH_MESSAGES.TENANT_ASSIGNMENT_COMPLETE, user: assigned }, 200);
  }

  if (url.pathname === '/api/admin/pcbi' || url.pathname.startsWith('/api/admin/pcbi/')) {
    const adminResult = await handlePcbiAdminRoute(environment.DB, request, url);
    return {
      body: adminResult.data as Record<string, unknown>,
      status: adminResult.status || 200
    };
  }

  // GET /api/admin/users
  if (url.pathname.endsWith('/users') && request.method === 'GET') {
    const search = url.searchParams.get('search')?.trim().toLowerCase() || '';
    const role = url.searchParams.get('role')?.trim() || '';
    const status = url.searchParams.get('status')?.trim() || '';
    const tier = url.searchParams.get('tier')?.trim() || '';

    const queryResult = await environment.DB.prepare(
      'SELECT id, name, mobile_number, email, company_name, company_address, role, status, subscription_tier, tenant_id, created_at, updated_at FROM User ORDER BY created_at DESC'
    ).all<Record<string, unknown>>();

    let users = (queryResult.results || []) as Record<string, unknown>[];

    if (search) {
      users = users.filter((u) =>
        String(u.name || '').toLowerCase().includes(search) ||
        String(u.email || '').toLowerCase().includes(search) ||
        String(u.company_name || '').toLowerCase().includes(search)
      );
    }
    if (role && role !== 'ALL') {
      users = users.filter((u) => u.role === role);
    }
    if (status && status !== 'ALL') {
      users = users.filter((u) => u.status === status);
    }
    if (tier && tier !== 'ALL') {
      users = users.filter((u) => u.subscription_tier === tier);
    }

    const activeCount = users.filter((u) => u.status === AUTH_STATUS.ACTIVE).length;
    const uniqueCompanies = new Set(users.map((u) => String(u.company_name || '').trim().toLowerCase())).size;

    return result({
      success: true,
      users,
      total: users.length,
      activeCount,
      companiesCount: uniqueCompanies
    }, 200);
  }

  // PATCH /api/admin/users/:id/status
  const statusMatch = url.pathname.match(/\/admin\/users\/([^/]+)\/status$/);
  if (statusMatch && request.method === 'PATCH') {
    const userId = decodeURIComponent(statusMatch[1]);
    const parsed = adminUpdateUserStatusSchema.safeParse(await readJson(request));
    if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
    const newStatus = parsed.data.status;
    const user = await environment.DB.prepare('SELECT * FROM User WHERE id = ?1').bind(userId).first<Record<string, unknown>>();
    if (!user) {
      return result({ success: false, message: 'User not found in registry' }, 404);
    }
    if (newStatus === AUTH_STATUS.ACTIVE && user.role === AUTH_ROLES.USER && !user.tenant_id) {
      logger.warn('Rejected activation of an enterprise user without a tenant assignment', {
        actorId: authorization.user.id,
        userId,
        requestId: request.headers.get('x-request-id') || undefined
      });
      return result({ success: false, message: AUTH_MESSAGES.TENANT_REQUIRED_FOR_ACTIVATION }, 409);
    }
    const now = new Date().toISOString();
    const update = await environment.DB.prepare('UPDATE User SET status = ?1, updated_at = ?2 WHERE id = ?3 AND role = ?4')
      .bind(newStatus, now, userId, user.role)
      .run();
    const affectedRows = d1ChangedRows(update);
    if (affectedRows !== D1_SINGLE_ROW_CHANGE_COUNT) {
      logger.warn('Administrator status update did not affect the expected account row', {
        actorId: authorization.user.id, userId, requestedStatus: newStatus, affectedRows,
        requestId: request.headers.get('x-request-id') || undefined
      });
      return result({ success: false, message: AUTH_MESSAGES.USER_UPDATE_CONFLICT }, 409);
    }
    logger.info('Administrator updated an account status', {
      actorId: authorization.user.id, userId, previousStatus: user.status, newStatus,
      requestId: request.headers.get('x-request-id') || undefined
    });
    const updated = { ...user, status: newStatus, updated_at: now };
    return result({
      success: true,
      message: 'User status updated successfully',
      user: publicUser(updated)
    }, 200);
  }

  // PATCH /api/admin/users/:id/tier
  const tierMatch = url.pathname.match(/\/admin\/users\/([^/]+)\/tier$/);
  if (tierMatch && request.method === 'PATCH') {
    const userId = decodeURIComponent(tierMatch[1]);
    const parsed = adminUpdateUserTierSchema.safeParse(await readJson(request));
    if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
    const newTier = parsed.data.tier;
    const user = await environment.DB.prepare('SELECT * FROM User WHERE id = ?1').bind(userId).first<Record<string, unknown>>();
    if (!user) {
      return result({ success: false, message: 'User not found in registry' }, 404);
    }
    const now = new Date().toISOString();
    const update = await environment.DB.prepare(
      'UPDATE User SET subscription_tier = ?1, updated_at = ?2 WHERE id = ?3 AND role = ?4'
    ).bind(newTier, now, userId, user.role).run();
    const affectedRows = d1ChangedRows(update);
    if (affectedRows !== D1_SINGLE_ROW_CHANGE_COUNT) {
      logger.warn('Administrator subscription-tier update did not affect the expected account row', {
        actorId: authorization.user.id, userId, requestedTier: newTier, affectedRows,
        requestId: request.headers.get('x-request-id') || undefined
      });
      return result({ success: false, message: AUTH_MESSAGES.USER_UPDATE_CONFLICT }, 409);
    }
    logger.info('Administrator updated an account subscription tier', {
      actorId: authorization.user.id, userId, previousTier: user.subscription_tier, newTier,
      requestId: request.headers.get('x-request-id') || undefined
    });
    const updated = { ...user, subscription_tier: newTier, updated_at: now };
    return result({
      success: true,
      message: 'User subscription tier updated successfully',
      user: publicUser(updated)
    }, 200);
  }

  return result({ success: false, message: 'Endpoint not found in the Cloudflare Worker.' }, 404);
};
