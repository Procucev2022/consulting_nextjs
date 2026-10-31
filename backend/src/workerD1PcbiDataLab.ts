import {
  D1_PCBI_MASTER_FIELDS,
  D1_PCBI_UNSPSC_FIELDS,
  D1_REPORTING,
  D1_ROUTE_MESSAGES,
  D1_TABLES,
  PCBI_DATA_LAB_CURRENCY_HEADERS,
  PCBI_DATA_LAB_DATE_HEADER_PATTERNS,
  PCBI_DATA_LAB_GEOGRAPHY_HEADERS,
  PCBI_DATA_LAB_STRUCTURED_FILE_TYPES,
  PCBI_DATA_LAB_UPLOAD_MAX_BYTES,
  PCBI_DATA_LAB_UNIT_HEADERS,
  PCBI_DATA_LAB_VALUE_HEADER_PATTERNS
} from './constants/d1';
import { PCBI_RESEARCH_PDF_EXTRACTION_PROMPT } from './constants/ai';
import {
  approveCommodityDataSchema,
  assignPcbiResearchSchema,
  detectUploadDomainSchema,
  pcbiResearchPdfExtractionSchema,
  uploadCommoditySourceSchema
} from './constants/validation';
import { SQL_PCBI_CUSTOMER_SPEND_BY_UNSPSC } from './constants/pcbiDataLabSql';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import type {
  CommoditySourceEvidenceObject,
  CommodityWorkspaceDetail,
  CommodityResearchQueueRow,
  PCBIResearchDashboardMetrics
} from './types/pcbiCommodityDataLab';
import type {
  PCBICommodityBenchmarkRow,
  PCBICommodityObservationRow,
  PCBICommodityPromotionRow,
  PCBICommodityResearchAssignmentRow,
  PCBICommoditySourceRow,
  PCBICommoditySpendByUnspscRow,
  PCBICommoditySpendSummary,
  PCBIDataLabDomainResult,
  PCBIParsedObservation
} from './types/pcbiDataLabStorage';
import type { AssignPcbiResearchInput, PcbiAdminImportInput, UploadCommoditySourceInput } from './types/validation';
import { queryD1Rows, requireWorkerDb } from './services/workerD1Query';
import { getPublishedPcbiPayload, mapPcbiImportRow } from './workerD1PcbiAdmin';
import logger from './utils/logger';
import { countPcbiHighImpactGaps, countPcbiPriorities, prioritizePcbiResearchQueue } from './services/pcbiResearchPrioritization';
import { geminiService } from './services/geminiService';

const jsonString = (value: unknown): string => typeof value === 'string' ? value : '';
const upper = (value: unknown): string => jsonString(value).trim().toUpperCase();
const id = (): string => crypto.randomUUID();

const benchmarkFromImported = (payload: PcbiAdminImportInput | null, pcbiId: string): PCBICommodityBenchmarkRow | null => {
  const imported = payload?.benchmarks.find((row) =>
    String(mapPcbiImportRow(row, 'PCBI_MASTER', payload, [...D1_PCBI_MASTER_FIELDS]).pcbi_id) === pcbiId
  );
  if (!payload || !imported) return null;
  const values = mapPcbiImportRow(imported, 'PCBI_MASTER', payload, [...D1_PCBI_MASTER_FIELDS]);
  return {
    pcbi_id: pcbiId,
    benchmark_name: jsonString(values.benchmark_name),
    benchmark_unit: jsonString(values.benchmark_unit),
    currency: jsonString(values.currency),
    geography: jsonString(values.geography),
    category: jsonString(values.category),
    sub_category: jsonString(values.sub_category),
    sector: jsonString(values.sector),
    quality_rating: jsonString(values.quality_rating),
    benchmarkability_percent: Number.isFinite(Number(values.benchmarkability_percent)) ? Number(values.benchmarkability_percent) : null,
    effective_from: jsonString(values.start_date) || null,
    start_date: jsonString(values.start_date) || null,
    end_date: jsonString(values.end_date) || null,
    applicable_sectors: null
  };
};

const getBenchmark = async (
  db: NonNullable<CloudflareEnvironment['DB']>, pcbiId: string, payload?: PcbiAdminImportInput | null
): Promise<PCBICommodityBenchmarkRow | null> => {
  const effectivePayload = payload === undefined ? await getPublishedPcbiPayload(db) : payload;
  const imported = benchmarkFromImported(effectivePayload, pcbiId);
  if (imported) return imported;
  return db.prepare(`SELECT * FROM ${D1_TABLES.pcbiBenchmarks} WHERE pcbi_id = ? AND active = 1`)
    .bind(pcbiId).first<PCBICommodityBenchmarkRow>();
};

