/**
 * Module 2 — Lever 5: Payment Terms Frontend Component Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentTermsView } from '../../../src/components/module2/PaymentTermsView';
import { PaymentTermsCoverageTab } from '../../../src/components/module2/PaymentTermsCoverageTab';
import { PaymentTermsOpportunitiesTab } from '../../../src/components/module2/PaymentTermsOpportunitiesTab';
import { PaymentTermsSupplierTab } from '../../../src/components/module2/PaymentTermsSupplierTab';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { API_REQUEST_ID_HEADER } from '../../../src/constants/app';
import { logger } from '../../../src/utils/logger';
import type { PaymentTermsResult, PaymentTermsCoverageSummary } from '../../../src/types/module2PaymentTerms';

const mockCoverageSummary: PaymentTermsCoverageSummary = {
  assessmentId: 'AIC-2026-0002',
  totalSpendAnalysedInr: 6138805185.51,
  totalSpendAnalysedCr: 613.8805,
  verifiedSpendInr: 0,
  verifiedSpendCr: 0,
  missingSpendInr: 6138805185.51,
  missingSpendCr: 613.8805,
  verifiedSpendPct: 0.0,
  missingSpendPct: 100.0,
  totalRecordsCount: 23570,
  completeRecordsCount: 0,
  partialRecordsCount: 0,
  missingRecordsCount: 23570,
  recordsRequiringValidationCount: 0,
  gapReasonCounts: {
    FIELD_NOT_IN_SOURCE_ERP: 23570
  },
  overallDataAvailabilityStatus: 'DATA_UNAVAILABLE',
  overallStatusDisplayText: 'Data Unavailable — Payment Terms Not Found in Source Data',
  reconciliationDeltaInr: 0.0,
  procucevModellingRatePctPer30Days: 1.5,
  totalWorkingCapitalReleasedCr: 0.0,
  totalFinancingBenefitCr: 0.0,
  totalEarlyPaymentDiscountsCr: 0.0
};

const mockResult: PaymentTermsResult = {
  assessmentId: 'AIC-2026-0002',
  coverageSummary: mockCoverageSummary,
  opportunities: [],
  supplierProfiles: [
    {
      supplierCode: 'V001',
      supplierName: 'Acme Fibers Ltd',
      spendCategory: 'Raw Materials',
      totalSpendInr: 500000000,
      totalSpendCr: 50.0,
      transactionCount: 120,
      observedPaymentTerms: [],
      primaryPaymentTerms: 'Not Found in Source Data',
      weightedAvgCreditDays: 0,
      dataAvailability: 'DATA_UNAVAILABLE',
      indicativeWorkingCapitalReleasedCr: 0.0,
      indicativeFinancingBenefitCr: 0.0,
      earlyPaymentDiscountOpportunityCr: 0.0,
      requiresValidation: false
    }
  ],
  coverageRecords: [
    {
      recordId: 'TX-1',
      vendorCode: 'V001',
      vendorName: 'Acme Fibers Ltd',
      poNumber: 'PO-1001',
      poDate: '2024-01-15',
      spendInr: 500000,
      hasDiscountTerms: false,
      coverageStatus: 'MISSING',
      gapReason: 'FIELD_NOT_IN_SOURCE_ERP',
      requiresValidation: false
    }
  ],
  methodologyDisclosures: ['Zero Invention of Missing Data', '1.5% linear rate']
};

describe('PaymentTermsComponents', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockResult })
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders PaymentTermsView with 5 KPI cards and data unavailable notice', async () => {
    render(<PaymentTermsView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module2.paymentTerms.title)).toBeInTheDocument();
    });

    expect(screen.getByText('₹613.8805 Cr')).toBeInTheDocument();
    expect(screen.getByText('DATA UNAVAILABLE')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.planningScenarioTitle)).toBeInTheDocument();
  });

  it('renders declarative virtual DOM Excel download link', async () => {
    render(<PaymentTermsView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      const link = screen.getByText(/Download 8-Sheet Auditable Excel Report/i);
      expect(link.closest('a')).toHaveAttribute(
        'href',
        '/api/module2/sourcing/payment-terms/export-excel?assessmentId=AIC-2026-0002'
      );
    });
  });

  it('renders PaymentTermsCoverageTab with complete, partial, and missing counts', () => {
    render(<PaymentTermsCoverageTab coverageSummary={mockCoverageSummary} />);
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.coverageCompleteRecordsLabel)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.coverageMissingRecordsLabel)).toBeInTheDocument();
    expect(screen.getByText('FIELD_NOT_IN_SOURCE_ERP')).toBeInTheDocument();
  });

  it('renders PaymentTermsOpportunitiesTab simulation sandbox with Prompt 448 linear formula', () => {
    render(
      <PaymentTermsOpportunitiesTab
        opportunities={mockResult.opportunities}
        coverageSummary={mockCoverageSummary}
      />
    );
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.scenarioBoxTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.module2.paymentTerms.scenarioGovernanceTag)).toBeInTheDocument();
    expect(screen.getAllByText(/Data Unavailable — Payment Terms Not Found in Source Data/i).length).toBeGreaterThan(0);

    // Verify simulation formula: 120 Cr * 1.5% * (30/30) = 1.8000 Cr; WC = 120 / 365 * 30 = 9.8630 Cr
    expect(screen.getByText('₹1.8000 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹9.8630 Cr')).toBeInTheDocument();

    // Change additional days to 60 days -> 120 Cr * 1.5% * (60/30) = 3.6000 Cr
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '60' } });
    expect(screen.getByText('₹3.6000 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹19.7260 Cr')).toBeInTheDocument();
  });

  it('renders PaymentTermsSupplierTab and toggles between suppliers and transactions', () => {
    render(
      <PaymentTermsSupplierTab
        supplierProfiles={mockResult.supplierProfiles}
        coverageRecords={mockResult.coverageRecords}
      />
    );
    expect(screen.getByText('Acme Fibers Ltd')).toBeInTheDocument();
    expect(screen.getByText('₹50.0000 Cr')).toBeInTheDocument();

    const txBtn = screen.getByText(/Transaction Register Preview/i);
    fireEvent.click(txBtn);
    expect(screen.getByText('PO-1001')).toBeInTheDocument();
    expect(screen.getByText('₹5,00,000')).toBeInTheDocument();
  });

  it('handles fetch error gracefully in PaymentTermsView', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
    vi.spyOn(logger, 'error').mockImplementation((message) => ({
      timestamp: '2026-11-08T00:00:00.000Z',
      level: 'error',
      service: 'consulting-frontend',
      message
    }));
    render(<PaymentTermsView assessmentId="AIC-2026-0002" />);
    const requestInit = fetchSpy.mock.calls[0]?.[1];
    const requestId = new Headers(requestInit?.headers).get(API_REQUEST_ID_HEADER) || '';
    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.module2.paymentTerms.errorTitle)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.module2.paymentTerms.networkFailure('Network offline', requestId)))
        .toBeInTheDocument();
    });
  });
});
