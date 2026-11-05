import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { VendorConsolidationView } from '../../../src/components/module2/VendorConsolidationView';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { Module2StrategicSourcingApi } from '../../../src/utils/module2StrategicSourcingApi';
import { logger } from '../../../src/utils/logger';
import type { VendorConsolidationResult } from '../../../src/types/module2VendorConsolidation';
import {
  buildCategoryProfile,
  buildLogEntry,
  buildMappingEntry,
  buildVendorConsolidationResult
} from '../../fixtures/vendorConsolidation';

const strings = UI_STRINGS.module2VendorConsolidation;
const ASSESSMENT_ID = 'TEST-ASSESSMENT-001';

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const mockConsolidationLoad = (result: VendorConsolidationResult | null = buildVendorConsolidationResult()) =>
  vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockResolvedValue(result);

const renderLoadedView = async (
  onBackToOverview?: () => void,
  result: VendorConsolidationResult = buildVendorConsolidationResult()
): Promise<void> => {
  mockConsolidationLoad(result);
  render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} onBackToOverview={onBackToOverview} />);
  await screen.findByText(strings.dimensionUnspsc);
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('VendorConsolidationView loading and header', () => {
  it('shows the loading message until the consolidation data arrives', async () => {
    let resolveLoad: (value: VendorConsolidationResult | null) => void = () => undefined;
    const pending = new Promise<VendorConsolidationResult | null>((resolve) => {
      resolveLoad = resolve;
    });
    vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockReturnValue(pending);

    render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);
    expect(screen.getByText(strings.loadingBaseline)).toBeDefined();

    resolveLoad(buildVendorConsolidationResult());
    await screen.findByText(strings.dimensionUnspsc);
    expect(screen.queryByText(strings.loadingBaseline)).toBeNull();
  });

  it('renders the header copy and omits the overview control when no handler is supplied', async () => {
    await renderLoadedView();

    expect(screen.getByText(strings.badge)).toBeDefined();
    expect(screen.getByText(strings.headerFlow)).toBeDefined();
    expect(screen.getByText(strings.certificationNotice)).toBeDefined();
    expect(screen.getByText(strings.btnDownloadExcel)).toBeDefined();
    expect(screen.getByRole('button', { name: strings.ariaRefreshData })).toBeDefined();
    expect(screen.queryByText(strings.btnBackToOverview)).toBeNull();
  });

  it('calls the overview handler from the header control', async () => {
    const onBackToOverview = vi.fn();
    await renderLoadedView(onBackToOverview);

    fireEvent.click(screen.getByText(strings.btnBackToOverview));
    expect(onBackToOverview).toHaveBeenCalledTimes(1);
  });

  it('hides a previous assessment result and ignores its slow response after switching assessments', async () => {
    const olderRequest = createDeferred<VendorConsolidationResult | null>();
    const currentResult = buildVendorConsolidationResult({
      categories: [buildCategoryProfile({ spendCategory: 'Current Assessment Category' })]
    });
    vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockImplementation((assessmentId) =>
      assessmentId === ASSESSMENT_ID ? olderRequest.promise : Promise.resolve(currentResult)
    );
    const view = render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);

    view.rerender(<VendorConsolidationView assessmentId="CURRENT-ASSESSMENT-002" />);
    expect(await screen.findByText('Current Assessment Category')).toBeDefined();

    await act(async () => {
      olderRequest.resolve(buildVendorConsolidationResult({
        categories: [buildCategoryProfile({ spendCategory: 'Stale Assessment Category' })]
      }));
    });

    expect(screen.getByText('Current Assessment Category')).toBeDefined();
    expect(screen.queryByText('Stale Assessment Category')).toBeNull();
  });

  it('ignores a late failure from the previous assessment after the current request succeeds', async () => {
    const olderRequest = createDeferred<VendorConsolidationResult | null>();
    const errorSpy = vi.spyOn(logger, 'error').mockReturnValue(buildLogEntry());
    vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockImplementation((assessmentId) =>
      assessmentId === ASSESSMENT_ID ? olderRequest.promise : Promise.resolve(buildVendorConsolidationResult())
    );
    const view = render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);

    view.rerender(<VendorConsolidationView assessmentId="CURRENT-ASSESSMENT-002" />);
    await screen.findByText(strings.dimensionUnspsc);
    await act(async () => {
      olderRequest.reject(new Error('Old assessment service failure'));
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(screen.queryByText('Old assessment service failure')).toBeNull();
  });
});

