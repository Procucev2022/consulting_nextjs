/**
 * GraphQL Root Resolvers (Backend)
 * 
 * Centralized resolvers for executing GraphQL queries and mutations against the
 * optimized DatabaseStore with integrated caching and performance auditing.
 */

import { db } from '../services/db';
import { queryAuditor } from '../utils/queryAuditor';
import logger from '../utils/logger';
import type {
  CategoryDetailsArgs,
  UpdateTenantArgs,
  IngestionInputArgs,
  ValidationRecordArgs,
  MergeVendorArgs,
  DeployOpportunityArgs,
  GraphQLContext,
  RawDocumentIngestion,
  ValidationPreCheckRecord
} from '../types';

export const rootResolvers = {
  // Queries
  tenant: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: tenant', { requestId: context?.requestId });
    return db.getTenant();
  },

  ingestionQueue: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: ingestionQueue', { requestId: context?.requestId });
    return db.getIngestionQueue();
  },

  validationRecords: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: validationRecords', { requestId: context?.requestId });
    return db.getValidationRecords();
  },

  categories: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: categories', { requestId: context?.requestId });
    return db.getCategories();
  },

  categoryDetails: async (args: CategoryDetailsArgs, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: categoryDetails', { id: args?.id, requestId: context?.requestId });
    if (args?.id) {
      const single = db.getCategoryById(args.id);
      return single ? [single] : [];
    }
    return db.getCategoryDetails();
  },

  vendorDetails: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: vendorDetails', { requestId: context?.requestId });
    return db.getVendorDetails();
  },

  vendorRankings: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: vendorRankings', { requestId: context?.requestId });
    return db.getVendorRankings();
  },

  lineItems: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: lineItems', { requestId: context?.requestId });
    return db.getLineItems();
  },

  opportunities: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: opportunities', { requestId: context?.requestId });
    return db.getOpportunities();
  },

  funnelStages: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: funnelStages', { requestId: context?.requestId });
    return db.getFunnelStages();
  },

  queryMetrics: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: queryMetrics', { requestId: context?.requestId });
    return queryAuditor.getQueryMetrics();
  },

  dashboardOverview: async (_args: unknown, context?: GraphQLContext) => {
    logger.debug('Executing GraphQL query: dashboardOverview (single round-trip batch)', { requestId: context?.requestId });
    const [
      tenant,
      categories,
      opportunities,
      funnelStages,
      ingestionQueue,
      validationRecords,
      queryMetrics
    ] = await Promise.all([
      db.getTenant(),
      db.getCategories(),
      db.getOpportunities(),
      db.getFunnelStages(),
      db.getIngestionQueue(),
      db.getValidationRecords(),
      queryAuditor.getQueryMetrics()
    ]);

    return {
      tenant,
      categories,
      opportunities,
      funnelStages,
      ingestionQueue,
      validationRecords,
      queryMetrics
    };
  },

  // Mutations
  updateTenant: async (args: UpdateTenantArgs, context?: GraphQLContext) => {
    logger.info('Executing GraphQL mutation: updateTenant', {
      requestId: context?.requestId,
      updates: args.input
    });
    return db.updateTenant(args.input);
  },

  addIngestionItem: async (args: IngestionInputArgs, context?: GraphQLContext) => {
    logger.info('Executing GraphQL mutation: addIngestionItem', {
      requestId: context?.requestId,
      fileName: args.input.file_name
    });
    const newItem = {
      doc_id: `DOC-${Date.now()}`,
      tenant_id: 'tenant_default',
      file_name: args.input.file_name,
      file_type: args.input.file_type as RawDocumentIngestion['file_type'],
      file_size_mb: args.input.file_size_mb,
      records_count: args.input.records_count || 0,
      ocr_status: 'Completed' as const,
      progress: 100,
      uploaded_at: new Date().toISOString()
    };
    db.addIngestionItem(newItem);
    return newItem;
  },

  updateValidationRecord: async (args: ValidationRecordArgs, context?: GraphQLContext) => {
    logger.info('Executing GraphQL mutation: updateValidationRecord', {
      requestId: context?.requestId,
      recordId: args.input.record_id
    });
    return db.updateValidationRecord(args.input.record_id, args.input as unknown as Partial<ValidationPreCheckRecord>);
  },

  mergeVendor: async (args: MergeVendorArgs, context?: GraphQLContext) => {
    logger.info('Executing GraphQL mutation: mergeVendor', {
      requestId: context?.requestId,
      targetName: args.input.targetName,
      masterId: args.input.masterId
    });
    return db.mergeVendor(args.input.targetName, args.input.masterId, args.input.canonicalName);
  },

  deployOpportunity: async (args: DeployOpportunityArgs, context?: GraphQLContext) => {
    logger.info('Executing GraphQL mutation: deployOpportunity', {
      requestId: context?.requestId,
      oppId: args.id,
      targetModule: args.targetModule
    });
    return db.deployOpportunity(args.id, args.targetModule);
  }
};
