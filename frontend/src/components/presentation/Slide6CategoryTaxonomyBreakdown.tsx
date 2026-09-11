'use client';
import React from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';
import type { PresentationSlideProps } from '../../types';
import { UI_STRINGS } from '../../constants';

export const Slide6CategoryTaxonomyBreakdown: React.FC<PresentationSlideProps> = ({
  slideNumber,
  totalSlides
}) => {
  const strings = UI_STRINGS.presentation.taxonomy;

  const categories = [
    { name: 'Direct Materials', spend: '₹358.66 Cr', target: '18.5%', savings: '₹53.80 Cr', engine: 'proCPX / DPS NXT', badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400' },
    { name: 'Packaging Materials', spend: '₹152.52 Cr', target: '16.1%', savings: '₹25.98 Cr', engine: 'proCPX Capex', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' },
    { name: 'Indirect & MRO', spend: '₹129.05 Cr', target: '14.2%', savings: '₹23.88 Cr', engine: 'DPS NXT Auctions', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400' },
    { name: 'Logistics & Freight', spend: '₹92.18 Cr', target: '12.0%', savings: '₹16.01 Cr', engine: 'DPS NXT Freight', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' }
  ];

  return (
    <div className="presentation-slide flex flex-col justify-between h-full min-h-[580px] p-8 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
            {strings.badge}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {strings.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {strings.subtitle}
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* Category Spend Table */}
      <div className="my-auto py-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{strings.headers.category}</th>
                <th className="py-3 px-4">{strings.headers.baseline}</th>
                <th className="py-3 px-4">{strings.headers.targetPct}</th>
                <th className="py-3 px-4">{strings.headers.savings}</th>
                <th className="py-3 px-4">{strings.headers.engine}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-slate-700 dark:text-slate-300">
              {categories.map((cat) => (
                <tr key={cat.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-slate-900 dark:text-white">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {cat.spend}
                  </td>
                  <td className="py-3.5 px-4 text-cyan-700 dark:text-cyan-400 font-bold">
                    {cat.target}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {cat.savings}
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 ${cat.badge}`}>
                      {cat.engine}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
          <Layers className="w-4 h-4 text-cyan-600" />
          <span>UNSPSC 8-Digit Commodity Matching verified at 99.4% neural semantic confidence.</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Calibrated for Chemical, Automotive & Industrial Sectors</span>
        </div>
      </div>
    </div>
  );
};
