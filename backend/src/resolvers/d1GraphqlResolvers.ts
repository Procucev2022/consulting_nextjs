import type { CloudflareD1Database, CloudflareD1MutationResult } from '../types/cloudflare';
import { AUTH_MESSAGES, AUTH_ROLES } from '../constants/auth';
import {
  D1_GRAPHQL_CURSOR_VERSION,
  D1_GRAPHQL_PAGE_OVERFETCH_ROWS,
  D1_ROUTE_MESSAGES
} from '../constants/d1';
import { GRAPHQL_ERRORS, GRAPHQL_LOG_MESSAGES } from '../constants/graphql';
import { graphqlIngestionPageArgsSchema, tenantUpdateSchema } from '../constants/validation';
import { getD1RuntimeMetrics } from '../services/d1QueryTelemetry';
import { decodeGraphQLIngestionCursor, encodeGraphQLIngestionCursor } from '../services/graphqlIngestionCursor';
import logger from '../utils/logger';
import type {
  CategoryDetailsArgs,
  DeployOpportunityArgs,
  GraphQLIngestionPageRequest,
  GraphQLContext,
  IngestionInputArgs,
  MergeVendorArgs,
  UpdateTenantArgs,
  ValidationRecordArgs
} from '../types/graphql';
import type { TenantUpdateInput } from '../types/validation';

interface D1GraphQLContext extends GraphQLContext {
  db: CloudflareD1Database;
}

type D1Row = Record<string, unknown>;

type D1Resolver = (args: unknown, context: D1GraphQLContext) => Promise<unknown>;

