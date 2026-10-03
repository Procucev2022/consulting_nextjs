/**
 * Executive Brief Slides 2 to 3 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, visual storytelling.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide2ExecutiveSummary(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
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

  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT,
    startY,
    cardW,
    cardH,
    'Direct Savings Opportunity',
    '₹78.72 Cr',
    'Addressable EBITDA Expansion',
    BRAND_COLORS.accentGreen
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 219,
    startY,
    cardW,
    cardH,
    'Net Defensible Pipeline',
    '₹93.60 Cr',
    'Post-Overlap Deduplicated',
    BRAND_COLORS.procucevBlue
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 438,
    startY,
    cardW,
    cardH,
    'Strategic Market Value',
    '₹14.88 Cr',
    'Commodity & Timing Levers',
    '#0284C7'
  );
  canvas.kpiCard(
    PDF_LAYOUT.CONTENT_LEFT + 657,
    startY,
    cardW,
    cardH,
    'Spend Evaluated',
    '₹5,920.35 Cr',
    '24 Months Invoiced Baseline',
    BRAND_COLORS.secondaryText
  );

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
        'Inter-plant price variance on identical SKUs provides immediate rate arbitrage.',
        'Top 10% suppliers command 81.4% spend, enabling focused high-impact negotiations.',
        'Unpooled consumable volume across 26 units allows national aggregator pricing.'
      ],
      color: BRAND_COLORS.procucevBlue
    },
    {
      title: 'MATHEMATICAL INTEGRITY',
      points: [
        '100% forensic line-item audit across 31,671 records; zero sample extrapolation.',
        'Rigorous overlap deduplication (-₹62.80 Cr) removes all multi-lever double counting.',
        'Strict exclusions (-₹16.72 Cr) carve out proprietary OEM spares and fixed statutory rates.'
      ],
      color: BRAND_COLORS.accentGreen
    },
    {
      title: 'EXECUTION READINESS',
      points: [
        'Wave 1 pre-qualified initiatives represent ₹47.90 Cr ready for tenders.',
        '90-day phased execution roadmap prevents operational plant disruptions.',
        'Index-linked pricing protects gross margin against fuel market volatility.'
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
      desc: 'Heavy manufacturing and cement procurement veterans with operational category playbooks.',
      metric: '₹45,000+ Cr Analyzed',
      color: BRAND_COLORS.procucevBlue
    },
    {
      num: '02',
      title: 'FORENSIC DATA',
      desc: '100% invoice and PO line-item forensic audit across 31,671 records with zero interpolation.',
      metric: '31,671 Invoices Cleansed',
      color: BRAND_COLORS.accentGreen
    },
    {
      num: '03',
      title: 'AI DECISION INTELLIGENCE',
      desc: 'Algorithmic rate benchmarking, outlier detection, and automated UNSPSC classification.',
      metric: '256 Material Groups',
      color: '#0284C7'
    },
    {
      num: '04',
      title: 'EXECUTION',
      desc: 'Hands-on e-auction facilitation, commercial negotiations, and contract realization tracking.',
      metric: '₹47.90 Cr Wave 1 Ready',
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
