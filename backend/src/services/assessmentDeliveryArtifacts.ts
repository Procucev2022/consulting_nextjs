import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import { ASSESSMENT_DELIVERY_ARTIFACT_LABELS, ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT,
  ASSESSMENT_DELIVERY_CONTENT_TYPES, ASSESSMENT_DELIVERY_MODULE_METRIC_KEYS } from '../constants/assessment';
import { AES_GCM_CONFIG, CRYPTO_MESSAGES } from '../constants/crypto';
import { ASSESSMENT_DELIVERY_STORAGE_PREFIX } from '../constants/assessment';
import type { DeliveryPackageItem } from '../types/assessment';
import type { D1Record } from '../types/d1';
import type {
  AssessmentArtifactEncryption, AssessmentCryptoKey, AssessmentDeliveryArtifactInput, RenderedAssessmentArtifact
} from '../types/assessmentDeliveryArtifacts';
import { PdfCanvas } from '../utils/pdfCanvas';
import { BRAND_COLORS } from '../constants/executiveBriefLayoutConstants';

const asText = (value: unknown): string => value === null || value === undefined || value === '' ? 'Not recorded' : String(value);
const asMetricText = (value: unknown): string => typeof value === 'number' && Number.isFinite(value) ? String(value) : asText(value);

const getReportLines = (input: AssessmentDeliveryArtifactInput): string[] => {
  const { item, assessment, run, sourceRows, validationRows, reviewGates } = input;
  const lines = [
    `Customer: ${asText(assessment.customerName)}`,
    `Assessment: ${asText(assessment.assessmentId || assessment.assessment_id)}`,
    `Analysis run: ${asText(run.analysisRunId)}`,
    `Data version: ${asText(run.dataVersionId)}`,
    `Period: ${asText(assessment.assessmentPeriodStart || assessment.assessment_period_start)} to ${asText(assessment.assessmentPeriodEnd || assessment.assessment_period_end)}`,
    `Total spend (INR crores): ${asMetricText(run.totalSpendCr)}`,
    `Validated spend (INR crores): ${asMetricText(run.validatedSpendCr)}`,
    `Persisted potential savings (INR crores): ${asMetricText(run.potentialSavingsCr)}`,
    `Source transaction rows: ${sourceRows.length}`,
    `Validation observations: ${validationRows.length}`,
    `Review gates passed: ${reviewGates.filter((gate) => gate.status === 'PASSED').length} of ${reviewGates.length}`,
    ASSESSMENT_DELIVERY_ARTIFACT_LABELS.provenance,
    ASSESSMENT_DELIVERY_ARTIFACT_LABELS.generatedBy
  ];
  const metricKey = ASSESSMENT_DELIVERY_MODULE_METRIC_KEYS[item.id];
  if (metricKey) {
    const metrics = (run as unknown as D1Record)[metricKey];
    if (metrics && typeof metrics === 'object') {
      Object.entries(metrics as D1Record).forEach(([key, value]) => {
        if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) lines.push(`${key}: ${asMetricText(value)}`);
      });
    } else {
      lines.push(ASSESSMENT_DELIVERY_ARTIFACT_LABELS.noMetrics);
    }
  }
  if (item.id === 'DATA_QUALITY_OBSERVATIONS' && validationRows.length === 0) {
    lines.push(ASSESSMENT_DELIVERY_ARTIFACT_LABELS.emptyValidation);
  }
  if (item.id === 'RECOMMENDED_WAVE_1_ACTIONS') lines.push(ASSESSMENT_DELIVERY_ARTIFACT_LABELS.noRecommendations);
  return lines;
};

