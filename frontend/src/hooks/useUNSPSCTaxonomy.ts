'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { getTaxonomyLoadState, loadUNSPSCTaxonomy, subscribeTaxonomy } from '../data/unspscTaxonomy';
import type { TaxonomyLoadState } from '../types';

export const useUNSPSCTaxonomy = (enabled = true): TaxonomyLoadState => {
  const state = useSyncExternalStore(subscribeTaxonomy, getTaxonomyLoadState, getTaxonomyLoadState);
  useEffect(() => {
    if (enabled) void loadUNSPSCTaxonomy().catch(() => undefined);
  }, [enabled]);
  return state;
};
