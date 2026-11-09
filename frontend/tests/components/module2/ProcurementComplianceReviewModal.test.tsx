import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProcurementComplianceReviewModal } from '../../../src/components/module2/ProcurementComplianceReviewModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { ProcurementComplianceExceptionItem } from '../../../src/types/module2ProcurementCompliance';

const REVIEW_STRINGS = UI_STRINGS.module2.procurementComplianceReview;

const sampleItem: ProcurementComplianceExceptionItem = {
  exceptionId: 'EXC-MODAL-001',
  checkType: 'PRICE_INCONSISTENCY',
  checkTitle: 'Price Inconsistency Across Comparable Transactions',
  spendCategory: 'Raw Materials',
  vendorName: 'Vardhman Textiles',
  materialDesc: 'Cotton Yarn 30s',
  supportingTransactionsCount: 1,
  expenditureUnderReviewInr: 5000000,
  expenditureUnderReviewCr: 0.5,
  potentialFinancialExposureInr: 250000,
  potentialFinancialExposureCr: 0.025,
  financialExposureStatus: 'POTENTIAL_EXPOSURE_REQUIRES_VALIDATION',
  financialExposureStatusLabel: 'Potential Financial Exposure — Requires Validation',
  methodologyDescription: 'Variance vs lowest clean unit price',
  evidenceDetails: ['Variance found'],
  dataGapsDisclosed: ['Gap 1'],
  reviewStatus: 'AWAITING_REVIEW',
  reviewHistory: [],
  potentialRelatedLevers: ['LEVER_1'],
  nextActionRequired: 'Audit with category lead',
  supportingTransactions: [
    {
      poNumber: 'PO-999',
      poDate: '2026-01-15',
      vendorCode: 'V-01',
      vendorName: 'Vardhman Textiles',
      materialCode: 'MAT-101',
      materialDesc: 'Cotton Yarn 30s',
      quantity: 5000,
      uom: 'kg',
      unitPrice: 200,
      totalSpendInr: 1000000,
      currency: 'INR'
    }
  ]
};

