/**
 * Executive Brief Slide 28 - Data Trust (Prompt 283 - Premium Boardroom Consulting Redesign)
 * Strict 10 x 5.625 inch grid, Aptos typography, 4 enterprise security & governance cards.
 */

import type { PdfCanvas } from '../utils/pdfCanvas';
import {
  PDF_LAYOUT,
  BRAND_COLORS
} from '../constants/executiveBriefPresentationConstants';

export function renderSlide28DataTrust(
  canvas: PdfCanvas,
  clientName: string,
  p: number,
  total: number,
  conf: string
): void {
  canvas.addPage();
  canvas.renderHeader(
    'How Customer Procurement Data is Protected: Trust & Governance',
    'Trust & Governance',
    p
  );

  // 4 Enterprise Security & Governance Cards
  const colW = 207;
  const colH = 300;
  const startY = 104;

  const protections = [
    {
      num: '01',
      title: 'AES-256-GCM Encryption',
      sub: 'Cryptographic Standard',
      desc: 'All sensitive transactional line items, unit rates, supplier names, and plant identifiers are ' +
            'encrypted with AES-256-GCM using unique per-tenant keys.',
      badge: 'FIPS-Grade Security',
      color: BRAND_COLORS.procucevBlue
    },
    {
      num: '02',
      title: 'Zero Model Training',
      sub: 'Strict Data Isolation',
      desc: 'Customer procurement data is processed within an isolated tenant enclave. Data is NEVER shared ' +
            'across customers or used to train public machine learning models.',
      badge: 'Air-Gapped Privacy',
      color: BRAND_COLORS.accentGreen
    },
    {
      num: '03',
      title: 'Forensic Audit Trail',
      sub: 'Transaction Lineage',
      desc: 'Every finding, rate dispersion, and savings opportunity carries an immutable checksum linked ' +
            'directly back to specific SAP invoice and PO line-item numbers.',
      badge: '100% Traceability',
      color: '#0284C7'
    },
    {
      num: '04',
      title: 'Enterprise Compliance',
      sub: 'SOC-2 & ISO 27001',
      desc: 'Platform runs on hardened infrastructure with role-based access control (RBAC), multi-factor ' +
            'authentication, and automated audit logging on all data queries.',
      badge: 'Certified Security',
      color: BRAND_COLORS.accentAmber
    }
  ];

  protections.forEach((pr, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (colW + 12);
    canvas.rect(x, startY, colW, colH, {
      fill: BRAND_COLORS.lightCard,
      stroke: BRAND_COLORS.border,
      lineWidth: 1
    });
    canvas.rect(x, startY, colW, 4, { fill: pr.color });

    canvas.text(pr.num, x + 16, startY + 28, { fontSize: 12, font: 'bold', color: pr.color });
    canvas.text(pr.title, x + 16, startY + 52, { fontSize: 9.5, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(pr.sub, x + 16, startY + 70, { fontSize: 8, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.line(x + 16, startY + 84, x + colW - 16, startY + 84, BRAND_COLORS.border, 0.5);

    canvas.textBlock(pr.desc, x + 16, startY + 104, colW - 32, {
      fontSize: 9.5,
      color: BRAND_COLORS.primaryText,
      lineHeight: 15
    });

    canvas.rect(x + 12, startY + 246, colW - 24, 38, {
      fill: BRAND_COLORS.canvas,
      stroke: BRAND_COLORS.border,
      lineWidth: 0.5
    });
    canvas.text(pr.badge, x + 20, startY + 270, { fontSize: 9, font: 'bold', color: pr.color });
  });

  // Bottom Takeaway Banner
  const banY = 422;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, banY, PDF_LAYOUT.CONTENT_WIDTH, 68, {
    fill: BRAND_COLORS.lightCard,
    stroke: BRAND_COLORS.border,
    lineWidth: 1
  });
  canvas.text(
    'ENTERPRISE DATA INTEGRITY PLEDGE',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 22,
    { fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue }
  );
  canvas.textBlock(
    'Procucev guarantees full legal and technical custody of customer confidential information. Commercial rate ' +
    'intelligence remains strictly proprietary to UltraTech and is safeguarded under mutual non-disclosure agreements.',
    PDF_LAYOUT.CONTENT_LEFT + 20,
    banY + 40,
    PDF_LAYOUT.CONTENT_WIDTH - 40,
    { fontSize: 10, color: BRAND_COLORS.secondaryText, lineHeight: 15 }
  );

  canvas.renderFooter(clientName, conf, p, total);
}
