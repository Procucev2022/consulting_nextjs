import { describe, expect, it } from 'vitest';
import {
  containsMojibake,
  toAsciiSafePresentationString
} from '../../src/constants/executiveBriefLayoutConstants';
import { EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES } from '../../src/constants/executiveOpportunityBriefConstants';

describe('executive brief presentation constants', () => {
  it('detects mojibake and accepts clean presentation text', () => {
    expect(containsMojibake('Clean procurement summary')).toBe(false);
    expect(containsMojibake('Broken encoding â†’')).toBe(true);
  });

  it('converts special and mojibake characters to ASCII-safe text', () => {
    expect(toAsciiSafePresentationString('₹ → ✓')).toBe('Rs.  -> [OK]');
    expect(toAsciiSafePresentationString('â†')).toBe('->');
    expect(toAsciiSafePresentationString('âˆ')).toBe('-');
    expect(toAsciiSafePresentationString('')).toBe('');
  });

  it('formats an actionable email failure with its request correlation id', () => {
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.emailFailed('request-123')).toContain('request ID request-123');
  });

  it('formats document scope, export failure, tenant mismatch, and publish failure messages', () => {
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.documentScope('dataset.xlsx')).toContain('dataset.xlsx');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.exportFailed('pdf', 'req-456')).toContain('PDF could not be generated');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.tenantMismatch('T-REQ', 'T-ACT')).toContain('T-REQ');
    expect(EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.publishFailed('req-789')).toContain('req-789');
  });
});
