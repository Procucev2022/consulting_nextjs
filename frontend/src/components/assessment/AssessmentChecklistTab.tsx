import React, { useState } from 'react';
import { ASSESSMENT_MODULES, MODULE_GATES_LIST } from '../../constants';
import { UI_STRINGS } from '../../constants/uiStrings';
import type { AssessmentChecklistTabProps, AssessmentReviewGateStatus } from '../../types';

export const AssessmentChecklistTab: React.FC<AssessmentChecklistTabProps> = ({
  assessment, gates, savingGateKey, onSaveGate
}) => {
  const [drafts, setDrafts] = useState<Record<string, { evidenceReference: string; reviewNote: string }>>({});
  const [saveFailedGateKey, setSaveFailedGateKey] = useState<string | null>(null);
  const isApproved = assessment.status === 'APPROVED' || assessment.status === 'DELIVERED';
  const labels = UI_STRINGS.assessmentChecklist;
  const gateByKey = new Map(gates.map((gate) => [gate.gateKey, gate]));
  const pendingCount = MODULE_GATES_LIST.filter((gate) => gateByKey.get(gate.key)?.status !== 'PASSED').length;

  const saveGate = async (gateKey: string, status: AssessmentReviewGateStatus): Promise<void> => {
    const persisted = gateByKey.get(gateKey);
    const draft = drafts[gateKey];
    const evidenceReference = draft?.evidenceReference ?? persisted?.evidenceReference ?? '';
    const reviewNote = draft?.reviewNote ?? persisted?.reviewNote ?? '';
    const saved = await onSaveGate({ gateKey, status, evidenceReference, reviewNote });
    setSaveFailedGateKey(saved ? null : gateKey);
    if (saved) {
      setDrafts((current) => {
        const next = { ...current };
        delete next[gateKey];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">{labels.heading}</h3>
          <p className="text-xs text-slate-400">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
            {labels.evidencePendingCount(pendingCount)}
          </span>
          <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
            isApproved
              ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
              : 'bg-amber-950 border-amber-800 text-amber-400'
          }`}>
            {isApproved ? labels.approvedStatus : labels.analystReviewStatus}
          </span>
        </div>
      </div>

      {ASSESSMENT_MODULES.map((moduleName, moduleIndex) => {
        const gates = MODULE_GATES_LIST.filter((gate) => gate.module === moduleName);
        const moduleSubtitle = [
          labels.moduleSubtitles.module1,
          labels.moduleSubtitles.module2,
          labels.moduleSubtitles.module3,
          labels.moduleSubtitles.module4
        ][moduleIndex];

        return (
          <div key={moduleName} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{moduleName}</span>
                <h4 className="text-xs font-bold text-white">{moduleSubtitle}</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {gates.length} {labels.gateCount}
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {gates.map((gate) => (
                <div key={gate.key} className="p-3.5 hover:bg-slate-800/30 transition-colors flex flex-col gap-3">
                  {(() => {
                    const saved = gateByKey.get(gate.key);
                    const status = saved?.status ?? 'PENDING';
                    const evidenceReference = drafts[gate.key]?.evidenceReference ?? saved?.evidenceReference ?? '';
                    const reviewNote = drafts[gate.key]?.reviewNote ?? saved?.reviewNote ?? '';
                    const statusLabel = status === 'PASSED' ? labels.passedStatus
                      : status === 'BLOCKED' ? labels.blockedStatus : labels.evidenceRequired;
                    const statusColor = status === 'PASSED' ? 'text-emerald-300'
                      : status === 'BLOCKED' ? 'text-rose-300' : 'text-amber-300';
                    const isSaving = savingGateKey === gate.key;
                    return (
                      <>
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${status === 'PASSED' ? 'bg-emerald-400' : status === 'BLOCKED' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                      <span className="text-xs font-semibold text-white">{gate.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {labels.criteriaLabel}: <span className="text-slate-300">{gate.standard}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">{labels.evidenceLabel}</span>
                      <span className={`text-xs font-mono font-semibold ${statusColor}`}>
                        {status === 'PASSED' ? evidenceReference : status === 'BLOCKED' ? labels.blockedStatus : labels.evidenceUnavailable}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${status === 'PASSED' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400' : status === 'BLOCKED' ? 'bg-rose-950/80 border-rose-800 text-rose-400' : 'bg-amber-950/80 border-amber-800 text-amber-400'}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="space-y-1 text-[10px] text-slate-400">
                      <span>{labels.evidenceReferenceLabel}</span>
                      <input
                        aria-label={`${gate.name}: ${labels.evidenceReferenceLabel}`}
                        value={evidenceReference}
                        onChange={(event) => setDrafts((current) => ({ ...current, [gate.key]: {
                          evidenceReference: event.target.value,
                          reviewNote: current[gate.key]?.reviewNote ?? saved?.reviewNote ?? ''
                        } }))}
                        placeholder={labels.evidenceReferencePlaceholder}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                      />
                    </label>
                    <label className="space-y-1 text-[10px] text-slate-400">
                      <span>{labels.reviewNoteLabel}</span>
                      <input
                        aria-label={`${gate.name}: ${labels.reviewNoteLabel}`}
                        value={reviewNote}
                        onChange={(event) => setDrafts((current) => ({ ...current, [gate.key]: {
                          evidenceReference: current[gate.key]?.evidenceReference ?? saved?.evidenceReference ?? '',
                          reviewNote: event.target.value
                        } }))}
                        placeholder={labels.reviewNotePlaceholder}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" disabled={isSaving || evidenceReference.trim().length === 0}
                      onClick={() => void saveGate(gate.key, 'PASSED')}
                      className="rounded border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 disabled:opacity-50">
                      {isSaving ? labels.saving : labels.markPassed}
                    </button>
                    <button type="button" disabled={isSaving || reviewNote.trim().length === 0}
                      onClick={() => void saveGate(gate.key, 'BLOCKED')}
                      className="rounded border border-rose-800 bg-rose-950 px-2.5 py-1 text-[10px] font-semibold text-rose-300 disabled:opacity-50">
                      {labels.markBlocked}
                    </button>
                    {status !== 'PENDING' && (
                      <button type="button" disabled={isSaving}
                        onClick={() => void saveGate(gate.key, 'PENDING')}
                        className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-300 disabled:opacity-50">
                        {labels.resetPending}
                      </button>
                    )}
                    {saveFailedGateKey === gate.key && <span role="alert" className="text-[10px] text-rose-300">{labels.saveFailed}</span>}
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
