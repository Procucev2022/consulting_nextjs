/**
 * 10-Slide Executive Opportunity Brief — Slides 9 to 10
 * Adheres strictly to Prompt 286 (CFO/CEO Discussion Edition).
 * Shared Data Contract: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  BRAND_COLORS,
  PDF_LAYOUT
} from '../constants/executiveBriefLayoutConstants';
import {
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT
} from '../constants/executiveBriefPresentationConstants';
import { renderExecutiveOpportunityBriefFooter } from './executiveOpportunityBriefPdfHelpers';

export function renderBriefSlide9(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('Why Procucev + aiCEV: Enterprise Partner Value', 'Platform & Advisory Capabilities', 9);

  const pillars = [
    {
      title: 'PROCUREMENT EXPERTISE',
      sub: 'Domain Authority & Category Depth',
      bullets: [
        'Decades of direct category leadership in heavy manufacturing',
        'Specialized playbooks across fuel, power, logistics & MRO',
        'Senior practitioner negotiation support across pan-India suppliers'
      ],
      c: BRAND_COLORS.procucevBlue
    },
    {
      title: 'FORENSIC SPEND INTELLIGENCE',
      sub: 'Transaction-Level Precision',
      bullets: [
        'Granular transaction harmonization across 31,671 invoice lines',
        'Multi-plant ex-works price dispersion detection on identical SKUs',
        'Systematic exclusion and overlap deduplication governance'
      ],
      c: '#2563EB'
    },
    {
      title: 'MARKET BENCHMARK INTELLIGENCE',
      sub: 'Independent Market Anchoring',
      bullets: [
        'Proprietary PCBI indices for cement-specific commodities',
        'Independent index-linked pricing formulas (coal, petcoke, polymer)',
        'Market timing intelligence for contract renegotiation windows'
      ],
      c: '#0284C7'
    },
    {
      title: 'EXECUTION & SAVINGS REALIZATION',
      sub: 'Measurable P&L Impact',
      bullets: [
        'Dynamic e-auction platform and RFP commercial orchestration',
        'Joint steering model driving plant-level operational adoption',
        'Continuous savings ledger tracking realized cash flow impact'
      ],
      c: BRAND_COLORS.accentGreen
    }
  ];

  const pW = 205;
  const pGap = 20;
  const pY = 108;

  pillars.forEach((p, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (pW + pGap);
    canvas.rect(x, pY, pW, 240, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, pY, pW, 4, { fill: p.c });
    canvas.text(p.title, x + 12, pY + 26, { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(p.sub, x + 12, pY + 44, { fontSize: 8, font: 'bold', color: p.c });

    p.bullets.forEach((b, bIdx) => {
      canvas.textBlock(`- ${b}`, x + 12, pY + 76 + bIdx * 52, pW - 24, {
        fontSize: 8, color: BRAND_COLORS.primaryText, lineHeight: 11.5
      });
    });
  });

  const bannerY = 365;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bannerY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bannerY, 4, 68, { fill: BRAND_COLORS.procucevBlue });
  canvas.text('From transaction data to procurement decision to measurable execution.',
    PDF_LAYOUT.CONTENT_LEFT + 20, bannerY + 26, {
      fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText
    });
  canvas.text(
    'Customer procurement data is handled under configured tenant isolation, access controls, ' +
    'confidentiality and data-governance controls.',
    PDF_LAYOUT.CONTENT_LEFT + 20, bannerY + 50, {
      fontSize: 9, color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 9);
}

export function renderBriefSlide10(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('PROPOSED NEXT STEPS', 'Next Steps', 10);

  const decisions = [
    {
      num: '01',
      title: 'ALIGN',
      action: 'Confirm priority Wave 1 categories',
      desc: 'Confirm priority categories and align key stakeholders on immediate commercial launch across packaging bags, grinding media, and fuel.',
      badge: 'Wave 1 Priority',
      c: BRAND_COLORS.accentGreen
    },
    {
      num: '02',
      title: 'MOBILIZE',
      action: 'Establish joint procurement working group',
      desc: 'Charter joint central procurement and plant execution steering team to harmonize cross-plant specifications and vendor panels.',
      badge: 'Joint Governance',
      c: BRAND_COLORS.procucevBlue
    },
    {
      num: '03',
      title: 'EXECUTE',
      action: 'Launch approved competitive sourcing initiatives',
      desc: 'Launch approved dynamic price discovery events and corporate rate card standardizations across vetted supplier panels.',
      badge: 'Commercial Sourcing',
      c: '#2563EB'
    }
  ];

  const dW = 280;
  const dGap = 20;
  const dY = 104;

  decisions.forEach((d, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (dW + dGap);
    canvas.rect(x, dY, dW, 230, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, dY, dW, 4, { fill: d.c });
    canvas.text(d.num, x + 16, dY + 28, { fontSize: 14, font: 'bold', color: d.c });
    canvas.text(d.title, x + 44, dY + 28, { fontSize: 10.5, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.rect(x + 16, dY + 42, dW - 32, 22, { fill: '#F1F5F9' });
    canvas.text(d.badge, x + 24, dY + 57, { fontSize: 8.5, font: 'bold', color: d.c });
    canvas.textBlock(d.action, x + 16, dY + 80, dW - 32, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText, lineHeight: 15
    });
    canvas.textBlock(d.desc, x + 16, dY + 130, dW - 32, {
      fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 14
    });
  });

  const ctaY = 348;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, ctaY, PDF_LAYOUT.CONTENT_WIDTH, 90, {
    fill: '#ECFDF5', stroke: BRAND_COLORS.accentGreen, lineWidth: 1.5
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, ctaY, 6, 90, { fill: BRAND_COLORS.accentGreen });

  canvas.text(
    `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr.toFixed(2)} Cr Direct Savings Opportunity  |  ` +
    `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr Net Defensible Pipeline`,
    PDF_LAYOUT.CONTENT_LEFT + 24, ctaY + 28, {
      fontSize: 13, font: 'bold', color: '#065F46'
    }
  );
  canvas.text('Move from diagnostic to execution.', PDF_LAYOUT.CONTENT_LEFT + 24, ctaY + 54, {
    fontSize: 16, font: 'bold', color: BRAND_COLORS.primaryText
  });
  canvas.text('Contact: leadership@procucev.com', PDF_LAYOUT.CONTENT_LEFT + 24, ctaY + 76, {
    fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
  });
  renderExecutiveOpportunityBriefFooter(canvas, 10);
}
