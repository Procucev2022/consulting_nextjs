import { CLOUDFLARE_API_PREFIX } from './constants/cloudflare';
import { D1_TENANT_DATA_CACHE_KEYS } from './constants/db';
import {
  calculateConversionMetricsSchema,
  currencyQuerySchema,
  deployOpportunitySchema,
  mergeVendorSchema
} from './constants/validation';
import { D1_ROUTE_MESSAGES } from './constants/d1';
import type { CloudflareEnvironment } from './types/cloudflare';
import { getTenantD1Data, invalidateTenantD1Data } from './services/d1TenantDataCache';
import { getCurrencyRatesFromD1, getTenantFromD1, requireD1Binding } from './workerD1';
import logger from './utils/logger';
import { apiData, jsonResponse, readJson } from './workerHttp';

const handleConversion = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<{ data: Record<string, unknown> | unknown[]; status?: number }> => {
  if (request.method === 'GET') {
    const database = requireD1Binding(environment.DB);
    const stages = await database.prepare('SELECT * FROM ConversionFunnelPhase WHERE tenant_id = ? ORDER BY phase_num ASC')
      .bind(environment.REQUEST_TENANT_ID || '').all();
    return { data: stages.results || [] };
  }
  const parsed = calculateConversionMetricsSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return {
      data: { success: false, message: 'Conversion inputs are invalid.', errors: parsed.error.issues },
      status: 400
    };
  }
  const { annualSpendCr, savingsRate, saasFeeRate } = parsed.data;
  const grossSavingsCr = annualSpendCr * savingsRate / 100;
  const platformFeeCr = annualSpendCr * saasFeeRate / 100;
  return {
    data: {
      annualSpendCr,
      savingsRate,
      saasFeeRate,
      grossSavingsCr,
      platformFeeCr,
      netClientBenefitCr: grossSavingsCr - platformFeeCr,
      roiMultiple: platformFeeCr > 0 ? grossSavingsCr / platformFeeCr : 0
    }
  };
};

const handleStaticDataRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/categories`) {
    if (request.method !== 'GET') return jsonResponse({ success: false, message: 'Categories support GET requests only.' }, 405, request);
    const database = requireD1Binding(environment.DB);
    const tenantId = environment.REQUEST_TENANT_ID || '';
    const [categories, categoryDetails] = await Promise.all([
      getTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.CATEGORIES_SUMMARY, async () =>
        (await database.prepare('SELECT * FROM SpendCategorySummary WHERE tenant_id = ? ORDER BY spend_inr_crores DESC').bind(tenantId).all()).results || []),
      getTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.CATEGORY_DETAILS, async () =>
        (await database.prepare('SELECT * FROM CategoryYearDetail WHERE tenant_id = ? ORDER BY rank ASC').bind(tenantId).all()).results || [])
    ]);
    return apiData({ categories, categoryDetails }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/vendors`) {
    const database = requireD1Binding(environment.DB);
    if (request.method === 'POST') {
      const parsed = mergeVendorSchema.safeParse(await readJson(request));
      if (!parsed.success) return jsonResponse({ success: false, message: 'Vendor merge request is invalid.', errors: parsed.error.issues }, 400, request);
      const { targetName, masterId, canonicalName } = parsed.data;
      const tenantId = environment.REQUEST_TENANT_ID || '';
      const [vendorDetailCount, vendorRankCount] = await Promise.all([
        database.prepare('SELECT COUNT(*) AS count FROM VendorYearDetail WHERE master_vendor_id = ? AND tenant_id = ?').bind(masterId, tenantId).first<{ count: number }>(),
        database.prepare('SELECT COUNT(*) AS count FROM VendorPriceRank WHERE master_id = ? AND tenant_id = ?').bind(masterId, tenantId).first<{ count: number }>()
      ]);
      const affected = Number(vendorDetailCount?.count || 0) + Number(vendorRankCount?.count || 0);
      if (affected === 0) return jsonResponse({ success: false, message: `Supplier master ${masterId} was not found.` }, 404, request);
      const statements = [
        database.prepare('UPDATE VendorYearDetail SET vendor_name = ? WHERE master_vendor_id = ? AND tenant_id = ?').bind(canonicalName, masterId, tenantId),
        database.prepare('UPDATE VendorPriceRank SET vendor_name = ? WHERE master_id = ? AND tenant_id = ?').bind(canonicalName, masterId, tenantId)
      ];
      try {
        if (database.batch) await database.batch(statements);
        else await Promise.all(statements.map((statement) => statement.run()));
      } finally {
        invalidateTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_DETAILS);
        invalidateTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_RANKINGS);
      }
      logger.info('Supplier master name updated in D1', {
        targetName, masterId, canonicalName, affected, requestId: request.headers.get('x-request-id') || undefined
      });
      return apiData({ success: true, affected }, request);
    }
    if (request.method !== 'GET') return jsonResponse({ success: false, message: 'Vendor data supports GET and POST requests only.' }, 405, request);
    const tenantId = environment.REQUEST_TENANT_ID || '';
    const [vendorRankings, vendorDetails] = await Promise.all([
      getTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_RANKINGS, async () =>
        (await database.prepare('SELECT * FROM VendorPriceRank WHERE tenant_id = ? ORDER BY total_spend_inr_cr DESC').bind(tenantId).all()).results || []),
      getTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.VENDOR_DETAILS, async () =>
        (await database.prepare('SELECT * FROM VendorYearDetail WHERE tenant_id = ? ORDER BY total_3yr_spend_inr_cr DESC').bind(tenantId).all()).results || [])
    ]);
    return apiData({ vendorRankings, vendorDetails }, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/savings`) {
    const database = requireD1Binding(environment.DB);
    const tenant = await getTenantFromD1(database, environment.REQUEST_TENANT_ID || request.headers.get('x-resolved-tenant-id') || undefined);
    const tenantId = tenant.tenant_id;
    if (request.method === 'POST') {
      const parsed = deployOpportunitySchema.safeParse(await readJson(request));
      if (!parsed.success) return jsonResponse({ success: false, message: 'Opportunity deployment request is invalid.', errors: parsed.error.issues }, 400, request);
      const { opp_id: opportunityId, targetModule } = parsed.data;
      await database.prepare(`
        UPDATE SavingsOpportunity SET recommended_module = ?, push_to_module = ?, status = 'DEPLOYED'
        WHERE opp_id = ? AND EXISTS (
          SELECT 1 FROM SavingsOpportunityTenantScope AS scope
          WHERE scope.opp_id = SavingsOpportunity.opp_id AND scope.tenant_id = ?
        )
      `).bind(targetModule, targetModule, opportunityId, tenantId).run();
      invalidateTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.SAVINGS_OPPORTUNITIES);
      const deployed = await database.prepare(`SELECT opportunity.* FROM SavingsOpportunity AS opportunity
        INNER JOIN SavingsOpportunityTenantScope AS scope ON scope.opp_id = opportunity.opp_id
        WHERE opportunity.opp_id = ? AND scope.tenant_id = ?`).bind(opportunityId, tenantId).first<Record<string, unknown>>();
      if (!deployed) return jsonResponse({ success: false, message: `Savings opportunity ${opportunityId} was not found.` }, 404, request);
      logger.info('Savings opportunity deployed from D1', {
        opportunityId, targetModule, requestId: request.headers.get('x-request-id') || undefined
      });
      return apiData(deployed, request);
    }
    if (request.method !== 'GET') return jsonResponse({ success: false, message: 'Savings data supports GET and POST requests only.' }, 405, request);
    const opportunities = await getTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.SAVINGS_OPPORTUNITIES, async () =>
      (await database.prepare(`SELECT opportunity.* FROM SavingsOpportunity AS opportunity
        INNER JOIN SavingsOpportunityTenantScope AS scope ON scope.opp_id = opportunity.opp_id
        WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC`).bind(tenantId).all()).results || []);
    const totalPotentialSavingsCr = opportunities.reduce((total, item) => total + Number((item as Record<string, unknown>).est_savings_inr_cr || 0), 0);
    return apiData({ opportunities, totalPotentialSavingsCr }, request);
  }
  return null;
};

const handleFinancialRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/conversion`) {
    const result = await handleConversion(request, environment);
    return result.status ? jsonResponse(result.data as Record<string, unknown>, result.status, request) : apiData(result.data, request);
  }
  if (url.pathname === `${CLOUDFLARE_API_PREFIX}/currency`) {
    const database = requireD1Binding(environment.DB);
    const parsed = currencyQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) return jsonResponse({ success: false, message: 'Validation failed', errors: parsed.error.issues }, 400, request);
    const from = parsed.data.from || '';
    const amount = Number(parsed.data.amount || 0);
    const rates = await getCurrencyRatesFromD1(database, request.headers.get('x-request-id') || undefined);
    if (!from) return apiData(rates, request);
    const selected = rates[from] as { currentRate?: number; lastUpdated?: string | null } | undefined;
    if (!selected && from !== 'INR') return jsonResponse({ success: false, message: D1_ROUTE_MESSAGES.currencyNotFound(from) }, 400, request);
    const requestedDate = parsed.data.date || parsed.data.year;
    const effectiveDate = requestedDate == null ? null : /^\d{4}$/u.test(String(requestedDate))
      ? `${requestedDate}-12-31`
      : String(requestedDate).slice(0, 10).replaceAll('/', '-');
    let rate = from === 'INR' ? 1 : Number(selected?.currentRate || 0);
    let rateDate = from === 'INR' ? effectiveDate : selected?.lastUpdated || null;
    if (from !== 'INR' && effectiveDate) {
      const historicalRate = await database.prepare(`
        SELECT inr_per_unit, rate_date FROM FxReferenceRate
        WHERE currency = ? AND rate_date <= ?
        ORDER BY rate_date DESC LIMIT 1
      `).bind(from, effectiveDate).first<{ inr_per_unit: number; rate_date: string }>();
      if (!historicalRate) {
        return jsonResponse({ success: false, message: D1_ROUTE_MESSAGES.currencyRateUnavailable(from, effectiveDate) }, 400, request);
      }
      rate = Number(historicalRate.inr_per_unit);
      rateDate = historicalRate.rate_date;
    }
    return apiData({ amount, fromCurrency: from, amountINR: Number((amount * rate).toFixed(2)), exchangeRate: rate, rateDate }, request);
  }
  return null;
};

const handleReportRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  if (url.pathname !== `${CLOUDFLARE_API_PREFIX}/report`) return null;
  const database = requireD1Binding(environment.DB);
  const tenant = await getTenantFromD1(database, environment.REQUEST_TENANT_ID);
  const tenantId = String(tenant.tenant_id);
  const [docSpend, recordsCount, categoryDetails, opportunities] = await Promise.all([
    database.prepare('SELECT SUM(converted_inr_crores) AS totalSpend FROM RawDocumentIngestion WHERE tenant_id = ?')
      .bind(tenantId).first<{ totalSpend: number }>(),
    database.prepare('SELECT COUNT(*) AS count FROM ValidationPreCheckRecord WHERE tenant_id = ?')
      .bind(tenantId).first<{ count: number }>(),
    getTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.CATEGORY_DETAILS, async () =>
      (await database.prepare('SELECT * FROM CategoryYearDetail WHERE tenant_id = ? ORDER BY rank ASC').bind(tenantId).all()).results || []),
    getTenantD1Data(database, tenantId, D1_TENANT_DATA_CACHE_KEYS.SAVINGS_OPPORTUNITIES, async () =>
      (await database.prepare(`SELECT opportunity.* FROM SavingsOpportunity AS opportunity
        INNER JOIN SavingsOpportunityTenantScope AS scope ON scope.opp_id = opportunity.opp_id
        WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC`).bind(tenantId).all()).results || [])
  ]);
  const totalSpendEvaluatedCr = Number(docSpend?.totalSpend || tenant.total_spend_evaluated_inr || 0);
  const totalIdentifiedSavingsCr = opportunities.reduce((total, row) => total + Number((row as Record<string, unknown>).est_savings_inr_cr || 0), 0);
  return apiData({
    tenant,
    executiveSummary: {
      totalSpendEvaluatedCr: Number(totalSpendEvaluatedCr.toFixed(2)),
      totalIdentifiedSavingsCr: Number(totalIdentifiedSavingsCr.toFixed(2)),
      totalLineItemsAudited: Number(recordsCount?.count || 0)
    },
    categoryHighlights: categoryDetails,
    topActionableOpportunities: opportunities
  }, request);
};

export const handleD1DataRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  const staticResponse = await handleStaticDataRoute(request, environment, url);
  if (staticResponse) return staticResponse;
  const financialResponse = await handleFinancialRoute(request, environment, url);
  if (financialResponse) return financialResponse;
  return handleReportRoute(request, environment, url);
};
