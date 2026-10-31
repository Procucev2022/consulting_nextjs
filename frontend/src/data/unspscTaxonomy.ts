import type { UNSPSCCommodityRecord, TaxonomyLoadState, UNSPSCLookupDetails } from '../types';
import {
  TAXONOMY_API_PATH,
  TAXONOMY_PAGE_SIZE,
  TAXONOMY_PREVIEW_LIMIT,
  UNCLASSIFIED_COMMODITY_CODE,
  UNCLASSIFIED_COMMODITY_TITLE,
  UNCLASSIFIED_CLASS_TITLE,
  UNCLASSIFIED_COMMODITY_RECORD
} from '../constants/taxonomy';
import { taxonomyPageRequestSchema, taxonomyPageResponseSchema } from '../constants/validation';
import { UI_STRINGS } from '../constants/uiStrings';
import frontendLogger from '../utils/logger';

export type { UNSPSCCommodityRecord };
export { UNCLASSIFIED_COMMODITY_RECORD };

// Populated only by the database API. No catalog records are bundled with the app.
export const unspscOfficialDictionary: UNSPSCCommodityRecord[] = [];
let state: TaxonomyLoadState = { isLoading: false, error: null };
let pendingLoad: Promise<void> | undefined;
const listeners = new Set<() => void>();

export const getTaxonomyLoadState = (): TaxonomyLoadState => state;
export const subscribeTaxonomy = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

const publishState = (next: TaxonomyLoadState): void => {
  state = next;
  listeners.forEach((listener) => listener());
};

export const loadUNSPSCTaxonomy = (): Promise<void> => {
  if (unspscOfficialDictionary.length > 0) return Promise.resolve();
  if (pendingLoad) return pendingLoad;
  publishState({ isLoading: true, error: null });
  pendingLoad = (async () => {
    const records: UNSPSCCommodityRecord[] = [];
    let requestId: string = UI_STRINGS.taxonomyData.requestUnavailable;
    try {
      for (let offset = 0; ; offset += TAXONOMY_PAGE_SIZE) {
        const params = taxonomyPageRequestSchema.parse({ limit: TAXONOMY_PAGE_SIZE, offset });
        const query = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
        const response = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL || '') + TAXONOMY_API_PATH + '?' + query.toString());
        requestId = response.headers.get('x-request-id') || requestId;
        if (!response.ok) throw new Error(UI_STRINGS.taxonomyData.httpFailure(response.status));
        const result = taxonomyPageResponseSchema.safeParse(await response.json());
        if (!result.success) throw new Error(UI_STRINGS.taxonomyData.invalidResponse);
        records.push(...result.data.data);
        if (result.data.data.length < TAXONOMY_PAGE_SIZE) break;
      }
      if (records.length === 0) throw new Error(UI_STRINGS.taxonomyData.emptyResponse);
      unspscOfficialDictionary.push(...records);
      publishState({ isLoading: false, error: null });
      frontendLogger.info('Loaded D1 commodity catalog', { records: records.length, requestId });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : UI_STRINGS.taxonomyData.unknownFailure;
      const message = UI_STRINGS.taxonomyData.loadFailed(reason, requestId);
      publishState({ isLoading: false, error: message });
      frontendLogger.error('D1 commodity catalog load failed', { category: 'SERVER_ERROR', message, requestId }, error);
      throw error;
    }
  })().finally(() => { pendingLoad = undefined; });
  return pendingLoad;
};

function escapeRegExp(str: string): string {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function lookupUNSPSCByDescription(query: string): UNSPSCCommodityRecord | undefined {
  if (!query?.trim()) return undefined;
  const q = query.toLowerCase().trim();
  
  // Safe matching: exact code, exact title, exact class, or bounded whole-word/phrase match
  const match = unspscOfficialDictionary.find((item) => {
    const titleLower = item.commodityTitle.toLowerCase();
    const classLower = item.classTitle.toLowerCase();

    if (item.commodityCode === q) return true;
    if (titleLower === q || classLower === q) return true;

    // Whole word / phrase boundary match (avoids substring false positives like "box" matching "boxwood")
    const wordBoundary = new RegExp('(^|[^a-z0-9])' + escapeRegExp(q) + '([^a-z0-9]|$)', 'i');
    if (wordBoundary.test(titleLower) || wordBoundary.test(classLower)) return true;

    // If query contains the full commodity title or class title
    if (q.length > 5 && (q.includes(titleLower) || q.includes(classLower))) return true;

    return false;
  });

  if (match) {
    return {
      ...match,
      classificationStatus: 'CLASSIFIED'
    };
  }

  return {
    ...UNCLASSIFIED_COMMODITY_RECORD
  };
}

export function searchUNSPSCTaxonomy(query: string, category?: string): UNSPSCCommodityRecord[] {
  if (!query && !category) return unspscOfficialDictionary.slice(0, TAXONOMY_PREVIEW_LIMIT);
  const q = query ? query.toLowerCase() : '';
  
  return unspscOfficialDictionary.filter((item) => {
    if (category && category !== 'ALL' && item.coreBucket !== category) return false;
    if (!q) return true;
    return (
      item.commodityCode.includes(q) ||
      item.commodityTitle.toLowerCase().includes(q) ||
      item.classTitle.toLowerCase().includes(q) ||
      item.segmentTitle.toLowerCase().includes(q)
    );
  });
}

export function lookupUNSPSCDetails(queryOrCode: string, fallbackCategory?: string): UNSPSCLookupDetails {
  if (!queryOrCode) {
    return {
      commodityCode: UNCLASSIFIED_COMMODITY_CODE,
      commodityTitle: UNCLASSIFIED_COMMODITY_TITLE,
      classTitle: fallbackCategory || UNCLASSIFIED_CLASS_TITLE,
      coreBucket: fallbackCategory || UNCLASSIFIED_CLASS_TITLE
    };
  }
  const q = queryOrCode.toLowerCase();
  const match = unspscOfficialDictionary.find(
    (item) =>
      item.commodityCode === queryOrCode ||
      item.commodityTitle.toLowerCase().includes(q) ||
      q.includes(item.commodityTitle.toLowerCase()) ||
      item.classTitle.toLowerCase().includes(q)
  );

  return {
    commodityCode: match?.commodityCode || UNCLASSIFIED_COMMODITY_CODE,
    commodityTitle: match?.commodityTitle || UNCLASSIFIED_COMMODITY_TITLE,
    classTitle: match?.classTitle || fallbackCategory || UNCLASSIFIED_CLASS_TITLE,
    coreBucket: match?.coreBucket || fallbackCategory || UNCLASSIFIED_CLASS_TITLE
  };
}


