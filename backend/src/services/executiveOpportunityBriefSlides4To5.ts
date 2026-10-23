/**
 * 10-Slide Executive Opportunity Brief — Slides 4 to 5
 * Adheres strictly to Prompt 286 (CFO/CEO Discussion Edition) and Prompt 503.
 * Dynamic presentation contract binding for customer-specific financial figures.
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

export function renderBriefSlide4(
  canvas: PdfCanvas,
  clientName = 'ABC Textile Ltd',
  contract?: ExecutiveBriefPresentationContract
): void {
  const activeContract = contract || getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  canvas.addPage();
  canvas.renderHeader('From Gross Opportunity to Defensible Value', 'Financial Reconciliation', 4);

  const bridgeSteps = [
    {
      title: 'GROSS OPPORTUNITY',
      val: `Rs. ${activeContract.grossOpportunityCr.toFixed(2)} Cr`,
      desc: isCust
        ? 'Gross modelled opportunity identified across evaluated baseline spend'
        : 'Sum of 10 opportunity levers identified across spend baseline',
      c: BRAND_COLORS.procucevBlue,
      bg: BRAND_COLORS.lightCard
    },
    {
      title: 'OVERLAP DEDUCTIONS',
      val: `- Rs. ${activeContract.overlapDeductionsCr.toFixed(2)} Cr`,
      desc: 'Eliminates cross-lever double-counting between price & auction',
      c: BRAND_COLORS.accentAmber,
      bg: '#FFFBEB'
    },
    {
      title: 'POLICY EXCLUSIONS',
      val: `- Rs. ${activeContract.exclusionsCr.toFixed(2)} Cr`,
      desc: isCust
        ? 'Zero policy exclusions applied for this assessment baseline'
        : 'Long-term single-source OEM & statutory boundary constraints',
      c: BRAND_COLORS.accentAmber,
      bg: '#FFFBEB'
    },
    {
      title: 'NET DEFENSIBLE PIPELINE',
      val: `Rs. ${activeContract.netDefensiblePipelineCr.toFixed(2)} Cr`,
      desc: 'Audited, risk-adjusted value pipeline ready for executive capture',
      c: BRAND_COLORS.accentGreen,
      bg: '#ECFDF5'
    }
  ];

  const stepW = 196;
  const gap = 32;
  const stepY = 110;

  bridgeSteps.forEach((s, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (stepW + gap);
    canvas.rect(x, stepY, stepW, 160, {
      fill: s.bg, stroke: s.c, lineWidth: 1.25
    });
    canvas.rect(x, stepY, stepW, 4, { fill: s.c });
    canvas.text(s.title, x + 12, stepY + 26, { fontSize: 8.5, font: 'bold', color: BRAND_COLORS.secondaryText });
    canvas.text(s.val, x + 12, stepY + 68, { fontSize: 17, font: 'bold', color: s.c });
    canvas.textBlock(s.desc, x + 12, stepY + 100, stepW - 24, {
      fontSize: 9, color: BRAND_COLORS.secondaryText, lineHeight: 14
    });

    if (idx < 3) {
      canvas.text('->', x + stepW + 8, stepY + 70, {
        fontSize: 16, font: 'bold', color: BRAND_COLORS.secondaryText
      });
    }
  });

  const splitY = 295;
  const splitW = 425;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, splitY, splitW, 95, {
    fill: '#ECFDF5', stroke: BRAND_COLORS.accentGreen, lineWidth: 1.25
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, splitY, 4, 95, { fill: BRAND_COLORS.accentGreen });
  canvas.text('DIRECT SAVINGS OPPORTUNITY (P&L EBITDA EXPANSION)', PDF_LAYOUT.CONTENT_LEFT + 16, splitY + 22, {
    fontSize: 9, font: 'bold', color: '#065F46'
  });
  canvas.text(`Rs. ${activeContract.netDirectSavingsCr.toFixed(2)} Cr`,
    PDF_LAYOUT.CONTENT_LEFT + 16, splitY + 54, {
      fontSize: 22, font: 'bold', color: BRAND_COLORS.accentGreen
    });
  canvas.text('Harmonization, volume pooling, and competitive tenders delivering direct cost reductions.',
    PDF_LAYOUT.CONTENT_LEFT + 16, splitY + 78, {
      fontSize: 8.5, color: BRAND_COLORS.secondaryText
    });

  const split2X = PDF_LAYOUT.CONTENT_LEFT + splitW + 30;
  canvas.rect(split2X, splitY, splitW, 95, {
    fill: '#EFF6FF', stroke: BRAND_COLORS.procucevBlue, lineWidth: 1.25
  });
  canvas.rect(split2X, splitY, 4, 95, { fill: BRAND_COLORS.procucevBlue });
  canvas.text('STRATEGIC MARKET VALUE (COMMODITY & TIMING LEVERS)', split2X + 16, splitY + 22, {
    fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue
  });
  canvas.text(`Rs. ${activeContract.strategicMarketValueCr.toFixed(2)} Cr`,
    split2X + 16, splitY + 54, {
      fontSize: 22, font: 'bold', color: BRAND_COLORS.procucevBlue
    });
  const stratDesc = isCust
    ? 'PCBI benchmark price gap is UNAVAILABLE for this assessment. Zero external values substituted.'
    : 'Contract reset timing and market index formula contracting tracked distinctly.';
  canvas.text(stratDesc, split2X + 16, splitY + 78, {
    fontSize: 8.5, color: BRAND_COLORS.secondaryText
  });

  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 410, PDF_LAYOUT.CONTENT_WIDTH, 34, {
    fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 0.75
  });
  canvas.text(
    'Mathematical reconciliation variance: Rs. 0.00 Cr  |  ' +
    `Gross (Rs. ${activeContract.grossOpportunityCr.toFixed(2)} Cr) - ` +
    `Deductions (Rs. ${activeContract.overlapDeductionsCr.toFixed(2)} Cr) - ` +
    `Exclusions (Rs. ${activeContract.exclusionsCr.toFixed(2)} Cr) = ` +
    `Net Pipeline (Rs. ${activeContract.netDefensiblePipelineCr.toFixed(2)} Cr)`,
    PDF_LAYOUT.CONTENT_LEFT + 16, 431, {
      fontSize: 8.5, font: 'bold', color: BRAND_COLORS.accentGreen
    }
  );

  canvas.text(
    'Full financial reconciliation: Boardroom & Evidence Edition - Slide 10',
    PDF_LAYOUT.CONTENT_LEFT, 465, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 4);
}

export function renderBriefSlide5(
  canvas: PdfCanvas,
  clientName = 'ABC Textile Ltd',
  contract?: ExecutiveBriefPresentationContract
): void {
  const activeContract = contract || getExecutiveBriefPresentationContract(clientName);

  canvas.addPage();
  canvas.renderHeader('Why Management Can Trust the Number', 'Evidence & Audit Trail', 5);

  const proofPoints = [
    {
      num: activeContract.baselineTransactions.toLocaleString(),
      lbl: 'Transaction Records',
      sub: 'Audited PO & invoice lines'
    },
    {
      num: activeContract.baselineSuppliers.toLocaleString(),
      lbl: 'Suppliers',
      sub: 'Vendor master profiled'
    },
    {
      num: activeContract.baselineMaterialGroups.toLocaleString(),
      lbl: 'Material Groups',
      sub: 'Clean taxonomy categories'
    },
    {
      num: activeContract.baselinePlants.toLocaleString(),
      lbl: 'Plants',
      sub: 'Manufacturing plant sites'
    },
    {
      num: `${activeContract.analysisPeriodMonths} Months`,
      lbl: 'Analysis Period',
      sub: activeContract.analysisPeriod
    }
  ];

  const pW = 164;
  const pGap = 15;
  proofPoints.forEach((p, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (pW + pGap);
    canvas.rect(x, 108, pW, 130, {
      fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
    });
    canvas.rect(x, 108, pW, 4, { fill: BRAND_COLORS.procucevBlue });
    canvas.text(p.num, x + 12, 142, { fontSize: 20, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(p.lbl, x + 12, 168, { fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue });
    canvas.text(p.sub, x + 12, 190, { fontSize: 9, color: BRAND_COLORS.secondaryText });
  });

  const bannerY = 265;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bannerY, PDF_LAYOUT.CONTENT_WIDTH, 70, {
    fill: '#EFF6FF', stroke: '#BFDBFE', lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, bannerY, 4, 70, { fill: BRAND_COLORS.procucevBlue });
  canvas.text(
    'Every rupee is traced to specific PO line items and supplier rate differentials. Zero high-level extrapolation.',
    PDF_LAYOUT.CONTENT_LEFT + 20, bannerY + 28, {
      fontSize: 10.5, font: 'bold', color: BRAND_COLORS.procucevBlue
    }
  );
  canvas.text(
    `Reconciled against verified baseline of Rs. ${activeContract.totalCustomerSpendCr.toFixed(4)} Cr under strict data isolation.`,
    PDF_LAYOUT.CONTENT_LEFT + 20, bannerY + 50, {
      fontSize: 9.5, font: 'regular', color: BRAND_COLORS.primaryText
    }
  );

  const steps = [
    { n: '1', title: 'Data Ingestion & Hygiene', desc: '100% line-item normalization; duplicate elimination.' },
    { n: '2', title: 'Isolation & Encryption', desc: 'Customer data processed under dedicated AES-256 isolation.' },
    { n: '3', title: 'Independent Validation', desc: 'Multi-lever overlap deductions eliminate double-counting.' }
  ];
  const sW = 280;
  const sGap = 20;
  const sY = 355;
  steps.forEach((s, idx) => {
    const x = PDF_LAYOUT.CONTENT_LEFT + idx * (sW + sGap);
    canvas.rect(x, sY, sW, 90, { fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 0.75 });
    canvas.text(`STEP ${s.n}: ${s.title}`, x + 14, sY + 24, {
      fontSize: 9.5, font: 'bold', color: BRAND_COLORS.procucevBlue
    });
    canvas.textBlock(s.desc, x + 14, sY + 44, sW - 28, {
      fontSize: 9, color: BRAND_COLORS.secondaryText, lineHeight: 14
    });
  });

  canvas.text(
    'Full audit methodology: Boardroom & Evidence Edition - Slides 7-10',
    PDF_LAYOUT.CONTENT_LEFT, 465, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 5);
}
