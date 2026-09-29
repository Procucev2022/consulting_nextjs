/**
 * Module 2 — Audit Dossier & Scenario Helpers Unit Tests
 * Version: MODULE_2_EVALUATION_V1.0
 */

import { describe, it, expect } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { CategoryStrategicSourcingProfile } from '../../src/types/module2StrategicSourcing';
import { Module2AuditDossierHelper } from '../../src/services/module2AuditDossierHelper';
import { Module2ScenarioAuditHelper } from '../../src/services/module2ScenarioAuditHelper';

describe('Module 2 Audit Dossier & Scenario Helpers', () => {
  const sampleTransactions: StrategicInputTransaction[] = [
    {
      id: 'TX-101',
      po_number: 'PO-9001',
      po_date: '2026-02-01',
      vendor_code: 'SUPP-A',
      vendor_name: 'Supplier Alpha',
      material_code: 'MAT-ST-01',
      material_desc: 'Carbon Steel Plate',
      quantity: 500,
      uom: 'MT',
      unit_price: 60000,
      total_spend_inr: 30000000,
      currency: 'INR',
      spend_category: 'Metals'
    },
    {
      id: 'TX-102',
      po_number: 'PO-9002',
      po_date: '2026-02-05',
      vendor_code: 'SUPP-B',
      vendor_name: 'Supplier Beta',
      material_code: 'MAT-ST-01',
      material_desc: 'Carbon Steel Plate',
      quantity: 400,
      uom: 'MT',
      unit_price: 55000,
      total_spend_inr: 22000000,
      currency: 'INR',
      spend_category: 'Metals'
    },
    {
      id: 'TX-103',
      po_number: 'PO-9003',
      po_date: '2026-02-10',
      vendor_code: 'SUPP-C',
      vendor_name: 'Supplier Gamma',
      material_code: 'MAT-ST-01',
      material_desc: 'Carbon Steel Plate',
      quantity: 200,
      uom: 'MT',
      unit_price: 54000,
      total_spend_inr: 10800000,
      currency: 'INR',
      spend_category: 'Metals'
    },
    {
      id: 'TX-104_INVALID',
      po_number: 'PO-9004',
      po_date: '2026-02-12',
      vendor_code: 'SUPP-D',
      vendor_name: '',
      material_code: '',
      material_desc: '',
      quantity: 0,
      unit_price: -10,
      total_spend_inr: -500,
      currency: 'USD',
      spend_category: ''
    },
    {
      id: 'TX-104_INVALID', // duplicate id
      po_number: 'PO-9004',
      po_date: '2026-02-12',
      vendor_code: 'SUPP-D',
      vendor_name: 'Supplier Delta',
      material_code: '',
      material_desc: 'Misc Part',
      quantity: 10,
      unit_price: 50,
      total_spend_inr: 500,
      currency: 'INR',
      spend_category: 'Metals'
    }
  ];

  const sampleProfile: CategoryStrategicSourcingProfile = {
    categoryId: 'CAT-METALS',
    categoryName: 'Metals',
    totalSpendInr: 62800000,
    totalSpendInrCr: 6.28,
    activeSuppliersCount: 3,
    addressableSpendInr: 62800000,
    addressableSpendInrCr: 6.28,
    addressableQuantity: 1100,
    primaryUom: 'MT',
    priceDispersion: {
      minPrice: 54000,
      maxPrice: 60000,
      medianPrice: 55000,
      weightedAveragePrice: 57090.9,
      p25Price: 54500,
      p75Price: 57500,
      priceSpreadInr: 6000,
      priceSpreadPct: 11.1,
      coefficientOfVariation: 0.05
    },
    credibleReference: {
      referencePrice: 54000,
      referenceSupplierName: 'Supplier Gamma',
      referenceSupplierId: 'SUPP-C',
      ruleApplied: 'LOWEST_CREDIBLE_PRICE',
      volumeSharePct: 18.2,
      priceDifferenceInr: 3090.9,
      priceDifferencePct: 5.4,
      isCredible: true
    },
    potentialEAuctionOpportunityInr: 3400000,
    potentialVendorConsolidationOpportunityInr: 2500000,
    overlappingOpportunityInr: 2500000,
    netQuantifiableOpportunityInr: 3400000,
    netQuantifiableOpportunityInrCr: 0.34,
    opportunityRangeMaxInr: 4500000,
    isQuantifiable: true,
    dataConfidence: 'HIGH',
    evidenceTransactionIds: ['TX-101', 'TX-102', 'TX-103'],
    scorecard: {
      overallScore: 82,
      recommendation: 'E_AUCTION_RECOMMENDED',
      rationale: 'High supplier liquidity and price dispersion.'
    }
  } as unknown as CategoryStrategicSourcingProfile;

  it('generates customer data integrity audit accurately with invalid and edge cases', () => {
    const audit = Module2AuditDossierHelper.generateCustomerDataIntegrityAudit(sampleTransactions);

    expect(audit.totalInputTransactions).toBe(5);
    expect(audit.totalAnalyzedTransactions).toBe(4);
    expect(audit.totalExcludedTransactions).toBe(1);
    expect(audit.integrityChecks.zeroQuantitiesFound).toBe(1);
    expect(audit.integrityChecks.invalidPricesFound).toBe(1);
    expect(audit.integrityChecks.negativeValuesFound).toBe(1);
    expect(audit.integrityChecks.missingValuesFound).toBe(1);
    expect(audit.integrityChecks.inconsistentCurrenciesFound).toBe(1);
    expect(audit.integrityChecks.duplicateTransactionsFound).toBe(1);
    expect(audit.exclusionReasonByTransaction['TX-104_INVALID']).toBeDefined();
    expect(audit.exclusionReasonByTransaction['TX-104_INVALID'].exclusionCode).toBe('EXCLUDED_INVALID_TRANSACTION');
  });

  it('generates waterfall transaction allocations for e-auction and consolidation pools', () => {
    const allocationsEauct = Module2AuditDossierHelper.generateWaterfallTransactionAllocations(
      sampleProfile,
      sampleTransactions
    );

    expect(allocationsEauct.length).toBe(5);
    const sumAllocated = allocationsEauct.reduce((acc, a) => acc + a.allocatedValueInr, 0);
    expect(Math.abs(sumAllocated - (sampleProfile.netQuantifiableOpportunityInr || 0))).toBeLessThanOrEqual(5);

    // Profile with only vendor consolidation
    const consolProfile = {
      ...sampleProfile,
      potentialEAuctionOpportunityInr: 0,
      netQuantifiableOpportunityInr: 2500000,
      scorecard: {
        overallScore: 70,
        recommendation: 'VENDOR_CONSOLIDATION_RECOMMENDED',
        rationale: 'Fragmented tail spend'
      },
      opportunityRangeMaxInr: 0
    } as unknown as CategoryStrategicSourcingProfile;

    const allocationsConsol = Module2AuditDossierHelper.generateWaterfallTransactionAllocations(
      consolProfile,
      sampleTransactions
    );
    expect(allocationsConsol.some(a => a.waterfallStage === 'VENDOR_CONSOLIDATION')).toBe(true);

    const cfoConsol = Module2AuditDossierHelper.generateCFOChallengeResponse(
      consolProfile,
      sampleTransactions
    );
    expect(cfoConsol.q12_requiredOperationalAction).toContain('volume consolidation master agreement');
    expect(cfoConsol.q10_requiresFutureValidationPortionInr).toBe(0);
  });

  it('generates complete 14-question CFO challenge response', () => {
    const cfo = Module2AuditDossierHelper.generateCFOChallengeResponse(
      sampleProfile,
      sampleTransactions
    );

    expect(cfo.opportunityId).toBe('OPP-CAT-METALS');
    expect(cfo.q1_whyExists).toContain('Identified');
    expect(cfo.q2_provingTransactions.length).toBeGreaterThan(0);
    expect(cfo.q3_opportunitySuppliers).toContain('Supplier Alpha');
    expect(cfo.q4_referencePrice).toBe(54000);
    expect(cfo.q5_whyReferenceCredible).toContain('lowest credible');
    expect(cfo.q6_assumptionsMade.length).toBe(3);
    expect(cfo.q7_assumptionsNotMade.length).toBe(3);
    expect(cfo.q8_addressableSpendInr).toBe(62800000);
    expect(cfo.q9_demonstratedHistoricalPortionInr).toBe(3400000);
    expect(cfo.q10_requiresFutureValidationPortionInr).toBe(1100000);
    expect(cfo.q11_doubleCountingProtection).toContain('Single highest-yield');
    expect(cfo.q12_requiredOperationalAction).toContain('reverse e-auction');
    expect(cfo.q13_realizationRisks.length).toBe(3);
    expect(cfo.q14_evidenceThatWouldChangeConclusion.length).toBe(3);
  });

  it('generates vendor consolidation scenarios with varying supplier counts', () => {
    const suppliers = [
      { supplierName: 'Supplier Alpha', spendInr: 30000000, volume: 500 },
      { supplierName: 'Supplier Beta', spendInr: 22000000, volume: 400 },
      { supplierName: 'Supplier Gamma', spendInr: 10800000, volume: 200 }
    ];

    const consolScenarios = Module2ScenarioAuditHelper.generateVendorConsolidationScenarios(
      sampleProfile,
      suppliers
    );

    expect(consolScenarios.categoryId).toBe('CAT-METALS');
    expect(consolScenarios.scenarios.length).toBe(4);
    expect(consolScenarios.scenarios[0].scenarioName).toBe('CURRENT_STATE');
    expect(consolScenarios.scenarios[0].opportunityRangeInr.base).toBe(0);
    expect(consolScenarios.scenarios[1].scenarioName).toBe('SCENARIO_A');
    expect(consolScenarios.scenarios[2].scenarioName).toBe('SCENARIO_B');
    expect(consolScenarios.scenarios[3].scenarioName).toBe('SCENARIO_C');
    expect(consolScenarios.scenarios[3].opportunityRangeInr.base).toBe(2500000);
  });

  it('generates e-auction audit dossier items covering all suitability branches', () => {
    const p1 = sampleProfile; // AUCTION_ELIGIBLE (3 suppliers, disp 0.05, quantifiable)
    const p2 = {
      ...sampleProfile,
      categoryId: 'CAT-2',
      activeSuppliersCount: 2,
      priceDispersion: { coefficientOfVariation: 0.04 }
    } as unknown as CategoryStrategicSourcingProfile; // AUCTION_POTENTIAL_REQUIRES_VALIDATION
    const p3 = {
      ...sampleProfile,
      categoryId: 'CAT-3',
      activeSuppliersCount: 1,
      priceDispersion: { coefficientOfVariation: 0 }
    } as unknown as CategoryStrategicSourcingProfile; // AUCTION_NOT_ELIGIBLE

    const dossier = Module2ScenarioAuditHelper.generateEAuctionAuditDossier([p1, p2, p3]);

    expect(dossier.length).toBe(3);
    expect(dossier[0].auctionSuitability).toBe('AUCTION_ELIGIBLE');
    expect(dossier[1].auctionSuitability).toBe('AUCTION_POTENTIAL_REQUIRES_VALIDATION');
    expect(dossier[2].auctionSuitability).toBe('AUCTION_NOT_ELIGIBLE');
  });

  it('generates no-fabrication scenario audit items proving zero phantom savings', () => {
    const noFab = Module2ScenarioAuditHelper.generateNoFabricationAudit();

    expect(noFab.length).toBe(5);
    for (const item of noFab) {
      expect(item.fabricatedSavingsDetected).toBe(false);
      expect(item.savingsClaimedInr).toBe(0);
      expect(item.pass).toBe(true);
    }
  });

  it('generates double-counting dossier items with full reconciliation', () => {
    const doubleCounting = Module2ScenarioAuditHelper.generateDoubleCountingDossier([sampleProfile]);

    expect(doubleCounting.length).toBe(1);
    expect(doubleCounting[0].reconciled).toBe(true);
    expect(doubleCounting[0].grossIdentifiedOpportunityInr).toBe(5900000);
    expect(doubleCounting[0].overlappingOpportunityInr).toBe(2500000);
    expect(doubleCounting[0].netDefensibleOpportunityInr).toBe(3400000);
  });
});
