import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemInfoModal } from '../../../src/components/assessment/SystemInfoModal';
import { UI_STRINGS } from '../../../src/constants/uiStrings';
import { assessmentApiClient } from '../../../src/utils/assessmentApi';
import type { SystemBuildInfo } from '../../../src/types/assessment';

vi.mock('../../../src/utils/assessmentApi', () => ({
  assessmentApiClient: {
    getSystemInfo: vi.fn()
  }
}));

const SAMPLE_SYSTEM_INFO: SystemBuildInfo = {
  applicationVersion: '2.1.0',
  buildNumber: 'TEST-BUILD-0001',
  gitCommit: 'a1b2c3d4e5f6a7b8c9d0',
  buildTimestamp: '2026-01-15T09:30:00.000Z',
  operatingMode: 'INTERNAL_ASSESSMENT',
  certificationStatus: 'CERTIFIED',
  e2eCertificationId: 'E2E-TEST-0001',
  fxMaster: {
    version: 'v9.9',
    checksum: 'fx-checksum-sample'
  },
  pcbiMaster: {
    version: 'v8.8',
    checksum: 'pcbi-checksum-sample'
  }
};

const FALLBACK_APP_VERSION = '1.0.2';
const FALLBACK_BUILD_NUMBER = 'E2E-003-CERTIFIED';
const FALLBACK_OPERATING_MODE = 'INTERNAL_ASSESSMENT';
const FALLBACK_CERTIFICATION_STATUS = 'CERTIFIED';
const FALLBACK_MASTER_VERSION = 'v2.0';

describe('SystemInfoModal Component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing and does not request system info while closed', () => {
    const { container } = render(<SystemInfoModal isOpen={false} onClose={onClose} />);

    expect(container.firstChild).toBeNull();
    expect(assessmentApiClient.getSystemInfo).not.toHaveBeenCalled();
  });

  it('shows the loading state until system info resolves', async () => {
    let resolveInfo: (value: SystemBuildInfo) => void = () => undefined;
    vi.mocked(assessmentApiClient.getSystemInfo).mockReturnValueOnce(
      new Promise<SystemBuildInfo>((resolve) => {
        resolveInfo = resolve;
      })
    );

    render(<SystemInfoModal isOpen onClose={onClose} />);

    expect(screen.getByText(UI_STRINGS.common.loading)).toBeInTheDocument();

    resolveInfo(SAMPLE_SYSTEM_INFO);

    expect(await screen.findByText(SAMPLE_SYSTEM_INFO.applicationVersion)).toBeInTheDocument();
    expect(screen.queryByText(UI_STRINGS.common.loading)).not.toBeInTheDocument();
  });

  it('displays the running version, build identity, and master data checksums', async () => {
    vi.mocked(assessmentApiClient.getSystemInfo).mockResolvedValueOnce(SAMPLE_SYSTEM_INFO);

    render(<SystemInfoModal isOpen onClose={onClose} />);

    expect(await screen.findByText(SAMPLE_SYSTEM_INFO.applicationVersion)).toBeInTheDocument();
    expect(screen.getByText(UI_STRINGS.ASSESSMENT.updater.modalRunningVersion)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SYSTEM_INFO.buildNumber)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SYSTEM_INFO.operatingMode)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SYSTEM_INFO.certificationStatus)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SYSTEM_INFO.gitCommit)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SYSTEM_INFO.fxMaster.version)).toBeInTheDocument();
    expect(screen.getByText(`SHA-256: ${SAMPLE_SYSTEM_INFO.fxMaster.checksum}`)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_SYSTEM_INFO.pcbiMaster.version)).toBeInTheDocument();
    expect(screen.getByText(`SHA-256: ${SAMPLE_SYSTEM_INFO.pcbiMaster.checksum}`)).toBeInTheDocument();
  });

  it('falls back to default values for any empty field', async () => {
    vi.mocked(assessmentApiClient.getSystemInfo).mockResolvedValueOnce({
      applicationVersion: '',
      buildNumber: '',
      gitCommit: '',
      buildTimestamp: '',
      operatingMode: '',
      certificationStatus: '',
      e2eCertificationId: '',
      fxMaster: { version: '', checksum: '' },
      pcbiMaster: { version: '', checksum: '' }
    });

    render(<SystemInfoModal isOpen onClose={onClose} />);

    expect(await screen.findByText(FALLBACK_APP_VERSION)).toBeInTheDocument();
    expect(screen.getByText(FALLBACK_BUILD_NUMBER)).toBeInTheDocument();
    expect(screen.getByText(FALLBACK_OPERATING_MODE)).toBeInTheDocument();
    expect(screen.getByText(FALLBACK_CERTIFICATION_STATUS)).toBeInTheDocument();
    expect(screen.getAllByText(FALLBACK_MASTER_VERSION)).toHaveLength(2);
  });

  it('uses built-in certified defaults when the system info request fails', async () => {
    vi.mocked(assessmentApiClient.getSystemInfo).mockRejectedValueOnce(new Error('Network error'));

    render(<SystemInfoModal isOpen onClose={onClose} />);

    expect(await screen.findByText(FALLBACK_APP_VERSION)).toBeInTheDocument();
    expect(screen.getByText(FALLBACK_BUILD_NUMBER)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    vi.mocked(assessmentApiClient.getSystemInfo).mockResolvedValueOnce(SAMPLE_SYSTEM_INFO);

    render(<SystemInfoModal isOpen onClose={onClose} />);

    await screen.findByText(SAMPLE_SYSTEM_INFO.applicationVersion);
    fireEvent.click(screen.getByRole('button', { name: UI_STRINGS.ASSESSMENT.systemInfoModal.btnClose }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
