import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from '../../../src/app/admin/page';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { AICEV_LOGO_SRC } from '../../../src/constants';
import type { UserProfile } from '../../../src/types';

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

describe('Admin User Directory Page Component', () => {
  const mockAdminUser: UserProfile = {
    id: 'usr-admin-001',
    name: 'Admin Master',
    mobile_number: '+91 98765 43210',
    email: 'admin@procucev.com',
    company_name: 'Procucev Inc.',
    company_address: 'Floor 14, Brigade Gateway, Bengaluru',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  const mockRegularUser: UserProfile = {
    id: 'usr-user-001',
    name: 'Srinivas Mukku',
    mobile_number: '+91 98450 12345',
    email: 'srinivas@apexindustrial.com',
    company_name: 'Apex Industrial Dynamics Ltd.',
    company_address: 'Plot 45, Peenya, Bengaluru',
    role: 'USER',
    status: 'ACTIVE',
    created_at: '2026-02-15T00:00:00.000Z',
    updated_at: '2026-02-15T00:00:00.000Z'
  };

  const mockSuspendedUser: UserProfile = {
    id: 'usr-user-002',
    name: 'Priya Sharma',
    mobile_number: '+91 97123 45678',
    email: 'priya.sharma@tatasupply.com',
    company_name: 'Tata Sourcing',
    company_address: 'Bombay House, Mumbai',
    role: 'USER',
    status: 'SUSPENDED',
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(apiClient, 'getAdminUsers').mockResolvedValue({
      success: true,
      users: [mockAdminUser, mockRegularUser, mockSuspendedUser],
      total: 3,
      activeCount: 2,
      suspendedCount: 1,
      adminCount: 1,
      companiesCount: 3
    });
  });

  it('should render page title, metric cards, and user table with complete details', async () => {
    render(<AdminPage />);

    expect(screen.getByText(UI_STRINGS.admin.pageTitle)).toBeDefined();
    const logoImg = screen.getByAltText(UI_STRINGS.header.logoAlt);
    expect(logoImg).toBeDefined();
    expect(logoImg.getAttribute('src')).toBe(AICEV_LOGO_SRC);

    await waitFor(() => {
      expect(screen.getByText('Srinivas Mukku')).toBeDefined();
      expect(screen.getByText('admin@procucev.com')).toBeDefined();
      expect(screen.getByText('Apex Industrial Dynamics Ltd.')).toBeDefined();
      expect(screen.getByText('+91 98450 12345')).toBeDefined();
      expect(screen.getByText('Plot 45, Peenya, Bengaluru')).toBeDefined();
    });

    expect(screen.getByText(UI_STRINGS.admin.totalUsers)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.admin.activeUsers)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.admin.suspendedUsers)).toBeDefined();
    expect(screen.getByText(UI_STRINGS.admin.uniqueCompanies)).toBeDefined();
  });

  it('should filter users by search input and dropdown filters', async () => {
    render(<AdminPage />);

    const searchInput = screen.getByPlaceholderText(UI_STRINGS.admin.searchPlaceholder);
    fireEvent.change(searchInput, { target: { value: 'Srinivas' } });

    await waitFor(() => {
      expect(apiClient.getAdminUsers).toHaveBeenCalledWith({
        search: 'Srinivas',
        role: 'ALL',
        status: 'ALL'
      });
    });

    const roleSelect = screen.getByDisplayValue(UI_STRINGS.admin.allRoles);
    fireEvent.change(roleSelect, { target: { value: 'USER' } });

    await waitFor(() => {
      expect(apiClient.getAdminUsers).toHaveBeenCalledWith({
        search: 'Srinivas',
        role: 'USER',
        status: 'ALL'
      });
    });

    const statusSelect = screen.getByDisplayValue(UI_STRINGS.admin.allStatuses);
    fireEvent.change(statusSelect, { target: { value: 'ACTIVE' } });

    await waitFor(() => {
      expect(apiClient.getAdminUsers).toHaveBeenCalledWith({
        search: 'Srinivas',
        role: 'USER',
        status: 'ACTIVE'
      });
    });
  });

  it('should open user details modal and close it', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Srinivas Mukku')).toBeDefined();
    });

    const detailsBtns = screen.getAllByText(UI_STRINGS.admin.viewDetails);
    fireEvent.click(detailsBtns[1]); // Click for regular user

    expect(screen.getByText(UI_STRINGS.admin.userModalTitle)).toBeDefined();
    expect(screen.getAllByText('Plot 45, Peenya, Bengaluru').length).toBeGreaterThanOrEqual(2);

    const closeBtn = screen.getByText(UI_STRINGS.common.close);
    fireEvent.click(closeBtn);

    expect(screen.queryByText(UI_STRINGS.admin.userModalTitle)).toBeNull();
  });

  it('should toggle user status between ACTIVE and SUSPENDED', async () => {
    const updateSpy = vi.spyOn(apiClient, 'updateAdminUserStatus').mockResolvedValue({
      success: true,
      user: { ...mockRegularUser, status: 'SUSPENDED' }
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.suspendButton)).toBeDefined();
    });

    const suspendBtn = screen.getByText(UI_STRINGS.admin.suspendButton);
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('usr-user-001', 'SUSPENDED');
    });
  });

  it('should handle error when updating user status fails', async () => {
    vi.spyOn(apiClient, 'updateAdminUserStatus').mockRejectedValue(new Error('Update failed'));

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.suspendButton)).toBeDefined();
    });

    fireEvent.click(screen.getByText(UI_STRINGS.admin.suspendButton));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeDefined();
    });
  });

  it('should show error banner when initial user fetch fails', async () => {
    vi.spyOn(apiClient, 'getAdminUsers').mockRejectedValue(new Error('Unauthorized admin access'));

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Unauthorized admin access')).toBeDefined();
    });
  });

  it('should clear stored session and redirect on logout click', async () => {
    const clearSpy = vi.spyOn(apiClient, 'clearStoredSession');

    render(<AdminPage />);

    const logoutBtn = screen.getByText(UI_STRINGS.auth.logout);
    fireEvent.click(logoutBtn);

    expect(clearSpy).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should reactivate a suspended user by clicking activate button', async () => {
    const updateSpy = vi.spyOn(apiClient, 'updateAdminUserStatus').mockResolvedValue({
      success: true,
      user: { ...mockSuspendedUser, status: 'ACTIVE' }
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.activateButton)).toBeDefined();
    });

    fireEvent.click(screen.getByText(UI_STRINGS.admin.activateButton));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('usr-user-002', 'ACTIVE');
    });
  });

  it('should display empty users message when no users are returned', async () => {
    vi.spyOn(apiClient, 'getAdminUsers').mockResolvedValue({
      success: true,
      users: [],
      total: 0,
      activeCount: 0,
      suspendedCount: 0,
      adminCount: 0,
      companiesCount: 0
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.noUsersFound)).toBeDefined();
    });
  });
});
