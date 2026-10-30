import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PipelineBar } from '../../src/components/PipelineBar';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import type { AssessmentRecord, Module1CanonicalViewModel, RawDocumentIngestion } from '../../src/types';

const kpis = UI_STRINGS.pipeline.kpis;
const navStages = UI_STRINGS.pipeline.navStages;

const buildAssessment = (overrides: Partial<AssessmentRecord> = {}): AssessmentRecord => ({
  assessmentId: 'AIC-PB-1',
  customerName: 'Pipeline Coverage Ltd',
  industry: 'Manufacturing',
  assessmentPeriodStart: '2023-04-01',
  assessmentPeriodEnd: '2024-03-31',
  ndaStatus: 'SIGNED',
  dataStatus: 'AWAITING_DATA',
  assignedAnalyst: 'analyst@procucev.com',
  status: 'DRAFT',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z',
  ...overrides
});

const buildDocument = (overrides: Partial<RawDocumentIngestion> = {}): RawDocumentIngestion => ({
  doc_id: 'DOC-PB-1',
  tenant_id: 'AIC-PB-1',
  file_name: 'pipeline_coverage.xlsx',
  file_type: 'XLSX',
  file_size_mb: 2,
  ocr_status: 'Completed',
  uploaded_at: '2026-10-11 10:00:00',
  records_count: 500,
  detected_currencies: ['INR'],
  ...overrides
});

const buildCanonical = (overrides: Partial<Module1CanonicalViewModel> = {}): Module1CanonicalViewModel => ({
  datasetId: 'ds-pipeline-coverage',
  dataVersionId: 'DV-PIPE-1',
  analysisJobId: 'job-pipe-1',
  sourceFileName: 'pipeline_coverage.xlsx',
  sourceRowCount: 1000,
  validRowCount: 980,
  excludedRowCount: 15,
  anomalyRowCount: 5,
  validFxNormalizedSpendInr: 850000000,
  validFxNormalizedSpendCr: 85,
  profileFxBaselineSpendInr: 850000000,
  profileFxBaselineSpendCr: 85,
  fxNormalizationImpactInr: 0,
  fxNormalizationImpactCr: 0,
  fxNormalizationImpactPct: 0,
  fxNormalizationImpactStatus: 'NOT_CALCULATED',
  isTestData: false,
  detectedCurrencies: ['INR'],
  currencyBreakdown: [],
  uniqueItems: 300,
  uniqueVendors: 40,
  materialGroups: 5,
  operatingPlants: 3,
  billingMonths: 12,
  configuredEvaluationWindow: 'Configured 12 billing months',
  actualDataCoverage: { billingMonthsCount: 12, dateRangeLabel: 'Apr 2023 – Mar 2024' },
  supplierSpend: [],
  materialGroupSpend: [],
  plantSpend: [],
  monthlySpend: [],
  reconciliationVarianceInr: 0,
  reconciliationStatus: 'RECONCILED',
  fxMasterVersion: 'coverage-v1',
  fxMasterChecksum: 'coverage-checksum',
  validationSummary: { cleanSpendYieldPct: 98.5 },
  moduleStatuses: { module1: 'READY', module2: 'PENDING', module3: 'PENDING', module4: 'PENDING' },
  ...overrides
});

// Stage cards and nav links contain their title, description, and footer text, so match on the title.
const linkContaining = (text: string): HTMLElement => {
  const link = screen.getByText(text).closest('a');
  if (!link) {
    throw new Error(`No link wraps the text "${text}"`);
  }
  return link;
};

