import { describe, expect, it } from 'vitest';
import { DELIVERY_PACKAGE_ITEMS_SPEC } from '../../src/constants/assessment';
import type { AssessmentAnalysisRun, DeliveryPackageItem } from '../../src/types/assessment';
import {
  buildAssessmentArtifactStorageKey, decryptAssessmentArtifact, encryptAssessmentArtifact, getAssessmentArtifactFormatContentType,
  renderAssessmentDeliveryArtifact
} from '../../src/services/assessmentDeliveryArtifacts';
import { CRYPTO_MESSAGES } from '../../src/constants/crypto';
import * as XLSX from 'xlsx';

const baseInput = (item: DeliveryPackageItem) => ({
  item,
  assessment: { assessmentId: 'A-1', customerName: 'Demo Client', assessmentPeriodStart: '2025-01-01', assessmentPeriodEnd: '2025-12-31' },
  run: {
    analysisRunId: 'RUN-1', dataVersionId: 'DV-1', status: 'COMPLETED', totalSpendCr: 42,
    validatedSpendCr: 40, potentialSavingsCr: 2, savingsPct: 5, reviewGates: [], allGatesPassed: true,
    isApproved: true, isSuperseded: false, createdAt: '2026-10-31T00:00:00.000Z',
    module1Metrics: { validRows: 2, suppliers: 1 }
  } as AssessmentAnalysisRun,
  sourceRows: [{ supplier_name: 'Demo Supplier', amount_inr: 100 }],
  validationRows: [{ record_id: 'REC-1', resolved: 1 }],
  reviewGates: [{ gate_key: 'M1_INPUT_ROW_RECONCILIATION', status: 'PASSED' }]
});

const itemFor = (id: string): DeliveryPackageItem => {
  const spec = DELIVERY_PACKAGE_ITEMS_SPEC.find((entry) => entry.id === id) || DELIVERY_PACKAGE_ITEMS_SPEC[0];
  return { id: spec.id, title: spec.title, format: spec.format, artifactStatus: 'GENERATED', analysisRunId: 'RUN-1', dataVersionId: 'DV-1', generatedAt: '2026-10-31T00:00:00.000Z', fileName: `A-1${spec.fileSuffix}` };
};

