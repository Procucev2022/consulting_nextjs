/**
 * Executive Brief PPTX Slides 11 to 20 (Prompt 283 Redesign)
 */

import type PptxGenJS from 'pptxgenjs';
import { renderPptxSlides11To15 } from './executiveBriefPptxSlides11To15';
import { renderPptxSlides16To20 } from './executiveBriefPptxSlides16To20';

export function renderPptxSlides11To20(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  renderPptxSlides11To15(pptx, clientName, totalSlides);
  renderPptxSlides16To20(pptx, clientName, totalSlides);
}
