/**
 * Builds the Executive Brief PPTX from the certified report data with pptxgenjs. The output is a Uint8Array, so the
 * same code path runs under Node (Vitest) and on Workers without relying on Node Buffer.
 */
import PptxGenJS from 'pptxgenjs';
import type { ExecutiveBriefReportData } from '../types/executiveBriefExportTypes';
import {
  PPTX_AUTHOR,
  PPTX_COMPANY,
  PPTX_LAYOUT_NAME,
  PPTX_OUTPUT_ERROR,
  PPTX_TITLE_PREFIX
} from '../constants/executiveBriefPptxConstants';
import { addExecutiveBriefSlides } from './executiveBriefPptxSlides';

export const generateExecutiveBriefPptx = async (report: ExecutiveBriefReportData): Promise<Uint8Array> => {
  const presentation = new PptxGenJS();
  presentation.layout = PPTX_LAYOUT_NAME;
  presentation.author = PPTX_AUTHOR;
  presentation.company = PPTX_COMPANY;
  presentation.title = `${PPTX_TITLE_PREFIX}${report.clientProfile.clientName}`;
  addExecutiveBriefSlides(presentation, report);
  const output = await presentation.write({ outputType: 'uint8array' });
  if (output instanceof Uint8Array) {
    return output;
  }
  throw new Error(PPTX_OUTPUT_ERROR);
};
