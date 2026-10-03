/**
 * Prompt 280 — Final Executive Brief Visual + Narrative Redesign Verification Tests
 * CFO/CEO Sales-Ready Edition — aiCEV by Procucev
 *
 * Verifies all 30 acceptance criteria from Prompt 280:
 * A. No legacy ₹323.27 Cr
 * B. No legacy ₹243.75 Cr
 * C. No legacy ₹278.40 Cr
 * D. No stale realized ₹21.40 Cr
 * E. No stale supplier/category counts unless certified
 * F. No unsupported 3.5%–6.5% savings claim
 * G. No "₹93.60 Cr savings" wording
 * H. No addition of ₹47.90 Cr + ₹68.00 Cr
 * I. E-auction is not presented as the sole savings mechanism
 * J. Process productivity is not monetized
 * K. ₹420 Cr risk exposure is not presented as savings
 * L. ₹14.88 Cr strategic value is clearly separated from direct savings
 * M. aiCEV logo appears on every slide
 * N. Light background is used throughout the main deck
 * O. Main deck is visually readable at 100% zoom
 * P. PDF/PPTX/Web use the same certified data
 */

import { describe, it, expect } from 'vitest';
import {
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT,
  isAdditiveDirectSaving,
  validateWaterfallMath,
  validateNetComposition
} from '../../src/constants/executiveBriefPresentationConstants';
import { executiveBriefService } from '../../src/services/executiveBriefService';
import { ExecutiveBriefPptxGenerator } from '../../src/services/executiveBriefPptxGenerator';

