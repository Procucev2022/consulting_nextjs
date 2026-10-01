/**
 * Executive Brief PPTX Slides 1 to 10 (Prompt 258)
 */

import type PptxGenJS from 'pptxgenjs';
import { formatINRCrore } from '../utils/moneyModel';
import {
  PROCUCEV_PROFILE,
  DEFAULT_CLIENT_PROFILE,
  BRIEF_LEVER_SUMMARIES
} from '../constants/executiveBriefConstants';
import {
  RAW_TOTAL_SPEND_INR,
  RAW_GROSS_OPP_INR,
  RAW_OVERLAPS_INR,
  RAW_EXCLUSIONS_INR,
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_REALIZED_INR
} from '../constants/numericalAuditConstants';
import { addSlideHeader, addSlideFooter, addPptxKpiCard } from './executiveBriefPptxHelpers';

export function renderPptxSlides1To10(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  // Slide 1: Cover
  const s1 = pptx.addSlide();
  s1.background = { color: '0A0F1D' };
  s1.addShape('rect', { x: 0.5, y: 0.5, w: 0.08, h: 4.6, fill: { color: '2563EB' } });
  s1.addText('BOARD-LEVEL STRATEGIC PROCUREMENT ADVISORY', {
    x: 0.8,
    y: 0.8,
    w: 5.0,
    h: 0.3,
    fontSize: 9,
    bold: true,
    color: '38BDF8',
    fill: { color: '1E293B' }
  });
  s1.addText('Procurement Value & Savings Diagnostic', {
    x: 0.8,
    y: 1.4,
    w: 8.5,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: 'F8FAFC'
  });
  s1.addText(`Executive Brief for ${clientName}`, {
    x: 0.8,
    y: 2.0,
    w: 8.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: '94A3B8'
  });
  s1.addText(`Total Spend Evaluated: ${formatINRCrore(RAW_TOTAL_SPEND_INR)} (Addressable: ₹4,931.00 Cr)`, {
    x: 0.8,
    y: 3.2,
    w: 8.5,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: '38BDF8'
  });
  s1.addText('FY 2021-22 to FY 2024-25 (31,671 Invoiced Purchase Records Evaluated)', {
    x: 0.8,
    y: 3.6,
    w: 8.5,
    h: 0.3,
    fontSize: 10,
    color: 'CBD5E1'
  });
  s1.addText(`STRICTLY CONFIDENTIAL — Prepared exclusively for the Leadership of ${clientName}`, {
    x: 0.8,
    y: 4.4,
    w: 8.5,
    h: 0.3,
    fontSize: 9,
    italic: true,
    color: '94A3B8'
  });

  // Slide 2: Executive Summary
  const s2 = pptx.addSlide();
  s2.background = { color: '0F172A' };
  addSlideHeader(s2, 'Executive Summary: Core Findings & Leadership Decision Matrix', 'Strategic Synthesis', 2);
  addPptxKpiCard(s2, 0.5, 1.0, 2.15, 0.9, 'Total Spend Evaluated', formatINRCrore(RAW_TOTAL_SPEND_INR), '31,671 Invoiced Records', '2563EB');
  addPptxKpiCard(s2, 2.8, 1.0, 2.15, 0.9, 'Addressable Spend', '₹4,931.00 Cr', '83.3% of Procurement', '38BDF8');
  addPptxKpiCard(s2, 5.1, 1.0, 2.15, 0.9, 'Defensible Net Opp', formatINRCrore(RAW_NET_DEFENSIBLE_INR), '4.94% Net Yield', '10B981');
  addPptxKpiCard(s2, 7.4, 1.0, 2.15, 0.9, 'Wave 1 Approved', formatINRCrore(RAW_APPROVED_MODULE4_INR), `${formatINRCrore(RAW_REALIZED_INR)} Realized`, 'F59E0B');

  const qTableRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Audit Question', options: { bold: true, fill: { color: '1E293B' }, color: '38BDF8' } },
      { text: 'Forensic Finding & Governance Response', options: { bold: true, fill: { color: '1E293B' }, color: '38BDF8' } }
    ],
    [{ text: '1. Scope Analysed' }, { text: 'Direct raw materials, fuels, packaging, logistics & MRO.' }],
    [{ text: '2. Spend Evaluated' }, { text: `${formatINRCrore(RAW_TOTAL_SPEND_INR)} across 18 manufacturing facilities.` }],
    [{ text: '3. Transaction Count' }, { text: '31,671 purchase orders forensic validated (0 duplicates).' }],
    [{ text: '4. Major Levers' }, { text: 'Price harmonization, competitive dynamic e-auctions & tail consolidation.' }],
    [{ text: '5. Defensible Opp' }, { text: `${formatINRCrore(RAW_NET_DEFENSIBLE_INR)} net of overlaps and exclusions.` }],
    [{ text: '6. Recommended Action' }, { text: 'Institute Cross-Plant Sourcing Council & launch Wave 1 e-auctions.' }]
  ];
  s2.addTable(qTableRows, {
    x: 0.5,
    y: 2.1,
    w: 9.0,
    h: 2.8,
    colW: [2.5, 6.5],
    fontSize: 9,
    color: 'CBD5E1',
    fill: { color: '182234' }
  });
  addSlideFooter(s2, clientName, 2, totalSlides);

  // Slide 3: About Procucev
  const s3 = pptx.addSlide();
  s3.background = { color: '0F172A' };
  addSlideHeader(s3, 'About Procucev: Industrial Procurement Intelligence & Sourcing Execution', 'Corporate Profile', 3);
  s3.addShape('rect', { x: 0.5, y: 1.0, w: 4.3, h: 4.0, fill: { color: '1E293B' }, line: { color: '334155' } });
  s3.addText('POSITIONING & OPERATING MODEL\n\nProcucev is an enterprise procurement advisory platform purpose-built for heavy manufacturing. We bridge the gap between static consulting presentations and realized P&L EBITDA margin expansion.\n\n• Domain Expertise: Decades of category benchmarks.\n• Forensic Engineering: 100% transaction lineage.\n• AI Intelligence: Automated UNSPSC classification.\n• Turnkey Execution: Hands-on reverse e-auctions.', {
    x: 0.7,
    y: 1.2,
    w: 3.9,
    h: 3.6,
    fontSize: 9,
    color: 'CBD5E1'
  });

  s3.addShape('rect', { x: 5.2, y: 1.0, w: 4.3, h: 4.0, fill: { color: '1E293B' }, line: { color: '334155' } });
  s3.addText('THE PROCUCEV STANDARD OF INTEGRITY\n\n• Zero Synthetic Savings: We never apply arbitrary percentages.\n• Audited Balancing: Every rupee balances to ERP PO records.\n• Overlap Deduplication: Multi-lever interactions deduplicated.\n• Sovereign Protection: Customer data isolated via AES-256-GCM AEAD authenticated encryption.', {
    x: 5.4,
    y: 1.2,
    w: 3.9,
    h: 3.6,
    fontSize: 9,
    color: 'CBD5E1'
  });
  addSlideFooter(s3, clientName, 3, totalSlides);

  // Slide 4: Capabilities Architecture
  const s4 = pptx.addSlide();
  s4.background = { color: '0F172A' };
  addSlideHeader(s4, 'Procucev Procurement Capability Architecture', 'Enterprise Capabilities', 4);
  const stages = PROCUCEV_PROFILE.methodologyStages;
  stages.forEach((st, idx) => {
    s4.addShape('rect', { x: 0.5 + idx * 1.52, y: 1.0, w: 1.4, h: 0.9, fill: { color: '1E293B' }, line: { color: '2563EB' } });
    s4.addText(`${idx + 1}. ${st.stage}`, { x: 0.55 + idx * 1.52, y: 1.05, w: 1.3, h: 0.2, fontSize: 8, bold: true, color: '38BDF8' });
    s4.addText(st.desc, { x: 0.55 + idx * 1.52, y: 1.3, w: 1.3, h: 0.55, fontSize: 7, color: '94A3B8' });
  });
  const capRows: PptxGenJS.TableRow[] = [
    [{ text: '#', options: { bold: true } }, { text: 'Competency', options: { bold: true } }, { text: 'Methodological Focus', options: { bold: true } }, { text: 'Outcome', options: { bold: true } }],
    [{ text: '01' }, { text: 'Forensic Spend Diagnostic' }, { text: 'Cleanse and normalize 100% of line-item PO history' }, { text: 'Spend transparency' }],
    [{ text: '02' }, { text: 'Strategic Sourcing' }, { text: 'Bespoke strategy per category liquidity & velocity' }, { text: 'Reduced baseline costs' }],
    [{ text: '03' }, { text: 'Price Analytics' }, { text: 'Percentile dispersion & inter-plant rate tracking' }, { text: 'Harmonized rates' }],
    [{ text: '04' }, { text: 'Electronic Auctions' }, { text: 'Dynamic reverse auctions with reserve logic' }, { text: 'Fast price discovery' }],
    [{ text: '05' }, { text: 'Tail Consolidation' }, { text: 'Pareto tail rationalization & master distributors' }, { text: 'Lowered AP drag' }]
  ];
  s4.addTable(capRows, { x: 0.5, y: 2.1, w: 9.0, h: 2.8, colW: [0.5, 2.5, 3.8, 2.2], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s4, clientName, 4, totalSlides);

  // Slide 5: Understanding Client
  const s5 = pptx.addSlide();
  s5.background = { color: '0F172A' };
  addSlideHeader(s5, `Understanding ${clientName}: Public Profile & Scale`, 'Client Context', 5);
  const factRows: PptxGenJS.TableRow[] = [
    [{ text: 'Dimension', options: { bold: true } }, { text: 'Verified Public Fact', options: { bold: true } }, { text: 'Official Source', options: { bold: true } }, { text: 'Date', options: { bold: true } }],
    ...DEFAULT_CLIENT_PROFILE.publicFacts.map((pf) => [
      { text: pf.characteristic },
      { text: pf.fact },
      { text: pf.source },
      { text: pf.sourceDate }
    ])
  ];
  s5.addTable(factRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [1.8, 4.4, 1.8, 1.0], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s5, clientName, 5, totalSlides);

  // Slide 6: Why Procurement Matters
  const s6 = pptx.addSlide();
  s6.background = { color: '0F172A' };
  addSlideHeader(s6, `Why Procurement Matters for ${clientName}`, 'Strategic Alignment', 6);
  const alignRows: PptxGenJS.TableRow[] = [
    [{ text: 'Industrial Scale', options: { bold: true } }, { text: 'Procurement Implication', options: { bold: true } }, { text: 'Diagnostic Question', options: { bold: true } }],
    ...DEFAULT_CLIENT_PROFILE.publicFacts.map((pf) => [
      { text: pf.characteristic },
      { text: pf.implication },
      { text: pf.analyticalQuestion }
    ])
  ];
  s6.addTable(alignRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [2.0, 3.8, 3.2], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s6, clientName, 6, totalSlides);

  // Slide 7: Scope of Analysis
  const s7 = pptx.addSlide();
  s7.background = { color: '0F172A' };
  addSlideHeader(s7, 'Scope of Analysis & Forensic Analytical Journey', 'Diagnostic Baseline', 7);
  addPptxKpiCard(s7, 0.5, 1.0, 2.15, 0.85, 'Total Spend Evaluated', formatINRCrore(RAW_TOTAL_SPEND_INR), '31,671 Invoiced Records', '2563EB');
  addPptxKpiCard(s7, 2.8, 1.0, 2.15, 0.85, 'Addressable Spend', '₹4,931.00 Cr', '83.3% Addressability Ratio', '38BDF8');
  addPptxKpiCard(s7, 5.1, 1.0, 2.15, 0.85, 'Commercial Vendors', '1,482 Suppliers', 'Across 18 Plant Clusters', '10B981');
  addPptxKpiCard(s7, 7.4, 1.0, 2.15, 0.85, 'Categorized SKUs', '8,940 Items', '42 Level-2 Categories', 'F59E0B');

  const journeyRows: PptxGenJS.TableRow[] = [
    [{ text: 'Stage', options: { bold: true } }, { text: 'Analytical Transformation Scope', options: { bold: true } }],
    [{ text: 'STAGE 1: Customer Data' }, { text: 'Raw SAP / ERP purchase history files ingested across 31,671 records.' }],
    [{ text: 'STAGE 2: Spend Diagnostic' }, { text: '100% forensic spend validation, UOM normalization & currency harmonisation.' }],
    [{ text: 'STAGE 3: Strategic Sourcing' }, { text: 'Algorithmic identification of 12 strategic levers, price dispersion & e-auction lots.' }],
    [{ text: 'STAGE 4: PCBI Benchmarking' }, { text: 'Independent index price gap verification across landed fuels and bulk chemicals.' }],
    [{ text: 'STAGE 5: Savings Execution' }, { text: 'Wave-1 package approval, target contract lock-in, and realized invoice verification.' }]
  ];
  s7.addTable(journeyRows, { x: 0.5, y: 2.1, w: 9.0, h: 2.8, colW: [2.5, 6.5], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s7, clientName, 7, totalSlides);

  // Slide 8: Diagnostic 10 Dimensions
  const s8 = pptx.addSlide();
  s8.background = { color: '0F172A' };
  addSlideHeader(s8, 'Executive Procurement Diagnostic: 10 Dimensions', 'Maturity Assessment', 8);
  const diagRows: PptxGenJS.TableRow[] = [
    [{ text: '#', options: { bold: true } }, { text: 'Diagnostic Dimension', options: { bold: true } }, { text: 'Observed Baseline', options: { bold: true } }, { text: 'Procurement Implication', options: { bold: true } }],
    [{ text: '01' }, { text: 'Spend Visibility' }, { text: '100.0% categorized' }, { text: 'Complete line-item visibility across all plants.' }],
    [{ text: '02' }, { text: 'Supplier Concentration' }, { text: 'Top 10% vendors = 81.4% spend' }, { text: 'High leverage on core suppliers.' }],
    [{ text: '03' }, { text: 'Category Concentration' }, { text: 'Top 5 categories = 68.2% spend' }, { text: 'Focusing on 5 categories moves 70% savings.' }],
    [{ text: '04' }, { text: 'Inter-Plant Price Spread' }, { text: '18.5% average unit rate variance' }, { text: 'Immediate margin capture through rate parity.' }],
    [{ text: '05' }, { text: 'Competitive Sourcing' }, { text: '42.6% spend under spot POs' }, { text: 'Upside through structured reverse e-tenders.' }],
    [{ text: '06' }, { text: 'Tail Vendor Drag' }, { text: '912 vendors under 4.8% spend' }, { text: 'Prime candidate for master panelling.' }]
  ];
  s8.addTable(diagRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [0.5, 2.5, 2.5, 3.5], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s8, clientName, 8, totalSlides);

  // Slide 9: Opportunity Summary
  const s9 = pptx.addSlide();
  s9.background = { color: '0F172A' };
  addSlideHeader(s9, 'Opportunity Summary: Where the Value Lies', 'Value Landscape', 9);
  const levRows: PptxGenJS.TableRow[] = [
    [{ text: 'Lever ID', options: { bold: true } }, { text: 'Strategic Sourcing Lever', options: { bold: true } }, { text: 'Eligible Spend', options: { bold: true } }, { text: 'Potential Opp', options: { bold: true } }, { text: 'Confidence', options: { bold: true } }, { text: 'Status', options: { bold: true } }],
    ...BRIEF_LEVER_SUMMARIES.slice(0, 7).map((lev) => [
      { text: lev.leverId },
      { text: lev.leverName },
      { text: formatINRCrore(lev.eligibleSpendInr) },
      { text: formatINRCrore(lev.opportunityInr) },
      { text: lev.confidence },
      { text: lev.status }
    ])
  ];
  s9.addTable(levRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [1.0, 2.8, 1.5, 1.5, 1.0, 1.2], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s9, clientName, 9, totalSlides);

  // Slide 10: Opportunity Waterfall
  const s10 = pptx.addSlide();
  s10.background = { color: '0F172A' };
  addSlideHeader(s10, 'Opportunity Waterfall: From Gross Spend to Net Defensible', 'Financial Reconciliation', 10);
  const wfStages = [
    { label: 'Total Spend', val: formatINRCrore(RAW_TOTAL_SPEND_INR), col: '2563EB' },
    { label: 'Addressable', val: '₹4,931.00 Cr', col: '38BDF8' },
    { label: 'Gross Opp', val: formatINRCrore(RAW_GROSS_OPP_INR), col: 'F59E0B' },
    { label: 'Less Overlaps', val: '-' + formatINRCrore(RAW_OVERLAPS_INR), col: 'EF4444' },
    { label: 'Less Exclusions', val: '-' + formatINRCrore(RAW_EXCLUSIONS_INR), col: 'EF4444' },
    { label: 'Net Defensible', val: formatINRCrore(RAW_NET_DEFENSIBLE_INR), col: '10B981' },
    { label: 'Approved Wave 1', val: formatINRCrore(RAW_APPROVED_MODULE4_INR), col: '10B981' }
  ];
  wfStages.forEach((st, idx) => {
    addPptxKpiCard(s10, 0.5 + idx * 1.3, 1.0, 1.2, 0.85, st.label, st.val, 'Reconciled', st.col);
  });
  const wfProofRows: PptxGenJS.TableRow[] = [
    [{ text: 'Code', options: { bold: true } }, { text: 'Waterfall Step', options: { bold: true } }, { text: 'Raw Numeric INR', options: { bold: true } }, { text: 'Display Value', options: { bold: true } }, { text: 'Status', options: { bold: true } }],
    [{ text: 'WF-01' }, { text: 'Total Customer Invoiced Spend' }, { text: '59,203,477,681.66' }, { text: formatINRCrore(RAW_TOTAL_SPEND_INR) }, { text: 'VERIFIED' }],
    [{ text: 'WF-02' }, { text: 'Addressable Spend Baseline' }, { text: '49,310,000,000.00' }, { text: '₹4,931.00 Cr' }, { text: 'VERIFIED' }],
    [{ text: 'WF-03' }, { text: 'Gross Identified Opportunity' }, { text: '3,232,700,000.00' }, { text: formatINRCrore(RAW_GROSS_OPP_INR) }, { text: 'VERIFIED' }],
    [{ text: 'WF-04' }, { text: 'Net Defensible Opportunity' }, { text: '2,437,500,000.00' }, { text: formatINRCrore(RAW_NET_DEFENSIBLE_INR) }, { text: 'VERIFIED' }],
    [{ text: 'WF-05' }, { text: 'Realized & Verified Invoice Savings' }, { text: '214,000,000.00' }, { text: formatINRCrore(RAW_REALIZED_INR) }, { text: 'VERIFIED' }]
  ];
  s10.addTable(wfProofRows, { x: 0.5, y: 2.1, w: 9.0, h: 2.8, colW: [1.0, 3.5, 2.2, 1.3, 1.0], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s10, clientName, 10, totalSlides);
}
