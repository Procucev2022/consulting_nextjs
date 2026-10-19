/**
 * Module 2 Strategic Sourcing API Client
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  Module2ToModule4HandoffPackage
} from '../types/module2StrategicSourcing';
import type {
  DirectPriceImprovementResult,
  DirectPriceQueryOptions
} from '../types/module2DirectPriceImprovement';
import type {
  EAuctionResult,
  EAuctionQueryOptions
} from '../types/module2EAuction';
import type {
  VendorConsolidationResult
} from '../types/module2VendorConsolidation';
import { logger } from './logger';

export interface Module2CategoryProfilesResponse {
  profiles: CategoryStrategicSourcingProfile[];
  count: number;
}

export interface Module2SupplierDeepDiveItem {
  supplierName: string;
  categories: string[];
  totalSpendInr: number;
  totalTransactions: number;
  potentialConsolidationRelevance: string;
}

export class Module2StrategicSourcingApi {
  private static baseUrl = '/api/module2/sourcing';

  private static getFullUrl(path: string): string {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      return `${backendUrl}${this.baseUrl}${path}`;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${this.baseUrl}${path}`;
    }
    return `http://localhost:5000${this.baseUrl}${path}`;
  }

  private static appendQueryParams(
    basePath: string,
    params: Record<string, string | boolean | undefined>
  ): string {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    }
    const query = searchParams.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  /**
   * Fetch 10 KPI Dashboard Summary
   */
  public static async getDashboardSummary(
    refresh = false,
    assessmentId?: string
  ): Promise<Module2StrategicSourcingDashboardSummary | null> {
    try {
      const path = this.appendQueryParams('/dashboard', {
        refresh: refresh ? true : undefined,
        assessmentId
      });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.data as Module2StrategicSourcingDashboardSummary;
    } catch (err) {
      logger.debug('Module 2 Sourcing Dashboard Summary fetch skipped or unavailable in current runtime', { err });
      return null;
    }
  }

  /**
   * Fetch Category Sourcing Profiles
   */
  public static async getCategoryProfiles(
    refresh = false,
    assessmentId?: string
  ): Promise<CategoryStrategicSourcingProfile[]> {
    try {
      const path = this.appendQueryParams('/categories', {
        refresh: refresh ? true : undefined,
        assessmentId
      });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return (json.data?.profiles as CategoryStrategicSourcingProfile[]) || [];
    } catch (err) {
      logger.debug('Category Sourcing Profiles fetch skipped or unavailable in current runtime', { err });
      return [];
    }
  }

  /**
   * Fetch Single Category Sourcing Profile (20 Sections)
   */
  public static async getCategoryProfileById(
    id: string,
    assessmentId?: string
  ): Promise<CategoryStrategicSourcingProfile | null> {
    try {
      const path = this.appendQueryParams(`/category/${encodeURIComponent(id)}`, { assessmentId });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.data as CategoryStrategicSourcingProfile;
    } catch (err) {
      logger.debug('Category Sourcing Profile fetch skipped or unavailable in current runtime', { id, err });
      return null;
    }
  }

  /**
   * Fetch Supplier Deep Dive Analytics
   */
  public static async getSupplierDeepDive(
    assessmentId?: string
  ): Promise<Module2SupplierDeepDiveItem[]> {
    try {
      const path = this.appendQueryParams('/suppliers', { assessmentId });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return (json.data?.suppliers as Module2SupplierDeepDiveItem[]) || [];
    } catch (err) {
      logger.debug('Supplier Deep Dive fetch skipped or unavailable in current runtime', { err });
      return [];
    }
  }

  /**
   * Fetch Module 2 -> Module 4 Handoff Packages
   */
  public static async getHandoffPackages(
    assessmentId?: string
  ): Promise<Module2ToModule4HandoffPackage[]> {
    try {
      const path = this.appendQueryParams('/handoff', { assessmentId });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return (json.data?.packages as Module2ToModule4HandoffPackage[]) || [];
    } catch (err) {
      logger.debug('Handoff Packages fetch skipped or unavailable in current runtime', { err });
      return [];
    }
  }

  /**
   * Trigger Export of Audit Dossier
   */
  public static async exportAuditDossier(
    assessmentId?: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const path = this.appendQueryParams('/export', { assessmentId });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.data as Record<string, unknown>;
    } catch (err) {
      logger.debug('Export Sourcing Dossier fetch skipped or unavailable in current runtime', { err });
      return null;
    }
  }

  /**
   * Fetch Direct Price Improvement (Lever 1)
   */
  public static async getDirectPriceImprovement(
    assessmentId: string,
    options?: DirectPriceQueryOptions
  ): Promise<DirectPriceImprovementResult | null> {
    try {
      const path = this.appendQueryParams('/direct-price-improvement', {
        assessmentId,
        financialYear: options?.financialYear,
        materialCode: options?.materialCode,
        category: options?.category
      });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.data as DirectPriceImprovementResult;
    } catch (err) {
      logger.error('Failed to fetch Direct Price Improvement data', { assessmentId }, err);
      return null;
    }
  }

  /**
   * Fetch E-Auction / Dynamic Bidding Candidates (Lever 2)
   */
  public static async getEAuctionDynamicBidding(
    assessmentId: string,
    options?: EAuctionQueryOptions
  ): Promise<EAuctionResult | null> {
    try {
      const path = this.appendQueryParams('/e-auction', {
        assessmentId,
        financialYear: options?.financialYear,
        category: options?.category,
        suitability: options?.suitability,
        materialCode: options?.materialCode
      });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.data as EAuctionResult;
    } catch (err) {
      logger.error('Failed to fetch E-Auction dynamic bidding candidates', { assessmentId }, err);
      return null;
    }
  }

  /**
   * Fetch Vendor Base Consolidation Opportunities (Lever 3)
   */
  public static async getVendorConsolidation(
    assessmentId: string,
    options?: { category?: string; status?: string; materialCode?: string }
  ): Promise<VendorConsolidationResult | null> {
    try {
      const path = this.appendQueryParams('/vendor-consolidation', {
        assessmentId,
        category: options?.category,
        status: options?.status,
        materialCode: options?.materialCode
      });
      const url = this.getFullUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.data as VendorConsolidationResult;
    } catch (err) {
      logger.error('Failed to fetch Vendor Base Consolidation data', { assessmentId }, err);
      return null;
    }
  }

  /**
   * Get direct URL for Lever 1 Excel download
   */
  public static getDirectPriceExcelDownloadUrl(assessmentId: string, financialYear?: string): string {
    const path = this.appendQueryParams('/direct-price-improvement/export-excel', {
      assessmentId,
      financialYear: financialYear && financialYear !== 'ALL' ? financialYear : undefined
    });
    return this.getFullUrl(path);
  }

  /**
   * Get direct URL for Lever 2 Excel download
   */
  public static getEAuctionExcelDownloadUrl(assessmentId: string, financialYear?: string): string {
    const path = this.appendQueryParams('/e-auction/export-excel', {
      assessmentId,
      financialYear: financialYear && financialYear !== 'ALL' ? financialYear : undefined
    });
    return this.getFullUrl(path);
  }

  /**
   * Get direct URL for Lever 3 Excel download
   */
  public static getVendorConsolidationExcelDownloadUrl(assessmentId: string, category?: string): string {
    const path = this.appendQueryParams('/vendor-consolidation/export-excel', {
      assessmentId,
      category: category && category !== 'ALL' ? category : undefined
    });
    return this.getFullUrl(path);
  }
}


