import { describe, it, expect } from 'vitest';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../src/constants/executiveBriefExportStrings';

describe('EXECUTIVE_BRIEF_EXPORT_STRINGS', () => {
  it('should define panel title and certified badge', () => {
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.panelTitle).toBe(
      'EXECUTIVE PROCUREMENT VALUE & SAVINGS BRIEF'
    );
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.certifiedBadge).toBe('Certified Report');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.readyBadge).toBe('CERTIFIED / READY');
  });

  it('should define download button labels and subtexts', () => {
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.buttons.downloadPdf).toBe('DOWNLOAD PDF');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.buttons.downloadPdfSub).toBe('Official Executive Report');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.buttons.downloadPptx).toBe('DOWNLOAD PPTX');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.buttons.downloadPptxSub).toBe('Editable Presentation');
  });

  it('should define checklist verification strings', () => {
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.checklists.dataValidated).toBe('Data validated ✓');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.checklists.financialReconciliation).toBe(
      'Financial reconciliation ✓'
    );
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.checklists.module1).toBe('Module 1 ✓');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.checklists.module4).toBe('Module 4 ✓');
  });

  it('should format dynamic metadata strings', () => {
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.metadata.lastGenerated('01-Oct-2026')).toBe(
      'Last generated: 01-Oct-2026'
    );
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.metadata.reportVersion('1.1')).toBe('Report Version: 1.1');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.errors.downloadFailed('pdf', 'Network error')).toBe(
      'Failed to export PDF: Network error'
    );
  });

  it('should define pipeline stages, format strings, and traceability', () => {
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.pipeline.module1Title).toBe('MODULE 1');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.formats.sectionTitle).toBe('REPORT FORMATS');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.traceability.findingId).toBe('Finding ID');
    expect(EXECUTIVE_BRIEF_EXPORT_STRINGS.regenerationModal.title).toBe('Confirm Report Regeneration');
  });
});
