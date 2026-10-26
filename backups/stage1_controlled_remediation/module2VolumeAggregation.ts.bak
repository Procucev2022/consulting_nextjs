/**
 * Module 2 — Lever 4: Volume Aggregation Constants
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

export const VOLUME_AGGREGATION_OPPORTUNITY_TIERS = {
  TIER_1_IDENTICAL: 'TIER_1_IDENTICAL',
  TIER_2_COMPARABLE: 'TIER_2_COMPARABLE',
  TIER_3_CATEGORY: 'TIER_3_CATEGORY'
} as const;

export const VOLUME_AGGREGATION_DEMAND_CLASSIFICATIONS = {
  RECURRING: 'RECURRING',
  PERIODIC_SEASONAL: 'PERIODIC_SEASONAL',
  ONE_TIME_PROJECT: 'ONE_TIME_PROJECT',
  INSUFFICIENT_HISTORY: 'INSUFFICIENT_HISTORY'
} as const;

export const VOLUME_AGGREGATION_STATUSES = {
  CANDIDATE_IDENTIFIED: 'Candidate Identified',
  FURTHER_DATA_REQUIRED: 'Further Data Required',
  TECHNICAL_VALIDATION_REQUIRED: 'Technical Validation Required',
  COMMERCIAL_EVALUATION_REQUIRED: 'Commercial Evaluation Required',
  READY_FOR_SOURCING_REVIEW: 'Ready for Sourcing Review',
  APPROVED_FOR_EXECUTION: 'Approved for Execution',
  COMPLETED_BENEFIT_PENDING: 'Completed — Benefit Pending Validation',
  SAVINGS_VALIDATED: 'Savings Validated',
  NOT_SUITABLE: 'Not Suitable'
} as const;

export const VOLUME_AGGREGATION_ELIGIBILITY_TYPES = {
  MULTI_FACILITY_POOLING: 'MULTI_FACILITY_POOLING',
  MULTI_VENDOR_ALLOCATION: 'MULTI_VENDOR_ALLOCATION',
  TEMPORAL_LOT_CONSOLIDATION: 'TEMPORAL_LOT_CONSOLIDATION',
  LIMITED_HISTORY_NO_HISTORICAL_PATTERN: 'LIMITED_HISTORY_NO_HISTORICAL_PATTERN',
  SINGLE_PURCHASE_NON_AGGREGATABLE: 'SINGLE_PURCHASE_NON_AGGREGATABLE',
  INCOMPATIBLE_UOM: 'INCOMPATIBLE_UOM'
} as const;

export const VOLUME_AGGREGATION_DIMENSIONS = {
  MASS: 'MASS',
  COUNT: 'COUNT',
  VOLUME: 'VOLUME',
  LENGTH: 'LENGTH',
  AREA: 'AREA',
  PACKAGING_BOX: 'PACKAGING_BOX',
  PACKAGING_BAG: 'PACKAGING_BAG',
  PACKAGING_DRUM: 'PACKAGING_DRUM',
  PACKAGING_PAIR: 'PACKAGING_PAIR',
  ASSEMBLY_SET: 'ASSEMBLY_SET',
  ASSEMBLY_KIT: 'ASSEMBLY_KIT',
  PACKAGING_PACK: 'PACKAGING_PACK',
  PACKAGING_ROLL: 'PACKAGING_ROLL',
  PACKAGING_PAD: 'PACKAGING_PAD',
  PACKAGING_BOTTLE: 'PACKAGING_BOTTLE',
  PACKAGING_CAN: 'PACKAGING_CAN',
  PACKAGING_BUNDLE: 'PACKAGING_BUNDLE',
  PACKAGING_COIL: 'PACKAGING_COIL',
  PACKAGING_LENGTH: 'PACKAGING_LENGTH',
  SPECIALIZED: 'SPECIALIZED',
  AMBIGUOUS_MASS_LENGTH: 'AMBIGUOUS_MASS_LENGTH'
} as const;

export const AMBIGUOUS_UOM_ABBREVIATIONS = ['MT', 'M.T'] as const;

/**
 * Approved Authoritative Source-System UOM Mappings (Prompt 445 Section 1).
 * Ambiguous UOMs may ONLY be converted if an approved mapping with documented ERP provenance exists.
 */
export const APPROVED_AUTHORITATIVE_UOM_MAPPINGS: Record<string, import('../types/module2VolumeAggregation').ApprovedAuthoritativeUomMapping> = {};

