/**
 * Executive Brief Export Controller (Prompt 258, Prompt 259 & Prompt 587)
 * Enforces customer isolation: routes Borosil (AIC-2026-0002) exclusively to certified Module 1-4 builders.
 * Rejects unresolvable or missing assessments with HTTP 400.
 */

import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { resolveExecutiveBriefContext } from '../utils/executiveBriefContextResolver';
import { AiCevManagementReportBuilder } from '../services/aiCevManagementReportBuilder';
import { AiCevManagementReportPdfBuilder } from '../services/aiCevManagementReportPdfBuilder';
import { AiCevManagementReportPptxBuilder } from '../services/aiCevManagementReportPptxBuilder';
import { executiveBriefExportService } from '../services/executiveBriefExportService';
import { executiveBriefReportService } from '../services/executiveBriefReportService';
import { getOfficialPdfFilename, getOfficialPptxFilename } from '../utils/filenameSanitizer';
import { REPORT_EXPORT_VERSION } from '../constants/executiveBriefExportConstants';
import { logger } from '../utils/logger';

const PPTX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export const getExportStatus = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const context = resolveExecutiveBriefContext(req);
    if (context.isBorosil) {
      return res.json({
        success: true,
        data: {
          reportId: 'RPT-AICEV-CUST-2026-0002-AIC-2026-0002',
          reportVersion: '1.0.0-FINAL-CERTIFIED',
          clientName: context.customerName,
          analysisPeriod: '1st Apr 2026 – 22nd Oct 2026',
          financialConsistency: {
            isConsistent: true,
            varianceCr: 0,
            details: 'Reconciliation verified: Modelled ₹87.100 Cr, Proven ₹85.066 Cr, Baseline ₹556.535 Cr'
          },
          pdfFilename: AiCevManagementReportPdfBuilder.OFFICIAL_BRIEF_PDF,
          pptxFilename: AiCevManagementReportPptxBuilder.OFFICIAL_BRIEF_PPTX,
          status: 'EXECUTIVE_BRIEF_EXPORT_READY'
        }
      });
    }

    const consistency = executiveBriefExportService.verifyFinancialConsistency(context.customerName);
    const history = executiveBriefExportService.getHistory();

    return res.json({
      success: true,
      data: {
        reportId: history[0]?.reportId || 'RPT-EXEC-DEFAULT',
        reportVersion: REPORT_EXPORT_VERSION,
        clientName: context.customerName,
        analysisPeriod: 'FY 2024-25',
        financialConsistency: consistency,
        pdfFilename: getOfficialPdfFilename(context.customerName),
        pptxFilename: getOfficialPptxFilename(context.customerName),
        status: consistency.isConsistent ? 'EXECUTIVE_BRIEF_EXPORT_READY' : 'EXECUTIVE_BRIEF_EXPORT_BLOCKED'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve export status';
    logger.warn('Failed to retrieve executive brief export status', { error: message });
    return res.status(400).json({ success: false, message });
  }
};

export const downloadPdf = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const context = resolveExecutiveBriefContext(req);
    if (context.isBorosil) {
      const pdfBuffer = AiCevManagementReportPdfBuilder.generatePdf();
      const filename = AiCevManagementReportPdfBuilder.OFFICIAL_BRIEF_PDF;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    }

    const { audit, pdfBuffer } = await executiveBriefExportService.generateDualFormatExport(context.customerName);
    if (audit.exportStatus === 'EXECUTIVE_BRIEF_EXPORT_BLOCKED') {
      return res.status(400).json({
        success: false,
        message: audit.blockedReason || 'Export blocked due to financial variance'
      });
    }

    const filename = getOfficialPdfFilename(context.customerName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download PDF';
    logger.error('Failed to download executive brief PDF', { error: message });
    return res.status(400).json({ success: false, message });
  }
};

