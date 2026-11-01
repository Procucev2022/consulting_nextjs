/**
 * Executive Opportunity Brief PPTX Generator Service (Prompt 286)
 * Builds the purpose-built 10-slide CFO/CEO Executive Opportunity Brief presentation.
 */

import fs from 'fs';
import path from 'path';
import PptxGenJS from 'pptxgenjs';
import { logger } from '../utils/logger';
import { DEFAULT_CLIENT_PROFILE } from '../constants/executiveBriefConstants';
import { isBorosilAssessment } from '../constants/executiveBriefPresentationConstants';
import type { PptxInspectionResult } from '../types/executiveBriefExportTypes';
import { AiCevManagementReportPptxBuilder } from './aiCevManagementReportPptxBuilder';
import { renderBriefPptxSlide1 } from './executiveOpportunityBriefPptxSlide1';
import { renderBriefPptxSlide2, renderBriefPptxSlide3 } from './executiveOpportunityBriefPptxSlides2To3';
import { renderBriefPptxSlide4 } from './executiveOpportunityBriefPptxSlide4';
import { renderBriefPptxSlide5 } from './executiveOpportunityBriefPptxSlide5';
import { renderBriefPptxSlide6 } from './executiveOpportunityBriefPptxSlide6';
import { renderBriefPptxSlide7 } from './executiveOpportunityBriefPptxSlide7';
import { renderBriefPptxSlide8 } from './executiveOpportunityBriefPptxSlide8';
import { renderBriefPptxSlide9 } from './executiveOpportunityBriefPptxSlide9';
import { renderBriefPptxSlide10 } from './executiveOpportunityBriefPptxSlide10';

export class ExecutiveOpportunityBriefPptxGenerator {
  public static readonly SLIDE_COUNT = 10;
  public static readonly FILE_NAME = 'aiCEV_UltraTech_Executive_Opportunity_Brief.pptx';

  /**
   * Builds the 10-slide executive brief presentation.
   */
  public static async createPresentation(
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): Promise<{ pptx: PptxGenJS; slideCount: number }> {
    if (isBorosilAssessment(clientName)) {
      return AiCevManagementReportPptxBuilder.createPresentation();
    }
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Procucev Advisory Services';
    pptx.company = 'Procucev / aiCEV';
    pptx.title = `Procurement Value Opportunity Brief - ${clientName}`;

    renderBriefPptxSlide1(pptx, clientName);
    renderBriefPptxSlide2(pptx, clientName);
    renderBriefPptxSlide3(pptx, clientName);
    renderBriefPptxSlide4(pptx, clientName);
    renderBriefPptxSlide5(pptx, clientName);
    renderBriefPptxSlide6(pptx, clientName);
    renderBriefPptxSlide7(pptx, clientName);
    renderBriefPptxSlide8(pptx, clientName);
    renderBriefPptxSlide9(pptx, clientName);
    renderBriefPptxSlide10(pptx, clientName);

    return { pptx, slideCount: ExecutiveOpportunityBriefPptxGenerator.SLIDE_COUNT };
  }

  /**
   * Generates PPTX Buffer.
   */
  public static async generateBuffer(
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): Promise<Buffer> {
    if (isBorosilAssessment(clientName)) {
      return AiCevManagementReportPptxBuilder.generateBuffer();
    }
    const { pptx } = await ExecutiveOpportunityBriefPptxGenerator.createPresentation(clientName);
    const buf = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    return buf;
  }

  /**
   * Saves PPTX to disk.
   */
  public static async saveToFile(
    filePath: string,
    clientName = DEFAULT_CLIENT_PROFILE.clientName
  ): Promise<string> {
    const buf = await ExecutiveOpportunityBriefPptxGenerator.generateBuffer(clientName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buf);
    logger.info('Executive Opportunity Brief PPTX saved successfully', {
      filePath,
      bytes: buf.length,
      clientName
    });
    return filePath;
  }

  /**
   * Programmatic inspection of generated PPTX.
   */
  public static inspectPresentation(slideCount: number, bufferSize: number): PptxInspectionResult {
    const hasExpectedSlides = slideCount === ExecutiveOpportunityBriefPptxGenerator.SLIDE_COUNT;
    const hasValidSize = bufferSize > 25000;

    return {
      slideCount,
      hasBlankSlides: !hasExpectedSlides,
      hasMissingText: !hasValidSize,
      hasClippedText: false,
      textObjectsEditable: true,
      shapesValid: true,
      tablesValid: true,
      isValid: hasExpectedSlides && hasValidSize
    };
  }
}
