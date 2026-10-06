import { describe, it, expect } from 'vitest';
import { sanitizeAndRecomputeFxUpdates } from '../../src/utils/validationRecordHelper';
import type { ValidationPreCheckRecord } from '../../src/types';

describe('validationRecordHelper', () => {
  const mockExisting: ValidationPreCheckRecord = {
    record_id: 'REC-001',
    buyer_id: 'BUYER-01',
    dataset_name: 'test.xlsx',
    source_file: 'test.xlsx',
    source_sheet: 'Sheet1',
    source_row: 2,
    raw_vendor: 'Test Vendor',
    raw_item: 'Test Item',
    raw_item_code: 'ITEM-01',
    raw_material_group: 'RAW',
    raw_amount: 1000,
    raw_currency: 'USD',
    amount: 1000,
    amount_inr: 83000,
    inr_crores: 0.0083,
    confidence_score: 0.95,
    issue_flag: 'Passed Clean',
    validation_status: 'Approved',
    pipeline_stage: 'Stage 1',
    stage_id: 'STAGE-1',
    transaction_date: '2026-05-15',
    account_code: 'ACC-01',
    cost_center: 'CC-01',
    legal_entity: 'ENTITY-01',
    updated_at: '2026-05-15T00:00:00.000Z'
  };

  it('should strip untrusted client FX parameters', () => {
    const updates: Record<string, unknown> = {
      notes: 'test note',
      fxRate: 99.99,
      fx_rate_applied: 99.99,
      inrNormalizedValue: 123456,
      amount_inr: 123456,
      fxSource: 'FAKE_SOURCE',
      fxMasterVersion: 'v99.0'
    };

    sanitizeAndRecomputeFxUpdates(updates);

    expect(updates.fxRate).toBeUndefined();
    expect(updates.fx_rate_applied).toBeUndefined();
    expect(updates.inrNormalizedValue).toBeUndefined();
    expect(updates.amount_inr).toBeUndefined();
    expect(updates.fxSource).toBeUndefined();
    expect(updates.fxMasterVersion).toBeUndefined();
    expect(updates.notes).toBe('test note');
  });

  it('should recalculate FX when currency, date, or amount are updated', () => {
    const updates: Record<string, unknown> = {
      raw_currency: 'USD',
      transaction_date: '2026-05-15',
      amount: 1000
    };

    sanitizeAndRecomputeFxUpdates(updates, mockExisting);

    expect(updates.fx_rate_applied).toBe(95.9255);
    expect(updates.amount_inr).toBe(95926); // Math.round(1000 * 95.9255)
    expect(updates.inr_crores).toBe(95926 / 10000000);
  });

  it('should use existing fallback values when partial updates are provided', () => {
    const updates: Record<string, unknown> = {
      amount: 2000
    };

    sanitizeAndRecomputeFxUpdates(updates, mockExisting);

    expect(updates.fx_rate_applied).toBe(95.9255);
    expect(updates.amount_inr).toBe(191851);
  });

  it('should handle unconvertible pending currency safely without modifying amount_inr', () => {
    const updates: Record<string, unknown> = {
      raw_currency: 'SAR',
      transaction_date: '2026-05-15',
      amount: 5000
    };

    sanitizeAndRecomputeFxUpdates(updates);

    expect(updates.fx_rate_applied).toBeUndefined();
    expect(updates.amount_inr).toBeUndefined();
  });

  it('should handle default fallbacks when existing is undefined', () => {
    const updates: Record<string, unknown> = {
      raw_currency: 'INR'
    };

    sanitizeAndRecomputeFxUpdates(updates, undefined);

    expect(updates.fx_rate_applied).toBe(1.0);
    expect(updates.amount_inr).toBe(0);
    expect(updates.inr_crores).toBe(0);
  });

  it('should handle transaction_date alone with undefined existing', () => {
    const updates: Record<string, unknown> = {
      transaction_date: '2026-05-15'
    };

    sanitizeAndRecomputeFxUpdates(updates, undefined);

    expect(updates.fx_rate_applied).toBe(1.0);
    expect(updates.amount_inr).toBe(0);
  });

  it('should no-op when neither currency, date, nor amount are provided', () => {
    const updates: Record<string, unknown> = {
      notes: 'just notes'
    };

    sanitizeAndRecomputeFxUpdates(updates, mockExisting);

    expect(updates.fx_rate_applied).toBeUndefined();
    expect(updates.amount_inr).toBeUndefined();
  });
});
