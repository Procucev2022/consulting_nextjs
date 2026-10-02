/**
 * Executive Brief Slides 20 to 21 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, PCBI coverage and market benchmark findings.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide20PCBICoverage(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 3 - PCBI Benchmark Coverage & Market Alignment', 'Market Intelligence', p);

  // 4 Hero Benchmark Metrics
  const cardW = 207;
  const cardH = 92;
  const startY = 104;

  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT,
    startY,
    cardW,
    cardH,
    'PCBI Covered Spend',
    '₹1,480.00 Cr',
    'Key Industrial Commodities',
    BRAND_COLORS.procucevBlue
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 219,
    startY,
    cardW,
    cardH,
    'Benchmark Indices',
    '28 Commodity Indices',
    'Coal, Petcoke, Polymer, Steel',
    BRAND_COLORS.accentGreen
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 438,
    startY,
    cardW,
    cardH,
    'Index Correlation',
    '94.2% Market R2',
    'Empirical Landing Price Match',
    '#0284C7'
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 657,
    startY,
    cardW,
    cardH,
    'Strategic Market Value',
    '₹14.88 Cr',
    'Contract Timing & Formula Reset',
    BRAND_COLORS.accentAmber
  );

  // Methodology & Architecture Grid
  const gridY = 216;
  const gridW = 424;
  const gridH = 186;

  // Left Box: Independent Market Data
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, gridY, gridW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'INDEPENDENT COMMODITY INTELLIGENCE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    gridY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'PCBI benchmarks consume external import customs clearance filings, port handling manifests, domestic mining ' +
    'index updates, and published physical commodity exchange transactions. Data feeds are independent and updated.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    gridY + 50,
    gridW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Right Box: Technical Data Isolation
  const rightGridX = PDF_LAYOUT.CONTENT_LEFT + gridW + 16;
  canvas.rect(rightGridX, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightGridX, gridY, gridW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    'STRICT TECHNICAL DATA ISOLATION',
    rightGridX + 20,
    gridY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    'Customer purchase transactions NEVER enter PCBI benchmark series. There is zero risk of data leakage or ' +
    'cross-customer contamination. Benchmarks serve as an external commercial beacon to measure purchasing cycles.',
    rightGridX + 20,
    gridY + 50,
    gridW - 40,
    { fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15 }
  );

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.canvas,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('MARKET ALIGNMENT STRATEGY', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'PCBI index correlation enables UltraTech to convert fixed-price commodity contracts into formulaic index-linked ' +
    'agreements, capturing ₹14.88 Cr in non-direct strategic market value during down-cycles.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide21PCBIFindings(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('PCBI Benchmark Findings: Customer Purchase Rate vs Market Indices', 'Market Benchmarks', p);

  // Visual Comparison Bars: Customer Rate vs PCBI Reference
  const compW = 276;
  const compH = 300;
  const startY = 104;

  const items = [
    {
      name: 'Imported Petcoke (6.5% S)',
      clientRate: '₹14,200 / MT',
      pcbiRate: '₹13,400 / MT',
      diff: '+5.9% Over PCBI',
      opp: '₹9.80 Cr Strategic Timing',
      desc: 'Customer procurement locked in annual fixed contracts during a temporary spike. Resetting captures declines.',
      color: BRAND_COLORS.accentAmber
    },
    {
      name: 'Domestic Thermal Coal (G11)',
      clientRate: '₹8,650 / MT',
      pcbiRate: '₹8,200 / MT',
      diff: '+5.5% Over PCBI',
      opp: '₹3.62 Cr Contract Reset',
      desc: 'Spot coal buying carries distributor premiums over pithead index plus rail freight. Bilateral linkage helps.',
      color: BRAND_COLORS.procucevBlue
    },
    {
      name: 'PP Granules (Packaging)',
      clientRate: '₹98.50 / kg',
      pcbiRate: '₹94.00 / kg',
      diff: '+4.8% Over PCBI',
      opp: '₹1.46 Cr Formula Linkage',
      desc: 'Bag converter pricing lags raw polymer falls by 60-90 days. Introducing formula contracts enforces pass-through.',
      color: BRAND_COLORS.accentGreen
    }
  ];

  items.forEach((it, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (compW + 18);
    canvas.rect(x, startY, compW, compH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, compW, 4, { fill: it.color });

    canvas.text(it.name, x + 16, startY + 28, { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(it.diff, x + 16, startY + 46, { fontSize: 9, font: 'bold', color: it.color });

    // Rate comparison box
    const boxY = startY + 64;
    canvas.rect(x + 16, boxY, compW - 32, 68, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text('UltraTech Invoiced Rate:', x + 24, boxY + 22, { fontSize: 8, color: BRAND_COLORS.secondaryText });
    canvas.text(it.clientRate, x + 24, boxY + 38, { fontSize: 12, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text('PCBI Index Reference:', x + 24, boxY + 54, { fontSize: 8, color: BRAND_COLORS.secondaryText });
    canvas.text(it.pcbiRate, x + 140, boxY + 54, { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue });

    canvas.textBlock(it.desc, x + 16, startY + 148, compW - 32, {
      fontSize: 9,
      color: BRAND_COLORS.primaryText,
      lineHeight: 14
    });

    canvas.rect(x + 16, startY + 246, compW - 32, 36, {
      fill: '#EFF6FF',
      stroke: BRAND_COLORS.procucevBlue,
      lineWidth: 0.5
    });
    canvas.text(it.opp, x + 24, startY + 268, { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'STRATEGIC MARKET VALUE GOVERNANCE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Total Strategic Market Value of ₹14.88 Cr is tracked separately from Direct Savings (₹78.72 Cr). It reflects ' +
    'commercial timing and formula indexing upside dependent on market movements rather than operational price reduction.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
