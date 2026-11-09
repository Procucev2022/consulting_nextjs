export interface D1AtomicWriteContext {
  operation?: string;
  action?: string;
  requestId?: string;
  tenantId?: string;
  assessmentId?: string;
  documentId?: string;
  objectKey?: string;
  cleanupId?: string;
  reason?: string;
  statementCount?: number;
  sourceId?: string;
  pcbiId?: string;
  documentCount?: number;
  objectCount?: number;
}
