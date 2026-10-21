/**
 * Module 2 — Lever 10: Alternate Sourcing View Unit Tests
 * Compliant with Rule 1, 4, 7, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlternateSourcingView } from '../../../src/components/module2/AlternateSourcingView';
import { ALTERNATE_SOURCING_UI_STRINGS } from '../../../src/constants/module2AlternateSourcing';
import type { AlternateSourcingResult } from '../../../src/types/module2AlternateSourcing';

const mockResult: AlternateSourcingResult = {
  assessmentId: 'AIC-2026-0001',
  summary: {
    totalEligibleMaterials: 3887,
    singleSourceMaterialsCount: 13,
    totalPotentialVendorsAllLocations: 21103,
    totalPotentialVendorsPreferredRegion: 3159,
    deduplicatedDistinctVendorsAllLocations: 21103,
    deduplicatedDistinctVendorsPreferredRegion: 3159,
    cumulativeOpportunityVendorMatches: 25695,
    totalCurrentSuppliersIdentified: 2,
    totalCurrentSuppliersMatchedInMaster: 2,
    totalCurrentSuppliersExcluded: 2,
    overallDistinctVendorPoolEstimate: 614864,
    potentialFinancialSavingsInr: 0,
    potentialFinancialSavingsCr: 0,
    isDiscoveryOnly: true
  },
  opportunities: [
    {
      opportunityId: 'OPP-ALT-001',
      materialCode: '1100528',
      materialDescription: 'CC COPPER WIRE ROD 8MM',
      spendCategory: '11004',
      subCategory: 'electric wires',
      specification: null,
      customerPlant: '1021',
      customerPreferredState: 'MAHARASHTRA',
      customerPreferredCity: 'MUMBAI',
      relevantSpendInr: 6521402115.23,
      relevantSpendCr: 652.14,
      currentSupplierCount: 2,
      currentSuppliers: ['VEDANTA LIMITED', 'HINDALCO INDUSTRIES LTD.'],
      matchedVendorCategory: 'electric wires',
      matchType: 'EXACT',
      matchTypeRationale: 'Conductive wire products mapped to electric wires.',
      potentialVendorsAllLocations: 258,
      potentialVendorsPreferredRegion: 17,
      exactMatchesCount: 258,
      hierarchyMatchesCount: 0,
      synonymMatchesCount: 0,
      relatedMatchesCount: 11047,
      qualifiedAlternativesCount: 'DATA_UNAVAILABLE',
      qualificationStatus: 'UNQUALIFIED',
      excludedCurrentSuppliersCount: 1,
      excludedSupplierNames: ['VEDANTA LIMITED'],
      geographicBreakdown: {
        sameCityCount: 0,
        sameStateCount: 17,
        otherStatesCount: 241,
        allLocationsCount: 258,
        preferredRegionCount: 17,
        topStates: [{ state: 'MAHARASHTRA', count: 17 }],
        topCities: [{ city: 'MUMBAI', count: 0 }]
      },
      contactCompleteness: {
        hasWebsiteCount: 78,
        hasEmailCount: 0,
        hasPhoneCount: 258,
        missingContactCount: 180,
        hasWebsiteRatioPct: 30.2,
        hasEmailRatioPct: 0
      },
      disclosures: [ALTERNATE_SOURCING_UI_STRINGS.NOTICE_DISCOVERY_ONLY]
    },
    {
      opportunityId: 'OPP-ALT-002',
      materialCode: '1102401',
      materialDescription: 'EXPANSION BOLT L TYPE M 8 X 60',
      spendCategory: '11024',
      subCategory: 'Fasteners',
      specification: null,
      customerPlant: '1043',
      customerPreferredState: 'MAHARASHTRA',
      customerPreferredCity: 'MUMBAI',
      relevantSpendInr: 557300000,
      relevantSpendCr: 55.73,
      currentSupplierCount: 1,
      currentSuppliers: ['CHINAR INTERNATIONAL'],
      matchedVendorCategory: 'Fasteners',
      matchType: 'EXACT',
      matchTypeRationale: 'Direct mechanical hardware mapping to Fasteners category.',
      potentialVendorsAllLocations: 4399,
      potentialVendorsPreferredRegion: 295,
      exactMatchesCount: 4399,
      hierarchyMatchesCount: 0,
      synonymMatchesCount: 0,
      relatedMatchesCount: 3321,
      qualifiedAlternativesCount: 'DATA_UNAVAILABLE',
      qualificationStatus: 'UNQUALIFIED',
      excludedCurrentSuppliersCount: 0,
      excludedSupplierNames: [],
      geographicBreakdown: {
        sameCityCount: 10,
        sameStateCount: 295,
        otherStatesCount: 4104,
        allLocationsCount: 4399,
        preferredRegionCount: 295,
        topStates: [{ state: 'MAHARASHTRA', count: 295 }],
        topCities: [{ city: 'MUMBAI', count: 10 }]
      },
      contactCompleteness: {
        hasWebsiteCount: 1677,
        hasEmailCount: 22,
        hasPhoneCount: 4398,
        missingContactCount: 2722,
        hasWebsiteRatioPct: 38.1,
        hasEmailRatioPct: 0.5
      },
      disclosures: [ALTERNATE_SOURCING_UI_STRINGS.NOTICE_DISCOVERY_ONLY]
    }
  ],
  availableStates: ['MAHARASHTRA', 'GUJARAT'],
  availableCities: ['MUMBAI', 'PUNE'],
  stateToCitiesMap: {
    MAHARASHTRA: ['ALL_CITIES', 'MUMBAI', 'PUNE'],
    GUJARAT: ['ALL_CITIES', 'AHMEDABAD']
  },
  disclosures: [
    ALTERNATE_SOURCING_UI_STRINGS.NOTICE_DISCOVERY_ONLY,
    ALTERNATE_SOURCING_UI_STRINGS.NOTICE_SAVINGS_SAFEGUARD
  ]
};

describe('AlternateSourcingView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockResult })
    });
  });

  it('renders header, badge, and discovery safeguard notice', async () => {
    render(<AlternateSourcingView assessmentId="AIC-2026-0001" />);

    expect(await screen.findByText(ALTERNATE_SOURCING_UI_STRINGS.TITLE)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.BADGE)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.DISCOVERY_NOTICE)).toBeInTheDocument();
  });

  it('renders 6 KPI cards with strictly ₹0.00 commercial savings', async () => {
    render(<AlternateSourcingView assessmentId="AIC-2026-0001" />);

    expect(await screen.findByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_ELIGIBLE_MATERIALS)).toBeInTheDocument();
    expect(screen.getByText('3,887')).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_SINGLE_SOURCE_RISKS)).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('21,103')).toBeInTheDocument();
    expect(screen.getByText('3,159')).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.VALUE_ZERO_SAVINGS)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.SUB_UNVERIFIED_PRICE)).toBeInTheDocument();
  });

  it('renders opportunity cards with customer data, supplier counts, and vendor pool', async () => {
    render(<AlternateSourcingView assessmentId="AIC-2026-0001" />);

    expect(await screen.findByText('CC COPPER WIRE ROD 8MM')).toBeInTheDocument();
    expect(screen.getByText('EXPANSION BOLT L TYPE M 8 X 60')).toBeInTheDocument();
    expect(screen.getByText('SINGLE-SOURCE RISK')).toBeInTheDocument();
    expect(screen.getByText('1 EXCLUDED FROM CATEGORY POOL')).toBeInTheDocument();
  });

  it('toggles tabs between all materials, single source, and disclosures', async () => {
    render(<AlternateSourcingView assessmentId="AIC-2026-0001" />);

    await screen.findByText('CC COPPER WIRE ROD 8MM');

    // Click Single-Source tab
    fireEvent.click(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.TAB_SINGLE_SOURCE));
    expect(screen.queryByText('CC COPPER WIRE ROD 8MM')).not.toBeInTheDocument();
    expect(screen.getByText('EXPANSION BOLT L TYPE M 8 X 60')).toBeInTheDocument();

    // Click Disclosures tab
    fireEvent.click(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.TAB_DISCLOSURES));
    expect(screen.getByText(/Governance, Deduplication & Commercial Safeguards/)).toBeInTheDocument();
    expect(screen.getByText(/Financial savings cannot be calculated/)).toBeInTheDocument();
  });

  it('handles API errors gracefully and allows retry', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network offline'));

    render(<AlternateSourcingView assessmentId="AIC-2026-0001" />);

    expect(await screen.findByText(/Network offline/)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.ERROR_RETRY)).toBeInTheDocument();

    // Mock recovery on retry
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResult })
    });

    fireEvent.click(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.ERROR_RETRY));
    expect(await screen.findByText('CC COPPER WIRE ROD 8MM')).toBeInTheDocument();
  });

  it('changes filter selections and triggers refetch', async () => {
    render(<AlternateSourcingView assessmentId="AIC-2026-0001" />);
    await screen.findByText('CC COPPER WIRE ROD 8MM');

    // Change state
    const stateSelect = screen.getByDisplayValue('MAHARASHTRA');
    fireEvent.change(stateSelect, { target: { value: 'GUJARAT' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('preferredState=GUJARAT'),
        expect.anything()
      );
    });
  });
});
