import { describe, expect, it } from 'vitest';
import {
  extractRequestedDocumentId,
  hasDocumentAnalytics,
  isUsableSavedDocument,
  mergeSavedDocumentsList,
  orderIngestionDocumentsForSelection,
  readSavedDocumentErrorReason,
  replaceDocumentQueryInHistory,
  resolveEffectiveUserId,
  resolveSavedDocumentsList,
  sanitizeSavedDocumentsForTenant
} from '../../src/utils/ingestionSavedDocuments';
import type { RawDocumentIngestion } from '../../src/types';

const doc = (overrides: Partial<RawDocumentIngestion> = {}): RawDocumentIngestion => ({
  doc_id: 'DOC-1',
  tenant_id: 'TNT-1',
  file_name: 'spend.xlsx',
  file_type: 'XLSX',
  file_size_mb: 1.5,
  ocr_status: 'Completed',
  progress: 100,
  records_count: 10,
  converted_inr_crores: 5.5,
  detected_currencies: ['INR'],
  ...overrides
});

describe('ingestionSavedDocuments utilities', () => {
  it('extracts and trims documentId from URL search strings', () => {
    expect(extractRequestedDocumentId('?documentId=%20DOC-99%20')).toBe('DOC-99');
    expect(extractRequestedDocumentId('?documentId=   ')).toBeUndefined();
    expect(extractRequestedDocumentId('')).toBeUndefined();
  });

  it('validates usable saved document shapes', () => {
    expect(isUsableSavedDocument(doc())).toBe(true);
    expect(isUsableSavedDocument(null)).toBe(false);
    expect(isUsableSavedDocument(doc({ doc_id: '  ' }))).toBe(false);
    expect(isUsableSavedDocument(doc({ file_name: '' }))).toBe(false);
    expect(isUsableSavedDocument(doc({ file_type: '' }))).toBe(false);
    expect(isUsableSavedDocument(doc({ file_type: undefined }))).toBe(true);
  });

  it('sanitizes, scopes by tenant, and deduplicates saved document lists', () => {
    const result = sanitizeSavedDocumentsForTenant(
      [
        doc({ doc_id: 'DOC-1' }),
        doc({ doc_id: 'DOC-1', file_name: 'duplicate.xlsx' }),
        doc({ doc_id: 'DOC-OTHER', tenant_id: 'TNT-2' }),
        doc({ doc_id: '' })
      ],
      'TNT-1'
    );
    expect(result).toHaveLength(1);
    expect(result[0].doc_id).toBe('DOC-1');
    expect(sanitizeSavedDocumentsForTenant('invalid', 'TNT-1')).toEqual([]);

    const userScoped = sanitizeSavedDocumentsForTenant(
      [
        doc({ doc_id: 'DOC-MINE', tenant_id: 'TNT-1', user_id: 'USR-ME' }),
        doc({ doc_id: 'DOC-OTHER-USER', tenant_id: 'TNT-1', user_id: 'USR-OTHER' })
      ],
      'TNT-1',
      'USR-ME'
    );
    expect(userScoped).toHaveLength(1);
    expect(userScoped[0].doc_id).toBe('DOC-MINE');

    const adminView = sanitizeSavedDocumentsForTenant(
      [
        doc({ doc_id: 'DOC-MINE', tenant_id: 'TNT-1', user_id: 'USR-ME' }),
        doc({ doc_id: 'DOC-OTHER-USER', tenant_id: 'TNT-1', user_id: 'USR-OTHER' }),
        doc({ doc_id: 'DOC-NO-USER', tenant_id: 'TNT-1', user_id: undefined })
      ],
      'TNT-1',
      undefined
    );
    expect(adminView).toHaveLength(3);
  });

  it('resolves ordered saved documents and merges incoming uploads', () => {
    const d1 = doc({ doc_id: 'DOC-1' });
    const d2 = doc({ doc_id: 'DOC-2', file_name: 'second.xlsx' });
    const d3 = doc({ doc_id: 'DOC-3', file_name: 'third.xlsx' });

    const resolved = resolveSavedDocumentsList(
      { queue: [d1], availableDocuments: [d1, d2], validationRecords: [] },
      'TNT-1',
      [d2]
    );
    expect(resolved.map((item) => item.doc_id)).toEqual(['DOC-2', 'DOC-1']);
    expect(resolveSavedDocumentsList(undefined, 'TNT-1')).toEqual([]);

    const merged = mergeSavedDocumentsList([d1, d2], [d3, d1], 'TNT-1');
    expect(merged.map((item) => item.doc_id)).toEqual(['DOC-3', 'DOC-1', 'DOC-2']);
  });

  it('detects whether document analytics contain non-empty dimension summaries', () => {
    expect(hasDocumentAnalytics(undefined)).toBe(false);
    expect(hasDocumentAnalytics({
      materialGroupSummaries: [],
      plantSummaries: [],
      monthWiseSummaries: [],
      uniqueItemsCount: 0,
      uniqueVendorsCount: 0
    })).toBe(false);
    expect(hasDocumentAnalytics({
      materialGroupSummaries: [{
        group_code: 'MAT',
        group_name: 'Materials',
        primary_segment: 'Direct Materials'
      }],
      plantSummaries: [],
      monthWiseSummaries: [],
      uniqueItemsCount: 1,
      uniqueVendorsCount: 1
    })).toBe(true);
  });

  it('orders selected ingestion documents, updates history safely, and formats error reasons', () => {
    const d1 = doc({ doc_id: 'DOC-1', converted_inr_crores: 10 });
    const d2 = doc({ doc_id: 'DOC-2', file_name: 'two.xlsx', converted_inr_crores: undefined });

    const ordered = orderIngestionDocumentsForSelection(
      {
        queue: [d1, d2],
        validationRecords: [],
        summary: {
          totalFiles: 2, totalRecords: 10, cleanCount: 10, anomaliesCount: 0, allResolvedCount: 10,
          pendingActionsCount: 0, conversionCount: 0, vendorDuplicationCount: 0, itemDuplicationCount: 0,
          totalSpendCr: 25, pendingSpendCr: 0
        }
      },
      'TNT-1',
      'DOC-2'
    );
    expect(ordered.requestedDocument?.doc_id).toBe('DOC-2');
    expect(ordered.activeDocuments).toEqual([d2]);
    expect(ordered.resolvedSpendCr).toBe(25);

    const unordered = orderIngestionDocumentsForSelection({ queue: [], validationRecords: [] }, 'TNT-1');
    expect(unordered.requestedDocument).toBeUndefined();
    expect(unordered.resolvedSpendCr).toBeUndefined();

    replaceDocumentQueryInHistory('DOC-2');
    expect(window.location.search).toBe('?documentId=DOC-2');
    expect(window.location.hash).toBe('#module1');

    const originalReplace = window.history.replaceState;
    window.history.replaceState = () => {
      throw new Error('blocked');
    };
    expect(() => replaceDocumentQueryInHistory('DOC-3')).not.toThrow();
    window.history.replaceState = originalReplace;
    window.history.replaceState(null, '', '/');

    expect(readSavedDocumentErrorReason(new Error('D1 failed'))).toBe('D1 failed');
    expect(readSavedDocumentErrorReason('string failure')).toBe('string failure');

    expect(resolveEffectiveUserId(null)).toBeUndefined();
    expect(resolveEffectiveUserId(undefined)).toBeUndefined();
    expect(resolveEffectiveUserId({ role: 'ADMIN', id: 'USR-ADMIN' })).toBeUndefined();
    expect(resolveEffectiveUserId({ role: 'USER', id: 'USR-BUYER' })).toBe('USR-BUYER');
    expect(resolveEffectiveUserId({ role: 'USER', id: '' })).toBeUndefined();
  });
});
