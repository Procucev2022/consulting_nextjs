import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateAuthToken,
  verifyAuthToken,
  sanitizeUserProfile
} from '../../src/utils/auth';
import { encryptField } from '../../src/utils/encryption';

describe('Backend Auth Utilities', () => {
  it('should hash and verify passwords correctly with random salt', () => {
    const password = 'StrongPassword@123';
    const hash = hashPassword(password);

    expect(hash).toContain(':');
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
    expect(verifyPassword('', hash)).toBe(false);
    expect(verifyPassword(password, '')).toBe(false);
    expect(verifyPassword(password, 'invalid-hash-without-salt')).toBe(false);
  });

  it('should handle verifyPassword errors or length mismatch gracefully', () => {
    expect(verifyPassword('pass', 'salt:12')).toBe(false);
    expect(verifyPassword('pass', 'salt:not-hex-chars-1234567890')).toBe(false);
    expect(verifyPassword('pass', 'bad:salt:extra')).toBe(false);
    expect(verifyPassword('pass', ':hash')).toBe(false);
    expect(verifyPassword('pass', 'salt:')).toBe(false);
    expect(verifyPassword('pass', ':')).toBe(false);
  });

  it('should generate and verify encrypted auth session tokens', () => {
    const token = generateAuthToken('usr-100', 'user@company.com', 'USER', 'SILVER');
    expect(token).toBeDefined();

    const decoded = verifyAuthToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('usr-100');
    expect(decoded?.email).toBe('user@company.com');
    expect(decoded?.role).toBe('USER');
    expect(decoded?.tier).toBe('SILVER');
    expect(decoded?.exp).toBeGreaterThan(Date.now());

    // Default tier fallback
    const defaultToken = generateAuthToken('usr-101', 'u@c.com', 'USER');
    const defaultDecoded = verifyAuthToken(defaultToken);
    expect(defaultDecoded?.tier).toBe('BRONZE');
  });

  it('should return null for invalid or expired auth tokens', () => {
    expect(verifyAuthToken('')).toBeNull();
    expect(verifyAuthToken('invalid-token-format')).toBeNull();
    expect(verifyAuthToken(null as any)).toBeNull();
    expect(verifyAuthToken(123 as any)).toBeNull();

    // Fabricated expired token
    const expiredPayload = {
      userId: 'usr-expired',
      email: 'expired@test.com',
      role: 'USER',
      exp: Date.now() - 100000 // In the past
    };
    const expiredToken = encryptField(expiredPayload);
    expect(verifyAuthToken(expiredToken)).toBeNull();

    // Token with missing fields
    const missingEmail = encryptField({ userId: 'u1', role: 'USER', exp: Date.now() + 10000 });
    expect(verifyAuthToken(missingEmail)).toBeNull();

    const missingRole = encryptField({ userId: 'u1', email: 'a@b.com', exp: Date.now() + 10000 });
    expect(verifyAuthToken(missingRole)).toBeNull();

    const missingExp = encryptField({ userId: 'u1', email: 'a@b.com', role: 'USER' });
    expect(verifyAuthToken(missingExp)).toBeNull();

    const primitiveToken = encryptField('not-an-object');
    expect(verifyAuthToken(primitiveToken)).toBeNull();
  });

  it('should sanitize user profiles removing password hashes', () => {
    const rawUser = {
      id: 'usr-999',
      name: 'John Doe',
      mobile_number: '+91 99999 88888',
      email: 'john@enterprise.com',
      company_name: 'Enterprise Corp',
      company_address: '123 Tech Park, Bengaluru',
      password_hash: 'secret-hash',
      role: 'USER',
      status: 'ACTIVE',
      created_at: new Date('2026-01-01T10:00:00Z'),
      updated_at: new Date('2026-01-01T10:00:00Z')
    };

    const sanitized = sanitizeUserProfile(rawUser);
    expect((sanitized as any).password_hash).toBeUndefined();
    expect(sanitized.id).toBe('usr-999');
    expect(sanitized.email).toBe('john@enterprise.com');
    expect(sanitized.created_at).toBe('2026-01-01T10:00:00.000Z');
  });

  it('should handle string created_at dates in sanitizeUserProfile', () => {
    const rawUser = {
      id: 'usr-888',
      name: 'Jane Doe',
      mobile_number: '1234567890',
      email: 'jane@test.com',
      company_name: 'Test Corp',
      company_address: 'Address',
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-01T00:00:00.000Z'
    };

    const sanitized = sanitizeUserProfile(rawUser);
    expect(sanitized.created_at).toBe('2026-05-01T00:00:00.000Z');
  });

  it('should handle undefined or null dates in sanitizeUserProfile gracefully', () => {
    const rawUser = {
      id: 'usr-777',
      name: 'No Dates',
      mobile_number: '1234567890',
      email: 'nodate@test.com',
      company_name: 'Test Corp',
      company_address: 'Address',
      role: 'USER',
      status: 'ACTIVE'
    };

    const sanitized = sanitizeUserProfile(rawUser);
    expect(sanitized.created_at).toBeDefined();
    expect(sanitized.updated_at).toBeDefined();
  });

  it('should fall back to default values when user fields are missing or empty', () => {
    const emptySanitized = sanitizeUserProfile({});
    expect(emptySanitized.id).toBe('');
    expect(emptySanitized.name).toBe('');
    expect(emptySanitized.mobile_number).toBe('');
    expect(emptySanitized.email).toBe('');
    expect(emptySanitized.company_name).toBe('');
    expect(emptySanitized.company_address).toBe('');
    expect(emptySanitized.role).toBe('USER');
    expect(emptySanitized.status).toBe('ACTIVE');
    expect(emptySanitized.subscription_tier).toBe('BRONZE');
    expect(emptySanitized.created_at).toBeDefined();
    expect(emptySanitized.updated_at).toBeDefined();
  });
});

