'use client';
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calculator,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import type { ExecutiveBriefStructureAccordionProps } from '../../types';
import { EXECUTIVE_BRIEF_EXPORT_STRINGS } from '../../constants/executiveBriefExportStrings';

export const ExecutiveBriefStructureAccordion: React.FC<ExecutiveBriefStructureAccordionProps> = ({
  sections,
  expandedGroupIds,
  onToggleGroup,
  expandedDeepDives,
  onToggleDeepDive,
  onDrillEvidence
}) => {
  const strings = EXECUTIVE_BRIEF_EXPORT_STRINGS;
  const [expandedMethodologyIds, setExpandedMethodologyIds] = useState<string[]>([]);
  const [expandedAssumptionIds, setExpandedAssumptionIds] = useState<string[]>([]);
  const [expandedActionPlanIds, setExpandedActionPlanIds] = useState<string[]>([]);

  const toggleMethodology = (id: string): void => {
    setExpandedMethodologyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAssumption = (id: string): void => {
    setExpandedAssumptionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleActionPlan = (id: string): void => {
    setExpandedActionPlanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section aria-labelledby="report-structure-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="report-structure-heading" className="text-xs font-black uppercase tracking-wider text-slate-400">
            {strings.structure.sectionTitle}
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            8 Phased Groups • Executive Conclusions with Deep-Dive Evidence
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((sec) => {
          const isGroupExpanded = expandedGroupIds.includes(sec.groupId);

          return (
            <div
              key={sec.groupId}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
            >
              {/* Collapsible Section Header */}
              <button
                type="button"
                data-testid={`accordion-group-btn-${sec.groupId}`}
                onClick={() => onToggleGroup(sec.groupId)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-900 hover:bg-slate-800/80 transition-colors cursor-pointer"
                aria-expanded={isGroupExpanded}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-cyan-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-slate-700">
                    {sec.groupNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-white">{sec.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {sec.slideRange}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{sec.summary}</p>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 shrink-0 ml-2">
                  {isGroupExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Collapsible Section Content */}
              {isGroupExpanded && (
                <div className="p-4 sm:p-6 border-t border-slate-800 space-y-4 bg-slate-950/40 text-xs text-slate-300">
                  {/* Executive Findings Grid: Standard Attributes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        {strings.structure.backgroundLabel}
                      </span>
                      <p className="text-slate-200 mt-1 leading-relaxed">{sec.background}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-cyan-400 block">
                        {strings.structure.objectiveLabel}
                      </span>
                      <p className="text-slate-200 mt-1 leading-relaxed">{sec.objective}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl md:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                        {strings.structure.findingLabel}
                      </span>
                      <p className="text-white font-semibold text-sm mt-1 leading-relaxed">{sec.finding}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-indigo-400 block">
                        {strings.structure.evidenceLabel}
                      </span>
                      <p className="text-slate-300 mt-1 leading-relaxed">{sec.evidence}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-purple-400 block">
                        {strings.structure.outcomeLabel}
                      </span>
                      <p className="text-slate-200 mt-1 leading-relaxed">{sec.outcome}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-amber-400 block">
                        {strings.structure.actionLabel}
                      </span>
                      <p className="text-slate-200 mt-1 leading-relaxed">{sec.recommendedAction}</p>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-sky-400 block">
                        {strings.structure.nextStepLabel}
                      </span>
                      <p className="text-slate-200 mt-1 leading-relaxed">{sec.nextStep}</p>
                    </div>
                  </div>

                  {/* Deep-Dive Expanders for Finding Detail Cards */}
                  {sec.detailCards.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                      {sec.detailCards.map((card) => {
                        const isCardExpanded = expandedDeepDives.includes(card.findingId);
                        const isMethodologyExpanded = expandedMethodologyIds.includes(card.findingId);
                        const isAssumptionExpanded = expandedAssumptionIds.includes(card.findingId);
                        const isActionPlanExpanded = expandedActionPlanIds.includes(card.findingId);

                        return (
                          <div
                            key={card.findingId}
                            className="bg-slate-900/95 border border-cyan-500/20 rounded-xl p-3.5 sm:p-4 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                  {card.findingId}
                                </span>
                                <span className="font-bold text-white text-xs">{card.title}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-bold text-emerald-400 text-xs block">
                                    {card.indicativeOpportunity || card.potentialValueDisplay}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono block">
                                    {strings.structure.cfoDisclaimer}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  data-testid={`deep-dive-btn-${card.findingId}`}
                                  onClick={() => onToggleDeepDive(card.findingId)}
                                  className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <span>
                                    {isCardExpanded
                                      ? strings.structure.hideDetailedAnalysis
                                      : strings.structure.viewDetailedAnalysis}
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Detailed Supporting Information (Expanded) */}
                            {isCardExpanded && (
                              <div className="pt-3 border-t border-slate-800 text-xs space-y-3 animate-in fade-in">
                                {/* 11 Attributes Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-300">
                                  {card.finding && (
                                    <div className="sm:col-span-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                                        {strings.structure.findingLabel}
                                      </span>
                                      <p className="text-slate-200 mt-0.5">{card.finding}</p>
                                    </div>
                                  )}
                                  {card.addressableBase && (
                                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                                      <span className="text-[10px] font-bold uppercase text-cyan-400 block">
                                        {strings.structure.addressableBaseLabel}
                                      </span>
                                      <p className="text-slate-200 mt-0.5">{card.addressableBase}</p>
                                    </div>
                                  )}
                                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold uppercase text-indigo-400 block">
                                      {strings.structure.confidenceLabel}
                                    </span>
                                    <p className="text-slate-200 mt-0.5">
                                      {card.confidence} — {card.confidenceRationale}
                                    </p>
                                  </div>
                                </div>

                                {/* Expandable Sub-Sections */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  {/* View Methodology Expander */}
                                  <button
                                    type="button"
                                    data-testid={`methodology-btn-${card.findingId}`}
                                    onClick={() => toggleMethodology(card.findingId)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                                  >
                                    <Calculator className="w-3 h-3" />
                                    <span>
                                      {isMethodologyExpanded
                                        ? strings.structure.hideMethodology
                                        : strings.structure.viewMethodology}
                                    </span>
                                  </button>

                                  {/* View Assumptions Expander */}
                                  <button
                                    type="button"
                                    data-testid={`assumptions-btn-${card.findingId}`}
                                    onClick={() => toggleAssumption(card.findingId)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                                  >
                                    <HelpCircle className="w-3 h-3" />
                                    <span>
                                      {isAssumptionExpanded
                                        ? strings.structure.hideAssumptions
                                        : strings.structure.viewAssumptions}
                                    </span>
                                  </button>

                                  {/* View Action Plan Expander */}
                                  <button
                                    type="button"
                                    data-testid={`action-plan-btn-${card.findingId}`}
                                    onClick={() => toggleActionPlan(card.findingId)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>
                                      {isActionPlanExpanded
                                        ? strings.structure.hideActionPlan
                                        : strings.structure.viewActionPlan}
                                    </span>
                                  </button>
                                </div>

                                {/* Expanded Methodology Content */}
                                {isMethodologyExpanded && (
                                  <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-800/40 text-[11px] space-y-1">
                                    <span className="font-bold text-cyan-400 block uppercase">
                                      {strings.structure.methodologyLabel}
                                    </span>
                                    <p className="text-slate-300 leading-relaxed">
                                      {card.methodology || card.analysis}
                                    </p>
                                  </div>
                                )}

                                {/* Expanded Assumptions Content */}
                                {isAssumptionExpanded && (
                                  <div className="bg-slate-950/80 p-3 rounded-lg border border-amber-800/40 text-[11px] space-y-1">
                                    <span className="font-bold text-amber-400 block uppercase">
                                      {strings.structure.assumptionLabel}
                                    </span>
                                    <p className="text-slate-300 leading-relaxed">
                                      {card.assumption || 'Standard procurement variance and baseline assumptions.'}
                                    </p>
                                  </div>
                                )}

                                {/* Expanded Action Plan Content */}
                                {isActionPlanExpanded && (
                                  <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-800/40 text-[11px] space-y-2">
                                    <div>
                                      <span className="font-bold text-emerald-400 block uppercase">
                                        {strings.structure.actionLabel}
                                      </span>
                                      <p className="text-slate-300 mt-0.5">
                                        {card.recommendedAction || card.nextStep}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-sky-400 block uppercase">
                                        {strings.structure.expectedOutcomeLabel}
                                      </span>
                                      <p className="text-slate-300 mt-0.5">{card.expectedOutcome || card.outcome}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-400 block uppercase">
                                        {strings.structure.nextStepLabel}
                                      </span>
                                      <p className="text-slate-300 mt-0.5">{card.nextStep}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                                  <span className="text-slate-400 font-mono">
                                    Ref: {card.detailedAnalysisRef}
                                  </span>
                                  <button
                                    type="button"
                                    data-testid={`drill-evidence-btn-${card.findingId}`}
                                    onClick={() => onDrillEvidence(card.findingId)}
                                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>{strings.structure.viewEvidence}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
