import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Module1Ingestion } from '../../src/components/Module1Ingestion';
import { mockTenant } from '../fixtures/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { apiClient } from '../../src/utils/api';
import type {
  Module1CanonicalViewModel,
  Module1IngestionProps,
  MonthWiseSummary,
  RawDocumentIngestion
} from '../../src/types';

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
const settleFxRequests = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
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
  beforeEach(() => {
    vi.spyOn(apiClient, 'getCurrencyRates').mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows live FX rates from the primary currency feed and uses the rate name in the tooltip', async () => {
    const primaryFeed = vi.mocked(apiClient.getCurrencyRates).mockResolvedValue({
      USD: { currencyCode: 'USD', currentRate: 83.8, name: 'US Dollar' },
      EUR: { currencyCode: 'EUR', currentRate: 91.25, name: 'Euro' }
    });

    render(<Module1Ingestion {...buildProps()} />);

    expect(await screen.findByText(/₹91\.25/)).toBeInTheDocument();
    expect(screen.getByTitle(/US Dollar/)).toBeInTheDocument();
    expect(primaryFeed).toHaveBeenCalledTimes(1);
  });

  it('keeps rates unavailable when D1 has no data and does not query another source', async () => {
    const primaryFeed = vi.mocked(apiClient.getCurrencyRates).mockResolvedValue({});

    render(<Module1Ingestion {...buildProps()} />);

    expect(await screen.findByText(UI_STRINGS.module1.fxReferenceUnavailable)).toBeInTheDocument();
    expect(primaryFeed).toHaveBeenCalledTimes(1);
  });

  it('does not render an empty INR-only FX response as a populated feed', async () => {
    vi.mocked(apiClient.getCurrencyRates).mockResolvedValue({
      INR: { currencyCode: 'INR', currentRate: 1, name: 'Indian Rupee' }
    });

    render(<Module1Ingestion {...buildProps()} />);

    expect(await screen.findByText(UI_STRINGS.module1.fxReferenceUnavailable)).toBeInTheDocument();
  });

  it('does not invent default currency rates when the D1 request fails', async () => {
    const feed = vi.mocked(apiClient.getCurrencyRates).mockRejectedValue(new Error(UI_STRINGS.module1.fxReferenceRequestFailed(503)));

    render(<Module1Ingestion {...buildProps()} />);

    expect(await screen.findByText(UI_STRINGS.module1.fxReferenceUnavailable)).toBeInTheDocument();
    expect(feed).toHaveBeenCalledTimes(1);
  });

  it('shows the unavailable state when the D1 currency feed fails', async () => {
    const failingFeed = vi.mocked(apiClient.getCurrencyRates).mockRejectedValue(new Error('D1 currency endpoint unavailable'));

    render(<Module1Ingestion {...buildProps()} />);

    await settleFxRequests();
    expect(screen.getByText(UI_STRINGS.module1.fxReferenceUnavailable)).toBeInTheDocument();
    expect(screen.queryByTitle(/live rate to INR/)).not.toBeInTheDocument();
  });

  it('ignores a primary response that arrives after the component has unmounted', async () => {
    let resolvePrimary: (value: Record<string, { currencyCode: string; currentRate: number; name: string }>) => void = () => undefined;
    const pendingPrimary = new Promise<Record<string, { currencyCode: string; currentRate: number; name: string }>>((resolve) => {
      resolvePrimary = resolve;
    });
    const lateFeed = vi.mocked(apiClient.getCurrencyRates).mockReturnValue(pendingPrimary);

    const { unmount } = render(<Module1Ingestion {...buildProps()} />);
    unmount();

    await act(async () => {
      resolvePrimary({ USD: { currencyCode: 'USD', currentRate: 83.8, name: 'US Dollar' } });
    });

    await settleFxRequests();
    expect(lateFeed).toHaveBeenCalledTimes(1);
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
    await settleFxRequests();

    expect(screen.getAllByText(/FY24 coverage: 12 of 12 months/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Apr 2023 – Mar 2024/).length).toBeGreaterThan(0);
  });

  it('falls back to the configured evaluation window when the canonical view has no period metadata', async () => {
    render(<Module1Ingestion {...buildProps({ canonicalViewModel: buildCanonical() })} />);
    await settleFxRequests();

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
    await settleFxRequests();

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
    await settleFxRequests();

    expect(screen.getByText(UI_STRINGS.documentSummary.heading)).toBeInTheDocument();
  });

  it('renders the active dataset summary for D1-provided raw upload rows', async () => {
    render(
      <Module1Ingestion
        {...buildProps({ ingestionQueue: [], validationRecords: [], isDataRefreshed: false })}
        rawUploadRecords={[{ record_id: 'RAW-D1-1' }]}
      />
    );
    await settleFxRequests();

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
    await settleFxRequests();

    expect(screen.getByText(UI_STRINGS.module1.noFileUploaded, { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.documentSummary.heading)).not.toBeInTheDocument();
  });
});
