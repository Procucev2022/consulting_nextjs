import type { ComponentProps } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SpecificationRationalisationReviewModal } from '../../../src/components/module2/SpecificationRationalisationReviewModal';
import {
  SPECIFICATION_UI_STRINGS,
  SPECIFICATION_FINANCIAL_DISCLOSURES
} from '../../../src/constants/module2SpecificationRationalisation';
import type {
  SpecificationCandidateItem,
  SpecificationMaterialItem
} from '../../../src/types/module2SpecificationRationalisation';

const ASSESSMENT_ID = 'AIC-2026-0002';
const CANDIDATE_ID = 'SPEC-RAT-RAW-001';
const REJECTION_PLACEHOLDER = /Reason for technical rejection/;
const REVIEWER_NAME_PLACEHOLDER = /Dr. A. Sharma/;
const JUSTIFICATION_PLACEHOLDER = /State engineering basis/;

const buildMaterial = (overrides: Partial<SpecificationMaterialItem> = {}): SpecificationMaterialItem => ({
  code: 'MAT-101',
  description: 'Cotton Yarn 30s Combed Compact',
  normalizedDescription: 'cotton yarn 30s combed compact',
  plant: 'Plant 1',
  department: 'Spinning',
  totalSpendInr: 5000000,
  totalQuantity: 20000,
  uom: 'kg',
  transactionCount: 10,
  suppliersCount: 2,
  ...overrides
});

const buildCandidate = (overrides: Partial<SpecificationCandidateItem> = {}): SpecificationCandidateItem => ({
  candidateId: CANDIDATE_ID,
  identificationType: 'DUPLICATE_CODE',
  identificationRationale: 'Identical material code is used with differing text descriptions.',
  spendCategory: 'Raw Materials',
  primaryItem: buildMaterial(),
  comparisonItem: buildMaterial({
    code: 'MAT-102',
    description: 'Cotton Yarn 30s Carded',
    plant: 'Plant 2',
    totalSpendInr: 3500000,
    totalQuantity: 15000,
    transactionCount: 7,
    suppliersCount: 1
  }),
  similarityScore: 0.75,
  technicalAttributes: [
    { attributeName: 'Count (Ne)', sourceValue: '30s', candidateValue: '30s', matchStatus: 'MATCH', isCritical: true },
    { attributeName: 'Twist (TPI)', sourceValue: '24', candidateValue: '20', matchStatus: 'DIFFERENT', isCritical: true },
    { attributeName: 'Fibre Length', sourceValue: null, candidateValue: '38mm', matchStatus: 'SOURCE_MISSING', isCritical: false },
    { attributeName: 'Moisture Regain', sourceValue: null, candidateValue: null, matchStatus: 'BOTH_MISSING', isCritical: false }
  ],
  differencesIdentified: ['Twist differs between the two yarn specifications.'],
  missingAttributesDisclosed: ['Fibre length missing from the primary item record.'],
  hasMissingTechnicalData: true,
  expenditureUnderReviewInr: 8500000,
  expenditureUnderReviewCr: 0.85,
  quantityUnderReview: 35000,
  reviewStatus: 'AWAITING_TECHNICAL_REVIEW',
  reviewHistory: [],
  financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
  potentialRelatedLevers: ['LEVER_1'],
  nextRequiredAction: 'Route the candidate to the plant technical reviewer.',
  ...overrides
});

const renderModal = (overrides: Partial<ComponentProps<typeof SpecificationRationalisationReviewModal>> = {}) => {
  const props: ComponentProps<typeof SpecificationRationalisationReviewModal> = {
    isOpen: true,
    candidate: buildCandidate(),
    assessmentId: ASSESSMENT_ID,
    onClose: vi.fn(),
    onSubmitReview: vi.fn(() => Promise.resolve()),
    isSubmitting: false,
    ...overrides
  };
  const view = render(<SpecificationRationalisationReviewModal {...props} />);
  return { ...view, props };
};

const fillRequiredReviewerFields = (name: string, justification: string): void => {
  fireEvent.change(screen.getByPlaceholderText(REVIEWER_NAME_PLACEHOLDER), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText(JUSTIFICATION_PLACEHOLDER), { target: { value: justification } });
};

const submitDecision = (): void => {
  fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW }));
};

