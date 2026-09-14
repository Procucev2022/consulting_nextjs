import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { mockTenant } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';
import { AICEV_LOGO_SRC } from '../../src/constants/app';

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

    // Brand is now rendered as official aiCEV logo image
    const logoImg = screen.getByAltText(UI_STRINGS.header.logoAlt);
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', AICEV_LOGO_SRC);
    expect(screen.getByText(UI_STRINGS.header.subtitle)).toBeInTheDocument();
    expect(screen.getByText(mockTenant.enterprise_name)).toBeInTheDocument();
    expect(screen.getByText(`₹${mockTenant.total_spend_evaluated_inr} Cr`)).toBeInTheDocument();
  });

  it('renders fallback spend if total_spend_evaluated_inr is undefined', () => {
    const tenantWithoutINR = { ...mockTenant, total_spend_evaluated_inr: undefined as any };
    render(<Header {...defaultProps} tenant={tenantWithoutINR} />);
    expect(screen.getByText(UI_STRINGS.header.evaluatedSpendFallback)).toBeInTheDocument();
  });

  it('handles theme switching between light and dark', () => {
    const onSelectTheme = vi.fn();
    const { rerender } = render(<Header {...defaultProps} onSelectTheme={onSelectTheme} />);

    const darkBtn = screen.getByTitle(UI_STRINGS.header.themeToggleDark);
    fireEvent.click(darkBtn);
    expect(onSelectTheme).toHaveBeenCalledWith('dark');

    rerender(<Header {...defaultProps} theme="dark" onSelectTheme={onSelectTheme} />);
    const lightBtn = screen.getByTitle(UI_STRINGS.header.themeToggleLight);
    fireEvent.click(lightBtn);
    expect(onSelectTheme).toHaveBeenCalledWith('light');
  });

  it('handles currency selection', () => {
    const onSelectCurrency = vi.fn();
    render(<Header {...defaultProps} onSelectCurrency={onSelectCurrency} />);

    const usdBtn = screen.getByTitle(UI_STRINGS.header.currencyTitle('USD'));
    fireEvent.click(usdBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('USD');

    const eurBtn = screen.getByTitle(UI_STRINGS.header.currencyTitle('EUR'));
    fireEvent.click(eurBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('EUR');

    const gbpBtn = screen.getByTitle(UI_STRINGS.header.currencyTitle('GBP'));
    fireEvent.click(gbpBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('GBP');

    const inrBtn = screen.getByTitle(UI_STRINGS.header.inrCurrencyTitle);
    fireEvent.click(inrBtn);
    expect(onSelectCurrency).toHaveBeenCalledWith('INR');
  });

  it('triggers onOpenReport when clicking Executive Brief', () => {
    const onOpenReport = vi.fn();
    render(<Header {...defaultProps} onOpenReport={onOpenReport} />);

    const reportBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.header.executiveBrief, 'i') });
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

  it('triggers onStartAnalysis when clicking Deep Spend Scan', () => {
    const onStartAnalysis = vi.fn();
    render(<Header {...defaultProps} onStartAnalysis={onStartAnalysis} />);

    const scanBtn = screen.getByTitle(UI_STRINGS.analyzingLoader.triggerTooltip);
    fireEvent.click(scanBtn);
    expect(onStartAnalysis).toHaveBeenCalledTimes(1);
  });

  it('renders active analyzing state on scan button when isAnalyzing is true', () => {
    render(<Header {...defaultProps} isAnalyzing={true} />);
    const scanBtn = screen.getByTitle(UI_STRINGS.analyzingLoader.triggerTooltip);
    expect(scanBtn).toHaveClass('animate-pulse');
  });

  it('renders Admin directory and Sign In navigation links', () => {
    render(<Header {...defaultProps} />);

    const adminLink = screen.getByTitle(UI_STRINGS.admin.pageTitle);
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');

    const loginLink = screen.getByTitle(UI_STRINGS.auth.pageTitle);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});


