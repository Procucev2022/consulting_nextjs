import { MODULE2_D1_SCOPED_MESSAGES } from '../constants/module2D1Scoped';
import {
  alternateSourcingQuerySchema, directPriceQuerySchema, eAuctionQuerySchema, vendorConsolidationQuerySchema
} from '../constants/validation';
import type { ScopedModule2FilterOptions } from '../types/module2D1ScopedRoutes';

export const validateScopedModule2Filters = (
  path: string, url: URL
): ScopedModule2FilterOptions => {
  const filters: ScopedModule2FilterOptions = { eauctionOptions: {}, directPriceOptions: {} };
  const query = Object.fromEntries(url.searchParams.entries());
  if (path.startsWith('/e-auction')) {
    const parsed = eAuctionQuerySchema.safeParse(query);
    if (!parsed.success) {
      filters.error = { status: 400, data: {
        success: false, message: MODULE2_D1_SCOPED_MESSAGES.invalidEAuctionFilter,
        errors: parsed.error.issues
      } };
    } else filters.eauctionOptions = parsed.data;
  }
  if (path.startsWith('/direct-price-improvement')) {
    const parsed = directPriceQuerySchema.safeParse(query);
    if (!parsed.success) {
      filters.error = { status: 400, data: {
        success: false, message: MODULE2_D1_SCOPED_MESSAGES.invalidDirectPriceFilter,
        errors: parsed.error.issues
      } };
    } else filters.directPriceOptions = parsed.data;
  }
  if (path.startsWith('/vendor-consolidation')) {
    const parsed = vendorConsolidationQuerySchema.safeParse(query);
    if (!parsed.success) {
      filters.error = { status: 400, data: {
        success: false, message: MODULE2_D1_SCOPED_MESSAGES.invalidVendorConsolidationFilter,
        errors: parsed.error.issues
      } };
    } else filters.vendorConsolidationOptions = parsed.data;
  }
  if (path.startsWith('/alternate-sourcing')) {
    const parsed = alternateSourcingQuerySchema.safeParse(query);
    if (!parsed.success) {
      filters.error = { status: 400, data: {
        success: false, message: MODULE2_D1_SCOPED_MESSAGES.invalidAlternateSourcingFilter,
        errors: parsed.error.issues
      } };
    } else filters.alternateSourcingOptions = parsed.data;
  }
  return filters;
};