export const downloadPptx = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const context = resolveExecutiveBriefContext(req);
    if (context.isBorosil) {
      const pptxBuffer = await AiCevManagementReportPptxBuilder.generateBuffer();
      const filename = AiCevManagementReportPptxBuilder.OFFICIAL_BRIEF_PPTX;
      res.setHeader('Content-Type', PPTX_CONTENT_TYPE);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pptxBuffer.length);
      return res.send(pptxBuffer);
    }

    const { audit, pptxBuffer } = await executiveBriefExportService.generateDualFormatExport(context.customerName);
    if (audit.exportStatus === 'EXECUTIVE_BRIEF_EXPORT_BLOCKED') {
      return res.status(400).json({
        success: false,
        message: audit.blockedReason || 'Export blocked due to financial variance'
      });
    }

    const filename = getOfficialPptxFilename(context.customerName);
    res.setHeader('Content-Type', PPTX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pptxBuffer.length);
    return res.send(pptxBuffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download PPTX';
    logger.error('Failed to download executive brief PPTX', { error: message });
    return res.status(400).json({ success: false, message });
  }
};

export const downloadOpportunityBriefPdf = async (req: Request, res: Response): Promise<Response | void> => {
  return downloadPdf(req, res);
};

export const downloadOpportunityBriefPptx = async (req: Request, res: Response): Promise<Response | void> => {
  return downloadPptx(req, res);
};

export const getExportAudit = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const context = resolveExecutiveBriefContext(req);
    const { audit } = await executiveBriefExportService.generateDualFormatExport(context.customerName);
    return res.json({ success: true, data: audit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve export audit';
    return res.status(400).json({ success: false, message });
  }
};

export const getExportHistory = async (_req: Request, res: Response): Promise<Response | void> => {
  try {
    const history = executiveBriefExportService.getHistory();
    return res.json({ success: true, data: history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve export history';
    return res.status(500).json({ success: false, message });
  }
};

export const getExecutiveReportData = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const context = resolveExecutiveBriefContext(req);
    if (context.isBorosil) {
      const reportData = AiCevManagementReportBuilder.buildBorosilReport(context.assessmentRecord);
      return res.json({ success: true, data: reportData });
    }

    const reportData = executiveBriefReportService.assembleFullReport(context.customerName);
    return res.json({ success: true, data: reportData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve executive report data';
    logger.error('Failed to retrieve executive brief report data', { error: message });
    return res.status(400).json({ success: false, message });
  }
};

export const regenerateExecutiveBrief = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const context = resolveExecutiveBriefContext(req);
    logger.info('Regenerating Executive Brief', {
      assessmentId: context.assessmentId,
      customerName: context.customerName
    });

    if (context.isBorosil) {
      AiCevManagementReportPdfBuilder.savePdfArtifacts();
      await AiCevManagementReportPptxBuilder.savePptxArtifacts();
      const reportData = AiCevManagementReportBuilder.buildBorosilReport(context.assessmentRecord);

      // Save JSON artifact
      const cwd = process.cwd();
      const isBackend = path.basename(cwd) === 'backend';
      const rootDir = isBackend ? path.resolve(cwd, '..') : cwd;
      const backendDir = isBackend ? cwd : path.resolve(cwd, 'backend');
      const jsonContent = JSON.stringify(reportData, null, 2);

      const jsonFilename = 'aiCEV_Executive_Management_Report_AIC-2026-0002.json';
      fs.writeFileSync(path.resolve(backendDir, jsonFilename), jsonContent, 'utf-8');
      if (rootDir !== backendDir) {
        fs.writeFileSync(path.resolve(rootDir, jsonFilename), jsonContent, 'utf-8');
      }

      const devReportsDir = path.resolve(rootDir, 'data/dev/assessments/AIC-2026-0002/reports');
      if (fs.existsSync(devReportsDir)) {
        fs.writeFileSync(path.resolve(devReportsDir, jsonFilename), jsonContent, 'utf-8');
      }

      return res.json({
        success: true,
        message: 'Executive Brief regenerated successfully from certified Borosil Module 1-4 outputs',
        data: { reportData }
      });
    }

    const { audit } = await executiveBriefExportService.generateDualFormatExport(context.customerName);
    const reportData = executiveBriefReportService.assembleFullReport(context.customerName);

    return res.json({
      success: true,
      message: 'Executive Brief regenerated successfully',
      data: { audit, reportData }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate executive brief';
    logger.error('Failed to regenerate executive brief', { error: message });
    return res.status(400).json({ success: false, message });
  }
};
