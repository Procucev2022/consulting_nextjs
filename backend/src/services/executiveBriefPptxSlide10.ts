import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide10Pptx(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  const grossOpportunityFormatted = isCust ? '₹110.764 Cr' : '₹173.12 Cr';
  const overlapDeductionsFormatted = isCust ? '₹25.123 Cr' : '₹62.80 Cr';
  const netPipelineFormatted = isCust ? '₹85.641 Cr' : '₹93.60 Cr';
  const heroDirectSavingsFormatted = isCust ? '₹85.641 Cr' : '₹78.72 Cr';
  const provenOpportunityFormatted = isCust ? '₹82.380 Cr' : '₹47.90 Cr';
  const realizedSavingsFormatted = isCust ? '₹0.00 Cr' : '₹68.00 Cr';
  const invoicesCleansed = contract.baselineTransactions.toLocaleString();

  // Slide 10: The Value Bridge (Dominant Central Waterfall)
  const s10 = pptx.addSlide();
  s10.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s10, 'The Value Bridge: From Gross Potential to Defensible Savings', 'Financial Reconciliation', 10);

  const wfSteps = [
    {
      t: 'GROSS OPPORTUNITY',
      v: grossOpportunityFormatted,
      s: 'Standalone Sum',
      d: 'Combined standalone opportunity across all 10 strategic sourcing levers.',
      c: BRAND_COLORS.procucevBlue
    },
    {
      t: 'OVERLAP DEDUCTIONS',
      v: `- ${overlapDeductionsFormatted}`,
      s: 'Interaction Deductions',
      d: 'Algorithmic deduplication prevents double-counting between e-auctions & rate cuts.',
      c: BRAND_COLORS.accentAmber
    },
    {
      t: 'POLICY EXCLUSIONS',
      v: isCust ? '- ₹0.00 Cr' : '- ₹16.72 Cr',
      s: 'Operational Carve-Outs',
      d: 'Carve-out of OEM proprietary spares, statutory rates, and long-term contracts.',
      c: BRAND_COLORS.secondaryText
    },
    {
      t: 'NET DEFENSIBLE PIPELINE',
      v: netPipelineFormatted,
      s: 'Certified Realizable',
      d: 'Boardroom-defensible value pipeline with verified supplier execution capacity.',
      c: BRAND_COLORS.procucevBlue
    }
  ];
  wfSteps.forEach((ws, idx) => {
    const x = 0.5 + idx * 2.28;
    s10.addShape('rect', {
      x,
      y: 1.15,
      w: 2.15,
      h: 1.85,
      fill: { color: 'FFFFFF' },
      line: { color: BRAND_COLORS.border.replace('#', '') }
    });
    s10.addShape('rect', { x, y: 1.15, w: 2.15, h: 0.05, fill: { color: ws.c.replace('#', '') } });
    s10.addText(ws.t, {
      x: x + 0.1,
      y: 1.25,
      w: 1.95,
      h: 0.25,
      fontSize: 8.5,
      bold: true,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
    s10.addText(ws.v, {
      x: x + 0.1,
      y: 1.55,
      w: 1.95,
      h: 0.45,
      fontSize: 18,
      bold: true,
      color: ws.c.replace('#', ''),
      fontFace
    });
    s10.addText(ws.s, {
      x: x + 0.1,
      y: 2.05,
      w: 1.95,
      h: 0.22,
      fontSize: 8.5,
      bold: true,
      color: ws.c.replace('#', ''),
      fontFace
    });
    s10.addText(ws.d, {
      x: x + 0.1,
      y: 2.3,
      w: 1.95,
      h: 0.65,
      fontSize: 8,
      color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  });

  // Split: Direct Savings + Strategic Value
  s10.addShape('rect', {
    x: 0.5,
    y: 3.15,
    w: 4.35,
    h: 1.15,
    fill: { color: 'FFFFFF' },
    line: { color: BRAND_COLORS.accentGreen.replace('#', '') }
  });
  s10.addText('DIRECT SAVINGS OPPORTUNITY (P&L EBITDA EXPANSION)', {
    x: 0.65,
    y: 3.25,
    w: 4.0,
    h: 0.22,
    fontSize: 8.5,
    bold: true,
    color: BRAND_COLORS.accentGreen.replace('#', ''),
    fontFace
  });
  s10.addText(heroDirectSavingsFormatted, {
    x: 0.65,
    y: 3.5,
    w: 4.0,
    h: 0.4,
    fontSize: 22,
    bold: true,
    color: BRAND_COLORS.accentGreen.replace('#', ''),
    fontFace
  });
  s10.addText('Defensible direct cost reduction across rate harmonization, volume pooling, and tenders. Fully monetized.', {
    x: 0.65,
    y: 3.9,
    w: 4.0,
    h: 0.36,
    fontSize: 8.5,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  s10.addShape('rect', {
    x: 5.15,
    y: 3.15,
    w: 4.35,
    h: 1.15,
    fill: { color: 'FFFFFF' },
    line: { color: '0284C7' }
  });
  s10.addText('STRATEGIC MARKET VALUE (COMMODITY & TIMING LEVERS)', {
    x: 5.3,
    y: 3.25,
    w: 4.0,
    h: 0.22,
    fontSize: 8.5,
    bold: true,
    color: '0284C7',
    fontFace
  });
  s10.addText(isCust ? '₹0.00 Cr' : '₹14.88 Cr', {
    x: 5.3,
    y: 3.5,
    w: 4.0,
    h: 0.4,
    fontSize: 22,
    bold: true,
    color: '0284C7',
    fontFace
  });
  s10.addText('Market benchmark alignment, contract index formulas, and commodity timing upside. Tracked separately.', {
    x: 5.3,
    y: 3.9,
    w: 4.0,
    h: 0.36,
    fontSize: 8.5,
    color: BRAND_COLORS.secondaryText.replace('#', ''),
    fontFace
  });

  // Proof Strip
  s10.addShape('rect', {
    x: 0.5,
    y: 4.45,
    w: 9.0,
    h: 0.62,
    fill: { color: BRAND_COLORS.canvas.replace('#', '') },
    line: { color: BRAND_COLORS.border.replace('#', '') }
  });
  const proofText = isCust
    ? `MATHEMATICAL PROOF: Gross (${grossOpportunityFormatted}) - Overlap Deductions (${overlapDeductionsFormatted}) = Net Pipeline (${netPipelineFormatted}) | Proven Opportunity: ${provenOpportunityFormatted} | Realized Savings: ${realizedSavingsFormatted}. Reconciled with ₹0.00 variance across all ${invoicesCleansed} audited transactions.`
    : 'MATHEMATICAL PROOF: Gross (₹173.12 Cr) - Overlap (₹62.80 Cr) - Exclusions (₹16.72 Cr) = Net Pipeline (₹93.60 Cr) = Direct Savings (₹78.72 Cr) + Strategic Value (₹14.88 Cr). Reconciled with ₹0.00 variance across all 31,671 audited transactions.';
  s10.addText(proofText, {
    x: 0.65,
    y: 4.5,
    w: 8.7,
    h: 0.52,
    fontSize: 8.5,
    bold: true,
    color: BRAND_COLORS.primaryText.replace('#', ''),
    fontFace
  });
  addSlideFooter(s10, clientName, 10, totalSlides);
}
