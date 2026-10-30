import { describe, expect, it } from 'vitest';
import { formatCrore, formatSummaryValue, formatWithThousands } from '../../src/services/executiveBriefFormatters';
import {
  buildExecutiveBriefStorageKey,
  buildOfficialExecutiveBriefFilename,
  sanitizeFilenamePart
} from '../../src/services/executiveBriefFilenames';
import { EXECUTIVE_BRIEF_STORAGE_PREFIX } from '../../src/constants/executiveBriefExportConstants';
import { INR_SYMBOL } from '../../src/constants/executiveBriefCertifiedFigureConstants';
import { TEST_REPORT_DATE } from '../executiveBriefTestHelpers';
import { DEFAULT_CLIENT_PROFILE } from '../../src/constants/executiveBriefConstants';

describe('executive brief number formatting', () => {
  it('formats crore values with the rupee symbol and two decimals', () => {
    expect(formatCrore(59203477681.66)).toBe(`${INR_SYMBOL}5920.35 Cr`);
    expect(formatCrore(936000000)).toBe(`${INR_SYMBOL}93.60 Cr`);
  });

  it('groups thousands and appends units to counts', () => {
    expect(formatWithThousands(31671)).toBe('31,671');
    expect(formatWithThousands(974)).toBe('974');
    expect(formatWithThousands(1234567)).toBe('1,234,567');
    expect(formatSummaryValue(31671, 'Invoices')).toBe('31,671 Invoices');
    expect(formatSummaryValue(59203477681.66)).toBe(`${INR_SYMBOL}5920.35 Cr`);
  });
});

describe('executive brief filenames', () => {
  it('sanitizes download name parts and falls back when nothing usable remains', () => {
    expect(sanitizeFilenamePart('UltraTech Cement / Limited?')).toBe('UltraTech_Cement_Limited');
    expect(sanitizeFilenamePart('')).toBe('Client');
    expect(sanitizeFilenamePart('///')).toBe('Client');
  });

  it('builds the official dated download name', () => {
    expect(buildOfficialExecutiveBriefFilename(DEFAULT_CLIENT_PROFILE.clientName, 'pdf', TEST_REPORT_DATE)).toBe(
      'Procucev_Procurement_Value_Savings_Diagnostic_UltraTech_Cement_Limited_2026-10-24.pdf'
    );
  });

  it('builds storage keys that cannot escape the executive-brief prefix', () => {
    expect(buildExecutiveBriefStorageKey(DEFAULT_CLIENT_PROFILE.clientName, 'EXECUTIVE_BRIEF.pdf')).toBe(
      `${EXECUTIVE_BRIEF_STORAGE_PREFIX}/UltraTech_Cement_Limited/EXECUTIVE_BRIEF.pdf`
    );
    expect(buildExecutiveBriefStorageKey('../../etc', 'x.pdf')).toBe(`${EXECUTIVE_BRIEF_STORAGE_PREFIX}/etc/x.pdf`);
    expect(buildExecutiveBriefStorageKey('!!!', 'a.pdf')).toBe(`${EXECUTIVE_BRIEF_STORAGE_PREFIX}/Client/a.pdf`);
  });
});
