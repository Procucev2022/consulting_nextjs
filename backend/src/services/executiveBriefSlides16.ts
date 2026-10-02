/**
 * Executive Brief Slide 16 - E-Auction Execution (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 7-stage process flow, commercial governance.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide16EAuction(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('E-Auction as an Execution Mechanism: Dynamic Price Discovery', 'Dynamic Sourcing', p);

  // E-Auction Process Flow (7 Stages)
  const steps = [
    { num: '1', title: 'IDENTIFY', desc: 'Screen competitive spend with >= 3 qualified vendors' },
    { num: '2', title: 'QUALIFY', desc: 'Verify plant QA specs and supplier capacity limits' },
    { num: '3', title: 'STRUCTURE', desc: 'Define plant lotting rules and reserve baseline pricing' },
    { num: '4', title: 'RUN', desc: 'Choreograph dynamic live reverse auction bidding' },
    { num: '5', title: 'NEGOTIATE', desc: 'Final commercial alignment and volume confirmations' },
    { num: '6', title: 'CONTRACT', desc: 'Execute master rate contracts and supply SLAs' },
    { num: '7', title: 'REALIZE', desc: 'Audit invoice pricing against auction award rates' }
  ];

  const stepW = 116;
  const stepH = 130;
  const startY = 104;

  steps.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (stepW + 8);
    canvas.rect(x, startY, stepW, stepH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, stepW, 3, { fill: BRAND_COLORS.procucevBlue });
    canvas.text(`STAGE ${st.num}`, x + 10, startY + 22, {
      fontSize: 8.5,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    canvas.text(st.title, x + 10, startY + 44, {
      fontSize: 11,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(st.desc, x + 10, startY + 64, stepW - 20, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 12
    });
  });

  // Commercial Governance & Execution Principles
  const govY = 254;
  const govW = 424;
  const govH = 150;

  // Left Card: Controlled Volume Allocation
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, govY, govW, govH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, govY, govW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    'COMMERCIAL SOURCING RULEBOOK',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    govY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    'Use controlled volume allocation across qualified suppliers based on competition, capacity, risk and ' +
    'commercial outcome. Rather than winner-take-all bidding, multi-supplier volume allocation ensures operational ' +
    'supply continuity across all 26 plant sites.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    govY + 48,
    govW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Right Card: Proven Value & Category Applicability
  const rightGovX = PDF_LAYOUT.CONTENT_LEFT + govW + 16;
  canvas.rect(rightGovX, govY, govW, govH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightGovX, govY, govW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'E-AUCTION OPPORTUNITY POOL: ₹31.50 Cr',
    rightGovX + 20,
    govY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'E-auction is strictly an execution mechanism to capture verified market pricing. Applicable to highly liquid ' +
    'categories including HDPE packing bags (₹14.50 Cr), secondary logistics freight routes (₹9.60 Cr), and ' +
    'standardized grinding balls (₹7.40 Cr).',
    rightGovX + 20,
    govY + 48,
    govW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('EXECUTION SAFEGUARDS', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'Dynamic reverse auctions are never run cold. Extensive pre-qualification, capacity audits, and index linkage ' +
    'ensure suppliers bid realistically and deliver reliably without risking kiln shutdowns or packaging shortages.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
