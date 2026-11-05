import {
  ASSESSMENT_D1_BOOLEAN_COLUMNS,
  ASSESSMENT_D1_COLLECTION_ID_COLUMNS,
  ASSESSMENT_D1_JSON_COLUMNS,
  ASSESSMENT_SNAPSHOT_SQL,
  assessmentD1ObjectSchema
} from '../constants/assessmentD1';
import type {
  AssessmentRecord, CustomerRecord, AssessmentDataVersion, AssessmentAnalysisRun, AssessmentAuditLog
} from '../types/assessment';
import type { D1Record } from '../types/d1';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { AssessmentSnapshotRow, AssessmentSnapshotType } from '../types/assessmentD1';

export async function loadAssessmentSnapshots(
  db: CloudflareD1Database, entryType: AssessmentSnapshotType, assessmentId?: string
): Promise<Map<string, D1Record>> {
  const statement = assessmentId === undefined
    ? db.prepare(ASSESSMENT_SNAPSHOT_SQL.byType).bind(entryType)
    : db.prepare(ASSESSMENT_SNAPSHOT_SQL.byAssessment).bind(entryType, assessmentId);
  const rows = await statement.all<AssessmentSnapshotRow>();
  return new Map(rows.results.map((row) => [
    row.entry_id, assessmentD1ObjectSchema.parse(JSON.parse(row.payload_json))
  ]));
}

export async function loadAssessmentSnapshotsForIds(
  db: CloudflareD1Database, entryType: AssessmentSnapshotType, assessmentIds: string[]
): Promise<Map<string, D1Record>> {
  if (assessmentIds.length === 0) return new Map();
  const rows = await db.prepare(ASSESSMENT_SNAPSHOT_SQL.byAssessmentIds)
    .bind(entryType, JSON.stringify(assessmentIds)).all<AssessmentSnapshotRow>();
  return new Map(rows.results.map((row) => [
    row.entry_id, assessmentD1ObjectSchema.parse(JSON.parse(row.payload_json))
  ]));
}

export function mapD1SnapshotCollection<T>(
  rows: D1Record[], snapshots: Map<string, D1Record>, mapper: (row: D1Record, snapshot?: D1Record) => T
): T[] {
  const sourceEntries = [...snapshots.values()].map((snapshot) => mapper({}, snapshot));
  const additionalRows = rows.filter((row) => !ASSESSMENT_D1_COLLECTION_ID_COLUMNS.some((column) =>
    row[column] !== undefined && snapshots.has(String(row[column]))));
  return [...sourceEntries, ...additionalRows.map((row) => mapper(row))];
}

function mapRecord(row: D1Record): D1Record {
  const pairs = Object.entries(row).filter(([, value]) => value !== null && value !== undefined)
    .filter(([key]) => key !== 'metrics_json')
    .map(([key, value]): [string, unknown] => {
      const jsonKey = ASSESSMENT_D1_JSON_COLUMNS[key];
      if (jsonKey) return [jsonKey, assessmentD1ObjectSchema.parse(JSON.parse(String(value)))];
      const name = key.replace(/_([a-z])/g, (_match, letter: string): string => letter.toUpperCase());
      return [name, ASSESSMENT_D1_BOOLEAN_COLUMNS.has(key) ? value === 1 || value === true : value];
    });
  return Object.fromEntries(pairs);
}

export function mapD1Customer(row: D1Record, snapshot?: D1Record): CustomerRecord {
  return { ...snapshot, ...mapRecord(row) } as unknown as CustomerRecord;
}

export function mapD1Assessment(row: D1Record, snapshot?: D1Record): AssessmentRecord {
  return { ...snapshot, ...mapRecord(row) } as unknown as AssessmentRecord;
}

export function mapD1DataVersion(row: D1Record, snapshot?: D1Record): AssessmentDataVersion {
  return { ...snapshot, ...mapRecord(row) } as unknown as AssessmentDataVersion;
}

export function mapD1AnalysisRun(row: D1Record, snapshot?: D1Record): AssessmentAnalysisRun {
  const metrics = row.metrics_json ? assessmentD1ObjectSchema.parse(JSON.parse(String(row.metrics_json))) : {};
  return { reviewGates: [], ...snapshot, ...metrics, ...mapRecord(row) } as unknown as AssessmentAnalysisRun;
}

export function mapD1AuditLog(row: D1Record, snapshot?: D1Record): AssessmentAuditLog {
  return { ...snapshot, ...mapRecord(row) } as unknown as AssessmentAuditLog;
}
