import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AuthCard } from '../../../src/components/auth/AuthCard';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() })
}));

describe('AuthCard Component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    cleanup();
    process.env = originalEnv;
  });

  it('renders initial tab, conversion banner, and reassurance footer', () => {
    render(<AuthCard initialTab="LOGIN" />);

    expect(screen.getByText(UI_STRINGS.auth.startWithYourDataBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.upgradeWhenNeededHeadline)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.signInHeading })).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.reassuranceNoPayment)).toBeInTheDocument();
  });

  it('switches between LOGIN and REGISTER tabs cleanly', () => {
    render(<AuthCard initialTab="LOGIN" />);

    const registerTab = screen.getByRole('button', { name: UI_STRINGS.auth.createAccountTab });
    fireEvent.click(registerTab);

    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.registerHeading })).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.registerSubheading)).toBeInTheDocument();

    const loginTab = screen.getByRole('button', { name: UI_STRINGS.auth.signInTab });
    fireEvent.click(loginTab);

    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.signInHeading })).toBeInTheDocument();
  });

  it('handles successful login and redirects to home', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValue({
      success: true,
      message: 'OK',
      token: 'jwt-123',
      user: {
        id: 'usr-1',
        name: 'User',
        mobile_number: '123',
        email: 'user@example.com',
        company_name: 'Co',
        company_address: 'Addr',
        role: 'USER',
        status: 'ACTIVE',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      }
    });

    render(<AuthCard initialTab="LOGIN" />);

    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.auth.loginSuccess)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 1500 });
  });

  it('handles login failure and displays error message', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValue(new Error('Invalid credentials provided'));

    render(<AuthCard initialTab="LOGIN" />);

    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), {
      target: { value: 'wrongpassword' }
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials provided')).toBeInTheDocument();
    });
  });

  it('handles registration password mismatch error', () => {
    render(<AuthCard initialTab="REGISTER" />);

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), { target: { value: 'u@e.com' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), { target: { value: 'C' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), { target: { value: 'pwd1' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), { target: { value: 'pwd2' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta }));

    expect(screen.getByText(UI_STRINGS.auth.passwordMismatchError)).toBeInTheDocument();
  });

  it('handles successful registration flow', async () => {
    vi.spyOn(apiClient, 'register').mockResolvedValue({
      success: true,
      message: 'OK',
      token: 'jwt-reg',
      user: {
        id: 'usr-2',
        name: 'User 2',
        mobile_number: '123',
        email: 'u2@e.com',
        company_name: 'C2',
        company_address: 'A2',
        role: 'USER',
        status: 'ACTIVE',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      }
    });

    render(<AuthCard initialTab="REGISTER" />);

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), { target: { value: 'User 2' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), { target: { value: 'u2@e.com' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), { target: { value: 'C2' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), { target: { value: 'A2' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), { target: { value: 'pwd123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), { target: { value: 'pwd123' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.auth.registrationSuccess)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 1500 });
  });

  it('handles registration API failure', async () => {
    vi.spyOn(apiClient, 'register').mockRejectedValue(new Error('User already exists'));

    render(<AuthCard initialTab="REGISTER" />);

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), { target: { value: 'User 2' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), { target: { value: 'u2@e.com' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), { target: { value: 'C2' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), { target: { value: 'A2' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), { target: { value: 'pwd123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), { target: { value: 'pwd123' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta }));

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });
  });

  it('handles non-Error object exceptions on login and registration', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValue('String error failure');

    render(<AuthCard initialTab="LOGIN" />);
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    vi.spyOn(apiClient, 'register').mockRejectedValue('String error failure');
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountTab }));
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), { target: { value: 'u@e.com' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), { target: { value: 'C' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), { target: { value: 'pwd' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), { target: { value: 'pwd' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });

  it('handles admin login redirecting to /admin', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValue({
      success: true,
      message: 'OK',
      token: 'admin-jwt',
      user: {
        id: 'adm-1',
        name: 'Admin',
        mobile_number: '123',
        email: 'admin@procucev.com',
        company_name: 'Procucev',
        company_address: 'HQ',
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      }
    });

    render(<AuthCard initialTab="LOGIN" />);
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), { target: { value: 'admin@procucev.com' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), { target: { value: 'adminPass' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    }, { timeout: 1500 });
  });

  it('handles quick fill credentials and direct admin bypass from dev login bypass', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    render(<AuthCard initialTab="REGISTER" />);

    // Click quick fill test account button
    const buyerBtn = screen.getByRole('button', { name: /Enterprise Buyer/i });
    fireEvent.click(buyerBtn);

    const emailInput = screen.getByLabelText(UI_STRINGS.auth.emailLabel) as HTMLInputElement;
    expect(emailInput.value).toBe('buyer@procucev.com');

    // Click direct admin bypass shortcut
    const adminBypassBtn = screen.getByRole('button', { name: /Open Admin Portal Directly/i });
    fireEvent.click(adminBypassBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('handles switching between login and register using form links', () => {
    render(<AuthCard initialTab="LOGIN" />);

    const switchBtn = screen.getByText(UI_STRINGS.auth.dontHaveAccount);
    fireEvent.click(switchBtn);

    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.registerHeading })).toBeInTheDocument();

    const switchBackBtn = screen.getByText(UI_STRINGS.auth.alreadyHaveAccount);
    fireEvent.click(switchBackBtn);

    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.signInHeading })).toBeInTheDocument();
  });
});