describe('assessment delivery artifact generation', () => {
  it('renders all declared deliverable formats from the supplied D1 evidence', async () => {
    const pdf = await renderAssessmentDeliveryArtifact(baseInput(itemFor('EXECUTIVE_OPPORTUNITY_BRIEF')));
    const pptx = await renderAssessmentDeliveryArtifact(baseInput(itemFor('BOARDROOM_EVIDENCE_EDITION')));
    const workbook = await renderAssessmentDeliveryArtifact(baseInput(itemFor('EVIDENCE_WORKBOOK')));
    expect(new TextDecoder().decode(pdf.bytes.slice(0, 5))).toBe('%PDF-');
    expect(pptx.bytes[0]).toBe(0x50);
    expect(workbook.bytes[0]).toBe(0x50);
    expect(pdf.contentType).toContain('application/pdf');
    expect(pptx.contentType).toContain('presentationml');
    expect(workbook.contentType).toContain('spreadsheetml');
    const decoded = XLSX.read(workbook.bytes, { type: 'array' });
    const transactions = XLSX.utils.sheet_to_json(decoded.Sheets.Transactions as XLSX.WorkSheet) as Array<Record<string, unknown>>;
    expect(transactions[0].supplier_name).toBe('Demo Supplier');
  });

  it('generates each declared package item and formats each report module from its own persisted metrics', async () => {
    const result = await Promise.all(DELIVERY_PACKAGE_ITEMS_SPEC.map((spec) =>
      renderAssessmentDeliveryArtifact(baseInput(itemFor(spec.id)))));
    expect(result).toHaveLength(10);
    expect(result.every((artifact) => artifact.bytes.byteLength > 100)).toBe(true);
    const run = {
      ...baseInput(itemFor('MODULE_2_REPORT')).run,
      module2Metrics: Object.fromEntries(Array.from({ length: 48 }, (_item, index) => [`metric${index}`, index]))
    } as AssessmentAnalysisRun;
    const pagedPdf = await renderAssessmentDeliveryArtifact({ ...baseInput(itemFor('MODULE_2_REPORT')), run });
    expect(new TextDecoder().decode(pagedPdf.bytes)).toContain('metric47: 47');
    const multiSlideDeck = await renderAssessmentDeliveryArtifact({
      ...baseInput(itemFor('BOARDROOM_EVIDENCE_EDITION')),
      run: { ...run, module1Metrics: run.module2Metrics } as unknown as AssessmentAnalysisRun
    });
    expect(multiSlideDeck.bytes[0]).toBe(0x50);
  });

  it('reports persisted module metrics and explicit unavailable metrics in reports', async () => {
    const moduleOne = await renderAssessmentDeliveryArtifact(baseInput(itemFor('MODULE_1_REPORT')));
    const moduleTwo = await renderAssessmentDeliveryArtifact(baseInput(itemFor('MODULE_2_REPORT')));
    expect(new TextDecoder().decode(moduleOne.bytes)).toContain('validRows: 2');
    expect(new TextDecoder().decode(moduleTwo.bytes)).toContain('No persisted analytical metrics');
  });

  it('uses legacy assessment fields and labels missing or non-finite amounts without inventing values', async () => {
    const input = {
      ...baseInput(itemFor('EXECUTIVE_OPPORTUNITY_BRIEF')),
      assessment: {
        customerName: null,
        assessmentId: '',
        assessment_id: 'A-LEGACY',
        assessmentPeriodStart: undefined,
        assessment_period_start: '2024-01-01',
        assessmentPeriodEnd: '',
        assessment_period_end: '2024-12-31'
      },
      run: {
        ...baseInput(itemFor('EXECUTIVE_OPPORTUNITY_BRIEF')).run,
        totalSpendCr: Number.POSITIVE_INFINITY,
        validatedSpendCr: undefined,
        potentialSavingsCr: Number.NaN
      } as AssessmentAnalysisRun
    };
    const report = await renderAssessmentDeliveryArtifact(input);
    const text = new TextDecoder().decode(report.bytes);
    expect(text).toContain('Customer: Not recorded');
    expect(text).toContain('Assessment: A-LEGACY');
    expect(text).toContain('Period: 2024-01-01 to 2024-12-31');
    expect(text).toContain('Validated spend \\(INR crores\\): Not recorded');
  });

  it('renders empty evidence and action sections without inventing rows', async () => {
    const input = baseInput(itemFor('RECOMMENDED_WAVE_1_ACTIONS'));
    input.sourceRows = [];
    input.validationRows = [];
    const report = await renderAssessmentDeliveryArtifact(input);
    expect(new TextDecoder().decode(report.bytes)).toContain('No D1-backed Wave 1 recommendations');
    const qualityInput = baseInput(itemFor('DATA_QUALITY_OBSERVATIONS'));
    qualityInput.validationRows = [];
    const qualityPdf = await renderAssessmentDeliveryArtifact(qualityInput);
    expect(new TextDecoder().decode(qualityPdf.bytes)).toContain('No validation observations were returned');
    const workbookInput = baseInput(itemFor('EVIDENCE_WORKBOOK'));
    workbookInput.sourceRows = [];
    workbookInput.validationRows = [];
    const workbook = await renderAssessmentDeliveryArtifact(workbookInput);
    expect(getAssessmentArtifactFormatContentType(itemFor('DATA_QUALITY_OBSERVATIONS'))).toBe('application/pdf');
    expect(getAssessmentArtifactFormatContentType(itemFor('BOARDROOM_EVIDENCE_EDITION'))).toContain('presentationml');
    expect(getAssessmentArtifactFormatContentType(itemFor('EVIDENCE_WORKBOOK'))).toContain('spreadsheetml');
    expect(new TextDecoder().decode(workbook.bytes.slice(0, 2))).toBe('PK');
    expect(buildAssessmentArtifactStorageKey('../assessment /1', 'run:1', itemFor('EVIDENCE_WORKBOOK')))
      .toContain('assessment-deliveries/___assessment__1/run_1/');
    await expect(renderAssessmentDeliveryArtifact({
      ...input, item: { ...itemFor('MODULE_1_REPORT'), format: 'DOC' as never }
    })).rejects.toThrow('Unsupported assessment artifact format');
  });
});

describe('assessment artifact encryption', () => {
  it('encrypts and decrypts with a fresh AES-GCM nonce', async () => {
    const key = '0123456789abcdef0123456789abcdef';
    const plaintext = new TextEncoder().encode('D1 derived client report');
    const encrypted = await encryptAssessmentArtifact(plaintext, key);
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.bytes).not.toEqual(plaintext);
    await expect(decryptAssessmentArtifact(encrypted.bytes, encrypted, key)).resolves.toEqual(plaintext);
  });

  it('rejects short keys and tampered payloads with actionable errors', async () => {
    await expect(encryptAssessmentArtifact(new Uint8Array([1]), 'short')).rejects.toThrow(CRYPTO_MESSAGES.missingKey);
    const key = '0123456789abcdef0123456789abcdef';
    const encrypted = await encryptAssessmentArtifact(new Uint8Array([1, 2, 3]), key);
    const tampered = new Uint8Array(encrypted.bytes);
    tampered[0] ^= 1;
    await expect(decryptAssessmentArtifact(tampered, encrypted, key)).rejects.toThrow(CRYPTO_MESSAGES.invalidPayload);
    await expect(decryptAssessmentArtifact(encrypted.bytes, encrypted, 'short')).rejects.toThrow(CRYPTO_MESSAGES.missingKey);
    await expect(decryptAssessmentArtifact(encrypted.bytes, { ...encrypted, algorithm: 'invalid' }, key))
      .rejects.toThrow(CRYPTO_MESSAGES.invalidPayload);
    await expect(decryptAssessmentArtifact(encrypted.bytes, { ...encrypted, iv: 'invalid' }, key))
      .rejects.toThrow(CRYPTO_MESSAGES.invalidPayload);
    const large = await encryptAssessmentArtifact(new Uint8Array(0x9000), key);
    await expect(decryptAssessmentArtifact(large.bytes, large, key)).resolves.toHaveLength(0x9000);
  });
});
