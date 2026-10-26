/**
 * Executive Brief PPTX Slides 19 to 20 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Volume aggregation and PCBI market benchmark coverage.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter, addPptxKpiCard } from './executiveBriefPptxHelpers';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment,
  formatPresentationValues
} from '../constants/executiveBriefPresentationConstants';

export function renderPptxSlide19(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const isCust = isCustomerAssessment(clientName);

  const s19 = pptx.addSlide();
  s19.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s19, 'Volume Aggregation: National Demand Pooling on Standardized Specs', 'Scale Sourcing', 19);

  const examples19 = isCust
    ? [
        { t: 'SYNTHETIC YARNS & BLENDS', s: 'Polyester / Viscose Standard Counts', b: '6 operating units buying fragmented lots from regional traders at disparate rates.', i: 'Pool multi-unit volume into direct framework contract with Tier-1 yarn spinners.', a: 'Harmonized contract pricing with volume rebate structure across all plants.', sv: '₹18.25 Cr Proven Saving', c: BRAND_COLORS.procucevBlue },
        { t: 'SPECIALTY DYES & CHEMICALS', s: 'Standard Reactive Dyes & Finishing Agents', b: 'Operating units purchasing 40+ branded formulations from regional distributors.', i: 'Standardize to top 15 core active formulations and tender directly to primary chemical producers.', a: 'Harmonized contract rate with quarterly index linkage formula.', sv: '₹16.41 Cr Proven Saving', c: BRAND_COLORS.accentGreen },
        { t: 'CAPTIVE ENERGY & FUEL', s: 'Process Steam & Captive Power Fuel', b: 'Plant-level spot purchases with wide unit rate dispersion across suppliers.', i: 'Consolidate fuel procurement into single corporate framework agreement.', a: 'Direct supplier rate alignment with bilateral index formula linkage.', sv: '₹11.65 Cr Proven Saving', c: '#0284C7' }
      ]
    : [
        { t: 'HDPE PACKAGING BAGS', s: '50kg Laminated Cement Sacks', b: '24 plants buying fragmented lots from 18 regional converters at ₹16.40/pc avg.', i: 'Pool 320 Million Bags into national master tender benchmarked to Platts PP index.', a: 'Harmonized ₹14.80/pc factory contract with Tier-1 polymer converters.', sv: '₹14.50 Cr Validated Saving', c: BRAND_COLORS.procucevBlue },
        { t: 'GRINDING MEDIA BALLS', s: 'High Chrome Alloy Steel 70mm', b: '18 plants issuing 200-500 MT orders at disparate rates up to ₹89/kg.', i: 'Consolidate 14,200 MT national demand package direct to primary alloy mills.', a: 'Harmonized ₹76/kg contract rate with staged quarterly plant delivery.', sv: '₹11.20 Cr Validated Saving', c: BRAND_COLORS.accentGreen },
        { t: 'INDUSTRIAL LUBRICANTS', s: 'Heavy Synthetic Gear & Mill Oils', b: '14 fragmented plant orders across 6 disparate local distributor brands.', i: 'Standardize to 3 high-performance synthetic grades via direct OEM refinery pact.', a: 'Master agreement securing 15% tier discount and bulk ISO container delivery.', sv: '₹6.40 Cr Validated Saving', c: '#0284C7' }
      ];

  examples19.forEach((ex, idx) => {
    const x = 0.5 + idx * 3.05;
    s19.addShape('rect', { x, y: 1.15, w: 2.9, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s19.addShape('rect', { x, y: 1.15, w: 2.9, h: 0.05, fill: { color: ex.c.replace('#', '') } });
    s19.addText(ex.t, { x: x + 0.15, y: 1.25, w: 2.6, h: 0.28, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s19.addText(ex.s, { x: x + 0.15, y: 1.55, w: 2.6, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });

    s19.addShape('rect', { x: x + 0.15, y: 1.82, w: 2.6, h: 0.5, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s19.addText(`BEFORE: ${ex.b}`, { x: x + 0.2, y: 1.85, w: 2.5, h: 0.45, fontSize: 7.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });

    s19.addShape('rect', { x: x + 0.15, y: 2.38, w: 2.6, h: 0.5, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s19.addText(`INTERVENTION: ${ex.i}`, { x: x + 0.2, y: 2.41, w: 2.5, h: 0.45, fontSize: 7.5, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });

    s19.addShape('rect', { x: x + 0.15, y: 2.94, w: 2.6, h: 0.5, fill: { color: 'ECFDF5' }, line: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
    s19.addText(`AFTER: ${ex.a}`, { x: x + 0.2, y: 2.97, w: 2.5, h: 0.45, fontSize: 7.5, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });

    s19.addShape('rect', { x: x + 0.15, y: 3.75, w: 2.6, h: 0.38, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s19.addText(ex.sv, { x: x + 0.2, y: 3.82, w: 2.5, h: 0.25, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
  });

  s19.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s19.addText('SPECIFICATION STANDARDIZATION AUDIT MANDATE: Volume aggregation is evaluated strictly on identical technical specifications and validated manufacturer capacity. Demand is never arbitrarily grouped across dissimilar grades. Pooling recurring spend unlocks Tier-1 pricing.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s19, clientName, 19, totalSlides);
}

export function renderPptxSlide20(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  const s20 = pptx.addSlide();
  s20.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s20, 'Module 3 - PCBI Benchmark Coverage & Market Alignment', 'Market Intelligence', 20);

  if (isCust) {
    addPptxKpiCard(s20, 0.5, 1.1, 2.15, 0.95, 'PCBI Covered Spend', 'UNAVAILABLE', 'Pending Category Benchmark Ingestion', BRAND_COLORS.secondaryText);
    addPptxKpiCard(s20, 2.78, 1.1, 2.15, 0.95, 'Benchmark Indices', '0 Active Feeds', 'Zero external proxy substituted', BRAND_COLORS.secondaryText);
    addPptxKpiCard(s20, 5.06, 1.1, 2.15, 0.95, 'Index Correlation', 'UNAVAILABLE', 'Empirical Isolation Maintained', '#64748B');
    addPptxKpiCard(s20, 7.35, 1.1, 2.15, 0.95, 'Strategic Market Value', '₹0.00 Cr', 'No Modelled Uplift Substituted', BRAND_COLORS.accentAmber);

    s20.addShape('rect', { x: 0.5, y: 2.2, w: 4.35, h: 2.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s20.addShape('rect', { x: 0.5, y: 2.2, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.secondaryText.replace('#', '') } });
    s20.addText('BENCHMARK AVAILABILITY STATUS', { x: 0.65, y: 2.3, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s20.addText(`PCBI Benchmark Price Gap: UNAVAILABLE for ${clientName}.\n\nExternal PCBI benchmark indices are not configured for this customer assessment. In accordance with data governance policies, all opportunity modeling is derived strictly from verified internal ERP records without external market index assumptions.`, {
      x: 0.65, y: 2.6, w: 4.0, h: 1.5, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });

    s20.addShape('rect', { x: 5.15, y: 2.2, w: 4.35, h: 2.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s20.addShape('rect', { x: 5.15, y: 2.2, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s20.addText('INTERNAL ERP EVIDENCE GOVERNANCE', { x: 5.3, y: 2.3, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
    s20.addText(`The ${fmt.provenOpportunityFormatted} proven opportunity is established through internal unit rate dispersion across suppliers and operating entities within ${clientName}'s actual purchase history.\n\nZero speculative market indices have been applied, ensuring 100% forensic defensibility.`, {
      x: 5.3, y: 2.6, w: 4.0, h: 1.5, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });
  } else {
    addPptxKpiCard(s20, 0.5, 1.1, 2.15, 0.95, 'PCBI Covered Spend', '₹1,480.00 Cr', 'Key Industrial Commodities', BRAND_COLORS.procucevBlue);
    addPptxKpiCard(s20, 2.78, 1.1, 2.15, 0.95, 'Benchmark Indices', '28 Commodity Indices', 'Coal, Petcoke, Polymer, Steel', BRAND_COLORS.accentGreen);
    addPptxKpiCard(s20, 5.06, 1.1, 2.15, 0.95, 'Index Correlation', '94.2% Market R2', 'Empirical Landing Price Match', '#0284C7');
    addPptxKpiCard(s20, 7.35, 1.1, 2.15, 0.95, 'Strategic Market Value', '₹14.88 Cr', 'Contract Timing & Formula Reset', BRAND_COLORS.accentAmber);

    s20.addShape('rect', { x: 0.5, y: 2.2, w: 4.35, h: 2.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s20.addShape('rect', { x: 0.5, y: 2.2, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s20.addText('INDEPENDENT MARKET DATA PLATFORM', { x: 0.65, y: 2.3, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
    s20.addText('PCBI tracks daily physical transaction prices, port-landed imports, and domestic refinery gates across 28 core industrial commodities. PCBI benchmarks reflect true landed plant parity prices after logistics and local taxes.', {
      x: 0.65, y: 2.6, w: 4.0, h: 1.5, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });

    s20.addShape('rect', { x: 5.15, y: 2.2, w: 4.35, h: 2.05, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s20.addShape('rect', { x: 5.15, y: 2.2, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
    s20.addText('BENCHMARK CORRELATION RIGOR', { x: 5.3, y: 2.3, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
    s20.addText('Statistical regression of historical invoice purchase prices against PCBI indices confirms a 94.2% correlation (R2). High correlation proves that plant purchasing variance is commercially actionable through index-linked pricing.', {
      x: 5.3, y: 2.6, w: 4.0, h: 1.5, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });
  }

  s20.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s20.addText('PCBI INDEPENDENCE GOVERNANCE: PCBI indices are curated independently of supplier bids, ensuring an uncorrupted external price baseline for fact-based supplier negotiations and quarterly formula contract resets.', {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s20, clientName, 20, totalSlides);
}
