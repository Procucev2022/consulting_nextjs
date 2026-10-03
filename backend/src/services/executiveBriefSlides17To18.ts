/**
 * Executive Brief Slides 17 to 18 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, vendor consolidation and PO productivity.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide17VendorConsolidation(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Vendor Base Consolidation: Tail Spend Rationalization & Panelling', 'Vendor Rationalization', p);

  // Visual: Current State -> Intervention -> Target State
  const colW = 276;
  const colH = 296;
  const startY = 104;

  const states = [
    {
      title: 'CURRENT STATE',
      sub: 'Fragmented Tail Base',
      stat: '974 Suppliers',
      metric: '912 Suppliers in Tail (<₹50L)',
      desc: 'Severe vendor fragmentation across operating units. High administrative overhead managing hundreds ' +
            'of single-plant vendors with zero corporate volume leverage.',
      color: BRAND_COLORS.secondaryText
    },
    {
      title: 'PROCUCEV INTERVENTION',
      sub: 'Panelling & Rationalization',
      stat: 'Strategic Panelling',
      metric: 'Master Preferred Tiers',
      desc: 'Deploy regional hub agreements, preferred vendor tiers, and structured panelling for consumable ' +
            'and MRO categories. Establish corporate frame contracts.',
      color: BRAND_COLORS.procucevBlue
    },
    {
      title: 'TARGET STATE',
      sub: 'Streamlined Supplier Network',
      stat: '450 Preferred Vendors',
      metric: '₹26.40 Cr Indicative Value *',
      desc: '50%+ reduction in tail supplier count. Consolidated purchasing volumes unlock higher discount ' +
            'tiers and lower transactional PO processing burden.',
      color: BRAND_COLORS.accentGreen
    }
  ];

  states.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 18);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: st.color });

    canvas.text(st.title, x + 16, startY + 28, { fontSize: 9.5, font: 'bold', color: st.color });
    canvas.text(st.sub, x + 16, startY + 46, { fontSize: 8.5, color: BRAND_COLORS.secondaryText });
    canvas.text(st.stat, x + 16, startY + 80, { fontSize: 20, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(st.metric, x + 16, startY + 104, { fontSize: 9.5, font: 'bold', color: st.color });
    canvas.line(x + 16, startY + 118, x + colW - 16, startY + 118, BRAND_COLORS.border, 0.5);
    canvas.textBlock(st.desc, x + 16, startY + 138, colW - 32, {
      fontSize: 10,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });
  });

  // Bottom Indicative Modelling Assumption Banner
  const banY = 418;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 72, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'MODELLING GOVERNANCE & SOURCING PRINCIPLE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    '* Indicative modelling assumption: The estimated ₹26.40 Cr opportunity from vendor consolidation represents ' +
    'an indicative 5% savings benchmark on tail spend based on industrial precedents. Tail supplier rationalization ' +
    'is phased carefully to protect local plant supply continuity.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 9.5, color: BRAND_COLORS.secondaryText, lineHeight: 14 }
  );

  canvas.renderFooter(clientName, conf, p, total);
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

  // Process Metric Flow (3 Dominant Steps)
  const colW = 276;
  const colH = 170;
  const startY = 104;

  const steps = [
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
    '₹0.00 direct savings monetization for process productivity. All ₹78.72 Cr direct savings reflect unit price cuts.',
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
