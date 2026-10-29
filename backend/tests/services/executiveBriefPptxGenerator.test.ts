import { afterEach, describe, expect, it, vi } from 'vitest';
import PptxGenJS from 'pptxgenjs';
import { generateExecutiveBriefPptx } from '../../src/services/executiveBriefPptxGenerator';
import { addSlideFrame, bodyCell, fieldRuns, headerCell, tableBorder, addFooter } from '../../src/services/executiveBriefPptxHelpers';
import { PPTX_OUTPUT_ERROR, PPTX_THEME } from '../../src/constants/executiveBriefPptxConstants';
import type { ExecutiveBriefReportData } from '../../src/types/executiveBriefExportTypes';
import { certifiedReport } from '../executiveBriefTestHelpers';

const latin1 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');

const slidePartNames = (bytes: Uint8Array): string[] =>
  [...new Set(latin1(bytes).match(/ppt\/slides\/slide\d+\.xml/gu) ?? [])].sort();

describe('generateExecutiveBriefPptx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a zip (PK signature) with the ten-slide reduced deck', async () => {
    const bytes = await generateExecutiveBriefPptx(certifiedReport());
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(latin1(bytes).slice(0, 2)).toBe('PK');
    expect(slidePartNames(bytes)).toHaveLength(10);
    expect(slidePartNames(bytes)).toContain('ppt/slides/slide10.xml');
    expect(slidePartNames(bytes)).not.toContain('ppt/slides/slide11.xml');
  });

  it('still builds the evidence slide when section 08 is absent from the report', async () => {
    const report = certifiedReport();
    const withoutEvidence: ExecutiveBriefReportData = {
      ...report,
      sections: report.sections.filter((group) => group.groupId !== '08'),
      validationChecklist: { ...report.validationChecklist, module2Validated: false }
    };
    const bytes = await generateExecutiveBriefPptx(withoutEvidence);
    expect(latin1(bytes).slice(0, 2)).toBe('PK');
    expect(slidePartNames(bytes)).toHaveLength(10);
  });

  it('fails with a descriptive error when pptxgenjs does not return bytes', async () => {
    vi.spyOn(PptxGenJS.prototype, 'write').mockResolvedValueOnce('not-bytes');
    await expect(generateExecutiveBriefPptx(certifiedReport())).rejects.toThrow(PPTX_OUTPUT_ERROR);
  });
});

describe('PPTX slide helpers', () => {
  it('builds a framed slide with and without a subtitle and the standard footer', () => {
    const presentation = new PptxGenJS();
    const withSubtitle = addSlideFrame(presentation, {
      title: 'Frame',
      subtitle: 'Subtitle',
      clientName: 'Client',
      slideNumber: 1,
      totalSlides: 2
    });
    const withoutSubtitle = addSlideFrame(presentation, {
      title: 'Frame',
      clientName: 'Client',
      slideNumber: 2,
      totalSlides: 2
    });
    expect(withSubtitle).toBeDefined();
    expect(withoutSubtitle).toBeDefined();
    const slide = presentation.addSlide();
    addFooter(slide, 'Client', 3, 3);
    expect(presentation.slides?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('creates bold labels and table cells with the expected styling', () => {
    const runs = fieldRuns('Finding', 'Value text');
    expect(runs[0].text).toBe('Finding: ');
    expect(runs[1]).toMatchObject({ text: 'Value text', options: { breakLine: true } });
    expect(headerCell('Metric').options).toMatchObject({ bold: true });
    expect(bodyCell('Plain').options).toMatchObject({ color: PPTX_THEME.primaryText });
    expect(bodyCell('Flag', PPTX_THEME.fail).options).toMatchObject({ color: PPTX_THEME.fail });
    expect(tableBorder()).toMatchObject({ type: 'solid', pt: 0.5, color: PPTX_THEME.border });
  });
});
