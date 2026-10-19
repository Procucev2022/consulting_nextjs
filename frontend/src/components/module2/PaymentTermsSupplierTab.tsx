'use client';

import React, { useState } from 'react';
import type { SupplierPaymentTermsProfile, PaymentTermsRecordCoverage } from '../../types/module2PaymentTerms';

interface PaymentTermsSupplierTabProps {
  supplierProfiles: SupplierPaymentTermsProfile[];
  coverageRecords: PaymentTermsRecordCoverage[];
}

export const PaymentTermsSupplierTab: React.FC<PaymentTermsSupplierTabProps> = ({
  supplierProfiles,
  coverageRecords
}) => {
  const [subView, setSubView] = useState<'suppliers' | 'transactions'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = supplierProfiles.filter((s) => {
    const q = searchTerm.toLowerCase();
    return s.supplierName.toLowerCase().includes(q) || s.supplierCode.toLowerCase().includes(q) || s.spendCategory.toLowerCase().includes(q);
  });

  const filteredTransactions = coverageRecords.slice(0, 100).filter((t) => {
    const q = searchTerm.toLowerCase();
    return t.vendorName.toLowerCase().includes(q) || t.poNumber.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSubView('suppliers')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: subView === 'suppliers' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: subView === 'suppliers' ? '#eff6ff' : '#ffffff',
              color: subView === 'suppliers' ? '#1d4ed8' : '#475569'
            }}
          >
            Supplier Profiles ({supplierProfiles.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('transactions')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: subView === 'transactions' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: subView === 'transactions' ? '#eff6ff' : '#ffffff',
              color: subView === 'transactions' ? '#1d4ed8' : '#475569'
            }}
          >
            Transaction Register Preview (Top 100)
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter by name, code or PO..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '12px',
            width: '240px'
          }}
        />
      </div>

      {subView === 'suppliers' ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 16px' }}>Supplier</th>
                <th style={{ padding: '10px 16px' }}>Category</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Total Spend</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Transactions</th>
                <th style={{ padding: '10px 16px' }}>Observed Terms</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Wavg Days</th>
                <th style={{ padding: '10px 16px' }}>Data Availability</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.slice(0, 50).map((s) => (
                <tr key={s.supplierCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.supplierName}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{s.supplierCode}</div>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#475569' }}>{s.spendCategory}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    ₹{s.totalSpendCr.toFixed(4)} Cr
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b' }}>
                    {s.transactionCount.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#334155' }}>
                    {s.observedPaymentTerms.length > 0 ? s.observedPaymentTerms.join(', ') : 'Not Found in Source Data'}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>
                    {s.weightedAvgCreditDays > 0 ? `${s.weightedAvgCreditDays}d` : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor:
                          s.dataAvailability === 'OPPORTUNITY_IDENTIFIED'
                            ? '#dcfce7'
                            : s.dataAvailability === 'DATA_PARTIALLY_AVAILABLE'
                            ? '#fef3c7'
                            : '#fee2e2',
                        color:
                          s.dataAvailability === 'OPPORTUNITY_IDENTIFIED'
                            ? '#166534'
                            : s.dataAvailability === 'DATA_PARTIALLY_AVAILABLE'
                            ? '#92400e'
                            : '#991b1b'
                      }}
                    >
                      {s.dataAvailability}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 16px' }}>PO Number</th>
                <th style={{ padding: '10px 16px' }}>PO Date</th>
                <th style={{ padding: '10px 16px' }}>Vendor</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Spend (INR)</th>
                <th style={{ padding: '10px 16px' }}>Raw Payment Terms</th>
                <th style={{ padding: '10px 16px' }}>Coverage Status</th>
                <th style={{ padding: '10px 16px' }}>Gap Classification</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.recordId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{t.poNumber}</td>
                  <td style={{ padding: '10px 16px', color: '#475569' }}>{t.poDate}</td>
                  <td style={{ padding: '10px 16px', color: '#0f172a' }}>{t.vendorName}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    ₹{t.spendInr.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 16px', color: t.rawPaymentTerms ? '#047857' : '#94a3b8' }}>
                    {t.rawPaymentTerms || 'MISSING IN ERP'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: t.coverageStatus === 'COMPLETE' ? '#dcfce7' : t.coverageStatus === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                        color: t.coverageStatus === 'COMPLETE' ? '#166534' : t.coverageStatus === 'PARTIAL' ? '#92400e' : '#991b1b'
                      }}
                    >
                      {t.coverageStatus}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '11px' }}>
                    {t.gapReason || 'None (Verified)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
