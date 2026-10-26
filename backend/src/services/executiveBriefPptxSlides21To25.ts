/**
 * Executive Brief PPTX Slides 21 to 25 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Benchmarks, formulas, execution pipeline, ledger, and roadmap coordinator.
 */

import type PptxGenJS from 'pptxgenjs';
import { renderPptxSlide21, renderPptxSlide22 } from './executiveBriefPptxSlides21To22';
import { renderPptxSlide23, renderPptxSlide24, renderPptxSlide25 } from './executiveBriefPptxSlides23To25';

export function renderPptxSlides21To25(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  renderPptxSlide21(pptx, clientName, totalSlides);
  renderPptxSlide22(pptx, clientName, totalSlides);
  renderPptxSlide23(pptx, clientName, totalSlides);
  renderPptxSlide24(pptx, clientName, totalSlides);
  renderPptxSlide25(pptx, clientName, totalSlides);
}
