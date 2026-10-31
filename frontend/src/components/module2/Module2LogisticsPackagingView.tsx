'use client';

import React, { useEffect, useState } from 'react';
import { UI_STRINGS } from '../../constants';
import type { Module2LogisticsPackagingCandidate, Module2LogisticsPackagingViewProps } from '../../types/module2Logistics';
import { formatINRAmount } from '../../utils/currencyConverter';
import { loadModule2LogisticsCandidates } from '../../utils/module2LogisticsApi';

export const Module2LogisticsPackagingView: React.FC<Module2LogisticsPackagingViewProps> = ({ assessmentId }) => {
  const strings = UI_STRINGS.module2Logistics;
  const [candidates, setCandidates] = useState<Module2LogisticsPackagingCandidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(assessmentId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setCandidates([]);
      setError(null);
      setIsLoading(false);
      return undefined;
    }
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    loadModule2LogisticsCandidates(assessmentId).then((response) => {
      if (isCurrent) setCandidates(response.candidates);
    }).catch((requestError: unknown) => {
      if (isCurrent) {
        setCandidates([]);
        setError(requestError instanceof Error ? requestError.message : strings.requestFailed);
      }
    }).finally(() => {
      if (isCurrent) setIsLoading(false);
    });
    return () => { isCurrent = false; };
  }, [assessmentId, strings.requestFailed]);

  const hasDemoRows = candidates.some((candidate) => candidate.isDemo);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="module2-logistics-title">
      <header>
        <h2 id="module2-logistics-title" className="text-lg font-bold text-slate-900">{strings.title}</h2>
        <p className="mt-1 text-xs text-slate-600">{strings.subtitle}</p>
      </header>
      {!assessmentId && <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{strings.assessmentMissing}</p>}
      {isLoading && <p role="status" className="text-xs text-slate-600">{strings.loading}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      {hasDemoRows && <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">{strings.demoNotice}</p>}
      {!isLoading && !error && assessmentId && candidates.length === 0 && (
        <p role="status" className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{strings.empty}</p>
      )}
      {!isLoading && !error && candidates.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-2">{strings.lane}</th>
                <th className="p-2">{strings.materialCategory}</th>
                <th className="p-2">{strings.shippingMode}</th>
                <th className="p-2">{strings.incoterms}</th>
                <th className="p-2">{strings.shipments}</th>
                <th className="p-2">{strings.currentFreight}</th>
                <th className="p-2">{strings.benchmarkFreight}</th>
                <th className="p-2">{strings.packagingSpec}</th>
                <th className="p-2">{strings.containerFill}</th>
                <th className="p-2">{strings.evidenceStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {candidates.map((candidate) => (
                <tr key={candidate.candidateId}>
                  <td className="p-2">{candidate.lane}</td>
                  <td className="p-2">{candidate.materialCategory}</td>
                  <td className="p-2">{candidate.shippingMode}</td>
                  <td className="p-2">{candidate.incoterms}</td>
                  <td className="p-2 tabular-nums">{candidate.shipmentCount}</td>
                  <td className="p-2 tabular-nums">{formatINRAmount(candidate.currentFreightInr)}</td>
                  <td className="p-2 tabular-nums">{candidate.benchmarkFreightInr === null
                    ? strings.notRecorded
                    : formatINRAmount(candidate.benchmarkFreightInr)}</td>
                  <td className="p-2">{candidate.packagingSpec}</td>
                  <td className="p-2 tabular-nums">{candidate.containerFillPct === null
                    ? strings.notRecorded
                    : strings.fillPercent(candidate.containerFillPct)}</td>
                  <td className="p-2">
                    {candidate.isDemo ? strings.demoOnly : candidate.evidenceStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
