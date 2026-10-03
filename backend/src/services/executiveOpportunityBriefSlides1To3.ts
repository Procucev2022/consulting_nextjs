/**
 * 10-Slide Executive Opportunity Brief — Slides 1 to 3
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

export function renderBriefSlide1(canvas: PdfCanvas, clientName: string): void {
  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: BRAND_COLORS.canvas });
  canvas.drawImage(PDF_LAYOUT.LOGO_X, PDF_LAYOUT.LOGO_Y, PDF_LAYOUT.LOGO_W, PDF_LAYOUT.LOGO_H, '/Im1');

  canvas.text('aiCEV by Procucev', PDF_LAYOUT.CONTENT_LEFT, 36, {
    fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
  });
  canvas.text('Procurement Value Opportunity Brief', PDF_LAYOUT.CONTENT_LEFT, 62, {
    fontSize: 24, font: 'bold', color: BRAND_COLORS.primaryText
  });
  canvas.text(`${clientName} | CFO / CEO Discussion Edition`, PDF_LAYOUT.CONTENT_LEFT, 82, {
    fontSize: 11, font: 'regular', color: BRAND_COLORS.secondaryText
  });
  canvas.line(PDF_LAYOUT.CONTENT_LEFT, 94, PDF_LAYOUT.CONTENT_RIGHT, 94, BRAND_COLORS.border, 0.75);

  const heroY = 114;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, heroY, 430, 310, {
    fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, heroY, 6, 310, { fill: BRAND_COLORS.accentGreen });

  canvas.text('PRIMARY VALUE THESIS', PDF_LAYOUT.CONTENT_LEFT + 24, heroY + 30, {
    fontSize: 10, font: 'bold', color: BRAND_COLORS.secondaryText
  });
  canvas.text(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr.toFixed(2)} Cr`,
    PDF_LAYOUT.CONTENT_LEFT + 24, heroY + 80, {
      fontSize: 36, font: 'bold', color: BRAND_COLORS.accentGreen
    });
  canvas.text('Direct Savings Opportunity', PDF_LAYOUT.CONTENT_LEFT + 24, heroY + 115, {
    fontSize: 16, font: 'bold', color: BRAND_COLORS.primaryText
  });
  canvas.textBlock(
    'Defensible P&L cost reduction across rate harmonization, volume pooling, and strategic tenders. ' +
    'Reconciled with 0 variance against 31,671 invoice transactions.',
    PDF_LAYOUT.CONTENT_LEFT + 24, heroY + 145, 380, {
      fontSize: 11, color: BRAND_COLORS.secondaryText, lineHeight: 17
    }
  );

  const cardsX = 490;
  const cardW = 430;
  const metrics = [
    {
      label: 'NET DEFENSIBLE PIPELINE',
      val: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr`,
      sub: 'Direct Savings + Strategic Market Value',
      c: BRAND_COLORS.procucevBlue
    },
    {
      label: 'STRATEGIC MARKET VALUE',
      val: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr.toFixed(2)} Cr`,
      sub: 'Commodity Timing & Index Contracting Levers',
      c: '#0284C7'
    },
    {
      label: 'TOTAL SPEND EVALUATED',
      val: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.totalCustomerSpendCr.toLocaleString('en-IN', {
        minimumFractionDigits: 2
      })} Cr`,
      sub: `${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineTransactions.toLocaleString()} Invoiced Records | ` +
        `${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.analysisPeriod}`,
      c: BRAND_COLORS.primaryText
    }
  ];

  metrics.forEach((m, idx) => {
    const cy = heroY + idx * 105;
    canvas.rect(cardsX, cy, cardW, 95, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(cardsX, cy, 4, 95, { fill: m.c });
    canvas.text(m.label, cardsX + 16, cy + 22, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.secondaryText
    });
    canvas.text(m.val, cardsX + 16, cy + 54, {
      fontSize: 22, font: 'bold', color: m.c
    });
    canvas.text(m.sub, cardsX + 16, cy + 78, {
      fontSize: 9.5, font: 'regular', color: BRAND_COLORS.secondaryText
    });
  });

  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 442, PDF_LAYOUT.CONTENT_WIDTH, 42, {
    fill: '#EFF6FF', stroke: '#BFDBFE', lineWidth: 1
  });
  canvas.text(
    '"24 months of transaction-level procurement analysis translated into a defensible value pipeline."',
    480, 467, {
      fontSize: 11, font: 'bold', color: BRAND_COLORS.procucevBlue, align: 'center'
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 1);
}

export function renderBriefSlide2(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('What the Procurement Data Tells Us', 'Diagnostic Insights', 2);

  const insightCards = [
    { label: 'SPEND CONCENTRATION', val: '81.4%', desc: 'Spend concentrated in top 10% of suppliers', c: '#1769E0' },
    { label: 'PRICE DISPERSION', val: '18.5%', desc: 'Inter-plant price variance on repeat SKUs', c: '#F2A900' },
    { label: 'CONTRACTING GAP', val: '42.6%', desc: 'Spot / non-contracted purchases across plants', c: '#F2A900' },
    { label: 'SUPPLIER BASE', val: '912', desc: 'Tail suppliers accounting for 4.8% spend', c: '#64748B' },
    {
      label: 'DEFENSIBLE VALUE',
      val: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr`,
      desc: 'Net defensible pipeline post-overlap & policy deduction',
      c: '#17A673'
    }
  ];

  const cardW = 164;
  const gap = 15;
  insightCards.forEach((card, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (cardW + gap);
    canvas.rect(x, 108, cardW, 230, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, 108, cardW, 4, { fill: card.c });
    canvas.text(card.label, x + 12, 134, { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.text(card.val, x + 12, 185, { fontSize: 24, font: 'bold', color: card.c });
    canvas.textBlock(card.desc, x + 12, 220, cardW - 24, {
      fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 16
    });
  });

  const bannerY = 360;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bannerY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bannerY, 4, 68, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'Value is concentrated in price harmonization, supplier consolidation, strategic sourcing and benchmark-led market alignment.',
    PDF_LAYOUT.CONTENT_LEFT + 20, bannerY + 28, {
      fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText
    }
  );
  canvas.text(
    'Evaluated across 26 manufacturing plants and 256 material groups over 24 months of invoiced ledger history.',
    PDF_LAYOUT.CONTENT_LEFT + 20, bannerY + 50, {
      fontSize: 9.5, font: 'regular', color: BRAND_COLORS.secondaryText
    }
  );

  canvas.text(
    'Detailed evidence: Boardroom & Evidence Edition - Slides 7-10',
    PDF_LAYOUT.CONTENT_LEFT, 460, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 2);
}

export function renderBriefSlide3(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('WHERE THE OPPORTUNITY IS CONCENTRATED', 'Value Landscape', 3);

  const levers = [
    { name: 'Direct Price Improvement', opp: 42.80, pct: 100 },
    { name: 'E-Auction Dynamic Bidding', opp: 31.50, pct: 73.6 },
    { name: 'Vendor Base Consolidation *', opp: 26.40, pct: 61.7 },
    { name: 'Volume Aggregation', opp: 22.10, pct: 51.6 },
    { name: 'Payment Terms Optimization', opp: 14.20, pct: 33.2 },
    { name: 'Category Specialization', opp: 11.80, pct: 27.6 },
    { name: 'Logistics & Packaging Specs', opp: 9.60, pct: 22.4 },
    { name: 'Specification Rationalization', opp: 6.30, pct: 14.7 },
    { name: 'Contract Compliance Audit', opp: 4.80, pct: 11.2 },
    { name: 'PCBI Market Index Contracting', opp: 3.62, pct: 8.5 }
  ];

  const startY = 100;
  const barH = 21;
  const gap = 8;
  const maxBarW = 430;

  levers.forEach((lev, idx) => {
    const y = startY + idx * (barH + gap);
    canvas.text(lev.name, PDF_LAYOUT.CONTENT_LEFT, y + 15, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const barX = PDF_LAYOUT.CONTENT_LEFT + 220;
    canvas.rect(barX, y, maxBarW, barH, { fill: '#F1F5F9', stroke: BRAND_COLORS.border, lineWidth: 0.5 });
    const fillW = (maxBarW * lev.pct) / 100;
    canvas.rect(barX, y, fillW, barH, { fill: BRAND_COLORS.procucevBlue });
    canvas.text(`Rs. ${lev.opp.toFixed(2)} Cr`, barX + maxBarW + 15, y + 15, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
  });

  const calloutX = 770;
  const calloutY = 100;
  canvas.rect(calloutX, calloutY, 150, 160, {
    fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.procucevBlue, lineWidth: 1.5
  });
  canvas.text('GROSS IDENTIFIED', calloutX + 14, calloutY + 28, {
    fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText
  });
  canvas.text('OPPORTUNITY', calloutX + 14, calloutY + 44, {
    fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText
  });
  canvas.text(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.grossOpportunityCr.toFixed(2)} Cr`,
    calloutX + 14, calloutY + 84, {
      fontSize: 16, font: 'bold', color: BRAND_COLORS.procucevBlue
    });
  canvas.textBlock(
    'Individual opportunities are assessed independently and deduplicated before establishing the net defensible pipeline.',
    calloutX + 14, calloutY + 110, 122, {
      fontSize: 8, color: BRAND_COLORS.secondaryText, lineHeight: 12
    }
  );

  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 400, PDF_LAYOUT.CONTENT_WIDTH, 42, {
    fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 0.75
  });
  canvas.text(
    'Individual opportunities are assessed independently and deduplicated before establishing the net defensible pipeline.',
    PDF_LAYOUT.CONTENT_LEFT + 16, 425, {
      fontSize: 9, font: 'regular', color: BRAND_COLORS.secondaryText
    }
  );

  canvas.text(
    'Detailed sourcing evidence: Boardroom & Evidence Edition - Slides 9, 14-19',
    PDF_LAYOUT.CONTENT_LEFT, 465, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 3);
}
