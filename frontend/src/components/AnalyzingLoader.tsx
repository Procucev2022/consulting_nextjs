'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Layers,
  PieChart,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  Loader2,
  X,
  Activity,
  ArrowRight
} from 'lucide-react';
import type {
  AnalyzingLoaderProps,
  AnalyzingPhase,
  AnalyzingStageStatus
} from '../types';
import {
  UI_STRINGS,
  DEFAULT_ANALYZING_PHASES,
  DEFAULT_ANALYZING_METRICS,
  ANALYZING_DEFAULT_DURATION_MS,
  ANALYZING_TICK_INTERVAL_MS,
  ANALYZING_SATELLITE_NODES
} from '../constants';

export const AnalyzingLoader: React.FC<AnalyzingLoaderProps> = ({
  isOpen = true,
  mode = 'overlay',
  title,
  subtitle,
  phases = DEFAULT_ANALYZING_PHASES,
  currentPhaseIndex,
  progress: controlledProgress,
  metrics = DEFAULT_ANALYZING_METRICS,
  onComplete,
  onCancel,
  autoProgress = true,
  speedMultiplier = 1
}) => {
  const [internalProgress, setInternalProgress] = useState<number>(controlledProgress ?? 0);
  const [internalPhaseIdx, setInternalPhaseIdx] = useState<number>(currentPhaseIndex ?? 0);
  const [activePhases, setActivePhases] = useState<AnalyzingPhase[]>(phases);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayTitle = title || UI_STRINGS.analyzingLoader.title;
  const displaySubtitle = subtitle || UI_STRINGS.analyzingLoader.subtitle;

  // Sync controlled props
  useEffect(() => {
    if (controlledProgress !== undefined) {
      setInternalProgress(controlledProgress);
    }
  }, [controlledProgress]);

  useEffect(() => {
    if (currentPhaseIndex !== undefined) {
      setInternalPhaseIdx(currentPhaseIndex);
    }
  }, [currentPhaseIndex]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Automated progression simulation when autoProgress is true
  useEffect(() => {
    if (!isOpen || !autoProgress) return;

    const totalTicks = speedMultiplier && speedMultiplier >= 10
      ? 2
      : Math.max(10, Math.round((ANALYZING_DEFAULT_DURATION_MS / speedMultiplier) / ANALYZING_TICK_INTERVAL_MS));
    let tickCount = 0;

    animTimerRef.current = setInterval(() => {
      tickCount += 1;
      const nextProgress = Math.min(100, Math.round((tickCount / totalTicks) * 100));
      setInternalProgress(nextProgress);

      // Phase distribution: 4 phases (~25% each)
      const phaseIndex = Math.min(3, Math.floor(nextProgress / 25));
      setInternalPhaseIdx(phaseIndex);

      setActivePhases((prev) =>
        prev.map((phase, idx) => {
          let status: AnalyzingStageStatus = 'pending';
          if (idx < phaseIndex) {
            status = 'completed';
          } else if (idx === phaseIndex) {
            status = nextProgress === 100 ? 'completed' : 'in_progress';
          }
          return {
            ...phase,
            status,
            progressPercent: idx < phaseIndex ? 100 : idx === phaseIndex ? Math.min(100, (nextProgress % 25) * 4) : 0
          };
        })
      );

      if (tickCount >= totalTicks) {
        if (animTimerRef.current) clearInterval(animTimerRef.current);
        if (onCompleteRef.current) {
          setTimeout(() => {
            onCompleteRef.current?.();
          }, 150);
        }
      }
    }, ANALYZING_TICK_INTERVAL_MS);

    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
      }
    };
  }, [isOpen, autoProgress, speedMultiplier]);

  if (!isOpen) return null;

  const currentPhase = activePhases[internalPhaseIdx] || activePhases[0];

  const renderIcon = (type?: string, className: string = 'w-5 h-5') => {
    switch (type) {
      case 'database':
        return <Database className={className} />;
      case 'layers':
        return <Layers className={className} />;
      case 'pieChart':
        return <PieChart className={className} />;
      case 'shieldCheck':
        return <ShieldCheck className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const content = (
    <div className="relative w-full max-w-4xl bg-slate-900/95 text-white rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 backdrop-blur-2xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6">
      {/* Background Animated Ambience */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                {UI_STRINGS.analyzingLoader.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {internalProgress}%
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
              {displayTitle}
            </h2>
            <p className="text-xs text-slate-400 max-w-xl line-clamp-1">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label={UI_STRINGS.analyzingLoader.cancelButton}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Middle Pictorial Section: AI Core & Orbital Satellites Diagram */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Pictorial Radar & Constellation Artwork */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 relative overflow-hidden min-h-[300px]">
          {/* SVG Orbital Canvas */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg
              className="absolute inset-0 w-full h-full animate-[spin_25s_linear_infinite]"
              viewBox="0 0 300 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Radar Rings */}
              <circle cx="150" cy="150" r="130" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="150" cy="150" r="95" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1" />
              <circle cx="150" cy="150" r="55" stroke="rgba(6, 182, 212, 0.35)" strokeWidth="1" strokeDasharray="2 2" />

              {/* Crosshair lines */}
              <line x1="150" y1="20" x2="150" y2="280" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" />
              <line x1="20" y1="150" x2="280" y2="150" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" />

              {/* Orbit Constellation Lines connecting Satellites to Hub */}
              <line x1="150" y1="150" x2="55" y2="55" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="1.5" />
              <line x1="150" y1="150" x2="245" y2="55" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1.5" />
              <line x1="150" y1="150" x2="245" y2="245" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.5" />
              <line x1="150" y1="150" x2="55" y2="245" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
            </svg>

            {/* Rotating Radar Sweep Cone */}
            <div
              className="absolute inset-0 w-full h-full rounded-full pointer-events-none animate-spin"
              style={{
                animationDuration: '3.5s',
                background: 'conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0) 0deg, rgba(6, 182, 212, 0) 280deg, rgba(6, 182, 212, 0.25) 360deg)'
              }}
            />

            {/* 4 Orbital Satellite Nodes */}
            {ANALYZING_SATELLITE_NODES.map((node, idx) => {
              const isCurrent = internalPhaseIdx === idx;
              const isDone = internalPhaseIdx > idx || internalProgress === 100;
              let posClass = 'top-4 left-4';
              if (idx === 1) posClass = 'top-4 right-4';
              if (idx === 2) posClass = 'bottom-4 right-4';
              if (idx === 3) posClass = 'bottom-4 left-4';

              return (
                <div
                  key={node.id}
                  className={`absolute ${posClass} flex flex-col items-center transition-all duration-300 transform ${
                    isCurrent ? 'scale-110 z-20' : 'scale-95 z-10 opacity-75'
                  }`}
                >
                  <div
                    className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/50 ring-2 ring-cyan-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      renderIcon(node.iconType, 'w-5 h-5 animate-pulse')
                    ) : (
                      renderIcon(node.iconType, 'w-5 h-5')
                    )}

                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold mt-1 max-w-[80px] text-center truncate ${
                    isCurrent ? 'text-cyan-300' : 'text-slate-400'
                  }`}>
                    {node.shortLabel}
                  </span>
                </div>
              );
            })}

            {/* Central Pulsating AI Core */}
            <div className="relative z-20 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-1 shadow-xl shadow-cyan-500/30 animate-pulse">
                <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center text-center p-2">
                  <Activity className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-[9px] font-black uppercase text-cyan-300 tracking-tighter mt-0.5">
                    {UI_STRINGS.analyzingLoader.orbitHubLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-cyan-300 font-mono mt-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{currentPhase?.badgeLabel || UI_STRINGS.analyzingLoader.orbitHubSub}</span>
          </div>
        </div>

        {/* Right: Phased Pipeline Progress List */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {activePhases.map((phase, idx) => {
              const isActive = idx === internalPhaseIdx;
              const isPast = idx < internalPhaseIdx || internalProgress === 100;

              return (
                <div
                  key={phase.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start space-x-3 ${
                    isActive
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : isPast
                      ? 'bg-slate-900/50 border-emerald-500/30 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60 text-slate-500'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isPast
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isActive
                        ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      renderIcon(phase.iconType, 'w-4 h-4')
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-xs sm:text-sm font-bold truncate ${
                        isActive ? 'text-cyan-300' : isPast ? 'text-white' : 'text-slate-400'
                      }`}>
                        {phase.title}
                      </h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                        isPast
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : isActive
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isPast
                          ? UI_STRINGS.analyzingLoader.statusText.completed
                          : isActive
                          ? UI_STRINGS.analyzingLoader.statusText.inProgress
                          : UI_STRINGS.analyzingLoader.statusText.pending}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {phase.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Progress Gauge */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                {UI_STRINGS.analyzingLoader.overallProgress(internalProgress)}
              </span>
              <span className="font-bold text-cyan-400">{internalProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-150 ease-out shadow-xs shadow-cyan-500"
                style={{ width: `${internalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Metrics Strip */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {UI_STRINGS.analyzingLoader.metrics.recordsAnalyzed}
          </span>
          <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
            {UI_STRINGS.analyzingLoader.metrics.recordsValue(metrics.totalRecords)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {UI_STRINGS.analyzingLoader.metrics.spendEvaluated}
          </span>
          <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 font-mono">
            {UI_STRINGS.analyzingLoader.metrics.spendValue(metrics.spendCrores)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {UI_STRINGS.analyzingLoader.metrics.uniqueVendors}
          </span>
          <div className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
            {UI_STRINGS.analyzingLoader.metrics.vendorsValue(metrics.uniqueVendors)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {UI_STRINGS.analyzingLoader.metrics.confidenceScore}
          </span>
          <div className="text-sm sm:text-base font-black text-cyan-400 mt-0.5 font-mono">
            {UI_STRINGS.analyzingLoader.metrics.confidenceValue(metrics.confidenceScore)}
          </div>
        </div>
      </div>

      {/* Completion Action Button */}
      {internalProgress === 100 && (
        <div className="relative z-10 flex justify-end pt-2">
          <button
            type="button"
            onClick={onComplete || onCancel}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
          >
            <span>{UI_STRINGS.analyzingLoader.viewResultsButton}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  if (mode === 'overlay') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      >
        {content}
      </div>
    );
  }

  return content;
};
