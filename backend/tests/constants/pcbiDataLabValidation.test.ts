import { describe, expect, it } from 'vitest';
import { assignPcbiResearchSchema } from '../../src/constants/pcbiDataLabValidation';

describe('PCBI research assignment validation', () => {
  it('accepts trimmed researcher assignments and explicit unassignment', () => {
    expect(assignPcbiResearchSchema.parse({ pcbiId: ' PCBI-001 ', assignee: ' researcher@example.test ' }))
      .toEqual({ pcbiId: 'PCBI-001', assignee: 'researcher@example.test' });
    expect(assignPcbiResearchSchema.parse({ pcbiId: 'PCBI-001', assignee: null }))
      .toEqual({ pcbiId: 'PCBI-001', assignee: null });
  });

  it('rejects missing identifiers, blank researchers, and oversized values', () => {
    expect(assignPcbiResearchSchema.safeParse({ pcbiId: '', assignee: 'researcher' }).success).toBe(false);
    expect(assignPcbiResearchSchema.safeParse({ pcbiId: 'PCBI-001', assignee: ' ' }).success).toBe(false);
    expect(assignPcbiResearchSchema.safeParse({ pcbiId: 'x'.repeat(121), assignee: 'researcher' }).success).toBe(false);
    expect(assignPcbiResearchSchema.safeParse({ pcbiId: 'PCBI-001', assignee: 'x'.repeat(201) }).success).toBe(false);
  });
});
