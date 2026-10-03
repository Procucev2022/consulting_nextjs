/**
 * Executive Brief Slides 26 to 27 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, strategic roadmap and domain authority.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
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
  canvas.text(
    'Target: ₹47.90 Cr Validated + Wave 2 Initiation',
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

  const h1Points = [
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
  canvas.text(
    'Target: Full ₹78.72 Cr Direct Savings Run-Rate',
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

  const h2Points = [
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
    'Transforming UltraTech procurement from decentralized purchasing into a strategic competency ensures ' +
    'permanent structural cost advantages and superior EBITDA margins against cement industry peers.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide27DomainAuthority(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Procucev Domain Authority: Cement & Heavy Manufacturing Provenance', 'Domain Authority', p);

  // 4 Authority Pillars
  const colW = 207;
  const colH = 300;
  const startY = 104;

  const credentials = [
    {
      stat: '₹45,000+ Cr',
      label: 'INDUSTRIAL SPEND AUDITED',
      desc: 'Extensive forensic spend analysis across cement, metals, mining, and heavy process manufacturing.',
      badge: 'Extensive Scale',
      color: BRAND_COLORS.procucevBlue
    },
    {
      stat: 'PCBI Index',
      label: 'PROPRIETARY BENCHMARKS',
      desc: '28 industrial commodity benchmark indices covering imported fuels, chemicals, packaging, and freight.',
      badge: 'Market Intelligence',
      color: BRAND_COLORS.accentGreen
    },
    {
      stat: 'Cement Ops',
      label: 'DEEP SECTOR PLAYBOOKS',
      desc: 'Hands-on category experience across limestone extraction, clinker burning, and bulk bagging terminals.',
      badge: 'Category Mastery',
      color: '#0284C7'
    },
    {
      stat: '100% Audited',
      label: 'P&L CASH REALIZATION',
      desc: 'Turnkey execution model verifying actual rate reductions against ERP payment registers.',
      badge: 'CFO Trust',
      color: BRAND_COLORS.accentAmber
    }
  ];

  credentials.forEach((cr, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 12);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: cr.color });

    canvas.text(cr.stat, x + 16, startY + 36, { fontSize: 20, font: 'bold', color: cr.color });
    canvas.text(cr.label, x + 16, startY + 58, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.line(x + 16, startY + 74, x + colW - 16, startY + 74, BRAND_COLORS.border, 0.5);

    canvas.textBlock(cr.desc, x + 16, startY + 94, colW - 32, {
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });

    canvas.rect(x + 12, startY + 246, colW - 24, 38, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(cr.badge, x + 20, startY + 270, { fontSize: 9, font: 'bold', color: cr.color });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'OPERATIONAL EXECUTION ADVANTAGE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Procucev is not a generalist management consultancy. We deploy procurement practitioners, commodity data ' +
    'scientists, and dynamic auction choreographers who work alongside UltraTech teams to deliver hard EBITDA results.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
