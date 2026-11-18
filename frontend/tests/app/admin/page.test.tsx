import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from '../../../src/app/admin/page';
import { apiClient } from '../../../src/utils/api';
import { UI_STRINGS } from '../../../src/constants';
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

const adminUser: UserProfile = {
  id: 'usr-admin-001',
  name: 'System Administrator',
  email: 'ops.admin@company.test',
  role: 'ADMIN',
  status: 'ACTIVE',
  subscription_tier: 'GOLD'
};

describe('/admin Page (Gateway, Login & Create Details)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    apiClient.clearStoredSession();
  });

  it('renders empty /admin login form without create-admin tab or quick-fill credentials for unauthenticated visitors', () => {
    render(<AdminPage />);

    expect(screen.getByText(UI_STRINGS.admin.gatewayTitle)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
    expect((screen.getByLabelText(UI_STRINGS.admin.emailLabel) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(UI_STRINGS.admin.passwordLabel) as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('tab', { name: UI_STRINGS.admin.createTab })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: UI_STRINGS.admin.quickFillAdminButton })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: UI_STRINGS.admin.submitCreateButton })).not.toBeInTheDocument();
  });

  it('logs in with entered admin credentials and redirects to /admin/dashboard', async () => {
    vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
      token: 'admin-jwt-123',
      user: adminUser,
      success: true,
      message: 'Login successful'
    });

    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.emailLabel), { target: { value: adminUser.email } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: 'StrongAdminPass123' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitLoginButton }));

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

  it('displays active administrator card and unlocks admin creation tab when admin is authenticated', () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(adminUser);

    render(<AdminPage />);

    expect(screen.getByText(adminUser.name)).toBeInTheDocument();
    expect(screen.getByText(adminUser.email)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI_STRINGS.admin.openDashboardButton })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: UI_STRINGS.admin.createTab })).toBeInTheDocument();
  });

  it('switches tabs, provisions another admin, and hides create tab after sign out', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(adminUser);
    vi.spyOn(apiClient, 'createAdminUser').mockResolvedValueOnce({
      success: true,
      message: 'Created',
      user: {
        ...adminUser,
        id: 'usr-admin-002',
        email: 'second.admin@company.test'
      }
    });

    render(<AdminPage />);

    fireEvent.click(screen.getByTestId('admin-create-tab'));
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.fullNameLabel), { target: { value: 'Second Admin' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.emailLabel), { target: { value: 'second.admin@company.test' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.mobileLabel), { target: { value: '+91 98765 43210' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.companyNameLabel), { target: { value: 'aiCEV Corp' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.companyAddressLabel), { target: { value: 'Bengaluru, India' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.passwordLabel), { target: { value: 'SecondAdmin#2026' } });
    fireEvent.change(screen.getByLabelText(UI_STRINGS.admin.confirmPasswordLabel), { target: { value: 'SecondAdmin#2026' } });
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.submitCreateButton }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.openDashboardButton }));
    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.createHeading }));
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('admin-login-tab'));
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();

    const clearSpy = vi.spyOn(apiClient, 'clearStoredSession');
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.admin.signOutButton }));
    expect(clearSpy).toHaveBeenCalled();
    expect(screen.queryByRole('tab', { name: UI_STRINGS.admin.createTab })).not.toBeInTheDocument();
  });

  it('switches to create tab via footer link inside login form and back when authenticated as admin', () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(adminUser);
    render(<AdminPage />);

    const switchCreateBtn = screen.getByRole('button', { name: UI_STRINGS.admin.createTab });
    fireEvent.click(switchCreateBtn);
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.createHeading })).toBeInTheDocument();

    const switchLoginBtn = screen.getByRole('button', { name: UI_STRINGS.admin.loginTab });
    fireEvent.click(switchLoginBtn);
    expect(screen.getByRole('heading', { name: UI_STRINGS.admin.loginHeading })).toBeInTheDocument();
  });

  it('blocks signed-in buyer (USER) accounts from accessing admin login or creation tools', () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-user-001',
      name: 'Anurag Shaw',
      email: 'anurag@company.com',
      role: 'USER',
      status: 'ACTIVE',
      subscription_tier: 'BRONZE'
    });

    render(<AdminPage />);

    expect(screen.getByTestId('admin-buyer-blocked-panel')).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.admin.buyerAccessBlockedTitle)).toBeInTheDocument();
    expect(
      screen.getByText(UI_STRINGS.admin.buyerAccessBlockedDescription('anurag@company.com', 'USER'))
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: UI_STRINGS.admin.loginHeading })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: UI_STRINGS.admin.createTab })).not.toBeInTheDocument();
  });

  it('verifies token-backed admin session via getMe and blocks downgraded or failed sessions', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(adminUser);
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('admin-token');
    const clearSpy = vi.spyOn(apiClient, 'clearStoredSession');

    vi.spyOn(apiClient, 'getMe').mockResolvedValueOnce({
      success: true,
      user: { ...adminUser, role: 'USER' }
    });
    const { unmount } = render(<AdminPage />);
    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('admin-buyer-blocked-panel')).toBeInTheDocument();
    });
    unmount();

    vi.spyOn(apiClient, 'getMe').mockRejectedValueOnce(new Error('Expired'));
    const failedView = render(<AdminPage />);
    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestId('admin-create-tab')).not.toBeInTheDocument();
    });
    failedView.unmount();

    const verifiedAdmin: UserProfile = { ...adminUser, name: 'Verified Token Admin' };
    vi.spyOn(apiClient, 'getMe').mockResolvedValueOnce({ success: true, user: verifiedAdmin });
    const validView = render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText('Verified Token Admin')).toBeInTheDocument();
    });
    validView.unmount();

    vi.spyOn(apiClient, 'getMe').mockResolvedValueOnce({
      success: true,
      user: { ...adminUser, status: 'SUSPENDED' }
    });
    const suspendedView = render(<AdminPage />);
    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalledTimes(3);
      expect(screen.queryByTestId('admin-buyer-blocked-panel')).not.toBeInTheDocument();
    });
    suspendedView.unmount();
  });

  it('ignores late getMe resolution or rejection after unmounting /admin gateway', async () => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(adminUser);
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('admin-token');
    const clearSpy = vi.spyOn(apiClient, 'clearStoredSession');

    let resolveGetMe!: (value: { success: boolean; user: UserProfile }) => void;
    vi.spyOn(apiClient, 'getMe').mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGetMe = resolve;
      })
    );
    const view1 = render(<AdminPage />);
    view1.unmount();
    resolveGetMe({ success: false, user: adminUser });
    await Promise.resolve();
    expect(clearSpy).not.toHaveBeenCalled();

    let rejectGetMe!: (reason: Error) => void;
    vi.spyOn(apiClient, 'getMe').mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectGetMe = reject;
      })
    );
    const view2 = render(<AdminPage />);
    view2.unmount();
    rejectGetMe(new Error('Late error'));
    await Promise.resolve();
    expect(clearSpy).not.toHaveBeenCalled();
  });
});
