/**
 * Analysis Orchestration Routes (Prompt 302)
 */

import { Router } from 'express';
import {
  getJobs,
  getJobDetails,
  getReadiness,
  resolvePCBIGap,
  downloadWorkingDataset,
  uploadCorrectedDataset,
  generateReport,
  confirmQualityGate,
  approveAndSubmitReport,
  resendNotification,
  supersedeReport,
  recordCustomerView,
  acknowledgeReport,
  requestCorrection,
  getAdminKPIs,
  getNotifications,
  getAuditTrail
} from '../controllers/analysisOrchestration.controller';

const router = Router();

// Jobs
router.get('/jobs', getJobs);
router.get('/jobs/:jobId', getJobDetails);
router.get('/jobs/:jobId/readiness', getReadiness);

// Admin PCBI Gap Resolution & Datasets
router.post('/jobs/:jobId/pcbi-gap/:gapId/resolve', resolvePCBIGap);
router.get('/jobs/:jobId/download-dataset/:versionId', downloadWorkingDataset);
router.post('/jobs/:jobId/upload-corrected-dataset', uploadCorrectedDataset);

// Admin Quality Gate & Approval
router.post('/jobs/:jobId/generate-report', generateReport);
router.post('/jobs/:jobId/quality-gate', confirmQualityGate);
router.post('/jobs/:jobId/approve-and-submit', approveAndSubmitReport);
router.post('/jobs/:jobId/resend-notification', resendNotification);
router.post('/jobs/:jobId/supersede-report', supersedeReport);

// Customer Actions
router.post('/jobs/:jobId/record-view', recordCustomerView);
router.post('/jobs/:jobId/acknowledge', acknowledgeReport);
router.post('/jobs/:jobId/request-correction', requestCorrection);

// Telemetry & Notifications
router.get('/admin/kpis', getAdminKPIs);
router.get('/notifications', getNotifications);
router.get('/audit-trail', getAuditTrail);

export default router;
