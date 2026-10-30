import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginPage from '../../../src/app/admin/login/page';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants';
import frontendLogger from '../../../src/utils/logger';

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

describe('Admin Login Page (/admin/login)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(frontendLogger, 'info').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
  });

  const fillLoginForm = (): void => {
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.emailLabel), { target: { value: 'admin@example.test' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: 'typed-password' } });
  };

  it('renders an empty administrator login form without embedded credentials', () => {
    render(<AdminLoginPage />);
    expect(screen.getByRole('heading', { name: /administrator sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/administrator email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_STRINGS.admin.emailLabel)).toHaveValue('');
    expect(screen.getByLabelText(UI_STRINGS.admin.passwordLabel)).toHaveValue('');
    expect(screen.queryByRole('button', { name: UI_STRINGS.admin.quickFillAdminButton })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter admin dashboard/i })).toBeInTheDocument();
  });

  it('retains credentials entered by the administrator', () => {
    render(<AdminLoginPage />);
    fillLoginForm();

    const emailInput = screen.getByLabelText(/administrator email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(emailInput.value).toBe('admin@example.test');
    expect(passwordInput.value).toBe('typed-password');
  });

  it('authenticates admin successfully and redirects to /admin/dashboard', async () => {
    const mockLogin = vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
      token: 'jwt-admin-token-123',
      user: {
        id: 'usr-admin-001',
        name: 'System Administrator',
        email: 'admin@procucev.com',
        mobile_number: '+91 98765 43210',
        company_name: 'aiCEV Procucev Enterprise Inc.',
        company_address: 'Bangalore',
        role: 'ADMIN',
        status: 'ACTIVE',
        subscription_tier: 'GOLD',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }
    });

    render(<AdminLoginPage />);
    fillLoginForm();
    fireEvent.click(screen.getByRole('button', { name: /enter admin dashboard/i }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'admin@example.test',
      password: 'typed-password'
    });

    await waitFor(() => {
      expect(screen.getByText(/administrator authenticated successfully/i)).toBeInTheDocument();
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/dashboard'));
  });

  it('rejects non-admin user credentials with access denied message', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
      token: 'jwt-user-token-123',
      user: {
        id: 'usr-user-001',
        name: 'Regular Buyer',
        email: 'user@procucev.com',
        mobile_number: '+91 98450 12345',
        company_name: 'Apex Industrial',
        company_address: 'Bangalore',
        role: 'USER',
        status: 'ACTIVE',
        subscription_tier: 'BRONZE',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }
    });

    const clearSessionSpy = vi.spyOn(apiClient, 'clearStoredSession');

    render(<AdminLoginPage />);
    const emailInput = screen.getByLabelText(/administrator email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'user@procucev.com' } });
    fireEvent.change(passwordInput, { target: { value: 'User@123456' } });
    fireEvent.click(screen.getByRole('button', { name: /enter admin dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText(/access denied: administrative privileges required/i)).toBeInTheDocument();
      expect(clearSessionSpy).toHaveBeenCalled();
    });
  });

  it('handles network / login failure error gracefully', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce(new Error('Invalid credentials provided'));

    render(<AdminLoginPage />);
    fillLoginForm();
    fireEvent.click(screen.getByRole('button', { name: /enter admin dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials provided')).toBeInTheDocument();
    });
  });
});
