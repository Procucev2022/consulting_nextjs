import type { ScopedModule2RouteLoaders, ScopedModule2FilterOptions } from '../types/module2D1ScopedRoutes';
import type { CloudflareD1Database } from '../types/cloudflare';
import type { WorkerD1Result } from '../types/d1';
import type { ProcurementTransactionScope } from '../types/procurementTransactionD1';
import { MODULE2_D1_SCOPED_MESSAGES } from '../constants/module2D1Scoped';
import { loadPaymentTermsResultFromD1 } from './workerD1PaymentTermsD1';
import { buildVendorConsolidationResult } from './workerD1VendorConsolidation';
import { loadAlternateSourcingResultFromD1 } from './workerD1AlternateSourcingD1';

const scopeRequired = (): WorkerD1Result => ({
  status: 409,
  data: { success: false, message: MODULE2_D1_SCOPED_MESSAGES.scopeRequired }
});

const handlePaymentTermsRoute = async (
  db: CloudflareD1Database, scope: ProcurementTransactionScope, requestId: string
): Promise<WorkerD1Result> => {
  if (!scope.assessmentId) return scopeRequired();
  return { data: await loadPaymentTermsResultFromD1(db, scope, requestId) };
};

const handleVendorConsolidationRoute = async (
  db: CloudflareD1Database,
  scope: ProcurementTransactionScope,
  path: string,
  url: URL,
  requestId: string,
  options: ScopedModule2FilterOptions['vendorConsolidationOptions'],
  loaders: ScopedModule2RouteLoaders
): Promise<WorkerD1Result> => {
  if (!scope.assessmentId) return scopeRequired();
  const result = await loaders.loadAnalysis(db, scope, url.searchParams.get('refresh') === 'true', requestId);
  const customerName = await loaders.loadCustomerName(db, scope, path, requestId);
  return { data: buildVendorConsolidationResult(
    scope.assessmentId, customerName, result.transactions, options
  ) };
};

const handleAlternateSourcingRoute = async (
  db: CloudflareD1Database,
  scope: ProcurementTransactionScope,
  url: URL,
  options: ScopedModule2FilterOptions['alternateSourcingOptions'],
  requestId: string,
  loaders: ScopedModule2RouteLoaders
): Promise<WorkerD1Result> => {
  if (!scope.assessmentId) return scopeRequired();
  const result = await loaders.loadAnalysis(db, scope, url.searchParams.get('refresh') === 'true', requestId);
  const alternateSourcing = await loadAlternateSourcingResultFromD1(
    db, scope.assessmentId, result.transactions,
    options || { geographicPreference: 'ALL_LOCATIONS' }, requestId
  );
  return { data: alternateSourcing };
};

export const handleScopedSpecialRoute = async (
  db: CloudflareD1Database,
  path: string,
  scope: ProcurementTransactionScope,
  url: URL,
  requestId: string,
  filterOptions: ScopedModule2FilterOptions,
  loaders: ScopedModule2RouteLoaders
): Promise<WorkerD1Result | null> => {
  if (path.startsWith('/category-specialisation') && !scope.assessmentId) return scopeRequired();
  if (path.startsWith('/payment-terms')) return handlePaymentTermsRoute(db, scope, requestId);
  if (path.startsWith('/vendor-consolidation')) return handleVendorConsolidationRoute(
    db, scope, path, url, requestId, filterOptions.vendorConsolidationOptions, loaders
  );
  if (path.startsWith('/alternate-sourcing')) return handleAlternateSourcingRoute(
    db, scope, url, filterOptions.alternateSourcingOptions, requestId, loaders
  );
  if (path === '/export' && !scope.assessmentId) return scopeRequired();
  return null;
};
