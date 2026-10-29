'use client';

import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import type {
  VendorConsolidationMaterialTableProps,
  VendorConsolidationSubTab
} from '../../types/module2VendorConsolidation';
import { UI_STRINGS } from '../../constants';

function getActionableBadgeClass(status?: string): string {
  switch (status) {
    case 'Validated for Sourcing Action':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300';
    case 'Technical Validation Required':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300';
    case 'Supplier/Commercial Validation Required':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300';
    case 'Further Data Required':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300';
  }
}

function getSubTabClass(isActive: boolean): string {
  return `px-3 py-1 rounded-md font-semibold transition-colors ${
    isActive
      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
      : 'text-slate-600 dark:text-slate-400'
  }`;
}

export const VendorConsolidationMaterialTable: React.FC<VendorConsolidationMaterialTableProps> = ({
  categoryName,
  sameMaterialOpportunities,
  comparableOpportunities,
  crossPlantOpportunities,
  onBackToSuppliers,
  onSelectMaterialTransactions
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const [subTab, setSubTab] = useState<VendorConsolidationSubTab>('sameMaterial');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      {/* Header & Breadcrumb */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={strings.ariaBackToSuppliers}
            onClick={onBackToSuppliers}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              {strings.breadcrumbTrail(strings.breadcrumbSupplier(categoryName), strings.tabMaterialAnalysis)}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {strings.materialDrilldownTitle(categoryName)}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {strings.materialDrilldownSubtitle}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('sameMaterial')}
            className={getSubTabClass(subTab === 'sameMaterial')}
          >
            {strings.subTabSameMaterial(sameMaterialOpportunities.length)}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('comparable')}
            className={getSubTabClass(subTab === 'comparable')}
          >
            {strings.subTabComparable(comparableOpportunities.length)}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('crossPlant')}
            className={getSubTabClass(subTab === 'crossPlant')}
          >
            {strings.subTabCrossPlant(crossPlantOpportunities.length)}
          </button>
        </div>
      </div>

      {/* Subtab 1: Same Material Opportunities */}
      {subTab === 'sameMaterial' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">{strings.colMaterialCode}</th>
                <th className="py-2.5 px-3">{strings.colClassificationLabel}</th>
                <th className="py-2.5 px-3 text-right">{strings.colTotalSpend}</th>
                <th className="py-2.5 px-3 text-right">{strings.colQuantity}</th>
                <th className="py-2.5 px-3 text-center">{strings.colDistinctSuppliers}</th>
                <th className="py-2.5 px-3 text-center">{strings.colPlantCount}</th>
                <th className="py-2.5 px-3 text-right">{strings.colPriceRange}</th>
                <th className="py-2.5 px-3 text-right">{strings.colPriceDispersion}</th>
                <th className="py-2.5 px-3">{strings.colActionableStatus}</th>
                <th className="py-2.5 px-3 text-center">{UI_STRINGS.common.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sameMaterialOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500">
                    {strings.noSameMaterialOpportunities}
                  </td>
                </tr>
              ) : (
                sameMaterialOpportunities.map((opportunity) => {
                  const actionableStatus = opportunity.actionableStatus || opportunity.status;
                  const reviewStatus = opportunity.classificationReviewStatus;
                  const isVerified = reviewStatus === 'TAXONOMY_VERIFIED' || reviewStatus === 'APPROVED';
                  const isClientApproved = reviewStatus === 'CLIENT_APPROVED';
                  const isProvisional = reviewStatus === 'PROVISIONAL';
                  const displayStatus = isClientApproved
                    ? strings.reviewStatusClientApproved
                    : isVerified
                    ? strings.reviewStatusTaxonomyVerified
                    : isProvisional
                    ? strings.reviewStatusProvisional
                    : strings.reviewStatusAwaitingReview;

                  return (
                    <tr
                      key={opportunity.materialCode || opportunity.materialDesc}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                        <div>{opportunity.materialCode || UI_STRINGS.common.notAvailable}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-normal font-sans">
                          {opportunity.materialDesc}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {(isVerified || isClientApproved) && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                          {isProvisional && <Clock className="w-3 h-3 text-blue-500" />}
                          {!isVerified && !isClientApproved && !isProvisional && (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          )}
                          <span>{opportunity.unspscCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          {displayStatus}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {strings.formatCrore(opportunity.totalSpendCr.toFixed(4))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {opportunity.totalQuantity.toLocaleString()} {opportunity.uom}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                        {opportunity.supplierCount}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 font-semibold">
                        {opportunity.plantCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {strings.formatPriceRange(
                          opportunity.lowestUnitPrice.toFixed(2),
                          opportunity.highestUnitPrice.toFixed(2)
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {strings.formatPercent(opportunity.priceDispersionPct.toFixed(1))}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${getActionableBadgeClass(actionableStatus)}`}>
                          {actionableStatus}
                        </span>
                        {opportunity.nextRecommendedAction && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{opportunity.nextRecommendedAction}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectMaterialTransactions(opportunity)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1 mx-auto"
                        >
                          <span>{strings.btnDrillDownTxs}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 2: Comparable Materials */}
      {subTab === 'comparable' && (
        <div className="p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          {comparableOpportunities.length === 0 ? (
            <div className="py-6 text-center text-slate-500">
              {strings.noComparableGroups}
            </div>
          ) : (
            comparableOpportunities.map((comp) => (
              <div key={comp.groupId} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{strings.comparableGroupHeading(comp.groupId, comp.relationshipLabel)}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {strings.formatCrore(comp.addressableSpendCr.toFixed(4))}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{comp.similarityBasis}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subtab 3: Cross Plant */}
      {subTab === 'crossPlant' && (
        <div className="p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          {crossPlantOpportunities.length === 0 ? (
            <div className="py-6 text-center text-slate-500">
              {strings.noCrossPlantOpportunities}
            </div>
          ) : (
            crossPlantOpportunities.map((crossPlant) => (
              <div key={crossPlant.code} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{strings.crossPlantHeading(crossPlant.code, crossPlant.description)}</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                    {strings.formatCrore(crossPlant.totalSpendCr.toFixed(4))}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {strings.crossPlantDetail(crossPlant.plants.join(', '), crossPlant.coordinationPotential)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
