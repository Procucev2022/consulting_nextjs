export interface ReleaseManifest {
  applicationName: string;
  appVersion: string;
  buildNumber: string;
  gitCommit: string;
  buildTimestamp: string;
  operatingMode: string;
  certificationStatus: string;
  e2eCertificationId: string;
  fxMasterVersion: string;
  fxMasterChecksum: string;
  pcbiMasterVersion: string;
  pcbiMasterChecksum: string;
}

export interface ProcessStatus {
  backendRunning: boolean;
  frontendRunning: boolean;
  backendPid?: number;
  frontendPid?: number;
}
