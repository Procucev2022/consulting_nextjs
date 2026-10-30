/**
 * Module 2 — Lever 10: New-Vendor Development & Alternate Sourcing View
 * Compliant with Rule 4, 7, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import type {
  AlternateSourcingResult,
  AlternateSourcingViewProps,
  GeographicPreference,
  AlternateVendorMatchType
} from '../../types/module2AlternateSourcing';
import {
  ALTERNATE_SOURCING_UI_STRINGS,
  GEOGRAPHIC_PREFERENCE_OPTIONS,
  MATCH_TYPE_LABELS
} from '../../constants/module2AlternateSourcing';
import { AlternateSourcingOpportunityCard } from './AlternateSourcingOpportunityCard';
import { AlternateSourcingKpiCards } from './AlternateSourcingKpiCards';
import { authApiClient } from '../../utils/api';
import logger from '../../utils/logger';

export const AlternateSourcingView: React.FC<AlternateSourcingViewProps> = ({ assessmentId }) => {
  const strings = ALTERNATE_SOURCING_UI_STRINGS;

  const [data, setData] = useState<AlternateSourcingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(assessmentId));
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'singleSource' | 'disclosures'>('all');
  const [geoPreference, setGeoPreference] = useState<GeographicPreference>('ALL_LOCATIONS');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedMatchType, setSelectedMatchType] = useState<AlternateVendorMatchType | 'ALL'>('ALL');

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!assessmentId?.trim()) {
      setData(null);
      setError(strings.ASSESSMENT_REQUIRED);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        assessmentId,
        geographicPreference: geoPreference
      });
      if (forceRefresh) params.set('refresh', 'true');
      if (selectedState) params.set('preferredState', selectedState);
      if (selectedCity) params.set('preferredCity', selectedCity);
      if (selectedMatchType !== 'ALL') {
        params.append('matchType', selectedMatchType);
      }

      const token = authApiClient.getStoredToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/module2/sourcing/alternate-sourcing?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load alternate sourcing data: HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Unknown server error');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching alternate sourcing data';
      setError(msg);
      logger.error('Alternate Sourcing fetch failure', { assessmentId, error: msg });
    } finally {
      setLoading(false);
    }
  }, [assessmentId, geoPreference, selectedState, selectedCity, selectedMatchType, strings.ASSESSMENT_REQUIRED]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const opportunities = data?.opportunities || [];
  const filteredOpportunities = opportunities.filter((o) => {
    if (activeTab === 'singleSource') return o.currentSupplierCount === 1;
    return true;
  });

  const availableCities = data?.availableCities || [];

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="alternate-sourcing-view">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
              {strings.BADGE}
            </span>
            <span className="text-xs text-slate-400 font-mono">{strings.SUBTITLE}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2 mt-1">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{strings.TITLE}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {strings.DISCOVERY_NOTICE}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchData(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{strings.BTN_REFRESH}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <AlternateSourcingKpiCards summary={data?.summary} selectedState={selectedState} />

      {/* Filter and Preference Controls */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              {strings.LBL_GEOGRAPHIC_PREFERENCE}
            </label>
            <select
              value={geoPreference}
              onChange={(e) => setGeoPreference(e.target.value as GeographicPreference)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
            >
              {GEOGRAPHIC_PREFERENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              {strings.LBL_SELECT_STATE}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="">{strings.LABEL_ALL_STATES}</option>
              {(data?.availableStates || []).map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              {strings.LBL_SELECT_CITY}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="">{strings.LABEL_ALL_CITIES}</option>
              {availableCities.map((ci) => (
                <option key={ci} value={ci}>{ci}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              {strings.LBL_FILTER_MATCH_TYPE}
            </label>
            <select
              value={selectedMatchType}
              onChange={(e) => setSelectedMatchType(e.target.value as AlternateVendorMatchType | 'ALL')}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{strings.LABEL_ALL_MATCH_TYPES}</option>
              <option value="EXACT">{MATCH_TYPE_LABELS.EXACT}</option>
              <option value="UNMATCHED">{MATCH_TYPE_LABELS.UNMATCHED}</option>
            </select>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            {strings.TAB_ALL_MATERIALS}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('singleSource')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'singleSource'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            {strings.TAB_SINGLE_SOURCE}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disclosures')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'disclosures'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            {strings.TAB_DISCLOSURES}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 rounded-xl border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchData()}
            className="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700"
          >
            {strings.ERROR_RETRY}
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>{strings.LOADING_TEXT}</span>
        </div>
      )}

      {/* Opportunities List */}
      {!loading && activeTab !== 'disclosures' && (
        <div className="space-y-4">
          {filteredOpportunities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {strings.EMPTY_OPPORTUNITIES}
            </div>
          ) : (
            filteredOpportunities.map((opp) => (
              <AlternateSourcingOpportunityCard key={opp.opportunityId} opportunity={opp} />
            ))
          )}
        </div>
      )}

      {/* Disclosures & Policy Tab */}
      {!loading && activeTab === 'disclosures' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            Governance, Deduplication & Commercial Safeguards
          </h4>
          <div className="space-y-3 text-slate-600 dark:text-slate-300">
            <p><strong>1. Discovery Separation:</strong> {strings.NOTICE_DISCOVERY_ONLY}</p>
            <p><strong>2. Commercial Safeguards:</strong> {strings.NOTICE_SAVINGS_SAFEGUARD}</p>
            <p><strong>3. Vendor Identity Privacy:</strong> {strings.NOTICE_PRIVACY_PROTECTION}</p>
            <p><strong>4. Entity Deduplication:</strong> {strings.NOTICE_DEDUPLICATION}</p>
            <p><strong>5. Missing Contact Policy:</strong> {strings.NOTICE_MISSING_CONTACT_DISQUALIFY}</p>
          </div>
        </div>
      )}
    </div>
  );
};