/** Standard intra-dimensional conversion factors to base unit (unambiguous abbreviations only) */
export const UOM_STANDARD_CONVERSIONS: Record<string, { dimension: string; toBaseRatio: number; baseUom: string }> = {
  // Mass -> Base: MT (Unambiguous mass abbreviations only; MT is resolved via authoritative metadata)
  TON: { dimension: 'MASS', toBaseRatio: 1.0, baseUom: 'MT' },
  TN: { dimension: 'MASS', toBaseRatio: 1.0, baseUom: 'MT' },
  KG: { dimension: 'MASS', toBaseRatio: 0.001, baseUom: 'MT' },
  KGS: { dimension: 'MASS', toBaseRatio: 0.001, baseUom: 'MT' },
  G: { dimension: 'MASS', toBaseRatio: 0.000001, baseUom: 'MT' },
  GRM: { dimension: 'MASS', toBaseRatio: 0.000001, baseUom: 'MT' },
  GM: { dimension: 'MASS', toBaseRatio: 0.000001, baseUom: 'MT' },

  // Pure Count -> Base: EA (Individual discrete items only)
  EA: { dimension: 'COUNT', toBaseRatio: 1.0, baseUom: 'EA' },
  NO: { dimension: 'COUNT', toBaseRatio: 1.0, baseUom: 'EA' },
  NOS: { dimension: 'COUNT', toBaseRatio: 1.0, baseUom: 'EA' },
  PCS: { dimension: 'COUNT', toBaseRatio: 1.0, baseUom: 'EA' },
  PC: { dimension: 'COUNT', toBaseRatio: 1.0, baseUom: 'EA' },
  NU: { dimension: 'COUNT', toBaseRatio: 1.0, baseUom: 'EA' },

  // Packaging & Assembly Units — Distinct dimensions (Not interchangeable without verified factor)
  BOX: { dimension: 'PACKAGING_BOX', toBaseRatio: 1.0, baseUom: 'BOX' },
  BX: { dimension: 'PACKAGING_BOX', toBaseRatio: 1.0, baseUom: 'BOX' },
  BAG: { dimension: 'PACKAGING_BAG', toBaseRatio: 1.0, baseUom: 'BAG' },
  DRUM: { dimension: 'PACKAGING_DRUM', toBaseRatio: 1.0, baseUom: 'DRUM' },
  BRL: { dimension: 'PACKAGING_DRUM', toBaseRatio: 1.0, baseUom: 'DRUM' },
  PAIR: { dimension: 'PACKAGING_PAIR', toBaseRatio: 1.0, baseUom: 'PAIR' },
  PR: { dimension: 'PACKAGING_PAIR', toBaseRatio: 1.0, baseUom: 'PAIR' },
  PAR: { dimension: 'PACKAGING_PAIR', toBaseRatio: 1.0, baseUom: 'PAIR' },
  SET: { dimension: 'ASSEMBLY_SET', toBaseRatio: 1.0, baseUom: 'SET' },
  SETS: { dimension: 'ASSEMBLY_SET', toBaseRatio: 1.0, baseUom: 'SET' },
  ST: { dimension: 'ASSEMBLY_SET', toBaseRatio: 1.0, baseUom: 'SET' },
  KIT: { dimension: 'ASSEMBLY_KIT', toBaseRatio: 1.0, baseUom: 'KIT' },
  KT: { dimension: 'ASSEMBLY_KIT', toBaseRatio: 1.0, baseUom: 'KIT' },
  PACK: { dimension: 'PACKAGING_PACK', toBaseRatio: 1.0, baseUom: 'PACK' },
  PKT: { dimension: 'PACKAGING_PACK', toBaseRatio: 1.0, baseUom: 'PACK' },
  PT: { dimension: 'PACKAGING_PACK', toBaseRatio: 1.0, baseUom: 'PACK' },
  ROL: { dimension: 'PACKAGING_ROLL', toBaseRatio: 1.0, baseUom: 'ROL' },
  RL: { dimension: 'PACKAGING_ROLL', toBaseRatio: 1.0, baseUom: 'ROL' },
  ROLL: { dimension: 'PACKAGING_ROLL', toBaseRatio: 1.0, baseUom: 'ROL' },
  PAD: { dimension: 'PACKAGING_PAD', toBaseRatio: 1.0, baseUom: 'PAD' },
  BTL: { dimension: 'PACKAGING_BOTTLE', toBaseRatio: 1.0, baseUom: 'BTL' },
  BT: { dimension: 'PACKAGING_BOTTLE', toBaseRatio: 1.0, baseUom: 'BTL' },
  TIN: { dimension: 'PACKAGING_CAN', toBaseRatio: 1.0, baseUom: 'CAN' },
  CAN: { dimension: 'PACKAGING_CAN', toBaseRatio: 1.0, baseUom: 'CAN' },
  BDL: { dimension: 'PACKAGING_BUNDLE', toBaseRatio: 1.0, baseUom: 'BDL' },
  COL: { dimension: 'PACKAGING_COIL', toBaseRatio: 1.0, baseUom: 'COL' },
  CL: { dimension: 'PACKAGING_COIL', toBaseRatio: 1.0, baseUom: 'COL' },
  LNG: { dimension: 'PACKAGING_LENGTH', toBaseRatio: 1.0, baseUom: 'LNG' },

  // Volume -> Base: KL (CF and CFT conversions verified strictly for volume)
  KL: { dimension: 'VOLUME', toBaseRatio: 1.0, baseUom: 'KL' },
  LTR: { dimension: 'VOLUME', toBaseRatio: 0.001, baseUom: 'KL' },
  LT: { dimension: 'VOLUME', toBaseRatio: 0.001, baseUom: 'KL' },
  L: { dimension: 'VOLUME', toBaseRatio: 0.001, baseUom: 'KL' },
  M3: { dimension: 'VOLUME', toBaseRatio: 1.0, baseUom: 'KL' },
  CUM: { dimension: 'VOLUME', toBaseRatio: 1.0, baseUom: 'KL' },
  ML: { dimension: 'VOLUME', toBaseRatio: 0.000001, baseUom: 'KL' },
  'M.L': { dimension: 'VOLUME', toBaseRatio: 0.000001, baseUom: 'KL' },
  CF: { dimension: 'VOLUME', toBaseRatio: 0.0283168, baseUom: 'KL' },
  CFT: { dimension: 'VOLUME', toBaseRatio: 0.0283168, baseUom: 'KL' },

  // Length -> Base: M (M and MTR unambiguous; MT resolved via metadata)
  M: { dimension: 'LENGTH', toBaseRatio: 1.0, baseUom: 'M' },
  MTR: { dimension: 'LENGTH', toBaseRatio: 1.0, baseUom: 'M' },
  MR: { dimension: 'LENGTH', toBaseRatio: 1.0, baseUom: 'M' },
  FT: { dimension: 'LENGTH', toBaseRatio: 0.3048, baseUom: 'M' },
  RFT: { dimension: 'LENGTH', toBaseRatio: 0.3048, baseUom: 'M' },
  CM: { dimension: 'LENGTH', toBaseRatio: 0.01, baseUom: 'M' },
  MM: { dimension: 'LENGTH', toBaseRatio: 0.001, baseUom: 'M' },

  // Area -> Base: SQM
  SQM: { dimension: 'AREA', toBaseRatio: 1.0, baseUom: 'SQM' },
  SM: { dimension: 'AREA', toBaseRatio: 1.0, baseUom: 'SQM' },
  SQFT: { dimension: 'AREA', toBaseRatio: 0.092903, baseUom: 'SQM' },
  SFT: { dimension: 'AREA', toBaseRatio: 0.092903, baseUom: 'SQM' },
  SF: { dimension: 'AREA', toBaseRatio: 0.092903, baseUom: 'SQM' }
};

