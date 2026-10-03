/**
 * Module 2 Strategic Sourcing API Client
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 */

import type {
  CategoryStrategicSourcingProfile,
  Module2StrategicSourcingDashboardSummary,
  Module2ToModule4HandoffPackage
} from '../types/module2StrategicSourcing';
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
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${this.baseUrl}${path}`;
    }
    return `http://localhost:5000${this.baseUrl}${path}`;
  }

  /**
   * Fetch 10 KPI Dashboard Summary
   */
  public static async getDashboardSummary(refresh = false): Promise<Module2StrategicSourcingDashboardSummary | null> {
    try {
      const url = this.getFullUrl(`/dashboard${refresh ? '?refresh=true' : ''}`);
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
  public static async getCategoryProfiles(refresh = false): Promise<CategoryStrategicSourcingProfile[]> {
    try {
      const url = this.getFullUrl(`/categories${refresh ? '?refresh=true' : ''}`);
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
  public static async getCategoryProfileById(id: string): Promise<CategoryStrategicSourcingProfile | null> {
    try {
      const url = this.getFullUrl(`/category/${encodeURIComponent(id)}`);
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
  public static async getSupplierDeepDive(): Promise<Module2SupplierDeepDiveItem[]> {
    try {
      const url = this.getFullUrl('/suppliers');
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
  public static async getHandoffPackages(): Promise<Module2ToModule4HandoffPackage[]> {
    try {
      const url = this.getFullUrl('/handoff');
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
  public static async exportAuditDossier(): Promise<Record<string, unknown> | null> {
    try {
      const url = this.getFullUrl('/export');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json.data as Record<string, unknown>;
    } catch (err) {
      logger.debug('Export Sourcing Dossier fetch skipped or unavailable in current runtime', { err });
      return null;
    }
  }
}
