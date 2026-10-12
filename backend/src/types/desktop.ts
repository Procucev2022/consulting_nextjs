/**
 * Types for aiCEV Desktop Release, Update & Installation Management
 */

export interface DesktopReleaseManifest {
  productName: string;
  version: string;
  buildIdentifier: string;
  gitCommit: string;
  buildTimestamp: string;
  operatingMode: string;
  publicSaaSStatus: string;
  installerFileName: string;
  installerSha256: string;
  installerSizeBytes: number;
  backendBuildIdentifier: string;
  frontendBuildIdentifier: string;
  requiredRegressionSuiteResults: string;
  financialParityResult: string;
  securityVerificationResult: string;
  releaseCertificationStatus: string;
  certificationStatus?: string;
  releaseNotes?: string[];
  e2eCertificationId?: string;
  fxMasterVersion?: string;
  fxMasterChecksum?: string;
  pcbiMasterVersion?: string;
  pcbiMasterChecksum?: string;
  appVersion?: string;
  buildNumber?: string;
}

export interface DesktopUpdateCheckResult {
  isUpdateAvailable: boolean;
  currentVersion: string;
  currentBuildNumber: string;
  availableVersion: string | null;
  availableBuildNumber: string | null;
  releaseDate: string | null;
  releaseNotes: string[];
  verificationStatus: 'CERTIFIED_AND_VERIFIED' | 'FAILED' | 'NONE';
  installerFileName: string | null;
  installerSha256: string | null;
  installerSizeBytes: number | null;
  installerPath: string | null;
  manifestPath: string | null;
  errorMessage: string | null;
  isStagedOnly: boolean;
  manifest: DesktopReleaseManifest | null;
}

export interface DesktopInstallUpdateResponse {
  success: boolean;
  message: string;
  installerPath?: string;
  error?: string;
}