const getBenchmarks = async (
  db: NonNullable<CloudflareEnvironment['DB']>, payload: PcbiAdminImportInput | null
): Promise<PCBICommodityBenchmarkRow[]> => {
  if (payload) {
    const imported = payload.benchmarks.map((row) => {
      const values = mapPcbiImportRow(row, 'PCBI_MASTER', payload, [...D1_PCBI_MASTER_FIELDS]);
      return {
        pcbi_id: jsonString(values.pcbi_id),
        benchmark_name: jsonString(values.benchmark_name),
        benchmark_unit: jsonString(values.benchmark_unit),
        currency: jsonString(values.currency),
        geography: jsonString(values.geography),
        category: jsonString(values.category),
        sub_category: jsonString(values.sub_category),
        sector: jsonString(values.sector),
        quality_rating: jsonString(values.quality_rating),
        benchmarkability_percent: Number.isFinite(Number(values.benchmarkability_percent)) ? Number(values.benchmarkability_percent) : null,
        effective_from: jsonString(values.start_date) || null,
        start_date: jsonString(values.start_date) || null,
        end_date: jsonString(values.end_date) || null,
        applicable_sectors: null
      } satisfies PCBICommodityBenchmarkRow;
    });
    return imported.filter((row) => row.pcbi_id.length > 0);
  }
  return queryD1Rows<PCBICommodityBenchmarkRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiBenchmarks} WHERE active = 1 ORDER BY category, sub_category, benchmark_name`);
};

const pcbiSpendByBenchmark = async (
  db: NonNullable<CloudflareEnvironment['DB']>,
  publishedPayload: PcbiAdminImportInput | null,
  requestId?: string
): Promise<Map<string, PCBICommoditySpendSummary>> => {
  const spendRows = await queryD1Rows<PCBICommoditySpendByUnspscRow>(
    db, SQL_PCBI_CUSTOMER_SPEND_BY_UNSPSC, [D1_REPORTING.inrPerCrore], requestId
  );
  const mappingRows = publishedPayload
    ? publishedPayload.unspscMappings.map((row) =>
      mapPcbiImportRow(row, 'UNSPSC_MAPPING', publishedPayload, [...D1_PCBI_UNSPSC_FIELDS]))
    : await queryD1Rows<Record<string, unknown>>(db,
      `SELECT unspsc_code, pcbi_id FROM ${D1_TABLES.pcbiMappings} WHERE active = 1`, [], requestId);
  const spendByCode = new Map(spendRows.map((row) => [
    String(row.unspsc_code).trim(), {
      spendInr: Math.max(0, Number(row.spend_inr) || 0),
      transactionCount: Math.max(0, Number(row.transaction_count) || 0)
    }
  ]));
  const result = new Map<string, PCBICommoditySpendSummary>();
  const seenMappings = new Set<string>();
  for (const mapping of mappingRows) {
    const code = String(mapping.unspsc_code || '').trim();
    const pcbiId = String(mapping.pcbi_id || '').trim();
    const key = `${code}:${pcbiId}`;
    const spend = spendByCode.get(code);
    if (!code || !pcbiId || !spend || seenMappings.has(key)) continue;
    seenMappings.add(key);
    const current = result.get(pcbiId) || { spendInr: 0, transactionCount: 0, unspscCodes: [] };
    current.spendInr += spend.spendInr;
    current.transactionCount += spend.transactionCount;
    current.unspscCodes.push(code);
    result.set(pcbiId, current);
  }
  return result;
};

const mapSource = (row: PCBICommoditySourceRow): CommoditySourceEvidenceObject => ({
  sourceId: row.source_id,
  sourceName: row.source_name,
  publisher: row.publisher,
  url: row.url || '',
  documentName: row.document_name,
  publicationDate: row.publication_date || '',
  uploadDate: row.uploaded_at,
  fileType: row.file_type,
  checksum: row.checksum,
  geography: row.geography,
  gradeSpecification: row.grade_specification,
  unit: row.unit,
  currency: row.currency,
  frequency: row.frequency as CommoditySourceEvidenceObject['frequency'],
  deliveryBasis: row.delivery_basis,
  historicalCoverage: row.historical_coverage,
  extractionStatus: row.extraction_status,
  validationStatus: row.validation_status,
  methodologyStatus: row.methodology_status,
  approvalStatus: row.approval_status,
  extractedObservationsCount: Number(row.extracted_observations_count)
});

const dateValue = (value: unknown): string | null => {
  let date: Date;
  if (value instanceof Date) date = value;
  else if (typeof value === 'number' && value > 20000 && value < 80000) {
    date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value.trim())) {
    const normalized = value.trim();
    const parsed = new Date(`${normalized}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === normalized ? normalized : null;
  } else if (typeof value === 'string' && value.trim()) date = new Date(value);
  else return null;
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
};

const parseStructuredRows = async (bytes: Uint8Array, fileType: string): Promise<Record<string, unknown>[]> => {
  if (fileType === 'JSON') {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>).observations : null;
    return Array.isArray(records) ? records.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object') : [];
  }
  if (fileType !== 'CSV' && fileType !== 'TXT' && fileType !== 'XLS' && fileType !== 'XLSX') return [];
  const xlsx = await import('xlsx');
  const data = fileType === 'TXT'
    ? new TextDecoder().decode(bytes)
    : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const workbook = xlsx.read(data, { type: fileType === 'TXT' ? 'string' : 'array', cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: null, raw: true });
};

const parseObservations = (rows: Record<string, unknown>[]): { observations: PCBIParsedObservation[]; invalidRows: number } => {
  const headers = Object.keys(rows[0] || {});
  const dateHeader = headers.find((header) => PCBI_DATA_LAB_DATE_HEADER_PATTERNS.some((pattern) => pattern.test(header)));
  const valueHeader = headers.find((header) => header !== dateHeader && PCBI_DATA_LAB_VALUE_HEADER_PATTERNS.some((pattern) => pattern.test(header)));
  if (!dateHeader || !valueHeader) return { observations: [], invalidRows: rows.length || 1 };
  const observations: PCBIParsedObservation[] = [];
  let invalidRows = 0;
  for (const row of rows) {
    const observationDate = dateValue(row[dateHeader]);
    const valueText = typeof row[valueHeader] === 'string' ? row[valueHeader].replaceAll(',', '').trim() : row[valueHeader];
    const value = Number(valueText);
    if (!observationDate || !Number.isFinite(value) || value <= 0) {
      invalidRows += 1;
      continue;
    }
    observations.push({ observationDate, value, originalRow: row });
  }
  const seenDates = new Set<string>();
  for (const observation of observations) {
    if (seenDates.has(observation.observationDate)) invalidRows += 1;
    seenDates.add(observation.observationDate);
  }
  return { observations, invalidRows };
};

