import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAnalysisPage from '../../../../src/app/admin/analysis/page';
import { apiClient } from '../../../../src/utils/api';
import { orchestrationApi } from '../../../../src/utils/orchestrationApi';
import frontendLogger from '../../../../src/utils/logger';
import type { UserProfile } from '../../../../src/types';
import { UI_STRINGS } from '../../../../src/constants';

const mockPush = vi.fn();
// The router must be a stable object: the page's session effect depends on it.
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

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

const FALLBACK_ADMIN_LABEL = UI_STRINGS.admin.analysisRoute.fallbackName;
const LOGOUT_BUTTON_TITLE = UI_STRINGS.auth.logout;

describe('AdminAnalysisPage coverage', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue(ADMIN_USER);
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('admin-token');
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({ success: true, user: ADMIN_USER });
    vi.spyOn(apiClient, 'setStoredSession').mockImplementation(() => undefined);
    vi.spyOn(apiClient, 'clearStoredSession').mockImplementation(() => undefined);
    vi.spyOn(frontendLogger, 'warn').mockImplementation(() => ({}) as never);
    vi.spyOn(orchestrationApi, 'getJobs').mockResolvedValue([]);
    vi.spyOn(orchestrationApi, 'getAdminKPIs').mockResolvedValue({
      newAnalyses: 0,
      pcbiReviewsPending: 0,
      dataCorrectionsPending: 0,
      reportsPendingReview: 0,
      reportsReadyToSubmit: 0,
      customerAcknowledgementsPending: 0,
      blockedAnalyses: 0,
      totalAnalyses: 0
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it.each(['missing user', 'missing token', 'non-administrator'])('redirects a %s without creating or promoting a session', async (scenario) => {
    if (scenario === 'missing user') vi.mocked(apiClient.getStoredUser).mockReturnValue(null);
    if (scenario === 'missing token') vi.mocked(apiClient.getStoredToken).mockReturnValue(null);
    if (scenario === 'non-administrator') vi.mocked(apiClient.getStoredUser).mockReturnValue({ ...ADMIN_USER, role: 'USER' });
    render(<AdminAnalysisPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
    expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
    expect(apiClient.getMe).not.toHaveBeenCalled();
    expect(apiClient.setStoredSession).not.toHaveBeenCalled();
    expect(orchestrationApi.getJobs).not.toHaveBeenCalled();
  });

  it.each([
    { success: false, user: ADMIN_USER },
    { success: true, user: { ...ADMIN_USER, role: 'USER' as const } },
    { success: true, user: { ...ADMIN_USER, status: 'SUSPENDED' as const } }
  ])('rejects database profile %j without rendering protected content', async (profile) => {
    vi.mocked(apiClient.getMe).mockResolvedValue(profile);
    render(<AdminAnalysisPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
    expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
    expect(orchestrationApi.getJobs).not.toHaveBeenCalled();
  });

  it('rejects an expired or forged token when the authentication API fails', async () => {
    const failure = new Error('Session expired');
    vi.mocked(apiClient.getMe).mockRejectedValue(failure);
    render(<AdminAnalysisPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));
    expect(frontendLogger.warn).toHaveBeenCalledWith(
      UI_STRINGS.admin.analysisRoute.sessionVerificationFailedLog,
      expect.objectContaining({
        action: 'adminAnalysisAuthentication',
        userId: ADMIN_USER.id,
        tenantId: ADMIN_USER.tenant_id
      }),
      failure
    );
    expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
    expect(orchestrationApi.getJobs).not.toHaveBeenCalled();
  });

  it('serializes non-Error authentication failures and keeps the login fallback', async () => {
    vi.mocked(apiClient.getMe).mockRejectedValue('gateway timeout');
    render(<AdminAnalysisPage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/login'));

    expect(frontendLogger.warn).toHaveBeenCalledWith(
      UI_STRINGS.admin.analysisRoute.sessionVerificationFailedLog,
      expect.objectContaining({ action: 'adminAnalysisAuthentication' }),
      'gateway timeout'
    );
    expect(apiClient.clearStoredSession).toHaveBeenCalledOnce();
  });

  it.each(['resolve', 'reject'])('ignores a late authentication %s after leaving the page', async (outcome) => {
    let resolve!: (value: Awaited<ReturnType<typeof apiClient.getMe>>) => void;
    let reject!: (reason: Error) => void;
    vi.mocked(apiClient.getMe).mockReturnValue(new Promise((yes, no) => { resolve = yes; reject = no; }));
    const view = render(<AdminAnalysisPage />);
    view.unmount();
    await act(async () => {
      if (outcome === 'resolve') resolve({ success: true, user: ADMIN_USER });
      else reject(new Error('Session expired'));
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(orchestrationApi.getJobs).not.toHaveBeenCalled();
  });

  it('shows the stored administrator name in the header without seeding a session', async () => {
    render(<AdminAnalysisPage />);

    expect(await screen.findByText(ADMIN_USER.name)).toBeInTheDocument();
    expect(apiClient.getMe).toHaveBeenCalledWith('admin-token');
    expect(apiClient.setStoredSession).not.toHaveBeenCalled();
  });

  it('falls back to the generic administrator label when the stored session has no name', async () => {
    vi.mocked(apiClient.getMe).mockResolvedValue({ success: true, user: { ...ADMIN_USER, name: undefined } });

    render(<AdminAnalysisPage />);

    expect(await screen.findByText(FALLBACK_ADMIN_LABEL)).toBeInTheDocument();
  });

  it('logs out, clears the stored session, and returns to the admin login', async () => {
    render(<AdminAnalysisPage />);

    fireEvent.click(await screen.findByTitle(LOGOUT_BUTTON_TITLE));

    expect(apiClient.clearStoredSession).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/admin/login');
  });
});
