import { describe, it, expect, beforeEach } from 'vitest';
import { Module2EAuctionAssumptionStore } from '../../src/services/module2EAuctionAssumptionStore';
import { DEFAULT_AUCTION_PLANNING_ASSUMPTIONS } from '../../src/constants/module2EAuction';

describe('Module2EAuctionAssumptionStore', () => {
  beforeEach(() => {
    Module2EAuctionAssumptionStore.resetToDefaults();
  });

  it('initializes with default approved assumptions', () => {
    const list = Module2EAuctionAssumptionStore.getAssumptions();
    expect(list.length).toBe(DEFAULT_AUCTION_PLANNING_ASSUMPTIONS.length);
    const packaging = Module2EAuctionAssumptionStore.getAssumptionForCategory('Packaging');
    expect(packaging).toBeDefined();
    expect(packaging?.categoryOrMaterial).toBe('Packaging');
    expect(packaging?.minSavingsRate).toBe(0.03);
    expect(packaging?.expectedSavingsRate).toBe(0.055);
    expect(packaging?.maxSavingsRate).toBe(0.09);
    expect(packaging?.approvalStatus).toBe('Proposed Planning Assumption — Approval Required');
  });

  it('matches partial category name and falls back to DEFAULT for unmapped category', () => {
    const partial = Module2EAuctionAssumptionStore.getAssumptionForCategory('Industrial Packaging Materials');
    expect(partial).toBeDefined();
    expect(partial?.categoryOrMaterial).toBe('Packaging');

    const fallback = Module2EAuctionAssumptionStore.getAssumptionForCategory('Exotic Specialty Mining Metal');
    expect(fallback).toBeDefined();
    expect(fallback?.categoryOrMaterial).toBe('DEFAULT');
    expect(fallback?.approvalStatus).toBe('Proposed Planning Assumption — Approval Required');
  });

  it('saves and updates an assumption correctly enforcing min <= expected <= max', () => {
    const updated = Module2EAuctionAssumptionStore.saveAssumption('AIC-2026-0002', {
      id: 'ASSUMP-PACKAGING',
      categoryOrMaterial: 'Packaging',
      rateSource: 'Historical Reverse Auction 2024-2025',
      referencePeriod: 'FY2024-25',
      applicability: 'All Packaging Items',
      minSavingsRate: 0.04,
      expectedSavingsRate: 0.07,
      maxSavingsRate: 0.11,
      approvalStatus: 'APPROVED',
      confidence: 'HIGH',
      isPlanningAssumptionOnly: true
    });

    const item = updated.find((a) => a.id === 'ASSUMP-PACKAGING');
    expect(item?.minSavingsRate).toBe(0.04);
    expect(item?.expectedSavingsRate).toBe(0.07);
    expect(item?.maxSavingsRate).toBe(0.11);

    const retrieved = Module2EAuctionAssumptionStore.getAssumptionForCategory('Packaging', 'AIC-2026-0002');
    expect(retrieved?.expectedSavingsRate).toBe(0.07);
  });

  it('throws an error if min rate exceeds expected or expected exceeds max', () => {
    expect(() => {
      Module2EAuctionAssumptionStore.saveAssumption('AIC-2026-0002', {
        id: 'INVALID-1',
        categoryOrMaterial: 'Test Cat',
        rateSource: 'Invalid rates',
        referencePeriod: 'FY2024-25',
        applicability: 'None',
        minSavingsRate: 0.10,
        expectedSavingsRate: 0.05, // less than min
        maxSavingsRate: 0.12,
        approvalStatus: 'APPROVED',
        confidence: 'LOW',
        isPlanningAssumptionOnly: true
      });
    }).toThrow(/min .* <= expected .* <= max/);

    expect(() => {
      Module2EAuctionAssumptionStore.saveAssumption('AIC-2026-0002', {
        id: 'INVALID-2',
        categoryOrMaterial: 'Test Cat',
        rateSource: 'Invalid rates',
        referencePeriod: 'FY2024-25',
        applicability: 'None',
        minSavingsRate: 0.05,
        expectedSavingsRate: 0.15,
        maxSavingsRate: 0.10, // less than expected
        approvalStatus: 'APPROVED',
        confidence: 'LOW',
        isPlanningAssumptionOnly: true
      });
    }).toThrow(/min .* <= expected .* <= max/);
  });
});