const decodeFile = (fileBase64: string): Uint8Array => {
  const binary = atob(fileBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const sha256 = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const sourceObjectKey = (pcbiId: string, sourceId: string, documentName: string): string => {
  const fileName = documentName.replace(/[^a-zA-Z0-9._-]/gu, '_').slice(-120);
  return `pcbi/commodities/${encodeURIComponent(pcbiId)}/${sourceId}/${fileName}`;
};

const uploadSource = async (
  environment: CloudflareEnvironment,
  request: Request,
  actorName: string,
  requestId: string
): Promise<WorkerD1Result> => {
  const db = requireWorkerDb(environment.DB);
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = uploadCommoditySourceSchema.safeParse(body);
  if (!parsed.success) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabInvalid, errors: parsed.error.issues } };
  const input: UploadCommoditySourceInput = parsed.data;
  if (!input.fileBase64) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabFileRequired } };
  if (!environment.OBJECTS) return { status: 503, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabR2Unavailable } };
  let bytes: Uint8Array;
  try { bytes = decodeFile(input.fileBase64); } catch {
    return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabFileInvalid } };
  }
  if (bytes.length === 0) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabFileRequired } };
  if (bytes.length > PCBI_DATA_LAB_UPLOAD_MAX_BYTES) return { status: 413, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabUploadTooLarge } };
  let parsedRows: Record<string, unknown>[] = [];
  if (PCBI_DATA_LAB_STRUCTURED_FILE_TYPES.has(input.fileType)) {
    try { parsedRows = await parseStructuredRows(bytes, input.fileType); } catch { parsedRows = []; }
  }
  const headerText = parsedRows.length > 0 ? Object.keys(parsedRows[0]).join(' ') : '';
  const domainResponse = await detectDomain(new Request(request.url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: input.documentName, fileContentSnippet: headerText, targetArea: 'COMMODITY_DATA_LAB' })
  }));
  const detection = (domainResponse.data as { detection?: PCBIDataLabDomainResult }).detection;
  if (detection && !detection.isAllowedInTarget) {
    return { status: 422, data: { success: false, message: detection.errorMessage, errors: detection.matchedSignatures } };
  }
  const benchmark = await getBenchmark(db, input.pcbiId);
  if (!benchmark) return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabNoBenchmark } };
  const checksum = await sha256(bytes);
  if (input.checksum && input.checksum.toLowerCase() !== checksum) {
    return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabFileInvalid, errors: [{ field: 'checksum', message: 'The supplied checksum does not match the uploaded file.' }] } };
  }
  const sourceId = id();
  const uploadedAt = new Date().toISOString();
  const objectKey = sourceObjectKey(input.pcbiId, sourceId, input.documentName);
  const contentType = input.fileType === 'JSON' ? 'application/json'
    : input.fileType === 'CSV' ? 'text/csv'
      : input.fileType === 'PDF' ? 'application/pdf'
        : input.fileType === 'TXT' ? 'text/plain'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  try {
    await environment.OBJECTS.put(objectKey, bytes, { httpMetadata: { contentType } });
  } catch (error) {
    logger.error('PCBI evidence upload to R2 failed', { requestId, sourceId, pcbiId: input.pcbiId }, error);
    return { status: 503, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabR2Unavailable } };
  }

  let observations: PCBIParsedObservation[] = [];
  let invalidRows = 0;
  let extractionStatus: CommoditySourceEvidenceObject['extractionStatus'] = 'PENDING';
  let validationStatus: CommoditySourceEvidenceObject['validationStatus'] = 'PENDING';
  let sourceIssue: string | null = null;
  if (input.fileType === 'PDF') {
    geminiService.configureForEnvironment(environment);
    const extraction = await geminiService.generateJson<unknown>({
      prompt: PCBI_RESEARCH_PDF_EXTRACTION_PROMPT,
      inlineData: input.fileBase64,
      mimeType: 'application/pdf',
      fileName: input.documentName,
      label: 'PCBI commodity research PDF extraction'
    });
    const parsedExtraction = extraction.data === null
      ? null
      : pcbiResearchPdfExtractionSchema.safeParse(extraction.data);
    if (parsedExtraction?.success) {
      parsedRows = parsedExtraction.data.observations.map((item) => ({
        date: item.observationDate,
        index_value: item.value,
        ...(item.unit ? { unit: item.unit } : {}),
        ...(item.currency ? { currency: item.currency } : {}),
        ...(item.geography ? { geography: item.geography } : {})
      }));
      extractionStatus = 'EXTRACTED';
    } else {
      extractionStatus = 'FAILED';
      validationStatus = 'ISSUES_DETECTED';
      sourceIssue = extraction.status === 'NOT_CONFIGURED'
        ? D1_ROUTE_MESSAGES.pcbiDataLabPdfExtractionUnavailable
        : D1_ROUTE_MESSAGES.pcbiDataLabPdfExtractionFailed;
      logger.warn('PCBI research PDF did not produce validated observation rows', {
        requestId, sourceId, pcbiId: input.pcbiId, extractionStatus: extraction.status,
        invalidResponse: parsedExtraction !== null && !parsedExtraction.success
      });
    }
  }
  if (PCBI_DATA_LAB_STRUCTURED_FILE_TYPES.has(input.fileType) || (input.fileType === 'PDF' && parsedRows.length > 0)) {
    try {
      const extracted = parseObservations(parsedRows);
      observations = extracted.observations;
      invalidRows = extracted.invalidRows;
      extractionStatus = observations.length > 0 ? 'EXTRACTED' : 'FAILED';
      const unitsMatch = upper(input.unit || benchmark.benchmark_unit) === upper(benchmark.benchmark_unit);
      const currencyMatches = upper(input.currency || benchmark.currency) === upper(benchmark.currency);
      const geographyMatches = upper(input.geography || benchmark.geography) === upper(benchmark.geography);
      const fileHeaders = Object.keys(parsedRows[0] || {});
      const unitHeader = fileHeaders.find((header) => PCBI_DATA_LAB_UNIT_HEADERS.test(header.trim()));
      const currencyHeader = fileHeaders.find((header) => PCBI_DATA_LAB_CURRENCY_HEADERS.test(header.trim()));
      const geographyHeader = fileHeaders.find((header) => PCBI_DATA_LAB_GEOGRAPHY_HEADERS.test(header.trim()));
      const rowSpecificationsMatch = parsedRows.every((row) =>
        (!unitHeader || upper(row[unitHeader]) === upper(benchmark.benchmark_unit)) &&
        (!currencyHeader || upper(row[currencyHeader]) === upper(benchmark.currency)) &&
        (!geographyHeader || upper(row[geographyHeader]) === upper(benchmark.geography))
      );
      const duplicates = new Set(observations.map((item) => item.observationDate)).size !== observations.length;
      const fullyValid = observations.length > 0 && invalidRows === 0 && unitsMatch && currencyMatches && geographyMatches && rowSpecificationsMatch && !duplicates;
      validationStatus = fullyValid ? 'VALIDATED' : 'ISSUES_DETECTED';
      if (!unitsMatch || !currencyMatches || !geographyMatches || !rowSpecificationsMatch) sourceIssue = 'Source unit, currency, or geography does not match the D1 PCBI definition.';
      else if (invalidRows > 0 || duplicates) sourceIssue = 'Some source rows have invalid values, dates, or duplicate dates.';
      else if (!fullyValid) sourceIssue = D1_ROUTE_MESSAGES.pcbiDataLabPdfExtractionFailed;
    } catch (error) {
      extractionStatus = 'FAILED';
      validationStatus = 'ISSUES_DETECTED';
      sourceIssue = error instanceof Error ? error.message : String(error);
    }
  }
  const frequency = input.frequency || 'WEEKLY';
  const unit = input.unit || benchmark.benchmark_unit;
  const currency = input.currency || benchmark.currency;
  const geography = input.geography || benchmark.geography;
  const sourceStatus: PCBICommoditySourceRow = {
    source_id: sourceId, commodity_id: input.commodityId, pcbi_id: input.pcbiId, series_id: input.seriesId || null,
    source_name: input.sourceName, publisher: input.publisher, url: input.url || null, document_name: input.documentName,
    publication_date: input.publicationDate || null, uploaded_at: uploadedAt, uploaded_by: actorName,
    file_type: input.fileType, checksum, object_key: objectKey, geography, grade_specification: input.gradeSpecification || '',
    unit, currency, frequency, delivery_basis: input.deliveryBasis || '', historical_coverage: input.historicalCoverage || '',
    extraction_status: extractionStatus, validation_status: validationStatus, methodology_status: 'PENDING',
    approval_status: 'UNDER_REVIEW', extracted_observations_count: observations.length
  };
  const insertSource = db.prepare(`INSERT INTO ${D1_TABLES.pcbiCommoditySources} (
    source_id, commodity_id, pcbi_id, series_id, source_name, publisher, url, document_name, publication_date,
    uploaded_at, uploaded_by, file_type, checksum, object_key, geography, grade_specification, unit, currency,
    frequency, delivery_basis, historical_coverage, extraction_status, validation_status, methodology_status,
    approval_status, extracted_observations_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(sourceId, input.commodityId, input.pcbiId, input.seriesId || null, input.sourceName, input.publisher,
      input.url || null, input.documentName, input.publicationDate || null, uploadedAt, actorName, input.fileType,
      checksum, objectKey, geography, input.gradeSpecification || '', unit, currency, frequency,
      input.deliveryBasis || '', input.historicalCoverage || '', extractionStatus, validationStatus, 'PENDING',
      'UNDER_REVIEW', observations.length);
  await insertSource.run();
  for (const observation of observations) {
    const observationStatus = validationStatus === 'VALIDATED' ? 'VERIFIED' : 'NEEDS_REVIEW';
    await db.prepare(`INSERT INTO ${D1_TABLES.pcbiCommodityObservations} (
      observation_id, source_id, pcbi_id, observation_date, raw_value, raw_unit, raw_currency,
      normalized_value, normalized_unit, normalized_currency, frequency, status, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id(), sourceId, input.pcbiId, observation.observationDate, observation.value, unit, currency,
        observation.value, unit, currency, frequency, observationStatus, JSON.stringify(observation.originalRow)).run();
  }
  logger.info('Persisted commodity research source in D1 and R2', {
    requestId, sourceId, pcbiId: input.pcbiId, extractionStatus, validationStatus, observationCount: observations.length
  });
  return {
    data: {
      success: true,
      source: mapSource(sourceStatus),
      banner: sourceIssue ? 'SOURCE_STAGED_WITH_ISSUES' : 'SOURCE_STAGED',
      message: sourceIssue || 'Research evidence and extracted observations were saved to Cloudflare R2 and D1.'
    }
  };
};

