import { afterEach, describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { importIngestionWorkbook } from '../../src/services/ingestionWorkbookImporter';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import { createWorkerDatabase, insertRows } from '../helpers/workerCoreFixtures';

const asBytes = (
  rows: Array<Array<string | number | Date | null>>,
  bookType: 'xlsx' | 'biff8' = 'xlsx'
): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Transactions');
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType }));
};

describe('importIngestionWorkbook', () => {
  const fixtures: Array<ReturnType<typeof createWorkerDatabase>> = [];
  const createFixture = () => {
    const fixture = createWorkerDatabase();
    fixtures.push(fixture);
    return fixture;
  };

  afterEach(() => {
    fixtures.splice(0).forEach((fixture) => fixture.close());
    vi.restoreAllMocks();
  });

  it('persists every transaction and validation result with D1 FX rates and source provenance', async () => {
    const fixture = createFixture();
    insertRows(fixture.db, 'INSERT INTO FxReferenceRate (currency, rate_date, inr_per_unit, fx_master_version) VALUES (?, ?, ?, ?)', [
      ['USD', '2025-01-01', 84, 'FX-2025']
    ]);
    const bytes = asBytes([
      ['PO Number', 'Supplier Name', 'Material Code', 'Short Text', 'Material Group', 'Plant', 'Quantity', 'Net Price', 'Currency', 'Document Date'],
      ['PO-1', 'Acme Ltd', 'MAT-1', 'Resin', 'CHEM', 'P1', 2, 5, 'USD', '2025-03-01'],
      ['PO-2', null, 'MAT-2', 'Solvent', 'CHEM', 'P2', 1, 10, 'INR', '2025-04-01']
    ]);

    const result = await importIngestionWorkbook({
      db: fixture.d1,
      bytes,
      fileName: 'ledger.xlsx',
      fileType: 'XLSX',
      docId: 'DOC-TEST-1',
      tenantId: 'TNT-1',
      assessmentId: 'AIC-1'
    });

    expect(result).toEqual({ importedCount: 2, validationCount: 2, totalInrCrores: 0, detectedCurrencies: ['INR', 'USD'] });
    expect(fixture.db.prepare('SELECT transaction_id, tenant_id, assessment_id, source_document_id, source_row_number, po_number, supplier_name, total_inr_raw FROM ProcurementTransaction ORDER BY source_row_number').all()).toEqual([
      { transaction_id: 'DOC-TEST-1-ROW-2', tenant_id: 'TNT-1', assessment_id: 'AIC-1', source_document_id: 'DOC-TEST-1', source_row_number: 2, po_number: 'PO-1', supplier_name: 'Acme Ltd', total_inr_raw: 840 },
      { transaction_id: 'DOC-TEST-1-ROW-3', tenant_id: 'TNT-1', assessment_id: 'AIC-1', source_document_id: 'DOC-TEST-1', source_row_number: 3, po_number: 'PO-2', supplier_name: 'Unmapped Supplier', total_inr_raw: 10 }
    ]);
    expect(fixture.db.prepare('SELECT record_id, tenant_id, issue_flag, action_status, resolved FROM ValidationPreCheckRecord ORDER BY record_id').all()).toEqual([
      { record_id: 'REC-DOC-TEST-1-ROW-2', tenant_id: 'TNT-1', issue_flag: 'Passed Clean', action_status: 'Ready', resolved: 1 },
      { record_id: 'REC-DOC-TEST-1-ROW-3', tenant_id: 'TNT-1', issue_flag: 'Unmapped Supplier Name', action_status: 'Merge Vendor', resolved: 0 }
    ]);
    expect(fixture.db.prepare('SELECT raw_json FROM ProcurementTransaction WHERE transaction_id = ?').get('DOC-TEST-1-ROW-2')).toMatchObject({ raw_json: expect.stringContaining('Resin') });
  });

  it('marks missing and unavailable currencies unresolved and uses explicit INR totals when present', async () => {
    const fixture = createFixture();
    const bytes = asBytes([
      ['PO Number', 'Supplier Name', 'Quantity', 'Net Price', 'Currency', 'Total INR'],
      ['PO-1', 'Acme', 1, 10, null, null],
      ['PO-2', 'Acme', 2, 10, 'EUR', 500],
      ['PO-3', 'Acme', 1, 10, 'GBP', null],
      ['PO-4', 'Acme', 1, 0, 'INR', null]
    ]);
    const result = await importIngestionWorkbook({
      db: fixture.d1, bytes, fileName: 'ledger.csv', fileType: 'CSV', docId: 'DOC-FX', tenantId: 'TNT-1'
    });

    expect(result.importedCount).toBe(4);
    expect(fixture.db.prepare('SELECT issue_flag, action_status, resolved FROM ValidationPreCheckRecord ORDER BY record_id').all()).toEqual([
      { issue_flag: 'Missing Currency Code', action_status: 'Fix Currency', resolved: 0 },
      { issue_flag: 'Passed Clean', action_status: 'Ready', resolved: 1 },
      { issue_flag: 'Currency Rate Unavailable', action_status: 'Review', resolved: 0 },
      { issue_flag: 'Tax Discrepancy', action_status: 'Review', resolved: 0 }
    ]);
    expect(fixture.db.prepare('SELECT total_inr_raw FROM ProcurementTransaction ORDER BY source_row_number').all()).toEqual([
      { total_inr_raw: null }, { total_inr_raw: 500 }, { total_inr_raw: null }, { total_inr_raw: 0 }
    ]);
  });

  it('returns an empty result for a workbook with a header but no source rows', async () => {
    const fixture = createFixture();
    await expect(importIngestionWorkbook({
      db: fixture.d1, bytes: asBytes([['PO Number', 'Currency']]), fileName: 'empty.xlsx',
      fileType: 'XLSX', docId: 'DOC-EMPTY', tenantId: 'TNT-1'
    })).resolves.toEqual({ importedCount: 0, validationCount: 0, totalInrCrores: 0, detectedCurrencies: [] });
  });

  it('defaults missing quantity and price columns safely for sparse workbooks', async () => {
    const fixture = createFixture();
    const result = await importIngestionWorkbook({
      db: fixture.d1,
      bytes: asBytes([['Supplier', 'Currency'], ['Sparse Supplier', 'INR']]),
      fileName: 'sparse.xlsx', fileType: 'XLSX', docId: 'DOC-SPARSE', tenantId: 'TNT-1'
    });

    expect(result.importedCount).toBe(1);
    expect(fixture.db.prepare('SELECT order_quantity, net_price FROM ProcurementTransaction').get()).toEqual({
      order_quantity: 1,
      net_price: 0
    });
  });

  it('imports legacy XLS files and converts explicit crore totals without an FX lookup', async () => {
    const fixture = createFixture();
    const result = await importIngestionWorkbook({
      db: fixture.d1,
      bytes: asBytes([
        ['PO Number', 'Supplier Name', 'Quantity', 'Net Price', 'Currency', 'Total INR Crores'],
        ['PO-XLS', 'Legacy Supplier', 1, 2, 'EUR', 0.5]
      ], 'biff8'),
      fileName: 'legacy.xls',
      fileType: 'XLS',
      docId: 'DOC-XLS',
      tenantId: 'TNT-1'
    });

    expect(result.importedCount).toBe(1);
    expect(fixture.db.prepare('SELECT total_inr_raw, total_in_cr_raw FROM ProcurementTransaction').get()).toEqual({
      total_inr_raw: 5000000,
      total_in_cr_raw: 0.5
    });
  });

  it('reuses a dated D1 FX lookup for multiple source rows in the same currency', async () => {
    const fixture = createFixture();
    insertRows(fixture.db, 'INSERT INTO FxReferenceRate (currency, rate_date, inr_per_unit, fx_master_version) VALUES (?, ?, ?, ?)', [
      ['USD', '2025-01-01', 84, 'FX-2025']
    ]);
    const result = await importIngestionWorkbook({
      db: fixture.d1,
      bytes: asBytes([
        ['Supplier', 'Quantity', 'Net Price', 'Currency', 'Document Date'],
        ['Acme', 1, 10, 'USD', new Date('2025-03-01T00:00:00.000Z')],
        ['Beta', 2, 10, 'USD', 45717]
      ]),
      fileName: 'repeat-rate.xlsx',
      fileType: 'XLSX',
      docId: 'DOC-RATE',
      tenantId: 'TNT-1'
    });
    expect(result.importedCount).toBe(2);
    expect(fixture.db.prepare('SELECT total_inr_raw FROM ProcurementTransaction ORDER BY source_row_number').all()).toEqual([
      { total_inr_raw: 840 }, { total_inr_raw: 1680 }
    ]);
  });

  it('uses D1 batch writes when the database supports batching', async () => {
    const fixture = createFixture();
    const batch = vi.fn(async (statements: Parameters<NonNullable<typeof fixture.d1.batch>>[0]) => {
      await Promise.all(statements.map((statement) => statement.run()));
      return [];
    });
    const db = { ...fixture.d1, batch };
    await importIngestionWorkbook({
      db, bytes: asBytes([['Supplier', 'Quantity', 'Net Price', 'Currency'], ['Acme', 1, 1, 'INR']]),
      fileName: 'batch.xlsx', fileType: 'XLSX', docId: 'DOC-BATCH', tenantId: 'TNT-1'
    });
    expect(batch).toHaveBeenCalledTimes(1);
    expect(batch.mock.calls[0][0]).toHaveLength(2);
  });

  it('rejects an import before inserting transaction or validation rows when batching is unavailable', async () => {
    const fixture = createFixture();
    const db = { prepare: (sql: string) => fixture.d1.prepare(sql) } as CloudflareD1Database;
    await expect(importIngestionWorkbook({
      db,
      bytes: asBytes([['Supplier', 'Quantity', 'Net Price', 'Currency'], ['Acme', 1, 1, 'INR']]),
      fileName: 'no-batch.xlsx',
      fileType: 'XLSX',
      docId: 'DOC-NO-BATCH',
      tenantId: 'TNT-1',
      assessmentId: 'AIC-1',
      requestId: 'req-import-no-batch'
    })).rejects.toThrow('Cloudflare D1 transactional batch support is unavailable');
    expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ProcurementTransaction').get()).toEqual({ count: 0 });
    expect(fixture.db.prepare('SELECT COUNT(*) AS count FROM ValidationPreCheckRecord').get()).toEqual({ count: 0 });
  });

  it('rejects unsupported file types and malformed workbooks', async () => {
    const fixture = createFixture();
    const input = { db: fixture.d1, bytes: new Uint8Array([1, 2, 3]), fileName: 'bad.pdf', fileType: 'PDF', docId: 'DOC-BAD', tenantId: 'TNT-1' };
    await expect(importIngestionWorkbook(input)).rejects.toThrow('Only XLSX, XLS, and CSV files can be imported');
    await expect(importIngestionWorkbook({ ...input, bytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]), fileType: 'XLSX' }))
      .rejects.toThrow('uploaded workbook could not be read');
  });

  it('rejects workbooks that exceed the transaction row limit', async () => {
    const fixture = createFixture();
    const data: Array<Array<string | number | Date | null>> = [['Supplier', 'Currency']];
    for (let index = 0; index < 10001; index += 1) data.push([`Supplier ${index}`, 'INR']);
    await expect(importIngestionWorkbook({
      db: fixture.d1, bytes: asBytes(data), fileName: 'large.xlsx', fileType: 'XLSX', docId: 'DOC-LARGE', tenantId: 'TNT-1'
    })).rejects.toThrow('exceeds the 10000 row import limit');
  });
});
