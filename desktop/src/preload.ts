import { contextBridge, ipcRenderer } from 'electron';
import type { ReleaseManifest } from './types';

const releaseManifest: ReleaseManifest = {
  applicationName: 'aiCEV – Internal Assessment',
  appVersion: '1.0.2',
  buildNumber: 'E2E-003-CERTIFIED',
  gitCommit: '2378cd054fdcd528ec2815362a44a6461c72fa8e',
  buildTimestamp: '2026-10-11T12:00:00.000Z',
  operatingMode: 'INTERNAL_ASSESSMENT',
  certificationStatus: 'CERTIFIED',
  e2eCertificationId: 'E2E-GOLD-003',
  fxMasterVersion: 'v2.0',
  fxMasterChecksum: '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f',
  pcbiMasterVersion: 'v2.0',
  pcbiMasterChecksum: 'df4299ffa183cb21c59d80f66e258604f5c376615d83a7a7d075dd53787e1411'
};

contextBridge.exposeInMainWorld('aicevDesktop', {
  isDesktop: true,
  appVersion: releaseManifest.appVersion,
  buildNumber: releaseManifest.buildNumber,
  gitCommit: releaseManifest.gitCommit,
  operatingMode: releaseManifest.operatingMode,
  certificationStatus: releaseManifest.certificationStatus,
  buildTimestamp: releaseManifest.buildTimestamp,
  getManifest: () => releaseManifest,
  retryStartup: () => {
    ipcRenderer.send('aicev:retry-startup');
  },
  closeApp: () => {
    ipcRenderer.send('aicev:close-app');
  },
  checkForUpdates: async () => {
    return ipcRenderer.invoke('aicev:check-for-updates');
  },
  installUpdateAndRestart: async () => {
    return ipcRenderer.invoke('aicev:install-update');
  },
  onUpdateAvailable: (callback: (data: unknown) => void) => {
    const subscription = (_event: unknown, data: unknown) => callback(data);
    ipcRenderer.on('aicev:update-available', subscription);
    return () => {
      ipcRenderer.removeListener('aicev:update-available', subscription);
    };
  }
});
