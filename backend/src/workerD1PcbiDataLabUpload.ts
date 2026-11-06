import {
  D1_ROUTE_MESSAGES,
  D1_TABLES,
  PCBI_DATA_LAB_CURRENCY_HEADERS,
  PCBI_DATA_LAB_DATE_HEADER_PATTERNS,
  PCBI_DATA_LAB_GEOGRAPHY_HEADERS,
  PCBI_DATA_LAB_STRUCTURED_FILE_TYPES,
  PCBI_DATA_LAB_UPLOAD_JSON_MAX_BYTES,
  PCBI_DATA_LAB_UPLOAD_MAX_BYTES,
  PCBI_DATA_LAB_UNIT_HEADERS,
  PCBI_DATA_LAB_VALUE_HEADER_PATTERNS
} from './constants/d1';
import { PCBI_RESEARCH_PDF_EXTRACTION_PROMPT } from './constants/ai';
import { pcbiResearchPdfExtractionSchema, uploadCommoditySourceSchema } from './constants/validation';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { WorkerD1Result } from './types/d1';
import type { CommoditySourceEvidenceObject } from './types/pcbiCommodityDataLab';
import type {
  PCBICommoditySourceRow,
  PCBIDataLabDomainResult,
  PCBIDataLabUploadDependencies,
  PCBIParsedObservation
} from './types/pcbiDataLabStorage';
import type { UploadCommoditySourceInput } from './types/validation';
import { readJson } from './workerHttp';
import { requireWorkerDb, runD1Statements } from './services/workerD1Query';
import { geminiService } from './services/geminiService';
import logger from './utils/logger';

const id = (): string => crypto.randomUUID();
const upper = (value: unknown): string => typeof value === 'string' ? value.trim().toUpperCase() : '';

export const mapPcbiCommoditySource = (row: PCBICommoditySourceRow): CommoditySourceEvidenceObject => ({
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
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    const year = String(value.getFullYear()).padStart(4, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
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

export const uploadPcbiCommoditySource = async (
  environment: CloudflareEnvironment,
  request: Request,
  actorName: string,
  requestId: string,
  dependencies: PCBIDataLabUploadDependencies
): Promise<WorkerD1Result> => {
  const db = requireWorkerDb(environment.DB);
  const body: unknown = await readJson(request, PCBI_DATA_LAB_UPLOAD_JSON_MAX_BYTES);
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
  let structuredParseFailed = false;
  if (PCBI_DATA_LAB_STRUCTURED_FILE_TYPES.has(input.fileType)) {
    try {
      parsedRows = await parseStructuredRows(bytes, input.fileType);
    } catch (error: unknown) {
      structuredParseFailed = true;
      parsedRows = [];
      logger.warn('PCBI structured research source could not be parsed; source will be staged for review', {
        requestId,
        pcbiId: input.pcbiId,
        fileType: input.fileType,
        fileSizeBytes: bytes.length
      }, error);
    }
  }
  const headerText = parsedRows.length > 0 ? Object.keys(parsedRows[0]).join(' ') : '';
  const domainResponse = await dependencies.detectDomain(new Request(request.url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: input.documentName, fileContentSnippet: headerText, targetArea: 'COMMODITY_DATA_LAB' })
  }));
  const detection = (domainResponse.data as { detection?: PCBIDataLabDomainResult }).detection;
  if (detection && !detection.isAllowedInTarget) {
    return { status: 422, data: { success: false, message: detection.errorMessage, errors: detection.matchedSignatures } };
  }
  const benchmark = await dependencies.getBenchmark(db, input.pcbiId);
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
      if (structuredParseFailed) sourceIssue = D1_ROUTE_MESSAGES.pcbiDataLabFileInvalid;
      else if (!unitsMatch || !currencyMatches || !geographyMatches || !rowSpecificationsMatch) sourceIssue = 'Source unit, currency, or geography does not match the D1 PCBI definition.';
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
  const observationStatus = validationStatus === 'VALIDATED' ? 'VERIFIED' : 'NEEDS_REVIEW';
  const insertObservations = observations.map((observation) => db.prepare(`INSERT INTO ${D1_TABLES.pcbiCommodityObservations} (
      observation_id, source_id, pcbi_id, observation_date, raw_value, raw_unit, raw_currency,
      normalized_value, normalized_unit, normalized_currency, frequency, status, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id(), sourceId, input.pcbiId, observation.observationDate, observation.value, unit, currency,
        observation.value, unit, currency, frequency, observationStatus, JSON.stringify(observation.originalRow)));
  try {
    await runD1Statements(db, [insertSource, ...insertObservations]);
  } catch (error: unknown) {
    const failureContext = { requestId, sourceId, pcbiId: input.pcbiId, observationCount: observations.length };
    logger.error('PCBI commodity source D1 persistence failed; cleanup was attempted', failureContext, error);
    if (!db.batch) {
      try {
        await runD1Statements(db, [
          db.prepare(`DELETE FROM ${D1_TABLES.pcbiCommodityObservations} WHERE source_id = ?`).bind(sourceId),
          db.prepare(`DELETE FROM ${D1_TABLES.pcbiCommoditySources} WHERE source_id = ?`).bind(sourceId)
        ]);
      } catch (rollbackError: unknown) {
        logger.error('Failed to roll back partially persisted PCBI source rows', failureContext, rollbackError);
      }
    }
    try {
      await environment.OBJECTS.delete(objectKey);
    } catch (cleanupError: unknown) {
      logger.error('Failed to remove PCBI evidence object after D1 persistence failure', failureContext, cleanupError);
    }
    return { status: 503, data: { success: false, message: D1_ROUTE_MESSAGES.pcbiDataLabPersistenceFailed } };
  }
  logger.info('Persisted commodity research source in D1 and R2', {
    requestId, sourceId, pcbiId: input.pcbiId, extractionStatus, validationStatus, observationCount: observations.length
  });
  return {
    data: {
      success: true,
      source: mapPcbiCommoditySource(sourceStatus),
      banner: sourceIssue ? 'SOURCE_STAGED_WITH_ISSUES' : 'SOURCE_STAGED',
      message: sourceIssue || 'Research evidence and extracted observations were saved to Cloudflare R2 and D1.'
    }
  };
};
