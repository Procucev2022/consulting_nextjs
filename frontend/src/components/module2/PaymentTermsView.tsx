'use client';
import { apiFetch } from '../../utils/apiFetch';

import React, { useState, useEffect, useCallback } from 'react';
import type { PaymentTermsResult } from '../../types/module2PaymentTerms';
import { PAYMENT_TERMS_UI_STRINGS } from '../../constants/module2PaymentTerms';
import { PaymentTermsCoverageTab } from './PaymentTermsCoverageTab';
import { PaymentTermsOpportunitiesTab } from './PaymentTermsOpportunitiesTab';
import { PaymentTermsSupplierTab } from './PaymentTermsSupplierTab';
import { PaymentTermsKpiHeader } from './PaymentTermsKpiHeader';
import { useLatestRequestSequence } from '../../utils/useLatestRequestSequence';

interface PaymentTermsViewProps {
  assessmentId: string;
  onBackToOverview?: () => void;
}

export const PaymentTermsView: React.FC<PaymentTermsViewProps> = ({
  assessmentId,
  onBackToOverview
}) => {
  const [data, setData] = useState<PaymentTermsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coverage' | 'opportunities' | 'suppliers'>('coverage');
  const { beginRequest, isCurrentRequest, invalidateRequests } = useLatestRequestSequence();

  const fetchData = useCallback(async () => {
    const requestId = beginRequest();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiFetch(`/api/module2/sourcing/payment-terms?assessmentId=${encodeURIComponent(assessmentId)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch Lever 5 Payment Terms analysis (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (!isCurrentRequest(requestId)) return;
      if (!json.success || !json.data) {
        throw new Error(json.message || 'Invalid API response payload');
      }
      setData(json.data);
    } catch (err: unknown) {
      if (!isCurrentRequest(requestId)) return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      if (isCurrentRequest(requestId)) setLoading(false);
    }
  }, [assessmentId, beginRequest, isCurrentRequest]);

  useEffect(() => {
    void fetchData();
    return invalidateRequests;
  }, [fetchData, invalidateRequests]);

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>Analyzing supplier payment terms and credit cycles...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '14px' }}>Unable to load Payment Terms analysis</div>
        <p style={{ margin: '8px 0', fontSize: '13px', color: '#b91c1c' }}>{error || 'No data returned.'}</p>
        <button
          type="button"
          onClick={fetchData}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0 0 6px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← Back to Levers Overview
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {PAYMENT_TERMS_UI_STRINGS.TITLE}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {PAYMENT_TERMS_UI_STRINGS.SUBTITLE}
          </p>
        </div>

        {/* Declarative Virtual DOM Excel Download */}
        <a
          href={`/api/module2/sourcing/payment-terms/export-excel?assessmentId=${assessmentId}`}
          download={`Payment_Terms_${assessmentId}.xlsx`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#047857',
            color: '#ffffff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          📊 {PAYMENT_TERMS_UI_STRINGS.EXPORT_BUTTON}
        </a>
      </div>

      {/* Payment Terms KPI Cards, Explicit Disclosure & Planning Scenario */}
      <PaymentTermsKpiHeader coverageSummary={data.coverageSummary} />

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
        {(
          [
            { id: 'coverage', label: PAYMENT_TERMS_UI_STRINGS.TAB_COVERAGE },
            { id: 'opportunities', label: PAYMENT_TERMS_UI_STRINGS.TAB_OPPORTUNITIES },
            { id: 'suppliers', label: PAYMENT_TERMS_UI_STRINGS.TAB_SUPPLIERS }
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            data-testid={`payment-terms-tab-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #2563eb' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === t.id ? '#2563eb' : '#64748b',
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'coverage' && <PaymentTermsCoverageTab coverageSummary={data.coverageSummary} />}
      {activeTab === 'opportunities' && (
        <PaymentTermsOpportunitiesTab
          opportunities={data.opportunities}
          coverageSummary={data.coverageSummary}
        />
      )}
      {activeTab === 'suppliers' && (
        <PaymentTermsSupplierTab
          supplierProfiles={data.supplierProfiles}
          coverageRecords={data.coverageRecords}
        />
      )}
    </div>
  );
};
