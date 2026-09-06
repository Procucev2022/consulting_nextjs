/**
 * Pipeline & Analytics Constants Module (Frontend)
 */

export const TIMELINE_MONTHS = [
  'M1 (Q1-23)', 'M4', 'M8 (Q3-23)', 'M12 (Q4-23)',
  'M16 (Q2-24)', 'M20', 'M24 (Q4-24)', 'M28 (Q2-25)',
  'M32 (Q4-25)', 'M36 (Q2-26)'
] as const;

export const MARKET_INDEX_DATA = [100, 99.2, 98.4, 97.1, 96.5, 95.8, 96.2, 95.0, 96.1, 95.8] as const;

export const VENDOR_INVOICED_DATA = [100, 101.5, 102.8, 104.2, 105.1, 106.0, 106.8, 107.5, 108.0, 108.5] as const;
