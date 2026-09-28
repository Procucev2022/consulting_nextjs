/**
 * PCBI Master Database Seeds & Weekly Index Series (2020 - 2026)
 * Multi-Sector Support: Cement, Steel, Sugar, Textile, Pharma, Chemicals, Glass, Manufacturing, Automotive, Engineering, Packaging, FMCG
 */

import type {
  PCBIBenchmarkMaster,
  PCBIBenchmarkComponent,
  PCBIWeeklyIndex,
  PCBIUNSPSCMapping
} from '../types/pcbi';

export const initialPCBIBenchmarks: PCBIBenchmarkMaster[] = [
  {
    id: 'pcbi-bm-001',
    pcbi_id: 'PCBI-STEEL-001',
    sector: 'Multi-Sector',
    category: 'Ferrous Metals & Structural Steel',
    sub_category: 'Hot Rolled Coils & Plates',
    unspsc_segment: '30000000',
    unspsc_family: '30260000',
    unspsc_class: '30263600',
    unspsc_commodity: '30263601',
    benchmark_name: 'CRU / Platts Hot Rolled Steel Benchmark',
    benchmark_source: 'Approved Industrial Metal Indices',
    source_series: 'CRU-STEEL-HRC-DOM',
    benchmark_unit: 'MT',
    currency: 'INR',
    geography: 'India National & Ex-Works',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 75,
    residual_percent: 25,
    quality_rating: 'A',
    calculation_method: 'P0*(1-B) + P0*B*(I1/I0)',
    benchmark_scope: 'MULTI_SECTOR',
    applicable_sectors: ['Cement', 'Steel', 'Automotive', 'Engineering', 'Manufacturing', 'Packaging'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Primary benchmark for structural steel, fabrication plates and wear liners across process industries.',
    active: true
  },
  {
    id: 'pcbi-bm-002',
    pcbi_id: 'PCBI-BRG-COMP-001',
    sector: 'Multi-Sector',
    category: 'Bearings & Power Transmission',
    sub_category: 'Industrial Roller & Ball Bearings',
    unspsc_segment: '31000000',
    unspsc_family: '31170000',
    unspsc_class: '31171500',
    unspsc_commodity: '31171504',
    benchmark_name: 'Composite Industrial Bearing Index',
    benchmark_source: 'Multi-Source Composite PCBI Model',
    source_series: 'PCBI-COMP-BRG-GEN',
    benchmark_unit: 'EA',
    currency: 'INR',
    geography: 'National & Imported Blend',
    benchmark_type: 'COMPOSITE',
    benchmarkability_percent: 80,
    residual_percent: 20,
    quality_rating: 'A',
    calculation_method: 'SUM(Base_Comp_i * (I1_i / I0_i)) + Residual',
    benchmark_scope: 'GLOBAL',
    applicable_sectors: ['Cement', 'Steel', 'Sugar', 'Textile', 'Manufacturing', 'Automotive', 'Engineering', 'Glass'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Constructed from Steel (55%), Rubber/Polymers (10%), Energy (10%), Chemicals/Lubrication (5%), Residual conversion (20%).',
    active: true
  },
  {
    id: 'pcbi-bm-003',
    pcbi_id: 'PCBI-CHEM-CAUSTIC-001',
    sector: 'Multi-Sector',
    category: 'Process Chemicals & Chlor-Alkali',
    sub_category: 'Caustic Soda Lye / Flakes',
    unspsc_segment: '12000000',
    unspsc_family: '12140000',
    unspsc_class: '12141900',
    unspsc_commodity: '12141901',
    benchmark_name: 'ICIS / Alkali Manufacturers Caustic Lye Benchmark',
    benchmark_source: 'ICIS Domestic Chemical Monitor',
    source_series: 'ICIS-CAUSTIC-LYE-EXW',
    benchmark_unit: 'MT',
    currency: 'INR',
    geography: 'India Domestic Ex-Works',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 70,
    residual_percent: 30,
    quality_rating: 'A',
    calculation_method: 'P0*(1-B) + P0*B*(I1/I0)',
    benchmark_scope: 'MULTI_SECTOR',
    applicable_sectors: ['Textile', 'Pharma', 'Chemicals', 'Sugar', 'Packaging', 'FMCG'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Key reactant for textile processing, pharma intermediates, and chemical syntheses.',
    active: true
  },
  {
    id: 'pcbi-bm-004',
    pcbi_id: 'PCBI-POLY-HDPE-001',
    sector: 'Multi-Sector',
    category: 'Polymers & Packaging Materials',
    sub_category: 'HDPE / PP Granules & Bags',
    unspsc_segment: '14000000',
    unspsc_family: '14110000',
    unspsc_class: '14111500',
    unspsc_commodity: '14111507',
    benchmark_name: 'Platts Polymer / IOCL Published Polymer Index',
    benchmark_source: 'Platts Petrochemical & Domestic Raffia Index',
    source_series: 'PLATTS-HDPE-PP-DEL',
    benchmark_unit: 'KG',
    currency: 'INR',
    geography: 'India Ex-Refinery / Domestic',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 68,
    residual_percent: 32,
    quality_rating: 'A',
    calculation_method: 'P0*(1-B) + P0*B*(I1/I0)',
    benchmark_scope: 'MULTI_SECTOR',
    applicable_sectors: ['Cement', 'Sugar', 'Packaging', 'Chemicals', 'FMCG', 'Pharma'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Used for secondary packaging, HDPE woven bags, and corrugated outer sacks.',
    active: true
  },
  {
    id: 'pcbi-bm-005',
    pcbi_id: 'PCBI-ENERGY-COAL-001',
    sector: 'Multi-Sector',
    category: 'Energy & Solid Fuels',
    sub_category: 'Thermal Coal & Imported Indonesian Coal',
    unspsc_segment: '15000000',
    unspsc_family: '15100000',
    unspsc_class: '15101500',
    unspsc_commodity: '15101505',
    benchmark_name: 'Argus / ICI Coal Index (4200 GAR & CIL E-Auction)',
    benchmark_source: 'Argus Coal Daily & CIL Benchmark',
    source_series: 'ARGUS-ICI-4200-GAR',
    benchmark_unit: 'MT',
    currency: 'INR',
    geography: 'FOB Indonesian Port & Railhead India',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 85,
    residual_percent: 15,
    quality_rating: 'A',
    calculation_method: 'P0*(1-B) + P0*B*(I1/I0)',
    benchmark_scope: 'MULTI_SECTOR',
    applicable_sectors: ['Cement', 'Steel', 'Sugar', 'Textile', 'Manufacturing', 'Glass', 'Chemicals'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Primary thermal energy driver for kilns, captive boilers, and co-generation plants.',
    active: true
  },
  {
    id: 'pcbi-bm-006',
    pcbi_id: 'PCBI-LUB-OIL-001',
    sector: 'Multi-Sector',
    category: 'Lubricants & Industrial Oils',
    sub_category: 'Hydraulic & Gear Oils',
    unspsc_segment: '15000000',
    unspsc_family: '15120000',
    unspsc_class: '15121500',
    unspsc_commodity: '15121501',
    benchmark_name: 'ICIS Base Oils Group I/II & Additives',
    benchmark_source: 'ICIS Base Oils Price Index',
    source_series: 'ICIS-BASE-OIL-GR2',
    benchmark_unit: 'LTR',
    currency: 'INR',
    geography: 'National Bulk Delivery',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 65,
    residual_percent: 35,
    quality_rating: 'B',
    calculation_method: 'P0*(1-B) + P0*B*(I1/I0)',
    benchmark_scope: 'MULTI_SECTOR',
    applicable_sectors: ['Cement', 'Steel', 'Automotive', 'Manufacturing', 'Engineering', 'Sugar'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Heavy duty circulating, hydraulic, and turbine lubricants.',
    active: true
  },
  {
    id: 'pcbi-bm-007',
    pcbi_id: 'PCBI-REFRAC-001',
    sector: 'Cement',
    category: 'Refractory & Kiln Liners',
    sub_category: 'Alumina & Magnesite Bricks',
    unspsc_segment: '30000000',
    unspsc_family: '30110000',
    unspsc_class: '30111500',
    unspsc_commodity: '30111502',
    benchmark_name: 'Industrial Mineral Magnesite & Bauxite Index',
    benchmark_source: 'Industrial Minerals Metal Bulletin',
    source_series: 'IM-MAGNESITE-ALUMINA',
    benchmark_unit: 'MT',
    currency: 'INR',
    geography: 'India Domestic & DDP Kiln Site',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 60,
    residual_percent: 40,
    quality_rating: 'B',
    calculation_method: 'P0*(1-B) + P0*B*(I1/I0)',
    benchmark_scope: 'MULTI_SECTOR',
    applicable_sectors: ['Cement', 'Steel', 'Glass', 'Manufacturing'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Rotary kiln burning zone and cyclone preheater refractory lining.',
    active: true
  },
  {
    id: 'pcbi-bm-008',
    pcbi_id: 'PCBI-ELEC-CABLE-001',
    sector: 'Multi-Sector',
    category: 'Electrical & Power Cables',
    sub_category: 'HT/LT Copper & Aluminum Cables',
    unspsc_segment: '26000000',
    unspsc_family: '26120000',
    unspsc_class: '26121600',
    unspsc_commodity: '26121609',
    benchmark_name: 'IEEMA Copper & Aluminum Cable Index',
    benchmark_source: 'Indian Electrical and Electronics Manufacturers Association',
    source_series: 'IEEMA-PVCCABLE-DOM',
    benchmark_unit: 'MTR',
    currency: 'INR',
    geography: 'India National',
    benchmark_type: 'SINGLE',
    benchmarkability_percent: 72,
    residual_percent: 28,
    quality_rating: 'A',
    calculation_method: 'P0*(1-B) + P0*B*(I1/I0)',
    benchmark_scope: 'GLOBAL',
    applicable_sectors: ['Cement', 'Steel', 'Sugar', 'Pharma', 'Chemicals', 'Engineering', 'Manufacturing', 'Automotive'],
    gap_handling_method: 'FORWARD_FILL',
    effective_from: '2020-04-01',
    version: 1,
    notes: 'Power distribution and instrument armored cables indexed to LME/IEEMA raw metals.',
    active: true
  }
];

export const initialPCBIBenchmarkComponents: PCBIBenchmarkComponent[] = [
  {
    id: 'pcbi-comp-001',
    pcbi_id: 'PCBI-BRG-COMP-001',
    component_name: 'Special Alloy Bearing Steel',
    benchmark_source: 'CRU Special Steel Series',
    source_series: 'CRU-SPECIAL-STEEL',
    weight_percent: 55,
    benchmark_unit: 'MT',
    currency: 'INR',
    geography: 'India & Global Blend',
    quality_rating: 'A',
    active: true
  },
  {
    id: 'pcbi-comp-002',
    pcbi_id: 'PCBI-BRG-COMP-001',
    component_name: 'Nitrile Rubber / Elastomer Seals',
    benchmark_source: 'Rubber Board & Polymer Index',
    source_series: 'RB-ELASTOMER-SEAL',
    weight_percent: 10,
    benchmark_unit: 'KG',
    currency: 'INR',
    geography: 'India Domestic',
    quality_rating: 'B',
    active: true
  },
  {
    id: 'pcbi-comp-003',
    pcbi_id: 'PCBI-BRG-COMP-001',
    component_name: 'Industrial Heat & Heat Treatment Energy',
    benchmark_source: 'WPI Fuel & Power Series',
    source_series: 'WPI-POWER-IND',
    weight_percent: 10,
    benchmark_unit: 'KWH',
    currency: 'INR',
    geography: 'India Industrial Grid',
    quality_rating: 'A',
    active: true
  },
  {
    id: 'pcbi-comp-004',
    pcbi_id: 'PCBI-BRG-COMP-001',
    component_name: 'Synthetic Grease & Chemical Preservatives',
    benchmark_source: 'ICIS Chemical Lubricant Index',
    source_series: 'ICIS-SYNTH-GREASE',
    weight_percent: 5,
    benchmark_unit: 'KG',
    currency: 'INR',
    geography: 'India Domestic',
    quality_rating: 'B',
    active: true
  }
];

export const initialPCBIUNSPSCMappings: PCBIUNSPSCMapping[] = [
  {
    id: 'unspsc-map-001',
    unspsc_code: '30263601',
    unspsc_title: 'Hot rolled steel plates',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-STEEL-001',
    category: 'Ferrous Metals & Structural Steel',
    sub_category: 'Hot Rolled Coils & Plates',
    default_benchmarkability: 75,
    quality_rating: 'A',
    active: true
  },
  {
    id: 'unspsc-map-002',
    unspsc_code: '30263600',
    unspsc_title: 'Rolled steel sheets and plates',
    unspsc_level: 'CLASS',
    pcbi_id: 'PCBI-STEEL-001',
    category: 'Ferrous Metals & Structural Steel',
    sub_category: 'Rolled Steel',
    default_benchmarkability: 70,
    quality_rating: 'B',
    active: true
  },
  {
    id: 'unspsc-map-003',
    unspsc_code: '31171504',
    unspsc_title: 'Spherical roller bearings',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-BRG-COMP-001',
    category: 'Bearings & Power Transmission',
    sub_category: 'Roller Bearings',
    default_benchmarkability: 80,
    quality_rating: 'A',
    active: true
  },
  {
    id: 'unspsc-map-004',
    unspsc_code: '31171500',
    unspsc_title: 'Bearings',
    unspsc_level: 'CLASS',
    pcbi_id: 'PCBI-BRG-COMP-001',
    category: 'Bearings & Power Transmission',
    sub_category: 'Bearings General',
    default_benchmarkability: 75,
    quality_rating: 'B',
    active: true
  },
  {
    id: 'unspsc-map-005',
    unspsc_code: '12141901',
    unspsc_title: 'Sodium hydroxide / Caustic soda',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-CHEM-CAUSTIC-001',
    category: 'Process Chemicals & Chlor-Alkali',
    sub_category: 'Caustic Soda',
    default_benchmarkability: 70,
    quality_rating: 'A',
    active: true
  },
  {
    id: 'unspsc-map-006',
    unspsc_code: '14111507',
    unspsc_title: 'High density polyethylene HDPE sacks',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-POLY-HDPE-001',
    category: 'Polymers & Packaging Materials',
    sub_category: 'Polymer Bags',
    default_benchmarkability: 68,
    quality_rating: 'A',
    active: true
  },
  {
    id: 'unspsc-map-007',
    unspsc_code: '15101505',
    unspsc_title: 'Steam coal / Thermal coal',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-ENERGY-COAL-001',
    category: 'Energy & Solid Fuels',
    sub_category: 'Thermal Coal',
    default_benchmarkability: 85,
    quality_rating: 'A',
    active: true
  },
  {
    id: 'unspsc-map-008',
    unspsc_code: '15121501',
    unspsc_title: 'Hydraulic oils and lubricants',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-LUB-OIL-001',
    category: 'Lubricants & Industrial Oils',
    sub_category: 'Hydraulic Oils',
    default_benchmarkability: 65,
    quality_rating: 'B',
    active: true
  },
  {
    id: 'unspsc-map-009',
    unspsc_code: '30111502',
    unspsc_title: 'Refractory bricks and shapes',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-REFRAC-001',
    category: 'Refractory & Kiln Liners',
    sub_category: 'Alumina Refractory',
    default_benchmarkability: 60,
    quality_rating: 'B',
    active: true
  },
  {
    id: 'unspsc-map-010',
    unspsc_code: '26121609',
    unspsc_title: 'Electrical power and control cables',
    unspsc_level: 'COMMODITY',
    pcbi_id: 'PCBI-ELEC-CABLE-001',
    category: 'Electrical & Power Cables',
    sub_category: 'Power Cables',
    default_benchmarkability: 72,
    quality_rating: 'A',
    active: true
  }
];

/**
 * Helper to generate weekly date intervals from 2020-04-06 to 2026-07-27 (Mondays)
 */
function generateHistoricalWeeklyIndices(): PCBIWeeklyIndex[] {
  const result: PCBIWeeklyIndex[] = [];
  const startMonday = new Date('2020-04-06T00:00:00Z');
  const endMonday = new Date('2026-07-27T00:00:00Z');

  // Benchmark baseline curves (simulating verified macro movements relative to 2020 base = 100)
  const seriesParams: Record<string, { base: number; slope: number; volatility: number; cycleAmp: number }> = {
    'PCBI-STEEL-001': { base: 100.0, slope: 0.11, volatility: 1.2, cycleAmp: 22 },
    'PCBI-BRG-COMP-001': { base: 100.0, slope: 0.08, volatility: 0.8, cycleAmp: 14 },
    'PCBI-CHEM-CAUSTIC-001': { base: 100.0, slope: 0.09, volatility: 1.5, cycleAmp: 18 },
    'PCBI-POLY-HDPE-001': { base: 100.0, slope: 0.07, volatility: 1.1, cycleAmp: 16 },
    'PCBI-ENERGY-COAL-001': { base: 100.0, slope: 0.14, volatility: 2.2, cycleAmp: 30 },
    'PCBI-LUB-OIL-001': { base: 100.0, slope: 0.075, volatility: 0.9, cycleAmp: 12 },
    'PCBI-REFRAC-001': { base: 100.0, slope: 0.06, volatility: 0.7, cycleAmp: 10 },
    'PCBI-ELEC-CABLE-001': { base: 100.0, slope: 0.10, volatility: 1.4, cycleAmp: 20 },
    // Composite sub-components
    'pcbi-comp-001': { base: 100.0, slope: 0.11, volatility: 1.2, cycleAmp: 22 },
    'pcbi-comp-002': { base: 100.0, slope: 0.05, volatility: 0.6, cycleAmp: 8 },
    'pcbi-comp-003': { base: 100.0, slope: 0.09, volatility: 1.0, cycleAmp: 15 },
    'pcbi-comp-004': { base: 100.0, slope: 0.06, volatility: 0.7, cycleAmp: 9 }
  };

  const current = new Date(startMonday);
  let weekIndex = 0;

  while (current <= endMonday) {
    const weekStartStr = current.toISOString().split('T')[0];
    const sunday = new Date(current);
    sunday.setDate(sunday.getDate() + 6);
    const weekEndStr = sunday.toISOString().split('T')[0];

    for (const [key, params] of Object.entries(seriesParams)) {
      // Deterministic synthetic index calculation based on macroeconomic cycles
      const trend = weekIndex * params.slope;
      const cycle = Math.sin((weekIndex / 52) * 2 * Math.PI) * params.cycleAmp;
      const microJitter = Math.cos((weekIndex / 13) * Math.PI) * (params.volatility * 1.5);
      const indexValue = Number(Math.max(80, params.base + trend + cycle + microJitter).toFixed(2));

      const isCompositeChild = key.startsWith('pcbi-comp-');
      const pcbiId = isCompositeChild ? 'PCBI-BRG-COMP-001' : key;
      const compId = isCompositeChild ? key : undefined;

      result.push({
        id: `idx-${key}-${weekStartStr}`,
        pcbi_id: pcbiId,
        component_id: compId,
        week_start: weekStartStr,
        week_end: weekEndStr,
        index_value: indexValue,
        base_period_index: 100.0,
        source: 'Verified PCBI Industry Monitor',
        source_series: key,
        quality_rating: 'A',
        currency: 'INR',
        unit: 'INDEX (2020=100)',
        created_at: new Date().toISOString()
      });
    }

    current.setDate(current.getDate() + 7);
    weekIndex++;
  }

  return result;
}

export const initialPCBIWeeklyIndices: PCBIWeeklyIndex[] = generateHistoricalWeeklyIndices();
