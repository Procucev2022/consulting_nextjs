'use client';

import React from 'react';
import type { CrossLeverOverlapItem } from '../../types/module2CategorySpecialisation';
import { CATEGORY_SPECIALISATION_UI_STRINGS } from '../../constants/module2CategorySpecialisation';

interface OverlapTabProps {
  overlapItems: CrossLeverOverlapItem[];
}

export const CategorySpecialisationOverlapTab: React.FC<OverlapTabProps> = ({
  overlapItems
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overlap Policy Box */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}
      >
        <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
          Mandatory Cross-Lever Overlap Controls
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>
          Lever 6 Category Specialisation benefits frequently overlap with other procurement levers (e.g. Price Variation
          with Lever 1, Supplier Rationalisation with Lever 3, Purchasing Consolidation with Lever 4).
          All overlapping line items are marked <strong>OVERLAP REVIEW REQUIRED</strong> and excluded from the net
          indicative opportunity until reviewed by commercial management.
        </p>
      </div>

      {/* Overlap Register Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            {CATEGORY_SPECIALISATION_UI_STRINGS.OVERLAP_TABLE_TITLE}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Auditable register of potential cross-lever duplicate benefits and deduplication treatments.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 14px' }}>Category</th>
                <th style={{ padding: '10px 14px' }}>Opportunity Head</th>
                <th style={{ padding: '10px 14px' }}>Related Lever</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Gross Benefit</th>
                <th style={{ padding: '10px 14px' }}>Overlap Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Net Indicative</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount Excluded</th>
                <th style={{ padding: '10px 14px' }}>Deduplication Rationale & Treatment</th>
              </tr>
            </thead>
            <tbody>
              {overlapItems
                .filter((o) => o.grossPotentialBenefitInr > 0)
                .map((item, idx) => (
                  <tr key={`${item.categoryName}-${item.headKey}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                      {item.categoryName}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      {item.headTitle}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: item.relatedLever ? '#eff6ff' : '#f1f5f9',
                          color: item.relatedLever ? '#1d4ed8' : '#64748b'
                        }}
                      >
                        {item.relatedLever ? item.relatedLever.replace('_', ' ') : 'None'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      ₹{item.grossPotentialBenefitCr.toFixed(2)} Cr
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: item.overlapStatus === 'NO_OVERLAP' ? '#ecfdf5' : '#fef3c7',
                          color: item.overlapStatus === 'NO_OVERLAP' ? '#065f46' : '#92400e'
                        }}
                      >
                        {item.overlapStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: item.netIndicativeBenefitCr > 0 ? '#047857' : '#94a3b8' }}>
                      ₹{item.netIndicativeBenefitCr.toFixed(2)} Cr
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: (item.amountExcludedCr ?? 0) > 0 ? '#b91c1c' : '#94a3b8' }}>
                      ₹{(item.amountExcludedCr ?? 0).toFixed(2)} Cr
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: '#475569', maxWidth: '320px' }}>
                      {item.deduplicationTreatment}
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
