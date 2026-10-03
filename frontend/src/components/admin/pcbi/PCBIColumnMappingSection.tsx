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
    <div className="p-5 bg-white border border-[#DCE7F5] rounded-xl space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-[#0B1B33] flex items-center gap-2">
            <Settings2 size={16} className="text-[#0284C7]" />
            {UI_STRINGS.pcbiAdmin.columnMappingTitle}
          </h4>
          <p className="text-xs text-[#475569]">
            {UI_STRINGS.pcbiAdmin.columnMappingSubtitle}
          </p>
        </div>

        {/* Dataset Selector for Mapping */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#475569]">Target Dataset:</span>
          <select
            value={selectedSheetForMapping}
            onChange={(e) => onSelectSheetForMapping(e.target.value)}
            aria-label="Select dataset for column mapping"
            className="bg-white border border-[#DCE7F5] text-[#0B1B33] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] font-medium"
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
            <tr className="border-b border-[#DCE7F5] bg-[#F8FBFE] text-[#475569]">
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.excelColHeader}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.mappedFieldHeader}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.confidenceHeader}</th>
              <th className="py-2 px-3 font-semibold">{UI_STRINGS.pcbiAdmin.statusHeader}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7F5] text-[#0B1B33]">
            {(mappings[selectedSheetForMapping] || []).map((m) => (
              <tr key={m.excelColumn} className="hover:bg-[#EEF7FF] transition-colors">
                <td className="py-2 px-3 font-mono font-medium text-[#0B1B33]">{m.excelColumn}</td>
                <td className="py-2 px-3">
                  <select
                    value={m.mappedField}
                    onChange={(e) =>
                      onOverrideColumnMapping(selectedSheetForMapping, m.excelColumn, e.target.value)
                    }
                    aria-label={`Map column ${m.excelColumn}`}
                    className="bg-white border border-[#DCE7F5] text-[#0B1B33] rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7]"
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
                  <span className={m.confidence >= 90 ? 'text-emerald-600 font-bold tabular-nums' : 'text-amber-600 tabular-nums'}>
                    {m.confidence}%
                  </span>
                </td>
                <td className="py-2 px-3">
                  {m.mappedField ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                      MAPPED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-[#64748B] border border-slate-200 rounded text-[10px] font-medium">
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
