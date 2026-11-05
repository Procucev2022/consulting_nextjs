import { D1_ROUTE_MESSAGES, D1_TABLES } from '../constants/d1';
import { d1DatasetScopeSchema } from '../constants/validation';
import {
  MODULE2_D1_PROJECTION, MODULE2_D1_SCOPED_MESSAGES, MODULE2_D1_VALID_TRANSACTION_FILTER,
  module2D1TransactionSchema
} from '../constants/module2D1Scoped';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { D1Record, WorkerD1Result } from '../types/d1';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  ScopedModule2Analysis, ScopedModule2Supplier
} from '../types/module2D1Scoped';
import type { ScopedCategoryProfile } from '../types/module2D1Scoped';
import type { ProcurementTransactionScope } from '../types/procurementTransactionD1';
import { Module2StrategicSourcingEngine } from './module2StrategicSourcingEngine';
import { Module2CompactSourcingEngine } from './module2CompactSourcingEngine';
import { Module2CanonicalCalculators } from './module2CanonicalCalculators';
import { queryD1Rows } from './workerD1Query';
import logger from '../utils/logger';
import { setProcurementCategoryMappings } from '../utils/procurementCategoryResolver';
import { buildVolumeAggregationResult } from './workerD1VolumeAggregation';
import { buildEAuctionResult } from './workerD1EAuction';
import type { EAuctionBuildOptions } from '../types/module2EAuctionD1';
import { buildDirectPriceResult } from './workerD1DirectPrice';
import type { DirectPriceD1BuildOptions } from '../types/module2DirectPriceImprovementD1';
import { validateScopedModule2Filters } from './workerD1Module2FilterValidation';
import type {
  ScopedModule2RouteLoaders, ScopedModule2ScopeResult, ScopedModule2TrustedScopeResult
} from '../types/module2D1ScopedRoutes';
import { buildModule2D1AuditDossier } from './workerD1SourcingAuditDossier';
import { buildCategorySpecialisationFromD1 } from './workerD1CategorySpecialisation';
import { buildSpecificationRationalisationFromD1 } from './workerD1SpecificationRationalisation';
import { handleScopedSpecialRoute } from './workerD1Module2ScopedSpecialRoutes';
import { getOrLoadScopedModule2Analysis } from './workerD1Module2Cache';

export { clearScopedModule2Cache } from './workerD1Module2Cache';

const toTransaction = (value: D1Record): StrategicInputTransaction => {
  const row = module2D1TransactionSchema.parse(value);
  return {
    ...row, po_number: row.po_number ?? undefined, po_line: row.po_line == null ? undefined : String(row.po_line),
    po_date: row.po_date ?? undefined, vendor_code: row.vendor_code ?? undefined,
    material_code: row.material_code ?? undefined, uom: row.uom ?? undefined,
    currency: row.currency ?? undefined, plant: row.plant ?? undefined,
    spend_category: row.spend_category ?? undefined, unspsc_code: row.unspsc_code ?? undefined,
    unspsc_category: row.unspsc_category ?? undefined
  };
};

const loadAnalysis = async (
  db: CloudflareD1Database, scope: ProcurementTransactionScope, refresh: boolean, requestId: string
): Promise<ScopedModule2Analysis> => getOrLoadScopedModule2Analysis(db, scope, refresh, requestId, async () => {
    const startedAt = Date.now();
    const filters = [scope.assessmentId ? 'assessment_id = ?' : 'assessment_id IS NULL'];
    const params: string[] = scope.assessmentId ? [scope.assessmentId] : [];
    if (scope.tenantId) { filters.push('tenant_id = ?'); params.push(scope.tenantId); }
    filters.push(MODULE2_D1_VALID_TRANSACTION_FILTER);
    const rows = await queryD1Rows(db,
      `SELECT ${MODULE2_D1_PROJECTION} FROM ${D1_TABLES.transactions} WHERE ${filters.join(' AND ')} ` +
      'ORDER BY source_row_number ASC', params, requestId);
    const categoryMappingRows = await queryD1Rows(db,
      `SELECT material_group_code, category_name FROM ${D1_TABLES.procurementCategoryMappings}`,
      [], requestId);
    setProcurementCategoryMappings(Object.fromEntries(categoryMappingRows.map((row) => [
      String(row.material_group_code), String(row.category_name)
    ])));
    const transactions = rows.map(toTransaction);
    const analysis = Module2CompactSourcingEngine.analyze(transactions);
    logger.info('Calculated assessment-scoped sourcing results from D1', {
      ...scope, requestId, transactionCount: transactions.length, durationMs: Date.now() - startedAt
    });
    return { transactions, analysis };
  });

const suppliersFromAnalysis = (result: ScopedModule2Analysis): ScopedModule2Supplier[] => {
  const suppliers = new Map<string, ScopedModule2Supplier>();
  for (const profile of result.analysis.profiles) {
    for (const supplier of profile.suppliers) {
      const existing = suppliers.get(supplier.supplierName) || {
        supplierName: supplier.supplierName, categories: [], totalSpendInr: 0, totalTransactions: 0,
        potentialConsolidationRelevance: supplier.potentialConsolidationRelevance
      };
      if (!existing.categories.includes(profile.categoryName)) existing.categories.push(profile.categoryName);
      existing.totalSpendInr += supplier.totalSpendInr;
      existing.totalTransactions += supplier.transactionCount;
      suppliers.set(supplier.supplierName, existing);
    }
  }
  return [...suppliers.values()].sort((left, right) => right.totalSpendInr - left.totalSpendInr);
};

