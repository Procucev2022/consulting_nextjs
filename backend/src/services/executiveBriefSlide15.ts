/**
 * Executive Brief Slide 15 - Price Dispersion (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, box/range dispersion.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

interface PriceDispersionItem {
  item: string;
  spec: string;
  min: string;
  p25: string;
  med: string;
  p75: string;
  max: string;
  spread: string;
  opp: string;
  desc: string;
}

export function renderSlide15PriceDispersion(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Price Improvement Opportunities: Statistical Percentile Dispersion', 'Price Dispersion', p);

  const isCust = isCustomerAssessment(clientName);

  // Box / Range Visual Cards
  const cardW = 276;
  const cardH = 300;
  const startY = 104;

  const dispersions: PriceDispersionItem[] = isCust
    ? [
        {
          item: 'Synthetic Polyester/Viscose Yarn',
          spec: 'Count 30s/40s Standard Blend',
          min: '₹185/kg',
          p25: '₹196/kg',
          med: '₹212/kg',
          p75: '₹228/kg',
          max: '₹242/kg',
          spread: '23.5% Spread',
          opp: '₹18.25 Cr Proven Saving',
          desc: 'Unit rate dispersion across operating plants shows regional units paying up to ₹228/kg for identical yarn specifications.'
        },
        {
          item: 'Specialty Reactive Dyes & Pigments',
          spec: 'Standard Fastness Formulation',
          min: '₹420/kg',
          p25: '₹450/kg',
          med: '₹495/kg',
          p75: '₹540/kg',
          max: '₹590/kg',
          spread: '28.6% Spread',
          opp: '₹16.41 Cr Proven Saving',
          desc: 'Operating units purchasing identical dye chemistry across multiple brands at disparate distributor rates.'
        },
        {
          item: 'Industrial Corrugated & Poly Packaging',
          spec: 'Multi-Layer Woven Fabric Bags',
          min: '₹18.50/pc',
          p25: '₹19.40/pc',
          med: '₹21.00/pc',
          p75: '₹22.80/pc',
          max: '₹24.50/pc',
          spread: '21.6% Spread',
          opp: '₹9.82 Cr Proven Saving',
          desc: 'Local plant packaging purchases show 21.6% variance. Direct converter framework eliminates distributor markup.'
        }
      ]
    : [
        {
          item: 'Grinding Media High-Chrome Balls',
          spec: 'Size 60mm-90mm, High Alloy Steel',
          min: '₹72/kg',
          p25: '₹76/kg',
          med: '₹82/kg',
          p75: '₹89/kg',
          max: '₹96/kg',
          spread: '26.3% Spread',
          opp: '₹11.20 Cr Validated Saving',
          desc: 'Plant rate dispersion shows southern units buying at ₹76/kg while central units pay ₹89/kg.'
        },
        {
          item: 'HDPE Woven Packaging Bags',
          spec: '50kg Standard Cement Bag Spec',
          min: '₹14.20/pc',
          p25: '₹14.80/pc',
          med: '₹15.60/pc',
          p75: '₹16.40/pc',
          max: '₹17.80/pc',
          spread: '15.4% Spread',
          opp: '₹14.50 Cr Validated Saving',
          desc: '18 converters supplying across 24 plants at disparate negotiated conversion margins.'
        },
        {
          item: 'Secondary Road Logistics Freight',
          spec: 'Standard 25-Ton Truckload, 200km',
          min: '₹2.40/T-km',
          p25: '₹2.65/T-km',
          med: '₹2.90/T-km',
          p75: '₹3.15/T-km',
          max: '₹3.45/T-km',
          spread: '18.9% Spread',
          opp: '₹9.60 Cr Validated Saving',
          desc: 'Corridor rate divergence between dedicated fleet and spot market carriers across identical routes.'
        }
      ];

  dispersions.forEach((d, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (cardW + 18);
    canvas.rect(x, startY, cardW, cardH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, cardW, 4, { fill: BRAND_COLORS.procucevBlue });

    canvas.text(d.item, x + 16, startY + 28, { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(d.spec, x + 16, startY + 44, { fontSize: 8.5, color: BRAND_COLORS.secondaryText });

    // Range visual bar
    const barY = startY + 68;
    canvas.rect(x + 16, barY, cardW - 32, 28, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.rect(x + 50, barY + 4, cardW - 100, 20, { fill: '#EFF6FF' });
    canvas.text(`P25: ${d.p25}`, x + 54, barY + 18, {
      fontSize: 8,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    canvas.text(`Med: ${d.med}`, x + 120, barY + 18, {
      fontSize: 8,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.text(`P75: ${d.p75}`, x + 184, barY + 18, {
      fontSize: 8,
      font: 'bold',
      color: BRAND_COLORS.secondaryText
    });

    canvas.text(`Min: ${d.min}`, x + 16, barY + 46, { fontSize: 7.5, color: BRAND_COLORS.secondaryText });
    canvas.text(`Max: ${d.max}`, x + cardW - 68, barY + 46, { fontSize: 7.5, color: BRAND_COLORS.secondaryText });

    // Spread badge
    canvas.rect(x + 16, startY + 140, cardW - 32, 34, { fill: '#FEF3C7', stroke: '#FDE68A', lineWidth: 0.5 });
    canvas.text(`SPREAD: ${d.spread}`, x + 24, startY + 162, {
      fontSize: 9,
      font: 'bold',
      color: BRAND_COLORS.accentAmber
    });

    // Validated saving
    canvas.rect(x + 16, startY + 184, cardW - 32, 36, { fill: '#ECFDF5', stroke: '#A7F3D0', lineWidth: 0.5 });
    canvas.text(d.opp, x + 24, startY + 207, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.accentGreen
    });

    // Description text
    canvas.textBlock(d.desc, x + 16, startY + 234, cardW - 32, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 12
    });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('STATISTICAL HARMONIZATION STANDARD', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'Procucev sets savings targets to the internal 25th percentile (P25) rate already achieved by top-performing ' +
    'plants, not unrealistic minimums. Because internal units already buy at P25, this rate is 100% operationally proven.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
