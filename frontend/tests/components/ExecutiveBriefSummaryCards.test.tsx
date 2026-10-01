import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveBriefSummaryCards } from '../../src/components/executiveBrief/ExecutiveBriefSummaryCards';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';
import type { ExecutiveBriefSummaryCardItem } from '../../src/types';

describe('ExecutiveBriefSummaryCards', () => {
  const mockCards: ExecutiveBriefSummaryCardItem[] = [
    {
      id: 'kpi-total-spend',
      label: 'Total Evaluated Spend',
      valueInr: 57420000000,
      formattedValue: '₹5,742.00 Cr',
      module: 'Module 1',
      evidenceRef: 'TX-00001..TX-31671'
    },
    {
      id: 'kpi-identified-opp',
      label: 'Identified Opportunity',
      valueInr: 4120000000,
      formattedValue: '₹412.00 Cr',
      module: 'Module 2 & 3',
      evidenceRef: '14 Core Sourcing Levers'
    },
    {
      id: 'kpi-approved-savings',
      label: 'Approved Savings',
      valueInr: 1430000000,
      formattedValue: '₹143.00 Cr',
      module: 'Module 4',
      evidenceRef: 'Savings Engine Wave 1'
    },
    {
      id: 'kpi-transactions',
      label: 'Transactions Analysed',
      valueInr: 31671,
      formattedValue: '31,671 POs',
      module: 'Module 1',
      evidenceRef: 'ERP Purchase History'
    },
    {
      id: 'kpi-suppliers',
      label: 'Number of Suppliers',
      valueInr: 1482,
      formattedValue: '1,482 Vendors',
      module: 'Module 1',
      evidenceRef: 'Master Vendor Register'
    },
    {
      id: 'kpi-categories',
      label: 'Number of Categories',
      valueInr: 14,
      formattedValue: '14 Categories',
      module: 'Module 2',
      evidenceRef: 'UNSPSC Classification'
    },
    {
      id: 'kpi-realized-savings',
      label: 'Realized Savings',
      valueInr: 680000000,
      formattedValue: '₹68.00 Cr',
      module: 'Module 4',
      evidenceRef: 'ERP Invoices'
    }
  ];

  it('renders all summary KPI cards accurately', () => {
    const onViewEvidence = vi.fn();
    render(<ExecutiveBriefSummaryCards cards={mockCards} onViewEvidence={onViewEvidence} />);

    expect(screen.getByText('Total Evaluated Spend')).toBeInTheDocument();
    expect(screen.getByText('₹5,742.00 Cr')).toBeInTheDocument();
    expect(screen.getByText('Identified Opportunity')).toBeInTheDocument();
    expect(screen.getByText('₹412.00 Cr')).toBeInTheDocument();
  });

  it('triggers onViewEvidence when clicking View Evidence button', () => {
    const onViewEvidence = vi.fn();
    render(<ExecutiveBriefSummaryCards cards={mockCards} onViewEvidence={onViewEvidence} />);

    const evidenceBtn = screen.getByTestId('evidence-btn-kpi-total-spend');
    fireEvent.click(evidenceBtn);
    expect(onViewEvidence).toHaveBeenCalledWith(mockCards[0]);
  });
});
