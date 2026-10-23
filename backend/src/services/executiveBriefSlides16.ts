/**
 * Executive Brief Slide 16 - E-Auction (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 7-stage methodology, rulebook.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide16EAuction(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Dynamic Reverse E-Auction: Structured 7-Stage Execution Methodology',
    'Dynamic E-Auctions',
    p
  );

  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  // 7-Stage Process Stepper
  const steps = [
    { num: '1', title: 'DISCOVERY', desc: 'Baseline spend audit and vendor market mapping' },
    { num: '2', title: 'CLEANSE', desc: 'Standardize item specs and aggregate volume lots' },
    { num: '3', title: 'QUALIFY', desc: 'Pre-qualify vendors on technical & capacity audits' },
    { num: '4', title: 'CHOREO', desc: 'Design custom dynamic bidding rules & reserve prices' },
    { num: '5', title: 'EXECUTE', desc: 'Host multi-round live dynamic reverse auction event' },
    { num: '6', title: 'ALLOCATE', desc: 'Optimized award split across L1, L2, L3 suppliers' },
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
  const plantCount = isCust ? contract.baselinePlants : 26;
  const leftCardDesc =
    'Use controlled volume allocation across qualified suppliers based on competition, capacity, risk and ' +
    'commercial outcome. Rather than winner-take-all bidding, multi-supplier volume allocation ensures operational ' +
    `supply continuity across all ${plantCount} operating facilities.`;

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
    leftCardDesc,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    govY + 48,
    govW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Right Card: Proven Value & Category Applicability
  const rightGovX = PDF_LAYOUT.CONTENT_LEFT + govW + 16;
  const rightCardTitle = isCust
    ? 'E-AUCTION OPPORTUNITY POOL: ₹28.07 Cr'
    : 'E-AUCTION OPPORTUNITY POOL: ₹31.50 Cr';
  const rightCardDesc = isCust
    ? 'E-auction is strictly an execution mechanism to capture verified market pricing. Applicable to highly liquid ' +
      'categories including synthetic yarns & fibers (₹18.25 Cr), secondary logistics routes (₹5.20 Cr), and ' +
      'standardized packaging materials (₹4.62 Cr).'
    : 'E-auction is strictly an execution mechanism to capture verified market pricing. Applicable to highly liquid ' +
      'categories including HDPE packing bags (₹14.50 Cr), secondary logistics freight routes (₹9.60 Cr), and ' +
      'standardized grinding balls (₹7.40 Cr).';

  canvas.rect(rightGovX, govY, govW, govH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightGovX, govY, govW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    rightCardTitle,
    rightGovX + 20,
    govY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    rightCardDesc,
    rightGovX + 20,
    govY + 48,
    govW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Bottom Takeaway Banner
  const banY = 422;
  const bannerDesc = isCust
    ? 'Dynamic reverse auctions are never run cold. Extensive pre-qualification, capacity audits, and index linkage ' +
      'ensure suppliers bid realistically and deliver reliably without risking plant line shutdowns or production supply shortages.'
    : 'Dynamic reverse auctions are never run cold. Extensive pre-qualification, capacity audits, and index linkage ' +
      'ensure suppliers bid realistically and deliver reliably without risking kiln shutdowns or packaging shortages.';

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
    bannerDesc,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
