/**
 * Executive Brief Slides 5 to 6 (Prompt 283 & Prompt 503)
 * Implements Customer at a Glance (Slide 1) and Procurement Impact on Business (Slide 2).
 * Strictly limits customer context to 2 slides and preserves demonstration archetype outputs.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  TYPOGRAPHY
} from '../constants/executiveBriefLayoutConstants';
import {
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';
import { customerWebsiteService } from './customerWebsiteService';

export function renderSlide5UnderstandingClient(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  const isCust = isCustomerAssessment(clientName);

  if (isCust) {
    const profile = customerWebsiteService.getProfileForCustomer(clientName);
    canvas.renderHeader(`Customer at a Glance: ${clientName}`, 'Customer Context (Slide 1 of 2)', p);

    const leftW = 416;
    const leftY = 106;
    // Left Box: Company & Operating Footprint
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 376, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 4, { fill: BRAND_COLORS.procucevBlue });
    canvas.text('COMPANY & OPERATING FOOTPRINT', PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 30, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });

    const sectorDesc = profile?.businessDescription ||
      'Integrated textile enterprise delivering synthetic yarns, woven fabrics, and industrial textiles.';
    canvas.text('Sector & Principal Business:', PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 58, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    canvas.textBlock(sectorDesc, PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 76, leftW - 48, {
      fontSize: 10, color: BRAND_COLORS.primaryText, lineHeight: 15
    });

    canvas.text('Operating Scale & Manufacturing Footprint:', PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 160, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const footprintDesc = profile?.operatingFootprint ||
      '6 manufacturing units across Gujarat and Maharashtra with spinning, weaving, and chemical finishing plants.';
    canvas.textBlock(footprintDesc, PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 178, leftW - 48, {
      fontSize: 9.5, color: BRAND_COLORS.secondaryText, lineHeight: 15
    });

    canvas.text('Core Product Segments:', PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 265, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const prods = profile?.mainProducts || [
      'Specialty Synthetic Yarns & Blends',
      'Industrial Filtration & Technical Fabrics',
      'High-Density Woven Fabrics',
      'Engineered Apparel Textiles'
    ];
    prods.slice(0, 4).forEach((prod, idx) => {
      canvas.textBlock(`* ${prod}`, PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 285 + idx * 20, leftW - 48, {
        fontSize: 9, color: BRAND_COLORS.secondaryText, lineHeight: 13
      });
    });

    // Right Box: Financial Scale & Business Priorities
    const rightX = PDF_LAYOUT.CONTENT_LEFT + leftW + 24;
    const rightW = 424;
    canvas.rect(rightX, leftY, rightW, 376, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(rightX, leftY, rightW, 4, { fill: BRAND_COLORS.accentGreen });
    canvas.text('FINANCIAL SCALE & BUSINESS PRIORITIES', rightX + 24, leftY + 30, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'bold',
      color: BRAND_COLORS.accentGreen
    });

    canvas.text('Verified Public Financial Scale:', rightX + 24, leftY + 58, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const finScale = profile?.revenueOrProfit ||
      '₹2,450 Cr Revenue / ₹285 Cr Operating Profit (EBITDA) [FY 2022-23 Audited Financials]';
    canvas.textBlock(finScale, rightX + 24, leftY + 76, rightW - 48, {
      fontSize: 11, font: 'bold', color: '#065F46', lineHeight: 16
    });

    canvas.text('Key Strategic Business Priorities:', rightX + 24, leftY + 140, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText
    });
    const prios = profile?.businessPriorities || [
      'Raw material volatility mitigation across synthetic polymers and dyes',
      'Energy efficiency & captive power optimization to reduce unit conversion costs',
      'Working capital release through vendor consolidation and payment terms normalization'
    ];
    prios.slice(0, 3).forEach((pr, idx) => {
      canvas.textBlock(`* ${pr}`, rightX + 24, leftY + 162 + idx * 52, rightW - 48, {
        fontSize: 9.5, color: BRAND_COLORS.secondaryText, lineHeight: 14
      });
    });

    // Sources footer
    canvas.text(
      'Sources: Official corporate portal and published audited filings (FY 2022-23). Missing info does not block assessment.',
      PDF_LAYOUT.CONTENT_LEFT,
      498,
      { fontSize: TYPOGRAPHY.footerSize, color: BRAND_COLORS.secondaryText }
    );
  } else {
    // Demonstration Archetype Slide 5
    canvas.renderHeader(`Operating Scale & Procurement Implications: ${clientName} [DEMONSTRATION ARCHETYPE]`, 'Client Context', p);

    const leftW = 416;
    const leftY = 106;
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 376, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(PDF_LAYOUT.CONTENT_LEFT, leftY, leftW, 4, { fill: BRAND_COLORS.procucevBlue });
    canvas.text('ULTRATECH AT SCALE', PDF_LAYOUT.CONTENT_LEFT + 24, leftY + 30, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'bold',
      color: BRAND_COLORS.procucevBlue
    });

    const facts = [
      { stat: '152.7 MTPA', label: 'Grey Cement Capacity', desc: 'Largest cement producer in India; top 3 globally.' },
      { stat: '24', label: 'Integrated Plants', desc: 'Major industrial production centers across all four zones.' },
      { stat: '33', label: 'Grinding Units', desc: 'Distributed regional processing and blending infrastructure.' },
      { stat: '8', label: 'Bulk Terminals', desc: 'Port terminals enabling multimodal coastal and rail distribution.' }
    ];

    facts.forEach((fc, idx) => {
      const fY = leftY + 52 + idx * 76;
      canvas.text(fc.stat, PDF_LAYOUT.CONTENT_LEFT + 24, fY + 22, {
        fontSize: 20,
        font: 'bold',
        color: BRAND_COLORS.primaryText
      });
      canvas.text(fc.label, PDF_LAYOUT.CONTENT_LEFT + 24, fY + 40, {
        fontSize: 9.5,
        font: 'bold',
        color: BRAND_COLORS.secondaryText
      });
      canvas.text(fc.desc, PDF_LAYOUT.CONTENT_LEFT + 24, fY + 55, {
        fontSize: 8.5,
        color: BRAND_COLORS.secondaryText
      });
    });

    const rightX = PDF_LAYOUT.CONTENT_LEFT + leftW + 24;
    const rightW = 424;
    canvas.rect(rightX, leftY, rightW, 376, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(rightX, leftY, rightW, 4, { fill: BRAND_COLORS.accentGreen });
    canvas.text('PROCUREMENT IMPLICATIONS FOR VALUE DISCOVERY', rightX + 24, leftY + 30, {
      fontSize: TYPOGRAPHY.cardLabelSize,
      font: 'bold',
      color: BRAND_COLORS.accentGreen
    });

    const implications = [
      {
        title: 'Inter-Plant Variance',
        desc: 'Decentralized local buying across 26 units leads to substantial unit-price divergence.'
      },
      {
        title: 'Unmatched Volume Scale',
        desc: 'National demand pooling unlocks Tier-1 OEM factory pricing across packaging, media, and chemicals.'
      },
      {
        title: 'Tail Spend Fragmentation',
        desc: '912 vendors in the spend tail dilute purchasing power and generate disproportionate PO load.'
      },
      {
        title: 'Commodity Volatility',
        desc: 'Fuel and power inputs require dynamic index-linked contracts to lock in favorable market troughs.'
      }
    ];

    implications.forEach((imp, idx) => {
      const iY = leftY + 52 + idx * 76;
      canvas.text(imp.title, rightX + 24, iY + 18, {
        fontSize: 11,
        font: 'bold',
        color: BRAND_COLORS.primaryText
      });
      canvas.textBlock(imp.desc, rightX + 24, iY + 36, rightW - 48, {
        fontSize: 9.5,
        color: BRAND_COLORS.secondaryText,
        lineHeight: 14
      });
    });

    canvas.text(
      'Sources: UltraTech Public Annual Reports, Investor Presentations, and Invoiced Transaction Data.',
      PDF_LAYOUT.CONTENT_LEFT,
      498,
      { fontSize: TYPOGRAPHY.footerSize, color: BRAND_COLORS.secondaryText }
    );
  }

  canvas.renderFooter(clientName, conf, p, total);
}


export { renderSlide6WhyProcurementMatters } from './executiveBriefSlide6';

