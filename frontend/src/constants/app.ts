/**
 * Application Constants Module (Frontend)
 */

import type { TenantMaster } from '../types/models';
import { UI_STRINGS } from './uiStrings';

export const EMPTY_TENANT: TenantMaster = {
  tenant_id: '',
  enterprise_name: UI_STRINGS.header.noActiveCustomer,
  region: 'GLOBAL',
  base_currency: 'INR',
  status: 'ONBOARDING',
  total_spend_evaluated: 0,
  total_spend_evaluated_inr: 0
};

export const DEFAULT_TENANT_ENTERPRISE_NAME = 'Enterprise Client';
export const AICEV_LOGO_SRC = '/images/aicev-logo.png';
export const AICEV_LOGO_WHITE_SRC = '/images/aicev-logo-white.png';
export const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
export const EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT = '/api/reports/executive-brief/opportunity-brief/report';
export const EXECUTIVE_OPPORTUNITY_BRIEF_PAGE_PATH = '/executive-brief';
export const EXECUTIVE_OPPORTUNITY_BRIEF_DOWNLOAD_ENDPOINT = (format: 'pdf' | 'pptx'): string =>
  `/api/reports/executive-brief/download/opportunity-brief/${format}`;
export const EXECUTIVE_OPPORTUNITY_BRIEF_EMAIL_ENDPOINT = '/api/reports/executive-brief/email';
export const API_REQUEST_ID_HEADER = 'x-request-id';
export const EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER = API_REQUEST_ID_HEADER;
export const EXECUTIVE_OPPORTUNITY_BRIEF_ASSESSMENT_HEADER = 'x-assessment-id';
export const EXECUTIVE_OPPORTUNITY_BRIEF_DOCUMENT_HEADER = 'x-document-id';
export const EXECUTIVE_BRIEF_ATTACHMENT_FILENAME_PATTERN = /filename="([^"]+)"/u;
export const EXECUTIVE_BRIEF_HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR_MIN: 500
} as const;

