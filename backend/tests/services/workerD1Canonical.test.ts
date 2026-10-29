import { describe, expect, it, vi } from 'vitest';
import { loadCanonicalAssessmentFromD1 } from '../../src/services/workerD1Canonical';
import { D1_ROUTE_MESSAGES } from '../../src/constants/d1';
import type { CloudflareD1Database } from '../../src/types/cloudflare';
import type { D1Record } from '../../src/types/d1';

vi.mock('../../src/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const db = (rows: D1Record[]): CloudflareD1Database => ({ prepare: vi.fn().mockReturnValue({
  bind: vi.fn().mockReturnThis(), all: vi.fn().mockResolvedValue({ results: rows })
}) });

describe('assessment-scoped canonical D1 data', () => {
  it('returns derived persisted data without reading another assessment or filesystem', async () => {
    const canonical = { validFxNormalizedSpendCr: 4073.83, sourceRowCount: 200 };
    const database = db([{ entry_type: 'canonical_module1', payload_json: JSON.stringify(canonical) }]);
    expect(await loadCanonicalAssessmentFromD1(database, 'AIC-2026-0001')).toEqual(canonical);
    expect(database.prepare('').bind).toHaveBeenCalledWith('AIC-2026-0001');
    expect(database.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE assessment_id = ?'));
  });

  it('loads canonical data from an assessment snapshot', async () => {
    const canonical = { assessmentId: 'AIC-2026-0002', validRowCount: 23570 };
    expect(await loadCanonicalAssessmentFromD1(db([
      { entry_type: 'assessment', payload_json: JSON.stringify({ canonicalModule1: canonical }) }
    ]), 'AIC-2026-0002')).toEqual(canonical);
  });

  it('skips superseded runs and missing datasets, then reads the active run snapshot', async () => {
    const canonical = { sourceRowCount: 19670 };
    expect(await loadCanonicalAssessmentFromD1(db([
      { entry_type: 'assessment', payload_json: '{}' },
      { entry_type: 'run', payload_json: JSON.stringify({ isSuperseded: true, canonicalModule1: { old: true } }) },
      { entry_type: 'run', payload_json: JSON.stringify({ isSuperseded: false, canonicalModule1: canonical }) }
    ]), 'AIC-2026-0003')).toEqual(canonical);
  });

  it('fails explicitly for missing data and corrupted JSON', async () => {
    await expect(loadCanonicalAssessmentFromD1(db([]), 'missing'))
      .rejects.toThrow(D1_ROUTE_MESSAGES.missingCanonical('missing'));
    await expect(loadCanonicalAssessmentFromD1(db([{ payload_json: '{broken' }]), 'missing')).rejects.toThrow();
  });
});
