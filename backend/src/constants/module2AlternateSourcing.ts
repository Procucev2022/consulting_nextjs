/**
 * Module 2 — Lever 10: New-Vendor Development & Alternate Sourcing Constants
 * Compliant with Rule 4, 8, 9, 10, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import { z } from 'zod';
import type { AlternateVendorMatchType } from '../types/module2AlternateSourcing';

export const LEVER_10_NAME = 'New-Vendor Development & Alternate Sourcing';
export const LEVER_10_CODE = 'LEV-10';

export const ALTERNATE_SOURCING_DISCLOSURES = {
  DISCOVERY_ONLY:
    'These are potential vendor discovery results, not verified qualified supplier counts.',
  NO_SAVINGS_CALCULATION:
    'Commercial benefit safeguards: Financial savings cannot be calculated merely from vendor counts. Validated savings strictly set to ₹0.00 until formal qualification and commercial discovery.',
  GEOGRAPHIC_LIMITATION:
    'Geographic suitability is a discovery preference based on registered address, not proof of manufacturing location or delivery capability. Out-of-state vendors remain in the overall count.',
  CONTACT_PRIVACY:
    'Vendor privacy protection: Executive discovery displays aggregate counts only. Individual contact records and directory exports are withheld.',
  DEDUPLICATION_POLICY:
    'Distinct business entities are deduplicated across categories and locations. Row counts do not equate to distinct vendors.',
  QUALIFICATION_SEPARATION:
    'Vendor discovery is strictly separate from technical qualification, quality certification, or financial auditing.'
} as const;

export const DEFAULT_PREFERRED_STATE = 'MAHARASHTRA';
export const DEFAULT_PREFERRED_CITY = 'MUMBAI';

export const STATE_TO_CITIES_MAP: Record<string, string[]> = {
  'MAHARASHTRA': ['ALL_CITIES', 'MUMBAI', 'PUNE', 'NAGPUR', 'NAVI MUMBAI', 'THANE'],
  'GUJARAT': ['ALL_CITIES', 'AHMEDABAD', 'SURAT', 'VADODARA', 'RAJKOT', 'JAMNAGAR', 'BHAVNAGAR'],
  'TAMIL NADU': ['ALL_CITIES', 'CHENNAI', 'COIMBATORE', 'SALEM', 'ERODE', 'KANCHEEPURAM'],
  'KARNATAKA': ['ALL_CITIES', 'BENGALURU', 'MYSURU', 'MANGALURU', 'KALABURAGI', 'TUMAKURU'],
  'DELHI NCR': ['ALL_CITIES', 'DELHI', 'NEW DELHI', 'NOIDA', 'GURUGRAM', 'FARIDABAD', 'GHAZIABAD'],
  'RAJASTHAN': ['ALL_CITIES', 'JAIPUR', 'JODHPUR', 'KOTA'],
  'UTTAR PRADESH': ['ALL_CITIES', 'LUCKNOW', 'KANPUR', 'PRAYAGRAJ', 'BAREILLY', 'GORAKHPUR'],
  'KERALA': ['ALL_CITIES', 'KOCHI', 'THIRUVANANTHAPURAM', 'KOZHIKODE', 'KOLLAM', 'MALAPPURAM'],
  'TELANGANA': ['ALL_CITIES', 'HYDERABAD'],
  'PUNJAB': ['ALL_CITIES', 'LUDHIANA', 'JALANDHAR', 'MOHALI']
};

export const MATCH_TYPE_LABELS: Record<AlternateVendorMatchType, string> = {
  EXACT: 'Exact Category Match',
  HIERARCHY: 'Hierarchy Category Match',
  SYNONYM: 'Synonym Category Match',
  RELATED: 'Related Category Match',
  UNMATCHED: 'No Verified Category Match'
};

export interface CategoryMappingRule {
  pattern: RegExp;
  vendorCategory: string;
  matchType: AlternateVendorMatchType;
  rationale: string;
}

export const CATEGORY_TAXONOMY_RULES: CategoryMappingRule[] = [
  {
    pattern: /coal\s*(e-auction|linkage|auction)/i,
    vendorCategory: 'NO_VERIFIED_CATEGORY_MATCH',
    matchType: 'UNMATCHED',
    rationale:
      'Regulated government coal auction (Coal India/WCL linkages); no viable alternate vendor in commercial master.'
  },
  {
    pattern: /bolt|fastener|screw|nut|rivet|stud|anchor/i,
    vendorCategory: 'Fasteners',
    matchType: 'EXACT',
    rationale: 'Direct mechanical hardware mapping to Fasteners category.'
  },
  {
    pattern: /bearing/i,
    vendorCategory: 'bearings and accessories',
    matchType: 'EXACT',
    rationale: 'Direct rotational component mapping to bearings and accessories.'
  },
  {
    pattern: /valve|hose|fitting/i,
    vendorCategory: 'hoses,valves& fittings',
    matchType: 'EXACT',
    rationale: 'Fluid handling and pneumatic components mapped to hoses,valves& fittings.'
  },
  {
    pattern: /copper wire|wire rod|electric wire/i,
    vendorCategory: 'electric wires',
    matchType: 'EXACT',
    rationale: 'Conductive wire products mapped to electric wires.'
  },
  {
    pattern: /cable/i,
    vendorCategory: 'cables',
    matchType: 'EXACT',
    rationale: 'Power and instrumentation cabling mapped to cables category.'
  },
  {
    pattern: /switch|mcb|mccb|fuse/i,
    vendorCategory: 'electrical switches',
    matchType: 'EXACT',
    rationale: 'Electrical switching and circuit protection mapped to electrical switches.'
  },
  {
    pattern: /resistor|capacitor|pcb|diode|chip|transistor|electronic/i,
    vendorCategory: 'electric items',
    matchType: 'HIERARCHY',
    rationale: 'Passive and active electronic components mapped via electrical hierarchy.'
  },
  {
    pattern: /strapping|box|carton|packaging|tape/i,
    vendorCategory: 'paper printing package',
    matchType: 'SYNONYM',
    rationale: 'Industrial packaging and protective wrap mapped via packaging synonym.'
  },
  {
    pattern: /lubricant|oil|grease/i,
    vendorCategory: 'lubricants',
    matchType: 'EXACT',
    rationale: 'Industrial lubricants and oils mapped to lubricants category.'
  },
  {
    pattern: /chemical|additive|oxsilan|acid|solvent/i,
    vendorCategory: 'chemicals',
    matchType: 'EXACT',
    rationale: 'Process chemicals and surface treatment additives mapped to chemicals.'
  },
  {
    pattern: /pump/i,
    vendorCategory: 'pumps and accessories',
    matchType: 'EXACT',
    rationale: 'Hydraulic and transfer pumps mapped to pumps and accessories.'
  },
  {
    pattern: /motor/i,
    vendorCategory: 'motors',
    matchType: 'EXACT',
    rationale: 'Electric and industrial motors mapped to motors category.'
  },
  {
    pattern: /steel|iron|metal|rod|sheet/i,
    vendorCategory: 'steel',
    matchType: 'RELATED',
    rationale: 'Base metallic raw materials mapped to steel related category.'
  },
  {
    pattern: /rubber|tyre|tire|gasket/i,
    vendorCategory: 'rubber goods',
    matchType: 'SYNONYM',
    rationale: 'Elastomeric and polymer seals mapped to rubber goods.'
  },
  {
    pattern: /paint|coating|primer/i,
    vendorCategory: 'paint',
    matchType: 'EXACT',
    rationale: 'Surface coating and industrial paints mapped to paint category.'
  }
];

export const RELATED_CATEGORY_MAPPINGS: Record<string, string[]> = {
  'Fasteners': ['Ferrous Material & Metals', 'hardware'],
  'bearings and accessories': ['machinery parts', 'automotive spares'],
  'hoses,valves& fittings': ['pipes and pipe fittings', 'pumps and accessories'],
  'electric wires': ['cables', 'electrical cables', 'Ferrous Material & Metals'],
  'cables': ['electric wires', 'electrical transmission', 'electrical items'],
  'electrical switches': ['electrical panels', 'Electrical-Lv Switch Gears'],
  'electric items': ['electrical capacitors', 'electronic components'],
  'paper printing package': ['adhesive printing', 'wood'],
  'lubricants': ['chemicals', 'automotive spares'],
  'chemicals': ['lubricants', 'paint', 'paints'],
  'pumps and accessories': ['motors', 'hoses,valves& fittings'],
  'motors': ['pumps and accessories', 'automation and controls'],
  'steel': ['Ferrous Material & Metals', 'steels'],
  'rubber goods': ['rubber', 'Rubber and Tyre Machinery'],
  'paint': ['Painting Repair & Maintenance', 'paints']
};

export const alternateSourcingQuerySchema = z.object({
  assessmentId: z.string().optional().default('AIC-2026-0001'),
  materialCode: z.string().optional(),
  spendCategory: z.string().optional(),
  geographicPreference: z.enum(['ALL_LOCATIONS', 'SAME_STATE', 'SAME_CITY', 'OTHER_STATES']).optional(),
  preferredState: z.string().optional(),
  preferredCity: z.string().optional(),
  matchType: z.enum(['EXACT', 'HIERARCHY', 'SYNONYM', 'RELATED', 'UNMATCHED']).optional()
});
