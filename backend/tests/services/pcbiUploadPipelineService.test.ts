import { describe, it, expect } from 'vitest';
import { pcbiUploadPipelineService } from '../../src/services/pcbiUploadPipelineService';

describe('PCBIUploadPipelineService (Phases 3, 4 & 5)', () => {
  it('should execute 12-stage extraction pipeline across supported formats', () => {
    const formats = ['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT'] as const;

    for (const format of formats) {
      const result = pcbiUploadPipelineService.executeUploadExtractionPipeline({
        fileName: `source_feed.${format.toLowerCase()}`,
        format
      });

      expect(result.upload.fileName).toContain(`source_feed.${format.toLowerCase()}`);
      expect(result.fileValidation.valid).toBe(true);
      expect(result.fileValidation.checksum).toBeTruthy();
      expect(result.dataExtraction.extractedRowsCount).toBe(156);
      expect(result.columnDetection.detectedColumns).toContain('Price');
      expect(result.dateDetection.detectedFormat).toBe('YYYY-MM-DD');
      expect(result.priceValueDetection.numericValidPct).toBe(100.0);
      expect(result.unitDetection.detectedUnit).toBe('KG');
      expect(result.currencyDetection.detectedCurrency).toBe('INR');
      expect(result.frequencyDetection.detectedFrequency).toBe('WEEKLY');
      expect(result.sourceIdentification.identifiedSource).toBeTruthy();
      expect(result.seriesIdentification.proposedSeriesId).toBeTruthy();
      expect(result.dataQualityCheck.qualityGrade).toBe('GRADE_A_PRIME');
      expect(result.standardizationPreview.length).toBeGreaterThan(0);
    }
  });

  it('should test 4 frequency normalization cases and block interpolation without approval', () => {
    const tests = pcbiUploadPipelineService.runFrequencyNormalizationTests();
    expect(tests).toHaveLength(4);

    // Case 1: Weekly source -> Target Weekly -> Pass
    const c1 = tests.find((t) => t.caseId === 'FREQ-CASE-01');
    expect(c1?.blocked).toBe(false);
    expect(c1?.methodologyStatus).toBe('APPROVED');

    // Case 2: Fortnightly -> Target Weekly -> Block
    const c2 = tests.find((t) => t.caseId === 'FREQ-CASE-02');
    expect(c2?.blocked).toBe(true);
    expect(c2?.methodologyStatus).toBe('METHODOLOGY_APPROVAL_REQUIRED');

    // Case 3: Monthly -> Target Weekly -> Block
    const c3 = tests.find((t) => t.caseId === 'FREQ-CASE-03');
    expect(c3?.blocked).toBe(true);
    expect(c3?.methodologyStatus).toBe('METHODOLOGY_APPROVAL_REQUIRED');

    // Case 4: Quarterly -> Target Monthly -> Block
    const c4 = tests.find((t) => t.caseId === 'FREQ-CASE-04');
    expect(c4?.blocked).toBe(true);
    expect(c4?.methodologyStatus).toBe('METHODOLOGY_APPROVAL_REQUIRED');
  });

  it('should generate standard PCBI preview with all 24 required fields', () => {
    const preview = pcbiUploadPipelineService.generateStandardPreview();
    expect(preview.length).toBe(4);

    for (const row of preview) {
      expect(row.pcbiId).toBeTruthy();
      expect(row.commodityId).toBeTruthy();
      expect(row.seriesId).toBeTruthy();
      expect(row.sourceName).toBeTruthy();
      expect(row.sourceUrl).toBeTruthy();
      expect(row.sourceDocument).toBeTruthy();
      expect(row.observationDate).toBeTruthy();
      expect(row.effectiveDate).toBeTruthy();
      expect(row.rawValue).toBeGreaterThan(0);
      expect(row.rawUnit).toBeTruthy();
      expect(row.rawCurrency).toBeTruthy();
      expect(row.standardValue).toBeGreaterThan(0);
      expect(row.standardUnit).toBeTruthy();
      expect(row.standardCurrency).toBeTruthy();
      expect(row.sourceFrequency).toBe('WEEKLY');
      expect(row.standardFrequency).toBe('WEEKLY');
      expect(row.transformationMethod).toBeTruthy();
      expect(row.transformationVersion).toBeTruthy();
      expect(row.dataGapFlag).toBe(false);
      expect(row.sourceStatus).toBe('UNDER_VALIDATION');
      expect(row.methodologyId).toBeTruthy();
      expect(row.ingestionBatchId).toBeTruthy();
      expect(row.checksum).toBeTruthy();
      expect(row.validationStatus).toBeTruthy();
    }
  });
});
