/**
 * Executive Brief PPTX Slides 1 to 5 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos/Arial typography, official image logo embedding.
 */

import type PptxGenJS from 'pptxgenjs';
import { PPTX_LAYOUT, BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter, addPptxKpiCard, getLogoBase64 } from './executiveBriefPptxHelpers';

export function renderPptxSlides1To5(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;

  // Slide 1: Cover
  const s1 = pptx.addSlide();
  s1.background = { color: BRAND_COLORS.canvas.replace('#', '') };

  // Official Logo Top-Right
  const logoData = getLogoBase64();
  if (logoData) {
    s1.addImage({
      data: logoData,
      x: PPTX_LAYOUT.LOGO_X,
      y: PPTX_LAYOUT.LOGO_Y,
      w: PPTX_LAYOUT.LOGO_W,
      h: PPTX_LAYOUT.LOGO_H
    });
  }

  // Top Visual Line
  s1.addShape('rect', { x: PPTX_LAYOUT.CONTENT_LEFT, y: 0.9, w: PPTX_LAYOUT.CONTENT_WIDTH, h: 0.01, fill: { color: BRAND_COLORS.border.replace('#', '') } });

  s1.addText('EXECUTIVE BRIEF - BOARDROOM EDITION', {
    x: PPTX_LAYOUT.CONTENT_LEFT, y: 1.2, w: 7.0, h: 0.25,
    fontSize: TYPOGRAPHY.sectionLabelSize, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });

  s1.addText('Procurement Value Opportunity Assessment', {
    x: PPTX_LAYOUT.CONTENT_LEFT, y: 1.55, w: 8.5, h: 0.5,
    fontSize: TYPOGRAPHY.coverTitleSize, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  s1.addText(clientName, {
    x: PPTX_LAYOUT.CONTENT_LEFT, y: 2.1, w: 8.5, h: 0.35,
    fontSize: 18, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });

  // Hero Card
  s1.addShape('rect', { x: PPTX_LAYOUT.CONTENT_LEFT, y: 2.55, w: PPTX_LAYOUT.CONTENT_WIDTH, h: 1.5, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s1.addShape('rect', { x: PPTX_LAYOUT.CONTENT_LEFT, y: 2.55, w: 0.08, h: 1.5, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });

  s1.addText('DIRECT SAVINGS OPPORTUNITY', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.3, y: 2.7, w: 8.0, h: 0.25,
    fontSize: TYPOGRAPHY.cardLabelSize, bold: true, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  s1.addText('₹78.72 Cr', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.3, y: 3.0, w: 8.0, h: 0.55,
    fontSize: 34, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace
  });
  s1.addText('₹93.60 Cr Net Defensible Pipeline  |  ₹5,920.35 Cr Spend Evaluated  |  24 Months (Apr 2024 - Mar 2026)', {
    x: PPTX_LAYOUT.CONTENT_LEFT + 0.3, y: 3.65, w: 8.4, h: 0.25,
    fontSize: 11, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });

  // Footer metadata
  s1.addText(`Management Confidential - Prepared exclusively for ${clientName}`, {
    x: PPTX_LAYOUT.CONTENT_LEFT, y: 5.15, w: 5.0, h: 0.2, fontSize: TYPOGRAPHY.footerSize, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  s1.addText('aiCEV by Procucev', {
    x: 4.0, y: 5.15, w: 2.0, h: 0.2, fontSize: TYPOGRAPHY.footerSize, bold: true, align: 'center', color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  s1.addText('BOARD DELIVERABLE', {
    x: PPTX_LAYOUT.SAFE_RIGHT - 1.5, y: 5.15, w: 1.5, h: 0.2, fontSize: TYPOGRAPHY.footerSize, bold: true, align: 'right', color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });

  // Slide 2: Executive Opportunity
  const s2 = pptx.addSlide();
  s2.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s2, 'Executive Opportunity: Certified Value Landscape', 'Executive Opportunity', 2);

  addPptxKpiCard(s2, 0.5, 1.1, 2.15, 0.95, 'Direct Savings Opportunity', '₹78.72 Cr', 'Defensible Direct Cost Reduction', BRAND_COLORS.accentGreen);
  addPptxKpiCard(s2, 2.78, 1.1, 2.15, 0.95, 'Net Defensible Pipeline', '₹93.60 Cr', 'Direct + Strategic Market Levers', BRAND_COLORS.procucevBlue);
  addPptxKpiCard(s2, 5.06, 1.1, 2.15, 0.95, 'Strategic Market Value', '₹14.88 Cr', 'Commodity Timing & Index Levers', '#0284C7');
  addPptxKpiCard(s2, 7.35, 1.1, 2.15, 0.95, 'Spend Evaluated', '₹5,920.35 Cr', '31,671 Invoiced Line Items', BRAND_COLORS.secondaryText);

  // Horizontal Value Statement
  s2.addShape('rect', { x: 0.5, y: 2.18, w: 9.0, h: 0.44, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s2.addText('Value is concentrated across price harmonization, supplier consolidation, strategic sourcing and benchmark-led market alignment.', {
    x: 0.65, y: 2.24, w: 8.7, h: 0.32, fontSize: 10, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });

  // 3 Insight Columns
  const cols = [
    { title: 'WHERE VALUE LIES', color: BRAND_COLORS.procucevBlue, text: '- 18.5% rate dispersion across 26 plants for identical consumables.\n- High spend concentration in top 10% suppliers enables volume pooling.\n- Competitive e-auctions capture verified supplier margin arbitrage.' },
    { title: 'MATHEMATICAL INTEGRITY', color: BRAND_COLORS.accentGreen, text: '- ₹62.80 Cr multi-lever overlaps fully deducted to prevent double-counting.\n- ₹16.72 Cr client policy exclusions removed from defensible pipeline.\n- Zero process productivity monetized until time-motion validation.' },
    { title: 'EXECUTION READINESS', color: '#0284C7', text: '- Wave 1 pre-qualified initiatives represent ₹47.90 Cr ready for tenders.\n- 90-day phased execution roadmap prevents operational plant disruptions.\n- Index-linked pricing protects gross margin against fuel market volatility.' }
  ];
  cols.forEach((c, idx) => {
    const x = 0.5 + idx * 3.05;
    s2.addShape('rect', { x, y: 2.75, w: 2.9, h: 2.35, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s2.addShape('rect', { x, y: 2.75, w: 2.9, h: 0.05, fill: { color: c.color.replace('#', '') } });
    s2.addText(c.title, { x: x + 0.15, y: 2.85, w: 2.6, h: 0.25, fontSize: 9.5, bold: true, color: c.color.replace('#', ''), fontFace });
    s2.addText(c.text, { x: x + 0.15, y: 3.15, w: 2.6, h: 1.85, fontSize: 9, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
  });
  addSlideFooter(s2, clientName, 2, totalSlides);

  // Slide 3: Why Procucev
  const s3 = pptx.addSlide();
  s3.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s3, 'Why Procucev: Industrial Procurement Intelligence & Sourcing Execution', 'Corporate Profile', 3);

  const pillars = [
    { num: '01', title: 'DOMAIN EXPERTISE', desc: 'Heavy manufacturing veterans with operational category playbooks.\n₹45,000+ Cr Analyzed', color: BRAND_COLORS.procucevBlue },
    { num: '02', title: 'FORENSIC DATA', desc: '100% line-item audit across 31,671 records with zero interpolation.\n31,671 Invoices Cleansed', color: BRAND_COLORS.accentGreen },
    { num: '03', title: 'AI DECISION INTELLIGENCE', desc: 'Algorithmic rate benchmarking, outlier isolation, and taxonomy mapping.\n256 Material Groups', color: '#0284C7' },
    { num: '04', title: 'EXECUTION', desc: 'Hands-on e-auction facilitation, commercial negotiations, and tracking.\n₹47.90 Cr Wave 1 Ready', color: BRAND_COLORS.accentAmber }
  ];
  pillars.forEach((p, idx) => {
    const x = 0.5 + idx * 2.28;
    s3.addShape('rect', { x, y: 1.15, w: 2.15, h: 2.25, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s3.addShape('rect', { x, y: 1.15, w: 2.15, h: 0.05, fill: { color: p.color.replace('#', '') } });
    s3.addText(p.num, { x: x + 0.15, y: 1.25, w: 1.8, h: 0.25, fontSize: 13, bold: true, color: p.color.replace('#', ''), fontFace });
    s3.addText(p.title, { x: x + 0.15, y: 1.55, w: 1.85, h: 0.25, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s3.addText(p.desc, { x: x + 0.15, y: 1.85, w: 1.85, h: 1.45, fontSize: 9, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s3.addShape('rect', { x: 0.5, y: 3.52, w: 9.0, h: 0.38, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s3.addText('From transaction data -> sourcing decision -> execution -> realized value', {
    x: 0.65, y: 3.56, w: 8.7, h: 0.28, fontSize: 10, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });

  const trusts = [
    { title: 'Zero Hallucination', desc: 'Every rupee maps to verified invoiced transactions.' },
    { title: 'Conservative Overlap', desc: 'Strict deduplication eliminates double counts.' },
    { title: 'Client Data Isolation', desc: 'Dedicated AES-256 tenant encryption; zero leakage.' },
    { title: 'Verified Governance', desc: 'Productivity non-monetized until time-motion signoff.' }
  ];
  trusts.forEach((t, idx) => {
    const x = 0.5 + idx * 2.28;
    s3.addShape('rect', { x, y: 4.02, w: 2.15, h: 1.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s3.addText(t.title, { x: x + 0.1, y: 4.1, w: 1.95, h: 0.22, fontSize: 9, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s3.addText(t.desc, { x: x + 0.1, y: 4.35, w: 1.95, h: 0.65, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });
  addSlideFooter(s3, clientName, 3, totalSlides);

  // Slide 4: Capabilities
  const s4 = pptx.addSlide();
  s4.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s4, 'Procurement Value Architecture & Sourcing Competencies', 'Enterprise Capabilities', 4);

  const stages = [
    { n: '1', name: 'DIAGNOSE', out: 'Cleanse & map 100% invoice spend' },
    { n: '2', name: 'STRATEGIZE', out: 'Prioritize levers & market benchmarks' },
    { n: '3', name: 'SOURCE', out: 'Dynamic e-auctions & volume pooling' },
    { n: '4', name: 'EXECUTE', out: 'Lock in supplier contracts & SLAs' },
    { n: '5', name: 'REALIZE', out: 'Track invoice rates against baseline' },
    { n: '6', name: 'MONITOR', out: 'Audit price creep & contract leakage' }
  ];
  stages.forEach((st, idx) => {
    const x = 0.5 + idx * 1.52;
    s4.addShape('rect', { x, y: 1.15, w: 1.4, h: 1.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s4.addShape('rect', { x, y: 1.15, w: 1.4, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s4.addText(`STAGE ${st.n}\n${st.name}`, { x: x + 0.08, y: 1.22, w: 1.24, h: 0.4, fontSize: 8.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
    s4.addText(st.out, { x: x + 0.08, y: 1.65, w: 1.24, h: 0.5, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s4.addText('10 SPECIALIZED STRATEGIC PROCUREMENT COMPETENCIES', {
    x: 0.5, y: 2.32, w: 8.0, h: 0.25, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  const comps = [
    { n: '01', name: 'Direct Price Improvement', desc: 'Harmonize divergent multi-plant rates on identical SKUs.' },
    { n: '02', name: 'Volume Aggregation', desc: 'Pool national plant demand to secure Tier-1 factory pricing.' },
    { n: '03', name: 'E-Auction Dynamic Bidding', desc: 'Choreograph transparent reverse auctions for price discovery.' },
    { n: '04', name: 'Vendor Base Consolidation', desc: 'Rationalize tail suppliers into structured preferred panels.' },
    { n: '05', name: 'Payment Terms Alignment', desc: 'Harmonize payment cycles to optimize working capital.' },
    { n: '06', name: 'Category Specialization', desc: 'Deploy technical sourcing strategies tailored by commodity.' },
    { n: '07', name: 'Logistics Optimization', desc: 'Rationalize packaging specs, transport routes & freight tiers.' },
    { n: '08', name: 'Specification Harmonization', desc: 'Standardize material grades across regional operating units.' },
    { n: '09', name: 'Contract Compliance Audit', desc: 'Automate invoice audit to eliminate unapproved price leakage.' },
    { n: '10', name: 'PCBI Market Indexing', desc: 'Link volatile energy and chemical inputs to external indices.' }
  ];
  comps.forEach((c, idx) => {
    const row = Math.floor(idx / 5);
    const col = idx % 5;
    const x = 0.5 + col * 1.82;
    const y = 2.6 + row * 1.25;
    s4.addShape('rect', { x, y, w: 1.72, h: 1.18, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s4.addText(`${c.n}. ${c.name}`, { x: x + 0.08, y: y + 0.08, w: 1.56, h: 0.35, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s4.addText(c.desc, { x: x + 0.08, y: y + 0.45, w: 1.56, h: 0.65, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });
  addSlideFooter(s4, clientName, 4, totalSlides);

  // Slide 5: UltraTech Context
  const s5 = pptx.addSlide();
  s5.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s5, `Operating Scale & Procurement Implications: ${clientName}`, 'Client Context', 5);

  s5.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 3.9, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s5.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s5.addText('ULTRATECH AT SCALE', { x: 0.7, y: 1.28, w: 3.8, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });

  const facts = [
    { stat: '152.7 MTPA', label: 'Installed Grey Cement Capacity', desc: 'Largest cement manufacturer in India; top 3 globally.' },
    { stat: '24', label: 'Integrated Manufacturing Plants', desc: 'Major industrial production centers across all four zones.' },
    { stat: '33', label: 'Grinding Units', desc: 'Distributed regional processing and blending infrastructure.' },
    { stat: '8', label: 'Bulk Terminals', desc: 'Port terminals enabling multimodal coastal and rail logistics.' }
  ];
  facts.forEach((fc, idx) => {
    const fY = 1.6 + idx * 0.82;
    s5.addText(fc.stat, { x: 0.7, y: fY, w: 3.8, h: 0.35, fontSize: 18, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s5.addText(`${fc.label} - ${fc.desc}`, { x: 0.7, y: fY + 0.35, w: 3.9, h: 0.4, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  s5.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 3.9, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s5.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s5.addText('PROCUREMENT IMPLICATIONS FOR VALUE DISCOVERY', { x: 5.35, y: 1.28, w: 3.9, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });

  const imps = [
    { title: 'Inter-Plant Variance', desc: 'Decentralized local buying across 26 units leads to substantial unit-price divergence on identical consumable SKUs.' },
    { title: 'Unmatched Volume Scale', desc: 'National demand pooling unlocks Tier-1 OEM factory pricing across packaging, grinding media, and chemicals.' },
    { title: 'Tail Spend Fragmentation', desc: '912 vendors in the spend tail dilute purchasing power and generate disproportionate PO administrative load.' },
    { title: 'Commodity Volatility', desc: 'Fuel and power inputs require dynamic index-linked contracts to lock in favorable market troughs and hedge price creep.' }
  ];
  imps.forEach((im, idx) => {
    const iY = 1.6 + idx * 0.82;
    s5.addText(im.title, { x: 5.35, y: iY, w: 3.9, h: 0.25, fontSize: 10, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s5.addText(im.desc, { x: 5.35, y: iY + 0.28, w: 3.9, h: 0.5, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  addSlideFooter(s5, clientName, 5, totalSlides);
}
