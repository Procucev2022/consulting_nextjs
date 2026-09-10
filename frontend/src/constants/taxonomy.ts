/**
 * UNSPSC Taxonomy Constants Module (Frontend)
 *
 * Dedicated constants, thresholds, and mappings for UNSPSC 4-tier taxonomy:
 * Segment > Family > Class > Commodity
 */

export const UNSPSC_COMMODITY_SPEND_THRESHOLD_CR = 50.0;

export const UNSPSC_CLASS_TITLES_BY_CODE: Record<string, string> = {
  '12352204': 'Catalysts and Reaction Modifiers',
  '13101502': 'Plastic Resins and Compounds',
  '14121506': 'Corrugated Paper and Packaging',
  '78101801': 'Road Cargo Transport Services',
  '40151501': 'Pumps and Compressors',
  '31201501': 'Industrial Tapes and Adhesives',
  '31171501': 'Bearings and Bushings',
  '15121501': 'Industrial Fuels and Lubricants',
  '43211501': 'Computer Equipment and Hardware',
  '39121401': 'Electrical Controls and Circuit Breakers'
};

export const UNSPSC_SEGMENT_FALLBACK_CLASSES: Record<string, string> = {
  '10': 'Live Plant and Agricultural Supplies',
  '12': 'Chemicals, Catalysts & Bio-Chemical Materials',
  '13': 'Resins, Polymers & Bulk Elastomeric Compounds',
  '14': 'Corrugated Paper, Packaging & Heavy Pallet Boxes',
  '15': 'Fuels, Industrial Lubricants & Greases',
  '24': 'Material Handling, Storage Packaging & Containers',
  '30': 'Structural Steel, Metal & Construction Components',
  '31': 'Industrial Machinery, Bearings & Mechanical Spares',
  '39': 'Facility Maintenance, Electrical & Safety Gear',
  '40': 'Pumps, Compressors & Fluid Distribution Systems',
  '43': 'IT Hardware, Networking & Enterprise Software Licenses',
  '78': 'Road Truckload Freight & Ocean Container Shipping'
};

export type UNSPSCDisplayLevel = 'COMMODITY' | 'CLASS';
export type UNSPSCFilterMode = 'AUTO' | 'COMMODITY' | 'CLASS';

export interface ResolvedUNSPSCCategory {
  displayTitle: string;
  level: UNSPSCDisplayLevel;
  commodityTitle: string;
  classTitle: string;
  code: string;
  isCommodity: boolean;
}

/**
 * Resolves whether to display a category as Commodity Title or Class Title
 * based on spend value or explicit filter mode.
 * Rule: First try to consider values based on Commodity Title and if values
 * are less (< thresholdCr), consider Class Title.
 */
export function resolveUNSPSCCategoryDisplay(
  code: string,
  sampleCommodityTitle: string,
  spendCr: number,
  mode: UNSPSCFilterMode = 'AUTO',
  thresholdCr: number = UNSPSC_COMMODITY_SPEND_THRESHOLD_CR
): ResolvedUNSPSCCategory {
  const commodityTitle = sampleCommodityTitle || 'General Commodity Item';
  const prefix2 = code ? code.slice(0, 2) : '12';
  const classTitle =
    UNSPSC_CLASS_TITLES_BY_CODE[code] ||
    UNSPSC_SEGMENT_FALLBACK_CLASSES[prefix2] ||
    `${commodityTitle.split('&')[0].trim()} (Class Level)`;

  let level: UNSPSCDisplayLevel;
  if (mode === 'COMMODITY') {
    level = 'COMMODITY';
  } else if (mode === 'CLASS') {
    level = 'CLASS';
  } else {
    // AUTO mode: Commodity for major spend, Class for lower spend values
    level = spendCr >= thresholdCr ? 'COMMODITY' : 'CLASS';
  }

  return {
    displayTitle: level === 'COMMODITY' ? commodityTitle : classTitle,
    level,
    commodityTitle,
    classTitle,
    code,
    isCommodity: level === 'COMMODITY'
  };
}