/** Material-specific packaging conversion registry (Prompt 444 Section 3) */
export const VERIFIED_MATERIAL_PACKAGING_TABLE: Record<
  string,
  {
    materialNamePattern: RegExp;
    sourceUom: string;
    targetUom: string;
    unitsPerPackage: number;
    standardSource: string;
    effectiveDate: string;
    supportingEvidenceAvailable: boolean;
    actionApplied: boolean;
    validationStatus: string;
    assumptionsAndLimitations: string;
    formula: string;
  }
> = {
  SAFETY_GLOVES_PAIR_PACK: {
    materialNamePattern: /\b(safety\s*gloves|leather\s*gloves|cotton\s*gloves)\b/i,
    sourceUom: 'PACK',
    targetUom: 'PAIR',
    unitsPerPackage: 10,
    standardSource: 'Manufacturer Packing Specification — Industrial Safety Equipment Spec Ver 2.1',
    effectiveDate: '2024-01-01',
    supportingEvidenceAvailable: false,
    actionApplied: false,
    validationStatus: 'TECHNICAL_VALIDATION_REQUIRED',
    assumptionsAndLimitations:
      'Cited specification not present in project files. Factor of 10 PAIR/PACK unverified; native PACK preserved.',
    formula: 'Native packaging PACK preserved. Nominal conversion: PAIR = PACK * 10 (Validation Required).'
  }
};

/** Audited material-specific density conversion factors and provenance (Prompt 440 Section 3) */
export const VERIFIED_MATERIAL_DENSITY_TABLE: Record<
  string,
  {
    materialNamePattern: RegExp;
    nominalDensityFactor: number;
    sourceUom: string;
    targetUom: string;
    standardSource: string;
    effectiveDate: string;
    applicableGrade: string;
    supportingEvidenceAvailable: boolean;
    assumptionsAndLimitations: string;
    formula: string;
    actionApplied: boolean;
  }
