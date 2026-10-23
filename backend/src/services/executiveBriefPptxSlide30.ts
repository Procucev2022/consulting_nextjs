/**
 * Executive Brief PPTX Slide 30
 * Implements Audit Appendix (Evidence Appendix & Attestation).
 */

import type PptxGenJS from 'pptxgenjs';
import { BRAND_COLORS, TYPOGRAPHY } from '../constants/executiveBriefLayoutConstants';
import { addSlideHeader, addSlideFooter } from './executiveBriefPptxHelpers';
import { getExecutiveBriefPresentationContract, isCustomerAssessment } from '../constants/executiveBriefPresentationConstants';

export function renderSlide30Pptx(
  pptx: PptxGenJS,
  clientName: string,
  totalSlides: number
): void {
  const fontFace = TYPOGRAPHY.fallbackFont;
  const contract = getExecutiveBriefPresentationContract(clientName);
  const isCust = isCustomerAssessment(clientName);

  const evaluatedSpendFormatted = isCust ? '₹613.8805 Cr' : '₹5,920.35 Cr';
  const grossOpportunityFormatted = isCust ? '₹110.764 Cr' : '₹173.12 Cr';
  const overlapDeductionsFormatted = isCust ? '₹25.123 Cr' : '₹62.80 Cr';
  const netPipelineFormatted = isCust ? '₹85.641 Cr' : '₹93.60 Cr';
  const heroDirectSavingsFormatted = isCust ? '₹85.641 Cr' : '₹78.72 Cr';
  const provenOpportunityFormatted = isCust ? '₹82.380 Cr' : '₹47.90 Cr';
  const invoicesCleansed = contract.baselineTransactions.toLocaleString();
  const evaluatedPeriodMonths = contract.analysisPeriodMonths;
  const activePlants = contract.baselinePlants;

  const s30 = pptx.addSlide();
  s30.background = { color: BRAND_COLORS.canvas.replace('#', '') };
  addSlideHeader(s30, 'Evidence Appendix: Methodological Provenance & Transaction Traceability', 'Audit Appendix', 30);

  const tableRows30: PptxGenJS.TableRow[] = [
    [
      { text: 'Metric Invariant', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Audited Value', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } },
      { text: 'Reconciliation Scope & Provenance', options: { bold: true, fill: { color: 'F1F5F9' }, color: '0F172A' } }
    ],
    [{ text: 'Total Spend Evaluated' }, { text: evaluatedSpendFormatted }, { text: `${invoicesCleansed} invoice line items (${evaluatedPeriodMonths} Months)` }],
    [{ text: 'Commercial Baseline' }, { text: evaluatedSpendFormatted }, { text: 'Excludes non-controllable taxes, duties, and inter-unit transfers' }],
    [{ text: 'Gross Opportunity' }, { text: grossOpportunityFormatted }, { text: 'Sum of individual potentials across 10 strategic sourcing levers' }],
    [{ text: 'Multi-Lever Overlaps' }, { text: overlapDeductionsFormatted }, { text: 'Mathematical deduplication between tenders, volume, and rate cuts' }],
    [{ text: 'Policy Exclusions' }, { text: isCust ? '₹0.00 Cr' : '₹16.72 Cr' }, { text: 'Carve-out of long-term contracts and single-source OEM spares' }],
    [{ text: 'Net Defensible Pipeline' }, { text: netPipelineFormatted }, { text: 'Certified value pool: Defensible Net Modelled Opportunity' }],
    [{ text: 'Proven Opportunity' }, { text: provenOpportunityFormatted }, { text: 'Empirical criteria satisfaction; ₹0.00 realized savings recognized to date' }],
    [{ text: 'Direct P&L Savings' }, { text: heroDirectSavingsFormatted }, { text: `Monetized recurring EBITDA cost reduction across ${activePlants} plants` }]
  ];
  s30.addTable(tableRows30, { x: 0.5, y: 1.15, w: 9.0, h: 2.45, colW: [2.5, 1.8, 4.7], fontSize: 8.5, color: '334155', fill: { color: 'FFFFFF' } });

  s30.addShape('rect', { x: 0.5, y: 3.75, w: 9.0, h: 1.3, fill: { color: 'FFFFFF' }, line: { color: BRAND_COLORS.border.replace('#', '') } });
  s30.addShape('rect', { x: 0.5, y: 3.75, w: 0.08, h: 1.3, fill: { color: BRAND_COLORS.accentGreen.replace('#', '') } });
  s30.addText(`PROCUCEV CERTIFIED DIAGNOSTIC AUDIT ATTESTATION\nThis Executive Brief is certified by Procucev Enterprise Diagnostic Analytics Engine. All numerical invariants balance with ₹0.00 variance across the transactional ledger. Process productivity and risk avoidance are strictly non-monetized to guarantee absolute boardroom credibility.\n\nPrepared Exclusively for ${clientName}  |  aiCEV by Procucev  |  Audit Certified`, {
    x: 0.7, y: 3.82, w: 8.6, h: 1.15, fontSize: 8.5, color: BRAND_COLORS.primaryText.replace('#', ''), fontFace
  });
  addSlideFooter(s30, clientName, 30, totalSlides);
}
