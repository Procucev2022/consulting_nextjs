'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import type { MaterialOpportunityRegisterViewProps } from '../../types/module2Components';
import type {
  MaterialOpportunityItem,
  OpportunityLeverClassification,
  OpportunityLifecycleStatus
} from '../../types/module2OpportunityRegister';
import { Module2OpportunityRegisterApi } from '../../utils/module2OpportunityRegisterApi';
import { logger } from '../../utils/logger';

export const MaterialOpportunityRegisterView: React.FC<MaterialOpportunityRegisterViewProps> = ({
  assessmentId
}) => {
  const [opportunities, setOpportunities] = useState<MaterialOpportunityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<OpportunityLeverClassification | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<OpportunityLifecycleStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOpp, setSelectedOpp] = useState<MaterialOpportunityItem | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const [csvUrl, setCsvUrl] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Module2OpportunityRegisterApi.getOpportunityRegister({
        assessmentId,
        type: selectedType === 'ALL' ? undefined : selectedType,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined
      });
      if (res) {
        setOpportunities(res.opportunities || []);
      }
    } catch (err) {
      logger.error('Failed to load Opportunity Register items', { assessmentId }, err);
    } finally {
      setLoading(false);
    }
  }, [assessmentId, selectedType, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCsv = () => {
    const url = Module2OpportunityRegisterApi.getExportCsvUrl(assessmentId);
    setCsvUrl(url);
    setTimeout(() => {
      downloadLinkRef.current?.click();
    }, 50);
  };

  const getLeverBadge = (type: OpportunityLeverClassification) => {
    switch (type) {
      case 'DIRECT_PRICE_IMPROVEMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>Direct Price</span>
          </span>
        );
      case 'SUPPLIER_CONSOLIDATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Vendor Consolidation</span>
          </span>
        );
      case 'VOLUME_DEMAND_CONSOLIDATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" />
            <span>Volume Pooling</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <span>Spec Review</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden Declarative Anchor for CSV Download */}
      <a
        ref={downloadLinkRef}
        href={csvUrl}
        download={`OPPORTUNITY_REGISTER_${assessmentId}.csv`}
        className="hidden"
        aria-hidden="true"
      >
        Export
      </a>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code, description, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Lever Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OpportunityLeverClassification | 'ALL')}
              className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Sourcing Levers</option>
              <option value="DIRECT_PRICE_IMPROVEMENT">Direct Price Improvement</option>
              <option value="SUPPLIER_CONSOLIDATION">Supplier Base Consolidation</option>
              <option value="VOLUME_DEMAND_CONSOLIDATION">Volume & Demand Consolidation</option>
              <option value="SPECIFICATION_PROCESS_REVIEW">Specification Rationalisation</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OpportunityLifecycleStatus | 'ALL')}
            className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="IDENTIFIED">Identified</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VALIDATED">Validated</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="AWARDED">Awarded</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Traceable CSV</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="py-2.5 px-3">Opportunity ID</th>
                <th className="py-2.5 px-3">Lever Type</th>
                <th className="py-2.5 px-3">Material & Description</th>
                <th className="py-2.5 px-3">UOM</th>
                <th className="py-2.5 px-3 text-right">Spend (₹ Cr)</th>
                <th className="py-2.5 px-3 text-right">Defensible Opp (₹ Cr)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Suppliers Involved</th>
                <th className="py-2.5 px-3">Required Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading opportunities...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No matching opportunities found.
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => (
                  <tr
                    key={opp.opportunityId}
                    onClick={() => setSelectedOpp(opp)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold whitespace-nowrap">
                      {opp.opportunityId}
                    </td>
                    <td className="py-2.5 px-3">{getLeverBadge(opp.opportunityType)}</td>
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {opp.materialCode}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {opp.materialDescription}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {opp.uom}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      ₹{opp.historicalSpendCr.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {opp.defensibleOpportunityValueCr ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ₹{opp.defensibleOpportunityValueCr.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Pending Terms</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {opp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600 dark:text-slate-300 text-[11px]">
                      {opp.suppliersInvolved.join(', ') || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-slate-500 dark:text-slate-400 text-[11px]">
                      {opp.requiredProcurementAction}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Opportunity Detail Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                  {selectedOpp.opportunityId}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedOpp.materialCode} — {selectedOpp.materialDescription}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpp(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Category</span>
                <div className="font-semibold text-slate-900 dark:text-white">{selectedOpp.category}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Supporting Txs</span>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {selectedOpp.supportingTransactionCount} Transactions
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Historical Spend</span>
                <div className="font-bold text-slate-900 dark:text-white">₹{selectedOpp.historicalSpendCr} Cr</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Defensible Opportunity</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedOpp.defensibleOpportunityValueCr
                    ? `₹${selectedOpp.defensibleOpportunityValueCr} Cr`
                    : 'Pending Commercial Agreement'}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Opportunity Rationale:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{selectedOpp.rationale}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Calculation Methodology:</span>
                <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                  {selectedOpp.calculationMethodology}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Data Quality & Comparability:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedOpp.dataQualityChecks.map((chk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded text-[10px] font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{chk}</span>
                    </span>
                  ))}
                  {selectedOpp.reviewFlags.map((flg, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded text-[10px] font-semibold flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>{flg}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Required Action:</span>
                <p className="text-cyan-700 dark:text-cyan-300 font-medium mt-0.5">
                  {selectedOpp.requiredProcurementAction}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Responsible Validation Team:</span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">{selectedOpp.responsibleValidationTeam}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
