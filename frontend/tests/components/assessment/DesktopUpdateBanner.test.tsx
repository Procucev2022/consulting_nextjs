import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesktopUpdateBanner } from '../../../src/components/assessment/DesktopUpdateBanner';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { DesktopUpdateCheckResult } from '../../../src/types/assessment';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getUpdateStatus: vi.fn(),
    installUpdate: vi.fn()
  },
  assessmentApi: {
    getUpdateStatus: vi.fn(),
    installUpdate: vi.fn()
  }
}));

describe('DesktopUpdateBanner Component', () => {
  const mockUpdateResult: DesktopUpdateCheckResult = {
    isUpdateAvailable: true,
    currentVersion: '1.0.0',
    currentBuildNumber: 'E2E-001-CERTIFIED',
    availableVersion: '1.0.1',
    availableBuildNumber: 'E2E-002-CERTIFIED',
    releaseDate: '2026-10-10T08:50:00.000Z',
    releaseNotes: [
      'Certified Procurement Update v1.0.1',
      'VGT parity verification verified'
    ],
    verificationStatus: 'CERTIFIED_AND_VERIFIED',
    installerFileName: 'aiCEV-Internal-Assessment-Setup.exe',
    installerSha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    installerSizeBytes: 65432100,
    installerPath: 'C:\\test\\aiCEV-Internal-Assessment-Setup.exe',
    manifestPath: 'C:\\test\\release-manifest.json',
    errorMessage: null,
    isStagedOnly: true,
    manifest: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).aicevDesktop;
  });

  it('renders nothing when no update is available', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce({
      ...mockUpdateResult,
      isUpdateAvailable: false,
      verificationStatus: 'NONE'
    });

    const { container } = render(<DesktopUpdateBanner />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders nothing when update verification failed', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce({
      ...mockUpdateResult,
      isUpdateAvailable: false,
      verificationStatus: 'FAILED',
      errorMessage: 'Checksum mismatch'
    });

    const { container } = render(<DesktopUpdateBanner />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('handles error gracefully when getUpdateStatus throws', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockRejectedValueOnce(new Error('Network error'));
    const { container } = render(<DesktopUpdateBanner />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders update banner with version details when certified update is available', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce(mockUpdateResult);

    render(<DesktopUpdateBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-update-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.updater.updateAvailableBannerTitle)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.updater.statusCertified)).toBeInTheDocument();
    expect(screen.getByText('1.0.1')).toBeInTheDocument();
    expect(screen.getByText('Certified Procurement Update v1.0.1')).toBeInTheDocument();
  });

  it('dismisses banner when user clicks Remind Me Later', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce(mockUpdateResult);

    render(<DesktopUpdateBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('remind-later-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('remind-later-btn'));

    expect(screen.queryByTestId('desktop-update-banner')).not.toBeInTheDocument();
  });

  it('opens confirmation modal and allows canceling update', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce(mockUpdateResult);

    render(<DesktopUpdateBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('install-update-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('install-update-btn'));

    expect(screen.getByText(UI_STRINGS.ASSESSMENT.updater.confirmPrompt)).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByText(UI_STRINGS.common.cancel));
    expect(screen.queryByText(UI_STRINGS.ASSESSMENT.updater.confirmPrompt)).not.toBeInTheDocument();
  });

  it('initiates update via web API when user confirms install', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce(mockUpdateResult);
    vi.mocked(assessmentApiClient.installUpdate).mockResolvedValueOnce({
      success: true,
      message: 'Installer launched successfully'
    });

    const onUpdateInitiated = vi.fn();
    render(<DesktopUpdateBanner onUpdateInitiated={onUpdateInitiated} />);

    await waitFor(() => {
      expect(screen.getByTestId('install-update-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('install-update-btn'));
    fireEvent.click(screen.getByTestId('confirm-install-btn'));

    await waitFor(() => {
      expect(assessmentApiClient.installUpdate).toHaveBeenCalled();
      expect(onUpdateInitiated).toHaveBeenCalled();
    });
  });

  it('initiates update via Electron native bridge when window.aicevDesktop is present', async () => {
    const installUpdateAndRestart = vi.fn().mockResolvedValue({
      success: true,
      message: 'Native installer launched'
    });

    (window as any).aicevDesktop = {
      installUpdateAndRestart,
      onUpdateAvailable: vi.fn()
    };

    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce(mockUpdateResult);

    render(<DesktopUpdateBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('install-update-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('install-update-btn'));
    fireEvent.click(screen.getByTestId('confirm-install-btn'));

    await waitFor(() => {
      expect(installUpdateAndRestart).toHaveBeenCalled();
    });
  });

  it('displays error message when update installation fails', async () => {
    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce(mockUpdateResult);
    vi.mocked(assessmentApiClient.installUpdate).mockResolvedValueOnce({
      success: false,
      message: 'Active job is currently running',
      error: 'ACTIVE_JOB_IN_PROGRESS'
    });

    render(<DesktopUpdateBanner />);

    await waitFor(() => {
      expect(screen.getByTestId('install-update-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('install-update-btn'));
    fireEvent.click(screen.getByTestId('confirm-install-btn'));

    await waitFor(() => {
      expect(screen.getByText(new RegExp(UI_STRINGS.ASSESSMENT.updater.updateFailedTitle))).toBeInTheDocument();
    });
  });

  it('listens for native update available event via Electron IPC listener', async () => {
    let capturedCallback: any;
    const cleanup = vi.fn();
    (window as any).aicevDesktop = {
      onUpdateAvailable: vi.fn().mockImplementation((cb) => {
        capturedCallback = cb;
        return cleanup;
      })
    };

    vi.mocked(assessmentApiClient.getUpdateStatus).mockResolvedValueOnce({
      ...mockUpdateResult,
      isUpdateAvailable: false
    });

    const { unmount } = render(<DesktopUpdateBanner />);

    await waitFor(() => {
      expect((window as any).aicevDesktop.onUpdateAvailable).toHaveBeenCalled();
    });

    // Simulate IPC event from main process
    capturedCallback(mockUpdateResult);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-update-banner')).toBeInTheDocument();
    });

    unmount();
    expect(cleanup).toHaveBeenCalled();
  });
});
