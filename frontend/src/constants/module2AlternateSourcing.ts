/**
 * Module 2 — Lever 10: New-Vendor Development & Alternate Sourcing Frontend Constants
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

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

export const MATCH_TYPE_LABELS = {
  EXACT: 'Exact Category Match',
  HIERARCHY: 'Taxonomy Hierarchy Match',
  SYNONYM: 'Synonym-Based Match',
  RELATED: 'Related-Category Discovery',
  UNMATCHED: 'No Verified Category Match'
} as const;

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

export const GEOGRAPHIC_PREFERENCE_OPTIONS = [
  { value: 'ALL_LOCATIONS', label: 'All Available Locations' },
  { value: 'SAME_STATE', label: 'Preferred State Only' },
  { value: 'SAME_CITY', label: 'Preferred City Only' },
  { value: 'OTHER_STATES', label: 'Other States' }
] as const;

export const ALTERNATE_SOURCING_UI_STRINGS = {
  TITLE: 'Module 2 — Lever 10: New-Vendor Development & Alternate Sourcing',
  SUBTITLE: 'Initial Alternate Vendor Discovery Engine (Database of ~600,000 Verified Commercial Vendors)',
  BADGE: 'LEVER 10 — ALTERNATE VENDOR DISCOVERY',
  DISCOVERY_NOTICE: 'Discovery Capability Only • Zero Inferred Financial Savings • Zero Raw Vendor Contact Exposure',
  KPI_ELIGIBLE_MATERIALS: 'Eligible Materials Analyzed',
  KPI_SINGLE_SOURCE_RISKS: 'Single-Source Dependencies',
  KPI_POTENTIAL_VENDORS_ALL: 'Category-Matched Vendors (All Locations)',
  KPI_POTENTIAL_VENDORS_REGION: 'Preferred Region Pool',
  KPI_CUMULATIVE_MATCHES: 'Cumulative Opportunity Matches',
  KPI_EXCLUDED_SUPPLIERS: 'Excluded Current Suppliers',
  KPI_SAVINGS_PROTECTION: 'Commercial Savings Calculated',
  VALUE_ZERO_SAVINGS: '₹0.00 Cr (Discovery Stage)',
  SUB_UNVERIFIED_PRICE: 'ZERO ESTIMATED SAVINGS CLAIMED',
  SUB_VERIFIED_COUNT: 'DISTINCT BUSINESS ENTITIES',
  SUB_CROSS_CATEGORY: 'DEDUPLICATED UNIQUE ENTITIES',
  SUB_DEDUPLICATED_POOL: 'DISTINCT DEDUPLICATED POOL',
  SUB_CUMULATIVE_INSTANCES: 'CUMULATIVE LINE-ITEM INSTANCES',
  SECTION_OPPORTUNITY: 'ALTERNATE SOURCING OPPORTUNITY',
  LBL_MATERIAL_CATEGORY: 'Material / Customer Category',
  LBL_PLANT_LOCATION: 'Customer Plant / Procurement Facility',
  LBL_CURRENT_SUPPLIERS: 'Verified Current Suppliers',
  LBL_CURRENT_SPEND: 'Relevant Historical Spend',
  LBL_ALL_LOCATIONS_COUNT: 'Potential Alternate Vendors — All Locations',
  LBL_PREFERRED_REGION_COUNT: 'Potential Alternate Vendors — Preferred Region',
  LBL_CATEGORY_MATCH: 'Category Match Type',
  LBL_EXACT_MATCHES: 'Exact Matches',
  LBL_RELATED_MATCHES: 'Related-Category Matches',
  LBL_HIERARCHY_MATCHES: 'Taxonomy Hierarchy Matches',
  LBL_SYNONYM_MATCHES: 'Synonym-Based Matches',
  LBL_QUALIFICATION_STATUS: 'Qualification Status',
  LBL_QUALIFIED_ALTERNATIVES: 'Qualified Alternatives',
  VALUE_DATA_UNAVAILABLE: 'DATA_UNAVAILABLE',
  VALUE_UNQUALIFIED: 'UNQUALIFIED (Discovery Stage)',
  LBL_CONTACT_COMPLETENESS: 'Contact Data Completeness',
  LBL_HAS_WEBSITE: 'Has Verified Website',
  LBL_HAS_PHONE: 'Has Registered Phone',
  LBL_MISSING_CONTACT: 'Missing Contact Details',
  NOTICE_MISSING_CONTACT_DISQUALIFY:
    'Missing email or website does not disqualify a vendor from category-based discovery.',
  LBL_GEOGRAPHIC_PREFERENCE: 'Geographic Discovery Preference',
  LBL_SELECT_STATE: 'Preferred State',
  LBL_SELECT_CITY: 'Preferred City',
  LBL_FILTER_MATCH_TYPE: 'Filter Match Type',
  TAB_ALL_MATERIALS: 'All Sourcing Opportunities',
  TAB_SINGLE_SOURCE: 'Critical Single-Source Only',
  TAB_DISCLOSURES: 'Methodology & Privacy Disclosures',
  NOTICE_DISCOVERY_ONLY: 'Potential vendor discovery results, not verified qualified supplier counts.',
  NOTICE_SAVINGS_SAFEGUARD:
    'Financial savings cannot be calculated from vendor discovery counts. Validated savings strictly set to ₹0.00 until formal qualification and commercial discovery.',
  NOTICE_PRIVACY_PROTECTION:
    'Vendor Privacy Protection: Individual vendor names, phone numbers, and email addresses are withheld in executive summaries.',
  NOTICE_DEDUPLICATION: 'Distinct business entities are deduplicated. Database rows do not equate to distinct vendors.',
  BTN_REFRESH: 'Refresh Discovery Pool',
  BTN_RESET_FILTERS: 'Reset Filters',
  LOADING_TEXT: 'Scanning 600,000+ vendor directory records and matching categories...',
  ERROR_TITLE: 'Alternate Vendor Discovery Error',
  ERROR_RETRY: 'Retry Discovery Query'
} as const;
