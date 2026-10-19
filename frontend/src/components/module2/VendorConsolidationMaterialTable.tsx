'use client';

import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import type {
  SameMaterialOpportunity,
  ComparableMaterialOpportunity,
  CrossPlantOpportunity
} from '../../types/module2VendorConsolidation';
import { UI_STRINGS } from '../../constants';

interface VendorConsolidationMaterialTableProps {
  categoryName: string;
  sameMaterialOpportunities: SameMaterialOpportunity[];
  comparableOpportunities: ComparableMaterialOpportunity[];
  crossPlantOpportunities: CrossPlantOpportunity[];
  onBackToSuppliers: () => void;
  onSelectMaterialTransactions: (opportunity: SameMaterialOpportunity) => void;
}

function getActionableBadge(status?: string): string {
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

export const VendorConsolidationMaterialTable: React.FC<VendorConsolidationMaterialTableProps> = ({
  categoryName,
  sameMaterialOpportunities,
  comparableOpportunities,
  crossPlantOpportunities,
  onBackToSuppliers,
  onSelectMaterialTransactions
}) => {
  const strings = UI_STRINGS.module2VendorConsolidation;
  const [subTab, setSubTab] = useState<'sameMaterial' | 'comparable' | 'crossPlant'>('sameMaterial');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      {/* Header & Breadcrumb */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to Suppliers"
            onClick={onBackToSuppliers}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              {strings.breadcrumbSupplier(categoryName)} &rarr; {strings.tabMaterialAnalysis}
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
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              subTab === 'sameMaterial'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Same Material ({sameMaterialOpportunities.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('comparable')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              subTab === 'comparable'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Comparable ({comparableOpportunities.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('crossPlant')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              subTab === 'crossPlant'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cross-Plant ({crossPlantOpportunities.length})
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
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">{strings.colTotalSpend}</th>
                <th className="py-2.5 px-3 text-right">{strings.colQuantity}</th>
                <th className="py-2.5 px-3 text-center">{strings.colDistinctSuppliers}</th>
                <th className="py-2.5 px-3 text-center">{strings.colPlantCount}</th>
                <th className="py-2.5 px-3 text-right">{strings.colPriceRange}</th>
                <th className="py-2.5 px-3 text-right">{strings.colPriceDispersion}</th>
                <th className="py-2.5 px-3">Actionable Status & Next Steps</th>
                <th className="py-2.5 px-3 text-center">{UI_STRINGS.common.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sameMaterialOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500">
                    No multi-sourced materials identified in this category.
                  </td>
                </tr>
              ) : (
                sameMaterialOpportunities.map((m) => {
                  const actStatus = m.actionableStatus || m.status;
                  const status = m.classificationReviewStatus;
                  const isVerified = status === 'TAXONOMY_VERIFIED' || status === 'APPROVED';
                  const isClientApproved = status === 'CLIENT_APPROVED';
                  const isProv = status === 'PROVISIONAL';
                  const displayStatus = isClientApproved
                    ? 'Client Approved'
                    : isVerified
                    ? 'Taxonomy Verified'
                    : isProv
                    ? 'Provisional'
                    : 'Awaiting Review';
                  return (
                    <tr key={m.materialCode || m.materialDesc} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                        <div>{m.materialCode || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-normal font-sans">
                          {m.materialDesc}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {(isVerified || isClientApproved) && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                          {isProv && <Clock className="w-3 h-3 text-blue-500" />}
                          {!isVerified && !isClientApproved && !isProv && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          <span>{m.unspscCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          {displayStatus}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        ₹{m.totalSpendCr.toFixed(4)} Cr
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {m.totalQuantity.toLocaleString()} {m.uom}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                        {m.supplierCount}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 font-semibold">
                        {m.plantCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        ₹{m.lowestUnitPrice.toFixed(2)} – ₹{m.highestUnitPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {m.priceDispersionPct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${getActionableBadge(actStatus)}`}>
                          {actStatus}
                        </span>
                        {m.nextRecommendedAction && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{m.nextRecommendedAction}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectMaterialTransactions(m)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1 mx-auto"
                        >
                          <span>Transactions</span>
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
              No comparable material groups identified in this category.
            </div>
          ) : (
            comparableOpportunities.map((comp) => (
              <div key={comp.groupId} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{comp.groupId}: {comp.relationshipLabel}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">₹{comp.addressableSpendCr.toFixed(4)} Cr</span>
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
              No cross-plant multi-sourced opportunities identified in this category.
            </div>
          ) : (
            crossPlantOpportunities.map((cp) => (
              <div key={cp.code} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{cp.code}: {cp.description}</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">₹{cp.totalSpendCr.toFixed(4)} Cr</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Plants: {cp.plants.join(', ')} | Coordination: {cp.coordinationPotential}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
