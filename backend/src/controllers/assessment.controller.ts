import type { Request, Response } from 'express';
import { operatingModeService } from '../services/operatingModeService';
import { assessmentStore } from '../services/assessmentStore';
import { assessmentWorkflowService } from '../services/assessmentWorkflowService';
import {
  createAssessmentSchema,
  updateNdaStatusSchema,
  updateDataStatusSchema,
  uploadDataVersionSchema,
  analystApprovalSchema,
  deliverPackageSchema
} from '../constants/assessmentValidation';
import { ASSESSMENT_ROLES } from '../constants/assessment';
import { CustomerController } from './customer.controller';
import { DesktopController } from './desktop.controller';
import { sanitizeAssessmentForFinancialDisplay } from '../utils/assessmentFinancialDisplayGate';
import logger from '../utils/logger';

function handleActionError(res: Response, err: unknown, fallback: string, logMsg: string, id: string): void {
  const msg = err instanceof Error ? err.message : fallback;
  logger.error(logMsg, { error: msg, id });
  res.status(400).json({ success: false, message: msg });
}

export class AssessmentController {
  public static getOperatingMode(_req: Request, res: Response): void {
    const config = operatingModeService.getConfig();
    res.json({ success: true, data: config });
  }

  public static getCustomers = CustomerController.getCustomers;
  public static getCustomerById = CustomerController.getCustomerById;
  public static createCustomer = CustomerController.createCustomer;
  public static updateCustomer = CustomerController.updateCustomer;
  public static previewWebsiteProfile = CustomerController.previewWebsiteProfile;

  public static getAssessments(req: Request, res: Response): void {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
    const assessments = assessmentStore.getAssessments(statusFilter);
    const sanitized = assessments.map((a) => {
      const runs = assessmentStore.getAnalysisRuns(a.assessmentId);
      return sanitizeAssessmentForFinancialDisplay(a, runs);
    });
    res.json({ success: true, data: sanitized, count: sanitized.length });
  }

  public static getAssessmentById(req: Request, res: Response): void {
    const { id } = req.params;
    const assessment = assessmentStore.getAssessmentById(id);
    if (!assessment) {
      res.status(404).json({ success: false, message: `Assessment ${id} not found` });
      return;
    }

    const versions = assessmentStore.getDataVersions(id);
    const runs = assessmentStore.getAnalysisRuns(id);
    const auditLogs = assessmentStore.getAuditLogs(id);

    res.json({
      success: true,
      data: {
        assessment,
        versions,
        runs,
        auditLogs
      }
    });
  }

  public static createAssessment(req: Request, res: Response): void {
    const parsed = createAssessmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'admin@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.INTERNAL_ADMIN;

    const record = assessmentStore.createAssessment(parsed.data, actorEmail, actorRole);
    res.status(201).json({ success: true, data: record });
  }

  public static updateNdaStatus(req: Request, res: Response): void {
    const { id } = req.params;
    const parsed = updateNdaStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'admin@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.INTERNAL_ADMIN;

    const record = assessmentStore.updateNdaStatus(id, parsed.data, actorEmail, actorRole);
    if (!record) {
      res.status(404).json({ success: false, message: `Assessment ${id} not found` });
      return;
    }
    res.json({ success: true, data: record });
  }

  public static updateDataStatus(req: Request, res: Response): void {
    const { id } = req.params;
    const parsed = updateDataStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'admin@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.INTERNAL_ADMIN;

    const record = assessmentStore.updateDataStatus(id, parsed.data, actorEmail, actorRole);
    if (!record) {
      res.status(404).json({ success: false, message: `Assessment ${id} not found` });
      return;
    }
    res.json({ success: true, data: record });
  }

  public static uploadDataVersion(req: Request, res: Response): void {
    const { id } = req.params;
    const parsed = uploadDataVersionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'analyst@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.ANALYST;

    try {
      const result = assessmentWorkflowService.uploadDataVersion(id, parsed.data, actorEmail, actorRole);
      res.status(201).json({ success: true, data: result });
    } catch (err: unknown) {
      handleActionError(res, err, 'Upload failed', 'Assessment data version upload error', id);
    }
  }

  public static validateDataVersion(req: Request, res: Response): void {
    const { id } = req.params;
    const dataVersionId = req.body?.dataVersionId as string | undefined;
    const actorEmail = (req.headers['x-user-email'] as string) || 'analyst@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.ANALYST;

    try {
      const result = assessmentWorkflowService.validateDataset(id, dataVersionId, actorEmail, actorRole);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      handleActionError(res, err, 'Validation failed', 'Assessment dataset validation error', id);
    }
  }

