/**
 * Unit Tests for EvidenceWorkbooksPanel Component (Prompt 305)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EvidenceWorkbooksPanel } from '../../../../src/components/admin/orchestration/EvidenceWorkbooksPanel';
import { buildPackageFilename } from '../../../../src/constants/evidenceDownload';
import { UI_STRINGS } from '../../../../src/constants';
import { evidenceApi } from '../../../../src/utils/evidenceApi';
import { apiClient } from '../../../../src/utils/api';
import { frontendLogger } from '../../../../src/utils/logger';

vi.mock('../../../../src/utils/evidenceApi', () => ({
  evidenceApi: {
    getInventory: vi.fn(),
    getParityValidation: vi.fn(),
    getWorkbookDownloadUrl: vi.fn((jobId: string, type: string) => `/api/evidence/jobs/${jobId}/workbooks/${type}/download`),
    getPackageDownloadUrl: vi.fn((jobId: string) => `/api/evidence/jobs/${jobId}/package/download`)
  }
}));

const JOB_ID = 'job-test-001';
const PANEL = UI_STRINGS.evidence.panel;
const PASS_PARITY = {
  jobId: JOB_ID,
  dataVersionId: 'DV-2',
  totalChecks: 4,
  passedChecks: 4,
  failedChecks: 0,
  overallStatus: 'PASS',
  evaluatedAt: '2026-10-04T12:00:00Z',
  discrepancies: [],
  checks: [{ kpi: 'Total Spend', uiValue: 7.5, evidenceValue: 7.5, sourceValue: 7.5, unit: 'INR Cr', variance: 0, status: 'PASS', tolerance: 0.0001, supportingSheet: '02_SUMMARY', notes: 'ok' }]
};
const INVENTORY_ITEMS = [
  {
    type: 'MODULE_1_EVIDENCE',
    filename: '01_Module_1_Evidence.xlsx',
    title: 'Module 1 — Spend Ingestion & Baseline Evidence',
    description: 'Spend baseline from the ledger.',
    sheetCount: 7,
    isAvailable: true,
    requiredRole: 'CUSTOMER_ANALYST'
  },
  {
    type: 'MODULE_2_EVIDENCE',
    filename: '02_Module_2_Evidence.xlsx',
    title: 'Module 2 — AI Categorization & Strategic Sourcing Evidence',
    description: 'Module 2 category and sourcing-lever detail is not persisted per analysis run in D1.',
    sheetCount: 0,
    isAvailable: false,
    requiredRole: 'CUSTOMER_ANALYST'
  }
];

const fakeResponse = (ok: boolean, status: number, body: unknown): Response => ({
  ok,
  status,
  headers: { get: (): null => null },
  json: async (): Promise<unknown> => body,
  blob: async (): Promise<Blob> => new Blob(['xlsx'])
}) as unknown as Response;

const renderPanel = (): ReturnType<typeof render> =>
  render(<EvidenceWorkbooksPanel jobId={JOB_ID} customerName="Alpha Textile" totalSpendCr={7.5} />);

describe('EvidenceWorkbooksPanel Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('tok-panel');
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    vi.mocked(evidenceApi.getInventory).mockResolvedValue({ success: true, jobId: JOB_ID, tenantId: 'TNT-1', items: INVENTORY_ITEMS as never });
    vi.mocked(evidenceApi.getParityValidation).mockResolvedValue({ success: true, parity: PASS_PARITY as never });
    URL.createObjectURL = vi.fn(() => 'blob:panel-1');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the panel title, the package download button, and the verified parity badge', async () => {
    renderPanel();

    expect(screen.getByTestId('evidence-workbooks-panel')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.evidence.title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.evidence.btnDownloadPackage)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.evidence.parityVerified)).toBeInTheDocument();
    });
    expect(screen.getByText(PANEL.passedOfTotal(4, 4))).toBeInTheDocument();
    expect(screen.getByText(PANEL.parityAuditTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.common.croreAmount('7.50'), { exact: false })).toBeInTheDocument();
  });

  it('renders authenticated download buttons instead of plain links, with unavailable workbooks disabled', async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByTestId('btn-download-workbook-MODULE_2_EVIDENCE')).toBeDisabled());
    expect(screen.getByTestId('btn-download-evidence-package')).toBeEnabled();
    expect(screen.getByTestId('btn-download-workbook-MODULE_1_EVIDENCE')).toBeEnabled();
    expect(screen.queryByRole('link', { name: /Download/i })).toBeNull();
    expect(screen.getByText(INVENTORY_ITEMS[1].description)).toBeInTheDocument();
    expect(screen.getByText(PANEL.unavailable)).toBeInTheDocument();
    expect(screen.getByText(PANEL.auditPass)).toBeInTheDocument();
    expect(screen.getByText(PANEL.sheetCount(7))).toBeInTheDocument();
  });

  it('downloads the package with the Bearer token and saves it from a Blob URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(true, 200, {}));
    vi.stubGlobal('fetch', fetchMock);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderPanel();

    fireEvent.click(screen.getByTestId('btn-download-evidence-package'));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    const [requestedUrl, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(requestedUrl).toBe(`/api/evidence/jobs/${JOB_ID}/package/download`);
    expect(headers.get('Authorization')).toBe('Bearer tok-panel');
    expect(headers.get('x-request-id')).toMatch(/^[A-Za-z0-9._:-]+$/u);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(buildPackageFilename(JOB_ID)).toBe(`Complete_Analysis_Evidence_Package_${JOB_ID}.zip`);
  });

  it('downloads an individual workbook through the same authenticated path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(true, 200, {}));
    vi.stubGlobal('fetch', fetchMock);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderPanel();

    fireEvent.click(await screen.findByTestId('btn-download-workbook-MODULE_1_EVIDENCE'));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/evidence/jobs/${JOB_ID}/workbooks/MODULE_1_EVIDENCE/download`);
    expect(evidenceApi.getWorkbookDownloadUrl).toHaveBeenCalledWith(JOB_ID, 'MODULE_1_EVIDENCE');
  });

  it('shows the server reason in an alert when a download is refused, and saves nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse(false, 409, {
      message: 'Evidence workbook is unavailable for job job-test-001. No rows.',
      requestId: 'req-panel-1'
    })));
    renderPanel();

    fireEvent.click(screen.getByTestId('btn-download-evidence-package'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(UI_STRINGS.evidence.downloadFailure.httpFailure(
      'Complete_Analysis_Evidence_Package_job-test-001.zip',
      409,
      'Evidence workbook is unavailable for job job-test-001. No rows.',
      'req-panel-1'
    ));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('reports a discrepancy instead of verified when the parity check fails', async () => {
    vi.mocked(evidenceApi.getParityValidation).mockResolvedValueOnce({
      success: true,
      parity: { ...PASS_PARITY, overallStatus: 'FAIL', passedChecks: 3, failedChecks: 1, variance: undefined } as never
    });
    renderPanel();

    expect(await screen.findByText(UI_STRINGS.evidence.parityDiscrepancy)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.evidence.parityVerified)).toBeNull();
    expect(screen.getByText(PANEL.passedOfTotal(3, 4))).toBeInTheDocument();
  });

  it('shows the parity as not evaluated and keeps the panel usable when the parity request fails', async () => {
    vi.mocked(evidenceApi.getParityValidation).mockRejectedValueOnce(new Error('network down'));
    renderPanel();

    expect(await screen.findByText(UI_STRINGS.evidence.parityDiscrepancy)).toBeInTheDocument();
    expect(screen.getByText(PANEL.notEvaluated)).toBeInTheDocument();
    expect(screen.getByTestId('btn-download-evidence-package')).toBeEnabled();
  });

  it('keeps the static inventory when the inventory request is not successful', async () => {
    vi.mocked(evidenceApi.getInventory).mockResolvedValueOnce({ success: false, jobId: JOB_ID, tenantId: '', items: [] });
    renderPanel();

    await waitFor(() => expect(screen.getByTestId('btn-download-workbook-MODULE_1_EVIDENCE')).toBeEnabled());
    expect(screen.queryByTestId('btn-download-workbook-MODULE_2_EVIDENCE')).toBeInTheDocument();
  });
});
