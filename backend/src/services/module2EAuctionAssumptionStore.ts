/**
 * Module 2 — Lever 2: E-Auction / Dynamic Bidding Planning Assumption Store
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type { AuctionPlanningAssumption } from '../types/module2EAuction';
import { DEFAULT_AUCTION_PLANNING_ASSUMPTIONS } from '../constants/module2EAuction';

export class Module2EAuctionAssumptionStore {
  private static assumptionsMap: Map<string, AuctionPlanningAssumption[]> = new Map();

  public static getAssumptions(assessmentId?: string): AuctionPlanningAssumption[] {
    const key = assessmentId || 'GLOBAL';
    const list = this.assumptionsMap.get(key);
    if (!list) {
      const initial = DEFAULT_AUCTION_PLANNING_ASSUMPTIONS.map((a) => ({ ...a }));
      this.assumptionsMap.set(key, initial);
      return initial;
    }
    return list;
  }

  public static getAssumptionForCategory(
    categoryOrMaterial: string,
    assessmentId?: string
  ): AuctionPlanningAssumption | undefined {
    const list = this.getAssumptions(assessmentId);
    const catLower = categoryOrMaterial.toLowerCase();
    const exact = list.find(
      (a) => a.categoryOrMaterial.toLowerCase() === catLower
    );
    if (exact) return exact;
    const partial = list.find((a) => catLower.includes(a.categoryOrMaterial.toLowerCase()));
    if (partial) return partial;
    return list.find((a) => a.categoryOrMaterial === 'DEFAULT');
  }

  public static saveAssumption(
    assessmentId: string,
    assumption: AuctionPlanningAssumption
  ): AuctionPlanningAssumption[] {
    if (
      assumption.minSavingsRate > assumption.expectedSavingsRate ||
      assumption.expectedSavingsRate > assumption.maxSavingsRate
    ) {
      throw new Error(
        `Invalid savings rates: min (${assumption.minSavingsRate}) <= expected (${assumption.expectedSavingsRate}) <= max (${assumption.maxSavingsRate}) required`
      );
    }

    const key = assessmentId || 'GLOBAL';
    const current = this.getAssumptions(key);
    const existingIndex = current.findIndex(
      (a) =>
        a.id === assumption.id ||
        a.categoryOrMaterial.toLowerCase() === assumption.categoryOrMaterial.toLowerCase()
    );

    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...assumption };
    } else {
      current.push(assumption);
    }
    this.assumptionsMap.set(key, current);
    return current;
  }

  public static resetToDefault(assessmentId?: string): void {
    const key = assessmentId || 'GLOBAL';
    this.assumptionsMap.set(key, DEFAULT_AUCTION_PLANNING_ASSUMPTIONS.map((a) => ({ ...a })));
  }

  public static resetToDefaults(assessmentId?: string): void {
    this.resetToDefault(assessmentId);
  }
}