const renderPdf = (input: AssessmentDeliveryArtifactInput): Uint8Array => {
  const {
    PAGE_WIDTH, PAGE_HEIGHT, LEFT, TITLE_Y, CONTENT_Y, LINE_GAP, BOTTOM, PDF_FONT_SIZE
  } = ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT;
  const canvas = new PdfCanvas(PAGE_WIDTH, PAGE_HEIGHT);
  canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, { fill: '#FFFFFF' });
  canvas.rect(0, 0, PAGE_WIDTH, 8, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(input.item.title, LEFT, TITLE_Y, { font: 'bold', fontSize: 22, color: BRAND_COLORS.primaryText });
  let y = CONTENT_Y;
  getReportLines(input).forEach((line) => {
    const wrapped = canvas.wrapLines(line, PAGE_WIDTH - (LEFT * 2), PDF_FONT_SIZE);
    wrapped.forEach((wrappedLine) => {
      if (y > BOTTOM) {
        canvas.addPage();
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, { fill: '#FFFFFF' });
        canvas.text(input.item.title, LEFT, TITLE_Y, { font: 'bold', fontSize: 16, color: BRAND_COLORS.primaryText });
        y = CONTENT_Y;
      }
      canvas.text(wrappedLine, LEFT, y, { fontSize: PDF_FONT_SIZE, color: BRAND_COLORS.primaryText });
      y += LINE_GAP;
    });
  });
  return canvas.toBytes();
};

const renderPptx = async (input: AssessmentDeliveryArtifactInput): Promise<Uint8Array> => {
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_WIDE';
  presentation.author = 'Consulting Platform';
  presentation.title = input.item.title;
  const lines = getReportLines(input);
  for (let offset = 0; offset < lines.length; offset += ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT.PPTX_MAX_LINES) {
    const slide = presentation.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addText(input.item.title, { x: 0.5, y: 0.35, w: 9, h: 0.45, fontFace: 'Arial', fontSize: 22, bold: true, color: '172033' });
    slide.addText(lines.slice(offset, offset + ASSESSMENT_DELIVERY_ARTIFACT_LAYOUT.PPTX_MAX_LINES).map((text) => ({
      text, options: { bullet: { indent: 12 }, breakLine: true }
    })), { x: 0.65, y: 1.05, w: 8.7, h: 4.0, fontFace: 'Arial', fontSize: 12, color: '172033', valign: 'top' });
  }
  const output = await presentation.write({ outputType: 'uint8array' });
  if (!(output instanceof Uint8Array)) throw new Error('Assessment presentation export did not return binary data.');
  return output;
};

const renderWorkbook = (input: AssessmentDeliveryArtifactInput): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  const overview = [
    { Field: 'Deliverable', Value: input.item.title },
    { Field: 'Customer', Value: asText(input.assessment.customerName) },
    { Field: 'Assessment ID', Value: asText(input.assessment.assessmentId || input.assessment.assessment_id) },
    { Field: 'Analysis run', Value: asText(input.run.analysisRunId) },
    { Field: 'Data version', Value: asText(input.run.dataVersionId) },
    { Field: 'Source', Value: 'Cloudflare D1 approved snapshot' },
    { Field: 'Source transaction rows', Value: input.sourceRows.length },
    { Field: 'Validation observations', Value: input.validationRows.length },
    { Field: 'Total spend (INR crores)', Value: input.run.totalSpendCr },
    { Field: 'Validated spend (INR crores)', Value: input.run.validatedSpendCr }
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(overview), 'Overview');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(input.reviewGates), 'Review Gates');
  const transactionSheet = input.sourceRows.length
    ? input.sourceRows
    : [{ note: ASSESSMENT_DELIVERY_ARTIFACT_LABELS.emptyEvidence }];
  const validationSheet = input.validationRows.length
    ? input.validationRows
    : [{ note: ASSESSMENT_DELIVERY_ARTIFACT_LABELS.emptyValidation }];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionSheet), 'Transactions');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(validationSheet), 'Validation');
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
};

