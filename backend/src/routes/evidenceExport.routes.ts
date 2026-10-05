/**
 * Evidence Export Routes (Prompt 305)
 * Express route definitions for downloading evidence workbooks, zip packages, and parity reports.
 */

import { Router } from 'express';
import { EvidenceExportController } from '../controllers/evidenceExport.controller';

const router = Router();

// Inventory
router.get('/jobs/:jobId/inventory', EvidenceExportController.getInventory);
router.get('/:jobId/inventory', EvidenceExportController.getInventory);

// Individual Workbook Download
router.get('/jobs/:jobId/workbooks/:workbookType/download', EvidenceExportController.downloadWorkbook);
router.get('/:jobId/workbooks/:workbookType/download', EvidenceExportController.downloadWorkbook);

// Complete Package ZIP Download
router.get('/jobs/:jobId/package/download', EvidenceExportController.downloadCompletePackage);
router.get('/:jobId/package/download', EvidenceExportController.downloadCompletePackage);

// Parity Validation Summary
router.get('/jobs/:jobId/parity', EvidenceExportController.getParityValidation);
router.get('/:jobId/parity', EvidenceExportController.getParityValidation);

// Savings Type Inventory and Download (Prompt 306)
router.get('/jobs/:jobId/savings/inventory', EvidenceExportController.getSavingsInventory);
router.get('/:jobId/savings/inventory', EvidenceExportController.getSavingsInventory);
router.get('/jobs/:jobId/savings/:savingsType/inventory', EvidenceExportController.getSavingsInventory);
router.get('/:jobId/savings/:savingsType/inventory', EvidenceExportController.getSavingsInventory);
router.get('/jobs/:jobId/savings/:savingsType/download', EvidenceExportController.downloadSavingsTypeWorkbook);
router.get('/:jobId/savings/:savingsType/download', EvidenceExportController.downloadSavingsTypeWorkbook);

export default router;
