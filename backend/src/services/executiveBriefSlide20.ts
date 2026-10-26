/**
 * Executive Brief Slide 20 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, PCBI coverage.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  isCustomerAssessment
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

  const isCust = isCustomerAssessment(clientName);
  const cardW = 207;
  const cardH = 92;
  const startY = 104;

  if (isCust) {
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT,
      startY,
      cardW,
      cardH,
      'PCBI Covered Spend',
      'UNAVAILABLE',
      'Pending Category Benchmark Ingestion',
      BRAND_COLORS.secondaryText
    );
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT + 219,
      startY,
      cardW,
      cardH,
      'Benchmark Indices',
      '0 Active Feeds',
      'Zero external proxy substituted',
      BRAND_COLORS.secondaryText
    );
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT + 438,
      startY,
      cardW,
      cardH,
      'Index Correlation',
      'UNAVAILABLE',
      'Empirical Isolation Maintained',
      '#64748B'
    );
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT + 657,
      startY,
      cardW,
      cardH,
      'Market Value Upside',
      'UNAVAILABLE',
      'Subject to future index calibration',
      '#64748B'
    );
  } else {
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT,
      startY,
      cardW,
      cardH,
      'PCBI Covered Spend',
      'Rs. 4,120 Cr',
      '69.6% of addressable spend',
      BRAND_COLORS.procucevBlue
    );
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT + 219,
      startY,
      cardW,
      cardH,
      'Benchmark Indices',
      '28 Active Feeds',
      'Real-time commodity & price trackers',
      BRAND_COLORS.procucevBlue
    );
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT + 438,
      startY,
      cardW,
      cardH,
      'Index Correlation',
      '84.2%',
      'Portfolio benchmark tracking accuracy',
      BRAND_COLORS.accentGreen
    );
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT + 657,
      startY,
      cardW,
      cardH,
      'Market Value Upside',
      'Rs. 14.88 Cr',
      'Strategic market value identified',
      BRAND_COLORS.accentGreen
    );
  }

  // 2-Column Methodology & Data Isolation Cards
  const gridY = 212;
  const gridW = 428;
  const gridH = 196;

  // Left Box: Coverage Framework
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'PROCUCEV COMMODITY BENCHMARK INDEX (PCBI) SCOPE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    gridY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );

  const pcbiBullets = isCust
    ? [
        '* PCBI Index Tracking: Customer procurement data is segregated under isolated commercial tenancy.',
        '* Zero Surrogate Substitution: No cement or non-relevant demonstration indices are mapped into reports.',
        '* Baseline Provenance: All modelled opportunities derive exclusively from actual ERP transactions and POs.',
        '* Future Benchmark Commissioning: External commodity indices can be integrated during Wave 2 deployment.'
      ]
    : [
        '* PCBI tracks 28 domestic and global commodity indices mapped to organizational spend lines.',
        '* Real-time feeds cover major direct categories, freight rates, energy benchmarks, and packaging indices.',
        '* Enables procurement teams to decouple vendor cost structures into raw material and conversion costs.',
        '* Provides mathematical certainty for price indexing, escalation clauses, and dynamic formula pricing.'
      ];

  pcbiBullets.forEach((bullet, bIdx) => {
    canvas.text(
      bullet,
      PDF_LAYOUT.CONTENT_LEFT + 20,
      gridY + 54 + bIdx * 32,
      { fontSize: 9.5, color: BRAND_COLORS.primaryText }
    );
  });

  // Right Box: Data Isolation Guarantee
  const rightGridX = PDF_LAYOUT.CONTENT_LEFT + 448;
  canvas.rect(rightGridX, gridY, gridW, gridH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'DATA ISOLATION & COMMERCIAL GOVERNANCE',
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
  const takeawayText = isCust
    ? `PCBI benchmark price gap is labeled as UNAVAILABLE for ${clientName} (Assessment ID: AIC-2026-0002). Module 3 isolation prevents substitution of external demonstration indices. Direct and proven savings rely strictly on verified transaction baseline.`
    : 'PCBI index correlation enables customer procurement to convert fixed-price commodity contracts into formulaic index-linked agreements, capturing non-direct strategic market value during down-cycles.';
  canvas.textBlock(
    takeawayText,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
