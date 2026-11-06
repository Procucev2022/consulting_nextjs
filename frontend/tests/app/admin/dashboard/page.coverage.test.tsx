import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminDashboardPage from '../../../../src/app/admin/dashboard/page';
import { apiClient } from '../../../../src/utils/api';
import { authApiClient } from '../../../../src/utils/authApi';
import frontendLogger from '../../../../src/utils/logger';
import type { UserProfile } from '../../../../src/types';
import { UI_STRINGS } from '../../../../src/constants';

const mockPush = vi.fn();
// The router must be a stable object: the page's auth/load effect depends on it.
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

vi.mock('next/image', async () => {
  const React = (await import('react')).default;
  return {
    default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt })
  };
});
// Labels and messages that the dashboard defines inline rather than in UI_STRINGS.
const LOGOUT_LABEL = 'Logout';
const REFRESH_LABEL = 'Refresh';
const SYNCING_LABEL = 'Syncing...';
const SUSPEND_LABEL = 'Suspend';
const ACTIVATE_LABEL = 'Activate';
const DETAILS_LABEL = 'Details';
const CLOSE_DETAILS_LABEL = 'Close Details';
const CLOSE_X_LABEL = '×';
const CANCEL_LABEL = 'Cancel';
const UPDATE_PASSWORD_LABEL = 'Update Password';
const UPDATING_PASSWORD_LABEL = 'Updating...';
const PASSWORD_MODAL_TITLE_TOOLTIP = 'Change Administrator Account Password';
const PASSWORD_MODAL_CLOSE_LABEL = 'Close modal';
const ADMIN_TOKEN = 'admin-session-token';

const buildUser = (overrides: Partial<UserProfile>): UserProfile =>
  ({
    id: 'usr-default',
    name: 'Default User',
    full_name: 'Default User',
    email: 'default@example.test',
    role: 'USER',
    status: 'ACTIVE',
    subscription_tier: 'SILVER',
    company_name: 'Default Company',
    created_at: '2025-11-03T00:00:00.000Z',
    ...overrides
  }) as UserProfile;

const ADMIN_USER = buildUser({
  id: 'usr-admin-1',
  name: 'Platform Administrator',
  full_name: 'Platform Administrator',
  email: 'admin@platform.example',
  role: 'ADMIN',
  subscription_tier: 'GOLD',
  company_name: 'Procucev Enterprise'
});

const USER_ACTIVE = buildUser({
  id: 'usr-acme-1',
  name: 'Asha Verma',
  full_name: 'Asha Verma',
  email: 'asha@acme.example',
  phone: '+91 98765 00001',
  tier: 'GOLD',
  subscription_tier: 'GOLD',
  company_name: 'Acme Industries',
  company_address: 'Plot 45, Peenya, Bengaluru'
} as Partial<UserProfile>);

const USER_SUSPENDED = buildUser({
  id: 'usr-beta-2',
  name: 'Ravi Kumar',
  full_name: 'Ravi Kumar',
  email: 'ravi@beta.example',
  status: 'SUSPENDED',
  tier: 'SILVER',
  company_name: 'Beta Components'
} as Partial<UserProfile>);

const USER_BRONZE = buildUser({
  id: 'usr-gamma-4',
  name: 'Meera Joshi',
  full_name: 'Meera Joshi',
  email: 'meera@gamma.example',
  tier: 'BRONZE',
  company_name: 'Gamma Logistics'
} as Partial<UserProfile>);

const ADMIN_ROW = buildUser({
  id: 'usr-admin-3',
  name: 'Support Administrator',
  full_name: 'Support Administrator',
  email: 'support@platform.example',
  role: 'ADMIN',
  company_name: 'Procucev Enterprise'
});

const USER_SPARSE = buildUser({
  id: 'usr-sparse-5',
  name: '',
  full_name: undefined,
  email: 'sparse@example.test',
  company_name: undefined,
  company_address: undefined,
  phone: undefined,
  created_at: undefined,
  tier: undefined
} as Partial<UserProfile>);

