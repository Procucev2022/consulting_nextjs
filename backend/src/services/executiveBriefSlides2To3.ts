/**
 * Executive Brief Slides 2 to 3 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, visual storytelling.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

function getSlide2HeroCards(
  contract: ReturnType<typeof getExecutiveBriefPresentationContract>,
  isCust: boolean
): Array<{ label: string; val: string; sub: string; color: string }> {
  const d = isCust ? 3 : 2;
  const c2Val = isCust ? contract.grossOpportunityCr : contract.netDefensiblePipelineCr;
  const c3Val = isCust ? contract.validatedSavingsCr : contract.strategicMarketValueCr;
  return [
    {
      label: isCust ? 'Approved Net Opportunity' : 'Direct Savings Opportunity',
      val: `₹${contract.netDirectSavingsCr.toFixed(d)} Cr`,
      sub: isCust ? 'Empirical P&L Scope' : 'Addressable EBITDA Expansion',
      color: BRAND_COLORS.accentGreen
    },
    {
      label: isCust ? 'Gross Modelled Pipeline' : 'Net Defensible Pipeline',
      val: `₹${c2Val.toFixed(d)} Cr`,
      sub: isCust ? 'Before Overlap Deductions' : 'Post-Overlap Deduplicated',
      color: BRAND_COLORS.procucevBlue
    },
    {
      label: isCust ? 'Proven Opportunity' : 'Strategic Market Value',
      val: `₹${c3Val.toFixed(d)} Cr`,
      sub: isCust ? 'Evidence-Based Criteria' : 'Commodity & Timing Levers',
      color: '#0284C7'
    },
    {
      label: 'Spend Evaluated',
      val: `₹${contract.totalCustomerSpendCr.toFixed(isCust ? 4 : 2)} Cr`,
      sub: `${contract.baselineTransactions.toLocaleString('en-IN')} Invoiced Line Items`,
      color: BRAND_COLORS.secondaryText
    }
  ];
}

export function renderSlide2ExecutiveSummary(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  canvas.renderHeader(
    'Executive Opportunity: Value Realization Architecture',
    'Executive Summary',
    p
  );

  // 4 Hero Metrics across top
  const cardW = 207;
  const cardH = 90;
  const startY = 104;

  getSlide2HeroCards(contract, isCust).forEach((card, idx) => {
    canvas.kpiCard(
      PDF_LAYOUT.CONTENT_LEFT + idx * 219,
      startY,
      cardW,
      cardH,
      card.label,
      card.val,
      card.sub,
      card.color
    );
  });

  // Horizontal Value Statement
  const valStmtY = 210;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, valStmtY, PDF_LAYOUT.CONTENT_WIDTH, 44, {
    fill: BRAND_COLORS.canvas,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'Value is concentrated across price harmonization, supplier consolidation, ' +
    'strategic sourcing and benchmark-led market alignment.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    valStmtY + 27,
    { fontSize: 10.5, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );

  // 3 Insight Columns Below
  const colW = 276;
  const colH = 210;
  const colY = 268;

  const cols = [
    {
      title: 'WHERE VALUE LIES',
      points: [
        `Inter-plant price variance on identical SKUs provides rate arbitrage across ${contract.baselinePlants} units.`,
        'Top suppliers command majority of spend, enabling focused high-impact volume pooling.',
        `Unpooled consumable volume across ${contract.baselinePlants} operating units allows national aggregator pricing.`
      ],
      color: BRAND_COLORS.procucevBlue
    },
    {
      title: 'MATHEMATICAL INTEGRITY',
      points: [
        `100% forensic line-item audit across ${contract.baselineTransactions.toLocaleString('en-IN')} records; zero sample extrapolation.`,
        `Rigorous overlap deduplication (-₹${contract.overlapDeductionsCr.toFixed(isCust ? 3 : 2)} Cr) removes multi-lever double counting.`,
        `Realized savings kept strictly at ₹${contract.realizedSavingsCr.toFixed(2)} Cr until actual realization evidence exists.`
      ],
      color: BRAND_COLORS.accentGreen
    },
    {
      title: 'EXECUTION READINESS',
      points: [
        `Proven opportunity represents ₹${contract.validatedSavingsCr.toFixed(isCust ? 3 : 2)} Cr ready for phased commercial deployment.`,
        '90-day phased execution roadmap prevents operational plant disruptions.',
        'Continuous tracking and governance protect gross margin and deliver verified P&L benefit.'
      ],
      color: '#0284C7'
    }
  ];

  cols.forEach((col, idx) => {
    const cX = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 18);
    canvas.rect(cX, colY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(cX, colY, colW, 4, { fill: col.color });
    canvas.text(col.title, cX + 16, colY + 28, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'bold',
      color: col.color
    });
    col.points.forEach((pt, pIdx) => {
      canvas.text('*', cX + 16, colY + 62 + pIdx * 54, {
        fontSize: 12,
        font: 'bold',
        color: col.color
      });
      canvas.textBlock(pt, cX + 28, colY + 54 + pIdx * 54, colW - 40, {
        fontSize: 10,
        color: BRAND_COLORS.primaryText,
        lineHeight: 15
      });
    });
  });

  canvas.renderFooter(clientName, conf, p, total);
}

export function renderSlide3AboutProcucev(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  canvas.renderHeader(
    'Why Procucev: Industrial Procurement Intelligence & Sourcing Execution',
    'Corporate Profile',
    p
  );

  // 4-Pillar Horizontal Architecture
  const pWidth = 207;
  const pHeight = 220;
  const pY = 106;

  const pillars = [
    {
      num: '01',
      title: 'DOMAIN EXPERTISE',
      desc: 'Heavy manufacturing and industrial procurement veterans with operational category playbooks.',
      metric: '₹45,000+ Cr Analyzed',
      color: BRAND_COLORS.procucevBlue
    },
    {
      num: '02',
      title: 'FORENSIC DATA',
      desc: `100% invoice and PO line-item forensic audit across ${contract.baselineTransactions.toLocaleString('en-IN')} records with zero interpolation.`,
      metric: `${contract.baselineTransactions.toLocaleString('en-IN')} Invoices Cleansed`,
      color: BRAND_COLORS.accentGreen
    },
    {
      num: '03',
      title: 'AI DECISION INTELLIGENCE',
      desc: 'Algorithmic rate benchmarking, outlier detection, and automated UNSPSC classification.',
      metric: `${contract.baselineMaterialGroups} Material Groups`,
      color: '#0284C7'
    },
    {
      num: '04',
      title: 'EXECUTION',
      desc: 'Hands-on e-auction facilitation, commercial negotiations, and contract realization tracking.',
      metric: `₹${contract.validatedSavingsCr.toFixed(isCust ? 3 : 2)} Cr Wave 1 Ready`,
      color: BRAND_COLORS.accentAmber
    }
  ];

  pillars.forEach((pil, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (pWidth + 12);
    canvas.rect(x, pY, pWidth, pHeight, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, pY, pWidth, 4, { fill: pil.color });
    canvas.text(pil.num, x + 16, pY + 28, { fontSize: 13, font: 'bold', color: pil.color });
    canvas.text(pil.title, x + 16, pY + 54, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(pil.desc, x + 16, pY + 76, pWidth - 32, {
      fontSize: 10,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 15
    });
    canvas.rect(x + 16, pY + 168, pWidth - 32, 32, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(pil.metric, x + 24, pY + 188, { fontSize: 9.5, font: 'bold', color: pil.color });
  });

  // Value Flow Connector
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 342, PDF_LAYOUT.CONTENT_WIDTH, 36, {
    fill: BRAND_COLORS.canvas,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'From transaction data -> sourcing decision -> execution -> realized value',
    PDF_LAYOUT.CONTENT_LEFT + 24,
    364,
    { fontSize: 11, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );

  // 4 Compact Trust Statements
  const tWidth = 207;
  const trustY = 394;
  const trusts = [
    { title: 'Zero Hallucination', desc: 'Every rupee maps to verified invoiced transactions.' },
    { title: 'Conservative Overlap', desc: 'Strict multi-lever deduplication eliminates double counts.' },
    { title: 'Client Data Isolation', desc: 'Dedicated AES-256 tenant encryption; zero cross-leakage.' },
    { title: 'Verified Governance', desc: 'Productivity non-monetized until client time-motion signoff.' }
  ];

  trusts.forEach((tr, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (tWidth + 12);
    canvas.rect(x, trustY, tWidth, 96, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.text(tr.title, x + 12, trustY + 24, {
      fontSize: 9.5,
      font: 'bold',
      color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(tr.desc, x + 12, trustY + 42, tWidth - 24, {
      fontSize: 9,
      color: BRAND_COLORS.secondaryText,
      lineHeight: 13
    });
  });

  canvas.renderFooter(clientName, conf, p, total);
}
