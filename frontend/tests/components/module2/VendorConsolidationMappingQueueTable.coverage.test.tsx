import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { VendorConsolidationMappingQueueTable } from '../../../src/components/module2/VendorConsolidationMappingQueueTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { AUTH_STORAGE_KEYS } from '../../../src/constants/auth';
import { VENDOR_CONSOLIDATION_CONFIG, VENDOR_CONSOLIDATION_UI_CONFIG } from '../../../src/constants/module2VendorConsolidation';
import { logger } from '../../../src/utils/logger';
import { buildLogEntry, buildMappingEntry } from '../../fixtures/vendorConsolidation';

const strings = UI_STRINGS.module2VendorConsolidation;

const hydraulicValve = buildMappingEntry();
const pumpImpeller = buildMappingEntry({
  sourceMaterialId: 'MAT-002',
  sourceDescription: 'Centrifugal Pump Impeller',
  sourceCategory: 'Pumps',
  assignedUnspscCode: VENDOR_CONSOLIDATION_CONFIG.UNMAPPED_UNSPSC_CODE,
  reviewStatus: 'PROVISIONAL',
  reviewReason: undefined,
  transactionCount: 5,
  qualifyingSuppliersCount: 1
});
const exceptions = [hydraulicValve, pumpImpeller];

const searchInputFor = (): HTMLElement => screen.getByPlaceholderText(strings.mappingQueueSearchPlaceholder);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_TOKEN);
});

describe('VendorConsolidationMappingQueueTable search filter', () => {
  it('matches the search query against the source material identifier', () => {
    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={exceptions} />);

    fireEvent.change(searchInputFor(), { target: { value: 'mat-002' } });

    expect(screen.getByText('Centrifugal Pump Impeller')).toBeDefined();
    expect(screen.queryByText('Hydraulic Valve A1')).toBeNull();
  });

  it('matches the search query against the source description', () => {
    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={exceptions} />);

    fireEvent.change(searchInputFor(), { target: { value: 'impeller' } });

    expect(screen.getByText('Centrifugal Pump Impeller')).toBeDefined();
    expect(screen.queryByText('Hydraulic Valve A1')).toBeNull();
  });

  it('matches the search query against the source category', () => {
    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={exceptions} />);

    fireEvent.change(searchInputFor(), { target: { value: 'fluid' } });

    expect(screen.getByText('Hydraulic Valve A1')).toBeDefined();
    expect(screen.queryByText('Centrifugal Pump Impeller')).toBeNull();
  });

  it('matches the search query against the review reason and ignores entries without one', () => {
    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={exceptions} />);

    fireEvent.change(searchInputFor(), { target: { value: 'manufacturer' } });

    expect(screen.getByText('Hydraulic Valve A1')).toBeDefined();
    expect(screen.queryByText('Centrifugal Pump Impeller')).toBeNull();
  });

  it('keeps the pending count while showing no rows when nothing matches', () => {
    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={exceptions} />);

    fireEvent.change(searchInputFor(), { target: { value: 'zzz-no-match' } });

    expect(screen.queryByText('Hydraulic Valve A1')).toBeNull();
    expect(screen.queryByText('Centrifugal Pump Impeller')).toBeNull();
    expect(screen.getByText(strings.mappingQueuePendingCount(2))).toBeDefined();
  });

  it('shows placeholders for a missing material identifier and a missing review reason', () => {
    const sparse = buildMappingEntry({
      sourceMaterialId: '',
      sourceDescription: 'Unnamed component',
      reviewReason: undefined
    });
    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[sparse]} />);

    expect(screen.getByText(UI_STRINGS.common.notAvailable)).toBeDefined();
    expect(screen.getByText(strings.pendingReviewFallback)).toBeDefined();
  });
});

