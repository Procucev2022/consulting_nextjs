/**
 * Module 2 coverage: AlternateSourcingKpiCards vendor-count fallbacks and empty-summary placeholders.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AlternateSourcingKpiCards } from '../../../src/components/module2/AlternateSourcingKpiCards';
import { ALTERNATE_SOURCING_UI_STRINGS } from '../../../src/constants/module2AlternateSourcing';
import { buildAlternateSourcingSummary } from '../../fixtures/module2CoverageFixtures';

const tileFor = (label: string): HTMLElement => {
  const labelElement = screen.getByText(label);
  return labelElement.parentElement ?? labelElement;
};

describe('AlternateSourcingKpiCards coverage', () => {
  it('labels every tile from UI_STRINGS before a summary is available', () => {
    render(<AlternateSourcingKpiCards selectedState="MAHARASHTRA" />);

    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_ELIGIBLE_MATERIALS)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_SINGLE_SOURCE_RISKS)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_ALL)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_REGION)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_EXCLUDED_SUPPLIERS)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_SAVINGS_PROTECTION)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.VALUE_ZERO_SAVINGS)).toBeInTheDocument();
    expect(screen.getByText(ALTERNATE_SOURCING_UI_STRINGS.KPI_SUB_SAVINGS)).toBeInTheDocument();
  });

  it('shows the deduplicated vendor pools and the supplier and material counts from the summary', () => {
    render(<AlternateSourcingKpiCards summary={buildAlternateSourcingSummary()} selectedState="MAHARASHTRA" />);

    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_ELIGIBLE_MATERIALS)).getByText('3,887')).toBeInTheDocument();
    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_SINGLE_SOURCE_RISKS)).getByText('13')).toBeInTheDocument();
    expect(
      within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_ALL)).getByText('21,103')
    ).toBeInTheDocument();
    expect(
      within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_REGION)).getByText('3,159')
    ).toBeInTheDocument();
    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_EXCLUDED_SUPPLIERS)).getByText('2')).toBeInTheDocument();
  });

  it('shows unavailable instead of presenting cumulative matches as deduplicated counts', () => {
    const summary = buildAlternateSourcingSummary({
      deduplicatedDistinctVendorsAllLocations: undefined,
      deduplicatedDistinctVendorsPreferredRegion: undefined
    });
    render(<AlternateSourcingKpiCards summary={summary} selectedState="MAHARASHTRA" />);

    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_ALL))
      .getByText(ALTERNATE_SOURCING_UI_STRINGS.VALUE_UNAVAILABLE)).toBeInTheDocument();
    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_REGION))
      .getByText(ALTERNATE_SOURCING_UI_STRINGS.VALUE_UNAVAILABLE)).toBeInTheDocument();
  });

  it('shows unavailable when D1 has no deduplicated vendor count', () => {
    const summary = buildAlternateSourcingSummary({
      deduplicatedDistinctVendorsAllLocations: null,
      deduplicatedDistinctVendorsPreferredRegion: null
    });
    render(<AlternateSourcingKpiCards summary={summary} selectedState="MAHARASHTRA" />);

    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_ALL))
      .getByText(ALTERNATE_SOURCING_UI_STRINGS.VALUE_UNAVAILABLE)).toBeInTheDocument();
    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_REGION))
      .getByText(ALTERNATE_SOURCING_UI_STRINGS.VALUE_UNAVAILABLE)).toBeInTheDocument();
  });

  it('names the selected state on the regional pool tile and shows zero exclusions when none are recorded', () => {
    const summary = buildAlternateSourcingSummary({
      totalCurrentSuppliersExcluded: 0,
      totalCurrentSuppliersMatchedInMaster: 0
    });
    render(<AlternateSourcingKpiCards summary={summary} selectedState="GUJARAT" />);

    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_REGION)).getByText(/GUJARAT/)).toBeInTheDocument();
    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_EXCLUDED_SUPPLIERS)).getByText('0')).toBeInTheDocument();
  });

  it('formats a measured zero as zero and a missing summary as a placeholder', () => {
    const summary = buildAlternateSourcingSummary({
      deduplicatedDistinctVendorsAllLocations: 0,
      deduplicatedDistinctVendorsPreferredRegion: 0,
      totalEligibleMaterials: 0,
      singleSourceMaterialsCount: 0
    });
    render(<AlternateSourcingKpiCards summary={summary} selectedState="" />);

    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_ALL)).getByText('0')).toBeInTheDocument();
    expect(within(tileFor(ALTERNATE_SOURCING_UI_STRINGS.KPI_POTENTIAL_VENDORS_REGION)).getByText('0')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${ALTERNATE_SOURCING_UI_STRINGS.LABEL_ALL_STATES}:`))).toBeInTheDocument();
  });
});
