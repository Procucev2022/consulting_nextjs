import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutiveBriefMasterRegisterTable } from '../../src/components/executiveBrief/ExecutiveBriefMasterRegisterTable';
import { EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES } from '../../src/constants';

describe('ExecutiveBriefMasterRegisterTable', () => {
  it('renders all Prompt 274 Section 15 headers and rows with traceability proof', () => {
    const onSelect = vi.fn();
    render(
      <ExecutiveBriefMasterRegisterTable
        opportunities={EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES}
        onSelectOpportunity={onSelect}
      />
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Category & Item')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Eligible Spend')).toBeInTheDocument();
    expect(screen.getByText('Value Type')).toBeInTheDocument();
    expect(screen.getByText('Range (L/B/H)')).toBeInTheDocument();
    expect(screen.getByText('Expected Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Mechanism')).toBeInTheDocument();
    expect(screen.getByText('Overlap Group')).toBeInTheDocument();
    expect(screen.getByText('Traceability Proof')).toBeInTheDocument();

    // Verify first row and transaction sample ID
    const firstOpp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES[0];
    expect(screen.getByText(firstOpp.opportunityId)).toBeInTheDocument();
    expect(screen.getByText(firstOpp.analysis)).toBeInTheDocument();
    expect(screen.getByText(firstOpp.transactionSampleId)).toBeInTheDocument();

    // Click row
    fireEvent.click(screen.getByText(firstOpp.opportunityId));
    expect(onSelect).toHaveBeenCalledWith(firstOpp.opportunityId);
  });

  it('handles optional onSelectOpportunity callback gracefully', () => {
    render(
      <ExecutiveBriefMasterRegisterTable
        opportunities={EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES}
      />
    );

    const firstOpp = EXECUTIVE_BRIEF_MASTER_OPPORTUNITIES[0];
    fireEvent.click(screen.getByText(firstOpp.opportunityId));
    expect(screen.getByText(firstOpp.opportunityId)).toBeInTheDocument();
  });
});
