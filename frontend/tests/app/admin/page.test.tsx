import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from '../../../src/app/admin/page';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants';

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

describe('/admin Page (Gateway, Login & Create Details)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.clearStoredSession();
  });

  it('renders /admin gateway page with title, tabs, and login form by default', () => {
    render(<AdminPage />);

    expect(screen.getByText(UI_STRINGS.admin.gatewayTitle)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: UI_STRINGS.admin.loginTab })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: UI_STRINGS.admin.createTab })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
  });

  it('switches to create admin details form when create tab is clicked', () => {
    render(<AdminPage />);

    const createTabBtn = screen.getByRole('tab', { name: UI_STRINGS.admin.createTab });
    fireEvent.click(createTabBtn);

    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.fillDefaultDetailsButton })).toBeInTheDocument();
  });

  it('populates default admin credentials and logs in, redirecting to /admin/dashboard', async () => {
    const mockUser = {
      id: 'usr-admin-001',
      name: 'System Administrator',
      email: 'admin@procucev.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    };

    vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
      token: 'admin-jwt-123',
      user: mockUser,
      success: true,
      message: 'Login successful'
    });

    render(<AdminPage />);

    const quickFillBtn = screen.getByRole('button', { name: UI_STRINGS.admin.quickFillAdminButton });
    fireEvent.click(quickFillBtn);

    const submitBtn = screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.loginSuccessMessage)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
      },
      { timeout: 1500 }
    );
  });

  it('displays active administrator card if admin is already authenticated', () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-admin-001',
      name: 'System Administrator',
      email: 'admin@procucev.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    });

    render(<AdminPage />);

    expect(screen.getByText('System Administrator')).toBeInTheDocument();
    expect(screen.getByText('admin@procucev.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.openDashboardButton })).toBeInTheDocument();
  });

  it('signs out administrator and clears session when sign out is clicked', () => {
    const clearSpy = vi.spyOn(apiClient, 'clearStoredSession');
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-admin-001',
      name: 'System Administrator',
      email: 'admin@procucev.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    });

    render(<AdminPage />);

    const signOutBtn = screen.getByRole('button', { name: UI_STRINGS.admin.signOutButton });
    fireEvent.click(signOutBtn);

    expect(clearSpy).toHaveBeenCalled();
    expect(screen.queryByText(UI_STRINGS.admin.signOutButton)).not.toBeInTheDocument();
  });

  it('switches back to login tab when create admin details form completes', async () => {
    vi.spyOn(apiClient, 'createAdminUser').mockResolvedValueOnce({
      success: true,
      message: 'Created',
      user: {
        id: 'usr-admin-001',
        name: 'System Administrator',
        email: 'admin@procucev.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        subscription_tier: 'GOLD'
      }
    });

    render(<AdminPage />);

    // Switch to Create Tab
    fireEvent.click(screen.getByRole('tab', { name: UI_STRINGS.admin.createTab }));
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();

    // Submit Creation
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      // Switches back to Login tab
      expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
    });
  });

  it('navigates to dashboard when Open Dashboard button is clicked', () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-admin-001',
      name: 'System Administrator',
      email: 'admin@procucev.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    });

    render(<AdminPage />);

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.openDashboardButton }));
    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('switches tabs back and forth via tab buttons', () => {
    render(<AdminPage />);

    // Click Create Tab
    fireEvent.click(screen.getByTestId('admin-create-tab'));
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();

    // Click Login Tab
    fireEvent.click(screen.getByTestId('admin-login-tab'));
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
  });

  it('switches to create tab via footer link inside login form, and back via create form', () => {
    render(<AdminPage />);

    // In Login form, click "Create Admin Details" link
    const switchCreateBtn = screen.getByRole('button', { name: UI_STRINGS.admin.createTab });
    fireEvent.click(switchCreateBtn);
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();

    // In Create form, click "Sign In" link
    const switchLoginBtn = screen.getByRole('button', { name: UI_STRINGS.admin.loginTab });
    fireEvent.click(switchLoginBtn);
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
  });

  it('opens create admin tab when clicking Create Admin Details in active session card', () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-admin-001',
      name: 'System Administrator',
      email: 'admin@procucev.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      subscription_tier: 'GOLD'
    });

    render(<AdminPage />);

    const openCreateBtn = screen.getByRole('button', { name: UI_STRINGS.admin.createHeading });
    fireEvent.click(openCreateBtn);

    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();
  });

  it('ignores stored user if user role is not ADMIN', () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-user-001',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'USER',
      status: 'ACTIVE',
      subscription_tier: 'BRONZE'
    });

    render(<AdminPage />);

    expect(screen.queryByText('Regular User')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
  });
});

