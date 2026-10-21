import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpecificationRationalisationView } from '../../../src/components/module2/SpecificationRationalisationView';
import { SpecificationRationalisationReviewModal } from '../../../src/components/module2/SpecificationRationalisationReviewModal';
import {
  SPECIFICATION_UI_STRINGS,
  SPECIFICATION_FINANCIAL_DISCLOSURES
} from '../../../src/constants/module2SpecificationRationalisation';
import type {
  SpecificationRationalisationResult,
  SpecificationCandidateItem
} from '../../../src/types/module2SpecificationRationalisation';

const mockResult: SpecificationRationalisationResult = {
  assessmentId: 'AIC-2026-0002',
  customerName: 'ABC Textile Ltd',
  calculatedAt: '2026-10-19T12:00:00.000Z',
  summary: {
    tenantId: 'AIC-2026-0002',
    customerName: 'ABC Textile Ltd',
    totalMaterialsAssessedCount: 150,
    totalCandidatesIdentifiedCount: 3,
    awaitingTechnicalReviewCount: 2,
    technicallyVerifiedCount: 1,
    rejectedCount: 0,
    potentialMatchCount: 0,
    candidatesWithMissingTechnicalDataCount: 2,
    totalExpenditureUnderReviewInr: 12500000,
    totalExpenditureUnderReviewCr: 1.25,
    financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
    commercialSavingsQuantifiedInr: 0,
    commercialSavingsQuantifiedCr: 0
  },
  candidates: [
    {
      candidateId: 'SPEC-RAT-RAW-001',
      identificationType: 'DUPLICATE_CODE',
      identificationRationale: 'Identical material code used with differing text descriptions',
      spendCategory: 'Raw Materials',
      primaryItem: {
        code: 'MAT-101',
        description: 'Cotton Yarn 30s Combed Compact',
        normalizedDescription: 'cotton yarn 30s combed compact',
        plant: 'Plant 1',
        totalSpendInr: 5000000,
        totalQuantity: 20000,
        uom: 'kg',
        transactionCount: 10,
        suppliersCount: 2
      },
      comparisonItem: {
        code: 'MAT-101',
        description: 'Cotton Yarn 30s Carded',
        normalizedDescription: 'cotton yarn 30s carded',
        plant: 'Plant 1',
        totalSpendInr: 3500000,
        totalQuantity: 15000,
        uom: 'kg',
        transactionCount: 7,
        suppliersCount: 1
      },
      similarityScore: 0.75,
      technicalAttributes: [
        {
          attributeName: 'Dimensions / Sizing',
          sourceValue: null,
          candidateValue: null,
          matchStatus: 'BOTH_MISSING',
          isCritical: true
        },
        {
          attributeName: 'Material Grade / Spec',
          sourceValue: 'cotton',
          candidateValue: 'cotton',
          matchStatus: 'MATCH',
          isCritical: true
        }
      ],
      differencesIdentified: [],
      missingAttributesDisclosed: ['Dimensions / Sizing missing from both items.'],
      hasMissingTechnicalData: true,
      expenditureUnderReviewInr: 8500000,
      expenditureUnderReviewCr: 0.85,
      quantityUnderReview: 35000,
      reviewStatus: 'AWAITING_TECHNICAL_REVIEW',
      reviewHistory: [],
      financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
      potentialRelatedLevers: ['LEVER_1', 'LEVER_3'],
      nextRequiredAction: 'Route candidate to authorised engineering/plant technical reviewer'
    },
    {
      candidateId: 'SPEC-RAT-RAW-002',
      identificationType: 'EQUIVALENT_SPECIFICATION',
      identificationRationale: 'All extracted technical attributes are identical',
      spendCategory: 'Raw Materials',
      primaryItem: {
        code: 'MAT-201',
        description: 'Polyester Staple Fibre 1.2D 38MM Semi Dull',
        normalizedDescription: 'polyester staple fibre 1.2d 38mm semi dull',
        plant: 'Plant 1',
        totalSpendInr: 2000000,
        totalQuantity: 10000,
        uom: 'kg',
        transactionCount: 4,
        suppliersCount: 1
      },
      comparisonItem: {
        code: 'MAT-202',
        description: 'PSF 1.2D 38MM SD',
        normalizedDescription: 'psf 1.2d 38mm sd',
        plant: 'Plant 2',
        totalSpendInr: 2000000,
        totalQuantity: 10000,
        uom: 'kg',
        transactionCount: 4,
        suppliersCount: 1
      },
      similarityScore: 0.85,
      technicalAttributes: [
        {
          attributeName: 'Dimensions / Sizing',
          sourceValue: '38mm',
          candidateValue: '38mm',
          matchStatus: 'MATCH',
          isCritical: true
        }
      ],
      differencesIdentified: [],
      missingAttributesDisclosed: [],
      hasMissingTechnicalData: false,
      expenditureUnderReviewInr: 4000000,
      expenditureUnderReviewCr: 0.4,
      quantityUnderReview: 20000,
      reviewStatus: 'TECHNICALLY_VERIFIED',
      reviewHistory: [],
      financialBenefitStatus: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS,
      potentialRelatedLevers: ['LEVER_1', 'LEVER_4'],
      nextRequiredAction: 'Technical equivalence approved; prepare scope for Phase 2 commercial review'
    }
  ],
  methodologyDisclosures: ['Rule 1: Zero savings claimed.'],
  financialDisclaimer: SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS
};

