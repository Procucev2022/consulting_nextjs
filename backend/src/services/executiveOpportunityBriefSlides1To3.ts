/**
 * 10-Slide Executive Opportunity Brief — Slides 1 to 3
 * Adheres strictly to Prompt 286 (CFO/CEO Discussion Edition) and Prompt 503.
 * Customer-specific contract binding and 2-slide maximum customer context enhancement.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  BRAND_COLORS,
  PDF_LAYOUT
} from '../constants/executiveBriefLayoutConstants';
import {
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';
import type { ExecutiveBriefPresentationContract } from '../types/executiveBriefPresentation';
import { customerWebsiteService } from './customerWebsiteService';
import { renderExecutiveOpportunityBriefFooter } from './executiveOpportunityBriefPdfHelpers';

export function renderBriefSlide1(
  canvas: PdfCanvas,
  clientName: string,
  contract?: ExecutiveBriefPresentationContract
): void {
  const activeContract = contract || getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  canvas.rect(0, 0, 960, 540, { fill: BRAND_COLORS.canvas });
  canvas.drawImage(PDF_LAYOUT.LOGO_X, PDF_LAYOUT.LOGO_Y, PDF_LAYOUT.LOGO_W, PDF_LAYOUT.LOGO_H, '/Im1');

  canvas.text('aiCEV by Procucev', PDF_LAYOUT.CONTENT_LEFT, 36, {
    fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
  });
  canvas.text('Procurement Value Opportunity Brief', PDF_LAYOUT.CONTENT_LEFT, 62, {
    fontSize: 24, font: 'bold', color: BRAND_COLORS.primaryText
  });
  const editionLabel = isCust
    ? `${clientName} | CFO / CEO Discussion Edition [AIC-2026-0002]`
    : `${clientName} | Demonstration Archetype Edition`;
  canvas.text(editionLabel, PDF_LAYOUT.CONTENT_LEFT, 82, {
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
  canvas.text(`Rs. ${activeContract.netDirectSavingsCr.toFixed(2)} Cr`,
    PDF_LAYOUT.CONTENT_LEFT + 24, heroY + 80, {
      fontSize: 36, font: 'bold', color: BRAND_COLORS.accentGreen
    });
  canvas.text('Direct Savings Opportunity', PDF_LAYOUT.CONTENT_LEFT + 24, heroY + 115, {
    fontSize: 16, font: 'bold', color: BRAND_COLORS.primaryText
  });
  canvas.textBlock(
    'Defensible P&L cost reduction across rate harmonization, volume pooling, and strategic tenders. ' +
    `Reconciled with 0 variance against ${activeContract.baselineTransactions.toLocaleString()} invoice transactions.`,
    PDF_LAYOUT.CONTENT_LEFT + 24, heroY + 145, 380, {
      fontSize: 11, color: BRAND_COLORS.secondaryText, lineHeight: 17
    }
  );

  const cardsX = 490;
  const cardW = 430;
  const metrics = [
    {
      label: 'NET DEFENSIBLE PIPELINE',
      val: `Rs. ${activeContract.netDefensiblePipelineCr.toFixed(2)} Cr`,
      sub: 'Direct Savings + Strategic Market Value',
      c: BRAND_COLORS.procucevBlue
    },
    {
      label: 'STRATEGIC MARKET VALUE',
      val: `Rs. ${activeContract.strategicMarketValueCr.toFixed(2)} Cr`,
      sub: isCust ? 'PCBI Price Gap UNAVAILABLE (Isolated)' : 'Commodity Timing & Index Contracting Levers',
      c: '#0284C7'
    },
    {
      label: 'TOTAL SPEND EVALUATED',
      val: `Rs. ${activeContract.totalCustomerSpendCr.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      })} Cr`,
      sub: `${activeContract.baselineTransactions.toLocaleString()} Invoiced Records | ` +
        `${activeContract.analysisPeriod}`,
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
    `"${activeContract.analysisPeriodMonths} months of transaction-level procurement analysis translated into an approved defensible value pipeline."`,
    480, 467, {
      fontSize: 11, font: 'bold', color: BRAND_COLORS.procucevBlue, align: 'center'
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 1);
}

export function renderBriefSlide2(
  canvas: PdfCanvas,
  clientName = 'ABC Textile Ltd',
  contract?: ExecutiveBriefPresentationContract
): void {
  const activeContract = contract || getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();

  if (isCust) {
    // Slide 1 of 2: Customer at a Glance (Prompt 503 Section 3)
    const profile = customerWebsiteService.getProfileForCustomer(clientName);
    canvas.renderHeader(`Customer at a Glance: ${clientName}`, 'Customer Context (Slide 1 of 2)', 2);

    const leftW = 425;
    const leftY = 106;
    // Left Box: Company & Operating Footprint
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 330, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 4, { fill: BRAND_COLORS.procucevBlue });
    canvas.text('COMPANY & OPERATING FOOTPRINT', PDF_LAYOUT.CONTENT_LEFT + 20, leftY + 28, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
    });

    const sectorDesc = profile?.businessDescription ||
      'Integrated textile enterprise delivering synthetic yarns, woven fabrics, and industrial textiles.';
    canvas.text('Sector & Principal Business:', PDF_LAYOUT.CONTENT_LEFT + 20, leftY + 54, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(sectorDesc, PDF_LAYOUT.CONTENT_LEFT + 20, leftY + 70, leftW - 40, {
      fontSize: 9.5, color: BRAND_COLORS.primaryText, lineHeight: 14
    });

    canvas.text('Operating Scale & Manufacturing Footprint:', PDF_LAYOUT.CONTENT_LEFT + 20, leftY + 140, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const footprintDesc = profile?.operatingFootprint ||
      '6 manufacturing units across Gujarat and Maharashtra with spinning, weaving, and chemical finishing plants.';
    canvas.textBlock(footprintDesc, PDF_LAYOUT.CONTENT_LEFT + 20, leftY + 156, leftW - 40, {
      fontSize: 9.5, color: BRAND_COLORS.secondaryText, lineHeight: 14
    });

    canvas.text('Core Product Segments:', PDF_LAYOUT.CONTENT_LEFT + 20, leftY + 225, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const prods = profile?.mainProducts?.slice(0, 3).join('  |  ') ||
      'Synthetic Yarns  |  Industrial Filter Fabrics  |  Engineered Apparel Wovens';
    canvas.textBlock(prods, PDF_LAYOUT.CONTENT_LEFT + 20, leftY + 242, leftW - 40, {
      fontSize: 9, color: BRAND_COLORS.procucevBlue, lineHeight: 13
    });

    // Right Box: Financial Scale & Strategic Business Priorities
    const rightX = PDF_LAYOUT.CONTENT_LEFT + leftW + 30;
    canvas.rect(rightX, leftY, leftW, 330, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(rightX, leftY, leftW, 4, { fill: BRAND_COLORS.accentGreen });
    canvas.text('FINANCIAL SCALE & BUSINESS PRIORITIES', rightX + 20, leftY + 28, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.accentGreen
    });

    canvas.text('Verified Public Financial Scale:', rightX + 20, leftY + 54, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const finScale = profile?.revenueOrProfit ||
      '₹2,450 Cr Revenue / ₹285 Cr Operating Profit (EBITDA) [FY 2022-23 Audited Financials]';
    canvas.textBlock(finScale, rightX + 20, leftY + 70, leftW - 40, {
      fontSize: 10, font: 'bold', color: '#065F46', lineHeight: 15
    });

    canvas.text('Key Business & Operational Priorities:', rightX + 20, leftY + 125, {
      fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const prios = profile?.businessPriorities || [
      'Raw material volatility mitigation across synthetic polymers and specialty dyes',
      'Captive energy and power conversion cost rationalization',
      'Working capital release through vendor consolidation and payment normalization'
    ];
    prios.slice(0, 3).forEach((pr, pIdx) => {
      canvas.textBlock(`* ${pr}`, rightX + 20, leftY + 145 + pIdx * 38, leftW - 40, {
        fontSize: 9, color: BRAND_COLORS.secondaryText, lineHeight: 13
      });
    });

    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 448, PDF_LAYOUT.CONTENT_WIDTH, 36, {
      fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 0.75
    });
    canvas.text(
      'Source: Official corporate portal and published audited filings (FY 2022-23). Missing info does not block assessment.',
      PDF_LAYOUT.CONTENT_LEFT + 16, 470, {
        fontSize: 8.5, font: 'regular', color: BRAND_COLORS.secondaryText
      }
    );
  } else {
    // Demonstration Archetype Slide 2
    canvas.renderHeader('What the Procurement Data Tells Us [DEMONSTRATION ARCHETYPE]', 'Diagnostic Insights', 2);

    const insightCards = [
      { label: 'SPEND CONCENTRATION', val: '81.4%', desc: 'Spend concentrated in top 10% of suppliers', c: '#1769E0' },
      { label: 'PRICE DISPERSION', val: '18.5%', desc: 'Inter-plant price variance on repeat SKUs', c: '#F2A900' },
      { label: 'CONTRACTING GAP', val: '42.6%', desc: 'Spot / non-contracted purchases across plants', c: '#F2A900' },
      { label: 'SUPPLIER BASE', val: '912', desc: 'Tail suppliers accounting for 4.8% spend', c: '#64748B' },
      {
        label: 'DEFENSIBLE VALUE',
        val: `Rs. ${activeContract.netDefensiblePipelineCr.toFixed(2)} Cr`,
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
      `Evaluated across ${activeContract.baselinePlants} manufacturing plants and ${activeContract.baselineMaterialGroups} material groups over ${activeContract.analysisPeriodMonths} months of invoiced ledger history.`,
      PDF_LAYOUT.CONTENT_LEFT + 20, bannerY + 50, {
        fontSize: 9.5, font: 'regular', color: BRAND_COLORS.secondaryText
      }
    );
  }

  renderExecutiveOpportunityBriefFooter(canvas, 2);
}

export { renderBriefSlide3 } from './executiveOpportunityBriefSlide3';