describe('VendorConsolidationMappingQueueTable approval', () => {
  it('requires a real UNSPSC commodity code for an unclassified entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[pumpImpeller]} />);
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe(strings.mappingCodeRequired);
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_TOKEN, 'stored-session-token');
    fireEvent.change(screen.getByLabelText(strings.mappingCodeInputLabel('MAT-002')), {
      target: { value: '12345678' }
    });
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_UPDATE_ENDPOINT);
    expect(JSON.parse(String(requestInit.body))).toEqual({
      assessmentId: 'A1',
      sourceMaterialId: 'MAT-002',
      unspscCode: '12345678',
      reviewStatus: VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_APPROVAL_STATUS,
      auditNotes: VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_APPROVAL_AUDIT_NOTE
    });
    expect(new Headers(requestInit.headers).get('Authorization')).toBe('Bearer stored-session-token');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: strings.btnApproveMapping })).toBeDefined();
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sends the assigned UNSPSC code and notifies the parent after a successful approval', async () => {
    const onUpdated = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[hydraulicValve]} onMappingUpdated={onUpdated} />);
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1);
    });
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toMatchObject({ unspscCode: hydraulicValve.assignedUnspscCode });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the saving state and disables the row while the request is in flight', async () => {
    let resolveResponse: (value: { ok: boolean; status: number }) => void = () => undefined;
    const pending = new Promise<{ ok: boolean; status: number }>((resolve) => {
      resolveResponse = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending));
    const onUpdated = vi.fn();

    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[hydraulicValve]} onMappingUpdated={onUpdated} />);
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    const savingButton = await screen.findByRole('button', { name: strings.btnSavingMapping });
    expect((savingButton as HTMLButtonElement).disabled).toBe(true);

    resolveResponse({ ok: true, status: 200 });
    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('button', { name: strings.btnApproveMapping })).toBeDefined();
  });

  it('shows a descriptive alert with the HTTP status and logs the rejection when the server refuses approval', async () => {
    const onUpdated = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const loggerErrorSpy = vi.spyOn(logger, 'error').mockReturnValue(buildLogEntry());

    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[hydraulicValve]} onMappingUpdated={onUpdated} />);
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText(strings.mappingApproveFailedHttp('MAT-001', 500))).toBeDefined();
    expect(onUpdated).not.toHaveBeenCalled();
    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.any(String), {
      sourceMaterialId: 'MAT-001',
      httpStatus: 500
    });
    expect(screen.getByRole('button', { name: strings.btnApproveMapping })).toBeDefined();
  });

  it('shows the network failure reason and logs the thrown error when the request fails', async () => {
    const failure = new Error('Connection reset by peer');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));
    const loggerErrorSpy = vi.spyOn(logger, 'error').mockReturnValue(buildLogEntry());

    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[hydraulicValve]} />);
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    expect(
      await screen.findByText(strings.mappingApproveFailedNetwork('MAT-001', 'Connection reset by peer'))
    ).toBeDefined();
    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.any(String), { sourceMaterialId: 'MAT-001' }, failure);
  });

  it('uses the generic unknown reason when the request rejects with a non-Error value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    vi.spyOn(logger, 'error').mockReturnValue(buildLogEntry());

    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[hydraulicValve]} />);
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    expect(
      await screen.findByText(
        strings.mappingApproveFailedNetwork('MAT-001', strings.mappingApproveUnknownReason)
      )
    ).toBeDefined();
  });

  it('clears the previous failure when the user retries and the retry succeeds', async () => {
    const onUpdated = vi.fn();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(logger, 'error').mockReturnValue(buildLogEntry());

    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={[hydraulicValve]} onMappingUpdated={onUpdated} />);
    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));
    expect(await screen.findByRole('alert')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));
    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('VendorConsolidationMappingQueueTable row limit', () => {
  it('shows at most the configured number of rows and a truncation notice for larger queues', () => {
    const rowLimit = VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_QUEUE_ROW_LIMIT;
    const totalRows = rowLimit + 5;
    const largeQueue = Array.from({ length: totalRows }, (_unused, index) =>
      buildMappingEntry({ sourceMaterialId: `MAT-${index + 1}`, sourceDescription: `Item ${index + 1}` })
    );
    render(<VendorConsolidationMappingQueueTable assessmentId="A1" exceptions={largeQueue} />);

    expect(screen.getByText(`MAT-${rowLimit}`)).toBeDefined();
    expect(screen.queryByText(`MAT-${rowLimit + 1}`)).toBeNull();
    expect(screen.getByText(strings.mappingQueueTruncationNotice(rowLimit, totalRows))).toBeDefined();
    expect(screen.getByText(strings.mappingQueuePendingCount(totalRows))).toBeDefined();
  });
});
