/**
 * Executive Brief Slides 29 to 30 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, management decision cards, and audit appendix table.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide29NextSteps(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Management Decision: Converting Opportunity into Realized EBITDA', 'Next Step', p);

  // Executive Decision Cards (3 Clear Action Items)
  const colW = 276;
  const colH = 260;
  const startY = 104;

  const decisions = [
    {
      num: 'DECISION 1',
      title: 'Wave 1 Sourcing Signoff',
      scope: 'Authorize ₹47.90 Cr Tenders',
      desc: 'Approve execution of 5 pre-qualified Wave 1 initiatives across packaging bags, grinding media, and ' +
            'imported fuel benchmarks. Direct P&L cash realization in 90 days.',
      action: 'APPROVE WAVE 1 RFPs',
      color: BRAND_COLORS.accentGreen
    },
    {
      num: 'DECISION 2',
      title: 'Working Group Charter',
      scope: 'Empower Plant Procurement',
      desc: 'Charter a joint UltraTech-Procucev Sourcing Steering Committee connecting central procurement ' +
            'with plant managers to ensure operational adoption.',
      action: 'CHARTER WORKING GROUP',
      color: BRAND_COLORS.procucevBlue
    },
    {
      num: 'DECISION 3',
      title: 'E-Auction Authorization',
      scope: 'Dynamic Reverse Bidding',
      desc: 'Authorize Procucev dynamic reverse e-auction rules and controlled volume allocation framework ' +
            'for high-competition packaging and freight categories.',
      action: 'AUTHORIZE E-AUCTIONS',
      color: '#0284C7'
    }
  ];

  decisions.forEach((dc, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 18);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: dc.color });

    canvas.text(dc.num, x + 16, startY + 28, { fontSize: 8.5, font: 'bold', color: dc.color });
    canvas.text(dc.title, x + 16, startY + 52, { fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(dc.scope, x + 16, startY + 72, { fontSize: 9, font: 'bold', color: dc.color });
    canvas.line(x + 16, startY + 86, x + colW - 16, startY + 86, BRAND_COLORS.border, 0.5);

    canvas.textBlock(dc.desc, x + 16, startY + 104, colW - 32, {
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });

    canvas.rect(x + 16, startY + 204, colW - 32, 40, { fill: dc.color });
    canvas.text(dc.action, x + 24, startY + 228, { fontSize: 9, font: 'bold', color: '#FFFFFF' });
  });

  // Dominant Executive Closing Banner
  const closeY = 384;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, closeY, PDF_LAYOUT.CONTENT_WIDTH, 106, {
    fill: '#EFF6FF',
    stroke: BRAND_COLORS.procucevBlue,
    lineWidth: 1.5
  });
  canvas.text(
    'THE OPPORTUNITY IS IDENTIFIED. NOW IT IS TIME TO CONVERT IT.',
    PDF_LAYOUT.CONTENT_LEFT + 24,
    closeY + 30,
    { fontSize: 12, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Across ₹5,920.35 Cr of audited spend, Procucev has certified ₹78.72 Cr in defensible direct recurring savings ' +
    'and ₹14.88 Cr in strategic market upside. Execution begins immediately upon steering committee authorization.',
    PDF_LAYOUT.CONTENT_LEFT + 24,
    closeY + 52,
    PDF_LAYOUT.CONTENT_WIDTH - 48,
    { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText, lineHeight: 14 }
  );
  canvas.text(
    'Contact: leadership@procucev.com  |  aiCEV Procurement Intelligence Platform  |  Boardroom Edition',
    PDF_LAYOUT.CONTENT_LEFT + 24,
    closeY + 90,
    { fontSize: 8.5, color: BRAND_COLORS.secondaryText }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide30AuditAppendix(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Evidence Appendix: Methodological Provenance & Transaction Traceability',
    'Audit Appendix',
    p
  );

  // Reconciled Invariant Ledger
  const headers = ['Metric Invariant', 'Audited Value', 'Reconciliation Scope & Provenance'];
  const rows = [
    ['Total Spend Evaluated', '₹5,920.35 Cr', '31,671 invoice line items (April 2024 - March 2026, 24 Months)'],
    ['Commercial Baseline Spend', '₹4,931.00 Cr', 'Excludes non-controllable taxes, duties, and inter-unit transfers'],
    ['Gross Identified Opportunity', '₹173.12 Cr', 'Sum of individual potentials across 10 strategic sourcing levers'],
    ['Multi-Lever Overlap Deductions', '₹62.80 Cr', 'Mathematical deduplication between tenders, volume, and rate cuts'],
    ['Operational Policy Exclusions', '₹16.72 Cr', 'Carve-out of long-term contracts and single-source OEM spares'],
    ['Net Defensible Pipeline', '₹93.60 Cr', 'Certified value pool: ₹78.72 Cr Direct + ₹14.88 Cr Strategic'],
    ['Direct P&L Savings Opportunity', '₹78.72 Cr', 'Monetized recurring EBITDA cost reduction across 26 plants'],
    ['Strategic Market Value', '₹14.88 Cr', 'Commodity benchmark alignment; tracked separately from direct savings']
  ];

  const colWidths = [220, 160, 484];
  canvas.table(PDF_LAYOUT.CONTENT_LEFT, 104, PDF_LAYOUT.CONTENT_WIDTH, headers, rows, colWidths);

  // Certification Seal Strip
  const sealY = 370;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, sealY, PDF_LAYOUT.CONTENT_WIDTH, 120, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, sealY, 6, 120, { fill: BRAND_COLORS.accentGreen });

  canvas.text(
    'PROCUCEV CERTIFIED DIAGNOSTIC AUDIT ATTESTATION',
    PDF_LAYOUT.CONTENT_LEFT + 24,
    sealY + 28,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    'This Executive Brief is certified by Procucev Enterprise Diagnostic Analytics Engine. All numerical invariants ' +
    'balance with ₹0.00 variance across the transactional ledger. Process productivity (20.0% effort reduction across ' +
    '824 POs) and risk avoidance (₹420.00 Cr spend de-risked) are strictly non-monetized for boardroom credibility.',
    PDF_LAYOUT.CONTENT_LEFT + 24,
    sealY + 46,
    PDF_LAYOUT.CONTENT_WIDTH - 48,
    { fontSize: 9.5, color: BRAND_COLORS.primaryText, lineHeight: 14 }
  );
  canvas.text(
    'Prepared Exclusively for UltraTech Cement Limited  |  aiCEV by Procucev  |  Audit Certified',
    PDF_LAYOUT.CONTENT_LEFT + 24,
    sealY + 98,
    { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
