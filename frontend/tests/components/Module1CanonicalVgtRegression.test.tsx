import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineBar } from '../../src/components/PipelineBar';
import { Module1Ingestion } from '../../src/components/Module1Ingestion';
import { Header } from '../../src/components/Header';
import type { Module1CanonicalViewModel } from '../../src/types';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('Module 1 Customer Screen & VGT Canonical Acceptance Test (Prompt 329)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const vgtCanonicalResponse: Module1CanonicalViewModel = {
    datasetId: 'vgt-testing-dataset',
    dataVersionId: 'vgt-data-version-v2',
    analysisJobId: 'job-vgt-analysis-001',
    sourceFileName: 'VGT Testing Data.xlsx',
    sourceRowCount: 20505,
    validRowCount: 20241,
    excludedRowCount: 252,
    anomalyRowCount: 12,
    validFxNormalizedSpendInr: 407383070000,
    validFxNormalizedSpendCr: 4073.83,
    profileFxBaselineSpendInr: 392032770000,
    profileFxBaselineSpendCr: 3920.33,
    fxNormalizationImpactInr: 15350300000,
    fxNormalizationImpactCr: 153.50,
    fxNormalizationImpactPct: 3.91,
    detectedCurrencies: ['INR', 'USD', 'EUR', 'CNY'],
    currencyBreakdown: [
      { currency: 'INR', transactionCount: 19890, historicalSpendInr: 398687700000, historicalSpendCr: 3986.88, profileSpendInr: 398687700000, profileSpendCr: 3986.88, fxImpactInr: 0, fxImpactCr: 0, fxImpactPct: 0 },
      { currency: 'USD', transactionCount: 284, historicalSpendInr: 7277700000, historicalSpendCr: 72.78, profileSpendInr: 5937400000, profileSpendCr: 59.37, fxImpactInr: 1340300000, fxImpactCr: 13.40, fxImpactPct: 22.57 },
      { currency: 'EUR', transactionCount: 65, historicalSpendInr: 1391900000, historicalSpendCr: 13.92, profileSpendInr: 1381900000, profileSpendCr: 13.82, fxImpactInr: 10000000, fxImpactCr: 0.10, fxImpactPct: 0.72 },
      { currency: 'CNY', transactionCount: 2, historicalSpendInr: 25800000, historicalSpendCr: 0.26, profileSpendInr: 25800000, profileSpendCr: 0.26, fxImpactInr: 0, fxImpactCr: 0, fxImpactPct: 0 }
    ],
    uniqueItems: 9566,
    uniqueVendors: 377,
    materialGroups: 15,
    operatingPlants: 20,
    billingMonths: 10,
    configuredEvaluationWindow: '36 Months (FY24 - FY26)',
    actualDataCoverage: {
      billingMonthsCount: 10,
      firstTransactionDate: '2024-04-01',
      lastTransactionDate: '2025-01-31',
      dateRangeLabel: 'Apr 2024 – Jan 2025'
    },
    supplierSpend: [
      { supplier_name: 'VGT TOP SUPPLIER 1', spend_inr_cr: 1200.50, records_count: 500, unique_items_count: 50, share_pct: 29.47, cumulative_share_pct: 29.47, in_pareto_80: true },
      { supplier_name: 'VGT TOP SUPPLIER 2', spend_inr_cr: 800.00, records_count: 400, unique_items_count: 40, share_pct: 19.64, cumulative_share_pct: 49.11, in_pareto_80: true },
      { supplier_name: 'VGT OTHER SUPPLIERS', spend_inr_cr: 2073.33, records_count: 19341, unique_items_count: 9476, share_pct: 50.89, cumulative_share_pct: 100.00, in_pareto_80: false }
    ],
    materialGroupSpend: [
      { group_code: 'MG-01', group_name: 'Chemical Raw Materials', records_count: 10000, unique_items_count: 4500, unique_vendors_count: 150, po_count: 1800, spend_inr_cr: 2500.00, spend_usd_m: 298.33, share_pct: 61.37, sample_item: 'Industrial Solvent', primary_segment: 'Direct Material', color: '#0284c7', fy24_spend_inr_cr: 800, fy25_spend_inr_cr: 900, fy26_spend_inr_cr: 800 },
      { group_code: 'MG-02', group_name: 'Packaging & Drums', records_count: 10241, unique_items_count: 5066, unique_vendors_count: 227, po_count: 2000, spend_inr_cr: 1573.83, spend_usd_m: 187.81, share_pct: 38.63, sample_item: 'Steel Drum', primary_segment: 'Packaging', color: '#059669', fy24_spend_inr_cr: 500, fy25_spend_inr_cr: 550, fy26_spend_inr_cr: 523.83 }
    ],
    plantSpend: [
      { plant_code: '1000', plant_name: 'Main Chemical Plant', records_count: 15000, unique_items_count: 7000, unique_vendors_count: 300, spend_inr_cr: 3000.00, share_pct: 73.64 },
      { plant_code: '2000', plant_name: 'Packaging Facility', records_count: 5241, unique_items_count: 2566, unique_vendors_count: 77, spend_inr_cr: 1073.83, share_pct: 26.36 }
    ],
    monthlySpend: [
      { month_key: '2024-04', month_label: 'Apr 2024', records_count: 2000, unique_items_count: 1000, unique_vendors_count: 100, spend_inr_cr: 400.00, share_pct: 9.82 },
      { month_key: '2025-01', month_label: 'Jan 2025', records_count: 2000, unique_items_count: 1000, unique_vendors_count: 100, spend_inr_cr: 400.00, share_pct: 9.82 }
    ],
    reconciliationVarianceInr: 0,
    reconciliationStatus: 'RECONCILED',
    fxMasterVersion: '2.0',
    fxMasterChecksum: '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f',
    pareto: {
      totalSpendCr: 4073.83,
      top80SpendCr: 3259.06,
      top80SpendPct: 80.0,
      topSupplierCount: 25,
      totalSupplierCount: 377
    },
    moduleStatuses: {
      module1: 'READY',
      module2: 'PENDING',
      module3: 'PENDING',
      module4: 'PENDING'
    },
    validationSummary: {
      sourceRows: 20505,
      validRows: 20241,
      excludedRows: 252,
      anomalyRows: 12,
      cleanSpendYieldPct: 98.7,
      excludedSpendCr: 108.7,
      anomalySpendCr: 0.0
    }
  };

  const mockTenant: any = {
    tenant_id: 'vgt-tenant-01',
    enterprise_name: 'Varroc Polymers (VGT)',
    base_currency: 'INR',
    total_spend_evaluated_inr: 4073.83,
    total_spend_evaluated: 48613723
  };

  const mockIngestionQueue: any[] = [
    {
      doc_id: 'DOC-VGT-001',
      tenant_id: 'vgt-tenant-01',
      file_name: 'VGT Testing Data.xlsx',
      file_type: 'XLSX',
      file_size_mb: 2.14,
      ocr_status: 'Completed',
      progress: 100,
      uploaded_at: '2025-02-01 10:00:00',
      records_count: 20505,
      detected_currencies: ['INR', 'USD', 'EUR', 'CNY'],
      converted_inr_crores: 4073.83,
      unique_items_count: 9566,
      unique_vendors_count: 377,
      material_groups_count: 15,
      plants_count: 20
    }
  ];

  it('renders PipelineBar with canonical VGT numbers and truthful module status', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        tenant={mockTenant}
        ingestionQueue={mockIngestionQueue}
        totalSpendCr={4073.83}
        canonicalViewModel={vgtCanonicalResponse}
      />
    );

    // Assert: Actual coverage separated from configured window
    expect(screen.getByText('10 Billing Months')).toBeInTheDocument();
    expect(screen.getByText(/Apr 2024 – Jan 2025/)).toBeInTheDocument();

    // Assert: FX impact present as data-quality only, NOT procurement savings
    expect(screen.getByText('₹153.50 Cr')).toBeInTheDocument();
    expect(screen.getByText(/Data-quality \/ normalization only/i)).toBeInTheDocument();

    // Assert: Clean spend yield
    expect(screen.getByText('98.7%')).toBeInTheDocument();
    expect(screen.getByText(/252 Excluded · 12 Quarantined/)).toBeInTheDocument();

    // Assert: NO stale or contradictory values
    expect(screen.queryByText(/817670/)).not.toBeInTheDocument();
    expect(screen.queryByText(/803482/)).not.toBeInTheDocument();
    expect(screen.queryByText(/40919/)).not.toBeInTheDocument();
    expect(screen.queryByText('3 Yrs')).not.toBeInTheDocument();
    expect(screen.queryByText('3x')).not.toBeInTheDocument();
  });

  it('renders Header with canonical VGT total spend', () => {
    render(
      <Header
        tenant={mockTenant}
        onSelectTenant={vi.fn()}
        currency="INR"
        onSelectCurrency={vi.fn()}
        onOpenReport={vi.fn()}
        theme="light"
        onSelectTheme={vi.fn()}
      />
    );

    // Header displays ₹4073.83 Cr
    expect(screen.getByText(/₹4,?073\.83 Cr/)).toBeInTheDocument();
    expect(screen.queryByText(/817670/)).not.toBeInTheDocument();
  });

  it('renders Module1Ingestion with canonical VGT validated spend, currencies, and data quality', () => {
    render(
      <Module1Ingestion
        tenant={mockTenant}
        onUpdateTenant={vi.fn()}
        ingestionQueue={mockIngestionQueue}
        validationRecords={[]}
        onFixCurrency={vi.fn()}
        onMergeVendor={vi.fn()}
        onRunAICategorization={vi.fn()}
        onAddBatchUpload={vi.fn()}
        canonicalViewModel={vgtCanonicalResponse}
      />
    );

    // Assert: Validated spend cards show ₹4073.83 Cr
    expect(screen.getAllByText('₹4073.83 Cr').length).toBeGreaterThan(0);

    // Assert: Data quality displays 20,505 source, 20,241 valid, 252 excluded, 12 quarantined
    expect(screen.getByText('20,505 Source Records Ingested')).toBeInTheDocument();
    expect(screen.getByText('20,241 Records Active in Validated Spend')).toBeInTheDocument();
    expect(screen.getByText(/252 Excluded · 12 Anomalies Quarantined/)).toBeInTheDocument();

    // Assert: Detected currencies include INR, USD, EUR, CNY
    expect(screen.getByText('INR')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('CNY')).toBeInTheDocument();

    // Assert: Live FX bar labeled as informational reference only
    expect(screen.getAllByText(UI_STRINGS.module1.liveFxRatesLabel).length).toBeGreaterThan(0);

    // Assert: NO demo/sample leakage
    expect(screen.queryByText(/30 Sample Records/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.01 Cr/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/817670/)).not.toBeInTheDocument();
  });
});
