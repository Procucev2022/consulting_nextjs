/**
 * User-facing messages for the Analysis Orchestration API.
 * Each error states the problem, the cause and the next step so the admin or customer can act.
 */

export const ORCHESTRATION_MESSAGES = {
  validationFailed: 'Validation failed',
  invalidJson:
    'Request body must be valid JSON. Send a JSON object containing the fields documented for this endpoint.',
  invalidPathEncoding:
    'A URL path segment contains invalid percent-encoding. Remove the malformed characters and retry.',
  routeNotFound: 'No analysis orchestration endpoint matches this path. Check the path against the API contract.',
  methodNotAllowed: 'This endpoint does not accept the HTTP method used. Send the method documented for this route.',
  databaseNotConfigured:
    'Cloudflare D1 binding DB is not configured for this Worker, so analysis data cannot be read. ' +
    'Add the DB binding in wrangler.jsonc and redeploy.',
  authNotConfigured:
    'Analysis access cannot be verified because AUTH_SECRET is not set on the Worker. ' +
    'Set AUTH_SECRET and redeploy.',
  authRequired:
    'Authentication required: send your session token as "Authorization: Bearer <token>". ' +
    'Sign in again if your session has expired.',
  accountInactive: 'This account is not active, so analysis access is denied. Ask an administrator to reactivate it.',
  tenantAssignmentRequired: 'This request needs an active tenant assignment. Ask an administrator to assign one tenant to the account and retry.',
  unknownRole: 'This account has no valid role for analysis access. Ask an administrator to check the account role.',
  adminRequired: 'This action needs an administrator account. Sign in as an administrator and retry.',
  customerRequired:
    'This action is only available to the customer account that owns the analysis. ' +
    'Sign in with that customer account and retry.',
  jobOutOfScope:
    'This analysis belongs to a different customer account. Sign in with the account linked to this analysis.',
  jobNotFound: (jobId: string): string =>
    `Analysis job ${jobId} was not found. Refresh the job list and select a job that exists.`,
  reportNotFound: (reportId: string): string =>
    `Report ${reportId} was not found for this analysis job. Reload the job and select a report that belongs to it.`,
  readinessNoRun:
    'No completed analysis run exists for this assessment. Run the analysis, then generate the report.',
  readinessStaleRun: (runId: string): string =>
    `Analysis run ${runId} was built from an older data version than the latest upload. ` +
    'Re-run the analysis on the latest data version before generating a report.',
  readinessNotApproved: (runId: string): string =>
    `Analysis run ${runId} is not approved. Approve the run in the assessment workflow, then generate the report.`,
  readinessGatesFailed: (runId: string): string =>
    `Analysis run ${runId} did not pass all validation gates. Resolve the failed gates and re-run the analysis.`,
  readinessSpendUnavailable: (runId: string): string =>
    `Spend coverage cannot be calculated for run ${runId} because its total or addressable spend is missing. ` +
    'Recalculate the analysis run.',
  readinessBelowThreshold: (coveragePct: number, minimumPct: number): string =>
    `Spend coverage of ${coveragePct}% is below the required ${minimumPct}%. ` +
    'Resolve the uncovered spend before generating the report.',
  readinessPcbiEvidenceUnavailable:
    'PCBI review could not find eligible transaction categories for the current data version. ' +
    'Check that the latest dataset contains active procurement transactions, then rerun the analysis.',
  readinessPcbiReviewPending: (count: number): string =>
    `${count} procurement category group(s) still need PCBI review. Map each group to an active PCBI series, ` +
    'document a valid exclusion, or request research before generating the report.',
  pcbiNeedsReview: 'No PCBI resolution is recorded for this category in the current data version.',
  pcbiMapped: (series: string): string => `Category is mapped to active PCBI series ${series}.`,
  pcbiExcluded: (reason: string): string => `Category is excluded from PCBI benchmarking: ${reason}.`,
  pcbiResearchRequested: 'PCBI research has been requested for this category.',
  reportNotReady: (reasons: readonly string[]): string =>
    `Report cannot be generated until these blocking items are resolved: ${reasons.join(' ')}`,
  reportAlreadyActive: (reportId: string, state: string): string =>
    `Report ${reportId} is already in state ${state}. Supersede it before generating a new report for this job.`,
  reportNotAwaitingReview: (reportId: string, state: string): string =>
    `Report ${reportId} is in state ${state}, so it cannot be approved. ` +
    'Only reports in ADMIN_REVIEW can be approved. Generate a new report if this one is outdated.',
  checklistMissing: (reportId: string): string =>
    `The quality gate checklist has not been confirmed for report ${reportId}. ` +
    'Complete the quality gate tab, confirm it, then approve the report again.',
  checklistIncomplete: (unconfirmedCount: number): string =>
    `${unconfirmedCount} quality gate item(s) are still unconfirmed. ` +
    'Tick every item on the quality gate tab, confirm the checklist, then approve again.',
  reportNotSubmitted: (reportId: string): string =>
    `Report ${reportId} has not been submitted to the customer, so its notification cannot be resent. ` +
    'Approve and submit the report first.',
  reportNotVisible: (reportId: string, state: string): string =>
    `Report ${reportId} is in state ${state} and is not available to the customer yet. ` +
    'Wait until the administrator submits the report.',
  reportNotViewed: (reportId: string): string =>
    `Report ${reportId} has not been opened yet. Open the report in your workspace, then acknowledge it.`,
  reportAlreadyAcknowledged: (reportId: string): string =>
    `Report ${reportId} was already acknowledged. Each report version needs only one acknowledgement.`,
  reportAlreadySuperseded: (reportId: string): string =>
    `Report ${reportId} is already superseded. Choose the current report or generate a new one.`,
  stateChanged:
    'The report changed while your request was processed, so nothing was saved. ' +
    'Reload the analysis job and try again.',
  concurrentWrite: (requestId: string): string =>
    'Another change to this analysis job was saved at the same time, so this request was not applied. ' +
    `Reload the job to see the current state and try again. Request ID: ${requestId}.`,
  unexpectedError: (requestId: string): string =>
    'The analysis service hit an unexpected error and the change was not saved. ' +
    `Quote request ID ${requestId} when contacting support, then retry the action.`,
  pcbiGapNotFound: (category: string): string =>
    `PCBI gap ${category} was not found in the latest data version. Reload the analysis and choose a current category.`,
  pcbiSeriesNotFound: (series: string): string =>
    `PCBI series ${series} is not active in the D1 benchmark catalog. Select an active series or ask an administrator to publish it.`,
  pcbiSeriesBecameUnavailable: (series: string): string =>
    `PCBI series ${series} is no longer active in D1. Select another active series before generating the report.`,
  pcbiGapResolved: 'PCBI category resolution was saved to D1 and added to the analysis audit trail.',
  correctedDatasetSaved: (versionId: string): string =>
    `Corrected dataset ${versionId} was stored in D1 and R2, then Module 1 was rerun. Review the new data version and its validation gates before continuing.`,
  correctedDatasetSavedAnalysisPending: (versionId: string, reason: string): string =>
    `Corrected dataset ${versionId} was stored in D1 and R2, but Module 1 could not finish: ${reason}. Open the assessment upload workflow, validate this data version, then rerun Module 1.`,
  correctedDatasetVersionMissing:
    'The corrected workbook upload returned without a data version ID. Check the assessment data version list before retrying to avoid a duplicate upload.',
  analysisCouldNotRun:
    'The workbook was imported, but the analysis service did not return a detailed reason. Open the assessment upload workflow, validate this data version, then rerun Module 1.',
  datasetVersionNotFound: (versionId: string): string =>
    `Data version ${versionId} was not found for this analysis job. Refresh the job and select one of its uploaded versions.`,
  datasetFileUnavailable: (versionId: string): string =>
    `The source file for data version ${versionId} is missing from the D1 file catalog or R2 storage. ` +
    'Ask an administrator to restore the stored file or upload the dataset again.',
  datasetStorageNotConfigured:
    'Dataset download cannot reach Cloudflare R2 because the Worker OBJECTS binding is not configured. ' +
    'Add the R2 binding and retry the download.',
  reportGenerated:
    'Report generated and placed in admin review. The customer cannot see it until it is approved and submitted.',
  checklistConfirmed: 'Quality gate checklist confirmed. The report under review can now be approved and submitted.',
  checklistIncompleteSaved: (unconfirmedCount: number): string =>
    `Quality gate checklist saved with ${unconfirmedCount} unconfirmed item(s). ` +
    'Approval stays blocked until every item is confirmed.',
  checklistWithoutReport:
    'Quality gate checklist saved, but no report is awaiting review. ' +
    'Generate a report, then confirm the checklist again to allow approval.',
  reportSubmitted:
    'Report approved and submitted to the customer workspace. No email was sent because no email provider ' +
    'is configured for this Worker.',
  reportSubmittedEmailSent: 'Report approved and submitted to the customer workspace. The customer email was sent.',
  reportSubmittedEmailPending: (reason: string): string =>
    `Report approved and submitted to the customer workspace, but the customer email was not sent: ${reason} ` +
    'The report remains available in the customer workspace. Correct the issue and resend the notification.',
  notificationEmailSent: 'The customer report notification email was sent.',
  notificationRecipientMissing:
    'The customer notification email was not sent because no contact email is saved for this customer. Add a valid ' +
    'contact email to the customer record, then resend the notification.',
  notificationProviderFailed: (reason: string): string =>
    `The customer notification email could not be delivered: ${reason} Check the email provider configuration and retry.`,
  reportSuperseded: (reportId: string): string =>
    `Report ${reportId} was superseded. The job is ready for generation until a new report is created.`,
  viewRecorded: 'Customer view recorded.',
  viewAlreadyRecorded: 'The customer view was already recorded for this report.',
  acknowledged: 'Report acknowledged. The acknowledgement is recorded for this report version.',
  correctionRequested: 'Correction request submitted. The Procucev operations team will review it.',
  emailNotConfigured:
    'Email delivery is not configured for this Worker, so no email was sent. ' +
    'The notification was recorded with status NOT_SENT. Configure an email provider for the Worker, for example a ' +
    'transactional email API key stored as a secret, then resend the notification. ' +
    'The report stays available in the customer workspace.',
  emailNotConfiguredLastError: 'No email provider is configured for this Worker.',
  notificationReportReadyTitle: 'Your Procurement Analysis is Ready',
  notificationReportReadyMessage: (period: string): string =>
    `Your procurement analysis for ${period} is complete and has been reviewed. ` +
    'Open your workspace to view the findings.',
  notificationCorrectionTitle: 'Customer Requested Analysis Correction',
  notificationCorrectionMessage: (customerName: string, category: string, description: string): string =>
    `Customer ${customerName} submitted a correction request for ${category}: "${description}"`
} as const;
