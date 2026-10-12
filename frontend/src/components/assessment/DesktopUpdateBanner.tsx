'use client';

/**
 * DesktopUpdateBanner Component
 * 
 * Implements Part 8 & Part 9: "aiCEV Desktop Update Available" experience:
 * - Checks update status on mount and listens for native desktop IPC events
 * - Renders certified version, build identifier, release date, and release notes
 * - Provides [Install Update & Restart] and [Remind Me Later] actions
 * - Adheres strictly to UI_STRINGS and centralized structured logging
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UI_STRINGS } from '../../constants/uiStrings';
import frontendLogger from '../../utils/logger';
import { assessmentApiClient } from '../../utils/assessmentApi';
import type { DesktopUpdateBannerProps, DesktopUpdateCheckResult } from '../../types/assessment';

export const DesktopUpdateBanner: React.FC<DesktopUpdateBannerProps> = ({ onUpdateInitiated }) => {
  const [updateInfo, setUpdateInfo] = useState<DesktopUpdateCheckResult | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [installError, setInstallError] = useState<string | null>(null);

  const strings = UI_STRINGS.ASSESSMENT.updater;

  const checkForUpdate = useCallback(async () => {
    try {
      frontendLogger.debug('Checking desktop update status in DesktopUpdateBanner');

      // 1. Check via native Electron IPC if available
      if (typeof window !== 'undefined' && (window as unknown as { aicevDesktop?: { checkForUpdates?: () => Promise<DesktopUpdateCheckResult> } }).aicevDesktop?.checkForUpdates) {
        try {
          const nativeRes = await (window as unknown as { aicevDesktop: { checkForUpdates: () => Promise<DesktopUpdateCheckResult> } }).aicevDesktop.checkForUpdates();
          if (nativeRes && nativeRes.isUpdateAvailable && nativeRes.verificationStatus === 'CERTIFIED_AND_VERIFIED') {
            frontendLogger.info('Certified desktop update detected via Electron IPC in banner', {
              availableVersion: nativeRes.availableVersion,
              buildNumber: nativeRes.availableBuildNumber
            });
            setUpdateInfo(nativeRes);
            return;
          }
        } catch (ipcErr: unknown) {
          frontendLogger.warn('Native IPC update check fallback to API', { error: String(ipcErr) });
        }
      }

      // 2. Query backend endpoint with client-reported installed version
      const desktopGlobal = typeof window !== 'undefined' ? (window as unknown as { aicevDesktop?: { appVersion?: string; buildNumber?: string } }).aicevDesktop : undefined;
      const result = await assessmentApiClient.getUpdateStatus({
        installedVersion: desktopGlobal?.appVersion,
        installedBuild: desktopGlobal?.buildNumber
      });
      if (result && result.isUpdateAvailable && result.verificationStatus === 'CERTIFIED_AND_VERIFIED') {
        frontendLogger.info('Certified desktop update detected in banner', {
          availableVersion: result.availableVersion,
          buildNumber: result.availableBuildNumber
        });
        setUpdateInfo(result);
      } else {
        setUpdateInfo(null);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      frontendLogger.warn('Non-fatal error checking desktop update status', { error: errorMsg });
    }
  }, []);

  useEffect(() => {
    // Check via backend endpoint on mount
    void checkForUpdate();

    // Also register native IPC event listener if running in Electron shell
    if (typeof window !== 'undefined' && (window as unknown as { aicevDesktop?: { onUpdateAvailable?: (cb: (data: unknown) => void) => () => void } }).aicevDesktop?.onUpdateAvailable) {
      const cleanup = (window as unknown as { aicevDesktop: { onUpdateAvailable: (cb: (data: unknown) => void) => () => void } }).aicevDesktop.onUpdateAvailable((data: unknown) => {
        const updateData = data as DesktopUpdateCheckResult;
        if (updateData?.isUpdateAvailable) {
          frontendLogger.info('Received desktop update notification via Electron IPC', {
            version: updateData.availableVersion
          });
          setUpdateInfo(updateData);
        }
      });
      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [checkForUpdate]);

  const handleRemindLater = () => {
    frontendLogger.info('User chose Remind Me Later for desktop update', {
      version: updateInfo?.availableVersion
    });
    setIsDismissed(true);
  };

  const handleStartUpdateFlow = () => {
    setInstallError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmInstall = async () => {
    setShowConfirmModal(false);
    setIsInstalling(true);
    setInstallError(null);

    frontendLogger.info('User confirmed desktop update installation', {
      targetVersion: updateInfo?.availableVersion,
      targetBuild: updateInfo?.availableBuildNumber
    });

    try {
      // 1. Invoke native electron updater if present
      if (typeof window !== 'undefined' && (window as unknown as { aicevDesktop?: { installUpdateAndRestart?: () => Promise<{ success: boolean; message: string }> } }).aicevDesktop?.installUpdateAndRestart) {
        const nativeRes = await (window as unknown as { aicevDesktop: { installUpdateAndRestart: () => Promise<{ success: boolean; message: string }> } }).aicevDesktop.installUpdateAndRestart();
        if (!nativeRes.success) {
          throw new Error(nativeRes.message || 'Failed to launch desktop installer');
        }
      } else {
        // 2. Invoke backend installation coordinator
        const res = await assessmentApiClient.installUpdate();
        if (!res.success) {
          throw new Error(res.message || 'Failed to initiate update');
        }
      }

      frontendLogger.info('Update initiated successfully');
      if (onUpdateInitiated) {
        onUpdateInitiated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      frontendLogger.error('Failed to install desktop update', { error: msg });
      setInstallError(msg);
      setIsInstalling(false);
    }
  };

  if (!updateInfo || !updateInfo.isUpdateAvailable || isDismissed) {
    return null;
  }

  return (
    <>
      <div
        data-testid="desktop-update-banner"
        className="w-full bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-y border-blue-600/50 px-6 py-4 shadow-xl text-white relative z-40 animate-fade-in"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-blue-200 text-base">
                  {strings.updateAvailableBannerTitle}
                </h4>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {strings.statusCertified}
                </span>
                {updateInfo.isStagedOnly && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {strings.stagedOnlyNote}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-300">
                <span>
                  <strong className="text-slate-400">{strings.installedVersionLabel}</strong>{' '}
                  <span className="font-mono text-slate-300">{updateInfo.currentVersion}</span> ({updateInfo.currentBuildNumber})
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-400">{strings.availableVersionLabel}</strong>{' '}
                  <span className="font-mono text-emerald-400 font-bold">{updateInfo.availableVersion}</span> ({updateInfo.availableBuildNumber})
                </span>
                {updateInfo.releaseDate && (
                  <>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-400">{strings.releaseDateLabel}</strong>{' '}
                      {new Date(updateInfo.releaseDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
                <ul className="mt-2 text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                  {updateInfo.releaseNotes.map((note, idx) => (
                    <li key={idx} className="text-slate-300">{note}</li>
                  ))}
                </ul>
              )}

              {installError && (
                <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded px-2.5 py-1">
                  <strong>{strings.updateFailedTitle}:</strong> {installError}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <button
              type="button"
              data-testid="remind-later-btn"
              onClick={handleRemindLater}
              disabled={isInstalling}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              {strings.remindMeLaterBtn}
            </button>
            <button
              type="button"
              data-testid="install-update-btn"
              onClick={handleStartUpdateFlow}
              disabled={isInstalling}
              className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/40 border border-blue-400/40 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isInstalling ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{strings.installingTitle}</span>
                </>
              ) : (
                <>
                  <span>↓</span>
                  <span>{strings.installAndRestartBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl text-white">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-blue-400">⚡</span>
              {strings.updateAvailableBannerTitle}
            </h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {strings.confirmPrompt}
            </p>
            <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300 border border-slate-700/60 mb-5 space-y-1">
              <div><strong>Target Release:</strong> v{updateInfo.availableVersion} ({updateInfo.availableBuildNumber})</div>
              <div><strong>Verification:</strong> {strings.statusCertified}</div>
              <div className="text-slate-400 mt-2">{strings.recoveryPathMessage}</div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
              >
                {UI_STRINGS.common.cancel}
              </button>
              <button
                type="button"
                data-testid="confirm-install-btn"
                onClick={handleConfirmInstall}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg border border-blue-400/40"
              >
                {strings.installAndRestartBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DesktopUpdateBanner;
