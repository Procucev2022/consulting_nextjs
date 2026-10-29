import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Module1Ingestion } from '../../src/components/Module1Ingestion';
import { mockTenant } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type {
  Module1CanonicalViewModel,
  Module1IngestionProps,
  MonthWiseSummary,
  RawDocumentIngestion
} from '../../src/types';

const PRIMARY_FX_ROUTE = '/api/currency';
const PUBLIC_FX_ROUTE = 'https://open.er-api.com/v6/latest/USD';

type FetchResult = { ok: boolean; json: () => Promise<unknown> };

const fxResponse = (body: unknown, ok = true): Promise<FetchResult> =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

// Serves each FX request from a fixed route table. Unlisted URLs fail, so no request reaches the network.
const routeFetch = (routes: Record<string, () => Promise<FetchResult>>) =>
  vi.fn((input: string) => {
    const handler = routes[input];
    if (!handler) {
      return Promise.reject(new Error(`Unexpected request in test: ${input}`));
    }
    return handler();
  });

const buildDocument = (overrides: Partial<RawDocumentIngestion> = {}): RawDocumentIngestion => ({
  doc_id: 'DOC-M1-COVERAGE',
  file_name: 'coverage_multi_currency.xlsx',
  file_type: 'XLSX',
  file_size_mb: 1.2,
  ocr_status: 'Completed',
  progress: 100,
  uploaded_at: '2026-03-15',
  records_count: 50,
  detected_currencies: ['USD', 'EUR', 'INR'],
  converted_inr_crores: 12.5,
  ...overrides
});

const buildMonth = (overrides: Partial<MonthWiseSummary> = {}): MonthWiseSummary => ({
  month_key: '2023-04',
  month_label: 'Apr 2023',
  fiscal_year: 'FY24',
  spend_inr_cr: 4.5,
  po_count: 12,
  top_material_group: 'FERRO',
  top_plant: '1000',
  ...overrides
});

const buildCanonical = (overrides: Partial<Module1CanonicalViewModel> = {}): Module1CanonicalViewModel => ({
  datasetId: 'ds-m1-coverage',
  dataVersionId: 'dv-m1-coverage',
  analysisJobId: 'job-m1-coverage',
  sourceFileName: 'coverage_multi_currency.xlsx',
  sourceRowCount: 50,
  validRowCount: 50,
  excludedRowCount: 0,
  anomalyRowCount: 0,
  validFxNormalizedSpendInr: 125000000,
  validFxNormalizedSpendCr: 12.5,
  profileFxBaselineSpendInr: 125000000,
  profileFxBaselineSpendCr: 12.5,
  fxNormalizationImpactInr: 0,
  fxNormalizationImpactCr: 0,
  fxNormalizationImpactPct: 0,
  detectedCurrencies: ['INR'],
  currencyBreakdown: [],
  uniqueItems: 30,
  uniqueVendors: 6,
  materialGroups: 3,
  operatingPlants: 2,
  billingMonths: 12,
  configuredEvaluationWindow: 'Configured window: 12 billing months',
  actualDataCoverage: { billingMonthsCount: 12, dateRangeLabel: 'Apr 2023 – Mar 2024' },
  supplierSpend: [],
  materialGroupSpend: [],
  plantSpend: [],
  monthlySpend: [],
  reconciliationVarianceInr: 0,
  reconciliationStatus: 'RECONCILED',
  fxMasterVersion: 'coverage-v1',
  fxMasterChecksum: 'coverage-checksum',
  validationSummary: { cleanSpendYieldPct: 100 },
  moduleStatuses: { module1: 'COMPLETED', module2: 'PENDING', module3: 'PENDING', module4: 'PENDING' },
  ...overrides
});

// Waits until the expected FX requests have been made, then lets their promise chains finish inside act().
const settleFxRequests = async (feed: ReturnType<typeof routeFetch>, expectedCalls: number): Promise<void> => {
  await waitFor(() => {
    expect(feed).toHaveBeenCalledTimes(expectedCalls);
  });
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
};

const buildProps = (overrides: Partial<Module1IngestionProps> = {}): Module1IngestionProps => ({
  tenant: mockTenant,
  onUpdateTenant: vi.fn(),
  ingestionQueue: [buildDocument()],
  validationRecords: [],
  materialGroupSummaries: [],
  plantSummaries: [],
  monthWiseSummaries: [],
  onFixCurrency: vi.fn(),
  onMergeVendor: vi.fn(),
  onApplyBlanketFixes: vi.fn(),
  onResetValidationRecords: vi.fn(),
  onRunAICategorization: vi.fn(),
  onAddBatchUpload: vi.fn(),
  ...overrides
});

