/**
 * Authoritative FX Reference Master Constants
 */

import type { FxCoverageStatus } from '../types/fxReference';

export const AUTHORITATIVE_FX_MASTER_FILENAME = 'aiCEV_FX_Master_2020_2026_v2.xlsx';
export const EXPECTED_FX_MASTER_CHECKSUM = '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f';
export const FX_MASTER_VERSION = 'v2.0';
export const FX_MASTER_AS_OF_DATE = '2026-10-05';

export const CURRENCY_COVERAGE_STATUS_REGISTRY: Record<string, FxCoverageStatus> = {
  INR: 'FULL_DIRECT',
  USD: 'FULL_DIRECT',
  EUR: 'FULL_DIRECT',
  GBP: 'FULL_DIRECT',
  JPY: 'FULL_DIRECT',
  SGD: 'HIGH_COVERAGE_DERIVED',
  HKD: 'HIGH_COVERAGE_DERIVED',
  CNY: 'HIGH_COVERAGE_DERIVED',
  CHF: 'HIGH_COVERAGE_DERIVED',
  AUD: 'HIGH_COVERAGE_DERIVED',
  CAD: 'HIGH_COVERAGE_DERIVED',
  ZAR: 'HIGH_COVERAGE_DERIVED',
  BRL: 'HIGH_COVERAGE_DERIVED',
  MXN: 'HIGH_COVERAGE_DERIVED',
  NOK: 'HIGH_COVERAGE_DERIVED',
  SEK: 'HIGH_COVERAGE_DERIVED',
  DKK: 'HIGH_COVERAGE_DERIVED',
  TWD: 'HIGH_COVERAGE_DERIVED',
  AED: 'PARTIAL',
  SAR: 'PENDING_SOURCE',
  QAR: 'PENDING_SOURCE',
  OMR: 'PENDING_SOURCE',
  KWD: 'PENDING_SOURCE',
  BHD: 'PENDING_SOURCE'
};

export const APPROVED_SOURCE_NAMES: Record<string, string> = {
  'SRC-001': 'Federal Reserve Board H.10',
  'SRC-002': 'Federal Reserve H.10 / FRED',
  'SRC-003': 'RBI / FBIL Reference Rates',
  'SRC-004': 'European Central Bank (ECB)',
  'SRC-005': 'Bank of England (BoE)'
};
