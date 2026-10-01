import { describe, it, expect } from 'vitest';
import {
  REPORT_EXPORT_VERSION,
  REPORT_ID_PREFIX,
  REPORT_FILENAME_PREFIX,
  EXPORT_STATUSES,
  EXPORT_VALIDATION_ERRORS,
  DEFAULT_EXPORT_HISTORY,
  EXPORT_CONFIDENTIALITY_PREFIX
} from '../../src/constants/executiveBriefExportConstants';

describe('Executive Brief Export Constants', () => {
  it('should define export version 1.1', () => {
    expect(REPORT_EXPORT_VERSION).toBe('1.1');
  });

  it('should define report prefixes and statuses', () => {
    expect(REPORT_ID_PREFIX).toBe('RPT-EXEC-');
    expect(REPORT_FILENAME_PREFIX).toBe('Procucev_Procurement_Value_Savings_Diagnostic_');
    expect(EXPORT_CONFIDENTIALITY_PREFIX).toContain('CONFIDENTIAL');
    expect(EXPORT_STATUSES.READY_FOR_DOWNLOAD).toBe('Ready for Download');
    expect(EXPORT_STATUSES.EXPORT_BLOCKED).toBe('Export Blocked');
  });

  it('should provide default export history', () => {
    expect(DEFAULT_EXPORT_HISTORY.length).toBeGreaterThan(0);
    expect(DEFAULT_EXPORT_HISTORY[0].reportVersion).toBe('1.0');
    expect(DEFAULT_EXPORT_HISTORY[0].reportId).toContain('RPT-EXEC-');
  });

  it('should define structured validation errors', () => {
    expect(EXPORT_VALIDATION_ERRORS.VARIANCE_DETECTED).toContain('Financial reconciliation failure');
    expect(EXPORT_VALIDATION_ERRORS.PPTX_SLIDE_MISMATCH).toContain('PowerPoint validation failure');
  });
});
