/**
 * Evidence API error categories, HTTP status codes, and user-facing messages.
 * Messages state the failed operation, the cause, and the next step.
 */

export const EVIDENCE_ERROR_CATEGORIES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  SERVER: 'SERVER_ERROR'
} as const;

export const EVIDENCE_HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const EVIDENCE_MESSAGES = {
  validationFailed: 'Validation failed',
  missingBearerToken: 'Authentication required. Send the access token from sign-in as "Authorization: Bearer <token>" and retry.',
  invalidToken: 'Your session token is invalid or has expired. Sign in again to continue.',
  userNotFound: 'The account in this session no longer exists. Sign in again with an active account.',
  accountInactive: (status: string): string =>
    `Account status is ${status}, so evidence exports are blocked. Contact support to restore access.`,
  unsupportedRole: (role: string): string =>
    `Role ${role} cannot read evidence exports. An administrator must assign the ADMIN or USER role.`,
  databaseNotConfigured: 'Cloudflare D1 binding DB is not configured for this Worker. Bind D1, redeploy, and retry.',
  authSecretNotConfigured: 'AUTH_SECRET is not configured for this Worker, so tokens cannot be verified. Set AUTH_SECRET and retry.',
  jobNotFound: (jobId: string): string =>
    `Analysis job ${jobId} was not found in D1. Check the job ID and refresh the evidence panel.`,
  accessDenied: (jobId: string): string =>
    `Access denied: analysis job ${jobId} is not linked to your account. The sign-in email must match the contact email on the job's customer record. Ask an administrator to confirm it.`,
  tenantAssignmentRequired: 'Evidence export requires a trusted tenant assignment. Ask an administrator to assign your account to one tenant and select that tenant before retrying.',
  tenantMissing: 'D1 has no TenantMaster row, so evidence cannot be scoped to a tenant. Seed D1 with the tenant record and retry.',
  routeNotFound: 'Evidence endpoint not found. Use /api/evidence/jobs/{jobId}/inventory, /parity, /workbooks/{workbookType}/download, /package/download, or /savings/.',
  methodNotAllowed: 'Evidence endpoints accept GET requests only. Send a GET request to the same URL.',
  serverError: (requestId: string): string =>
    `Evidence export failed while reading D1 (request ${requestId}). Retry; if it persists, send this request ID to support.`,
  ledgerEmpty: (jobId: string): string =>
    `No ProcurementTransaction rows are linked to job ${jobId}. Upload the source ledger for this assessment, run analysis, then refresh.`,
  noApprovedRun: (jobId: string): string =>
    `No approved, non-superseded analysis run exists for job ${jobId}. Run and approve analysis, then refresh.`,
  noDataVersion: (jobId: string): string =>
    `No active data version is recorded for job ${jobId}. Upload the source data for this assessment, then refresh.`,
  noAnalysisRuns: (jobId: string): string =>
    `No analysis runs are recorded for job ${jobId}. Run analysis, then refresh.`,
  workbookUnavailable: (jobId: string, reason: string): string =>
    `Evidence workbook is unavailable for job ${jobId}. ${reason}`,
  packageEmpty: (jobId: string): string =>
    `No evidence workbook can be produced for job ${jobId}, so the package would be empty. Resolve the unavailable items in the inventory, then retry.`,
  savingsTypeUnavailable: (title: string, initiativeId: string, workbookFilename: string): string =>
    `${title} (${initiativeId}) cannot be produced from D1 for this job. D1 stores only run-level bridge totals, not per-initiative values. Download ${workbookFilename} for the run-level bridge.`,
  discrepancyReason: (uiValue: string, evidenceValue: string, sourceValue: string): string =>
    `Discrepancy between UI (${uiValue}), Evidence (${evidenceValue}), and Source (${sourceValue})`,
  missingInputs: (labels: string): string => `Missing input: ${labels}`,
  withinTolerance: (tolerance: number): string => `Within tolerance of ${tolerance}`,
  outsideTolerance: (variance: number, tolerance: number): string =>
    `Variance ${variance} exceeds tolerance ${tolerance}`
} as const;
