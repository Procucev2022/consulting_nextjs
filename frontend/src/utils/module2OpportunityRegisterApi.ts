/**
 * Module 2 — Stage 2: Opportunity Register API Client
 * Compliant with Repository Rules: max 300 lines, cyclomatic complexity <= 10, max line length 120 chars
 */

import type {
  OpportunityRegisterResult,
  OpportunityRegisterSummary,
  OpportunityRegisterQueryOptions
} from '../types/module2OpportunityRegister';
import { logger } from './logger';

export class Module2OpportunityRegisterApi {
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
    const qs = searchParams.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  public static async getOpportunityRegister(
    options: OpportunityRegisterQueryOptions
  ): Promise<OpportunityRegisterResult | null> {
    try {
      const path = this.appendQueryParams('/opportunity-register', {
        assessmentId: options.assessmentId,
        type: options.type,
        status: options.status,
        category: options.category,
        search: options.search
      });
      const res = await fetch(this.getFullUrl(path));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch Opportunity Register`);
      }
      const json = await res.json();
      return json.data as OpportunityRegisterResult;
    } catch (err) {
      logger.error('Error fetching Opportunity Register', { options }, err);
      return null;
    }
  }

  public static async getExecutiveDashboard(
    assessmentId: string
  ): Promise<{ summary: OpportunityRegisterSummary; customerName: string } | null> {
    try {
      const path = this.appendQueryParams('/executive-dashboard', { assessmentId });
      const res = await fetch(this.getFullUrl(path));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch Executive Dashboard`);
      }
      const json = await res.json();
      return {
        summary: json.data?.summary as OpportunityRegisterSummary,
        customerName: json.data?.customerName || 'Borosil Ltd'
      };
    } catch (err) {
      logger.error('Error fetching Executive Dashboard', { assessmentId }, err);
      return null;
    }
  }

  public static getExportCsvUrl(assessmentId: string): string {
    const path = this.appendQueryParams('/opportunity-register/export-csv', { assessmentId });
    return this.getFullUrl(path);
  }
}