export const renderAssessmentDeliveryArtifact = async (
  input: AssessmentDeliveryArtifactInput
): Promise<RenderedAssessmentArtifact> => {
  if (input.item.format === 'PDF') return { bytes: renderPdf(input), contentType: ASSESSMENT_DELIVERY_CONTENT_TYPES.PDF };
  if (input.item.format === 'PPTX') return { bytes: await renderPptx(input), contentType: ASSESSMENT_DELIVERY_CONTENT_TYPES.PPTX };
  if (input.item.format === 'XLSX') return { bytes: renderWorkbook(input), contentType: ASSESSMENT_DELIVERY_CONTENT_TYPES.XLSX };
  throw new Error(`Unsupported assessment artifact format: ${String(input.item.format)}`);
};

const toBase64 = (value: Uint8Array): string => {
  let binary = '';
  for (let index = 0; index < value.length; index += 0x8000) {
    binary += String.fromCharCode(...value.subarray(index, index + 0x8000));
  }
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

const importEncryptionKey = async (secret: string, usage: 'encrypt' | 'decrypt'): Promise<AssessmentCryptoKey> => {
  const bytes = new TextEncoder().encode(secret);
  if (bytes.length !== AES_GCM_CONFIG.KEY_BYTES) throw new Error(CRYPTO_MESSAGES.missingKey);
  return crypto.subtle.importKey('raw', bytes, { name: AES_GCM_CONFIG.ALGORITHM }, false, [usage]);
};

export const encryptAssessmentArtifact = async (
  bytes: Uint8Array,
  secret: string
): Promise<AssessmentArtifactEncryption> => {
  const key = await importEncryptionKey(secret, 'encrypt');
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_CONFIG.IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_GCM_CONFIG.ALGORITHM, iv, tagLength: AES_GCM_CONFIG.TAG_BITS }, key, bytes
  );
  return { bytes: new Uint8Array(ciphertext), iv: toBase64(iv), algorithm: AES_GCM_CONFIG.IDENTIFIER };
};

export const decryptAssessmentArtifact = async (
  ciphertext: Uint8Array,
  encryption: AssessmentArtifactEncryption,
  secret: string
): Promise<Uint8Array> => {
  if (encryption.algorithm !== AES_GCM_CONFIG.IDENTIFIER || !encryption.iv) {
    throw new Error(CRYPTO_MESSAGES.invalidPayload);
  }
  try {
    const key = await importEncryptionKey(secret, 'decrypt');
    return new Uint8Array(await crypto.subtle.decrypt({
      name: AES_GCM_CONFIG.ALGORITHM,
      iv: fromBase64(encryption.iv),
      tagLength: AES_GCM_CONFIG.TAG_BITS
    }, key, ciphertext));
  } catch (error) {
    if (error instanceof Error && error.message === CRYPTO_MESSAGES.missingKey) throw error;
    throw new Error(CRYPTO_MESSAGES.invalidPayload);
  }
};

export const getAssessmentArtifactFormatContentType = (item: DeliveryPackageItem): string =>
  item.format === 'PDF' ? ASSESSMENT_DELIVERY_CONTENT_TYPES.PDF
    : item.format === 'PPTX' ? ASSESSMENT_DELIVERY_CONTENT_TYPES.PPTX
      : ASSESSMENT_DELIVERY_CONTENT_TYPES.XLSX;

export const buildAssessmentArtifactStorageKey = (
  assessmentId: string,
  analysisRunId: string,
  item: DeliveryPackageItem,
  packageId = 'default'
): string => {
  const safeAssessment = assessmentId.replace(/[^A-Za-z0-9_-]/gu, '_');
  const safeRun = analysisRunId.replace(/[^A-Za-z0-9_-]/gu, '_');
  const safePackage = packageId.replace(/[^A-Za-z0-9_-]/gu, '_');
  return `${ASSESSMENT_DELIVERY_STORAGE_PREFIX}/${safeAssessment}/${safeRun}/${safePackage}/${item.id}/${item.fileName}`;
};
