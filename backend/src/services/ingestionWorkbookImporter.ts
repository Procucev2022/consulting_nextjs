import {
  INGESTION_WORKBOOK_BATCH_ROWS,
  INGESTION_WORKBOOK_HEADERS,
  INGESTION_WORKBOOK_INR_PER_CRORE,
  INGESTION_WORKBOOK_MAX_ROWS,
  INGESTION_WORKBOOK_MESSAGES
} from '../constants/ingestionWorkbook';
import type { CloudflareD1PreparedStatement } from '../types/cloudflare';
import type {
  IngestionWorkbookFieldMap,
  IngestionWorkbookFxRateRow,
  IngestionWorkbookInput,
  IngestionWorkbookNormalizedRow,
  IngestionWorkbookPreparedRow,
  IngestionWorkbookResult,
  IngestionWorkbookRow
} from '../types/ingestionWorkbook';
import { clearScopedModule2Cache } from './workerD1Module2Cache';

const TRANSACTION_INSERT_SQL = `
  INSERT INTO ProcurementTransaction (
    transaction_id, tenant_id, assessment_id, source_document_id, source_row_number, source_file,
    po_number, po_line, document_date_raw, supplier_code, supplier_name, material_code, short_text,
    material_group, plant, storage_location, order_quantity, order_unit, net_price, currency,
    total_inr_raw, total_in_cr_raw, price_unit, deletion_indicator, item_category,
    account_assignment_category, raw_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const VALIDATION_INSERT_SQL = `
  INSERT INTO ValidationPreCheckRecord (
    record_id, tenant_id, po_number, vendor_name, raw_desc, order_quantity, net_price, subtotal_raw, amount,
    raw_currency, amount_inr, inr_crores, fx_rate_applied, spend_year, transaction_date,
    issue_flag, action_status, resolved
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const valueFor = (row: IngestionWorkbookRow, key?: string): unknown => key ? row[key] : undefined;

const textValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replaceAll(',', '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const isoDate = (value: unknown): string | null => {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + value * 86400000).toISOString().slice(0, 10);
  }
  const text = textValue(value);
  if (!text) return null;
  const exactDate = text.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/u);
  if (exactDate) {
    const [, year, month, day = '01'] = exactDate;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const parsed = new Date(text);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
};

const fieldMapFrom = (rows: IngestionWorkbookRow[]): IngestionWorkbookFieldMap => {
  const headers = Array.from(new Set(rows.slice(0, 5).flatMap((row) => Object.keys(row))));
  const entries = Object.entries(INGESTION_WORKBOOK_HEADERS).map(([field, patterns]) => {
    const key = headers.find((header) => patterns.some((pattern) => pattern.test(header.trim())));
    return [field, key] as const;
  });
  return Object.fromEntries(entries) as IngestionWorkbookFieldMap;
};

const getFxRate = async (
  db: IngestionWorkbookInput['db'],
  currency: string,
  date: string | null,
  rateCache: Map<string, IngestionWorkbookFxRateRow[]>
): Promise<number | null> => {
  if (currency === 'INR') return 1;
  let currencyRates = rateCache.get(currency);
  if (!currencyRates) {
    const rows = await db.prepare(`
      SELECT rate_date, inr_per_unit FROM FxReferenceRate
      WHERE currency = ? ORDER BY rate_date DESC
    `).bind(currency).all<IngestionWorkbookFxRateRow>();
    currencyRates = rows.results.filter((row) =>
      Number.isFinite(Number(row.inr_per_unit)) && Number(row.inr_per_unit) > 0
    );
    rateCache.set(currency, currencyRates);
  }
  const matchingRate = currencyRates.find((row) => !date || row.rate_date <= date);
  return matchingRate ? Number(matchingRate.inr_per_unit) : null;
};

const runInBatches = async (
  db: IngestionWorkbookInput['db'],
  statements: CloudflareD1PreparedStatement[],
  afterBatch: () => void
): Promise<void> => {
  const statementLimit = INGESTION_WORKBOOK_BATCH_ROWS * 2;
  for (let offset = 0; offset < statements.length; offset += statementLimit) {
    const batch = statements.slice(offset, offset + statementLimit);
    if (db.batch) {
      await db.batch(batch);
      afterBatch();
    }
    else {
      for (const statement of batch) {
        await statement.run();
        afterBatch();
      }
    }
  }
};

