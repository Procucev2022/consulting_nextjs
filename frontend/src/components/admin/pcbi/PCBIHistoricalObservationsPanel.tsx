'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PCBI_HISTORICAL_DISPLAY_DECIMAL_PLACES, PCBI_HISTORICAL_DISPLAY_LOCALE } from '../../../constants/pcbiHistorical';
import { UI_STRINGS } from '../../../constants/uiStrings';
import type { PcbiHistoricalObservationsResponse } from '../../../types/validation';
import { pcbiApiClient } from '../../../utils/pcbiApi';
import frontendLogger from '../../../utils/logger';

const formatNumber = (value: number): string => new Intl.NumberFormat(PCBI_HISTORICAL_DISPLAY_LOCALE, {
  maximumFractionDigits: PCBI_HISTORICAL_DISPLAY_DECIMAL_PLACES
}).format(value);

export const PCBIHistoricalObservationsPanel: React.FC = () => {
  const [response, setResponse] = useState<PcbiHistoricalObservationsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);

  const loadObservations = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await pcbiApiClient.getPCBIHistoricalObservations();
      if (isMountedRef.current) setResponse(result);
    } catch (error) {
      if (!isMountedRef.current) return;
      const reason = error instanceof Error ? error.message : String(error);
      setLoadError(UI_STRINGS.pcbiAdmin.historicalObservationsLoadFailed(reason));
      frontendLogger.error('Archived monthly PCBI history could not be displayed', {
        feature: 'pcbi-historical-observations'
      }, error);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadObservations();
    return () => { isMountedRef.current = false; };
  }, [loadObservations]);

  const observations = response?.data.observations || [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="pcbi-historical-observations-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="pcbi-historical-observations-title" className="text-base font-bold text-slate-900">
            {UI_STRINGS.pcbiAdmin.historicalObservationsTitle}
          </h3>
          <p className="mt-1 max-w-4xl text-sm text-slate-600">
            {UI_STRINGS.pcbiAdmin.historicalObservationsDescription}
          </p>
        </div>
        {response && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            {UI_STRINGS.pcbiAdmin.historicalArchiveBadge}
          </span>
        )}
      </div>

      {isLoading && <p role="status" className="py-4 text-sm text-slate-600">{UI_STRINGS.pcbiAdmin.historicalObservationsLoading}</p>}

      {loadError && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadObservations()} className="mt-2 font-semibold underline">
            {UI_STRINGS.pcbiAdmin.historicalObservationsRetry}
          </button>
        </div>
      )}

      {!isLoading && !loadError && response && (
        <>
          <p className="mb-3 text-xs font-medium text-slate-600" role="status">
            {UI_STRINGS.pcbiAdmin.historicalObservationsCount(response.data.count)}
          </p>
          {observations.length === 0 ? (
            <p className="py-4 text-sm text-slate-600">{UI_STRINGS.pcbiAdmin.historicalObservationsEmpty}</p>
          ) : (
            <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">{UI_STRINGS.pcbiAdmin.historicalColPcbiId}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{UI_STRINGS.pcbiAdmin.historicalColDate}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{UI_STRINGS.pcbiAdmin.historicalColValueInr}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{UI_STRINGS.pcbiAdmin.historicalColOriginalValue}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{UI_STRINGS.pcbiAdmin.historicalColCurrency}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{UI_STRINGS.pcbiAdmin.historicalColFxRate}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{UI_STRINGS.pcbiAdmin.historicalColUnit}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{UI_STRINGS.pcbiAdmin.historicalColSource}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{UI_STRINGS.pcbiAdmin.historicalColStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {observations.map((observation) => (
                    <tr key={`${observation.pcbi_id}-${observation.observation_date}`}>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">{observation.pcbi_id}</td>
                      <td className="whitespace-nowrap px-3 py-2"><time dateTime={observation.observation_date}>{observation.observation_date}</time></td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{formatNumber(observation.value_inr)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{formatNumber(observation.original_value)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{observation.original_currency}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{formatNumber(observation.fx_rate)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{observation.unit}</td>
                      <td className="whitespace-nowrap px-3 py-2">{observation.source}</td>
                      <td className="whitespace-nowrap px-3 py-2">{observation.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
};
