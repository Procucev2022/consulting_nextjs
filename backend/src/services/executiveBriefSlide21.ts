/**
 * Executive Brief Slide 21 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, PCBI benchmark findings.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide21PCBIFindings(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader('PCBI Benchmark Findings: Customer Purchase Rate vs Market Indices', 'Market Benchmarks', p);

  const isCust = isCustomerAssessment(clientName);
  const compW = 276;
  const compH = 300;
  const compY = 104;

  if (isCust) {
    const cards = [
      {
        title: 'BENCHMARK GAP: DIRECT MATERIALS',
        status: 'UNAVAILABLE',
        badge: 'EMPIRICAL ISOLATION',
        bullets: [
          'External commodity benchmark indices not commissioned for this assessment.',
          'Synthetic polymer and fiber price variance assessed via intra-plant rates.',
          'Zero surrogate cement indices substituted into assessment reporting.'
        ]
      },
      {
        title: 'BENCHMARK GAP: SPECIALTY CHEMICALS',
        status: 'UNAVAILABLE',
        badge: 'ZERO CONTAMINATION',
        bullets: [
          'Dyes, auxiliaries, and binder indices pending external API integration.',
          'Commercial opportunity is established on observed purchase dispersion.',
          'Direct supplier quotes form the defensible foundation of value discovery.'
        ]
      },
      {
        title: 'BENCHMARK GAP: ENERGY & PACKAGING',
        status: 'UNAVAILABLE',
        badge: 'GOVERNANCE AUDITED',
        bullets: [
          'Captive power and corrugated box indexes excluded from external scoring.',
          'All modelled savings (Rs. 85.641 Cr net) derive from actual invoices.',
          'Module 3 benchmark isolation strictly enforced under enterprise governance.'
        ]
      }
    ];

    cards.forEach((card, idx) => {
      const cx = PDF_LAYOUT.CONTENT_LEFT + idx * 296;
      canvas.rect(cx, compY, compW, compH, {
        fill: BRAND_COLORS.lightCard,
        stroke: BRAND_COLORS.border,
        lineWidth: 1
      });
      canvas.rect(cx, compY, compW, 4, { fill: BRAND_COLORS.accentGreen });

      canvas.text(card.title, cx + 16, compY + 28, {
        fontSize: 8.5,
        font: 'bold',
        color: BRAND_COLORS.primaryText
      });
      canvas.text(card.status, cx + 16, compY + 64, {
        fontSize: 16,
        font: 'bold',
        color: BRAND_COLORS.secondaryText
      });
      canvas.text(card.badge, cx + 16, compY + 88, {
        fontSize: 8,
        font: 'bold',
        color: BRAND_COLORS.accentGreen
      });

      card.bullets.forEach((bullet, bIdx) => {
        canvas.textBlock(
          `* ${bullet}`,
          cx + 16,
          compY + 116 + bIdx * 56,
          compW - 32,
          { fontSize: 8.5, color: BRAND_COLORS.secondaryText, lineHeight: 13 }
        );
      });
    });
  } else {
    // Demonstration Archetype Cards
    const cards = [
      {
        title: 'ENERGY & FUELS (PETCOKE / COAL)',
        gap: '6.8% Above Index',
        badge: 'OPPORTUNITY: Rs. 6.80 Cr',
        bullets: [
          'Purchase prices tracked ~6.8% above domestic index averages across FY24.',
          'Quarterly procurement cycles failed to capture spot-market pricing dips.',
          'Shift to index-linked contract with +/-3% band unlocks Rs. 6.80 Cr.'
        ]
      },
      {
        title: 'PACKAGING MATERIALS (HDPE BAGS)',
        gap: '4.2% Above Index',
        badge: 'OPPORTUNITY: Rs. 4.60 Cr',
        bullets: [
          'Polymer raw material fell 12% while bag conversion rates remained flat.',
          'Vendors retained 100% of polymer decline due to fixed-price terms.',
          'Formulaic polymer indexing recovers Rs. 4.60 Cr annual savings.'
        ]
      },
      {
        title: 'GRINDING MEDIA (HIGH CHROME)',
        gap: '3.9% Above Index',
        badge: 'OPPORTUNITY: Rs. 3.48 Cr',
        bullets: [
          'Steel scrap and ferro-chrome index declines were unreflected in quotes.',
          'Scrap-indexed pricing mechanism renegotiates high chrome ball supply.',
          'Recaptures Rs. 3.48 Cr across Rajasthan and Gujarat plant clusters.'
        ]
      }
    ];

    cards.forEach((card, idx) => {
      const cx = PDF_LAYOUT.CONTENT_LEFT + idx * 296;
      canvas.rect(cx, compY, compW, compH, {
        fill: BRAND_COLORS.lightCard,
        stroke: BRAND_COLORS.border,
        lineWidth: 1
      });
      canvas.rect(cx, compY, compW, 4, { fill: BRAND_COLORS.procucevBlue });

      canvas.text(card.title, cx + 16, compY + 28, {
        fontSize: 8.5,
        font: 'bold',
        color: BRAND_COLORS.primaryText
      });
      canvas.text(card.gap, cx + 16, compY + 64, {
        fontSize: 16,
        font: 'bold',
        color: BRAND_COLORS.procucevBlue
      });
      canvas.text(card.badge, cx + 16, compY + 88, {
        fontSize: 8,
        font: 'bold',
        color: BRAND_COLORS.accentGreen
      });

      card.bullets.forEach((bullet, bIdx) => {
        canvas.textBlock(
          `* ${bullet}`,
          cx + 16,
          compY + 116 + bIdx * 56,
          compW - 32,
          { fontSize: 8.5, color: BRAND_COLORS.primaryText, lineHeight: 13 }
        );
      });
    });
  }

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'STRATEGIC MARKET VALUE GOVERNANCE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  const banText = isCust
    ? `For ${clientName} (AIC-2026-0002), benchmark price gap is labeled as UNAVAILABLE. Under strict governance, demonstration archetype benchmarks are NEVER substituted. Modelled savings (₹85.641 Cr net) and proven opportunity (₹82.380 Cr) derive entirely from empirical transaction data.`
    : 'Total Strategic Market Value of ₹14.88 Cr is tracked separately from Direct Savings (₹78.72 Cr). It reflects commercial timing and formula indexing upside dependent on market movements rather than operational price reduction.';
  canvas.textBlock(
    banText,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
