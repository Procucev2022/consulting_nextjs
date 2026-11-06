export interface OrchestrationChecklistLogContext {
  requestId?: string;
  tenantId?: string;
  assessmentId?: string;
  reportVersionId?: string;
  checklistId?: string;
}

export interface OrchestrationAuditMetadataLogContext {
  requestId?: string;
  tenantId?: string;
  assessmentId?: string | null;
  eventId?: string;
}
