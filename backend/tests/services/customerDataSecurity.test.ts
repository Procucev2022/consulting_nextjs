/**
 * Customer Data Security & Non-Reuse Test Suite (Prompt 253)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  customerDataSecurityService,
  CustomerDataSecurityService
} from '../../src/services/customerDataSecurityService';
import type { CustomerSecurityValidationManifest } from '../../src/types/customerDataSecurityTypes';

describe('Customer Data Security, Confidentiality & Non-Reuse (Prompt 253)', () => {
  let manifest: CustomerSecurityValidationManifest;

  beforeAll(() => {
    manifest = customerDataSecurityService.generateAllArtifacts();
  });

  describe('Section 13 — Dedicated Security Test Suite (SEC-01 to SEC-18)', () => {
    it('should verify all 18 security negative test cases return status PASS', () => {
      const tests = customerDataSecurityService.executeSecurityTestSuite();
      expect(tests.length).toBe(18);
      for (const t of tests) {
        expect(t.status).toBe('PASS');
        expect(t.actualResult).toBe(t.expectedResult);
      }
    });
  });

  describe('Section 14 — 16-Stage Lifecycle Security Matrix', () => {
    it('should verify all 16 lifecycle stages are defined with security controls', () => {
      const stages = customerDataSecurityService.getLifecycleAudits();
      expect(stages.length).toBe(16);
      expect(stages[0].stageName).toBe('Upload');
      expect(stages[15].stageName).toBe('Tenant Isolation');

      for (const stage of stages) {
        expect(stage.dataEnters.length).toBeGreaterThan(0);
        expect(stage.securityControl.length).toBeGreaterThan(0);
        expect(stage.tenantBoundary.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Section 4 & 18 — AI Non-Training & Cache Namespace Isolation', () => {
    it('should build tenant-scoped cache keys preventing global cache leakage', () => {
      const key = customerDataSecurityService.buildTenantScopedCacheKey('TNT-001', 'Q_SPEND', 'hash123');
      expect(key).toBe('tenant:TNT-001:query:Q_SPEND:hash123');
    });

    it('should throw an error if tenantId is missing for cache key', () => {
      expect(() => {
        customerDataSecurityService.buildTenantScopedCacheKey('', 'Q_SPEND', 'hash123');
      }).toThrow('TENANT_ID_REQUIRED_FOR_CACHE_KEY');
    });

    it('should sanitize AI prompt payload with allowTraining false and tenant scope', () => {
      const sanitized = customerDataSecurityService.sanitizeAiPromptPayload('Analyze spend', 'TNT-001');
      expect(sanitized.allowTraining).toBe(false);
      expect(sanitized.tenantScope).toBe('TNT-001');
      expect(sanitized.promptText).toBe('Analyze spend');
    });
  });

  describe('Section 14 & 17 — Artifacts Verification', () => {
    it('1. should verify CUSTOMER_DATA_SECURITY_ARCHITECTURE.md exists and covers 16 stages', () => {
      const p = path.resolve(process.cwd(), 'CUSTOMER_DATA_SECURITY_ARCHITECTURE.md');
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('CUSTOMER DATA SECURITY ARCHITECTURE');
      expect(content).toContain('16-Stage Lifecycle Security Matrix');
      expect(content).toContain('Core Customer Promise');
      expect(content).toContain('Security Implementation Verification Status');
    });

    it('2. should verify CUSTOMER_DATA_SECURITY_VALIDATION_REPORT.md exists and certifies status', () => {
      const p = path.resolve(process.cwd(), 'CUSTOMER_DATA_SECURITY_VALIDATION_REPORT.md');
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, 'utf-8');
      expect(content).toContain('FINAL_SECURITY_STATUS');
      expect(content).toContain('SECURITY_HARDENED_AND_VERIFIED');
      expect(content).toContain('TENANT_ISOLATION_STATUS');
      expect(content).toContain('AI_TRAINING_DATA_STATUS');
      expect(content).toContain('CROSS_CUSTOMER_REUSE_STATUS');
      expect(content).toContain('PCBI_DATA_ISOLATION_STATUS');
    });

    it('3. should verify manifest metrics', () => {
      expect(manifest.finalSecurityStatus).toBe('SECURITY_HARDENED_AND_VERIFIED');
      expect(manifest.securityTestsPassed).toBe(18);
      expect(manifest.securityTestsFailed).toBe(0);
      expect(manifest.tenantIsolationStatus).toBe('PASS');
      expect(manifest.encryptionStatus).toBe('PASS');
    });
  });

  describe('Singleton & Helper Branch Coverage', () => {
    it('should verify singleton getter and empty gaps branch in markdown', () => {
      const instance = CustomerDataSecurityService.getInstance();
      expect(instance).toBe(customerDataSecurityService);

      const emptyManifest = {
        ...manifest,
        openSecurityGaps: []
      };
      const md = customerDataSecurityService.generateValidationReportMarkdown(emptyManifest);
      expect(md).toContain('Zero critical security gaps identified.');
    });
  });
});