const detectDomain = async (request: Request): Promise<WorkerD1Result> => {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = detectUploadDomainSchema.safeParse(body);
  if (!parsed.success) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabInvalid, errors: parsed.error.issues } };
  const text = `${parsed.data.fileName} ${parsed.data.fileContentSnippet || ''}`.toLowerCase().replace(/[_-]+/gu, ' ');
  const matchedSignatures: string[] = [];
  const customerTokens = ['purchase order', 'purchase history', 'customer data', 'customer_po', 'supplier', 'invoice', 'net price', 'order quantity'];
  const masterTokens = ['pcbi master', 'benchmark master', 'unspsc mapping', 'weekly index master'];
  const researchTokens = ['commodity', 'market price', 'benchmark index', 'historical price', 'price index'];
  const signatures = (tokens: string[]): string[] => tokens.filter((token) => text.includes(token));
  const customerMatches = signatures(customerTokens);
  const masterMatches = signatures(masterTokens);
  const researchMatches = signatures(researchTokens);
  let detectedDomain: PCBIDataLabDomainResult['detectedDomain'] = 'UNKNOWN';
  if (customerMatches.length >= 2 || /customer.*(?:po|purchase)|purchase history/i.test(parsed.data.fileName)) {
    detectedDomain = 'CUSTOMER_PURCHASE_HISTORY';
    matchedSignatures.push(...customerMatches);
    if (matchedSignatures.length === 0) matchedSignatures.push('customer purchase file name');
  }
  else if (masterMatches.length > 0) { detectedDomain = 'PCBI_MASTER_SYSTEM_DATA'; matchedSignatures.push(...masterMatches); }
  else if (researchMatches.length > 0) { detectedDomain = 'COMMODITY_RESEARCH_EVIDENCE'; matchedSignatures.push(...researchMatches); }
  const allowed = detectedDomain === 'UNKNOWN' ||
    (parsed.data.targetArea === 'MODULE_1_INGESTION' && detectedDomain === 'CUSTOMER_PURCHASE_HISTORY') ||
    (parsed.data.targetArea === 'PCBI_MASTER' && detectedDomain === 'PCBI_MASTER_SYSTEM_DATA') ||
    (parsed.data.targetArea === 'COMMODITY_DATA_LAB' && detectedDomain === 'COMMODITY_RESEARCH_EVIDENCE');
  const targetName = parsed.data.targetArea === 'MODULE_1_INGESTION' ? 'Module 1' : parsed.data.targetArea === 'PCBI_MASTER' ? 'PCBI Master' : 'Commodity Data Lab';
  const detection: PCBIDataLabDomainResult = {
    detectedDomain, targetArea: parsed.data.targetArea, isAllowedInTarget: allowed, matchedSignatures,
    ...(allowed ? {} : {
      errorMessage: D1_ROUTE_MESSAGES.pcbiDataLabDomainRejected(targetName),
      guidanceMessage: detectedDomain === 'CUSTOMER_PURCHASE_HISTORY'
        ? 'Upload customer purchase history through Module 1 ingestion.'
        : 'Upload PCBI master definitions through the PCBI Master tab.'
    })
  };
  return { data: { success: true, detection } };
};

