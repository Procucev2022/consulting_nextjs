import { D1_TENANT_DATA_CACHE_KEYS } from '../constants/db';
import { getTenantD1Data } from '../services/d1TenantDataCache';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1TenantDataCacheKey } from '../types/db';
import type { CategoryDetailsArgs, D1GraphQLContext } from '../types/graphql';

type D1Row = Record<string, unknown>;

const queryAll = async (db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<D1Row[]> => {
  const statement = db.prepare(sql);
  const bound = statement.bind(...values);
  const result = await bound.all<D1Row>();
  return result.results || [];
};

const queryTenantCachedRows = (
  db: CloudflareD1Database,
  tenantId: string,
  cacheKey: D1TenantDataCacheKey,
  sql: string
): Promise<D1Row[]> => getTenantD1Data(db, tenantId, cacheKey, () => queryAll(db, sql, [tenantId]));

export const categoryResolver = (_args: unknown, context: D1GraphQLContext): Promise<D1Row[]> => queryTenantCachedRows(
  context.db, context.tenantId || '', D1_TENANT_DATA_CACHE_KEYS.CATEGORIES_SUMMARY,
  'SELECT * FROM SpendCategorySummary WHERE tenant_id = ? ORDER BY spend_inr_crores DESC'
);

export const categoryDetailsResolver = async (args: unknown, context: D1GraphQLContext): Promise<D1Row[]> => {
  const categoryArgs = args as CategoryDetailsArgs;
  const rows = await queryTenantCachedRows(
    context.db, context.tenantId || '', D1_TENANT_DATA_CACHE_KEYS.CATEGORY_DETAILS,
    'SELECT * FROM CategoryYearDetail WHERE tenant_id = ? ORDER BY rank ASC'
  );
  return categoryArgs.id ? rows.filter((row) => row.id === categoryArgs.id) : rows;
};

export const vendorDetailsResolver = (
  _args: unknown,
  context: D1GraphQLContext
): Promise<D1Row[]> => queryTenantCachedRows(
    context.db, context.tenantId || '', D1_TENANT_DATA_CACHE_KEYS.VENDOR_DETAILS,
    'SELECT * FROM VendorYearDetail WHERE tenant_id = ? ORDER BY total_3yr_spend_inr_cr DESC'
  );

export const vendorRankingsResolver = (
  _args: unknown,
  context: D1GraphQLContext
): Promise<D1Row[]> => queryTenantCachedRows(
    context.db, context.tenantId || '', D1_TENANT_DATA_CACHE_KEYS.VENDOR_RANKINGS,
    'SELECT * FROM VendorPriceRank WHERE tenant_id = ? ORDER BY total_spend_inr_cr DESC'
  );

export const opportunitiesResolver = (
  _args: unknown,
  context: D1GraphQLContext
): Promise<D1Row[]> => queryTenantCachedRows(
    context.db, context.tenantId || '', D1_TENANT_DATA_CACHE_KEYS.SAVINGS_OPPORTUNITIES,
    'SELECT opportunity.* FROM SavingsOpportunity AS opportunity ' +
    'INNER JOIN SavingsOpportunityTenantScope AS scope ON scope.opp_id = opportunity.opp_id ' +
    'WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC'
  );
