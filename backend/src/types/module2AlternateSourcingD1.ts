export interface AlternateVendorIndexD1Row {
  category_key: string;
  payload_json: string;
}

export interface AlternateVendorPoolCountD1Row {
  distinct_vendor_count: number | string | null;
  record_count: number | string | null;
}

export interface ParsedAlternateVendorCategory {
  categoryKey: string;
  categoryName: string;
  distinctVendorCount: number;
  stateCounts: Record<string, number>;
  topCities: Array<{ city: string; count: number }>;
  contactMetrics: {
    hasWebsiteCount: number;
    hasEmailCount: number;
    hasPhoneCount: number;
    missingContactCount: number;
  };
}
