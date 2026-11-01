/**
 * aiCEV Management Report PDF Builder (Prompt 587)
 * Generates an authoritative 15-page 16:9 PDF executive brief for Borosil Ltd (AIC-2026-0002).
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import fs from 'fs';
import path from 'path';
import { PdfCanvas } from '../utils/pdfCanvas';
import { renderReportPdfSlides1To5 } from './aiCevReportPdfSlides1To5';
import { renderReportPdfSlides6To10 } from './aiCevReportPdfSlides6To10';
import { renderReportPdfSlides11To15 } from './aiCevReportPdfSlides11To15';
import { renderReportPdfSlides16To20 } from './aiCevReportPdfSlides16To20';
import { logger } from '../utils/logger';

export class AiCevManagementReportPdfBuilder {
  public static readonly SLIDE_COUNT = 20;
  public static readonly OFFICIAL_BRIEF_PDF = 'aiCEV_Borosil_Ltd_Executive_Opportunity_Brief.pdf';
  public static readonly OFFICIAL_REPORT_PDF = 'aiCEV_Executive_Management_Report_AIC-2026-0002.pdf';

  public static generatePdf(): Buffer {
    const canvas = new PdfCanvas(960, 540);

    renderReportPdfSlides1To5(canvas);
    renderReportPdfSlides6To10(canvas);
    renderReportPdfSlides11To15(canvas);
    renderReportPdfSlides16To20(canvas);

    const buffer = canvas.toBuffer();
    logger.info('AiCevManagementReportPdfBuilder: 20-slide PDF generated successfully', {
      pagesCount: canvas.getPageCount(),
      bytes: buffer.length,
      assessmentId: 'AIC-2026-0002'
    });
    return buffer;
  }

  public static savePdfArtifacts(): {
    buffer: Buffer;
    briefPath: string;
    reportPath: string;
  } {
    const buffer = this.generatePdf();
    const backendDir = path.resolve(__dirname, '../..');
    const rootDir = path.resolve(backendDir, '..');

    const briefBackend = path.resolve(backendDir, this.OFFICIAL_BRIEF_PDF);
    const reportBackend = path.resolve(backendDir, this.OFFICIAL_REPORT_PDF);
    fs.writeFileSync(briefBackend, buffer);
    fs.writeFileSync(reportBackend, buffer);

    fs.writeFileSync(path.resolve(rootDir, this.OFFICIAL_BRIEF_PDF), buffer);
    fs.writeFileSync(path.resolve(rootDir, this.OFFICIAL_REPORT_PDF), buffer);

    const devAssessmentReportsDir = path.resolve(
      rootDir,
      'data/dev/assessments/AIC-2026-0002/reports'
    );
    fs.mkdirSync(devAssessmentReportsDir, { recursive: true });
    fs.writeFileSync(path.resolve(devAssessmentReportsDir, this.OFFICIAL_REPORT_PDF), buffer);
    fs.writeFileSync(path.resolve(devAssessmentReportsDir, this.OFFICIAL_BRIEF_PDF), buffer);

    return {
      buffer,
      briefPath: briefBackend,
      reportPath: reportBackend
    };
  }
}
