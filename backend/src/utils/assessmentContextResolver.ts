import fs from 'fs';
import path from 'path';
import { AssessmentStore } from '../services/assessmentStore';
import { getDevelopmentDataDir } from '../services/assessmentPersistence';
import logger from './logger';
import type { AssessmentRecord } from '../types/assessment';

function lookupDevStoreRecord(cleanId: string): AssessmentRecord | undefined {
  try {
    const devPath = path.resolve(getDevelopmentDataDir(), 'assessments.json');
    if (fs.existsSync(devPath)) {
      const data = JSON.parse(fs.readFileSync(devPath, 'utf8'));
      return (data.assessments || []).find((a: AssessmentRecord) => a.assessmentId === cleanId);
    }
  } catch (err) {
    logger.debug('DevStore lookup error in assessmentContextResolver', { assessmentId: cleanId, error: err });
  }
  return undefined;
}

function lookupStoreRecord(cleanId: string): AssessmentRecord | undefined {
  try {
    const store = AssessmentStore.getInstance();
    return store?.getAssessmentById?.(cleanId);
  } catch (err) {
    logger.debug('AssessmentStore lookup error in assessmentContextResolver', {
      assessmentId: cleanId,
      error: err
    });
    return undefined;
  }
}

/**
 * Resolves customer name for an assessment without any hardcoded customer associations.
 * Searches in-memory AssessmentStore first if custom directory is active, then falls back to dev persistence file.
 */
export function resolveAssessmentCustomerName(assessmentId?: string): string {
  if (!assessmentId || typeof assessmentId !== 'string') {
    return 'Enterprise Client';
  }
  const cleanId = assessmentId.trim();
  if (!cleanId) {
    return 'Enterprise Client';
  }

  try {
    const store = AssessmentStore.getInstance();
    if (store?.getCustomDataDir?.()) {
      const name = lookupStoreRecord(cleanId)?.customerName;
      if (name) return name;
    }
  } catch {
    // safe fallback
  }

  const devName = lookupDevStoreRecord(cleanId)?.customerName;
  if (devName) return devName;

  const storeName = lookupStoreRecord(cleanId)?.customerName;
  if (storeName) return storeName;

  return `Enterprise Client (${cleanId})`;
}

/**
 * Validates assessment existence and returns authoritative AssessmentRecord.
 * Throws an explicit error if the assessment does not exist.
 */
export function resolveAuthoritativeAssessment(assessmentId: string): AssessmentRecord {
  const cleanId = (assessmentId || '').trim();
  if (!cleanId) {
    throw new Error('Assessment identifier is required.');
  }

  let record: AssessmentRecord | undefined;
  try {
    const store = AssessmentStore.getInstance();
    if (store?.getCustomDataDir?.()) {
      record = lookupStoreRecord(cleanId);
    }
  } catch {
    // safe fallback
  }

  if (!record) {
    record = lookupDevStoreRecord(cleanId) || lookupStoreRecord(cleanId);
  }

  if (!record) {
    throw new Error(`Assessment '${cleanId}' was not found in assessment store / persistence store.`);
  }

  return record;
}
