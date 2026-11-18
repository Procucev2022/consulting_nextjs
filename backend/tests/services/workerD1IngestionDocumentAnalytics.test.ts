import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  enrichSelectedDocumentIngestionResponse,
  loadDocumentTransactionAnalytics
} from '../../src/services/workerD1IngestionDocumentAnalytics';
import {
  createWorkerDatabase,
  insertRows,
  runtimeEnvironment,
  type WorkerDatabaseFixture
} from '../helpers/workerCoreFixtures';
import { handleIngestionRoute } from '../../src/workerD1IngestionRoutes';

let fixture: WorkerDatabaseFixture;

beforeEach(() => {
  fixture = createWorkerDatabase();
});

afterEach(() => {
  fixture.close();
});

const seedSavedDocumentsAndTransactions = (): void => {
  insertRows(
    fixture.db,
    'INSERT OR IGNORE INTO TenantMaster (tenant_id, enterprise_name, region, base_currency, status, total_spend_evaluated) VALUES (?, ?, ?, ?, ?, ?)',
    [['TNT-1', 'Tenant One', 'APAC', 'INR', 'ACTIVE', 100]]
  );
  insertRows(
    fixture.db,
    'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, uploaded_at, records_count, converted_inr_crores, detected_currencies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      ['DOC-NEWER', 'TNT-1', 'newer.xlsx', 'XLSX', 1.2, 'Completed', 100, '2026-11-18T05:00:00Z', 1, 2.5, '["INR"]'],
      ['DOC-OLDER', 'TNT-1', 'older.xlsx', 'XLSX', 2.4, 'Completed', 100, '2026-10-29T08:00:00Z', 2, 12.5, '["INR","USD"]']
    ]
  );
  insertRows(
    fixture.db,
    'INSERT INTO ValidationPreCheckRecord (record_id, tenant_id, po_number, vendor_name, raw_desc, amount, raw_currency, amount_inr, inr_crores, fx_rate_applied, issue_flag, action_status, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      ['REC-DOC-OLDER-ROW-2', 'TNT-1', 'PO-1', 'Acme', 'Valve', 100, 'INR', 50000000, 5.0, 1, 'Passed Clean', 'Ready', 1, '2026-10-29T08:01:00Z'],
      ['REC-DOC-OLDER-ROW-3', 'TNT-1', 'PO-2', 'Beta', 'Pump', 100, 'USD', 75000000, 7.5, 84, 'Missing Currency Code', 'Fix Currency', 0, '2026-10-29T08:02:00Z'],
      ['REC-DOC-NEWER-ROW-2', 'TNT-1', 'PO-9', 'Gamma', 'Bolt', 10, 'INR', 25000000, 2.5, 1, 'Duplicate Item Description', 'Review', 0, '2026-11-18T05:01:00Z']
    ]
  );
  insertRows(
    fixture.db,
    'INSERT INTO ProcurementTransaction (transaction_id, tenant_id, source_document_id, source_row_number, source_file, po_number, document_date_raw, supplier_name, material_code, short_text, material_group, plant, currency, total_inr_raw, total_in_cr_raw, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      ['TX-1', 'TNT-1', 'DOC-OLDER', 2, 'older.xlsx', 'PO-1', '2024-04-15', 'Acme', 'MAT-1', 'Valve', 'PIPE', 'PLT-1', 'INR', 50000000, 5.0, '{}'],
      ['TX-2', 'TNT-1', 'DOC-OLDER', 3, 'older.xlsx', 'PO-2', '2025-02-10', 'Beta', 'MAT-2', 'Pump', '', '', 'USD', 75000000, 7.5, '{}']
    ]
  );
};

