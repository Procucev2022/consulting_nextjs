/**
 * 10-Slide Executive Opportunity Brief — Slides 6 to 8
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

export function renderBriefSlide6(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('How the Value Will Be Captured: Execution Pillars', 'Value Capture Mechanisms', 6);

  const pillars = [
    {
      num: '01',
      title: 'RATE HARMONIZATION',
      sub: 'Cross-plant price alignment & benchmark-led negotiations',
      bullets: [
        'Inter-plant variance elimination on identical standard SKUs',
        'Ex-works benchmark rate cards indexed to regional delivery',
        'ERP real-time price verification stopping contract rate creep'
      ],
      c: BRAND_COLORS.procucevBlue
    },
    {
      num: '02',
      title: 'VOLUME AGGREGATION',
      sub: 'Pool fragmented demand & increase supplier leverage',
      bullets: [
        'Aggregate multi-plant requirements into national master contracts',
        'Demand consolidation across 26 plants for tier-1 volume discounts',
        'Master distributor agreements for regional MRO consumables'
      ],
      c: '#2563EB'
    },
    {
      num: '03',
      title: 'STRATEGIC SOURCING',
      sub: 'Competitive tenders, rationalization & benchmark alignment',
      bullets: [
        'Multi-round competitive bidding and dynamic e-auctions',
        'Strategic vendor base consolidation and panelling',
        'Formula-based commodity indexation (PCBI market linkage)'
      ],
      c: BRAND_COLORS.accentGreen
    }
  ];

  const pW = 280;
  const pGap = 20;
  const pY = 108;

  pillars.forEach((p, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (pW + pGap);
    canvas.rect(x, pY, pW, 235, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, pY, pW, 4, { fill: p.c });
    canvas.text(p.num, x + 16, pY + 28, { fontSize: 13, font: 'bold', color: p.c });
    canvas.text(p.title, x + 44, pY + 28, { fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.textBlock(p.sub, x + 16, pY + 52, pW - 32, {
      fontSize: 9.5, font: 'bold', color: p.c, lineHeight: 14
    });

    p.bullets.forEach((b, bIdx) => {
      canvas.textBlock(`- ${b}`, x + 16, pY + 105 + bIdx * 38, pW - 32, {
        fontSize: 9, font: 'regular', color: BRAND_COLORS.primaryText, lineHeight: 13
      });
    });
  });

  const mechY = 360;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, mechY, PDF_LAYOUT.CONTENT_WIDTH, 75, {
    fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.text('TACTICAL EXECUTION MECHANISMS', PDF_LAYOUT.CONTENT_LEFT + 20, mechY + 22, {
    fontSize: 9, font: 'bold', color: BRAND_COLORS.secondaryText
  });

  const mechanisms = ['E-Auction', 'Specification', 'Payment Terms', 'Contract Compliance', 'Category Strategy'];
  mechanisms.forEach((m, mIdx) => {
    const mx = PDF_LAYOUT.CONTENT_LEFT + 20 + mIdx * 170;
    canvas.rect(mx, mechY + 34, 155, 26, {
      fill: '#FFFFFF', stroke: BRAND_COLORS.border, lineWidth: 0.75
    });
    canvas.text(m, mx + 12, mechY + 51, { fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText });
  });

  canvas.text(
    'E-auction operates as a tactical execution mechanism for price discovery, not the sole savings thesis.',
    PDF_LAYOUT.CONTENT_LEFT, 460, {
      fontSize: 8.5, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 6);
}

export function renderBriefSlide7(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('Wave 1 — Immediate Value Capture: Priority Initiatives', 'Immediate Value Capture', 7);

  const heroY = 104;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, heroY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: '#ECFDF5', stroke: BRAND_COLORS.accentGreen, lineWidth: 1.25
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, heroY, 6, 68, { fill: BRAND_COLORS.accentGreen });
  canvas.text('VALIDATED WAVE 1 OPPORTUNITY', PDF_LAYOUT.CONTENT_LEFT + 20, heroY + 24, {
    fontSize: 9.5, font: 'bold', color: '#065F46'
  });
  canvas.text(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.validatedSavingsCr.toFixed(2)} Cr`,
    PDF_LAYOUT.CONTENT_LEFT + 20, heroY + 52, {
      fontSize: 24, font: 'bold', color: BRAND_COLORS.accentGreen
    });
  canvas.text(
    '5 pre-qualified commercial initiatives with technical specification signoff, ready for 90-day execution.',
    PDF_LAYOUT.CONTENT_LEFT + 240, heroY + 42, {
      fontSize: 10.5, font: 'bold', color: BRAND_COLORS.primaryText
    }
  );

  const initiatives = [
    { name: 'Packaging Bags', val: 'Rs. 14.50 Cr', cat: 'Packaging', lever: 'E-Auction & Index Linkage', t: 'Days 1-30' },
    { name: 'Grinding Media', val: 'Rs. 11.20 Cr', cat: 'Consumables', lever: 'Price Variance Arbitrage', t: 'Days 15-45' },
    { name: 'Imported Fuel', val: 'Rs. 9.80 Cr', cat: 'Energy', lever: 'PCBI Benchmark Index', t: 'Days 30-60' },
    { name: 'Industrial Lubricants', val: 'Rs. 6.40 Cr', cat: 'Maintenance', lever: 'Volume Pooling & OEM', t: 'Days 45-75' },
    { name: 'Refractory', val: 'Rs. 6.00 Cr', cat: 'Raw Materials', lever: 'Vendor Panelling', t: 'Days 60-90' }
  ];

  const iW = 164;
  const iGap = 15;
  const iY = 190;

  initiatives.forEach((init, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (iW + iGap);
    canvas.rect(x, iY, iW, 175, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, iY, iW, 4, { fill: BRAND_COLORS.accentGreen });
    canvas.text(init.name, x + 12, iY + 24, { fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(init.val, x + 12, iY + 58, { fontSize: 17, font: 'bold', color: BRAND_COLORS.accentGreen });
    canvas.text(init.cat.toUpperCase(), x + 12, iY + 84, {
      fontSize: 8.5, font: 'bold', color: BRAND_COLORS.procucevBlue
    });
    canvas.textBlock(init.lever, x + 12, iY + 104, iW - 24, {
      fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 12
    });
    canvas.rect(x + 12, iY + 138, iW - 24, 22, { fill: '#F1F5F9' });
    canvas.text(init.t, x + 20, iY + 153, { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.primaryText });
  });

  const bannerY = 380;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bannerY, PDF_LAYOUT.CONTENT_WIDTH, 52, {
    fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 0.75
  });
  canvas.text(
    'Validated Wave 1 initiatives provide the first execution pathway from identified opportunity to realized savings.',
    PDF_LAYOUT.CONTENT_LEFT + 16, bannerY + 22, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.primaryText
    }
  );
  canvas.text(
    'Note: Validated Wave 1 is the immediate execution tranche, not additive to the Rs. 78.72 Cr direct pipeline.',
    PDF_LAYOUT.CONTENT_LEFT + 16, bannerY + 40, {
      fontSize: 8.5, font: 'regular', color: BRAND_COLORS.secondaryText
    }
  );

  canvas.text(
    'Detailed initiative ledger: Boardroom & Evidence Edition - Slide 24',
    PDF_LAYOUT.CONTENT_LEFT, 455, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 7);
}

export function renderBriefSlide8(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('From Opportunity to Execution in 90 Days', 'Execution Roadmap', 8);

  const phases = [
    {
      period: 'DAYS 1-30',
      title: 'Mobilize & Quick Wins',
      sub: 'Packaging Bags E-Auction & Rate Harmonization',
      items: [
        'Mobilize joint procurement steering committee',
        'Baseline validation & supplier pre-qualification',
        'Launch Packaging Bags master e-auction (Rs. 14.50 Cr)',
        'Establish corporate rate cards for immediate quick wins'
      ],
      c: BRAND_COLORS.procucevBlue
    },
    {
      period: 'DAYS 31-60',
      title: 'Market Engagement & Tenders',
      sub: 'Grinding Media & Fuel Benchmark Alignment',
      items: [
        'Issue dynamic tenders for grinding media (Rs. 11.20 Cr)',
        'Align imported coal & petcoke contracts to PCBI index',
        'Launch secondary freight multi-plant corridor bidding',
        'Commercial negotiations on top 100 consumable SKUs'
      ],
      c: '#2563EB'
    },
    {
      period: 'DAYS 61-90',
      title: 'Award & Savings Realization',
      sub: 'Lubricants, Refractory & Contract Signoff',
      items: [
        'Award consolidated lubricants & refractory master contracts',
        'Enforce contract compliance rules in ERP purchase orders',
        'Reconcile realized P&L EBITDA impact with finance teams',
        'Deploy continuous tracking dashboard for ongoing leakage'
      ],
      c: BRAND_COLORS.accentGreen
    }
  ];

  const phW = 280;
  const phGap = 20;
  const phY = 104;

  phases.forEach((ph, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (phW + phGap);
    canvas.rect(x, phY, phW, 230, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, phY, phW, 4, { fill: ph.c });
    canvas.text(ph.period, x + 16, phY + 26, { fontSize: 12, font: 'bold', color: ph.c });
    canvas.text(ph.title, x + 16, phY + 48, { fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(ph.sub, x + 16, phY + 68, { fontSize: 8.5, font: 'bold', color: ph.c });

    ph.items.forEach((item, iIdx) => {
      canvas.textBlock(`- ${item}`, x + 16, phY + 98 + iIdx * 30, phW - 32, {
        fontSize: 8.5, color: BRAND_COLORS.primaryText, lineHeight: 12
      });
    });
  });

  const noteY = 350;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, noteY, PDF_LAYOUT.CONTENT_WIDTH, 80, {
    fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, noteY, 4, 80, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    `HERO TARGET: Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.validatedSavingsCr.toFixed(2)} Cr Validated Wave 1 ` +
    'Targeted for 90-Day Cash Realization',
    PDF_LAYOUT.CONTENT_LEFT + 20, noteY + 24, {
      fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue
    }
  );
  canvas.text(
    'Direct process savings from 824 POs remain unmonetized until customer time-motion / manpower baseline validation.',
    PDF_LAYOUT.CONTENT_LEFT + 20, noteY + 46, {
      fontSize: 9, font: 'regular', color: BRAND_COLORS.primaryText
    }
  );
  canvas.text(
    'Risk / cost avoidance: Rs. 420 Cr spend de-risked across 4 dual-source programs is tracked separately and not monetized.',
    PDF_LAYOUT.CONTENT_LEFT + 20, noteY + 66, {
      fontSize: 8.5, color: BRAND_COLORS.secondaryText
    }
  );

  canvas.text(
    'Detailed roadmap: Boardroom & Evidence Edition - Slides 24-25',
    PDF_LAYOUT.CONTENT_LEFT, 455, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 8);
}
