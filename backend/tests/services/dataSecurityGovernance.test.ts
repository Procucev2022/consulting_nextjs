/**
 * Enterprise Data Security & Isolation Governance Test Suite (Prompt 252)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  dataSecurityGovernanceService,
  DataSecurityGovernanceService
} from '../../src/services/dataSecurityGovernanceService';
import {
  dataSecurityReportGenerator,
  DataSecurityReportGenerator
} from '../../src/services/dataSecurityReportGenerator';
import { ENTERPRISE_SECURITY_NEGATIVE_TESTS } from '../../src/constants/dataSecurityConstants';
import type { DataSecurityValidationManifest } from '../../src/types/dataSecurityTypes';

describe('Enterprise Data Security & Confidentiality Governance (Prompt 252)', () => {
  let manifest: DataSecurityValidationManifest;

  beforeAll(() => {
    manifest = dataSecurityReportGenerator.generateAllArtifacts();
  });

  describe('Section 4 — Strict Tenant Isolation Invariant', () => {
    it('should allow request when requestTenantId matches datasetTenantId', () => {
      const result = dataSecurityGovernanceService.validateTenantScope('TNT-A', 'TNT-A');
      expect(result.allowed).toBe(true);
      expect(result.status).toBe('TENANT_AUTHORIZED');
      expect(result.httpStatus).toBe(200);
    });

    it('should block request and return 403 when tenants mismatch', () => {
      const result = dataSecurityGovernanceService.validateTenantScope('TNT-A', 'TNT-B');
      expect(result.allowed).toBe(false);
      expect(result.status).toBe('TENANT_ACCESS_DENIED');
      expect(result.httpStatus).toBe(403);
    });

    it('should block request and return 400 when tenant header is missing', () => {
      const result1 = dataSecurityGovernanceService.validateTenantScope(undefined, 'TNT-B');
      expect(result1.allowed).toBe(false);
      expect(result1.status).toBe('MISSING_TENANT_SCOPE');
      expect(result1.httpStatus).toBe(400);

      const result2 = dataSecurityGovernanceService.validateTenantScope('TNT-A', undefined);
      expect(result2.allowed).toBe(false);
      expect(result2.status).toBe('MISSING_TENANT_SCOPE');
      expect(result2.httpStatus).toBe(400);
    });
  });

  describe('Section 11 — Export Governance & Role Authorization', () => {
    it('should authorize export for lead buyer or admin with valid tenant scope', () => {
      const result = dataSecurityGovernanceService.validateExportAuthorization(
        'USR-01',
        'ADMIN',
        'TNT-GLOBAL-8902',
        'TNT-GLOBAL-8902'
      );
      expect(result.allowed).toBe(true);
      expect(result.httpStatus).toBe(200);
    });

    it('should block export for unauthorized viewer role', () => {
      const result = dataSecurityGovernanceService.validateExportAuthorization(
        'USR-02',
        'VIEWER',
        'TNT-GLOBAL-8902',
        'TNT-GLOBAL-8902'
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('ROLE_UNAUTHORIZED_FOR_EXPORT');
      expect(result.httpStatus).toBe(403);
    });

    it('should block export when tenant mismatch occurs regardless of role', () => {
      const result = dataSecurityGovernanceService.validateExportAuthorization(
        'USR-01',
        'ADMIN',
        'TNT-ATTACKER',
        'TNT-VICTIM'
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('TENANT_ACCESS_DENIED');
      expect(result.httpStatus).toBe(403);
    });
  });

  describe('Section 6 — PCBI Customer Data Isolation Rule', () => {
    it('should strictly reject customer transaction as PCBI source observation', () => {
      const check1 = dataSecurityGovernanceService.validatePcbiObservationSource('CUSTOMER_TRANSACTION');
      expect(check1.allowed).toBe(false);
      expect(check1.status).toBe('BLOCKED_CUSTOMER_DATA_TO_PCBI');
      expect(check1.httpStatus).toBe(422);

      const check2 = dataSecurityGovernanceService.validatePcbiObservationSource('CUSTOMER_PO');
      expect(check2.allowed).toBe(false);
      expect(check2.status).toBe('BLOCKED_CUSTOMER_DATA_TO_PCBI');
      expect(check2.httpStatus).toBe(422);
    });

    it('should approve legitimate public market benchmarks', () => {
      const check = dataSecurityGovernanceService.validatePcbiObservationSource('MINISTRY_OF_STEEL_BULLETIN');
      expect(check.allowed).toBe(true);
      expect(check.status).toBe('PCBI_SOURCE_APPROVED');
      expect(check.httpStatus).toBe(200);
    });
  });

  describe('Section 10 — Commercial Field Redaction for Safe Logging', () => {
    it('should sanitize supplier, price, PO number, and item codes', () => {
      const sup = dataSecurityGovernanceService.sanitizeCommercialField('SUPPLIER', 'Apex Metallurgy Corp');
      expect(sup).toMatch(/^SUP-[A-F0-9]{6}$/);

      const price = dataSecurityGovernanceService.sanitizeCommercialField('PRICE', '1250000');
      expect(price).toBe('***.** INR');

      const po = dataSecurityGovernanceService.sanitizeCommercialField('PO_NUMBER', 'PUR-ORDER-2024-9988');
      expect(po).toBe('PO-9988');

      const item = dataSecurityGovernanceService.sanitizeCommercialField('ITEM', 'SS316 Wire');
      expect(item).toBe('ITEM-MASKED-10');

      const empty = dataSecurityGovernanceService.sanitizeCommercialField('SUPPLIER', '');
      expect(empty).toBe('');

      const fallback = dataSecurityGovernanceService.sanitizeCommercialField('UNKNOWN' as any, 'data');
      expect(fallback).toBe('REDACTED');
    });
  });

  describe('Section 16 — Security Negative Test Suite (SEC-01 to SEC-20)', () => {
    it('should verify all 20 adversarial security tests produce PASS', () => {
      const tests = dataSecurityGovernanceService.executeSecurityNegativeTests();
      expect(tests.length).toBe(20);
      for (const t of tests) {
        expect(t.status).toBe('PASS');
        expect(t.actualOutcome).toBe(t.expectedOutcome);
      }
    });
  });

  describe('Section 15 & 20 — Security Panel & Final Artifacts Verification', () => {
    it('should verify security status panel items', () => {
      const panel = dataSecurityGovernanceService.evaluateSecurityPanel();
      expect(panel.length).toBe(10);
      const retention = panel.find((p) => p.id === 'SEC-DIM-10');
      expect(retention?.status).toBe('CONFIGURATION_REQUIRED');
      expect(retention?.verificationTier).toBe('CONFIGURATION_REQUIRED');
    });

    it('1. should verify PROCUCEV_ENTERPRISE_DATA_SECURITY_VALIDATION.md exists', () => {
      const p = path.resolve(process.cwd(), 'PROCUCEV_ENTERPRISE_DATA_SECURITY_VALIDATION.md');
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('CUSTOMER_CONFIDENTIAL');
      expect(content).toContain('CUSTOMER_DATA_REUSE_POLICY = PROHIBITED');
      expect(content).toContain('SECURITY_HARDENED_WITH_CONFIGURATION_REQUIRED');
    });

    it('2. should verify PROCUCEV_DATA_SECURITY_AUDIT.json exists and has valid manifest', () => {
      const p = path.resolve(process.cwd(), 'PROCUCEV_DATA_SECURITY_AUDIT.json');
      expect(fs.existsSync(p)).toBe(true);
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      expect(data.finalSecurityStatus).toBe('SECURITY_HARDENED_WITH_CONFIGURATION_REQUIRED');
      expect(data.customerDataReusePolicy).toBe('PROHIBITED');
      expect(data.passedSecurityTests).toBe(20);
    });

    it('3. should verify PROCUCEV_DATA_ISOLATION_TEST_RESULTS.json exists and contains 20 tests', () => {
      const p = path.resolve(process.cwd(), 'PROCUCEV_DATA_ISOLATION_TEST_RESULTS.json');
      expect(fs.existsSync(p)).toBe(true);
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      expect(data.totalSecurityTests).toBe(20);
      expect(data.passedSecurityTests).toBe(20);
      expect(data.failedSecurityTests).toBe(0);
    });
  });

  describe('Singleton & Direct Helper Branch Coverage', () => {
    it('should verify singleton getters and audit trail records', () => {
      const govService = DataSecurityGovernanceService.getInstance();
      expect(govService).toBe(dataSecurityGovernanceService);

      const genService = DataSecurityReportGenerator.getInstance();
      expect(genService).toBe(dataSecurityReportGenerator);

      const auditTrail = dataSecurityGovernanceService.getAuditTrail();
      expect(auditTrail.length).toBeGreaterThan(0);
      const deniedEvent = auditTrail.find((a) => a.result === 'BLOCKED');
      expect(deniedEvent).toBeDefined();
    });
  });
});
