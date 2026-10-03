/**
 * Executive Brief Slide 25 - Roadmap (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 4 timeline phases, execution schedule.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide25ExecutionRoadmap(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Priority Execution Roadmap: Phased 90-Day Implementation Timeline',
    'Execution Schedule',
    p
  );

  // 4 Timeline Phases
  const phases = [
    {
      phase: 'DAYS 1-30',
      title: 'Mobilize & Quick Wins',
      target: '₹14.50 Cr Tender Ready',
      color: BRAND_COLORS.accentGreen,
      items: [
        'Form joint Procucev-UltraTech commercial working group',
        'Verify packaging specifications across all 26 operating plants',
        'Issue RFP for 320M HDPE Cement Bags reverse e-auction',
        'Lock in ERP price tolerance thresholds to eliminate spot leakage'
      ]
    },
    {
      phase: 'DAYS 31-60',
      title: 'Market Tenders & Panelling',
      target: '₹25.70 Cr In Process',
      color: BRAND_COLORS.procucevBlue,
      items: [
        'Conduct live multi-plant reverse auction for packaging bags',
        'Harmonize high-chrome grinding media rates to ₹76/kg target',
        'Execute corridor bidding for secondary coal and fly-ash freight',
        'Issue technical RFPs for industrial lubricant consolidation'
      ]
    },
    {
      phase: 'DAYS 61-90',
      title: 'Contract Execution',
      target: '₹47.90 Cr Wave 1 Locked',
      color: '#0284C7',
      items: [
        'Execute master frame agreements with qualified Tier-1 winners',
        'Implement index-linked formula contracts for petcoke and coal',
        'Consolidate 912 tail suppliers into regional master panels',
        'Deploy Procucev invoice tracking dashboard for P&L audit'
      ]
    },
    {
      phase: 'DAYS 90+',
      title: 'Sustained Value Run-Rate',
      target: '₹78.72 Cr Full Run-Rate',
      color: BRAND_COLORS.accentAmber,
      items: [
        'Expand sourcing interventions to Wave 2 mechanical spares',
        'Automate quarterly market index resets across energy contracts',
        'Audit supplier delivery SLAs and invoice compliance monthly',
        'Maintain zero off-contract purchase drift across plant network'
      ]
    }
  ];

  const colW = 207;
  const colH = 300;
  const startY = 104;

  phases.forEach((ph, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 12);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: ph.color });

    canvas.text(ph.phase, x + 16, startY + 28, { fontSize: 9.5, font: 'bold', color: ph.color });
    canvas.text(ph.title, x + 16, startY + 48, { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.line(x + 16, startY + 62, x + colW - 16, startY + 62, BRAND_COLORS.border, 0.5);

    ph.items.forEach((item, iIdx) => {
      canvas.text('-', x + 16, startY + 82 + iIdx * 38, { fontSize: 10, font: 'bold', color: ph.color });
      canvas.textBlock(item, x + 26, startY + 82 + iIdx * 38, colW - 40, {
        fontSize: 8.5,
        color: BRAND_COLORS.primaryText,
        lineHeight: 12
      });
    });

    canvas.rect(x + 12, startY + 242, colW - 24, 44, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(ph.target, x + 20, startY + 268, { fontSize: 9.5, font: 'bold', color: ph.color });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    '90-DAY DEPLOYMENT DISCIPLINE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Phase 1 focuses on pre-qualified initiatives where technical specifications and vendor capacity are fully ' +
    'verified. Plant operations face zero downtime or trial risks. Commercial savings flow directly to operating P&L.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