describe('VendorConsolidationView failure states', () => {
  it('shows the no-data cause and logs a warning when the API returns no payload', async () => {
    mockConsolidationLoad(null);
    const warnSpy = vi.spyOn(logger, 'warn').mockReturnValue(buildLogEntry());

    render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText(strings.loadFailedTitle)).toBeDefined();
    expect(screen.getByText(strings.loadFailedNoPayloadCause)).toBeDefined();
    expect(screen.getByText(strings.loadFailedNextSteps)).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), {
      assessmentId: ASSESSMENT_ID,
      userMessage: strings.loadFailedNoPayloadCause
    });
  });

  it('shows the thrown error message as the cause and logs the error', async () => {
    const failure = new Error('Upstream consolidation service timed out');
    vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockRejectedValueOnce(failure);
    const errorSpy = vi.spyOn(logger, 'error').mockReturnValue(buildLogEntry());

    render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText('Upstream consolidation service timed out')).toBeDefined();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.any(String),
      { assessmentId: ASSESSMENT_ID, userMessage: 'Upstream consolidation service timed out' },
      failure
    );
  });

  it('uses the generic unknown cause when the failure is not an Error instance', async () => {
    vi.spyOn(Module2StrategicSourcingApi, 'getVendorConsolidation').mockRejectedValueOnce('gateway unavailable');
    const errorSpy = vi.spyOn(logger, 'error').mockReturnValue(buildLogEntry());

    render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);

    expect(await screen.findByText(strings.loadFailedUnknownCause)).toBeDefined();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.any(String),
      { assessmentId: ASSESSMENT_ID, userMessage: strings.loadFailedUnknownCause },
      'gateway unavailable'
    );
  });

  it('reloads the data from the refresh control', async () => {
    const loadSpy = mockConsolidationLoad();
    render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByText(strings.dimensionUnspsc);

    fireEvent.click(screen.getByRole('button', { name: strings.ariaRefreshData }));

    await waitFor(() => {
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });
    await screen.findByText(strings.dimensionUnspsc);
    expect(loadSpy).toHaveBeenCalledWith(ASSESSMENT_ID);
  });
});

