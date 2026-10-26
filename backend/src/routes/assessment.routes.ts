import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';

const router = Router();

// Operating Mode (Authoritative central configuration)
router.get('/mode', AssessmentController.getOperatingMode);
router.get('/system-info', AssessmentController.getSystemInfo);
router.get('/update-status', AssessmentController.getUpdateStatus);
router.post('/install-update', AssessmentController.installUpdate);

// Customer Profiles (Internal Command Centre)
router.get('/customers', AssessmentController.getCustomers);
router.post('/customers', AssessmentController.createCustomer);
router.get('/customers/website-profile', AssessmentController.previewWebsiteProfile);
router.get('/customers/:id', AssessmentController.getCustomerById);
router.patch('/customers/:id', AssessmentController.updateCustomer);

// Assessments Collection
router.get('/', AssessmentController.getAssessments);
router.post('/', AssessmentController.createAssessment);

// Assessment Item Details & Actions
router.get('/:id', AssessmentController.getAssessmentById);
router.patch('/:id/nda', AssessmentController.updateNdaStatus);
router.patch('/:id/data-status', AssessmentController.updateDataStatus);
router.post('/:id/upload', AssessmentController.uploadDataVersion);
router.post('/:id/validate', AssessmentController.validateDataVersion);
router.post('/:id/run-module1', AssessmentController.runModule1);
router.post('/:id/run-analysis', AssessmentController.runAnalysis);
router.post('/:id/approve', AssessmentController.approveAssessment);
router.get('/:id/delivery-package', AssessmentController.generateDeliveryPackage);
router.post('/:id/delivery-package', AssessmentController.generateDeliveryPackage);
router.post('/:id/deliver', AssessmentController.deliverAssessment);
router.post('/:id/accept', AssessmentController.acceptAssessment);
router.post('/:id/close', AssessmentController.closeAssessment);
router.get('/:id/audit', AssessmentController.getAuditLogs);

export default router;
