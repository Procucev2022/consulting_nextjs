import type { D1Record, WorkerD1Result } from './d1';

export type AssessmentAnalysisKind = 'module1' | 'full';

export interface AssessmentAnalysisGateMetrics {
  sourceRows: number;
  expectedRows: number;
  anomalies: number;
  fxCoveragePct: number;
  suppliers: number;
  materialGroups: number;
  plants: number;
  datedRows: number;
}

export interface AssessmentAnalysisSourceRows {
  transactionRows: D1Record[];
  records: D1Record[];
}

export type AssessmentAnalysisInputsResult =
  | { ok: false; result: WorkerD1Result }
  | {
    ok: true;
    assessment: D1Record;
    dataVersion: D1Record;
    dataVersionId: string;
    transactionRows: D1Record[];
    records: D1Record[];
  };