const analysisCollections = (result: ScopedModule2Analysis, path: string): WorkerD1Result | null => {
  const { analysis, transactions } = result;
  if (path.startsWith('/dashboard') || path.startsWith('/overview')) return { data: analysis.summary };
  if (path.startsWith('/categories') || path.startsWith('/profiles')) {
    return { data: { profiles: analysis.profiles, count: analysis.profiles.length } };
  }
  if (path.startsWith('/suppliers')) {
    const suppliers = suppliersFromAnalysis(result);
    return { data: { suppliers, count: suppliers.length } };
  }
  if (path.startsWith('/top-50-vendors') || path.startsWith('/top50-vendors')) {
    const top50 = Module2CanonicalCalculators.buildTop50Vendors(transactions);
    return { data: { top50, count: top50.length } };
  }
  if (path.startsWith('/handoff')) {
    return { data: { packages: analysis.handoffPackages, count: analysis.handoffPackages.length } };
  }
  return null;
};

const analysisLeverDetails = (
  result: ScopedModule2Analysis, path: string, assessmentId: string,
  eauctionOptions: EAuctionBuildOptions, directPriceOptions: DirectPriceD1BuildOptions, customerName: string
): WorkerD1Result | null => {
  if (path.startsWith('/volume-aggregation')) {
    return { data: buildVolumeAggregationResult(assessmentId, result.transactions) };
  }
  if (path.startsWith('/e-auction')) {
    return { data: buildEAuctionResult(assessmentId, result.transactions, eauctionOptions, customerName) };
  }
  if (path.startsWith('/direct-price-improvement')) {
    return { data: buildDirectPriceResult(assessmentId, result.transactions, directPriceOptions, customerName) };
  }
  return null;
};

const isCustomerScopedPath = (path: string): boolean =>
  path.startsWith('/e-auction') || path.startsWith('/direct-price-improvement') ||
  path.startsWith('/vendor-consolidation') || path.startsWith('/category-specialisation') ||
  path.startsWith('/procurement-compliance');

const requestDatasetScope = (request: Request, url: URL): ScopedModule2ScopeResult => {
  const assessmentId = url.searchParams.get('assessmentId') ??
    request.headers.get('x-assessment-id') ?? undefined;
  const tenantId = url.searchParams.get('tenantId') ?? request.headers.get('x-tenant-id') ??
    request.headers.get('x-resolved-tenant-id') ?? undefined;
  if (assessmentId === undefined && tenantId === undefined) return { kind: 'none' };
  const parsed = d1DatasetScopeSchema.safeParse({ assessmentId, tenantId });
  if (!parsed.success) return { kind: 'invalid', error: { status: 400, data: {
    success: false, message: D1_ROUTE_MESSAGES.invalidDatasetScope, errors: parsed.error.issues
  } } };
  return { kind: 'valid', scope: parsed.data };
};

const resolveTrustedDatasetScope = async (
  db: CloudflareD1Database,
  request: Request,
  requestedScope: ProcurementTransactionScope,
  requestId: string
): Promise<ScopedModule2TrustedScopeResult> => {
  const trustedTenantId = request.headers.get('x-resolved-tenant-id');
  if (!trustedTenantId) return { error: { status: 403, data: {
    success: false, message: D1_ROUTE_MESSAGES.tenantScopeRequired
  } } };
  if (requestedScope.tenantId && requestedScope.tenantId !== trustedTenantId) {
    return { error: { status: 403, data: {
      success: false, message: D1_ROUTE_MESSAGES.tenantScopeMismatch
    } } };
  }
  const scope = { ...requestedScope, tenantId: trustedTenantId };
  if (scope.assessmentId) {
    const rows = await queryD1Rows<{ assessment_id: string; customer_name?: string | null }>(db,
      `SELECT assessment_id, customer_name FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ? LIMIT 1`,
      [scope.assessmentId, trustedTenantId], requestId);
    if (!rows.length) return { error: { status: 404, data: {
      success: false, message: D1_ROUTE_MESSAGES.module2LogisticsAssessmentNotFound
    } } };
    return { scope, customerName: String(rows[0].customer_name || scope.assessmentId) };
  }
  return { scope, customerName: '' };
};

const isHandledByScopedProjection = (path: string): boolean =>
  path.startsWith('/line-items') || path.startsWith('/canonical-input');

const loadCustomerName = async (
  scope: ProcurementTransactionScope, path: string, resolvedCustomerName: string
): Promise<string> => {
  if (!isCustomerScopedPath(path) || !scope.assessmentId) return scope.assessmentId || '';
  return resolvedCustomerName || scope.assessmentId;
};

