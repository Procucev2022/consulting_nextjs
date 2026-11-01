import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentSummaryView } from '../../src/components/DocumentSummaryView';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type {
  MaterialGroupSummary,
  Module1CanonicalViewModel,
  MonthWiseSummary,
  PlantSummary,
  RawDocumentIngestion,
  VgtPeriodMetadata
} from '../../src/types';

const documentSummary = UI_STRINGS.documentSummary;

const buildIngestion = (overrides: Partial<RawDocumentIngestion> = {}): RawDocumentIngestion => ({
  doc_id: 'DOC-COVERAGE-1',
  tenant_id: 'TNT-GLOBAL-8902',
  file_name: 'Coverage_Dataset.xlsx',
  file_type: 'XLSX',
  file_size_mb: 1.5,
  ocr_status: 'Completed',
  uploaded_at: '2026-08-24 09:14:22',
  records_count: 1000,
  detected_currencies: ['INR'],
  ...overrides
});

const buildCanonical = (overrides: Partial<Module1CanonicalViewModel> = {}): Module1CanonicalViewModel => ({
  datasetId: 'ds-doc-summary-coverage',
  dataVersionId: 'dv-doc-summary-coverage',
  analysisJobId: 'job-doc-summary-coverage',
  sourceFileName: 'Coverage_Dataset.xlsx',
  sourceRowCount: 1000,
  validRowCount: 990,
  excludedRowCount: 5,
  anomalyRowCount: 5,
  validFxNormalizedSpendInr: 850000000,
  validFxNormalizedSpendCr: 85,
  profileFxBaselineSpendInr: 850000000,
  profileFxBaselineSpendCr: 85,
  fxNormalizationImpactInr: 0,
  fxNormalizationImpactCr: 0,
  fxNormalizationImpactPct: 0,
  detectedCurrencies: ['INR'],
  currencyBreakdown: [],
  uniqueItems: 300,
  uniqueVendors: 40,
  materialGroups: 5,
  operatingPlants: 3,
  billingMonths: 12,
  configuredEvaluationWindow: '12 Billing Months',
  actualDataCoverage: { billingMonthsCount: 12, dateRangeLabel: 'Apr 2023 – Mar 2024' },
  supplierSpend: [],
  materialGroupSpend: [],
  plantSpend: [],
  monthlySpend: [],
  reconciliationVarianceInr: 0,
  reconciliationStatus: 'RECONCILED',
  fxMasterVersion: 'coverage-v1',
  fxMasterChecksum: 'coverage-checksum',
  validationSummary: {},
  moduleStatuses: { module1: 'COMPLETED', module2: 'PENDING', module3: 'PENDING', module4: 'PENDING' },
  ...overrides
});

const buildPeriod = (overrides: Partial<VgtPeriodMetadata> = {}): VgtPeriodMetadata => ({
  minTransactionDate: 'Apr 2023',
  maxTransactionDate: 'Mar 2024',
  actualBillingMonths: 12,
  actualFiscalYears: ['FY24'],
  actualMonthKeys: ['2023-04'],
  fiscalMonthCoverage: '12 of 12',
  availableMonthsByFiscalYear: { FY24: 12 },
  missingMonthsByFiscalYear: {},
  hasMultiYearComparison: false,
  has36MonthCoverage: false,
  ...overrides
});

const buildMaterialGroup = (overrides: Partial<MaterialGroupSummary> = {}): MaterialGroupSummary => ({
  group_code: 'FERRO',
  group_name: 'Ferro Alloys',
  primary_segment: '11101501',
  records_count: 520,
  unique_items_count: 85,
  unique_vendors_count: 4,
  spend_inr_cr: 250.5,
  spend_usd_m: 29.9,
  share_pct: 50,
  sample_item: 'FERRO NICKEL 10-14',
  fy24_spend_inr_cr: 80,
  fy25_spend_inr_cr: 90,
  fy26_spend_inr_cr: 80.5,
  ...overrides
});

const buildPlant = (overrides: Partial<PlantSummary> = {}): PlantSummary => ({
  plant_code: '1000',
  plant_name: 'Main Plant 1000',
  region: 'West',
  location: 'Khopoli, Maharashtra',
  records_count: 300,
  unique_items_count: 60,
  unique_vendors_count: 9,
  spend_inr_cr: 120,
  spend_usd_m: 14.3,
  share_pct: 40,
  ...overrides
});

