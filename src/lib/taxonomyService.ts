import { searchUNSPSCTaxonomy, lookupUNSPSCByDescription, UNSPSCCommodityRecord, unspscOfficialDictionary } from '../data/unspscTaxonomy';

export function searchTaxonomy(query: string, category?: string): UNSPSCCommodityRecord[] {
  return searchUNSPSCTaxonomy(query, category);
}

export function lookupTaxonomy(query: string): UNSPSCCommodityRecord | undefined {
  return lookupUNSPSCByDescription(query);
}

export function getAllTaxonomyRecords(limit: number = 100): UNSPSCCommodityRecord[] {
  return unspscOfficialDictionary.slice(0, limit);
}
