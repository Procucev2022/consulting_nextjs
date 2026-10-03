'use client';

import React from 'react';
import { X, ExternalLink, Layers, Info } from 'lucide-react';
import type { PCBIExplainabilityModalProps } from '../../types/pcbi';
import { UI_STRINGS } from '../../constants/uiStrings';

export const PCBIExplainabilityModal: React.FC<PCBIExplainabilityModalProps> = ({
  isOpen,
  onClose,
  audit
}) => {
  if (!isOpen) return null;

  const expStrings = UI_STRINGS.module3.explainability;
  const fields = expStrings.fields;

  // Use audit data or fall back to the prompt's Bearing 6205 reference example
  const isBearing = audit?.material_code?.includes('BRG') || !audit;
  const benchmarkName = audit?.benchmark_name || (isBearing ? 'Bearing Multi-Constituent Benchmark (Steel + Rubber + Conversion)' : 'Industrial Lubricants Market Index');
  const unspsc = audit?.category || (isBearing ? '31171504 - Ball Bearings' : '15121500 - Lubricants & Oils');
  const pcbiCategory = audit?.category || (isBearing ? 'Bearings & Power Transmission' : 'Industrial Consumables');
  const quality = audit?.quality_rating || (isBearing ? 'B' : 'A');
  const benchmarkability = audit?.benchmarkability_percent ?? 70.0;
  const source = audit?.benchmark_name?.includes('ICIS') ? 'ICIS Chemicals Global' : 'LME Industrial Metals / WPI Industrial Benchmark';
  const sourceUrl = 'https://www.lme.com/en/metals/non-ferrous';
  const geography = 'India / Asia Pacific (Pegged to Global Benchmark)';
  const currency = 'INR (Multi-Currency Normalized)';
  const unit = 'INR per Piece / Litre';
  const frequency = 'Weekly (Monday-to-Sunday)';
  const methodology = isBearing
    ? 'Composite PCBI calculation decomposing purchase price into major economic constituents: Steel (60%), Synthetic Rubber (10%), and Value-Add Conversion (30%). Expected price tracks constituent index movements.'
    : 'Direct published index tracking relative price movement from established baseline period.';
  const pcbiVersion = 'PCBI Master V2.0';
  const lastValidationDate = '2026-08-15';

  const constituents = isBearing
    ? [
        { name: 'Special Alloy Steel (EN31 / 100Cr6)', weight: 60, source: 'LME Steel Index / Indian WPI Steel', quality: 'A', benchmarkability: 100 },
        { name: 'Nitrile Synthetic Rubber (NBR Seals)', weight: 10, source: 'ICIS Petrochemical Rubber Benchmark', quality: 'B', benchmarkability: 100 },
        { name: 'Conversion Cost & Heat Treatment', weight: 30, source: 'Power & Labour Regional Index (Residual)', quality: 'C', benchmarkability: 0 }
      ]
    : [
        { name: 'Group II Base Oil', weight: 70, source: 'ICIS Base Oils Benchmark', quality: 'A', benchmarkability: 100 },
        { name: 'Performance Additive Package', weight: 15, source: 'Specialty Chemicals Index', quality: 'B', benchmarkability: 100 },
        { name: 'HDPE Drum Packaging', weight: 5, source: 'Platts Polymer Resin Index', quality: 'A', benchmarkability: 100 },
        { name: 'Blending & Conversion Margin', weight: 10, source: 'Fixed Conversion Cost Reserve', quality: 'C', benchmarkability: 0 }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FBFE] backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#F8FBFE]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300">
                PROCUCEV BENCHMARK AUDIT
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                Quality {quality}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {expStrings.modalTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {expStrings.modalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#EEF4FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Item & Benchmark Identity */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">{fields.benchmarkName}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{benchmarkName}</span>
              </div>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800">
                {benchmarkability}% Benchmarkable
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">{fields.unspsc}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{unspsc}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">{fields.pcbiCategory}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{pcbiCategory}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[9px] block">{fields.pcbiVersion}</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{pcbiVersion}</span>
              </div>
            </div>
          </div>

          {/* Constituent Breakdown Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>{fields.constituents}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Total Decomposition = 100%
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-[#F8FBFE] text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Constituent Name</th>
                    <th className="py-2.5 px-3">Weight %</th>
                    <th className="py-2.5 px-3">Benchmark Source</th>
                    <th className="py-2.5 px-3">Quality</th>
                    <th className="py-2.5 px-3 text-right">Benchmarkability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {constituents.map((c, idx) => (
                    <tr key={idx} className="bg-white dark:bg-white">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-cyan-700 dark:text-cyan-400">
                        {c.weight}%
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                        {c.source}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#EEF4FC]">
                          {c.quality}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {c.benchmarkability}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Methodology & Provenance */}
          <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 space-y-1.5">
            <span className="text-cyan-800 dark:text-cyan-300 font-bold block flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>{fields.methodology}</span>
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              {methodology}
            </p>
          </div>

          {/* Publication Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{fields.source}</span>
              <span className="text-slate-700 dark:text-slate-300">{source}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{fields.unit}</span>
              <span className="text-slate-700 dark:text-slate-300">{unit}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{fields.geography}</span>
              <span className="text-slate-700 dark:text-slate-300">{geography}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{fields.currency}</span>
              <span className="text-slate-700 dark:text-slate-300">{currency}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{fields.frequency}</span>
              <span className="text-slate-700 dark:text-slate-300">{frequency}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{fields.lastValidationDate}</span>
              <span className="text-slate-700 dark:text-slate-300">{lastValidationDate}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 uppercase text-[9px] block">{fields.sourceUrl}</span>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span className="truncate">{sourceUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#F8FBFE] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#EEF4FC] hover:bg-[#DCE7F5] dark:bg-[#DCE7F5] dark:hover:bg-[#C8D8EF] rounded-xl transition-all cursor-pointer"
          >
            {UI_STRINGS.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