const buildMonth = (overrides: Partial<MonthWiseSummary> = {}): MonthWiseSummary => ({
  month_key: '2023-04',
  month_label: 'Apr 2023',
  fiscal_year: 'FY24',
  spend_inr_cr: 220.5,
  spend_usd_m: 26.3,
  records_count: 1200,
  po_count: 310,
  unique_items_count: 450,
  unique_vendors_count: 95,
  top_material_group: 'FERRO',
  top_plant: '1000',
  mom_change_pct: 4.2,
  ...overrides
});

describe('DocumentSummaryView coverage', () => {
  it('derives unique counts, group and facility counts, and spend from the ingestion record', () => {
    render(
      <DocumentSummaryView
        ingestionQueue={[buildIngestion({ file_name: '', records_count: 1000, material_groups_count: 5, plants_count: 3 })]}
        materialGroupSummaries={[]}
        plantSummaries={[]}
      />
    );

    expect(screen.getAllByText('1,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText(documentSummary.uniqueItems).length).toBeGreaterThan(0);
    expect(screen.getAllByText(documentSummary.uniqueVendors).length).toBeGreaterThan(0);
    expect(screen.getAllByText(UI_STRINGS.common.notAvailable).length).toBeGreaterThan(0);
    expect(screen.getByText(documentSummary.dynamicGroupsCount(5))).toBeInTheDocument();
    expect(screen.getByText(documentSummary.dynamicFacilitiesCount(3))).toBeInTheDocument();
    expect(screen.queryByText(/₹0\.00/)).not.toBeInTheDocument();
  });

  it('preserves database zero counts and shows unavailable counts when no dataset is selected', () => {
    const { unmount } = render(
      <DocumentSummaryView ingestionQueue={[buildIngestion({ records_count: 0 })]} materialGroupSummaries={[]} />
    );
    expect(screen.getAllByText(UI_STRINGS.common.notAvailable).length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    unmount();

    render(<DocumentSummaryView />);
    expect(screen.getAllByText(UI_STRINGS.common.notAvailable).length).toBeGreaterThan(0);
  });

  it('shows the ERP-converted spend labels and the not-calculated FX status', () => {
    render(
      <DocumentSummaryView
        ingestionQueue={[buildIngestion({ converted_inr_crores: 85 })]}
        canonicalViewModel={buildCanonical({
          spendProvenance: 'ERP_CONVERTED',
          fxNormalizationImpactStatus: 'NOT_CALCULATED',
          fxNormalizationImpactCr: 0,
          isTestData: false
        })}
      />
    );

    expect(screen.getByText(documentSummary.erpConvertedSpend)).toBeInTheDocument();
    expect(screen.queryByText(documentSummary.validFxNormalizedSpend)).not.toBeInTheDocument();
    expect(screen.getByText(documentSummary.erpConvertedNormalizationNote)).toBeInTheDocument();
    expect(screen.getByText(documentSummary.fxNotCalculated)).toBeInTheDocument();
    expect(screen.getAllByText(/₹85\.00/).length).toBeGreaterThan(0);
  });

  it('shows the calculated FX impact for test data and the FX-normalised spend label', () => {
    render(
      <DocumentSummaryView
        ingestionQueue={[buildIngestion({ converted_inr_crores: 85 })]}
        canonicalViewModel={buildCanonical({
          spendProvenance: 'FX_MASTER_NORMALIZED',
          fxNormalizationImpactStatus: 'CALCULATED',
          fxNormalizationImpactCr: 153.5,
          isTestData: true
        })}
      />
    );

    expect(screen.getByText(documentSummary.validFxNormalizedSpend)).toBeInTheDocument();
    expect(screen.getByText(documentSummary.fxHistoricalNormalizationNote)).toBeInTheDocument();
    expect(screen.getAllByText(/153\.50/).length).toBeGreaterThan(0);
    expect(screen.queryByText(documentSummary.fxNotCalculated)).not.toBeInTheDocument();
  });

  it('shows the not-calculated FX state when no canonical view model is supplied', () => {
    render(<DocumentSummaryView ingestionQueue={[buildIngestion()]} />);

    expect(screen.getByText(documentSummary.fxNotCalculated)).toBeInTheDocument();
    expect(screen.getByText(documentSummary.validFxNormalizedSpend)).toBeInTheDocument();
  });

  it('renders the duplicate review banner only when suspected duplicate rows are positive', () => {
    const { unmount } = render(
      <DocumentSummaryView canonicalViewModel={buildCanonical({ suspectedDuplicateRowCount: 1280 })} />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(documentSummary.suspectedDuplicatesLabel)).toBeInTheDocument();
    expect(screen.getByText(documentSummary.suspectedDuplicatesNote(1280))).toBeInTheDocument();
    unmount();

    const { unmount: unmountZero } = render(
      <DocumentSummaryView canonicalViewModel={buildCanonical({ suspectedDuplicateRowCount: 0 })} />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    unmountZero();

    render(<DocumentSummaryView canonicalViewModel={buildCanonical()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the multi-year trend header when the period spans several fiscal years', () => {
    render(
      <DocumentSummaryView
        materialGroupSummaries={[buildMaterialGroup()]}
        periodMetadata={buildPeriod({
          hasMultiYearComparison: true,
          actualFiscalYears: ['FY24', 'FY25', 'FY26']
        })}
      />
    );

    expect(screen.getByText(documentSummary.materialGroup.headers.trend)).toBeInTheDocument();
    expect(screen.getByText('Ferro Alloys')).toBeInTheDocument();
  });

  it('shows a single-year coverage header from database period metadata only', () => {
    const { unmount } = render(
      <DocumentSummaryView
        materialGroupSummaries={[buildMaterialGroup()]}
        periodMetadata={buildPeriod({ actualFiscalYears: ['FY25'] })}
      />
    );
    expect(screen.getByText(documentSummary.materialGroup.headers.trendSingleFy('FY25'))).toBeInTheDocument();
    unmount();

    const { unmount: unmountEmpty } = render(
      <DocumentSummaryView
        materialGroupSummaries={[buildMaterialGroup()]}
        periodMetadata={buildPeriod({ actualFiscalYears: [] })}
      />
    );
    expect(screen.getByText(documentSummary.materialGroup.headers.trendSingleFy(UI_STRINGS.common.notAvailable))).toBeInTheDocument();
    unmountEmpty();

    render(<DocumentSummaryView materialGroupSummaries={[buildMaterialGroup()]} />);
    expect(screen.getByText(documentSummary.materialGroup.headers.trendSingleFy(UI_STRINGS.common.notAvailable))).toBeInTheDocument();
  });

  it('uses unavailable labels when material groups arrive without codes, names, or sample items', () => {
    render(
      <DocumentSummaryView
        materialGroupSummaries={[
          buildMaterialGroup({
            group_code: '',
            group_name: '',
            primary_segment: '',
            sample_item: '',
            spend_inr_cr: undefined,
            share_pct: undefined,
            fy24_spend_inr_cr: undefined,
            fy25_spend_inr_cr: undefined,
            fy26_spend_inr_cr: undefined
          })
        ]}
      />
    );

    expect(screen.getAllByText(UI_STRINGS.common.notAvailable).length).toBeGreaterThan(0);
  });

  it('uses unavailable plant identifiers and counts when D1 omits them', () => {
    render(
      <DocumentSummaryView
        plantSummaries={[
          buildPlant({
            plant_code: '',
            plant_name: '',
            records_count: undefined,
            unique_items_count: undefined,
            unique_vendors_count: undefined,
            spend_inr_cr: 10,
            share_pct: 5
          })
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: documentSummary.dimensionTabs.plant }));

    expect(screen.getAllByText(UI_STRINGS.common.notAvailable).length).toBeGreaterThan(0);
  });

  it('filters the month table by fiscal year and falls back to line item counts', () => {
    render(
      <DocumentSummaryView
        monthWiseSummaries={[
          buildMonth({
            month_key: '2023-04',
            month_label: 'Apr 2023',
            fiscal_year: 'FY24',
            records_count: undefined,
            line_items_count: undefined,
            unique_items_count: undefined,
            unique_vendors_count: undefined
          }),
          buildMonth({
            month_key: '2024-04',
            month_label: 'Apr 2024',
            fiscal_year: 'FY25',
            records_count: undefined,
            line_items_count: 400,
            unique_items_count: undefined,
            unique_vendors_count: undefined
          })
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: documentSummary.dimensionTabs.month }));
    expect(screen.getByRole('cell', { name: 'Apr 2023' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'FY25' }));
    expect(screen.queryByRole('cell', { name: 'Apr 2023' })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Apr 2024' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: documentSummary.month.allMonthsFilter(2) }));
    expect(screen.getByRole('cell', { name: 'Apr 2023' })).toBeInTheDocument();
  });
});
