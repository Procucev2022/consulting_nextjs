/**
 * Executive Brief Slide 14 - Opportunity Matrix (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 2x2 matrix.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

interface MatrixQuadrant {
  title: string;
  x: number;
  y: number;
  color: string;
  items: string[];
  action: string;
}

export function renderSlide14OpportunityMap(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('Module 2 - Strategic Sourcing Opportunity Matrix', 'Opportunity Matrix', p);

  const isCust = isCustomerAssessment(clientName);

  // 2x2 Visual Matrix (Spend Impact vs Sourcing Complexity)
  const qW = 424;
  const qH = 180;
  const startY = 104;

  const quadrants: MatrixQuadrant[] = isCust
    ? [
        {
          title: 'LEVERAGE / QUICK WINS (HIGH IMPACT, HIGH LIQUIDITY)',
          x: PDF_LAYOUT.CONTENT_LEFT,
          y: startY,
          color: BRAND_COLORS.accentGreen,
          items: [
            'Synthetic Yarns & Blends Reverse Auction (Opp: ₹18.25 Cr | Days 15-45)',
            'Specialty Dyes & Chemicals Formula Reset (Opp: ₹16.41 Cr | Days 30-60)',
            'Packaging Materials & Freight Pooling (Opp: ₹9.82 Cr | Days 1-30)'
          ],
          action: 'ACTION: Immediate Wave 1 execution via competitive e-auctions.'
        },
        {
          title: 'STRATEGIC CORE (HIGH IMPACT, SPECIALIZED SOURCING)',
          x: PDF_LAYOUT.CONTENT_LEFT + qW + 16,
          y: startY,
          color: BRAND_COLORS.procucevBlue,
          items: [
            'Project Capex Equipment Rationalization (Opp: ₹19.04 Cr | Days 1-30)',
            'Captive Energy & Process Fuel Contracts (Opp: ₹11.65 Cr | Days 45-75)',
            'Multi-Plant Material Demand Aggregation (Opp: ₹10.47 Cr | Days 60-90)'
          ],
          action: 'ACTION: Long-term strategic contracts linked to market benchmark indices.'
        },
        {
          title: 'OPERATIONAL POLICY (MODERATE IMPACT, FAST EXECUTION)',
          x: PDF_LAYOUT.CONTENT_LEFT,
          y: startY + qH + 16,
          color: BRAND_COLORS.secondaryText,
          items: [
            'Contract Price Compliance Audit (Opp: ₹4.80 Cr | 30 Days)',
            'Payment Terms Standardization to 60/90 Days (Opp: ₹7.20 Cr | 45 Days)',
            'Consumable SKU Catalog Rationalization (Opp: ₹5.10 Cr | 60 Days)'
          ],
          action: 'ACTION: ERP invoice 3-way match controls and catalog mandate.'
        },
        {
          title: 'BOTTLENECK & RISK (CONTROLLED COMMERCIAL INTERVENTION)',
          x: PDF_LAYOUT.CONTENT_LEFT + qW + 16,
          y: startY + qH + 16,
          color: BRAND_COLORS.accentAmber,
          items: [
            'Specialized Spinning Spares & Loom Spares (Dual-source de-risking)',
            'High-Purity Finishing Chemical Panelling (Opp: ₹4.20 Cr | Days 60-90)',
            'Plant Auxiliary Consumables Standardization (Opp: ₹3.50 Cr)'
          ],
          action: 'ACTION: Technical qualification of second-source manufacturers.'
        }
      ]
    : [
        {
          title: 'LEVERAGE / QUICK WINS (HIGH IMPACT, HIGH LIQUIDITY)',
          x: PDF_LAYOUT.CONTENT_LEFT,
          y: startY,
          color: BRAND_COLORS.accentGreen,
          items: [
            'HDPE Packaging Bags E-Auction (Opp: ₹14.50 Cr | Days 1-30)',
            'Grinding Media Rate Harmonization (Opp: ₹11.20 Cr | Days 15-45)',
            'Inbound Secondary Freight Dynamic Tenders (Opp: ₹9.60 Cr | Days 30-60)'
          ],
          action: 'ACTION: Immediate Wave 1 execution via competitive e-auctions.'
        },
        {
          title: 'STRATEGIC CORE (HIGH IMPACT, SPECIALIZED SOURCING)',
          x: PDF_LAYOUT.CONTENT_LEFT + qW + 16,
          y: startY,
          color: BRAND_COLORS.procucevBlue,
          items: [
            'Petcoke & Thermal Coal Index Contracts (Opp: ₹9.80 Cr | Days 45-75)',
            'Vendor Base Tail Consolidation (Opp: ₹26.40 Cr * | Days 60-90)',
            'National Multi-Plant Demand Aggregation (Opp: ₹22.10 Cr | Days 60-90)'
          ],
          action: 'ACTION: Long-term strategic contracts linked to market benchmark indices.'
        },
        {
          title: 'OPERATIONAL POLICY (MODERATE IMPACT, FAST EXECUTION)',
          x: PDF_LAYOUT.CONTENT_LEFT,
          y: startY + qH + 16,
          color: BRAND_COLORS.secondaryText,
          items: [
            'Contract Price Compliance Audit (Opp: ₹4.80 Cr | 30 Days)',
            'Payment Terms Standardization to 60/90 Days (Opp: ₹14.20 Cr | 45 Days)',
            'Standard Consumable SKU Rationalization (Opp: ₹6.30 Cr | 60 Days)'
          ],
          action: 'ACTION: ERP invoice 3-way match controls and catalog mandate.'
        },
        {
          title: 'BOTTLENECK & RISK (CONTROLLED COMMERCIAL INTERVENTION)',
          x: PDF_LAYOUT.CONTENT_LEFT + qW + 16,
          y: startY + qH + 16,
          color: BRAND_COLORS.accentAmber,
          items: [
            'Specialized Instrumentation & Kiln Spares (Dual-source de-risking)',
            'High-Grade Refractory Bricks OEM Sourcing (Opp: ₹6.00 Cr | Days 60-90)',
            'Heavy Mobile Fleet Lubricants Synthetic Standardization (Opp: ₹6.40 Cr)'
          ],
          action: 'ACTION: Technical qualification of second-source manufacturers.'
        }
      ];

  quadrants.forEach((q) => {
    canvas.rect(q.x, q.y, qW, qH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(q.x, q.y, qW, 4, { fill: q.color });
    canvas.text(q.title, q.x + 16, q.y + 24, { fontSize: 8.5, font: 'bold', color: q.color });

    q.items.forEach((item, iIdx) => {
      canvas.text('-', q.x + 16, q.y + 54 + iIdx * 28, { fontSize: 10, font: 'bold', color: q.color });
      canvas.text(item, q.x + 28, q.y + 54 + iIdx * 28, { fontSize: 9.5, color: BRAND_COLORS.primaryText });
    });

    canvas.line(q.x + 16, q.y + 140, q.x + qW - 16, q.y + 140, BRAND_COLORS.border, 0.5);
    canvas.text(q.action, q.x + 16, q.y + 160, { fontSize: 8.5, font: 'bold', color: q.color });
  });

  // Note footer
  const footerNote = isCust
    ? '* Defensible sourcing model: Opportunity values are grounded strictly in ERP line-item purchase records.'
    : '* Indicative modelling assumption: Vendor consolidation 5% saving is an indicative modelling benchmark.';

  canvas.text(
    footerNote,
    PDF_LAYOUT.CONTENT_LEFT,
    498,
    { fontSize: 7.5, color: BRAND_COLORS.secondaryText }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
