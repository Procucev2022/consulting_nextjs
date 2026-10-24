import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AssessmentDataCoverageBanner from '../../../src/components/assessment/AssessmentDataCoverageBanner';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { AssessmentRecord } from '../../../src/types';

describe('AssessmentDataCoverageBanner', () => {
  const mockBorosilAssessment: AssessmentRecord = {
    assessmentId: 'AIC-2026-0002',
    customerName: 'Borosil Ltd',
    industry: 'Solar Glass, Scientific Glass, Consumer Glass',
    assessmentPeriodStart: '1st Jan 2026',
    assessmentPeriodEnd: '22nd Oct 2026',
    actualDataCoverageStart: '1st Apr 2026',
    actualDataCoverageEnd: '22nd Oct 2026',
    dataCoverageNotice: UI_STRINGS.ASSESSMENT.dataCoverage.bannerMessage,
    includedEntities: ['BRL', 'BSL NASHIK', 'BSLB'],
    excludedEntities: ['BSL PUNE'],
    sourceRowCount: 30740,
    includedRowCount: 27777,
    excludedRowCount: 2963,
    validatedSpendCr: 556.5347,
    totalSpendCr: 585.3049,
    annualizedSpendEstimateCr: 954.0594,
    annualizedSpendNotice: 'Estimate based on available data, not actual spend',
    ndaStatus: 'SIGNED',
    dataStatus: 'VALIDATED',
    assignedAnalyst: 'analyst@procucev.com',
    status: 'IN_PROGRESS',
    createdAt: '2026-10-23T18:04:28.582Z',
    updatedAt: '2026-10-24T03:23:19.467Z'
  };

  it('renders the prominent data coverage information banner with exact required text', () => {
    render(<AssessmentDataCoverageBanner assessment={mockBorosilAssessment} />);

    expect(screen.getByTestId('assessment-data-coverage-banner')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.bannerTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.bannerMessage)).toBeInTheDocument();
  });

  it('displays the 7 required parameters separately with accurate values', () => {
    render(<AssessmentDataCoverageBanner assessment={mockBorosilAssessment} />);

    // 1. Configured assessment period
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblConfiguredPeriod)).toBeInTheDocument();
    expect(screen.getByText('1st Jan 2026 – 22nd Oct 2026')).toBeInTheDocument();

    // 2. Actual data coverage period
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblActualCoverage)).toBeInTheDocument();
    expect(screen.getByText('1st Apr 2026 – 22nd Oct 2026')).toBeInTheDocument();

    // 3. Included entities
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblIncludedEntities)).toBeInTheDocument();
    expect(screen.getByText('BRL, BSL NASHIK, BSLB')).toBeInTheDocument();

    // 4. Excluded entity: BSL PUNE
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblExcludedEntity)).toBeInTheDocument();
    expect(screen.getByText('BSL PUNE')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.excludedEntityNote)).toBeInTheDocument();

    // 5. Validated baseline spend
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblValidatedSpend)).toBeInTheDocument();
    expect(screen.getByText('₹556.5347 Cr')).toBeInTheDocument();

    // 6. Source transaction count
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblSourceRows)).toBeInTheDocument();
    expect(screen.getByText('30,740')).toBeInTheDocument();

    // 7. Included and excluded transaction counts
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblTransactionCounts)).toBeInTheDocument();
    expect(screen.getByText('Included: 27,777 | Excluded: 2,963')).toBeInTheDocument();
  });

  it('renders estimated annualized spend explicitly labelled as an estimate', () => {
    render(<AssessmentDataCoverageBanner assessment={mockBorosilAssessment} />);

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.lblAnnualizedSpend)).toBeInTheDocument();
    expect(screen.getByText('₹954.0594 Cr')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.annualizedSpendNotice)).toBeInTheDocument();
  });

  it('renders fallback defaults when optional assessment properties are omitted', () => {
    const minimalAssessment: AssessmentRecord = {
      assessmentId: 'AIC-2026-0003',
      customerName: 'Generic Client',
      industry: 'Manufacturing',
      assessmentPeriodStart: '',
      assessmentPeriodEnd: '',
      ndaStatus: 'NOT_REQUESTED',
      dataStatus: 'AWAITING_DATA',
      assignedAnalyst: 'analyst@procucev.com',
      status: 'DRAFT',
      createdAt: '2026-10-23T18:04:28.582Z',
      updatedAt: '2026-10-24T03:23:19.467Z'
    };

    render(<AssessmentDataCoverageBanner assessment={minimalAssessment} />);

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.defaultConfiguredPeriod)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.defaultActualCoverage)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.defaultIncludedEntities)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.defaultExcludedEntity)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.defaultValidatedSpend)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.defaultSourceRows)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.dataCoverage.defaultTransactionCounts)).toBeInTheDocument();
  });
});
