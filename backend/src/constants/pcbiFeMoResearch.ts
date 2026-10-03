/**
 * PCBI Ferro Molybdenum 65% Research Candidate Constants
 * Commodity: PCBI-FEMO-65-001 under UNDER_REVIEW
 */

import type {
  FeMoObservationRecord,
  FeMoSourceComparisonItem,
  FeMoMethodologyEvaluation,
  FeMoMissingPeriodAudit
} from '../types/pcbiFeMoResearch';
import { RAW_FEMO_RESEARCH_OBSERVATIONS_PART_A } from './pcbiFeMoObservationsA';
import { RAW_FEMO_RESEARCH_OBSERVATIONS_PART_B } from './pcbiFeMoObservationsB';

export {
  FEMO_TARGETED_RECOVERY_TRACKS,
  FEMO_TARGETED_RECOVERY_REPORT
} from './pcbiFeMoRecoveryReport';

export const FEMO_TARGET_SPECIFICATION = {
  pcbiId: 'PCBI-FEMO-65-001',
  commodityName: 'Ferro Molybdenum 65%',
  grade: 'FeMo 65% (Min 65% Mo)',
  moContentMinPct: 65.0,
  targetUnit: 'INR/MT',
  targetCurrency: 'INR',
  targetFrequency: 'Weekly',
  targetGeography: 'India domestic / ex-works preferred',
  governingStandard: 'IS 1469:1993 (Ferromolybdenum Specification)',
  unspsc: '30102700',
  requiredStartDate: '2020-04-01',
  requiredEndDate: '2026-09-28',
  customerSpendInr: 12500000,
  customerSpendCr: '₹1.25 Cr'
};

export const RAW_FEMO_RESEARCH_OBSERVATIONS: FeMoObservationRecord[] = [
  ...RAW_FEMO_RESEARCH_OBSERVATIONS_PART_A,
  ...RAW_FEMO_RESEARCH_OBSERVATIONS_PART_B
];

