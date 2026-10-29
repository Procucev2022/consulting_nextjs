/**
 * Evidence download keys, timing, headers, and the package filename helper.
 * User-facing failure messages live in UI_STRINGS.evidence.downloadFailure.
 */

export const EVIDENCE_DOWNLOAD_KEYS = {
  PACKAGE: 'PACKAGE',
  SAVINGS_ENGINE: 'SAVINGS_ENGINE_EVIDENCE'
} as const;

export const EVIDENCE_DOWNLOAD_CONSTANTS = {
  REVOKE_DELAY_MS: 1000,
  AUTH_HEADER: 'Authorization',
  BEARER_PREFIX: 'Bearer ',
  REQUEST_ID_HEADER: 'X-Request-Id',
  PACKAGE_FILENAME_PREFIX: 'Complete_Analysis_Evidence_Package_',
  PACKAGE_FILENAME_SUFFIX: '.zip',
  NETWORK_FAILURE_STATUS: 0
} as const;

export const buildPackageFilename = (jobId: string): string =>
  `${EVIDENCE_DOWNLOAD_CONSTANTS.PACKAGE_FILENAME_PREFIX}${jobId}${EVIDENCE_DOWNLOAD_CONSTANTS.PACKAGE_FILENAME_SUFFIX}`;
