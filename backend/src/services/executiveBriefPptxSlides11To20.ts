/**
 * Executive Brief PPTX Slides 11 to 20 (Prompt 258)
 */

import type PptxGenJS from 'pptxgenjs';
import { formatINRCrore } from '../utils/moneyModel';
import {
  BRIEF_FINDING_CARDS,
  BRIEF_PRICE_DISPERSIONS,
  BRIEF_E_AUCTIONS,
  BRIEF_CONSOLIDATION_PLANS
} from '../constants/executiveBriefConstants';
import { addSlideHeader, addSlideFooter, addPptxKpiCard } from './executiveBriefPptxHelpers';

export function renderPptxSlides11To20(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  // Slide 11: Spend Diagnostic
  const s11 = pptx.addSlide();
  s11.background = { color: '0F172A' };
  addSlideHeader(s11, 'Module 1 — Spend Diagnostic: Taxonomy & Concentration', 'Spend Architecture', 11);
  const catRows: PptxGenJS.TableRow[] = [
    [{ text: 'Category Cluster', options: { bold: true } }, { text: 'Spend (Cr)', options: { bold: true } }, { text: 'Share %', options: { bold: true } }, { text: 'Strategic Profile', options: { bold: true } }],
    [{ text: 'Direct Raw Materials (Fly Ash, Slag)' }, { text: '₹1,842.10 Cr' }, { text: '31.1%' }, { text: 'High Strategic Importance' }],
    [{ text: 'Energy & Thermal Fuels (Petcoke, Coal)' }, { text: '₹1,624.50 Cr' }, { text: '27.4%' }, { text: 'Volatile Commodity Pricing' }],
    [{ text: 'Outbound & Bulk Logistics' }, { text: '₹910.20 Cr' }, { text: '15.4%' }, { text: 'Regional Route Dispersion' }],
    [{ text: 'Plant Mechanical & Electrical Spares' }, { text: '₹554.20 Cr' }, { text: '9.4%' }, { text: 'High SKU Granularity' }],
    [{ text: 'Packaging (HDPE Laminated Bags)' }, { text: '₹480.00 Cr' }, { text: '8.1%' }, { text: 'Standard Spec, High Scale' }],
    [{ text: 'Administrative & Plant Services' }, { text: '₹509.35 Cr' }, { text: '8.6%' }, { text: 'Tail Spend Fragmentation' }]
  ];
  s11.addTable(catRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [3.4, 1.6, 1.2, 2.8], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s11, clientName, 11, totalSlides);

  // Slide 12: Where the Money Goes
  const s12 = pptx.addSlide();
  s12.background = { color: '0F172A' };
  addSlideHeader(s12, 'Where the Money Goes: Pareto Spend Visualizations', 'Concentration Risk', 12);
  addPptxKpiCard(s12, 0.5, 1.0, 2.8, 1.1, 'Category Concentration', 'Top 8 = 82.4%', '42 Level-2 Categories Total', '2563EB');
  addPptxKpiCard(s12, 3.6, 1.0, 2.8, 1.1, 'Supplier Concentration', 'Top 50 = 76.5%', '1,482 Commercial Vendors', '38BDF8');
  addPptxKpiCard(s12, 6.7, 1.0, 2.8, 1.1, 'SKU Granularity', 'Top 250 = 64.8%', '8,940 Items Evaluated', '10B981');
  s12.addShape('rect', { x: 0.5, y: 2.3, w: 9.0, h: 2.6, fill: { color: '1E293B' }, line: { color: '334155' } });
  s12.addText('MANAGEMENT IMPLICATION ACROSS CONCENTRATION CLUSTERS\n\n• Executive focus must concentrate on Top 50 vendors while consolidating 912 tail suppliers.\n• Standardized consumable items (grinding media, refractories) exhibit 18.5% price spread.\n• Packaging and freight lanes feature 14+ qualified vendors ideal for dynamic reverse e-auctions.\n• Direct OEM partnerships bypass local trading intermediaries capturing 12% to 18% margin.', {
    x: 0.8,
    y: 2.5,
    w: 8.4,
    h: 2.2,
    fontSize: 9.5,
    color: 'CBD5E1'
  });
  addSlideFooter(s12, clientName, 12, totalSlides);

  // Slide 13: Spend Findings
  const s13 = pptx.addSlide();
  s13.background = { color: '0F172A' };
  addSlideHeader(s13, 'Module 1 Findings: Forensic Spend Observations & Root Causes', 'Forensic Findings', 13);
  const findings = BRIEF_FINDING_CARDS;
  findings.forEach((f, idx) => {
    const fX = 0.5 + idx * 3.05;
    s13.addShape('rect', { x: fX, y: 1.0, w: 2.9, h: 4.0, fill: { color: '1E293B' }, line: { color: '2563EB' } });
    s13.addText(`${f.findingId}: ${f.title}`, { x: fX + 0.1, y: 1.1, w: 2.7, h: 0.5, fontSize: 8.5, bold: true, color: 'F8FAFC' });
    s13.addText(`VALUE: ${f.potentialValueDisplay} | CONF: ${f.confidence}`, { x: fX + 0.1, y: 1.65, w: 2.7, h: 0.25, fontSize: 8, bold: true, color: '38BDF8' });
    s13.addText(`BACKGROUND: ${f.background}\n\nEVIDENCE: ${f.evidence}\n\nNEXT STEP: ${f.nextStep}`, { x: fX + 0.1, y: 1.95, w: 2.7, h: 2.8, fontSize: 7.5, color: 'CBD5E1' });
  });
  addSlideFooter(s13, clientName, 13, totalSlides);

  // Slide 14: Strategic Sourcing Opportunity Map
  const s14 = pptx.addSlide();
  s14.background = { color: '0F172A' };
  addSlideHeader(s14, 'Module 2 — Strategic Sourcing Opportunity Map', 'Opportunity Matrix', 14);
  const qW = 4.35;
  const qH = 1.9;
  s14.addShape('rect', { x: 0.5, y: 1.1, w: qW, h: qH, fill: { color: '064E3B' }, line: { color: '059669' } });
  s14.addText('QUADRANT 1: QUICK WINS (0-30 DAYS)\n\n• HDPE Packaging Bags E-Auction (Opp: ₹36.00 Cr)\n• Early Payment Discounts (Opp: ₹35.60 Cr)\n• Grinding Media Price Harmonization (Opp: ₹24.60 Cr)', { x: 0.7, y: 1.2, w: qW - 0.4, h: qH - 0.2, fontSize: 8.5, color: 'F8FAFC' });

  s14.addShape('rect', { x: 5.15, y: 1.1, w: qW, h: qH, fill: { color: '1E3A8A' }, line: { color: '2563EB' } });
  s14.addText('QUADRANT 2: STRATEGIC LEVERS (60-90 DAYS)\n\n• Petcoke & Coal PCBI Benchmark Indexing (Opp: ₹71.00 Cr)\n• MRO Tail Vendor Base Consolidation (Opp: ₹47.20 Cr)\n• Multi-Plant Technical Volume Aggregation (Opp: ₹42.00 Cr)', { x: 5.35, y: 1.2, w: qW - 0.4, h: qH - 0.2, fontSize: 8.5, color: 'F8FAFC' });

  s14.addShape('rect', { x: 0.5, y: 3.1, w: qW, h: qH, fill: { color: '1F2937' }, line: { color: '4B5563' } });
  s14.addText('QUADRANT 3: OPERATIONAL POLICIES (30 DAYS)\n\n• Contract Price Leakage Elimination (Opp: ₹11.40 Cr)\n• Plant Mechanical Fastener Consolidations (Opp: ₹7.70 Cr)\n• Warehouse Consignment Stocking Agreements (Opp: ₹6.50 Cr)', { x: 0.7, y: 3.2, w: qW - 0.4, h: qH - 0.2, fontSize: 8.5, color: 'D1D5DB' });

  s14.addShape('rect', { x: 5.15, y: 3.1, w: qW, h: qH, fill: { color: '312E81' }, line: { color: '4338CA' } });
  s14.addText('QUADRANT 4: STRUCTURAL VALUE (90+ DAYS)\n\n• Refractory Castable Specification Harmonization (Opp: ₹16.50 Cr)\n• Lubricant Grade Rationalization across Mills (Opp: ₹8.40 Cr)\n• Conveyor Belt Technical Harmonization (Opp: ₹5.20 Cr)', { x: 5.35, y: 3.2, w: qW - 0.4, h: qH - 0.2, fontSize: 8.5, color: 'C7D2FE' });
  addSlideFooter(s14, clientName, 14, totalSlides);

  // Slide 15: Price Improvement Opportunities
  const s15 = pptx.addSlide();
  s15.background = { color: '0F172A' };
  addSlideHeader(s15, 'Price Improvement: Percentile Dispersion Benchmarks', 'Price Dispersion', 15);
  const dispRows: PptxGenJS.TableRow[] = [
    [{ text: 'Category & Item', options: { bold: true } }, { text: 'UOM', options: { bold: true } }, { text: 'Min', options: { bold: true } }, { text: 'P10', options: { bold: true } }, { text: 'Median', options: { bold: true } }, { text: 'Max', options: { bold: true } }, { text: 'Opp (Cr)', options: { bold: true } }, { text: 'Confidence', options: { bold: true } }],
    ...BRIEF_PRICE_DISPERSIONS.map((disp) => [
      { text: disp.item },
      { text: disp.uom },
      { text: disp.min.toFixed(1) },
      { text: disp.p10.toFixed(1) },
      { text: disp.median.toFixed(1) },
      { text: disp.max.toFixed(1) },
      { text: formatINRCrore(disp.potentialOppInr) },
      { text: disp.confidence }
    ])
  ];
  s15.addTable(dispRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [2.6, 0.6, 0.8, 0.8, 0.8, 0.8, 1.2, 1.4], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s15, clientName, 15, totalSlides);

  // Slide 16: E-Auction Opportunities
  const s16 = pptx.addSlide();
  s16.background = { color: '0F172A' };
  addSlideHeader(s16, 'E-Auction Opportunities: Dynamic Competitive Events', 'Dynamic Sourcing', 16);
  const eaRows: PptxGenJS.TableRow[] = [
    [{ text: 'Category Lot', options: { bold: true } }, { text: 'Eligible Spend', options: { bold: true } }, { text: 'Vendor Pool', options: { bold: true } }, { text: 'Auction Format', options: { bold: true } }, { text: 'Benefit Range', options: { bold: true } }],
    ...BRIEF_E_AUCTIONS.map((ea) => [
      { text: ea.category },
      { text: formatINRCrore(ea.eligibleSpendInr) },
      { text: `${ea.supplierCount} Verified Bidders` },
      { text: ea.recommendedAuctionType },
      { text: formatINRCrore(ea.potentialBenefitInr) }
    ])
  ];
  s16.addTable(eaRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [2.5, 1.6, 1.8, 1.8, 1.3], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s16, clientName, 16, totalSlides);

  // Slide 17: Vendor Consolidation
  const s17 = pptx.addSlide();
  s17.background = { color: '0F172A' };
  addSlideHeader(s17, 'Vendor Base Consolidation: Tail Spend Rationalization', 'Vendor Rationalization', 17);
  const vcRows: PptxGenJS.TableRow[] = [
    [{ text: 'Category Scope', options: { bold: true } }, { text: 'Current State', options: { bold: true } }, { text: 'Target State', options: { bold: true } }, { text: 'Potential Benefit', options: { bold: true } }],
    ...BRIEF_CONSOLIDATION_PLANS.map((cp) => [
      { text: cp.category },
      { text: cp.currentState },
      { text: cp.targetState },
      { text: formatINRCrore(cp.potentialBenefitInr) }
    ])
  ];
  s17.addTable(vcRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [2.2, 2.8, 2.8, 1.2], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s17, clientName, 17, totalSlides);

  // Slide 18: Multi-Category Supplier Analysis
  const s18 = pptx.addSlide();
  s18.background = { color: '0F172A' };
  addSlideHeader(s18, 'Multi-Category Supplier Analysis: Specialization Realignment', 'Supplier Realignment', 18);
  const mcRows: PptxGenJS.TableRow[] = [
    [{ text: 'Supplier Name', options: { bold: true } }, { text: 'Core Category', options: { bold: true } }, { text: 'Non-Core Supplied', options: { bold: true } }, { text: 'Non-Core Spend', options: { bold: true } }, { text: 'Opp', options: { bold: true } }],
    [{ text: 'Apex Industrial Services Ltd' }, { text: 'Civil Structural Fabrication' }, { text: 'Electrical Switchgear Spares' }, { text: '₹18.40 Cr' }, { text: '₹2.40 Cr' }],
    [{ text: 'Balaji Heavy Logistics Corp' }, { text: 'Bulk Outbound Clinker Transport' }, { text: 'Warehouse Consumable Packaging' }, { text: '₹14.20 Cr' }, { text: '₹1.80 Cr' }],
    [{ text: 'Shree Ganesh Steels' }, { text: 'Structural Steel Angles & Channels' }, { text: 'Safety PPE & Personal Equipment' }, { text: '₹9.80 Cr' }, { text: '₹1.20 Cr' }],
    [{ text: 'Western Mining & Minerals' }, { text: 'High Grade Limestone Mining' }, { text: 'Plant Conveyor Belting & Fasteners' }, { text: '₹8.60 Cr' }, { text: '₹1.10 Cr' }]
  ];
  s18.addTable(mcRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [2.4, 2.3, 2.3, 1.0, 1.0], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s18, clientName, 18, totalSlides);

  // Slide 19: Volume Aggregation
  const s19 = pptx.addSlide();
  s19.background = { color: '0F172A' };
  addSlideHeader(s19, 'Volume Aggregation: National Demand Pooling on Standard Specs', 'Scale Sourcing', 19);
  const vaRows: PptxGenJS.TableRow[] = [
    [{ text: 'Commodity Specification', options: { bold: true } }, { text: 'UOM', options: { bold: true } }, { text: 'Fragmented Lots', options: { bold: true } }, { text: 'Pooled Volume', options: { bold: true } }, { text: 'Potential Benefit', options: { bold: true } }],
    [{ text: 'Grinding Media Balls High Chrome 70mm' }, { text: 'MT' }, { text: '18 Plant POs' }, { text: '14,200 MT Consolidated' }, { text: '₹14.20 Cr' }],
    [{ text: 'Double Laminated HDPE Cement Sacks 50kg' }, { text: 'M Pcs' }, { text: '24 Local Orders' }, { text: '320 Million Pcs Total' }, { text: '₹19.20 Cr' }],
    [{ text: 'Synthetic Heavy Industrial Gear Lubricants' }, { text: 'KL' }, { text: '14 Fragmented Orders' }, { text: '1,850 KL National Contract' }, { text: '₹5.60 Cr' }]
  ];
  s19.addTable(vaRows, { x: 0.5, y: 1.1, w: 9.0, h: 3.8, colW: [3.0, 0.8, 1.8, 2.0, 1.4], fontSize: 8.5, color: 'CBD5E1', fill: { color: '182234' } });
  addSlideFooter(s19, clientName, 19, totalSlides);

  // Slide 20: Module 3 PCBI Benchmark Coverage
  const s20 = pptx.addSlide();
  s20.background = { color: '0F172A' };
  addSlideHeader(s20, 'Module 3 — PCBI Benchmark Coverage & Market Alignment', 'Market Intelligence', 20);
  addPptxKpiCard(s20, 0.5, 1.0, 2.15, 0.85, 'Benchmarkable Spend', '₹2,450.00 Cr', 'Direct Materials & Fuels', '2563EB');
  addPptxKpiCard(s20, 2.8, 1.0, 2.15, 0.85, 'Covered PCBI Spend', '₹1,180.00 Cr', '48.2% Effective Coverage', '38BDF8');
  addPptxKpiCard(s20, 5.1, 1.0, 2.15, 0.85, 'Index Quality Rating', 'GRADE A+', 'Verified Independent Feeds', '10B981');
  addPptxKpiCard(s20, 7.4, 1.0, 2.15, 0.85, 'Identified Market Gap', '₹12.60 Cr', 'Verified vs Landed Indices', 'F59E0B');
  s20.addShape('rect', { x: 0.5, y: 2.1, w: 9.0, h: 2.8, fill: { color: '1E293B' }, line: { color: '334155' } });
  s20.addText('PCBI BENCHMARK GOVERNANCE & PROVENANCE\n\n• Independent Market Sources: Official customs import filings and port manifests.\n• Strict Technical Isolation: Zero contamination between client POs and PCBI tables.\n• Weekly Tracking: Captures seasonal freight cyclicality and port arbitrage.\n• Provenance Audit: Grade A+ rating with verified physical specifications.', {
    x: 0.8,
    y: 2.3,
    w: 8.4,
    h: 2.4,
    fontSize: 9.5,
    color: 'CBD5E1'
  });
  addSlideFooter(s20, clientName, 20, totalSlides);
}
