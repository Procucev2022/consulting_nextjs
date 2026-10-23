/**
 * Executive Brief Slide 17 - Vendor Consolidation (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, vendor consolidation and panelling.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  getExecutiveBriefPresentationContract,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

interface VendorStateCard {
  title: string;
  sub: string;
  stat: string;
  metric: string;
  desc: string;
  color: string;
}

export function renderSlide17VendorConsolidation(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Vendor Base Consolidation: Tail Spend Rationalization & Panelling', 'Vendor Rationalization', p);

  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  // Visual: Current State -> Intervention -> Target State
  const colW = 276;
  const colH = 296;
  const startY = 104;

  const states: VendorStateCard[] = isCust
    ? [
        {
          title: 'CURRENT STATE',
          sub: 'Fragmented Supplier Base',
          stat: `${contract.baselineSuppliers} Suppliers`,
          metric: '360 Suppliers in Tail (<₹25L)',
          desc: 'Significant vendor fragmentation across operating units. High administrative overhead managing hundreds ' +
                'of local vendors with fragmented corporate volume leverage.',
          color: BRAND_COLORS.secondaryText
        },
        {
          title: 'PROCUCEV INTERVENTION',
          sub: 'Panelling & Rationalization',
          stat: 'Strategic Panelling',
          metric: 'Master Preferred Tiers',
          desc: 'Deploy regional hub agreements, preferred vendor tiers, and structured panelling for chemical, ' +
                'packaging, and consumable categories.',
          color: BRAND_COLORS.procucevBlue
        },
        {
          title: 'TARGET STATE',
          sub: 'Streamlined Supplier Network',
          stat: '180 Preferred Vendors',
          metric: '₹10.47 Cr Modelled Value *',
          desc: '50%+ reduction in tail supplier count. Consolidated purchasing volumes unlock higher discount ' +
                'tiers and lower transactional PO processing burden.',
          color: BRAND_COLORS.accentGreen
        }
      ]
    : [
        {
          title: 'CURRENT STATE',
          sub: 'Fragmented Tail Base',
          stat: '974 Suppliers',
          metric: '912 Suppliers in Tail (<₹50L)',
          desc: 'Severe vendor fragmentation across operating units. High administrative overhead managing hundreds ' +
                'of single-plant vendors with zero corporate volume leverage.',
          color: BRAND_COLORS.secondaryText
        },
        {
          title: 'PROCUCEV INTERVENTION',
          sub: 'Panelling & Rationalization',
          stat: 'Strategic Panelling',
          metric: 'Master Preferred Tiers',
          desc: 'Deploy regional hub agreements, preferred vendor tiers, and structured panelling for consumable ' +
                'and MRO categories. Establish corporate frame contracts.',
          color: BRAND_COLORS.procucevBlue
        },
        {
          title: 'TARGET STATE',
          sub: 'Streamlined Supplier Network',
          stat: '450 Preferred Vendors',
          metric: '₹26.40 Cr Indicative Value *',
          desc: '50%+ reduction in tail supplier count. Consolidated purchasing volumes unlock higher discount ' +
                'tiers and lower transactional PO processing burden.',
          color: BRAND_COLORS.accentGreen
        }
      ];

  states.forEach((st, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 18);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: st.color });

    canvas.text(st.title, x + 16, startY + 28, { fontSize: 9.5, font: 'bold', color: st.color });
    canvas.text(st.sub, x + 16, startY + 46, { fontSize: 8.5, color: BRAND_COLORS.secondaryText });
    canvas.text(st.stat, x + 16, startY + 80, { fontSize: 20, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(st.metric, x + 16, startY + 104, { fontSize: 9.5, font: 'bold', color: st.color });
    canvas.line(x + 16, startY + 118, x + colW - 16, startY + 118, BRAND_COLORS.border, 0.5);
    canvas.textBlock(st.desc, x + 16, startY + 138, colW - 32, {
      fontSize: 10,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });
  });

  // Bottom Indicative Modelling Assumption Banner
  const banY = 418;
  const bannerText = isCust
    ? '* Defensible sourcing model: Tail spend panelling focuses on standardizing recurring materials while protecting ' +
      'local plant operations and operational flexibility.'
    : '* Indicative modelling assumption: The estimated ₹26.40 Cr opportunity from vendor consolidation represents ' +
      'an indicative 5% savings benchmark on tail spend based on industrial precedents. Tail supplier rationalization ' +
      'is phased carefully to protect local plant supply continuity.';

  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 72, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'MODELLING GOVERNANCE & SOURCING PRINCIPLE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    bannerText,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 9.5, color: BRAND_COLORS.secondaryText, lineHeight: 14 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
