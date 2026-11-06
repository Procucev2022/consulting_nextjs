export type PcbiAdminStoredJsonField = 'metrics_json' | 'payload_json';

export interface PcbiAdminStoredJsonLogContext {
  requestId?: string;
  version?: string;
  uploadId?: string;
  field: PcbiAdminStoredJsonField;
}

export interface PcbiAdminStoredJsonResult {
  value: Record<string, unknown>;
  valid: boolean;
}