export const FEMO_SOURCE_COMPARISON_MATRIX: FeMoSourceComparisonItem[] = [
  {
    sourceId: 'SRC-MMR-DOM',
    publisher: 'Minerals & Metals Review (MMR)',
    grade: 'FeMo 60% (Domestic IS 1469)',
    geography: 'Mumbai / Raipur (Domestic India)',
    frequency: 'Weekly basic price',
    availableCoverage: '17 scattered observations (2020-03 to 2025-08)',
    observationCount: 17,
    sourceStatus: 'PUBLIC_CANDIDATE',
    strengths: [
      'Published in domestic INR currency',
      'Reflects actual Indian alloy manufacturer trading terms',
      'Directly applicable to domestic metallurgical consumers'
    ],
    limitations: [
      'Specification is FeMo 60%, not the customer required FeMo 65%',
      'Historical observations are non-continuous with massive multi-month gaps',
      'Requires verified grade transformation methodology before production use'
    ],
    hierarchyRank: 1
  },
  {
    sourceId: 'SRC-BIGMINT-DOM',
    publisher: 'BigMint (formerly SteelMint)',
    grade: 'FeMo 60% (Domestic standard)',
    geography: 'Ex-works India',
    frequency: 'Weekly assessment',
    availableCoverage: '1 sample observation (2026-07-22)',
    observationCount: 1,
    sourceStatus: 'PUBLIC_CANDIDATE',
    strengths: [
      'Leading Indian ferrous/ferro-alloy price discovery benchmark',
      'Formal methodology manual based on market participant polling',
      'Reflects ex-works domestic transactional reality'
    ],
    limitations: [
      'Assesses FeMo 60%, not FeMo 65%',
      'Historical archive requires commercial license (no free continuous public series)',
      'Single observation in research pack'
    ],
    hierarchyRank: 2
  },
  {
    sourceId: 'SRC-ARGUS-INT',
    publisher: 'Argus Media / Fastmarkets',
    grade: 'FeMo 65–70% Mo',
    geography: 'DP Rotterdam / Western Europe',
    frequency: 'Daily / Weekly',
    availableCoverage: '1 sample observation (2021-11-30)',
    observationCount: 1,
    sourceStatus: 'REFERENCE_ONLY',
    strengths: [
      'Global price benchmark for high-grade ferromolybdenum',
      'Closely matches the 65% contained molybdenum specification'
    ],
    limitations: [
      'Quoted in USD/kg contained Mo on a European duty-paid basis',
      'Does not incorporate Indian customs duties (BCD/SWS/IGST), ocean freight, port clearing, or domestic margins',
      'Sample report only; historical time series requires commercial subscription'
    ],
    hierarchyRank: 3
  },
  {
    sourceId: 'SRC-IBM-GOV',
    publisher: 'Indian Bureau of Mines (IBM), Ministry of Mines',
    grade: 'Not Applicable (Mined mineral ores only)',
    geography: 'Pit-mouth, India',
    frequency: 'Monthly Average Sale Price (ASP)',
    availableCoverage: 'Statutory mineral bulletins (2020 to 2026)',
    observationCount: 0,
    sourceStatus: 'GOVERNMENT_CONTEXT',
    strengths: [
      'Official statutory government price authority for mining royalties'
    ],
    limitations: [
      'Does NOT publish Ferro Molybdenum prices (only raw ores like Iron Ore, Bauxite, Chromite)',
      'Ferro Molybdenum is a secondary manufactured alloy and excluded from ASP reporting',
      'Cannot be used as a ferro-alloy benchmark'
    ],
    hierarchyRank: 4
  },
  {
    sourceId: 'SRC-PSU-TENDERS',
    publisher: 'SAIL / BHEL / MIDHANI',
    grade: 'FeMo 60%–65% (TDC FF 05009 / IS 1469)',
    geography: 'Haridwar / Trichy / Hyderabad / Bhilai',
    frequency: 'Discrete long-term contracts (6–12 months)',
    availableCoverage: 'Public tender notices & purchase specifications',
    observationCount: 0,
    sourceStatus: 'PRODUCER_CONTEXT',
    strengths: [
      'Reflects enterprise PSU procurement delivery conditions and quality thresholds'
    ],
    limitations: [
      'Tenders represent fixed-price long-term rate contracts, not spot market trend indices',
      'Awarded contract prices are often redacted or commercial confidential',
      'Cannot generate a continuous weekly or monthly price index'
    ],
    hierarchyRank: 5
  }
];