const emptyResult = (): IngestionWorkbookResult => ({
  importedCount: 0,
  validationCount: 0,
  totalInrCrores: 0,
  detectedCurrencies: []
});

const validateFileType = (fileType: string, bytes: Uint8Array): string => {
  const normalizedFileType = fileType.toUpperCase();
  if (!['XLSX', 'XLS', 'CSV'].includes(normalizedFileType)) throw new Error(INGESTION_WORKBOOK_MESSAGES.unsupportedType);
  if (normalizedFileType === 'XLSX' && (bytes[0] !== 0x50 || bytes[1] !== 0x4b)) {
    throw new Error(INGESTION_WORKBOOK_MESSAGES.invalidWorkbook);
  }
  if (normalizedFileType === 'XLS' && bytes.slice(0, 8).join(',') !== '208,207,17,224,161,177,26,225') {
    throw new Error(INGESTION_WORKBOOK_MESSAGES.invalidWorkbook);
  }
  return normalizedFileType;
};

const readWorkbookRows = async (bytes: Uint8Array): Promise<IngestionWorkbookRow[]> => {
  let rows: IngestionWorkbookRow[];
  try {
    const xlsx = await import('xlsx');
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const workbook = xlsx.read(data, { type: 'array', cellDates: true });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) throw new Error(INGESTION_WORKBOOK_MESSAGES.invalidWorkbook);
    rows = xlsx.utils.sheet_to_json<IngestionWorkbookRow>(workbook.Sheets[firstSheet], { defval: null, raw: true });
  } catch {
    throw new Error(INGESTION_WORKBOOK_MESSAGES.invalidWorkbook);
  }
  return rows;
};

const calculateAmountInr = (
  amount: number,
  fxRate: number | null,
  explicitTotalInr: number | null,
  explicitTotalCrores: number | null
): number | null => {
  if (explicitTotalInr !== null) return explicitTotalInr;
  if (explicitTotalCrores !== null) return explicitTotalCrores * INGESTION_WORKBOOK_INR_PER_CRORE;
  return fxRate === null ? null : amount * fxRate;
};

const validationState = (
  currency: string,
  fxRate: number | null,
  explicitTotalInr: number | null,
  explicitTotalCrores: number | null,
  supplierName: string,
  netPrice: number,
  amount: number
): { issueFlag: string; actionStatus: string; resolved: number } => {
  let issueFlag = 'Passed Clean';
  if (!currency) issueFlag = 'Missing Currency Code';
  else if (!fxRate && explicitTotalInr === null && explicitTotalCrores === null) issueFlag = 'Currency Rate Unavailable';
  else if (!supplierName) issueFlag = 'Unmapped Supplier Name';
  else if (netPrice <= 0 || amount <= 0) issueFlag = 'Tax Discrepancy';

  const actionStatus = issueFlag === 'Missing Currency Code'
    ? 'Fix Currency'
    : issueFlag === 'Unmapped Supplier Name'
      ? 'Merge Vendor'
      : issueFlag === 'Passed Clean' ? 'Ready' : 'Review';
  return { issueFlag, actionStatus, resolved: Number(issueFlag === 'Passed Clean') };
};

const normalizeSourceRow = (
  input: IngestionWorkbookInput,
  row: IngestionWorkbookRow,
  sourceRowNumber: number,
  fields: IngestionWorkbookFieldMap
): IngestionWorkbookNormalizedRow => {
  const poValue = textValue(valueFor(row, fields.poNumber));
  const materialCode = textValue(valueFor(row, fields.materialCode));
  const currencyValue = textValue(valueFor(row, fields.currency))?.toUpperCase() || '';
  const quantity = numberValue(valueFor(row, fields.quantity)) ?? 1;
  const netPrice = numberValue(valueFor(row, fields.netPrice)) ?? 0;
  return {
    sourceRowNumber,
    poValue,
    poNumber: poValue || `UNKNOWN-${input.docId}-${sourceRowNumber}`,
    supplierName: textValue(valueFor(row, fields.supplierName)) || '',
    materialCode,
    description: textValue(valueFor(row, fields.description)) || materialCode || 'Unspecified item',
    transactionDate: isoDate(valueFor(row, fields.transactionDate)),
    currency: /^[A-Z]{3}$/u.test(currencyValue) ? currencyValue : '',
    quantity,
    netPrice,
    amount: quantity * netPrice
  };
};

