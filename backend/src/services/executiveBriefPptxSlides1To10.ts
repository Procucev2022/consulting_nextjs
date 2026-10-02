/**
 * Executive Brief PPTX Slides 1 to 10 (Prompt 283 Redesign)
 */

import type PptxGenJS from 'pptxgenjs';
import { renderPptxSlides1To5 } from './executiveBriefPptxSlides1To5';
import { renderPptxSlides6To10 } from './executiveBriefPptxSlides6To10';

export function renderPptxSlides1To10(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  renderPptxSlides1To5(pptx, clientName, totalSlides);
  renderPptxSlides6To10(pptx, clientName, totalSlides);
}
