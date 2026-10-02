/**
 * Executive Brief Slides 5 to 6 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, company scale, and strategic alignment map.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide5UnderstandingClient(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(`Operating Scale & Procurement Implications: ${clientName}`, 'Client Context', p);

  // Left: UltraTech at Scale (4 Large Facts)
  const leftW = 416;
  const leftY = 106;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 376, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text('ULTRATECH AT SCALE', PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 30, {
    fontSize: TYPOGRAPHY.cardLabelSize,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });

  const facts = [
    { stat: '152.7 MTPA', label: 'Grey Cement Capacity', desc: 'Largest cement producer in India; top 3 globally.' },
    { stat: '24', label: 'Integrated Plants', desc: 'Major industrial production centers across all four zones.' },
    { stat: '33', label: 'Grinding Units', desc: 'Distributed regional processing and blending infrastructure.' },
    { stat: '8', label: 'Bulk Terminals', desc: 'Port terminals enabling multimodal coastal and rail distribution.' }
  ];

  facts.forEach((fc, idx) => {
    const fY = leftY + 52 + idx * 76;
    canvas.text(fc.stat, PDF_LAYOUT.CONTENT_LEFT + 24, fY + 22, {
      fontSize: 20,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.text(fc.label, PDF_LAYOUT.CONTENT_LEFT + 24, fY + 40, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.secondaryText
    });
    canvas.text(fc.desc, PDF_LAYOUT.CONTENT_LEFT + 24, fY + 55, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText
    });
  });

  // Right: Procurement Implications (4 Concise Implications)
  const rightX = PDF_LAYOUT.CONTENT_LEFT + leftW + 24;
  const rightW = 424;
  canvas.rect(rightX, leftY, rightW, 376, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightX, leftY, rightW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text('PROCUREMENT IMPLICATIONS FOR VALUE DISCOVERY', rightX + 24, leftY + 30, {
    fontSize: TYPOGRAPHY.cardLabelSize,
    font: 'bold',
    color: BRAND_COLORS.accentGreen
  });

  const implications = [
    {
      title: 'Inter-Plant Variance',
      desc: 'Decentralized local buying across 26 units leads to substantial unit-price divergence.'
    },
    {
      title: 'Unmatched Volume Scale',
      desc: 'National demand pooling unlocks Tier-1 OEM factory pricing across packaging, media, and chemicals.'
    },
    {
      title: 'Tail Spend Fragmentation',
      desc: '912 vendors in the spend tail dilute purchasing power and generate disproportionate PO load.'
    },
    {
      title: 'Commodity Volatility',
      desc: 'Fuel and power inputs require dynamic index-linked contracts to lock in favorable market troughs.'
    }
  ];

  implications.forEach((imp, idx) => {
    const iY = leftY + 52 + idx * 76;
    canvas.text(imp.title, rightX + 24, iY + 18, {
      fontSize: 11,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(imp.desc, rightX + 24, iY + 36, rightW - 48, {
      fontSize: 9.5,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 14
    });
  });

  // Sources footer
  canvas.text(
    'Sources: UltraTech Public Annual Reports, Investor Presentations, and Invoiced Transaction Data.',
    PDF_LAYOUT.CONTENT_LEFT,
    498,
    { fontSize: TYPOGRAPHY.footerSize, color: BRAND_COLORS.secondaryText }
  );

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide6WhyProcurementMatters(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Strategic Alignment: Procurement Value Creation Map', 'Strategic Alignment', p);

  // 5-Row Strategic Alignment Map
  const mapY = 104;
  const rowH = 54;
  const rows = [
    {
      char: 'Decentralized Multi-Plant Network',
      imp: 'Autonomous plant buying leads to regional rate divergence',
      hyp: 'Rate harmonization across 26 units captures ₹42.80 Cr'
    },
    {
      char: 'Capital-Intensive Logistics & Freight',
      imp: 'High freight sensitivity with multiple carrier contracts',
      hyp: 'Dynamic e-auctions capture ₹31.50 Cr across freight & packing'
    },
    {
      char: 'Fragmented Tail Vendor Base',
      imp: '912 tail suppliers drive heavy operational processing load',
      hyp: 'Vendor rationalization yields ₹26.40 Cr indicative value'
    },
    {
      char: 'High Input Commodity Volatility',
      imp: 'Coal, petcoke, and additives expose EBITDA to market swings',
      hyp: 'PCBI index formulas deliver ₹14.88 Cr strategic market upside'
    },
    {
      char: 'Specification Diversity Across Units',
      imp: 'Duplicate SKU specs prevent national volume aggregation',
      hyp: 'National spec pooling captures ₹22.10 Cr OEM volume pricing'
    }
  ];

  rows.forEach((rw, idx) => {
    const y = mapY + idx * (rowH + 10);
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, y, PDF_LAYOUT.CONTENT_WIDTH, rowH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });

    // Col 1: Industrial Characteristic
    canvas.text(rw.char, PDF_LAYOUT.CONTENT_LEFT + 16, y + 22, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.text('Industrial Characteristic', PDF_LAYOUT.CONTENT_LEFT + 16, y + 40, {
      fontSize: 8,
      color: BRAND_COLORS.secondaryText
    });

    // Arrow 1
    canvas.text('->', PDF_LAYOUT.CONTENT_LEFT + 250, y + 30, {
      fontSize: 14,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });

    // Col 2: Procurement Implication
    canvas.textBlock(rw.imp, PDF_LAYOUT.CONTENT_LEFT + 280, y + 16, 260, {
      fontSize: 9,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 13
    });

    // Arrow 2
    canvas.text('->', PDF_LAYOUT.CONTENT_LEFT + 555, y + 30, {
      fontSize: 14,
      font: 'bold',
      color: BRAND_COLORS.accentGreen
    });

    // Col 3: Value Hypothesis
    canvas.textBlock(rw.hyp, PDF_LAYOUT.CONTENT_LEFT + 580, y + 16, 260, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue,
      lineHeight: 14
    });
  });

  // Single Premium Executive Hypothesis Callout
  const calloutY = 432;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, calloutY, PDF_LAYOUT.CONTENT_WIDTH, 62, {
    fill: '#EFF6FF',
    stroke: BRAND_COLORS.procucevBlue,
    lineWidth: 1.5
  });
  canvas.text('EXECUTIVE HYPOTHESIS', PDF_LAYOUT.CONTENT_LEFT + 20, calloutY + 20, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.textBlock(
    'UltraTech can capture ₹78.72 Cr in net direct recurring cost reductions within 24 months ' +
    'without operational disruption through systematic cross-plant rate alignment and supplier consolidation.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    calloutY + 36,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText, lineHeight: 14 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
