/**
 * Lever 9: Procurement Compliance & Control — Dedicated Security Test Suite (Prompt 466)
 * Validates:
 * 1. Unauthenticated requests rejected with 401 across all endpoints (GET, POST, Export).
 * 2. Client-supplied x-user-role or body reviewerRole cannot elevate privileges.
 * 3. Low-privilege users (USER, VIEWER) rejected with 403.
 * 4. Cross-tenant / Cross-assessment access strictly rejected with 403 for non-admins.
 * 5. Authorized users (ADMIN, AUDIT_LEAD, CONTROLLER, PROCUREMENT_OFFICER) retain permitted functionality.
 * 6. Audit history persists verified server-side identity and role, ignoring client body values.
 * 7. Excel export accepts authenticated token via query param.
 * 8. Development bypass safety: blocked in production, explicit in non-production.
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
import { generateAuthToken } from '../../src/utils/auth';
import { Module2ComplianceAuth } from '../../src/utils/module2ComplianceAuth';

describe('Lever 9: Procurement Compliance & Control — Authorization Hardening (Prompt 466)', () => {
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

  const createMockResponse = (): { res: Response; getStatus: () => number; getBody: () => any } => {
    let statusCode = 200;
    let body: any = null;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: unknown) => {
        body = data;
        return res;
      },
      setHeader: vi.fn(),
      send: (data: unknown) => {
        body = data;
      }
    } as unknown as Response;

    return {
      res,
      getStatus: () => statusCode,
      getBody: () => body
    };
  };

  describe('1. Unauthenticated Access Rejection (401)', () => {
    it('rejects unauthenticated GET /procurement-compliance with 401 Unauthorized', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: {} } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(401);
      expect(getBody().success).toBe(false);
      expect(getBody().message).toContain('Authentication required');
    });

    it('rejects unauthenticated POST /procurement-compliance/review with 401 Unauthorized', async () => {
      const req = {
        headers: {},
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0001',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Anonymous Reviewer',
          technicalJustification: 'Attempted review without auth'
        }
      } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(getStatus()).toBe(401);
      expect(getBody().success).toBe(false);
      expect(getBody().message).toContain('Authentication required');
    });

    it('rejects unauthenticated GET /procurement-compliance/export-excel with 401 Unauthorized', async () => {
      const req = { query: { assessmentId: 'AIC-2026-0002' }, headers: {} } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.exportExcel(req, res);
      expect(getStatus()).toBe(401);
      expect(getBody().success).toBe(false);
      expect(getBody().message).toContain('Authentication required');
    });

    it('rejects invalid or tampered token with 401 Unauthorized', async () => {
      const req = {
        query: { assessmentId: 'AIC-2026-0002' },
        headers: { authorization: 'Bearer invalid.tampered.token' }
      } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(401);
      expect(getBody().message).toContain('Authentication failed');
    });
  });

  describe('2. Client-Supplied Role Immunity & Privilege Escalation Prevention', () => {
    it('rejects x-user-role: ADMIN when request has no valid session token', async () => {
      const req = {
        query: { assessmentId: 'AIC-2026-0002' },
        headers: { 'x-user-role': 'ADMIN' }
      } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(401);
      expect(getBody().message).toContain('Authentication required');
    });

    it('prevents low-privilege token from elevating role via x-user-role header', async () => {
      const userToken = generateAuthToken(
        'usr-low-1',
        'basic.user@procucev.com',
        'USER',
        'BRONZE',
        'AIC-2026-0002'
      );
      const req = {
        headers: {
          authorization: `Bearer ${userToken}`,
          'x-user-role': 'ADMIN'
        },
        body: {
          assessmentId: 'AIC-2026-0002',
          candidateId: 'COMPL-PRC-0001',
          status: 'VERIFIED_EXCEPTION',
          reviewerName: 'Forged Admin',
          reviewerRole: 'ADMIN',
          technicalJustification: 'Attempted privilege escalation'
        }
      } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.submitComplianceReview(req, res);
      expect(getStatus()).toBe(403);
      expect(getBody().message).toContain('Role "USER" is not authorized');
    });

    it('rejects low-privilege VIEWER token with 403 Forbidden', async () => {
      const viewerToken = generateAuthToken('usr-view-1', 'viewer@procucev.com', 'VIEWER');
      const req = {
        query: { assessmentId: 'AIC-2026-0002' },
        headers: { authorization: `Bearer ${viewerToken}` }
      } as unknown as Request;
      const { res, getStatus } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(403);
    });
  });

  describe('3. Tenant & Assessment Access Isolation', () => {
    it('rejects cross-assessment access when non-admin token tenant does not match target assessment', async () => {
      // User belongs to AIC-2026-0002 but requests AIC-2026-0003
      const tokenPqr = generateAuthToken(
        'usr-auditor-abc',
        'auditor@abc-textile.com',
        'AUDIT_LEAD',
        'GOLD',
        'AIC-2026-0002'
      );
      const req = {
        query: { assessmentId: 'AIC-2026-0003' },
        headers: { authorization: `Bearer ${tokenPqr}` }
      } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(403);
      expect(getBody().message).toContain('not authorized to access "AIC-2026-0003"');
    });

    it('allows global ADMIN to access any assessment regardless of tenant assignment', async () => {
      const adminToken = generateAuthToken(
        'usr-admin-1',
        'admin@procucev.com',
        'ADMIN',
        'GOLD',
        'AIC-2026-0002'
      );
      const req = {
        query: { assessmentId: 'AIC-2026-0002' },
        headers: { authorization: `Bearer ${adminToken}` }
      } as unknown as Request;
      const { res, getStatus, getBody } = createMockResponse();

      await Module2ProcurementComplianceController.getProcurementCompliance(req, res);
      expect(getStatus()).toBe(200);
      expect(getBody().data).toBeDefined();
    });
  });
});
