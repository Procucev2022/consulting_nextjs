/**
 * Executive Brief Export Routes (Prompt 258 & Prompt 259)
 */

import { Router } from 'express';
import {
  getExportStatus,
  downloadPdf,
  downloadPptx,
  downloadOpportunityBriefPdf,
  downloadOpportunityBriefPptx,
  getExportAudit,
  getExportHistory,
  getExecutiveReportData,
  regenerateExecutiveBrief
} from '../controllers/executiveBriefExport.controller';
import { requireFeature } from '../utils/entitlementMiddleware';
import { FEATURE_PERMISSIONS } from '../constants/subscription';

const router = Router();

router.get('/status', getExportStatus);
router.get('/report', getExecutiveReportData);
router.post('/regenerate', regenerateExecutiveBrief);
router.get('/download/pdf', requireFeature(FEATURE_PERMISSIONS.BOARDROOM_EVIDENCE_FULL), downloadPdf);
router.get('/download/pptx', requireFeature(FEATURE_PERMISSIONS.PPTX_EXPORT_FULL), downloadPptx);
router.get('/download/opportunity-brief/pdf', requireFeature(FEATURE_PERMISSIONS.MANAGEMENT_QUICK_SUMMARY), downloadOpportunityBriefPdf);
router.get('/download/opportunity-brief/pptx', requireFeature(FEATURE_PERMISSIONS.PPTX_EXPORT_SUMMARY), downloadOpportunityBriefPptx);
router.get('/audit', getExportAudit);
router.get('/history', getExportHistory);

export default router;