export const FEMO_METHODOLOGY_EVALUATIONS: FeMoMethodologyEvaluation[] = [
  {
    methodologyId: 'METH-FEMO-RATIO-01',
    title: 'Linear Chemical Purity Ratio Transformation (65/60 = 1.0833)',
    targetSpecification: 'Derive FeMo 65% Price = FeMo 60% Price * (65 / 60)',
    proposedTransformation: 'Multiply FeMo 60% observation by 1.0833 to compute theoretical FeMo 65% price',
    isDefensible: false,
    scientificEvaluation: 'Scientifically flawed and indefensible. The market price of FeMo consists of contained molybdenum value PLUS aluminothermic smelting and refining costs, reducing agents, energy, and purity premiums. Higher grade 65% requires tighter tolerance on impurities (Cu, P, S), which commands a non-linear premium that fluctuates with global MoO3 replacement costs. A constant static 1.0833 ratio produces an unverified synthetic price.',
    governanceCompliance: 'REJECTED_SYNTHETIC',
    status: 'REJECTED',
    blockingReasons: [
      'Violates Section 1.3 Governance Directive: Zero synthetic or assumed prices permitted under any circumstance',
      'Manufactures unverified savings calculations in Module 4',
      'Lacks empirical correlation from simultaneous dual-grade market transactions'
    ]
  },
  {
    methodologyId: 'METH-FEMO-IMPORT-PARITY-02',
    title: 'International 65–70% Import Parity Conversion Model',
    targetSpecification: 'Convert Argus/Rotterdam FeMo 65–70% USD/kg Mo to Indian Ex-Works INR/MT',
    proposedTransformation: 'FeMo 65% INR = (Rotterdam USD/kg Mo * 650 kg * FX_USDINR * (1 + BCD_DUTY) * (1 + IGST)) + Port_Clearance + Inland_Freight',
    isDefensible: true,
    scientificEvaluation: 'Theoretically valid economic model because India imports nearly 100% of raw technical MoO3 concentrate used for aluminothermic smelting. However, it requires a continuous, licensed international price feed and verified customs duty schedules across every historical time period.',
    governanceCompliance: 'PENDING_EMPIRICAL_VALIDATION',
    status: 'METHODOLOGY_PENDING',
    blockingReasons: [
      'Requires licensed Argus/Fastmarkets international subscription (commercial purchase not approved)',
      'Public sample reports contain only 2 isolated dates (2020-03-09 and 2021-11-30)',
      'Cannot establish continuous April 2020 to date history from free public data'
    ]
  },
  {
    methodologyId: 'METH-FEMO-REF-TREND-03',
    title: 'FeMo 60% Trend Reference Model (Index Only, No Absolute Price)',
    targetSpecification: 'Use FeMo 60% relative percentage movements to index customer historical contract baseline',
    proposedTransformation: 'Base Period (Mar 2020) = 100. Trend Index_t = (FeMo60_Price_t / FeMo60_Price_base) * 100',
    isDefensible: true,
    scientificEvaluation: 'Statistically defensible for relative market momentum direction because contained molybdenum represents >85% of cost movement in both 60% and 65% grades. However, it requires a complete, unbroken time series to compute continuous weekly or monthly indices.',
    governanceCompliance: 'PENDING_EMPIRICAL_VALIDATION',
    status: 'METHODOLOGY_PENDING',
    blockingReasons: [
      'Current public research pack provides only 18 non-continuous observations spanning 6 years',
      'Entire calendar years 2020 (post-March) and 2022 are completely empty in the public pack',
      'Cannot be promoted to PRODUCTION_READY until gap data is uploaded via Admin Portal'
    ]
  }
];

export const FEMO_MISSING_PERIODS_AUDIT: FeMoMissingPeriodAudit[] = [
  {
    gapId: 'GAP-FEMO-2020',
    periodOrTopic: '2020-04-01 to 2020-12-31 (Q2–Q4 2020)',
    missingObservationCountEst: 39,
    severity: 'CRITICAL_BLOCKER',
    finding: 'Only 1 observation exists for 2020 (March 6, 2020). The entire initial platform baseline period (April to December 2020) is missing.',
    remedyRequired: 'Upload weekly Minerals & Metals Review or AIFAA historical bulletin issues covering April through December 2020.'
  },
  {
    gapId: 'GAP-FEMO-2022',
    periodOrTopic: '2022-01-01 to 2022-12-31 (Full Year 2022)',
    missingObservationCountEst: 52,
    severity: 'CRITICAL_BLOCKER',
    finding: 'Exactly ZERO observations exist in the research pack for the year 2022. Complete 52-week data vacuum during high molybdenum volatility.',
    remedyRequired: 'Source historical 2022 weekly market reports from industry publications or association bulletins.'
  },
  {
    gapId: 'GAP-FEMO-2023-24',
    periodOrTopic: '2023-03 to 2023-08 & 2024-06 to 2024-10',
    missingObservationCountEst: 42,
    severity: 'MAJOR_GAP',
    finding: 'Multi-month gaps between sporadic observations (e.g. Feb 2023 to Sep 2023 gap, May 2024 to Nov 2024 gap).',
    remedyRequired: 'Upload complete monthly or weekly issues rather than isolated single-point sample articles.'
  },
  {
    gapId: 'GAP-FEMO-SPEC-65',
    periodOrTopic: 'Direct Domestic FeMo 65% Price Series',
    missingObservationCountEst: 339,
    severity: 'SPECIFICATION_GAP',
    finding: 'Exactly ZERO specification-equivalent FeMo 65% Indian domestic observations exist in public domain publications. All domestic trade reporting is conducted on a FeMo 60% basis.',
    remedyRequired: 'Obtain producer rate sheets / contract pricing specifically itemizing FeMo 65% grade or formalize an audited methodology converting FeMo 60% to 65% based on simultaneous empirical market transactions.'
  }
];
