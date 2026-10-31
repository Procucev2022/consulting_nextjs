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

export const DEFAULT_SPEND_BASELINE_INR_CR = 732.41;
export const DEFAULT_SAVINGS_TARGET_INR_CR = 119.67;
export const DEFAULT_SAVINGS_TARGET_PCT = 16.4;
export const DEFAULT_SAAS_FEE_RATE = 0.85;
export const DEFAULT_TENANT_ENTERPRISE_NAME = 'Enterprise Client';
export const AICEV_LOGO_SRC = '/images/aicev-logo.png';
export const AICEV_LOGO_WHITE_SRC = '/images/aicev-logo-white.png';
export const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
export const EXECUTIVE_OPPORTUNITY_BRIEF_REPORT_ENDPOINT = '/api/reports/executive-brief/opportunity-brief/report';
export const EXECUTIVE_OPPORTUNITY_BRIEF_REQUEST_ID_HEADER = 'x-request-id';
export const EXECUTIVE_BRIEF_ATTACHMENT_FILENAME_PATTERN = /filename="([^"]+)"/u;