const observationRows = async (db: NonNullable<CloudflareEnvironment['DB']>, pcbiId?: string): Promise<PCBICommodityObservationRow[]> => {
  const where = pcbiId ? ' WHERE o.pcbi_id = ?' : '';
  const values = pcbiId ? [pcbiId] : [];
  return queryD1Rows<PCBICommodityObservationRow>(db, `
    SELECT o.observation_id AS "observationId", o.source_id AS "sourceId", o.pcbi_id, o.observation_date AS "observation_date",
      o.observation_date AS "sourceDate", o.raw_value AS "raw_value", o.raw_unit AS "raw_unit",
      o.raw_currency AS "raw_currency", o.normalized_value AS "normalized_value", o.normalized_unit AS "normalized_unit",
      o.normalized_currency AS "normalized_currency", o.frequency, o.status, o.payload_json
    FROM ${D1_TABLES.pcbiCommodityObservations} o${where} ORDER BY o.observation_date DESC`, values);
};

const sourceRows = async (db: NonNullable<CloudflareEnvironment['DB']>, pcbiId?: string): Promise<PCBICommoditySourceRow[]> =>
  queryD1Rows<PCBICommoditySourceRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiCommoditySources}${pcbiId ? ' WHERE pcbi_id = ?' : ''} ORDER BY uploaded_at DESC`, pcbiId ? [pcbiId] : []);

const promotions = async (db: NonNullable<CloudflareEnvironment['DB']>, pcbiId?: string): Promise<PCBICommodityPromotionRow[]> =>
  queryD1Rows<PCBICommodityPromotionRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiCommodityPromotions}${pcbiId ? ' WHERE pcbi_id = ?' : ''} ORDER BY promoted_at DESC`, pcbiId ? [pcbiId] : []);

const researchAssignments = async (db: NonNullable<CloudflareEnvironment['DB']>): Promise<PCBICommodityResearchAssignmentRow[]> =>
  queryD1Rows<PCBICommodityResearchAssignmentRow>(db,
    `SELECT * FROM ${D1_TABLES.pcbiResearchAssignments} ORDER BY updated_at DESC`);

const dateRange = (dates: string[]): string => {
  if (dates.length === 0) return 'No published observations';
  const sorted = [...dates].sort();
  return `${sorted[0]} – ${sorted[sorted.length - 1]} (${dates.length} observations)`;
};

