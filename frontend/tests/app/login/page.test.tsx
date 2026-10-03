import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../../src/app/login/page';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants/uiStrings';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() })
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />
}));

describe('Login & Registration Page Component', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should render login form by default with headings and tabs', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.signInHeading })).toBeDefined();
    expect(screen.getByText(UI_STRINGS.auth.signInTab)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.auth.createAccountTab)).toBeDefined();
    expect(screen.getByLabelText(UI_STRINGS.auth.emailLabel)).toBeDefined();
    expect(screen.getByLabelText(UI_STRINGS.auth.passwordLabel)).toBeDefined();
    expect(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton })).toBeDefined();
  });

  it('should switch between Sign In and Create Account tabs', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(UI_STRINGS.auth.createAccountTab));
    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.registerHeading })).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`)).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`)).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`)).toBeDefined();
    expect(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`)).toBeDefined();

    fireEvent.click(screen.getByText(UI_STRINGS.auth.signInTab));
    expect(screen.getByRole('heading', { name: UI_STRINGS.auth.signInHeading })).toBeDefined();
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
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), { target: { value: 'admin@procucev.com' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), { target: { value: 'Admin@123456' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => expect(screen.getByText(UI_STRINGS.auth.loginSuccess)).toBeDefined());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin'), { timeout: 1500 });
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
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), { target: { value: 'user@company.com' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), { target: { value: 'User@123456' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'), { timeout: 1500 });
  });

  it('should show error banner when login fails', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValue(new Error('Invalid email or password'));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.emailLabel), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.auth.passwordLabel), { target: { value: 'WrongPass' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.signInButton }));

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeDefined());
  });

  it('should reject registration when passwords do not match', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(UI_STRINGS.auth.createAccountTab));

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), { target: { value: '+91 99999 88888' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), { target: { value: 'new@company.com' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), { target: { value: 'Company Ltd' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), { target: { value: 'Hyderabad' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), { target: { value: 'DiffPass' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta }));
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

    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.nameLabel} *`), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.mobileLabel} *`), { target: { value: '+91 99999 88888' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.emailLabel} *`), { target: { value: 'new@company.com' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyNameLabel} *`), { target: { value: 'Company Ltd' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.companyAddressLabel} *`), { target: { value: 'Hyderabad' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByLabelText(`${UI_STRINGS.auth.confirmPasswordLabel} *`), { target: { value: 'Password@123' } });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.auth.createAccountPrimaryCta }));

    await waitFor(() => expect(screen.getByText(UI_STRINGS.auth.registrationSuccess)).toBeDefined());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'), { timeout: 1500 });
  });

  it('should render the customer conversion showcase and product journey', () => {
    render(<LoginPage />);

    const logos = screen.getAllByAltText(UI_STRINGS.header.logoAlt);
    expect(logos.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(UI_STRINGS.auth.heroHeadline)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.heroSecondLine)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.modelTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage1Name)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage2Name)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.stage3Name)).toBeInTheDocument();

    expect(screen.getByText(UI_STRINGS.auth.benefitCard1Title)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.benefitCard2Title)).toBeInTheDocument();
  });

  it('should toggle password visibility when clicking eye icons', () => {
    render(<LoginPage />);
    const loginPasswordInput = screen.getByLabelText(UI_STRINGS.auth.passwordLabel) as HTMLInputElement;
    expect(loginPasswordInput.type).toBe('password');

    fireEvent.click(screen.getByLabelText('Show password'));
    expect(loginPasswordInput.type).toBe('text');

    fireEvent.click(screen.getByLabelText('Hide password'));
    expect(loginPasswordInput.type).toBe('password');

    fireEvent.click(screen.getByText(UI_STRINGS.auth.createAccountTab));
    const regPasswordInput = screen.getByLabelText(`${UI_STRINGS.auth.passwordLabel} *`) as HTMLInputElement;
    expect(regPasswordInput.type).toBe('password');
  });

  it('should NOT render dev temporary logins or admin bypass in production UI even with public env variable', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'true';

    render(<LoginPage />);
    expect(screen.queryByText(UI_STRINGS.auth.tempDevCredentialsBadge)).not.toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.auth.goToAdminDirectly)).not.toBeInTheDocument();
    expect(screen.queryByTitle('Fill sriman@procucev.com')).not.toBeInTheDocument();
  });

  it('should render dev logins and allow quick-fill and bypass ONLY when NODE_ENV is development', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN;

    render(<LoginPage />);
    expect(screen.getByText(UI_STRINGS.auth.tempDevCredentialsBadge)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.auth.goToAdminDirectly)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(UI_STRINGS.auth.emailLabel) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(UI_STRINGS.auth.passwordLabel) as HTMLInputElement;

    fireEvent.click(screen.getByTitle('Fill sriman@procucev.com'));
    expect(emailInput.value).toBe('sriman@procucev.com');
    expect(passwordInput.value).toBe('sriman@123');

    fireEvent.click(screen.getByText(UI_STRINGS.auth.goToAdminDirectly));
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });
});
