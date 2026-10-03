/**
 * Executive Brief Slides 11 to 12 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, spend architecture, and Pareto visual.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide11SpendTaxonomy(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Module 1 - Spend Intelligence: Taxonomy & Category Architecture',
    'Spend Architecture',
    p
  );

  // Top Spend Categories with Visual Bars
  const categories = [
    { name: 'Raw Materials & Clinker Additives', spend: 1894.51, pct: 32.0, color: BRAND_COLORS.procucevBlue },
    { name: 'Fuel, Energy & Plant Power', spend: 1480.09, pct: 25.0, color: BRAND_COLORS.accentAmber },
    { name: 'Packaging, HDPE Bags & Consumables', spend: 947.26, pct: 16.0, color: BRAND_COLORS.accentGreen },
    { name: 'Logistics, Bulk Terminals & Freight', spend: 828.85, pct: 14.0, color: '#0284C7' },
    { name: 'Plant Maintenance, Spares & Grinding Media', spend: 769.64, pct: 13.0, color: '#6366F1' }
  ];

  const barY = 104;
  const barH = 34;
  const rowGap = 16;
  const maxW = 540;

  categories.forEach((cat, idx) => {
    const y = barY + idx * (barH + rowGap);

    canvas.text(cat.name, PDF_LAYOUT.CONTENT_LEFT, y + 16, {
      fontSize: 10,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.text(
      `₹${cat.spend.toFixed(2)} Cr (${cat.pct.toFixed(1)}%)`,
      PDF_LAYOUT.CONTENT_LEFT,
      y + 30,
      { fontSize: 8.5, color: BRAND_COLORS.secondaryText }
    );

    const bX = PDF_LAYOUT.CONTENT_LEFT + 240;
    canvas.rect(bX, y, maxW, barH, { fill: BRAND_COLORS.canvas, stroke: BRAND_COLORS.border, lineWidth: 0.5 });
    const fillW = (maxW * cat.pct) / 35;
    canvas.rect(bX, y, fillW, barH, { fill: cat.color });
    canvas.text(`${cat.pct.toFixed(1)}%`, bX + fillW + 10, y + 22, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
  });

  // Right Side Summary Box
  const sumX = PDF_LAYOUT.CONTENT_LEFT + 620;
  const sumW = 244;
  canvas.rect(sumX, barY, sumW, 280, { fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1 });
  canvas.rect(sumX, barY, sumW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text('TOTAL SPEND EVALUATED', sumX + 16, barY + 30, {
    fontSize: 8.5,
    font: 'bold',
    color: BRAND_COLORS.secondaryText
  });
  canvas.text('₹5,920.35 Cr', sumX + 16, barY + 60, {
    fontSize: 20,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.text('256 MATERIAL GROUPS', sumX + 16, barY + 84, {
    fontSize: 8.5,
    font: 'bold',
    color: BRAND_COLORS.secondaryText
  });
  canvas.textBlock(
    'Categorized into hierarchical procurement taxonomy. 100% of line-item invoices cleansed and mapped to UNSPSC Level 4 standards.',
    sumX + 16,
    barY + 110,
    sumW - 32,
    { fontSize: 9, color: BRAND_COLORS.secondaryText, lineHeight: 14 }
  );

  // Bottom Takeaway Strip
  const botY = 410;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, botY, PDF_LAYOUT.CONTENT_WIDTH, 80, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('STRATEGIC SOURCING IMPLICATION', PDF_LAYOUT.CONTENT_LEFT + 20, botY + 24, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'Top 3 categories (Raw Materials, Energy, and Packaging) account for 73.0% of total spend (₹4,321.86 Cr). ' +
    'Concentrating dynamic sourcing and index contracting on these 3 clusters unlocks >70% of identified direct value.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    botY + 44,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide12ParetoSpend(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Where the Money Goes: Pareto Spend Concentration Visualizations', 'Concentration Risk', p);

  // 3 Visual Pareto Cards (Category, Supplier, SKU)
  const cardW = 276;
  const cardH = 300;
  const cY = 104;

  const paretoCards = [
    {
      title: 'CATEGORY CONCENTRATION',
      sub: 'Top 15 Categories = 78.4% of Spend',
      stat: '₹4,641.55 Cr',
      pct: 78.4,
      desc: 'Spend is heavily clustered in core industrial inputs (limestone, coal, petcoke, PP packaging, and freight). High category focus yields outsized commercial return.',
      color: BRAND_COLORS.procucevBlue
    },
    {
      title: 'SUPPLIER CONCENTRATION',
      sub: 'Top 62 Suppliers = 81.4% of Spend',
      stat: '₹4,819.17 Cr',
      pct: 81.4,
      desc: 'Top 6.4% of supplier base accounts for 81.4% of spend. Enables high-leverage strategic partnerships and bilateral e-auctions without spreading bandwidth thin.',
      color: BRAND_COLORS.accentGreen
    },
    {
      title: 'SKU / ITEM CONCENTRATION',
      sub: 'Top 18% SKUs = 84.2% of Spend',
      stat: '3,120 Active SKUs',
      pct: 84.2,
      desc: 'High concentration across standardized recurring items. Rationalizing minor specification variations across operating units unlocks national volume pooling.',
      color: '#0284C7'
    }
  ];

  paretoCards.forEach((cd, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (cardW + 18);
    canvas.rect(x, cY, cardW, cardH, { fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1 });
    canvas.rect(x, cY, cardW, 4, { fill: cd.color });
    canvas.text(cd.title, x + 16, cY + 30, { fontSize: 9.5, font: 'bold', color: cd.color });
    canvas.text(cd.sub, x + 16, cY + 50, { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.text(cd.stat, x + 16, cY + 86, { fontSize: 20, font: 'bold', color: BRAND_COLORS.primaryText });

    // Progress bar visualization
    canvas.rect(x + 16, cY + 104, cardW - 32, 14, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    const fW = ((cardW - 32) * cd.pct) / 100;
    canvas.rect(x + 16, cY + 104, fW, 14, { fill: cd.color });

    canvas.textBlock(cd.desc, x + 16, cY + 140, cardW - 32, {
      fontSize: 10,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('PARETO SOURCING STRATEGY', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'Targeting commercial negotiations, volume pooling, and dynamic e-auctions at the top 10% suppliers ' +
    'and top 15 categories captures 81.4% of total potential while minimizing operational burden on plant teams.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
