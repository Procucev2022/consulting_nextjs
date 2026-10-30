import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPCBIPage from '../../../../src/app/admin/pcbi/page';
import { apiClient } from '../../../../src/utils/api';
import { UI_STRINGS } from '../../../../src/constants';
import frontendLogger from '../../../../src/utils/logger';
import type { UserProfile } from '../../../../src/types';

const mockPush = vi.fn();
// The router must be a stable object: the page's session effect depends on it.
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// The two heavy PCBI views are covered by their own tests; here they only need to be identifiable.
vi.mock('../../../../src/components/admin/pcbi/PCBIAdminMasterView', async () => {
  const React = await import('react');
  return {
    PCBIAdminMasterView: () => React.createElement('div', { 'data-testid': 'pcbi-master-view' })
  };
});

vi.mock('../../../../src/components/admin/pcbi/PCBICommodityDataLabView', async () => {
  const React = await import('react');
  return {
    PCBICommodityDataLabView: () => React.createElement('div', { 'data-testid': 'pcbi-data-lab-view' })
  };
});

const ADMIN_USER: UserProfile = {
  id: 'usr-admin-1',
  name: 'Sriman Admin',
  email: 'sriman@procucev.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  subscription_tier: 'GOLD',
  company_name: 'Procucev Enterprise Solutions Pvt Ltd',
  created_at: '2026-01-01T00:00:00.000Z'
};

// The logout label is not yet defined in UI_STRINGS for this page.
const LOGOUT_LABEL = 'Logout';

describe('AdminPCBIPage coverage', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(ADMIN_USER);
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('admin-token');
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({ success: true, user: ADMIN_USER });
    vi.spyOn(apiClient, 'setStoredSession').mockImplementation(() => undefined);
    vi.spyOn(apiClient, 'clearStoredSession').mockImplementation(() => undefined);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it.each(['missing user', 'missing token', 'non-administrator'])('redirects a %s without creating or promoting a session', async (scenario) => {
    if (scenario === 'missing user') vi.mocked(apiClient.getStoredUser).mockReturnValue(null);
    if (scenario === 'missing token') vi.mocked(apiClient.getStoredToken).mockReturnValue(null);
    if (scenario === 'non-administrator') vi.mocked(apiClient.getStoredUser).mockReturnValue({ ...ADMIN_USER, role: 'USER' });
    render(<AdminPCBIPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
    expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
    expect(apiClient.getMe).not.toHaveBeenCalled();
    expect(apiClient.setStoredSession).not.toHaveBeenCalled();
    expect(screen.queryByTestId('pcbi-master-view')).not.toBeInTheDocument();
  });

  it.each([
    { success: false, user: ADMIN_USER },
    { success: true, user: { ...ADMIN_USER, role: 'USER' as const } },
    { success: true, user: { ...ADMIN_USER, status: 'SUSPENDED' as const } }
  ])('rejects database profile %j without rendering protected content', async (profile) => {
    vi.mocked(apiClient.getMe).mockResolvedValue(profile);
    render(<AdminPCBIPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
    expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('pcbi-master-view')).not.toBeInTheDocument();
  });

  it('rejects an expired or forged token when the authentication API fails', async () => {
    vi.mocked(apiClient.getMe).mockRejectedValue(new Error('Session expired'));
    render(<AdminPCBIPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
    expect(frontendLogger.warn).toHaveBeenCalled();
    expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('pcbi-master-view')).not.toBeInTheDocument();
  });

  it.each(['resolve', 'reject'])('ignores a late authentication %s after leaving the page', async (outcome) => {
    let resolve!: (value: Awaited<ReturnType<typeof apiClient.getMe>>) => void;
    let reject!: (reason: Error) => void;
    vi.mocked(apiClient.getMe).mockReturnValue(new Promise((yes, no) => { resolve = yes; reject = no; }));
    const view = render(<AdminPCBIPage />);
    view.unmount();
    await act(async () => {
      if (outcome === 'resolve') resolve({ success: true, user: ADMIN_USER });
      else reject(new Error('Session expired'));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows the signed-in administrator name and email in the header', async () => {
    render(<AdminPCBIPage />);

    expect(await screen.findByText(ADMIN_USER.name)).toBeInTheDocument();
    expect(screen.getByText(`(${ADMIN_USER.email})`)).toBeInTheDocument();
    expect(apiClient.setStoredSession).not.toHaveBeenCalled();
    expect(apiClient.getMe).toHaveBeenCalledWith('admin-token');
  });

  it('switches between the PCBI top-level views', async () => {
    render(<AdminPCBIPage />);
    expect(await screen.findByTestId('pcbi-master-view')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiCommodityDataLab.navCommodityDataLab }));
    expect(screen.getByTestId('pcbi-data-lab-view')).toBeInTheDocument();
    expect(screen.queryByTestId('pcbi-master-view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiCommodityDataLab.navPcbiDashboard }));
    expect(screen.getByTestId('pcbi-master-view')).toBeInTheDocument();
    expect(screen.queryByTestId('pcbi-data-lab-view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.pcbiCommodityDataLab.navPcbiMaster }));
    expect(screen.getByTestId('pcbi-master-view')).toBeInTheDocument();
  });

  it('logs out, clears the stored session, and navigates to the admin login', async () => {
    render(<AdminPCBIPage />);

    fireEvent.click(await screen.findByRole('button', { name: LOGOUT_LABEL }));

    expect(apiClient.clearStoredSession).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/admin/login');
  });
});
