/**
 * Module 2 — Lever 4: Volume Aggregation Plant Analysis Tab
 * Compliant with Rule 7, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import React from 'react';
import type { PlantVolumeBreakdown } from '../../types/module2VolumeAggregation';

interface VolumeAggregationPlantTabProps {
  plantProfiles: PlantVolumeBreakdown[];
}

export const VolumeAggregationPlantTab: React.FC<VolumeAggregationPlantTabProps> = ({ plantProfiles }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Informational Logistics Notice */}
      <div
        style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#0369a1',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontWeight: 600 }}>ℹ Informational Logistics Notice:</span>
        Plant locations, state jurisdictions, and hub distances are captured as descriptive operational attributes
        only. No automated freight penalties or arbitrary freight savings are applied.
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '12px 16px' }}>Plant Code</th>
              <th style={{ padding: '12px 16px' }}>Facility Name</th>
              <th style={{ padding: '12px 16px' }}>Region & State</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Hub Distance</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Spend (₹ Cr)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Transactions</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Materials</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Suppliers</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Volume Share</th>
            </tr>
          </thead>
          <tbody>
            {plantProfiles.map((p) => (
              <tr key={p.plantCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{p.plantCode}</td>
                <td style={{ padding: '12px 16px', color: '#334155' }}>{p.plantName}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {p.region} ({p.state})
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>
                  {p.hubDistanceKm === 0 ? 'Hub Anchor' : `${p.hubDistanceKm} km`}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  ₹{p.totalSpendCr.toFixed(4)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>
                  {p.transactionCount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>
                  {p.distinctMaterialsCount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>
                  {p.supplierCount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                  {p.volumeSharePct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
