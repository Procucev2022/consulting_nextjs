/**
 * Executive Brief Slides 14 to 15 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 2x2 matrix, and price dispersion box/ranges.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide14OpportunityMap(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 2 - Strategic Sourcing Opportunity Matrix', 'Opportunity Matrix', p);

  // 2x2 Visual Matrix (Spend Impact vs Sourcing Complexity)
  const qW = 424;
  const qH = 180;
  const startY = 104;

  const quadrants = [
    {
      title: 'LEVERAGE / QUICK WINS (HIGH IMPACT, HIGH LIQUIDITY)',
      x: PDF_LAYOUT.CONTENT_LEFT,
      y: startY,
      color: BRAND_COLORS.accentGreen,
      items: [
        'HDPE Packaging Bags E-Auction (Opp: ₹14.50 Cr | Days 1-30)',
        'Grinding Media Rate Harmonization (Opp: ₹11.20 Cr | Days 15-45)',
        'Inbound Secondary Freight Dynamic Tenders (Opp: ₹9.60 Cr | Days 30-60)'
      ],
      action: 'ACTION: Immediate Wave 1 execution via competitive e-auctions.'
    },
    {
      title: 'STRATEGIC CORE (HIGH IMPACT, SPECIALIZED SOURCING)',
      x: PDF_LAYOUT.CONTENT_LEFT + qW + 16,
      y: startY,
      color: BRAND_COLORS.procucevBlue,
      items: [
        'Petcoke & Thermal Coal Index Contracts (Opp: ₹9.80 Cr | Days 45-75)',
        'Vendor Base Tail Consolidation (Opp: ₹26.40 Cr * | Days 60-90)',
        'National Multi-Plant Demand Aggregation (Opp: ₹22.10 Cr | Days 60-90)'
      ],
      action: 'ACTION: Long-term strategic contracts linked to market benchmark indices.'
    },
    {
      title: 'OPERATIONAL POLICY (MODERATE IMPACT, FAST EXECUTION)',
      x: PDF_LAYOUT.CONTENT_LEFT,
      y: startY + qH + 16,
      color: BRAND_COLORS.secondaryText,
      items: [
        'Contract Price Compliance Audit (Opp: ₹4.80 Cr | 30 Days)',
        'Payment Terms Standardization to 60/90 Days (Opp: ₹14.20 Cr | 45 Days)',
        'Standard Consumable SKU Rationalization (Opp: ₹6.30 Cr | 60 Days)'
      ],
      action: 'ACTION: ERP invoice 3-way match controls and catalog mandate.'
    },
    {
      title: 'BOTTLENECK & RISK (CONTROLLED COMMERCIAL INTERVENTION)',
      x: PDF_LAYOUT.CONTENT_LEFT + qW + 16,
      y: startY + qH + 16,
      color: BRAND_COLORS.accentAmber,
      items: [
        'Specialized Instrumentation & Kiln Spares (Dual-source de-risking)',
        'High-Grade Refractory Bricks OEM Sourcing (Opp: ₹6.00 Cr | Days 60-90)',
        'Heavy Mobile Fleet Lubricants Synthetic Standardization (Opp: ₹6.40 Cr)'
      ],
      action: 'ACTION: Technical qualification of second-source manufacturers.'
    }
  ];

  quadrants.forEach((q) => {
    canvas.rect(q.x, q.y, qW, qH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(q.x, q.y, qW, 4, { fill: q.color });
    canvas.text(q.title, q.x + 16, q.y + 24, { fontSize: 8.5, font: 'bold', color: q.color });

    q.items.forEach((item, iIdx) => {
      canvas.text('-', q.x + 16, q.y + 54 + iIdx * 28, { fontSize: 10, font: 'bold', color: q.color });
      canvas.text(item, q.x + 28, q.y + 54 + iIdx * 28, { fontSize: 9.5, color: BRAND_COLORS.primaryText });
    });

    canvas.line(q.x + 16, q.y + 140, q.x + qW - 16, q.y + 140, BRAND_COLORS.border, 0.5);
    canvas.text(q.action, q.x + 16, q.y + 160, { fontSize: 8.5, font: 'bold', color: q.color });
  });

  // Note footer
  canvas.text(
    '* Indicative modelling assumption: Vendor consolidation 5% saving is an indicative modelling benchmark.',
    PDF_LAYOUT.CONTENT_LEFT,
    498,
    { fontSize: 7.5, color: BRAND_COLORS.secondaryText }
  );

  canvas.renderFooter(clientName, conf, p, total);
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

  // Box / Range Visual Cards
  const cardW = 276;
  const cardH = 300;
  const startY = 104;

  const dispersions = [
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
      max: '₹17.90/pc',
      spread: '26.1% Spread',
      opp: '₹14.50 Cr Validated Saving',
      desc: '26 plants procure independently from 18 regional converters. Aggregating captures ₹14.50 Cr.'
    },
    {
      item: 'Heavy Duty Conveyor Belting',
      spec: 'EP-400/3, 800mm-1200mm Width',
      min: '₹3,100/m',
      p25: '₹3,350/m',
      med: '₹3,700/m',
      p75: '₹4,100/m',
      max: '₹4,650/m',
      spread: '50.0% Spread',
      opp: '₹6.20 Cr Validated Saving',
      desc: 'Wide dispersion across plants due to distributors. Direct manufacturer agreements eliminate margin.'
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
    canvas.text(d.spec, x + 16, startY + 44, { fontSize: 8, color: BRAND_COLORS.secondaryText });

    // Range visual
    const rY = startY + 68;
    canvas.rect(x + 16, rY, cardW - 32, 54, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(`P25: ${d.p25}`, x + 24, rY + 22, { fontSize: 9, font: 'bold', color: BRAND_COLORS.accentGreen });
    canvas.text(`Median: ${d.med}`, x + 104, rY + 22, { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue });
    canvas.text(`P75: ${d.p75}`, x + 184, rY + 22, { fontSize: 9, font: 'bold', color: BRAND_COLORS.accentAmber });
    canvas.text(`Min: ${d.min}  |  Max: ${d.max}  (${d.spread})`, x + 24, rY + 42, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText
    });

    canvas.textBlock(d.desc, x + 16, startY + 140, cardW - 32, {
      fontSize: 9,
      color: BRAND_COLORS.primaryText,
      lineHeight: 14
    });

    canvas.rect(x + 16, startY + 242, cardW - 32, 36, {
      fill: '#ECFDF5',
      stroke: BRAND_COLORS.accentGreen,
      lineWidth: 0.5
    });
    canvas.text(d.opp, x + 24, startY + 264, { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('PRICE HARMONIZATION PRINCIPLE', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'Realizing direct savings does not require market disruption. Merely harmonizing plants paying above median ' +
    'rates to the internal 25th percentile rate already achieved by sister units yields ₹42.80 Cr across baseline.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