describe('workerD1IngestionDocumentAnalytics', () => {
  it('returns undefined analytics when a document has no ProcurementTransaction rows', async () => {
    await expect(loadDocumentTransactionAnalytics(fixture.d1, 'TNT-1', 'DOC-EMPTY')).resolves.toBeUndefined();
  });

  it('aggregates material groups, plants, months, and unique entity counts for a saved document', async () => {
    seedSavedDocumentsAndTransactions();
    insertRows(
      fixture.db,
      'INSERT INTO ProcurementCategoryMapping (material_group_code, category_name) VALUES (?, ?)',
      [['PIPE', 'Industrial Piping']]
    );

    const analytics = await loadDocumentTransactionAnalytics(fixture.d1, 'TNT-1', 'DOC-OLDER', 'req-1');

    expect(analytics).toBeDefined();
    expect(analytics?.uniqueItemsCount).toBe(2);
    expect(analytics?.uniqueVendorsCount).toBe(2);
    expect(analytics?.materialGroupSummaries[0]).toMatchObject({
      group_code: 'UNSPECIFIED',
      group_name: 'Unspecified Material Group',
      spend_inr_cr: 7.5
    });
    expect(analytics?.materialGroupSummaries[1]).toMatchObject({
      group_code: 'PIPE',
      spend_inr_cr: 5
    });
    expect(analytics?.plantSummaries.map((p) => p.plant_code)).toEqual(['UNSPECIFIED', 'PLT-1']);
    expect(analytics?.monthWiseSummaries).toEqual([
      expect.objectContaining({ month_key: '2024-04', month_label: 'Apr 2024', fiscal_year: 'FY25', spend_inr_cr: 5 }),
      expect.objectContaining({ month_key: '2025-02', month_label: 'Feb 2025', fiscal_year: 'FY25', spend_inr_cr: 7.5 })
    ]);
  });

  it('forwards queueDocumentId in /api/ingestion and returns availableDocuments, scoped validation records, and analytics', async () => {
    seedSavedDocumentsAndTransactions();
    const request = new Request('https://edge.example.com/api/ingestion?tenantId=TNT-1&queueDocumentId=DOC-OLDER');
    const response = await handleIngestionRoute(
      request,
      runtimeEnvironment({ DB: fixture.d1, REQUEST_TENANT_ID: 'TNT-1' }),
      new URL(request.url)
    );
    const payload = await response.json() as { success: boolean; data: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect((payload.data.queue as Array<{ doc_id: string }>).map((d) => d.doc_id)).toEqual(['DOC-OLDER']);
    expect((payload.data.availableDocuments as Array<{ doc_id: string }>).map((d) => d.doc_id)).toEqual([
      'DOC-NEWER',
      'DOC-OLDER'
    ]);
    expect((payload.data.validationRecords as Array<{ record_id: string }>).map((r) => r.record_id)).toEqual([
      'REC-DOC-OLDER-ROW-3',
      'REC-DOC-OLDER-ROW-2'
    ]);
    expect(payload.data.summary).toMatchObject({
      totalFiles: 2,
      totalRecords: 2,
      cleanCount: 1,
      anomaliesCount: 1,
      totalSpendCr: 12.5
    });
    expect((payload.data.documentAnalytics as { uniqueItemsCount: number }).uniqueItemsCount).toBe(2);
  });

  it('supports validation cursor pagination and summary fallback on document-scoped enrichment', async () => {
    seedSavedDocumentsAndTransactions();
    const baseData = {
      queue: [{ doc_id: 'DOC-OLDER', converted_inr_crores: 0 }],
      validationRecords: [],
      pagination: { queue: { hasMore: false, nextCursor: null }, validationRecords: { hasMore: false, nextCursor: null } },
      summary: { totalFiles: 2 }
    };

    const paged = await enrichSelectedDocumentIngestionResponse(fixture.d1, 'TNT-1', 'DOC-OLDER', baseData, {
      includeSummary: false,
      validationCursor: { createdAt: '2026-10-29T08:02:00Z', recordId: 'REC-DOC-OLDER-ROW-3' }
    });
    expect((paged.validationRecords as Array<{ record_id: string }>).map((r) => r.record_id)).toEqual([
      'REC-DOC-OLDER-ROW-2'
    ]);

    const zeroDocSpendSummary = await enrichSelectedDocumentIngestionResponse(fixture.d1, 'TNT-1', 'DOC-OLDER', baseData, {
      includeSummary: true
    });
    expect((zeroDocSpendSummary.summary as { totalSpendCr: number }).totalSpendCr).toBe(12.5);
  });

  it('attaches documentAnalytics on unfiltered /api/ingestion reads when transactions exist for the latest document', async () => {
    seedSavedDocumentsAndTransactions();
    insertRows(
      fixture.db,
      'INSERT INTO ProcurementTransaction (transaction_id, tenant_id, source_document_id, source_row_number, source_file, po_number, document_date_raw, supplier_name, material_code, short_text, material_group, plant, currency, total_inr_raw, total_in_cr_raw, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [['TX-NEW-1', 'TNT-1', 'DOC-NEWER', 2, 'newer.xlsx', 'PO-9', '2026-11-18', 'Gamma', 'MAT-9', 'Bolt', 'MRO', 'PLT-2', 'INR', 25000000, 2.5, '{}']]
    );
    const request = new Request('https://edge.example.com/api/ingestion?tenantId=TNT-1');
    const response = await handleIngestionRoute(
      request,
      runtimeEnvironment({ DB: fixture.d1, REQUEST_TENANT_ID: 'TNT-1' }),
      new URL(request.url)
    );
    const payload = await response.json() as { success: boolean; data: { documentAnalytics?: { uniqueItemsCount: number } } };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.documentAnalytics?.uniqueItemsCount).toBe(1);
  });

  it('handles unmapped groups, zero spend, empty optional transaction text, out-of-range months, and paged validation records', async () => {
    seedSavedDocumentsAndTransactions();
    insertRows(
      fixture.db,
      'INSERT INTO ProcurementTransaction (transaction_id, tenant_id, source_document_id, source_row_number, source_file, po_number, document_date_raw, supplier_name, material_code, short_text, material_group, plant, currency, total_inr_raw, total_in_cr_raw, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        ['TX-Z1', 'TNT-1', 'DOC-ZERO', 2, 'zero.xlsx', 'PO-Z', '2024-13-01', '', '', '', 'CUSTOM_GRP', 'PLT-Z', 'INR', 0, 0, '{}'],
        ['TX-Z2', 'TNT-1', 'DOC-ZERO', 3, 'zero.xlsx', 'PO-Z2', '2025-01-05', 'Sup', 'M1', 'Bolt', '', '', 'INR', 0, 0, '{}']
      ]
    );
    const analytics = await loadDocumentTransactionAnalytics(fixture.d1, 'TNT-1', 'DOC-ZERO');
    expect(analytics?.materialGroupSummaries.find((g) => g.group_code === 'CUSTOM_GRP')?.group_name).toBe('CUSTOM_GRP');
    expect(analytics?.monthWiseSummaries[0]?.month_label).toBe('2024-13');

    const pagedValidationRows = Array.from({ length: 105 }, (_, idx) => [
      `REC-DOC-PAGED-ROW-${String(idx).padStart(3, '0')}`,
      'TNT-1',
      `PO-${idx}`,
      'Supplier',
      `Item ${idx}`,
      10,
      'INR',
      1000000,
      0.1,
      1,
      'Passed Clean',
      'Ready',
      1,
      '2026-10-29T08:00:00Z'
    ]);
    insertRows(
      fixture.db,
      'INSERT INTO ValidationPreCheckRecord (record_id, tenant_id, po_number, vendor_name, raw_desc, amount, raw_currency, amount_inr, inr_crores, fx_rate_applied, issue_flag, action_status, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      pagedValidationRows
    );
    const enriched = await enrichSelectedDocumentIngestionResponse(
      fixture.d1,
      'TNT-1',
      'DOC-PAGED',
      { summary: {} },
      { includeSummary: true }
    );
    const pagination = enriched.pagination as { validationRecords: { hasMore: boolean; nextCursor: { recordId: string } | null } };
    expect(pagination.validationRecords.hasMore).toBe(true);
    expect(pagination.validationRecords.nextCursor?.recordId).toBeDefined();
    expect((enriched.summary as { totalFiles: number }).totalFiles).toBe(2);

    const noSummary = await enrichSelectedDocumentIngestionResponse(
      fixture.d1,
      'TNT-1',
      'DOC-NONE',
      { queue: [], validationRecords: [] },
      { includeSummary: true }
    );
    expect(noSummary.summary).toBeUndefined();
  });
});
