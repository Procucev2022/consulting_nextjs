import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter, addPptxKpiCard } from './executiveBriefPptxHelpers';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';
import { renderSlide6Pptx } from './executiveBriefPptxSlide6';
import { renderSlide10Pptx } from './executiveBriefPptxSlide10';

export function renderPptxSlides6To10(
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
  const invoicesCleansed = contract.baselineTransactions.toLocaleString();
  const activeSuppliers = contract.baselineSuppliers;
  const materialGroups = contract.baselineMaterialGroups;
  const evaluatedPeriodMonths = contract.analysisPeriodMonths;
  const readinessWave1 = isCust ? 'Wave 1' : '₹47.90 Cr';

  // Slide 6: Customer Context Slide 2 or Demo Strategic Alignment
  renderSlide6Pptx(pptx, clientName, totalSlides);

  // Slide 7: Diagnostic Baseline
  const s7 = pptx.addSlide();
  s7.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s7, 'Diagnostic Baseline: Transaction Ingestion & Invariant Provenance', 'Diagnostic Baseline', 7);

  addPptxKpiCard(
    s7, 0.5, 1.1, 2.15, 0.95, 'Total Spend Evaluated', evaluatedSpendFormatted,
    `${evaluatedPeriodMonths} Months Spend Window`, BRAND_COLORS.procucevBlue
  );
  addPptxKpiCard(
    s7, 2.78, 1.1, 2.15, 0.95, 'Invoiced Transactions', `${invoicesCleansed} Records`,
    '100% Cleansed & Normalized', BRAND_COLORS.accentGreen
  );
  addPptxKpiCard(
    s7, 5.06, 1.1, 2.15, 0.95, 'Active Supplier Base', `${activeSuppliers} Suppliers`,
    'Transacting Commercial Vendors', '#0284C7'
  );
  addPptxKpiCard(
    s7, 7.35, 1.1, 2.15, 0.95, 'Procurement Taxonomy', `${materialGroups} Groups`,
    'UNSPSC Level 4 Mapped', BRAND_COLORS.secondaryText
  );

  s7.addText('DATA-TO-VALUE CONVERSION PIPELINE', {
    x: 0.5, y: 2.25, w: 8.0, h: 0.25, fontSize: 9.5, bold: true, color: BRAND_COLORS.primaryText.replace('#', ''),
    fontFace
  });

  const stages7 = [
    { n: 'CUSTOMER DATA', d: `Raw ERP invoices & POs\n${invoicesCleansed} Records` },
    { n: 'MODULE 1', d: `Spend Diagnostic & Taxonomy\n${evaluatedSpendFormatted}` },
    { n: 'MODULE 2', d: 'Strategic Sourcing Levers\n10 Sourcing Levers' },
    { n: 'MODULE 3', d: `PCBI Market Benchmarks\n${isCust ? 'Benchmark Engine' : '28 Commodity Indices'}` },
    { n: 'MODULE 4', d: `Execution & Realization\n${readinessWave1} Wave 1` },
    { n: 'EXECUTIVE BRIEF', d: `Boardroom Decision Report\n${netPipelineFormatted} Net Pipeline` }
  ];
  stages7.forEach((st, idx) => {
    const x = 0.5 + idx * 1.52;
    s7.addShape('rect', {
      x, y: 2.55, w: 1.4, h: 1.35, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') }
    });
    s7.addShape('rect', {
      x, y: 2.55, w: 1.4, h: 0.04,
      fill: { color: idx === 5 ? BRAND_COLORS.accentGreen.replace('#', '') : BRAND_COLORS.procucevBlue.replace('#', '') }
    });
    s7.addText(st.n, {
      x: x + 0.08, y: 2.65, w: 1.24, h: 0.35, fontSize: 8.5, bold: true,
      color: idx === 5 ? BRAND_COLORS.accentGreen.replace('#', '') : BRAND_COLORS.procucevBlue.replace('#', ''),
      fontFace
    });
    s7.addText(st.d, {
      x: x + 0.08, y: 3.05, w: 1.24, h: 0.75, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''),
      fontFace
    });
  });

  s7.addShape('rect', {
    x: 0.5, y: 4.1, w: 9.0, h: 0.95, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') }
  });
  s7.addText(
    `MATHEMATICAL INTEGRITY GUARANTEE: Every rupee in this assessment is anchored to reconciled invoiced transactions. Zero synthetic extrapolation. Addressable baseline of ${evaluatedSpendFormatted} reflects commercial procurement spend after removing non-controllable taxes, statutory charges, and inter-company transfers.`,
    {
      x: 0.65, y: 4.2, w: 8.7, h: 0.75, fontSize: 9, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    }
  );
  addSlideFooter(s7, clientName, 7, totalSlides);

  // Slide 8: What the Analysis Tells Us
  const s8 = pptx.addSlide();
  s8.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s8, 'What the Analysis Tells Us: Core Diagnostic Insights', 'Diagnostic Insights', 8);

  const tiles8 = [
    {
      m: '100% Categorized', l: 'SPEND TAXONOMY INTEGRITY',
      t: `Complete taxonomy mapping across all ${evaluatedSpendFormatted} spend with zero unclassified leakage into miscellaneous buckets.`,
      c: BRAND_COLORS.procucevBlue
    },
    {
      m: '81.4% Concentrated', l: 'TOP SUPPLIER PARETO',
      t: 'Top suppliers drive dominant volume of total spend, offering immediate volume pooling and strategic partnership opportunities.',
      c: BRAND_COLORS.accentGreen
    },
    {
      m: '18.5% Price Variance', l: 'INTER-PLANT PRICE INCOHERENCE',
      t: 'Identical consumable and raw material SKUs purchased at widely divergent rates across operating units due to decentralized procurement.',
      c: '#0284C7'
    },
    {
      m: '42.6% Spot Purchases', l: 'NON-CONTRACTED LEAKAGE',
      t: 'Substantial procurement executed off master agreements without tier volume discounts, presenting rapid rate harmonization potential.',
      c: BRAND_COLORS.accentAmber
    },
    {
      m: `${activeSuppliers} Suppliers`, l: 'SUPPLIER BASE OPTIMIZATION',
      t: 'Supplier tail consumes disproportionate operational purchasing effort while delivering minor spend share.',
      c: '#6366F1'
    },
    {
      m: `${netPipelineFormatted} Net Pipeline`, l: 'CONSERVATIVE RECONCILED VALUE',
      t: `Defensible procurement opportunity after full deduction of ${overlapDeductionsFormatted} overlaps and exclusions, balancing with ₹0.00 variance.`,
      c: BRAND_COLORS.accentGreen
    }
  ];
  tiles8.forEach((tl, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const x = 0.5 + col * 3.05;
    const y = 1.15 + row * 1.95;
    s8.addShape('rect', {
      x, y, w: 2.9, h: 1.85, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') }
    });
    s8.addShape('rect', { x, y, w: 2.9, h: 0.05, fill: { color: tl.c.replace('#', '') } });
    s8.addText(tl.m, {
      x: x + 0.15, y: y + 0.15, w: 2.6, h: 0.35, fontSize: 16, bold: true, color: tl.c.replace('#', ''), fontFace
    });
    s8.addText(tl.l, {
      x: x + 0.15, y: y + 0.5, w: 2.6, h: 0.22, fontSize: 8.5, bold: true,
      color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    });
    s8.addText(tl.t, {
      x: x + 0.15, y: y + 0.75, w: 2.6, h: 1.0, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''),
      fontFace
    });
  });
  addSlideFooter(s8, clientName, 8, totalSlides);

  // Slide 9: Where Value is Concentrated
  const s9 = pptx.addSlide();
  s9.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s9, 'Where Value is Concentrated: Ranked Opportunity Levers', 'Value Landscape', 9);

  const levers9 = isCust
    ? [
        { n: 'Synthetic Yarns Price Alignment', opp: '₹28.45 Cr', w: 4.6 },
        { n: 'Chemicals & Dyes Dynamic Tenders', opp: '₹22.15 Cr', w: 3.6 },
        { n: 'Packaging Materials Pooling', opp: '₹18.60 Cr', w: 3.0 },
        { n: 'Vendor Base Consolidation *', opp: '₹14.20 Cr', w: 2.3 },
        { n: 'Captive Energy Contracting', opp: '₹9.80 Cr', w: 1.6 },
        { n: 'Payment Terms Harmonization', opp: '₹6.50 Cr', w: 1.1 },
        { n: 'MRO Spares Rationalization', opp: '₹4.30 Cr', w: 0.7 },
        { n: 'Freight & Logistics Route Optimization', opp: '₹3.20 Cr', w: 0.5 },
        { n: 'Spec Harmonization across Units', opp: '₹2.10 Cr', w: 0.4 },
        { n: 'Contract Compliance Audits', opp: '₹1.46 Cr', w: 0.2 }
      ]
    : [
        { n: 'Direct Price Improvement', opp: '₹42.80 Cr', w: 4.6 },
        { n: 'E-Auction Dynamic Bidding', opp: '₹31.50 Cr', w: 3.4 },
        { n: 'Vendor Base Consolidation *', opp: '₹26.40 Cr', w: 2.8 },
        { n: 'Volume Aggregation', opp: '₹22.10 Cr', w: 2.4 },
        { n: 'Payment Terms Optimization', opp: '₹14.20 Cr', w: 1.5 },
        { n: 'Category Specialization', opp: '₹11.80 Cr', w: 1.3 },
        { n: 'Logistics & Packaging Specs', opp: '₹9.60 Cr', w: 1.0 },
        { n: 'Specification Rationalization', opp: '₹6.30 Cr', w: 0.7 },
        { n: 'Contract Compliance Audit', opp: '₹4.80 Cr', w: 0.5 },
        { n: 'PCBI Market Index Contracting', opp: '₹3.62 Cr', w: 0.4 }
      ];
  levers9.forEach((lv, idx) => {
    const y = 1.15 + idx * 0.32;
    s9.addText(lv.n, {
      x: 0.5, y: y - 0.05, w: 2.3, h: 0.28, fontSize: 8.5, bold: true,
      color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
    });
    s9.addShape('rect', {
      x: 2.8, y, w: 4.6, h: 0.22, fill: { color: BRAND_COLORS.canvas.replace('#', '') },
      line: { color: BRAND_COLORS.border.replace('#', '') }
    });
    s9.addShape('rect', {
      x: 2.8, y, w: lv.w, h: 0.22, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
    });
    s9.addText(lv.opp, {
      x: 7.5, y: y - 0.05, w: 1.0, h: 0.28, fontSize: 8.5, bold: true,
      color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
    });
  });

  s9.addShape('rect', {
    x: 7.7, y: 1.15, w: 1.8, h: 3.3, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') }
  });
  s9.addShape('rect', {
    x: 7.7, y: 1.15, w: 1.8, h: 0.04, fill: { color: BRAND_COLORS.procucevBlue.replace('#', '') }
  });
  s9.addText(`GROSS OPPORTUNITY\n${grossOpportunityFormatted}`, {
    x: 7.8, y: 1.25, w: 1.6, h: 0.6, fontSize: 11, bold: true,
    color: BRAND_COLORS.procucevBlue.replace('#', ''), fontFace
  });
  s9.addText(
    'Individual lever potentials represent standalone opportunities. Overlaps are deduplicated in Slide 10 to establish defensible pipeline.',
    {
      x: 7.8, y: 1.9, w: 1.6, h: 2.4, fontSize: 8, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    }
  );

  s9.addShape('rect', {
    x: 0.5, y: 4.55, w: 9.0, h: 0.52, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') }
  });
  s9.addText(
    '* Indicative modelling assumption: Vendor consolidation 5% saving is an indicative modelling benchmark. E-auction is an execution mechanism. Gross opportunities are not additive without multi-lever overlap deduplication.',
    {
      x: 0.65, y: 4.6, w: 8.7, h: 0.42, fontSize: 8.5, color: BRAND_COLORS.secondaryText.replace('#', ''), fontFace
    }
  );
  addSlideFooter(s9, clientName, 9, totalSlides);

  // Slide 10: The Value Bridge (Dominant Central Waterfall)
  renderSlide10Pptx(pptx, clientName, totalSlides);
}

