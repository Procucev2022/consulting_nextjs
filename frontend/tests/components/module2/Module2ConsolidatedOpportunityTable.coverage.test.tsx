/**
 * Coverage tests for Module2ConsolidatedOpportunityTable: lever and status filters, search matching on each field,
 * status badges, and zero-value formatting.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Module2ConsolidatedOpportunityTable } from '../../../src/components/module2/Module2ConsolidatedOpportunityTable';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import type { Module2CanonicalSavingsOpportunity } from '../../../src/types/module2SavingsDeduplication';

const strings = UI_STRINGS.module2SavingsDeduplication;

const BASE_OPPORTUNITY: Module2CanonicalSavingsOpportunity = {
  assessmentId: 'AIC-2026-0002',
  opportunityId: 'OPP-AIC-2026-0002-LEV-01-FABRIC_RAW',
  leverId: 1,
  leverCode: 'LEV-01',
  leverName: 'Direct Price Improvement',
  categoryOrMaterialId: 'FABRIC_RAW',
  categoryOrMaterialName: 'Raw Fabric & Yarn',
  eligibleSpendInr: 50000000,
  eligibleSpendCr: 5,
  transactionScopeCount: 120,
  calculationBasis: 'PEER_PRICE_DISPERSION',
  estimatedGrossSavingsInr: 4500000,
  estimatedGrossSavingsCr: 0.45,
  overlappingOpportunityRefs: [],
  overlapAmountInr: 0,
  overlapAmountCr: 0,
  netEstimatedSavingsInr: 4500000,
  netEstimatedSavingsCr: 0.45,
  deduplicationStatus: 'MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED',
  evidenceValidationStatus: 'VALIDATED_COMMERCIAL',
  approvalStatus: 'APPROVED',
  commerciallyValidatedSavingsInr: 4500000,
  commerciallyValidatedSavingsCr: 0.45,
  isIncrementalBenefit: false,
  auditEvidenceSummary: 'Historical peer price variance across identical items.'
};

function buildOpportunity(overrides: Partial<Module2CanonicalSavingsOpportunity>): Module2CanonicalSavingsOpportunity {
  return { ...BASE_OPPORTUNITY, ...overrides };
}

const ID_LEV01 = 'OPP-AIC-2026-0002-LEV-01-FABRIC_RAW';
const ID_LEV02 = 'OPP-AIC-2026-0002-LEV-02-FABRIC_RAW';
const ID_LEV03 = 'OPP-AIC-2026-0002-LEV-03-ADMIN-PO';
const ID_LEV05 = 'OPP-AIC-2026-0002-LEV-05-CREDIT-CYCLE';
const ID_LEV08 = 'OPP-AIC-2026-0002-LEV-08-SPEC-YARN';

const OPPORTUNITIES: Module2CanonicalSavingsOpportunity[] = [
  buildOpportunity({}),
  buildOpportunity({
    opportunityId: ID_LEV02,
    leverId: 2,
    leverCode: 'LEV-02',
    leverName: 'E-Auction / Dynamic Bidding',
    calculationBasis: 'REVERSE_AUCTION_COMPETITIVE_DISCOVERY',
    estimatedGrossSavingsInr: 3200000,
    estimatedGrossSavingsCr: 0.32,
    overlapAmountInr: 3200000,
    overlapAmountCr: 0.32,
    netEstimatedSavingsInr: 0,
    netEstimatedSavingsCr: 0,
    commerciallyValidatedSavingsInr: 0,
    commerciallyValidatedSavingsCr: 0,
    deduplicationStatus: 'DEDUPLICATED_OVERLAP'
  }),
  buildOpportunity({
    opportunityId: ID_LEV03,
    leverId: 3,
    leverCode: 'LEV-03-ADMIN',
    leverName: 'PO Consolidation (Administrative)',
    categoryOrMaterialId: 'ADMIN-PO',
    categoryOrMaterialName: 'PO Consolidation — Dyes',
    estimatedGrossSavingsInr: 45000,
    estimatedGrossSavingsCr: 0.0045,
    netEstimatedSavingsInr: 45000,
    netEstimatedSavingsCr: 0.0045,
    commerciallyValidatedSavingsInr: 45000,
    commerciallyValidatedSavingsCr: 0.0045,
    deduplicationStatus: 'INCREMENTAL_VALIDATED',
    isIncrementalBenefit: true
  }),
  buildOpportunity({
    opportunityId: ID_LEV05,
    leverId: 5,
    leverCode: 'LEV-05',
    leverName: 'Payment Terms Optimisation',
    categoryOrMaterialId: 'CREDIT-CYCLE-07',
    categoryOrMaterialName: 'Supplier Credit Cycle',
    estimatedGrossSavingsInr: 0,
    estimatedGrossSavingsCr: 0,
    overlapAmountInr: 0,
    overlapAmountCr: 0,
    netEstimatedSavingsInr: 0,
    netEstimatedSavingsCr: 0,
    commerciallyValidatedSavingsInr: 0,
    commerciallyValidatedSavingsCr: 0,
    deduplicationStatus: 'UNRESOLVED_EXCLUDED',
    approvalStatus: 'EXCLUDED_FROM_NET'
  }),
  buildOpportunity({
    opportunityId: ID_LEV08,
    leverId: 8,
    leverCode: 'LEV-08',
    leverName: 'Specification Rationalisation',
    categoryOrMaterialId: 'SPEC-YARN',
    categoryOrMaterialName: 'Blended Yarn Specifications',
    estimatedGrossSavingsInr: 0,
    estimatedGrossSavingsCr: 0,
    overlapAmountInr: 0,
    overlapAmountCr: 0,
    netEstimatedSavingsInr: 0,
    netEstimatedSavingsCr: 0,
    commerciallyValidatedSavingsInr: 0,
    commerciallyValidatedSavingsCr: 0,
    deduplicationStatus: 'EXPLORATORY_PIPELINE',
    evidenceValidationStatus: 'EXPLORATORY_PIPELINE',
    approvalStatus: 'PENDING_REVIEW'
  })
];

function getRow(opportunityId: string): HTMLElement {
  return screen.getAllByRole('row').find((row) => row.textContent?.includes(opportunityId));
}

function visibleOpportunityIds(): string[] {
  return screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent);
}

describe('Module2ConsolidatedOpportunityTable coverage', () => {
  it('lists every opportunity in order with formatted savings values', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    expect(screen.getByText(strings.opportunityRegisterTitle)).toBeInTheDocument();
    expect(visibleOpportunityIds()).toEqual(OPPORTUNITIES.map((opp) => opp.opportunityId));
    expect(within(getRow(ID_LEV01)).getAllByText('₹0.4500 Cr')).toHaveLength(3);
    expect(within(getRow(ID_LEV02)).getByText('-₹0.3200 Cr')).toBeInTheDocument();
    expect(within(getRow(ID_LEV03)).getAllByText('₹0.0045 Cr')).toHaveLength(3);
    expect(within(getRow(ID_LEV05)).getAllByText('₹0.00 Cr')).toHaveLength(3);
  });

  it('shows the deduplication badge that matches each status', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    expect(within(getRow(ID_LEV01)).getByText(strings.badgeRetained)).toBeInTheDocument();
    expect(within(getRow(ID_LEV02)).getByText(strings.badgeDeduplicated)).toBeInTheDocument();
    expect(within(getRow(ID_LEV03)).getByText(strings.badgeIndependent)).toBeInTheDocument();
    expect(within(getRow(ID_LEV05)).getByText(strings.badgeExcluded)).toBeInTheDocument();
  });

  it('shows the raw status for a status without a dedicated badge', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    expect(within(getRow(ID_LEV08)).getByText('EXPLORATORY_PIPELINE')).toBeInTheDocument();
  });

  it('filters by lever', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    fireEvent.change(screen.getByDisplayValue(strings.optAllLevers), { target: { value: 'LEV-02' } });

    expect(visibleOpportunityIds()).toEqual([ID_LEV02]);
  });

  it('filters by deduplication status', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    fireEvent.change(screen.getByDisplayValue(strings.optAllStatuses), {
      target: { value: 'UNRESOLVED_EXCLUDED' }
    });

    expect(visibleOpportunityIds()).toEqual([ID_LEV05]);
  });

  it('combines lever and status filters and shows the empty message when nothing matches', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);
    const leverFilter = screen.getByDisplayValue(strings.optAllLevers);
    const statusFilter = screen.getByDisplayValue(strings.optAllStatuses);

    fireEvent.change(leverFilter, { target: { value: 'LEV-01' } });
    fireEvent.change(statusFilter, { target: { value: 'UNRESOLVED_EXCLUDED' } });

    expect(screen.getByText(strings.emptyOpportunities)).toBeInTheDocument();
    expect(screen.queryByText(ID_LEV01)).not.toBeInTheDocument();
  });

  it('matches the search term against the opportunity id', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: 'lev-03-admin' } });

    expect(visibleOpportunityIds()).toEqual([ID_LEV03]);
  });

  it('matches the search term against the category or material name', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: 'blended' } });

    expect(visibleOpportunityIds()).toEqual([ID_LEV08]);
  });

  it('matches the search term against the material code only when id and name do not match', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: 'credit-cycle-07' } });

    expect(visibleOpportunityIds()).toEqual([ID_LEV05]);
  });

  it('ignores a whitespace-only search and shows every row', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: '   ' } });

    expect(visibleOpportunityIds()).toHaveLength(OPPORTUNITIES.length);
  });

  it('shows the empty message when the search matches no field', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={OPPORTUNITIES} />);

    fireEvent.change(screen.getByPlaceholderText(strings.searchPlaceholder), { target: { value: 'no-such-item' } });

    expect(screen.getByText(strings.emptyOpportunities)).toBeInTheDocument();
  });

  it('shows the empty message when no opportunities are supplied', () => {
    render(<Module2ConsolidatedOpportunityTable opportunities={[]} />);

    expect(screen.getByText(strings.emptyOpportunities)).toBeInTheDocument();
  });
});
