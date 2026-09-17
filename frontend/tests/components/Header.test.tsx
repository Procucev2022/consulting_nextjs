import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { mockTenant } from '../../src/data/mockData';
import { UI_STRINGS } from '../../src/constants/uiStrings';

import { DEFAULT_SPEND_BASELINE_INR_CR } from '../../src/constants/app';

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
    expect(logoImg.getAttribute('src')).toContain('aicev-logo.png');
    expect(screen.getByText(UI_STRINGS.header.subtitle)).toBeInTheDocument();
    expect(screen.getByText(mockTenant.enterprise_name)).toBeInTheDocument();
    expect(screen.getByText(`₹${mockTenant.total_spend_evaluated_inr} Cr`)).toBeInTheDocument();
  });

  it('renders fallback spend if total_spend_evaluated_inr is undefined', () => {
    const tenantWithoutINR = { ...mockTenant, total_spend_evaluated_inr: undefined as any };
    render(<Header {...defaultProps} tenant={tenantWithoutINR} />);
    expect(screen.getByText(`₹${DEFAULT_SPEND_BASELINE_INR_CR} Cr`)).toBeInTheDocument();
  });

  it('handles theme switching between light and dark', () => {
    const onSelectTheme = vi.fn();
    const { rerender } = render(<Header {...defaultProps} onSelectTheme={onSelectTheme} />);

    // Open profile menu to access theme controls
    fireEvent.click(screen.getByTestId('user-profile-menu-button'));

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

    // Open profile menu to access currency controls
    fireEvent.click(screen.getByTestId('user-profile-menu-button'));

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

  it('does not render Deep Spend Scan when commented out', () => {
    render(<Header {...defaultProps} />);
    const scanBtn = screen.queryByTitle(UI_STRINGS.analyzingLoader.triggerTooltip);
    expect(scanBtn).not.toBeInTheDocument();
  });

  it('renders Sign In navigation link when unauthenticated', () => {
    render(<Header {...defaultProps} currentUser={null} />);

    // Open profile menu to view auth action
    fireEvent.click(screen.getByTestId('user-profile-menu-button'));

    const loginLink = screen.getByRole('link', { name: new RegExp(UI_STRINGS.auth.signInTab, 'i') });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('renders user avatar and opens profile dropdown menu on click/hover for authenticated user', () => {
    const onLogout = vi.fn();
    const mockUser = {
      id: 'usr-navin-101',
      name: 'Navin Kumar',
      email: 'navin@enterprise.com',
      mobile_number: '+91 9876543210',
      company_name: 'Apex Industrial Dynamics',
      company_address: 'Industrial Area',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      subscription_tier: 'GOLD' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    render(<Header {...defaultProps} currentUser={mockUser} onLogout={onLogout} />);

    const userBtn = screen.getByTestId('user-profile-menu-button');
    expect(userBtn).toBeInTheDocument();
    expect(screen.getAllByText('Navin').length).toBeGreaterThanOrEqual(1);

    // Click to open dropdown
    fireEvent.click(userBtn);

    expect(screen.getByText('Profile & Account Settings')).toBeInTheDocument();
    expect(screen.queryByText('Admin User Directory')).not.toBeInTheDocument();
    expect(screen.getByText('navin@enterprise.com')).toBeInTheDocument();

    // Logout action
    const logoutBtn = screen.getByRole('button', { name: new RegExp(UI_STRINGS.auth.logout, 'i') });
    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalled();
  });

  it('displays "Sign In" and does NOT render admin tab when logged in as ADMIN on client workspace', () => {
    const mockAdmin = {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: 'admin@procucev.com',
      mobile_number: '+91 9876543210',
      company_name: 'Procucev Admin Corp',
      company_address: 'HQ',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      subscription_tier: 'GOLD' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    render(<Header {...defaultProps} currentUser={mockAdmin} />);

    const userBtn = screen.getByTestId('user-profile-menu-button');
    expect(userBtn).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();

    // Click to open dropdown
    fireEvent.click(userBtn);

    expect(screen.queryByText('Admin User Directory')).not.toBeInTheDocument();
    const signInLink = screen.getByRole('link', { name: new RegExp(UI_STRINGS.auth.signInTab, 'i') });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('renders subscription tier badge and interactive demo switcher', () => {
    const onSelectSimulatedTier = vi.fn();
    const { rerender } = render(
      <Header
        {...defaultProps}
        currentTier="BRONZE"
        onSelectSimulatedTier={onSelectSimulatedTier}
      />
    );

    // Open profile menu
    fireEvent.click(screen.getByTestId('user-profile-menu-button'));

    expect(screen.getByTestId('subscription-tier-badge')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.subscription.tierBadge('BRONZE'))).toBeInTheDocument();

    const silverBtn = screen.getByTestId('demo-tier-silver');
    fireEvent.click(silverBtn);
    expect(onSelectSimulatedTier).toHaveBeenCalledWith('SILVER');

    rerender(
      <Header
        {...defaultProps}
        currentTier="GOLD"
        onSelectSimulatedTier={onSelectSimulatedTier}
      />
    );
    expect(screen.getByText(UI_STRINGS.subscription.tierBadge('GOLD'))).toBeInTheDocument();

    rerender(
      <Header
        {...defaultProps}
        currentTier="SILVER"
        onSelectSimulatedTier={onSelectSimulatedTier}
      />
    );
    expect(screen.getByText(UI_STRINGS.subscription.tierBadge('SILVER'))).toBeInTheDocument();
  });

  it('renders logged in user first name when user is passed', () => {
    const mockUser = {
      id: 'usr-1',
      name: 'Rohan Sharma',
      mobile_number: '+91 99999 11111',
      email: 'rohan@enterprise.com',
      company_name: 'Enterprise Co',
      company_address: '123 Tech Park',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      subscription_tier: 'SILVER' as const,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    };

    render(<Header {...defaultProps} user={mockUser} />);
    expect(screen.getByText('Rohan')).toBeInTheDocument();
  });

  it('toggles user profile dropdown menu and handles outside clicks and escape key', () => {
    render(<Header {...defaultProps} />);

    const menuBtn = screen.getByTestId('user-profile-menu-button');
    expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();

    fireEvent.click(menuBtn);
    expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();

    // Press Escape to close
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();

    // Re-open and test clicking outside
    fireEvent.click(menuBtn);
    expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument();
  });

  it('triggers onContactSupport when provided, or falls back to window.open', () => {
    const onContactSupport = vi.fn();
    const { rerender } = render(<Header {...defaultProps} onContactSupport={onContactSupport} />);

    // Open profile menu
    fireEvent.click(screen.getByTestId('user-profile-menu-button'));

    const supportBtn = screen.getByTestId('header-support-button');
    fireEvent.click(supportBtn);
    expect(onContactSupport).toHaveBeenCalledTimes(1);

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    rerender(<Header {...defaultProps} onContactSupport={undefined} />);
    fireEvent.click(screen.getByTestId('header-support-button'));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:support@procucev.com'),
      '_blank'
    );
    openSpy.mockRestore();
  });
});
