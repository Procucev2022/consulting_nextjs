/**
 * Loads the evidence snapshot for one job: tenant, analysis runs, data versions, ledger totals,
 * and (on demand) the ledger detail used by workbook sheets.
 */

import type { CloudflareD1Database } from '../types/cloudflare';
import type {
  EvidenceJobAccessRecord,
  EvidenceRunRecord,
  EvidenceSnapshot,
  EvidenceSnapshotOptions
} from '../types/evidenceWorkbook';
import {
  loadAnalysisRunRecords,
  loadDataVersionRecords,
  loadLedgerDetail,
  loadLedgerTotals
} from './evidenceD1Repository';

export const isActiveRun = (run: EvidenceRunRecord): boolean => run.isApproved && !run.isSuperseded;

export const loadEvidenceSnapshot = async (
  db: CloudflareD1Database,
  job: EvidenceJobAccessRecord,
  options: EvidenceSnapshotOptions
): Promise<EvidenceSnapshot> => {
  const { requestId } = options;
  const jobId = job.assessmentId;
  const tenantId = job.tenantId;
  const [runs, versions, ledger] = await Promise.all([
    loadAnalysisRunRecords(db, jobId, requestId),
    loadDataVersionRecords(db, jobId, requestId),
    loadLedgerTotals(db, tenantId, jobId, requestId)
  ]);
  return {
    jobId,
    tenantId,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    assessment: job,
    runs,
    versions,
    activeRun: runs.find(isActiveRun) ?? null,
    activeVersion: versions.find((version) => !version.isSuperseded) ?? null,
    ledger,
    detail: null
  };
};

export const attachLedgerDetail = async (
  db: CloudflareD1Database,
  snapshot: EvidenceSnapshot,
  requestId: string
): Promise<EvidenceSnapshot> => {
  if (snapshot.detail !== null) return snapshot;
  const detail = await loadLedgerDetail(db, snapshot.tenantId, snapshot.jobId, requestId);
  return { ...snapshot, detail };
};
