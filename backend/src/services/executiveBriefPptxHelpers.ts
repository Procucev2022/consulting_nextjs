/**
 * Shared PPTX building blocks for the Executive Brief deck: backdrop, title frame, footer, text runs, and table cells.
 */
import type PptxGenJS from 'pptxgenjs';
import type { ExecutiveBriefSlideFrameOptions } from '../types/executiveBriefPptx';
import { EXECUTIVE_BRIEF_LABELS } from '../constants/executiveBriefLabelConstants';
import {
  PPTX_FONT_FACE,
  PPTX_FONT_SIZES,
  PPTX_GEOMETRY,
  PPTX_THEME
} from '../constants/executiveBriefPptxConstants';

export const addBackdrop = (presentation: PptxGenJS, slide: PptxGenJS.Slide): void => {
  slide.background = { color: PPTX_THEME.background };
  slide.addShape(presentation.ShapeType.rect, {
    x: 0,
    y: 0,
    w: PPTX_GEOMETRY.SLIDE_WIDTH,
    h: PPTX_GEOMETRY.ACCENT_HEIGHT,
    fill: { color: PPTX_THEME.accent },
    line: { color: PPTX_THEME.accent }
  });
};

export const addFooter = (
  slide: PptxGenJS.Slide,
  clientName: string,
  slideNumber: number,
  totalSlides: number
): void => {
  slide.addText(`${EXECUTIVE_BRIEF_LABELS.confidentialityPrefix} ${clientName}`, {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.FOOTER_Y,
    w: PPTX_GEOMETRY.FOOTER_LEFT_WIDTH,
    h: PPTX_GEOMETRY.FOOTER_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.footer,
    color: PPTX_THEME.secondaryText
  });
  slide.addText(`${slideNumber} / ${totalSlides}`, {
    x: PPTX_GEOMETRY.FOOTER_RIGHT_X,
    y: PPTX_GEOMETRY.FOOTER_Y,
    w: PPTX_GEOMETRY.FOOTER_RIGHT_WIDTH,
    h: PPTX_GEOMETRY.FOOTER_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.footer,
    color: PPTX_THEME.secondaryText,
    align: 'right'
  });
};

/**
 * Creates a content slide with a title, an optional subtitle, and the standard footer.
 */
export const addSlideFrame = (presentation: PptxGenJS, options: ExecutiveBriefSlideFrameOptions): PptxGenJS.Slide => {
  const slide = presentation.addSlide();
  addBackdrop(presentation, slide);
  slide.addText(options.title, {
    x: PPTX_GEOMETRY.MARGIN_X,
    y: PPTX_GEOMETRY.TITLE_Y,
    w: PPTX_GEOMETRY.CONTENT_WIDTH,
    h: PPTX_GEOMETRY.TITLE_HEIGHT,
    fontFace: PPTX_FONT_FACE,
    fontSize: PPTX_FONT_SIZES.title,
    bold: true,
    color: PPTX_THEME.primaryText,
    valign: 'middle'
  });
  if (options.subtitle !== undefined) {
    slide.addText(options.subtitle, {
      x: PPTX_GEOMETRY.MARGIN_X,
      y: PPTX_GEOMETRY.SUBTITLE_Y,
      w: PPTX_GEOMETRY.CONTENT_WIDTH,
      h: PPTX_GEOMETRY.SUBTITLE_HEIGHT,
      fontFace: PPTX_FONT_FACE,
      fontSize: PPTX_FONT_SIZES.subtitle,
      color: PPTX_THEME.secondaryText
    });
  }
  addFooter(slide, options.clientName, options.slideNumber, options.totalSlides);
  return slide;
};

/**
 * A bold label followed by its value on its own line.
 */
export const fieldRuns = (label: string, value: string): PptxGenJS.TextProps[] => [
  {
    text: `${label}${EXECUTIVE_BRIEF_LABELS.fieldSeparator}`,
    options: { bold: true, color: PPTX_THEME.accent }
  },
  {
    text: value,
    options: { color: PPTX_THEME.primaryText, breakLine: true }
  }
];

export const headerCell = (text: string): PptxGenJS.TableCell => ({
  text,
  options: { bold: true, color: PPTX_THEME.primaryText, fill: { color: PPTX_THEME.headerFill } }
});

export const bodyCell = (text: string, color: string = PPTX_THEME.primaryText): PptxGenJS.TableCell => ({
  text,
  options: { color }
});

export const tableBorder = (): PptxGenJS.BorderProps => ({
  type: 'solid',
  pt: 0.5,
  color: PPTX_THEME.border
});
