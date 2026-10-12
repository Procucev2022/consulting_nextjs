import fs from 'fs';
import path from 'path';
import type { PersistedStoreData } from '../types/assessment';
import logger from '../utils/logger';

export function getAuthoritativeDataDir(): string {
  if (process.env.AICEV_DATA_DIR) {
    return process.env.AICEV_DATA_DIR;
  }
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'aiCEV', 'data');
  }
  return path.resolve(__dirname, '../../../data');
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
