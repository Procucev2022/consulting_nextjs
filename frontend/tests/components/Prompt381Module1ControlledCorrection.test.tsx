import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineBar } from '../../src/components/PipelineBar';
import { DocumentSummaryView } from '../../src/components/DocumentSummaryView';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { Module1CanonicalViewModel } from '../../src/types';

describe('Prompt 381: Module 1 Controlled Correction Verification', () => {
  const abcTextileCanonicalVm: Module1CanonicalViewModel = {
    datasetId: '7c7d5f8a68efe9b6',
    dataVersionId: 'DV-001',
    analysisJobId: 'JOB-AIC-2026-0002',
    assessmentId: 'AIC-2026-0002',
    sourceFileName: 'Textile1.xlsx',
    sourceRowCount: 23570,
    validRowCount: 23570,
    excludedRowCount: 0,
    anomalyRowCount: 0,
    validFxNormalizedSpendInr: 6138805185.48,
    validFxNormalizedSpendCr: 613.8805,
    profileFxBaselineSpendInr: 6138805185.48,
    profileFxBaselineSpendCr: 613.8805,
    fxNormalizationImpactInr: 0.0,
    fxNormalizationImpactCr: 0.0,
    fxNormalizationImpactPct: 0.0,
    fxNormalizationImpactStatus: 'NOT_CALCULATED',
    isTestData: false,
    detectedCurrencies: ['INR', 'JPY', 'USD', 'EUR', 'GBP', 'CHF'],
    currencyBreakdown: [],
    uniqueItems: 12768,
    uniqueVendors: 1291,
    materialGroups: 262,
    operatingPlants: 12,
    billingMonths: 12,
    configuredEvaluationWindow: '12 Billing Months (2023-01 – 2023-12)',
    actualDataCoverage: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      dateRangeLabel: 'Jan 2023 – Dec 2023',
      billingMonthsCount: 12,
      calendarYearCount: 1,
      calendarYearsCovered: ['2023'],
      historicalYearsCount: 1,
      is36MonthCoverage: false,
      annualizedSpendCr: 613.8805
    } as any,
    periodMetadata: {
      coverageRangeLabel: 'Jan 2023 – Dec 2023',
      actualBillingMonths: 12,
      fiscalMonthCoverage: '12 Months',
      calendarYearsCovered: ['2023'],
      historicalYearsCount: 1,
      has36MonthCoverage: false,
      annualizedRunRateCr: 613.8805
    } as any,
    supplierSpend: [],
    materialGroupSpend: [],
    plantSpend: [],
    monthlySpend: [],
    reconciliationVarianceInr: 0,
    reconciliationStatus: 'RECONCILED',
    fxMasterVersion: '2.0',
    fxMasterChecksum: '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f',
    validationSummary: {
      validRowCount: 23570,
      excludedRowCount: 0,
      anomalyRowCount: 0,
      cleanSpendYieldPct: 100.0,
      reconciliationPassed: true
    } as any,
    moduleStatuses: {
      module1: 'READY',
      module2: 'PENDING',
      module3: 'PENDING',
      module4: 'PENDING',
      detailedAnalysis: 'IN_PROGRESS'
    },
    pareto: {
      thresholdPct: 80.0,
      aClassificationCount: 250,
      bClassificationCount: 500,
      cClassificationCount: 541,
      headSuppliers: []
    } as any,
    paretoHierarchy: {
      headSpendCr: 491.1044,
      tailSpendCr: 122.7761,
      topItemCount: 1000,
      topVendorCount: 200,
      vendorFirstHierarchy: [],
      itemFirstHierarchy: []
    } as any
  };

  it('renders PipelineBar with Not calculated and zero spurious FX impact for ABC Textile', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={abcTextileCanonicalVm}
        activeAssessment={{
          assessmentId: 'AIC-2026-0002',
          customerName: 'ABC Textile Ltd',
          activeAnalysisRunId: 'RUN-001',
          activeDataVersionId: 'DV-001'
        } as any}
      />
    );

    // Assert FX Normalization Impact shows explicit Not calculated state
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.fxImpact.notCalculated)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.fxImpact.notCalculatedSub)).toBeInTheDocument();

    // Assert invalid mixed-currency numbers do not appear
    expect(screen.queryByText('₹30.46 Cr')).not.toBeInTheDocument();
    expect(screen.queryByText('₹583.42 Cr')).not.toBeInTheDocument();
  });

  it('renders DocumentSummaryView with provisional ERP-converted spend and uncalculated FX badge', () => {
    const queueItem = {
      doc_id: 'doc-001',
      file_name: 'Textile1.xlsx',
      file_type: 'XLSX',
      file_size_mb: 4.25,
      converted_inr_crores: 613.88,
      records_count: 23570,
      unique_items_count: 12768,
      unique_vendors_count: 1291,
      material_groups_count: 262,
      plants_count: 12,
      detected_currencies: ['INR', 'USD', 'EUR', 'JPY', 'GBP', 'CHF'],
      uploaded_at: new Date().toISOString()
    };

    render(
      <DocumentSummaryView
        ingestionQueue={[queueItem as any]}
        canonicalViewModel={abcTextileCanonicalVm}
        materialGroupSummaries={[]}
        plantSummaries={[]}
        monthWiseSummaries={[]}
      />
    );

    // Converted spend formatted (may appear in summary card and details)
    expect(screen.getAllByText('₹613.88 Cr').length).toBeGreaterThanOrEqual(1);

    // FX impact badge is explicitly marked as not calculated
    expect(screen.getByText(UI_STRINGS.documentSummary.fxNotCalculated)).toBeInTheDocument();

    // Spurious FX values must not appear
    expect(screen.queryByText(/30\.46/)).not.toBeInTheDocument();
  });

  it('renders PipelineBar with calculated FX impact for synthetic VGT test dataset', () => {
    const vgtCanonicalVm: Module1CanonicalViewModel = {
      ...abcTextileCanonicalVm,
      assessmentId: 'AIC-2026-0001',
      sourceFileName: 'VGT Testing Data.xlsx',
      validRowCount: 20241,
      validFxNormalizedSpendCr: 4073.83,
      profileFxBaselineSpendCr: 3920.33,
      fxNormalizationImpactCr: 153.5,
      fxNormalizationImpactPct: 3.92,
      fxNormalizationImpactStatus: 'CALCULATED',
      isTestData: true
    };

    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={vgtCanonicalVm}
        activeAssessment={{
          assessmentId: 'AIC-2026-0001',
          customerName: 'VGT Test',
          activeAnalysisRunId: 'RUN-VGT-001',
          activeDataVersionId: 'DV-001'
        } as any}
      />
    );

    expect(screen.getByText('₹153.50 Cr')).toBeInTheDocument();
    expect(screen.getByText(/\+3\.92% vs profile rates/)).toBeInTheDocument();
  });
});