const categoryDetails = (result: ScopedModule2Analysis, path: string): WorkerD1Result | null => {
  if (!path.startsWith('/category/')) return null;
  const id = decodeURIComponent(path.slice('/category/'.length)).toLowerCase();
  const profile = result.analysis.profiles.find((item) =>
    item.categoryId.toLowerCase() === id || item.categoryName.toLowerCase() === id);
  if (!profile) return { status: 404, data: {
    success: false, message: MODULE2_D1_SCOPED_MESSAGES.missingCategory
  } };
  const key = (profile as ScopedCategoryProfile).sourceCategoryKey;
  const groups = Module2StrategicSourcingEngine.groupTransactionsByCategory(result.transactions);
  return { data: Module2StrategicSourcingEngine.buildCategoryProfile(key, groups.get(key) || []) };
};

const canonicalAnalysisDetails = (result: ScopedModule2Analysis, path: string): WorkerD1Result | null => {
  const { analysis, transactions } = result;
  if (path.startsWith('/opportunity-ledger') || path.startsWith('/attribution-ledger')) {
    const ledger = Module2CanonicalCalculators.buildOpportunityLedger(analysis.profiles, transactions);
    return { data: { ledger, count: ledger.length } };
  }
  if (path.startsWith('/supplier-risk')) {
    const supplierRisk = Module2CanonicalCalculators.buildSupplierRisk(analysis.profiles);
    return { data: { supplierRisk, count: supplierRisk.length } };
  }
  if (path.startsWith('/po-consolidation')) {
    const poConsolidation = Module2CanonicalCalculators.buildPoConsolidation(transactions);
    return { data: { poConsolidation, count: poConsolidation.length } };
  }
  if (path.startsWith('/recurring-spend')) {
    const recurringSpend = Module2CanonicalCalculators.buildRecurringSpend(analysis.profiles);
    return { data: { recurringSpend, count: recurringSpend.length } };
  }
  const ledger = Module2CanonicalCalculators.buildOpportunityLedger(analysis.profiles, transactions);
  if (path.startsWith('/opportunities')) return { data: ledger };
  if (path.startsWith('/consolidated-savings')) {
    return { data: { success: true, opportunities: ledger, count: ledger.length } };
  }
  return null;
};

const analysisDetails = (
  result: ScopedModule2Analysis, path: string, assessmentId = '', eauctionOptions: EAuctionBuildOptions = {},
  directPriceOptions: DirectPriceD1BuildOptions = {}, customerName = assessmentId, tenantId?: string
): WorkerD1Result => {
  if (path === '/specification-rationalisation') return { data: buildSpecificationRationalisationFromD1({
    assessmentId,
    tenantId: tenantId || '',
    customerName,
    transactions: result.transactions
  }) };
  if (path === '/category-specialisation') return { data: buildCategorySpecialisationFromD1({
    assessmentId,
    tenantId: tenantId || '',
    customerName,
    scopedAnalysis: result
  }) };
  const leverDetails = analysisLeverDetails(
    result, path, assessmentId, eauctionOptions, directPriceOptions, customerName
  );
  if (leverDetails) return leverDetails;
  if (path === '/export') {
    return { data: { success: true, dossier: buildModule2D1AuditDossier(
      assessmentId, tenantId, result
    ) } };
  }
  const categoryResult = categoryDetails(result, path);
  if (categoryResult) return categoryResult;
  const analysisResult = canonicalAnalysisDetails(result, path);
  if (analysisResult) return analysisResult;
  return { status: 404, data: { success: false, message: MODULE2_D1_SCOPED_MESSAGES.unknownRoute } };
};

export const handleScopedModule2Route = async (
  db: CloudflareD1Database, path: string, request: Request, url: URL
): Promise<WorkerD1Result | null> => {
  const scopeResult = requestDatasetScope(request, url);
  if (scopeResult.kind === 'none') return null;
  if (scopeResult.kind === 'invalid') return scopeResult.error;
  // These routes already have their own scoped row projection in the main handler.
  if (isHandledByScopedProjection(path)) return null;
  const filterOptions = validateScopedModule2Filters(path, url);
  if (filterOptions.error) return filterOptions.error;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const authorizedScope = await resolveTrustedDatasetScope(db, request, scopeResult.scope, requestId);
  if (authorizedScope.error) return authorizedScope.error;
  const { scope, customerName: resolvedCustomerName } = authorizedScope;
  const loaders: ScopedModule2RouteLoaders = {
    loadAnalysis,
    loadCustomerName: (_db, customerScope, customerPath) =>
      loadCustomerName(customerScope, customerPath, resolvedCustomerName)
  };
  const specialRoute = await handleScopedSpecialRoute(
    db, path, scope, url, requestId, filterOptions, loaders
  );
  if (specialRoute) return specialRoute;
  const result = await loadAnalysis(db, scope, url.searchParams.get('refresh') === 'true', requestId);
  const customerName = await loadCustomerName(scope, path, resolvedCustomerName);
  return analysisCollections(result, path) ?? analysisDetails(
    result, path, scope.assessmentId, filterOptions.eauctionOptions,
    filterOptions.directPriceOptions, customerName, scope.tenantId
  );
};
