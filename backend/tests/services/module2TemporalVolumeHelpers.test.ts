import { describe, it, expect } from 'vitest';
import {
  parseTransactionEpochMs,
  isVolatileCommodityCategory,
  evaluateRateOutlier,
  evaluateTemporalWindow,
  evaluateVolumeAttainability
} from '../../src/services/module2TemporalVolumeHelpers';

describe('Prompt 412 / Phase 3A.1: Module 2 Temporal, Volume & Outlier Helpers', () => {
  describe('parseTransactionEpochMs', () => {
    it('returns epoch ms for valid date strings', () => {
      const epoch = parseTransactionEpochMs('2023-05-15');
      expect(epoch).toBeTypeOf('number');
      expect(epoch).toBe(Date.parse('2023-05-15'));
    });

    it('returns null for undefined, empty, or invalid dates', () => {
      expect(parseTransactionEpochMs()).toBeNull();
      expect(parseTransactionEpochMs('')).toBeNull();
      expect(parseTransactionEpochMs('   ')).toBeNull();
      expect(parseTransactionEpochMs('N/A')).toBeNull();
      expect(parseTransactionEpochMs('UNKNOWN')).toBeNull();
      expect(parseTransactionEpochMs('not-a-date')).toBeNull();
      expect(parseTransactionEpochMs(123 as unknown as string)).toBeNull();
    });
  });

  describe('isVolatileCommodityCategory', () => {
    it('identifies volatile commodity keywords in category or description', () => {
      expect(isVolatileCommodityCategory('Fuel & Energy', 'Standard Delivery')).toBe(true);
      expect(isVolatileCommodityCategory('Direct Materials', 'High Speed Diesel 500L')).toBe(true);
      expect(isVolatileCommodityCategory('Petroleum Products', 'Grease')).toBe(true);
      expect(isVolatileCommodityCategory('General', 'Imported Thermal Coal')).toBe(true);
      expect(isVolatileCommodityCategory('Power Supply', 'Electric Meter')).toBe(true);
      expect(isVolatileCommodityCategory('Bulk Fuel', 'LDO Supply')).toBe(true);
      expect(isVolatileCommodityCategory('Utilities', 'Furnace Oil (FO)')).toBe(true);
      expect(isVolatileCommodityCategory('Raw Oil', 'Crude Extract')).toBe(true);
      expect(isVolatileCommodityCategory('Energy', 'Natural Gas')).toBe(true);
    });

    it('returns false for non-volatile standard categories', () => {
      expect(isVolatileCommodityCategory('Stationery', 'A4 Paper')).toBe(false);
      expect(isVolatileCommodityCategory('Fasteners', 'M8 Steel Bolt')).toBe(false);
      expect(isVolatileCommodityCategory()).toBe(false);
    });
  });

  describe('evaluateRateOutlier', () => {
    it('flags zero or negative unit price as placeholder', () => {
      expect(evaluateRateOutlier(0).isPlaceholder).toBe(true);
      expect(evaluateRateOutlier(-5).isPlaceholder).toBe(true);
      expect(evaluateRateOutlier(0).reason).toBe('ZERO_OR_NEGATIVE_RATE');
    });

    it('flags near-zero rate (<= 0.1) as placeholder on non-hardware commodities', () => {
      const result = evaluateRateOutlier(0.01, 'Structural Steel Beam', 'MT');
      expect(result.isPlaceholder).toBe(true);
      expect(result.reason).toContain('SUSPECTED_PLACEHOLDER_RATE');
    });

    it('permits near-zero rate (<= 0.1) for legitimate low-price hardware items', () => {
      const washerResult = evaluateRateOutlier(0.05, 'M4 Flat Washer', 'EA');
      expect(washerResult.isPlaceholder).toBe(false);
      expect(washerResult.reason).toBeNull();

      const pinResult = evaluateRateOutlier(0.08, 'Split Cotter Pin', 'NO');
      expect(pinResult.isPlaceholder).toBe(false);

      const rivetResult = evaluateRateOutlier(0.03, 'Aluminum Blind Rivet', 'PC');
      expect(rivetResult.isPlaceholder).toBe(false);

      const screwResult = evaluateRateOutlier(0.1, 'Small Tapping Screw', 'PCS');
      expect(screwResult.isPlaceholder).toBe(false);
    });

    it('detects rate outlier below 5% of median peer price when sufficient peers exist', () => {
      const peerPrices = [100, 105, 110, 102, 98]; // median ~102
      const outlier = evaluateRateOutlier(2.0, 'Heavy Duty Valve', 'EA', peerPrices);
      expect(outlier.isPlaceholder).toBe(true);
      expect(outlier.reason).toContain('RATE_OUTLIER_BELOW_PLAUSIBLE_RANGE');
    });

    it('passes normal rates when within plausible peer distribution', () => {
      const peerPrices = [100, 105, 110, 102, 98];
      const validRate = evaluateRateOutlier(85.0, 'Heavy Duty Valve', 'EA', peerPrices);
      expect(validRate.isPlaceholder).toBe(false);
      expect(validRate.reason).toBeNull();
    });

    it('ignores peer ratio check if peer prices count is below threshold', () => {
      const peerPrices = [100, 105]; // only 2 peers
      const result = evaluateRateOutlier(2.0, 'Custom Bracket', 'EA', peerPrices);
      expect(result.isPlaceholder).toBe(false);
    });

    it('ignores peer ratio check if peer prices are all near-zero', () => {
      const peerPrices = [0.05, 0.08];
      const result = evaluateRateOutlier(2.0, 'Special Pin', 'EA', peerPrices);
      expect(result.isPlaceholder).toBe(false);
    });
  });

  describe('evaluateTemporalWindow', () => {
    it('returns NOT_APPLICABLE if transaction date epoch is null', () => {
      const result = evaluateTemporalWindow(null, [Date.parse('2023-01-01')]);
      expect(result.status).toBe('NOT_APPLICABLE');
      expect(result.isWithinWindow).toBe(true);
    });

    it('returns INSIDE_WINDOW when peer transaction is within 90-day window', () => {
      const target = Date.parse('2023-04-10');
      const peer = Date.parse('2023-05-15'); // 35 days later
      const result = evaluateTemporalWindow(target, [peer], 90);
      expect(result.status).toBe('INSIDE_WINDOW');
      expect(result.isWithinWindow).toBe(true);
    });

    it('returns OUTSIDE_TEMPORAL_WINDOW when all peers are outside window', () => {
      const target = Date.parse('2023-04-10');
      const peer = Date.parse('2021-04-10'); // 730 days earlier
      const result = evaluateTemporalWindow(target, [peer], 90);
      expect(result.status).toBe('OUTSIDE_TEMPORAL_WINDOW');
      expect(result.isWithinWindow).toBe(false);
      expect(result.reason).toContain('90-day evaluation window');
    });
  });

  describe('evaluateVolumeAttainability', () => {
    it('returns NOT_APPLICABLE for zero or negative quantities', () => {
      expect(evaluateVolumeAttainability(0, 100).status).toBe('NOT_APPLICABLE');
      expect(evaluateVolumeAttainability(100, 0).status).toBe('NOT_APPLICABLE');
      expect(evaluateVolumeAttainability(-10, 100).status).toBe('NOT_APPLICABLE');
    });

    it('returns VOLUME_PARITY_VERIFIED when order scale ratio is within maxRatio', () => {
      const result = evaluateVolumeAttainability(1000, 1500, 3.0); // ratio 1.5x <= 3.0x
      expect(result.status).toBe('VOLUME_PARITY_VERIFIED');
      expect(result.isAttainable).toBe(true);
      expect(result.reason).toContain('is commercially comparable');
    });

    it('returns VOLUME_DISPARITY_UNVERIFIED when order scale difference exceeds maxRatio', () => {
      const result = evaluateVolumeAttainability(25, 50000, 3.0); // ratio 2000x > 3.0x
      expect(result.status).toBe('VOLUME_DISPARITY_UNVERIFIED');
      expect(result.isAttainable).toBe(false);
      expect(result.reason).toContain('volume-tier attainability unverified');
    });
  });
});
