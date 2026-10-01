'use client';
import React from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  FileCheck,
  Building,
  Layers,
  ExternalLink
} from 'lucide-react';
import type { ExecutiveBriefSummaryCardsProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefSummaryCards: React.FC<ExecutiveBriefSummaryCardsProps> = ({
  cards,
  onViewEvidence
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;

  const getCardIcon = (id: string): React.ReactNode => {
    switch (id) {
      case 'kpi-total-spend':
      case 'kpi-addressable-spend':
        return <DollarSign className="w-4 h-4 text-cyan-400" />;
      case 'kpi-identified-opp':
      case 'kpi-opp-count':
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case 'kpi-approved-savings':
      case 'kpi-realized-savings':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'kpi-transactions':
        return <FileCheck className="w-4 h-4 text-indigo-400" />;
      case 'kpi-suppliers':
        return <Building className="w-4 h-4 text-sky-400" />;
      case 'kpi-categories':
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <section aria-labelledby="summary-cards-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="summary-cards-heading" className="text-xs font-black uppercase tracking-wider text-slate-400">
          {strings.summaryCards.title}
        </h2>
        <span className="text-[11px] text-slate-500 font-mono">100% Certified Data Lineage</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => {
          const isFinancial =
            card.id.includes('spend') ||
            card.id.includes('opp') ||
            card.id.includes('savings');

          return (
            <div
              key={card.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-white hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800/80">{getCardIcon(card.id)}</div>
                    <span className="text-xs font-semibold text-slate-300">{card.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {card.module}
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  {card.formattedValue}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 truncate max-w-[170px]" title={card.evidenceRef}>
                  {card.evidenceRef}
                </span>

                <button
                  type="button"
                  data-testid={`evidence-btn-${card.id}`}
                  onClick={() => onViewEvidence(card)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>
                    {isFinancial ? strings.summaryCards.viewCalculation : strings.summaryCards.viewEvidence}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
