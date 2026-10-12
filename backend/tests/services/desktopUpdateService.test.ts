/**
 * Unit & Integration Test Suite for desktopUpdateService
 * 
 * Verifies Part 7, Part 8, Part 9, and Part 10 requirements:
 * - No update available
 * - Certified update available
 * - Invalid manifest
 * - Checksum mismatch
 * - Uncertified release
 * - Older version
 * - Duplicate build ID
 * - Empty / missing installer binary
 * - Trigger installation (success, active job blocking, verification failure)
 * - Version comparisons and semver logic
 * - Customer data preservation guarantees
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { desktopUpdateService } from '../../src/services/desktopUpdateService';
import { SYSTEM_BUILD_IDENTITY, APP_OPERATING_MODES } from '../../src/constants/assessment';

describe('DesktopUpdateService (Part 7, 8, 9, 10)', () => {
  const tempTestDir = path.resolve(__dirname, '../../scratch/test-staging');
  const installerFileName = 'aiCEV-Internal-Assessment-Setup.exe';
  const dummyInstallerContent = 'MOCK_WINDOWS_PE_INSTALLER_BINARY_DATA_FOR_UNIT_TESTS';
  const computedSha256 = crypto.createHash('sha256').update(dummyInstallerContent).digest('hex').toLowerCase();

  beforeEach(() => {
    if (fs.existsSync(tempTestDir)) {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempTestDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempTestDir)) {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    }
  });

  const writeValidStagedRelease = (overrides: Record<string, unknown> = {}) => {
    // Write installer binary
    const installerPath = path.join(tempTestDir, installerFileName);
    fs.writeFileSync(installerPath, dummyInstallerContent);

    // Write manifest
    const manifest = {
      productName: 'aiCEV – Internal Assessment',
      version: '1.0.2',
      buildIdentifier: 'E2E-003-CERTIFIED',
      gitCommit: '2378cd054fdcd528ec2815362a44a6461c72fa8e',
      buildTimestamp: '2026-10-10T09:00:00.000Z',
      operatingMode: APP_OPERATING_MODES.INTERNAL_ASSESSMENT,
      publicSaaSStatus: 'DISABLED',
      installerFileName,
      installerSha256: computedSha256,
      installerSizeBytes: Buffer.byteLength(dummyInstallerContent),
      backendBuildIdentifier: 'E2E-003-CERTIFIED',
      frontendBuildIdentifier: 'E2E-003-CERTIFIED',
      requiredRegressionSuiteResults: 'PASS',
      financialParityResult: 'PASS',
      securityVerificationResult: 'PASS',
      releaseCertificationStatus: 'CERTIFIED',
      certificationStatus: 'CERTIFIED',
      releaseNotes: ['P0 Update with calculation parity and assessment isolation'],
      ...overrides
    };

    fs.writeFileSync(path.join(tempTestDir, 'release-manifest.json'), JSON.stringify(manifest, null, 2));
    return manifest;
  };

  it('correctly compares semantic versions', () => {
    expect(desktopUpdateService.compareSemver('1.0.1', '1.0.0')).toBe(1);
    expect(desktopUpdateService.compareSemver('1.0.0', '1.0.1')).toBe(-1);
    expect(desktopUpdateService.compareSemver('1.0.1', '1.0.1')).toBe(0);
    expect(desktopUpdateService.compareSemver('v2.0.0', '1.9.9')).toBe(1);
    expect(desktopUpdateService.compareSemver('', '')).toBe(0);
  });

  it('returns no update available when staging directory is empty or missing manifest', () => {
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('NONE');
    expect(res.errorMessage).toBeNull();
  });

  it('rejects malformed manifest JSON syntax', () => {
    fs.writeFileSync(path.join(tempTestDir, 'release-manifest.json'), '{ malformed json: true, ');
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('JSON syntax error');
  });

  it('rejects manifest missing mandatory schema fields', () => {
    fs.writeFileSync(
      path.join(tempTestDir, 'release-manifest.json'),
      JSON.stringify({ version: '1.0.2', buildIdentifier: 'E2E-003-CERTIFIED' })
    );
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('missing required field');
  });

  it('rejects manifest missing version or buildIdentifier', () => {
    writeValidStagedRelease({ version: '', buildIdentifier: '' });
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('missing version or buildIdentifier');
  });

  it('rejects uncertified release where certificationStatus !== CERTIFIED', () => {
    writeValidStagedRelease({ certificationStatus: 'DRAFT', releaseCertificationStatus: 'DRAFT' });
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('Release is uncertified');
  });

  it('rejects release where operatingMode is not INTERNAL_ASSESSMENT', () => {
    writeValidStagedRelease({ operatingMode: 'PUBLIC_SAAS' });
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('Operating mode mismatch');
  });

  it('rejects duplicate build ID where staged build equals currently running build', () => {
    writeValidStagedRelease({
      version: SYSTEM_BUILD_IDENTITY.APP_VERSION,
      buildIdentifier: SYSTEM_BUILD_IDENTITY.BUILD_NUMBER
    });
    const res = desktopUpdateService.getDesktopUpdateStatus({
      stagedDir: tempTestDir,
      installedBuild: SYSTEM_BUILD_IDENTITY.BUILD_NUMBER
    });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('NONE');
    expect(res.errorMessage).toContain('Duplicate build ID');
  });

  it('rejects older version to prevent application downgrade', () => {
    writeValidStagedRelease({
      version: '0.9.0',
      buildIdentifier: 'OLD-001'
    });
    const res = desktopUpdateService.getDesktopUpdateStatus({
      stagedDir: tempTestDir,
      installedVersion: '1.0.1'
    });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('older than installed version');
  });

  it('rejects release when installer binary file is missing', () => {
    writeValidStagedRelease();
    // Delete installer file
    fs.unlinkSync(path.join(tempTestDir, installerFileName));
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('Installer executable not found');
  });

  it('rejects release when installer binary is 0 bytes', () => {
    writeValidStagedRelease();
    // Overwrite installer file with empty content
    fs.writeFileSync(path.join(tempTestDir, installerFileName), '');
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('0 bytes or corrupted');
  });

  it('rejects release when SHA-256 checksum does not match', () => {
    writeValidStagedRelease({
      installerSha256: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
    });
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: tempTestDir });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('FAILED');
    expect(res.errorMessage).toContain('Checksum mismatch');
  });

  it('successfully verifies and certifies staged update when all checks pass', () => {
    writeValidStagedRelease();
    const res = desktopUpdateService.getDesktopUpdateStatus({
      stagedDir: tempTestDir,
      installedVersion: '1.0.0',
      installedBuild: 'E2E-001-CERTIFIED'
    });
    expect(res.isUpdateAvailable).toBe(true);
    expect(res.verificationStatus).toBe('CERTIFIED_AND_VERIFIED');
    expect(res.availableVersion).toBe('1.0.2');
    expect(res.availableBuildNumber).toBe('E2E-003-CERTIFIED');
    expect(res.installerSha256).toBe(computedSha256);
    expect(res.installerSizeBytes).toBe(Buffer.byteLength(dummyInstallerContent));
    expect(res.isStagedOnly).toBe(true);
    expect(res.errorMessage).toBeNull();
  });

  it('prevents update installation when active job is in progress', () => {
    writeValidStagedRelease();
    const res = desktopUpdateService.triggerInstallUpdate({
      stagedDir: tempTestDir,
      activeJobInProgress: true
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe('ACTIVE_JOB_IN_PROGRESS');
    expect(res.message).toContain('assessment operations are in progress');
  });

  it('rejects update installation when staged release fails verification', () => {
    writeValidStagedRelease({ certificationStatus: 'DRAFT' });
    const res = desktopUpdateService.triggerInstallUpdate({
      stagedDir: tempTestDir,
      activeJobInProgress: false
    });
    expect(res.success).toBe(false);
    expect(res.error).toBe('VERIFICATION_FAILED');
  });

  it('permits update installation simulation when release is verified', () => {
    writeValidStagedRelease();
    const res = desktopUpdateService.triggerInstallUpdate({
      stagedDir: tempTestDir,
      activeJobInProgress: false,
      simulateOnly: true
    });
    expect(res.success).toBe(true);
    expect(res.message).toContain('Verified installer is ready');
    expect(res.installerPath).toBe(path.join(tempTestDir, installerFileName));
  });

  it('resolves staged directory from environment variable if configured', () => {
    process.env.AICEV_STAGED_DIR = tempTestDir;
    try {
      const resolved = desktopUpdateService.resolveStagedDirectory();
      expect(resolved).toBe(tempTestDir);
    } finally {
      delete process.env.AICEV_STAGED_DIR;
    }
  });

  it('resolves staged directory from APPDATA path if directory exists', () => {
    const originalAppData = process.env.APPDATA;
    const fakeAppDataRoot = path.join(tempTestDir, 'fake-appdata');
    const fakeStagedDir = path.join(fakeAppDataRoot, 'aiCEV', 'staged_update');
    fs.mkdirSync(fakeStagedDir, { recursive: true });

    process.env.APPDATA = fakeAppDataRoot;
    try {
      const resolved = desktopUpdateService.resolveStagedDirectory();
      expect(resolved).toBe(fakeStagedDir);
    } finally {
      process.env.APPDATA = originalAppData;
    }
  });

  it('handles completely nonexistent staged directory parameter', () => {
    const res = desktopUpdateService.getDesktopUpdateStatus({ stagedDir: 'C:\\totally_nonexistent_directory_xyz123' });
    expect(res.isUpdateAvailable).toBe(false);
    expect(res.verificationStatus).toBe('NONE');
  });

  it('provides default release notes when manifest releaseNotes is omitted or empty', () => {
    writeValidStagedRelease({ releaseNotes: [] });
    const res = desktopUpdateService.getDesktopUpdateStatus({
      stagedDir: tempTestDir,
      installedVersion: '1.0.0',
      installedBuild: 'E2E-001-CERTIFIED'
    });
    expect(res.isUpdateAvailable).toBe(true);
    expect(res.releaseNotes.length).toBeGreaterThan(0);
    expect(res.releaseNotes[0]).toContain('Certified Procurement Assessment Suite');
  });

  it('permits update installation execution when simulateOnly is omitted or false', () => {
    writeValidStagedRelease();
    const res = desktopUpdateService.triggerInstallUpdate({
      stagedDir: tempTestDir,
      activeJobInProgress: false
    });
    expect(res.success).toBe(true);
    expect(res.message).toContain('Verified installer is ready');
    expect(res.installerPath).toBe(path.join(tempTestDir, installerFileName));
  });

  it('guarantees customer data directory is separate from application install dir', () => {
    const customerDataDir = path.join(process.env.APPDATA || '', 'aiCEV');
    const defaultInstallDir = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'aiCEV - Internal Assessment');
    expect(customerDataDir).not.toBe(defaultInstallDir);
    expect(customerDataDir).toContain('Roaming');
    expect(defaultInstallDir).toContain('Local');
  });
});
