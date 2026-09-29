'use client';
import React, { useState } from 'react';
import { Calculator, FileText } from 'lucide-react';
import type { CategoryStrategicSourcingProfile } from '../../types';
import { UI_STRINGS } from '../../constants';
import { PairwisePriceComparisonView } from './PairwisePriceComparisonView';
import { OpportunityExclusionLedgerView } from './OpportunityExclusionLedgerView';
import { TransactionEvidenceDrawer } from './TransactionEvidenceDrawer';
import { EvidenceCalculationTraceModal } from './EvidenceCalculationTraceModal';

interface CategoryEvidenceAuditTabProps {
  profile: CategoryStrategicSourcingProfile;
}

export const CategoryEvidenceAuditTab: React.FC<CategoryEvidenceAuditTabProps> = ({ profile }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const strings = UI_STRINGS.module2Sourcing;

  const totalTxns = profile.transactionEvidenceRecords?.length || profile.transactionCount;
  const oppCr = profile.netQuantifiableOpportunityInrCr?.toFixed(2) || '0.00';

  return (
    <div className="space-y-5">
      {/* Audit Header Banner & Trace Action Buttons */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
              AUDIT & TRANSACTION EVIDENCE (SECTION R-T)
            </span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {strings.sectionAuditHandoff}
            </h4>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsTraceModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Why ₹{oppCr} Cr? (Trace)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-600" />
              <span>View All {totalTxns} Transactions</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 font-sans">Calculation ID:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">{profile.calculationId}</div>
          </div>
          <div>
            <span className="text-slate-400 font-sans">Formula Version:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">{profile.calculationVersion}</div>
          </div>
          <div>
            <span className="text-slate-400 font-sans">Timestamp:</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">{profile.calculationTimestamp}</div>
          </div>
          <div>
            <span className="text-slate-400 font-sans">Evidence Population:</span>
            <div className="font-bold text-emerald-600 dark:text-emerald-400">{totalTxns} txns audited</div>
          </div>
        </div>
      </div>

      {/* Pairwise Price Difference Proofs (Rule 4) */}
      <PairwisePriceComparisonView proofs={profile.pairwisePriceProofs} />

      {/* Opportunity Exclusion Ledger (Rule 9) */}
      <OpportunityExclusionLedgerView ledger={profile.exclusionLedger} />

      {/* Transaction Evidence Drawer Modal */}
      <TransactionEvidenceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categoryName={profile.categoryName}
        records={profile.transactionEvidenceRecords}
      />

      {/* "WHY ₹X?" Calculation Trace Modal */}
      <EvidenceCalculationTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        profile={profile}
      />
    </div>
  );
};
