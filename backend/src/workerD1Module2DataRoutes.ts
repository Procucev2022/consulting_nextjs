import { D1_LEVERS, D1_REPORTING, D1_ROUTE_MESSAGES, D1_TABLES, D1_UNCLASSIFIED_LINE_ITEM } from './constants/d1';
import { d1DatasetScopeSchema } from './constants/validation';
import { MODULE2_D1_ROUTE_MESSAGES } from './constants/module2D1Scoped';
import type { CloudflareD1Database } from './types/cloudflare';
import type { D1Record, WorkerD1Result } from './types/d1';
import type { MaterialMappingEntry } from './types/module2MaterialMapping';
import { queryD1Rows as queryAll } from './services/workerD1Query';
import { loadAssessmentMaterialMappings } from './services/workerD1MaterialMappings';
import logger from './utils/logger';

const queryFirst = async <T = D1Record>(db: CloudflareD1Database, sql: string, values: unknown[] = []): Promise<T | null> => {
  const statement = db.prepare(sql);
  const bound = statement.bind(...values);
  return bound.first<T>();
};

const numberValue = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0);

const toLineItem = (row: D1Record, mapping?: MaterialMappingEntry): D1Record => ({
  ...D1_UNCLASSIFIED_LINE_ITEM,
  mapping_id: row.transaction_id, line_item_id: row.transaction_id,
  material_code: row.material_code, material_desc: row.short_text, raw_desc: row.short_text,
  vendor_identified: row.supplier_name, master_supplier_id: row.supplier_code,
  ...(mapping ? {
    unspsc_code: mapping.assignedUnspscCode,
    unspsc_category_name: mapping.assignedUnspscTitle,
    unspsc_commodity_title: mapping.assignedUnspscTitle,
    core_bucket: mapping.coreBucket || '',
    status: mapping.reviewStatus === 'CLIENT_APPROVED' || mapping.reviewStatus === 'TAXONOMY_VERIFIED'
      ? 'Confirmed' : 'Pending Review'
  } : {}),
  unit_price: numberValue(row.net_price), qty: numberValue(row.order_quantity),
  total_spend: numberValue(row.total_inr_raw), amount_inr: numberValue(row.total_inr_raw),
  inr_crores: numberValue(row.total_inr_raw) / D1_REPORTING.inrPerCrore,
  raw_currency: row.currency, invoice_date: row.document_date_raw, po_number: row.po_number
});

