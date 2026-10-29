export interface D1SeedUpload {
  assessmentId: string;
  filename: string;
  sourceChecksum: string;
  seedFile: string;
  rowCount: number;
  sumInr: number;
  sumCr: number;
  validRowCount?: number;
  excludedRowCount?: number;
  anomalyRowCount?: number;
  normalizedSpendInr?: number;
  certifiedEvidenceChecksum?: string;
  canonicalSnapshotId?: string;
}

export interface D1SeedManifest {
  version: number;
  sourceLedgerSha256: string;
  sourceAssessmentStoreSha256: string;
  seedFiles: string[];
  files: Record<string, string>;
  tables: Record<string, number>;
  uploads: D1SeedUpload[];
  pcbiHistoricalRecovery: D1PcbiHistoricalRecovery;
}

export interface D1PcbiHistoricalRecovery {
  seedFile: string;
  masterCount: number;
  observationCount: number;
  sourceMasterChecksum: string;
  sourceObservationsChecksum: string;
  sourceGitCommit: string;
}
