/**
 * Unit Tests for EvidenceWorkbookService (Prompt 305)
 */

import { describe, it, expect } from 'vitest';
import { evidenceWorkbookService } from '../../src/services/evidenceWorkbookService';

describe('EvidenceWorkbookService Unit Tests', () => {
  const testUser = {
    id: 'admin-tester-01',
    role: 'ADMIN',
    tenantId: 'TNT-TEST-001',
    email: 'admin@procucev.com'
  };

  it('should return inventory containing all 9 evidence workbooks', () => {
    const inventory = evidenceWorkbookService.getInventory('job-test-001');
    expect(inventory).toBeDefined();
    expect(inventory.length).toBe(9);
    expect(inventory.every(item => item.isAvailable)).toBe(true);
  });

  it('should generate individual workbook buffer and record audit event', () => {
    const initialAuditCount = evidenceWorkbookService.getAuditEvents().length;
    const { buffer, filename, meta } = evidenceWorkbookService.generateWorkbookBuffer(
      'job-test-001',
      'MODULE_1_EVIDENCE',
      testUser
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(filename).toBe('01_Module_1_Evidence.xlsx');
    expect(meta.workbookType).toBe('MODULE_1_EVIDENCE');

    const newAuditCount = evidenceWorkbookService.getAuditEvents().length;
    expect(newAuditCount).toBe(initialAuditCount + 1);

    const latestAudit = evidenceWorkbookService.getAuditEvents()[newAuditCount - 1];
    expect(latestAudit.jobId).toBe('job-test-001');
    expect(latestAudit.workbookType).toBe('MODULE_1_EVIDENCE');
    expect(latestAudit.userId).toBe(testUser.id);
  });

  it('should return savings inventory containing all 7 savings types', () => {
    const savingsInventory = evidenceWorkbookService.getSavingsTypeInventory('job-test-001');
    expect(savingsInventory).toBeDefined();
    expect(savingsInventory.length).toBe(7);
    expect(savingsInventory.every(item => item.isAvailable)).toBe(true);
  });

  it('should generate dedicated savings-type workbook buffer', () => {
    const { buffer, filename, meta } = evidenceWorkbookService.generateSavingsTypeWorkbookBuffer(
      'job-test-001',
      'VENDOR_CONSOLIDATION',
      testUser
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(filename).toBe('04A_Vendor_Consolidation_Evidence.xlsx');
    expect(meta.workbookType).toBe('VENDOR_CONSOLIDATION');
  });

  it('should generate Complete Analysis Evidence Package ZIP containing 16 workbooks', () => {
    const { zipBuffer, filename, workbookCount } = evidenceWorkbookService.generateCompletePackageZip(
      'job-test-001',
      testUser
    );

    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(1000);
    expect(filename).toContain('Complete_Analysis_Evidence_Package_job-test-001.zip');
    expect(workbookCount).toBe(16);

    // Verify PKZIP local header
    expect(zipBuffer.readUInt32LE(0)).toBe(0x04034b50);
  });

  it('should perform parity validation successfully', () => {
    const parity = evidenceWorkbookService.validateParity('job-test-001');
    expect(parity).toBeDefined();
    expect(parity.overallStatus).toBe('PASS');
    expect(parity.passedChecks).toBe(13);
  });
});
