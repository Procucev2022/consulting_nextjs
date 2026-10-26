import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import type { DesktopReleaseManifest } from '../types/assessment';
import { APP_OPERATING_MODES } from '../constants/assessment';
import logger from '../utils/logger';

export function compareSemver(v1: string, v2: string): number {
  const clean1 = (v1 || '0.0.0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const clean2 = (v2 || '0.0.0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

  const len = Math.max(clean1.length, clean2.length);
  for (let i = 0; i < len; i++) {
    const part1 = clean1[i] ?? 0;
    const part2 = clean2[i] ?? 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

export function computeFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toLowerCase();
}

export function getInstalledHostVersion(): { version: string } | null {
  try {
    if (process.platform === 'win32') {
      const regOut = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\aiCEV-Internal-Assessment" /v DisplayVersion',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }
      );
      const match = regOut.match(/DisplayVersion\s+REG_SZ\s+([^\r\n]+)/i);
      if (match?.[1]) {
        return { version: match[1].trim() };
      }
    }
  } catch {
    // non-fatal
  }
  return null;
}

export interface ManifestValidationResult {
  valid: boolean;
  errorMessage?: string;
  installerPath?: string;
  installerSizeBytes?: number;
  computedSha?: string;
}

function checkManifestRequiredFields(manifest: DesktopReleaseManifest): { valid: boolean; errorMessage?: string } {
  const requiredFields = [
    'productName',
    'operatingMode',
    'certificationStatus',
    'installerFileName',
    'installerSha256'
  ];

  for (const field of requiredFields) {
    if (!(manifest as unknown as Record<string, unknown>)[field]) {
      return { valid: false, errorMessage: `Invalid release manifest: missing required field '${field}'` };
    }
  }

  const availableVersion = manifest.version || manifest.appVersion || '';
  const availableBuildNumber = manifest.buildIdentifier || manifest.buildNumber || '';

  if (!availableVersion || !availableBuildNumber) {
    return { valid: false, errorMessage: 'Invalid release manifest: missing version or buildIdentifier' };
  }

  return { valid: true };
}

function checkManifestOperatingPolicy(
  manifest: DesktopReleaseManifest,
  currentBuildNumber: string
): { valid: boolean; errorMessage?: string; duplicateBuild?: boolean } {
  if (manifest.operatingMode !== APP_OPERATING_MODES.INTERNAL_ASSESSMENT) {
    return {
      valid: false,
      errorMessage: `Operating mode mismatch: expected ${APP_OPERATING_MODES.INTERNAL_ASSESSMENT}, received ${manifest.operatingMode}`
    };
  }

  if (
    manifest.certificationStatus !== 'CERTIFIED' ||
    (manifest.releaseCertificationStatus && manifest.releaseCertificationStatus !== 'CERTIFIED')
  ) {
    return { valid: false, errorMessage: 'Release is uncertified: certificationStatus must be CERTIFIED' };
  }

  const availableBuildNumber = manifest.buildIdentifier || manifest.buildNumber || '';
  if (availableBuildNumber === currentBuildNumber) {
    return { valid: false, duplicateBuild: true, errorMessage: 'Duplicate build ID: staged build is already installed' };
  }

  return { valid: true };
}

export function validateManifestIdentity(
  manifest: DesktopReleaseManifest,
  currentBuildNumber: string
): { valid: boolean; errorMessage?: string; duplicateBuild?: boolean } {
  const fieldsCheck = checkManifestRequiredFields(manifest);
  if (!fieldsCheck.valid) {
    return fieldsCheck;
  }
  return checkManifestOperatingPolicy(manifest, currentBuildNumber);
}

export function validateInstallerBinary(
  manifest: DesktopReleaseManifest,
  stagedDir: string
): ManifestValidationResult {
  const installerPath = path.join(stagedDir, manifest.installerFileName);
  if (!fs.existsSync(installerPath)) {
    return { valid: false, errorMessage: `Installer executable not found: ${manifest.installerFileName}` };
  }

  const stats = fs.statSync(installerPath);
  if (stats.size <= 0) {
    return { valid: false, installerPath, errorMessage: 'Installer binary is 0 bytes or corrupted' };
  }

  const computedSha = computeFileSha256(installerPath);
  const expectedSha = (manifest.installerSha256 || '').toLowerCase().trim();

  if (computedSha !== expectedSha) {
    logger.error('Installer checksum mismatch', { installerPath, computedSha, expectedSha });
    return {
      valid: false,
      installerPath,
      errorMessage: `Checksum mismatch: expected SHA-256 ${expectedSha}, got ${computedSha}`
    };
  }

  return {
    valid: true,
    installerPath,
    installerSizeBytes: stats.size,
    computedSha
  };
}

export function resolveManifestVersion(manifest: DesktopReleaseManifest): { version: string; build: string } {
  const version = manifest.version || manifest.appVersion || '';
  const build = manifest.buildIdentifier || manifest.buildNumber || '';
  return { version, build };
}

export function buildVerifiedUpdateResult(
  manifest: DesktopReleaseManifest,
  binaryCheck: ManifestValidationResult,
  currentVersion: string,
  currentBuildNumber: string,
  manifestPath: string
): import('../types/assessment').DesktopUpdateCheckResult {
  const { version: availableVersion, build: availableBuildNumber } = resolveManifestVersion(manifest);
  const releaseNotes = manifest.releaseNotes && manifest.releaseNotes.length > 0
    ? manifest.releaseNotes
    : [
        'Certified Procurement Assessment Suite v' + availableVersion,
        'VGT financial parity reconciliation verified'
      ];

  return {
    isUpdateAvailable: true,
    currentVersion,
    currentBuildNumber,
    availableVersion,
    availableBuildNumber,
    releaseDate: manifest.buildTimestamp,
    releaseNotes,
    verificationStatus: 'CERTIFIED_AND_VERIFIED',
    installerFileName: manifest.installerFileName,
    installerSha256: binaryCheck.computedSha || null,
    installerSizeBytes: binaryCheck.installerSizeBytes || null,
    installerPath: binaryCheck.installerPath || null,
    manifestPath,
    errorMessage: null,
    isStagedOnly: true,
    manifest
  };
}
