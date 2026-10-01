import { describe, it, expect } from 'vitest';
import {
  sanitizeFilenamePart,
  getOfficialPdfFilename,
  getOfficialPptxFilename
} from '../../src/utils/filenameSanitizer';

describe('Filename Sanitizer', () => {
  it('EXPORT-13: should sanitize illegal characters from client names', () => {
    const unsanitized = 'ABC /\\:*?"<>| Ltd';
    const sanitized = sanitizeFilenamePart(unsanitized);
    expect(sanitized).toBe('ABC_Ltd');
  });

  it('EXPORT-13: should fallback to Client when empty after sanitization', () => {
    expect(sanitizeFilenamePart('')).toBe('Client');
    expect(sanitizeFilenamePart('///:::***')).toBe('Client');
  });

  it('EXPORT-13: should generate compliant official PDF filename', () => {
    const filename = getOfficialPdfFilename('Acme Corp / India', '2026-10-01');
    expect(filename).toBe('Procucev_Procurement_Value_Savings_Diagnostic_Acme_Corp_India_2026-10-01.pdf');
  });

  it('EXPORT-13: should generate compliant official PPTX filename', () => {
    const filename = getOfficialPptxFilename('Tata | Steel <Ltd>', '2026-10-01');
    expect(filename).toBe('Procucev_Procurement_Value_Savings_Diagnostic_Tata_Steel_Ltd_2026-10-01.pptx');
  });

  it('EXPORT-13: should default date to current ISO date if not provided', () => {
    const pdfFilename = getOfficialPdfFilename('ABC Ltd');
    expect(pdfFilename).toMatch(/^Procucev_Procurement_Value_Savings_Diagnostic_ABC_Ltd_\d{4}-\d{2}-\d{2}\.pdf$/);
    const pptxFilename = getOfficialPptxFilename('ABC Ltd');
    expect(pptxFilename).toMatch(/^Procucev_Procurement_Value_Savings_Diagnostic_ABC_Ltd_\d{4}-\d{2}-\d{2}\.pptx$/);
  });
});
