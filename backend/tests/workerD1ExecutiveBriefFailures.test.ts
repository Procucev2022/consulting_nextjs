import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleExecutiveBriefRoute } from '../src/workerD1ExecutiveBrief';
import { EXECUTIVE_BRIEF_HTTP_STATUS, EXECUTIVE_BRIEF_MESSAGES } from '../src/constants/executiveBriefRouteConstants';
import { renderExecutiveBriefArtifact, publishExecutiveBriefArtifacts } from '../src/services/executiveBriefArtifactService';
import { assembleExecutiveBriefReport } from '../src/services/executiveBriefReportService';
import { formatExecutiveBriefAuditMarkdown } from '../src/services/executiveBriefMarkdown';
import {
  reconcileExecutiveBrief,
  verifyFinancialConsistency
} from '../src/services/executiveBriefMetadataService';
import { adminToken, briefRequest, briefUrl, bucketDouble, certifiedReport, testEnvironment } from './executiveBriefTestHelpers';

vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

vi.mock('../src/services/executiveBriefReportService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/executiveBriefReportService')>();
  return { ...actual, assembleExecutiveBriefReport: vi.fn(actual.assembleExecutiveBriefReport) };
});

vi.mock('../src/services/executiveBriefMetadataService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/executiveBriefMetadataService')>();
  return { ...actual, reconcileExecutiveBrief: vi.fn(actual.reconcileExecutiveBrief) };
});

vi.mock('../src/services/executiveBriefArtifactService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/executiveBriefArtifactService')>();
  return {
    ...actual,
    renderExecutiveBriefArtifact: vi.fn(actual.renderExecutiveBriefArtifact),
    publishExecutiveBriefArtifacts: vi.fn(actual.publishExecutiveBriefArtifacts)
  };
});

vi.mock('../src/services/executiveBriefMarkdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/executiveBriefMarkdown')>();
  return { ...actual, formatExecutiveBriefAuditMarkdown: vi.fn(actual.formatExecutiveBriefAuditMarkdown) };
});

const blockedReconciliation = () => ({
  consistency: verifyFinancialConsistency(certifiedReport().metadata),
  waterfallValid: true,
  netCompositionValid: true,
  isReconciled: false
});

const getRoute = async (path: string): Promise<Response> => {
  const response = await handleExecutiveBriefRoute(briefRequest('GET', path), testEnvironment(), briefUrl(path));
  if (response === null) {
    throw new Error('Expected the executive brief route to answer');
  }
  return response;
};

const messageOf = async (response: Response): Promise<string> => ((await response.json()) as { message: string }).message;

describe('executive brief failure responses', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-24T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('answers 500 with the request ID when the report cannot be assembled', async () => {
    vi.mocked(assembleExecutiveBriefReport).mockImplementationOnce(() => {
      throw new Error('report data unavailable');
    });
    const response = await getRoute('/report');
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = response.headers.get('X-Request-Id') ?? '';
    expect(await messageOf(response)).toBe(EXECUTIVE_BRIEF_MESSAGES.renderFailed('report data', requestId));
  });

  it('answers 500 when the audit cannot be rendered', async () => {
    vi.mocked(formatExecutiveBriefAuditMarkdown).mockImplementationOnce(() => {
      throw new Error('markdown failed');
    });
    const response = await getRoute('/audit');
    expect(response.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    expect(await messageOf(response)).toContain('executive brief audit could not be rendered');
  });

  it('answers 500 naming the format when the PDF or PPTX render fails', async () => {
    vi.mocked(renderExecutiveBriefArtifact).mockRejectedValueOnce(new Error('pdf failed'));
    const pdf = await getRoute('/download/pdf');
    expect(pdf.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    expect(await messageOf(pdf)).toContain('executive brief PDF could not be rendered');

    vi.mocked(renderExecutiveBriefArtifact).mockRejectedValueOnce(new Error('pptx failed'));
    const pptx = await getRoute('/download/pptx');
    expect(pptx.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    expect(await messageOf(pptx)).toContain('executive brief PPTX could not be rendered');
  });

  it('blocks the PDF and PPTX with 409 when the financial reconciliation fails', async () => {
    vi.mocked(reconcileExecutiveBrief).mockReturnValueOnce(blockedReconciliation());
    const pdf = await getRoute('/download/pdf');
    expect(pdf.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT);
    expect(await messageOf(pdf)).toBe(EXECUTIVE_BRIEF_MESSAGES.blocked);

    vi.mocked(reconcileExecutiveBrief).mockReturnValueOnce(blockedReconciliation());
    const pptx = await getRoute('/download/pptx');
    expect(pptx.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT);
  });

  it('still serves the report JSON and audit when the reconciliation fails, so the variance stays visible', async () => {
    vi.mocked(reconcileExecutiveBrief).mockReturnValueOnce(blockedReconciliation());
    const report = await getRoute('/report');
    expect(report.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
    const body = (await report.json()) as { data: { validationChecklist: { financialReconciliation: boolean } } };
    expect(body.data.validationChecklist.financialReconciliation).toBe(false);

    vi.mocked(reconcileExecutiveBrief).mockReturnValueOnce(blockedReconciliation());
    const audit = await getRoute('/audit');
    expect(audit.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.OK);
  });

  it('blocks regeneration with 409 and writes nothing to R2 when the reconciliation fails', async () => {
    vi.mocked(reconcileExecutiveBrief).mockReturnValueOnce(blockedReconciliation());
    const bucket = bucketDouble();
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/regenerate', {
        headers: { Authorization: `Bearer ${await adminToken()}` },
        body: '{}'
      }),
      testEnvironment({ OBJECTS: bucket }),
      briefUrl('/regenerate')
    );
    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.CONFLICT);
    expect(bucket.put).not.toHaveBeenCalled();
  });

  it('answers 500 with the request ID when publishing fails before any object is written', async () => {
    vi.mocked(publishExecutiveBriefArtifacts).mockRejectedValueOnce(new Error('publish failed'));
    const response = await handleExecutiveBriefRoute(
      briefRequest('POST', '/regenerate', {
        headers: { Authorization: `Bearer ${await adminToken()}` },
        body: '{}'
      }),
      testEnvironment(),
      briefUrl('/regenerate')
    );
    expect(response?.status).toBe(EXECUTIVE_BRIEF_HTTP_STATUS.INTERNAL_ERROR);
    const requestId = response?.headers.get('X-Request-Id') ?? '';
    expect(await messageOf(response as Response)).toBe(EXECUTIVE_BRIEF_MESSAGES.publishFailed(requestId));
  });
});