const prepareSourceRow = async (
  input: IngestionWorkbookInput,
  row: IngestionWorkbookRow,
  sourceRowNumber: number,
  fields: IngestionWorkbookFieldMap,
  rateCache: Map<string, IngestionWorkbookFxRateRow[]>
): Promise<IngestionWorkbookPreparedRow> => {
  const source = normalizeSourceRow(input, row, sourceRowNumber, fields);
  const fxRate = source.currency ? await getFxRate(input.db, source.currency, source.transactionDate, rateCache) : null;
  const explicitTotalInr = numberValue(valueFor(row, fields.totalInr));
  const explicitTotalCrores = numberValue(valueFor(row, fields.totalInrCrores));
  const amountInr = calculateAmountInr(source.amount, fxRate, explicitTotalInr, explicitTotalCrores);
  const inrCrores = amountInr === null ? null : amountInr / INGESTION_WORKBOOK_INR_PER_CRORE;
  const status = validationState(
    source.currency, fxRate, explicitTotalInr, explicitTotalCrores, source.supplierName, source.netPrice, source.amount
  );
  const recordId = `REC-${input.docId}-ROW-${source.sourceRowNumber}`;

  return {
    currency: source.currency,
    amountInr,
    transactionStatement: input.db.prepare(TRANSACTION_INSERT_SQL).bind(
      `${input.docId}-ROW-${source.sourceRowNumber}`, input.tenantId, input.assessmentId || null, input.docId,
      source.sourceRowNumber, input.fileName, source.poValue, textValue(valueFor(row, fields.poLine)),
      source.transactionDate,
      textValue(valueFor(row, fields.supplierCode)), source.supplierName || 'Unmapped Supplier', source.materialCode,
      source.description, textValue(valueFor(row, fields.materialGroup)), textValue(valueFor(row, fields.plant)),
      textValue(valueFor(row, fields.storageLocation)), source.quantity, textValue(valueFor(row, fields.orderUnit)),
      source.netPrice, source.currency || 'UNKNOWN', amountInr, inrCrores,
      numberValue(valueFor(row, fields.priceUnit)), textValue(valueFor(row, fields.deletionIndicator)),
      textValue(valueFor(row, fields.itemCategory)), textValue(valueFor(row, fields.accountAssignmentCategory)),
      JSON.stringify(row)
    ),
    validationStatement: input.db.prepare(VALIDATION_INSERT_SQL).bind(
      recordId, input.tenantId, source.poNumber, source.supplierName || 'Unmapped Supplier', source.description, source.quantity,
      source.netPrice, source.amount, source.amount, source.currency || '', amountInr, inrCrores, fxRate,
      source.transactionDate ? Number(source.transactionDate.slice(0, 4)) : null,
      source.transactionDate, status.issueFlag, status.actionStatus, status.resolved
    )
  };
};

export const importIngestionWorkbook = async (input: IngestionWorkbookInput): Promise<IngestionWorkbookResult> => {
  validateFileType(input.fileType, input.bytes);
  const rows = await readWorkbookRows(input.bytes);

  if (rows.length > INGESTION_WORKBOOK_MAX_ROWS) {
    throw new Error(INGESTION_WORKBOOK_MESSAGES.tooManyRows(INGESTION_WORKBOOK_MAX_ROWS));
  }
  if (rows.length === 0) return emptyResult();

  const fields = fieldMapFrom(rows);
  const rates = new Map<string, IngestionWorkbookFxRateRow[]>();
  const statements: CloudflareD1PreparedStatement[] = [];
  const detectedCurrencies = new Set<string>();
  let totalInr = 0;

  for (const [index, row] of rows.entries()) {
    const sourceRowNumber = index + 2;
    const prepared = await prepareSourceRow(input, row, sourceRowNumber, fields, rates);
    if (prepared.currency) detectedCurrencies.add(prepared.currency);
    if (prepared.amountInr !== null && prepared.amountInr > 0) totalInr += prepared.amountInr;
    statements.push(prepared.transactionStatement, prepared.validationStatement);
  }

  await runInBatches(input.db, statements, () =>
    clearScopedModule2Cache(input.db, input.tenantId, input.assessmentId));
  return {
    importedCount: rows.length,
    validationCount: rows.length,
    totalInrCrores: Number((totalInr / INGESTION_WORKBOOK_INR_PER_CRORE).toFixed(2)),
    detectedCurrencies: Array.from(detectedCurrencies).sort()
  };
};
