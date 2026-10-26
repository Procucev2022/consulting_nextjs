/**
 * 10-Slide Executive Opportunity Brief — Slides 6 to 8
 * Adheres strictly to Prompt 286 (CFO/CEO Discussion Edition) and Prompt 503.
 * Customer contract binding and Module 3 isolation controls.
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
import { renderExecutiveOpportunityBriefFooter } from './executiveOpportunityBriefPdfHelpers';

export function renderBriefSlide6(
  canvas: PdfCanvas,
  clientName = 'ABC Textile Ltd',
  _contract?: ExecutiveBriefPresentationContract
): void {
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  canvas.renderHeader('How the Value Will Be Captured: Execution Pillars', 'Value Capture Mechanisms', 6);

  const pillars = [
    {
      num: '01',
      title: 'RATE HARMONIZATION',
      sub: isCust
        ? 'Cross-plant price alignment across 6 manufacturing units'
        : 'Cross-plant price alignment & benchmark-led negotiations',
      bullets: isCust
        ? [
            'Inter-plant variance elimination on standard raw fibers & packaging',
            'Corporate rate cards standardized across Gujarat & Maharashtra plants',
            'ERP purchase order rate controls preventing localized price leakage'
          ]
        : [
            'Inter-plant variance elimination on identical standard SKUs',
            'Ex-works benchmark rate cards indexed to regional delivery',
            'ERP real-time price verification stopping contract rate creep'
          ],
      c: BRAND_COLORS.procucevBlue
    },
    {
      num: '02',
      title: 'VOLUME AGGREGATION',
      sub: isCust
        ? 'Pool spinning & weaving demand for Tier-1 factory pricing'
        : 'Pool fragmented demand & increase supplier leverage',
      bullets: isCust
        ? [
            'Aggregate fiber & polymer requirements into national master contracts',
            'Demand pooling across 6 plants for tier-1 chemical volume pricing',
            'Master agreements for plant electrical, mechanical, and safety MRO'
          ]
        : [
            'Aggregate multi-plant requirements into national master contracts',
            'Demand consolidation across 26 plants for tier-1 volume discounts',
            'Master distributor agreements for regional MRO consumables'
          ],
      c: '#2563EB'
    },
    {
      num: '03',
      title: 'STRATEGIC SOURCING',
      sub: isCust
        ? 'Competitive tenders, supplier rationalization & contracted terms'
        : 'Competitive tenders, rationalization & benchmark alignment',
      bullets: isCust
        ? [
            'Multi-round competitive bidding and dynamic e-auctions for packaging',
            'Strategic supplier base consolidation across 420 active vendors',
            'Standardized 60-day commercial payment terms alignment'
          ]
        : [
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

export function renderBriefSlide7(
  canvas: PdfCanvas,
  clientName = 'ABC Textile Ltd',
  contract?: ExecutiveBriefPresentationContract
): void {
  const activeContract = contract || getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  const title = isCust
    ? 'Wave 1 — Immediate Value Capture: Proven Priority Initiatives'
    : 'Wave 1 — Immediate Value Capture: Priority Initiatives';
  canvas.renderHeader(title, 'Immediate Value Capture', 7);

  const heroY = 104;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, heroY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: '#ECFDF5', stroke: BRAND_COLORS.accentGreen, lineWidth: 1.25
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, heroY, 6, 68, { fill: BRAND_COLORS.accentGreen });
  canvas.text('PROVEN WAVE 1 OPPORTUNITY', PDF_LAYOUT.CONTENT_LEFT + 20, heroY + 24, {
    fontSize: 9.5, font: 'bold', color: '#065F46'
  });
  canvas.text(`Rs. ${activeContract.validatedSavingsCr.toFixed(2)} Cr`,
    PDF_LAYOUT.CONTENT_LEFT + 20, heroY + 52, {
      fontSize: 24, font: 'bold', color: BRAND_COLORS.accentGreen
    });
  canvas.text(
    isCust
      ? '5 commercially validated initiatives with specification signoff, ready for immediate tender execution.'
      : '5 pre-qualified commercial initiatives with technical specification signoff, ready for 90-day execution.',
    PDF_LAYOUT.CONTENT_LEFT + 240, heroY + 42, {
      fontSize: 10.5, font: 'bold', color: BRAND_COLORS.primaryText
    }
  );

  const initiatives = isCust
    ? [
        { name: 'Synthetic Fibers', val: 'Rs. 28.50 Cr', cat: 'Raw Fibers', lever: 'Volume Pooling & OEM Contracts', t: 'Days 1-30' },
        { name: 'Specialty Dyes', val: 'Rs. 22.10 Cr', cat: 'Chemicals', lever: 'Price Variance Arbitrage', t: 'Days 15-45' },
        { name: 'Packaging & Boxes', val: 'Rs. 14.20 Cr', cat: 'Packaging', lever: 'Reverse E-Auction Tenders', t: 'Days 30-60' },
        { name: 'Plant MRO Spares', val: 'Rs. 10.30 Cr', cat: 'Maintenance', lever: 'Consolidated Preferred Panels', t: 'Days 45-75' },
        { name: 'Captive Energy', val: 'Rs. 7.28 Cr', cat: 'Energy/Fuel', lever: 'Rate Harmonization & Terms', t: 'Days 60-90' }
      ]
    : [
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
    `Note: Proven Opportunity (Rs. ${activeContract.validatedSavingsCr.toFixed(2)} Cr) is the immediate execution tranche, distinct from Realized Savings (Rs. ${activeContract.realizedSavingsCr.toFixed(2)} Cr).`,
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


export { renderBriefSlide8 } from './executiveOpportunityBriefSlide8';

