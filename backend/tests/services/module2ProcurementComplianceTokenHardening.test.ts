/**
 * Lever 9: Procurement Compliance — Dedicated Token Hardening & Cryptographic Security Suite (Prompt 467)
 * Validates:
 * 1. Token expiry enforcement (expired tokens rejected with 401).
 * 2. AES-256-GCM authentication-tag tampering and ciphertext corruption rejection (401).
 * 3. Parameter/body role spoofing resistance (query/body values cannot alter verified token identity/role).
 * 4. Assessment isolation against body/query override attempts.
 * 5. Encryption key validation and missing/invalid key handling.
 * 6. Audit integrity and dev bypass isolation in production.
 * Compliant with Rule 1, 4, 8, 9, 10, max 300 lines, line length <= 120 chars
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { Module2ProcurementComplianceController } from '../../src/controllers/module2ProcurementCompliance.controller';
import { Module2ProcurementComplianceEngine } from '../../src/services/module2ProcurementComplianceEngine';
import { ComplianceAuditStore } from '../../src/services/complianceAuditStore';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { generateAuthToken, verifyAuthToken } from '../../src/utils/auth';
import { encryptData, resolveEncryptionKey, serializeEncryptedPayload } from '../../src/utils/encryption';
import { Module2ComplianceAuth } from '../../src/utils/module2ComplianceAuth';
import { CRYPTO_ERRORS, DEFAULT_DEV_ENCRYPTION_KEY } from '../../src/constants/crypto';

interface MockResponseContext {
  res: Response;
  getStatus: () => number;
  getBody: () => Record<string, unknown>;
}

describe('Lever 9: Token Hardening & Cryptographic Security Verification (Prompt 467)', () => {
  beforeAll(async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    ComplianceAuditStore.getInstance().setCustomDataDir(devDir);
    Module2CanonicalService.clearCache();
    await Module2ProcurementComplianceEngine.calculateProcurementCompliance('AIC-2026-0002');
  }, 120000);

  beforeEach(() => {
    ComplianceAuditStore.getInstance().clear();
  });

  const createMockResponse = (): MockResponseContext => {
    let statusCode = 200;
    let body: Record<string, unknown> = {};
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: unknown) => {
        body = (data as Record<string, unknown>) ?? {};
        return res;
      },
      setHeader: vi.fn(),
      send: (data: unknown) => {
        body = { raw: data };
      }
    } as unknown as Response;

    return {
      res,
      getStatus: () => statusCode,
      getBody: () => body
    };
  };

  describe('1. Token Expiry Enforcement', () => {
    it('rejects expired session token with 401', () => {
      const expiredPayload = {
        userId: 'usr-exp-1',
        email: 'expired.user@procucev.com',
        role: 'AUDIT_LEAD',
        tier: 'GOLD',
        tenantId: 'AIC-2026-0002',
        exp: Date.now() - 60000
      };
      const encrypted = encryptData(expiredPayload);
      const expiredToken = serializeEncryptedPayload(encrypted);

      const decoded = verifyAuthToken(expiredToken);
      expect(decoded).toBeNull();

      const req = {
        query: { assessmentId: 'AIC-2026-0002' },
        headers: { authorization: `Bearer ${expiredToken}` }
      } as unknown as Request;
      const auth = Module2ComplianceAuth.resolveAuthContext(req, 'AIC-2026-0002');
      expect(auth.authorized).toBe(false);
      expect(auth.statusCode).toBe(401);
      expect(auth.message).toContain('Authentication failed');
    });
  });

  describe('2. AES-256-GCM Tag Validation & Tampering Defense', () => {
    it('rejects tampered authentication tag with 401', () => {
      const validToken = generateAuthToken('usr-tamper-1', 'tamper@procucev.com', 'AUDIT_LEAD', 'GOLD', 'AIC-2026-0002');
      const parts = validToken.split(':');
      expect(parts.length).toBeGreaterThanOrEqual(4);

      const tamperedTag = parts[2].substring(0, parts[2].length - 2) + 'ff';
      const tamperedToken = [parts[0], parts[1], tamperedTag, parts[3]].join(':');

      const decoded = verifyAuthToken(tamperedToken);
      expect(decoded).toBeNull();

      const req = {
        query: { assessmentId: 'AIC-2026-0002' },
        headers: { authorization: `Bearer ${tamperedToken}` }
      } as unknown as Request;
      const auth = Module2ComplianceAuth.resolveAuthContext(req, 'AIC-2026-0002');
      expect(auth.authorized).toBe(false);
      expect(auth.statusCode).toBe(401);
    });

    it('rejects corrupted ciphertext with 401', () => {
      const validToken = generateAuthToken('usr-tamper-2', 'tamper2@procucev.com', 'AUDIT_LEAD', 'GOLD', 'AIC-2026-0002');
      const parts = validToken.split(':');
      const tamperedCiphertext = '00' + parts[3].substring(2);
      const tamperedToken = [parts[0], parts[1], parts[2], tamperedCiphertext].join(':');

      const decoded = verifyAuthToken(tamperedToken);
      expect(decoded).toBeNull();
    });
  });

  describe('3. Parameter and Body Spoofing Resistance', () => {
    it('ignores query parameter role and rejects low-privilege token', async () => {
      const userToken = generateAuthToken('usr-spoof-1', 'spoof@procucev.com', 'USER', 'BRONZE', 'AIC-2026-0002');
      const req = {
        query: { assessmentId: 'AIC-2026-0002', role: 'ADMIN', userRole: 'AUDIT_LEAD' },
        headers: { authorization: `Bearer ${userToken}` }
      } as unknown as Request;
      const { res, getStatus } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(403);
    });

    it('rejects request when assessment access is attempted outside token tenant', async () => {
      const tokenAbc = generateAuthToken('usr-tenant-1', 'abc.officer@procucev.com', 'AUDIT_LEAD', 'GOLD', 'AIC-2026-0002');
      const req = {
        query: { assessmentId: 'AIC-2026-0003' },
        headers: { authorization: `Bearer ${tokenAbc}` }
      } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(403);
      expect(String(getBody().message)).toContain('not authorized to access "AIC-2026-0003"');
    });
  });

  describe('4. Encryption Key Configuration & Safety', () => {
    it('throws error when encryption key is not exactly 32 bytes', () => {
      expect(() => resolveEncryptionKey('short-key')).toThrow(CRYPTO_ERRORS.INVALID_KEY);
      expect(() => resolveEncryptionKey(Buffer.from('too-short'))).toThrow(CRYPTO_ERRORS.INVALID_KEY);
    });

    it('successfully resolves 32-byte 64-character hex key', () => {
      const valid64Hex = 'a'.repeat(64);
      const buf = resolveEncryptionKey(valid64Hex);
      expect(buf.length).toBe(32);
    });

    it('strictly forbids missing APP_ENCRYPTION_KEY when NODE_ENV is production', () => {
      const origEnv = process.env.NODE_ENV;
      const origKey = process.env.APP_ENCRYPTION_KEY;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.APP_ENCRYPTION_KEY;
        expect(() => resolveEncryptionKey()).toThrow('APP_ENCRYPTION_KEY must be configured in production environment');
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origKey !== undefined) process.env.APP_ENCRYPTION_KEY = origKey;
        else delete process.env.APP_ENCRYPTION_KEY;
      }
    });

    it('strictly forbids hardcoded dev key when NODE_ENV is production', () => {
      const origEnv = process.env.NODE_ENV;
      const origKey = process.env.APP_ENCRYPTION_KEY;
      try {
        process.env.NODE_ENV = 'production';
        process.env.APP_ENCRYPTION_KEY = DEFAULT_DEV_ENCRYPTION_KEY;
        expect(() => resolveEncryptionKey()).toThrow('Development encryption key cannot be used in production environment');
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origKey !== undefined) process.env.APP_ENCRYPTION_KEY = origKey;
        else delete process.env.APP_ENCRYPTION_KEY;
      }
    });
  });

  describe('5. Audit Integrity & Server Identity Binding', () => {
    it('persists verified token email and role to audit ledger on review', async () => {
      const token = generateAuthToken('usr-audit-1', 'auditor.lead@firm.com', 'AUDIT_LEAD', 'GOLD', 'AIC-2026-0002');
      const req = {
        headers: { authorization: `Bearer ${token}` },
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0001',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Forged Body Name',
          reviewerRole: 'ADMIN',
          technicalJustification: 'Cryptographic binding verification'
        }
      } as unknown as Request;
      const { res, getStatus } = createMockResponse();

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(getStatus()).toBe(200);

      const history = ComplianceAuditStore.getInstance().getReviewHistoryForException('AIC-2026-0002', 'COMPL-PRC-0001');
      expect(history.length).toBeGreaterThan(0);
      const entry = history[history.length - 1];
      expect(entry.reviewerName).toBe('auditor.lead@firm.com');
      expect(entry.reviewerRole).toBe('AUDIT_LEAD');
    });
  });

  describe('6. Token Extraction Variants & Query Param Support', () => {
    it('successfully extracts token from query parameter', () => {
      const validToken = generateAuthToken('usr-q-1', 'query.user@procucev.com', 'AUDIT_LEAD', 'GOLD', 'AIC-2026-0002');
      const req = {
        query: { token: validToken },
        headers: {}
      } as unknown as Request;
      const auth = Module2ComplianceAuth.resolveAuthContext(req, 'AIC-2026-0002');
      expect(auth.authorized).toBe(true);
      expect(auth.user?.userId).toBe('usr-q-1');
    });

    it('successfully extracts token from x-auth-token header without Bearer', () => {
      const validToken = generateAuthToken('usr-x-1', 'xauth.user@procucev.com', 'AUDIT_LEAD', 'GOLD', 'AIC-2026-0002');
      const req = {
        query: {},
        headers: { 'x-auth-token': validToken }
      } as unknown as Request;
      const auth = Module2ComplianceAuth.resolveAuthContext(req, 'AIC-2026-0002');
      expect(auth.authorized).toBe(true);
      expect(auth.user?.userId).toBe('usr-x-1');
    });
  });

  describe('7. Production Safety of Development Bypass', () => {
    it('strictly forbids dev bypass when NODE_ENV is production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_AUTH_BYPASS;
      try {
        process.env.NODE_ENV = 'production';
        process.env.ALLOW_DEV_AUTH_BYPASS = 'true';

        const req = {
          headers: { 'x-dev-auth-bypass': 'true' },
          query: {}
        } as unknown as Request;

        const auth = Module2ComplianceAuth.resolveAuthContext(req, 'AIC-2026-0002');
        expect(auth.authorized).toBe(false);
        expect(auth.statusCode).toBe(401);
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.ALLOW_DEV_AUTH_BYPASS = originalAllow;
      }
    });

    it('allows dev bypass only when non-production and explicitly configured and requested', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_AUTH_BYPASS;
      try {
        process.env.NODE_ENV = 'development';
        process.env.ALLOW_DEV_AUTH_BYPASS = 'true';

        const req = {
          headers: { 'x-dev-auth-bypass': 'true' },
          query: {}
        } as unknown as Request;

        const auth = Module2ComplianceAuth.resolveAuthContext(req, 'AIC-2026-0002');
        expect(auth.authorized).toBe(true);
        expect(auth.user?.userId).toBe('usr-dev-auditor');
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.ALLOW_DEV_AUTH_BYPASS = originalAllow;
      }
    });
  });
});
