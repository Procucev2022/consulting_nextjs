/**
 * Module 2 — Lever 1: Direct Price Improvement Constants
 * Strict separation of constants per Rule 8
 */

export const DIRECT_PRICE_CONFIG = {
  ENGINE_NAME: 'LEVER_1_DIRECT_PRICE_IMPROVEMENT_ENGINE',
  VERSION: '1.0.0',
  ALL_FINANCIAL_YEARS: 'ALL',
  DEFAULT_CURRENCY: 'INR',
  MIN_PEER_COUNT_FOR_OUTLIER: 3,
  SPEC_MISMATCH_PRICE_RATIO_THRESHOLD: 3.0,
  VOLUME_DISPARITY_RATIO_THRESHOLD: 3.0,
  CERTIFICATION_NOTICE: 'Historical Lost Opportunity (Observed Price Variance) • NOT YET CERTIFIED'
} as const;

export const DIRECT_PRICE_WARNINGS = {
  VOLATILE_COMMODITY_UOM: 'Volatile energy commodity measured in discrete unit (EA) lacking mass/GCV conversion evidence',
  VOLATILE_COMMODITY_GRADE: 'Volatile commodity lacking verified calorific value (GCV) grade matching and market indexation',
  SPEC_MISMATCH: 'Suspected specification mismatch: unit price >3.0x above benchmark on engineered item',
  SINGLE_SUPPLIER: 'Single supplier for item in financial year; no observed price variance',
  UNIFORM_PRICING: 'Uniform pricing across transactions; zero price variance observed'
} as const;

export const DIRECT_PRICE_EXCLUSION_REASONS = {
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  INVALID_RECORD: 'INVALID_RECORD',
  MISSING_MATERIAL_CODE: 'MISSING_MATERIAL_CODE',
  PLACEHOLDER_RATE: 'PLACEHOLDER_RATE'
} as const;
