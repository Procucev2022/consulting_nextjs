import fs from 'fs';
import path from 'path';
import { AssessmentStore } from '../services/assessmentStore';
import { getDevelopmentDataDir } from '../services/assessmentPersistence';
import logger from './logger';
import type { AssessmentRecord, AssessmentAnalysisRun } from '../types/assessment';

function lookupDevStoreRuns(cleanId: string): AssessmentAnalysisRun[] | undefined {
  try {
    const devPath = path.resolve(getDevelopmentDataDir(), 'assessments.json');
    if (fs.existsSync(devPath)) {
      const data = JSON.parse(fs.readFileSync(devPath, 'utf8'));
      const runs = data.analysisRuns?.[cleanId];
      if (Array.isArray(runs) && runs.length > 0) {
        return runs;
      }
    }
    const testPath = path.resolve(getDevelopmentDataDir(), '../test/assessments.json');
    if (fs.existsSync(testPath)) {
      const testData = JSON.parse(fs.readFileSync(testPath, 'utf8'));
      const testRuns = testData.analysisRuns?.[cleanId];
      if (Array.isArray(testRuns) && testRuns.length > 0) {
        return testRuns;
      }
    }
  } catch (err) {
    logger.debug('DevStore runs lookup error in assessmentContextResolver', { assessmentId: cleanId, error: err });
  }
  return undefined;
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

/**
 * Resolves authoritative analysis runs for an assessment.
 */
export function resolveAuthoritativeRuns(assessmentId: string): AssessmentAnalysisRun[] {
  const cleanId = (assessmentId || '').trim();
  if (!cleanId) return [];

  const devRuns = lookupDevStoreRuns(cleanId);
  if (devRuns && devRuns.length > 0) {
    return devRuns;
  }

  try {
    const store = AssessmentStore.getInstance();
    return store.getAnalysisRuns(cleanId);
  } catch {
    return [];
  }
}

function lookupDevStoreRecord(cleanId: string): AssessmentRecord | undefined {
  try {
    const devPath = path.resolve(getDevelopmentDataDir(), 'assessments.json');
    if (fs.existsSync(devPath)) {
      const data = JSON.parse(fs.readFileSync(devPath, 'utf8'));
      const found = (data.assessments || []).find((a: AssessmentRecord) => a.assessmentId === cleanId);
      if (found) return found;
    }
    const testPath = path.resolve(getDevelopmentDataDir(), '../test/assessments.json');
    if (fs.existsSync(testPath)) {
      const testData = JSON.parse(fs.readFileSync(testPath, 'utf8'));
      const testFound = (testData.assessments || []).find((a: AssessmentRecord) => a.assessmentId === cleanId);
      if (testFound) return testFound;
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
