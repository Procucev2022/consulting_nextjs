'use client';
import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink
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
                  {/* Executive Findings Grid: 7 Standard Attributes */}
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
                                <span className="font-bold text-emerald-400 text-xs">
                                  {card.potentialValueDisplay}
                                </span>
                                <button
                                  type="button"
                                  data-testid={`deep-dive-btn-${card.findingId}`}
                                  onClick={() => onToggleDeepDive(card.findingId)}
                                  className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
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
                              <div className="pt-3 border-t border-slate-800 text-xs space-y-2.5 animate-in fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                                  <div>
                                    <span className="text-slate-500">Analysis Method:</span> {card.analysis}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Confidence:</span> {card.confidence} —{' '}
                                    {card.confidenceRationale}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Risk & Constraint:</span>{' '}
                                    {card.riskConstraint}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Owner & Timeline:</span> {card.owner} (
                                    {card.timeline})
                                  </div>
                                </div>

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
