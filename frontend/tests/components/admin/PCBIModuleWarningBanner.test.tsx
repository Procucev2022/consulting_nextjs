import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PCBIModuleWarningBanner } from '../../../src/components/admin/pcbi/PCBIModuleWarningBanner';

describe('PCBIModuleWarningBanner Component (Part D)', () => {
  it('renders PCBI Master warning banner with explicit scope message and navigation action', () => {
    const handleNav = vi.fn();
    render(<PCBIModuleWarningBanner moduleContext="PCBI_MASTER" onNavigateAction={handleNav} />);

    expect(screen.getByText('PCBI MASTER — SYSTEM REFERENCE DATA')).toBeInTheDocument();
    expect(
      screen.getByText(/Commodity historical benchmark source data must be uploaded through/i)
    ).toBeInTheDocument();

    const navBtn = screen.getByRole('button', { name: /Go to PCBI Data Library/i });
    fireEvent.click(navBtn);
    expect(handleNav).toHaveBeenCalledTimes(1);
  });

  it('renders PCBI Data Library warning banner with explicit scope message and navigation action', () => {
    const handleNav = vi.fn();
    render(<PCBIModuleWarningBanner moduleContext="PCBI_DATA_LIBRARY" onNavigateAction={handleNav} />);

    expect(screen.getByText('PCBI DATA LIBRARY — COMMODITY SOURCE DATA')).toBeInTheDocument();
    expect(
      screen.getByText(/Upload and manage historical market\/reference data used to construct and maintain PCBI series\./i)
    ).toBeInTheDocument();

    const navBtn = screen.getByRole('button', { name: /Go to PCBI Master/i });
    fireEvent.click(navBtn);
    expect(handleNav).toHaveBeenCalledTimes(1);
  });

  it('renders Module 1 Customer Purchase Data warning banner', () => {
    render(<PCBIModuleWarningBanner moduleContext="MODULE_1" />);

    expect(screen.getByText('CUSTOMER PURCHASE DATA')).toBeInTheDocument();
    expect(
      screen.getByText('Customer purchase-history data must be uploaded and managed through Module 1.')
    ).toBeInTheDocument();
  });
});