describe('PipelineBar coverage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives the coverage window from an assessment with actual data dates', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={buildAssessment({
          actualDataCoverageStart: '2023-04-01',
          actualDataCoverageEnd: '2024-03-31',
          dataStatus: 'VALIDATED'
        })}
      />
    );

    expect(screen.getByText(/2023-04-01 – 2024-03-31/)).toBeInTheDocument();
  });

  it('shows the validated record total from the ingestion queue, skipping documents without records', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        ingestionQueue={[
          buildDocument({ records_count: 500 }),
          buildDocument({ doc_id: 'DOC-PB-2', records_count: 0 })
        ]}
        activeAssessment={buildAssessment({ dataStatus: 'VALIDATED' })}
      />
    );

    expect(screen.getByText(/^500/)).toBeInTheDocument();
  });

  it('reports the dataset as uploaded while it awaits validation', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={buildAssessment({ activeDataVersionId: 'DV-PB-1', dataStatus: 'RECEIVED' })}
      />
    );

    expect(screen.getByText(/Dataset uploaded/)).toBeInTheDocument();
    expect(screen.getByText(/Available after Module 1 execution/)).toBeInTheDocument();
  });

  it('marks Module 1 complete when the canonical view matches the active data version', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={buildCanonical()}
        activeAssessment={buildAssessment({
          activeAnalysisRunId: 'RUN-PB-1',
          activeDataVersionId: 'DV-PIPE-1',
          dataStatus: 'VALIDATED',
          validatedSpendCr: 85
        })}
      />
    );

    expect(screen.getByText(UI_STRINGS.pipeline.kpis.realTimeProcessing.value)).toBeInTheDocument();
    expect(screen.getByText(/980 Valid Records Reconciled/)).toBeInTheDocument();
    expect(screen.getByText(/Apr 2023 – Mar 2024 \(Configured:/)).toBeInTheDocument();
    expect(screen.getByText(/98\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/15 Excluded/)).toBeInTheDocument();
    expect(screen.getByText(kpis.fxImpact.notCalculated)).toBeInTheDocument();
  });

  it('still renders the Module 1 KPIs when the validation summary omits the clean spend yield', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={buildCanonical({ validationSummary: {} })}
        activeAssessment={buildAssessment({
          activeAnalysisRunId: 'RUN-PB-3',
          activeDataVersionId: 'DV-PIPE-1',
          dataStatus: 'VALIDATED',
          validatedSpendCr: 85
        })}
      />
    );

    expect(screen.getByText(/15 Excluded/)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('keeps Module 1 incomplete when the active run points at a different data version', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={buildCanonical({ dataVersionId: 'DV-OTHER' })}
        activeAssessment={buildAssessment({
          activeAnalysisRunId: 'RUN-PB-2',
          activeDataVersionId: 'DV-PIPE-1',
          validatedSpendCr: 0
        })}
      />
    );

    expect(screen.queryByText(UI_STRINGS.pipeline.kpis.realTimeProcessing.value)).not.toBeInTheDocument();
    expect(screen.queryByText(/980 Valid Records Reconciled/)).not.toBeInTheDocument();
  });

  it('shows a calculated FX impact with a signed percentage, and the not-calculated state for real data', () => {
    const { unmount } = render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={buildCanonical({
          fxNormalizationImpactStatus: 'CALCULATED',
          isTestData: true,
          fxNormalizationImpactCr: 153.5,
          fxNormalizationImpactPct: 3.91
        })}
      />
    );
    expect(screen.getByText(/153\.50/)).toBeInTheDocument();
    expect(screen.getByText(/\+3\.91%/)).toBeInTheDocument();
    unmount();

    const { unmount: unmountNegative } = render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={buildCanonical({
          fxNormalizationImpactStatus: 'CALCULATED',
          isTestData: true,
          fxNormalizationImpactCr: -2.5,
          fxNormalizationImpactPct: -1.25
        })}
      />
    );
    expect(screen.getByText(/-1\.25%/)).toBeInTheDocument();
    unmountNegative();

    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        canonicalViewModel={buildCanonical({
          fxNormalizationImpactStatus: 'CALCULATED',
          isTestData: false,
          fxNormalizationImpactCr: 0
        })}
      />
    );
    expect(screen.getByText(kpis.fxImpact.notCalculated)).toBeInTheDocument();
  });

  it('shows the running state while Module 1 executes', () => {
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={vi.fn()}
        activeAssessment={buildAssessment({ status: 'IN_PROGRESS' })}
      />
    );

    expect(screen.getByText(/Module 1 execution in progress/)).toBeInTheDocument();
  });

  it('uses the pipeline-ready copy when nothing has been uploaded', () => {
    render(<PipelineBar activeTab="module1" onSelectTab={vi.fn()} />);

    expect(screen.getByText(/Pipeline Ready/)).toBeInTheDocument();
  });

  it('opens the executive brief and selects the assessment centre tab', () => {
    // A stubbed location keeps jsdom from attempting a real navigation; the same object is returned on each read.
    const location = { ...window.location, href: 'http://localhost/', hash: '' };
    vi.spyOn(window, 'location', 'get').mockReturnValue(location);
    const onSelectTab = vi.fn();

    render(<PipelineBar activeTab="module1" onSelectTab={onSelectTab} />);

    fireEvent.click(screen.getByTestId('pipeline-executive-brief-btn'));
    expect(location.href).toBe('/executive-brief');

    fireEvent.click(screen.getByTestId('pipeline-assessment-centre-btn'));
    expect(onSelectTab).toHaveBeenCalledWith('assessment');
    expect(location.hash).toBe('assessment');
  });

  it('highlights the assessment centre tab when it is the active tab', () => {
    render(<PipelineBar activeTab="assessment" onSelectTab={vi.fn()} />);

    expect(screen.getByTestId('pipeline-assessment-centre-btn')).toHaveClass('bg-amber-600');
  });

  it('routes the Module 5 link through the locked-tab handler while Module 4 is incomplete', () => {
    const onLockedTabClick = vi.fn();
    const { unmount } = render(
      <PipelineBar activeTab="module1" onSelectTab={vi.fn()} onLockedTabClick={onLockedTabClick} />
    );

    fireEvent.click(screen.getByRole('link', { name: UI_STRINGS.pipeline.conversionMatrixTab }));
    expect(onLockedTabClick).toHaveBeenCalledWith('module5');
    unmount();

    const onSelectTab = vi.fn();
    render(<PipelineBar activeTab="module1" onSelectTab={onSelectTab} />);
    fireEvent.click(screen.getByRole('link', { name: UI_STRINGS.pipeline.conversionMatrixTab }));
    expect(onSelectTab).toHaveBeenCalledWith('module5');
  });

  it('selects the Module 5 tab directly once Module 4 is complete', () => {
    const onSelectTab = vi.fn();
    render(<PipelineBar activeTab="module1" onSelectTab={onSelectTab} isStep4Complete />);

    fireEvent.click(screen.getByRole('link', { name: UI_STRINGS.pipeline.conversionMatrixTab }));
    expect(onSelectTab).toHaveBeenCalledWith('module5');
  });

  it('honours step completion flags and unlocked tabs when navigating stages', () => {
    const onSelectTab = vi.fn();
    const onLockedTabClick = vi.fn();
    render(
      <PipelineBar
        activeTab="module1"
        onSelectTab={onSelectTab}
        onLockedTabClick={onLockedTabClick}
        isStep2Complete
        unlockedTabs={['module2']}
      />
    );

    // Step 2 is marked complete, so Module 3 is unlocked.
    fireEvent.click(linkContaining(navStages.step3.title));
    expect(onSelectTab).toHaveBeenCalledWith('module3');

    // Module 2 is listed as unlocked, so it opens even though Step 1 is incomplete.
    fireEvent.click(linkContaining(navStages.step2.title));
    expect(onSelectTab).toHaveBeenCalledWith('module2');

    // Module 4 stays locked because Step 3 is incomplete.
    fireEvent.click(linkContaining(navStages.step4.title));
    expect(onLockedTabClick).toHaveBeenCalledWith('module4');
    expect(onSelectTab).not.toHaveBeenCalledWith('module4');
  });
});
