import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PCBIConstituentReviewTable } from '../../../src/components/admin/pcbi/PCBIConstituentReviewTable';
import { UI_STRINGS } from '../../../src/constants';
import type { PCBIConstituentTotalSummary } from '../../../src/types/pcbiAdmin';

describe('PCBIConstituentReviewTable Unit Tests', () => {
  const mockTotals: PCBIConstituentTotalSummary[] = [
    {
      pcbiId: 'ALUMINIUM',
      benchmarkName: 'Aluminium Standard',
      totalWeight: 100,
      differenceFrom100: 0,
      status: 'PASS'
    },
    {
      pcbiId: 'BEARING',
      benchmarkName: 'Industrial Bearing',
      totalWeight: 70,
      differenceFrom100: -30,
      status: 'WARNING'
    },
    {
      pcbiId: 'STEEL',
      benchmarkName: 'Hot Rolled Coil',
      totalWeight: 105,
      differenceFrom100: 5,
      status: 'WARNING'
    }
  ];

  it('renders nothing when constituentTotals is empty or undefined', () => {
    const { container } = render(<PCBIConstituentReviewTable constituentTotals={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders constituent weight review rows, percentage totals, and status badges', () => {
    render(<PCBIConstituentReviewTable constituentTotals={mockTotals} />);

    expect(screen.getByText(UI_STRINGS.pcbiAdmin.constituentReviewTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colConstituentPcbiId)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colConstituentTotal)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.colConstituentDiff)).toBeInTheDocument();

    // Check ALUMINIUM (PASS)
    expect(screen.getByText('ALUMINIUM')).toBeInTheDocument();
    expect(screen.getByText('Aluminium Standard')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.pcbiAdmin.badgePass)).toBeInTheDocument();

    // Check BEARING (WARNING: 70%, -30%)
    expect(screen.getByText('BEARING')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('-30%')).toBeInTheDocument();

    // Check STEEL (WARNING: 105%, +5%)
    expect(screen.getByText('STEEL')).toBeInTheDocument();
    expect(screen.getByText('105%')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();

    expect(screen.getAllByText(UI_STRINGS.pcbiAdmin.badgeRequiresReview).length).toBe(2);
  });
});
