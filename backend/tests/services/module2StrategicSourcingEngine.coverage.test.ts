/**
 * Coverage tests for Module2StrategicSourcingEngine.
 * Feeds realistic purchase lines for seven categories with different data quality so the analysis
 * summary sees every confidence level and evidence state. Null-field fallbacks use a spy that wraps
 * the real profile builder, because the real builder always returns numbers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { CategoryStrategicSourcingProfile } from '../../src/types/module2StrategicSourcing';
import { MODULE_2_SOURCING_VERSION } from '../../src/constants/module2StrategicSourcing';
import { Module2StrategicSourcingEngine } from '../../src/services/module2StrategicSourcingEngine';
import { Module2FragmentationHelper } from '../../src/services/module2FragmentationHelper';
import { logger } from '../../src/utils/logger';

interface PurchaseSpec {
  category: string;
  material: string;
  uom: string;
  po: string;
  date: string;
  vendor: string;
  qty: number;
  price: number;
}

function purchaseLine(spec: PurchaseSpec): StrategicInputTransaction {
  return {
    id: `TX-${spec.po}`,
    po_number: spec.po,
    po_date: spec.date,
    vendor_code: `V-${spec.vendor.slice(0, 4).toUpperCase().replace(/\s/g, '')}`,
    vendor_name: spec.vendor,
    material_desc: spec.material,
    quantity: spec.qty,
    uom: spec.uom,
    unit_price: spec.price,
    total_spend_inr: spec.qty * spec.price,
    currency: 'INR',
    spend_category: spec.category
  };
}

const steel = (po: string, date: string, vendor: string, qty: number, price: number): StrategicInputTransaction =>
  purchaseLine({
    category: 'Structural Steel',
    material: 'Carbon Steel Plate 10mm',
    uom: 'MT',
    po,
    date,
    vendor,
    qty,
    price
  });

// Five suppliers over six months, all comparable. The category should score HIGH confidence.
const STRUCTURAL_STEEL: StrategicInputTransaction[] = [
  steel('PO-2001', '2026-01-10', 'Tata Steel Ltd', 1000, 65000),
  steel('PO-2002', '2026-02-12', 'JSW Steel Ltd', 800, 60000),
  steel('PO-2003', '2026-03-15', 'Jindal Steel & Power', 600, 58000),
  steel('PO-2004', '2026-04-18', 'Steel Authority of India Ltd', 500, 59000),
  steel('PO-2005', '2026-05-20', 'Essar Steel Ltd', 700, 61000),
  steel('PO-2006', '2026-06-09', 'Tata Steel Ltd', 400, 62000)
];

// Two suppliers, two comparable lines, few active months. Expected MEDIUM confidence.
const INDUSTRIAL_FASTENERS: StrategicInputTransaction[] = [
  purchaseLine({
    category: 'Industrial Fasteners',
    material: 'M12 Hex Bolt',
    uom: 'EA',
    po: 'PO-3001',
    date: '2026-01-05',
    vendor: 'Fastener Co',
    qty: 5000,
    price: 12
  }),
  purchaseLine({
    category: 'Industrial Fasteners',
    material: 'M12 Hex Bolt',
    uom: 'EA',
    po: 'PO-3002',
    date: '2026-02-09',
    vendor: 'Bolt Works',
    qty: 4000,
    price: 13
  })
];

// A single comparable purchase. Expected LOW confidence.
const OFFICE_STATIONERY: StrategicInputTransaction[] = [
  purchaseLine({
    category: 'Office Stationery',
    material: 'A4 Copy Paper 80 GSM',
    uom: 'REAM',
    po: 'PO-4001',
    date: '2026-02-03',
    vendor: 'Paper Mills Pvt Ltd',
    qty: 10,
    price: 250
  })
];

// Lines with no quantity are excluded, so nothing is comparable. Expected INSUFFICIENT confidence.
const LAB_CONSUMABLES: StrategicInputTransaction[] = [
  purchaseLine({
    category: 'Lab Consumables',
    material: 'Borosilicate Glass Vial',
    uom: 'EA',
    po: 'PO-5001',
    date: '2026-03-01',
    vendor: 'Glass Supplies',
    qty: 0,
    price: 40
  }),
  purchaseLine({
    category: 'Lab Consumables',
    material: 'Pipette Tip 200 uL',
    uom: 'EA',
    po: 'PO-5002',
    date: '2026-03-04',
    vendor: 'Tip Traders',
    qty: 0,
    price: 15
  })
];

// A single-supplier specialist part. Not quantifiable, so no handoff is created.
const POWER_EQUIPMENT: StrategicInputTransaction[] = [
  purchaseLine({
    category: 'Power Equipment',
    material: 'Proprietary Turbine Blade Rotor',
    uom: 'SET',
    po: 'PO-6001',
    date: '2026-03-20',
    vendor: 'Monopoly OEM',
    qty: 5,
    price: 200000
  })
];

// Three suppliers in one month: four lines at 40 and a 5-unit spot order at 30. P25 equals P75, so the
// price band is not quantifiable. The weighted average (about 39.9) sits below the 40 reference, so no
// e-auction gap exists. Expected LOW_EVIDENCED_OPPORTUNITY.
const PACKAGING_CARTONS: StrategicInputTransaction[] = [
  purchaseLine({
    category: 'Corrugated Cartons',
    material: 'Export Carton 300x200x150',
    uom: 'EA',
    po: 'PO-7001',
    date: '2026-05-02',
    vendor: 'Pioneer Cartons',
    qty: 100,
    price: 40
  }),
  purchaseLine({
    category: 'Corrugated Cartons',
    material: 'Export Carton 300x200x150',
    uom: 'EA',
    po: 'PO-7002',
    date: '2026-05-09',
    vendor: 'Pioneer Cartons',
    qty: 100,
    price: 40
  }),
  purchaseLine({
    category: 'Corrugated Cartons',
    material: 'Export Carton 300x200x150',
    uom: 'EA',
    po: 'PO-7003',
    date: '2026-05-12',
    vendor: 'Mahavir Packaging',
    qty: 100,
    price: 40
  }),
  purchaseLine({
    category: 'Corrugated Cartons',
    material: 'Export Carton 300x200x150',
    uom: 'EA',
    po: 'PO-7004',
    date: '2026-05-20',
    vendor: 'Mahavir Packaging',
    qty: 100,
    price: 40
  }),
  purchaseLine({
    category: 'Corrugated Cartons',
    material: 'Export Carton 300x200x150',
    uom: 'EA',
    po: 'PO-7005',
    date: '2026-05-25',
    vendor: 'Local Carton Stores',
    qty: 5,
    price: 30
  })
];

// A one-off spot purchase at 900 (under 5% of spend) against core suppliers at 500 and 520. The
// spot price gives a positive consolidation gap of (900 - 500) x 10 units.
const INDUSTRIAL_VALVES: StrategicInputTransaction[] = [
  purchaseLine({
    category: 'Industrial Valves',
    material: 'DN50 Gate Valve',
    uom: 'EA',
    po: 'PO-8001',
    date: '2026-01-10',
    vendor: 'Kirloskar Valves',
    qty: 400,
    price: 500
  }),
  purchaseLine({
    category: 'Industrial Valves',
    material: 'DN50 Gate Valve',
    uom: 'EA',
    po: 'PO-8002',
    date: '2026-02-14',
    vendor: 'Kirloskar Valves',
    qty: 300,
    price: 500
  }),
  purchaseLine({
    category: 'Industrial Valves',
    material: 'DN50 Gate Valve',
    uom: 'EA',
    po: 'PO-8003',
    date: '2026-03-12',
    vendor: 'Audco India',
    qty: 200,
    price: 520
  }),
  purchaseLine({
    category: 'Industrial Valves',
    material: 'DN50 Gate Valve',
    uom: 'EA',
    po: 'PO-8004',
    date: '2026-04-08',
    vendor: 'Leader Valves',
    qty: 10,
    price: 900
  })
];

const ALL_LINES: StrategicInputTransaction[] = [
  ...STRUCTURAL_STEEL,
  ...INDUSTRIAL_FASTENERS,
  ...OFFICE_STATIONERY,
  ...LAB_CONSUMABLES,
  ...POWER_EQUIPMENT,
  ...PACKAGING_CARTONS,
  ...INDUSTRIAL_VALVES
];

function structuralProfile(): CategoryStrategicSourcingProfile {
  return Module2StrategicSourcingEngine.buildCategoryProfile('Structural Steel', STRUCTURAL_STEEL);
}

function withOverrides(
  base: CategoryStrategicSourcingProfile,
  overrides: Partial<CategoryStrategicSourcingProfile>
): CategoryStrategicSourcingProfile {
  return { ...base, ...overrides };
}

beforeEach(() => {
  // Keeps structured log output out of the test run. The logging test asserts on these calls.
  vi.spyOn(logger, 'info').mockImplementation((message, context) => logger.formatEntry('info', message, context));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Module2StrategicSourcingEngine.groupTransactionsByCategory', () => {
  it('groups lines by trimmed spend category', () => {
    const groups = Module2StrategicSourcingEngine.groupTransactionsByCategory([
      { ...STRUCTURAL_STEEL[0], spend_category: '  Structural Steel  ' },
      STRUCTURAL_STEEL[1]
    ]);

    expect([...groups.keys()]).toEqual(['Structural Steel']);
    expect(groups.get('Structural Steel')).toHaveLength(2);
  });

  it('falls back to UNSPSC commodity, then material description, then a generic label', () => {
    const groups = Module2StrategicSourcingEngine.groupTransactionsByCategory([
      {
        vendor_name: 'Bolt Works',
        material_desc: 'M12 Hex Bolt',
        unspsc_commodity: 'Industrial Bolts',
        quantity: 10,
        unit_price: 12,
        total_spend_inr: 120
      },
      {
        vendor_name: 'Gland Co',
        material_desc: 'Cable Gland PG16',
        quantity: 4,
        unit_price: 90,
        total_spend_inr: 360
      },
      {
        vendor_name: 'Unknown Vendor',
        material_desc: '',
        quantity: 2,
        unit_price: 50,
        total_spend_inr: 100
      }
    ]);

    expect([...groups.keys()].sort()).toEqual(['Cable Gland PG16', 'Industrial Bolts', 'Uncategorized']);
  });
});

describe('Module2StrategicSourcingEngine.calculateHHIAndFragmentation', () => {
  it('delegates to the fragmentation helper using the profile supplier structure', () => {
    const profile = structuralProfile();
    const result = Module2StrategicSourcingEngine.calculateHHIAndFragmentation(
      profile.suppliers,
      profile.totalSpendInr
    );

    const expected = Module2FragmentationHelper.calculateHHIAndFragmentation(profile.suppliers, profile.totalSpendInr);

    expect(result).toEqual(expected);
    expect(result.hhiScore).toBeGreaterThan(0);
  });
});

describe('Module2StrategicSourcingEngine.buildCategoryProfile', () => {
  it('keeps transaction-level evidence only when audit details are requested', () => {
    const detailed = Module2StrategicSourcingEngine.buildCategoryProfile('Structural Steel', STRUCTURAL_STEEL);
    const summary = Module2StrategicSourcingEngine.buildCategoryProfile('Structural Steel', STRUCTURAL_STEEL, false);

    expect(detailed.transactionEvidenceRecords).toHaveLength(STRUCTURAL_STEEL.length);
    expect(summary.transactionEvidenceRecords).toEqual([]);
    expect(summary.exclusionLedger).toEqual([]);
    expect(summary.totalSpendInr).toBe(detailed.totalSpendInr);
  });

  it('assigns HIGH confidence to a six-month, five-supplier category of comparable lines', () => {
    const profile = structuralProfile();

    expect(profile.dataConfidence).toBe('HIGH');
    expect(profile.activeMonthsCount).toBe(6);
    expect(profile.activeSuppliersCount).toBe(5);
  });
});

describe('Module2StrategicSourcingEngine.createHandoffPackage', () => {
  it('classifies an auction-only opportunity as an e-auction handoff', () => {
    const base = structuralProfile();
    const handoff = Module2StrategicSourcingEngine.createHandoffPackage(
      withOverrides(base, {
        potentialEAuctionOpportunityInr: 5000000,
        potentialVendorConsolidationOpportunityInr: 0,
        netQuantifiableOpportunityInr: 5000000,
        scorecard: { ...base.scorecard, recommendation: 'E_AUCTION_RECOMMENDED' }
      })
    );

    expect(handoff.opportunityType).toBe('E_AUCTION');
    expect(handoff.recommendedLever).toBe('E_AUCTION');
    expect(handoff.potentialOpportunityInr).toBe(5000000);
    expect(handoff.netOpportunityInr).toBe(5000000);
    expect(handoff.opportunityId).toBe(`OPP-${base.categoryId}`);
    expect(handoff.handoffId.startsWith(`HANDOFF-${base.categoryId}-`)).toBe(true);
    expect(handoff.calculationVersion).toBe(MODULE_2_SOURCING_VERSION);
    expect(handoff.auditSignature).toBe(`M2-${base.categoryId}-${base.calculationVersion}-5000000`);
  });

  it('classifies a consolidation-only opportunity as vendor consolidation with an RFQ recommendation', () => {
    const base = structuralProfile();
    const handoff = Module2StrategicSourcingEngine.createHandoffPackage(
      withOverrides(base, {
        potentialEAuctionOpportunityInr: 0,
        potentialVendorConsolidationOpportunityInr: 3000000,
        netQuantifiableOpportunityInr: 3000000,
        scorecard: { ...base.scorecard, recommendation: 'COMPETITIVE_RFQ_RECOMMENDED' }
      })
    );

    expect(handoff.opportunityType).toBe('VENDOR_CONSOLIDATION');
    expect(handoff.recommendedLever).toBe('VENDOR_CONSOLIDATION');
    expect(handoff.potentialOpportunityInr).toBe(3000000);
  });

  it('classifies mixed levers as combined strategic', () => {
    const base = structuralProfile();
    const handoff = Module2StrategicSourcingEngine.createHandoffPackage(
      withOverrides(base, {
        potentialEAuctionOpportunityInr: 5000000,
        potentialVendorConsolidationOpportunityInr: 3000000,
        netQuantifiableOpportunityInr: 6000000
      })
    );

    expect(handoff.opportunityType).toBe('COMBINED_STRATEGIC');
    expect(handoff.potentialOpportunityInr).toBe(8000000);
  });

  it('classifies a profile with no lever value as combined strategic', () => {
    const base = structuralProfile();
    const handoff = Module2StrategicSourcingEngine.createHandoffPackage(
      withOverrides(base, {
        potentialEAuctionOpportunityInr: 0,
        potentialVendorConsolidationOpportunityInr: 0
      })
    );

    expect(handoff.opportunityType).toBe('COMBINED_STRATEGIC');
  });

  it('uses zero for missing dispersion, reference price and net opportunity', () => {
    const base = structuralProfile();
    const handoff = Module2StrategicSourcingEngine.createHandoffPackage(
      withOverrides(base, {
        priceDispersion: null,
        credibleReference: { ...base.credibleReference, referencePrice: null },
        netQuantifiableOpportunityInr: null
      })
    );

    expect(handoff.baselineWeightedPrice).toBe(0);
    expect(handoff.referencePrice).toBe(0);
    expect(handoff.netOpportunityInr).toBe(0);
    expect(handoff.auditSignature).toBe(`M2-${base.categoryId}-${base.calculationVersion}-0`);
  });
});

describe('Module2StrategicSourcingEngine.analyze', () => {
  it('returns an empty analysis when no transactions are supplied', () => {
    const result = Module2StrategicSourcingEngine.analyze();

    expect(result.profiles).toEqual([]);
    expect(result.handoffPackages).toEqual([]);
    expect(result.summary.categoriesAnalyzedCount).toBe(0);
    expect(result.summary.overallDataConfidence).toBe('LOW');
    expect(result.summary.totalSpendAnalyzedInr).toBe(0);
  });

  it('profiles every category and creates handoffs only for quantifiable opportunities', () => {
    const result = Module2StrategicSourcingEngine.analyze(ALL_LINES);
    const quantifiable = result.profiles.filter(
      p => p.isQuantifiable && (p.netQuantifiableOpportunityInr ?? 0) > 0
    );

    expect(result.profiles).toHaveLength(7);
    expect(result.profiles[4].isQuantifiable).toBe(false);
    expect(result.handoffPackages.map(h => h.opportunityId)).toEqual(
      quantifiable.map(p => `OPP-${p.categoryId}`)
    );
  });

  it('reports HIGH overall confidence when any category reaches HIGH', () => {
    const result = Module2StrategicSourcingEngine.analyze(ALL_LINES);
    const confidences = result.profiles.map(p => p.dataConfidence);

    expect(confidences).toEqual(expect.arrayContaining(['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT']));
    expect(result.summary.overallDataConfidence).toBe('HIGH');
  });

  it('reports MEDIUM overall confidence when no category reaches HIGH', () => {
    const result = Module2StrategicSourcingEngine.analyze([
      ...INDUSTRIAL_FASTENERS,
      ...OFFICE_STATIONERY,
      ...LAB_CONSUMABLES
    ]);

    expect(result.profiles.map(p => p.dataConfidence)).toEqual(expect.arrayContaining(['MEDIUM']));
    expect(result.summary.overallDataConfidence).toBe('MEDIUM');
  });

  it('reports LOW overall confidence when only single-line or excluded categories exist', () => {
    const result = Module2StrategicSourcingEngine.analyze([...OFFICE_STATIONERY, ...LAB_CONSUMABLES]);

    expect(result.profiles.map(p => p.dataConfidence)).toEqual(['LOW', 'INSUFFICIENT']);
    expect(result.summary.overallDataConfidence).toBe('LOW');
  });

  it('counts evidence states and totals opportunities across categories', () => {
    const { profiles, summary } = Module2StrategicSourcingEngine.analyze(ALL_LINES);
    const total = (pick: (p: CategoryStrategicSourcingProfile) => number | null | undefined): number =>
      profiles.reduce((sum, p) => sum + (pick(p) ?? 0), 0);

    expect(summary.insufficientDataCount).toBeGreaterThan(0);
    expect(summary.lowEvidencedCount).toBeGreaterThan(0);
    expect(summary.consolidationCandidatesCount).toBeGreaterThan(0);
    expect(summary.insufficientDataCount).toBe(
      profiles.filter(p => p.evidenceState === 'INSUFFICIENT_DATA').length
    );
    expect(summary.lowEvidencedCount).toBe(
      profiles.filter(p => p.evidenceState === 'LOW_EVIDENCED_OPPORTUNITY').length
    );
    expect(summary.marketDiscoveryCandidatesCount).toBe(
      profiles.filter(p => p.marketDiscovery?.isMarketDiscoveryRequired).length
    );
    expect(summary.categoriesReadyForSourcingCount).toBe(
      profiles.filter(p => p.scorecard.overallScore >= 60 && p.isQuantifiable).length
    );
    expect(summary.opportunitiesNotYetQuantifiableCount).toBe(profiles.filter(p => !p.isQuantifiable).length);
    expect(summary.eauctionCandidatesCount).toBe(
      profiles.filter(p => (p.potentialEAuctionOpportunityInr ?? 0) > 0).length
    );
    expect(summary.consolidationCandidatesCount).toBe(
      profiles.filter(p => (p.potentialVendorConsolidationOpportunityInr ?? 0) > 0).length
    );
    expect(summary.totalSpendAnalyzedInr).toBe(Math.round(total(p => p.totalSpendInr)));
    expect(summary.totalPotentialEAuctionOpportunityInr).toBe(
      Math.round(total(p => p.potentialEAuctionOpportunityInr))
    );
    expect(summary.totalPotentialConsolidationOpportunityInr).toBe(
      Math.round(total(p => p.potentialVendorConsolidationOpportunityInr))
    );
    expect(summary.netQuantifiableOpportunityInr).toBe(Math.round(total(p => p.netQuantifiableOpportunityInr)));
    expect(summary.provenOpportunityInr).toBe(
      Math.round(total(p => (p.evidenceState === 'PROVEN_OPPORTUNITY' ? p.netQuantifiableOpportunityInr : 0)))
    );
  });

  it('treats absent opportunity amounts in a category profile as zero when totalling', () => {
    // The real builder never returns null amounts or a proven state without a net value. The spy adds
    // both so the defensive zero fallbacks in the summary and handoff logic are exercised.
    const realBuildCategoryProfile = Module2StrategicSourcingEngine.buildCategoryProfile;
    vi.spyOn(Module2StrategicSourcingEngine, 'buildCategoryProfile').mockImplementation(
      (categoryName, transactions, includeAuditDetails) => ({
        ...realBuildCategoryProfile(categoryName, transactions, includeAuditDetails),
        isQuantifiable: true,
        evidenceState: 'PROVEN_OPPORTUNITY',
        potentialEAuctionOpportunityInr: null,
        potentialVendorConsolidationOpportunityInr: null,
        volumeBundlingOpportunityInr: undefined,
        categorySpecialistOpportunityInr: undefined,
        netQuantifiableOpportunityInr: null
      })
    );

    const result = Module2StrategicSourcingEngine.analyze(STRUCTURAL_STEEL);

    expect(result.handoffPackages).toHaveLength(0);
    expect(result.summary.totalPotentialEAuctionOpportunityInr).toBe(0);
    expect(result.summary.totalPotentialConsolidationOpportunityInr).toBe(0);
    expect(result.summary.volumeBundlingQuantifiableBenefitInr).toBe(0);
    expect(result.summary.categorySpecialistOpportunityInr).toBe(0);
    expect(result.summary.netQuantifiableOpportunityInr).toBe(0);
    expect(result.summary.provenOpportunityInr).toBe(0);
    expect(result.summary.eauctionCandidatesCount).toBe(0);
    expect(result.summary.consolidationCandidatesCount).toBe(0);
  });

  it('logs the start and completion of an analysis with structured context', () => {
    const infoSpy = vi.mocked(logger.info);

    const result = Module2StrategicSourcingEngine.analyze(STRUCTURAL_STEEL);

    expect(infoSpy).toHaveBeenNthCalledWith(1, 'Module2StrategicSourcingEngine: Starting analysis', {
      transactionCount: STRUCTURAL_STEEL.length
    });
    expect(infoSpy).toHaveBeenNthCalledWith(2, 'Module2StrategicSourcingEngine: Completed analysis', {
      categoriesCount: 1,
      netOpportunityInr: expect.any(Number),
      handoffPackagesCount: result.handoffPackages.length
    });
  });
});
