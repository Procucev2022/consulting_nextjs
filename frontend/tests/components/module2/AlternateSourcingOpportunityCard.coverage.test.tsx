/**
 * Module 2 coverage: AlternateSourcingOpportunityCard match-type flags, supplier list fallback, and notices.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlternateSourcingOpportunityCard } from '../../../src/components/module2/AlternateSourcingOpportunityCard';
import { ALTERNATE_SOURCING_UI_STRINGS, MATCH_TYPE_LABELS } from '../../../src/constants/module2AlternateSourcing';
import { buildAlternateSourcingOpportunity } from '../../fixtures/module2CoverageFixtures';

describe('AlternateSourcingOpportunityCard coverage', () => {
  it('shows an exact match with its verified incumbents and spend', () => {
    const opportunity = buildAlternateSourcingOpportunity();
    render(<AlternateSourcingOpportunityCard opportunity={opportunity} />);

    expect(screen.getByTestId(`opportunity-card-${opportunity.opportunityId}`)).toBeInTheDocument();
    expect(screen.getByText(opportunity.materialDescription)).toBeInTheDocument();
    expect(screen.getByText(MATCH_TYPE_LABELS.EXACT)).toBeInTheDocument();
    expect(screen.getByText(opportunity.currentSuppliers.join(', '))).toBeInTheDocument();
    expect(screen.getByText(`₹${opportunity.relevantSpendCr.toFixed(2)} Cr`)).toBeInTheDocument();
    expect(screen.getByText(/1,407/)).toBeInTheDocument();
  });

  it('flags an unmatched card with no verified suppliers and no related matches', () => {
    const opportunity = buildAlternateSourcingOpportunity({
      opportunityId: 'OPP-ALT-STL-003',
      matchType: 'UNMATCHED',
      currentSupplierCount: 0,
      currentSuppliers: [],
      excludedCurrentSuppliersCount: 0,
      exclusionLimitationNotice: undefined,
      relatedMatchesCount: 0
    });
    render(<AlternateSourcingOpportunityCard opportunity={opportunity} />);

    expect(screen.getByTestId(`opportunity-card-${opportunity.opportunityId}`)).toBeInTheDocument();
    expect(screen.getByText(MATCH_TYPE_LABELS.UNMATCHED)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.LBL_CURRENT_SUPPLIERS, { exact: false })).toBeInTheDocument();
  });

  it('shows the single-source hierarchy match with its exclusion notice and related-category count', () => {
    const opportunity = buildAlternateSourcingOpportunity({
      opportunityId: 'OPP-ALT-STL-002',
      materialDescription: 'HOT ROLLED ANGLE 50X50X6 MS',
      matchType: 'HIERARCHY',
      currentSupplierCount: 1,
      currentSuppliers: ['JINDAL STAINLESS LIMITED'],
      excludedCurrentSuppliersCount: 0,
      exclusionLimitationNotice: 'Supplier record for Jindal Stainless is missing category tags.',
      relatedMatchesCount: 1407
    });
    render(<AlternateSourcingOpportunityCard opportunity={opportunity} />);

    expect(screen.getByText(MATCH_TYPE_LABELS.HIERARCHY)).toBeInTheDocument();
    expect(screen.getByText(opportunity.exclusionLimitationNotice)).toBeInTheDocument();
    expect(screen.getByText(/1,407/)).toBeInTheDocument();
  });

  it('labels incumbent exclusion and qualification as unavailable for aggregate-only D1 data', () => {
    const opportunity = buildAlternateSourcingOpportunity({
      excludedCurrentSuppliersCount: null,
      exclusionLimitationNotice: ALTERNATE_SOURCING_UI_STRINGS.EXCLUSION_UNAVAILABLE_NOTICE,
      qualificationStatus: 'DATA_UNAVAILABLE',
      qualifiedAlternativesCount: 'DATA_UNAVAILABLE'
    });
    render(<AlternateSourcingOpportunityCard opportunity={opportunity} />);

    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.EXCLUSION_UNAVAILABLE_NOTICE)).toBeInTheDocument();
    expect(screen.getAllByText(ALTERNATE_SOURCING_UI_STRINGS.VALUE_DATA_UNAVAILABLE).length).toBeGreaterThan(0);
    expect(screen.queryByText(/EXCLUDED FROM CATEGORY POOL/)).not.toBeInTheDocument();
  });
});
