/**
 * Executive Brief PPTX Slide 6
 * Implements Procurement Impact on Business (Slide 2 of Customer Context) or Demo Strategic Alignment.
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import { getExecutiveBriefPresentationContract, isCustomerAssessment } from '../constants/executiveBriefPresentationConstants';

export function renderSlide6Pptx(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  const evaluatedSpendFormatted = isCust ? '₹613.8805 Cr' : '₹5,920.35 Cr';
  const grossOpportunityFormatted = isCust ? '₹110.764 Cr' : '₹173.12 Cr';
  const overlapDeductionsFormatted = isCust ? '₹25.123 Cr' : '₹62.80 Cr';
  const netPipelineFormatted = isCust ? '₹85.641 Cr' : '₹93.60 Cr';
  const provenOpportunityFormatted = isCust ? '₹82.380 Cr' : '₹47.90 Cr';
  const realizedSavingsFormatted = isCust ? '₹0.00 Cr' : '₹68.00 Cr';
  const activeSuppliers = contract.baselineSuppliers;
  const materialGroups = contract.baselineMaterialGroups;

  const s6 = pptx.addSlide();
  s6.background = { color: BRAND_COLORS.canvas.replace('#', '') };

  if (isCust) {
    addSlideHeader(s6, `Procurement Impact on Business: ${clientName} Strategic Opportunity`, 'Procurement Impact', 6);

    // Left Column: Assessed Spend Baseline & Key Procurement Priorities
    s6.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 3.15, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s6.addShape('rect', { x: 0.5, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s6.addText('ASSESSED SPEND & PROCUREMENT PRIORITIES', { x: 0.7, y: 1.25, w: 3.9, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
    s6.addText(`Assessed Spend: ${evaluatedSpendFormatted} across ${materialGroups} categories and ${activeSuppliers} active vendors over 12 months.`, {
      x: 0.7, y: 1.52, w: 3.9, h: 0.45, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });

    const custPrios = [
      { t: '1. Synthetic Fiber & Dyes Harmonization', d: 'Eliminate multi-plant unit rate divergence across polyester and specialty chemicals.' },
      { t: '2. Energy & Captive Power Pooling', d: 'Harmonize solid fuels and grid power tariffs across operating facilities.' },
      { t: '3. Packaging & Consumables Consolidation', d: 'Pool regional packaging volumes to secure direct manufacturer pricing.' }
    ];
    custPrios.forEach((cp, idx) => {
      const pY = 2.05 + idx * 0.7;
      s6.addText(cp.t, { x: 0.7, y: pY, w: 3.9, h: 0.22, fontSize: 9, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
      s6.addText(cp.d, { x: 0.7, y: pY + 0.22, w: 3.9, h: 0.42, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    });

    // Right Column: Value Framework & Governance Distinctions
    s6.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 3.15, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
    s6.addShape('rect', { x: 5.15, y: 1.15, w: 4.35, h: 0.05, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
    s6.addText('VALUE CLASSIFICATION & GOVERNANCE', { x: 5.35, y: 1.25, w: 3.9, h: 0.22, fontSize: 9.5, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });

    const valCards = [
      { t: 'Approved Net Modelled Opportunity', v: netPipelineFormatted, d: `Gross ${grossOpportunityFormatted} less ${overlapDeductionsFormatted} overlap deductions. Highly defensible.`, c: BRAND_COLORS.accentGreen },
      { t: 'Proven Opportunity (Empirical Criteria)', v: provenOpportunityFormatted, d: 'Strictly satisfies empirical criteria with verified transactional baseline.', c: BRAND_COLORS.procucevBlue },
      { t: 'Realized Savings to Date', v: realizedSavingsFormatted, d: 'Conservative governance: ₹0.00 recognized until post-execution invoice validation.', c: BRAND_COLORS.secondaryText }
    ];
    valCards.forEach((vc, idx) => {
      const vY = 1.55 + idx * 0.85;
      s6.addText(`${vc.t}: ${vc.v}`, { x: 5.35, y: vY, w: 3.9, h: 0.24, fontSize: 9.5, bold: true, color: vc.c.replace('#', ''), fontFace });
      s6.addText(vc.d, { x: 5.35, y: vY + 0.24, w: 3.9, h: 0.55, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
    });

    // Bottom Callout: Recommended Action & PCBI Benchmark Status
    s6.addShape('rect', { x: 0.5, y: 4.4, w: 9.0, h: 0.68, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s6.addText('RECOMMENDED ACTION: Authorize Wave 1 sourcing tenders across Synthetic Yarns and Specialty Chemicals to capture initial savings. [PCBI Benchmark Price Gap: UNAVAILABLE - Demonstration benchmarks are excluded from customer assessment]', {
      x: 0.65, y: 4.46, w: 8.7, h: 0.56, fontSize: 8.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
    });
  } else {
    // Demonstration Archetype
    addSlideHeader(s6, 'Strategic Alignment: Procurement Value Creation Map [Demo Archetype]', 'Strategic Alignment', 6);

    const rows6 = [
      { c: 'Decentralized Multi-Plant Network', i: 'Autonomous plant buying leads to regional rate divergence', h: 'Rate harmonization across 26 units captures ₹42.80 Cr' },
      { c: 'Capital-Intensive Logistics & Freight', i: 'High freight sensitivity with multiple carrier contracts', h: 'Dynamic e-auctions capture ₹31.50 Cr across freight & packing' },
      { c: 'Fragmented Tail Vendor Base', i: '912 tail suppliers drive heavy operational processing load', h: 'Vendor rationalization yields ₹26.40 Cr indicative value *' },
      { c: 'High Input Commodity Volatility', i: 'Coal, petcoke, and additives expose EBITDA to market swings', h: 'PCBI index formulas deliver ₹14.88 Cr strategic market upside' },
      { c: 'Specification Diversity Across Units', i: 'Duplicate SKU specs prevent national volume aggregation', h: 'National spec pooling captures ₹22.10 Cr OEM volume pricing' }
    ];
    rows6.forEach((r, idx) => {
      const y = 1.15 + idx * 0.62;
      s6.addShape('rect', { x: 0.5, y, w: 9.0, h: 0.56, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
      s6.addText(`${r.c}\nIndustrial Characteristic`, { x: 0.6, y: y + 0.05, w: 2.6, h: 0.46, fontSize: 8.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace });
      s6.addText('->', { x: 3.25, y: y + 0.12, w: 0.3, h: 0.3, fontSize: 13, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
      s6.addText(r.i, { x: 3.55, y: y + 0.06, w: 2.6, h: 0.44, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace });
      s6.addText('->', { x: 6.2, y: y + 0.12, w: 0.3, h: 0.3, fontSize: 13, bold: true, color: BRAND_COLORS.accentGreen.replace('#', ''), fontFace });
      s6.addText(r.h, { x: 6.5, y: y + 0.06, w: 2.9, h: 0.44, fontSize: 8.5, bold: true, color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace });
    });

    s6.addShape('rect', { x: 0.5, y: 4.35, w: 9.0, h: 0.72, fill: { color: 'EFF6FF' }, line: { color: BRAND_COLORS.procucevBlue.replace('#', '') } });
    s6.addText('EXECUTIVE HYPOTHESIS: UltraTech can capture ₹78.72 Cr in net direct recurring cost reductions within 24 months without operational disruption through systematic cross-plant rate alignment and supplier consolidation.', {
      x: 0.65, y: 4.42, w: 8.7, h: 0.58, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
    });
  }
  addSlideFooter(s6, clientName, 6, totalSlides);
}