const buildQueue = async (
  db: NonNullable<CloudflareEnvironment['DB']>,
  requestId?: string,
  publishedPayloadOverride?: PcbiAdminImportInput | null
): Promise<CommodityResearchQueueRow[]> => {
  const publishedPayload = publishedPayloadOverride === undefined
    ? await getPublishedPcbiPayload(db)
    : publishedPayloadOverride;
  const [benchmarks, sources, observations, promoted, assignments, spendByBenchmark] = await Promise.all([
    getBenchmarks(db, publishedPayload), sourceRows(db), observationRows(db), promotions(db),
    researchAssignments(db),
    pcbiSpendByBenchmark(db, publishedPayload, requestId)
  ]);
  const assignmentsByPcbi = new Map(assignments.map((assignment) => [assignment.pcbi_id, assignment]));
  const queue = benchmarks.map((benchmark): CommodityResearchQueueRow => {
    const relatedSources = sources.filter((source) => source.pcbi_id === benchmark.pcbi_id);
    const relatedObservations = observations.filter((observation) => observation.pcbi_id === benchmark.pcbi_id);
    const seriesPromoted = promoted.some((entry) => entry.pcbi_id === benchmark.pcbi_id);
    const latestSource = relatedSources[0];
    const assignment = assignmentsByPcbi.get(benchmark.pcbi_id);
    const status: CommodityResearchQueueRow['currentStatus'] = seriesPromoted
      ? 'PRODUCTION_READY'
      : relatedObservations.length > 0 ? 'PARTIAL_HISTORY'
        : latestSource && latestSource.validation_status !== 'VALIDATED' ? 'SOURCE_UNVERIFIED' : 'NO_HISTORY';
    const researchStatus: CommodityResearchQueueRow['researchStatus'] = seriesPromoted
      ? 'RESOLVED'
      : relatedObservations.length > 0 ? 'DATA_UPLOADED'
        : latestSource ? 'SOURCE_IDENTIFIED' : 'QUEUED';
    const frequency = latestSource?.frequency as CommodityResearchQueueRow['availableFrequency'] | undefined;
    const customerSpend = spendByBenchmark.get(benchmark.pcbi_id) || { spendInr: 0, transactionCount: 0, unspscCodes: [] };
    const customerSpendCr = customerSpend.spendInr / D1_REPORTING.inrPerCrore;
    const start = benchmark.start_date || benchmark.effective_from || '';
    const end = benchmark.end_date || '';
    return {
      commodity: benchmark.benchmark_name,
      commodityId: benchmark.pcbi_id,
      module2Classification: benchmark.category,
      unspsc: customerSpend.unspscCodes.join(', '),
      customerSpend: customerSpendCr,
      customerSpendCr: customerSpendCr.toFixed(D1_REPORTING.decimalPlaces),
      transactionCount: customerSpend.transactionCount,
      pcbiId: benchmark.pcbi_id,
      seriesId: latestSource?.series_id || benchmark.pcbi_id,
      currentStatus: status,
      requiredHistory: start || end ? `${start || 'Not configured'} to ${end || 'Not configured'}` : 'Not configured in D1',
      availableHistory: dateRange(relatedObservations.map((row) => row.observation_date)),
      requiredFrequency: 'WEEKLY',
      requiredUnit: benchmark.benchmark_unit,
      requiredCurrency: benchmark.currency,
      requiredGeography: benchmark.geography,
      availableFrequency: frequency || 'NONE',
      sourceStatus: latestSource ? (latestSource.validation_status === 'VALIDATED' ? 'SOURCE_VERIFIED' : latestSource.validation_status) : 'NO_SOURCE',
      methodologyStatus: latestSource?.methodology_status || 'NOT_REVIEWED',
      priority: 'PENDING — Spend Link Required',
      priorityScore: 0,
      priorityReason: 'SPEND_LINK_REQUIRED',
      researchStatus,
      assignedTo: assignment?.assigned_to || null,
      assignedAt: assignment?.assigned_at || null,
      lastUpdated: latestSource?.uploaded_at || '',
      action: status === 'PRODUCTION_READY' ? 'OPEN WORKSPACE' : 'UPLOAD SOURCE'
    };
  });
  return prioritizePcbiResearchQueue(queue);
};

const assignResearcher = async (
  db: NonNullable<CloudflareEnvironment['DB']>, request: Request, actorName: string, requestId: string
): Promise<WorkerD1Result> => {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = assignPcbiResearchSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn('PCBI research assignment rejected by validation', { requestId, issues: parsed.error.issues });
    return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiResearchAssignmentInvalid, errors: parsed.error.issues } };
  }
  const input: AssignPcbiResearchInput = parsed.data;
  const benchmark = await getBenchmark(db, input.pcbiId);
  if (!benchmark) {
    logger.warn('PCBI research assignment references an unknown benchmark', { requestId, pcbiId: input.pcbiId });
    return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiResearchAssignmentNotFound } };
  }
  const startedAt = performance.now();
  const updatedAt = new Date().toISOString();
  try {
    if (input.assignee === null) {
      await db.prepare(`DELETE FROM ${D1_TABLES.pcbiResearchAssignments} WHERE pcbi_id = ?`).bind(input.pcbiId).run();
    } else {
      await db.prepare(`
        INSERT INTO ${D1_TABLES.pcbiResearchAssignments}
          (pcbi_id, assigned_to, assigned_by, assigned_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(pcbi_id) DO UPDATE SET
          assigned_to = excluded.assigned_to,
          assigned_by = excluded.assigned_by,
          updated_at = excluded.updated_at
      `).bind(input.pcbiId, input.assignee, actorName, updatedAt, updatedAt).run();
    }
  } catch (error) {
    logger.error('Failed to persist PCBI research assignment in D1', { requestId, pcbiId: input.pcbiId }, error);
    throw error;
  }
  logger.info('Persisted PCBI research assignment in D1', {
    requestId, pcbiId: input.pcbiId, assigned: input.assignee !== null,
    assignedTo: input.assignee, operation: input.assignee === null ? 'DELETE' : 'UPSERT',
    durationMs: Math.round(performance.now() - startedAt)
  });
  return {
    data: {
      success: true,
      assignment: input.assignee === null
        ? null
        : { pcbiId: input.pcbiId, assignedTo: input.assignee, assignedBy: actorName, updatedAt }
    }
  };
};

