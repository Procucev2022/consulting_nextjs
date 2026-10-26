/**
 * Executive Opportunity Brief Service (Prompt 286 & Prompt 503)
 * Generates the purpose-built 10-slide CFO/CEO Executive Opportunity Brief PDF.
 * Dynamically binds customer-specific presentation contracts and enforces 2 customer context slides.
 */

import fs from 'fs';
import path from 'path';
import { PdfCanvas } from '../utils/pdfCanvas';
import { logger } from '../utils/logger';
import { DEFAULT_CLIENT_PROFILE } from '../constants/executiveBriefConstants';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';
import { renderBriefSlide1, renderBriefSlide2, renderBriefSlide3 } from './executiveOpportunityBriefSlides1To3';
import { renderBriefSlide4, renderBriefSlide5 } from './executiveOpportunityBriefSlides4To5';
import { renderBriefSlide6, renderBriefSlide7, renderBriefSlide8 } from './executiveOpportunityBriefSlides6To8';
import { renderBriefSlide9, renderBriefSlide10 } from './executiveOpportunityBriefSlides9To10';

export class ExecutiveOpportunityBriefService {
  public static readonly SLIDE_COUNT = 10;
  public static readonly FILE_NAME_PDF = 'aiCEV_UltraTech_Executive_Opportunity_Brief.pdf';
  public static readonly FILE_NAME_PPTX = 'aiCEV_UltraTech_Executive_Opportunity_Brief.pptx';

  /**
   * Resolves the official filename for brief PDF exports.
   */
  public static getPdfFilename(clientName: string): string {
    if (isCustomerAssessment(clientName)) {
      const sanitized = clientName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      return `aiCEV_${sanitized}_Executive_Opportunity_Brief.pdf`;
    }
    return this.FILE_NAME_PDF;
  }

  /**
   * Resolves the official filename for brief PPTX exports.
   */
  public static getPptxFilename(clientName: string): string {
    if (isCustomerAssessment(clientName)) {
      const sanitized = clientName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      return `aiCEV_${sanitized}_Executive_Opportunity_Brief.pptx`;
    }
    return this.FILE_NAME_PPTX;
  }

  /**
   * Generates the 10-slide Executive Opportunity Brief PDF buffer.
   */
  public static generatePdfBuffer(
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): Buffer {
    const canvas = new PdfCanvas(960, 540);
    const contract = getExecutiveBriefPresentationContract(clientName);

    renderBriefSlide1(canvas, clientName, contract);
    renderBriefSlide2(canvas, clientName, contract);
    renderBriefSlide3(canvas, clientName, contract);
    renderBriefSlide4(canvas, clientName, contract);
    renderBriefSlide5(canvas, clientName, contract);
    renderBriefSlide6(canvas, clientName, contract);
    renderBriefSlide7(canvas, clientName, contract);
    renderBriefSlide8(canvas, clientName, contract);
    renderBriefSlide9(canvas, clientName, contract);
    renderBriefSlide10(canvas, clientName, contract);

    const buffer = canvas.toBuffer();
    logger.info('Executive Opportunity Brief PDF generated successfully', {
      slideCount: ExecutiveOpportunityBriefService.SLIDE_COUNT,
      bufferBytes: buffer.length,
      clientName,
      isCustomerAssessment: isCustomerAssessment(clientName)
    });
    return buffer;
  }

  /**
   * Saves the 10-slide Executive Opportunity Brief PDF to disk.
   */
  public static savePdfToFile(
    filePath: string,
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): string {
    const buffer = this.generatePdfBuffer(clientName);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    logger.info('Executive Opportunity Brief PDF saved to file', {
      filePath,
      bytes: buffer.length,
      clientName
    });
    return filePath;
  }
}
