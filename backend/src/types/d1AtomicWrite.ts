export interface D1AtomicWriteContext {
  operation?: string;
  action?: string;
  requestId?: string;
  tenantId?: string;
  assessmentId?: string;
  documentId?: string;
  sourceId?: string;
  pcbiId?: string;
  documentCount?: number;
  objectCount?: number;
}
