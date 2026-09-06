import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { mockTenant } from '../../src/data/mockData';

describe('Header Component', () => {
  const defaultProps = {
    tenant: mockTenant,
    onSelectTenant: vi.fn(),
    currency: 'INR' as const,
    onSelectCurrency: vi.fn(),
    onOpenReport: vi.fn(),
    theme: 'light' as const,
    onSelectTheme: vi.fn()
  };

  it('renders correctly with light theme and default props', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('PROCUCEV')).toBeInTheDocument();
    expect(screen.getByText('ENGINE 2.0')).toBeInTheDocument();
    expect(screen.getByText(mockTenant.enterprise_name)).toBeInTheDocument();
    expect(screen.getByText('₹732.41 Cr')).toBeInTheDocument();
  });

  it('renders fallback spend if total_spend_evaluated_inr is undefined', () => {
    const tenantWithoutINR = { ...mockTenant, total_spend_evaluated_inr: undefined as any };
    render(<Header {...defaultProps} tenant={tenantWithoutINR} />);
    expect(screen.getByText('₹732.41 Cr')).toBeInTheDocument();
  });

  it('handles theme switching between light and dark', () => {
    const onSelectTheme = vi.fn();
    const { rerender } = render(<Header {...defaultProps} onSelectTheme={onSelectTheme} />);

    const darkBtn = screen.getByTitle('Switch to Dark Mode');
    fireEvent.click(darkBtn);
    expect(onSelectTheme).toHaveBeenCalledWith('dark');

    rerender(<Header {...defaultProps} theme="dark" onSelectTheme={onSelectTheme} />);
    const lightBtn = screen.getByTitle('Switch to Light Mode');
    fireEvent.click(lightBtn);
    expect(onSelectTheme).toHaveBeenCalledWith('light');
  });

  it('handles currency selection', () => {
    const onSelectCurrency = vi.fn();
    render(<Header {...defaultProps} onSelectCurrency={onSelectCurrency} />);

    const usdBtn = screen.getByTitle('USD Base');
    fireEvent.click(usdBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('USD');

    const eurBtn = screen.getByTitle('EUR Base');
    fireEvent.click(eurBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('EUR');

    const gbpBtn = screen.getByTitle('GBP Base');
    fireEvent.click(gbpBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('GBP');

    const inrBtn = screen.getByTitle('Indian Rupee in Crores (₹ Cr)');
    fireEvent.click(inrBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('INR');
  });

  it('triggers onOpenReport when clicking Executive Brief', () => {
    const onOpenReport = vi.fn();
    render(<Header {...defaultProps} onOpenReport={onOpenReport} />);

    const reportBtn = screen.getByRole('button', { name: /Executive Brief/i });
    fireEvent.click(reportBtn);
    expect(onOpenReport).toHaveBeenCalledTimes(1);
  });

  it('triggers onSelectTenant when clicking tenant badge', () => {
    const onSelectTenant = vi.fn();
    render(<Header {...defaultProps} onSelectTenant={onSelectTenant} />);

    const tenantBadge = screen.getByTestId('tenant-badge');
    fireEvent.click(tenantBadge);
    expect(onSelectTenant).toHaveBeenCalled();
  });
});

