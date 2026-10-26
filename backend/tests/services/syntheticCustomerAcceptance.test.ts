import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { assessmentStore } from '../../src/services/assessmentStore';
import { assessmentWorkflowService } from '../../src/services/assessmentWorkflowService';
import { getAuthoritativeDataDir } from '../../src/services/assessmentPersistence';
import { VGT_CERTIFIED_OPPORTUNITY_FIGURES } from '../../src/constants/assessment';

describe('Part 9 — Synthetic Customer Assessment & Module 1 Ingestion Acceptance', () => {
  const originalDataDir = process.env.AICEV_DATA_DIR;
  const testDataDir = path.resolve(__dirname, '../../scratch/test-synthetic-acceptance');

  const originalSeedTestData = process.env.AICEV_SEED_TEST_DATA;

  beforeEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    process.env.AICEV_DATA_DIR = testDataDir;
    process.env.AICEV_SEED_TEST_DATA = 'true';
    assessmentStore.reloadFromDisk();
  });

  afterEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    if (originalDataDir) {
      process.env.AICEV_DATA_DIR = originalDataDir;
    } else {
      delete process.env.AICEV_DATA_DIR;
    }
    if (originalSeedTestData) {
      process.env.AICEV_SEED_TEST_DATA = originalSeedTestData;
    } else {
      delete process.env.AICEV_SEED_TEST_DATA;
    }
    assessmentStore.reloadFromDisk();
  });

  it('Part 9 A & B: creates new customer assessment, receives authoritative ID, and persists to disk', () => {
    const newRecord = assessmentStore.createAssessment({
      customerName: 'Integration Test Textiles Ltd',
      businessUnit: 'Procurement Operations',
      industry: 'Textiles & Apparel',
      assessmentPeriodStart: '2024-01-01',
      assessmentPeriodEnd: '2024-12-31',
      assignedAnalyst: 'analyst@procucev.com',
      currency: 'INR',
      ndaStatus: 'SIGNED',
      notes: 'Synthetic validation dossier for Part 9 acceptance'
    });

    expect(newRecord.assessmentId).toMatch(/^AIC-2026-\d{4}$/);
    expect(newRecord.customerName).toBe('Integration Test Textiles Ltd');
    expect(newRecord.ndaStatus).toBe('SIGNED');
    expect(newRecord.dataStatus).toBe('NOT_RECEIVED');
    expect(newRecord.status).toBe('DATA_PENDING');

    // Confirm physical disk file
    const diskPath = path.join(testDataDir, 'assessments.json');
    expect(fs.existsSync(diskPath)).toBe(true);

    const onDiskRaw = fs.readFileSync(diskPath, 'utf8');
    const onDisk = JSON.parse(onDiskRaw);
    const foundOnDisk = onDisk.assessments.find((a: any) => a.assessmentId === newRecord.assessmentId);
    expect(foundOnDisk).toBeDefined();
    expect(foundOnDisk.customerName).toBe('Integration Test Textiles Ltd');
  });

  it('Part 9 C & D: uploads synthetic procurement file, creates immutable data version, and executes Module 1 canonical analysis', async () => {
    const record = assessmentStore.createAssessment({
      customerName: 'Integration Test Textiles Ltd',
      industry: 'Textiles & Apparel',
      assessmentPeriodStart: '2024-01-01',
      assessmentPeriodEnd: '2024-12-31',
      assignedAnalyst: 'analyst@procucev.com',
      ndaStatus: 'SIGNED'
    });

    const csvContent =
      'Vendor,Category,Spend,Currency\n' +
      'Textile Mills A,Raw Cotton,150000000,INR\n' +
      'Yarn Co B,Yarn Supplies,85000000,INR\n' +
      'Dyes Chemical C,Chemicals,45000000,INR\n';

    const fileBuffer = Buffer.from(csvContent, 'utf8');
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileBase64 = fileBuffer.toString('base64');

    const uploadResult = await assessmentWorkflowService.uploadDataVersion(record.assessmentId, {
      fileName: 'procurement_spend_2024.csv',
      fileSize: fileBuffer.length,
      checksum,
      fileBase64,
      recordCount: 3,
      runAnalysisImmediately: true
    });

    expect(uploadResult.dataVersion).toBeDefined();
    expect(uploadResult.dataVersion.versionNumber).toBe(1);
    expect(uploadResult.dataVersion.fileName).toBe('procurement_spend_2024.csv');
    expect(uploadResult.dataVersion.checksum).toBe(checksum);
    expect(uploadResult.dataVersion.recordCount).toBe(3);

    // File written to assessment-specific storage
    const uploadPath = path.join(
      testDataDir,
      'assessments',
      record.assessmentId,
      'uploads',
      'procurement_spend_2024.csv'
    );
    expect(fs.existsSync(uploadPath)).toBe(true);

    // Analysis run completed immediately
    expect(uploadResult.analysisRun).toBeDefined();
    expect(uploadResult.analysisRun?.module1Metrics?.validRows).toBe(3);
    expect(uploadResult.analysisRun?.status).toBe('COMPLETED');

    // Assessment record updated with calculated metrics (not zeros, not dashes, not VGT numbers)
    const updated = uploadResult.assessment;
    expect(updated.dataStatus).toBe('RECEIVED');
    expect(updated.status).toBe('ANALYST_REVIEW');
    expect(updated.activeDataVersionId).toBe(uploadResult.dataVersion.dataVersionId);
    expect(updated.validatedSpendCr).toBeGreaterThan(0);
    expect(updated.potentialSavingsCr).toBeGreaterThan(0);
    expect(updated.savingsPct).toBeGreaterThan(0);
  });

  it('Part 9 E: test restart persistence survives simulated app restart with all data intact', async () => {
    const record = assessmentStore.createAssessment({
      customerName: 'Integration Test Textiles Ltd',
      industry: 'Textiles & Apparel',
      assessmentPeriodStart: '2024-01-01',
      assessmentPeriodEnd: '2024-12-31',
      assignedAnalyst: 'analyst@procucev.com',
      ndaStatus: 'SIGNED'
    });

    const csvContent = 'Vendor,Category,Spend\nVendor X,Fabric,50000000\n';
    const checksum = crypto.createHash('sha256').update(Buffer.from(csvContent)).digest('hex');

    await assessmentWorkflowService.uploadDataVersion(record.assessmentId, {
      fileName: 'spend.csv',
      fileSize: csvContent.length,
      checksum,
      fileBase64: Buffer.from(csvContent).toString('base64'),
      runAnalysisImmediately: true
    });

    // Simulate complete process termination & restart by clearing memory and reloading
    assessmentStore.reloadFromDisk();

    const recovered = assessmentStore.getAssessmentById(record.assessmentId);
    expect(recovered).toBeDefined();
    expect(recovered?.customerName).toBe('Integration Test Textiles Ltd');
    expect(recovered?.activeDataVersionId).toBeDefined();
    expect(recovered?.validatedSpendCr).toBeGreaterThan(0);

    const versions = assessmentStore.getDataVersions(record.assessmentId);
    expect(versions.length).toBe(1);
    expect(versions[0]?.fileName).toBe('spend.csv');

    const runs = assessmentStore.getAnalysisRuns(record.assessmentId);
    expect(runs.length).toBe(1);
    expect(runs[0]?.status).toBe('COMPLETED');
  });

  it('Part 9 F: clean intake isolation ensures fresh assessment has zero metric leakage from VGT or other customers', () => {
    // Create customer 1 with data
    assessmentStore.createAssessment({
      customerName: 'Integration Test Textiles Ltd',
      industry: 'Textiles',
      assessmentPeriodStart: '2024-01-01',
      assessmentPeriodEnd: '2024-12-31',
      assignedAnalyst: 'analyst@procucev.com'
    });

    // Create fresh empty customer 2
    const cleanCustomer = assessmentStore.createAssessment({
      customerName: 'Clean Intake Metals Ltd',
      industry: 'Metals & Mining',
      assessmentPeriodStart: '2024-01-01',
      assessmentPeriodEnd: '2024-12-31',
      assignedAnalyst: 'analyst@procucev.com'
    });

    // Verify zero metric leakage
    expect(cleanCustomer.validatedSpendCr).toBeUndefined();
    expect(cleanCustomer.grossOpportunityCr).toBeUndefined();
    expect(cleanCustomer.netDefensibleOpportunityCr).toBeUndefined();
    expect(cleanCustomer.provenOpportunityCr).toBeUndefined();
    expect(cleanCustomer.potentialSavingsCr).toBeUndefined();
    expect(cleanCustomer.savingsPct).toBeUndefined();
    expect(cleanCustomer.activeDataVersionId).toBeUndefined();
    expect(cleanCustomer.activeAnalysisRunId).toBeUndefined();

    // Verify VGT baseline invariants are completely preserved with zero variance
    const vgt = assessmentStore.getAssessmentById('AIC-2026-0001');
    expect(vgt).toBeDefined();
    expect(vgt?.isTestData).toBe(true);
    expect(vgt?.validatedSpendCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.VALIDATED_SPEND_CR);
    expect(vgt?.grossOpportunityCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.GROSS_OPPORTUNITY_CR);
    expect(vgt?.overlapDeductionsCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.OVERLAP_DEDUCTIONS_CR);
    expect(vgt?.netDefensibleOpportunityCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.NET_DEFENSIBLE_OPPORTUNITY_CR);
    expect(vgt?.provenOpportunityCr).toBe(VGT_CERTIFIED_OPPORTUNITY_FIGURES.PROVEN_OPPORTUNITY_CR);
  });
});
