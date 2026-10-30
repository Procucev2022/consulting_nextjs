/**
 * Module 2 — Lever 10: Alternate Sourcing Opportunity Card Component
 * Compliant with Rule 4, 7, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import React from 'react';
import {
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldAlert,
  Globe,
  Phone
} from 'lucide-react';
import type { AlternateSourcingOpportunityCardProps } from '../../types/module2AlternateSourcing';
import { ALTERNATE_SOURCING_UI_STRINGS, MATCH_TYPE_LABELS } from '../../constants/module2AlternateSourcing';
import { resolveHumanReadableCategory } from '../../utils/procurementCategoryResolver';

export const AlternateSourcingOpportunityCard: React.FC<AlternateSourcingOpportunityCardProps> = ({ opportunity }) => {
  const strings = ALTERNATE_SOURCING_UI_STRINGS;
  const isSingleSource = opportunity.currentSupplierCount === 1;

  return (
    <div
      data-testid={`opportunity-card-${opportunity.opportunityId}`}
      className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
    >
      {/* Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
              {opportunity.opportunityId}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              CATEGORY: {resolveHumanReadableCategory(opportunity.spendCategory)} • SUB: {opportunity.subCategory}
            </span>
            {opportunity.matchType === 'UNMATCHED' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                <AlertTriangle className="w-3 h-3" />
                NO VERIFIED CATEGORY MATCH
              </span>
            )}
            {isSingleSource && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" />
                SINGLE-SOURCE RISK
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            {opportunity.materialDescription}
          </h4>
        </div>

        <div className="text-left md:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            {strings.LBL_CURRENT_SPEND}
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            ₹{opportunity.relevantSpendCr.toFixed(2)} Cr
          </span>
          <span className="text-[10px] text-slate-500 block">
            PLANT: {opportunity.customerPlant}
          </span>
        </div>
      </div>

      {/* Verified Current Suppliers Section */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {strings.LBL_CURRENT_SUPPLIERS} ({opportunity.currentSupplierCount}):
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-400">
            {opportunity.currentSuppliers.join(', ') || strings.VALUE_UNSPECIFIED}
          </span>
        </div>

        {opportunity.excludedCurrentSuppliersCount != null && opportunity.excludedCurrentSuppliersCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" />
            {opportunity.excludedCurrentSuppliersCount} EXCLUDED FROM CATEGORY POOL
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 italic">
            {opportunity.exclusionLimitationNotice || strings.EXCLUSION_UNAVAILABLE_NOTICE}
          </span>
        )}
      </div>

      {/* Discovery Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* All Locations */}
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/60">
          <span className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300 block">
            {strings.LBL_ALL_LOCATIONS_COUNT}
          </span>
          <span className="text-xl font-extrabold text-blue-900 dark:text-blue-100 font-mono mt-1 block">
            {opportunity.potentialVendorsAllLocations.toLocaleString()}
          </span>
          <span className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5 block">
            {strings.SUB_VERIFIED_COUNT}
          </span>
        </div>

        {/* Preferred Region */}
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-900/60">
          <span className="text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300 block">
            {strings.LBL_PREFERRED_REGION_COUNT}
          </span>
          <span className="text-xl font-extrabold text-indigo-900 dark:text-indigo-100 font-mono mt-1 block">
            {opportunity.potentialVendorsPreferredRegion.toLocaleString()}
          </span>
          <span className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5 block">
            REGION: {opportunity.customerPreferredState}
          </span>
        </div>

        {/* Qualification Status */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
            {strings.LBL_QUALIFICATION_STATUS}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
            {opportunity.qualificationStatus === 'DATA_UNAVAILABLE'
              ? strings.VALUE_DATA_UNAVAILABLE : strings.VALUE_UNQUALIFIED}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            {strings.LBL_QUALIFIED_ALTERNATIVES}: {strings.VALUE_DATA_UNAVAILABLE}
          </span>
        </div>
      </div>

      {/* Category Match Breakdown & Geographic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Category Match Type Details */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              {MATCH_TYPE_LABELS[opportunity.matchType]}
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              Matched: {opportunity.matchedVendorCategory}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            {opportunity.matchTypeRationale}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] pt-1">
            <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              Exact Matches: {opportunity.exactMatchesCount.toLocaleString()}
            </span>
            {opportunity.relatedMatchesCount > 0 && (
              <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                Related Category Matches: {opportunity.relatedMatchesCount.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Geographic & Contact Breakdown */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              Regional Breakdown
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              Same State: {opportunity.geographicBreakdown.sameStateCount} • Other: {opportunity.geographicBreakdown.otherStatesCount}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              Website: {opportunity.contactCompleteness.hasWebsiteRatioPct}%
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-500" />
              Phone: {opportunity.contactCompleteness.hasPhoneCount}
            </span>
            <span className="text-[10px] text-slate-500">
              ({opportunity.contactCompleteness.missingContactCount} without web/email)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            {strings.NOTICE_MISSING_CONTACT_DISQUALIFY}
          </p>
        </div>
      </div>

      {/* Disclosures Footer */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>{strings.NOTICE_DISCOVERY_ONLY}</span>
      </div>
    </div>
  );
};
