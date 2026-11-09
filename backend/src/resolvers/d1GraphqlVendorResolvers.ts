import type { D1GraphQLContext, MergeVendorArgs } from '../types/graphql';
import { D1_ROUTE_MESSAGES } from '../constants/d1';
import { executeVendorMergeInD1 } from '../services/workerD1VendorMerge';
import logger from '../utils/logger';

export const mergeVendorResolver = async (args: unknown, context: D1GraphQLContext): Promise<unknown> => {
  const input = (args as MergeVendorArgs).input;
  const tenantId = context.tenantId || '';
  const affected = await executeVendorMergeInD1(
    context.db, input.canonicalName, input.masterId, tenantId, context.requestId
  );
  if (affected === null) throw new Error(D1_ROUTE_MESSAGES.vendorMergeBatchUnavailable);
  logger.info('Vendor master name updated through GraphQL', {
    requestId: context.requestId, tenantId, masterId: input.masterId, affected
  });
  return { success: true, affected };
};
