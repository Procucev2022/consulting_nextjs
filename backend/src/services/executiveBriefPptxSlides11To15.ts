/**
 * Executive Brief PPTX Slides 11 to 15 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos/Arial typography, spend taxonomy, Pareto, findings, and matrix.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderPptxSlides11To15(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  // Slide 11: Spend Architecture
  const s11 = pptx.addSlide();
  s11.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s11, 'Module 1 - Spend Intelligence: Taxonomy & Category Architecture', 'Spend Architecture', 11);

  const categories = isCust
    ? [
        { n: 'Raw Materials, Yarns & Fibers', s: '₹245.55 Cr (40.0%)', w: 4.8, c: BRAND_COLORS.procucevBlue },
        { n: 'Energy, Captive Power & Steam', s: '₹122.78 Cr (20.0%)', w: 3.75, c: BRAND_COLORS.accentAmber },
        { n: 'Project Capex & Equipment', s: '₹92.08 Cr (15.0%)', w: 2.8, c: BRAND_COLORS.accentGreen },
        { n: 'Dyes, Chemicals & Processing', s: '₹79.80 Cr (13.0%)', w: 2.3, c: '#0284C7' },
        { n: 'Packaging, Freight & Plant MRO', s: '₹73.67 Cr (12.0%)', w: 2.0, c: '#6366F1' }
      ]
    : [
        { n: 'Raw Materials & Clinker Additives', s: '₹1,894.51 Cr (32.0%)', w: 4.8, c: BRAND_COLORS.procucevBlue },
        { n: 'Fuel, Energy & Plant Power', s: '₹1,480.09 Cr (25.0%)', w: 3.75, c: BRAND_COLORS.accentAmber },
        { n: 'Packaging, HDPE Bags & Consumables', s: '₹947.26 Cr (16.0%)', w: 2.4, c: BRAND_COLORS.accentGreen },
        { n: 'Logistics, Bulk Terminals & Freight', s: '₹828.85 Cr (14.0%)', w: 2.1, c: '#0284C7' },
        { n: 'Plant Maintenance, Spares & Grinding Media', s: '₹769.64 Cr (13.0%)', w: 1.95, c: '#6366F1' }
      ];

  categories.forEach((cat, idx) => {
    const y = 1.15 + idx * 0.65;
    s11.addText(`${cat.n}\n${cat.s}`, { x: 0.5, y: y - 0.05, w: 3.2, h: 0.52, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s11.addShape('rect', { x: 3.8, y: y + 0.05, w: 5.2, h: 0.35, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s11.addShape('rect', { x: 3.8, y: y + 0.05, w: cat.w, h: 0.35, fill: { color: cat.c.replace('#', '') } });
  });

  const s11Takeaway = isCust
    ? 'STRATEGIC SOURCING IMPLICATION: Top categories account for >75% of spend (₹460.41 Cr). Concentrating dynamic sourcing, spec rationalization, and index contracting on these clusters unlocks >80% of identified direct value.'
    : 'STRATEGIC SOURCING IMPLICATION: Top 3 categories (Raw Materials, Energy, and Packaging) account for 73.0% of total spend (₹4,321.86 Cr). Concentrating dynamic sourcing and index contracting on these 3 clusters unlocks >70% of identified direct value.';

  s11.addShape('rect', { x: 0.5, y: 4.45, w: 9.0, h: 0.62, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s11.addText(s11Takeaway, {
    x: 0.65, y: 4.5, w: 8.7, h: 0.52, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s11, clientName, 11, totalSlides);

  // Slide 12: Pareto Concentration
  const s12 = pptx.addSlide();
  s12.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s12, 'Where the Money Goes: Pareto Spend Concentration Visualizations', 'Concentration Risk', 12);

  const paretoCards = isCust
    ? [
        { title: 'CATEGORY CONCENTRATION', sub: 'Top 15 Categories = 76.5% of Spend', stat: '₹469.62 Cr', desc: 'Clustered in core industrial inputs (yarns, fibers, energy, specialty chemicals, packaging). High category focus yields outsized commercial return.', color: BRAND_COLORS.procucevBlue },
        { title: 'SUPPLIER CONCENTRATION', sub: 'Top 42 Suppliers = 82.5% of Spend', stat: '₹506.45 Cr', desc: 'Top 10.0% of supplier base accounts for 82.5% of spend. Enables high-leverage strategic partnerships and bilateral tenders without spreading resources thin.', color: BRAND_COLORS.accentGreen },
        { title: 'SKU / ITEM CONCENTRATION', sub: 'Top 20% SKUs = 81.0% of Spend', stat: '1,420 Active SKUs', desc: 'High concentration across standardized recurring items. Rationalizing minor specification variations across operating units unlocks multi-plant volume pooling.', color: '#0284C7' }
      ]
    : [
        { title: 'CATEGORY CONCENTRATION', sub: 'Top 15 Categories = 78.4% of Spend', stat: '₹4,641.55 Cr', desc: 'Clustered in core industrial inputs (limestone, coal, petcoke, PP packaging, and freight). High category focus yields outsized commercial return.', color: BRAND_COLORS.procucevBlue },
        { title: 'SUPPLIER CONCENTRATION', sub: 'Top 62 Suppliers = 81.4% of Spend', stat: '₹4,819.17 Cr', desc: 'Top 6.4% of supplier base accounts for 81.4% of spend. Enables high-leverage strategic partnerships and bilateral e-auctions without spreading bandwidth thin.', color: BRAND_COLORS.accentGreen },
        { title: 'SKU / ITEM CONCENTRATION', sub: 'Top 18% SKUs = 84.2% of Spend', stat: '3,120 Active SKUs', desc: 'High concentration across standardized recurring items. Rationalizing minor specification variations across operating units unlocks massive national volume pooling.', color: '#0284C7' }
      ];

  paretoCards.forEach((cd, idx) => {
    const x = 0.5 + idx * 3.05;
    s12.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s12.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: cd.color.replace('#', '') } });
    s12.addText(cd.title, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.25, fontSize: 9.5, bold: true, color: cd.color.replace('#', ''), fontFace });
    s12.addText(cd.sub, { x: x + 0.15, y: 1.5, w: 2.6, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s12.addText(cd.stat, { x: x + 0.15, y: 1.8, w: 2.6, h: 0.45, fontSize: 20, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s12.addText(cd.desc, { x: x + 0.15, y: 2.35, w: 2.6, h: 1.7, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });
  addSlideFooter(s12, clientName, 12, totalSlides);

  // Slide 13: Forensic Observations
  const s13 = pptx.addSlide();
  s13.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s13, 'Module 1 Findings: Forensic Spend Observations & Root Causes', 'Forensic Findings', 13);

  const findings13 = isCust
    ? [
        { n: '01', t: 'Plant Rate Incoherence', s: 'Up to 22% Price Spread', d: `Identical synthetic yarns, dyes, and packaging bought at disparate rates across ${contract.baselinePlants} units.`, o: 'Arbitrage: ₹24.80 Cr' },
        { n: '02', t: 'Uncontrolled Spot Orders', s: '38.4% Non-Contracted', d: 'Spend executed without corporate volume discount tiers, driving unbudgeted rate creep.', o: 'Control: ₹12.50 Cr' },
        { n: '03', t: 'Single-Plant Vendors', s: 'Fragmented Suppliers', d: `${contract.baselineSuppliers} vendors serving regional plants with high concentration, vulnerable to local pricing.`, o: 'Panelling: ₹18.50 Cr' },
        { n: '04', t: 'Payment Terms Disparity', s: 'Disparate Terms', d: 'Cycles range from 30 to 90 days. Standardizing to 60/90 days unlocks cash flow.', o: 'Working Cap: ₹11.20 Cr' },
        { n: '05', t: 'Duplicate SKU Masters', s: 'Inconsistent Specs', d: 'Over 850 redundant descriptions across chemical consumables and packaging.', o: 'Aggregation: ₹15.38 Cr' }
      ]
    : [
        { n: '01', t: 'Plant Rate Incoherence', s: 'Up to 24% Price Spread', d: 'Identical refractory bricks, grinding media, and packing bags bought at disparate rates across 26 units.', o: 'Arbitrage: ₹42.80 Cr' },
        { n: '02', t: 'Uncontrolled Spot Orders', s: '42.6% Non-Contracted', d: 'Spend executed off master contracts without volume discount tiers, driving unbudgeted rate creep.', o: 'Control: ₹14.20 Cr' },
        { n: '03', t: 'Single-Plant Vendors', s: '68% Regional Lock-In', d: '68% of suppliers serve only 1 plant despite footprint, leaving units vulnerable to local pricing.', o: 'Panelling: ₹26.40 Cr' },
        { n: '04', t: 'Payment Terms Disparity', s: '14 Active Terms', d: 'Cycles range from 30 to 90 days. Standardizing to 60/90 days unlocks cash flow.', o: 'Working Cap: ₹14.88 Cr' },
        { n: '05', t: 'Duplicate SKU Masters', s: 'Inconsistent Specs', d: 'Over 1,200 redundant descriptions for chemical consumables and lubricants.', o: 'Aggregation: ₹22.10 Cr' }
      ];

  findings13.forEach((f, idx) => {
    const x = 0.5 + idx * 1.82;
    s13.addShape('rect', { x, y: 1.15, w: 1.72, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s13.addShape('rect', { x, y: 1.15, w: 1.72, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s13.addText(f.n, { x: x + 0.1, y: 1.25, w: 1.52, h: 0.35, fontSize: 14, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
    s13.addText(f.t, { x: x + 0.1, y: 1.62, w: 1.52, h: 0.45, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s13.addText(f.s, { x: x + 0.1, y: 2.1, w: 1.52, h: 0.25, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s13.addText(f.d, { x: x + 0.1, y: 2.4, w: 1.52, h: 1.2, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s13.addShape('rect', { x: x + 0.08, y: 3.75, w: 1.56, h: 0.38, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s13.addText(f.o, { x: x + 0.1, y: 3.82, w: 1.52, h: 0.25, fontSize: 7.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
  });

  s13.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s13.addText('FORENSIC SOURCING TAKEAWAY: Root-cause analysis reveals that value loss is driven primarily by decentralized contracting autonomy and fragmented vendor management, rather than market rate inflation. Centralized rate governance restores discipline.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s13, clientName, 13, totalSlides);

  // Slide 14: Sourcing Opportunity Matrix
  const s14 = pptx.addSlide();
  s14.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s14, 'Module 2 - Strategic Sourcing Opportunity Matrix', 'Opportunity Matrix', 14);

  const quadrants14 = isCust
    ? [
        { t: 'LEVERAGE / QUICK WINS (HIGH IMPACT, HIGH LIQUIDITY)', x: 0.5, y: 1.15, c: BRAND_COLORS.accentGreen, text: '- Synthetic Yarns & Blends Reverse Auction (Opp: ₹18.25 Cr | Days 15-45)\n- Specialty Dyes & Chemicals Formula Reset (Opp: ₹16.41 Cr | Days 30-60)\n- Packaging Materials & Freight Pooling (Opp: ₹9.82 Cr | Days 1-30)\nACTION: Immediate Wave 1 execution via competitive e-auctions.' },
        { t: 'STRATEGIC CORE (HIGH IMPACT, SPECIALIZED SOURCING)', x: 5.15, y: 1.15, c: BRAND_COLORS.procucevBlue, text: '- Project Capex Equipment Rationalization (Opp: ₹19.04 Cr | Days 1-30)\n- Captive Energy & Process Fuel Contracts (Opp: ₹11.65 Cr | Days 45-75)\n- Multi-Plant Demand Aggregation (Opp: ₹10.47 Cr | Days 60-90)\nACTION: Strategic frame agreements linked to benchmark indices.' },
        { t: 'OPERATIONAL POLICY (MODERATE IMPACT, FAST EXECUTION)', x: 0.5, y: 2.75, c: BRAND_COLORS.secondaryText, text: '- Contract Price Compliance Audit (Opp: ₹4.80 Cr | 30 Days)\n- Payment Terms Standardization to 60/90 Days (Opp: ₹7.20 Cr | 45 Days)\n- Consumable SKU Catalog Rationalization (Opp: ₹5.10 Cr | 60 Days)\nACTION: ERP invoice 3-way match controls and catalog mandate.' },
        { t: 'BOTTLENECK & RISK (CONTROLLED COMMERCIAL INTERVENTION)', x: 5.15, y: 2.75, c: BRAND_COLORS.accentAmber, text: '- Specialized Spinning Spares & Loom Spares (Dual-source de-risking)\n- High-Purity Finishing Chemical Panelling (Opp: ₹4.20 Cr | Days 60-90)\n- Plant Auxiliary Consumables Standardization (Opp: ₹3.50 Cr)\nACTION: Technical qualification of second-source manufacturers.' }
      ]
    : [
        { t: 'LEVERAGE / QUICK WINS (HIGH IMPACT, HIGH LIQUIDITY)', x: 0.5, y: 1.15, c: BRAND_COLORS.accentGreen, text: '- HDPE Packaging Bags E-Auction (Opp: ₹14.50 Cr | Days 1-30)\n- Grinding Media Rate Harmonization (Opp: ₹11.20 Cr | Days 15-45)\n- Inbound Secondary Freight Dynamic Tenders (Opp: ₹9.60 Cr | Days 30-60)\nACTION: Immediate Wave 1 execution via competitive e-auctions.' },
        { t: 'STRATEGIC CORE (HIGH IMPACT, SPECIALIZED SOURCING)', x: 5.15, y: 1.15, c: BRAND_COLORS.procucevBlue, text: '- Petcoke & Thermal Coal Index Contracts (Opp: ₹9.80 Cr | Days 45-75)\n- Vendor Base Tail Consolidation (Opp: ₹26.40 Cr * | Days 60-90)\n- National Multi-Plant Demand Aggregation (Opp: ₹22.10 Cr | Days 60-90)\nACTION: Strategic frame agreements linked to benchmark indices.' },
        { t: 'OPERATIONAL POLICY (MODERATE IMPACT, FAST EXECUTION)', x: 0.5, y: 2.75, c: BRAND_COLORS.secondaryText, text: '- Contract Price Compliance Audit (Opp: ₹4.80 Cr | 30 Days)\n- Payment Terms Standardization to 60/90 Days (Opp: ₹14.20 Cr | 45 Days)\n- Standard Consumable SKU Rationalization (Opp: ₹6.30 Cr | 60 Days)\nACTION: ERP invoice 3-way match controls and catalog mandate.' },
        { t: 'BOTTLENECK & RISK (CONTROLLED COMMERCIAL INTERVENTION)', x: 5.15, y: 2.75, c: BRAND_COLORS.accentAmber, text: '- Specialized Instrumentation & Kiln Spares (Dual-source de-risking)\n- High-Grade Refractory Bricks OEM Sourcing (Opp: ₹6.00 Cr | Days 60-90)\n- Heavy Mobile Fleet Lubricants Synthetic Standardization (Opp: ₹6.40 Cr)\nACTION: Technical qualification of second-source manufacturers.' }
      ];

  quadrants14.forEach((q) => {
    s14.addShape('rect', { x: q.x, y: q.y, w: 4.35, h: 1.5, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s14.addShape('rect', { x: q.x, y: q.y, w: 4.35, h: 0.04, fill: { color: q.c.replace('#', '') } });
    s14.addText(q.t, { x: q.x + 0.15, y: q.y + 0.1, w: 4.05, h: 0.25, fontSize: 8.5, bold: true, color: q.c.replace('#', ''), fontFace });
    s14.addText(q.text, { x: q.x + 0.15, y: q.y + 0.38, w: 4.05, h: 1.05, fontSize: 8, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
  });

  const matrixNote = isCust
    ? '* Defensible sourcing model: Opportunity values are grounded strictly in ERP line-item purchase records.'
    : '* Indicative modelling assumption: Vendor consolidation 5% saving is an indicative modelling benchmark.';

  s14.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s14.addText(matrixNote, {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s14, clientName, 14, totalSlides);

  // Slide 15: Statistical Price Dispersion
  const s15 = pptx.addSlide();
  s15.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s15, 'Price Improvement Opportunities: Statistical Percentile Dispersion', 'Price Dispersion', 15);

  const dispersions15 = isCust
    ? [
        { item: 'Synthetic Polyester/Viscose Yarn', spec: 'Count 30s/40s Standard Blend', range: 'Min ₹185  |  P25: ₹196  |  Median: ₹212  |  P75: ₹228  |  Max: ₹242', spread: '23.5% Spread', opp: '₹18.25 Cr Proven Saving', desc: 'Unit rate dispersion across operating plants shows regional units paying up to ₹228/kg for identical yarn specifications.' },
        { item: 'Specialty Reactive Dyes & Pigments', spec: 'Standard Fastness Formulation', range: 'Min ₹420  |  P25: ₹450  |  Median: ₹495  |  P75: ₹540  |  Max: ₹590', spread: '28.6% Spread', opp: '₹16.41 Cr Proven Saving', desc: 'Operating units purchasing identical dye chemistry across multiple brands at disparate distributor rates.' },
        { item: 'Industrial Corrugated & Poly Packaging', spec: 'Multi-Layer Woven Fabric Bags', range: 'Min ₹18.50  |  P25: ₹19.40  |  Median: ₹21.00  |  P75: ₹22.80  |  Max: ₹24.50', spread: '21.6% Spread', opp: '₹9.82 Cr Proven Saving', desc: 'Local plant packaging purchases show 21.6% variance. Direct converter framework eliminates distributor markup.' }
      ]
    : [
        { item: 'Grinding Media High-Chrome Balls', spec: 'Size 60mm-90mm, High Alloy Steel', range: 'Min ₹72  |  P25: ₹76  |  Median: ₹82  |  P75: ₹89  |  Max: ₹96', spread: '26.3% Inter-Plant Spread', opp: '₹11.20 Cr Validated Saving', desc: 'Southern units buy at ₹76/kg while central units pay ₹89/kg from identical suppliers for identical metallurgy. Harmonizing to internal P25 captures ₹11.20 Cr.' },
        { item: 'HDPE Woven Packaging Bags', spec: '50kg Standard Cement Bag Spec', range: 'Min ₹14.20  |  P25: ₹14.80  |  Median: ₹15.60  |  P75: ₹16.40  |  Max: ₹17.80', spread: '15.4% Inter-Plant Spread', opp: '₹14.50 Cr Validated Saving', desc: '18 converters supplying across 24 plants at disparate negotiated conversion margins. Master e-auction locks in Tier-1 polymer contract rate.' },
        { item: 'Secondary Road Logistics Freight', spec: 'Standard 25-Ton Truckload, 200km', range: 'Min ₹2.40  |  P25: ₹2.65  |  Median: ₹2.90  |  P75: ₹3.15  |  Max: ₹3.45', spread: '18.9% Rate Spread', opp: '₹9.60 Cr Validated Saving', desc: 'Corridor rate divergence between dedicated fleet and spot market carriers across identical routes. Centralized reverse bidding captures market clearing rate.' }
      ];

  dispersions15.forEach((dp, idx) => {
    const x = 0.5 + idx * 3.05;
    s15.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s15.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s15.addText(dp.item, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.28, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s15.addText(dp.spec, { x: x + 0.15, y: 1.55, w: 2.6, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s15.addShape('rect', { x: x + 0.15, y: 1.82, w: 2.6, h: 0.55, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s15.addText(dp.range, { x: x + 0.2, y: 1.9, w: 2.5, h: 0.38, fontSize: 7.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s15.addText(dp.spread, { x: x + 0.15, y: 2.45, w: 2.6, h: 0.22, fontSize: 8.5, bold: true, color: BRAND_COLORS.accentAmber.replace('#', ''), fontFace });
    s15.addText(dp.desc, { x: x + 0.15, y: 2.72, w: 2.6, h: 0.95, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s15.addShape('rect', { x: x + 0.15, y: 3.75, w: 2.6, h: 0.38, fill: { color: 'ECFDF5' }, line: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
    s15.addText(dp.opp, { x: x + 0.2, y: 3.82, w: 2.5, h: 0.25, fontSize: 8.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  });

  s15.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s15.addText('STATISTICAL HARMONIZATION STANDARD: Procucev sets savings targets to the internal 25th percentile (P25) rate already achieved by top-performing plants, not unrealistic minimums. Because internal units already buy at P25, this rate is 100% operationally proven.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s15, clientName, 15, totalSlides);
}
