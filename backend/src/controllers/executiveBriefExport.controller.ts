/**
 * Executive Brief Export Controller (Prompt 258 & Prompt 259)
 */

import type { Request, Response } from 'express';
import { executiveBriefExportService } from '../services/executiveBriefExportService';
import { executiveBriefService } from '../services/executiveBriefService';
import { executiveBriefReportService } from '../services/executiveBriefReportService';
import { getOfficialPdfFilename, getOfficialPptxFilename } from '../utils/filenameSanitizer';
import { DEFAULT_CLIENT_PROFILE } from '../constants/executiveBriefConstants';
import { REPORT_EXPORT_VERSION } from '../constants/executiveBriefExportConstants';
import { ExecutiveOpportunityBriefExportService } from '../services/executiveOpportunityBriefExportService';
import { logger } from '../utils/logger';

export const getExportStatus = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName = (req.query.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    const consistency = executiveBriefExportService.verifyFinancialConsistency(clientName);
    const history = executiveBriefExportService.getHistory();

    return res.json({
      success: true,
      data: {
        reportId: history[0]?.reportId || 'RPT-EXEC-20261001-001',
        reportVersion: REPORT_EXPORT_VERSION,
        clientName,
        analysisPeriod: DEFAULT_CLIENT_PROFILE.analysisPeriod,
        financialConsistency: consistency,
        pdfFilename: getOfficialPdfFilename(clientName),
        pptxFilename: getOfficialPptxFilename(clientName),
        status: consistency.isConsistent ? 'EXECUTIVE_BRIEF_EXPORT_READY' : 'EXECUTIVE_BRIEF_EXPORT_BLOCKED'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve export status';
    logger.error('Failed to retrieve executive brief export status', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const downloadPdf = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName = (req.query.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    const { audit, pdfBuffer } = await executiveBriefExportService.generateDualFormatExport(clientName);

    if (audit.exportStatus === 'EXECUTIVE_BRIEF_EXPORT_BLOCKED') {
      return res.status(400).json({
        success: false,
        message: audit.blockedReason || 'Export blocked due to financial variance'
      });
    }

    const filename = getOfficialPdfFilename(clientName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download PDF';
    logger.error('Failed to download executive brief PDF', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const downloadPptx = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName = (req.query.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    const { audit, pptxBuffer } = await executiveBriefExportService.generateDualFormatExport(clientName);

    if (audit.exportStatus === 'EXECUTIVE_BRIEF_EXPORT_BLOCKED') {
      return res.status(400).json({
        success: false,
        message: audit.blockedReason || 'Export blocked due to financial variance'
      });
    }

    const filename = getOfficialPptxFilename(clientName);
    const contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pptxBuffer.length);
    return res.send(pptxBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download PPTX';
    logger.error('Failed to download executive brief PPTX', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const getExportAudit = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName = (req.query?.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    const { audit } = await executiveBriefExportService.generateDualFormatExport(clientName);
    return res.json({ success: true, data: audit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve export audit';
    logger.error('Failed to retrieve export audit', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const getExportHistory = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const history = executiveBriefExportService.getHistory();
    return res.json({ success: true, data: history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve export history';
    logger.error('Failed to retrieve export history', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const getExecutiveReportData = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName = (req.query?.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    const reportData = executiveBriefReportService.assembleFullReport(clientName);
    return res.json({ success: true, data: reportData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve executive report data';
    logger.error('Failed to retrieve executive brief report data', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const regenerateExecutiveBrief = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName =
      (req.body?.client as string) || (req.query?.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    logger.info('Regenerating Executive Procurement Value & Savings Brief', { clientName });

    executiveBriefService.generateAllArtifacts(clientName);
    const { audit } = await executiveBriefExportService.generateDualFormatExport(clientName);
    const reportData = executiveBriefReportService.assembleFullReport(clientName);

    return res.json({
      success: true,
      message: 'Executive Brief regenerated successfully from certified Module 1-4 outputs',
      data: { audit, reportData }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate executive brief';
    logger.error('Failed to regenerate executive brief', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const downloadOpportunityBriefPdf = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName = (req.query.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    const { pdfBuffer } = await ExecutiveOpportunityBriefExportService.generateOpportunityBrief(clientName);
    const filename = ExecutiveOpportunityBriefExportService.PDF_FILENAME;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download Opportunity Brief PDF';
    logger.error('Failed to download Opportunity Brief PDF', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

export const downloadOpportunityBriefPptx = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const clientName = (req.query.client as string) || DEFAULT_CLIENT_PROFILE.clientName;
    const { pptxBuffer } = await ExecutiveOpportunityBriefExportService.generateOpportunityBrief(clientName);
    const filename = ExecutiveOpportunityBriefExportService.PPTX_FILENAME;
    const contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pptxBuffer.length);
    return res.send(pptxBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download Opportunity Brief PPTX';
    logger.error('Failed to download Opportunity Brief PPTX', { error: message });
    return res.status(500).json({ success: false, message });
  }
};

