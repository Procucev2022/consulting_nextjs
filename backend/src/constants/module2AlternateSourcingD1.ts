import { z } from 'zod';

export const MODULE2_D1_ALTERNATE_SOURCING = {
  INR_PER_CRORE: 10000000,
  AMOUNT_DECIMAL_PLACES: 6,
  OPPORTUNITY_ID_PREFIX: 'ALT',
  UNKNOWN_CATEGORY: 'Unmapped Category',
  UNKNOWN_MATERIAL: 'Unidentified material',
  UNKNOWN_PLANT: 'Unspecified plant',
  UNKNOWN_UNIT: 'Unspecified unit',
  DIRECTORY_MATCH_NOTICE: 'Exact category matches use D1 directory aggregates; alternate suppliers are not individually identified.',
  QUALIFICATION_NOTICE: 'Directory counts do not establish technical, quality, financial, or commercial qualification.',
  IDENTITY_NOTICE: 'Incumbent supplier names cannot be matched against this aggregate-only directory, so exclusion is unavailable.',
  GEOGRAPHIC_NOTICE: 'State counts are category aggregates. City aggregates are not linked to states, and registered location does not prove delivery capability.',
  SAVINGS_NOTICE: 'Vendor discovery alone does not establish commercial savings. Realized and validated savings remain zero.',
  PRICE_NOTICE: 'No price or savings benchmark is inferred from alternate vendor counts.',
  DISCLOSURES: [
    'Only normalized exact category matches are included; broader hierarchy and synonym matching is unavailable.',
    'Aggregate directory data does not include supplier identities or qualification evidence.',
    'Current suppliers cannot be matched or excluded from the aggregate directory.',
    'Geographic counts are discovery indicators and do not prove manufacturing or delivery capability.',
    'No financial savings are estimated or claimed.'
  ]
} as const;

export const MODULE2_D1_ALTERNATE_MATCH_TYPES = ['EXACT', 'UNMATCHED'] as const;
export const MODULE2_D1_GEOGRAPHIC_PREFERENCES = [
  'ALL_LOCATIONS', 'SAME_STATE', 'SAME_CITY', 'OTHER_STATES'
] as const;

export const MODULE2_D1_ALTERNATE_SENTINELS = {
  ALL_CITIES: 'ALL_CITIES'
} as const;

export const alternateSourcingQuerySchema = z.object({
  materialCode: z.string().trim().min(1).max(120).optional(),
  spendCategory: z.string().trim().min(1).max(200).optional(),
  geographicPreference: z.enum(MODULE2_D1_GEOGRAPHIC_PREFERENCES).default('ALL_LOCATIONS'),
  preferredState: z.string().trim().min(1).max(120).optional(),
  preferredCity: z.string().trim().min(1).max(120).optional(),
  matchType: z.enum(MODULE2_D1_ALTERNATE_MATCH_TYPES).optional()
}).superRefine((query, context) => {
  if (query.geographicPreference === 'SAME_STATE' && !query.preferredState) {
    context.addIssue({ code: 'custom', path: ['preferredState'], message: 'Select a preferred state.' });
  }
  if (query.geographicPreference === 'SAME_CITY' &&
      (!query.preferredCity || query.preferredCity === MODULE2_D1_ALTERNATE_SENTINELS.ALL_CITIES)) {
    context.addIssue({ code: 'custom', path: ['preferredCity'], message: 'Select a specific preferred city.' });
  }
  if (query.geographicPreference === 'OTHER_STATES' && !query.preferredState) {
    context.addIssue({ code: 'custom', path: ['preferredState'], message: 'Select a state to exclude.' });
  }
});
