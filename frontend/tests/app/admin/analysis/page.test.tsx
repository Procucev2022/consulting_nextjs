import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminAnalysisPage from '../../../../src/app/admin/analysis/page';
import { apiClient } from '../../../../src/utils/api';
import { orchestrationApi } from '../../../../src/utils/orchestrationApi';
import { UI_STRINGS } from '../../../../src/constants';

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

describe('AdminAnalysisPage Route Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();

    vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
      id: 'usr-admin-1',
      name: 'Sriman Admin',
      email: 'sriman@procucev.com',
      role: 'ADMIN',
      company_name: 'Procucev Admin'
    } as any);
    vi.spyOn(apiClient, 'getStoredToken').mockReturnValue('admin-token');
    vi.spyOn(apiClient, 'getMe').mockResolvedValue({ success: true, user: { ...apiClient.getStoredUser()!, status: 'ACTIVE' } });

    vi.spyOn(apiClient, 'clearStoredSession').mockImplementation(() => {});

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

  it('renders admin navigation, title, and AnalysisControlCenter', async () => {
    render(<AdminAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText(UI_STRINGS.admin.analysisRoute.brandName)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.admin.analysisRoute.usersNavigation)).toBeInTheDocument();
      expect(screen.getByText(UI_STRINGS.pcbiAdmin.breadcrumbMaster)).toBeInTheDocument();
      expect(screen.getAllByText(UI_STRINGS.orchestration.controlCenterTitle).length).toBeGreaterThanOrEqual(1);
    });

    const signOutBtn = screen.getByTitle(UI_STRINGS.auth.logout);
    fireEvent.click(signOutBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin/login');
  });
});
