/**
 * Executive Brief Export Routes (Prompt 258 & Prompt 259)
 */

import { Router } from 'express';
import {
  getExportStatus,
  downloadPdf,
  downloadPptx,
  getExportAudit,
  getExportHistory,
  getExecutiveReportData,
  regenerateExecutiveBrief
} from '../controllers/executiveBriefExport.controller';

const router = Router();

router.get('/status', getExportStatus);
router.get('/report', getExecutiveReportData);
router.post('/regenerate', regenerateExecutiveBrief);
router.get('/download/pdf', downloadPdf);
router.get('/download/pptx', downloadPptx);
router.get('/audit', getExportAudit);
router.get('/history', getExportHistory);

export default router;
