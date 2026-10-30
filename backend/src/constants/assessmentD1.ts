import { z } from 'zod';
import { MANDATORY_MODULE_GATES } from './assessment';

export const ASSESSMENT_D1_BOOLEAN_COLUMNS: ReadonlySet<string> = new Set([
  'is_test_data', 'is_superseded', 'is_approved', 'all_gates_passed',
  'is_report_accepted', 'all_modules_completed'
]);

export const ASSESSMENT_D1_JSON_COLUMNS: Readonly<Record<string, string>> = {
  website_profile_json: 'websiteProfile', details_json: 'details'
};

export const assessmentD1ObjectSchema = z.record(z.string(), z.unknown());

export const ASSESSMENT_D1_COLLECTION_ID_COLUMNS = ['data_version_id', 'analysis_run_id', 'id'] as const;
export const ASSESSMENT_D1_ANALYSIS_GATES = Object.values(MANDATORY_MODULE_GATES);
export const ASSESSMENT_D1_RUN_SNAPSHOT_TYPE = 'run';

export const ASSESSMENT_D1_ACTION_METHODS: Readonly<Record<string, readonly string[]>> = {
  '': ['GET'], nda: ['PATCH', 'POST'], 'data-status': ['PATCH', 'POST'], audit: ['GET'],
  'run-module1': ['POST'], 'run-analysis': ['POST'],
  upload: ['POST'], validate: ['POST'], approve: ['POST'], 'delivery-package': ['GET', 'POST'],
  deliver: ['POST'], accept: ['POST'], close: ['POST']
};

export const ASSESSMENT_D1_LIFECYCLE_ACTIONS: ReadonlySet<string> = new Set([
  'approve', 'delivery-package', 'deliver', 'accept', 'close'
]);

export const ASSESSMENT_D1_DEFAULT_ACTORS = {
  internalAdminEmail: 'admin@procucev.com',
  analystEmail: 'analyst@procucev.com',
  customerEmail: 'customer@procucev.com',
  internalAdminRole: 'INTERNAL_ADMIN',
  analystRole: 'ANALYST',
  customerRole: 'CUSTOMER'
} as const;

export const ASSESSMENT_D1_MESSAGES = {
  actionValidation: 'Assessment action request is invalid. Correct the highlighted fields and retry.',
  permissionDenied: 'This assessment action requires an internal analyst or administrator role.',
  missingRecord: (assessmentId: string): string => `Assessment ${assessmentId} not found`,
  missingRun: 'No analysis run specified or active on assessment',
  dataVersionMissingForAnalysis: (assessmentId: string): string =>
    `No active uploaded data version was found for assessment ${assessmentId}. Upload a workbook and retry.`,
  dataVersionSuperseded: 'The selected data version was superseded. Choose the current uploaded version and retry.',
  analysisDataMissing: 'The selected data version has no imported D1 transaction and validation rows. Re-upload the workbook and retry.',
  module1AnalysisStarted: 'Module 1 analysis was computed from the selected data version in D1.',
  fullAnalysisStarted: 'Analysis metrics were refreshed from the selected data version in D1; remaining module gates still require their persisted results.',
  module1GatePassed: 'The data version passed this Module 1 review gate.',
  module1GateFailed: 'The data version did not pass this Module 1 review gate. Correct the source data and rerun the analysis.',
  moduleNotComputed: 'This module has no persisted result for the selected data version.',
  runNotFound: (runId: string): string => `Analysis run ${runId} not found`,
  runSuperseded: 'Cannot approve a superseded analysis run',
  gatesNotPassed: 'Cannot approve assessment: mandatory review gates have not passed',
  runVersionMismatch: 'Analysis run does not belong to specified data version',
  deliveryStatus: (status: string): string => `Assessment must be APPROVED to generate delivery package (current: ${status})`,
  activeRunMissing: 'No active analysis run found for assessment',
  dataVersionMissing: (dataVersionId: string): string => `Data version ${dataVersionId} not found for delivery package`,
  unapprovedRun: 'Unapproved delivery packaging denial: assessment run must be approved before packaging',
  supersededRun: 'Superseded report generation denial: cannot generate report or package from superseded analysis run',
  testDeliveryRequired: 'Ordinary customer delivery blocked for TEST DATA assessments. Use explicit test delivery flag or real customer dossier.',
  deliveryApprovalRequired: (status: string): string => `Assessment must be APPROVED before delivery (current: ${status})`,
  acceptanceStatus: (status: string): string => `Assessment must be APPROVED or DELIVERED before formal customer acceptance (current: ${status})`,
  completedRunRequired: 'Assessment must have completed analysis run to be accepted',
  unknownAction: 'The assessment action does not exist. Refresh the assessment and select a supported action.',
  unsupportedMethod: 'This HTTP method is not supported for the assessment action. No assessment state was changed.'
} as const;

export const ASSESSMENT_SNAPSHOT_SQL = {
  byType: 'SELECT entry_id, payload_json FROM AssessmentStoreEntry WHERE entry_type = ?',
  byAssessment: 'SELECT entry_id, payload_json FROM AssessmentStoreEntry WHERE entry_type = ? AND assessment_id = ?'
} as const;
