/**
 * Coverage tests for PaymentTermsCoverageTab: gap table rows, fallbacks for unknown gap codes,
 * empty gap maps, and zero-record summaries.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { PaymentTermsCoverageTab } from '../../../src/components/module2/PaymentTermsCoverageTab';
import {
  PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS,
  PAYMENT_TERMS_STATUS_DISPLAY_LABELS
} from '../../../src/constants/module2PaymentTerms';
import type { PaymentTermsCoverageSummary } from '../../../src/types/module2PaymentTerms';

const BASE_SUMMARY: PaymentTermsCoverageSummary = {
  assessmentId: 'AIC-2026-0002',
  totalSpendAnalysedInr: 1000000000,
  totalSpendAnalysedCr: 100,
  verifiedSpendInr: 375000000,
  verifiedSpendCr: 37.5,
  missingSpendInr: 625000000,
  missingSpendCr: 62.5,
  verifiedSpendPct: 37.5,
  missingSpendPct: 62.5,
  totalRecordsCount: 100,
  completeRecordsCount: 30,
  partialRecordsCount: 10,
  missingRecordsCount: 60,
  recordsRequiringValidationCount: 12,
  gapReasonCounts: {
    FIELD_NOT_IN_SOURCE_ERP: 20,
    UNPARSEABLE_PAYMENT_TERM_FORMAT: 5
  },
  overallDataAvailabilityStatus: 'DATA_PARTIALLY_AVAILABLE',
  overallStatusDisplayText: PAYMENT_TERMS_STATUS_DISPLAY_LABELS.DATA_PARTIALLY_AVAILABLE,
  reconciliationDeltaInr: 0,
  procucevModellingRatePctPer30Days: 1.5,
  totalWorkingCapitalReleasedCr: 2.5,
  totalFinancingBenefitCr: 0.1,
  totalEarlyPaymentDiscountsCr: 0
};

function buildCoverageSummary(overrides: Partial<PaymentTermsCoverageSummary>): PaymentTermsCoverageSummary {
  return { ...BASE_SUMMARY, ...overrides };
}

describe('PaymentTermsCoverageTab coverage', () => {
  it('lists each data gap with its description, code, and share of all records', () => {
    render(<PaymentTermsCoverageTab coverageSummary={buildCoverageSummary({})} />);

    expect(screen.getByText(PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS.FIELD_NOT_IN_SOURCE_ERP)).toBeInTheDocument();
    expect(screen.getByText('FIELD_NOT_IN_SOURCE_ERP')).toBeInTheDocument();
    expect(screen.getByText(PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS.UNPARSEABLE_PAYMENT_TERM_FORMAT)).toBeInTheDocument();
    expect(screen.getByText('20.00%')).toBeInTheDocument();
    expect(screen.getByText('5.00%')).toBeInTheDocument();
  });

  it('shows the verified and missing spend split from the summary', () => {
    render(<PaymentTermsCoverageTab coverageSummary={buildCoverageSummary({})} />);

    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.coveragePercentages('37.50', '62.50')))
      .toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.coverageVerifiedSpend('37.5000'))).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.coverageMissingSpend('62.5000'))).toBeInTheDocument();
  });

  it('uses the gap code as its description when no description is defined, and a zero share with no records', () => {
    render(
      <PaymentTermsCoverageTab
        coverageSummary={buildCoverageSummary({
          totalRecordsCount: 0,
          gapReasonCounts: { LEGACY_GAP_CODE: 3 }
        })}
      />
    );

    expect(screen.getAllByText('LEGACY_GAP_CODE')).toHaveLength(2);
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('renders only the header and an empty row when no gap reasons are recorded', () => {
    render(<PaymentTermsCoverageTab coverageSummary={buildCoverageSummary({ gapReasonCounts: {} })} />);

    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.queryByText(PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS.FIELD_NOT_IN_SOURCE_ERP)).not.toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.coverageEmptyGaps)).toBeInTheDocument();
  });

  it('treats a missing gap reason map as empty', () => {
    render(<PaymentTermsCoverageTab coverageSummary={buildCoverageSummary({ gapReasonCounts: undefined })} />);

    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('renders labels and helper copy from the centralized Payment Terms catalog', () => {
    render(<PaymentTermsCoverageTab coverageSummary={buildCoverageSummary({})} />);

    const paymentTerms = UI_STRINGS.module2.paymentTerms;
    [
      paymentTerms.coverageCompleteRecordsLabel,
      paymentTerms.coverageCompleteRecordsDescription,
      paymentTerms.coveragePartialRecordsLabel,
      paymentTerms.coveragePartialRecordsDescription,
      paymentTerms.coverageMissingRecordsLabel,
      paymentTerms.coverageMissingRecordsDescription,
      paymentTerms.coverageRequiringValidationLabel,
      paymentTerms.coverageRequiringValidationDescription,
      paymentTerms.coverageHeading,
      paymentTerms.coverageGapTableTitle,
      paymentTerms.coverageGapClassificationHeader,
      paymentTerms.coverageGapDescriptionHeader,
      paymentTerms.coverageGapAffectedRecordsHeader,
      paymentTerms.coverageGapShareHeader
    ].forEach((copy) => expect(screen.getByText(copy)).toBeInTheDocument());
  });
});
