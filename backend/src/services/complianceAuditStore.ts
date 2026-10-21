/**
 * Module 2 — Lever 9: Durable Compliance Audit Store
 * Persistent, Append-Only Storage for Procurement Compliance Reviews
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import type { ComplianceReviewRecord } from '../types/module2ProcurementCompliance';

interface PersistedComplianceReviews {
  version: number;
  updatedAt: string;
  reviews: Record<string, Record<string, ComplianceReviewRecord[]>>;
}

export class ComplianceAuditStore {
  private static instance: ComplianceAuditStore;
  private reviews: Map<string, Map<string, ComplianceReviewRecord[]>> = new Map();
  private customDataDir?: string;
  private isLoaded = false;

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): ComplianceAuditStore {
    if (!ComplianceAuditStore.instance) {
      ComplianceAuditStore.instance = new ComplianceAuditStore();
    }
    return ComplianceAuditStore.instance;
  }

  public static resetInstance(): void {
    ComplianceAuditStore.instance = undefined as unknown as ComplianceAuditStore;
  }

  public getDataDir(): string {
    if (this.customDataDir) return this.customDataDir;
    if (process.env.AICEV_DATA_DIR) return process.env.AICEV_DATA_DIR;
    return path.resolve(process.cwd(), 'data');
  }

  public setCustomDataDir(dir?: string): void {
    this.customDataDir = dir;
    this.isLoaded = false;
    this.loadFromDisk();
  }

  private getFilePath(): string {
    return path.join(this.getDataDir(), 'compliance_reviews.json');
  }

  public loadFromDisk(): boolean {
    const targetFile = this.getFilePath();
    const backupFile = `${targetFile}.bak`;
    let fileToRead: string | null = null;

    if (fs.existsSync(targetFile)) {
      fileToRead = targetFile;
    } else if (fs.existsSync(backupFile)) {
      fileToRead = backupFile;
    }

    if (!fileToRead) {
      this.reviews.clear();
      this.isLoaded = true;
      return false;
    }

    try {
      const raw = fs.readFileSync(fileToRead, 'utf-8');
      const data: PersistedComplianceReviews = JSON.parse(raw);
      this.reviews.clear();

      if (data && typeof data === 'object' && data.reviews) {
        for (const [assessmentId, exMap] of Object.entries(data.reviews)) {
          const map = new Map<string, ComplianceReviewRecord[]>();
          for (const [exId, records] of Object.entries(exMap)) {
            if (Array.isArray(records)) {
              map.set(exId, [...records]);
            }
          }
          this.reviews.set(assessmentId, map);
        }
      }
      this.isLoaded = true;
      logger.info('Loaded durable compliance review audit log from disk', {
        file: fileToRead,
        assessmentsCount: this.reviews.size
      });
      return true;
    } catch (err) {
      logger.error('Failed to load compliance reviews from disk', {
        file: fileToRead,
        error: err instanceof Error ? err.message : String(err)
      });
      this.isLoaded = true;
      return false;
    }
  }

  public persistToDisk(): void {
    const dataDir = this.getDataDir();
    const targetFile = this.getFilePath();
    const tempFile = path.join(
      dataDir,
      `compliance_reviews.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`
    );
    const backupFile = `${targetFile}.bak`;

    const serializedData: Record<string, Record<string, ComplianceReviewRecord[]>> = {};
    for (const [assessmentId, exMap] of this.reviews.entries()) {
      serializedData[assessmentId] = {};
      for (const [exId, records] of exMap.entries()) {
        serializedData[assessmentId][exId] = [...records];
      }
    }

    const payload: PersistedComplianceReviews = {
      version: 1,
      updatedAt: new Date().toISOString(),
      reviews: serializedData
    };

    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');

      if (fs.existsSync(targetFile)) {
        try {
          fs.copyFileSync(targetFile, backupFile);
        } catch (bakErr) {
          logger.warn('Failed to create backup copy of compliance_reviews.json', { error: bakErr });
        }
      }

      try {
        fs.renameSync(tempFile, targetFile);
      } catch {
        fs.copyFileSync(tempFile, targetFile);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }
      logger.debug('Persisted compliance review audit log to disk', { targetFile });
    } catch (err) {
      logger.error('CRITICAL: Failed to persist compliance reviews to disk', {
        error: err instanceof Error ? err.message : String(err),
        dataDir
      });
      throw err;
    }
  }

  public appendReview(assessmentId: string, record: ComplianceReviewRecord & { candidateId: string }): void {
    if (!this.isLoaded) this.loadFromDisk();

    let map = this.reviews.get(assessmentId);
    if (!map) {
      map = new Map<string, ComplianceReviewRecord[]>();
      this.reviews.set(assessmentId, map);
    }

    const exId = record.candidateId || record.exceptionId || 'UNKNOWN';
    const history = map.get(exId) || [];
    // Append-only: create new immutable entry
    const entry: ComplianceReviewRecord = {
      reviewId: record.reviewId,
      exceptionId: exId,
      reviewerName: record.reviewerName,
      reviewerRole: record.reviewerRole || 'PROCUREMENT_OFFICER',
      reviewDate: record.reviewDate,
      timestamp: record.timestamp || new Date().toISOString(),
      previousStatus: record.previousStatus,
      status: record.status,
      decision: record.decision || (record.status === 'NOT_AN_EXCEPTION' ? 'DISMISS_EXCEPTION' : 'VERIFY_EXCEPTION'),
      technicalJustification: record.technicalJustification,
      correctiveActionPlan: record.correctiveActionPlan,
      dismissalReason: record.dismissalReason,
      supportingReferences: record.supportingReferences || []
    };

    history.push(entry);
    map.set(exId, history);

    this.persistToDisk();
  }

  public getReviewsForAssessment(assessmentId: string): Record<string, ComplianceReviewRecord[]> {
    if (!this.isLoaded) this.loadFromDisk();
    const map = this.reviews.get(assessmentId);
    if (!map) return {};

    const result: Record<string, ComplianceReviewRecord[]> = {};
    for (const [exId, records] of map.entries()) {
      result[exId] = [...records];
    }
    return result;
  }

  public getReviewHistoryForException(assessmentId: string, exceptionId: string): ComplianceReviewRecord[] {
    if (!this.isLoaded) this.loadFromDisk();
    const map = this.reviews.get(assessmentId);
    if (!map) return [];
    const records = map.get(exceptionId);
    return records ? [...records] : [];
  }

  public clear(): void {
    this.reviews.clear();
    const targetFile = this.getFilePath();
    const backupFile = `${targetFile}.bak`;
    if (fs.existsSync(targetFile)) {
      try {
        fs.unlinkSync(targetFile);
      } catch {
        // ignore
      }
    }
    if (fs.existsSync(backupFile)) {
      try {
        fs.unlinkSync(backupFile);
      } catch {
        // ignore
      }
    }
  }
}
