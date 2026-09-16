import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../../src/app/login/page';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />
}));

describe('Login & Registration Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form by default with headings and tabs', () => {
    render(<LoginPage />);

    expect(screen.getByText(UI_STRINGS.auth.signInHeading)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.auth.signInTab)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.auth.createAccountTab)).toBeDefined();
    expect(screen.getByLabelText(UI_STRINGS.auth.emailLabel)).toBeDefined();
    expect(screen.getByLabelText(UI_STRINGS.auth.passwordLabel)).toBeDefined();
    expect(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton })).toBeDefined();
  });

  it('should switch between Sign In and Create Account tabs', () => {
    render(<LoginPage />);

    const registerTab = screen.getByText(UI_STRINGS.auth.createAccountTab);
    fireEvent.click(registerTab);

    expect(screen.getByText(UI_STRINGS.auth.registerHeading)).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`)).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`)).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`)).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`)).toBeDefined();

    const loginTab = screen.getByText(UI_STRINGS.auth.signInTab);
    fireEvent.click(loginTab);
    expect(screen.getByText(UI_STRINGS.auth.signInHeading)).toBeDefined();
  });

  it('should handle successful login and redirect user based on role', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValue({
      success: true,
      message: 'Login successful',
      token: 'jwt-123',
      user: {
        id: 'usr-1',
        name: 'Admin User',
        mobile_number: '1234567890',
        email: 'admin@procucev.com',
        company_name: 'Procucev',
        company_address: 'Bangalore',
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      }
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(UI_STRINGS.auth.emailLabel);
    const passwordInput = screen.getByLabelText(UI_STRINGS.auth.passwordLabel);

    fireEvent.change(emailInput, { target: { value: 'admin@procucev.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin@123456' } });

    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.auth.signInButton });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.auth.loginSuccess)).toBeDefined();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    }, { timeout: 1500 });
  });

  it('should redirect non-admin user to dashboard / upon login', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValue({
      success: true,
      message: 'Login successful',
      token: 'jwt-456',
      user: {
        id: 'usr-2',
        name: 'Regular User',
        mobile_number: '1234567890',
        email: 'user@company.com',
        company_name: 'Company',
        company_address: 'Bangalore',
        role: 'USER',
        status: 'ACTIVE',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      }
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), {
      target: { value: 'user@company.com' }
    });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), {
      target: { value: 'User@123456' }
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 1500 });
  });

  it('should show error banner when login fails', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValue(new Error('Invalid email or password'));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), {
      target: { value: 'wrong@test.com' }
    });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), {
      target: { value: 'WrongPass' }
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeDefined();
    });
  });

  it('should reject registration when passwords do not match', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByText(UI_STRINGS.auth.createAccountTab));

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), {
      target: { value: '+91 99999 88888' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), {
      target: { value: 'new@company.com' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), {
      target: { value: 'Company Ltd' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), {
      target: { value: 'Tech Park, Hyderabad' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), {
      target: { value: 'Password@123' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), {
      target: { value: 'DifferentPassword' }
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountButton }));

    expect(screen.getByText(UI_STRINGS.auth.passwordMismatchError)).toBeDefined();
  });

  it('should handle successful registration and redirect to dashboard', async () => {
    vi.spyOn(apiClient, 'register').mockResolvedValue({
      success: true,
      message: 'Registered successfully',
      token: 'jwt-reg',
      user: {
        id: 'usr-3',
        name: 'New User',
        mobile_number: '+91 99999 88888',
        email: 'new@company.com',
        company_name: 'Company Ltd',
        company_address: 'Tech Park, Hyderabad',
        role: 'USER',
        status: 'ACTIVE',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      }
    });

    render(<LoginPage />);

    fireEvent.click(screen.getByText(UI_STRINGS.auth.createAccountTab));

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), {
      target: { value: '+91 99999 88888' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), {
      target: { value: 'new@company.com' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), {
      target: { value: 'Company Ltd' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), {
      target: { value: 'Tech Park, Hyderabad' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), {
      target: { value: 'Password@123' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), {
      target: { value: 'Password@123' }
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountButton }));

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.auth.registrationSuccess)).toBeDefined();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    }, { timeout: 1500 });
  });

  it('should show error banner when registration fails', async () => {
    vi.spyOn(apiClient, 'register').mockRejectedValue(new Error('Email already registered'));

    render(<LoginPage />);

    fireEvent.click(screen.getByText(UI_STRINGS.auth.createAccountTab));

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), {
      target: { value: 'Duplicate User' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), {
      target: { value: '+91 99999 88888' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), {
      target: { value: 'duplicate@company.com' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), {
      target: { value: 'Company Ltd' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), {
      target: { value: 'Tech Park' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), {
      target: { value: 'Password@123' }
    });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), {
      target: { value: 'Password@123' }
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountButton }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeDefined();
    });
  });

  it('should render the aiCEV logo and technology benefits showcase with profit multiplier', () => {
    render(<LoginPage />);

    // aiCEV logo
    const logos = screen.getAllByAltText(UI_STRINGS.header.logoAlt);
    expect(logos.length).toBeGreaterThanOrEqual(1);

    // Profit multiplier headline
    expect(screen.getByText(UI_STRINGS.auth.profitHeadline)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.profitMultiplierBadge)).toBeInTheDocument();

    // 3 Technology Pillars
    expect(screen.getByText(UI_STRINGS.auth.benefitCostSavingsTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitStrategicSourcingTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitRoadmapTitle)).toBeInTheDocument();

    // Key metrics
    expect(screen.getByText(UI_STRINGS.auth.statDirectEbitda)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.statSavingsUnlocked)).toBeInTheDocument();
  });

  it('should toggle password visibility when clicking eye icons', () => {
    render(<LoginPage />);

    const loginPasswordInput = screen.getByLabelText(UI_STRINGS.auth.passwordLabel) as HTMLInputElement;
    expect(loginPasswordInput.type).toBe('password');

    // Click toggle button
    const toggleLoginBtn = screen.getByLabelText('Show password');
    fireEvent.click(toggleLoginBtn);
    expect(loginPasswordInput.type).toBe('text');

    fireEvent.click(screen.getByLabelText('Hide password'));
    expect(loginPasswordInput.type).toBe('password');

    // Switch to Register tab and test register password fields
    fireEvent.click(screen.getByText(UI_STRINGS.auth.createAccountTab));

    const regPasswordInput = screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`) as HTMLInputElement;
    const regConfirmInput = screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`) as HTMLInputElement;

    expect(regPasswordInput.type).toBe('password');
    expect(regConfirmInput.type).toBe('password');

    const showButtons = screen.getAllByLabelText('Show password');
    expect(showButtons.length).toBe(2);

    // Toggle both
    fireEvent.click(showButtons[0]);
    expect(regPasswordInput.type).toBe('text');

    fireEvent.click(showButtons[1]);
    expect(regConfirmInput.type).toBe('text');
  });
});

