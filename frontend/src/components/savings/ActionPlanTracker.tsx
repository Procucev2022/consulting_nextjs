'use client';

import React from 'react';
import { Target } from 'lucide-react';
import type { ActionPlanTrackerProps } from '../../types/components';
import type { ActionOwner, ActionPlanItem } from '../../types/savings';
import { UI_STRINGS } from '../../constants/uiStrings';

export const ActionPlanTracker: React.FC<ActionPlanTrackerProps> = ({
  actionPlans = [],
  onUpdateAction,
  className = ''
}) => {
  const aStrings = UI_STRINGS.module4.actionPlan;
  const headers = aStrings.tableHeaders;

  const owners: ActionOwner[] = [
    'Procurement',
    'SCM',
    'Plant',
    'Finance',
    'Technical',
    'Management',
    'Other'
  ];

  const statuses: ActionPlanItem['status'][] = [
    'Open',
    'In Progress',
    'Completed',
    'Deferred'
  ];

  // Default fallback matching Prompt 100 sample (Lubricant PCBI Price Gap, Tata Steel, etc.)
  const plans = actionPlans.length > 0
    ? actionPlans
    : [
        {
          id: 'ACT-001',
          opportunity_id: 'OPP-PCBI-LUB-01',
          action: 'Renegotiate industrial lubricant contract rate with ABC Vendor based on PCBI gap',
          owner: 'Procurement' as const,
          department: 'Direct Materials Sourcing',
          target_date: '2026-10-30',
          priority: 'HIGH' as const,
          expected_value_inr: 2500000,
          expected_value_inr_cr: 0.25,
          status: 'Open' as const,
          comments: 'Benchmark shows ₹22.86/L gap vs expected price of ₹157.14',
          created_at: '2026-09-20T00:00:00Z',
          updated_at: '2026-09-20T00:00:00Z'
        },
        {
          id: 'ACT-002',
          opportunity_id: 'OPP-VEND-STL-02',
          action: 'Execute volume consolidation RFP for Structural Steel Plate 12mm across Jamshedpur plant',
          owner: 'Procurement' as const,
          department: 'Metals & Heavy Sourcing',
          target_date: '2026-11-15',
          priority: 'HIGH' as const,
          expected_value_inr: 6000000,
          expected_value_inr_cr: 0.60,
          status: 'In Progress' as const,
          comments: 'Consolidating volume between Tata Steel and JSW Steel',
          created_at: '2026-09-20T00:00:00Z',
          updated_at: '2026-09-20T00:00:00Z'
        },
        {
          id: 'ACT-003',
          opportunity_id: 'OPP-PO-FAST-03',
          action: 'Establish annual blanket rate contract (SAP ME31K) for high-frequency fastener POs',
          owner: 'SCM' as const,
          department: 'Plant Operations & Maintenance',
          target_date: '2026-12-01',
          priority: 'MEDIUM' as const,
          expected_value_inr: 1200000,
          expected_value_inr_cr: 0.12,
          status: 'Open' as const,
          comments: 'Eliminate 15 spot POs issued per month with master agreement',
          created_at: '2026-09-20T00:00:00Z',
          updated_at: '2026-09-20T00:00:00Z'
        }
      ];

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-white border border-slate-200 dark:border-slate-800 glass-panel space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{aStrings.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {aStrings.subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
            {plans.length} Action Plans Active
          </span>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#F8FBFE] text-slate-700 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{headers.oppId}</th>
                <th className="py-3 px-4">{headers.action}</th>
                <th className="py-3 px-4">{headers.owner}</th>
                <th className="py-3 px-4">{headers.department}</th>
                <th className="py-3 px-4">{headers.priority}</th>
                <th className="py-3 px-4">{headers.targetDate}</th>
                <th className="py-3 px-4">{headers.expectedValue}</th>
                <th className="py-3 px-4 text-right">{headers.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono text-slate-700 dark:text-slate-300">
              {plans.map((p) => (
                <tr
                  key={p.id}
                  className="bg-white dark:bg-white hover:bg-slate-50 dark:hover:bg-[#EEF4FC] transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-bold text-cyan-700 dark:text-cyan-400 block">
                      {p.opportunity_id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">{p.id}</span>
                  </td>
                  <td className="py-3 px-4 font-sans max-w-sm">
                    <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                      {p.action}
                    </div>
                    {p.comments && (
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {p.comments}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <select
                      value={p.owner}
                      onChange={(e) => onUpdateAction?.(p.id, { owner: e.target.value as ActionOwner })}
                      className="bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {owners.map((ow) => (
                        <option key={ow} value={ow}>
                          {ow}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400">
                    {p.department}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-300'
                          : p.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-[#EEF4FC] dark:text-slate-300 border border-slate-300'
                      }`}
                    >
                      {p.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {p.target_date}
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{p.expected_value_inr_cr?.toFixed(2) || (p.expected_value_inr / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <select
                      value={p.status}
                      onChange={(e) =>
                        onUpdateAction?.(p.id, { status: e.target.value as ActionPlanItem['status'] })
                      }
                      className="bg-slate-50 dark:bg-[#F8FBFE] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
