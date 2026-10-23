/**
 * Executive Brief Slide 18 - Process Productivity (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, PO consolidation and productivity.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

interface ProcessStep {
  num: string;
  stat: string;
  title: string;
  desc: string;
  color: string;
}

export function renderSlide18PoConsolidation(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Fewer POs, Less Transactional Effort: PO Consolidation & Specialization',
    'Process Productivity',
    p
  );

  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  // Process Metric Flow (3 Dominant Steps)
  const colW = 276;
  const colH = 170;
  const startY = 104;

  const steps: ProcessStep[] = [
    {
      num: 'STEP 1',
      stat: '824 POs',
      title: 'Low-Value PO Baseline',
      desc: '824 low-value POs (<₹50,000 each) currently issued across plants, driving disproportionate transactional workload.',
      color: BRAND_COLORS.procucevBlue
    },
    {
      num: 'STEP 2',
      stat: '20.0%',
      title: 'Effort Reduction Potential',
      desc: 'Catalog purchasing, vendor panelling, and automated monthly billing eliminate 20% of operational buyer load.',
      color: '#0284C7'
    },
    {
      num: 'STEP 3',
      stat: '₹0.00 Monetized',
      title: 'Zero Direct Savings Booked',
      desc: 'Conservative Governance: Direct cost savings are booked at ₹0.00 until time-motion baseline is verified.',
      color: BRAND_COLORS.accentGreen
    }
  ];

  steps.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 18);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: st.color });

    canvas.text(st.num, x + 16, startY + 26, { fontSize: 8.5, font: 'bold', color: st.color });
    canvas.text(st.stat, x + 16, startY + 60, { fontSize: 24, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(st.title, x + 16, startY + 84, { fontSize: 9.5, font: 'bold', color: st.color });
    canvas.line(x + 16, startY + 98, x + colW - 16, startY + 98, BRAND_COLORS.border, 0.5);
    canvas.textBlock(st.desc, x + 16, startY + 114, colW - 32, {
      fontSize: 9,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 13
    });
  });

  // 2 Strategic Operational Insights
  const insY = 292;
  const insW = 424;
  const insH = 116;

  // Left: Operational Efficiency
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, insY, insW, insH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, insY, insW, 4, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'OPERATIONAL WORKLOAD ELIMINATION',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    insY + 26,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'While 824 low-value POs account for <1% of procurement spend, they generate over 25% of commercial buyer ' +
    'inquiries and invoice processing exceptions. Streamlining these releases team bandwidth for strategic negotiation.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    insY + 48,
    insW - 40,
    { fontSize: 9.5, color: BRAND_COLORS.primaryText, lineHeight: 14 }
  );

  // Right: Conservative Financial Governance
  const rightInsX = PDF_LAYOUT.CONTENT_LEFT + insW + 16;
  const netDirectSavingsStr = isCust
    ? `₹${contract.netDirectSavingsCr.toFixed(3)} Cr`
    : '₹78.72 Cr';

  canvas.rect(rightInsX, insY, insW, insH, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.rect(rightInsX, insY, insW, 4, { fill: BRAND_COLORS.accentGreen });
  canvas.text(
    'STRICT CFO FINANCIAL GOVERNANCE',
    rightInsX + 20,
    insY + 26,
    { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.accentGreen }
  );
  canvas.textBlock(
    'Unlike conventional consulting decks that claim fictitious administrative labor savings, Procucev maintains ' +
    `₹0.00 direct savings monetization for process productivity. All ${netDirectSavingsStr} direct savings reflect unit price cuts.`,
    rightInsX + 20,
    insY + 48,
    insW - 40,
    { fontSize: 9.5, color: BRAND_COLORS.primaryText, lineHeight: 14 }
  );

  // Bottom Takeaway Banner
  const banY = 426;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 64, {
    fill: BRAND_COLORS.canvas,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text('EXECUTIVE PRODUCTIVITY VERDICT', PDF_LAYOUT.CONTENT_LEFT + 20, banY + 22, {
    fontSize: 9,
    font: 'bold',
    color: BRAND_COLORS.procucevBlue
  });
  canvas.text(
    '20.0% processing effort reduction across 824 low-value POs enables existing plant procurement teams to manage ' +
    'Wave 1 strategic initiatives without adding headcount or external contractor expense.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 42,
    { fontSize: 9.5, color: BRAND_COLORS.secondaryText }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
