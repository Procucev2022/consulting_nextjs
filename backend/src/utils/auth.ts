/**
 * Authentication and Token Utilities (Backend)
 */

import crypto from 'crypto';
import { encryptField, decryptField } from './encryption';
import { AUTH_TOKEN_EXPIRY_SECONDS } from '../constants/auth';
import type { UserProfileResponse, UserRecord } from '../types/auth';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

/**
 * Hash a plaintext password with a random 16-byte salt using PBKDF2-SHA512.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored salt:hash string using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash?.includes(':')) {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return false;
  }
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const hashBuf = Buffer.from(hash, 'hex');
  const origBuf = Buffer.from(originalHash, 'hex');
  if (hashBuf.length !== origBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(hashBuf, origBuf);
}

/**
 * Generates an encrypted AES-256-GCM session token for authenticated users.
 */
export function generateAuthToken(userId: string, email: string, role: string): string {
  const payload: TokenPayload = {
    userId,
    email,
    role,
    exp: Date.now() + AUTH_TOKEN_EXPIRY_SECONDS * 1000
  };
  return encryptField(payload);
}

/**
 * Verifies and decodes an AES-256-GCM session token.
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    const payload = decryptField<TokenPayload>(token);
    if (!payload?.userId || !payload?.email || !payload?.role || !payload?.exp) {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null; // Expired token
    }
    return payload;
  } catch {
    return null;
  }
}

function formatTimestamp(value?: Date | string | null): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value) {
    return String(value);
  }
  return new Date().toISOString();
}

/**
 * Sanitizes a database UserRecord into a public UserProfileResponse.
 */
export function sanitizeUserProfile(user: UserRecord | Partial<UserRecord>): UserProfileResponse {
  return {
    id: user.id || '',
    name: user.name || '',
    mobile_number: user.mobile_number || '',
    email: user.email || '',
    company_name: user.company_name || '',
    company_address: user.company_address || '',
    role: user.role || 'USER',
    status: user.status || 'ACTIVE',
    created_at: formatTimestamp(user.created_at),
    updated_at: formatTimestamp(user.updated_at)
  };
}

