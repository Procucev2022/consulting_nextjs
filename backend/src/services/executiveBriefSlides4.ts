/**
 * Executive Brief Slide 4 - Capabilities (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 6-stage journey, 2-row capability matrix.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide4Capabilities(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'Procurement Value Architecture & Sourcing Competencies',
    'Enterprise Capabilities',
    p
  );

  // Horizontal Six-Stage Journey
  const stageW = 138;
  const stageH = 100;
  const stageY = 104;

  const stages = [
    { n: '1', name: 'DIAGNOSE', out: 'Cleanse & map 100% invoice spend' },
    { n: '2', name: 'STRATEGIZE', out: 'Prioritize levers & market benchmarks' },
    { n: '3', name: 'SOURCE', out: 'Dynamic e-auctions & volume pooling' },
    { n: '4', name: 'EXECUTE', out: 'Lock in supplier contracts & SLAs' },
    { n: '5', name: 'REALIZE', out: 'Track invoice rates against baseline' },
    { n: '6', name: 'MONITOR', out: 'Audit price creep & contract leakage' }
  ];

  stages.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (stageW + 7);
    canvas.rect(x, stageY, stageW, stageH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, stageY, stageW, 3, { fill: BRAND_COLORS.procucevBlue });
    canvas.text(`STAGE ${st.n}`, x + 12, stageY + 22, {
      fontSize: 8.5,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    canvas.text(st.name, x + 12, stageY + 42, {
      fontSize: 11,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(st.out, x + 12, stageY + 60, stageW - 20, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 12
    });
  });

  // 10 Specialized Procurement Competencies (Clean 2-Row Capability Matrix)
  canvas.text(
    '10 SPECIALIZED STRATEGIC PROCUREMENT COMPETENCIES',
    PDF_LAYOUT.CONTENT_LEFT,
    228,
    { fontSize: TYPOGRAPHY.sectionLabelSize, font: 'bold', color: BRAND_COLORS.primaryText }
  );

  const compW = 166;
  const compH = 118;
  const competencies = [
    { num: '01', name: 'Direct Price Improvement', desc: 'Harmonize divergent multi-plant rates on identical SKUs.' },
    { num: '02', name: 'Volume Aggregation', desc: 'Pool national plant demand to secure Tier-1 OEM factory pricing.' },
    { num: '03', name: 'E-Auction Dynamic Bidding', desc: 'Choreograph reverse auctions for true price discovery.' },
    { num: '04', name: 'Vendor Base Consolidation', desc: 'Rationalize tail suppliers into structured preferred panels.' },
    { num: '05', name: 'Payment Terms Alignment', desc: 'Harmonize payment cycles to optimize operating working capital.' },
    { num: '06', name: 'Category Specialization', desc: 'Deploy technical sourcing strategies tailored by commodity.' },
    { num: '07', name: 'Logistics Optimization', desc: 'Rationalize packaging specs, transport routes and freight tiers.' },
    { num: '08', name: 'Specification Harmonization', desc: 'Standardize material grades across regional operating units.' },
    { num: '09', name: 'Contract Compliance Audit', desc: 'Automate invoice audit to eliminate unapproved price leakage.' },
    { num: '10', name: 'PCBI Market Indexing', desc: 'Link volatile energy and chemical inputs to market indices.' }
  ];

  competencies.forEach((comp, idx) => {
    const row = Math.floor(idx / 5);
    const col = idx % 5;
    const x = PDF_LAYOUT.CONTENT_LEFT + col * (compW + 8);
    const y = 246 + row * (compH + 8);

    canvas.rect(x, y, compW, compH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.text(comp.num, x + 10, y + 18, {
      fontSize: 9,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });
    canvas.text(comp.name, x + 10, y + 36, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(comp.desc, x + 10, y + 54, compW - 20, {
      fontSize: 8.5,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 12
    });
  });

  canvas.renderFooter(clientName, conf, p, total);
}
