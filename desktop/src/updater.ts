/**
 * aiCEV Desktop Updater Module
 * 
 * Handles update checking, cryptographic verification, and safe execution
 * of certified staged Windows releases.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import { app } from 'electron';
import type { ProcessManager } from './processManager';

export interface StagedUpdateStatus {
  isUpdateAvailable: boolean;
  currentVersion: string;
  currentBuildNumber: string;
  availableVersion: string | null;
  availableBuildNumber: string | null;
  releaseDate: string | null;
  releaseNotes: string[];
  verificationStatus: 'CERTIFIED_AND_VERIFIED' | 'FAILED' | 'NONE';
  installerPath: string | null;
  installerSha256: string | null;
  installerSizeBytes: number | null;
  errorMessage: string | null;
}

export class DesktopUpdater {
  private projectRoot: string;
  private currentVersion: string;
  private currentBuildNumber: string;
  private processManager: ProcessManager;

  constructor(options: {
    projectRoot: string;
    currentVersion: string;
    currentBuildNumber: string;
    processManager: ProcessManager;
  }) {
    this.projectRoot = options.projectRoot;
    this.currentVersion = options.currentVersion;
    this.currentBuildNumber = options.currentBuildNumber;
    this.processManager = options.processManager;
  }

  public compareSemver(v1: string, v2: string): number {
    const clean1 = (v1 || '0.0.0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
    const clean2 = (v2 || '0.0.0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(clean1.length, clean2.length);
    for (let i = 0; i < len; i++) {
      const p1 = clean1[i] ?? 0;
      const p2 = clean2[i] ?? 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  public resolveStagedDirectory(): string | null {
    if (process.env.AICEV_STAGED_DIR && fs.existsSync(process.env.AICEV_STAGED_DIR)) {
      return process.env.AICEV_STAGED_DIR;
    }

    if (process.env.APPDATA) {
      const appDataDir = path.join(process.env.APPDATA, 'aiCEV', 'staged_update');
      if (fs.existsSync(appDataDir)) {
        return appDataDir;
      }
    }

    const repoStaged = path.resolve(this.projectRoot, 'release', 'staged');
    if (fs.existsSync(repoStaged)) {
      return repoStaged;
    }

    const relStaged = path.resolve(__dirname, '..', '..', 'release', 'staged');
    if (fs.existsSync(relStaged)) {
      return relStaged;
    }

    return null;
  }

  public checkStagedUpdate(): StagedUpdateStatus {
    const base: StagedUpdateStatus = {
      isUpdateAvailable: false,
      currentVersion: this.currentVersion,
      currentBuildNumber: this.currentBuildNumber,
      availableVersion: null,
      availableBuildNumber: null,
      releaseDate: null,
      releaseNotes: [],
      verificationStatus: 'NONE',
      installerPath: null,
      installerSha256: null,
      installerSizeBytes: null,
      errorMessage: null
    };

    const stagedDir = this.resolveStagedDirectory();
    if (!stagedDir) {
      this.processManager.log('DEBUG', 'No staged directory found for desktop update check');
      return base;
    }

    const manifestPath = path.join(stagedDir, 'release-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      this.processManager.log('DEBUG', 'No release-manifest.json found in staged directory', { stagedDir });
      return base;
    }

    let manifest: any;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.processManager.log('WARN', 'Failed to parse staged release manifest', { error: msg });
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: 'Invalid release manifest: JSON parse error'
      };
    }

    const targetVersion = manifest.version || manifest.appVersion || '';
    const targetBuild = manifest.buildIdentifier || manifest.buildNumber || '';

    // Check mandatory fields
    if (!targetVersion || !targetBuild || !manifest.installerFileName || !manifest.installerSha256) {
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: 'Release manifest missing mandatory fields'
      };
    }

    // Check operating mode & certification
    if (manifest.operatingMode !== 'INTERNAL_ASSESSMENT') {
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: `Operating mode mismatch: expected INTERNAL_ASSESSMENT, got ${manifest.operatingMode}`
      };
    }

    if (manifest.certificationStatus !== 'CERTIFIED' && manifest.releaseCertificationStatus !== 'CERTIFIED') {
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: 'Staged release is not certified'
      };
    }

    // Duplicate build ID
    if (targetBuild === this.currentBuildNumber) {
      return {
        ...base,
        verificationStatus: 'NONE',
        errorMessage: 'Staged build is already the current running build'
      };
    }

    // Version downgrade check
    if (this.compareSemver(targetVersion, this.currentVersion) < 0) {
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: `Staged release (${targetVersion}) is older than installed version (${this.currentVersion})`
      };
    }

    // Installer file presence and checksum
    const installerPath = path.join(stagedDir, manifest.installerFileName);
    if (!fs.existsSync(installerPath)) {
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: `Staged installer binary not found: ${manifest.installerFileName}`
      };
    }

    const fileBuf = fs.readFileSync(installerPath);
    if (fileBuf.length <= 0) {
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: 'Staged installer binary is 0 bytes'
      };
    }

    const computedSha = crypto.createHash('sha256').update(fileBuf).digest('hex').toLowerCase();
    const expectedSha = (manifest.installerSha256 || '').toLowerCase().trim();

    if (computedSha !== expectedSha) {
      this.processManager.log('ERROR', 'Checksum mismatch in staged desktop update', {
        expected: expectedSha,
        actual: computedSha
      });
      return {
        ...base,
        verificationStatus: 'FAILED',
        errorMessage: `Checksum mismatch: expected SHA-256 ${expectedSha}, got ${computedSha}`
      };
    }

    this.processManager.log('INFO', 'Staged desktop update verified successfully', {
      availableVersion: targetVersion,
      availableBuild: targetBuild,
      checksum: computedSha
    });

    return {
      isUpdateAvailable: true,
      currentVersion: this.currentVersion,
      currentBuildNumber: this.currentBuildNumber,
      availableVersion: targetVersion,
      availableBuildNumber: targetBuild,
      releaseDate: manifest.buildTimestamp || new Date().toISOString(),
      releaseNotes: manifest.releaseNotes || [
        `aiCEV Desktop Update ${targetVersion} (${targetBuild})`,
        'Includes certified VGT calculation parity and customer isolation safeguards'
      ],
      verificationStatus: 'CERTIFIED_AND_VERIFIED',
      installerPath,
      installerSha256: computedSha,
      installerSizeBytes: fileBuf.length,
      errorMessage: null
    };
  }

  public installUpdateAndRestart(): { success: boolean; message: string; error?: string } {
    this.processManager.log('INFO', 'Initiating desktop application update & restart');

    const status = this.checkStagedUpdate();
    if (!status.isUpdateAvailable || status.verificationStatus !== 'CERTIFIED_AND_VERIFIED' || !status.installerPath) {
      return {
        success: false,
        message: status.errorMessage || 'No certified update available to install',
        error: 'UPDATE_NOT_VERIFIED'
      };
    }

    const installerPath = status.installerPath;
    this.processManager.log('INFO', 'Spawning verified setup installer', { installerPath });

    try {
      // Spawn installer detached so it continues after app quits
      const child = spawn(installerPath, [], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      this.processManager.log('INFO', 'Installer process spawned. Gracefully shutting down application services.');
      this.processManager.stopAll();

      setTimeout(() => {
        app.quit();
      }, 500);

      return {
        success: true,
        message: 'Installer launched. Application is closing for update.'
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.processManager.log('ERROR', 'Failed to spawn installer', { error: msg });
      return {
        success: false,
        message: `Failed to launch installer: ${msg}`,
        error: 'SPAWN_FAILED'
      };
    }
  }
}
