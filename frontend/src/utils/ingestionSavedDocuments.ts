import type {
  DocumentIngestionAnalytics,
  IngestionDataResponse,
  RawDocumentIngestion
} from '../types';

export const extractRequestedDocumentId = (search: string): string | undefined => {
  const value = new URLSearchParams(search).get('documentId');
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const isUsableSavedDocument = (document: unknown): document is RawDocumentIngestion => {
  if (!document || typeof document !== 'object') return false;
  const candidate = document as Partial<RawDocumentIngestion>;
  return (
    typeof candidate.doc_id === 'string' &&
    candidate.doc_id.trim().length > 0 &&
    typeof candidate.file_name === 'string' &&
    candidate.file_name.trim().length > 0 &&
    typeof candidate.file_type === 'string' &&
    candidate.file_type.trim().length > 0
  );
};

export const sanitizeSavedDocumentsForTenant = (
  documents: unknown,
  tenantId?: string
): RawDocumentIngestion[] => {
  if (!Array.isArray(documents)) return [];
  const seenDocIds = new Set<string>();
  const sanitized: RawDocumentIngestion[] = [];
  for (const item of documents) {
    if (!isUsableSavedDocument(item)) continue;
    if (tenantId && item.tenant_id && item.tenant_id !== tenantId) continue;
    const docId = String(item.doc_id);
    if (seenDocIds.has(docId)) continue;
    seenDocIds.add(docId);
    sanitized.push(item);
  }
  return sanitized;
};

export const resolveSavedDocumentsList = (
  response: IngestionDataResponse | null | undefined,
  tenantId?: string,
  orderedQueue: RawDocumentIngestion[] = []
): RawDocumentIngestion[] => {
  const combined = [
    ...orderedQueue,
    ...(response?.availableDocuments ?? []),
    ...(response?.queue ?? [])
  ];
  return sanitizeSavedDocumentsForTenant(combined, tenantId);
};

export const mergeSavedDocumentsList = (
  current: RawDocumentIngestion[],
  incoming: RawDocumentIngestion[],
  tenantId?: string
): RawDocumentIngestion[] => sanitizeSavedDocumentsForTenant([...incoming, ...current], tenantId);

export const hasDocumentAnalytics = (
  analytics?: DocumentIngestionAnalytics
): analytics is DocumentIngestionAnalytics => Boolean(
  analytics &&
  (
    analytics.materialGroupSummaries.length > 0 ||
    analytics.plantSummaries.length > 0 ||
    analytics.monthWiseSummaries.length > 0
  )
);

export const replaceDocumentQueryInHistory = (docId: string): void => {
  if (typeof window === 'undefined' || typeof window.history?.replaceState !== 'function') return;
  try {
    window.history.replaceState(null, '', `/?documentId=${encodeURIComponent(docId)}#module1`);
  } catch {
    // Ignore restricted history updates in sandboxed browser contexts.
  }
};

export const orderIngestionDocumentsForSelection = (
  response: IngestionDataResponse,
  assignedTenantId?: string,
  targetDocumentId?: string
): {
  orderedQueue: RawDocumentIngestion[];
  savedDocuments: RawDocumentIngestion[];
  requestedDocument?: RawDocumentIngestion;
  activeDocuments: RawDocumentIngestion[];
  resolvedSpendCr?: number;
} => {
  const sanitizedQueue = sanitizeSavedDocumentsForTenant(response.queue, assignedTenantId);
  const requestedDocument = targetDocumentId
    ? sanitizedQueue.find((document) => document.doc_id === targetDocumentId)
    : undefined;
  const orderedQueue = requestedDocument
    ? [requestedDocument, ...sanitizedQueue.filter((document) => document.doc_id !== targetDocumentId)]
    : sanitizedQueue;
  const activeDocuments = orderedQueue.slice(0, 1);
  const primaryDocument = activeDocuments[0];
  return {
    orderedQueue,
    savedDocuments: resolveSavedDocumentsList(response, assignedTenantId, orderedQueue),
    requestedDocument,
    activeDocuments,
    resolvedSpendCr: primaryDocument?.converted_inr_crores ?? response.summary?.totalSpendCr
  };
};

export const readSavedDocumentErrorReason = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
