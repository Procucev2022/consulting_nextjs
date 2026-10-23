/**
 * Executive Brief Slide 26 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strategic Recommendations: Multi-Year Procurement Roadmap
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment,
  formatPresentationValues
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide26Recommendations(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Strategic Recommendations: Multi-Year Procurement Roadmap', 'Strategic Roadmap', p);

  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  // 2 Horizon Cards: Year 1 vs Year 2
  const horW = 424;
  const horH = 300;
  const startY = 104;

  // Horizon 1: Year 1
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, startY, horW, horH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, startY, horW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    'HORIZON 1: YEAR 1 VALUE CAPTURE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    startY + 28,
    { fontSize: 10, font: 'bold', color: BRAND_COLORS.accentGreen }
  );

  const h1Target = isCust
    ? `Target: ${fmt.provenOpportunityFormatted} Proven + Wave 2 Initiation`
    : 'Target: ₹47.90 Cr Validated + Wave 2 Initiation';

  canvas.text(
    h1Target,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    startY + 48,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.secondaryText }
  );
  canvas.line(
    PDF_LAYOUT.CONTENT_LEFT + 20,
    startY + 62,
    PDF_LAYOUT.CONTENT_LEFT + horW - 20,
    startY + 62,
    BRAND_COLORS.border,
    0.5
  );

  const h1Points = isCust
    ? [
        'Deploy Wave 1 e-auctions across Synthetic Yarns and Specialty Dyes priority lines.',
        'Harmonize process fuel and captive energy contracting terms across all operating plants.',
        'Standardize top 100 consumable SKUs across operating plants and establish 60/90 day terms.',
        'Implement real-time invoice rate verification in ERP to stop off-contract price drift.'
      ]
    : [
        'Deploy Wave 1 e-auctions across Packaging Bags (₹14.50 Cr) and Grinding Media (₹11.20 Cr).',
        'Execute petcoke and domestic coal index formula contracts (₹9.80 Cr strategic timing).',
        'Standardize top 100 consumable SKUs across 26 plants and establish 60/90 day terms.',
        'Implement real-time invoice rate verification in ERP to stop contract price drift.'
      ];

  h1Points.forEach((pt, idx) => {
    canvas.text('1.', PDF_LAYOUT.CONTENT_LEFT + 20, startY + 84 + idx * 48, {
      fontSize: 10,
      font: 'bold',
      color: BRAND_COLORS.accentGreen
    });
    canvas.textBlock(pt, PDF_LAYOUT.CONTENT_LEFT + 36, startY + 84 + idx * 48, horW - 56, {
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText,
      lineHeight: 14
    });
  });

  // Horizon 2: Year 2
  const rightHorX = PDF_LAYOUT.CONTENT_LEFT + horW + 16;
  canvas.rect(rightHorX, startY, horW, horH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightHorX, startY, horW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'HORIZON 2: YEAR 2 RUN-RATE REALIZATION',
    rightHorX + 20,
    startY + 28,
    { fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );

  const h2Target = isCust
    ? `Target: Full ${fmt.netDirectSavingsFormatted} Direct Savings Run-Rate`
    : 'Target: Full ₹78.72 Cr Direct Savings Run-Rate';

  canvas.text(
    h2Target,
    rightHorX + 20,
    startY + 48,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.secondaryText }
  );
  canvas.line(
    rightHorX + 20,
    startY + 62,
    rightHorX + horW - 20,
    startY + 62,
    BRAND_COLORS.border,
    0.5
  );

  const h2Points = isCust
    ? [
        `Consolidate ${contract.baselineSuppliers} vendors into preferred panelling tiers to reduce fragmentation.`,
        'Aggregate multi-plant demand on chemical inputs, packaging materials, and capital equipment.',
        'Automate catalog purchasing across operating units to capture significant process effort reduction.',
        'Embed continuous spend intelligence and rate benchmarking to optimize annual re-contracting windows.'
      ]
    : [
        'Consolidate 912 tail suppliers into preferred panelling tiers (₹26.40 Cr indicative value *).',
        'Aggregate national demand on capital equipment spares and refractory consumables.',
        'Automate catalog purchasing across plants to capture 20% process effort reduction.',
        'Embed continuous PCBI commodity price monitoring to optimize annual re-contracting windows.'
      ];

  h2Points.forEach((pt, idx) => {
    canvas.text('2.', rightHorX + 20, startY + 84 + idx * 48, {
      fontSize: 10,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    canvas.textBlock(pt, rightHorX + 36, startY + 84 + idx * 48, horW - 56, {
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText,
      lineHeight: 14
    });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'STRATEGIC PROCUREMENT VISION',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    `Transforming ${clientName} procurement from decentralized purchasing into a strategic competency ensures ` +
    'permanent structural cost advantages and superior EBITDA margins against industry peers.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