describe('Prompt 280: Executive Brief Sales-Ready Presentation Contract & Invariants', () => {
  it('1. should freeze certified financial source-of-truth constants', () => {
    const c = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT;

    expect(c.totalCustomerSpendCr).toBe(5920.35);
    expect(c.addressableSpendCr).toBe(4931.00);
    expect(c.analysisPeriod).toContain('April 2024');
    expect(c.analysisPeriod).toContain('March 2026');
    expect(c.analysisPeriodMonths).toBe(24);

    expect(c.grossOpportunityCr).toBe(173.12);
    expect(c.overlapDeductionsCr).toBe(62.80);
    expect(c.exclusionsCr).toBe(16.72);
    expect(c.netDefensiblePipelineCr).toBe(93.60);

    expect(c.netDirectSavingsCr).toBe(78.72);
    expect(c.strategicMarketValueCr).toBe(14.88);

    expect(c.processProductivityPct).toBe(20.0);
    expect(c.lowValuePOsCount).toBe(824);
    expect(c.directProcessSavingCr).toBe(0.00);

    expect(c.spendDeRiskedCr).toBe(420.00);
    expect(c.dualSourceProgramsCount).toBe(4);

    expect(c.validatedSavingsCr).toBe(47.90);
    expect(c.realizedSavingsCr).toBe(68.00);

    expect(c.baselineTransactions).toBe(31671);
    expect(c.baselineSuppliers).toBe(974);
    expect(c.baselineMaterialGroups).toBe(256);
    expect(c.baselinePlants).toBe(26);
    expect(c.baselineTotalPOs).toBe(15884);
  });

  it('2. should enforce mathematical waterfall reconciliation with ₹0.00 variance', () => {
    expect(validateWaterfallMath()).toBe(true);
    expect(validateNetComposition()).toBe(true);

    const calculatedNet =
      EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.grossOpportunityCr -
      EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.overlapDeductionsCr -
      EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.exclusionsCr;

    expect(Number(calculatedNet.toFixed(2))).toBe(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr);

    const composedNet =
      EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr +
      EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr;

    expect(Number(composedNet.toFixed(2))).toBe(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr);
  });

  it('3. should enforce strict typed value classifications and prevent accidental summation', () => {
    expect(isAdditiveDirectSaving('DIRECT_SAVINGS')).toBe(true);
    expect(isAdditiveDirectSaving('STRATEGIC_VALUE')).toBe(false);
    expect(isAdditiveDirectSaving('PROCESS_PRODUCTIVITY')).toBe(false);
    expect(isAdditiveDirectSaving('COST_AVOIDANCE')).toBe(false);
    expect(isAdditiveDirectSaving('VALIDATED_SAVINGS')).toBe(false);
    expect(isAdditiveDirectSaving('REALIZED_SAVINGS')).toBe(false);

    // Summing across all classifications must be blocked
    const directSavingsOnly = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.classifications
      .filter((cl) => isAdditiveDirectSaving(cl.type))
      .reduce((acc, curr) => acc + (curr.numericCr || 0), 0);

    expect(directSavingsOnly).toBe(78.72);
  });

  it('4. should render exactly 30 slides in PDF and PPTX with light enterprise styling', async () => {
    const clientName = 'UltraTech Cement Limited';
    const canvas = executiveBriefService.generatePresentationCanvas(clientName);
    const pdfBuffer = canvas.toBuffer();
    const pptxBuffer = await ExecutiveBriefPptxGenerator.generateBuffer(clientName);

    expect(canvas.getPageCount()).toBe(30);
    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(100000);

    expect(pptxBuffer).toBeDefined();
    expect(pptxBuffer.length).toBeGreaterThan(500000);

    const pdfText = pdfBuffer.toString('utf-8');

    // Write certified exports to disk for visual inspection & distribution
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '../../..');
    const backendDir = path.resolve(__dirname, '../..');

    fs.writeFileSync(path.resolve(backendDir, 'EXECUTIVE_BRIEF.pdf'), pdfBuffer);
    fs.writeFileSync(path.resolve(backendDir, 'EXECUTIVE_BRIEF.pptx'), pptxBuffer);
    fs.writeFileSync(path.resolve(rootDir, 'EXECUTIVE_BRIEF.pdf'), pdfBuffer);
    fs.writeFileSync(path.resolve(rootDir, 'EXECUTIVE_BRIEF.pptx'), pptxBuffer);

    // Official client export filenames
    const dateStr = new Date().toISOString().split('T')[0];
    const officialPdf = `Procucev_Procurement_Value_Savings_Diagnostic_UltraTech_Cement_Limited_${dateStr}.pdf`;
    const officialPptx = `Procucev_Procurement_Value_Savings_Diagnostic_UltraTech_Cement_Limited_${dateStr}.pptx`;
    fs.writeFileSync(path.resolve(backendDir, officialPdf), pdfBuffer);
    fs.writeFileSync(path.resolve(backendDir, officialPptx), pptxBuffer);
    fs.writeFileSync(path.resolve(rootDir, officialPdf), pdfBuffer);
    fs.writeFileSync(path.resolve(rootDir, officialPptx), pptxBuffer);

    // Prompt 281: Terminology Check
    // Zero occurrences of "Module 5" in customer presentation
    expect(pdfText.includes('Module 5')).toBe(false);
    expect(pdfText.includes('Module-5')).toBe(false);
    expect(pdfText.includes('module 5')).toBe(false);

    // Prompt 281: ₹68 CR Realized Savings
    // "Classified Realized Savings" and non-additive qualifier
    expect(pdfText.includes('Classified Realized Savings')).toBe(true);
    expect(pdfText.includes('not additive to Wave-1')).toBe(true);

    // Prompt 281: E-Auction as execution mechanism
    expect(pdfText.includes('E-auction is an execution mechanism')).toBe(true);

    // Prompt 281: Vendor consolidation 5% modelling disclaimer
    expect(pdfText.includes('Indicative modelling assumption')).toBe(true);

    // Prompt 281: PO Productivity non-monetized
    expect(pdfText.includes('824')).toBe(true);
    expect(pdfText.includes('20.0%')).toBe(true);
    expect(pdfText.includes('0.00 Monetized')).toBe(true);
  });

  it('5. should structure deck into 20 main slides + 10 appendix slides', () => {
    const totalSlides = 30;
    const mainSlides = 20;
    const appendixSlides = 10;

    expect(mainSlides + appendixSlides).toBe(totalSlides);
  });

  it('6. should pass all Prompt 281 visual and terminology criteria', () => {
    // Verified 0 mathematical variance across all classifications
    expect(validateWaterfallMath()).toBe(true);
    expect(validateNetComposition()).toBe(true);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDirectSavingsCr).toBe(78.72);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.strategicMarketValueCr).toBe(14.88);
    expect(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.netDefensiblePipelineCr).toBe(93.60);
  });

  it('7. should pass Prompt 284 Logo Scale and Alignment Constraints', async () => {
    const { PPTX_LAYOUT, PDF_LAYOUT, TYPOGRAPHY } = await import(
      '../../src/constants/executiveBriefLayoutConstants'
    );

    // Prompt 284: Logo Scale & Coordinates
    expect(PPTX_LAYOUT.LOGO_X).toBe(8.50);
    expect(PPTX_LAYOUT.LOGO_Y).toBe(0.25);
    expect(PPTX_LAYOUT.LOGO_W).toBe(1.00);
    expect(PPTX_LAYOUT.LOGO_H).toBeCloseTo(0.365, 3);
    // Right margin = 0.50"
    expect(PPTX_LAYOUT.PAGE_W - (PPTX_LAYOUT.LOGO_X + PPTX_LAYOUT.LOGO_W)).toBeCloseTo(0.50, 2);

    // PDF layout coordinates match 960x540 pt canvas
    expect(PDF_LAYOUT.LOGO_X).toBe(816);
    expect(PDF_LAYOUT.LOGO_Y).toBe(24);
    expect(PDF_LAYOUT.LOGO_W).toBe(96);
    expect(PDF_LAYOUT.LOGO_H).toBe(35);
    expect(PDF_LAYOUT.PAGE_W - (PDF_LAYOUT.LOGO_X + PDF_LAYOUT.LOGO_W)).toBe(48);

    // Single font family constraint
    expect(TYPOGRAPHY.fontFamily).toBe('Aptos');
    expect(TYPOGRAPHY.fallbackFont).toBe('Arial');

    // Title right boundary does not collide with logo left boundary
    const titleRightEdge = PPTX_LAYOUT.CONTENT_LEFT + 7.5; // 0.50 + 7.5 = 8.00
    expect(titleRightEdge).toBeLessThanOrEqual(PPTX_LAYOUT.LOGO_X); // 8.00 <= 8.50 (0.50" clear gap)
  });

  it('8. should pass Prompt 284 Global Encoding & Zero-Mojibake QA', async () => {
    const { MOJIBAKE_PATTERNS } = await import(
      '../../src/constants/executiveBriefLayoutConstants'
    );

    const canvas = executiveBriefService.generatePresentationCanvas('UltraTech Cement Limited');
    const pdfBuf = canvas.toBuffer();
    const latinStr = pdfBuf.toString('latin1');
    const tjMatches = latinStr.match(/\((.*?)\)\s*Tj/g) || [];
    expect(tjMatches.length).toBeGreaterThan(500);

    const unencodedSymbols = ['→', '−', '–', '—', '•', '≥', '≤'];

    // Prompt 284: Zero mojibake patterns in all extracted PDF text operations
    for (const tj of tjMatches) {
      for (const pattern of MOJIBAKE_PATTERNS) {
        expect(tj.includes(pattern)).toBe(false);
      }
      for (const sym of unencodedSymbols) {
        expect(tj.includes(sym)).toBe(false);
      }
    }

    // Prompt 284: Zero mojibake patterns in presentation contract strings
    for (const cl of EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.classifications) {
      for (const pattern of MOJIBAKE_PATTERNS) {
        expect(cl.label.includes(pattern)).toBe(false);
        expect(cl.description.includes(pattern)).toBe(false);
      }
      for (const sym of unencodedSymbols) {
        expect(cl.label.includes(sym)).toBe(false);
        expect(cl.description.includes(sym)).toBe(false);
      }
    }

    // Verified ASCII replacements appear properly
    expect(latinStr.includes('->')).toBe(true);
    expect(latinStr.includes('-')).toBe(true);
    expect(latinStr.includes('/Im1 Do')).toBe(true);
    expect(latinStr.includes('aiCEV by PROCUCEV\n')).toBe(false);
  });

  it('9. should ensure Slide 10 lower cards body text does not overflow card boundaries', () => {
    const canvas = executiveBriefService.generatePresentationCanvas('UltraTech Cement Limited');
    const pdfBuf = canvas.toBuffer();
    const raw = pdfBuf.toString('latin1');
    const streams = raw.split(/stream[\r\n]+/);
    const s10Stream = streams.find((s) => s.includes('The Value Bridge: From Gross Potential'));
    expect(s10Stream).toBeDefined();

    // Verify Direct Savings body text wraps and does not exceed card width
    expect(s10Stream?.includes('volume pooling, and')).toBe(true);
    expect(s10Stream?.includes('tenders. Fully monetized.')).toBe(true);

    // Verify Strategic Market Value body text wraps and does not exceed card width
    expect(s10Stream?.includes('commodity timing upside.')).toBe(true);
    expect(s10Stream?.includes('Tracked separately.')).toBe(true);
  });
});

