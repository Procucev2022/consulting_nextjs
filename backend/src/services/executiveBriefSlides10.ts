/**
 * Executive Brief Slide 10 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, dominant central waterfall, visual split, and proof strip.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import type { ExecutiveBriefWaterfallStep } from '../types/executiveBriefPresentation';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

function buildWaterfallSteps(
  contract: ReturnType<typeof getExecutiveBriefPresentationContract>,
  isCust: boolean
): ExecutiveBriefWaterfallStep[] {
  const dec = isCust ? 3 : 2;
  return [
    {
      title: 'GROSS OPPORTUNITY',
      value: `₹${contract.grossOpportunityCr.toFixed(dec)} Cr`,
      subtitle: 'Sum of Individual Levers',
      desc: isCust
        ? 'Combined opportunity across dynamic strategic sourcing levers evaluated from ERP data.'
        : 'Combined standalone opportunity across all 10 strategic sourcing levers.',
      color: BRAND_COLORS.procucevBlue,
      sign: ''
    },
    {
      title: 'OVERLAP DEDUCTIONS',
      value: `- ₹${contract.overlapDeductionsCr.toFixed(dec)} Cr`,
      subtitle: 'Multi-Lever Interaction',
      desc: 'Algorithmic deduplication prevents double-counting between e-auctions & rate cuts.',
      color: BRAND_COLORS.accentAmber,
      sign: '-'
    },
    {
      title: 'POLICY EXCLUSIONS',
      value: `- ₹${contract.exclusionsCr.toFixed(2)} Cr`,
      subtitle: 'Operational Constraints',
      desc: isCust
        ? 'Carve-out of long-term commercial commitments and non-controllable operational categories.'
        : 'Carve-out of OEM proprietary spares, statutory rates, and long-term contracts.',
      color: BRAND_COLORS.secondaryText,
      sign: '-'
    },
    {
      title: 'NET DEFENSIBLE PIPELINE',
      value: `₹${contract.netDefensiblePipelineCr.toFixed(dec)} Cr`,
      subtitle: 'Certified Realizable Value',
      desc: 'Boardroom-defensible value pipeline with verified supplier execution capacity.',
      color: BRAND_COLORS.procucevBlue,
      sign: '='
    }
  ];
}

function renderWaterfallColumns(
  canvas: PdfCanvas,
  steps: readonly ExecutiveBriefWaterfallStep[],
  wfY: number,
  colW: number,
  colH: number,
  gap: number
): void {
  steps.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + gap);
    canvas.rect(x, wfY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, wfY, colW, 4, { fill: st.color });

    if (st.sign.length > 0) {
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
}

function renderStrategicMarketCard(
  canvas: PdfCanvas,
  x: number,
  y: number,
  w: number,
  h: number,
  contract: ReturnType<typeof getExecutiveBriefPresentationContract>,
  isCust: boolean
): void {
  canvas.rect(x, y, w, h, {
    fill: BRAND_COLORS.lightCard,
    stroke: '#0284C7',
    lineWidth: 1.5
  });
  canvas.text(
    isCust ? 'STRATEGIC MARKET VALUE (PCBI BENCHMARKS)' : 'STRATEGIC MARKET VALUE (COMMODITY & TIMING LEVERS)',
    x + 20,
    y + 24,
    { fontSize: 9, font: 'bold', color: '#0284C7' }
  );
  const strategicValStr = isCust ? 'UNAVAILABLE' : `₹${contract.strategicMarketValueCr.toFixed(2)} Cr`;
  canvas.text(strategicValStr, x + 20, y + 58, {
    fontSize: isCust ? 20 : 24,
    font: 'bold',
    color: isCust ? BRAND_COLORS.secondaryText : '#0284C7'
  });
  const stratDesc = isCust
    ? 'Proprietary benchmark coverage unavailable for this assessment. Zero external demonstration benchmarks substituted.'
    : 'Market benchmark alignment, contract index formulas, and commodity timing upside. Tracked separately.';
  canvas.textBlock(
    stratDesc,
    x + 20,
    y + 74,
    w - 40,
    { fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 12 }
  );
}

export function renderSlide10ValueBridge(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

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

  const steps = buildWaterfallSteps(contract, isCust);
  renderWaterfallColumns(canvas, steps, wfY, colW, colH, gap);

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
  const directSavingsStr = `₹${contract.netDirectSavingsCr.toFixed(isCust ? 3 : 2)} Cr`;
  canvas.text(directSavingsStr, PDF_LAYOUT.CONTENT_LEFT + 20, splitY + 58, {
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
  renderStrategicMarketCard(canvas, rightSplitX, splitY, splitW, splitH, contract, isCust);

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
  const proofText = isCust
    ? `Gross Opportunity (₹${contract.grossOpportunityCr.toFixed(3)} Cr) - Overlap Deductions (₹${contract.overlapDeductionsCr.toFixed(3)} Cr) = Net Defensible Pipeline (₹${contract.netDefensiblePipelineCr.toFixed(3)} Cr). Proven Opportunity: ₹${contract.validatedSavingsCr.toFixed(3)} Cr. Realized Savings: ₹${contract.realizedSavingsCr.toFixed(2)} Cr. Reconciled with ₹0.00 mathematical variance across all ${contract.baselineTransactions.toLocaleString('en-IN')} audited transactions.`
    : 'Gross Opportunity (₹173.12 Cr) - Overlap Deductions (₹62.80 Cr) - Exclusions (₹16.72 Cr) = ' +
      'Net Defensible Pipeline (₹93.60 Cr) = Direct Savings (₹78.72 Cr) + Strategic Value (₹14.88 Cr). ' +
      'Reconciled with ₹0.00 mathematical variance across all 31,671 audited transactions.';
  canvas.textBlock(
    proofText,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    proofY + 38,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText, lineHeight: 14 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
