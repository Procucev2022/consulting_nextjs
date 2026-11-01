/**
 * Module 3 PCBI — Authoritative Borosil Commodity Benchmark Resolver
 * Strict Rule 8 (constants isolation), Rule 9 (strongly typed), Rule 21 (max-lines <= 300).
 */

import type { BorosilCommodityResolution } from '../types/module3CommodityResolver';
import { UI_STRINGS } from './uiStrings';
import { BOROSIL_COMMODITY_CATALOG_PART_A } from './module3CommodityCatalogA';
import { BOROSIL_COMMODITY_CATALOG_PART_B } from './module3CommodityCatalogB';

const c = UI_STRINGS.module3.commodities;

export const BOROSIL_COMMODITY_MAPPINGS: Record<string, BorosilCommodityResolution> = {
  ...BOROSIL_COMMODITY_CATALOG_PART_A,
  ...BOROSIL_COMMODITY_CATALOG_PART_B
};

export function resolveBorosilCommodity(selectedCommodity: string): BorosilCommodityResolution {
  if (BOROSIL_COMMODITY_MAPPINGS[selectedCommodity]) {
    return BOROSIL_COMMODITY_MAPPINGS[selectedCommodity];
  }
  // Fallback to primary dense soda ash
  return BOROSIL_COMMODITY_MAPPINGS[c.sodaAsh];
}
