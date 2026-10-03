/**
 * Executive Opportunity Brief Export Service (Prompt 286)
 * Generates and saves the 10-slide CFO/CEO Executive Opportunity Brief in PDF and PPTX formats.
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { DEFAULT_CLIENT_PROFILE } from '../constants/executiveBriefConstants';
import { ExecutiveOpportunityBriefService } from './executiveOpportunityBriefService';
import { ExecutiveOpportunityBriefPptxGenerator } from './executiveOpportunityBriefPptxGenerator';

export class ExecutiveOpportunityBriefExportService {
  public static readonly PDF_FILENAME = 'aiCEV_UltraTech_Executive_Opportunity_Brief.pdf';
  public static readonly PPTX_FILENAME = 'aiCEV_UltraTech_Executive_Opportunity_Brief.pptx';

  /**
   * Generates both PDF and PPTX formats and writes them to backend and root workspace.
   */
  public static async generateOpportunityBrief(
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): Promise<{
    pdfBuffer: Buffer;
    pptxBuffer: Buffer;
    pdfPath: string;
    pptxPath: string;
  }> {
    const cwd = process.cwd();
    const isBackendCwd = path.basename(cwd) === 'backend';
    const backendDir = isBackendCwd ? cwd : path.resolve(cwd, 'backend');
    const rootDir = isBackendCwd ? path.resolve(cwd, '..') : cwd;

    // 1. Generate PDF
    const pdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer(clientName);
    const pdfBackendPath = path.resolve(backendDir, this.PDF_FILENAME);
    const pdfRootPath = path.resolve(rootDir, this.PDF_FILENAME);

    fs.writeFileSync(pdfBackendPath, pdfBuffer);
    if (rootDir !== backendDir) {
      fs.writeFileSync(pdfRootPath, pdfBuffer);
    }

    // 2. Generate PPTX
    const pptxBuffer = await ExecutiveOpportunityBriefPptxGenerator.generateBuffer(clientName);
    const pptxBackendPath = path.resolve(backendDir, this.PPTX_FILENAME);
    const pptxRootPath = path.resolve(rootDir, this.PPTX_FILENAME);

    fs.writeFileSync(pptxBackendPath, pptxBuffer);
    if (rootDir !== backendDir) {
      fs.writeFileSync(pptxRootPath, pptxBuffer);
    }

    logger.info('Executive Opportunity Brief generated and written to disk', {
      pdfBytes: pdfBuffer.length,
      pptxBytes: pptxBuffer.length,
      pdfPath: pdfRootPath,
      pptxPath: pptxRootPath,
      clientName
    });

    return {
      pdfBuffer,
      pptxBuffer,
      pdfPath: pdfRootPath,
      pptxPath: pptxRootPath
    };
  }
}
