import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboardPage from '../../../src/app/admin/dashboard/page';
import { apiClient } from '../../../src/utils/api';
import { authApiClient } from '../../../src/utils/authApi';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />
}));

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

describe('Admin Dashboard Page (/admin/dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(mockAdmin);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue('mock-admin-token');
    vi.spyOn(apiClient, 'getAdminUsers').mockResolvedValue({
      success: true,
      users: [mockAdmin],
      total: 1,
      activeCount: 1,
      companiesCount: 1
    });
  });

  it('renders the central admin console successfully', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('opens Change Password modal and submits updated password', async () => {
    vi.spyOn(authApiClient, 'changePassword').mockResolvedValue({
      success: true,
      message: 'Admin password updated successfully'
    });

    render(<AdminDashboardPage />);

    const changePwBtn = screen.getByTitle('Change Administrator Account Password');
    expect(changePwBtn).toBeInTheDocument();
    fireEvent.click(changePwBtn);

    expect(screen.getByText('Change Admin Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter current master password')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Enter current master password'), {
      target: { value: 'AdminCurrent#123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter new strong password'), {
      target: { value: 'AdminNewStrong#456' }
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'AdminNewStrong#456' }
    });

    const submitBtn = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApiClient.changePassword).toHaveBeenCalledWith(
        {
          currentPassword: 'AdminCurrent#123',
          newPassword: 'AdminNewStrong#456'
        },
        'mock-admin-token'
      );
    });

    expect(await screen.findByText('Admin password updated successfully')).toBeInTheDocument();
  });

  it('shows error if new passwords do not match', async () => {
    render(<AdminDashboardPage />);

    fireEvent.click(screen.getByTitle('Change Administrator Account Password'));

    fireEvent.change(screen.getByPlaceholderText('Enter current master password'), {
      target: { value: 'AdminCurrent#123' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter new strong password'), {
      target: { value: 'AdminNewStrong#456' }
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'Mismatch#789' }
    });

    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText('New passwords do not match')).toBeInTheDocument();
  });
});
