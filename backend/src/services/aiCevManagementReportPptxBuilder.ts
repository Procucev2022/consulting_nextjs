/**
 * aiCEV Management Report PPTX Builder (Prompt 587)
 * Builds the authoritative 15-slide 16:9 PowerPoint presentation for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import fs from 'fs';
import path from 'path';
import PptxGenJS from 'pptxgenjs';
import { logger } from '../utils/logger';
import { renderReportPptxSlides1To5 } from './aiCevReportPptxSlides1To5';
import { renderReportPptxSlides6To10 } from './aiCevReportPptxSlides6To10';
import { renderReportPptxSlides11To15 } from './aiCevReportPptxSlides11To15';
import { renderReportPptxSlides16To20 } from './aiCevReportPptxSlides16To20';

export class AiCevManagementReportPptxBuilder {
  public static readonly SLIDE_COUNT = 20;
  public static readonly OFFICIAL_BRIEF_PPTX = 'aiCEV_Borosil_Ltd_Executive_Opportunity_Brief.pptx';
  public static readonly OFFICIAL_REPORT_PPTX = 'aiCEV_Executive_Management_Report_AIC-2026-0002.pptx';

  public static async createPresentation(): Promise<{ pptx: PptxGenJS; slideCount: number }> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Procucev Advisory Services';
    pptx.company = 'Procucev / aiCEV';
    pptx.title = 'Procurement Value Opportunity Brief - Borosil Ltd (AIC-2026-0002)';

    renderReportPptxSlides1To5(pptx);
    renderReportPptxSlides6To10(pptx);
    renderReportPptxSlides11To15(pptx);
    renderReportPptxSlides16To20(pptx);

    return { pptx, slideCount: AiCevManagementReportPptxBuilder.SLIDE_COUNT };
  }

  public static async generateBuffer(): Promise<Buffer> {
    const { pptx } = await this.createPresentation();
    const buf = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    logger.info('AiCevManagementReportPptxBuilder: 20-slide PPTX generated successfully', {
      slideCount: AiCevManagementReportPptxBuilder.SLIDE_COUNT,
      bytes: buf.length,
      assessmentId: 'AIC-2026-0002'
    });
    return buf;
  }

  public static async savePptxArtifacts(): Promise<{
    buffer: Buffer;
    briefPath: string;
    reportPath: string;
  }> {
    const buffer = await this.generateBuffer();
    const backendDir = path.resolve(__dirname, '../..');
    const rootDir = path.resolve(backendDir, '..');

    const briefBackend = path.resolve(backendDir, this.OFFICIAL_BRIEF_PPTX);
    const reportBackend = path.resolve(backendDir, this.OFFICIAL_REPORT_PPTX);
    fs.writeFileSync(briefBackend, buffer);
    fs.writeFileSync(reportBackend, buffer);

    fs.writeFileSync(path.resolve(rootDir, this.OFFICIAL_BRIEF_PPTX), buffer);
    fs.writeFileSync(path.resolve(rootDir, this.OFFICIAL_REPORT_PPTX), buffer);

    const devAssessmentReportsDir = path.resolve(
      rootDir,
      'data/dev/assessments/AIC-2026-0002/reports'
    );
    fs.mkdirSync(devAssessmentReportsDir, { recursive: true });
    fs.writeFileSync(path.resolve(devAssessmentReportsDir, this.OFFICIAL_REPORT_PPTX), buffer);
    fs.writeFileSync(path.resolve(devAssessmentReportsDir, this.OFFICIAL_BRIEF_PPTX), buffer);

    return {
      buffer,
      briefPath: briefBackend,
      reportPath: reportBackend
    };
  }
}
