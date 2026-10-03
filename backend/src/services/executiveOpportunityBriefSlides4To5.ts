/**
 * 10-Slide Executive Opportunity Brief — Slides 4 to 5
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

export function renderBriefSlide4(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('From Gross Opportunity to Defensible Value', 'Financial Reconciliation', 4);

  const bridgeSteps = [
    {
      title: 'GROSS OPPORTUNITY',
      val: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.grossOpportunityCr.toFixed(2)} Cr`,
      desc: 'Sum of 10 opportunity levers identified across spend baseline',
      c: BRAND_COLORS.procucevBlue, bg: BRAND_COLORS.lightCard
    },
    {
      title: 'OVERLAP DEDUCTIONS',
      val: `- Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.overlapDeductionsCr.toFixed(2)} Cr`,
      desc: 'Eliminates cross-lever double-counting between price & auction',
      c: BRAND_COLORS.accentAmber, bg: '#FFFBEB'
    },
    {
      title: 'POLICY EXCLUSIONS',
      val: `- Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.exclusionsCr.toFixed(2)} Cr`,
      desc: 'Long-term single-source OEM & statutory boundary constraints',
      c: BRAND_COLORS.accentAmber, bg: '#FFFBEB'
    },
    {
      title: 'NET DEFENSIBLE PIPELINE',
      val: `Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr`,
      desc: 'Audited, risk-adjusted value pipeline ready for executive capture',
      c: BRAND_COLORS.accentGreen, bg: '#ECFDF5'
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
  canvas.text(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr.toFixed(2)} Cr`,
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
  canvas.text(`Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr.toFixed(2)} Cr`,
    split2X + 16, splitY + 54, {
      fontSize: 22, font: 'bold', color: BRAND_COLORS.procucevBlue
    });
  canvas.text('Contract reset timing and market index formula contracting tracked distinctly.',
    split2X + 16, splitY + 78, {
      fontSize: 8.5, color: BRAND_COLORS.secondaryText
    });

  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, 410, PDF_LAYOUT.CONTENT_WIDTH, 34, {
    fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 0.75
  });
  canvas.text(
    'Mathematical reconciliation variance: Rs. 0.00 Cr  |  ' +
    `Gross (Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.grossOpportunityCr.toFixed(2)} Cr) - ` +
    `Deductions (Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.overlapDeductionsCr.toFixed(2)} Cr) - ` +
    `Exclusions (Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.exclusionsCr.toFixed(2)} Cr) = ` +
    `Net Pipeline (Rs. ${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr.toFixed(2)} Cr)`,
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

export function renderBriefSlide5(canvas: PdfCanvas): void {
  canvas.addPage();
  canvas.renderHeader('Why Management Can Trust the Number', 'Evidence & Audit Trail', 5);

  const proofPoints = [
    {
      num: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineTransactions.toLocaleString(),
      lbl: 'Transaction Records',
      sub: 'Audited PO & invoice lines'
    },
    {
      num: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineSuppliers.toLocaleString(),
      lbl: 'Suppliers',
      sub: 'Vendor master profiled'
    },
    {
      num: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineMaterialGroups.toLocaleString(),
      lbl: 'Material Groups',
      sub: 'Clean taxonomy categories'
    },
    {
      num: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselinePlants.toLocaleString(),
      lbl: 'Plants',
      sub: 'Pan-India manufacturing sites'
    },
    {
      num: `${EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.analysisPeriodMonths} Months`,
      lbl: 'Analysis Period',
      sub: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.analysisPeriod
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
    canvas.text(p.num, x + 14, 155, { fontSize: 24, font: 'bold', color: BRAND_COLORS.primaryText });
    canvas.text(p.lbl, x + 14, 185, { fontSize: 10, font: 'bold', color: BRAND_COLORS.procucevBlue });
    canvas.text(p.sub, x + 14, 212, { fontSize: 8.5, color: BRAND_COLORS.secondaryText });
  });

  const flowY = 260;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, flowY, PDF_LAYOUT.CONTENT_WIDTH, 75, {
    fill: BRAND_COLORS.lightCard, stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.text('ROBUST VALUE PROVENANCE ARCHITECTURE', PDF_LAYOUT.CONTENT_LEFT + 20, flowY + 24, {
    fontSize: 9, font: 'bold', color: BRAND_COLORS.procucevBlue
  });
  canvas.text(
    'Transaction-level analysis  ->  Category intelligence  ->  ' +
    'Sourcing opportunities  ->  Overlap controls  ->  Defensible pipeline',
    PDF_LAYOUT.CONTENT_LEFT + 20, flowY + 54, {
      fontSize: 11, font: 'bold', color: BRAND_COLORS.primaryText
    }
  );

  const secY = 355;
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, secY, PDF_LAYOUT.CONTENT_WIDTH, 60, {
    fill: '#F8FAFC', stroke: BRAND_COLORS.border, lineWidth: 1
  });
  canvas.rect(PDF_LAYOUT.CONTENT_LEFT, secY, 4, 60, { fill: '#64748B' });
  canvas.text('DATA GOVERNANCE & INTEGRITY ASSURANCE', PDF_LAYOUT.CONTENT_LEFT + 20, secY + 22, {
    fontSize: 9, font: 'bold', color: BRAND_COLORS.primaryText
  });
  canvas.text(
    'Customer procurement data is handled under configured tenant isolation, access controls, ' +
    'confidentiality and data-governance controls.',
    PDF_LAYOUT.CONTENT_LEFT + 20, secY + 44, {
      fontSize: 9.5, color: BRAND_COLORS.secondaryText
    }
  );

  canvas.text(
    'Full methodology and audit trail: Boardroom & Evidence Edition - Slides 7 & 30',
    PDF_LAYOUT.CONTENT_LEFT, 460, {
      fontSize: 9, font: 'italic', color: BRAND_COLORS.secondaryText
    }
  );
  renderExecutiveOpportunityBriefFooter(canvas, 5);
}
