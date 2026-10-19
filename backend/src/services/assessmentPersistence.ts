import fs from 'fs';
import path from 'path';
import type { PersistedStoreData, PersistenceEnvironment } from '../types/assessment';
import { PERSISTENCE_ENVIRONMENTS } from '../constants/assessment';
import logger from '../utils/logger';

export function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export function getDevelopmentDataDir(): string {
  return path.resolve(__dirname, '../../../data/dev');
}

export function getDesktopRuntimeDataDir(): string | null {
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'aiCEV', 'data');
  }
  return null;
}

export function isProtectedLiveStore(targetDir: string): boolean {
  if (!targetDir) {
    return false;
  }
  const normalized = path.resolve(targetDir).toLowerCase();
  const devDir = path.resolve(getDevelopmentDataDir()).toLowerCase();
  if (normalized === devDir) {
    return true;
  }

  const appDataDir = getDesktopRuntimeDataDir();
  if (appDataDir && normalized === path.resolve(appDataDir).toLowerCase()) {
    return true;
  }

  return false;
}

export function sanitizePersistencePath(dirPath: string): string {
  if (!dirPath) {
    return '';
  }
  const resolved = path.resolve(dirPath);
  const normalized = resolved.replace(/\\/g, '/');

  const workspaceRoot = path.resolve(__dirname, '../../..').replace(/\\/g, '/');
  if (normalized.toLowerCase().startsWith(workspaceRoot.toLowerCase())) {
    return '<WORKSPACE>' + normalized.slice(workspaceRoot.length);
  }

  const appData = (process.env.APPDATA || '').replace(/\\/g, '/');
  if (appData && normalized.toLowerCase().startsWith(appData.toLowerCase())) {
    return '<APPDATA>' + normalized.slice(appData.length);
  }

  const userProfile = (process.env.USERPROFILE || process.env.HOME || '').replace(/\\/g, '/');
  if (userProfile && normalized.toLowerCase().startsWith(userProfile.toLowerCase())) {
    return '<USER_HOME>' + normalized.slice(userProfile.length);
  }

  return normalized;
}

export function getAuthoritativeDataDir(): string {
  if (process.env.AICEV_DATA_DIR) {
    return process.env.AICEV_DATA_DIR;
  }
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'aiCEV', 'data');
  }
  return path.resolve(__dirname, '../../../data');
}

export function getPersistenceEnvironment(
  targetDir: string,
  isCustomInjected = false
): PersistenceEnvironment {
  if (isTestMode() || isCustomInjected) {
    return PERSISTENCE_ENVIRONMENTS.TEST;
  }
  const normalized = path.resolve(targetDir).toLowerCase();
  const devDir = path.resolve(getDevelopmentDataDir()).toLowerCase();
  if (
    normalized === devDir ||
    (process.env.AICEV_DATA_DIR && normalized === path.resolve(process.env.AICEV_DATA_DIR).toLowerCase())
  ) {
    return PERSISTENCE_ENVIRONMENTS.DEVELOPMENT;
  }
  const appDataDir = getDesktopRuntimeDataDir();
  if (appDataDir && normalized === path.resolve(appDataDir).toLowerCase()) {
    return PERSISTENCE_ENVIRONMENTS.DESKTOP_RUNTIME;
  }
  return PERSISTENCE_ENVIRONMENTS.DEFAULT;
}

function resolveStoreFileToRead(dataDir: string): string | null {
  const primaryFile = path.join(dataDir, 'assessments.json');
  const backupFile = path.join(dataDir, 'assessments.json.bak');

  if (fs.existsSync(primaryFile)) {
    return primaryFile;
  }
  if (fs.existsSync(backupFile)) {
    logger.warn('Primary assessments.json not found, reading from backup file', { backupFile });
    return backupFile;
  }
  return null;
}

function asRecord(val: unknown): Record<string, unknown> {
  return val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : {};
}

function normalizePersistedStore(parsed: unknown, fileToRead: string): PersistedStoreData | null {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Record<string, unknown>).assessments)) {
    logger.warn('Corrupt or invalid assessment store structure on disk', { fileToRead });
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  return {
    version: (obj.version as number) || 1,
    updatedAt: (obj.updatedAt as string) || new Date().toISOString(),
    nextSequence: typeof obj.nextSequence === 'number' ? obj.nextSequence : 2,
    nextCustomerSequence: typeof obj.nextCustomerSequence === 'number' ? obj.nextCustomerSequence : 2,
    customers: Array.isArray(obj.customers) ? (obj.customers as PersistedStoreData['customers']) : [],
    assessments: obj.assessments as PersistedStoreData['assessments'],
    dataVersions: asRecord(obj.dataVersions) as PersistedStoreData['dataVersions'],
    analysisRuns: asRecord(obj.analysisRuns) as PersistedStoreData['analysisRuns'],
    auditLogs: asRecord(obj.auditLogs) as PersistedStoreData['auditLogs']
  };
}

export function loadAssessmentStoreFromDisk(dataDir: string): PersistedStoreData | null {
  try {
    const fileToRead = resolveStoreFileToRead(dataDir);
    if (!fileToRead) {
      return null;
    }

    const raw = fs.readFileSync(fileToRead, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizePersistedStore(parsed, fileToRead);
  } catch (err: unknown) {
    logger.error('Failed to read assessment store from disk', { error: err, dataDir });
    return null;
  }
}

export function persistAssessmentStoreToDisk(dataDir: string, data: PersistedStoreData): void {
  if (isTestMode() && isProtectedLiveStore(dataDir)) {
    const sanitized = sanitizePersistencePath(dataDir);
    logger.error('CRITICAL_TEST_ISOLATION_BREACH: Automated test attempted to write to live data directory', {
      dataDir: sanitized
    });
    throw new Error(
      `CRITICAL_TEST_ISOLATION_BREACH: Automated test attempted to write to live data directory: ${sanitized}`
    );
  }

  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const targetFile = path.join(dataDir, 'assessments.json');
    const tempFile = path.join(
      dataDir,
      `assessments.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`
    );
    const backupFile = path.join(dataDir, 'assessments.json.bak');

    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempFile, serialized, 'utf8');

    if (fs.existsSync(targetFile)) {
      try {
        fs.copyFileSync(targetFile, backupFile);
      } catch (bakErr: unknown) {
        logger.warn('Failed to create backup copy of assessments.json', { error: bakErr });
      }
    }

    try {
      fs.renameSync(tempFile, targetFile);
    } catch (renameErr: unknown) {
      try {
        fs.copyFileSync(tempFile, targetFile);
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch {
        throw renameErr;
      }
    }
    logger.debug('Persisted assessment store to disk', { targetFile, count: data.assessments.length });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('CRITICAL: Failed to persist assessment store to disk', { error: errorMsg, dataDir });
    throw new Error(`CRITICAL_PERSISTENCE_FAILURE: Could not write assessment store to disk: ${errorMsg}`);
  }
}
