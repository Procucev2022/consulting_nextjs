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

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string): void => {
    setter((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <section aria-labelledby="report-structure-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="report-structure-heading" className="text-xs font-black uppercase tracking-wider text-[#0B1B33]">
            {strings.structure.sectionTitle}
          </h2>
          <span className="text-[11px] text-[#64748B] font-mono">
            8 Phased Groups • Executive Conclusions with Deep-Dive Evidence
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((sec) => {
          const isGroupExpanded = expandedGroupIds.includes(sec.groupId);
          return (
            <div key={sec.groupId} className="bg-white border border-[#DCE7F5] rounded-2xl overflow-hidden shadow-sm">
              <button
                type="button"
                data-testid={`accordion-group-btn-${sec.groupId}`}
                onClick={() => onToggleGroup(sec.groupId)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-[#F8FBFE] transition-colors cursor-pointer"
                aria-expanded={isGroupExpanded}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284C7] font-mono font-black text-xs flex items-center justify-center shrink-0 border border-sky-200">
                    {sec.groupNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-[#0B1B33]">{sec.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8FBFE] text-[#64748B] border border-[#DCE7F5]">
                        {sec.slideRange}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] mt-0.5 line-clamp-1">{sec.summary}</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[#F8FBFE] border border-[#DCE7F5] text-[#64748B] shrink-0 ml-2">
                  {isGroupExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isGroupExpanded && (
                <div className="p-4 sm:p-6 border-t border-[#DCE7F5] space-y-4 bg-[#F8FBFE] text-xs text-[#475569]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white border border-[#DCE7F5] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-[#64748B] block">{strings.structure.backgroundLabel}</span>
                      <p className="text-[#0B1B33] mt-1 leading-relaxed">{sec.background}</p>
                    </div>
                    <div className="bg-white border border-[#DCE7F5] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-[#0284C7] block">{strings.structure.objectiveLabel}</span>
                      <p className="text-[#0B1B33] mt-1 leading-relaxed">{sec.objective}</p>
                    </div>
                    <div className="bg-white border border-[#DCE7F5] p-3.5 rounded-xl md:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 block">{strings.structure.findingLabel}</span>
                      <p className="text-[#0B1B33] font-semibold text-sm mt-1 leading-relaxed">{sec.finding}</p>
                    </div>
                    <div className="bg-white border border-[#DCE7F5] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 block">{strings.structure.evidenceLabel}</span>
                      <p className="text-[#475569] mt-1 leading-relaxed">{sec.evidence}</p>
                    </div>
                    <div className="bg-white border border-[#DCE7F5] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-purple-700 block">{strings.structure.outcomeLabel}</span>
                      <p className="text-[#0B1B33] mt-1 leading-relaxed">{sec.outcome}</p>
                    </div>
                    <div className="bg-white border border-[#DCE7F5] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">{strings.structure.actionLabel}</span>
                      <p className="text-[#0B1B33] mt-1 leading-relaxed">{sec.recommendedAction}</p>
                    </div>
                    <div className="bg-white border border-[#DCE7F5] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-[#0284C7] block">{strings.structure.nextStepLabel}</span>
                      <p className="text-[#0B1B33] mt-1 leading-relaxed">{sec.nextStep}</p>
                    </div>
                  </div>

                  {sec.detailCards.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#DCE7F5] space-y-3">
                      {sec.detailCards.map((card) => {
                        const isCardExpanded = expandedDeepDives.includes(card.findingId);
                        const isMethExp = expandedMethodologyIds.includes(card.findingId);
                        const isAsmExp = expandedAssumptionIds.includes(card.findingId);
                        const isActExp = expandedActionPlanIds.includes(card.findingId);

                        return (
                          <div key={card.findingId} className="bg-white border border-[#DCE7F5] rounded-xl p-3.5 sm:p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-[#0284C7] border border-sky-200">
                                  {card.findingId}
                                </span>
                                <span className="font-bold text-[#0B1B33] text-xs">{card.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-bold text-emerald-700 text-xs block">
                                    {card.indicativeOpportunity || card.potentialValueDisplay}
                                  </span>
                                  <span className="text-[9px] text-[#64748B] font-mono block">
                                    {strings.structure.cfoDisclaimer}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  data-testid={`deep-dive-btn-${card.findingId}`}
                                  onClick={() => onToggleDeepDive(card.findingId)}
                                  className="text-[#0284C7] hover:text-[#0369A1] font-semibold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <span>{isCardExpanded ? strings.structure.hideDetailedAnalysis : strings.structure.viewDetailedAnalysis}</span>
                                </button>
                              </div>
                            </div>

                            {isCardExpanded && (
                              <div className="pt-3 border-t border-[#DCE7F5] text-xs space-y-3 animate-in fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[#475569]">
                                  {card.finding && (
                                    <div className="sm:col-span-2 bg-[#F8FBFE] p-2.5 rounded-lg border border-[#DCE7F5]">
                                      <span className="text-[10px] font-bold uppercase text-emerald-700 block">{strings.structure.findingLabel}</span>
                                      <p className="text-[#0B1B33] mt-0.5">{card.finding}</p>
                                    </div>
                                  )}
                                  {card.addressableBase && (
                                    <div className="bg-[#F8FBFE] p-2.5 rounded-lg border border-[#DCE7F5]">
                                      <span className="text-[10px] font-bold uppercase text-[#0284C7] block">{strings.structure.addressableBaseLabel}</span>
                                      <p className="text-[#0B1B33] mt-0.5">{card.addressableBase}</p>
                                    </div>
                                  )}
                                  <div className="bg-[#F8FBFE] p-2.5 rounded-lg border border-[#DCE7F5]">
                                    <span className="text-[10px] font-bold uppercase text-indigo-700 block">{strings.structure.confidenceLabel}</span>
                                    <p className="text-[#0B1B33] mt-0.5">{card.confidence} — {card.confidenceRationale}</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    data-testid={`methodology-btn-${card.findingId}`}
                                    onClick={() => toggle(setExpandedMethodologyIds, card.findingId)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0284C7] text-[11px] font-semibold flex items-center gap-1.5 border border-sky-200 cursor-pointer transition-colors"
                                  >
                                    <Calculator className="w-3 h-3" />
                                    <span>{isMethExp ? strings.structure.hideMethodology : strings.structure.viewMethodology}</span>
                                  </button>
                                  <button
                                    type="button"
                                    data-testid={`assumptions-btn-${card.findingId}`}
                                    onClick={() => toggle(setExpandedAssumptionIds, card.findingId)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5 border border-amber-200 cursor-pointer transition-colors"
                                  >
                                    <HelpCircle className="w-3 h-3" />
                                    <span>{isAsmExp ? strings.structure.hideAssumptions : strings.structure.viewAssumptions}</span>
                                  </button>
                                  <button
                                    type="button"
                                    data-testid={`action-plan-btn-${card.findingId}`}
                                    onClick={() => toggle(setExpandedActionPlanIds, card.findingId)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 border border-emerald-200 cursor-pointer transition-colors"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isActExp ? strings.structure.hideActionPlan : strings.structure.viewActionPlan}</span>
                                  </button>
                                </div>

                                {isMethExp && (
                                  <div className="bg-[#F8FBFE] p-3 rounded-lg border border-sky-200 text-[11px] space-y-1">
                                    <span className="font-bold text-[#0284C7] block uppercase">{strings.structure.methodologyLabel}</span>
                                    <p className="text-[#475569] leading-relaxed">{card.methodology || card.analysis}</p>
                                  </div>
                                )}
                                {isAsmExp && (
                                  <div className="bg-[#F8FBFE] p-3 rounded-lg border border-amber-200 text-[11px] space-y-1">
                                    <span className="font-bold text-amber-800 block uppercase">{strings.structure.assumptionLabel}</span>
                                    <p className="text-[#475569] leading-relaxed">{card.assumption || 'Standard procurement variance and baseline assumptions.'}</p>
                                  </div>
                                )}
                                {isActExp && (
                                  <div className="bg-[#F8FBFE] p-3 rounded-lg border border-emerald-200 text-[11px] space-y-2">
                                    <div>
                                      <span className="font-bold text-emerald-700 block uppercase">{strings.structure.actionLabel}</span>
                                      <p className="text-[#475569] mt-0.5">{card.recommendedAction || card.nextStep}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-[#0284C7] block uppercase">{strings.structure.expectedOutcomeLabel}</span>
                                      <p className="text-[#475569] mt-0.5">{card.expectedOutcome || card.outcome}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-[#64748B] block uppercase">{strings.structure.nextStepLabel}</span>
                                      <p className="text-[#475569] mt-0.5">{card.nextStep}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-[#DCE7F5] text-[11px]">
                                  <span className="text-[#64748B] font-mono">Ref: {card.detailedAnalysisRef}</span>
                                  <button
                                    type="button"
                                    data-testid={`drill-evidence-btn-${card.findingId}`}
                                    onClick={() => onDrillEvidence(card.findingId)}
                                    className="text-[#0284C7] hover:text-[#0369A1] font-semibold flex items-center gap-1 cursor-pointer"
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
