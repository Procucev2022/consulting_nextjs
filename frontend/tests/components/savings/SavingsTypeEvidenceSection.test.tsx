import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SavingsTypeEvidenceSection } from '../../../src/components/savings/SavingsTypeEvidenceSection';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { SAVINGS_TYPES_INVENTORY, SAVINGS_TYPE_FILENAMES } from '../../../src/constants';
import { frontendLogger } from '../../../src/utils/logger';
import { evidenceApi } from '../../../src/utils/evidenceApi';
import { apiClient } from '../../../src/utils/api';

const fakeResponse = (ok: boolean, status: number, body: unknown): Response => ({
  ok,
  status,
  headers: { get: (): null => null },
  json: async (): Promise<unknown> => body,
  blob: async (): Promise<Blob> => new Blob(['xlsx'])
}) as unknown as Response;

const VENDOR_TYPE = 'VENDOR_CONSOLIDATION';
const VENDOR_ITEM = SAVINGS_TYPES_INVENTORY.find((item) => item.savingsType === VENDOR_TYPE);

describe('SavingsTypeEvidenceSection Component (Prompt 306)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('tok-savings');
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
    URL.createObjectURL = vi.fn(() => 'blob:savings-1');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders Level 1 comprehensive CTA and all 7 canonical savings type cards', () => {
    render(<SavingsTypeEvidenceSection jobId="job-test-101" className="custom-class" />);

    expect(screen.getByTestId('savings-type-evidence-section')).toHaveClass('custom-class');
    expect(screen.getByTestId('btn-download-savings-engine-evidence')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.evidence.savingsTypes.moduleBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.evidence.savingsTypes.canonicalTypesCount(SAVINGS_TYPES_INVENTORY.length))).toBeInTheDocument();

    const expectedTypes = [
      'VENDOR_CONSOLIDATION',
      'BENCHMARK_PRICE_GAP',
      'STRATEGIC_SOURCING',
      'STRATEGIC_MARKET_VALUE',
      'PROCESS_PRODUCTIVITY',
      'COST_AVOIDANCE_RISK',
      'REALIZED_SAVINGS'
    ];

    for (const type of expectedTypes) {
      expect(screen.getByTestId(`evidence-card-${type}`)).toBeInTheDocument();
      expect(screen.getByTestId(`btn-view-details-${type}`)).toBeInTheDocument();
      expect(screen.getByTestId(`btn-download-evidence-${type}`)).toBeInTheDocument();
    }
  });

  it('opens details modal when View Details is clicked and closes it', async () => {
    const onViewDetails = vi.fn();
    render(<SavingsTypeEvidenceSection jobId="job-test-101" onViewDetails={onViewDetails} />);

    const viewBtn = screen.getByTestId(`btn-view-details-${VENDOR_TYPE}`);
    fireEvent.click(viewBtn);

    expect(onViewDetails).toHaveBeenCalledWith(VENDOR_TYPE);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(VENDOR_ITEM?.title ?? '');

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('downloads the comprehensive workbook with the Bearer token', async () => {
    const spy = vi.spyOn(evidenceApi, 'getWorkbookDownloadUrl');
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(true, 200, {}));
    vi.stubGlobal('fetch', fetchMock);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<SavingsTypeEvidenceSection jobId="job-test-101" />);

    fireEvent.click(screen.getByTestId('btn-download-savings-engine-evidence'));

    await waitFor(() => expect(clickSpy).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith('job-test-101', 'SAVINGS_ENGINE_EVIDENCE');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/evidence/jobs/job-test-101/workbooks/SAVINGS_ENGINE_EVIDENCE/download',
      { headers: { Authorization: 'Bearer tok-savings' } }
    );
  });

  it('downloads a savings type workbook through the authenticated savings endpoint', async () => {
    const spy = vi.spyOn(evidenceApi, 'getSavingsTypeDownloadUrl');
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(true, 200, {}));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<SavingsTypeEvidenceSection jobId="job-test-101" />);

    fireEvent.click(screen.getByTestId('btn-download-evidence-BENCHMARK_PRICE_GAP'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith('job-test-101', 'BENCHMARK_PRICE_GAP');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/evidence/jobs/job-test-101/savings/BENCHMARK_PRICE_GAP/download');
  });

  it('shows the reason and keeps the buttons enabled after a savings download is refused', async () => {
    const reason = 'Vendor Consolidation & Tail Rationalization (OPP-001) cannot be produced from D1 for this job.';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeResponse(false, 409, { message: reason, requestId: 'req-sav-1' })));
    render(<SavingsTypeEvidenceSection jobId="job-test-101" />);

    fireEvent.click(screen.getByTestId(`btn-download-evidence-${VENDOR_TYPE}`));

    const alert = await screen.findByTestId('savings-evidence-download-error');
    expect(alert).toHaveTextContent(UI_STRINGS.evidence.downloadFailure.httpFailure(
      SAVINGS_TYPE_FILENAMES.VENDOR_CONSOLIDATION,
      409,
      reason,
      'req-sav-1'
    ));
    expect(screen.getByTestId(`btn-download-evidence-${VENDOR_TYPE}`)).toBeEnabled();
    expect(UI_STRINGS.evidence.savingsTypes.btnEvidenceExcel).toBeTruthy();
  });

  it('disables every download button while one savings download is in flight', async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; })));
    render(<SavingsTypeEvidenceSection jobId="job-test-101" />);

    fireEvent.click(screen.getByTestId('btn-download-savings-engine-evidence'));

    expect(screen.getByTestId('btn-download-savings-engine-evidence')).toBeDisabled();
    expect(screen.getByTestId(`btn-download-evidence-${VENDOR_TYPE}`)).toBeDisabled();

    await act(async () => {
      resolveFetch(fakeResponse(false, 500, { message: 'Server stopped' }));
    });
    expect(await screen.findByTestId('savings-evidence-download-error')).toHaveTextContent('Server stopped');
  });
});
