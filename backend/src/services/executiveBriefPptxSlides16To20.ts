/**
 * Executive Brief PPTX Slides 16 to 20 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Process flow, before/after cards, and PCBI metrics coordinator.
 */

import type PptxGenJS from 'pptxgenjs';
import { renderPptxSlide16, renderPptxSlide17, renderPptxSlide18 } from './executiveBriefPptxSlides16To18';
import { renderPptxSlide19, renderPptxSlide20 } from './executiveBriefPptxSlides19To20';

export function renderPptxSlides16To20(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  renderPptxSlide16(pptx, clientName, totalSlides);
  renderPptxSlide17(pptx, clientName, totalSlides);
  renderPptxSlide18(pptx, clientName, totalSlides);
  renderPptxSlide19(pptx, clientName, totalSlides);
  renderPptxSlide20(pptx, clientName, totalSlides);
}