describe('ProcurementComplianceReviewModal Component', () => {
  it('returns null when isOpen is false or exceptionItem is null', () => {
    const { rerender } = render(
      <ProcurementComplianceReviewModal
        isOpen={false}
        exceptionItem={sampleItem}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />
    );
    expect(screen.queryByText(REVIEW_STRINGS.title)).not.toBeInTheDocument();

    rerender(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={null}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />
    );
    expect(screen.queryByText(REVIEW_STRINGS.title)).not.toBeInTheDocument();
  });

  it('initializes status for VERIFIED_EXCEPTION and NOT_AN_EXCEPTION items', () => {
    const { rerender } = render(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={{ ...sampleItem, reviewStatus: 'VERIFIED_EXCEPTION' }}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />
    );
    const select = screen.getByTestId('compliance-select-decision') as HTMLSelectElement;
    expect(select.value).toBe('VERIFIED_EXCEPTION');

    rerender(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={{ ...sampleItem, reviewStatus: 'NOT_AN_EXCEPTION' }}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />
    );
    expect((screen.getByTestId('compliance-select-decision') as HTMLSelectElement).value).toBe('NOT_AN_EXCEPTION');
  });

  it('validates reviewer name, justification, and dismissal reason', () => {
    render(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={sampleItem}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />
    );

    // Empty reviewer name
    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));
    expect(screen.getByText(REVIEW_STRINGS.validation.reviewerNameRequired)).toBeInTheDocument();

    // Fill reviewer name
    fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), {
      target: { value: 'Officer Jane' }
    });

    // Empty justification
    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));
    expect(screen.getByText(REVIEW_STRINGS.validation.justificationRequired)).toBeInTheDocument();

    // Select NOT_AN_EXCEPTION without dismissal reason
    fireEvent.change(screen.getByTestId('compliance-select-decision'), {
      target: { value: 'NOT_AN_EXCEPTION' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-justification'), {
      target: { value: 'Valid rate applied' }
    });

    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));
    expect(screen.getByText(REVIEW_STRINGS.validation.dismissalReasonRequired)).toBeInTheDocument();
  });

  it('shows a localized fallback when review submission rejects without an Error', async () => {
    const handleSubmit = vi.fn().mockRejectedValueOnce('unexpected rejection');
    render(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={sampleItem}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={handleSubmit}
        isSubmitting={false}
      />
    );

    fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), { target: { value: 'Officer Jane' } });
    fireEvent.change(screen.getByTestId('compliance-input-justification'), { target: { value: 'Review evidence' } });
    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));

    expect(await screen.findByText(REVIEW_STRINGS.validation.submissionFailureFallback)).toBeInTheDocument();
  });

  it('submits review successfully with action plan for verified exception and dismissal reason for not an exception', async () => {
    const handleSubmit = vi.fn();
    const { rerender } = render(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={sampleItem}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={handleSubmit}
        isSubmitting={false}
      />
    );

    // 1. Submit as VERIFIED_EXCEPTION (with action plan)
    fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), {
      target: { value: 'Lead Auditor Jane' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-reviewer-role'), {
      target: { value: 'Internal Audit Director' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-justification'), {
      target: { value: 'Confirmed pricing variance across comparable POs' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-action-plan'), {
      target: { value: 'Commercial audit and supplier renegotiation' }
    });

    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));

    expect(handleSubmit).toHaveBeenCalledWith({
      candidateId: 'EXC-MODAL-001',
      status: 'AWAITING_REVIEW',
      reviewerName: 'Lead Auditor Jane',
      reviewerRole: 'Internal Audit Director',
      technicalJustification: 'Confirmed pricing variance across comparable POs',
      correctiveActionPlan: 'Commercial audit and supplier renegotiation',
      dismissalReason: undefined
    });

    // 2. Submit as NOT_AN_EXCEPTION (with dismissal reason)
    rerender(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={sampleItem}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={handleSubmit}
        isSubmitting={false}
      />
    );

    fireEvent.change(screen.getByTestId('compliance-input-reviewer-name'), {
      target: { value: 'Lead Auditor Jane' }
    });
    fireEvent.change(screen.getByTestId('compliance-select-decision'), {
      target: { value: 'NOT_AN_EXCEPTION' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-justification'), {
      target: { value: 'Confirmed approved pricing schedule in place' }
    });
    fireEvent.change(screen.getByTestId('compliance-input-dismissal-reason'), {
      target: { value: 'Volume rebate applied at billing stage' }
    });

    fireEvent.click(screen.getByTestId('compliance-submit-review-btn'));

    expect(handleSubmit).toHaveBeenLastCalledWith({
      candidateId: 'EXC-MODAL-001',
      status: 'NOT_AN_EXCEPTION',
      reviewerName: 'Lead Auditor Jane',
      reviewerRole: 'Internal Audit Director',
      technicalJustification: 'Confirmed approved pricing schedule in place',
      correctiveActionPlan: 'Commercial audit and supplier renegotiation',
      dismissalReason: 'Volume rebate applied at billing stage'
    });
  });

  it('handles close button, cancel button, and submitting state', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={sampleItem}
        assessmentId="AIC-2026-0002"
        onClose={handleClose}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />
    );

    fireEvent.click(screen.getByTestId('compliance-modal-close-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(REVIEW_STRINGS.cancelButton));
    expect(handleClose).toHaveBeenCalledTimes(2);

    rerender(
      <ProcurementComplianceReviewModal
        isOpen={true}
        exceptionItem={sampleItem}
        assessmentId="AIC-2026-0002"
        onClose={handleClose}
        onSubmitReview={vi.fn()}
        isSubmitting={true}
      />
    );
    expect(screen.getByTestId('compliance-submit-review-btn')).toBeDisabled();
    expect(screen.getByText(REVIEW_STRINGS.submittingButton)).toBeInTheDocument();
  });
});
