'use client';

/**
 * PCBI Column Mapping Section Component
 * Displays schema mapping table with dropdown field assignments
 */

import React from 'react';
import { Settings2 } from 'lucide-react';
import { UI_STRINGS } from '../../../constants';
import {
  PCBI_WORKSHEET_PURPOSE_LABELS,
  PCBI_TARGET_FIELDS
} from '../../../constants/pcbiAdmin';
import type { PCBIColumnMappingSectionProps } from '../../../types/components';

export const PCBIColumnMappingSection: React.FC<PCBIColumnMappingSectionProps> = ({
  mappings,
  selectedSheetForMapping,
  onSelectSheetForMapping,
  onOverrideColumnMapping
}) => {
  return (
    <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings2 size={16} className="text-cyan-400" />
            {UI_STRINGS.pcbiAdmin.columnMappingTitle}
          </h4>
          <p className="text-xs text-slate-400">
            {UI_STRINGS.pcbiAdmin.columnMappingSubtitle}
          </p>
        </div>

        {/* Dataset Selector for Mapping */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Dataset:</span>
          <select
            value={selectedSheetForMapping}
            onChange={(e) => onSelectSheetForMapping(e.target.value)}
            aria-label="Select dataset for column mapping"
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 font-medium"
          >
            {Object.keys(mappings).map((typeKey) => (
              <option key={typeKey} value={typeKey}>
                {PCBI_WORKSHEET_PURPOSE_LABELS[typeKey as keyof typeof PCBI_WORKSHEET_PURPOSE_LABELS] || typeKey}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.excelColHeader}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.mappedFieldHeader}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.confidenceHeader}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.statusHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {(mappings[selectedSheetForMapping] || []).map((m) => (
              <tr key={m.excelColumn} className="hover:bg-slate-800/30">
                <td className="py-2 px-3 font-mono font-medium text-white">{m.excelColumn}</td>
                <td className="py-2 px-3">
                  <select
                    value={m.mappedField}
                    onChange={(e) =>
                      onOverrideColumnMapping(selectedSheetForMapping, m.excelColumn, e.target.value)
                    }
                    aria-label={`Map column ${m.excelColumn}`}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="">(Unmapped / Ignore)</option>
                    {(PCBI_TARGET_FIELDS[selectedSheetForMapping as keyof typeof PCBI_TARGET_FIELDS] || []).map(
                      (tf) => (
                        <option key={tf.field} value={tf.field}>
                          {tf.label} {tf.isRequired ? '*' : ''}
                        </option>
                      )
                    )}
                  </select>
                </td>
                <td className="py-2 px-3">
                  <span className={m.confidence >= 90 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {m.confidence}%
                  </span>
                </td>
                <td className="py-2 px-3">
                  {m.mappedField ? (
                    <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded text-[10px] font-bold">
                      MAPPED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                      OPTIONAL
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