const DIRECTORY_USERS = [USER_ACTIVE, USER_SUSPENDED, USER_BRONZE, ADMIN_ROW, USER_SPARSE];

const directoryResponse = (users: UserProfile[]) => ({
  success: true,
  users,
  total: users.length,
  activeCount: users.filter((user) => user.status === 'ACTIVE').length,
  companiesCount: new Set(users.map((user) => user.company_name?.toLowerCase())).size
});

const renderDashboard = async (): Promise<ReturnType<typeof render>> => {
  const view = render(<AdminDashboardPage />);
  await screen.findByText(USER_ACTIVE.full_name as string);
  return view;
};

// Authentication finishes before the first directory load begins, so wait for both.
const waitForDirectoryLoad = async (): Promise<void> => {
  await waitFor(() => {
    expect(apiClient.getAdminUsers).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: REFRESH_LABEL })).not.toBeDisabled();
  });
};

const userRow = (user: UserProfile): HTMLElement =>
  screen.getByRole('row', { name: (name) => name.includes(user.email) });

const passwordInputs = (container: HTMLElement): HTMLInputElement[] =>
  Array.from(container.querySelectorAll('form input')) as HTMLInputElement[];

describe('AdminDashboardPage coverage', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(ADMIN_USER);
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue(ADMIN_TOKEN);
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({ success: true, user: ADMIN_USER });
    vi.spyOn(apiClient, 'setStoredSession').mockImplementation(() => undefined);
    vi.spyOn(apiClient, 'clearStoredSession').mockImplementation(() => undefined);
    vi.spyOn(apiClient, 'getAdminUsers').mockResolvedValue(directoryResponse(DIRECTORY_USERS) as never);
    vi.spyOn(apiClient, 'getAdminTenants').mockResolvedValue({
      success: true,
      tenants: [{ tenant_id: 'tenant-alpha', enterprise_name: 'Alpha Industries', status: 'ACTIVE' }]
    });
    vi.spyOn(apiClient, 'assignAdminUserTenant').mockImplementation(async (id, tenantId) => ({
      success: true,
      user: { ...USER_ACTIVE, id, tenant_id: tenantId, status: 'ACTIVE' }
    }));
    vi.spyOn(apiClient, 'updateAdminUserStatus').mockResolvedValue({ success: true } as never);
    vi.spyOn(apiClient, 'updateAdminUserTier').mockResolvedValue({ success: true } as never);
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(ADMIN_TOKEN);
    vi.spyOn(authApiClient, 'changePassword').mockResolvedValue({ success: true, message: 'Password rotated.' } as never);
    vi.spyOn(frontendLogger, 'info').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    vi.spyOn(frontendLogger, 'error').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  describe('session and directory loading', () => {
    it.each(['missing user', 'missing token', 'non-administrator'])('redirects a %s without creating or promoting a session', async (scenario) => {
      if (scenario === 'missing user') vi.mocked(apiClient.getStoredUser).mockReturnValue(null);
      if (scenario === 'missing token') vi.mocked(apiClient.getStoredToken).mockReturnValue(null);
      if (scenario === 'non-administrator') vi.mocked(apiClient.getStoredUser).mockReturnValue({ ...ADMIN_USER, role: 'USER' });
      render(<AdminDashboardPage />);
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
      expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
      expect(apiClient.getMe).not.toHaveBeenCalled();
      expect(apiClient.setStoredSession).not.toHaveBeenCalled();
      expect(apiClient.getAdminUsers).not.toHaveBeenCalled();
    });

    it.each([
      { success: false, user: ADMIN_USER },
      { success: true, user: { ...ADMIN_USER, role: 'USER' as const } },
      { success: true, user: { ...ADMIN_USER, status: 'SUSPENDED' as const } }
    ])('rejects database profile %j before loading the user directory', async (profile) => {
      vi.mocked(apiClient.getMe).mockResolvedValue(profile);
      render(<AdminDashboardPage />);
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
      expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
      expect(apiClient.getAdminUsers).not.toHaveBeenCalled();
    });

    it('rejects expired or forged tokens before loading the user directory', async () => {
      vi.mocked(apiClient.getMe).mockRejectedValue(new Error('Session expired'));
      render(<AdminDashboardPage />);
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
      expect(frontendLogger.warn).toHaveBeenCalled();
      expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
      expect(apiClient.getAdminUsers).not.toHaveBeenCalled();
    });

    it.each(['resolve', 'reject'])('ignores a late authentication %s after leaving the page', async (outcome) => {
      let resolve!: (value: Awaited<ReturnType<typeof apiClient.getMe>>) => void;
      let reject!: (reason: Error) => void;
      vi.mocked(apiClient.getMe).mockReturnValue(new Promise((yes, no) => { resolve = yes; reject = no; }));
      const view = render(<AdminDashboardPage />);
      view.unmount();
      await act(async () => {
        if (outcome === 'resolve') resolve({ success: true, user: ADMIN_USER });
        else reject(new Error('Session expired'));
      });
      expect(mockPush).not.toHaveBeenCalled();
      expect(apiClient.getAdminUsers).not.toHaveBeenCalled();
    });

    it('does not rewrite the session when the stored user is already an administrator', async () => {
      await renderDashboard();

      expect(apiClient.setStoredSession).not.toHaveBeenCalled();
      expect(apiClient.getMe).toHaveBeenCalledWith(ADMIN_TOKEN);
      expect(apiClient.getAdminUsers).toHaveBeenCalledWith({
        search: undefined,
        role: undefined,
        status: undefined,
        tier: undefined
      });
    });

    it('shows the administrator identity from the stored session in the header', async () => {
      await renderDashboard();

      expect(screen.getAllByText(ADMIN_USER.full_name as string).length).toBeGreaterThan(0);
      expect(screen.getByText(ADMIN_USER.email, { exact: false })).toBeInTheDocument();
    });

    it('shows KPI counts from the directory response', async () => {
      vi.mocked(apiClient.getAdminUsers).mockResolvedValueOnce({
        success: true,
        users: [USER_ACTIVE, USER_SUSPENDED],
        total: 5,
        activeCount: 4,
        companiesCount: 3
      } as never);

      await renderDashboard();

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('derives KPI counts from the rows when the response omits them', async () => {
      const users = [
        buildUser({ id: 'u-1', email: 'one@a.example', company_name: 'Acme', status: 'ACTIVE' }),
        buildUser({ id: 'u-2', email: 'two@a.example', company_name: 'acme', status: 'ACTIVE' }),
        buildUser({ id: 'u-3', email: 'three@b.example', company_name: 'Beta', status: 'ACTIVE' }),
        buildUser({ id: 'u-4', email: 'four@c.example', company_name: 'Gamma', status: 'SUSPENDED' }),
        buildUser({ id: 'u-5', email: 'five@c.example', company_name: 'GAMMA', status: 'ACTIVE' })
      ];
      vi.mocked(apiClient.getAdminUsers).mockResolvedValueOnce({ success: true, users } as never);

      render(<AdminDashboardPage />);
      await waitForDirectoryLoad();

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('keeps the previous directory when the response is unsuccessful or has no user list', async () => {
      vi.mocked(apiClient.getAdminUsers).mockResolvedValueOnce({ success: false, users: [] } as never);
      const { unmount } = render(<AdminDashboardPage />);
      await waitFor(() => expect(apiClient.getAdminUsers).toHaveBeenCalledTimes(1));
      unmount();

      vi.mocked(apiClient.getAdminUsers).mockResolvedValueOnce({ success: true, users: 'none' } as never);
      render(<AdminDashboardPage />);
      await waitFor(() => expect(apiClient.getAdminUsers).toHaveBeenCalledTimes(2));
      expect(screen.queryByText(USER_ACTIVE.email)).not.toBeInTheDocument();
    });

    it('shows the loading row while the directory request is in flight', async () => {
      let resolveDirectory: (value: unknown) => void = () => undefined;
      vi.mocked(apiClient.getAdminUsers).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveDirectory = resolve;
        }) as never
      );

      render(<AdminDashboardPage />);
      expect(await screen.findByRole('button', { name: SYNCING_LABEL })).toBeDisabled();
      expect(screen.queryByText(USER_ACTIVE.email)).not.toBeInTheDocument();

      resolveDirectory(directoryResponse([USER_ACTIVE]));
      expect(await screen.findByText(USER_ACTIVE.email)).toBeInTheDocument();
    });

    it('shows an empty-directory row when no users match', async () => {
      vi.mocked(apiClient.getAdminUsers).mockResolvedValueOnce(directoryResponse([]) as never);

      render(<AdminDashboardPage />);
      await waitForDirectoryLoad();

      expect(screen.queryAllByRole('button', { name: DETAILS_LABEL })).toHaveLength(0);
      expect(screen.getByRole('button', { name: REFRESH_LABEL })).toBeInTheDocument();
    });

    it('reports a directory load failure with its message and dismisses the banner', async () => {
      vi.mocked(apiClient.getAdminUsers).mockRejectedValueOnce(new Error('Directory service unavailable'));

      render(<AdminDashboardPage />);

      expect(await screen.findByText('Directory service unavailable')).toBeInTheDocument();
      expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), {
        error: 'Directory service unavailable'
      });

      fireEvent.click(screen.getByRole('button', { name: CLOSE_X_LABEL }));
      expect(screen.queryByText('Directory service unavailable')).not.toBeInTheDocument();
    });

    it('reports a generic directory failure when the request rejects with a non-Error value', async () => {
      vi.mocked(apiClient.getAdminUsers).mockRejectedValueOnce('network reset');

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(frontendLogger.error).toHaveBeenCalledWith(expect.any(String), { error: expect.any(String) });
      });
    });

    it('signs out, clears the stored session, and returns to the admin login', async () => {
      await renderDashboard();

      fireEvent.click(screen.getByRole('button', { name: LOGOUT_LABEL }));

      expect(apiClient.clearStoredSession).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  describe('directory filters and refresh', () => {
    it('assigns a pending enterprise user to a selected tenant and activates its row', async () => {
      const pendingUser = buildUser({ id: 'usr-pending', email: 'pending@alpha.example', status: 'PENDING' });
      vi.mocked(apiClient.getAdminUsers).mockResolvedValueOnce(directoryResponse([USER_ACTIVE, pendingUser]) as never);
      vi.mocked(apiClient.assignAdminUserTenant).mockImplementationOnce(async (id, tenantId) => ({
        success: true,
        user: { ...pendingUser, id, tenant_id: tenantId, status: 'ACTIVE' }
      }));
      await renderDashboard();

      fireEvent.change(screen.getByRole('combobox', { name: `${UI_STRINGS.admin.assignTenant}: ${pendingUser.email}` }), {
        target: { value: 'tenant-alpha' }
      });

      await waitFor(() => expect(apiClient.assignAdminUserTenant).toHaveBeenCalledWith('usr-pending', 'tenant-alpha'));
      expect(await screen.findByText(UI_STRINGS.admin.tenantAssigned(pendingUser.email, 'Alpha Industries'))).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: `${UI_STRINGS.admin.assignTenant}: ${pendingUser.email}` })).toHaveValue('tenant-alpha');
    });

    it('keeps inactive tenants visible for existing assignments but disables new selection', async () => {
      vi.mocked(apiClient.getAdminTenants).mockResolvedValueOnce({
        success: true,
        tenants: [
          { tenant_id: 'tenant-alpha', enterprise_name: 'Alpha Industries', status: 'ACTIVE' },
          { tenant_id: 'tenant-paused', enterprise_name: 'Paused Industries', status: 'SUSPENDED' }
        ]
      });
      await renderDashboard();

      const inactiveTenantOptions = screen.getAllByRole('option', { name: `Paused Industries (${UI_STRINGS.admin.inactiveTenant})` });
      expect(inactiveTenantOptions.length).toBeGreaterThan(0);
      expect(inactiveTenantOptions.every((option) => (option as HTMLOptionElement).disabled)).toBe(true);
    });

    it('reloads the directory with the search term and each selected filter', async () => {
      await renderDashboard();

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'acme' } });
      await waitFor(() => {
        expect(apiClient.getAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'acme' }));
      });

      const [roleSelect, statusSelect, tierSelect] = screen.getAllByRole('combobox');
      fireEvent.change(roleSelect, { target: { value: 'ADMIN' } });
      await waitFor(() => {
        expect(apiClient.getAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'ADMIN' }));
      });

      fireEvent.change(statusSelect, { target: { value: 'SUSPENDED' } });
      await waitFor(() => {
        expect(apiClient.getAdminUsers).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'SUSPENDED' }));
      });

      fireEvent.change(tierSelect, { target: { value: 'GOLD' } });
      await waitFor(() => {
        expect(apiClient.getAdminUsers).toHaveBeenLastCalledWith(
          expect.objectContaining({ role: 'ADMIN', status: 'SUSPENDED', tier: 'GOLD', search: 'acme' })
        );
      });

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
      fireEvent.change(roleSelect, { target: { value: 'ALL' } });
      fireEvent.change(statusSelect, { target: { value: 'ALL' } });
      fireEvent.change(tierSelect, { target: { value: 'ALL' } });
      await waitFor(() => {
        expect(apiClient.getAdminUsers).toHaveBeenLastCalledWith({
          search: undefined,
          role: undefined,
          status: undefined,
          tier: undefined
        });
      });
    });

    it('refreshes the directory from the toolbar and shows the syncing state', async () => {
      await renderDashboard();
      let resolveRefresh: (value: unknown) => void = () => undefined;
      vi.mocked(apiClient.getAdminUsers).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }) as never
      );

      fireEvent.click(screen.getByRole('button', { name: REFRESH_LABEL }));

      const syncing = await screen.findByRole('button', { name: SYNCING_LABEL });
      expect(syncing).toBeDisabled();

      resolveRefresh(directoryResponse([USER_ACTIVE]));
      expect(await screen.findByRole('button', { name: REFRESH_LABEL })).not.toBeDisabled();
    });
  });

  describe('user status and tier actions', () => {
    it('suspends an active user, updates the row, and reports the change', async () => {
      await renderDashboard();

      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL }));

      expect(apiClient.updateAdminUserStatus).toHaveBeenCalledWith(USER_ACTIVE.id, 'SUSPENDED');
      expect(await screen.findByText(/status updated to SUSPENDED/)).toBeInTheDocument();
      expect(within(userRow(USER_ACTIVE)).getByRole('button', { name: ACTIVATE_LABEL })).toBeInTheDocument();
    });

    it('activates a suspended user', async () => {
      await renderDashboard();

      fireEvent.click(within(userRow(USER_SUSPENDED)).getByRole('button', { name: ACTIVATE_LABEL }));

      expect(apiClient.updateAdminUserStatus).toHaveBeenCalledWith(USER_SUSPENDED.id, 'ACTIVE');
      expect(await screen.findByText(/status updated to ACTIVE/)).toBeInTheDocument();
    });

    it('keeps the open details in step with a status change for the same user', async () => {
      await renderDashboard();
      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: DETAILS_LABEL }));

      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL }));

      expect(await screen.findByRole('button', { name: CLOSE_DETAILS_LABEL })).toBeInTheDocument();
      expect(apiClient.updateAdminUserStatus).toHaveBeenCalledWith(USER_ACTIVE.id, 'SUSPENDED');
    });

    it('does not report success when the status change is not acknowledged', async () => {
      vi.mocked(apiClient.updateAdminUserStatus).mockResolvedValueOnce({ success: false } as never);
      await renderDashboard();

      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL }));

      await waitFor(() => expect(apiClient.updateAdminUserStatus).toHaveBeenCalled());
      expect(screen.queryByText(/status updated to/)).not.toBeInTheDocument();
      expect(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL })).toBeInTheDocument();
    });

    it('reports a status change failure with the service message', async () => {
      vi.mocked(apiClient.updateAdminUserStatus).mockRejectedValueOnce(new Error('Account is locked'));
      await renderDashboard();

      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL }));

      expect(await screen.findByText('Account is locked')).toBeInTheDocument();
    });

    it('reports a generic status change failure for non-Error rejections', async () => {
      vi.mocked(apiClient.updateAdminUserStatus).mockRejectedValueOnce('timeout');
      await renderDashboard();

      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL }));

      await waitFor(() => expect(apiClient.updateAdminUserStatus).toHaveBeenCalled());
      expect(await screen.findByText('Status update failed')).toBeInTheDocument();
    });

    it('changes a subscription tier from the row selector and reports the change', async () => {
      await renderDashboard();

      fireEvent.change(within(userRow(USER_BRONZE)).getAllByRole('combobox')[0], { target: { value: 'GOLD' } });

      expect(apiClient.updateAdminUserTier).toHaveBeenCalledWith(USER_BRONZE.id, 'GOLD');
      expect(await screen.findByText(/Subscription tier updated to GOLD/)).toBeInTheDocument();
    });

    it('does not report success when the tier change is not acknowledged', async () => {
      vi.mocked(apiClient.updateAdminUserTier).mockResolvedValueOnce({ success: false } as never);
      await renderDashboard();

      fireEvent.change(within(userRow(USER_BRONZE)).getAllByRole('combobox')[0], { target: { value: 'SILVER' } });

      await waitFor(() => expect(apiClient.updateAdminUserTier).toHaveBeenCalled());
      expect(screen.queryByText(/Subscription tier updated/)).not.toBeInTheDocument();
    });

    it('reports a tier change failure with the service message', async () => {
      vi.mocked(apiClient.updateAdminUserTier).mockRejectedValueOnce(new Error('Tier change blocked'));
      await renderDashboard();

      fireEvent.change(within(userRow(USER_BRONZE)).getAllByRole('combobox')[0], { target: { value: 'SILVER' } });

      expect(await screen.findByText('Tier change blocked')).toBeInTheDocument();
    });

    it('reports a generic tier change failure for non-Error rejections', async () => {
      vi.mocked(apiClient.updateAdminUserTier).mockRejectedValueOnce(null);
      await renderDashboard();

      fireEvent.change(within(userRow(USER_BRONZE)).getAllByRole('combobox')[0], { target: { value: 'SILVER' } });

      expect(await screen.findByText('Tier update failed')).toBeInTheDocument();
    });

    it('dismisses a success banner with its close control', async () => {
      await renderDashboard();
      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL }));
      await screen.findByText(/status updated to SUSPENDED/);

      fireEvent.click(screen.getByRole('button', { name: CLOSE_X_LABEL }));

      expect(screen.queryByText(/status updated to SUSPENDED/)).not.toBeInTheDocument();
    });
  });

  describe('user details modal', () => {
    it('opens a user profile and closes it with the footer control', async () => {
      await renderDashboard();

      fireEvent.click(within(userRow(USER_SPARSE)).getByRole('button', { name: DETAILS_LABEL }));
      expect(await screen.findByRole('button', { name: CLOSE_DETAILS_LABEL })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: CLOSE_DETAILS_LABEL }));

      expect(screen.queryByRole('button', { name: CLOSE_DETAILS_LABEL })).not.toBeInTheDocument();
    });

    it('closes the profile with the header close control', async () => {
      await renderDashboard();
      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: DETAILS_LABEL }));
      await screen.findByRole('button', { name: CLOSE_DETAILS_LABEL });

      fireEvent.click(screen.getByRole('button', { name: CLOSE_X_LABEL }));

      expect(screen.queryByRole('button', { name: CLOSE_DETAILS_LABEL })).not.toBeInTheDocument();
    });

    it('applies a tier change to the open profile when that same user is selected', async () => {
      await renderDashboard();
      fireEvent.click(within(userRow(USER_BRONZE)).getByRole('button', { name: DETAILS_LABEL }));
      await screen.findByRole('button', { name: CLOSE_DETAILS_LABEL });

      fireEvent.change(within(userRow(USER_BRONZE)).getAllByRole('combobox')[0], { target: { value: 'SILVER' } });

      expect(await screen.findByText(/Subscription tier updated to SILVER/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: CLOSE_DETAILS_LABEL })).toBeInTheDocument();
    });

    it('leaves the open profile untouched when a different user changes tier', async () => {
      await renderDashboard();
      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: DETAILS_LABEL }));
      await screen.findByRole('button', { name: CLOSE_DETAILS_LABEL });

      fireEvent.change(within(userRow(USER_BRONZE)).getAllByRole('combobox')[0], { target: { value: 'SILVER' } });

      expect(await screen.findByText(/Subscription tier updated to SILVER/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: CLOSE_DETAILS_LABEL })).toBeInTheDocument();
    });

    it('keeps the status update when the profile is closed while the request is pending', async () => {
      let resolveStatus: (value: unknown) => void = () => undefined;
      vi.mocked(apiClient.updateAdminUserStatus).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStatus = resolve;
        }) as never
      );
      await renderDashboard();
      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: DETAILS_LABEL }));
      await screen.findByRole('button', { name: CLOSE_DETAILS_LABEL });
      fireEvent.click(within(userRow(USER_ACTIVE)).getByRole('button', { name: SUSPEND_LABEL }));
      fireEvent.click(screen.getByRole('button', { name: CLOSE_DETAILS_LABEL }));

      resolveStatus({ success: true });

      expect(await screen.findByText(/status updated to SUSPENDED/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: CLOSE_DETAILS_LABEL })).not.toBeInTheDocument();
    });

    it('keeps the tier update when the profile is closed while the request is pending', async () => {
      let resolveTier: (value: unknown) => void = () => undefined;
      vi.mocked(apiClient.updateAdminUserTier).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveTier = resolve;
        }) as never
      );
      await renderDashboard();
      fireEvent.click(within(userRow(USER_BRONZE)).getByRole('button', { name: DETAILS_LABEL }));
      await screen.findByRole('button', { name: CLOSE_DETAILS_LABEL });
      fireEvent.change(within(userRow(USER_BRONZE)).getAllByRole('combobox')[0], { target: { value: 'GOLD' } });
      fireEvent.click(screen.getByRole('button', { name: CLOSE_DETAILS_LABEL }));

      resolveTier({ success: true });

      expect(await screen.findByText(/Subscription tier updated to GOLD/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: CLOSE_DETAILS_LABEL })).not.toBeInTheDocument();
    });
  });

  describe('change password modal', () => {
    const openPasswordModal = async (): Promise<HTMLElement> => {
      const view = await renderDashboard();
      fireEvent.click(screen.getByTitle(PASSWORD_MODAL_TITLE_TOOLTIP));
      await screen.findByRole('button', { name: UPDATE_PASSWORD_LABEL });
      return view.container;
    };

    const fillPasswordForm = (container: HTMLElement, values: [string, string, string]): void => {
      const [current, next, confirm] = passwordInputs(container);
      fireEvent.change(current, { target: { value: values[0] } });
      fireEvent.change(next, { target: { value: values[1] } });
      fireEvent.change(confirm, { target: { value: values[2] } });
    };

    it('opens the password modal from the header and closes it with cancel', async () => {
      const container = await openPasswordModal();

      fireEvent.click(screen.getByRole('button', { name: CANCEL_LABEL }));

      expect(screen.queryByRole('button', { name: UPDATE_PASSWORD_LABEL })).not.toBeInTheDocument();
      expect(container).toBeInTheDocument();
    });

    it('closes the password modal with its header close control', async () => {
      await openPasswordModal();

      fireEvent.click(screen.getByLabelText(PASSWORD_MODAL_CLOSE_LABEL));

      expect(screen.queryByRole('button', { name: UPDATE_PASSWORD_LABEL })).not.toBeInTheDocument();
    });

    it('requires the current password before submitting', async () => {
      const container = await openPasswordModal();
      fillPasswordForm(container, ['', 'fresh-admin-pass', 'fresh-admin-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByText('Please enter your current password')).toBeInTheDocument();
      expect(authApiClient.changePassword).not.toHaveBeenCalled();
    });

    it('requires a new password of at least eight characters', async () => {
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'short', 'short']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByText('New password must be at least 8 characters')).toBeInTheDocument();
      expect(authApiClient.changePassword).not.toHaveBeenCalled();
    });

    it('requires the confirmation to match the new password', async () => {
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'fresh-admin-pass', 'different-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByText('New passwords do not match')).toBeInTheDocument();
      expect(authApiClient.changePassword).not.toHaveBeenCalled();
    });

    it('changes the password with the stored token, shows the confirmation, and closes after a delay', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'fresh-admin-pass', 'fresh-admin-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByText('Password rotated.')).toBeInTheDocument();
      expect(authApiClient.changePassword).toHaveBeenCalledWith(
        { currentPassword: 'current-pass', newPassword: 'fresh-admin-pass' },
        ADMIN_TOKEN
      );
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.queryByRole('button', { name: UPDATE_PASSWORD_LABEL })).not.toBeInTheDocument();
    });

    it('uses the default confirmation and no token when none is stored', async () => {
      vi.mocked(authApiClient.getStoredToken).mockReturnValue(null);
      vi.mocked(authApiClient.changePassword).mockResolvedValueOnce({ success: true } as never);
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'fresh-admin-pass', 'fresh-admin-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByText('Password changed successfully!')).toBeInTheDocument();
      expect(authApiClient.changePassword).toHaveBeenCalledWith(expect.any(Object), undefined);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.queryByRole('button', { name: UPDATE_PASSWORD_LABEL })).not.toBeInTheDocument();
    });

    it('keeps the modal open when the password service does not acknowledge the change', async () => {
      vi.mocked(authApiClient.changePassword).mockResolvedValueOnce({ success: false } as never);
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'fresh-admin-pass', 'fresh-admin-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      await waitFor(() => expect(authApiClient.changePassword).toHaveBeenCalled());
      expect(screen.getByRole('button', { name: UPDATE_PASSWORD_LABEL })).toBeInTheDocument();
    });

    it('shows the service error message when the password change is rejected', async () => {
      vi.mocked(authApiClient.changePassword).mockRejectedValueOnce(new Error('Current password is wrong'));
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'fresh-admin-pass', 'fresh-admin-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByText('Current password is wrong')).toBeInTheDocument();
    });

    it('shows a generic message when the password change rejects with a non-Error value', async () => {
      vi.mocked(authApiClient.changePassword).mockRejectedValueOnce('gateway timeout');
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'fresh-admin-pass', 'fresh-admin-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByText('Failed to change password')).toBeInTheDocument();
    });

    it('shows the pending state while the password change is in flight', async () => {
      let resolveChange: (value: unknown) => void = () => undefined;
      vi.mocked(authApiClient.changePassword).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveChange = resolve;
        }) as never
      );
      const container = await openPasswordModal();
      fillPasswordForm(container, ['current-pass', 'fresh-admin-pass', 'fresh-admin-pass']);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByRole('button', { name: UPDATING_PASSWORD_LABEL })).toBeDisabled();
      resolveChange({ success: true, message: 'Done.' });
      expect(await screen.findByText('Done.')).toBeInTheDocument();
    });

    it('toggles the visibility of each password field independently', async () => {
      const container = await openPasswordModal();

      passwordInputs(container).forEach((input) => {
        expect(input).toHaveAttribute('type', 'password');
        const toggle = within(input.parentElement as HTMLElement).getByRole('button');
        fireEvent.click(toggle);
        expect(input).toHaveAttribute('type', 'text');
        fireEvent.click(toggle);
        expect(input).toHaveAttribute('type', 'password');
      });
    });
  });

  describe('subscription badges and sparse records', () => {
    it('renders sparse user records with fallback labels and no optional sections', async () => {
      await renderDashboard();

      const sparseRow = userRow(USER_SPARSE);
      expect(within(sparseRow).getByText('Enterprise User')).toBeInTheDocument();
      expect(within(sparseRow).getAllByText('—').length).toBeGreaterThan(0);

      fireEvent.click(within(sparseRow).getByRole('button', { name: DETAILS_LABEL }));
      expect(await screen.findByText('No registered physical address')).toBeInTheDocument();
    });
  });
});
