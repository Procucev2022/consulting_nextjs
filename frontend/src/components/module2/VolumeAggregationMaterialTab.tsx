/**
 * Module 2 — Lever 4: Volume Aggregation Material Analysis Tab
 * Compliant with Rule 7, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import React, { useState, useMemo } from 'react';
import type { MaterialVolumeProfile } from '../../types/module2VolumeAggregation';

interface VolumeAggregationMaterialTabProps {
  materialProfiles: MaterialVolumeProfile[];
}

export const VolumeAggregationMaterialTab: React.FC<VolumeAggregationMaterialTabProps> = ({ materialProfiles }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return materialProfiles;
    const term = searchTerm.toLowerCase();
    return materialProfiles.filter(
      (m) =>
        m.materialCode.toLowerCase().includes(term) ||
        m.materialDesc.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term) ||
        m.unspscCode.toLowerCase().includes(term)
    );
  }, [materialProfiles, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search Input */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}
      >
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Showing {filteredMaterials.length} of {materialProfiles.length} materials
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter materials by code, description, category..."
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            width: '320px'
          }}
        />
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
              <th style={{ padding: '12px 16px' }}>Material Code</th>
              <th style={{ padding: '12px 16px' }}>Description</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Qty</th>
              <th style={{ padding: '12px 16px' }}>UOM</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Spend (₹ Cr)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Wavg Unit Price</th>
              <th style={{ padding: '12px 16px' }}>Demand Class</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Dispersion Index</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.slice(0, 100).map((m) => (
              <tr key={m.materialId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{m.materialCode}</td>
                <td style={{ padding: '12px 16px', color: '#334155', maxWidth: '240px' }}>{m.materialDesc}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{m.category}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  {m.totalQuantity.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {m.baseUom}
                  {m.hasIncompatibleUom && (
                    <span style={{ color: '#ef4444', fontSize: '10px', display: 'block' }}>
                      [Ambiguous UOM]
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  ₹{m.totalSpendCr.toFixed(4)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>
                  ₹{m.wavgPriceInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    title={m.demandClassificationEvidence || m.demandClassification.replace('_', ' ')}
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {m.demandClassification.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>
                  {m.plantVolumeDispersionIndex.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
