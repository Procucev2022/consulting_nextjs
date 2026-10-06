/**
 * Analysis Orchestration & Quality Gate Controller (Prompt 302)
 */

import type { Request, Response } from 'express';
import { analysisOrchestrationService } from '../services/analysisOrchestrationService';
import {
  pcbiGapResolutionSchema,
  reanalysisUploadSchema,
  qualityGateChecklistSchema,
  customerAcknowledgementSchema,
  customerCorrectionRequestSchema,
  supersedeReportSchema
} from '../constants/orchestrationValidation';
import logger from '../utils/logger';

const extractAuthContext = (req: Request): { role: 'ADMIN' | 'USER'; tenantId: string; userId: string; userName: string } => {
  const roleHeader = (req.headers['x-user-role'] as string) || (req.headers['x-role'] as string);
  const role: 'ADMIN' | 'USER' = roleHeader?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
  const tenantId =
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-buyer-id'] as string) ||
    (req.query.tenantId as string) ||
    (role === 'ADMIN' ? 'DEFAULT_TENANT' : '');
  const userId = (req.headers['x-user-id'] as string) || 'usr-anonymous';
  const userName = (req.headers['x-user-name'] as string) || 'Customer Representative';

  return { role, tenantId, userId, userName };
};

export const getJobs = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, tenantId } = extractAuthContext(req);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const jobs = analysisOrchestrationService.getJobs({
      role,
      tenantId: role === 'ADMIN' ? undefined : tenantId,
      status,
      search
    });

    return res.json({ success: true, data: jobs, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve analysis jobs';
    logger.error('Failed to retrieve analysis jobs', {}, err);
    return res.status(500).json({ success: false, message });
  }
};

export const getJobDetails = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { jobId } = req.params;
    const { role, tenantId } = extractAuthContext(req);

    const details = analysisOrchestrationService.getJobById(jobId, tenantId, role);
    if (!details) {
      return res.status(404).json({ success: false, message: 'Analysis Job not found or access denied' });
    }

    return res.json({ success: true, data: details, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve job details';
    logger.error('Failed to retrieve job details', { jobId: req.params.jobId }, err);
    return res.status(500).json({ success: false, message });
  }
};

export const getReadiness = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { jobId } = req.params;
    const readiness = analysisOrchestrationService.calculateReadiness(jobId);
    return res.json({ success: true, data: readiness, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to calculate readiness';
    return res.status(500).json({ success: false, message });
  }
};

export const resolvePCBIGap = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required to resolve PCBI gaps' });
    }

    const { jobId, gapId } = req.params;
    const validation = pcbiGapResolutionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.format()
      });
    }

    const result = analysisOrchestrationService.resolvePCBIGap(jobId, gapId, validation.data.action, {
      targetPcbiSeries: validation.data.targetPcbiSeries,
      exclusionReason: validation.data.exclusionReason,
      exclusionNotes: validation.data.exclusionNotes,
      researchNotes: validation.data.researchNotes,
      adminId: userId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve PCBI gap';
    logger.error('Failed to resolve PCBI gap', { body: req.body }, err);
    return res.status(500).json({ success: false, message });
  }
};

export const downloadWorkingDataset = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required to download datasets' });
    }

    const { jobId, versionId } = req.params;
    const file = analysisOrchestrationService.downloadWorkingDataset(jobId, versionId, userId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Dataset version not found' });
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    return res.send(file.contentBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to download dataset';
    return res.status(500).json({ success: false, message });
  }
};

export const uploadCorrectedDataset = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required for data reanalysis' });
    }

    const { jobId } = req.params;
    const validation = reanalysisUploadSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.format()
      });
    }

    const result = analysisOrchestrationService.uploadCorrectedDataset(jobId, {
      fileName: validation.data.fileName,
      fileBase64: validation.data.fileBase64,
      fileSizeMb: validation.data.fileSizeMb,
      reason: validation.data.reason,
      notes: validation.data.notes,
      adminId: userId
    });

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to upload corrected dataset';
    logger.error('Failed to upload corrected dataset', {}, err);
    return res.status(500).json({ success: false, message });
  }
};

