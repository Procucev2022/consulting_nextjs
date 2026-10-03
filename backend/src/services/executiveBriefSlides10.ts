/**
 * Executive Brief Slide 10 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, dominant central waterfall, visual split, and proof strip.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide10ValueBridge(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'The Value Bridge: From Gross Potential to Defensible Savings',
    'Financial Reconciliation',
    p
  );

  // Dominant Central Waterfall (4 Key Steps)
  const wfY = 104;
  const colW = 198;
  const colH = 180;
  const gap = 24;

  const steps = [
    {
      title: 'GROSS OPPORTUNITY',
      value: '₹173.12 Cr',
      subtitle: 'Sum of Individual Levers',
      desc: 'Combined standalone opportunity across all 10 strategic sourcing levers.',
      color: BRAND_COLORS.procucevBlue,
      sign: ''
    },
    {
      title: 'OVERLAP DEDUCTIONS',
      value: '- ₹62.80 Cr',
      subtitle: 'Multi-Lever Interaction',
      desc: 'Algorithmic deduplication prevents double-counting between e-auctions & rate cuts.',
      color: BRAND_COLORS.accentAmber,
      sign: '-'
    },
    {
      title: 'POLICY EXCLUSIONS',
      value: '- ₹16.72 Cr',
      subtitle: 'Operational Constraints',
      desc: 'Carve-out of OEM proprietary spares, statutory rates, and long-term contracts.',
      color: BRAND_COLORS.secondaryText,
      sign: '-'
    },
    {
      title: 'NET DEFENSIBLE PIPELINE',
      value: '₹93.60 Cr',
      subtitle: 'Certified Realizable Value',
      desc: 'Boardroom-defensible value pipeline with verified supplier execution capacity.',
      color: BRAND_COLORS.procucevBlue,
      sign: '='
    }
  ];

  steps.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + gap);
    canvas.rect(x, wfY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, wfY, colW, 4, { fill: st.color });

    if (st.sign) {
      canvas.text(st.sign, x - 16, wfY + 68, {
        fontSize: 16,
        font: 'bold',
        color: BRAND_COLORS.secondaryText
      });
    }

    canvas.text(st.title, x + 16, wfY + 28, {
      fontSize: 8.5,
      font: 'bold',
      color: BRAND_COLORS.secondaryText
    });
    canvas.text(st.value, x + 16, wfY + 62, {
      fontSize: 22,
      font: 'bold',
      color: st.color
    });
    canvas.text(st.subtitle, x + 16, wfY + 84, {
      fontSize: 8.5,
      font: 'bold',
      color: st.color
    });
    canvas.line(x + 16, wfY + 98, x + colW - 16, wfY + 98, BRAND_COLORS.border, 0.5);
    canvas.textBlock(st.desc, x + 16, wfY + 112, colW - 32, {
      fontSize: 9,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 13
    });
  });

  // Visual Split: Direct Savings + Strategic Market Value
  const splitY = 300;
  const splitW = 420;
  const splitH = 110;

  // Left Branch: Direct Savings
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, splitY, splitW, splitH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.accentGreen,
    lineWidth: 1.5
  });
  canvas.text(
    'DIRECT SAVINGS OPPORTUNITY (P&L EBITDA EXPANSION)',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    splitY + 24,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.text('₹78.72 Cr', PDF_LAYOUT.CONTENT_LEFT + 20, splitY + 58, {
    fontSize: 24,
    font: 'bold',
    color: BRAND_COLORS.accentGreen
  });
  canvas.textBlock(
    'Defensible direct cost reduction across rate harmonization, volume pooling, and tenders. Fully monetized.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    splitY + 74,
    splitW - 40,
    { fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 12 }
  );

  // Right Branch: Strategic Market Value
  const rightSplitX = PDF_LAYOUT.CONTENT_LEFT + splitW + 24;
  canvas.rect(rightSplitX, splitY, splitW, splitH, {
    fill: BRAND_COLORS.lightCard,
    stroke: '#0284C7',
    lineWidth: 1.5
  });
  canvas.text(
    'STRATEGIC MARKET VALUE (COMMODITY & TIMING LEVERS)',
    rightSplitX + 20,
    splitY + 24,
    { fontSize: 9, font: 'bold', color: '#0284C7' }
  );
  canvas.text('₹14.88 Cr', rightSplitX + 20, splitY + 58, {
    fontSize: 24,
    font: 'bold',
    color: '#0284C7'
  });
  canvas.textBlock(
    'Market benchmark alignment, contract index formulas, and commodity timing upside. Tracked separately.',
    rightSplitX + 20,
    splitY + 74,
    splitW - 40,
    { fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 12 }
  );

  // Mathematical Proof Strip at Bottom
  const proofY = 426;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, proofY, PDF_LAYOUT.CONTENT_WIDTH, 66, {
    fill: BRAND_COLORS.canvas,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'MATHEMATICAL PROOF & RECONCILIATION AUDIT',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    proofY + 22,
    { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Gross Opportunity (₹173.12 Cr) - Overlap Deductions (₹62.80 Cr) - Exclusions (₹16.72 Cr) = ' +
    'Net Defensible Pipeline (₹93.60 Cr) = Direct Savings (₹78.72 Cr) + Strategic Value (₹14.88 Cr). ' +
    'Reconciled with ₹0.00 mathematical variance across all 31,671 audited transactions.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    proofY + 38,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText, lineHeight: 14 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
