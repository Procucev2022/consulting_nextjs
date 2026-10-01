'use client';

import React from 'react';
import type { AdminDataLifecyclePanelProps, AdminDataLifecycleRecordProps } from '../../types/components';
import { UI_STRINGS } from '../../constants/uiStrings';

const DEFAULT_RECORDS: AdminDataLifecycleRecordProps[] = [
  {
    datasetId: 'DS-2024-CUST-8902',
    tenantId: 'TNT-GLOBAL-8902',
    datasetName: 'Customer_Purchase_History_FY22_24.xlsx',
    datasetCreated: '2024-03-31T23:59:59.000Z',
    datasetStatus: 'ACTIVE',
    lastProcessed: '2026-10-01T00:07:30.000Z',
    retentionStatus: UI_STRINGS.enterprisePrivacy.adminLifecyclePolicy,
    deletionEligibility: 'LOCKED_ACTIVE_CONTRACT',
    deletionAuditRecord: 'AUDIT_LOCKED_PENDING_CONTRACT_COMPLETION'
  }
];

/**
 * Admin Data Retention and Deletion Lifecycle Panel (Prompt 254 Section 12)
 * Restricted administrative oversight of dataset retention, status, and deletion eligibility.
 */
export const AdminDataLifecyclePanel: React.FC<AdminDataLifecyclePanelProps> = ({
  records = DEFAULT_RECORDS,
  className = ''
}) => {
  return (
    <div
      className={`rounded-lg border border-slate-700 bg-slate-900/90 p-5 text-slate-200 shadow-md ${className}`}
      data-testid="admin-data-lifecycle-panel"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <span role="img" aria-label="Lifecycle Shield">🛡️</span>
            {UI_STRINGS.enterprisePrivacy.adminLifecycleTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {UI_STRINGS.enterprisePrivacy.adminLifecyclePolicy}
          </p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-emerald-400 border border-slate-700">
          Admin Governance Scope
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 px-3 font-medium">Dataset ID</th>
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Created</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3 font-medium">Last Processed</th>
              <th className="py-2 px-3 font-medium">Retention Policy</th>
              <th className="py-2 px-3 font-medium">Deletion Eligibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {records.map((rec) => (
              <tr key={rec.datasetId} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">{rec.datasetId}</td>
                <td className="py-2.5 px-3 font-sans text-slate-200">{rec.datasetName}</td>
                <td className="py-2.5 px-3 text-slate-400">{rec.datasetCreated.split('T')[0]}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {rec.datasetStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400">{rec.lastProcessed.split('T')[0]}</td>
                <td className="py-2.5 px-3 font-sans text-slate-300 max-w-xs truncate" title={rec.retentionStatus}>
                  {rec.retentionStatus}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {rec.deletionEligibility}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDataLifecyclePanel;