const queryAll = async (db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<D1Row[]> => {
  const statement = db.prepare(sql);
  const bound = statement.bind(...values);
  const result = await bound.all<D1Row>();
  return result.results || [];
};

const queryFirst = async (db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<D1Row | null> => {
  const statement = db.prepare(sql);
  const bound = statement.bind(...values);
  return bound.first<D1Row>();
};

const normalizeIngestion = (row: D1Row): D1Row => ({
  ...row,
  detected_currencies: typeof row.detected_currencies === 'string' ? JSON.parse(row.detected_currencies) : row.detected_currencies
});

const parseIngestionPageRequest = (
  args: unknown,
  context: D1GraphQLContext,
  resolverName: string
): GraphQLIngestionPageRequest => {
  const parsed = graphqlIngestionPageArgsSchema.safeParse(args ?? {});
  if (!parsed.success) {
    logger.warn(GRAPHQL_LOG_MESSAGES.invalidPagination, {
      requestId: context.requestId,
      tenantId: context.tenantId,
      resolver: resolverName,
      issues: parsed.error.issues.map(({ code, path, message }) => ({ code, path, message }))
    });
    throw new Error(GRAPHQL_ERRORS.INVALID_INGESTION_PAGE_ARGS);
  }
  if (!parsed.data.after) return { first: parsed.data.first };
  try {
    const cursor = decodeGraphQLIngestionCursor(parsed.data.after);
    if (cursor.kind !== resolverName || cursor.tenantId !== context.tenantId) {
      throw new Error(GRAPHQL_ERRORS.INVALID_INGESTION_CURSOR);
    }
    return { first: parsed.data.first, cursor };
  } catch (error) {
    logger.warn(GRAPHQL_LOG_MESSAGES.invalidPagination, {
      requestId: context.requestId,
      tenantId: context.tenantId,
      resolver: resolverName,
      cursorLength: parsed.data.after.length
    }, error);
    throw error;
  }
};

const assertTenantAdministrator = (context: D1GraphQLContext): void => {
  if (context.role === AUTH_ROLES.ADMIN) return;
  logger.warn('Rejected GraphQL tenant update by a non-administrator', {
    requestId: context.requestId, tenantId: context.tenantId, userId: context.userId, role: context.role
  });
  throw new Error(AUTH_MESSAGES.FORBIDDEN_ADMIN_ONLY);
};

const requireTenantIdentifier = (context: D1GraphQLContext): string => {
  if (!context.tenantId) throw new Error('D1 request context does not contain a tenant identifier');
  return context.tenantId;
};

const parseTenantUpdate = (input: unknown, context: D1GraphQLContext): TenantUpdateInput => {
  const validation = tenantUpdateSchema.safeParse(input);
  if (!validation.success) {
    logger.warn(D1_ROUTE_MESSAGES.validationFailed, {
      requestId: context.requestId,
      tenantId: context.tenantId,
      userId: context.userId,
      operation: 'graphql-tenant-update',
      errors: validation.error.issues
    });
    throw new Error(D1_ROUTE_MESSAGES.validationFailed);
  }
  return validation.data;
};

const tenantResolver: D1Resolver = async (_args, context) => context.tenantId
  ? queryFirst(context.db, 'SELECT * FROM TenantMaster WHERE tenant_id = ?', [context.tenantId])
  : null;
const ingestionResolver: D1Resolver = async (args, context) => {
  const page = parseIngestionPageRequest(args, context, 'ingestionQueue');
  const cursorSql = page.cursor ? ' AND (uploaded_at < ? OR (uploaded_at = ? AND doc_id < ?))' : '';
  const cursorValues = page.cursor ? [page.cursor.timestamp, page.cursor.timestamp, page.cursor.id] : [];
  const rows = await queryAll(context.db,
    'SELECT * FROM RawDocumentIngestion WHERE tenant_id = ?' + cursorSql +
      ' ORDER BY uploaded_at DESC, doc_id DESC LIMIT ?',
    [context.tenantId || '', ...cursorValues, page.first + D1_GRAPHQL_PAGE_OVERFETCH_ROWS]);
  const hasNextPage = rows.length > page.first;
  const items = rows.slice(0, page.first).map(normalizeIngestion);
  const lastItem = items.at(-1);
  return {
    items,
    pageInfo: {
      hasNextPage,
      endCursor: lastItem ? encodeGraphQLIngestionCursor({
        version: D1_GRAPHQL_CURSOR_VERSION,
        kind: 'ingestionQueue',
        tenantId: context.tenantId || '',
        timestamp: String(lastItem.uploaded_at),
        id: String(lastItem.doc_id)
      }) : null
    }
  };
};
const validationResolver: D1Resolver = async (args, context) => {
  const page = parseIngestionPageRequest(args, context, 'validationRecords');
  const cursorSql = page.cursor ? ' AND (created_at < ? OR (created_at = ? AND record_id < ?))' : '';
  const cursorValues = page.cursor ? [page.cursor.timestamp, page.cursor.timestamp, page.cursor.id] : [];
  const rows = await queryAll(context.db,
    'SELECT * FROM ValidationPreCheckRecord WHERE tenant_id = ?' + cursorSql +
      ' ORDER BY created_at DESC, record_id DESC LIMIT ?',
    [context.tenantId || '', ...cursorValues, page.first + D1_GRAPHQL_PAGE_OVERFETCH_ROWS]);
  const hasNextPage = rows.length > page.first;
  const items = rows.slice(0, page.first);
  const lastItem = items.at(-1);
  return {
    items,
    pageInfo: {
      hasNextPage,
      endCursor: lastItem ? encodeGraphQLIngestionCursor({
        version: D1_GRAPHQL_CURSOR_VERSION,
        kind: 'validationRecords',
        tenantId: context.tenantId || '',
        timestamp: String(lastItem.created_at),
        id: String(lastItem.record_id)
      }) : null
    }
  };
};
const categoryResolver: D1Resolver = async (_args, context) => queryAll(context.db,
  'SELECT * FROM SpendCategorySummary WHERE tenant_id = ? ORDER BY spend_inr_crores DESC', [context.tenantId || '']);
const categoryDetailsResolver: D1Resolver = async (args, context) => {
  const categoryArgs = args as CategoryDetailsArgs;
  if (categoryArgs.id) return queryAll(context.db, 'SELECT * FROM CategoryYearDetail WHERE id = ? AND tenant_id = ?', [categoryArgs.id, context.tenantId || '']);
  return queryAll(context.db, 'SELECT * FROM CategoryYearDetail WHERE tenant_id = ? ORDER BY rank ASC', [context.tenantId || '']);
};
const vendorDetailsResolver: D1Resolver = async (_args, context) => queryAll(context.db,
  'SELECT * FROM VendorYearDetail WHERE tenant_id = ? ORDER BY total_3yr_spend_inr_cr DESC', [context.tenantId || '']);
const vendorRankingsResolver: D1Resolver = async (_args, context) => queryAll(context.db,
  'SELECT * FROM VendorPriceRank WHERE tenant_id = ? ORDER BY total_spend_inr_cr DESC', [context.tenantId || '']);
const lineItemsResolver: D1Resolver = async (_args, context) => queryAll(context.db,
  'SELECT * FROM LineItemMapping WHERE tenant_id = ? ORDER BY mapping_id ASC', [context.tenantId || '']);
const opportunitiesResolver: D1Resolver = async (_args, context) => queryAll(context.db,
  'SELECT opportunity.* FROM SavingsOpportunity AS opportunity ' +
  'INNER JOIN SavingsOpportunityTenantScope AS scope ON scope.opp_id = opportunity.opp_id ' +
  'WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC', [context.tenantId || '']);
const funnelResolver: D1Resolver = async (_args, context) =>
  queryAll(context.db, 'SELECT * FROM ConversionFunnelPhase WHERE tenant_id = ? ORDER BY phase_num ASC', [context.tenantId || '']);
const metricsResolver: D1Resolver = async (_args, context) => {
  if (context.role !== AUTH_ROLES.ADMIN) {
    logger.warn('Rejected GraphQL query metrics access by a non-administrator', {
      requestId: context.requestId,
      tenantId: context.tenantId,
      userId: context.userId,
      role: context.role
    });
    throw new Error(AUTH_MESSAGES.FORBIDDEN_ADMIN_ONLY);
  }
  const metrics = getD1RuntimeMetrics(context.db);
  return {
    totalQueries: metrics.totalQueries,
    slowQueries: metrics.slowQueries,
    cacheHitRatio: metrics.cacheHitRatio,
    averageDurationMs: metrics.averageDurationMs,
    recentAudits: metrics.recentAudits.map(({ rowsAffected, ...audit }) => ({
      ...audit,
      rowCount: rowsAffected
    }))
  };
};

const dashboardResolver: D1Resolver = async (_args, context) => {
  const [tenant, categories, opportunities, funnelStages, ingestionQueue, validationRecords, queryMetrics] =
    await Promise.all([
      tenantResolver({}, context),
      categoryResolver({}, context),
      opportunitiesResolver({}, context),
      funnelResolver({}, context),
      ingestionResolver({}, context),
      validationResolver({}, context),
      context.role === AUTH_ROLES.ADMIN ? metricsResolver({}, context) : Promise.resolve(null)
    ]);
  return { tenant, categories, opportunities, funnelStages, ingestionQueue, validationRecords, queryMetrics };
};

const updateTenantResolver: D1Resolver = async (args, context) => {
  assertTenantAdministrator(context);
  const input = (args as UpdateTenantArgs).input;
  const tenantId = requireTenantIdentifier(context);
  const updates = parseTenantUpdate(input, context);
  const updateSql = 'UPDATE TenantMaster SET ' +
    'enterprise_name = COALESCE(?, enterprise_name), ' +
    'region = COALESCE(?, region), ' +
    'base_currency = COALESCE(?, base_currency), ' +
    'total_spend_evaluated = COALESCE(?, total_spend_evaluated), ' +
    'total_spend_evaluated_inr = COALESCE(?, total_spend_evaluated_inr), ' +
    'status = COALESCE(?, status), ' +
    'major_sector = COALESCE(?, major_sector), ' +
    'minor_sector = COALESCE(?, minor_sector), ' +
    'updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ?';
  const result = await context.db.prepare(updateSql).bind(
    updates.enterprise_name ?? null,
    updates.region ?? null,
    updates.base_currency ?? null,
    updates.total_spend_evaluated ?? null,
    updates.total_spend_evaluated_inr ?? null,
    updates.status ?? null,
    updates.major_sector ?? null,
    updates.minor_sector ?? null,
    tenantId
  ).run() as CloudflareD1MutationResult;
  const affectedRows = result.meta?.changes ?? result.changes;
  if (affectedRows !== undefined && Number(affectedRows) === 0) {
    throw new Error(D1_ROUTE_MESSAGES.tenantUnavailable(tenantId));
  }
  return tenantResolver({}, context);
};

const addIngestionResolver: D1Resolver = async (args, context) => {
  const input = (args as IngestionInputArgs).input;
  const tenantId = context.tenantId;
  if (!tenantId) throw new Error('D1 request context does not contain a tenant identifier');
  const id = `DOC-${crypto.randomUUID()}`;
  await context.db.prepare(
    'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, tenantId, input.file_name, input.file_type, input.file_size_mb, 'Completed', 100, input.records_count || 0
  ).run();
  return queryFirst(context.db, 'SELECT * FROM RawDocumentIngestion WHERE doc_id = ? AND tenant_id = ?', [id, tenantId]);
};

const updateValidationResolver: D1Resolver = async (args, context) => {
  const input = (args as ValidationRecordArgs).input;
  const resolvedValue = input.resolved === undefined ? null : (input.resolved ? 1 : 0);
  await context.db.prepare(
    'UPDATE ValidationPreCheckRecord SET issue_flag = COALESCE(?, issue_flag), ' +
    'action_status = COALESCE(?, action_status), resolved = COALESCE(?, resolved) WHERE record_id = ? AND tenant_id = ?'
  ).bind(input.issue_flag ?? null, input.action_status ?? null, resolvedValue, input.record_id, context.tenantId || '').run();
  return queryFirst(context.db, 'SELECT * FROM ValidationPreCheckRecord WHERE record_id = ? AND tenant_id = ?',
    [input.record_id, context.tenantId || '']);
};

const mergeVendorResolver: D1Resolver = async (args, context) => {
  const input = (args as MergeVendorArgs).input;
  const result = await context.db.prepare(
    'UPDATE VendorYearDetail SET vendor_name = ? WHERE master_vendor_id = ? AND tenant_id = ?'
  ).bind(input.canonicalName, input.masterId, context.tenantId || '').run() as { meta?: { changes?: number } };
  return { success: true, affected: result.meta?.changes || 0 };
};

const deployOpportunityResolver: D1Resolver = async (args, context) => {
  const input = args as DeployOpportunityArgs;
  await context.db.prepare('UPDATE SavingsOpportunity SET recommended_module = ?, status = ? ' +
    'WHERE opp_id = ? AND EXISTS (SELECT 1 FROM SavingsOpportunityTenantScope AS scope ' +
    'WHERE scope.opp_id = SavingsOpportunity.opp_id AND scope.tenant_id = ?)')
    .bind(input.targetModule, 'DEPLOYED', input.id, context.tenantId || '').run();
  return queryFirst(context.db,
    'SELECT opportunity.* FROM SavingsOpportunity AS opportunity ' +
    'INNER JOIN SavingsOpportunityTenantScope AS scope ON scope.opp_id = opportunity.opp_id ' +
    'WHERE opportunity.opp_id = ? AND scope.tenant_id = ?', [input.id, context.tenantId || '']);
};

export const createD1GraphqlResolvers = (): Record<string, D1Resolver> => ({
  tenant: tenantResolver,
  ingestionQueue: ingestionResolver,
  validationRecords: validationResolver,
  categories: categoryResolver,
  categoryDetails: categoryDetailsResolver,
  vendorDetails: vendorDetailsResolver,
  vendorRankings: vendorRankingsResolver,
  lineItems: lineItemsResolver,
  opportunities: opportunitiesResolver,
  funnelStages: funnelResolver,
  queryMetrics: metricsResolver,
  dashboardOverview: dashboardResolver,
  updateTenant: updateTenantResolver,
  addIngestionItem: addIngestionResolver,
  updateValidationRecord: updateValidationResolver,
  mergeVendor: mergeVendorResolver,
  deployOpportunity: deployOpportunityResolver
});
