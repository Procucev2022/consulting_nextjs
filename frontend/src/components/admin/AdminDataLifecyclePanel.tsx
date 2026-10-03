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
      className={`rounded-xl border border-[#DCE7F5] bg-white p-5 text-[#0B1B33] shadow-sm ${className}`}
      data-testid="admin-data-lifecycle-panel"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DCE7F5] pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#0B1B33] tracking-wide flex items-center gap-2">
            <span role="img" aria-label="Lifecycle Shield">🛡️</span>
            {UI_STRINGS.enterprisePrivacy.adminLifecycleTitle}
          </h3>
          <p className="mt-1 text-xs text-[#64748B]">
            {UI_STRINGS.enterprisePrivacy.adminLifecyclePolicy}
          </p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Admin Governance Scope
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#DCE7F5] bg-[#F8FBFE] text-[#64748B]">
              <th className="py-2 px-3 font-semibold">Dataset ID</th>
              <th className="py-2 px-3 font-semibold">Name</th>
              <th className="py-2 px-3 font-semibold">Created</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 font-semibold">Last Processed</th>
              <th className="py-2 px-3 font-semibold">Retention Policy</th>
              <th className="py-2 px-3 font-semibold">Deletion Eligibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE7F5] text-xs">
            {records.map((rec) => (
              <tr key={rec.datasetId} className="hover:bg-[#EEF7FF] transition-colors">
                <td className="py-2.5 px-3 text-[#0284C7] font-mono font-semibold">{rec.datasetId}</td>
                <td className="py-2.5 px-3 font-sans text-[#0B1B33] font-medium">{rec.datasetName}</td>
                <td className="py-2.5 px-3 text-[#64748B] font-mono text-[11px]">{rec.datasetCreated.split('T')[0]}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    {rec.datasetStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[#64748B] font-mono text-[11px]">{rec.lastProcessed.split('T')[0]}</td>
                <td className="py-2.5 px-3 font-sans text-[#475569] max-w-xs truncate" title={rec.retentionStatus}>
                  {rec.retentionStatus}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
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
