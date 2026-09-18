import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginPage from '../../../src/app/admin/login/page';
import { apiClient } from '../../../src/utils/api';

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
  });

  it('renders admin login page with form elements and quick-fill button', () => {
    render(<AdminLoginPage />);
    expect(screen.getByRole('heading', { name: /administrator sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/administrator email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quick-fill admin credentials/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter admin dashboard/i })).toBeInTheDocument();
  });

  it('populates credentials when quick fill button is clicked', () => {
    render(<AdminLoginPage />);
    const quickFillBtn = screen.getByRole('button', { name: /quick-fill admin credentials/i });
    fireEvent.click(quickFillBtn);

    const emailInput = screen.getByLabelText(/administrator email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(emailInput.value).toBe('admin@procucev.com');
    expect(passwordInput.value).toBe('Admin@123456');
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
    fireEvent.click(screen.getByRole('button', { name: /quick-fill admin credentials/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter admin dashboard/i }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'admin@procucev.com',
      password: 'Admin@123456'
    });

    await waitFor(() => {
      expect(screen.getByText(/administrator authenticated successfully/i)).toBeInTheDocument();
    });
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
    fireEvent.click(screen.getByRole('button', { name: /quick-fill admin credentials/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter admin dashboard/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials provided')).toBeInTheDocument();
    });
  });
});
