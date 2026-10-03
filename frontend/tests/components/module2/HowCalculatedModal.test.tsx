import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HowCalculatedModal, type HowCalculatedData } from '../../../src/components/module2/HowCalculatedModal';

describe('HowCalculatedModal Component', () => {
  const mockData: HowCalculatedData = {
    opportunityId: 'OPP-CALC-TEST-01',
    categoryName: 'Fasteners & Industrial Hardware',
    opportunityType: 'E-Auction Reverse Bidding',
    currentSpendInr: 12500000, // 1.25 Cr
    eligibleSpendInr: 9500000,  // 95 Lakhs
    eligibleQuantity: 85000,
    currentWeightedPrice: 111.76,
    historicalReferencePrice: 98.50,
    priceDifferential: 13.26,
    grossOpportunityInr: 1127100, // 11.27 Lakhs
    overlapAdjustmentInr: 127100, // 1.27 Lakhs
    netOpportunityInr: 1000000,   // 10.00 Lakhs
    confidence: 'HIGH',
    referenceVolumeSharePct: 24.5
  };

  it('renders null when isOpen is false or data is null', () => {
    const { rerender, container } = render(
      <HowCalculatedModal isOpen={false} onClose={vi.fn()} data={mockData} />
    );
    expect(container.firstChild).toBeNull();

    rerender(<HowCalculatedModal isOpen={true} onClose={vi.fn()} data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 9 calculation steps and headers when open', () => {
    render(<HowCalculatedModal isOpen={true} onClose={vi.fn()} data={mockData} />);

    expect(screen.getByText('How Was This Number Calculated?')).toBeInTheDocument();
    expect(screen.getByText(/Fasteners & Industrial Hardware/)).toBeInTheDocument();
    expect(screen.getByText('E-Auction Reverse Bidding')).toBeInTheDocument();

    // Steps
    expect(screen.getByText('Current Category Spend')).toBeInTheDocument();
    expect(screen.getByText('Eligible Spend')).toBeInTheDocument();
    expect(screen.getByText('Eligible Quantity')).toBeInTheDocument();
    expect(screen.getByText('Current Weighted Price')).toBeInTheDocument();
    expect(screen.getByText('Historical Reference Price')).toBeInTheDocument();
    expect(screen.getByText('Price Differential')).toBeInTheDocument();
    expect(screen.getByText('Gross Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Overlap Adjustment')).toBeInTheDocument();
    expect(screen.getByText('NET QUANTIFIABLE OPPORTUNITY')).toBeInTheDocument();

    // Values formatted in Cr or Lakhs
    expect(screen.getByText('₹1.25 Cr')).toBeInTheDocument();
    expect(screen.getByText('₹95.00 Lakhs')).toBeInTheDocument();
    expect(screen.getByText('85,000 Units')).toBeInTheDocument();
    expect(screen.getByText('₹10.00 Lakhs')).toBeInTheDocument();

    // ID and Confidence
    expect(screen.getByText('ID: OPP-CALC-TEST-01')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('triggers onClose when close icon or action button is clicked', () => {
    const handleClose = vi.fn();
    render(<HowCalculatedModal isOpen={true} onClose={handleClose} data={mockData} />);

    const closeIcon = screen.getByLabelText('Close dialog');
    fireEvent.click(closeIcon);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const bottomBtn = screen.getByRole('button', { name: 'Close Calculation Breakdown' });
    fireEvent.click(bottomBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
