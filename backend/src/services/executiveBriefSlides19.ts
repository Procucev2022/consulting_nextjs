/**
 * Executive Brief Slide 19 - Volume Aggregation (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 3 high-value before/after cards.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide19VolumeAggregation(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Volume Aggregation: National Demand Pooling on Standardized Specs', 'Scale Sourcing', p);

  // 3 High-Value Examples with Before/After Visual
  const cardW = 276;
  const cardH = 300;
  const startY = 104;

  const examples = [
    {
      title: 'HDPE PACKAGING BAGS',
      spec: '50kg Laminated Cement Sacks',
      before: '24 plants buying fragmented lots from 18 regional converters at ₹16.40/pc avg.',
      interv: 'Pool 320 Million Bags into national master tender benchmarked to Platts PP index.',
      after: 'Harmonized ₹14.80/pc factory contract with Tier-1 polymer converters.',
      saving: '₹14.50 Cr Validated Saving',
      color: BRAND_COLORS.procucevBlue
    },
    {
      title: 'GRINDING MEDIA BALLS',
      spec: 'High Chrome Alloy Steel 70mm',
      before: '18 plants issuing 200-500 MT orders at disparate rates up to ₹89/kg.',
      interv: 'Consolidate 14,200 MT national demand package direct to primary alloy mills.',
      after: 'Harmonized ₹76/kg contract rate with staged quarterly plant delivery.',
      saving: '₹11.20 Cr Validated Saving',
      color: BRAND_COLORS.accentGreen
    },
    {
      title: 'INDUSTRIAL LUBRICANTS',
      spec: 'Heavy Synthetic Gear & Mill Oils',
      before: '14 fragmented plant orders across 6 disparate local distributor brands.',
      interv: 'Standardize to 3 high-performance synthetic grades via direct OEM refinery pact.',
      after: 'Master agreement securing 15% tier discount and bulk ISO container delivery.',
      saving: '₹6.40 Cr Validated Saving',
      color: '#0284C7'
    }
  ];

  examples.forEach((ex, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (cardW + 18);
    canvas.rect(x, startY, cardW, cardH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, cardW, 4, { fill: ex.color });

    canvas.text(ex.title, x + 16, startY + 28, { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(ex.spec, x + 16, startY + 44, { fontSize: 8.5, color: BRAND_COLORS.secondaryText });

    // Before Box
    canvas.rect(x + 16, startY + 60, cardW - 32, 48, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text('CURRENT STATE:', x + 24, startY + 76, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.textBlock(ex.before, x + 24, startY + 90, cardW - 48, {
      fontSize: 8.5,
      color: BRAND_COLORS.primaryText,
      lineHeight: 11
    });

    // Intervention Box
    canvas.rect(x + 16, startY + 116, cardW - 32, 48, { fill: '#EFF6FF', stroke: '#BFDBFE', lineWidth: 0.5 });
    canvas.text('PROCUCEV INTERVENTION:', x + 24, startY + 132, {
      fontSize: 8,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    canvas.textBlock(ex.interv, x + 24, startY + 146, cardW - 48, {
      fontSize: 8.5,
      color: BRAND_COLORS.procucevBlue,
      lineHeight: 11
    });

    // After Box
    canvas.rect(x + 16, startY + 172, cardW - 32, 48, { fill: '#ECFDF5', stroke: '#A7F3D0', lineWidth: 0.5 });
    canvas.text('TARGET OUTCOME:', x + 24, startY + 188, {
      fontSize: 8,
      font: 'bold',
      color: BRAND_COLORS.accentGreen
    });
    canvas.textBlock(ex.after, x + 24, startY + 202, cardW - 48, {
      fontSize: 8.5,
      color: BRAND_COLORS.accentGreen,
      lineHeight: 11
    });

    // Validated Saving Pill
    canvas.rect(x + 16, startY + 236, cardW - 32, 44, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.text(ex.saving, x + 24, startY + 264, { fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'SPECIFICATION STANDARDIZATION AUDIT MANDATE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Volume aggregation is evaluated strictly on identical technical specifications and validated manufacturer ' +
    'capacity. Demand is never arbitrarily grouped across dissimilar grades. Pooling recurring spend unlocks Tier-1 pricing.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