const buildDashboardData = (
  categories: D1Record[],
  opportunities: D1Record[],
  topVendors: D1Record[],
  tenantSpend: number,
  assessment: D1Record | null
): Record<string, unknown> => {
  const totalSavings = opportunities.reduce((total, row) => total + numberValue(row.est_savings_inr_cr), 0);
  const totalSpend = tenantSpend;
  const leverSpend = (lever: RegExp): number => opportunities.filter((row) => lever.test(String(row.lever)))
    .reduce((total, row) => total + numberValue(row.current_spend_inr_cr), 0);
  const leverSavings = (lever: RegExp): number => opportunities.filter((row) => lever.test(String(row.lever)))
    .reduce((total, row) => total + numberValue(row.est_savings_inr_cr), 0);
  const auctionSpend = leverSpend(D1_LEVERS.eauction);
  const auctionSavings = leverSavings(D1_LEVERS.eauction);
  const consolidationSpend = leverSpend(D1_LEVERS.consolidation);
  const consolidationSavings = leverSavings(D1_LEVERS.consolidation);
  const volumeSpend = leverSpend(D1_LEVERS.volume);
  const volumeSavings = leverSavings(D1_LEVERS.volume);
  const overlap = assessment ? numberValue(assessment.overlap_deductions_cr) : 0;
  const netSavings = assessment ? numberValue(assessment.net_defensible_opportunity_cr) : totalSavings;

  return {
    totalEvaluatedSpendCr: totalSpend,
    totalIdentifiedSavingsCr: Number(totalSavings.toFixed(D1_REPORTING.decimalPlaces)),
    savingsYieldPct: totalSpend > 0 ? Number((totalSavings / totalSpend * 100).toFixed(D1_REPORTING.decimalPlaces)) : 0,
    categoriesCount: categories.length,
    opportunitiesCount: opportunities.length,
    topVendorsCount: topVendors.length,
    categories,
    opportunities,
    topVendors,
    totalAddressableSpendInr: totalSpend * D1_REPORTING.inrPerCrore,
    totalAddressableSpendInrCr: totalSpend,
    eauctionAddressableSpendInr: auctionSpend * D1_REPORTING.inrPerCrore,
    eauctionAddressableSpendInrCr: auctionSpend,
    totalPotentialEAuctionOpportunityInr: auctionSavings * D1_REPORTING.inrPerCrore,
    totalPotentialEAuctionOpportunityInrCr: auctionSavings,
    vendorConsolidationAddressableSpendInr: consolidationSpend * D1_REPORTING.inrPerCrore,
    vendorConsolidationAddressableSpendInrCr: consolidationSpend,
    totalPotentialConsolidationOpportunityInr: consolidationSavings * D1_REPORTING.inrPerCrore,
    totalPotentialConsolidationOpportunityInrCr: consolidationSavings,
    volumeBundlingAddressableSpendInr: volumeSpend * D1_REPORTING.inrPerCrore,
    volumeBundlingAddressableSpendInrCr: volumeSpend,
    volumeBundlingQuantifiableBenefitInr: volumeSavings * D1_REPORTING.inrPerCrore,
    volumeBundlingQuantifiableBenefitInrCr: volumeSavings,
    grossQuantifiableBenefitInr: totalSavings * D1_REPORTING.inrPerCrore,
    grossQuantifiableBenefitInrCr: Number(totalSavings.toFixed(D1_REPORTING.decimalPlaces)),
    totalOverlappingOpportunityInr: overlap * D1_REPORTING.inrPerCrore,
    totalOverlappingOpportunityInrCr: overlap,
    netQuantifiableOpportunityInr: netSavings * D1_REPORTING.inrPerCrore,
    netQuantifiableOpportunityInrCr: netSavings,
    overallDataConfidence: opportunities.length ? 'HIGH' : 'INSUFFICIENT_DATA'
  };
};

