/**
 * Borosil Commercial Scenarios and Transformation Constants
 * Authoritative models for Part 2 and Part 3.
 * Rule 8: Constants isolation; Rule 9: Strongly typed; max lines <= 300, complexity <= 10.
 */

import type { CommercialScenarioItem } from '../types/borosilCommercialScenarios';

export { PROCUCEV_CALCULATION_MECHANISMS } from './borosilCalculationMechanisms';

export const BOROSIL_COMMERCIAL_SCENARIOS: CommercialScenarioItem[] = [
  {
    scenarioId: 'SCEN-L1-A',
    leverNumber: 1,
    leverName: 'Direct Price Improvement',
    scenarioName: 'Cross-Plant Price Harmonization (Chemicals)',
    scenarioLabel: 'Scenario A',
    category: 'Chemicals & Raw Materials',
    eligibleSpendInr: 0,
    eligibleSpendCr: 0,
    currentSituation: 'Material Group 11100 is procured 100% at Plant 1120 (Bharuch); zero chemical POs exist at Jaipur (6101/8202). Cross-plant rate variance premise is factually unsupported.',
    proposedSourcingIntervention: 'Conduct comprehensive multi-plant audit across non-chemical categories; maintain single-plant volume contracting for Bharuch.',
    calculationFormula: 'Spend × Harmonization Delta % (Unquantified)',
    conservativeCase: {
      improvementPct: 0,
      financialOutcomeInr: 0,
      financialOutcomeCr: 0,
      description: 'Unquantified: 0 multi-plant chemical purchase orders in SAP master.'
    },
    higherAchievementCase: {
      improvementPct: 0,
      financialOutcomeInr: 0,
      financialOutcomeCr: 0,
      description: 'Unquantified: requires unified inter-plant requisition framework.'
    },
    commercialDependencies: ['Plant QA parity sign-off', 'Supplier multi-plant delivery capacity'],
    implementationTimeline: 'Under Evaluation',
    validationRequirements: ['Multi-plant PO audit', 'Engineering confirmation'],
    sourceTransactionReferences: ['CAT-11100', 'PLANT-1120-EXCLUSIVE'],
    supplierEvidence: 'SAP master confirms 100% of chemical spend is booked in Plant 1120',
    assumptionStatus: 'Unquantified — Single-Plant Requisition Precludes Cross-Plant Harmonization',
    validationStatus: 'UNQUANTIFIED'
  },
  {
    scenarioId: 'SCEN-L1-B',
    leverNumber: 1,
    leverName: 'Direct Price Improvement',
    scenarioName: 'Direct Manufacturer Annual Formula-Based Contracting',
    scenarioLabel: 'Scenario B',
    category: 'Dense Soda Ash & Primary Feedstocks',
    eligibleSpendInr: 740170000,
    eligibleSpendCr: 74.017,
    currentSituation: 'Borosil already buys 100% directly from primary manufacturers GHCL (100SA02G: ₹58.117 Cr, 19,600 MT) and RSPL (100SA01T: ₹15.900 Cr, 6,500 MT) at Plant 1120.',
    proposedSourcingIntervention: 'Execute unified annual volume allocation contracts with quarterly formula pricing linked to domestic ex-works indices without distributor intermediaries.',
    calculationFormula: 'Annual Volume Spend × Formula-Based Negotiation %',
    conservativeCase: {
      improvementPct: 3.0,
      financialOutcomeInr: 22205100,
      financialOutcomeCr: 2.221,
      description: 'Conservative 3.0% negotiation gain via annual volume allocation commitment.'
    },
    higherAchievementCase: {
      improvementPct: 5.0,
      financialOutcomeInr: 37008500,
      financialOutcomeCr: 3.701,
      description: 'Higher achievement 5.0% with combined GHCL/RSPL multi-quarter index formula.'
    },
    commercialDependencies: ['Primary producer quota allocation', 'Silo pneumatic intake readiness at Bharuch'],
    implementationTimeline: 'Months 1–3 (Wave 1 Execution)',
    validationRequirements: ['Formal manufacturer quote receipt', 'Furnace melt composition sign-off'],
    sourceTransactionReferences: ['100SA02G-GHCL', '100SA01T-RSPL', 'PO-7300000123', 'PO-7300000142'],
    supplierEvidence: 'SAP PO lines 7300000123/10-30, 7300000142/10 confirm direct manufacturer billing',
    assumptionStatus: 'Hypothetical Sensitivity Scenario — Excluded from Authoritative Ledger',
    validationStatus: 'RE_ESTABLISHED_HYPOTHETICAL'
  },
  {
    scenarioId: 'SCEN-L2-A',
    leverNumber: 2,
    leverName: 'Vendor Consolidation',
    scenarioName: 'Spares & Hardware Consolidation (Governance Reserve)',
    scenarioLabel: 'Scenario A',
    category: 'Mechanical & Electrical Spares',
    eligibleSpendInr: 2169992,
    eligibleSpendCr: 0.217,
    currentSituation: 'Material Groups 11524 and 11548 represent ₹5.9678 Cr active net category spend (919 active lines). Module 2 qualified package spend is ₹0.2170 Cr across 195 comparable transactions.',
    proposedSourcingIntervention: 'Consolidate fragmented tail suppliers into preferred authorized distributor panels with standardized rate cards and catalog buying.',
    calculationFormula: 'Qualified Package Spend × Consolidation Efficiency %',
    conservativeCase: {
      improvementPct: 4.0,
      financialOutcomeInr: 86800,
      financialOutcomeCr: 0.009,
      description: 'Conservative 4.0% gain across qualified comparable spares lines (₹0.2170 Cr).'
    },
    higherAchievementCase: {
      improvementPct: 7.5,
      financialOutcomeInr: 162749,
      financialOutcomeCr: 0.016,
      description: 'Higher achievement 7.5% across qualified comparable spares lines.'
    },
    commercialDependencies: ['Maintenance engineering approval of distributor brands', 'SLA definition'],
    implementationTimeline: 'Months 6–12 (Wave 3 Execution)',
    validationRequirements: ['Brand compatibility audit', 'Store rationalization sign-off'],
    sourceTransactionReferences: ['CAT-11524', 'CAT-11548', 'BOROSIL_SCEN_L2A_SPARES_REGISTER'],
    supplierEvidence: '195 comparable transactions audited in standalone L2-A register (556 KB)',
    assumptionStatus: '100% Quarantined in Governance Reserve — Zero Recognition in Financial Plan',
    validationStatus: 'HELD_IN_GOVERNANCE_RESERVE'
  },
  {
    scenarioId: 'SCEN-L2-B',
    leverNumber: 2,
    leverName: 'Vendor Consolidation',
    scenarioName: 'Preferred Supplier Panel (Material Group 11525)',
    scenarioLabel: 'Scenario B',
    category: 'Plant Consumables & Lab Supplies',
    eligibleSpendInr: 0,
    eligibleSpendCr: 0,
    currentSituation: 'Material Group 11525 contains 0 rows and ₹0 spend in Borosil SAP master. Previous ₹6.871 Cr claim was unverified.',
    proposedSourcingIntervention: 'Map consumables to active SAP material groups before initiating catalog consolidation.',
    calculationFormula: 'Spend × Consolidation % (Unquantified)',
    conservativeCase: {
      improvementPct: 0,
      financialOutcomeInr: 0,
      financialOutcomeCr: 0,
      description: 'Unquantified: Material Group 11525 contains 0 records in SAP database.'
    },
    higherAchievementCase: {
      improvementPct: 0,
      financialOutcomeInr: 0,
      financialOutcomeCr: 0,
      description: 'Unquantified: requires re-mapping of indirect consumables.'
    },
    commercialDependencies: ['Catalog taxonomy re-classification'],
    implementationTimeline: 'Under Evaluation',
    validationRequirements: ['SAP material group verification'],
    sourceTransactionReferences: ['CAT-11525-ABSENT'],
    supplierEvidence: 'SAP master audit confirms zero transactions in group 11525',
    assumptionStatus: 'Unquantified — Material Group 11525 Not Found in Database',
    validationStatus: 'UNQUANTIFIED'
  },
  {
    scenarioId: 'SCEN-L3-A',
    leverNumber: 3,
    leverName: 'Reverse E-Auction',
    scenarioName: 'Corrugated Packaging Reverse E-Auction Price Discovery',
    scenarioLabel: 'Scenario A',
    category: 'Corrugated Packaging & Cartons',
    eligibleSpendInr: 21047046,
    eligibleSpendCr: 2.105,
    currentSituation: 'Material Group 11300 has ₹27.1472 Cr active spend. Package CAT-11300 qualified spend is ₹2.1047 Cr (637 lines). Previous ₹4.9718 Cr consolidation marked INVALID_SPEND_BOUNDING (compared timber @ ₹2500 to paper @ ₹79.50).',
    proposedSourcingIntervention: 'Execute competitive multi-round reverse dynamic e-auctions for standard corrugated cartons and sheets with pre-qualified converters.',
    calculationFormula: 'Addressable Quantity (233,224) × Price Gap (₹14.74/unit)',
    conservativeCase: {
      improvementPct: 16.3,
      financialOutcomeInr: 3438634,
      financialOutcomeCr: 0.344,
      description: 'Hypothetical e-auction price discovery: ₹14.74/unit gap on 233,224 units (₹0.3439 Cr).'
    },
    higherAchievementCase: {
      improvementPct: 20.0,
      financialOutcomeInr: 4209409,
      financialOutcomeCr: 0.421,
      description: 'Higher potential 20.0% with expanded converter participation.'
    },
    commercialDependencies: ['Standardized carton specification sheets', 'Drop-test qualification by QA'],
    implementationTimeline: 'Months 3–6 (Wave 2 Execution)',
    validationRequirements: ['Pre-auction supplier quality audit', 'E-auction audit trail verification'],
    sourceTransactionReferences: ['CAT-11300', 'PO-6400009610', 'BOROSIL_SCEN_L3A_PACKAGING_REGISTER'],
    supplierEvidence: '637 comparable transactions audited in standalone L3-A register (537 KB)',
    assumptionStatus: 'Hypothetical Price-Discovery Model — Excluded from Authoritative Ledger',
    validationStatus: 'RE_ESTABLISHED_HYPOTHETICAL'
  },
  {
    scenarioId: 'SCEN-L3-B',
    leverNumber: 3,
    leverName: 'Reverse E-Auction',
    scenarioName: 'Plastic Packaging Aggregation (Material Group 11320)',
    scenarioLabel: 'Scenario B',
    category: 'Shrink Film & Plastic Packaging',
    eligibleSpendInr: 0,
    eligibleSpendCr: 0,
    currentSituation: 'Material Group 11320 contains 0 rows and ₹0 spend in Borosil SAP master. Previous ₹9.367 Cr claim was unverified.',
    proposedSourcingIntervention: 'Audit film purchases classified under general packaging before planning lot aggregation.',
    calculationFormula: 'Spend × Auction % (Unquantified)',
    conservativeCase: {
      improvementPct: 0,
      financialOutcomeInr: 0,
      financialOutcomeCr: 0,
      description: 'Unquantified: Material Group 11320 contains 0 records in SAP database.'
    },
    higherAchievementCase: {
      improvementPct: 0,
      financialOutcomeInr: 0,
      financialOutcomeCr: 0,
      description: 'Unquantified: requires re-mapping of plastic film line items.'
    },
    commercialDependencies: ['Polymer specification audit'],
    implementationTimeline: 'Under Evaluation',
    validationRequirements: ['SAP material group verification'],
    sourceTransactionReferences: ['CAT-11320-ABSENT'],
    supplierEvidence: 'SAP master audit confirms zero transactions in group 11320',
    assumptionStatus: 'Unquantified — Material Group 11320 Not Found in Database',
    validationStatus: 'UNQUANTIFIED'
  }
];
