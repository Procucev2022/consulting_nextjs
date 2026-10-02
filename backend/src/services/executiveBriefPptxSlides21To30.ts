/**
 * Executive Brief PPTX Slides 21 to 30 (Prompt 283 Redesign)
 */

import type PptxGenJS from 'pptxgenjs';
import { renderPptxSlides21To25 } from './executiveBriefPptxSlides21To25';
import { renderPptxSlides26To30 } from './executiveBriefPptxSlides26To30';

export function renderPptxSlides21To30(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  renderPptxSlides21To25(pptx, clientName, totalSlides);
  renderPptxSlides26To30(pptx, clientName, totalSlides);
}
