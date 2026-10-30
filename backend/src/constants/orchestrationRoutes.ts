/**
 * Route table for the Analysis Orchestration API. Paths are relative to ORCHESTRATION_PATH_PREFIX.
 * Access: ADMIN = administrator role, CUSTOMER = customer role, ANY = any authenticated account.
 */
import type { OrchestrationRouteSpec } from '../types/orchestrationD1';

export const ORCHESTRATION_ROUTES: readonly OrchestrationRouteSpec[] = [
  { name: 'LIST_JOBS', method: 'GET', segments: ['jobs'], access: 'ANY' },
  { name: 'GET_JOB', method: 'GET', segments: ['jobs', ':jobId'], access: 'ANY' },
  { name: 'GET_READINESS', method: 'GET', segments: ['jobs', ':jobId', 'readiness'], access: 'ANY' },
  {
    name: 'RESOLVE_PCBI_GAP',
    method: 'POST',
    segments: ['jobs', ':jobId', 'pcbi-gap', ':gapId', 'resolve'],
    access: 'ADMIN'
  },
  {
    name: 'DOWNLOAD_DATASET',
    method: 'GET',
    segments: ['jobs', ':jobId', 'download-dataset', ':versionId'],
    access: 'ADMIN'
  },
  {
    name: 'UPLOAD_CORRECTED_DATASET',
    method: 'POST',
    segments: ['jobs', ':jobId', 'upload-corrected-dataset'],
    access: 'ADMIN'
  },
  { name: 'GENERATE_REPORT', method: 'POST', segments: ['jobs', ':jobId', 'generate-report'], access: 'ADMIN' },
  { name: 'QUALITY_GATE', method: 'POST', segments: ['jobs', ':jobId', 'quality-gate'], access: 'ADMIN' },
  { name: 'APPROVE_AND_SUBMIT', method: 'POST', segments: ['jobs', ':jobId', 'approve-and-submit'], access: 'ADMIN' },
  { name: 'RESEND_NOTIFICATION', method: 'POST', segments: ['jobs', ':jobId', 'resend-notification'], access: 'ADMIN' },
  { name: 'SUPERSEDE_REPORT', method: 'POST', segments: ['jobs', ':jobId', 'supersede-report'], access: 'ADMIN' },
  { name: 'RECORD_VIEW', method: 'POST', segments: ['jobs', ':jobId', 'record-view'], access: 'CUSTOMER' },
  { name: 'ACKNOWLEDGE', method: 'POST', segments: ['jobs', ':jobId', 'acknowledge'], access: 'CUSTOMER' },
  {
    name: 'REQUEST_CORRECTION',
    method: 'POST',
    segments: ['jobs', ':jobId', 'request-correction'],
    access: 'CUSTOMER'
  },
  { name: 'ADMIN_KPIS', method: 'GET', segments: ['admin', 'kpis'], access: 'ADMIN' },
  { name: 'NOTIFICATIONS', method: 'GET', segments: ['notifications'], access: 'ADMIN' },
  { name: 'AUDIT_TRAIL', method: 'GET', segments: ['audit-trail'], access: 'ADMIN' }
];