export const handleModule2DataRoute = async (
  db: CloudflareD1Database,
  normalized: string,
  request: Request,
  url: URL,
  tenantId: string
): Promise<WorkerD1Result | null> => {
  if (normalized.startsWith('/overview') || normalized.startsWith('/dashboard')) {
    const [categories, opportunities, topVendors, tenant, assessment] = await Promise.all([
      queryAll(db, `SELECT * FROM ${D1_TABLES.categories} WHERE tenant_id = ? ORDER BY spend_inr_crores DESC`, [tenantId]),
      queryAll(db, `SELECT opportunity.* FROM ${D1_TABLES.opportunities} AS opportunity ` +
        `INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ON scope.opp_id = opportunity.opp_id ` +
        'WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC', [tenantId]),
      queryAll(db, `SELECT * FROM ${D1_TABLES.vendors} WHERE tenant_id = ? ORDER BY total_3yr_spend_inr_cr DESC LIMIT 10`, [tenantId]),
      queryFirst(db, `SELECT * FROM ${D1_TABLES.tenant} WHERE tenant_id = ?`, [tenantId]),
      queryFirst(db, `SELECT overlap_deductions_cr, net_defensible_opportunity_cr FROM ${D1_TABLES.assessments} WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1`, [tenantId])
    ]);
    const tenantSpend = numberValue(tenant?.total_spend_evaluated_inr);
    return { data: buildDashboardData(categories, opportunities, topVendors, tenantSpend, assessment) };
  }

  if (normalized.startsWith('/categories') || normalized.startsWith('/profiles')) {
    const profiles = await queryAll(db, `SELECT * FROM ${D1_TABLES.categories} WHERE tenant_id = ? ORDER BY spend_inr_crores DESC`, [tenantId]);
    return { data: { profiles, count: profiles.length } };
  }

  if (normalized.startsWith('/category/')) {
    const catId = decodeURIComponent(normalized.slice('/category/'.length));
    const profile = await queryFirst(db, `SELECT * FROM ${D1_TABLES.categories} WHERE tenant_id = ? AND (id = ? OR name = ?)`, [tenantId, catId, catId]);
    return { data: profile };
  }

  if (normalized.startsWith('/suppliers') || normalized.startsWith('/top-50-vendors') || normalized.startsWith('/top50-vendors')) {
    const suppliers = await queryAll(db, `SELECT * FROM ${D1_TABLES.vendors} WHERE tenant_id = ? ORDER BY total_3yr_spend_inr_cr DESC LIMIT 50`, [tenantId]);
    return { data: { suppliers, count: suppliers.length } };
  }

  if (normalized.startsWith('/opportunities') || normalized.startsWith('/opportunity-ledger')) {
    const opportunities = await queryAll(db,
      `SELECT opportunity.* FROM ${D1_TABLES.opportunities} AS opportunity ` +
      `INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ON scope.opp_id = opportunity.opp_id ` +
      'WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC', [tenantId]);
    return { data: opportunities };
  }

  if (normalized.startsWith('/waterfall') || normalized.startsWith('/bridge')) {
    return { data: await queryAll(db, `SELECT * FROM ${D1_TABLES.funnel} WHERE tenant_id = ? ORDER BY phase_num ASC`, [tenantId]) };
  }

  if (normalized.startsWith('/canonical-input') || normalized.startsWith('/line-items')) {
    const requestedTenantId = url.searchParams.get('tenantId') ?? request.headers.get('x-tenant-id') ?? undefined;
    if (requestedTenantId && requestedTenantId !== tenantId) return { status: 403, data: {
      success: false, message: D1_ROUTE_MESSAGES.tenantScopeMismatch
    } };
    const scope = d1DatasetScopeSchema.safeParse({
      assessmentId: url.searchParams.get('assessmentId') ?? request.headers.get('x-assessment-id') ?? undefined,
      tenantId: requestedTenantId,
      limit: url.searchParams.get('limit') ?? undefined
    });
    if (!scope.success) {
      logger.warn('D1 dataset scope validation failed', {
        errors: scope.error.issues, requestId: request.headers.get('x-request-id')
      });
      return { status: 400, data: {
        success: false, message: D1_ROUTE_MESSAGES.invalidDatasetScope, errors: scope.error.issues
      } };
    }
    const { assessmentId, limit } = scope.data;
    if (!tenantId) return { status: 403, data: { success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired } };
    if (assessmentId) {
      const owner = await queryFirst(db,
        `SELECT assessment_id FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [assessmentId, tenantId]);
      if (!owner) return { status: 404, data: { success: false, message: D1_ROUTE_MESSAGES.module2LogisticsAssessmentNotFound } };
    }
    const filters = [assessmentId ? 'assessment_id = ?' : 'assessment_id IS NULL'];
    const values: unknown[] = assessmentId ? [assessmentId] : [];
    filters.push('tenant_id = ?'); values.push(tenantId);
    values.push(limit);
    const items = await queryAll(db,
      `SELECT transaction_id, po_number, supplier_code, supplier_name, material_code, short_text, total_inr_raw, ` +
      'net_price, currency, order_quantity, document_date_raw ' +
      `FROM ${D1_TABLES.transactions} WHERE ${filters.join(' AND ')} ORDER BY source_row_number ASC LIMIT ?`, values);
    if (!normalized.startsWith('/line-items')) return { data: items };
    const savedMappings = assessmentId ? await loadAssessmentMaterialMappings(db, assessmentId, {
      requestId: request.headers.get('x-request-id') || undefined, tenantId
    }) : [];
    const mappingByMaterial = new Map(savedMappings.map((mapping) => [mapping.sourceMaterialId, mapping]));
    return { data: { lineItems: items.map((item) => {
      const key = String(item.material_code || '').trim().toLocaleUpperCase('en-US');
      return toLineItem(item, mappingByMaterial.get(key));
    }) } };
  }

  if (normalized.startsWith('/handoff')) {
    return { status: 409, data: { success: false, message: MODULE2_D1_ROUTE_MESSAGES.handoffScope } };
  }

  if (normalized.startsWith('/consolidated-savings')) {
    const opportunities = await queryAll(db,
      `SELECT opportunity.* FROM ${D1_TABLES.opportunities} AS opportunity ` +
      `INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ON scope.opp_id = opportunity.opp_id ` +
      'WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC', [tenantId]);
    return { data: { success: true, opportunities, count: opportunities.length } };
  }

  return null;
};
