/**
 * Module 2 — Lever 4: Volume Aggregation Purchase Transactions Tab
 * Compliant with Rule 7, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import React, { useState, useMemo } from 'react';
import type { VolumeAggregationTransactionItem } from '../../types/module2VolumeAggregation';

interface VolumeAggregationTransactionTabProps {
  transactions: VolumeAggregationTransactionItem[];
}

export const VolumeAggregationTransactionTab: React.FC<VolumeAggregationTransactionTabProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        t.po_number?.toLowerCase().includes(term) ||
        t.vendor_name?.toLowerCase().includes(term) ||
        t.material_code?.toLowerCase().includes(term) ||
        t.material_desc?.toLowerCase().includes(term) ||
        t.plant?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const pageItems = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
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
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredTransactions.length)} of{' '}
          {filteredTransactions.length.toLocaleString()} transactions
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search PO, vendor, material, plant..."
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              width: '280px'
            }}
          />
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px'
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', color: '#475569' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '13px'
            }}
          >
            Next
          </button>
        </div>
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
              <th style={{ padding: '12px 16px' }}>PO Number</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Plant</th>
              <th style={{ padding: '12px 16px' }}>Supplier</th>
              <th style={{ padding: '12px 16px' }}>Material</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Quantity</th>
              <th style={{ padding: '12px 16px' }}>UOM</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Unit Price (₹)</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Line Spend (₹)</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t, idx) => (
              <tr key={t.id || `${t.po_number}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                  {t.po_number || 'N/A'}-{t.po_line || '1'}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.po_date || 'N/A'}</td>
                <td style={{ padding: '12px 16px', color: '#334155' }}>{t.plant || 'N/A'}</td>
                <td style={{ padding: '12px 16px', color: '#334155', maxWidth: '200px' }}>{t.vendor_name}</td>
                <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '220px' }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{t.material_code || 'UNCODED'}</div>
                  <div style={{ fontSize: '12px' }}>{t.material_desc}</div>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  {t.quantity.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.uom}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#475569' }}>
                  ₹{t.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  ₹{t.total_spend_inr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
