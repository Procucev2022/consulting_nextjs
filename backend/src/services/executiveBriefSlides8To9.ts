/**
 * Executive Brief Slides 8 to 9 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 6 insight tiles, and horizontal ranked bars.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide8WhatAnalysisTellsUs(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('What the Analysis Tells Us: Core Diagnostic Insights', 'Diagnostic Insights', p);

  // 6 Large Insight Tiles (Replacing 10-Row Spreadsheet)
  const tileW = 276;
  const tileH = 176;
  const colGap = 18;
  const rowGap = 16;
  const startY = 106;

  const tiles = [
    {
      metric: '100% Categorized',
      label: 'SPEND TAXONOMY INTEGRITY',
      interp: 'Complete taxonomy mapping across all ₹5,920.35 Cr spend with zero unclassified leakage.',
      color: BRAND_COLORS.procucevBlue
    },
    {
      metric: '81.4% Concentrated',
      label: 'TOP 10% SUPPLIER PARETO',
      interp: 'Top 62 suppliers drive 81.4% of total spend, offering immediate national volume pooling potential.',
      color: BRAND_COLORS.accentGreen
    },
    {
      metric: '18.5% Price Variance',
      label: 'INTER-PLANT PRICE INCOHERENCE',
      interp: 'Identical consumable and packaging SKUs purchased at divergent rates across 26 units.',
      color: '#0284C7'
    },
    {
      metric: '42.6% Spot Purchases',
      label: 'NON-CONTRACTED LEAKAGE',
      interp: 'Substantial procurement executed off master agreements without tier volume discounts.',
      color: BRAND_COLORS.accentAmber
    },
    {
      metric: '912 Tail Suppliers',
      label: 'FRAGMENTED SUPPLIER BASE',
      interp: 'Long supplier tail consumes >25% of operational purchasing effort while delivering <5% of spend.',
      color: '#6366F1'
    },
    {
      metric: '₹93.60 Cr Net Pipeline',
      label: 'CONSERVATIVE RECONCILED VALUE',
      interp: 'Defensible procurement opportunity after full deduction of ₹62.80 Cr overlaps and ₹16.72 Cr exclusions.',
      color: BRAND_COLORS.accentGreen
    }
  ];

  tiles.forEach((tile, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const x = PDF_LAYOUT.CONTENT_LEFT + col * (tileW + colGap);
    const y = startY + row * (tileH + rowGap);

    canvas.rect(x, y, tileW, tileH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, y, tileW, 4, { fill: tile.color });
    canvas.text(tile.metric, x + 16, y + 36, { fontSize: 18, font: 'bold', color: tile.color });
    canvas.text(tile.label, x + 16, y + 58, {
      fontSize: 8.5,
      font: 'bold',
      color: BRAND_COLORS.secondaryText
    });
    canvas.textBlock(tile.interp, x + 16, y + 80, tileW - 32, {
      fontSize: 10,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide9WhereValueIsConcentrated(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Where Value is Concentrated: Ranked Opportunity Levers', 'Value Landscape', p);

  // Horizontal Ranked Opportunity Visual (10 Levers)
  const levers = [
    { name: 'Direct Price Improvement', opp: 42.80, pct: 100 },
    { name: 'E-Auction Dynamic Bidding', opp: 31.50, pct: 73.6 },
    { name: 'Vendor Base Consolidation *', opp: 26.40, pct: 61.7 },
    { name: 'Volume Aggregation', opp: 22.10, pct: 51.6 },
    { name: 'Payment Terms Optimization', opp: 14.20, pct: 33.2 },
    { name: 'Category Specialization', opp: 11.80, pct: 27.6 },
    { name: 'Logistics & Packaging Specs', opp: 9.60, pct: 22.4 },
    { name: 'Specification Rationalization', opp: 6.30, pct: 14.7 },
    { name: 'Contract Compliance Audit', opp: 4.80, pct: 11.2 },
    { name: 'PCBI Market Index Contracting', opp: 3.62, pct: 8.5 }
  ];

  const startY = 104;
  const barH = 24;
  const rowGap = 9;
  const maxBarW = 460;

  levers.forEach((lev, idx) => {
    const y = startY + idx * (barH + rowGap);

    // Lever Label
    canvas.text(lev.name, PDF_LAYOUT.CONTENT_LEFT, y + 16, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });

    // Bar background
    const barX = PDF_LAYOUT.CONTENT_LEFT + 220;
    canvas.rect(barX, y, maxBarW, barH, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });

    // Filled bar
    const fillW = (maxBarW * lev.pct) / 100;
    canvas.rect(barX, y, fillW, barH, { fill: BRAND_COLORS.procucevBlue });

    // Value at bar-end
    canvas.text(`₹${lev.opp.toFixed(2)} Cr`, barX + maxBarW + 16, y + 16, {
      fontSize: 10,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
  });

  // Right Side Summary Box
  const sumX = PDF_LAYOUT.CONTENT_LEFT + 710;
  const sumY = startY;
  const sumW = 154;
  canvas.rect(sumX, sumY, sumW, 320, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(sumX, sumY, sumW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text('GROSS OPPORTUNITY', sumX + 12, sumY + 30, {
    fontSize: 8,
    font: 'bold',
    color: BRAND_COLORS.secondaryText
  });
  canvas.text('₹173.12 Cr', sumX + 12, sumY + 58, {
    fontSize: 18,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.text('INDIVIDUAL POTENTIAL', sumX + 12, sumY + 80, {
    fontSize: 8,
    font: 'bold',
    color: BRAND_COLORS.secondaryText
  });
  canvas.textBlock(
    'Individual lever totals reflect gross standalone opportunity. Overlaps are deduplicated in Slide 10.',
    sumX + 12,
    sumY + 104,
    sumW - 24,
    { fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 12 }
  );

  // Disclaimer banner
  const banY = 444;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 48, {
    fill: BRAND_COLORS.canvas,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    '* Indicative modelling assumption: Vendor consolidation 5% saving is an indicative modelling benchmark. ' +
    'E-auction is an execution mechanism.',
    PDF_LAYOUT.CONTENT_LEFT + 16,
    banY + 20,
    { fontSize: 8.5, font: 'regular', color: BRAND_COLORS.secondaryText }
  );
  canvas.text(
    'Gross opportunities are not additive without multi-lever overlap deduplication (see Slide 10 Value Bridge).',
    PDF_LAYOUT.CONTENT_LEFT + 16,
    banY + 36,
    { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.primaryText }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
