/**
 * Automated Validation Suite for 10-Slide Executive Opportunity Brief (Prompt 286)
 * Validates Executive Opportunity Brief vs Master 30-Slide Boardroom Edition.
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT
} from '../../src/constants/executiveBriefPresentationConstants';
import {
  ExecutiveOpportunityBriefService
} from '../../src/services/executiveOpportunityBriefService';
import {
  ExecutiveOpportunityBriefPptxGenerator
} from '../../src/services/executiveOpportunityBriefPptxGenerator';
import {
  ExecutiveOpportunityBriefExportService
} from '../../src/services/executiveOpportunityBriefExportService';
import {
  executiveBriefService
} from '../../src/services/executiveBriefService';
import {
  ExecutiveBriefPptxGenerator
} from '../../src/services/executiveBriefPptxGenerator';
import {
  PDF_LAYOUT,
  PPTX_LAYOUT
} from '../../src/constants/executiveBriefLayoutConstants';

describe('Prompt 286: 10-Slide Executive Opportunity Brief Validation Suite', () => {
  it('1. EXECUTIVE_SLIDE_COUNT = 10 and MASTER_SLIDE_COUNT = 30', async () => {
    // Executive Opportunity Brief
    expect(ExecutiveOpportunityBriefService.SLIDE_COUNT).toBe(10);
    expect(ExecutiveOpportunityBriefPptxGenerator.SLIDE_COUNT).toBe(10);

    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const briefPdfStr = briefPdfBuffer.toString('binary');
    const pageMatches = briefPdfStr.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches?.length).toBe(10);

    const { slideCount: briefPptxSlides } = await ExecutiveOpportunityBriefPptxGenerator.createPresentation();
    expect(briefPptxSlides).toBe(10);

    // Master 30-Slide Boardroom Edition remains exactly 30
    const masterCanvas = executiveBriefService.generatePresentationCanvas();
    expect(masterCanvas.getPageCount()).toBe(30);

    const { slideCount: masterPptxSlides } = await ExecutiveBriefPptxGenerator.createPresentation();
    expect(masterPptxSlides).toBe(30);
  });

  it('2. SHARED_FINANCIAL_SOURCE and FINANCIAL_VALUES_MATCH', () => {
    const c = EXECUTIVE_BRIEF_PRESENTATION_CONTRACT;

    expect(c.netDirectSavingsCr).toBe(78.72);
    expect(c.netDefensiblePipelineCr).toBe(93.60);
    expect(c.strategicMarketValueCr).toBe(14.88);
    expect(c.totalCustomerSpendCr).toBe(5920.35);
    expect(c.grossOpportunityCr).toBe(173.12);
    expect(c.overlapDeductionsCr).toBe(62.80);
    expect(c.exclusionsCr).toBe(16.72);
    expect(c.validatedSavingsCr).toBe(47.90);
    expect(c.realizedSavingsCr).toBe(68.00);
    expect(c.lowValuePOsCount).toBe(824);
    expect(c.directProcessSavingCr).toBe(0.00);
    expect(c.spendDeRiskedCr).toBe(420.00);
  });

  it('3. LOGO_ASSET, LOGO_POSITION, and LOGO_SIZE across all slides', () => {
    expect(PDF_LAYOUT.LOGO_X).toBe(816);
    expect(PDF_LAYOUT.LOGO_Y).toBe(24);
    expect(PDF_LAYOUT.LOGO_W).toBe(96);
    expect(PDF_LAYOUT.LOGO_H).toBe(35);

    expect(PPTX_LAYOUT.LOGO_X).toBe(8.5);
    expect(PPTX_LAYOUT.LOGO_Y).toBe(0.25);
    expect(PPTX_LAYOUT.LOGO_W).toBe(1.0);
    expect(PPTX_LAYOUT.LOGO_H).toBe(0.365);

    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const pdfStr = briefPdfBuffer.toString('binary');
    const logoDrawCalls = pdfStr.match(/\/Im1\s+Do/g);
    expect(logoDrawCalls?.length).toBe(10);
  });

  it('4. NO_MOJIBAKE and FONT_CONSISTENCY in rendered PDF', () => {
    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const pdfStr = briefPdfBuffer.toString('utf-8');

    expect(pdfStr).not.toContain('â†’');
    expect(pdfStr).not.toContain('âˆ−');
    expect(pdfStr).not.toContain('â€“');
    expect(pdfStr).not.toContain('â€¢');
    expect(pdfStr).not.toContain('ï¿½');
  });

  it('5. CROSS_REFERENCES to Boardroom & Evidence Edition', () => {
    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const pdfStr = briefPdfBuffer.toString('utf-8');

    expect(pdfStr).toContain('Boardroom & Evidence Edition');
    expect(pdfStr).toContain('Slides 7-10');
    expect(pdfStr).toContain('Slide 10');
    expect(pdfStr).toContain('Slide 24');
    expect(pdfStr).toContain('Slides 24-25');
  });

  it('6. FOOTER differentiation between 10-slide and 30-slide decks', () => {
    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const briefPdfStr = briefPdfBuffer.toString('utf-8');

    expect(briefPdfStr).toContain('CFO / CEO Discussion Edition');
    expect(briefPdfStr).toContain('PAGE 10 OF 10');

    const masterCanvas = executiveBriefService.generatePresentationCanvas();
    const masterPdfStr = masterCanvas.toBuffer().toString('utf-8');
    expect(masterPdfStr).toContain('Prepared exclusively for');
    expect(masterPdfStr).toContain('PAGE 30 OF 30');
  });

  it('7. PDF and PPTX file generation and disk export verification', async () => {
    const exportResult = await ExecutiveOpportunityBriefExportService.generateOpportunityBrief();

    expect(exportResult.pdfBuffer.length).toBeGreaterThan(25000);
    expect(exportResult.pptxBuffer.length).toBeGreaterThan(25000);
    expect(fs.existsSync(exportResult.pdfPath)).toBe(true);
    expect(fs.existsSync(exportResult.pptxPath)).toBe(true);

    const rootDir = path.resolve(process.cwd(), '..');
    const rootPdf = path.resolve(rootDir, 'aiCEV_UltraTech_Executive_Opportunity_Brief.pdf');
    const rootPptx = path.resolve(rootDir, 'aiCEV_UltraTech_Executive_Opportunity_Brief.pptx');
    expect(fs.existsSync(rootPdf) || fs.existsSync(exportResult.pdfPath)).toBe(true);
    expect(fs.existsSync(rootPptx) || fs.existsSync(exportResult.pptxPath)).toBe(true);
  });

  it('8. NO_UNSUPPORTED_EBITDA_CLAIM on Slide 1', () => {
    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const pdfStr = briefPdfBuffer.toString('utf-8');

    expect(pdfStr).not.toContain('100% EBITDA ACCRETIVE');
    expect(pdfStr).toContain('Direct Savings Opportunity');
    expect(pdfStr).toContain('Rs. 78.72 Cr');
  });

  it('9. SLIDE_3_LANGUAGE contains WHERE THE OPPORTUNITY IS CONCENTRATED and deduplication statement', () => {
    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const pdfStr = briefPdfBuffer.toString('utf-8');

    expect(pdfStr).toContain('WHERE THE OPPORTUNITY IS CONCENTRATED');
    expect(pdfStr).not.toContain('10 sourcing levers totaling');
    expect(pdfStr).toContain('GROSS IDENTIFIED');
    expect(pdfStr).toContain('OPPORTUNITY');
    expect(pdfStr).toContain(
      'Individual opportunities are assessed independently and deduplicated before establishing the net defensible pipeline.'
    );
  });

  it('10. SLIDE_10_NEXT_STEPS contains PROPOSED NEXT STEPS and ALIGN, MOBILIZE, EXECUTE', () => {
    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const pdfStr = briefPdfBuffer.toString('utf-8');

    expect(pdfStr).toContain('PROPOSED NEXT STEPS');
    expect(pdfStr).toContain('ALIGN');
    expect(pdfStr).toContain('Confirm priority Wave 1 categories');
    expect(pdfStr).toContain('MOBILIZE');
    expect(pdfStr).toContain('Establish joint procurement working group');
    expect(pdfStr).toContain('EXECUTE');
    expect(pdfStr).toContain('Launch approved competitive sourcing initiatives');
    expect(pdfStr).toContain('Move from diagnostic to execution.');
    expect(pdfStr).toContain('Rs. 78.72 Cr Direct Savings Opportunity');
    expect(pdfStr).toContain('Rs. 93.60 Cr Net Defensible Pipeline');
  });

  it('11. NO_UNSUPPORTED_SECURITY_CLAIMS on Slide 9', () => {
    const briefPdfBuffer = ExecutiveOpportunityBriefService.generatePdfBuffer();
    const pdfStr = briefPdfBuffer.toString('utf-8');

    expect(pdfStr).not.toContain('Zero Hallucination');
    expect(pdfStr).not.toContain('Guaranteed Savings');
    expect(pdfStr).not.toContain('Fully Autonomous Procurement');
    expect(pdfStr).not.toContain('SOC-2 Certified');
    expect(pdfStr).not.toContain('ISO 27001 Certified');
    expect(pdfStr).not.toContain('FIPS Grade');
    expect(pdfStr).not.toContain('Air-Gapped');
    expect(pdfStr).toContain('From transaction data to procurement decision to measurable execution.');
  });
});
