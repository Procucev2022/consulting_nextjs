/**
 * PCBI Platform 20 Acceptance Test Case Definitions (Section 14)
 */

import type {
  Module4InputContractRecord,
  Module4OpportunityOutputCategory
} from '../types/pcbiPlatformIntegration';

export interface AcceptanceTestCaseDef {
  num: number;
  name: string;
  scenario: string;
  expected: Module4OpportunityOutputCategory | 'REJECTED' | 'RECONCILIATION_FAILURE';
  record?: Partial<Module4InputContractRecord>;
}

export const TWENTY_ACCEPTANCE_TEST_DEFS: AcceptanceTestCaseDef[] = [
  { num: 1, name: 'Valid PCBI opportunity workflow', scenario: 'Valid copper rods', expected: 'OPPORTUNITY_ELIGIBLE' },
  {
    num: 2,
    name: 'Missing PCBI blocked',
    scenario: 'Ferro Moly 65%',
    expected: 'OPPORTUNITY_BLOCKED_PCBI_GAP',
    record: { pcbiStatus: 'PCBI_MISSING' }
  },
  {
    num: 3,
    name: 'Partial history blocked',
    scenario: 'Tungsten Carbide 42m',
    expected: 'OPPORTUNITY_BLOCKED_PCBI_GAP',
    record: { pcbiStatus: 'PCBI_PARTIAL' }
  },
  {
    num: 4,
    name: 'Wrong grade blocked',
    scenario: 'Grade mismatch',
    expected: 'OPPORTUNITY_BLOCKED_SPECIFICATION',
    record: { pcbiId: 'PCBI-SPEC_MISMATCH-001' }
  },
  {
    num: 5,
    name: 'Wrong specification blocked',
    scenario: 'Viscosity mismatch',
    expected: 'OPPORTUNITY_BLOCKED_SPECIFICATION',
    record: { pcbiId: 'PCBI-SPEC_MISMATCH-002' }
  },
  {
    num: 6,
    name: 'Wrong unit blocked',
    scenario: 'MT vs Roll',
    expected: 'OPPORTUNITY_BLOCKED_UNIT',
    record: { customerUnit: 'ROLL', pcbiUnit: 'MT' }
  },
  {
    num: 7,
    name: 'Wrong currency blocked',
    scenario: 'INR vs GBP',
    expected: 'OPPORTUNITY_BLOCKED_CURRENCY',
    record: { customerCurrency: 'INR', pcbiCurrency: 'GBP' }
  },
  {
    num: 8,
    name: 'Wrong geography blocked',
    scenario: 'Domestic vs Global CFR',
    expected: 'OPPORTUNITY_BLOCKED_GEOGRAPHY',
    record: { pcbiGeography: 'GLOBAL_CFR' }
  },
  {
    num: 9,
    name: 'Frequency mismatch blocked',
    scenario: 'Daily vs Monthly',
    expected: 'OPPORTUNITY_BLOCKED_FREQUENCY',
    record: { pcbiMethodology: 'FREQ_MISMATCH_DAILY' }
  },
  {
    num: 10,
    name: 'Methodology pending blocked',
    scenario: 'Unapproved formula',
    expected: 'OPPORTUNITY_BLOCKED_METHODOLOGY',
    record: { pcbiMethodology: 'PENDING_APPROVAL' }
  },
  {
    num: 11,
    name: 'Not benchmarkable blocked',
    scenario: 'Security service',
    expected: 'NOT_BENCHMARKABLE',
    record: { pcbiStatus: 'PCBI_NOT_BENCHMARKABLE' }
  },
  {
    num: 12,
    name: 'Dynamic PCBI added & reprocessed',
    scenario: 'Newly approved PCBI',
    expected: 'OPPORTUNITY_ELIGIBLE'
  },
  {
    num: 13,
    name: 'PCBI version change audit preserved',
    scenario: 'Version audit verified',
    expected: 'OPPORTUNITY_ELIGIBLE'
  },
  {
    num: 14,
    name: 'PCBI rollback restored',
    scenario: 'Previous active version',
    expected: 'OPPORTUNITY_ELIGIBLE'
  },
  {
    num: 15,
    name: 'Customer re-upload no duplicate',
    scenario: 'Deduplicated transaction',
    expected: 'OPPORTUNITY_ELIGIBLE'
  },
  {
    num: 16,
    name: 'Duplicate transaction rejected',
    scenario: 'Duplicate tx id',
    expected: 'REJECTED'
  },
  {
    num: 17,
    name: 'Missing transaction reconciliation',
    scenario: 'Count mismatch audit',
    expected: 'RECONCILIATION_FAILURE'
  },
  {
    num: 18,
    name: 'Module 2 classification conflict blocked',
    scenario: 'Conflict detected',
    expected: 'OPPORTUNITY_BLOCKED_SPECIFICATION',
    record: { pcbiId: 'PCBI-SPEC_MISMATCH-CONFLICT' }
  },
  {
    num: 19,
    name: 'Unapproved PCBI blocked',
    scenario: 'Draft unapproved series',
    expected: 'OPPORTUNITY_BLOCKED_METHODOLOGY',
    record: { pcbiMethodology: 'PENDING_ADMIN' }
  },
  {
    num: 20,
    name: 'Production-ready PCBI complete flow',
    scenario: 'Certified baseline',
    expected: 'OPPORTUNITY_ELIGIBLE'
  }
];
