/**
 * Executive Opportunity Brief PPTX Helpers (Prompt 286)
 * Strict 10 x 5.625 inch layout, Aptos/Arial typography, official aiCEV image logo asset.
 */

import fs from 'fs';
import path from 'path';
import type PptxGenJS from 'pptxgenjs';
import {
  PPTX_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefLayoutConstants';

let cachedLogoBase64: string | null = null;

export function getBriefLogoBase64(): string {
  if (!cachedLogoBase64) {
    const logoPath = path.resolve(__dirname, '../../assets/aicev-logo.png');
    if (fs.existsSync(logoPath)) {
      cachedLogoBase64 = 'image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
    } else {
      cachedLogoBase64 = '';
    }
  }
  return cachedLogoBase64;
}

export function addBriefHeader(
  slide: PptxGenJS.Slide,
  title: string,
  category: string,
  _slideNum: number
): void {
  // Category Pill
  slide.addText(category.toUpperCase(), {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: PPTX_LAYOUT.HEADER_Y,
    w: 3.5,
    h: 0.24,
    fontSize: TYPOGRAPHY.sectionLabelSize,
    bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''),
    fontFace: TYPOGRAPHY.fallbackFont
  });

  // Slide Title (22 pt)
  slide.addText(title, {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: PPTX_LAYOUT.TITLE_Y,
    w: 7.5,
    h: 0.38,
    fontSize: TYPOGRAPHY.executiveTitleSize,
    bold: true,
    color: BRAND_COLORS.primaryText.replace('#', ''),
    fontFace: TYPOGRAPHY.fallbackFont
  });

  // Top-Right: Official aiCEV Lockup Image Asset (Zero text-based logo)
  const logoData = getBriefLogoBase64();
  if (logoData) {
    slide.addImage({
      data: logoData,
      x: PPTX_LAYOUT.LOGO_X,
      y: PPTX_LAYOUT.LOGO_Y,
      w: PPTX_LAYOUT.LOGO_W,
      h: PPTX_LAYOUT.LOGO_H
    });
  }
}

export function addBriefFooter(
  slide: PptxGenJS.Slide,
  slideNum: number
): void {
  const y = PPTX_LAYOUT.FOOTER_Y;
  const fontFace = TYPOGRAPHY.fallbackFont;
  const color = BRAND_COLORS.secondaryText.replace('#', '');

  // Subtle separator line
  slide.addShape('rect', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y: y - 0.08,
    w: PPTX_LAYOUT.CONTENT_WIDTH,
    h: 0.01,
    fill: { color: BRAND_COLORS.border.replace('#', '') }
  });

  // Left: Confidentiality
  slide.addText('Management Confidential | CFO / CEO Discussion Edition', {
    x: PPTX_LAYOUT.CONTENT_LEFT,
    y,
    w: 4.8,
    h: 0.2,
    fontSize: TYPOGRAPHY.footerSize,
    color,
    fontFace
  });

  // Center: Brand lockup text
  slide.addText('aiCEV by Procucev', {
    x: 4.0,
    y,
    w: 2.0,
    h: 0.2,
    fontSize: TYPOGRAPHY.footerSize,
    bold: true,
    align: 'center',
    color,
    fontFace
  });

  // Right: Page Number
  slide.addText(`PAGE ${slideNum} OF 10`, {
    x: PPTX_LAYOUT.SAFE_RIGHT - 1.5,
    y,
    w: 1.5,
    h: 0.2,
    fontSize: TYPOGRAPHY.footerSize,
    bold: true,
    align: 'right',
    color,
    fontFace
  });
}
