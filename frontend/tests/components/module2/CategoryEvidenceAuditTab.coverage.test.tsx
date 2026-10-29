/**
 * Module 2 coverage: CategoryEvidenceAuditTab count fallbacks and the drawer and trace modal close handlers.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryEvidenceAuditTab } from '../../../src/components/module2/CategoryEvidenceAuditTab';
import { UI_STRINGS } from '../../../src/constants';
import { buildSteelPlateCategoryProfile } from '../../fixtures/module2CoverageFixtures';

// The modal close controls are icon-only buttons, so they are located by their empty text content.
const getIconOnlyButtons = (): HTMLElement[] =>
  screen.getAllByRole('button').filter((button) => button.textContent === '');

describe('CategoryEvidenceAuditTab coverage', () => {
  it('shows the calculation provenance and the audited transaction count', () => {
    const profile = buildSteelPlateCategoryProfile();
    render(<CategoryEvidenceAuditTab profile={profile} />);

    expect(screen.getByText(UI_STRINGS.module2Sourcing.sectionAuditHandoff)).toBeInTheDocument();
    expect(screen.getByText(profile.calculationId)).toBeInTheDocument();
    expect(screen.getByText(profile.calculationVersion)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\b3\b/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /0\.84/ })).toBeInTheDocument();
  });

  it('opens the transaction drawer and closes it through its header control', () => {
    render(<CategoryEvidenceAuditTab profile={buildSteelPlateCategoryProfile()} />);

    fireEvent.click(screen.getByRole('button', { name: /\b3\b/ }));
    expect(screen.getByText('PO-STL-1001')).toBeInTheDocument();

    const closeControls = getIconOnlyButtons();
    expect(closeControls).toHaveLength(1);
    fireEvent.click(closeControls[0]);

    expect(screen.queryByText('PO-STL-1001')).not.toBeInTheDocument();
  });

  it('opens the calculation trace and closes it through its header control', () => {
    const profile = buildSteelPlateCategoryProfile();
    render(<CategoryEvidenceAuditTab profile={profile} />);

    fireEvent.click(screen.getByRole('button', { name: /0\.84/ }));
    expect(screen.getByText(profile.completeCalculationTrace.questionPrompt)).toBeInTheDocument();

    const closeControls = getIconOnlyButtons();
    expect(closeControls).toHaveLength(1);
    fireEvent.click(closeControls[0]);

    expect(screen.queryByText(profile.completeCalculationTrace.questionPrompt)).not.toBeInTheDocument();
  });

  it('falls back to the profile transaction count and a zero opportunity figure when evidence is absent', () => {
    const profile = buildSteelPlateCategoryProfile({
      transactionEvidenceRecords: undefined,
      transactionCount: 45,
      netQuantifiableOpportunityInrCr: null
    });
    render(<CategoryEvidenceAuditTab profile={profile} />);

    expect(screen.getByRole('button', { name: /\b45\b/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /0\.00/ })).toBeInTheDocument();
  });
});
