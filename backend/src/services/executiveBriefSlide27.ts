/**
 * Executive Brief Slide 27 (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Procucev Domain Authority: Sector Sourcing Provenance
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS,
  isCustomerAssessment
} from '../constants/executiveBriefPresentationConstants';

interface AuthorityPillar {
  stat: string;
  label: string;
  desc: string;
  badge: string;
  color: string;
}

export function renderSlide27DomainAuthority(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  const isCust = isCustomerAssessment(clientName);
  const headerTitle = isCust
    ? 'Procucev Domain Authority: Strategic Sourcing & Procurement Provenance'
    : 'Procucev Domain Authority: Cement & Heavy Manufacturing Provenance';

  canvas.renderHeader(headerTitle, 'Domain Authority', p);

  // 4 Authority Pillars
  const colW = 207;
  const colH = 300;
  const startY = 104;

  const credentials: AuthorityPillar[] = isCust
    ? [
        {
          stat: '₹45,000+ Cr',
          label: 'INDUSTRIAL SPEND AUDITED',
          desc: 'Extensive forensic spend analysis across textiles, manufacturing, chemicals, and industrial process enterprises.',
          badge: 'Extensive Scale',
          color: BRAND_COLORS.procucevBlue
        },
        {
          stat: 'PCBI Index',
          label: 'PROPRIETARY BENCHMARKS',
          desc: '28 industrial commodity benchmark indices covering imported fuels, chemicals, packaging, and freight.',
          badge: 'Market Intelligence',
          color: BRAND_COLORS.accentGreen
        },
        {
          stat: 'Multi-Sector',
          label: 'DEEP SECTOR PLAYBOOKS',
          desc: 'Specialized category sourcing playbooks across capital equipment, raw materials, process fuel, and MRO.',
          badge: 'Category Mastery',
          color: '#0284C7'
        },
        {
          stat: '100% Audited',
          label: 'P&L CASH REALIZATION',
          desc: 'Turnkey execution model verifying actual rate reductions against ERP payment registers with zero speculative savings.',
          badge: 'CFO Trust',
          color: BRAND_COLORS.accentAmber
        }
      ]
    : [
        {
          stat: '₹45,000+ Cr',
          label: 'INDUSTRIAL SPEND AUDITED',
          desc: 'Extensive forensic spend analysis across cement, metals, mining, and heavy process manufacturing.',
          badge: 'Extensive Scale',
          color: BRAND_COLORS.procucevBlue
        },
        {
          stat: 'PCBI Index',
          label: 'PROPRIETARY BENCHMARKS',
          desc: '28 industrial commodity benchmark indices covering imported fuels, chemicals, packaging, and freight.',
          badge: 'Market Intelligence',
          color: BRAND_COLORS.accentGreen
        },
        {
          stat: 'Cement Ops',
          label: 'DEEP SECTOR PLAYBOOKS',
          desc: 'Hands-on category experience across limestone extraction, clinker burning, and bulk bagging terminals.',
          badge: 'Category Mastery',
          color: '#0284C7'
        },
        {
          stat: '100% Audited',
          label: 'P&L CASH REALIZATION',
          desc: 'Turnkey execution model verifying actual rate reductions against ERP payment registers.',
          badge: 'CFO Trust',
          color: BRAND_COLORS.accentAmber
        }
      ];

  credentials.forEach((cr, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 12);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: cr.color });

    canvas.text(cr.stat, x + 16, startY + 36, { fontSize: 20, font: 'bold', color: cr.color });
    canvas.text(cr.label, x + 16, startY + 58, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.line(x + 16, startY + 74, x + colW - 16, startY + 74, BRAND_COLORS.border, 0.5);

    canvas.textBlock(cr.desc, x + 16, startY + 94, colW - 32, {
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });

    canvas.rect(x + 12, startY + 246, colW - 24, 38, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(cr.badge, x + 20, startY + 270, { fontSize: 9, font: 'bold', color: cr.color });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'OPERATIONAL EXECUTION ADVANTAGE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Procucev is not a generalist management consultancy. We deploy procurement practitioners, commodity data ' +
    `scientists, and dynamic auction choreographers who work alongside ${clientName} teams to deliver hard EBITDA results.`,
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
