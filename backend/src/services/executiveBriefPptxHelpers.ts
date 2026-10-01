/**
 * Executive Brief PPTX Helper Functions (Prompt 258)
 */

import type PptxGenJS from 'pptxgenjs';

export function addSlideHeader(
  slide: PptxGenJS.Slide,
  title: string,
  category: string,
  slideNum: number
): void {
  // Category Pill
  slide.addText(category.toUpperCase(), {
    x: 0.5,
    y: 0.25,
    w: 2.2,
    h: 0.25,
    fontSize: 8,
    bold: true,
    color: '38BDF8',
    fill: { color: '1E293B' },
    align: 'center',
    fontFace: 'Arial'
  });

  // Slide Title
  slide.addText(title, {
    x: 0.5,
    y: 0.55,
    w: 8.5,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: 'F8FAFC',
    fontFace: 'Arial'
  });

  // Slide Number Pill
  slide.addText(`SLIDE ${slideNum}`, {
    x: 8.8,
    y: 0.25,
    w: 0.8,
    h: 0.25,
    fontSize: 8,
    bold: true,
    color: '94A3B8',
    fill: { color: '1E293B' },
    align: 'center',
    fontFace: 'Arial'
  });
}

export function addSlideFooter(
  slide: PptxGenJS.Slide,
  clientName: string,
  slideNum: number,
  totalSlides: number
): void {
  const confText = `CONFIDENTIAL — PREPARED EXCLUSIVELY FOR ${clientName.toUpperCase()}`;
  slide.addText(confText, {
    x: 0.5,
    y: 5.25,
    w: 7.5,
    h: 0.2,
    fontSize: 7.5,
    color: '64748B',
    fontFace: 'Arial'
  });

  slide.addText(`PAGE ${slideNum} OF ${totalSlides}`, {
    x: 8.2,
    y: 5.25,
    w: 1.4,
    h: 0.2,
    fontSize: 7.5,
    bold: true,
    align: 'right',
    color: '64748B',
    fontFace: 'Arial'
  });
}

export function addPptxKpiCard(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string,
  subtitle: string,
  accentColor: string
): void {
  // Card Background
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  // Top Accent Bar
  slide.addShape('rect', {
    x,
    y,
    w,
    h: 0.05,
    fill: { color: accentColor.replace('#', '') }
  });

  // Label
  slide.addText(title.toUpperCase(), {
    x: x + 0.1,
    y: y + 0.1,
    w: w - 0.2,
    h: 0.2,
    fontSize: 8,
    bold: true,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  // Value
  slide.addText(value, {
    x: x + 0.1,
    y: y + 0.3,
    w: w - 0.2,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: accentColor.replace('#', ''),
    fontFace: 'Arial'
  });

  // Subtitle
  slide.addText(subtitle, {
    x: x + 0.1,
    y: y + 0.65,
    w: w - 0.2,
    h: 0.2,
    fontSize: 7.5,
    color: 'CBD5E1',
    fontFace: 'Arial'
  });
}