> = {
  HSD_DIESEL: {
    materialNamePattern: /\b(hsd(\s+oil)?|high\s*speed\s*diesel|diesel(\s*(fuel|oil))?)\b/i,
    nominalDensityFactor: 0.84,
    sourceUom: 'KL',
    targetUom: 'MT',
    standardSource: 'Indian Standard IS 1460:2020 Automotive Diesel Fuels Specification, Table 1',
    effectiveDate: '2024-01-01',
    applicableGrade: 'Automotive Diesel Fuel (HSD) — Commercial Fuel for Mines & Fleet',
    supportingEvidenceAvailable: false,
    assumptionsAndLimitations:
      'IS 1460 specifies density range 820-845 kg/m3 at 15 deg C. Without delivery batch certificates, native volume in KL is preserved.',
    formula: 'Native volume in KL preserved. Nominal mass at 0.840 MT/KL is Mass = Vol(KL) * 0.840.',
    actionApplied: false
  },
  FURNACE_OIL: {
    materialNamePattern: /\bfurnace\s*oil\b/i,
    nominalDensityFactor: 0.92,
    sourceUom: 'KL',
    targetUom: 'MT',
    standardSource: 'Indian Standard IS 1593:2018 Industrial Fuel Oils Specification, Class LV/MV',
    effectiveDate: '2024-01-01',
    applicableGrade: 'Industrial Fuel Oil, Grade LV/MV',
    supportingEvidenceAvailable: false,
    assumptionsAndLimitations:
      'IS 1593 specifies density range 890-950 kg/m3. Without delivery test reports, factor cannot be established.',
    formula: 'Native volume in KL preserved. Nominal mass at 0.920 MT/KL is Mass = Vol(KL) * 0.920.',
    actionApplied: false
  }
};

/** Informational plant geographic registry (Non-penalizing informational attributes) */
export const INFORMATIONAL_PLANT_GEOGRAPHY: Record<
  string,
  { plantCode: string; plantName: string; region: string; state: string; hubDistanceKm: number }
> = {
  '1000': { plantCode: '1000', plantName: 'Central Spinning Mill', region: 'North', state: 'Punjab', hubDistanceKm: 0 },
  '2200': {
    plantCode: '2200',
    plantName: 'Technical Textiles Unit',
    region: 'North',
    state: 'Himachal Pradesh',
    hubDistanceKm: 120
  },
  '1001': {
    plantCode: '1001',
    plantName: 'Integrated Cement Plant 1',
    region: 'South',
    state: 'Karnataka',
    hubDistanceKm: 0
  },
  '1002': {
    plantCode: '1002',
    plantName: 'Clinker Grinding Unit 2',
    region: 'South',
    state: 'Karnataka',
    hubDistanceKm: 85
  },
  '1003': {
    plantCode: '1003',
    plantName: 'Bulk Terminal Unit 3',
    region: 'South',
    state: 'Karnataka',
    hubDistanceKm: 140
  }
};

export const VOLUME_AGGREGATION_METHODOLOGY_DISCLOSURES = [
  'Zero Arbitrary Savings: No arbitrary percentage reductions or discount tiers are applied; savings are NOT YET QUANTIFIABLE.',
  'Distinct Opportunity Tiers: Tier 1 Identical, Tier 2 Comparable, and Tier 3 Category are strictly segregated.',
  'Evidence-Based Demand Recurrence: Calendar-month thresholds and count rules removed; patterns require proof.',
  'Ambiguous UOM Resolution: Abbreviation MT is not silently mapped; preserved in native UOM unless metadata proves unit.',
  'Preservation of Native Physical Quantities: Native UOMs are preserved; direct conversion requires verified evidence.',
  'No Packaging/Count Interchangeability: BOX, BAG, DRUM, PAIR, SET, KIT and EA are not assumed interchangeable.',
  'Verified Density & Packaging Governance: External citations without project repository evidence do not trigger conversion.',
  'Separation of Historical Spend from Future Potential: Limited history items are reviewed for forward joint sourcing.',
  'Full Reconciliation Proof: All quantities, historical expenditures, and exclusions reconcile 100% to source ERP.'
];

export const VOLUME_AGGREGATION_EXCEL_SHEETS = {
  SHEET_1_EXECUTIVE: '1. Executive Summary',
  SHEET_2_OPPORTUNITIES: '2. Aggregation Opportunities',
  SHEET_3_PLANT_ANALYSIS: '3. Plant Analysis',
  SHEET_4_MATERIAL_ANALYSIS: '4. Material Analysis',
  SHEET_5_SUPPLIER_ANALYSIS: '5. Supplier Analysis',
  SHEET_6_TRANSACTIONS: '6. Purchase Transactions',
  SHEET_7_VALIDATION: '7. Validation Requirements',
  SHEET_8_DATA_QUALITY: '8. Data Quality & Method'
} as const;
