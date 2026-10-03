/**
 * Executive Opportunity Brief Service (Prompt 286)
 * Generates the purpose-built 10-slide CFO/CEO Executive Opportunity Brief PDF.
 * Shared certified presentation data contract: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.
 */

import fs from 'fs';
import path from 'path';
import { PdfCanvas } from '../utils/pdfCanvas';
import { logger } from '../utils/logger';
import { DEFAULT_CLIENT_PROFILE } from '../constants/executiveBriefConstants';
import { renderBriefSlide1, renderBriefSlide2, renderBriefSlide3 } from './executiveOpportunityBriefSlides1To3';
import { renderBriefSlide4, renderBriefSlide5 } from './executiveOpportunityBriefSlides4To5';
import { renderBriefSlide6, renderBriefSlide7, renderBriefSlide8 } from './executiveOpportunityBriefSlides6To8';
import { renderBriefSlide9, renderBriefSlide10 } from './executiveOpportunityBriefSlides9To10';

export class ExecutiveOpportunityBriefService {
  public static readonly SLIDE_COUNT = 10;
  public static readonly FILE_NAME_PDF = 'aiCEV_UltraTech_Executive_Opportunity_Brief.pdf';
  public static readonly FILE_NAME_PPTX = 'aiCEV_UltraTech_Executive_Opportunity_Brief.pptx';

  /**
   * Generates the 10-slide Executive Opportunity Brief PDF buffer.
   */
  public static generatePdfBuffer(
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): Buffer {
    const canvas = new PdfCanvas(960, 540);

    renderBriefSlide1(canvas, clientName);
    renderBriefSlide2(canvas);
    renderBriefSlide3(canvas);
    renderBriefSlide4(canvas);
    renderBriefSlide5(canvas);
    renderBriefSlide6(canvas);
    renderBriefSlide7(canvas);
    renderBriefSlide8(canvas);
    renderBriefSlide9(canvas);
    renderBriefSlide10(canvas);

    const buffer = canvas.toBuffer();
    logger.info('Executive Opportunity Brief PDF generated successfully', {
      slideCount: ExecutiveOpportunityBriefService.SLIDE_COUNT,
      bufferBytes: buffer.length,
      clientName
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
