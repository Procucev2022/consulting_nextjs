import type { CloudflareD1MutationResult } from '../types/cloudflare';
import { D1_TENANT_DATA_CACHE_KEYS } from '../constants/db';
import { invalidateTenantD1Data } from '../services/d1TenantDataCache';
import type { D1GraphQLContext, MergeVendorArgs } from '../types/graphql';
import logger from '../utils/logger';

export const mergeVendorResolver = async (args: unknown, context: D1GraphQLContext): Promise<unknown> => {
  const input = (args as MergeVendorArgs).input;
  const tenantId = context.tenantId || '';
  const statements = [
    context.db.prepare(
      'UPDATE VendorYearDetail SET vendor_name = ? WHERE master_vendor_id = ? AND tenant_id = ?'
    ).bind(input.canonicalName, input.masterId, tenantId),
    context.db.prepare(
      'UPDATE VendorPriceRank SET vendor_name = ? WHERE master_id = ? AND tenant_id = ?'
    ).bind(input.canonicalName, input.masterId, tenantId)
  ];
  let results: CloudflareD1MutationResult[];
  try {
    results = context.db.batch
      ? await context.db.batch(statements) as CloudflareD1MutationResult[]
      : await Promise.all(statements.map(async (statement) => await statement.run() as CloudflareD1MutationResult));
  } finally {
    invalidateTenantD1Data(context.db, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_DETAILS);
    invalidateTenantD1Data(context.db, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_RANKINGS);
  }
  const affected = results.reduce((total, result) => total + Number(result.meta?.changes ?? result.changes ?? 0), 0);
  logger.info('Vendor master name updated through GraphQL', {
    requestId: context.requestId, tenantId, masterId: input.masterId, affected
  });
  return { success: true, affected };
};
