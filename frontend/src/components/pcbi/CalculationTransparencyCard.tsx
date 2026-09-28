'use client';

import React, { useState } from 'react';
import { Calculator, CheckCircle2, Sliders } from 'lucide-react';
import type { CalculationTransparencyCardProps } from '../../types/components';
import { UI_STRINGS } from '../../constants/uiStrings';

export const CalculationTransparencyCard: React.FC<CalculationTransparencyCardProps> = ({
  className = ''
}) => {
  const cStrings = UI_STRINGS.module3.calculationTransparency;

  // Dynamic parameters with Prompt 100 default test case values
  const [basePrice, setBasePrice] = useState<number>(150);
  const [baseIndex, setBaseIndex] = useState<number>(105);
  const [currIndex, setCurrIndex] = useState<number>(110);
  const [actualPrice, setActualPrice] = useState<number>(180);
  const [quantity, setQuantity] = useState<number>(10000);
  const [benchmarkabilityPct, setBenchmarkabilityPct] = useState<number>(70);

  // Exact deterministic calculations per Prompt 100
  const expectedPrice = Number((basePrice * (currIndex / baseIndex)).toFixed(2)); // ₹157.14
  const priceGap = Number((actualPrice - expectedPrice).toFixed(2)); // ₹22.86
  const priceGapPct = Number(((priceGap / expectedPrice) * 100).toFixed(1)); // +14.5%
  const grossOpportunity = Math.max(0, Math.round(priceGap * quantity)); // ₹2,28,600
  const pcbiOpportunity = Math.round(grossOpportunity * (benchmarkabilityPct / 100)); // ₹1,60,020
  const pcbiOpportunityCr = Number((pcbiOpportunity / 10000000).toFixed(2));

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 glass-panel space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{cStrings.title}</span>
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              {cStrings.verifiedBadge}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {cStrings.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800">
            {cStrings.promptTestCaseBadge}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Mathematical Flow */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{cStrings.itemLabel}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{cStrings.itemValue}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{cStrings.vendorLabel}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{cStrings.vendorValue}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{cStrings.baselineDateLabel}</span>
              <span className="font-bold text-cyan-700 dark:text-cyan-400">{cStrings.baselineDateValue}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[9px] block">{cStrings.currentDateLabel}</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">{cStrings.currentDateValue}</span>
            </div>
          </div>

          {/* Formulas */}
          <div className="space-y-3">
            {/* Step 1: Expected Benchmark Price */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Step 1: Expected Benchmark Price</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Baseline Price × (Current Index / Baseline Index)
                </span>
                <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mt-0.5">
                  ₹{basePrice.toFixed(2)} × ({currIndex.toFixed(1)} / {baseIndex.toFixed(1)})
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase block">Expected Price</span>
                <span className="text-base font-black text-cyan-600 dark:text-cyan-400">₹{expectedPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Step 2: Price Gap */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Step 2: Actual Purchase Price Gap</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Actual Price - Expected Benchmark Price
                </span>
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  ₹{actualPrice.toFixed(2)} - ₹{expectedPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase block">Unit Gap (+{priceGapPct}%)</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400">₹{priceGap.toFixed(2)}</span>
              </div>
            </div>

            {/* Step 3: Gross Opportunity */}
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Step 3: Gross Opportunity</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Unit Price Gap × Purchased Volume
                </span>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  ₹{priceGap.toFixed(2)} × {quantity.toLocaleString()} L
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase block">Gross Opportunity</span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400">₹{grossOpportunity.toLocaleString()}</span>
              </div>
            </div>

            {/* Step 4: PCBI Potential Opportunity */}
            <div className="p-3.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-200 uppercase">
                    Step 4: PCBI Potential Opportunity (Benchmark-Adjusted)
                  </span>
                </div>
                <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Gross Opportunity × Benchmarkability %
                </span>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  ₹{grossOpportunity.toLocaleString()} × {benchmarkabilityPct}%
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase block font-bold">
                  Potential Opportunity
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{pcbiOpportunity.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  (~₹{pcbiOpportunityCr.toFixed(2)} Cr)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Parameter Controls */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-600" />
              <span>Interactive Simulator</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setBasePrice(150);
                setBaseIndex(105);
                setCurrIndex(110);
                setActualPrice(180);
                setQuantity(10000);
                setBenchmarkabilityPct(70);
              }}
              className="text-[10px] font-mono text-cyan-600 hover:underline cursor-pointer"
            >
              Reset Prompt Test Case
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Baseline Price (₹):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{basePrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="5"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Baseline Index (I₀):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{baseIndex} pts</span>
              </div>
              <input
                type="range"
                min="80"
                max="150"
                step="1"
                value={baseIndex}
                onChange={(e) => setBaseIndex(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Current PCBI Index (I₁):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{currIndex} pts</span>
              </div>
              <input
                type="range"
                min="80"
                max="150"
                step="1"
                value={currIndex}
                onChange={(e) => setCurrIndex(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Actual Purchase Price (₹):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{actualPrice}</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="5"
                value={actualPrice}
                onChange={(e) => setActualPrice(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>Benchmarkability %:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{benchmarkabilityPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={benchmarkabilityPct}
                onChange={(e) => setBenchmarkabilityPct(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
