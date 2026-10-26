'use client';

import React from 'react';
import type { PaymentTermsCoverageSummary } from '../../types/module2PaymentTerms';
import { PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS } from '../../constants/module2PaymentTerms';

interface PaymentTermsCoverageTabProps {
  coverageSummary: PaymentTermsCoverageSummary;
}

export const PaymentTermsCoverageTab: React.FC<PaymentTermsCoverageTabProps> = ({ coverageSummary }) => {
  const sum = coverageSummary;
  const gapEntries = Object.entries(sum.gapReasonCounts || {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Coverage Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>COMPLETE RECORDS</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '4px' }}>
            {sum.completeRecordsCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Verified terms & eligible
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PARTIAL RECORDS</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>
            {sum.partialRecordsCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Incomplete or conflicting
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MISSING RECORDS</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
            {sum.missingRecordsCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Terms absent in ERP
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>REQUIRING VALIDATION</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1', marginTop: '4px' }}>
            {sum.recordsRequiringValidationCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Commercial audit needed
          </div>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
          <span>Payment Terms Data Coverage</span>
          <span>{sum.verifiedSpendPct.toFixed(2)}% Verified ({sum.missingSpendPct.toFixed(2)}% Missing)</span>
        </div>
        <div style={{ height: '8px', width: '100%', backgroundColor: '#fee2e2', borderRadius: '4px', overflow: 'hidden', marginTop: '8px', display: 'flex' }}>
          <div style={{ width: `${sum.verifiedSpendPct}%`, backgroundColor: '#059669' }} />
          <div style={{ width: `${sum.missingSpendPct}%`, backgroundColor: '#ef4444' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
          <span>Verified Spend: ₹{sum.verifiedSpendCr.toFixed(4)} Cr</span>
          <span>Missing Spend: ₹{sum.missingSpendCr.toFixed(4)} Cr</span>
        </div>
      </div>

      {/* Data Gap Reasons Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
          Identified Data Gaps & Root Cause Analysis
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '10px 16px' }}>Data Gap Classification</th>
              <th style={{ padding: '10px 16px' }}>Description & Provenance</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>Affected Records</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>Share (%)</th>
            </tr>
          </thead>
          <tbody>
            {gapEntries.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                  No data gaps detected. 100% of records possess complete, verified payment terms.
                </td>
              </tr>
            ) : (
              gapEntries.map(([gap, count]) => {
                const desc = PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS[gap as keyof typeof PAYMENT_TERMS_DATA_GAP_DESCRIPTIONS] || gap;
                const pct = sum.totalRecordsCount > 0 ? ((count / sum.totalRecordsCount) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={gap} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                      {gap}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#475569' }}>{desc}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {count.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }}>
                      {pct}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
