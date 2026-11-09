import { D1_LOG_ACTIONS, D1_LOG_FALLBACKS, D1_LOG_MESSAGES, D1_ROUTE_MESSAGES } from '../constants/d1';
import type { CloudflareD1Database, CloudflareD1MutationResult } from '../types/cloudflare';
import { D1_TENANT_DATA_CACHE_KEYS } from '../constants/db';
import { invalidateTenantD1Data } from './d1TenantDataCache';
import logger from '../utils/logger';

export const executeVendorMergeInD1 = async (
  database: CloudflareD1Database,
  canonicalName: string,
  masterId: string,
  tenantId: string,
  requestId?: string
): Promise<number | null> => {
  const statements = [
    database.prepare('UPDATE VendorYearDetail SET vendor_name = ? WHERE master_vendor_id = ? AND tenant_id = ?')
      .bind(canonicalName, masterId, tenantId),
    database.prepare('UPDATE VendorPriceRank SET vendor_name = ? WHERE master_id = ? AND tenant_id = ?')
      .bind(canonicalName, masterId, tenantId)
  ];
  if (!database.batch) {
    logger.error(D1_LOG_MESSAGES.vendorMergeBatchUnavailable, {
      action: D1_LOG_ACTIONS.vendorMergeBatchUnavailable,
      requestId,
      tenantId,
      statementCount: statements.length,
      writesStarted: false,
      fallback: D1_LOG_FALLBACKS.failClosed
    }, new Error(D1_ROUTE_MESSAGES.vendorMergeBatchUnavailable));
    return null;
  }

  const results = await database.batch(statements) as CloudflareD1MutationResult[];
  invalidateTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_DETAILS);
  invalidateTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_RANKINGS);
  return results.reduce((total, result) => total + Number(result.meta?.changes ?? result.changes ?? 0), 0);
};
