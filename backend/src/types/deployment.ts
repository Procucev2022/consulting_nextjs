/**
 * Types and Interfaces for Post-Deployment Operations Verification
 */

export interface BackendOperationResult {
  operation: string;
  endpoint: string;
  status: 'passed' | 'failed';
  statusCode: number;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface DatabaseOperationResult {
  operation: string;
  model: string;
  status: 'passed' | 'failed';
  durationMs: number;
  recordsRetrieved: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface FileUploadOperationResult {
  operation: string;
  fileName: string;
  fileType: string;
  fileSizeMb: number;
  recordsIngested: number;
  status: 'passed' | 'failed';
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface DeploymentVerificationReport {
  success: boolean;
  timestamp: string;
  backendOperation: BackendOperationResult;
  databaseOperation: DatabaseOperationResult;
  fileUploadOperation: FileUploadOperationResult;
  totalDurationMs: number;
}