describe('SpecificationRationalisationReviewModal coverage paths', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders nothing when no candidate is selected', () => {
    renderModal({ candidate: null });

    expect(screen.queryByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).not.toBeInTheDocument();
  });

  it('preselects an awaiting decision for candidates that are not yet verified or rejected', () => {
    renderModal({ candidate: buildCandidate({ reviewStatus: 'POTENTIAL_MATCH' }) });

    expect(screen.getByRole('combobox')).toHaveValue('AWAITING_TECHNICAL_REVIEW');
    expect(screen.queryByPlaceholderText(REJECTION_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it('preselects the verified decision for technically verified candidates', () => {
    renderModal({ candidate: buildCandidate({ reviewStatus: 'TECHNICALLY_VERIFIED' }) });

    expect(screen.getByRole('combobox')).toHaveValue('TECHNICALLY_VERIFIED');
  });

  it('preselects the rejected decision and shows the rejection reason field for rejected candidates', () => {
    renderModal({ candidate: buildCandidate({ reviewStatus: 'REJECTED' }) });

    expect(screen.getByRole('combobox')).toHaveValue('REJECTED');
    expect(screen.getByPlaceholderText(REJECTION_PLACEHOLDER)).toBeInTheDocument();
  });

  it('blocks a rejected decision until a rejection reason is entered', () => {
    const { props } = renderModal({ candidate: buildCandidate({ reviewStatus: 'REJECTED' }) });
    fillRequiredReviewerFields('Dr. A. Iyer', 'Tensile and chemistry data do not meet the primary grade.');

    submitDecision();
    expect(props.onSubmitReview).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(REJECTION_PLACEHOLDER), {
      target: { value: '  High thermal tolerance required at Plant B  ' }
    });
    submitDecision();

    expect(props.onSubmitReview).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'REJECTED',
        rejectionReason: 'High thermal tolerance required at Plant B'
      })
    );
  });

  it('submits an approval with trimmed inputs and leaves blank optional fields undefined', () => {
    const { props } = renderModal({
      candidate: buildCandidate({
        reviewStatus: 'TECHNICALLY_VERIFIED',
        primaryItem: buildMaterial({ description: '' })
      })
    });

    fillRequiredReviewerFields('  Dr. R. Iyer  ', '  Verified against the plant specification sheet  ');
    fireEvent.change(screen.getByPlaceholderText(/Chief Metallurgist/), {
      target: { value: '  Plant Technical Head  ' }
    });
    submitDecision();

    expect(props.onSubmitReview).toHaveBeenCalledWith({
      assessmentId: ASSESSMENT_ID,
      candidateId: CANDIDATE_ID,
      status: 'TECHNICALLY_VERIFIED',
      reviewerName: 'Dr. R. Iyer',
      reviewerRole: 'Plant Technical Head',
      technicalJustification: 'Verified against the plant specification sheet',
      proposedStandard: undefined,
      applicationScope: expect.any(String),
      rejectionReason: undefined
    });
  });

  it('shows the rejection reason field only while the rejected decision is selected', () => {
    renderModal({ candidate: buildCandidate({ reviewStatus: 'POTENTIAL_MATCH' }) });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REJECTED' } });
    expect(screen.getByPlaceholderText(REJECTION_PLACEHOLDER)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'AWAITING_TECHNICAL_REVIEW' } });
    expect(screen.queryByPlaceholderText(REJECTION_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it('disables the actions and shows the submitting label while a submission is in flight', () => {
    renderModal({ isSubmitting: true });

    expect(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.SUBMITTING })).toBeDisabled();
    expect(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_CANCEL })).toBeDisabled();
  });

  it('colours attribute match states and lists the disclosed missing attributes', () => {
    renderModal();

    expect(screen.getByText(SPECIFICATION_UI_STRINGS.ATTR_NAME)).toBeInTheDocument();
    expect(screen.getByText('MATCH')).toHaveClass('bg-emerald-100');
    expect(screen.getByText('DIFFERENT')).toHaveClass('bg-amber-100');
    expect(screen.getByText('SOURCE_MISSING')).toHaveClass('bg-rose-100');
    expect(screen.getByText('BOTH_MISSING')).toHaveClass('bg-rose-100');
    expect(screen.getByText('Fibre length missing from the primary item record.')).toBeInTheDocument();
  });

  it('shows spend and quantity for items whose code and plant are blank', () => {
    renderModal({
      candidate: buildCandidate({
        primaryItem: buildMaterial({ code: '', plant: '' }),
        comparisonItem: buildMaterial({ code: '', plant: '', description: 'Cotton Yarn 30s Carded', totalSpendInr: 3500000, totalQuantity: 15000 })
      })
    });

    expect(screen.getByText(/Spend: ₹50\.00 L/)).toBeInTheDocument();
    expect(screen.getByText(/Spend: ₹35\.00 L/)).toBeInTheDocument();
    expect(screen.getByText(/Qty: 15000 kg/)).toBeInTheDocument();
  });

  it('closes from the header control and the cancel button', () => {
    const { props } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: '×' }));
    fireEvent.click(screen.getByRole('button', { name: SPECIFICATION_UI_STRINGS.BTN_CANCEL }));

    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('resets the entered review when a different candidate is supplied', () => {
    const { rerender, props } = renderModal({ candidate: buildCandidate({ reviewStatus: 'TECHNICALLY_VERIFIED' }) });
    fillRequiredReviewerFields('Dr. A. Iyer', 'Initial engineering note.');

    rerender(
      <SpecificationRationalisationReviewModal
        {...props}
        candidate={buildCandidate({ candidateId: 'SPEC-RAT-RAW-002', reviewStatus: 'REJECTED' })}
      />
    );

    expect(screen.getByText('SPEC-RAT-RAW-002')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(REVIEWER_NAME_PLACEHOLDER)).toHaveValue('');
    expect(screen.getByRole('combobox')).toHaveValue('REJECTED');
  });
});
