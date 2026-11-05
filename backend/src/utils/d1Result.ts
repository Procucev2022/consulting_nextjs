import type { CloudflareD1MutationResult } from '../types/cloudflare';

export const d1ChangedRows = (result: unknown): number | null => {
  if (!result || typeof result !== 'object') return null;
  const mutation = result as CloudflareD1MutationResult;
  const changes = mutation.meta?.changes ?? mutation.changes;
  if (typeof changes === 'bigint') {
    const normalized = Number(changes);
    return Number.isSafeInteger(normalized) ? normalized : null;
  }
  return typeof changes === 'number' && Number.isFinite(changes) ? changes : null;
};
