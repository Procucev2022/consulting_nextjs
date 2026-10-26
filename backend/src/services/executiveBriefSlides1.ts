/**
 * Executive Brief Slide 1 - Cover (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, official logo asset, hero metric.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide1Cover(canvas: PdfCanvas, clientName: string): void {
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.rect(0, 0, PDF_LAYOUT.PAGE_W, PDF_LAYOUT.PAGE_H, { fill: BRAND_COLORS.canvas });

  // Official aiCEV Lockup Image Asset anchored top-right
  canvas.drawImage(PDF_LAYOUT.LOGO_X, PDF_LAYOUT.LOGO_Y, PDF_LAYOUT.LOGO_W, PDF_LAYOUT.LOGO_H, '/Im1');

  // Value-Flow Visual Line at Top
  canvas.line(PDF_LAYOUT.CONTENT_LEFT, 86, PDF_LAYOUT.CONTENT_RIGHT, 86, BRAND_COLORS.border, 0.75);

  // Section Label
  canvas.text('EXECUTIVE BRIEF - BOARDROOM EDITION', PDF_LAYOUT.CONTENT_LEFT, 120, {
    fontSize: TYPOGRAPHY.sectionLabelSize,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });

  // Large Cover Title (32 pt)
  canvas.text('Procurement Value Opportunity Assessment', PDF_LAYOUT.CONTENT_LEFT, 155, {
    fontSize: TYPOGRAPHY.coverTitleSize,
    font: 'bold',
    color: BRAND_COLORS.primaryText
  });

  // Client Name (18 pt)
  canvas.text(clientName, PDF_LAYOUT.CONTENT_LEFT, 195, {
    fontSize: 18,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });

  // Hero Opportunity Metric Card (Center Highlight)
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 230, PDF_LAYOUT.CONTENT_WIDTH, 140, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 230, 6, 140, { fill: BRAND_COLORS.accentGreen });

  const labelSavings = isCust ? 'APPROVED NET MODELLED OPPORTUNITY' : 'DIRECT SAVINGS OPPORTUNITY';
  canvas.text(labelSavings, PDF_LAYOUT.CONTENT_LEFT + 28, 260, {
    fontSize: TYPOGRAPHY.cardLabelSize,
    font: 'bold',
    color: BRAND_COLORS.secondaryText
  });
  const heroValue = `₹${contract.netDirectSavingsCr.toFixed(isCust ? 3 : 2)} Cr`;
  canvas.text(heroValue, PDF_LAYOUT.CONTENT_LEFT + 28, 305, {
    fontSize: TYPOGRAPHY.heroNumberSize + 4,
    font: 'bold',
    color: BRAND_COLORS.accentGreen
  });
  const subline = `₹${contract.netDefensiblePipelineCr.toFixed(isCust ? 3 : 2)} Cr Net Defensible Pipeline  |  ₹${contract.totalCustomerSpendCr.toFixed(isCust ? 4 : 2)} Cr Spend Evaluated  |  ${contract.analysisPeriod}`;
  canvas.text(
    subline,
    PDF_LAYOUT.CONTENT_LEFT + 28,
    342,
    { fontSize: TYPOGRAPHY.bodySize, font: 'regular', color: BRAND_COLORS.secondaryText }
  );

  // Subtle Procurement Value Geometric Accent
  canvas.line(PDF_LAYOUT.CONTENT_LEFT, 430, PDF_LAYOUT.CONTENT_RIGHT, 430, BRAND_COLORS.border, 0.5);

  // Footer Metadata
  const confText = `Management Confidential - Prepared exclusively for ${clientName}`;
  canvas.text(confText, PDF_LAYOUT.CONTENT_LEFT, 470, {
    fontSize: TYPOGRAPHY.footerSize,
    color: BRAND_COLORS.secondaryText
  });
  canvas.text('aiCEV by Procucev', PDF_LAYOUT.PAGE_W / 2, 470, {
    fontSize: TYPOGRAPHY.footerSize,
    font: 'bold',
    color: BRAND_COLORS.secondaryText,
    align: 'center'
  });
  canvas.text('BOARD DELIVERABLE', PDF_LAYOUT.CONTENT_RIGHT, 470, {
    fontSize: TYPOGRAPHY.footerSize,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue,
    align: 'right'
  });
}