describe('Module1Ingestion coverage', () => {
  // The component fetches FX rates on mount. Each test waits for those requests to settle so that
  // state updates happen inside the test rather than after it finishes.
  let defaultFeed: ReturnType<typeof routeFetch>;

  beforeEach(() => {
    defaultFeed = routeFetch({});
    vi.stubGlobal('fetch', defaultFeed);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows live FX rates from the primary currency feed and uses the rate name in the tooltip', async () => {
    const primaryFeed = routeFetch({
      [PRIMARY_FX_ROUTE]: () =>
        fxResponse({
          data: {
            USD: { currentRate: 83.8, name: 'US Dollar' },
            EUR: { currentRate: 91.25 }
          }
        })
    });
    vi.stubGlobal('fetch', primaryFeed);

    render(<Module1Ingestion {...buildProps()} />);

    expect(await screen.findByText(/₹91\.25/)).toBeInTheDocument();
    expect(screen.getByTitle(/US Dollar/)).toBeInTheDocument();
    expect(primaryFeed).toHaveBeenCalledTimes(1);
  });

  it('uses the public exchange feed when the primary response has no data and derives cross rates from it', async () => {
    vi.stubGlobal(
      'fetch',
      routeFetch({
        [PRIMARY_FX_ROUTE]: () => fxResponse({}),
        [PUBLIC_FX_ROUTE]: () =>
          fxResponse({ rates: { INR: 84, EUR: 0.9, GBP: 0.8, AED: 3.6, JPY: 120, SGD: 1.2 } })
      })
    );

    render(<Module1Ingestion {...buildProps()} />);

    expect(await screen.findByText(/₹93\.33/)).toBeInTheDocument();
    expect(screen.getByText(/₹70\.00/)).toBeInTheDocument();
    expect(screen.getByText(/₹23\.33/)).toBeInTheDocument();
  });

  it('falls back to the default base rate and currency multipliers when the public feed omits them', async () => {
    const feed = routeFetch({
      [PRIMARY_FX_ROUTE]: () => fxResponse({}, false),
      [PUBLIC_FX_ROUTE]: () => fxResponse({ rates: {} })
    });
    vi.stubGlobal('fetch', feed);

    render(<Module1Ingestion {...buildProps()} />);

    // AED: 83.8 / 3.6725 (default multiplier) = 22.82.
    expect(await screen.findByText(/₹22\.82/)).toBeInTheDocument();
    expect(screen.getAllByText(/₹83\.80/).length).toBeGreaterThan(0);
  });

  it('keeps the rate panel empty when both FX feeds fail', async () => {
    const failingFeed = routeFetch({
      [PRIMARY_FX_ROUTE]: () => Promise.reject(new Error('primary feed unavailable')),
      [PUBLIC_FX_ROUTE]: () => Promise.reject(new Error('public feed unavailable'))
    });
    vi.stubGlobal('fetch', failingFeed);

    render(<Module1Ingestion {...buildProps()} />);

    await settleFxRequests(failingFeed, 2);
    expect(screen.queryByTitle(/live rate to INR/)).not.toBeInTheDocument();
  });

  it('ignores a primary response that arrives after the component has unmounted', async () => {
    let resolvePrimary: (value: FetchResult) => void = () => undefined;
    const pendingPrimary = new Promise<FetchResult>((resolve) => {
      resolvePrimary = resolve;
    });
    const lateFeed = routeFetch({
      [PRIMARY_FX_ROUTE]: () => pendingPrimary,
      [PUBLIC_FX_ROUTE]: () => fxResponse({ rates: {} })
    });
    vi.stubGlobal('fetch', lateFeed);

    const { unmount } = render(<Module1Ingestion {...buildProps()} />);
    unmount();

    await act(async () => {
      resolvePrimary({
        ok: true,
        json: () => Promise.resolve({ data: { USD: { currentRate: 83.8, name: 'US Dollar' } } })
      });
    });

    await settleFxRequests(lateFeed, 2);
  });

  it('shows the canonical fiscal coverage and actual billing range when a canonical view is supplied', async () => {
    render(
      <Module1Ingestion
        {...buildProps({
          canonicalViewModel: buildCanonical({
            periodMetadata: {
              minTransactionDate: 'Apr 2023',
              maxTransactionDate: 'Mar 2024',
              actualBillingMonths: 12,
              actualFiscalYears: ['FY24'],
              actualMonthKeys: ['2023-04'],
              fiscalMonthCoverage: 'FY24 coverage: 12 of 12 months',
              availableMonthsByFiscalYear: { FY24: 12 },
              missingMonthsByFiscalYear: {},
              hasMultiYearComparison: false,
              has36MonthCoverage: false
            }
          })
        })}
      />
    );
    await settleFxRequests(defaultFeed, 2);

    expect(screen.getAllByText(/FY24 coverage: 12 of 12 months/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Apr 2023 – Mar 2024/).length).toBeGreaterThan(0);
  });

  it('falls back to the configured evaluation window when the canonical view has no period metadata', async () => {
    render(<Module1Ingestion {...buildProps({ canonicalViewModel: buildCanonical() })} />);
    await settleFxRequests(defaultFeed, 2);

    expect(screen.getAllByText(/Configured window: 12 billing months/).length).toBeGreaterThan(0);
  });

  it('summarises monthly coverage from the month-wise summaries when no canonical view is available', async () => {
    render(
      <Module1Ingestion
        {...buildProps({
          monthWiseSummaries: [
            buildMonth({ month_key: '2023-04', month_label: 'Apr 2023' }),
            buildMonth({ month_key: '2024-03', month_label: 'Mar 2024', fiscal_year: 'FY24' })
          ]
        })}
      />
    );
    await settleFxRequests(defaultFeed, 2);

    expect(screen.getAllByText(/2 Billing Months \(Apr 2023 – Mar 2024\)/).length).toBeGreaterThan(0);
  });

  it('renders the dataset summary when only the refresh flag marks the workspace as active', async () => {
    render(
      <Module1Ingestion
        {...buildProps({
          ingestionQueue: [],
          validationRecords: [],
          isDataRefreshed: true
        })}
      />
    );
    await settleFxRequests(defaultFeed, 2);

    expect(screen.getByText(UI_STRINGS.documentSummary.heading)).toBeInTheDocument();
  });

  it('uses zero as the spend baseline when neither a document nor a tenant spend total is available', async () => {
    render(
      <Module1Ingestion
        {...buildProps({
          ingestionQueue: [],
          tenant: { ...mockTenant, total_spend_evaluated_inr: undefined }
        })}
      />
    );
    await settleFxRequests(defaultFeed, 2);

    expect(screen.getByText(UI_STRINGS.module1.noFileUploaded, { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.documentSummary.heading)).not.toBeInTheDocument();
  });
});
