/**
 * Executive Brief Slide 13 - Findings (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 5 numbered findings, root causes.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide13SpendFindings(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Module 1 Findings: Forensic Spend Observations & Root Causes',
    'Forensic Findings',
    p
  );

  // 5 Numbered Insight Cards
  const cardW = 166;
  const cardH = 300;
  const startY = 104;

  const findings = [
    {
      num: '01',
      title: 'Plant Price Incoherence',
      sub: 'Inter-Plant Unit Rate Divergence',
      desc: 'Identical refractory bricks, grinding media, and packing bags purchased at up to 24% price divergence ' +
            'across 26 units due to localized negotiations.',
      opp: 'Arbitrage Opp: ₹42.80 Cr'
    },
    {
      num: '02',
      title: 'Uncontrolled Spot Buying',
      sub: '42.6% Non-Contracted Orders',
      desc: 'Substantial procurement executed off master service agreements without volume discount tiers, ' +
            'resulting in unbudgeted rate creep.',
      opp: 'Contract Control: ₹14.20 Cr'
    },
    {
      num: '03',
      title: 'Single-Plant Vendors',
      sub: '68% Regional Supplier Lock-In',
      desc: '68% of suppliers serve only 1 plant despite national footprint, leaving regional units ' +
            'vulnerable to local pricing power.',
      opp: 'Panelling Opp: ₹26.40 Cr'
    },
    {
      num: '04',
      title: 'Payment Terms Disparity',
      sub: '14 Active Terms Across Units',
      desc: 'Payment cycles vary from 30 days to 90 days for identical supplier profiles. ' +
            'Standardizing to 60/90 days unlocks operating cash flow.',
      opp: 'Working Capital: ₹14.88 Cr'
    },
    {
      num: '05',
      title: 'Duplicate SKU Masters',
      sub: 'Inconsistent Item Specs',
      desc: 'Over 1,200 redundant item descriptions identified for identical chemical consumables ' +
            'and lubricants, obstructing aggregation.',
      opp: 'Aggregation: ₹22.10 Cr'
    }
  ];

  findings.forEach((f, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (cardW + 8);
    canvas.rect(x, startY, cardW, cardH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, cardW, 4, { fill: BRAND_COLORS.procucevBlue });
    canvas.text(f.num, x + 14, startY + 30, { fontSize: 13, font: 'bold', color: BRAND_COLORS.procucevBlue });
    canvas.text(f.title, x + 14, startY + 54, { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(f.sub, x + 14, startY + 72, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.line(x + 14, startY + 86, x + cardW - 14, startY + 86, BRAND_COLORS.border, 0.5);
    canvas.textBlock(f.desc, x + 14, startY + 104, cardW - 28, {
      fontSize: 9,
      color: BRAND_COLORS.primaryText,
      lineHeight: 14
    });
    canvas.rect(x + 10, startY + 252, cardW - 20, 32, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(f.opp, x + 16, startY + 272, { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.procucevBlue });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('FORENSIC SOURCING TAKEAWAY', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'Root-cause analysis reveals that value loss is driven primarily by decentralized contracting autonomy ' +
    'and fragmented vendor management, rather than market rate inflation. Centralized rate governance restores discipline.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
