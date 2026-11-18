/**
 * Backend API request logging constants (Frontend)
 */

export const HTTP_SERVER_ERROR_STATUS = 500;

export const API_LOG_MESSAGES = {
  httpFailure: 'Backend API request returned an error status',
  sessionExpired: 'Backend rejected the stored session; the user was signed out and redirected to sign in',
  sessionClearFailed: 'The stored session could not be cleared from browser storage'
} as const;
