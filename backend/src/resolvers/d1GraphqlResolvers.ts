import type { CloudflareD1Database } from '../types/cloudflare';
import type {
  CategoryDetailsArgs,
  DeployOpportunityArgs,
  GraphQLContext,
  IngestionInputArgs,
  MergeVendorArgs,
  UpdateTenantArgs,
  ValidationRecordArgs
} from '../types/graphql';

interface D1GraphQLContext extends GraphQLContext {
  db: CloudflareD1Database;
}

type D1Row = Record<string, unknown>;

type D1Resolver = (args: unknown, context: D1GraphQLContext) => Promise<unknown>;

const queryAll = async (db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<D1Row[]> => {
  const statement = db.prepare(sql);
  const bound = values.length > 0 ? statement.bind(...values) : statement;
  const result = await bound.all<D1Row>();
  return result.results || [];
};

const queryFirst = async (db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<D1Row | null> => {
  const statement = db.prepare(sql);
  const bound = values.length > 0 ? statement.bind(...values) : statement;
  return bound.first<D1Row>();
};

const normalizeIngestion = (row: D1Row): D1Row => ({
  ...row,
  detected_currencies: typeof row.detected_currencies === 'string' ? JSON.parse(row.detected_currencies) : row.detected_currencies
});

const tenantResolver: D1Resolver = async (_args, context) => queryFirst(context.db, 'SELECT * FROM TenantMaster ORDER BY created_at ASC LIMIT 1');
const ingestionResolver: D1Resolver = async (_args, context) => {
  const rows = await queryAll(context.db, 'SELECT * FROM RawDocumentIngestion ORDER BY uploaded_at DESC');
  return rows.map(normalizeIngestion);
};
const validationResolver: D1Resolver = async (_args, context) => queryAll(context.db, 'SELECT * FROM ValidationPreCheckRecord ORDER BY created_at DESC');
const categoryResolver: D1Resolver = async (_args, context) => queryAll(context.db, 'SELECT * FROM SpendCategorySummary ORDER BY spend_inr_crores DESC');
const categoryDetailsResolver: D1Resolver = async (args, context) => {
  const categoryArgs = args as CategoryDetailsArgs;
  if (categoryArgs.id) return queryAll(context.db, 'SELECT * FROM CategoryYearDetail WHERE id = ?', [categoryArgs.id]);
  return queryAll(context.db, 'SELECT * FROM CategoryYearDetail ORDER BY rank ASC');
};
const vendorDetailsResolver: D1Resolver = async (_args, context) => queryAll(context.db, 'SELECT * FROM VendorYearDetail ORDER BY total_3yr_spend_inr_cr DESC');
const vendorRankingsResolver: D1Resolver = async (_args, context) => queryAll(context.db, 'SELECT * FROM VendorPriceRank ORDER BY total_spend_inr_cr DESC');
const lineItemsResolver: D1Resolver = async (_args, context) => queryAll(context.db, 'SELECT * FROM LineItemMapping ORDER BY mapping_id ASC');
const opportunitiesResolver: D1Resolver = async (_args, context) => queryAll(context.db, 'SELECT * FROM SavingsOpportunity ORDER BY est_savings_inr_cr DESC');
const funnelResolver: D1Resolver = async (_args, context) =>
  queryAll(context.db, 'SELECT * FROM ConversionFunnelPhase ORDER BY phase_num ASC');
const metricsResolver: D1Resolver = async (_args, _context) => ({
  totalQueries: 0,
  slowQueries: 0,
  cacheHitRatio: 0,
  averageDurationMs: 0,
  recentAudits: []
});

const dashboardResolver: D1Resolver = async (_args, context) => {
  const [tenant, categories, opportunities, funnelStages, ingestionQueue, validationRecords, queryMetrics] =
    await Promise.all([
      tenantResolver({}, context),
      categoryResolver({}, context),
      opportunitiesResolver({}, context),
      funnelResolver({}, context),
      ingestionResolver({}, context),
      validationResolver({}, context),
      metricsResolver({}, context)
    ]);
  return { tenant, categories, opportunities, funnelStages, ingestionQueue, validationRecords, queryMetrics };
};

const updateTenantResolver: D1Resolver = async (args, context) => {
  const input = (args as UpdateTenantArgs).input;
  const current = await queryFirst(context.db, 'SELECT tenant_id FROM TenantMaster ORDER BY created_at ASC LIMIT 1');
  if (!current?.tenant_id) throw new Error('D1 seed does not contain a tenant record');
  const updateSql = 'UPDATE TenantMaster SET ' +
    'enterprise_name = COALESCE(?, enterprise_name), ' +
    'region = COALESCE(?, region), ' +
    'base_currency = COALESCE(?, base_currency), ' +
    'status = COALESCE(?, status), ' +
    'major_sector = COALESCE(?, major_sector), ' +
    'minor_sector = COALESCE(?, minor_sector), ' +
    'updated_at = CURRENT_TIMESTAMP WHERE tenant_id = ?';
  await context.db.prepare(updateSql).bind(
    input.enterprise_name ?? null, input.region ?? null, input.base_currency ?? null, input.status ?? null,
    input.major_sector ?? null, input.minor_sector ?? null, current.tenant_id
  ).run();
  return tenantResolver({}, context);
};

const addIngestionResolver: D1Resolver = async (args, context) => {
  const input = (args as IngestionInputArgs).input;
  const tenant = await queryFirst(context.db, 'SELECT tenant_id FROM TenantMaster ORDER BY created_at ASC LIMIT 1');
  if (!tenant?.tenant_id) throw new Error('D1 seed does not contain a tenant record');
  const id = `DOC-${crypto.randomUUID()}`;
  await context.db.prepare(
    'INSERT INTO RawDocumentIngestion (doc_id, tenant_id, file_name, file_type, file_size_mb, ocr_status, progress, records_count) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, tenant.tenant_id, input.file_name, input.file_type, input.file_size_mb, 'Completed', 100, input.records_count || 0
  ).run();
  return queryFirst(context.db, 'SELECT * FROM RawDocumentIngestion WHERE doc_id = ?', [id]);
};

const updateValidationResolver: D1Resolver = async (args, context) => {
  const input = (args as ValidationRecordArgs).input;
  const resolvedValue = input.resolved === undefined ? null : (input.resolved ? 1 : 0);
  await context.db.prepare(
    'UPDATE ValidationPreCheckRecord SET issue_flag = COALESCE(?, issue_flag), ' +
    'action_status = COALESCE(?, action_status), resolved = COALESCE(?, resolved) WHERE record_id = ?'
  ).bind(input.issue_flag ?? null, input.action_status ?? null, resolvedValue, input.record_id).run();
  return queryFirst(context.db, 'SELECT * FROM ValidationPreCheckRecord WHERE record_id = ?', [input.record_id]);
};

const mergeVendorResolver: D1Resolver = async (args, context) => {
  const input = (args as MergeVendorArgs).input;
  const result = await context.db.prepare(
    'UPDATE VendorYearDetail SET vendor_name = ? WHERE master_vendor_id = ?'
  ).bind(input.canonicalName, input.masterId).run() as { meta?: { changes?: number } };
  return { success: true, affected: result.meta?.changes || 0 };
};

const deployOpportunityResolver: D1Resolver = async (args, context) => {
  const input = args as DeployOpportunityArgs;
  await context.db.prepare('UPDATE SavingsOpportunity SET recommended_module = ?, status = ? WHERE opp_id = ?').bind(input.targetModule, 'DEPLOYED', input.id).run();
  return queryFirst(context.db, 'SELECT * FROM SavingsOpportunity WHERE opp_id = ?', [input.id]);
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
