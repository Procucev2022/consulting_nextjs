import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { ExecutiveBriefPptxGenerator } from '../../src/services/executiveBriefPptxGenerator';

describe('Executive Brief PPTX Generator', () => {
  it('EXPORT-04 & EXPORT-06: should generate valid 30-slide PPTX presentation buffer', async () => {
    const clientName = 'UltraTech Cement Limited';
    const { pptx, slideCount } = await ExecutiveBriefPptxGenerator.createPresentation(clientName);

    expect(pptx).toBeDefined();
    expect(slideCount).toBe(30);

    const buffer = await ExecutiveBriefPptxGenerator.generateBuffer(clientName);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(10000);
  }, 20000);

  it('EXPORT-16: should pass programmatic structural and editability inspection', () => {
    const validInspection = ExecutiveBriefPptxGenerator.inspectPresentation(30, 45000);
    expect(validInspection.slideCount).toBe(30);
    expect(validInspection.hasBlankSlides).toBe(false);
    expect(validInspection.textObjectsEditable).toBe(true);
    expect(validInspection.tablesValid).toBe(true);
    expect(validInspection.shapesValid).toBe(true);
    expect(validInspection.isValid).toBe(true);

    const invalidInspection = ExecutiveBriefPptxGenerator.inspectPresentation(25, 45000);
    expect(invalidInspection.isValid).toBe(false);
    expect(invalidInspection.hasBlankSlides).toBe(true);

    const emptyInspection = ExecutiveBriefPptxGenerator.inspectPresentation(30, 100);
    expect(emptyInspection.isValid).toBe(false);
    expect(emptyInspection.hasMissingText).toBe(true);
  });

  it('should save PPTX file to disk', async () => {
    const tmpPath = path.resolve(process.cwd(), 'temp_test_brief.pptx');
    const savedPath = await ExecutiveBriefPptxGenerator.saveToFile(tmpPath, 'UltraTech Cement Limited');
    expect(savedPath).toBe(tmpPath);
    expect(fs.existsSync(tmpPath)).toBe(true);
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }, 20000);
});