const dashboard = async (db: NonNullable<CloudflareEnvironment['DB']>, requestId?: string): Promise<WorkerD1Result> => {
  const queue = await buildQueue(db, requestId);
  const metrics: PCBIResearchDashboardMetrics = {
    totalCommodities: queue.length,
    productionReadyCount: queue.filter((item) => item.currentStatus === 'PRODUCTION_READY').length,
    partialHistoryCount: queue.filter((item) => item.currentStatus === 'PARTIAL_HISTORY').length,
    noHistoryCount: queue.filter((item) => item.currentStatus === 'NO_HISTORY').length,
    missingCount: queue.filter((item) => item.currentStatus === 'MISSING').length,
    sourceUnverifiedCount: queue.filter((item) => item.currentStatus === 'SOURCE_UNVERIFIED').length,
    methodologyPendingCount: queue.filter((item) => item.methodologyStatus === 'PENDING' || item.methodologyStatus === 'NOT_REVIEWED').length,
    specificationMismatchCount: queue.filter((item) => item.currentStatus === 'SPECIFICATION_MISMATCH').length,
    frequencyMismatchCount: queue.filter((item) => item.currentStatus === 'FREQUENCY_MISMATCH').length,
    highImpactGapsCount: countPcbiHighImpactGaps(queue),
    queueByPriority: countPcbiPriorities(queue)
  };
  return { data: { success: true, metrics } };
};

const workspace = async (
  db: NonNullable<CloudflareEnvironment['DB']>, pcbiId: string, tab: string, requestId?: string
): Promise<WorkerD1Result> => {
  const publishedPayload = await getPublishedPcbiPayload(db);
  const benchmark = await getBenchmark(db, pcbiId, publishedPayload);
  if (!benchmark) return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabSourceNotFound } };
  const [sources, observations, promoted, spendByBenchmark, queue] = await Promise.all([
    sourceRows(db, pcbiId), observationRows(db, pcbiId), promotions(db, pcbiId),
    pcbiSpendByBenchmark(db, publishedPayload, requestId),
    buildQueue(db, requestId, publishedPayload)
  ]);
  const queuePriority = queue.find((row) => row.pcbiId === pcbiId);
  const customerSpend = spendByBenchmark.get(pcbiId) || { spendInr: 0, transactionCount: 0, unspscCodes: [] };
  const countVerified = observations.filter((row) => row.status === 'VERIFIED').length;
  const countReview = observations.length - countVerified;
  const candidate = sources.find((source) => source.validation_status === 'VALIDATED' && source.frequency === 'WEEKLY');
  const candidatePromoted = Boolean(candidate && promoted.some((entry) => entry.source_id === candidate.source_id));
  const canPromote = Boolean(candidate && countVerified > 0 && countReview === 0 && !candidatePromoted);
  const overview = {
    commodityId: pcbiId,
    commodityName: benchmark.benchmark_name,
    pcbiId,
    seriesId: sources[0]?.series_id || pcbiId,
    module2Classification: benchmark.category,
    unspsc: customerSpend.unspscCodes.join(', '),
    currentStatus: promoted.length > 0 ? 'PRODUCTION_READY' as const : observations.length > 0 ? 'PARTIAL_HISTORY' as const : 'NO_HISTORY' as const,
    customerSpendInr: customerSpend.spendInr,
    customerSpendCr: (customerSpend.spendInr / D1_REPORTING.inrPerCrore).toFixed(D1_REPORTING.decimalPlaces),
    transactionCount: customerSpend.transactionCount,
    requiredStartDate: benchmark.start_date || benchmark.effective_from || '',
    requiredEndDate: benchmark.end_date || '',
    requiredFrequency: 'WEEKLY' as const,
    requiredUnit: benchmark.benchmark_unit,
    requiredCurrency: benchmark.currency,
    requiredGeography: benchmark.geography,
    availableHistory: dateRange(observations.map((row) => row.observation_date)),
    priority: queuePriority?.priority || 'PENDING — Spend Link Required',
    priorityScore: queuePriority?.priorityScore || 0,
    priorityReason: queuePriority?.priorityReason || 'SPEND_LINK_REQUIRED',
    researchStatus: promoted.length > 0 ? 'RESOLVED' as const : observations.length > 0 ? 'DATA_UPLOADED' as const : sources.length > 0 ? 'SOURCE_IDENTIFIED' as const : 'QUEUED' as const,
    lastUpdated: sources[0]?.uploaded_at || ''
  };
  const detail: CommodityWorkspaceDetail = {
    overview,
    sources: sources.map(mapSource),
    extractedObservations: observations.map((row) => ({
      observationId: row.observationId,
      sourceId: row.sourceId,
      sourceDate: row.sourceDate,
      rawValue: Number(row.raw_value),
      rawUnit: row.raw_unit,
      rawCurrency: row.raw_currency,
      normalizedValue: Number(row.normalized_value),
      normalizedUnit: row.normalized_unit,
      normalizedCurrency: row.normalized_currency,
      frequency: row.frequency,
      status: row.status === 'VERIFIED' ? 'VERIFIED' : 'NEEDS_REVIEW'
    })),
    methodologyDetails: {
      methodologyId: `METHOD-${pcbiId}`,
      title: `Weekly evidence validation for ${benchmark.benchmark_name}`,
      status: sources.find((source) => source.methodology_status !== 'PENDING')?.methodology_status || 'PENDING',
      conversionRule: 'Values are not converted; source unit, currency, and geography must match the D1 benchmark definition.',
      governanceNotes: 'Catalog promotion requires a validated weekly source and an explicit administrator approval.'
    },
    validationSummary: {
      passed: observations.length > 0 && countReview === 0,
      totalObservations: observations.length,
      validObservations: countVerified,
      missingPeriods: [],
      criticalErrorsCount: countReview
    },
    approvalPackage: {
      isReadyForApproval: canPromote,
      canWriteToCatalog: canPromote,
      approvalGateStatus: canPromote ? 'APPROVED_READY_FOR_CATALOG' : promoted.length > 0 ? 'CATALOG_PUBLISHED' : 'LOCKED_PENDING_REVIEW',
      approverName: promoted[0]?.approver_name,
      approvedAt: promoted[0]?.promoted_at
    },
    activeTab: tab as CommodityWorkspaceDetail['activeTab']
  };
  return { data: { success: true, workspace: detail } };
};

