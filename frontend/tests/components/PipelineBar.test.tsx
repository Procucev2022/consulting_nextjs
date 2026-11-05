import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineBar } from '../../src/components/PipelineBar';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { Module1CanonicalViewModel } from '../../src/types';

describe('PipelineBar Component', () => {
  const mockCanonical: Module1CanonicalViewModel = {
    datasetId: 'vgt-test-id',
    dataVersionId: 'vgt-v2-test',
    analysisJobId: 'job-test-123',
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
    currencyBreakdown: [],
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
    supplierSpend: [],
    materialGroupSpend: [],
    plantSpend: [],
    monthlySpend: [],
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

  it('renders all KPI cards correctly without canonical data', () => {
    render(<PipelineBar activeTab="module1" onSelectTab={vi.fn()} />);

    expect(screen.getByText(UI_STRINGS.pipeline.kpis.dataCoverage.label)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.realTimeProcessing.label)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.fxImpact.label)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.cleanSpendYield.label)).toBeInTheDocument();
  });

  it('renders canonical VGT data accurately in KPI cards and truthful module statuses', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={mockCanonical}
      />
    );

    expect(screen.getByText('10 Billing Months')).toBeInTheDocument();
    expect(screen.getByText(/Apr 2024 – Jan 2025/)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pipeline.kpis.realTimeProcessing.value)).toBeInTheDocument();
    expect(screen.getByText('₹153.50 Cr')).toBeInTheDocument();
    expect(screen.getByText('98.7%')).toBeInTheDocument();
    expect(screen.getByText(/252 Excluded · 12 Quarantined/)).toBeInTheDocument();
  });

  it('renders all 4 stages and triggers onSelectTab when clicking an unlocked stage', () => {
    const onSelectTab = vi.fn();
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={onSelectTab}
        isStep1Complete={true}
        isStep2Complete={true}
        isStep3Complete={true}
        isStep4Complete={true}
      />
    );

    const step2 = screen.getByText(UI_STRINGS.pipeline.navStages.step2.title);
    fireEvent.click(step2);
    expect(onSelectTab).toHaveBeenCalledWith('module2');

    const step3 = screen.getByText(UI_STRINGS.pipeline.navStages.step3.title);
    fireEvent.click(step3);
    expect(onSelectTab).toHaveBeenCalledWith('module3');

    const step4 = screen.getByText(UI_STRINGS.pipeline.navStages.step4.title);
    fireEvent.click(step4);
    expect(onSelectTab).toHaveBeenCalledWith('module4');

    const step1 = screen.getByText(UI_STRINGS.pipeline.navStages.step1.title);
    expect(screen.getByText(UI_STRINGS.pipeline.navStages.step1.desc)).toBeInTheDocument();
    fireEvent.click(step1);
    expect(onSelectTab).toHaveBeenCalledWith('module1');
  });

  it('locks Step 2-5 when Step 1 is not complete and invokes onLockedTabClick', () => {
    const onSelectTab = vi.fn();
    const onLockedTabClick = vi.fn();
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={onSelectTab}
        isStep1Complete={false}
        onLockedTabClick={onLockedTabClick}
      />
    );

    expect(screen.getAllByText(UI_STRINGS.pipeline.stepLockedBadge).length).toBeGreaterThan(0);

    const step2 = screen.getByText(UI_STRINGS.pipeline.navStages.step2.title);
    fireEvent.click(step2);
    expect(onLockedTabClick).toHaveBeenCalledWith('module2');
    expect(onSelectTab).not.toHaveBeenCalledWith('module2');
  });

  it('handles clicking Conversion Matrix tab when unlocked and verifies Data Architecture is commented out', () => {
    const onSelectTab = vi.fn();
    const { rerender } = render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={onSelectTab}
        isStep1Complete={true}
        isStep2Complete={true}
        isStep3Complete={true}
        isStep4Complete={true}
      />
    );

    const matrixLink = screen.getByRole('link', { name: new RegExp(UI_STRINGS.pipeline.conversionMatrixTab, 'i') });
    expect(matrixLink).toHaveAttribute('href', '#module5');
    fireEvent.click(matrixLink);
    expect(onSelectTab).toHaveBeenCalledWith('module5');

    const schemaTab = screen.queryByText(UI_STRINGS.pipeline.dataArchitectureTab);
    expect(schemaTab).not.toBeInTheDocument();

    // Rerender with active tab module5 to cover active styles
    rerender(
      <PipelineBar
        activeTab="module5"
        onSelectTab={onSelectTab}
        isStep1Complete={true}
        isStep2Complete={true}
        isStep3Complete={true}
        isStep4Complete={true}
      />
    );
    expect(matrixLink).toHaveClass('bg-purple-600');
  });
});
