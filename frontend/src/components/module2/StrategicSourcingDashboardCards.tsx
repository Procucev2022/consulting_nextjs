'use client';
import React from 'react';
import {
  DollarSign,
  Gavel,
  Users,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import type { StrategicSourcingDashboardCardsProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const StrategicSourcingDashboardCards: React.FC<StrategicSourcingDashboardCardsProps> = ({
  summary,
  onFilterCardClick,
  activeFilter,
  onOpenHowCalculated
}) => {
  const strings = UI_STRINGS.module2Sourcing;

  const cards = [
    // 1. Total Addressable Spend
    {
      key: 'ADDRESSABLE_SPEND',
      title: strings.cardAddressableSpend,
      value: `₹${summary.totalAddressableSpendInrCr.toFixed(2)} Cr`,
      subtext: `${summary.categoriesAnalyzedCount} Categories Analyzed`,
      icon: DollarSign,
      colorClass: 'from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
    },
    // 2. Proven Opportunity
    {
      key: 'PROVEN_OPP',
      title: strings.cardProvenOpp,
      value: `₹${(summary.provenOpportunityInrCr ?? summary.netQuantifiableOpportunityInrCr).toFixed(2)} Cr`,
      subtext: 'Direct Historical Variance',
      icon: CheckCircle2,
      colorClass: 'from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
    },
    // 3. Quantifiable Range
    {
      key: 'RANGE_OPP',
      title: strings.cardQuantifiableRange,
      value: (summary.quantifiableRangeMaxInrCr ?? 0) > 0
        ? `₹${(summary.quantifiableRangeMinInrCr ?? 0).toFixed(2)} – ₹${(summary.quantifiableRangeMaxInrCr ?? 0).toFixed(2)} Cr`
        : 'Governed by Data',
      subtext: 'Empirical Quartile Model',
      icon: TrendingUp,
      colorClass: 'from-teal-50 to-white dark:from-teal-950/20 dark:to-slate-900 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400'
    },
    // 4. Market Discovery Candidates
    {
      key: 'MARKET_DISCOVERY',
      title: strings.cardMarketDiscovery,
      value: `${summary.marketDiscoveryCandidatesCount ?? summary.eauctionCandidatesCount}`,
      subtext: 'Requires External Tender',
      icon: AlertCircle,
      colorClass: 'from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
    },
    // 5. Potential E-Auction Opportunity
    {
      key: 'E_AUCTION',
      title: strings.cardEAuctionOpp,
      value: `₹${summary.totalPotentialEAuctionOpportunityInrCr.toFixed(2)} Cr`,
      subtext: `${summary.eauctionCandidatesCount} Eligible Categories`,
      icon: Gavel,
      colorClass: 'from-cyan-50 to-white dark:from-cyan-950/20 dark:to-slate-900 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400'
    },
    // 6. Potential Vendor Consolidation Opportunity
    {
      key: 'CONSOLIDATION',
      title: strings.cardConsolidationOpp,
      value: `₹${summary.totalPotentialConsolidationOpportunityInrCr.toFixed(2)} Cr`,
      subtext: `${summary.consolidationCandidatesCount} Tail Clusters`,
      icon: Users,
      colorClass: 'from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
    },
    // 7. Overlapping Opportunity (Deducted)
    {
      key: 'OVERLAP',
      title: strings.cardOverlapOpp,
      value: `-₹${summary.totalOverlappingOpportunityInrCr.toFixed(2)} Cr`,
      subtext: 'Double-Counting Eliminated',
      icon: Layers,
      colorClass: 'from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
    },
    // 8. Net Defensible Opportunity Potential
    {
      key: 'NET_OPP',
      title: strings.cardNetDefensibleRange,
      value: (summary.overallNetDefensibleOpportunityMaxInrCr ?? 0) > summary.netQuantifiableOpportunityInrCr
        ? `₹${(summary.overallNetDefensibleOpportunityMinInrCr ?? summary.netQuantifiableOpportunityInrCr).toFixed(2)} – ₹${(summary.overallNetDefensibleOpportunityMaxInrCr ?? summary.netQuantifiableOpportunityInrCr).toFixed(2)} Cr`
        : `₹${summary.netQuantifiableOpportunityInrCr.toFixed(2)} Cr`,
      subtext: 'Reconciled Defensible Pool',
      icon: Sparkles,
      colorClass: 'from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
    },
    // 9. Opportunities Not Yet Quantifiable
    {
      key: 'NOT_QUANTIFIABLE',
      title: strings.cardNotQuantifiable,
      value: `${summary.opportunitiesNotYetQuantifiableCount}`,
      subtext: 'Harmonization Required',
      icon: HelpCircle,
      colorClass: 'from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
    },
    // 10. Overall Data Confidence
    {
      key: 'CONFIDENCE',
      title: strings.cardDataConfidence,
      value: summary.overallDataConfidence,
      subtext: 'Multi-Source Audit Validated',
      icon: ShieldCheck,
      colorClass: summary.overallDataConfidence === 'HIGH'
        ? 'from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-300 text-emerald-600'
        : 'from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-300 text-amber-600'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {strings.title}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800">
            {strings.versionBadge}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{strings.disclaimer}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isActive = activeFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onFilterCardClick?.(card.key)}
              className={`p-3.5 rounded-xl bg-gradient-to-br border transition-all text-left group relative overflow-hidden ${
                card.colorClass
              } ${
                isActive
                  ? 'ring-2 ring-cyan-500 shadow-md transform scale-[1.02]'
                  : 'hover:shadow-sm hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 line-clamp-1">
                  {card.title}
                </span>
                <Icon className="w-4 h-4 shrink-0 opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-lg lg:text-xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {card.subtext}
                </div>
                {card.key === 'NET_OPP' && onOpenHowCalculated && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenHowCalculated();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        e.preventDefault();
                        onOpenHowCalculated();
                      }
                    }}
                    className="mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-colors inline-block cursor-pointer"
                  >
                    How calculated?
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Executive Governance & Candidate Pipeline Summary */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Based exclusively on qualified historical customer transactions. Not realized savings.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <span className="bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
            {summary.eauctionCandidatesCount} E-Auction Candidates
          </span>
          <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
            {summary.consolidationCandidatesCount} Consolidation Candidates
          </span>
          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            {summary.categoriesReadyForSourcingCount} Sourcing Ready
          </span>
          <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            {summary.opportunitiesNotYetQuantifiableCount} Data Enrichment
          </span>
        </div>
      </div>
    </div>
  );
};
