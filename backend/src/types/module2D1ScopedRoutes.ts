import type { DirectPriceD1BuildOptions } from './module2DirectPriceImprovementD1';
import type { EAuctionBuildOptions } from './module2EAuctionD1';
import type { WorkerD1Result } from './d1';
import type { ProcurementTransactionScope } from './procurementTransactionD1';
import type { VendorConsolidationQueryInput } from './validation';
import type { AlternateSourcingQueryInput } from './validation';
import type { CloudflareD1Database } from './cloudflare';
import type { ScopedModule2Analysis } from './module2D1Scoped';

export interface ScopedModule2FilterOptions {
  eauctionOptions: EAuctionBuildOptions;
  directPriceOptions: DirectPriceD1BuildOptions;
  vendorConsolidationOptions?: VendorConsolidationQueryInput;
  alternateSourcingOptions?: AlternateSourcingQueryInput;
  error?: WorkerD1Result;
}

export interface ScopedModule2RouteLoaders {
  loadAnalysis: (
    db: CloudflareD1Database, scope: ProcurementTransactionScope, refresh: boolean, requestId: string
  ) => Promise<ScopedModule2Analysis>;
  loadCustomerName: (
    db: CloudflareD1Database, scope: ProcurementTransactionScope, path: string, requestId: string
  ) => Promise<string>;
}

export type ScopedModule2ScopeResult =
  | { kind: 'none' }
  | { kind: 'invalid'; error: WorkerD1Result }
  | { kind: 'valid'; scope: ProcurementTransactionScope };

export type ScopedModule2TrustedScopeResult =
  | { error: WorkerD1Result; scope?: never }
  | { scope: ProcurementTransactionScope; customerName: string; error?: never };
