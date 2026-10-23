/**
 * Executive Brief PPTX Slides 23 to 25 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Execution Pipeline, Initiative Ledger, and 90-Day Roadmap
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment,
  formatPresentationValues
} from '../constants/executiveBriefPresentationConstants';

export function renderPptxSlide23(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  const s23 = pptx.addSlide();
  s23.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s23, 'Savings Realization Pipeline: Governance from Opportunity to P&L', 'Execution Governance', 23);

  const stages = isCust
    ? [
        { n: 'STAGE 1', t: 'IDENTIFIED', v: fmt.grossOpportunityFormatted, s: 'Gross Levers', d: 'Total sum of individual sourcing lever potentials before interaction deduplication.', c: BRAND_COLORS.secondaryText },
        { n: 'STAGE 2', t: 'DEDUPLICATED', v: fmt.netDirectSavingsFormatted, s: 'Net Defensible', d: `Rigorous deduction of ${fmt.overlapDeductionsFormatted} cross-lever overlaps.`, c: BRAND_COLORS.procucevBlue },
        { n: 'STAGE 3', t: 'PROVEN', v: fmt.provenOpportunityFormatted, s: 'Proven Opportunity', d: 'Fully verified supplier capacity, invoice variance proof, and 90-day tender readiness.', c: BRAND_COLORS.accentGreen },
        { n: 'STAGE 4', t: 'CONTRACTED', v: 'Wave 1 Awards', s: 'Commercial Contracts', d: 'Legally binding master contracts, e-auction awards, and index formulas ready for award.', c: '#0284C7' },
        { n: 'STAGE 5', t: 'REALIZED', v: fmt.realizedSavingsFormatted, s: 'Audited Realized *', d: 'Realized savings remain ₹0.00 Cr until post-award ERP invoices are verified against new contracts.', c: BRAND_COLORS.accentAmber }
      ]
    : [
        { n: 'STAGE 1', t: 'IDENTIFIED', v: '₹173.12 Cr', s: 'Gross Standalone', d: 'Total sum of individual sourcing lever potentials before interaction deduplication.', c: BRAND_COLORS.secondaryText },
        { n: 'STAGE 2', t: 'DEDUPLICATED', v: '₹93.60 Cr', s: 'Net Defensible', d: 'Rigorous deduction of ₹62.80 Cr overlaps and ₹16.72 Cr policy exclusions.', c: BRAND_COLORS.procucevBlue },
        { n: 'STAGE 3', t: 'VALIDATED', v: '₹47.90 Cr', s: 'Wave 1 Pre-Qualified', d: 'Fully verified supplier capacity, approved specs, and 90-day tender readiness.', c: BRAND_COLORS.accentGreen },
        { n: 'STAGE 4', t: 'CONTRACTED', v: 'In Execution', s: 'Commercial Awards', d: 'Legally binding master contracts, e-auction awards, and index formulas locked in.', c: '#0284C7' },
        { n: 'STAGE 5', t: 'REALIZED', v: '₹68.00 Cr', s: 'Classified Realized *', d: 'Audited ERP invoice payments showing direct P&L recurring EBITDA expansion.', c: BRAND_COLORS.accentAmber }
      ];

  stages.forEach((st, idx) => {
    const x = 0.5 + idx * 1.82;
    s23.addShape('rect', { x, y: 1.15, w: 1.72, h: 2.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s23.addShape('rect', { x, y: 1.15, w: 1.72, h: 0.04, fill: { color: st.c.replace('#', '') } });
    s23.addText(`${st.n}\n${st.t}`, { x: x + 0.1, y: 1.25, w: 1.52, h: 0.42, fontSize: 8.5, bold: true, color: st.c.replace('#', ''), fontFace });
    s23.addText(st.v, { x: x + 0.1, y: 1.7, w: 1.52, h: 0.35, fontSize: 13, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s23.addText(st.s, { x: x + 0.1, y: 2.05, w: 1.52, h: 0.22, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s23.addText(st.d, { x: x + 0.1, y: 2.3, w: 1.52, h: 0.85, fontSize: 7.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
  });

  const leftCardTitle = isCust ? `PROVEN SOURCING OPPORTUNITY: ${fmt.provenOpportunityFormatted}` : 'WAVE 1 VALIDATED SAVINGS: ₹47.90 Cr';
  const leftCardText = isCust
    ? `Directly evidenced across 23,570 ERP transaction records spanning ${contract.baselineSuppliers} suppliers. Supported by empirical price dispersion across operating units, providing immediate execution readiness.`
    : 'Wave 1 initiatives represent immediate, low-risk sourcing interventions that have passed engineering specification reviews and vendor capacity checks. These 5 initiatives can be deployed within 90 days to deliver immediate P&L cash savings.';

  s23.addShape('rect', { x: 0.5, y: 3.38, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s23.addShape('rect', { x: 0.5, y: 3.38, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s23.addText(leftCardTitle, { x: 0.65, y: 3.48, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
  s23.addText(leftCardText, {
    x: 0.65, y: 3.75, w: 4.0, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });

  const rightCardTitle = isCust ? `REALIZED SAVINGS STATUS: ${fmt.realizedSavingsFormatted} *` : 'CLASSIFIED REALIZED SAVINGS: ₹68.00 Cr *';
  const rightCardText = isCust
    ? '* Realized Savings strictly reflect post-implementation ERP invoice payments. Value remains strictly ₹0.00 Cr during assessment phase to maintain forensic audit integrity and eliminate premature savings claims.'
    : '* Classified Realized Savings represents separate historical realized savings tracked in Procucev forensic database; not additive to Wave-1 opportunity. Prevents double-counting between past completed initiatives and forward-looking pipeline.';

  s23.addShape('rect', { x: 5.15, y: 3.38, w: 4.35, h: 1.6, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s23.addShape('rect', { x: 5.15, y: 3.38, w: 4.35, h: 0.04, fill: { color: BRAND_COLORS.accentAmber.replace('#', '') } });
  s23.addText(rightCardTitle, { x: 5.3, y: 3.48, w: 4.0, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentAmber.replace('#', ''), fontFace });
  s23.addText(rightCardText, {
    x: 5.3, y: 3.75, w: 4.0, h: 1.1, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });

  addSlideFooter(s23, clientName, 23, totalSlides);
}

export function renderPptxSlide24(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  const s24 = pptx.addSlide();
  s24.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s24, 'Savings Realization: Wave 1 Initiative Tracking & Milestone Status', 'Initiative Ledger', 24);

  const tableRows: PptxGenJS.TableRow[] = isCust
    ? [
        [
          { text: 'Initiative Name', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Category', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Target Levers', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Addressable', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Opportunity', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Timeline', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } }
        ],
        [{ text: 'Project Capex Equipment Rationalization' }, { text: 'Capital Goods' }, { text: 'Spec Standardization & Bidding' }, { text: '₹52.48 Cr' }, { text: '₹19.04 Cr' }, { text: 'Days 1-30' }],
        [{ text: 'Synthetic Yarns & Blends Harmonization' }, { text: 'Raw Materials' }, { text: 'Price Variance Arbitrage' }, { text: '₹78.20 Cr' }, { text: '₹18.25 Cr' }, { text: 'Days 15-45' }],
        [{ text: 'Specialty Dyes & Finishing Chemicals' }, { text: 'Chemicals' }, { text: 'Index Linkage & Consolidation' }, { text: '₹49.12 Cr' }, { text: '₹16.41 Cr' }, { text: 'Days 30-60' }],
        [{ text: 'Captive Energy & Process Fuel Realignment' }, { text: 'Energy' }, { text: 'Commercial Contract Reset' }, { text: '₹38.60 Cr' }, { text: '₹11.65 Cr' }, { text: 'Days 45-75' }],
        [{ text: 'Packaging Materials & Freight Pooling' }, { text: 'Packaging' }, { text: 'E-Auction & Freight Pooling' }, { text: '₹42.85 Cr' }, { text: '₹9.82 Cr' }, { text: 'Days 60-90' }]
      ]
    : [
        [
          { text: 'Initiative Name', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Category', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Target Levers', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Addressable', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Opportunity', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
          { text: 'Timeline', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } }
        ],
        [{ text: 'Packaging Bags Master E-Auction' }, { text: 'Packaging' }, { text: 'E-Auction & Index Linkage' }, { text: '₹947.26 Cr' }, { text: '₹14.50 Cr' }, { text: 'Days 1-30' }],
        [{ text: 'Grinding Media Rate Harmonization' }, { text: 'Consumables' }, { text: 'Price Variance Arbitrage' }, { text: '₹412.00 Cr' }, { text: '₹11.20 Cr' }, { text: 'Days 15-45' }],
        [{ text: 'Imported Fuel Benchmark Realignment' }, { text: 'Energy' }, { text: 'PCBI Benchmark Index' }, { text: '₹1,480.09 Cr' }, { text: '₹9.80 Cr' }, { text: 'Days 30-60' }],
        [{ text: 'Industrial Lubricants Synthetic Pooling' }, { text: 'Maintenance' }, { text: 'Volume Aggregation & OEM' }, { text: '₹186.00 Cr' }, { text: '₹6.40 Cr' }, { text: 'Days 45-75' }],
        [{ text: 'Refractory Bricks Spec Standardization' }, { text: 'Raw Materials' }, { text: 'Vendor Panelling & Aggregation' }, { text: '₹265.00 Cr' }, { text: '₹6.00 Cr' }, { text: 'Days 60-90' }]
      ];

  s24.addTable(tableRows, { x: 0.5, y: 1.15, w: 9.0, h: 2.2, colW: [2.5, 1.1, 2.0, 1.2, 1.2, 1.0], fontSize: 8.5, color: '334155', fill: { color: 'FFFFFF' } });

  const summaryStripText = isCust
    ? `TOTAL PROVEN SOURCING OPPORTUNITY: ${fmt.provenOpportunityFormatted}  (Empirically Evidenced across Top Priority Sourcing Initiatives)`
    : 'TOTAL WAVE 1 VALIDATED OPPORTUNITY: ₹47.90 Cr  (Ready for Immediate 90-Day Execution across 5 Pre-Qualified Initiatives)';

  s24.addShape('rect', { x: 0.5, y: 3.55, w: 9.0, h: 0.44, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
  s24.addText(summaryStripText, {
    x: 0.65, y: 3.62, w: 8.7, h: 0.3, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });

  const leftBoxText = isCust
    ? `TRANSACTION-LEVEL EVIDENCE BASE: All initiatives are grounded in actual ERP purchase orders and line-item invoice records across 6 operating units spanning ${contract.baselineSuppliers} suppliers.`
    : 'PRE-QUALIFIED SUPPLIER READINESS: All 5 Wave 1 initiatives have identified >= 3 pre-qualified manufacturers with verified production capacity. Technical specifications have been matched against plant engineering standards.';

  s24.addShape('rect', { x: 0.5, y: 4.12, w: 4.35, h: 0.95, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s24.addText(leftBoxText, {
    x: 0.65, y: 4.18, w: 4.0, h: 0.8, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });

  s24.addShape('rect', { x: 5.15, y: 4.12, w: 4.35, h: 0.95, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s24.addText('DIRECT P&L CASH SAVINGS TIMELINE: Realized savings flow directly into plant operational budgets starting Month 2 of implementation. The Procucev invoice tracking dashboard matches every invoice rate against baseline contracts.', {
    x: 5.3, y: 4.18, w: 4.0, h: 0.8, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });

  addSlideFooter(s24, clientName, 24, totalSlides);
}

export function renderPptxSlide25(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);
  const fmt = formatPresentationValues(contract, isCust);

  const s25 = pptx.addSlide();
  s25.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s25, 'Priority Execution Roadmap: Phased 90-Day Implementation Timeline', 'Execution Schedule', 25);

  const phases = isCust
    ? [
        { p: 'DAYS 1-30', t: 'Mobilize & Quick Wins', m: '₹19.04 Cr Capex & Quick Wins', c: BRAND_COLORS.accentGreen, text: '- Form joint commercial steering team\n- Verify yarn and dye specifications\n- Issue RFPs for priority packaging lines\n- Lock in ERP price tolerance thresholds' },
        { p: 'DAYS 31-60', t: 'Market Tenders & Panelling', m: '₹34.66 Cr In Process', c: BRAND_COLORS.procucevBlue, text: '- Conduct e-auctions for packaging and dyes\n- Harmonize yarn rates across operating units\n- Standardize transport freight contracts\n- Consolidate chemical supplier panels' },
        { p: 'DAYS 61-90', t: 'Contract Execution & Handover', m: `${fmt.provenOpportunityFormatted} Proven Value`, c: '#0284C7', text: '- Execute master frame agreements\n- Implement formula-linked energy contracts\n- Rationalize vendor base into panels\n- Deploy Procucev invoice tracking dashboard' },
        { p: 'DAYS 90+', t: 'Sustained Value Run-Rate', m: `${fmt.netDirectSavingsFormatted} Full Run-Rate`, c: BRAND_COLORS.accentAmber, text: '- Expand sourcing interventions to Wave 2\n- Automate quarterly contract rate audits\n- Track supplier delivery SLAs monthly\n- Maintain zero off-contract purchase drift' }
      ]
    : [
        { p: 'DAYS 1-30', t: 'Mobilize & Quick Wins', m: '₹14.50 Cr Tender Ready', c: BRAND_COLORS.accentGreen, text: '- Form joint commercial working group\n- Verify packaging specs across 26 plants\n- Issue RFP for 320M HDPE Bags reverse auction\n- Lock in ERP price tolerance thresholds' },
        { p: 'DAYS 31-60', t: 'Market Tenders & Panelling', m: '₹25.70 Cr In Process', c: BRAND_COLORS.procucevBlue, text: '- Conduct live reverse auction for packaging bags\n- Harmonize grinding media rates to ₹76/kg\n- Execute corridor bidding for secondary freight\n- Issue technical RFPs for lubricant consolidation' },
        { p: 'DAYS 61-90', t: 'Contract Execution & Handover', m: '₹47.90 Cr Wave 1 Locked', c: '#0284C7', text: '- Execute master frame agreements with winners\n- Implement index-linked fuel contracts\n- Consolidate 912 tail suppliers into panels\n- Deploy Procucev invoice tracking dashboard' },
        { p: 'DAYS 90+', t: 'Sustained Value Run-Rate', m: '₹78.72 Cr Full Run-Rate', c: BRAND_COLORS.accentAmber, text: '- Expand sourcing interventions to Wave 2 spares\n- Automate quarterly market index resets\n- Audit supplier delivery SLAs monthly\n- Maintain zero off-contract purchase drift' }
      ];

  phases.forEach((ph, idx) => {
    const x = 0.5 + idx * 2.28;
    s25.addShape('rect', { x, y: 1.15, w: 2.15, h: 3.1, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s25.addShape('rect', { x, y: 1.15, w: 2.15, h: 0.05, fill: { color: ph.c.replace('#', '') } });
    s25.addText(ph.p, { x: x + 0.1, y: 1.25, w: 1.95, h: 0.22, fontSize: 9.5, bold: true, color: ph.c.replace('#', ''), fontFace });
    s25.addText(ph.t, { x: x + 0.1, y: 1.5, w: 1.95, h: 0.35, fontSize: 9, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
    s25.addText(ph.text, { x: x + 0.1, y: 1.9, w: 1.95, h: 1.8, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    s25.addShape('rect', { x: x + 0.08, y: 3.75, w: 1.99, h: 0.38, fill: { color: BRAND_COLORS.canvas.replace('#', '') }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s25.addText(ph.m, { x: x + 0.12, y: 3.82, w: 1.9, h: 0.25, fontSize: 8, bold: true, color: ph.c.replace('#', ''), fontFace });
  });

  const footerVelocity = isCust
    ? 'EXECUTION VELOCITY PRINCIPLE: Sourcing initiatives are structured for rapid 90-day cash realization without disrupting daily operations. Early quick wins build organizational momentum for broader cross-unit consolidation.'
    : 'EXECUTION VELOCITY PRINCIPLE: Wave 1 is structured for rapid 90-day cash realization without disrupting daily plant operations. Early packaging and grinding media tenders deliver immediate proof-of-value, building organizational momentum for broader cross-plant consolidation.';

  s25.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.65, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s25.addText(footerVelocity, {
    x: 0.65, y: 4.45, w: 8.7, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
  });

  addSlideFooter(s25, clientName, 25, totalSlides);
}