export const generateReport = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required to generate reports' });
    }

    const { jobId } = req.params;
    const result = analysisOrchestrationService.generateReport(jobId, userId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate report';
    return res.status(500).json({ success: false, message });
  }
};

export const confirmQualityGate = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required for quality gate' });
    }

    const { jobId } = req.params;
    const validation = qualityGateChecklistSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Checklist incomplete',
        errors: validation.error.format()
      });
    }

    const result = analysisOrchestrationService.confirmQualityGate(jobId, validation.data, userId);
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to confirm quality gate';
    return res.status(500).json({ success: false, message });
  }
};

export const approveAndSubmitReport = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required to approve reports' });
    }

    const { jobId } = req.params;
    const { reportVersionId } = req.body;
    if (!reportVersionId) {
      return res.status(400).json({ success: false, message: 'Missing reportVersionId' });
    }

    const result = await analysisOrchestrationService.approveAndSubmitReport(jobId, reportVersionId, userId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to approve report';
    return res.status(500).json({ success: false, message });
  }
};

export const resendNotification = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { jobId } = req.params;
    const { reportVersionId } = req.body;
    const result = await analysisOrchestrationService.resendReportNotification(jobId, reportVersionId, userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resend notification';
    return res.status(500).json({ success: false, message });
  }
};

export const supersedeReport = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, userId } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { jobId } = req.params;
    const validation = supersedeReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.error.format() });
    }

    const result = analysisOrchestrationService.supersedeReport(
      jobId,
      validation.data.reportVersionId,
      validation.data.reason,
      userId
    );
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to supersede report';
    return res.status(500).json({ success: false, message });
  }
};

export const recordCustomerView = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { jobId } = req.params;
    const { reportVersionId } = req.body;
    const { userId, tenantId } = extractAuthContext(req);

    analysisOrchestrationService.recordCustomerView(jobId, reportVersionId, userId, tenantId);
    return res.json({ success: true, message: 'Customer view recorded' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record customer view';
    return res.status(500).json({ success: false, message });
  }
};

export const acknowledgeReport = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { jobId } = req.params;
    const { userId, userName, tenantId } = extractAuthContext(req);
    const validation = customerAcknowledgementSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.error.format() });
    }

    const result = analysisOrchestrationService.acknowledgeReport(jobId, {
      reportVersionId: validation.data.reportVersionId,
      userId,
      userName,
      tenantId,
      notes: validation.data.notes
    });

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to acknowledge report';
    return res.status(500).json({ success: false, message });
  }
};

export const requestCorrection = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { jobId } = req.params;
    const { userId, tenantId } = extractAuthContext(req);
    const validation = customerCorrectionRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.error.format() });
    }

    const result = analysisOrchestrationService.requestCorrection(jobId, {
      userId,
      tenantId,
      category: validation.data.category,
      description: validation.data.description,
      supportingFileName: validation.data.supportingFileName
    });

    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to request correction';
    return res.status(500).json({ success: false, message });
  }
};

export const getAdminKPIs = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role } = extractAuthContext(req);
    if (role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }
    const kpis = analysisOrchestrationService.getAdminKPIs();
    return res.json({ success: true, data: kpis, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get KPIs';
    return res.status(500).json({ success: false, message });
  }
};

export const getNotifications = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, tenantId } = extractAuthContext(req);
    const recipientType = role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    const notifications = analysisOrchestrationService.getNotifications(recipientType, tenantId);
    return res.json({ success: true, data: notifications, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get notifications';
    return res.status(500).json({ success: false, message });
  }
};

export const getAuditTrail = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { role, tenantId } = extractAuthContext(req);
    const trail = analysisOrchestrationService.getAuditTrail(role === 'ADMIN' ? undefined : tenantId);
    return res.json({ success: true, data: trail, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get audit trail';
    return res.status(500).json({ success: false, message });
  }
};