describe('SpecificationRationalisationView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(<SpecificationRationalisationView assessmentId="AIC-2026-0002" />);
    expect(screen.getByText(/Loading Lever 8 Specification Rationalisation/)).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    );
    render(<SpecificationRationalisationView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load Specification Rationalisation/)).toBeInTheDocument();
    });
  });

  it('renders title, KPI summary cards, financial disclaimer, and candidate table', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockResult })
      })
    );

    render(<SpecificationRationalisationView assessmentId="AIC-2026-0002" onNavigateBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(SPECIFICATION_UI_STRINGS.TITLE)).toBeInTheDocument();
      expect(screen.getByText(SPECIFICATION_UI_STRINGS.BADGE_PHASE_1)).toBeInTheDocument();
    });

    // Governance banner
    expect(screen.getByText(SPECIFICATION_FINANCIAL_DISCLOSURES.PHASE_1_STATUS)).toBeInTheDocument();

    // KPI cards
    expect(screen.getByText('150')).toBeInTheDocument(); // Materials
    expect(screen.getByText('3')).toBeInTheDocument(); // Total Candidates
    expect(screen.getByText('₹1.25 Cr')).toBeInTheDocument(); // Expenditure
    expect(screen.getByText('₹0.00 Cr')).toBeInTheDocument(); // Commercial Savings = 0

    // Candidates Table
    expect(screen.getByText('SPEC-RAT-RAW-001')).toBeInTheDocument();
    expect(screen.getByText('SPEC-RAT-RAW-002')).toBeInTheDocument();
  });

  it('triggers excel export when export button is clicked', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockResult })
      })
    );

    render(<SpecificationRationalisationView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByText(SPECIFICATION_UI_STRINGS.BTN_EXPORT_EXCEL)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(SPECIFICATION_UI_STRINGS.BTN_EXPORT_EXCEL));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/module2/sourcing/specification-rationalisation/export-excel'),
      '_blank'
    );
  });

  it('filters candidates when tab buttons are clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockResult })
      })
    );

    render(<SpecificationRationalisationView assessmentId="AIC-2026-0002" />);
    await waitFor(() => {
      expect(screen.getByText('SPEC-RAT-RAW-001')).toBeInTheDocument();
    });

    // Click Verified tab
    const verifiedBtn = screen.getByText(/Technically Verified \(1\)/);
    fireEvent.click(verifiedBtn);

    expect(screen.getByText('SPEC-RAT-RAW-002')).toBeInTheDocument();
    expect(screen.queryByText('SPEC-RAT-RAW-001')).not.toBeInTheDocument();
  });
});

describe('SpecificationRationalisationReviewModal Component', () => {
  const candidate = mockResult.candidates[0] as SpecificationCandidateItem;

  it('does not render when isOpen is false', () => {
    render(
      <SpecificationRationalisationReviewModal
        isOpen={false}
        candidate={candidate}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={vi.fn()}
        isSubmitting={false}
      />
    );
    expect(screen.queryByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).not.toBeInTheDocument();
  });

  it('renders modal with attribute matrix and validates form inputs', async () => {
    const handleSubmit = vi.fn();
    render(
      <SpecificationRationalisationReviewModal
        isOpen={true}
        candidate={candidate}
        assessmentId="AIC-2026-0002"
        onClose={vi.fn()}
        onSubmitReview={handleSubmit}
        isSubmitting={false}
      />
    );

    expect(screen.getByText(SPECIFICATION_UI_STRINGS.MODAL_TITLE)).toBeInTheDocument();
    expect(screen.getByText('SPEC-RAT-RAW-001')).toBeInTheDocument();
    expect(screen.getByText('Dimensions / Sizing')).toBeInTheDocument();
    expect(screen.getByText('BOTH_MISSING')).toBeInTheDocument();

    // Attempt submit with empty reviewer name
    fireEvent.click(screen.getByText(SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW));
    expect(screen.getByText(/Please provide the authorised reviewer full name/)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Fill reviewer name
    const nameInput = screen.getByPlaceholderText(/Dr. A. Sharma/);
    fireEvent.change(nameInput, { target: { value: 'Dr. Engineering Reviewer' } });

    // Attempt submit without justification
    fireEvent.click(screen.getByText(SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW));
    expect(screen.getByText(/Technical justification is mandatory/)).toBeInTheDocument();

    // Fill justification
    const justificationInput = screen.getByPlaceholderText(/State engineering basis/);
    fireEvent.change(justificationInput, { target: { value: 'Specification conforms to ASTM standards' } });

    // Now submit successfully
    fireEvent.click(screen.getByText(SPECIFICATION_UI_STRINGS.BTN_SUBMIT_REVIEW));
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewerName: 'Dr. Engineering Reviewer',
        technicalJustification: 'Specification conforms to ASTM standards',
        candidateId: 'SPEC-RAT-RAW-001'
      })
    );
  });
});
