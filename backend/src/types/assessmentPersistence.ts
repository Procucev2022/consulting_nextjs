import type { PersistenceEnvironment } from '../constants/assessment';
import type {
  AssessmentAnalysisRun,
  AssessmentAuditLog,
  AssessmentDataVersion,
  AssessmentRecord,
  CustomerRecord
} from './assessment';

export interface SystemBuildInfo {
  applicationVersion: string;
  buildNumber: string;
  gitCommit: string;
  buildTimestamp: string;
  operatingMode: string;
  certificationStatus: string;
  e2eCertificationId: string;
  fxMaster: { version: string; checksum: string };
  pcbiMaster: { version: string; checksum: string };
  vgtDatasetChecksum?: string;
  evidenceWorkbookChecksum?: string;
  moduleVersions?: { module1: string; module2: string; module3: string; module4: string };
  persistence?: PersistenceInfo;
}

export interface PersistenceInfo {
  environment: PersistenceEnvironment;
  activeDataDir: string;
  sanitizedPath: string;
  isTestIsolated: boolean;
  storeExists: boolean;
  assessmentCount: number;
}

export interface PersistedStoreData {
  version: number;
  updatedAt: string;
  nextSequence: number;
  nextCustomerSequence?: number;
  customers?: CustomerRecord[];
  assessments: AssessmentRecord[];
  dataVersions: Record<string, AssessmentDataVersion[]>;
  analysisRuns: Record<string, AssessmentAnalysisRun[]>;
  auditLogs: Record<string, AssessmentAuditLog[]>;
}
