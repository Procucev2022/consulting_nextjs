import { loginUserSchema, registerUserSchema, changePasswordSchema } from './constants/validation';
import { AUTH_ROLES, AUTH_STATUS, AUTH_TOKEN_EXPIRY_SECONDS } from './constants/auth';
import type { AuthRouteResult, CloudflareEnvironment } from './types/cloudflare';

const encodeBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
};

const decodeBase64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
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
  const [encodedSalt, encodedHash] = storedHash.split(':');
  if (!encodedSalt || !encodedHash) return false;
  const expected = decodeBase64Url(encodedHash);
  const actual = await derivePasswordHash(password, decodeBase64Url(encodedSalt));
  if (actual.length !== expected.length) return false;
  return actual.reduce((result, byte, index) => result | (byte ^ expected[index]), 0) === 0;
};

const createToken = async (user: Record<string, unknown>, secret: string): Promise<string> => {
  const encode = (value: unknown): string => encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)));
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    userId: user.id,
    email: user.email,
    role: user.role,
    tier: user.subscription_tier,
    exp: Date.now() + AUTH_TOKEN_EXPIRY_SECONDS * 1000
  });
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
};

const verifyToken = async (token: string, secret: string): Promise<Record<string, unknown> | null> => {
  const [header, encodedPayload, encodedSignature] = token.split('.');
  if (!header || !encodedPayload || !encodedSignature) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, decodeBase64Url(encodedSignature), new TextEncoder().encode(`${header}.${encodedPayload}`));
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as Record<string, unknown>;
  return typeof payload.exp === 'number' && payload.exp > Date.now() ? payload : null;
};

const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' ? body as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const result = (body: Record<string, unknown>, status: number): AuthRouteResult => ({ body, status });

const publicUser = (user: Record<string, unknown>): Record<string, unknown> => {
  const safeUser = { ...user };
  delete safeUser.password_hash;
  return safeUser;
};

const register = async (request: Request, environment: CloudflareEnvironment): Promise<AuthRouteResult> => {
  const parsed = registerUserSchema.safeParse(await readJson(request));
  if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const existing = await environment.DB?.prepare('SELECT id FROM User WHERE email = ?1').bind(parsed.data.email).first();
  if (existing) return result({ success: false, message: 'An account with this organization email already exists' }, 409);
  const now = new Date().toISOString();
  const user = {
    id: `usr-${crypto.randomUUID()}`,
    ...parsed.data,
    password_hash: await hashPassword(parsed.data.password),
    role: AUTH_ROLES.USER,
    status: AUTH_STATUS.ACTIVE,
    subscription_tier: parsed.data.subscription_tier || 'BRONZE',
    created_at: now,
    updated_at: now
  };
  await environment.DB?.prepare('INSERT INTO User (id, name, mobile_number, email, company_name, company_address, password_hash, role, status, subscription_tier, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)').bind(user.id, user.name, user.mobile_number, user.email, user.company_name, user.company_address, user.password_hash, user.role, user.status, user.subscription_tier, now, now).run();
  return result({ success: true, message: 'User account registered successfully', token: await createToken(user, environment.AUTH_SECRET || ''), user: publicUser(user), expires_in_seconds: AUTH_TOKEN_EXPIRY_SECONDS }, 201);
};

const login = async (request: Request, environment: CloudflareEnvironment): Promise<AuthRouteResult> => {
  const parsed = loginUserSchema.safeParse(await readJson(request));
  if (!parsed.success) return result({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400);
  const user = await environment.DB?.prepare(
    'SELECT * FROM User WHERE lower(email) = lower(?1) OR id = ?1'
  ).bind(parsed.data.email).first<Record<string, unknown>>();
  const valid = user && typeof user.password_hash === 'string' && await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) return result({ success: false, message: 'Invalid organization email or password' }, 401);
  if (user.status === AUTH_STATUS.SUSPENDED) {
    return result({
      success: false,
      message: 'Account is currently suspended or inactive. Please contact support.'
    }, 403);
  }
  return result({
    success: true,
    message: 'Authentication successful',
    user: publicUser(user),
    token: await createToken(user, environment.AUTH_SECRET || ''),
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
  return environment.DB?.prepare('SELECT * FROM User WHERE id = ?1')
    .bind(payload.userId)
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
  if (url.pathname.endsWith('/register') && request.method === 'POST') return register(request, environment);
  if (url.pathname.endsWith('/login') && request.method === 'POST') return login(request, environment);
  return authenticatedRoute(request, environment, url);
};