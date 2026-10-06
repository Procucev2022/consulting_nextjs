import { fxReferenceService } from '../services/fxReferenceService';
import type { ValidationPreCheckRecord } from '../types';

export const sanitizeAndRecomputeFxUpdates = (
  updates: Record<string, unknown>,
  existing?: ValidationPreCheckRecord
): void => {
  delete updates.fxRate;
  delete updates.fx_rate_applied;
  delete updates.inrNormalizedValue;
  delete updates.amount_inr;
  delete updates.fxSource;
  delete updates.fxMasterVersion;

  const hasCurrency = typeof updates.raw_currency === 'string';
  const hasDate = typeof updates.transaction_date === 'string';
  const hasAmount = updates.amount !== undefined;

  if (hasCurrency || hasDate || hasAmount) {
    const curr = (updates.raw_currency as string) || existing?.raw_currency || 'INR';
    const date = (updates.transaction_date as string) || existing?.transaction_date || '2024-04-01';
    const amt = typeof updates.amount === 'number' ? updates.amount : (existing?.amount || 0);
    const fxRes = fxReferenceService.resolveFxRate(curr, date);
    if (fxRes.status === 'CONVERTED' && fxRes.rate !== null) {
      updates.fx_rate_applied = fxRes.rate;
      const amtInr = Math.round(amt * fxRes.rate);
      updates.amount_inr = amtInr;
      updates.inr_crores = amtInr / 10000000;
    }
  }
};
