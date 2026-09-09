/**
 * Constants for Post-Deployment Operations Verification
 */

export const DEPLOYMENT_VERIFICATION_CONSTANTS = {
  SAMPLE_FILE_NAME: 'Deployment_Verification_Batch_2026.xlsx',
  SAMPLE_FILE_TYPE: 'XLSX',
  SAMPLE_FILE_SIZE_MB: 14.8,
  SAMPLE_RECORDS_COUNT: 5200,
  SAMPLE_CONVERTED_INR_CRORES: 45.2,
  HEALTH_ENDPOINT: '/api/health',
  TENANT_ENDPOINT: '/api/tenant',
  INGESTION_ENDPOINT: '/api/ingestion',
  STATUS_PASSED: 'passed' as const,
  STATUS_FAILED: 'failed' as const,
  TIMEOUT_MS: 5000
};
