/**
 * Module 3 PCBI Master Mapping Review & Benchmark Governance Constants
 * Defines verified candidate series catalog, spend category vs benchmark family distinctions,
 * and candidate series resolvers. Conforms to Rule 8 (constants isolation) and Rule 9 (strongly typed).
 */

import type { CandidateBenchmarkSeries } from '../types/module3PcbiMapping';
import type { PCBIMissingIndexGapItem } from '../types/module3GapList';

export const BOROSIL_CANDIDATE_SERIES_CATALOG: CandidateBenchmarkSeries[] = [
  {
    seriesId: 'PCBI-IND-CHM-SDA-001',
    seriesName: 'AMAI Domestic Dense Soda Ash Index (Ex-Gujarat)',
    publisher: 'Alkali Manufacturers Association of India (AMAI)',
    benchmarkFamily: 'Alkali Chemicals',
    applicableCategories: ['11100', 'Direct Chemical Raw Materials / Sodium Carbonate'],
    specificationComparability: 'IDENTICAL_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'EX_WORKS_MATCHED',
    defaultUom: 'MT',
    defaultCurrency: 'INR',
    description: 'Dense soda ash (Na2CO3 >= 99.2%, Bulk Density 1.0-1.1 g/cm3), Ex-Works Gujarat manufacturing belt.'
  },
  {
    seriesId: 'PCBI-IND-CHM-SDA-002',
    seriesName: 'Chemical Weekly Domestic Soda Ash Spot Price',
    publisher: 'Chemical Weekly / Sevak Publications',
    benchmarkFamily: 'Alkali Chemicals',
    applicableCategories: ['11100', 'Direct Chemical Raw Materials / Sodium Carbonate'],
    specificationComparability: 'PROXY_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'FREIGHT_ADJUSTMENT_REQUIRED',
    defaultUom: 'MT',
    defaultCurrency: 'INR',
    description: 'Domestic wholesale depot spot price; requires freight basis adjustment from depot to plant.'
  },
  {
    seriesId: 'PCBI-IND-MIN-SLS-001',
    seriesName: 'Indian Bureau of Mines (IBM) Silica Sand Mineral Statistics',
    publisher: 'Indian Bureau of Mines (IBM) / Ministry of Mines',
    benchmarkFamily: 'Industrial Minerals',
    applicableCategories: ['11100', 'Direct Minerals / Beneficiated Silica Sand'],
    specificationComparability: 'PROXY_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'FREIGHT_ADJUSTMENT_REQUIRED',
    defaultUom: 'MT',
    defaultCurrency: 'INR',
    description: 'Run-of-mine raw silica sand statistics; requires engineering washing & beneficiation spread calibration.'
  },
  {
    seriesId: 'PCBI-IND-PPR-KFT-001',
    seriesName: 'RBI WPI Paper & Paper Products Index',
    publisher: 'Reserve Bank of India / Office of the Economic Adviser',
    benchmarkFamily: 'Packaging & Paper',
    applicableCategories: ['11300', 'Packaging / Corrugated Cartons & Sheets'],
    specificationComparability: 'PROXY_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'EX_WORKS_MATCHED',
    defaultUom: 'KG',
    defaultCurrency: 'INR',
    description: 'Official wholesale price sub-index for paper & corrugated packaging materials in India.'
  },
  {
    seriesId: 'PCBI-IND-PET-LSHS-001',
    seriesName: 'IOCL Industrial Fuel Refinery Index (LSHS)',
    publisher: 'Indian Oil Corporation Ltd (IOCL)',
    benchmarkFamily: 'Petroleum & Fuels',
    applicableCategories: ['40000', 'Energy & Industrial Fuels / Low Sulphur Heavy Stock'],
    specificationComparability: 'IDENTICAL_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'EX_WORKS_MATCHED',
    defaultUom: 'MT',
    defaultCurrency: 'INR',
    description: 'Published refinery ex-works gate pricing for Low Sulphur Heavy Stock (Koyali / Dahej supply).'
  },
  {
    seriesId: 'PCBI-IND-POL-PP-001',
    seriesName: 'Domestic Polypropylene (PP) Polymer Index',
    publisher: 'Platts / ICIS Asian Polyolefins',
    benchmarkFamily: 'Polymers & Packaging',
    applicableCategories: ['11300', 'Polymers / Polypropylene Strapping & Liners'],
    specificationComparability: 'PROXY_GRADE',
    geographyCompatibility: 'DOMESTIC_EX_WORKS',
    deliveryTermCompatibility: 'EX_WORKS_MATCHED',
    defaultUom: 'KG',
    defaultCurrency: 'INR',
    description: 'Domestic spot polymer benchmark index for industrial polypropylene resin grades.'
  }
];

export const CATEGORY_TO_BENCHMARK_FAMILY_MAP: Record<string, string> = {
  '11100': 'Alkali Chemicals & Industrial Minerals',
  '11300': 'Packaging, Paper & Polymers',
  '11524': 'Industrial Liners & Misc Packaging',
  '11574': 'Specialized Corrugated Packaging',
  '11583': 'Secondary Packaging Materials',
  '40000': 'Petroleum & Industrial Fuels',
  'ST-ENG-B': 'Refractories & High-Temp Ceramics',
  'ST-ENG-A': 'Refractories & High-Temp Ceramics',
  '60000': 'Capital Machinery & Turnkey Equipment',
  'TAIL-MRO': 'Operating Consumables & Tail MRO'
};

