/**
 * Coverage tests for PairwisePriceComparisonView: empty notice, checklist results, and restricted comparisons.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PairwisePriceComparisonView } from '../../../src/components/module2/PairwisePriceComparisonView';
import type { SupplierPairPriceComparisonProof } from '../../../src/types/module2EvidenceChain';
import { buildPairwisePriceProofs } from '../../fixtures/module2CoverageFixtures';

const [VALID_PROOF] = buildPairwisePriceProofs();

const RESTRICTED_PROOF: SupplierPairPriceComparisonProof = {
  ...VALID_PROOF,
  priceDifference: 4200,
  priceDifferencePct: 6.9,
  comparabilityChecklist: {
    specificationMatch: true,
    uomMatch: false,
    currencyMatch: false,
    geographyMatch: false,
    timeWindowMatch: true,
    isValidComparison: false
  }
};

describe('PairwisePriceComparisonView coverage', () => {
  it.each<[string, SupplierPairPriceComparisonProof[] | undefined]>([
    ['no proofs are supplied', undefined],
    ['the proof list is empty', []]
  ])('renders only the empty notice when %s', (_label, proofs) => {
    render(<PairwisePriceComparisonView proofs={proofs} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows each supplier pair with its price spread and paid unit prices', () => {
    render(<PairwisePriceComparisonView proofs={[VALID_PROOF]} />);

    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getAllByText(VALID_PROOF.supplierA.supplierName).length).toBeGreaterThan(0);
    expect(screen.getAllByText(VALID_PROOF.supplierB.supplierName).length).toBeGreaterThan(0);
    expect(screen.getByText(/₹1250\.00\/MT \(2\.0%\)/)).toBeInTheDocument();
    expect(screen.getByText(/₹61250\.00/)).toBeInTheDocument();
    expect(screen.getByText(/₹60000\.00/)).toBeInTheDocument();
  });

  it('shows matching checklist results and no restriction when every check passes', () => {
    render(<PairwisePriceComparisonView proofs={[VALID_PROOF]} />);

    expect(screen.getByText(/UOM:\s*MATCH/)).toBeInTheDocument();
    expect(screen.getByText(/Currency:\s*MATCH/)).toBeInTheDocument();
    expect(screen.getByText(/Geography:\s*MATCH/)).toBeInTheDocument();
    expect(screen.queryByText(/Comparability Restricted/)).not.toBeInTheDocument();
  });

  it('shows mismatched checks and restricts a comparison that fails validation', () => {
    render(<PairwisePriceComparisonView proofs={[RESTRICTED_PROOF]} />);

    expect(screen.getByText(/UOM:\s*DIFF/)).toBeInTheDocument();
    expect(screen.getByText(/Currency:\s*DIFF/)).toBeInTheDocument();
    expect(screen.getByText(/Geography:\s*N\/A/)).toBeInTheDocument();
    expect(screen.getByText(/Comparability Restricted/)).toBeInTheDocument();
  });

  it('renders one card per proof, keyed by the supplier pair', () => {
    render(<PairwisePriceComparisonView proofs={[VALID_PROOF, RESTRICTED_PROOF]} />);

    expect(screen.getAllByText(VALID_PROOF.supplierA.supplierName)).toHaveLength(4);
    expect(screen.getByText(/₹4200\.00\/MT \(6\.9%\)/)).toBeInTheDocument();
  });
});