describe('VendorConsolidationView dimensions', () => {
  it('lists the source group categories and drills from them into supplier analysis', async () => {
    const sourceGroup = buildCategoryProfile({
      spendCategory: 'Chemicals',
      unspscCode: '12131708',
      unspscCategory: 'Industrial Acids'
    });
    await renderLoadedView(undefined, buildVendorConsolidationResult({ sourceGroupCategories: [sourceGroup] }));

    fireEvent.click(screen.getByText(strings.dimensionSourceGroup));
    expect(screen.getByText('Chemicals')).toBeDefined();

    fireEvent.click(screen.getByText(strings.btnAnalyse));
    expect(screen.getByText(strings.categoryDrilldownTitle('Chemicals'))).toBeDefined();
  });

  it('shows the empty table when the payload has no source group categories', async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.dimensionSourceGroup));
    expect(screen.getByText(strings.noRecordsFound)).toBeDefined();
  });

  it('lists enterprise material opportunities and returns to the UNSPSC hierarchy', async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.tabMaterialAnalysis));
    expect(screen.getByText(strings.materialDrilldownTitle(strings.allEnterpriseCategories))).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToSuppliers }));
    expect(screen.getByText(buildCategoryProfile().spendCategory)).toBeDefined();
  });

  it('returns from enterprise transactions to the enterprise material view when no category is selected', async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.tabMaterialAnalysis));
    fireEvent.click(screen.getByText(strings.btnDrillDownTxs));
    expect(screen.getByText(strings.transactionDrilldownTitle('MAT-BOX-01'))).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToMaterials }));
    expect(screen.getByText(strings.materialDrilldownTitle(strings.allEnterpriseCategories))).toBeDefined();
  });

  it('switches back to the UNSPSC hierarchy from another dimension', async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.dimensionMappingQueue));
    expect(screen.getByText(strings.mappingQueuePendingCount(0))).toBeDefined();

    fireEvent.click(screen.getByText(strings.dimensionUnspsc));
    expect(screen.getByText(buildCategoryProfile().spendCategory)).toBeDefined();
    expect(screen.queryByText(strings.mappingQueuePendingCount(0))).toBeNull();
  });

  it('shows the mapping exceptions queue as empty when the payload omits exceptions', async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.dimensionMappingQueue));
    expect(screen.getByText(strings.mappingQueuePendingCount(0))).toBeDefined();
  });

  it('approves a mapping from the exceptions queue and reloads the consolidation data', async () => {
    const loadSpy = mockConsolidationLoad(
      buildVendorConsolidationResult({ mappingExceptions: [buildMappingEntry()] })
    );
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    render(<VendorConsolidationView assessmentId={ASSESSMENT_ID} />);
    await screen.findByText(strings.dimensionUnspsc);

    fireEvent.click(screen.getByText(strings.dimensionMappingQueue));
    expect(screen.getByText('Hydraulic Valve A1')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.btnApproveMapping }));

    await waitFor(() => {
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await screen.findByText(strings.mappingQueuePendingCount(1));
    expect(screen.getByText('Hydraulic Valve A1')).toBeDefined();
  });
});

describe('VendorConsolidationView drill-down navigation', () => {
  it('drills from categories to suppliers, materials, and transactions and back again', async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.btnAnalyse));
    expect(screen.getByText('Beta Packaging')).toBeDefined();

    fireEvent.click(screen.getByText(strings.btnViewCategoryMaterials));
    expect(screen.getByText(strings.materialDrilldownTitle('Packaging'))).toBeDefined();

    fireEvent.click(screen.getByText(strings.btnDrillDownTxs));
    expect(screen.getByText(strings.transactionDrilldownTitle('MAT-BOX-01'))).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToMaterials }));
    expect(screen.getByText(strings.materialDrilldownTitle('Packaging'))).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToSuppliers }));
    expect(screen.getByText('Beta Packaging')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToCategories }));
    expect(screen.getByRole('button', { name: strings.btnAnalyse })).toBeDefined();
  });

  it('returns to the enterprise material view after drilling into a category and then transactions', async () => {
    // Regression: after a category drill-down is left, the stale category must not
    // redirect transaction navigation that started from the enterprise material view.
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.btnAnalyse));
    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToCategories }));

    fireEvent.click(screen.getByText(strings.tabMaterialAnalysis));
    fireEvent.click(screen.getByText(strings.btnDrillDownTxs));
    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToMaterials }));

    expect(screen.getByText(strings.materialDrilldownTitle(strings.allEnterpriseCategories))).toBeDefined();
    expect(screen.queryByText(strings.materialDrilldownTitle('Packaging'))).toBeNull();
  });

  it('navigates back from the category-level materials to the supplier list', async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByText(strings.btnAnalyse));
    fireEvent.click(screen.getByText(strings.btnViewCategoryMaterials));
    fireEvent.click(screen.getByRole('button', { name: strings.ariaBackToSuppliers }));

    expect(screen.getByText('Beta Packaging')).toBeDefined();
  });
});
