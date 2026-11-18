import type { D1GraphQLContext, MergeVendorArgs } from '../types/graphql';
import { D1_ROUTE_MESSAGES } from '../constants/d1';
import { API_ERROR_CODE, API_HTTP_STATUS } from '../constants/errors';
import { executeVendorMergeInD1 } from '../services/workerD1VendorMerge';
import { ClientFacingError } from '../utils/apiErrors';
import logger from '../utils/logger';

export const mergeVendorResolver = async (args: unknown, context: D1GraphQLContext): Promise<unknown> => {
  const input = (args as MergeVendorArgs).input;
  const tenantId = context.tenantId || '';
  const affected = await executeVendorMergeInD1(
    context.db, input.canonicalName, input.masterId, tenantId, context.requestId
  );
  if (affected === null) {
    throw new ClientFacingError(API_HTTP_STATUS.SERVICE_UNAVAILABLE, API_ERROR_CODE.DATABASE_UNAVAILABLE,
      D1_ROUTE_MESSAGES.vendorMergeBatchUnavailable);
  }
  if (affected === 0) {
    throw new ClientFacingError(API_HTTP_STATUS.NOT_FOUND, API_ERROR_CODE.RECORD_NOT_FOUND,
      D1_ROUTE_MESSAGES.supplierMasterNotFound(input.masterId));
  }
  logger.info('Vendor master name updated through GraphQL', {
    requestId: context.requestId, tenantId, masterId: input.masterId, affected
  });
  return { success: true, affected };
};