const approve = async (
  environment: CloudflareEnvironment, request: Request, actorName: string, requestId: string
): Promise<WorkerD1Result> => {
  const db = requireWorkerDb(environment.DB);
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = approveCommodityDataSchema.safeParse(body);
  if (!parsed.success) return { status: 400, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabInvalid, errors: parsed.error.issues } };
  const input = parsed.data;
  const [benchmark, allSources, allObservations, allPromotions] = await Promise.all([
    getBenchmark(db, input.pcbiId), sourceRows(db, input.pcbiId), observationRows(db, input.pcbiId), promotions(db, input.pcbiId)
  ]);
  if (!benchmark) return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabSourceNotFound } };
  const source = allSources.find((item) => item.commodity_id === input.commodityId && item.validation_status === 'VALIDATED' && item.approval_status === 'UNDER_REVIEW');
  const observations = source ? allObservations.filter((row) => row.sourceId === source.source_id) : [];
  const issues: string[] = [];
  if (!source) issues.push('No validated evidence source is awaiting approval for this commodity.');
  if (source && source.frequency !== 'WEEKLY') issues.push('Only weekly evidence can currently be published to the PCBI index catalog.');
  if (source && upper(source.unit) !== upper(benchmark.benchmark_unit)) issues.push('Source unit does not match the D1 benchmark unit.');
  if (source && upper(source.currency) !== upper(benchmark.currency)) issues.push('Source currency does not match the D1 benchmark currency.');
  if (source && upper(source.geography) !== upper(benchmark.geography)) issues.push('Source geography does not match the D1 benchmark geography.');
  if (observations.length === 0) issues.push('No extracted observations are available for promotion.');
  if (observations.some((row) => row.status !== 'VERIFIED')) issues.push('Every observation must pass source validation before promotion.');
  if (allPromotions.some((item) => item.source_id === source?.source_id)) issues.push('This evidence source has already been promoted.');
  if (issues.length > 0 || !source) return { status: 422, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabApprovalBlocked, errors: issues } };

  const promotionId = id();
  const promotedAt = new Date().toISOString();
  const catalogVersionId = `PCBI-${promotionId}`;
  const insert = db.prepare(`INSERT INTO ${D1_TABLES.pcbiCommodityPromotions} (
    promotion_id, catalog_version_id, source_id, commodity_id, pcbi_id, approver_name, comments, promoted_at, observation_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(promotionId, catalogVersionId, source.source_id, input.commodityId, input.pcbiId, actorName,
      input.comments || null, promotedAt, observations.length);
  const update = db.prepare(`UPDATE ${D1_TABLES.pcbiCommoditySources}
    SET methodology_status = 'METHODOLOGY_APPROVED', approval_status = 'ADMIN_APPROVED'
    WHERE source_id = ?`).bind(source.source_id);
  if (db.batch) await db.batch([insert, update]);
  else { await insert.run(); await update.run(); }
  logger.info('Promoted verified commodity evidence into PCBI catalog', {
    requestId, pcbiId: input.pcbiId, sourceId: source.source_id, catalogVersionId,
    observationCount: observations.length, approver: actorName
  });
  return { data: { success: true, result: {
    success: true, commodityId: input.commodityId, pcbiId: input.pcbiId, approvalStatus: 'ADMIN_APPROVED',
    catalogVersionCreated: true, catalogVersionId, message: 'Validated weekly observations were added to the active D1 PCBI series.'
  } } };
};

export const handlePcbiDataLabRoute = async (
  environment: CloudflareEnvironment, request: Request, url: URL, actorName: string
): Promise<WorkerD1Result> => {
  const requestId = request.headers.get('x-request-id') || id();
  const root = '/api/admin/pcbi/data-lab';
  const path = url.pathname.slice(root.length) || '/';
  const db = requireWorkerDb(environment.DB);
  if (path === '/detect-domain' && request.method === 'POST') return detectDomain(request);
  if (path === '/upload-source' && request.method === 'POST') return uploadSource(environment, request, actorName, requestId);
  if (path === '/approve' && request.method === 'POST') return approve(environment, request, actorName, requestId);
  if (path === '/assignment' && request.method === 'POST') return assignResearcher(db, request, actorName, requestId);
  if (path === '/dashboard' && request.method === 'GET') return dashboard(db, requestId);
  if (path === '/queue' && request.method === 'GET') {
    const queue = await buildQueue(db, requestId);
    return { data: { success: true, total: queue.length, queue } };
  }
  if (path === '/sources' && request.method === 'GET') {
    const rows = await sourceRows(db);
    return { data: { success: true, total: rows.length, sources: rows.map(mapSource) } };
  }
  if (path === '/version-history' && request.method === 'GET') {
    const rows = await promotions(db);
    return { data: { success: true, total: rows.length, versions: rows } };
  }
  const commodityMatch = path.match(/^\/commodity\/([^/]+)$/u);
  if (commodityMatch && request.method === 'GET') {
    const tab = url.searchParams.get('tab') || 'OVERVIEW';
    return workspace(db, decodeURIComponent(commodityMatch[1]), tab, requestId);
  }
  const allowedPath = ['/detect-domain', '/upload-source', '/approve', '/assignment', '/dashboard', '/queue', '/sources', '/version-history'].includes(path) || Boolean(commodityMatch);
  return {
    status: allowedPath ? 405 : 404,
    data: { success: false, message: allowedPath ? D1_ROUTE_MESSAGES.pcbiDataLabMethod : D1_ROUTE_MESSAGES.unknownPcbi }
  };
};