  public static runModule1(req: Request, res: Response): void {
    const { id } = req.params;
    const dataVersionId = req.body?.dataVersionId as string | undefined;
    const actorEmail = (req.headers['x-user-email'] as string) || 'analyst@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.ANALYST;

    try {
      const result = assessmentWorkflowService.runModule1(id, dataVersionId, actorEmail, actorRole);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      handleActionError(res, err, 'Module 1 execution failed', 'Assessment Module 1 run error', id);
    }
  }

  public static runAnalysis(req: Request, res: Response): void {
    const { id } = req.params;
    const assessment = assessmentStore.getAssessmentById(id);
    if (!assessment) {
      res.status(404).json({ success: false, message: `Assessment ${id} not found` });
      return;
    }

    const dataVersionId = req.body?.dataVersionId || assessment.activeDataVersionId;
    if (!dataVersionId || typeof dataVersionId !== 'string') {
      res.status(400).json({ success: false, message: 'dataVersionId is required or assessment must have an active data version' });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'analyst@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.ANALYST;

    try {
      const result = assessmentWorkflowService.runAnalysis(id, dataVersionId, actorEmail, actorRole);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      handleActionError(res, err, 'Analysis execution failed', 'Assessment analysis run error', id);
    }
  }

  public static approveAssessment(req: Request, res: Response): void {
    const { id } = req.params;
    const parsed = analystApprovalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'analyst@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.ANALYST;

    try {
      const assessment = assessmentWorkflowService.approveAssessment(id, parsed.data, actorEmail, actorRole);
      res.json({ success: true, data: assessment });
    } catch (err: unknown) {
      handleActionError(res, err, 'Approval failed', 'Assessment approval error', id);
    }
  }

  public static generateDeliveryPackage(req: Request, res: Response): void {
    const { id } = req.params;
    const actorEmail = (req.headers['x-user-email'] as string) || 'admin@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.INTERNAL_ADMIN;

    try {
      const pkg = assessmentWorkflowService.generateDeliveryPackage(id, actorEmail, actorRole);
      res.json({ success: true, data: pkg });
    } catch (err: unknown) {
      handleActionError(res, err, 'Package generation failed', 'Assessment delivery package generation error', id);
    }
  }

  public static deliverAssessment(req: Request, res: Response): void {
    const { id } = req.params;
    const parsed = deliverPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.format() });
      return;
    }

    const actorEmail = (req.headers['x-user-email'] as string) || 'admin@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.INTERNAL_ADMIN;

    try {
      const assessment = assessmentWorkflowService.deliverAssessment(id, parsed.data, actorEmail, actorRole);
      res.json({ success: true, data: assessment });
    } catch (err: unknown) {
      handleActionError(res, err, 'Delivery failed', 'Assessment delivery error', id);
    }
  }

  public static acceptAssessment(req: Request, res: Response): void {
    const { id } = req.params;
    const actorEmail = (req.headers['x-user-email'] as string) || 'customer@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.CUSTOMER;

    try {
      const assessment = assessmentWorkflowService.acceptAssessment(
        id,
        {
          acceptanceComment: req.body?.acceptanceComment,
          acceptedBy: req.body?.acceptedBy || actorEmail
        },
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: assessment });
    } catch (err: unknown) {
      handleActionError(res, err, 'Acceptance failed', 'Assessment acceptance error', id);
    }
  }

  public static closeAssessment(req: Request, res: Response): void {
    const { id } = req.params;
    const actorEmail = (req.headers['x-user-email'] as string) || 'admin@procucev.com';
    const actorRole = (req.headers['x-user-role'] as string) || ASSESSMENT_ROLES.INTERNAL_ADMIN;

    try {
      const assessment = assessmentWorkflowService.closeAssessment(id, actorEmail, actorRole);
      res.json({ success: true, data: assessment });
    } catch (err: unknown) {
      handleActionError(res, err, 'Closure failed', 'Assessment closure error', id);
    }
  }

  public static getAuditLogs(req: Request, res: Response): void {
    const { id } = req.params;
    const logs = assessmentStore.getAuditLogs(id);
    res.json({ success: true, data: logs, count: logs.length });
  }

  public static getSystemInfo = DesktopController.getSystemInfo;
  public static getUpdateStatus = DesktopController.getUpdateStatus;
  public static installUpdate = DesktopController.installUpdate;
}

