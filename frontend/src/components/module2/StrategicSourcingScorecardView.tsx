'use client';
import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import type { StrategicSourcingScorecardViewProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const StrategicSourcingScorecardView: React.FC<StrategicSourcingScorecardViewProps> = ({
  scorecard
}) => {
  const strings = UI_STRINGS.module2Sourcing;

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Award className="w-4 h-4 text-cyan-600" />
            <span>{strings.scorecardTitle}</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent 10-dimension algorithmic feasibility assessment
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Overall Score</div>
            <div className="text-xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {scorecard.overallScore}/100
            </div>
          </div>
          <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Recommendation</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {scorecard.recommendationLabel}
            </div>
          </div>
        </div>
      </div>

      {/* 10 Dimension Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {scorecard.dimensions.map((dim, idx) => {
          return (
            <div
              key={dim.dimension}
              className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-start space-x-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0 mt-0.5">
                  #{idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{dim.dimension}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      ({dim.weightPct}% wt)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {dim.rationale}
                  </div>
                </div>
              </div>

              {/* Dimension Score */}
              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    dim.score >= 7
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : dim.score >= 5
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {dim.score}/10
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Justification Notes */}
      {scorecard.justificationNotes.length > 0 && (
        <div className="p-3 rounded-lg bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 flex items-start space-x-2 text-xs text-cyan-900 dark:text-cyan-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Recommendation Rationale:</span>
            {scorecard.justificationNotes.map((note, i) => (
              <p key={i} className="text-[11px] leading-relaxed">
                {note}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