const FAMILY_KEYWORD_RULES: Array<{ keywords: string[]; family: string }> = [
  { keywords: ['chemical', 'carbonate', 'soda ash'], family: 'Alkali Chemicals' },
  { keywords: ['mineral', 'silica', 'quartz', 'sand'], family: 'Industrial Minerals' },
  { keywords: ['corrugated', 'paper', 'carton', 'packaging'], family: 'Packaging & Paper' },
  { keywords: ['fuel', 'lshs', 'oil'], family: 'Petroleum & Fuels' },
  { keywords: ['refractory', 'ceramic', 'block', 'feeder'], family: 'Refractories & High-Temp Ceramics' },
  { keywords: ['equipment', 'turnkey', 'lng', 'machinery'], family: 'Capital Machinery & Turnkey Equipment' }
];

export function getBenchmarkFamilyForCategory(categoryCode?: string, classification?: string): string {
  if (categoryCode && CATEGORY_TO_BENCHMARK_FAMILY_MAP[categoryCode]) {
    return CATEGORY_TO_BENCHMARK_FAMILY_MAP[categoryCode];
  }
  const text = (classification || '').toLowerCase();
  const matched = FAMILY_KEYWORD_RULES.find((rule) => rule.keywords.some((k) => text.includes(k)));
  return matched ? matched.family : 'General Industrial Supplies';
}

const SPEND_CATEGORY_PREFIX_RULES: Array<{ prefixes: string[]; category: string }> = [
  { prefixes: ['100SA'], category: '11100 (Direct Chemicals)' },
  { prefixes: ['100SSW', '100QS'], category: '11100 (Direct Minerals)' },
  { prefixes: ['300PP', '583IM', '574IM', '524LI'], category: '11300 (Packaging Materials)' },
  { prefixes: ['400LSH'], category: '40000 (Industrial Fuels)' },
  { prefixes: ['STTV', 'STE', 'STMV'], category: 'ST-ENG-B (Furnace Refractories)' },
  { prefixes: ['600LNG'], category: '60000 (Capital Turnkey Equipment)' }
];

export function getSpendCategoryForRequirement(item: PCBIMissingIndexGapItem): string {
  const code = (item.materialCode || '').toUpperCase();
  const matched = SPEND_CATEGORY_PREFIX_RULES.find((r) => r.prefixes.some((p) => code.startsWith(p)));
  return matched ? matched.category : 'TAIL-MRO (Operating Consumables)';
}

const UNBENCHMARKABLE_PATTERNS = ['STTV', 'STE', 'STMV', '600LNG', 'UNMAPPED-TAIL-MRO'];
const UNBENCHMARKABLE_KEYWORDS = ['refractory', 'feeder', 'turnkey'];

const CANDIDATE_SERIES_MATCHERS: Array<{
  prefixes: string[];
  keywords: string[];
  matchFamily: (s: CandidateBenchmarkSeries) => boolean;
}> = [
  {
    prefixes: ['100SA'],
    keywords: ['soda ash'],
    matchFamily: (s) => s.benchmarkFamily === 'Alkali Chemicals'
  },
  {
    prefixes: ['100SSW', '100QS'],
    keywords: ['silica', 'quartz'],
    matchFamily: (s) => s.benchmarkFamily === 'Industrial Minerals'
  },
  {
    prefixes: ['300PP', '583IM', '574IM', '524LI'],
    keywords: ['corrugated', 'paper', 'box', 'packaging'],
    matchFamily: (s) => s.benchmarkFamily === 'Packaging & Paper' || s.benchmarkFamily === 'Polymers & Packaging'
  },
  {
    prefixes: ['400LSH'],
    keywords: ['lshs', 'fuel'],
    matchFamily: (s) => s.benchmarkFamily === 'Petroleum & Fuels'
  }
];

function isUnbenchmarkable(code: string, desc: string): boolean {
  return (
    UNBENCHMARKABLE_PATTERNS.some((p) => code.startsWith(p)) ||
    UNBENCHMARKABLE_KEYWORDS.some((k) => desc.includes(k))
  );
}

export function getCandidateSeriesForRequirement(item: PCBIMissingIndexGapItem): CandidateBenchmarkSeries[] {
  const code = (item.materialCode || '').toUpperCase();
  const desc = (item.materialDescription || '').toLowerCase();
  const classification = (item.commodityClassification || '').toLowerCase();
  const searchText = `${desc} ${classification}`;

  if (isUnbenchmarkable(code, desc)) {
    return [];
  }

  const matcher = CANDIDATE_SERIES_MATCHERS.find(
    (m) => m.prefixes.some((p) => code.startsWith(p)) || m.keywords.some((k) => searchText.includes(k))
  );

  return matcher ? BOROSIL_CANDIDATE_SERIES_CATALOG.filter(matcher.matchFamily) : [];
}
